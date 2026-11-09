import type { OfferItem } from "@prisma/client";

export const OFFER_SECTIONS = [
  { key: "situation", label: "Ausgangssituation" },
  { key: "problems", label: "Gemeinsam identifizierte Probleme" },
  { key: "goals", label: "Projektziele" },
  { key: "solution", label: "Vorgeschlagene Lösung" },
  { key: "technical", label: "Technische Umsetzung" },
  { key: "scope", label: "Leistungsumfang" },
  { key: "phases", label: "Projektphasen" },
  { key: "timeline", label: "Zeitplan" },
  { key: "successCriteria", label: "Erfolgskriterien" },
  { key: "prerequisites", label: "Voraussetzungen" },
  { key: "risks", label: "Risiken" },
  { key: "options", label: "Optionale Erweiterungen" },
] as const;
export type OfferSections = Partial<Record<(typeof OFFER_SECTIONS)[number]["key"], string>>;

export const PRICING_LABEL: Record<string, string> = {
  FIXED: "Festpreis",
  HOURLY: "pro Stunde",
  DAILY: "pro Tag",
  MONTHLY: "pro Monat",
  YEARLY: "pro Jahr",
  PER_UNIT: "pro Einheit",
};

export function itemTotal(i: Pick<OfferItem, "quantity" | "unitPrice">) {
  return Math.round(i.quantity * i.unitPrice * 100) / 100;
}

/** Summen getrennt nach einmaligen und laufenden Kosten; optionale Positionen separat. */
export function offerTotals(items: Pick<OfferItem, "quantity" | "unitPrice" | "recurring" | "optional" | "pricingModel">[]) {
  const t = { oneTime: 0, monthly: 0, yearly: 0, optionalOneTime: 0, optionalRecurringYearly: 0 };
  for (const i of items) {
    const total = itemTotal(i);
    if (i.optional) {
      if (i.recurring) t.optionalRecurringYearly += i.pricingModel === "MONTHLY" ? total * 12 : total;
      else t.optionalOneTime += total;
      continue;
    }
    if (!i.recurring) t.oneTime += total;
    else if (i.pricingModel === "MONTHLY") t.monthly += total;
    else t.yearly += total;
  }
  return { ...t, recurringPerYear: t.monthly * 12 + t.yearly };
}

export const VAT_RATE = 0.19;
