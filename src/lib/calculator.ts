/**
 * Potenzial- und Wirtschaftlichkeitsrechner.
 * Wichtig: Umsatz ≠ Gewinn. Ergebnisse sind Szenarien auf Basis offengelegter Annahmen, keine Zusagen.
 */
export type CalculatorInputs = {
  revenueEur: number;
  revenueIsVerified: boolean;
  scenarios: number[]; // Umsatzsteigerung in Prozent, z.B. [0.05, 0.1, 0.5]
  marginPct: number; // Deckungsbeitragsmarge in %
  processSavingsEur: number; // geschätzte jährliche Prozesskosteneinsparung
  hoursSavedPerMonth: number;
  hourlyCostEur: number;
  oneTimeCostEur: number;
  runningCostPerYearEur: number;
};

export const DEFAULT_CALCULATOR: CalculatorInputs = {
  revenueEur: 0,
  revenueIsVerified: false,
  scenarios: [0.05, 0.1, 0.5],
  marginPct: 30,
  processSavingsEur: 0,
  hoursSavedPerMonth: 0,
  hourlyCostEur: 65,
  oneTimeCostEur: 0,
  runningCostPerYearEur: 0,
};

export type ScenarioResult = {
  upliftPct: number;
  additionalRevenue: number;
  additionalContribution: number;
  savings: number;
  annualBenefit: number;
  netAnnualBenefit: number;
  paybackMonths: number | null;
  firstYearNet: number;
};

const n = (v: unknown, d = 0) => (typeof v === "number" && Number.isFinite(v) ? v : typeof v === "string" && v.trim() !== "" && Number.isFinite(Number(v)) ? Number(v) : d);

export function sanitizeInputs(raw: Partial<CalculatorInputs> | null | undefined): CalculatorInputs {
  const r = raw ?? {};
  const scenarios = Array.isArray(r.scenarios) && r.scenarios.length ? r.scenarios.map((s) => Math.max(0, Math.min(100, n(s)))).slice(0, 6) : DEFAULT_CALCULATOR.scenarios;
  return {
    revenueEur: Math.max(0, n(r.revenueEur)),
    revenueIsVerified: Boolean(r.revenueIsVerified),
    scenarios,
    marginPct: Math.max(0, Math.min(100, n(r.marginPct, DEFAULT_CALCULATOR.marginPct))),
    processSavingsEur: Math.max(0, n(r.processSavingsEur)),
    hoursSavedPerMonth: Math.max(0, n(r.hoursSavedPerMonth)),
    hourlyCostEur: Math.max(0, n(r.hourlyCostEur, DEFAULT_CALCULATOR.hourlyCostEur)),
    oneTimeCostEur: Math.max(0, n(r.oneTimeCostEur)),
    runningCostPerYearEur: Math.max(0, n(r.runningCostPerYearEur)),
  };
}

export function computeScenario(inp: CalculatorInputs, upliftPct: number): ScenarioResult {
  const additionalRevenue = inp.revenueEur * (upliftPct / 100);
  const additionalContribution = additionalRevenue * (inp.marginPct / 100);
  const savings = inp.processSavingsEur + inp.hoursSavedPerMonth * 12 * inp.hourlyCostEur;
  const annualBenefit = additionalContribution + savings;
  const netAnnualBenefit = annualBenefit - inp.runningCostPerYearEur;
  const paybackMonths = inp.oneTimeCostEur <= 0 ? (netAnnualBenefit > 0 ? 0 : null) : netAnnualBenefit > 0 ? (inp.oneTimeCostEur / netAnnualBenefit) * 12 : null;
  return {
    upliftPct,
    additionalRevenue,
    additionalContribution,
    savings,
    annualBenefit,
    netAnnualBenefit,
    paybackMonths: paybackMonths === null ? null : Math.round(paybackMonths * 10) / 10,
    firstYearNet: netAnnualBenefit - inp.oneTimeCostEur,
  };
}

export function computeAll(inp: CalculatorInputs): ScenarioResult[] {
  return inp.scenarios.map((s) => computeScenario(inp, s));
}

export const CALCULATOR_DISCLAIMER =
  "Rechenbeispiel auf Basis der angezeigten Annahmen. Zusätzlicher Umsatz ist nicht gleich Gewinn; maßgeblich sind Deckungsbeitrag, Einsparungen sowie einmalige und laufende Kosten. Es handelt sich um keine Zusage oder Garantie eines Ergebnisses.";
