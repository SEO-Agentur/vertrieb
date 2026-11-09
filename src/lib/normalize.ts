const LEGAL_FORMS = /\b(gmbh\s*&\s*co\.?\s*kg(aa)?|gmbh|ag|kg|ohg|se|ug|e\.?\s?k\.?|mbh|co\.?|inc\.?|ltd\.?|llc|holding)\b/g;

export function normalizeCompanyName(name: string): string {
  return name
    .toLowerCase()
    .replace(/ä/g, "ae").replace(/ö/g, "oe").replace(/ü/g, "ue").replace(/ß/g, "ss")
    .replace(LEGAL_FORMS, " ")
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ");
}

export function extractDomain(url?: string | null): string | null {
  if (!url) return null;
  try {
    const u = new URL(url.includes("://") ? url : `https://${url}`);
    return u.hostname.replace(/^www\./, "").toLowerCase() || null;
  } catch {
    return null;
  }
}

export function slugify(value: string): string {
  return normalizeCompanyName(value).replace(/\s+/g, "-").slice(0, 60) || "kundenwelt";
}

export function normalizeLinkedinUrl(url?: string | null): string | null {
  if (!url) return null;
  try {
    const u = new URL(url.includes("://") ? url : `https://${url}`);
    if (!/(^|\.)linkedin\.com$/.test(u.hostname)) return null;
    return `https://www.linkedin.com${u.pathname.replace(/\/+$/, "")}`;
  } catch {
    return null;
  }
}

/** Grobe Rollenzuordnung von Jobtiteln zu Ansprechpartner-Kategorien. */
export function classifyRole(title?: string | null): string {
  const t = (title ?? "").toLowerCase();
  if (/inhaber|owner|gesellschafter/.test(t)) return "OWNER";
  if (/\bceo\b|geschäftsführ|geschaeftsfuehr|managing director|vorstand/.test(t)) return "CEO";
  if (/\bcco\b|chief commercial/.test(t)) return "CCO";
  if (/\bcoo\b|chief operating/.test(t)) return "COO";
  if (/vertriebsleit|head of sales|sales director|vertriebsdirektor|leiter vertrieb|vp sales/.test(t)) return "SALES_HEAD";
  if (/business development/.test(t)) return "BD";
  if (/digital|transformation/.test(t)) return "DIGITAL";
  return "OTHER";
}

export const roleLabels: Record<string, string> = {
  OWNER: "Inhaber",
  CEO: "Geschäftsführung / CEO",
  CCO: "Chief Commercial Officer",
  COO: "COO",
  SALES_HEAD: "Vertriebsleitung",
  BD: "Business Development",
  DIGITAL: "Digitale Transformation",
  OTHER: "Sonstige",
};

/** Parst Umsatzangaben wie "65 Mio", "65.000.000", "65m", "1,2 Mrd". */
export function parseRevenue(input?: string | null): number | null {
  if (!input) return null;
  const s = String(input).toLowerCase().replace(/€|eur|euro/g, "").trim();
  if (!s) return null;
  const m = s.match(/([\d.,]+)\s*(mrd|milliarde|bn|b|mio|million|m|tsd|k)?/);
  if (!m) return null;
  let raw = m[1];
  // Deutsches Format: Tausenderpunkte, Dezimalkomma
  if (/^\d{1,3}(\.\d{3})+(,\d+)?$/.test(raw)) raw = raw.replace(/\./g, "").replace(",", ".");
  else if (/^\d{1,3}(,\d{3})+(\.\d+)?$/.test(raw)) raw = raw.replace(/,/g, "");
  else raw = raw.replace(",", ".");
  const n = parseFloat(raw);
  if (Number.isNaN(n)) return null;
  const unit = m[2];
  if (unit && /^(mrd|milliarde|bn|b)$/.test(unit)) return n * 1e9;
  if (unit && /^(mio|million|m)$/.test(unit)) return n * 1e6;
  if (unit && /^(tsd|k)$/.test(unit)) return n * 1e3;
  return n;
}
