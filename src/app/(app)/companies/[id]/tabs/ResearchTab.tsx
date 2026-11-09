import { db } from "@/lib/db";
import { aiStatus } from "@/lib/ai/provider";
import { Section, InfoStatusBadge, Badge, Field, Empty, NotActivated } from "@/components/ui";
import { SubmitButton } from "@/components/SubmitButton";
import { date } from "@/lib/format";
import { runResearchAction, reviewHypothesisAction, addHypothesisAction, addFactAction, updateFactStatusAction, completeResearchAction } from "../../actions";
import type { TabProps } from "./types";

const ORIGIN: Record<string, string> = { AI: "KI", RULE: "regelbasiert", USER: "manuell", IMPORT: "Import" };

export default async function ResearchTab({ companyId }: TabProps) {
  const [company, facts, hyps] = await Promise.all([
    db.company.findUniqueOrThrow({ where: { id: companyId } }),
    db.companyFact.findMany({ where: { companyId }, orderBy: [{ category: "asc" }, { createdAt: "desc" }] }),
    db.improvementHypothesis.findMany({ where: { companyId }, orderBy: { order: "asc" } }),
  ]);
  const ai = aiStatus();
  const unreviewed = hyps.filter((h) => !h.reviewed).length;
  const groups = facts.reduce<Record<string, typeof facts>>((acc, f) => ((acc[f.category] ??= []).push(f), acc), {});
  return (
    <div className="space-y-6">
      <Section title="Recherche durchführen">
        <div className="flex flex-wrap items-center gap-4">
          <form action={runResearchAction.bind(null, companyId)} className="flex items-center gap-3">
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="useAi" defaultChecked={ai.enabled} disabled={!ai.enabled} /> KI verwenden</label>
            <SubmitButton pendingText="Recherche läuft …" data-testid="run-research">{ai.enabled ? "KI-Recherche starten" : "Regelbasierte Recherche starten"}</SubmitButton>
          </form>
          <span className="text-xs text-ink-500">Zuletzt: {date(company.researchedAt)}</span>
        </div>
        {!ai.enabled && <div className="mt-3"><NotActivated name="KI-Recherche" detail={`${ai.reason} Bis dahin werden regelbasierte Hypothesen aus Branche und Größe abgeleitet – klar als „regelbasiert“ gekennzeichnet.`} /></div>}
        <p className="mt-3 text-xs text-ink-500">Alle Ergebnisse sind Hypothesen und müssen geprüft werden. Es werden keine Umsatzzahlen oder Probleme erfunden; unbekannte Informationen werden als „unbekannt“ geführt.</p>
      </Section>

      <Section title={`Mögliche Verbesserungsthemen (${hyps.length})`} actions={unreviewed ? <Badge tone="amber">{unreviewed} ungeprüft</Badge> : hyps.length ? <Badge tone="green">alle geprüft</Badge> : null}>
        {hyps.length === 0 && <Empty>Noch keine Hypothesen – Recherche starten oder manuell ergänzen.</Empty>}
        <ul className="space-y-3" data-testid="hypotheses">
          {hyps.map((h) => (
            <li key={h.id} className={`rounded-md border p-3 ${h.status === "REJECTED" ? "border-ink-100 opacity-60" : "border-ink-200"}`}>
              <div className="flex flex-wrap items-center gap-2">
                <strong className="text-sm">{h.topic}</strong>
                <InfoStatusBadge status={h.status} />
                <Badge>{ORIGIN[h.origin] ?? h.origin}</Badge>
                {!h.reviewed && <Badge tone="amber">ungeprüft</Badge>}
                {h.visibleInRoom && <Badge tone="blue">in Kundenwelt sichtbar</Badge>}
              </div>
              <p className="mt-1 text-sm text-ink-600">{h.rationale}</p>
              <form action={reviewHypothesisAction.bind(null, companyId, h.id)} className="mt-2 flex flex-wrap gap-1.5">
                {!h.reviewed && <SubmitButton name="action" value="accept" className="btn-secondary btn-sm" data-testid="accept-hypothesis">Als Hypothese übernehmen</SubmitButton>}
                <SubmitButton name="action" value="confirm" className="btn-secondary btn-sm">Vom Kunden bestätigt</SubmitButton>
                <SubmitButton name="action" value="reject" className="btn-secondary btn-sm">Verwerfen</SubmitButton>
                <SubmitButton name="action" value="delete" className="btn-ghost btn-sm">Löschen</SubmitButton>
              </form>
            </li>
          ))}
        </ul>
        <details className="mt-4">
          <summary className="cursor-pointer text-sm text-ink-600">Thema manuell ergänzen</summary>
          <form action={addHypothesisAction.bind(null, companyId)} className="mt-2 grid gap-2 md:grid-cols-3">
            <input name="topic" required placeholder="Thema" className="input" />
            <input name="rationale" required placeholder="Begründung (als Hypothese formulieren)" className="input md:col-span-2" />
            <SubmitButton className="btn-secondary">Hinzufügen</SubmitButton>
          </form>
        </details>
        <form action={completeResearchAction.bind(null, companyId)} className="mt-4">
          <SubmitButton className="btn-primary" data-testid="complete-research">Recherche als geprüft abschließen</SubmitButton>
        </form>
      </Section>

      <Section title="Recherchierte Informationen">
        {facts.length === 0 && <Empty>Noch keine Informationen erfasst.</Empty>}
        {Object.entries(groups).map(([cat, list]) => (
          <div key={cat} className="mb-4">
            <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-ink-500">{cat}</div>
            <table className="table">
              <tbody>
                {list.map((f) => (
                  <tr key={f.id}>
                    <td className="w-48 text-ink-600">{f.label}</td>
                    <td className="whitespace-pre-wrap">{f.value}</td>
                    <td className="w-28"><InfoStatusBadge status={f.status} /> <span className="text-[10px] text-ink-400">{ORIGIN[f.origin]}</span></td>
                    <td className="w-56 text-xs text-ink-500">{f.sourceUrl ? <a className="link" href={f.sourceUrl} target="_blank" rel="noopener noreferrer">{f.sourceName ?? "Quelle"}</a> : f.sourceName ?? "keine Quelle"} · {date(f.retrievedAt)}</td>
                    <td className="w-64">
                      <form action={updateFactStatusAction.bind(null, companyId, f.id)} className="flex gap-1">
                        <select name="status" defaultValue={f.status} className="input py-1 text-xs"><option value="VERIFIED">verifiziert</option><option value="ESTIMATED">Schätzung</option><option value="HYPOTHESIS">Hypothese</option><option value="UNKNOWN">unbekannt</option></select>
                        <SubmitButton name="action" value="status" className="btn-secondary btn-sm">OK</SubmitButton>
                        <SubmitButton name="action" value="delete" className="btn-ghost btn-sm">×</SubmitButton>
                      </form>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))}
      </Section>

      <Section title="Information mit Quelle erfassen">
        <form action={addFactAction.bind(null, companyId)} className="grid gap-3 md:grid-cols-4">
          <Field label="Kategorie"><input name="category" list="factcats" className="input" defaultValue="Nachricht" /><datalist id="factcats">{["Umsatz", "Nachricht", "Technologie", "Produkte", "Märkte", "Eigentümer", "Vertrieb", "Allgemein"].map((c) => <option key={c} value={c} />)}</datalist></Field>
          <Field label="Bezeichnung"><input name="label" required className="input" /></Field>
          <Field label="Wert / Inhalt"><input name="value" required className="input" /></Field>
          <Field label="Status"><select name="status" className="input"><option value="VERIFIED">verifiziert</option><option value="ESTIMATED">Schätzung</option><option value="HYPOTHESIS">Hypothese</option><option value="UNKNOWN">unbekannt</option></select></Field>
          <Field label="Quelle (Name)"><input name="sourceName" className="input" /></Field>
          <Field label="Quelle (URL)"><input name="sourceUrl" type="url" className="input" /></Field>
          <Field label="Abrufdatum"><input name="retrievedAt" type="date" className="input" /></Field>
          <div className="flex items-end"><SubmitButton className="btn-secondary w-full">Erfassen</SubmitButton></div>
        </form>
      </Section>
    </div>
  );
}
