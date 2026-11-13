"use client";
import { useMemo, useState } from "react";
import { computeAll, sanitizeInputs, CALCULATOR_DISCLAIMER, DEFAULT_CALCULATOR } from "@/lib/calculator";

const eur = (v: number) => new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(v);
const parse = (s: string) => Number(s.replace(/\./g, "").replace(",", ".")) || 0;

function NumField({ label, value, onChange, suffix, hint }: { label: string; value: string; onChange: (v: string) => void; suffix: string; hint?: string }) {
  return (
    <label className="block text-sm font-medium text-site-navy">
      {label}
      <span className="mt-1 flex items-center rounded border border-site-line bg-white focus-within:border-site-blue focus-within:ring-2 focus-within:ring-site-blue/20">
        <input inputMode="decimal" value={value} onChange={(e) => onChange(e.target.value)} className="w-full rounded bg-transparent px-3 py-2.5 text-sm outline-none" />
        <span className="pr-3 text-xs text-site-text">{suffix}</span>
      </span>
      {hint && <span className="mt-1 block text-xs font-normal text-site-text">{hint}</span>}
    </label>
  );
}

export function SiteCalculator() {
  const [v, setV] = useState({ revenue: "100.000.000", scenarios: "0,05; 0,1; 0,5", margin: "30", hours: "0", hourly: "65", savings: "0", onetime: "0", running: "0" });
  const set = (k: keyof typeof v) => (x: string) => setV((s) => ({ ...s, [k]: x }));
  const inputs = useMemo(() => sanitizeInputs({
    revenueEur: parse(v.revenue), marginPct: parse(v.margin), hoursSavedPerMonth: parse(v.hours), hourlyCostEur: parse(v.hourly),
    processSavingsEur: parse(v.savings), oneTimeCostEur: parse(v.onetime), runningCostPerYearEur: parse(v.running),
    scenarios: v.scenarios.split(/[;\s]+/).map((s) => Number(s.replace(",", "."))).filter((n) => n > 0),
  }), [v]);
  const results = computeAll(inputs.scenarios.length ? inputs : { ...inputs, scenarios: DEFAULT_CALCULATOR.scenarios });
  const max = Math.max(1, ...results.map((r) => r.additionalRevenue));
  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_1.2fr]">
      <div className="grid gap-4 rounded-lg border border-site-line bg-site-sky p-6 sm:grid-cols-2">
        <div className="sm:col-span-2"><NumField label="Jahresumsatz" value={v.revenue} onChange={set("revenue")} suffix="€" /></div>
        <div className="sm:col-span-2"><NumField label="Szenarien Umsatzsteigerung" value={v.scenarios} onChange={set("scenarios")} suffix="%" hint="mehrere Werte mit Semikolon trennen" /></div>
        <NumField label="Deckungsbeitragsmarge" value={v.margin} onChange={set("margin")} suffix="%" />
        <NumField label="Eingesparte Stunden / Monat" value={v.hours} onChange={set("hours")} suffix="h" />
        <NumField label="Kosten je Stunde" value={v.hourly} onChange={set("hourly")} suffix="€" />
        <NumField label="Sonstige Einsparung / Jahr" value={v.savings} onChange={set("savings")} suffix="€" />
        <NumField label="Einmalige Projektkosten" value={v.onetime} onChange={set("onetime")} suffix="€" />
        <NumField label="Laufende Kosten / Jahr" value={v.running} onChange={set("running")} suffix="€" />
      </div>
      <div>
        <div className="overflow-x-auto rounded-lg border border-site-line" data-testid="site-calc-results">
          <table className="w-full text-right text-sm">
            <thead className="bg-site-navy text-white"><tr><th className="px-3 py-3 text-left font-semibold">Szenario</th><th className="px-3 py-3 font-semibold">Zusatzumsatz</th><th className="px-3 py-3 font-semibold">Deckungsbeitrag</th><th className="px-3 py-3 font-semibold">Netto / Jahr</th><th className="px-3 py-3 font-semibold">Amortisation</th></tr></thead>
            <tbody className="divide-y divide-site-line bg-white">
              {results.map((r) => (
                <tr key={r.upliftPct}>
                  <td className="px-3 py-3 text-left font-semibold text-site-navy">+ {r.upliftPct.toLocaleString("de-DE")} %</td>
                  <td className="px-3 py-3 tabular-nums">{eur(r.additionalRevenue)}</td>
                  <td className="px-3 py-3 tabular-nums">{eur(r.additionalContribution)}</td>
                  <td className="px-3 py-3 font-semibold tabular-nums text-site-navy">{eur(r.netAnnualBenefit)}</td>
                  <td className="px-3 py-3 tabular-nums">{r.paybackMonths == null ? "–" : r.paybackMonths === 0 ? "sofort" : `${r.paybackMonths.toLocaleString("de-DE")} Mon.`}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="mt-6 space-y-3" aria-hidden>
          {results.map((r) => (
            <div key={r.upliftPct} className="flex items-center gap-3 text-xs">
              <span className="w-14 text-site-text">+{r.upliftPct.toLocaleString("de-DE")} %</span>
              <span className="h-3 rounded bg-site-blue transition-all" style={{ width: `${Math.max(2, (r.additionalRevenue / max) * 100)}%` }} />
            </div>
          ))}
        </div>
        <p className="mt-6 rounded border-l-4 border-site-blue bg-site-sky p-4 text-xs leading-relaxed text-site-text">{CALCULATOR_DISCLAIMER}</p>
      </div>
    </div>
  );
}
