import { db } from "@/lib/db";
import { Section, Badge, ScoreBadge } from "@/components/ui";
import { SubmitButton } from "@/components/SubmitButton";
import { qualificationLabel, dateTime, eur } from "@/lib/format";
import { setQualificationAction, rescoreAction } from "../../actions";
import type { ScoreResult } from "@/lib/scoring";
import type { TabProps } from "./types";

export default async function QualificationTab({ companyId }: TabProps) {
  const c = await db.company.findUniqueOrThrow({ where: { id: companyId } });
  const s = c.scoreBreakdown as unknown as ScoreResult | null;
  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <div className="lg:col-span-2">
        <Section title="Lead-Score – nachvollziehbare Bewertung" actions={<form action={rescoreAction.bind(null, companyId)}><SubmitButton className="btn-secondary btn-sm">Neu berechnen</SubmitButton></form>}>
          {!s ? <p className="text-sm text-ink-500">Noch nicht bewertet.</p> : (
            <>
              <div className="mb-4 flex items-center gap-3">
                <span className="text-4xl font-semibold tabular-nums" data-testid="score-total">{s.total}</span>
                <Badge tone={s.band === "HOT" ? "green" : s.band === "QUALIFIED" ? "blue" : "gray"}>{s.band === "HOT" ? "Top-Priorität" : s.band === "QUALIFIED" ? "qualifizierbar" : "niedrige Priorität"}</Badge>
                <span className="text-xs text-ink-400">berechnet {dateTime(c.scoredAt)}</span>
              </div>
              {s.warnings.length > 0 && <div className="mb-4 rounded bg-amber-50 px-3 py-2 text-xs text-amber-900">Hinweise: {s.warnings.join(" · ")}</div>}
              <div className="space-y-4">
                {s.parts.map((p) => (
                  <div key={p.key}>
                    <div className="flex items-center justify-between text-sm"><span className="font-medium">{p.label}</span><span className="tabular-nums text-ink-500">{p.value}/100 · Gewicht {p.weight}</span></div>
                    <div className="mt-1 h-1.5 rounded bg-ink-100"><div className="h-1.5 rounded bg-ink-800" style={{ width: `${p.value}%` }} /></div>
                    <ul className="mt-1 list-inside list-disc text-xs text-ink-500">{p.reasons.map((r, i) => <li key={i}>{r}</li>)}</ul>
                  </div>
                ))}
              </div>
              <p className="mt-4 text-xs text-ink-400">Gewichtungen und Schwellenwerte: Einstellungen → Lead-Scoring.</p>
            </>
          )}
        </Section>
      </div>
      <div className="space-y-6">
        <Section title="Qualifizierungsentscheidung">
          <p className="mb-3 text-sm">Aktuell: <Badge>{qualificationLabel[c.qualificationStatus]}</Badge> <ScoreBadge score={c.score} /></p>
          {c.revenueEur == null && <p className="mb-3 rounded bg-amber-50 px-3 py-2 text-xs text-amber-900">Umsatz unbekannt – das Unternehmen liegt in der Prüfwarteschlange. Bitte Umsatz recherchieren (Übersicht → Umsatz) oder disqualifizieren.</p>}
          {c.revenueEur != null && <p className="mb-3 text-xs text-ink-500">0,05 % des Umsatzes entsprechen rechnerisch {eur(c.revenueEur * 0.0005)} – Umsatz, kein Gewinn.</p>}
          <form action={setQualificationAction.bind(null, companyId)} className="space-y-2">
            <select name="status" defaultValue={c.qualificationStatus} className="input" data-testid="qualification-status">
              {Object.entries(qualificationLabel).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
            <textarea name="note" rows={3} defaultValue={c.qualificationNote ?? ""} placeholder="Begründung" className="input" />
            <SubmitButton className="btn-primary w-full" data-testid="save-qualification">Entscheidung speichern</SubmitButton>
          </form>
        </Section>
      </div>
    </div>
  );
}
