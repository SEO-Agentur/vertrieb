import type { Company } from "@prisma/client";
import { Field } from "@/components/ui";
import { SubmitButton } from "@/components/SubmitButton";

const STATUS_OPTS = [
  ["VERIFIED", "verifiziert (Quelle)"],
  ["ESTIMATED", "plausible Schätzung"],
  ["HYPOTHESIS", "Hypothese"],
  ["UNKNOWN", "unbekannt"],
];

function Scale({ name, label, value, hint }: { name: string; label: string; value?: number | null; hint: string }) {
  return (
    <Field label={label} hint={hint}>
      <select name={name} defaultValue={value ?? ""} className="input">
        <option value="">unbekannt</option>
        {[1, 2, 3, 4, 5].map((n) => <option key={n} value={n}>{n}</option>)}
      </select>
    </Field>
  );
}

export function CompanyForm({ action, company, industries, submitLabel }: { action: (f: FormData) => Promise<void>; company?: Company | null; industries: string[]; submitLabel: string }) {
  const c = company;
  return (
    <form action={action} className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        <Field label="Unternehmensname *"><input name="name" required defaultValue={c?.name} className="input" data-testid="company-name-input" /></Field>
        <Field label="Website"><input name="website" defaultValue={c?.website ?? ""} className="input" placeholder="https://" /></Field>
        <Field label="LinkedIn-Unternehmensprofil"><input name="linkedinUrl" defaultValue={c?.linkedinUrl ?? ""} className="input" placeholder="https://www.linkedin.com/company/…" /></Field>
        <Field label="Branche">
          <input name="industry" list="industries" defaultValue={c?.industry ?? ""} className="input" data-testid="company-industry" />
          <datalist id="industries">{industries.map((i) => <option key={i} value={i} />)}</datalist>
        </Field>
        <Field label="Standort"><input name="location" defaultValue={c?.location ?? ""} className="input" /></Field>
        <Field label="Land (ISO)"><input name="country" defaultValue={c?.country ?? "DE"} className="input" maxLength={2} /></Field>
      </div>
      <fieldset className="rounded-md border border-ink-200 p-4">
        <legend className="px-1 text-xs font-semibold text-ink-500">Umsatz – nur belegte Zahlen als „verifiziert“ kennzeichnen</legend>
        <div className="grid gap-4 md:grid-cols-4">
          <Field label="Jahresumsatz (Mio. €)" hint="leer = unbekannt → Prüfwarteschlange"><input name="revenueMio" inputMode="decimal" defaultValue={c?.revenueEur != null ? String(c.revenueEur / 1e6).replace(".", ",") : ""} className="input" data-testid="company-revenue" /></Field>
          <Field label="Geschäftsjahr"><input name="revenueYear" inputMode="numeric" defaultValue={c?.revenueYear ?? ""} className="input" /></Field>
          <Field label="Verifizierungsstatus">
            <select name="revenueStatus" defaultValue={c?.revenueStatus ?? "ESTIMATED"} className="input" data-testid="company-revenue-status">{STATUS_OPTS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select>
          </Field>
          <Field label="Umsatzquelle"><input name="revenueSource" defaultValue={c?.revenueSource ?? ""} className="input" placeholder="z.B. Bundesanzeiger, JA 2024" /></Field>
        </div>
      </fieldset>
      <div className="grid gap-4 md:grid-cols-4">
        <Field label="Mitarbeiterzahl"><input name="employees" inputMode="numeric" defaultValue={c?.employees ?? ""} className="input" /></Field>
        <Field label="Status Mitarbeiterzahl">
          <select name="employeesStatus" defaultValue={c?.employeesStatus ?? "ESTIMATED"} className="input">{STATUS_OPTS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select>
        </Field>
        <Field label="Geschätzte Vertriebsgröße (Personen)"><input name="salesTeamSize" inputMode="numeric" defaultValue={c?.salesTeamSize ?? ""} className="input" /></Field>
        <Field label="Eigentümerstruktur"><input name="ownership" defaultValue={c?.ownership ?? ""} className="input" placeholder="z.B. inhabergeführt" /></Field>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Produkte und Dienstleistungen"><textarea name="products" rows={2} defaultValue={c?.products ?? ""} className="input" /></Field>
        <Field label="Märkte"><textarea name="markets" rows={2} defaultValue={c?.markets ?? ""} className="input" /></Field>
        <Field label="Geschäftsmodell"><textarea name="businessModel" rows={2} defaultValue={c?.businessModel ?? ""} className="input" /></Field>
        <Field label="Eingesetzte Technologien (CRM, ERP …)"><textarea name="technologies" rows={2} defaultValue={c?.technologies ?? ""} className="input" /></Field>
        <Field label="Beschreibung"><textarea name="description" rows={2} defaultValue={c?.description ?? ""} className="input" /></Field>
        <Field label="Interne Notizen (nie in der Kundenwelt sichtbar)"><textarea name="notes" rows={2} defaultValue={c?.notes ?? ""} className="input" /></Field>
      </div>
      <fieldset className="rounded-md border border-ink-200 p-4">
        <legend className="px-1 text-xs font-semibold text-ink-500">Bewertungsgrundlagen (1 = niedrig, 5 = hoch)</legend>
        <div className="grid gap-4 md:grid-cols-4">
          <Scale name="salesDependency" label="Vertriebsabhängigkeit" value={c?.salesDependency} hint="Bedeutung des aktiven Vertriebs" />
          <Scale name="digitalSignals" label="Hinweise auf Optimierungspotenzial" value={c?.digitalSignals} hint="z.B. veraltete Website, manuelle Prozesse" />
          <Scale name="regulatoryHurdle" label="Regulatorische Hürden" value={c?.regulatoryHurdle} hint="hoch = schwerer umsetzbar" />
          <Scale name="procurementEffort" label="Beschaffungs-/Entscheidungsaufwand" value={c?.procurementEffort} hint="hoch = längere Wege" />
        </div>
      </fieldset>
      <Field label="Sales-Navigator-Referenz (Lead-/Account-URL oder Such-Referenz)"><input name="salesNavRef" defaultValue={c?.salesNavRef ?? ""} className="input" /></Field>
      <SubmitButton pendingText="Speichern …">{submitLabel}</SubmitButton>
    </form>
  );
}
