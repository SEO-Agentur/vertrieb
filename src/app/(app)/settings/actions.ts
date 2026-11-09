"use server";
import { revalidatePath } from "next/cache";
import type { Role } from "@prisma/client";
import { db } from "@/lib/db";
import { requireAdmin, requireUser, hashPassword, verifyPassword } from "@/lib/auth";
import { getSetting, setSetting } from "@/lib/settings";
import { str, optStr, optNum, optInt } from "@/lib/access";
import { audit } from "@/lib/audit";
import { runRetention } from "@/lib/retention";
import { rescoreCompany } from "@/lib/company-score";

const lines = (v: string) => v.split(/\n|,/).map((s) => s.trim()).filter(Boolean);

export async function saveIcpAction(form: FormData) {
  const user = await requireAdmin();
  const cur = await getSetting(user.tenantId, "icp");
  await setSetting(user.tenantId, "icp", {
    ...cur,
    minRevenueEur: (optNum(form, "minRevenueMio") ?? cur.minRevenueEur / 1e6) * 1e6,
    preferredRevenueMinEur: (optNum(form, "prefMinMio") ?? cur.preferredRevenueMinEur / 1e6) * 1e6,
    preferredRevenueMaxEur: (optNum(form, "prefMaxMio") ?? cur.preferredRevenueMaxEur / 1e6) * 1e6,
    country: str(form, "country") || "DE",
    preferredIndustries: lines(str(form, "preferredIndustries")),
    lowPriorityIndustries: lines(str(form, "lowPriorityIndustries")),
    preferredOwnership: lines(str(form, "preferredOwnership")),
    targetRoles: form.getAll("targetRoles").map(String),
  });
  await audit({ tenantId: user.tenantId, actorType: "USER", actorId: user.id, action: "settings.icp" });
  revalidatePath("/settings");
}

export async function saveScoringAction(form: FormData) {
  const user = await requireAdmin();
  const w = (k: string) => Math.max(0, Math.min(100, optInt(form, k) ?? 0));
  await setSetting(user.tenantId, "scoring", {
    weights: { icpFit: w("icpFit"), salesPotential: w("salesPotential"), digitalPotential: w("digitalPotential"), economicPotential: w("economicPotential"), feasibility: w("feasibility"), engagement: w("engagement") },
    thresholds: { qualified: w("qualified"), hot: w("hot") },
  });
  await audit({ tenantId: user.tenantId, actorType: "USER", actorId: user.id, action: "settings.scoring" });
  revalidatePath("/settings");
}

export async function rescoreAllAction() {
  const user = await requireAdmin();
  const companies = await db.company.findMany({ where: { tenantId: user.tenantId }, select: { id: true } });
  for (const c of companies) await rescoreCompany(c.id);
  revalidatePath("/companies");
}

export async function savePrivacyAction(form: FormData) {
  const user = await requireAdmin();
  const cur = await getSetting(user.tenantId, "privacy");
  await setSetting(user.tenantId, "privacy", {
    roomSessionDays: optInt(form, "roomSessionDays") ?? cur.roomSessionDays,
    inviteDefaultDays: optInt(form, "inviteDefaultDays") ?? cur.inviteDefaultDays,
    roomEventRetentionDays: optInt(form, "roomEventRetentionDays") ?? cur.roomEventRetentionDays,
    disqualifiedRetentionDays: optInt(form, "disqualifiedRetentionDays") ?? cur.disqualifiedRetentionDays,
    privacyContactEmail: str(form, "privacyContactEmail"),
    imprintUrl: str(form, "imprintUrl"),
    privacyUrl: str(form, "privacyUrl"),
  });
  revalidatePath("/settings");
}

export async function saveBrandAction(form: FormData) {
  const user = await requireAdmin();
  await setSetting(user.tenantId, "brand", { companyName: str(form, "companyName"), claim: str(form, "claim"), positioning: str(form, "positioning") });
  revalidatePath("/settings");
}

export async function runRetentionAction() {
  const user = await requireAdmin();
  await runRetention(user.tenantId);
  revalidatePath("/settings");
}

export async function saveProfileAction(form: FormData) {
  const user = await requireUser();
  await db.user.update({ where: { id: user.id }, data: { name: str(form, "name"), title: optStr(form, "title"), phone: optStr(form, "phone"), bio: optStr(form, "bio"), avatarUrl: optStr(form, "avatarUrl"), calendarUrl: optStr(form, "calendarUrl"), linkedinUrl: optStr(form, "linkedinUrl") } });
  revalidatePath("/settings");
}

export async function changePasswordAction(form: FormData) {
  const user = await requireUser();
  const next = str(form, "next");
  if (next.length < 10) throw new Error("Neues Passwort: mindestens 10 Zeichen.");
  if (!(await verifyPassword(str(form, "current"), user.passwordHash))) throw new Error("Aktuelles Passwort ist falsch.");
  await db.user.update({ where: { id: user.id }, data: { passwordHash: await hashPassword(next) } });
  await db.userSession.deleteMany({ where: { userId: user.id } });
  await audit({ tenantId: user.tenantId, actorType: "USER", actorId: user.id, action: "auth.password_change" });
}

export async function createUserAction(form: FormData) {
  const admin = await requireAdmin();
  const pw = str(form, "password");
  if (pw.length < 10) throw new Error("Passwort: mindestens 10 Zeichen.");
  const role = (["ADMIN", "CONSULTANT", "VIEWER"].includes(str(form, "role")) ? str(form, "role") : "CONSULTANT") as Role;
  const u = await db.user.create({ data: { tenantId: admin.tenantId, email: str(form, "email").toLowerCase(), name: str(form, "name"), role, passwordHash: await hashPassword(pw) } });
  await audit({ tenantId: admin.tenantId, actorType: "USER", actorId: admin.id, action: "user.create", entity: "User", entityId: u.id });
  revalidatePath("/settings");
}

export async function toggleUserAction(id: string) {
  const admin = await requireAdmin();
  if (id === admin.id) throw new Error("Eigenes Konto kann nicht deaktiviert werden.");
  const u = await db.user.findFirstOrThrow({ where: { id, tenantId: admin.tenantId } });
  await db.user.update({ where: { id }, data: { active: !u.active } });
  if (u.active) await db.userSession.deleteMany({ where: { userId: id } });
  revalidatePath("/settings");
}

export async function saveStageAction(id: string | null, form: FormData) {
  const user = await requireAdmin();
  const data = { name: str(form, "name"), color: str(form, "color") || "#64748b", probability: optInt(form, "probability") ?? 0, order: optInt(form, "order") ?? 0 };
  if (id) await db.pipelineStage.updateMany({ where: { id, tenantId: user.tenantId }, data });
  else await db.pipelineStage.create({ data: { ...data, tenantId: user.tenantId, key: `CUSTOM_${Date.now()}` } });
  revalidatePath("/settings");
  revalidatePath("/pipeline");
}

export async function deleteStageAction(id: string) {
  const user = await requireAdmin();
  const inUse = await db.company.count({ where: { stageId: id } });
  if (inUse) throw new Error(`Phase wird von ${inUse} Unternehmen verwendet.`);
  await db.pipelineStage.deleteMany({ where: { id, tenantId: user.tenantId } });
  revalidatePath("/settings");
}
