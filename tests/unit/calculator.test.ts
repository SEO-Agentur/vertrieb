import { describe, it, expect } from "vitest";
import { computeScenario, sanitizeInputs, computeAll } from "@/lib/calculator";

describe("Potenzialrechner", () => {
  it("0,05 % von 100 Mio. € ergeben 50.000 € Umsatz", () => {
    const r = computeScenario(sanitizeInputs({ revenueEur: 100_000_000, marginPct: 30 }), 0.05);
    expect(r.additionalRevenue).toBe(50_000);
    expect(r.additionalContribution).toBe(15_000); // Umsatz ≠ Gewinn
  });

  it("berechnet Einsparungen, laufende Kosten und Amortisation", () => {
    const inp = sanitizeInputs({ revenueEur: 65_000_000, marginPct: 25, hoursSavedPerMonth: 40, hourlyCostEur: 60, oneTimeCostEur: 30_000, runningCostPerYearEur: 6_000 });
    const r = computeScenario(inp, 0.1);
    expect(r.additionalRevenue).toBeCloseTo(65_000);
    expect(r.additionalContribution).toBeCloseTo(16_250);
    expect(r.savings).toBe(28_800);
    expect(r.netAnnualBenefit).toBeCloseTo(39_050);
    expect(r.paybackMonths).toBeCloseTo(9.2, 1);
    expect(r.firstYearNet).toBeCloseTo(9_050);
  });

  it("liefert keine Amortisation bei negativem Nutzen", () => {
    const r = computeScenario(sanitizeInputs({ revenueEur: 0, oneTimeCostEur: 10_000, runningCostPerYearEur: 1000 }), 0.05);
    expect(r.paybackMonths).toBeNull();
  });

  it("bereinigt ungültige Eingaben und nutzt Standardszenarien", () => {
    const inp = sanitizeInputs({ revenueEur: -5 as number, marginPct: 500, scenarios: [] });
    expect(inp.revenueEur).toBe(0);
    expect(inp.marginPct).toBe(100);
    expect(computeAll(inp).map((s) => s.upliftPct)).toEqual([0.05, 0.1, 0.5]);
  });
});
