"use server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireEditor, requireAdmin } from "@/lib/auth";
import { audit, logActivity } from "@/lib/audit";
import { randomToken } from "@/lib/crypto";
import { advanceStage, setStage } from "@/lib/pipeline";
import { rescoreCompany } from "@/lib/company-score";
import { generateStructured, aiStatus } from "@/lib/ai/provider";
import { loadCallScript, CALL_SCRIPT_KEY as SCRIPT_KEY } from "@/lib/call-script-store";
import {
  CallScriptSchema, OUTCOMES, OUTCOME_LABEL, REJECTION_REASONS, ruleAssist,
  type AssistResult, type RejectionReason,
} from "@/lib/call-script";

export type SaveScriptState = { ok?: boolean; error?: string };

export async function saveCallScriptAction(_prev: SaveScriptState, form: FormData): Promise<SaveScriptState> {
  const user = await requireAdmin();
  if (form.get("reset") === "1") {
    await db.setting.deleteMany({ where: { tenantId: user.tenantId, key: SCRIPT_KEY } });
    revalidatePath("/settings");
    return { ok: true };
  }
  let json: unknown;
  try {
    json = JSON.parse(String(form.get("script") ?? ""));
  } catch {
    return { error: "Kein gültiges JSON." };
  }
  const parsed = CallScriptSchema.safeParse(json);
  if (!parsed.success) return { error: parsed.error.issues.map((i) => i.message).join(" · ") };
  await db.setting.upsert({
    where: { tenantId_key: { tenantId: user.tenantId, key: SCRIPT_KEY } },
    update: { value: parsed.data as object },
    create: { tenantId: user.tenantId, key: SCRIPT_KEY, value: parsed.data as object },
  });
  await audit({ tenantId: user.tenantId, actorType: "USER", actorId: user.id, action: "settings.callScript" });
  revalidatePath("/settings");
  return { ok: true };
}

const reasonKeys = Object.keys(REJECTION_REASONS) as [RejectionReason, ...RejectionReason[]];

const AiAssistSchema = z.object({
  matchedAnswerId: z.string().nullable().describe("ID der passenden Antwortoption des aktuellen Schritts oder null"),
  interpretation: z.string().describe("Kurze Einordnung, was der Gesprächspartner gemeint hat (1 Satz)"),
  suggestedReply: z.string().describe("Was der Berater jetzt sagen kann: 1–3 Sätze, natürlich, ehrlich, ohne Druck und ohne Versprechen"),
  nextNodeId: z.string().nullable().describe("ID des passenden nächsten Leitfaden-Schritts oder null, wenn das Gespräch endet"),
  outcome: z.enum(OUTCOMES).nullable().describe("Gesprächsergebnis, falls das Gespräch damit endet, sonst null"),
  reason: z.enum(reasonKeys).nullable().describe("Absagegrund, nur wenn outcome = REJECTED"),
});

/**
 * Wertet eine eingetippte Antwort des Gesprächspartners aus. Es wird kein Gespräch aufgezeichnet –
 * verarbeitet wird ausschließlich die Eingabe des Beraters.
 */
export async function assistAction(contactId: string, nodeId: string, input: string, history: { step: string; answer: string }[]): Promise<AssistResult> {
  const user = await requireEditor();
  const contact = await db.contact.findFirst({ where: { id: contactId, tenantId: user.tenantId }, include: { company: true } });
  if (!contact) throw new Error("Kontakt nicht gefunden");
  const text = input.trim().slice(0, 1000);
  const script = await loadCallScript(user.tenantId);
  if (!text) return ruleAssist(script, nodeId, "");
  const status = aiStatus();
  if (!status.enabled) return { ...ruleAssist(script, nodeId, text), aiDisabledReason: status.reason };
  const node = script.nodes.find((n) => n.id === nodeId);
  try {
    const r = await generateStructured({
      task: "Du unterstützt einen Berater live in einem B2B-Telefonat. Ordne die Antwort des Gesprächspartners ein und schlage vor, was der Berater als Nächstes sagen kann. Wähle IDs ausschließlich aus den angegebenen Listen. Keine Versprechen zu Ergebnissen, kein Druck, ehrlich bleiben: Der Berater verkauft zuerst eine gemeinsame Potenzialanalyse, kein fertiges Produkt.",
      untrustedData: {
        antwortDesGespraechspartners: text,
        aktuellerSchritt: node ? { id: node.id, titel: node.title, gesagt: node.say, antwortoptionen: node.answers.map((a) => ({ id: a.id, label: a.label })) } : null,
        moeglicheNaechsteSchritte: script.nodes.map((n) => ({ id: n.id, titel: n.title, phase: n.phase })),
        bisherigerVerlauf: history.slice(-10),
        unternehmen: { name: contact.company.name, branche: contact.company.industry },
        gespraechspartnerRolle: contact.title,
      },
      schema: AiAssistSchema,
      effort: "low",
      maxTokens: 4000,
    });
    const validNext = r.nextNodeId && script.nodes.some((n) => n.id === r.nextNodeId) ? r.nextNodeId : null;
    const validMatch = r.matchedAnswerId && node?.answers.some((a) => a.id === r.matchedAnswerId) ? r.matchedAnswerId : null;
    return { mode: "AI", matchedAnswerId: validMatch, interpretation: r.interpretation, suggestedReply: r.suggestedReply, nextNodeId: validNext, outcome: r.outcome, reason: r.outcome === "REJECTED" ? r.reason ?? "OTHER" : null };
  } catch (e) {
    return { ...ruleAssist(script, nodeId, text), aiDisabledReason: `KI-Fehler: ${e instanceof Error ? e.message : String(e)}` };
  }
}

const SaveSchema = z.object({
  outcome: z.enum(OUTCOMES),
  reason: z.enum(reasonKeys).nullable().optional(),
  notes: z.string().max(5000).default(""),
  path: z.array(z.object({ step: z.string().max(200), answer: z.string().max(1000) })).max(100).default([]),
  followUpAt: z.string().nullable().optional(),
  appointmentAt: z.string().nullable().optional(),
  markCompanyLost: z.boolean().default(false),
});

export async function saveCallAction(contactId: string, payload: unknown): Promise<{ ok: true; meetingId?: string } | { ok: false; error: string }> {
  const user = await requireEditor();
  const parsed = SaveSchema.safeParse(payload);
  if (!parsed.success) return { ok: false, error: parsed.error.issues.map((i) => i.message).join(" · ") };
  const p = parsed.data;
  const contact = await db.contact.findFirst({ where: { id: contactId, tenantId: user.tenantId }, include: { company: { include: { room: true } } } });
  if (!contact) return { ok: false, error: "Kontakt nicht gefunden" };
  if (p.outcome === "REJECTED" && !p.reason) return { ok: false, error: "Bitte einen Absagegrund wählen." };
  if (p.outcome === "APPOINTMENT" && !p.appointmentAt) return { ok: false, error: "Bitte Datum und Uhrzeit des Termins angeben." };
  if (p.outcome === "FOLLOW_UP" && !p.followUpAt) return { ok: false, error: "Bitte ein Datum für die Wiedervorlage angeben." };

  const name = `${contact.firstName} ${contact.lastName}`;
  const companyId = contact.companyId;
  const title = `Telefonat ${name}: ${OUTCOME_LABEL[p.outcome]}${p.reason ? ` – ${REJECTION_REASONS[p.reason]}` : ""}`;
  const pathText = p.path.map((s, i) => `${i + 1}. ${s.step} → ${s.answer}`).join("\n");
  await logActivity({
    tenantId: user.tenantId, companyId, userId: user.id, type: "CALL", title,
    body: [p.notes.trim(), pathText ? `Gesprächsverlauf:\n${pathText}` : ""].filter(Boolean).join("\n\n"),
    meta: { contactId, outcome: p.outcome, reason: p.reason ?? null, steps: p.path.length },
  });

  const status: Record<string, string> = { APPOINTMENT: "REPLIED", FOLLOW_UP: "REPLIED", REJECTED: "REJECTED", NOT_REACHED: "NO_RESPONSE", WRONG_NUMBER: "WRONG_CONTACT", WRONG_PERSON: "WRONG_CONTACT" };
  await db.contact.update({ where: { id: contactId }, data: { outreachStatus: status[p.outcome] } });

  // Offene Rückrufe für diesen Kontakt sind mit dem Anruf erledigt
  await db.task.updateMany({ where: { contactId, kind: "CALLBACK", doneAt: null }, data: { doneAt: new Date() } });

  let meetingId: string | undefined;
  if (p.outcome === "APPOINTMENT") {
    const m = await db.meeting.create({
      data: {
        tenantId: user.tenantId, companyId, roomId: contact.company.room?.id ?? null, status: "SCHEDULED", kind: "SCHEDULED",
        initiatedBy: "CONSULTANT", scheduledAt: new Date(p.appointmentAt!), videoRoomName: `kw-${randomToken(12)}`,
        visitorMessage: `Vereinbart im Telefonat mit ${name}`,
      },
    });
    meetingId = m.id;
    await advanceStage(companyId, "MEETING_SCHEDULED", user.id);
  } else if (p.outcome === "FOLLOW_UP") {
    await db.task.create({ data: { tenantId: user.tenantId, companyId, contactId, kind: "CALLBACK", assigneeId: user.id, title: `Wiedervorlage: ${name} anrufen`, description: p.notes || null, dueAt: new Date(p.followUpAt!) } });
    await advanceStage(companyId, "CONTACTED", user.id);
  } else if (p.outcome === "NOT_REACHED") {
    const due = p.followUpAt ? new Date(p.followUpAt) : new Date(Date.now() + 86400_000);
    await db.task.create({ data: { tenantId: user.tenantId, companyId, contactId, kind: "CALLBACK", assigneeId: user.id, title: `Erneut anrufen: ${name}`, dueAt: due } });
  } else if (p.outcome === "WRONG_PERSON") {
    await db.task.create({ data: { tenantId: user.tenantId, companyId, assigneeId: user.id, title: `Richtigen Ansprechpartner bei ${contact.company.name} anlegen`, description: p.notes || null, dueAt: new Date(Date.now() + 86400_000) } });
  } else if (p.outcome === "REJECTED") {
    if (p.followUpAt) await db.task.create({ data: { tenantId: user.tenantId, companyId, contactId, kind: "CALLBACK", assigneeId: user.id, title: `Erneut versuchen: ${name} (${REJECTION_REASONS[p.reason!]})`, dueAt: new Date(p.followUpAt) } });
    if (p.markCompanyLost) {
      const lost = await db.pipelineStage.findUnique({ where: { tenantId_key: { tenantId: user.tenantId, key: "LOST" } } });
      if (lost) await setStage(companyId, lost.id, user.id);
      await db.company.update({ where: { id: companyId }, data: { lostReason: REJECTION_REASONS[p.reason!] } });
    }
  }
  await rescoreCompany(companyId);
  await audit({ tenantId: user.tenantId, actorType: "USER", actorId: user.id, action: "call.log", entity: "Contact", entityId: contactId, meta: { outcome: p.outcome, reason: p.reason ?? null } });
  revalidatePath("/calls");
  revalidatePath(`/companies/${companyId}`);
  return { ok: true, meetingId };
}
