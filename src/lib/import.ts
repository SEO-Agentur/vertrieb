import Papa from "papaparse";
import { classifyRole, extractDomain, normalizeCompanyName, normalizeLinkedinUrl, parseRevenue } from "./normalize";

/** Erkannte Spalten (Deutsch/Englisch, inkl. typischer Sales-Navigator-/CRM-Exporte). */
const ALIASES: Record<string, string[]> = {
  company: ["unternehmen", "firma", "company", "company name", "account name", "firmenname", "organisation"],
  website: ["website", "webseite", "domain", "url", "company website"],
  companyLinkedin: ["linkedin unternehmen", "company linkedin", "company linkedin url", "linkedin company url", "unternehmensprofil"],
  industry: ["branche", "industry"],
  location: ["standort", "ort", "location", "stadt", "city", "hauptsitz"],
  country: ["land", "country"],
  revenue: ["umsatz", "jahresumsatz", "revenue", "annual revenue"],
  revenueYear: ["geschäftsjahr", "geschaeftsjahr", "umsatzjahr", "fiscal year"],
  revenueSource: ["umsatzquelle", "revenue source", "quelle"],
  employees: ["mitarbeiter", "mitarbeiterzahl", "employees", "company size", "headcount"],
  firstName: ["vorname", "first name", "firstname"],
  lastName: ["nachname", "last name", "lastname"],
  fullName: ["name", "full name", "kontakt", "ansprechpartner"],
  title: ["position", "titel", "title", "job title", "funktion"],
  email: ["e-mail", "email", "mail"],
  phone: ["telefon", "phone"],
  linkedin: ["linkedin", "linkedin url", "profile url", "linkedin profil", "person linkedin url"],
  salesNav: ["sales navigator", "sales navigator url", "lead url"],
};

export type ImportRow = {
  line: number;
  company: { name: string; normalizedName: string; website?: string; domain?: string | null; linkedinUrl?: string | null; industry?: string; location?: string; country?: string; revenueEur?: number | null; revenueYear?: number | null; revenueSource?: string; employees?: number | null };
  contact?: { firstName: string; lastName: string; title?: string; roleCategory: string; email?: string; phone?: string; linkedinUrl?: string | null; salesNavUrl?: string };
  errors: string[];
};

function mapHeaders(headers: string[]) {
  const map: Record<string, string> = {};
  for (const h of headers) {
    const k = h.trim().toLowerCase();
    for (const [field, aliases] of Object.entries(ALIASES)) if (!map[field] && aliases.includes(k)) map[field] = h;
  }
  return map;
}

export function parseCsv(text: string): { rows: ImportRow[]; mapping: Record<string, string>; unmapped: string[] } {
  const parsed = Papa.parse<Record<string, string>>(text.replace(/^﻿/, ""), { header: true, skipEmptyLines: true, delimitersToGuess: [",", ";", "\t"] });
  const headers = parsed.meta.fields ?? [];
  const m = mapHeaders(headers);
  const used = new Set(Object.values(m));
  const rows: ImportRow[] = parsed.data.slice(0, 5000).map((r, idx) => {
    const g = (f: string) => (m[f] ? (r[m[f]] ?? "").trim() : "");
    const errors: string[] = [];
    const name = g("company");
    if (!name) errors.push("Unternehmensname fehlt");
    const website = g("website") || undefined;
    const revenueRaw = g("revenue");
    const revenue = parseRevenue(revenueRaw);
    if (revenueRaw && revenue == null) errors.push(`Umsatz nicht lesbar: "${revenueRaw}"`);
    const emp = g("employees");
    let first = g("firstName"), last = g("lastName");
    if (!first && !last && g("fullName")) {
      const parts = g("fullName").split(/\s+/);
      last = parts.pop() ?? "";
      first = parts.join(" ");
    }
    const title = g("title") || undefined;
    return {
      line: idx + 2,
      company: {
        name,
        normalizedName: normalizeCompanyName(name),
        website,
        domain: extractDomain(website),
        linkedinUrl: normalizeLinkedinUrl(g("companyLinkedin")),
        industry: g("industry") || undefined,
        location: g("location") || undefined,
        country: g("country") || undefined,
        revenueEur: revenue,
        revenueYear: g("revenueYear") ? parseInt(g("revenueYear"), 10) || null : null,
        revenueSource: g("revenueSource") || undefined,
        employees: emp ? parseInt(emp.replace(/[^\d]/g, ""), 10) || null : null,
      },
      contact: first || last ? {
        firstName: first, lastName: last, title, roleCategory: classifyRole(title),
        email: g("email") || undefined, phone: g("phone") || undefined,
        linkedinUrl: normalizeLinkedinUrl(g("linkedin")), salesNavUrl: g("salesNav") || undefined,
      } : undefined,
      errors,
    };
  });
  return { rows, mapping: m, unmapped: headers.filter((h) => !used.has(h)) };
}
