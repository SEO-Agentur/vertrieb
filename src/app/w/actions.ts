"use server";
import { headers } from "next/headers";
import { z } from "zod";
import { db } from "@/lib/db";
import { rateLimit, clientKey } from "@/lib/rate-limit";
import { normalizeCompanyName, classifyRole } from "@/lib/normalize";
import { audit, logActivity, notify } from "@/lib/audit";
import { ensureStages } from "@/lib/pipeline";
import { rescoreCompany } from "@/lib/company-score";

export type LeadState = { ok?: boolean; error?: string; fieldErrors?: Record<string, string>; values?: Record<string, string> };

const REVENUE: Record<string, number | null> = { "<20": null, "20-50": 35e6, "50-100": 75e6, "100-200": 150e6, ">200": 250e6, unknown: null };

const LeadSchema = z.object({
  kind: z.enum(["POTENZIALANALYSE", "PLATTFORM", "KONTAKT"]),
  name: z.string().trim().min(2, "Bitte Ihren Namen angeben").max(120),
  company: z.string().trim().min(2, "Bitte die Firma angeben").max(160),
  role: z.string().trim().max(120).optional().default(""),
  email: z.string().trim().email("Bitte eine gültige E-Mail-Adresse angeben").max(200),
  phone: z.string().trim().max(60).optional().default(""),
  industry: z.string().trim().max(80).optional().default(""),
  revenue: z.string().optional().default("unknown"),
  message: z.string().trim().max(3000).optional().default(""),
  consent: z.literal("on", { message: "Bitte den Datenschutzhinweis bestätigen" }),
  website: z.string().max(0).optional().default(""), // Honeypot
});

/** Website-Anfrage → Unternehmen, Kontakt, Aktivität, Aufgabe und Benachrichtigung im CRM. */
export async function submitLeadAction(_prev: LeadState, form: FormData): Promise<LeadState> {
  const h = await headers();
  const rl = rateLimit(`lead:${clientKey(h)}`, 5, 60 * 60_000);
  if (!rl.ok) return { error: "Zu viele Anfragen. Bitte später erneut versuchen oder per E-Mail melden." };
  const raw = Object.fromEntries(form.entries());
  if (raw.website) return { ok: true }; // Bot – stillschweigend verwerfen
  const parsed = LeadSchema.safeParse(raw);
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const i of parsed.error.issues) fieldErrors[String(i.path[0])] = i.message;
    const values: Record<string, string> = {};
    for (const k of ["name", "company", "role", "email", "phone", "industry", "revenue", "message"]) values[k] = String(raw[k] ?? "");
    return { error: "Bitte die markierten Felder prüfen.", fieldErrors, values };
  }
  const d = parsed.data;
  const tenant = (await db.tenant.findFirst({ where: { slug: process.env.SITE_TENANT_SLUG ?? "default" } })) ?? (await db.tenant.findFirst({ orderBy: { createdAt: "asc" } }));
  if (!tenant) return { error: "Die Anfrage konnte gerade nicht gespeichert werden. Bitte per E-Mail melden." };

  await ensureStages(tenant.id);
  const found = await db.pipelineStage.findUnique({ where: { tenantId_key: { tenantId: tenant.id, key: "FOUND" } } });
  const normalizedName = normalizeCompanyName(d.company);
  let company = await db.company.findFirst({ where: { tenantId: tenant.id, normalizedName } });
  const revenueEur = REVENUE[d.revenue] ?? null;
  if (!company) {
    company = await db.company.create({
      data: {
        tenantId: tenant.id, name: d.company, normalizedName, industry: d.industry || null, stageId: found?.id, source: "WEBSITE",
        revenueEur, revenueStatus: revenueEur != null ? "ESTIMATED" : "UNKNOWN", revenueSource: revenueEur != null ? "Selbstauskunft Website (Spanne)" : null,
        qualificationStatus: revenueEur != null ? "NEW" : "REVENUE_REVIEW",
      },
    });
  }
  const [firstName, ...rest] = d.name.split(/\s+/);
  await db.contact.create({
    data: { tenantId: tenant.id, companyId: company.id, firstName, lastName: rest.join(" ") || "–", title: d.role || null, roleCategory: classifyRole(d.role), email: d.email.toLowerCase(), phone: d.phone || null, isPrimary: true, outreachStatus: "REPLIED", notes: "Kontakt über Website-Formular (Einwilligung zur Kontaktaufnahme erteilt)." },
  });
  const label = { POTENZIALANALYSE: "Anfrage Potenzialanalyse", PLATTFORM: "Anfrage Plattform-Zugang", KONTAKT: "Kontaktanfrage" }[d.kind];
  await logActivity({ tenantId: tenant.id, companyId: company.id, type: "INBOUND", title: `Website: ${label}`, body: [d.message && `Nachricht: ${d.message}`, `Umsatzspanne: ${d.revenue}`, d.phone && `Telefon: ${d.phone}`].filter(Boolean).join("\n") });
  await db.task.create({ data: { tenantId: tenant.id, companyId: company.id, title: `${label} beantworten: ${d.name}`, dueAt: new Date(Date.now() + 86400_000) } });
  await notify({ tenantId: tenant.id, type: "INBOUND_LEAD", title: `Neue Website-Anfrage: ${d.company}`, body: `${label} von ${d.name}`, link: `/companies/${company.id}` });
  await audit({ tenantId: tenant.id, actorType: "VISITOR", action: "website.lead", entity: "Company", entityId: company.id, meta: { kind: d.kind } });
  await rescoreCompany(company.id);
  return { ok: true };
}
