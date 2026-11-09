"use server";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireEditor } from "@/lib/auth";
import { parseCsv } from "@/lib/import";
import { str, optStr } from "@/lib/access";
import { audit, logActivity } from "@/lib/audit";
import { ensureStages } from "@/lib/pipeline";
import { rescoreCompany } from "@/lib/company-score";

export type PreviewRow = { line: number; company: string; industry?: string; revenue?: number | null; contact?: string; title?: string; errors: string[]; duplicateOf?: { id: string; name: string } | null; contactDuplicate?: boolean };
export type ImportState = { stage: "idle" | "preview" | "done" | "error"; csv?: string; rows?: PreviewRow[]; mapping?: Record<string, string>; unmapped?: string[]; message?: string; created?: number; updated?: number; skipped?: number; source?: string };

async function readCsv(form: FormData): Promise<string> {
  const file = form.get("file");
  if (file && typeof file === "object" && "text" in file && (file as File).size > 0) {
    if ((file as File).size > 5 * 1024 * 1024) throw new Error("Datei zu groß (max. 5 MB).");
    return (file as File).text();
  }
  return str(form, "csv");
}

export async function importAction(prev: ImportState, form: FormData): Promise<ImportState> {
  const user = await requireEditor();
  try {
    const step = str(form, "step");
    const csv = await readCsv(form);
    const source = str(form, "source") || "CSV";
    if (!csv.trim()) return { stage: "error", message: "Keine CSV-Daten." };
    const parsed = parseCsv(csv);
    if (!parsed.mapping.company) return { stage: "error", message: `Spalte für den Unternehmensnamen nicht erkannt. Gefundene Spalten: ${parsed.unmapped.join(", ")}` };

    const companies = await db.company.findMany({ where: { tenantId: user.tenantId }, select: { id: true, name: true, normalizedName: true, domain: true, linkedinUrl: true } });
    const contacts = await db.contact.findMany({ where: { tenantId: user.tenantId, linkedinUrl: { not: null } }, select: { linkedinUrl: true } });
    const liSet = new Set(contacts.map((c) => c.linkedinUrl));
    const findDup = (r: (typeof parsed.rows)[number]) =>
      companies.find((c) => c.normalizedName === r.company.normalizedName || (r.company.domain && c.domain === r.company.domain) || (r.company.linkedinUrl && c.linkedinUrl === r.company.linkedinUrl)) ?? null;

    if (step === "preview") {
      return {
        stage: "preview", csv, source, mapping: parsed.mapping, unmapped: parsed.unmapped,
        rows: parsed.rows.map((r) => ({
          line: r.line, company: r.company.name, industry: r.company.industry, revenue: r.company.revenueEur,
          contact: r.contact ? `${r.contact.firstName} ${r.contact.lastName}` : undefined, title: r.contact?.title, errors: r.errors,
          duplicateOf: (() => { const d = findDup(r); return d ? { id: d.id, name: d.name } : null; })(),
          contactDuplicate: !!(r.contact?.linkedinUrl && liSet.has(r.contact.linkedinUrl)),
        })),
      };
    }

    // Übernehmen
    const mode = str(form, "duplicates"); // skip | attach
    await ensureStages(user.tenantId);
    const found = await db.pipelineStage.findUnique({ where: { tenantId_key: { tenantId: user.tenantId, key: "FOUND" } } });
    let created = 0, updated = 0, skipped = 0;
    const touched = new Set<string>();
    const createdInRun = new Map<string, string>();
    for (const r of parsed.rows) {
      if (r.errors.some((e) => e.includes("fehlt"))) { skipped++; continue; }
      let companyId = createdInRun.get(r.company.normalizedName) ?? findDup(r)?.id ?? null;
      if (companyId && !createdInRun.has(r.company.normalizedName) && mode !== "attach") { skipped++; continue; }
      if (!companyId) {
        const c = await db.company.create({
          data: {
            tenantId: user.tenantId, ownerId: user.id, stageId: found?.id, source,
            name: r.company.name, normalizedName: r.company.normalizedName, website: r.company.website, domain: r.company.domain, linkedinUrl: r.company.linkedinUrl,
            industry: r.company.industry, location: r.company.location, country: r.company.country ?? "DE",
            revenueEur: r.company.revenueEur ?? null, revenueYear: r.company.revenueYear ?? null, revenueSource: r.company.revenueSource,
            // Importierte Umsätze gelten als Schätzung, bis eine Quelle geprüft ist
            revenueStatus: r.company.revenueEur != null ? "ESTIMATED" : "UNKNOWN",
            employees: r.company.employees ?? null, employeesStatus: r.company.employees ? "ESTIMATED" : "UNKNOWN",
            qualificationStatus: r.company.revenueEur == null ? "REVENUE_REVIEW" : "NEW",
            salesNavRef: optStr(form, "salesNavRef"),
          },
        });
        companyId = c.id;
        createdInRun.set(r.company.normalizedName, c.id);
        companies.push({ id: c.id, name: c.name, normalizedName: c.normalizedName, domain: c.domain, linkedinUrl: c.linkedinUrl });
        created++;
        if (r.company.revenueEur != null) await db.companyFact.create({ data: { companyId, category: "Umsatz", label: "Jahresumsatz (Import)", value: `${r.company.revenueEur} €`, status: "ESTIMATED", sourceName: r.company.revenueSource ?? `Import (${source})`, retrievedAt: new Date(), origin: "IMPORT" } });
        await logActivity({ tenantId: user.tenantId, companyId, userId: user.id, type: "SYSTEM", title: `Importiert (${source})` });
      } else updated++;
      if (r.contact && !(r.contact.linkedinUrl && liSet.has(r.contact.linkedinUrl))) {
        await db.contact.create({ data: { tenantId: user.tenantId, companyId, ...r.contact } });
        if (r.contact.linkedinUrl) liSet.add(r.contact.linkedinUrl);
      }
      touched.add(companyId);
    }
    for (const id of touched) await rescoreCompany(id);
    await audit({ tenantId: user.tenantId, actorType: "USER", actorId: user.id, action: "import.csv", meta: { created, updated, skipped, source } });
    revalidatePath("/companies");
    return { stage: "done", created, updated, skipped, message: "Import abgeschlossen." };
  } catch (e) {
    return { stage: "error", message: e instanceof Error ? e.message : String(e) };
  }
}

export async function saveSearchAction(form: FormData) {
  const user = await requireEditor();
  const filters = {
    industries: str(form, "industries"), revenueMin: str(form, "revenueMin"), revenueMax: str(form, "revenueMax"),
    employees: str(form, "employees"), locations: str(form, "locations"), roles: str(form, "roles"), keywords: str(form, "keywords"),
  };
  await db.savedSearch.create({ data: { tenantId: user.tenantId, name: str(form, "name"), salesNavUrl: optStr(form, "salesNavUrl"), notes: optStr(form, "notes"), filters } });
  revalidatePath("/prospecting");
}

export async function deleteSearchAction(id: string) {
  const user = await requireEditor();
  await db.savedSearch.deleteMany({ where: { id, tenantId: user.tenantId } });
  revalidatePath("/prospecting");
}

export async function markSearchRunAction(id: string) {
  const user = await requireEditor();
  await db.savedSearch.updateMany({ where: { id, tenantId: user.tenantId }, data: { lastRunAt: new Date() } });
  revalidatePath("/prospecting");
}
