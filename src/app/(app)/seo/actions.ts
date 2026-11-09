"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { requireEditor } from "@/lib/auth";
import { companyForUser, str } from "@/lib/access";
import { logActivity } from "@/lib/audit";
import { parseSeoImport, triggerSeoScan, type SeoScanData } from "@/lib/seo";

const back = (companyId: string, error?: string) => redirect(`/companies/${companyId}?tab=seo${error ? `&error=${encodeURIComponent(error)}` : ""}`);

async function store(companyId: string, data: SeoScanData, source: string) {
  return db.seoScan.create({
    data: {
      companyId, url: data.url, source, status: "IMPORTED", score: data.score ?? null, summary: data.summary ?? null,
      issues: data.issues as unknown as object, scannedAt: data.scannedAt && !Number.isNaN(Date.parse(data.scannedAt)) ? new Date(data.scannedAt) : new Date(),
    },
  });
}

export async function importSeoScan(form: FormData) {
  const user = await requireEditor();
  const company = await companyForUser(str(form, "companyId"), user);
  const raw = str(form, "data");
  if (!raw) back(company.id, "Keine Daten eingegeben.");
  let data: SeoScanData;
  try {
    data = parseSeoImport(raw.slice(0, 500_000), str(form, "url") || company.website || "");
  } catch (e) {
    return back(company.id, `Import fehlgeschlagen: ${e instanceof Error ? e.message.slice(0, 200) : "ungültiges Format"}`);
  }
  await store(company.id, data, "MANUAL_IMPORT");
  await logActivity({ tenantId: user.tenantId, companyId: company.id, userId: user.id, type: "SEO", title: `SEO-Scan importiert (${data.issues.length} Befunde)` });
  revalidatePath(`/companies/${company.id}`);
  back(company.id);
}

export async function runSeoScan(form: FormData) {
  const user = await requireEditor();
  const company = await companyForUser(str(form, "companyId"), user);
  const url = str(form, "url") || company.website;
  if (!url) back(company.id, "Keine Website hinterlegt.");
  let data: SeoScanData;
  try {
    data = await triggerSeoScan(url!);
  } catch (e) {
    return back(company.id, e instanceof Error ? e.message : "Scan fehlgeschlagen");
  }
  await store(company.id, data, "API");
  await logActivity({ tenantId: user.tenantId, companyId: company.id, userId: user.id, type: "SEO", title: `SEO-Scan durchgeführt (${data.issues.length} Befunde)` });
  revalidatePath(`/companies/${company.id}`);
  back(company.id);
}

export async function updateSeoScan(form: FormData) {
  const user = await requireEditor();
  const scan = await db.seoScan.findFirstOrThrow({ where: { id: str(form, "id"), company: { tenantId: user.tenantId } } });
  if (str(form, "action") === "delete") await db.seoScan.delete({ where: { id: scan.id } });
  else await db.seoScan.update({ where: { id: scan.id }, data: { shareWithClient: !scan.shareWithClient } });
  revalidatePath(`/companies/${scan.companyId}`);
}

/** Schlägt Lösungen aus dem Katalog vor, deren Probleme in der Kategorie „Digitale Sichtbarkeit“ liegen. */
export async function suggestSeoSolutions(form: FormData) {
  const user = await requireEditor();
  const company = await companyForUser(str(form, "companyId"), user);
  const solutions = await db.solution.findMany({ where: { tenantId: user.tenantId, active: true, problems: { some: { problem: { category: { key: "SICHTBARKEIT" } } } } } });
  if (!solutions.length) back(company.id, "Im Katalog gibt es keine Lösungen für die Kategorie SICHTBARKEIT.");
  for (const s of solutions) {
    await db.companySolution.upsert({ where: { companyId_solutionId: { companyId: company.id, solutionId: s.id } }, update: {}, create: { companyId: company.id, solutionId: s.id, status: "PROPOSED" } });
  }
  await logActivity({ tenantId: user.tenantId, companyId: company.id, userId: user.id, type: "ANALYSIS", title: `${solutions.length} SEO-Lösung(en) vorgeschlagen` });
  redirect(`/companies/${company.id}?tab=analysis`);
}
