import type { IcpConfig, ScoringConfig } from "./settings";

export type ScoreInput = {
  industry?: string | null;
  revenueEur?: number | null;
  revenueStatus?: string | null;
  country?: string | null;
  ownership?: string | null;
  salesDependency?: number | null;
  digitalSignals?: number | null;
  regulatoryHurdle?: number | null;
  procurementEffort?: number | null;
  contactRoles: string[];
  engagement: { roomVisits: number; sectionViews: number; callRequests: number; meetings: number; replies: number };
  hypothesesCount: number;
};

export type ScorePart = { key: keyof ScoringConfig["weights"]; label: string; value: number; weight: number; reasons: string[] };
export type ScoreResult = { total: number; parts: ScorePart[]; band: "HOT" | "QUALIFIED" | "LOW"; warnings: string[] };

const clamp = (n: number) => Math.max(0, Math.min(100, Math.round(n)));
const scale5 = (v: number | null | undefined, fallback = 50) => (v ? (v - 1) * 25 : fallback);

function matchesAny(value: string | null | undefined, list: string[]) {
  if (!value) return false;
  const v = value.toLowerCase();
  return list.some((x) => v.includes(x.toLowerCase()) || x.toLowerCase().includes(v));
}

/**
 * Nachvollziehbares Lead-Scoring. Jede Teilbewertung liefert 0–100 Punkte plus Begründungen.
 * Unbekannte Werte werden neutral (50) bewertet und als Warnung ausgewiesen – nie als Fakt.
 */
export function computeScore(input: ScoreInput, icp: IcpConfig, cfg: ScoringConfig): ScoreResult {
  const warnings: string[] = [];

  // ICP-Fit
  const icpReasons: string[] = [];
  let icp_ = 50;
  if (matchesAny(input.industry, icp.preferredIndustries)) { icp_ += 25; icpReasons.push(`Bevorzugte Branche: ${input.industry}`); }
  else if (matchesAny(input.industry, icp.lowPriorityIndustries)) { icp_ -= 30; icpReasons.push(`Niedrig priorisierte Branche (hohe Einstiegshürden): ${input.industry}`); }
  else if (input.industry) icpReasons.push(`Branche nicht in der Bevorzugtenliste: ${input.industry}`);
  else { warnings.push("Branche unbekannt"); }
  if (input.revenueEur == null) { warnings.push("Umsatz unbekannt – Prüfwarteschlange"); icpReasons.push("Umsatz unbekannt (neutral bewertet)"); }
  else if (input.revenueEur < icp.minRevenueEur) { icp_ -= 40; icpReasons.push(`Umsatz unter Mindestgrenze (${Math.round(input.revenueEur / 1e6)} Mio. €)`); }
  else if (input.revenueEur <= icp.preferredRevenueMaxEur) { icp_ += 20; icpReasons.push(`Umsatz im bevorzugten Korridor (${Math.round(input.revenueEur / 1e6)} Mio. €)`); }
  else { icp_ += 5; icpReasons.push(`Umsatz oberhalb des bevorzugten Korridors (${Math.round(input.revenueEur / 1e6)} Mio. €)`); }
  if (input.revenueEur != null && input.revenueStatus !== "VERIFIED") icpReasons.push("Umsatz nicht verifiziert");
  if (input.country && input.country !== icp.country) { icp_ -= 15; icpReasons.push(`Land ${input.country} ≠ Zielmarkt ${icp.country}`); }
  if (matchesAny(input.ownership, icp.preferredOwnership)) { icp_ += 10; icpReasons.push(`Eigentümerstruktur passend: ${input.ownership}`); }

  // Vertriebspotenzial
  const salesReasons: string[] = [];
  let sales = scale5(input.salesDependency);
  salesReasons.push(input.salesDependency ? `Vertriebsabhängigkeit ${input.salesDependency}/5` : "Vertriebsabhängigkeit unbekannt (neutral)");
  const targetRoles = input.contactRoles.filter((r) => icp.targetRoles.includes(r));
  if (targetRoles.length) { sales += 10; salesReasons.push(`${targetRoles.length} Entscheider-Kontakt(e) vorhanden`); }
  else salesReasons.push("Noch kein relevanter Ansprechpartner");

  // Digitalisierungspotenzial
  const digitalReasons: string[] = [];
  let digital = scale5(input.digitalSignals);
  digitalReasons.push(input.digitalSignals ? `Hinweise auf optimierbare Prozesse ${input.digitalSignals}/5` : "Keine Hinweise erfasst (neutral)");
  if (input.hypothesesCount) { digital += Math.min(15, input.hypothesesCount * 3); digitalReasons.push(`${input.hypothesesCount} Verbesserungs-Hypothese(n) – unbestätigt`); }

  // Wirtschaftliches Potenzial – 0,05 %-Prinzip
  const ecoReasons: string[] = [];
  let eco = 50;
  if (input.revenueEur != null) {
    const p = input.revenueEur * 0.0005;
    eco = p >= 100_000 ? 95 : p >= 50_000 ? 85 : p >= 25_000 ? 70 : p >= 10_000 ? 50 : 25;
    ecoReasons.push(`0,05 % Umsatz entsprechen rechnerisch ${Math.round(p).toLocaleString("de-DE")} € (kein Gewinn, keine Garantie)`);
  } else ecoReasons.push("Ohne Umsatz nicht bewertbar (neutral)");

  // Umsetzbarkeit (niedrige Hürden = hoch)
  const feasReasons: string[] = [];
  const reg = input.regulatoryHurdle ? 100 - scale5(input.regulatoryHurdle) : 50;
  const proc = input.procurementEffort ? 100 - scale5(input.procurementEffort) : 50;
  const feas = (reg + proc) / 2;
  feasReasons.push(input.regulatoryHurdle ? `Regulatorische Hürde ${input.regulatoryHurdle}/5` : "Regulatorische Hürde unbekannt");
  feasReasons.push(input.procurementEffort ? `Beschaffungs-/Entscheidungsaufwand ${input.procurementEffort}/5` : "Entscheidungsaufwand unbekannt");

  // Engagement
  const e = input.engagement;
  const engReasons: string[] = [];
  let eng = 0;
  if (e.replies) { eng += 30; engReasons.push(`${e.replies} Antwort(en) auf Ansprache`); }
  if (e.roomVisits) { eng += Math.min(30, e.roomVisits * 10); engReasons.push(`${e.roomVisits} Besuch(e) der Kundenwelt`); }
  if (e.sectionViews) { eng += Math.min(10, e.sectionViews); engReasons.push(`${e.sectionViews} Abschnittsaufrufe (mit Einwilligung)`); }
  if (e.callRequests) { eng += 20; engReasons.push(`${e.callRequests} Gesprächsanfrage(n)`); }
  if (e.meetings) { eng += 20; engReasons.push(`${e.meetings} Gespräch(e) geführt`); }
  if (!engReasons.length) engReasons.push("Noch keine Interaktion");

  const w = cfg.weights;
  const parts: ScorePart[] = [
    { key: "icpFit", label: "ICP-Fit", value: clamp(icp_), weight: w.icpFit, reasons: icpReasons },
    { key: "salesPotential", label: "Vertriebspotenzial", value: clamp(sales), weight: w.salesPotential, reasons: salesReasons },
    { key: "digitalPotential", label: "Digitalisierungspotenzial", value: clamp(digital), weight: w.digitalPotential, reasons: digitalReasons },
    { key: "economicPotential", label: "Wirtschaftliches Potenzial", value: clamp(eco), weight: w.economicPotential, reasons: ecoReasons },
    { key: "feasibility", label: "Umsetzbarkeit", value: clamp(feas), weight: w.feasibility, reasons: feasReasons },
    { key: "engagement", label: "Engagement", value: clamp(eng), weight: w.engagement, reasons: engReasons },
  ];
  const totalWeight = parts.reduce((s, p) => s + p.weight, 0) || 1;
  const total = clamp(parts.reduce((s, p) => s + p.value * p.weight, 0) / totalWeight);
  const band = total >= cfg.thresholds.hot ? "HOT" : total >= cfg.thresholds.qualified ? "QUALIFIED" : "LOW";
  return { total, parts, band, warnings };
}
