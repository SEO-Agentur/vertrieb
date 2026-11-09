"use client";
import { useActionState } from "react";
import Link from "next/link";
import { importAction, type ImportState } from "./actions";

export function ImportWizard() {
  const [state, action, pending] = useActionState<ImportState, FormData>(importAction, { stage: "idle" });
  const dupCount = state.rows?.filter((r) => r.duplicateOf).length ?? 0;
  return (
    <div className="space-y-4">
      {state.stage !== "preview" && (
        <form action={action} className="space-y-3">
          <input type="hidden" name="step" value="preview" />
          <div className="grid gap-3 md:grid-cols-3">
            <label className="block"><span className="label">CSV-Datei (Komma, Semikolon oder Tab)</span><input type="file" name="file" accept=".csv,text/csv,text/plain" className="input" data-testid="import-file" /></label>
            <label className="block"><span className="label">Herkunft</span>
              <select name="source" className="input"><option value="CSV">CSV-Datei</option><option value="SALES_NAVIGATOR">Sales-Navigator-Export</option><option value="CRM">CRM-Export</option><option value="DATA_PROVIDER">Lizenzierter Datenanbieter</option></select>
            </label>
          </div>
          <label className="block"><span className="label">… oder CSV-Inhalt einfügen</span><textarea name="csv" rows={5} className="input font-mono text-xs" data-testid="import-csv" placeholder={"Unternehmen;Branche;Standort;Umsatz;Website;Vorname;Nachname;Position;LinkedIn\nMüller Maschinenbau GmbH;Maschinenbau;Stuttgart;65 Mio;https://…;Thomas;Müller;Geschäftsführer;https://www.linkedin.com/in/…"} /></label>
          <button className="btn-primary" disabled={pending} data-testid="import-preview">{pending ? "Prüfe …" : "Vorschau & Dublettenprüfung"}</button>
        </form>
      )}
      {state.stage === "error" && <p className="rounded bg-red-50 px-3 py-2 text-sm text-red-700">{state.message}</p>}
      {state.stage === "done" && (
        <p className="rounded bg-emerald-50 px-3 py-2 text-sm text-emerald-800" data-testid="import-done">
          {state.message} Neu: {state.created} · Kontakte ergänzt: {state.updated} · Übersprungen: {state.skipped}. <Link className="link" href="/companies?sort=recent">Zu den Unternehmen</Link>
        </p>
      )}
      {state.stage === "preview" && state.rows && (
        <form action={action} className="space-y-3">
          <input type="hidden" name="step" value="commit" />
          <input type="hidden" name="source" value={state.source} />
          <textarea name="csv" defaultValue={state.csv} hidden readOnly />
          <div className="text-sm">Erkannte Spalten: {Object.entries(state.mapping ?? {}).map(([k, v]) => <span key={k} className="mr-2 rounded bg-ink-100 px-1.5 py-0.5 text-xs">{k} ← {v}</span>)}</div>
          {state.unmapped?.length ? <div className="text-xs text-ink-500">Nicht zugeordnet: {state.unmapped.join(", ")}</div> : null}
          <div className="max-h-96 overflow-auto rounded border border-ink-200">
            <table className="table text-xs">
              <thead><tr><th>Zeile</th><th>Unternehmen</th><th>Branche</th><th>Umsatz</th><th>Kontakt</th><th>Prüfung</th></tr></thead>
              <tbody>{state.rows.map((r) => (
                <tr key={r.line} className={r.errors.length ? "bg-red-50" : r.duplicateOf ? "bg-amber-50" : ""}>
                  <td>{r.line}</td><td>{r.company}</td><td>{r.industry}</td><td>{r.revenue != null ? `${(r.revenue / 1e6).toLocaleString("de-DE")} Mio. € (Schätzung)` : "unbekannt"}</td>
                  <td>{r.contact} <span className="text-ink-400">{r.title}</span></td>
                  <td>{r.errors.join("; ")}{r.duplicateOf && <>Dublette: <Link className="link" href={`/companies/${r.duplicateOf.id}`}>{r.duplicateOf.name}</Link></>}{r.contactDuplicate && " · Kontakt existiert"}</td>
                </tr>
              ))}</tbody>
            </table>
          </div>
          {dupCount > 0 && (
            <label className="block text-sm"><span className="label">{dupCount} mögliche Dublette(n)</span>
              <select name="duplicates" className="input w-auto"><option value="skip">Dubletten überspringen</option><option value="attach">Kontakte dem bestehenden Unternehmen zuordnen</option></select>
            </label>
          )}
          <div className="flex gap-2">
            <button className="btn-primary" disabled={pending} data-testid="import-commit">{pending ? "Importiere …" : `${state.rows.length} Zeilen importieren`}</button>
            <a href="/prospecting" className="btn-secondary">Abbrechen</a>
          </div>
          <p className="text-xs text-ink-500">Importierte Umsätze werden als „Schätzung“ gespeichert, bis eine Quelle geprüft wurde. Unternehmen ohne Umsatz kommen in die Prüfwarteschlange.</p>
        </form>
      )}
    </div>
  );
}
