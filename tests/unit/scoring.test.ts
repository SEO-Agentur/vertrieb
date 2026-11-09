import { describe, it, expect } from "vitest";
import { computeScore } from "@/lib/scoring";
import { DEFAULT_ICP, DEFAULT_SCORING } from "@/lib/settings";

const base = { contactRoles: [], engagement: { roomVisits: 0, sectionViews: 0, callRequests: 0, meetings: 0, replies: 0 }, hypothesesCount: 0 };

describe("Lead-Scoring", () => {
  it("bewertet passenden Maschinenbauer höher als Pharma-Unternehmen", () => {
    const fit = computeScore({ ...base, industry: "Maschinenbau", revenueEur: 65e6, revenueStatus: "VERIFIED", country: "DE", salesDependency: 4, contactRoles: ["CEO"] }, DEFAULT_ICP, DEFAULT_SCORING);
    const misfit = computeScore({ ...base, industry: "Pharma", revenueEur: 65e6, country: "DE" }, DEFAULT_ICP, DEFAULT_SCORING);
    expect(fit.total).toBeGreaterThan(misfit.total);
    expect(fit.parts.find((p) => p.key === "icpFit")!.reasons.join()).toContain("Bevorzugte Branche");
  });

  it("weist unbekannten Umsatz als Warnung aus statt ihn zu erfinden", () => {
    const r = computeScore({ ...base, industry: "Maschinenbau" }, DEFAULT_ICP, DEFAULT_SCORING);
    expect(r.warnings.join()).toContain("Umsatz unbekannt");
  });

  it("bestraft Umsatz unter Mindestgrenze", () => {
    const small = computeScore({ ...base, industry: "Maschinenbau", revenueEur: 5e6 }, DEFAULT_ICP, DEFAULT_SCORING);
    const ok = computeScore({ ...base, industry: "Maschinenbau", revenueEur: 50e6 }, DEFAULT_ICP, DEFAULT_SCORING);
    expect(small.total).toBeLessThan(ok.total);
  });

  it("Engagement erhöht den Score", () => {
    const a = computeScore({ ...base, industry: "Maschinenbau", revenueEur: 65e6 }, DEFAULT_ICP, DEFAULT_SCORING);
    const b = computeScore({ ...base, industry: "Maschinenbau", revenueEur: 65e6, engagement: { roomVisits: 2, sectionViews: 5, callRequests: 1, meetings: 1, replies: 1 } }, DEFAULT_ICP, DEFAULT_SCORING);
    expect(b.total).toBeGreaterThan(a.total);
  });

  it("Gewichtungen sind konfigurierbar", () => {
    const onlyEngagement = { ...DEFAULT_SCORING, weights: { icpFit: 0, salesPotential: 0, digitalPotential: 0, economicPotential: 0, feasibility: 0, engagement: 100 } };
    const r = computeScore({ ...base, industry: "Maschinenbau", revenueEur: 65e6 }, DEFAULT_ICP, onlyEngagement);
    expect(r.total).toBe(0);
  });
});
