"use server";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireEditor } from "@/lib/auth";
import { companyForUser, str, optStr, bool } from "@/lib/access";
import { logActivity } from "@/lib/audit";
import { advanceStage } from "@/lib/pipeline";
import { sanitizeInputs, type CalculatorInputs } from "@/lib/calculator";

function refresh(companyId: string, meetingId?: string | null) {
  revalidatePath(`/companies/${companyId}`);
  revalidatePath("/analyses");
  if (meetingId) revalidatePath(`/meetings/${meetingId}`);
}

export async function addFinding(form: FormData) {
  const user = await requireEditor();
  const company = await companyForUser(str(form, "companyId"), user);
  const title = str(form, "title");
  if (!title) throw new Error("Titel fehlt");
  const meetingId = optStr(form, "meetingId");
  if (meetingId) await db.meeting.findFirstOrThrow({ where: { id: meetingId, tenantId: user.tenantId } });
  const problemId = optStr(form, "problemId");
  if (problemId) await db.problem.findFirstOrThrow({ where: { id: problemId, category: { tenantId: user.tenantId } } });
  const status = str(form, "status") === "CONFIRMED" ? "CONFIRMED" : "HYPOTHESIS";
  await db.finding.create({
    data: {
      tenantId: user.tenantId, companyId: company.id, meetingId, problemId,
      area: str(form, "area") || "ALLGEMEIN", title,
      description: optStr(form, "description"), cause: optStr(form, "cause"), impact: optStr(form, "impact"),
      status, origin: str(form, "origin") === "AI" ? "AI" : "USER", shareWithClient: bool(form, "shareWithClient"),
    },
  });
  await logActivity({ tenantId: user.tenantId, companyId: company.id, userId: user.id, type: "ANALYSIS", title: `Erkenntnis dokumentiert: ${title}` });
  refresh(company.id, meetingId);
}

export async function updateFinding(form: FormData) {
  const user = await requireEditor();
  const f = await db.finding.findFirstOrThrow({ where: { id: str(form, "id"), tenantId: user.tenantId } });
  const action = str(form, "action");
  if (action === "delete") await db.finding.delete({ where: { id: f.id } });
  else if (action === "confirm") await db.finding.update({ where: { id: f.id }, data: { status: "CONFIRMED" } });
  else if (action === "hypothesis") await db.finding.update({ where: { id: f.id }, data: { status: "HYPOTHESIS" } });
  else if (action === "reject") await db.finding.update({ where: { id: f.id }, data: { status: "REJECTED", shareWithClient: false } });
  else if (action === "share") await db.finding.update({ where: { id: f.id }, data: { shareWithClient: !f.shareWithClient } });
  refresh(f.companyId, f.meetingId);
}

export async function suggestSolution(form: FormData) {
  const user = await requireEditor();
  const company = await companyForUser(str(form, "companyId"), user);
  const solution = await db.solution.findFirstOrThrow({ where: { id: str(form, "solutionId"), tenantId: user.tenantId } });
  const findingIds = form.getAll("findingIds").map(String).filter(Boolean);
  await db.companySolution.upsert({
    where: { companyId_solutionId: { companyId: company.id, solutionId: solution.id } },
    update: { status: "PROPOSED", ...(findingIds.length ? { findingIds } : {}) },
    create: { companyId: company.id, solutionId: solution.id, findingIds, status: "PROPOSED" },
  });
  await logActivity({ tenantId: user.tenantId, companyId: company.id, userId: user.id, type: "ANALYSIS", title: `Lösung vorgeschlagen: ${solution.name}` });
  refresh(company.id, optStr(form, "meetingId"));
}

export async function updateCompanySolution(form: FormData) {
  const user = await requireEditor();
  const cs = await db.companySolution.findFirstOrThrow({ where: { id: str(form, "id"), company: { tenantId: user.tenantId } }, include: { solution: true } });
  const action = str(form, "action");
  if (action === "select") {
    await db.companySolution.update({ where: { id: cs.id }, data: { status: "SELECTED" } });
    await logActivity({ tenantId: user.tenantId, companyId: cs.companyId, userId: user.id, type: "ANALYSIS", title: `Lösung ausgewählt: ${cs.solution.name}` });
    await advanceStage(cs.companyId, "SOLUTION_DEVELOPED", user.id);
  } else if (action === "reject") await db.companySolution.update({ where: { id: cs.id }, data: { status: "REJECTED", shareWithClient: false } });
  else if (action === "propose") await db.companySolution.update({ where: { id: cs.id }, data: { status: "PROPOSED" } });
  else if (action === "share") await db.companySolution.update({ where: { id: cs.id }, data: { shareWithClient: !cs.shareWithClient } });
  else if (action === "note") await db.companySolution.update({ where: { id: cs.id }, data: { note: optStr(form, "note") } });
  else if (action === "delete") await db.companySolution.delete({ where: { id: cs.id } });
  refresh(cs.companyId);
}

export async function saveAnalysis(form: FormData) {
  const user = await requireEditor();
  const company = await companyForUser(str(form, "companyId"), user);
  const assumptions = str(form, "assumptions");
  if (!assumptions) throw new Error("Bitte die Annahmen offenlegen – ohne Annahmen wird keine Analyse gespeichert.");
  let raw: Partial<CalculatorInputs> = {};
  try { raw = JSON.parse(str(form, "inputs") || "{}"); } catch { throw new Error("Ungültige Eingaben"); }
  const inputs = sanitizeInputs(raw);
  const data = { name: str(form, "name") || "Wirtschaftlichkeitsanalyse", inputs: inputs as unknown as object, assumptions, shareWithClient: bool(form, "shareWithClient") };
  const id = optStr(form, "id");
  if (id) {
    await db.economicAnalysis.findFirstOrThrow({ where: { id, tenantId: user.tenantId, companyId: company.id } });
    await db.economicAnalysis.update({ where: { id }, data });
  } else {
    await db.economicAnalysis.create({ data: { ...data, tenantId: user.tenantId, companyId: company.id } });
    await logActivity({ tenantId: user.tenantId, companyId: company.id, userId: user.id, type: "ANALYSIS", title: `Wirtschaftlichkeitsanalyse erstellt: ${data.name}` });
  }
  refresh(company.id);
}

export async function updateAnalysis(form: FormData) {
  const user = await requireEditor();
  const a = await db.economicAnalysis.findFirstOrThrow({ where: { id: str(form, "id"), tenantId: user.tenantId } });
  const action = str(form, "action");
  if (action === "delete") await db.economicAnalysis.delete({ where: { id: a.id } });
  else if (action === "share") await db.economicAnalysis.update({ where: { id: a.id }, data: { shareWithClient: !a.shareWithClient } });
  refresh(a.companyId);
}
