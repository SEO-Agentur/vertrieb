import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { getSetting } from "@/lib/settings";
import { PageHeader, Section, Field, Empty, NotActivated, Badge } from "@/components/ui";
import { SubmitButton } from "@/components/SubmitButton";
import { dateTime } from "@/lib/format";
import { roleLabels } from "@/lib/normalize";
import { ImportWizard } from "./ImportWizard";
import { saveSearchAction, deleteSearchAction, markSearchRunAction } from "./actions";

export const metadata = { title: "Prospecting" };

export default async function ProspectingPage() {
  const user = await requireUser();
  const [searches, icp, recent, noOutreach] = await Promise.all([
    db.savedSearch.findMany({ where: { tenantId: user.tenantId }, orderBy: { createdAt: "desc" } }),
    getSetting(user.tenantId, "icp"),
    db.company.findMany({ where: { tenantId: user.tenantId }, orderBy: { createdAt: "desc" }, take: 8, select: { id: true, name: true, source: true, createdAt: true } }),
    db.contact.count({ where: { tenantId: user.tenantId, outreachStatus: "NONE", company: { qualificationStatus: "QUALIFIED" } } }),
  ]);
  return (
    <div className="space-y-6">
      <PageHeader title="Prospecting" subtitle="LinkedIn Sales Navigator ist der Ausgangspunkt – die Übernahme erfolgt manuell, per CSV oder über autorisierte Integrationen." />
      <NotActivated name="LinkedIn-API" detail="Es gibt keine automatisierte LinkedIn-Anbindung, keine Scraper und keinen automatischen Nachrichtenversand. Profile werden manuell oder per CSV übernommen; Nachrichten bereiten Sie hier vor und versenden sie selbst." />
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Section title="Import (Unternehmen & Ansprechpartner)"><ImportWizard /></Section>
          <Section title="Gespeicherte Sales-Navigator-Suchen">
            {searches.length === 0 && <Empty>Noch keine Suchkonfiguration gespeichert.</Empty>}
            <ul className="space-y-3">
              {searches.map((s) => {
                const f = s.filters as Record<string, string>;
                return (
                  <li key={s.id} className="rounded-md border border-ink-200 p-3 text-sm">
                    <div className="flex flex-wrap items-center gap-2">
                      <strong>{s.name}</strong>
                      {s.lastRunAt && <span className="text-xs text-ink-400">zuletzt ausgeführt {dateTime(s.lastRunAt)}</span>}
                      <span className="ml-auto flex gap-2">
                        {s.salesNavUrl && <a href={s.salesNavUrl} target="_blank" rel="noopener noreferrer" className="btn-secondary btn-sm">In Sales Navigator öffnen ↗</a>}
                        <form action={markSearchRunAction.bind(null, s.id)}><SubmitButton className="btn-ghost btn-sm">als ausgeführt markieren</SubmitButton></form>
                        <form action={deleteSearchAction.bind(null, s.id)}><SubmitButton className="btn-ghost btn-sm" confirm="Suche löschen?">×</SubmitButton></form>
                      </span>
                    </div>
                    <div className="mt-1 flex flex-wrap gap-1">{Object.entries(f).filter(([, v]) => v).map(([k, v]) => <Badge key={k}>{k}: {v}</Badge>)}</div>
                    {s.notes && <p className="mt-1 text-xs text-ink-500">{s.notes}</p>}
                  </li>
                );
              })}
            </ul>
            <details className="mt-4">
              <summary className="cursor-pointer text-sm text-ink-600">Neue Suchkonfiguration</summary>
              <form action={saveSearchAction} className="mt-3 grid gap-3 md:grid-cols-2">
                <Field label="Name"><input name="name" required className="input" placeholder="Maschinenbau BW 20–200 Mio." /></Field>
                <Field label="Sales-Navigator-Such-URL"><input name="salesNavUrl" type="url" className="input" /></Field>
                <Field label="Branchen"><input name="industries" defaultValue={icp.preferredIndustries.slice(0, 3).join(", ")} className="input" /></Field>
                <Field label="Standorte"><input name="locations" className="input" placeholder="Baden-Württemberg, Bayern" /></Field>
                <Field label="Umsatz von (Mio. €)"><input name="revenueMin" defaultValue={icp.preferredRevenueMinEur / 1e6} className="input" /></Field>
                <Field label="Umsatz bis (Mio. €)"><input name="revenueMax" defaultValue={icp.preferredRevenueMaxEur / 1e6} className="input" /></Field>
                <Field label="Unternehmensgröße (Mitarbeiter)"><input name="employees" className="input" placeholder="201–500" /></Field>
                <Field label="Ansprechpartnerrollen"><input name="roles" defaultValue={icp.targetRoles.map((r) => roleLabels[r] ?? r).join(", ")} className="input" /></Field>
                <Field label="Stichworte"><input name="keywords" className="input" /></Field>
                <Field label="Notizen"><input name="notes" className="input" /></Field>
                <div><SubmitButton className="btn-secondary">Speichern</SubmitButton></div>
              </form>
            </details>
          </Section>
        </div>
        <div className="space-y-6">
          <Section title="Arbeitsablauf">
            <ol className="list-inside list-decimal space-y-1 text-sm text-ink-700">
              <li>Gespeicherte Suche in Sales Navigator öffnen</li>
              <li>Passende Accounts/Leads als CSV exportieren (soweit lizenziert) oder manuell anlegen</li>
              <li>Hier importieren – Dublettenprüfung erfolgt automatisch</li>
              <li>Unternehmen in der <a className="link" href="/qualification">Qualifizierung</a> prüfen</li>
              <li>Recherche, Kundenwelt und Nachricht vorbereiten</li>
            </ol>
          </Section>
          <Section title="Status">
            <p className="text-sm">{noOutreach} qualifizierte Kontakte ohne Ansprache</p>
          </Section>
          <Section title="Zuletzt hinzugefügt">
            <ul className="space-y-1 text-sm">{recent.map((c) => <li key={c.id} className="flex justify-between gap-2"><a className="hover:underline" href={`/companies/${c.id}`}>{c.name}</a><Badge>{c.source}</Badge></li>)}</ul>
          </Section>
        </div>
      </div>
    </div>
  );
}
