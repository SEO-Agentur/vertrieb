"use server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireEditor } from "@/lib/auth";
import { companyForUser, str, optStr, optNum } from "@/lib/access";
import { buildLinkedinMessage } from "@/lib/outreach";
import { createInvite } from "@/lib/rooms";
import { aiStatus, generateStructured } from "@/lib/ai/provider";
import { audit, logActivity } from "@/lib/audit";
import { advanceStage } from "@/lib/pipeline";
import { rescoreCompany } from "@/lib/company-score";

const paths = (companyId: string) => {
  revalidatePath(`/companies/${companyId}`);
  revalidatePath("/outreach");
};

async function messageForUser(id: string, tenantId: string) {
  const m = await db.outreachMessage.findFirst({ where: { id, tenantId }, include: { contact: true } });
  if (!m) throw new Error("Nachricht nicht gefunden");
  return m;
}

export async function generateMessageAction(companyId: string, form: FormData) {
  const user = await requireEditor();
  const company = await companyForUser(companyId, user);
  const contactId = str(form, "contactId");
  const contact = await db.contact.findFirst({ where: { id: contactId, companyId } });
  if (!contact) throw new Error("Bitte einen Ansprechpartner wählen.");
  const kind = (["INITIAL", "FOLLOW_UP", "CONNECT"].includes(str(form, "kind")) ? str(form, "kind") : "INITIAL") as "INITIAL" | "FOLLOW_UP" | "CONNECT";
  const hyps = await db.improvementHypothesis.findMany({ where: { companyId, reviewed: true, status: { not: "REJECTED" } }, orderBy: [{ visibleInRoom: "desc" }, { order: "asc" }] });

  let inviteUrl: string | null = null;
  if (form.get("withInvite") === "on" && kind !== "CONNECT") {
    const room = await db.room.findUnique({ where: { companyId } });
    if (!room) throw new Error("Für einen Einladungslink muss zuerst eine Kundenwelt erstellt werden.");
    const days = Math.round(optNum(form, "days") ?? 30);
    const inv = await createInvite(room.id, { contactId: contact.id, label: `LinkedIn ${kind === "FOLLOW_UP" ? "Follow-up" : "Erstansprache"}`, days });
    inviteUrl = inv.url;
    await audit({ tenantId: user.tenantId, actorType: "USER", actorId: user.id, action: "room.invite.create", entity: "RoomInvite", entityId: inv.invite.id, meta: { via: "outreach" } });
  }
  const body = buildLinkedinMessage({ company, contact, consultant: user, topics: hyps.map((h) => h.topic), inviteUrl, kind });
  const isFirst = (await db.outreachMessage.count({ where: { companyId } })) === 0;
  await db.outreachMessage.create({
    data: { tenantId: user.tenantId, companyId, contactId: contact.id, channel: kind === "CONNECT" ? "LINKEDIN" : "LINKEDIN", kind: kind === "FOLLOW_UP" ? "FOLLOW_UP" : "INITIAL", body, origin: "TEMPLATE", inviteUrlIncluded: Boolean(inviteUrl) },
  });
  if (contact.outreachStatus === "NONE") await db.contact.update({ where: { id: contact.id }, data: { outreachStatus: "PREPARED" } });
  if (isFirst) await advanceStage(companyId, "OUTREACH_READY", user.id);
  paths(companyId);
}

export async function updateMessageAction(id: string, form: FormData) {
  const user = await requireEditor();
  const m = await messageForUser(id, user.tenantId);
  if (m.status === "SENT" || m.status === "REPLIED") throw new Error("Versendete Nachrichten können nicht mehr bearbeitet werden.");
  const body = str(form, "body").slice(0, 8000);
  // Jede Änderung erfordert eine erneute Freigabe
  await db.outreachMessage.update({ where: { id }, data: { body, status: "DRAFT", approvedAt: null, origin: m.origin === "TEMPLATE" && body !== m.body ? "USER" : m.origin } });
  paths(m.companyId);
}

export async function approveMessageAction(id: string) {
  const user = await requireEditor();
  const m = await messageForUser(id, user.tenantId);
  if (m.status !== "DRAFT") return;
  await db.outreachMessage.update({ where: { id }, data: { status: "APPROVED", approvedAt: new Date() } });
  await audit({ tenantId: user.tenantId, actorType: "USER", actorId: user.id, action: "outreach.approve", entity: "OutreachMessage", entityId: id });
  paths(m.companyId);
}

export async function markSentAction(id: string, form: FormData) {
  const user = await requireEditor();
  const m = await messageForUser(id, user.tenantId);
  if (m.status !== "APPROVED") throw new Error("Nur freigegebene Nachrichten können als gesendet markiert werden.");
  const days = Math.max(1, Math.round(optNum(form, "followUpDays") ?? 5));
  await db.outreachMessage.update({ where: { id }, data: { status: "SENT", sentAt: new Date(), followUpAt: new Date(Date.now() + days * 86400_000) } });
  if (m.contactId) await db.contact.update({ where: { id: m.contactId }, data: { outreachStatus: "SENT" } });
  await logActivity({ tenantId: user.tenantId, companyId: m.companyId, userId: user.id, type: "LINKEDIN", title: `LinkedIn-Nachricht manuell gesendet${m.contact ? ` an ${m.contact.firstName} ${m.contact.lastName}` : ""}`, body: m.body });
  await db.task.create({ data: { tenantId: user.tenantId, companyId: m.companyId, assigneeId: user.id, title: `Follow-up LinkedIn${m.contact ? `: ${m.contact.firstName} ${m.contact.lastName}` : ""}`, dueAt: new Date(Date.now() + days * 86400_000) } });
  await audit({ tenantId: user.tenantId, actorType: "USER", actorId: user.id, action: "outreach.sent", entity: "OutreachMessage", entityId: id });
  await advanceStage(m.companyId, "CONTACTED", user.id);
  paths(m.companyId);
}

export async function markReplyAction(id: string, replied: boolean) {
  const user = await requireEditor();
  const m = await messageForUser(id, user.tenantId);
  if (m.status !== "SENT" && m.status !== "NO_RESPONSE" && m.status !== "REPLIED") throw new Error("Nachricht wurde noch nicht gesendet.");
  await db.outreachMessage.update({ where: { id }, data: { status: replied ? "REPLIED" : "NO_RESPONSE", followUpAt: replied ? null : m.followUpAt } });
  if (m.contactId) await db.contact.update({ where: { id: m.contactId }, data: { outreachStatus: replied ? "REPLIED" : "NO_RESPONSE" } });
  await logActivity({ tenantId: user.tenantId, companyId: m.companyId, userId: user.id, type: "LINKEDIN", title: replied ? "Antwort auf LinkedIn-Nachricht erhalten" : "Keine Reaktion auf LinkedIn-Nachricht" });
  if (replied) await advanceStage(m.companyId, "INTERESTED", user.id);
  await rescoreCompany(m.companyId).catch(() => {});
  paths(m.companyId);
}

export async function deleteMessageAction(id: string) {
  const user = await requireEditor();
  const m = await messageForUser(id, user.tenantId);
  if (m.status === "SENT" || m.status === "REPLIED") throw new Error("Versendete Nachrichten bleiben zur Dokumentation erhalten.");
  await db.outreachMessage.delete({ where: { id } });
  paths(m.companyId);
}

export async function aiRewriteAction(id: string, form: FormData) {
  const user = await requireEditor();
  const m = await messageForUser(id, user.tenantId);
  if (!aiStatus().enabled) throw new Error("KI ist nicht aktiviert.");
  if (m.status === "SENT" || m.status === "REPLIED") throw new Error("Bereits gesendet.");
  const instruction = optStr(form, "instruction")?.slice(0, 500) ?? "Mache die Nachricht persönlicher und prägnanter.";
  const company = await db.company.findUniqueOrThrow({ where: { id: m.companyId } });
  const result = await generateStructured({
    task: `Überarbeite die folgende LinkedIn-Nachricht eines Beraters. Wunsch des Beraters: ${instruction}\nRegeln: Keine erfundenen Fakten über das Unternehmen, keine Behauptung, dessen Probleme zu kennen, keine Renditeversprechen. Einladungslinks unverändert übernehmen. Maximal 1200 Zeichen.`,
    untrustedData: { nachricht: m.body, unternehmen: { name: company.name, branche: company.industry }, ansprechpartner: m.contact ? { vorname: m.contact.firstName, nachname: m.contact.lastName, position: m.contact.title } : null },
    schema: z.object({ message: z.string() }),
    effort: "low",
  });
  // Einladungslink darf durch die KI nicht verändert werden
  const link = m.body.match(/https?:\/\/\S+\/i\/[A-Za-z0-9_-]+/)?.[0];
  let body = result.message.slice(0, 8000);
  if (link && !body.includes(link)) body += `\n\n${link}`;
  await db.outreachMessage.update({ where: { id }, data: { body, origin: "AI", status: "DRAFT", approvedAt: null } });
  await audit({ tenantId: user.tenantId, actorType: "USER", actorId: user.id, action: "outreach.ai_rewrite", entity: "OutreachMessage", entityId: id });
  paths(m.companyId);
}
