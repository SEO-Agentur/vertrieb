const eur0 = new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR", maximumFractionDigits: 0 });
const eur2 = new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR", minimumFractionDigits: 2, maximumFractionDigits: 2 });
const num = new Intl.NumberFormat("de-DE");

export function eur(value: number | null | undefined, cents = false): string {
  if (value === null || value === undefined || Number.isNaN(value)) return "–";
  return (cents ? eur2 : eur0).format(value);
}

export function millions(value: number | null | undefined): string {
  if (value === null || value === undefined) return "unbekannt";
  return `${num.format(Math.round((value / 1_000_000) * 10) / 10)} Mio. €`;
}

export function number(value: number | null | undefined): string {
  if (value === null || value === undefined) return "–";
  return num.format(value);
}

export function date(value: Date | string | null | undefined): string {
  if (!value) return "–";
  return new Date(value).toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "numeric" });
}

export function dateTime(value: Date | string | null | undefined): string {
  if (!value) return "–";
  return new Date(value).toLocaleString("de-DE", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

export function relative(value: Date | string | null | undefined): string {
  if (!value) return "–";
  const diff = (Date.now() - new Date(value).getTime()) / 1000;
  if (diff < 60) return "gerade eben";
  if (diff < 3600) return `vor ${Math.floor(diff / 60)} Min.`;
  if (diff < 86400) return `vor ${Math.floor(diff / 3600)} Std.`;
  return `vor ${Math.floor(diff / 86400)} Tagen`;
}

export const infoStatusLabel: Record<string, string> = {
  VERIFIED: "verifiziert",
  ESTIMATED: "Schätzung",
  HYPOTHESIS: "Hypothese",
  UNKNOWN: "unbekannt",
};

export const qualificationLabel: Record<string, string> = {
  NEW: "Neu",
  IN_PROGRESS: "In Prüfung",
  REVENUE_REVIEW: "Umsatz prüfen",
  QUALIFIED: "Qualifiziert",
  DISQUALIFIED: "Nicht passend",
};
