"use server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireEditor } from "@/lib/auth";
import { companyForUser, roomForUser, str, optStr, optNum, bool } from "@/lib/access";
import { createInvite, createRoomForCompany, ROOM_MODULES, type RoomModules } from "@/lib/rooms";
import { sanitizeInputs } from "@/lib/calculator";
import { audit, logActivity } from "@/lib/audit";
import { advanceStage } from "@/lib/pipeline";
import { saveFile, deleteFile } from "@/lib/storage";

const tabPath = (companyId: string) => `/companies/${companyId}`;

export async function createRoomAction(companyId: string, form: FormData) {
  const user = await requireEditor();
  const company = await companyForUser(companyId, user);
  const lang = str(form, "language") === "en" ? "en" : "de";
  const room = await createRoomForCompany(company, user, lang);
  // Bereits geprüfte, nicht verworfene Hypothesen standardmäßig nicht automatisch veröffentlichen – Freigabe erfolgt manuell.
  await logActivity({ tenantId: user.tenantId, companyId, userId: user.id, type: "ROOM", title: "Kundenwelt erstellt" });
  await audit({ tenantId: user.tenantId, actorType: "USER", actorId: user.id, action: "room.create", entity: "Room", entityId: room.id });
  await advanceStage(companyId, "ROOM_READY", user.id);
  revalidatePath(tabPath(companyId));
}

const hex = z.string().regex(/^#[0-9a-fA-F]{6}$/);

export async function updateRoomAction(roomId: string, form: FormData) {
  const user = await requireEditor();
  const room = await roomForUser(roomId, user);
  const modules = Object.fromEntries(ROOM_MODULES.map((m) => [m.key, bool(form, `module_${m.key}`)])) as RoomModules;
  const scenarios = str(form, "scenarios").split(/[;\s]+/).map((s) => Number(s.replace(",", "."))).filter((n) => Number.isFinite(n) && n > 0);
  const calculator = sanitizeInputs({
    revenueEur: optNum(form, "calc_revenue") ?? 0,
    revenueIsVerified: bool(form, "calc_verified"),
    scenarios: scenarios.length ? scenarios : undefined,
    marginPct: optNum(form, "calc_margin") ?? undefined,
    processSavingsEur: optNum(form, "calc_savings") ?? 0,
    hoursSavedPerMonth: optNum(form, "calc_hours") ?? 0,
    hourlyCostEur: optNum(form, "calc_hourly") ?? undefined,
    oneTimeCostEur: optNum(form, "calc_onetime") ?? 0,
    runningCostPerYearEur: optNum(form, "calc_running") ?? 0,
  });
  const logo = optStr(form, "logoUrl");
  if (logo && !/^https:\/\/[^\s"'<>]+$/.test(logo)) throw new Error("Logo-URL muss mit https:// beginnen.");
  const consultantId = optStr(form, "consultantId");
  if (consultantId) await db.user.findFirstOrThrow({ where: { id: consultantId, tenantId: user.tenantId } });
  await db.room.update({
    where: { id: room.id },
    data: {
      displayName: str(form, "displayName").slice(0, 200) || room.displayName,
      greeting: str(form, "greeting").slice(0, 300) || room.greeting,
      intro: str(form, "intro").slice(0, 3000),
      approachText: str(form, "approachText").slice(0, 3000),
      logoUrl: logo,
      primaryColor: hex.safeParse(str(form, "primaryColor")).success ? str(form, "primaryColor") : room.primaryColor,
      accentColor: hex.safeParse(str(form, "accentColor")).success ? str(form, "accentColor") : room.accentColor,
      language: str(form, "language") === "en" ? "en" : "de",
      modules,
      calculator,
      requireEmailVerification: bool(form, "requireEmailVerification"),
      consultantId: consultantId ?? room.consultantId,
    },
  });
  await audit({ tenantId: user.tenantId, actorType: "USER", actorId: user.id, action: "room.update", entity: "Room", entityId: room.id });
  revalidatePath(tabPath(room.companyId));
}

export async function setRoomStatusAction(roomId: string, status: "DRAFT" | "PUBLISHED" | "ARCHIVED") {
  const user = await requireEditor();
  const room = await roomForUser(roomId, user);
  await db.room.update({ where: { id: room.id }, data: { status, publishedAt: status === "PUBLISHED" ? room.publishedAt ?? new Date() : room.publishedAt } });
  await logActivity({ tenantId: user.tenantId, companyId: room.companyId, userId: user.id, type: "ROOM", title: status === "PUBLISHED" ? "Kundenwelt veröffentlicht" : status === "ARCHIVED" ? "Kundenwelt archiviert" : "Kundenwelt zurückgezogen (Entwurf)" });
  await audit({ tenantId: user.tenantId, actorType: "USER", actorId: user.id, action: `room.status.${status}`, entity: "Room", entityId: room.id });
  revalidatePath(tabPath(room.companyId));
  revalidatePath("/rooms");
}

export async function toggleHypothesisVisibilityAction(hypothesisId: string, visible: boolean) {
  const user = await requireEditor();
  const h = await db.improvementHypothesis.findFirst({ where: { id: hypothesisId, company: { tenantId: user.tenantId } } });
  if (!h) throw new Error("Nicht gefunden");
  if (visible && (!h.reviewed || h.status === "REJECTED")) throw new Error("Nur geprüfte, nicht verworfene Hypothesen dürfen in der Kundenwelt erscheinen.");
  await db.improvementHypothesis.update({ where: { id: h.id }, data: { visibleInRoom: visible } });
  revalidatePath(tabPath(h.companyId));
}

export type InviteResult = { url?: string; error?: string; label?: string };

export async function createInviteAction(roomId: string, _prev: InviteResult, form: FormData): Promise<InviteResult> {
  const user = await requireEditor();
  const room = await roomForUser(roomId, user);
  const contactId = optStr(form, "contactId");
  if (contactId) {
    const c = await db.contact.findFirst({ where: { id: contactId, companyId: room.companyId } });
    if (!c) return { error: "Ansprechpartner gehört nicht zu diesem Unternehmen." };
  }
  const email = optStr(form, "email");
  if (email && !z.string().email().safeParse(email).success) return { error: "Ungültige E-Mail-Adresse." };
  const days = Math.min(365, Math.max(1, Math.round(optNum(form, "days") ?? 30)));
  const maxUsesRaw = optNum(form, "maxUses");
  const label = optStr(form, "label") ?? undefined;
  const { invite, url } = await createInvite(room.id, { contactId, email, days, maxUses: maxUsesRaw ? Math.round(maxUsesRaw) : null, label });
  await audit({ tenantId: user.tenantId, actorType: "USER", actorId: user.id, action: "room.invite.create", entity: "RoomInvite", entityId: invite.id, meta: { days, contactId, emailRequired: Boolean(email) } });
  if (room.status !== "PUBLISHED") return { url, label, error: "Hinweis: Die Kundenwelt ist noch nicht veröffentlicht – der Link funktioniert erst nach Veröffentlichung." };
  revalidatePath(tabPath(room.companyId));
  return { url, label };
}

export async function revokeInviteAction(inviteId: string) {
  const user = await requireEditor();
  const inv = await db.roomInvite.findFirst({ where: { id: inviteId, room: { tenantId: user.tenantId } }, include: { room: true } });
  if (!inv) throw new Error("Nicht gefunden");
  await db.roomInvite.update({ where: { id: inv.id }, data: { revokedAt: new Date() } });
  await db.roomSession.updateMany({ where: { inviteId: inv.id, endedAt: null }, data: { endedAt: new Date() } });
  await audit({ tenantId: user.tenantId, actorType: "USER", actorId: user.id, action: "room.invite.revoke", entity: "RoomInvite", entityId: inv.id });
  revalidatePath(tabPath(inv.room.companyId));
}

const ALLOWED_MIME: Record<string, string> = {
  "application/pdf": "pdf",
  "image/png": "png",
  "image/jpeg": "jpg",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "docx",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": "xlsx",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation": "pptx",
};
const MAX_BYTES = 15 * 1024 * 1024;

export async function uploadDocumentAction(roomId: string, form: FormData) {
  const user = await requireEditor();
  const room = await roomForUser(roomId, user);
  const file = form.get("file");
  if (!(file instanceof File) || file.size === 0) throw new Error("Bitte eine Datei auswählen.");
  if (file.size > MAX_BYTES) throw new Error("Datei ist größer als 15 MB.");
  if (!ALLOWED_MIME[file.type]) throw new Error("Dateityp nicht erlaubt (PDF, PNG, JPG, DOCX, XLSX, PPTX).");
  const key = await saveFile(new Uint8Array(await file.arrayBuffer()));
  const name = file.name.replace(/[^\p{L}\p{N} ._()-]/gu, "_").slice(0, 150) || `dokument.${ALLOWED_MIME[file.type]}`;
  const doc = await db.document.create({ data: { roomId: room.id, name, mimeType: file.type, size: file.size, storageKey: key, visibility: str(form, "visibility") === "ROOM" ? "ROOM" : "INTERNAL", uploadedById: user.id } });
  await audit({ tenantId: user.tenantId, actorType: "USER", actorId: user.id, action: "document.upload", entity: "Document", entityId: doc.id });
  revalidatePath(tabPath(room.companyId));
}

export async function setDocumentVisibilityAction(docId: string, visibility: "INTERNAL" | "ROOM") {
  const user = await requireEditor();
  const doc = await db.document.findFirst({ where: { id: docId, room: { tenantId: user.tenantId } }, include: { room: true } });
  if (!doc) throw new Error("Nicht gefunden");
  await db.document.update({ where: { id: doc.id }, data: { visibility } });
  await audit({ tenantId: user.tenantId, actorType: "USER", actorId: user.id, action: `document.visibility.${visibility}`, entity: "Document", entityId: doc.id });
  revalidatePath(tabPath(doc.room.companyId));
}

export async function deleteDocumentAction(docId: string) {
  const user = await requireEditor();
  const doc = await db.document.findFirst({ where: { id: docId, room: { tenantId: user.tenantId } }, include: { room: true } });
  if (!doc) throw new Error("Nicht gefunden");
  await db.document.delete({ where: { id: doc.id } });
  await deleteFile(doc.storageKey);
  await audit({ tenantId: user.tenantId, actorType: "USER", actorId: user.id, action: "document.delete", entity: "Document", entityId: doc.id });
  revalidatePath(tabPath(doc.room.companyId));
}

export async function replyRoomMessageAction(roomId: string, form: FormData) {
  const user = await requireEditor();
  const room = await roomForUser(roomId, user);
  const body = str(form, "body").slice(0, 4000);
  if (!body) return;
  const offerId = optStr(form, "offerId");
  await db.roomMessage.create({ data: { roomId: room.id, offerId, fromVisitor: false, authorName: user.name, body } });
  await db.roomMessage.updateMany({ where: { roomId: room.id, fromVisitor: true, readAt: null }, data: { readAt: new Date() } });
  await logActivity({ tenantId: user.tenantId, companyId: room.companyId, userId: user.id, type: "ROOM_MESSAGE", title: "Antwort in der Kundenwelt", body });
  revalidatePath(tabPath(room.companyId));
}
