"use server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireEditor } from "@/lib/auth";
import { companyForUser, meetingForUser, str, optStr, bool } from "@/lib/access";
import { logActivity, audit } from "@/lib/audit";
import { advanceStage } from "@/lib/pipeline";
import { randomToken } from "@/lib/crypto";
import { generateStructured, aiStatus } from "@/lib/ai/provider";

function refresh(companyId: string, meetingId?: string) {
  revalidatePath("/meetings");
  revalidatePath(`/companies/${companyId}`);
  if (meetingId) revalidatePath(`/meetings/${meetingId}`);
}

function parseLocalDate(v: string): Date {
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) throw new Error("Ungültiges Datum");
  return d;
}

export async function scheduleMeeting(form: FormData) {
  const user = await requireEditor();
  const company = await companyForUser(str(form, "companyId"), user);
  const scheduledAt = parseLocalDate(str(form, "scheduledAt"));
  const room = await db.room.findUnique({ where: { companyId: company.id } });
  const m = await db.meeting.create({
    data: {
      tenantId: user.tenantId, companyId: company.id, roomId: room?.id ?? null, status: "SCHEDULED", kind: "SCHEDULED",
      initiatedBy: "CONSULTANT", scheduledAt, visitorMessage: optStr(form, "note"), videoRoomName: `kw-${randomToken(12)}`,
    },
  });
  await logActivity({ tenantId: user.tenantId, companyId: company.id, userId: user.id, type: "MEETING", title: `Gespräch vereinbart für ${scheduledAt.toLocaleString("de-DE")}` });
  await advanceStage(company.id, "MEETING_SCHEDULED", user.id);
  refresh(company.id, m.id);
}

export async function respondMeeting(form: FormData) {
  const user = await requireEditor();
  const m = await meetingForUser(str(form, "meetingId"), user);
  const decision = str(form, "decision");
  if (decision === "accept") {
    const when = optStr(form, "scheduledAt");
    if (when) {
      await db.meeting.update({ where: { id: m.id }, data: { status: "SCHEDULED", kind: "SCHEDULED", scheduledAt: parseLocalDate(when) } });
      await advanceStage(m.companyId, "MEETING_SCHEDULED", user.id);
    } else {
      await db.meeting.update({ where: { id: m.id }, data: { status: "ACCEPTED" } });
    }
    await logActivity({ tenantId: user.tenantId, companyId: m.companyId, userId: user.id, type: "MEETING", title: when ? "Gesprächsanfrage bestätigt (Termin)" : "Gesprächsanfrage angenommen" });
  } else if (decision === "decline") {
    await db.meeting.update({ where: { id: m.id }, data: { status: "DECLINED" } });
  } else if (decision === "cancel") {
    await db.meeting.update({ where: { id: m.id }, data: { status: "CANCELLED", presenterActive: false } });
  }
  refresh(m.companyId, m.id);
}

export async function addMeetingNote(form: FormData) {
  const user = await requireEditor();
  const m = await meetingForUser(str(form, "meetingId"), user);
  const body = str(form, "body");
  if (!body) return;
  await db.meetingNote.create({ data: { meetingId: m.id, area: optStr(form, "area"), body: body.slice(0, 10000) } });
  refresh(m.companyId, m.id);
}

export async function deleteMeetingNote(form: FormData) {
  const user = await requireEditor();
  const note = await db.meetingNote.findFirstOrThrow({ where: { id: str(form, "id"), meeting: { tenantId: user.tenantId } }, include: { meeting: true } });
  await db.meetingNote.delete({ where: { id: note.id } });
  refresh(note.meeting.companyId, note.meetingId);
}

export async function setMeetingConsent(form: FormData) {
  const user = await requireEditor();
  const m = await meetingForUser(str(form, "meetingId"), user);
  const data = { recordingConsent: bool(form, "recordingConsent"), transcriptionConsent: bool(form, "transcriptionConsent") };
  await db.meeting.update({ where: { id: m.id }, data });
  await audit({ tenantId: user.tenantId, actorType: "USER", actorId: user.id, action: "meeting.consent", entity: "Meeting", entityId: m.id, meta: data });
  refresh(m.companyId, m.id);
}

export async function endMeeting(form: FormData) {
  const user = await requireEditor();
  const m = await meetingForUser(str(form, "meetingId"), user);
  await db.meeting.update({ where: { id: m.id }, data: { status: "ENDED", endedAt: new Date(), presenterActive: false } });
  const findings = await db.finding.count({ where: { meetingId: m.id } });
  await logActivity({ tenantId: user.tenantId, companyId: m.companyId, userId: user.id, type: "MEETING", title: "Gespräch beendet", body: `${findings} Erkenntnis(se) dokumentiert` });
  await advanceStage(m.companyId, "ANALYSIS_DONE", user.id);
  refresh(m.companyId, m.id);
}

const AiAssistSchema = z.object({
  suggestedQuestions: z.array(z.string()),
  structuredInsights: z.array(z.object({ area: z.string(), title: z.string(), description: z.string(), isConfirmedByClient: z.boolean() })),
  possibleCauses: z.array(z.string()),
  solutionIdeas: z.array(z.string()),
  assumptions: z.array(z.string()),
  openQuestions: z.array(z.string()),
  nextSteps: z.array(z.string()),
});
export type AiAssistResult = z.infer<typeof AiAssistSchema>;

export async function runAiAssist(_prev: { result?: AiAssistResult; error?: string } | null, form: FormData): Promise<{ result?: AiAssistResult; error?: string }> {
  const user = await requireEditor();
  const m = await meetingForUser(str(form, "meetingId"), user);
  if (!aiStatus().enabled) return { error: aiStatus().reason };
  const [company, notes, findings, categories, solutions] = await Promise.all([
    db.company.findUniqueOrThrow({ where: { id: m.companyId } }),
    db.meetingNote.findMany({ where: { meetingId: m.id }, orderBy: { createdAt: "asc" } }),
    db.finding.findMany({ where: { companyId: m.companyId } }),
    db.problemCategory.findMany({ where: { tenantId: user.tenantId }, orderBy: { order: "asc" } }),
    db.solution.findMany({ where: { tenantId: user.tenantId, active: true }, select: { name: true, description: true } }),
  ]);
  try {
    const result = await generateStructured({
      task:
        "Unterstütze den Berater während einer gemeinsamen Vertriebs-Potenzialanalyse. Strukturiere die Gesprächsnotizen. " +
        "Setze isConfirmedByClient nur auf true, wenn die Notizen eindeutig zeigen, dass der Kunde den Punkt selbst bestätigt hat. " +
        `Verwende als area einen dieser Schlüssel: ${categories.map((c) => c.key).join(", ")}, ALLGEMEIN. ` +
        "Schlage Lösungsideen bevorzugt aus dem Lösungskatalog vor. Keine Renditeversprechen.",
      untrustedData: {
        unternehmen: { name: company.name, branche: company.industry, umsatzEur: company.revenueEur, umsatzStatus: company.revenueStatus },
        gespraechsnotizen: notes.map((n) => ({ bereich: n.area, text: n.body })),
        bisherigeErkenntnisse: findings.map((f) => ({ bereich: f.area, titel: f.title, status: f.status })),
        leitfragen: categories.map((c) => ({ bereich: c.key, fragen: c.questions })),
        loesungskatalog: solutions,
      },
      schema: AiAssistSchema,
      effort: "medium",
    });
    await audit({ tenantId: user.tenantId, actorType: "USER", actorId: user.id, action: "ai.meeting_assist", entity: "Meeting", entityId: m.id });
    return { result };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "KI-Anfrage fehlgeschlagen" };
  }
}
