"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { InfoStatus, QualificationStatus } from "@prisma/client";
import { db } from "@/lib/db";
import { requireEditor } from "@/lib/auth";
import { companyForUser, failTo, str, optStr, optNum, optInt, bool } from "@/lib/access";
import { audit, logActivity } from "@/lib/audit";
import { extractDomain, normalizeCompanyName, normalizeLinkedinUrl, classifyRole } from "@/lib/normalize";
import { rescoreCompany } from "@/lib/company-score";
import { advanceStage, setStage, ensureStages } from "@/lib/pipeline";
import { runResearch } from "@/lib/research";
import { AiNotEnabledError } from "@/lib/ai/provider";

const INFO = ["VERIFIED", "ESTIMATED", "HYPOTHESIS", "UNKNOWN"] as const;
const infoStatus = (v: string): InfoStatus => (INFO.includes(v as InfoStatus) ? (v as InfoStatus) : "UNKNOWN");
const scale = (n: number | null) => (n == null ? null : Math.max(1, Math.min(5, n)));

/** Mögliche Dubletten anhand normalisiertem Namen, Domain oder LinkedIn-URL. */
export async function findDuplicates(tenantId: string, name: string, website?: string | null, linkedinUrl?: string | null, excludeId?: string) {
  const normalizedName = normalizeCompanyName(name);
  const domain = extractDomain(website);
  const li = normalizeLinkedinUrl(linkedinUrl);
  const OR = [{ normalizedName }, ...(domain ? [{ domain }] : []), ...(li ? [{ linkedinUrl: li }] : [])];
  return db.company.findMany({ where: { tenantId, OR, ...(excludeId ? { id: { not: excludeId } } : {}) }, select: { id: true, name: true } });
}

function companyData(form: FormData) {
  const name = str(form, "name");
  const website = optStr(form, "website");
  const revenueEur = optNum(form, "revenueMio") != null ? optNum(form, "revenueMio")! * 1_000_000 : null;
  return {
    name,
    normalizedName: normalizeCompanyName(name),
    website,
    domain: extractDomain(website),
    linkedinUrl: normalizeLinkedinUrl(optStr(form, "linkedinUrl")),
    industry: optStr(form, "industry"),
    location: optStr(form, "location"),
    country: optStr(form, "country") ?? "DE",
    revenueEur,
    revenueYear: optInt(form, "revenueYear"),
    revenueSource: optStr(form, "revenueSource"),
    revenueStatus: revenueEur == null ? ("UNKNOWN" as InfoStatus) : infoStatus(str(form, "revenueStatus")),
    employees: optInt(form, "employees"),
    employeesStatus: optInt(form, "employees") == null ? ("UNKNOWN" as InfoStatus) : infoStatus(str(form, "employeesStatus") || "ESTIMATED"),
    salesTeamSize: optInt(form, "salesTeamSize"),
    products: optStr(form, "products"),
    markets: optStr(form, "markets"),
    businessModel: optStr(form, "businessModel"),
    ownership: optStr(form, "ownership"),
    technologies: optStr(form, "technologies"),
    description: optStr(form, "description"),
    salesDependency: scale(optInt(form, "salesDependency")),
    digitalSignals: scale(optInt(form, "digitalSignals")),
    regulatoryHurdle: scale(optInt(form, "regulatoryHurdle")),
    procurementEffort: scale(optInt(form, "procurementEffort")),
    salesNavRef: optStr(form, "salesNavRef"),
    notes: optStr(form, "notes"),
  };
}

export async function createCompanyAction(form: FormData) {
  const user = await requireEditor();
  const data = companyData(form);
  if (!data.name) throw new Error("Unternehmensname ist erforderlich.");
  const dups = await findDuplicates(user.tenantId, data.name, data.website, data.linkedinUrl);
  if (dups.length && !bool(form, "ignoreDuplicates")) {
    redirect(`/companies/new?duplicate=${encodeURIComponent(dups.map((d) => d.id).join(","))}&name=${encodeURIComponent(data.name)}`);
  }
  await ensureStages(user.tenantId);
  const found = await db.pipelineStage.findUnique({ where: { tenantId_key: { tenantId: user.tenantId, key: "FOUND" } } });
  const company = await db.company.create({
    data: {
      ...data,
      tenantId: user.tenantId,
      ownerId: user.id,
      stageId: found?.id,
      source: str(form, "source") || "MANUAL",
      qualificationStatus: data.revenueEur == null ? "REVENUE_REVIEW" : "NEW",
    },
  });
  if (data.revenueEur != null && data.revenueSource) {
    await db.companyFact.create({ data: { companyId: company.id, category: "Umsatz", label: `Jahresumsatz ${data.revenueYear ?? ""}`.trim(), value: `${data.revenueEur} €`, status: data.revenueStatus, sourceName: data.revenueSource, retrievedAt: new Date(), origin: "USER", reviewed: true } });
  }
  await logActivity({ tenantId: user.tenantId, companyId: company.id, userId: user.id, type: "SYSTEM", title: "Unternehmen angelegt" });
  await audit({ tenantId: user.tenantId, actorType: "USER", actorId: user.id, action: "company.create", entity: "Company", entityId: company.id });
  await rescoreCompany(company.id);
  redirect(`/companies/${company.id}`);
}

export async function updateCompanyAction(id: string, form: FormData) {
  const user = await requireEditor();
  const before = await companyForUser(id, user);
  const data = companyData(form);
  await db.company.update({ where: { id }, data: { ...data, qualificationStatus: before.qualificationStatus === "REVENUE_REVIEW" && data.revenueEur != null ? "NEW" : before.qualificationStatus } });
  if (data.revenueEur != null && (data.revenueEur !== before.revenueEur || data.revenueStatus !== before.revenueStatus) && data.revenueSource) {
    await db.companyFact.create({ data: { companyId: id, category: "Umsatz", label: `Jahresumsatz ${data.revenueYear ?? ""}`.trim(), value: `${data.revenueEur} €`, status: data.revenueStatus, sourceName: data.revenueSource, retrievedAt: new Date(), origin: "USER", reviewed: true } });
  }
  await audit({ tenantId: user.tenantId, actorType: "USER", actorId: user.id, action: "company.update", entity: "Company", entityId: id });
  await rescoreCompany(id);
  revalidatePath(`/companies/${id}`);
}

export async function deleteCompanyAction(id: string) {
  const user = await requireEditor();
  const c = await companyForUser(id, user);
  await db.company.delete({ where: { id } });
  await audit({ tenantId: user.tenantId, actorType: "USER", actorId: user.id, action: "company.delete", entity: "Company", entityId: id, meta: { name: c.name } });
  redirect("/companies");
}

export async function setQualificationAction(id: string, form: FormData) {
  const user = await requireEditor();
  const c = await companyForUser(id, user);
  const status = str(form, "status") as QualificationStatus;
  if (!["NEW", "IN_PROGRESS", "REVENUE_REVIEW", "QUALIFIED", "DISQUALIFIED"].includes(status)) throw new Error("Ungültiger Status");
  if (status === "QUALIFIED" && c.revenueEur == null) failTo(`/companies/${id}?tab=qualification`, "Ohne Umsatzangabe kann nicht qualifiziert werden – bitte zuerst Umsatz prüfen.");
  await db.company.update({ where: { id }, data: { qualificationStatus: status, qualificationNote: optStr(form, "note") } });
  await logActivity({ tenantId: user.tenantId, companyId: id, userId: user.id, type: "QUALIFICATION", title: `Qualifizierung: ${status}`, body: optStr(form, "note") });
  if (status === "IN_PROGRESS") await advanceStage(id, "QUALIFYING", user.id);
  if (status === "QUALIFIED") await advanceStage(id, "QUALIFIED", user.id);
  if (status === "DISQUALIFIED") {
    const lost = await db.pipelineStage.findUnique({ where: { tenantId_key: { tenantId: user.tenantId, key: "LOST" } } });
    if (lost) await setStage(id, lost.id, user.id);
  }
  await rescoreCompany(id);
  revalidatePath(`/companies/${id}`);
  revalidatePath("/qualification");
}

export async function rescoreAction(id: string) {
  const user = await requireEditor();
  await companyForUser(id, user);
  await rescoreCompany(id);
  revalidatePath(`/companies/${id}`);
}

export async function setStageAction(id: string, form: FormData) {
  const user = await requireEditor();
  await companyForUser(id, user);
  const stageId = str(form, "stageId");
  await setStage(id, stageId, user.id);
  const dealValue = optNum(form, "dealValue");
  await db.company.update({ where: { id }, data: { ...(dealValue != null ? { dealValue } : {}), lostReason: optStr(form, "lostReason") } });
  revalidatePath(`/companies/${id}`);
  revalidatePath("/pipeline");
}

/** Für Kanban (Client-Aufruf) */
export async function moveStage(companyId: string, stageId: string) {
  const user = await requireEditor();
  await companyForUser(companyId, user);
  await setStage(companyId, stageId, user.id);
  revalidatePath("/pipeline");
}

export async function addNoteAction(id: string, form: FormData) {
  const user = await requireEditor();
  await companyForUser(id, user);
  const body = str(form, "body");
  if (!body) return;
  await logActivity({ tenantId: user.tenantId, companyId: id, userId: user.id, type: str(form, "type") || "NOTE", title: str(form, "title") || "Notiz", body });
  revalidatePath(`/companies/${id}`);
}

// ───── Kontakte ─────

export async function saveContactAction(companyId: string, contactId: string | null, form: FormData) {
  const user = await requireEditor();
  await companyForUser(companyId, user);
  const title = optStr(form, "title");
  const data = {
    firstName: str(form, "firstName"),
    lastName: str(form, "lastName"),
    title,
    roleCategory: str(form, "roleCategory") || classifyRole(title),
    email: optStr(form, "email")?.toLowerCase() ?? null,
    phone: optStr(form, "phone"),
    linkedinUrl: normalizeLinkedinUrl(optStr(form, "linkedinUrl")),
    salesNavUrl: optStr(form, "salesNavUrl"),
    isPrimary: bool(form, "isPrimary"),
    notes: optStr(form, "notes"),
  };
  if (!data.firstName && !data.lastName) failTo(`/companies/${companyId}?tab=contacts`, "Name ist erforderlich.");
  if (data.linkedinUrl) {
    const dup = await db.contact.findFirst({ where: { tenantId: user.tenantId, linkedinUrl: data.linkedinUrl, ...(contactId ? { id: { not: contactId } } : {}) } });
    if (dup) failTo(`/companies/${companyId}?tab=contacts`, `Diese LinkedIn-URL ist bereits bei ${dup.firstName} ${dup.lastName} hinterlegt (Dublette).`);
  }
  if (data.isPrimary) await db.contact.updateMany({ where: { companyId }, data: { isPrimary: false } });
  if (contactId) {
    await db.contact.updateMany({ where: { id: contactId, companyId }, data });
  } else {
    await db.contact.create({ data: { ...data, tenantId: user.tenantId, companyId } });
    await logActivity({ tenantId: user.tenantId, companyId, userId: user.id, type: "SYSTEM", title: `Ansprechpartner angelegt: ${data.firstName} ${data.lastName}` });
  }
  await rescoreCompany(companyId);
  revalidatePath(`/companies/${companyId}`);
}

export async function deleteContactAction(companyId: string, contactId: string) {
  const user = await requireEditor();
  await companyForUser(companyId, user);
  await db.contact.deleteMany({ where: { id: contactId, companyId } });
  await audit({ tenantId: user.tenantId, actorType: "USER", actorId: user.id, action: "contact.delete", entity: "Contact", entityId: contactId });
  revalidatePath(`/companies/${companyId}`);
}

// ───── Recherche: Fakten & Hypothesen ─────

export async function addFactAction(companyId: string, form: FormData) {
  const user = await requireEditor();
  await companyForUser(companyId, user);
  const status = infoStatus(str(form, "status"));
  const sourceUrl = optStr(form, "sourceUrl");
  if (status === "VERIFIED" && !sourceUrl && !optStr(form, "sourceName")) failTo(`/companies/${companyId}?tab=research`, "Verifizierte Informationen benötigen eine Quelle.");
  await db.companyFact.create({
    data: {
      companyId, category: str(form, "category") || "Allgemein", label: str(form, "label"), value: str(form, "value"), status,
      sourceName: optStr(form, "sourceName"), sourceUrl, retrievedAt: optStr(form, "retrievedAt") ? new Date(str(form, "retrievedAt")) : new Date(), origin: "USER", reviewed: true,
    },
  });
  revalidatePath(`/companies/${companyId}`);
}

export async function updateFactStatusAction(companyId: string, factId: string, form: FormData) {
  const user = await requireEditor();
  await companyForUser(companyId, user);
  const action = str(form, "action");
  if (action === "delete") await db.companyFact.deleteMany({ where: { id: factId, companyId } });
  else await db.companyFact.updateMany({ where: { id: factId, companyId }, data: { status: infoStatus(str(form, "status")), reviewed: true } });
  revalidatePath(`/companies/${companyId}`);
  revalidatePath("/research");
}

export async function runResearchAction(companyId: string, form: FormData) {
  const user = await requireEditor();
  const company = await companyForUser(companyId, user);
  const full = await db.company.findUniqueOrThrow({ where: { id: company.id }, include: { contacts: true } });
  let result;
  try {
    result = await runResearch(full, { preferAi: bool(form, "useAi") });
  } catch (e) {
    if (e instanceof AiNotEnabledError) result = await runResearch(full, { preferAi: false });
    else throw e;
  }
  const origin = result.mode === "AI" ? "AI" : "RULE";
  const existing = await db.improvementHypothesis.findMany({ where: { companyId } });
  let order = existing.length;
  for (const h of result.hypotheses) {
    if (existing.some((x) => x.topic.toLowerCase() === h.topic.toLowerCase() && x.origin === origin)) continue;
    await db.improvementHypothesis.create({ data: { companyId, topic: h.topic.slice(0, 120), rationale: h.rationale.slice(0, 2000), origin, order: order++ } });
  }
  if (result.summary) await db.companyFact.create({ data: { companyId, category: "KI-Zusammenfassung", label: "Zusammenfassung", value: result.summary, status: "HYPOTHESIS", origin: "AI", retrievedAt: new Date() } });
  for (const q of result.openQuestions) await db.companyFact.create({ data: { companyId, category: "Offene Frage", label: "Offene Frage", value: q, status: "UNKNOWN", origin, retrievedAt: new Date() } });
  for (const m of result.missingData) await db.companyFact.create({ data: { companyId, category: "Fehlende Information", label: m, value: "unbekannt", status: "UNKNOWN", origin, retrievedAt: new Date() } });
  await db.company.update({ where: { id: companyId }, data: { researchedAt: new Date() } });
  await logActivity({ tenantId: user.tenantId, companyId, userId: user.id, type: "RESEARCH", title: result.mode === "AI" ? "KI-Recherche durchgeführt" : "Regelbasierte Recherche durchgeführt", body: result.aiDisabledReason ? `KI nicht aktiviert: ${result.aiDisabledReason}` : undefined });
  await audit({ tenantId: user.tenantId, actorType: "USER", actorId: user.id, action: "research.run", entity: "Company", entityId: companyId, meta: { mode: result.mode } });
  await rescoreCompany(companyId);
  revalidatePath(`/companies/${companyId}`);
}

export async function reviewHypothesisAction(companyId: string, hypId: string, form: FormData) {
  const user = await requireEditor();
  await companyForUser(companyId, user);
  const action = str(form, "action");
  if (action === "delete") await db.improvementHypothesis.deleteMany({ where: { id: hypId, companyId } });
  else if (action === "accept") await db.improvementHypothesis.updateMany({ where: { id: hypId, companyId }, data: { reviewed: true } });
  else if (action === "reject") await db.improvementHypothesis.updateMany({ where: { id: hypId, companyId }, data: { reviewed: true, status: "REJECTED", visibleInRoom: false } });
  else if (action === "confirm") await db.improvementHypothesis.updateMany({ where: { id: hypId, companyId }, data: { reviewed: true, status: "CONFIRMED" } });
  else if (action === "edit") await db.improvementHypothesis.updateMany({ where: { id: hypId, companyId }, data: { topic: str(form, "topic"), rationale: str(form, "rationale"), reviewed: true } });
  revalidatePath(`/companies/${companyId}`);
  revalidatePath("/research");
}

export async function addHypothesisAction(companyId: string, form: FormData) {
  const user = await requireEditor();
  await companyForUser(companyId, user);
  const count = await db.improvementHypothesis.count({ where: { companyId } });
  await db.improvementHypothesis.create({ data: { companyId, topic: str(form, "topic"), rationale: str(form, "rationale"), origin: "USER", reviewed: true, order: count } });
  revalidatePath(`/companies/${companyId}`);
}

export async function completeResearchAction(companyId: string) {
  const user = await requireEditor();
  await companyForUser(companyId, user);
  const unreviewed = await db.improvementHypothesis.count({ where: { companyId, reviewed: false } });
  if (unreviewed) failTo(`/companies/${companyId}?tab=research`, `${unreviewed} Hypothese(n) noch ungeprüft – bitte zuerst prüfen.`);
  await db.companyFact.updateMany({ where: { companyId, reviewed: false }, data: { reviewed: true } });
  await logActivity({ tenantId: user.tenantId, companyId, userId: user.id, type: "RESEARCH", title: "Recherche geprüft und abgeschlossen" });
  await advanceStage(companyId, "RESEARCHED", user.id);
  revalidatePath(`/companies/${companyId}`);
}

// ───── Aufgaben ─────

export async function addTaskAction(form: FormData) {
  const user = await requireEditor();
  const companyId = optStr(form, "companyId");
  if (companyId) await companyForUser(companyId, user);
  await db.task.create({ data: { tenantId: user.tenantId, companyId, assigneeId: user.id, title: str(form, "title"), description: optStr(form, "description"), dueAt: optStr(form, "dueAt") ? new Date(str(form, "dueAt")) : null } });
  revalidatePath("/tasks");
  if (companyId) revalidatePath(`/companies/${companyId}`);
}

export async function toggleTaskAction(taskId: string) {
  const user = await requireEditor();
  const t = await db.task.findFirst({ where: { id: taskId, tenantId: user.tenantId } });
  if (!t) return;
  await db.task.update({ where: { id: taskId }, data: { doneAt: t.doneAt ? null : new Date() } });
  revalidatePath("/tasks");
  revalidatePath("/dashboard");
}
