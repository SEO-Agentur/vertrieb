"use client";
import { useMemo, useRef, useState } from "react";
import { CALCULATOR_DISCLAIMER, computeAll, sanitizeInputs, type CalculatorInputs } from "@/lib/calculator";

const eur = (v: number) => new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(v);
const pct = (v: number) => `${v.toLocaleString("de-DE", { maximumFractionDigits: 3 })} %`;

function NumInput({ label, value, onChange, suffix, testid, hint }: { label: string; value: number; onChange: (n: number) => void; suffix?: string; testid?: string; hint?: string }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs uppercase tracking-wider text-ink-500">{label}</span>
      <span className="flex items-center border-b border-ink-300 focus-within:border-[var(--accent)]">
        <input
          data-testid={testid}
          type="number"
          inputMode="decimal"
          min={0}
          step="any"
          value={Number.isFinite(value) ? value : 0}
          onChange={(e) => onChange(e.target.value === "" ? 0 : Number(e.target.value))}
          className="w-full bg-transparent py-2 text-lg tabular-nums text-ink-950 outline-none"
        />
        {suffix && <span className="ml-2 text-sm text-ink-400">{suffix}</span>}
      </span>
      {hint && <span className="mt-1 block text-xs text-ink-400">{hint}</span>}
    </label>
  );
}

/** Interaktiver Potenzialrechner der Kundenwelt. Alle Werte sind editierbar; keine Ergebniszusage. */
export function PotentialCalculator({ initial, onUse }: { initial: CalculatorInputs; onUse?: () => void }) {
  const [inp, setInp] = useState<CalculatorInputs>(initial);
  const [scenarioText, setScenarioText] = useState(initial.scenarios.map((s) => String(s).replace(".", ",")).join("; "));
  const [advanced, setAdvanced] = useState(false);
  const used = useRef(false);
  const set = <K extends keyof CalculatorInputs>(k: K, v: CalculatorInputs[K]) => {
    if (!used.current) { used.current = true; onUse?.(); }
    setInp((p) => sanitizeInputs({ ...p, [k]: v, ...(k === "revenueEur" ? { revenueIsVerified: false } : {}) }));
  };
  const results = useMemo(() => computeAll(inp), [inp]);
  const revenueEdited = inp.revenueEur !== initial.revenueEur;

  return (
    <div>
      <div className="grid gap-8 md:grid-cols-3">
        <div className="md:col-span-1">
          <NumInput
            label="Jahresumsatz"
            value={inp.revenueEur}
            onChange={(n) => set("revenueEur", n)}
            suffix="€"
            testid="calc-revenue"
            hint={inp.revenueEur === 0 ? "Bitte tragen Sie Ihren Jahresumsatz ein." : initial.revenueIsVerified && !revenueEdited ? "Öffentlich verfügbare Angabe – gerne anpassen." : revenueEdited ? "Ihre eigene Angabe." : "Schätzung – bitte eigene Zahl eintragen."}
          />
        </div>
        <NumInput label="Deckungsbeitragsmarge" value={inp.marginPct} onChange={(n) => set("marginPct", n)} suffix="%" hint="Anteil des Mehrumsatzes, der als Deckungsbeitrag verbleibt." />
        <label className="block">
          <span className="mb-1 block text-xs uppercase tracking-wider text-ink-500">Szenarien (Umsatzsteigerung in %)</span>
          <input
            value={scenarioText}
            onChange={(e) => {
              setScenarioText(e.target.value);
              const list = e.target.value.split(/[;\s]+/).map((s) => Number(s.replace(",", "."))).filter((n) => Number.isFinite(n) && n > 0);
              if (list.length) set("scenarios", list);
            }}
            className="w-full border-b border-ink-300 bg-transparent py-2 text-lg text-ink-950 outline-none focus:border-[var(--accent)]"
          />
          <span className="mt-1 block text-xs text-ink-400">z. B. 0,05; 0,1; 0,5</span>
        </label>
      </div>

      <button type="button" onClick={() => setAdvanced((a) => !a)} className="mt-6 text-sm text-ink-600 underline decoration-ink-300 underline-offset-4">
        {advanced ? "Weniger Annahmen anzeigen" : "Einsparungen und Kosten berücksichtigen"}
      </button>
      {advanced && (
        <div className="mt-6 grid gap-8 md:grid-cols-3">
          <NumInput label="Prozesskosten-Einsparung / Jahr" value={inp.processSavingsEur} onChange={(n) => set("processSavingsEur", n)} suffix="€" />
          <NumInput label="Eingesparte Stunden / Monat" value={inp.hoursSavedPerMonth} onChange={(n) => set("hoursSavedPerMonth", n)} suffix="h" />
          <NumInput label="Kosten je Stunde" value={inp.hourlyCostEur} onChange={(n) => set("hourlyCostEur", n)} suffix="€" />
          <NumInput label="Einmalige Projektkosten" value={inp.oneTimeCostEur} onChange={(n) => set("oneTimeCostEur", n)} suffix="€" />
          <NumInput label="Laufende Kosten / Jahr" value={inp.runningCostPerYearEur} onChange={(n) => set("runningCostPerYearEur", n)} suffix="€" />
        </div>
      )}

      <div className="mt-10 grid gap-px overflow-hidden rounded-sm bg-ink-200 md:grid-cols-3" data-testid="calc-results">
        {results.map((r) => (
          <div key={r.upliftPct} className="bg-white p-6">
            <div className="text-xs uppercase tracking-wider text-ink-500">+{pct(r.upliftPct)} Umsatz</div>
            <div className="mt-2 font-serif text-3xl tabular-nums text-ink-950">{eur(r.additionalRevenue)}</div>
            <div className="text-xs text-ink-500">zusätzlicher Jahresumsatz</div>
            <dl className="mt-4 space-y-1 text-sm">
              <div className="flex justify-between"><dt className="text-ink-500">Deckungsbeitrag</dt><dd className="tabular-nums">{eur(r.additionalContribution)}</dd></div>
              {r.savings > 0 && <div className="flex justify-between"><dt className="text-ink-500">Einsparungen</dt><dd className="tabular-nums">{eur(r.savings)}</dd></div>}
              {(inp.runningCostPerYearEur > 0 || inp.oneTimeCostEur > 0) && (
                <>
                  <div className="flex justify-between"><dt className="text-ink-500">Netto-Nutzen / Jahr</dt><dd className="tabular-nums">{eur(r.netAnnualBenefit)}</dd></div>
                  <div className="flex justify-between"><dt className="text-ink-500">Amortisation</dt><dd className="tabular-nums">{r.paybackMonths == null ? "nicht erreicht" : `${r.paybackMonths.toLocaleString("de-DE")} Monate`}</dd></div>
                </>
              )}
            </dl>
          </div>
        ))}
      </div>
      <p className="mt-4 text-xs leading-relaxed text-ink-500">{CALCULATOR_DISCLAIMER}</p>
    </div>
  );
}
