"use client";
import { useMemo, useState } from "react";
import { computeAll, sanitizeInputs, CALCULATOR_DISCLAIMER, type CalculatorInputs } from "@/lib/calculator";
import { saveAnalysis } from "@/app/(app)/analyses/actions";
import { SubmitButton } from "@/components/SubmitButton";

const eur = (v: number) => new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(v);

const FIELDS: { key: keyof CalculatorInputs; label: string; hint?: string; step?: string }[] = [
  { key: "revenueEur", label: "Jahresumsatz (€)" },
  { key: "marginPct", label: "Deckungsbeitragsmarge (%)", step: "0.1" },
  { key: "processSavingsEur", label: "Prozesskosteneinsparung / Jahr (€)" },
  { key: "hoursSavedPerMonth", label: "Eingesparte Arbeitsstunden / Monat", step: "0.5" },
  { key: "hourlyCostEur", label: "Kosten je Arbeitsstunde (€)" },
  { key: "oneTimeCostEur", label: "Einmalige Projektkosten (€)" },
  { key: "runningCostPerYearEur", label: "Laufende Kosten / Jahr (€)" },
];

export function EconomicsEditor({ companyId, analysis, defaults }: {
  companyId: string;
  analysis?: { id: string; name: string; inputs: CalculatorInputs; assumptions: string | null; shareWithClient: boolean };
  defaults: CalculatorInputs;
}) {
  const [inp, setInp] = useState<CalculatorInputs>(analysis?.inputs ?? defaults);
  const [scenarioText, setScenarioText] = useState((analysis?.inputs ?? defaults).scenarios.join("; ").replace(/\./g, ","));
  const clean = useMemo(() => sanitizeInputs({ ...inp, scenarios: scenarioText.split(/[;\s]+/).map((s) => Number(s.replace(",", "."))).filter((n) => Number.isFinite(n) && n > 0) }), [inp, scenarioText]);
  const results = computeAll(clean);

  return (
    <form action={saveAnalysis} className="space-y-4">
      <input type="hidden" name="companyId" value={companyId} />
      {analysis && <input type="hidden" name="id" value={analysis.id} />}
      <input type="hidden" name="inputs" value={JSON.stringify(clean)} />
      <div className="grid gap-3 md:grid-cols-4">
        <label className="md:col-span-2"><span className="label">Bezeichnung</span><input name="name" className="input" defaultValue={analysis?.name ?? "Wirtschaftlichkeitsanalyse"} /></label>
        <label className="md:col-span-2"><span className="label">Szenarien Umsatzsteigerung (%; getrennt durch ;)</span><input className="input" value={scenarioText} onChange={(e) => setScenarioText(e.target.value)} data-testid="analysis-scenarios" /></label>
        {FIELDS.map((f) => (
          <label key={f.key}>
            <span className="label">{f.label}</span>
            <input
              type="number" min={0} step={f.step ?? "1"} className="input" data-testid={`analysis-${f.key}`}
              value={String(inp[f.key] ?? "")}
              onChange={(e) => setInp((p) => ({ ...p, [f.key]: e.target.value === "" ? 0 : Number(e.target.value) }))}
            />
          </label>
        ))}
        <label className="flex items-end gap-2 pb-2 text-sm"><input type="checkbox" checked={inp.revenueIsVerified} onChange={(e) => setInp((p) => ({ ...p, revenueIsVerified: e.target.checked }))} /> Umsatz verifiziert</label>
      </div>
      {!clean.revenueIsVerified && clean.revenueEur > 0 && <p className="text-xs text-amber-700">Hinweis: Der Umsatz ist nicht verifiziert und wird als Annahme behandelt.</p>}
      <div className="overflow-x-auto">
        <table className="table" data-testid="analysis-results">
          <thead><tr><th>Szenario</th><th>Zusatzumsatz</th><th>Zus. Deckungsbeitrag</th><th>Einsparungen</th><th>Nutzen / Jahr</th><th>Netto nach lfd. Kosten</th><th>Amortisation</th><th>Ergebnis Jahr 1</th></tr></thead>
          <tbody>
            {results.map((r) => (
              <tr key={r.upliftPct}>
                <td>+{r.upliftPct.toLocaleString("de-DE")} %</td>
                <td>{eur(r.additionalRevenue)}</td>
                <td>{eur(r.additionalContribution)}</td>
                <td>{eur(r.savings)}</td>
                <td>{eur(r.annualBenefit)}</td>
                <td className={r.netAnnualBenefit < 0 ? "text-red-700" : ""}>{eur(r.netAnnualBenefit)}</td>
                <td>{r.paybackMonths == null ? "keine" : `${r.paybackMonths.toLocaleString("de-DE")} Monate`}</td>
                <td className={r.firstYearNet < 0 ? "text-red-700" : ""}>{eur(r.firstYearNet)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <label className="block"><span className="label">Annahmen (Pflicht – werden offengelegt)</span>
        <textarea name="assumptions" required rows={3} className="input" defaultValue={analysis?.assumptions ?? ""} placeholder="z.B. Marge laut Gespräch ca. 30 %, 2 Innendienst-Mitarbeiter sparen je 10 h/Monat bei der Angebotserstellung …" data-testid="analysis-assumptions" />
      </label>
      <p className="text-xs text-ink-500">{CALCULATOR_DISCLAIMER}</p>
      <div className="flex items-center gap-4">
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="shareWithClient" defaultChecked={analysis?.shareWithClient} /> In Kundenwelt freigeben</label>
        <SubmitButton pendingText="Speichere …" data-testid="save-analysis">{analysis ? "Analyse aktualisieren" : "Analyse speichern"}</SubmitButton>
      </div>
    </form>
  );
}
