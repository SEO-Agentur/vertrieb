"use client";
import { useActionState } from "react";
import Link from "next/link";
import { submitLeadAction, type LeadState } from "@/app/w/actions";

const INDUSTRIES = ["Maschinenbau", "Technischer Großhandel", "Industriebedarf", "Zulieferer / Fertigung", "Logistik", "IT / Managed Services", "Handwerk", "Dienstleistung / Beratung", "Sonstige"];

export function LeadForm({ kind = "POTENZIALANALYSE", submitLabel = "Anfrage senden" }: { kind?: "POTENZIALANALYSE" | "PLATTFORM" | "KONTAKT"; submitLabel?: string }) {
  const [state, action, pending] = useActionState<LeadState, FormData>(submitLeadAction, {});
  if (state.ok) {
    return (
      <div role="status" className="rounded-lg border border-emerald-200 bg-emerald-50 p-6 text-emerald-900" data-testid="lead-success">
        <p className="font-bold">Vielen Dank – Ihre Anfrage ist angekommen.</p>
        <p className="mt-1 text-sm">Ich melde mich innerhalb von einem Werktag persönlich bei Ihnen.</p>
      </div>
    );
  }
  const err = (k: string) => state.fieldErrors?.[k] && <span className="mt-1 block text-xs text-red-700">{state.fieldErrors[k]}</span>;
  const input = "mt-1 block w-full rounded border border-site-line bg-white px-3 py-2.5 text-sm text-site-navy focus:border-site-blue focus:outline-none focus:ring-2 focus:ring-site-blue/20";
  return (
    <form key={JSON.stringify(state.values ?? {})} action={action} className="grid gap-4 md:grid-cols-2" noValidate>
      <input type="hidden" name="kind" value={kind} />
      <div aria-hidden className="hidden"><label>Website <input name="website" tabIndex={-1} autoComplete="off" /></label></div>
      <label className="text-sm font-medium text-site-navy">Name *<input name="name" defaultValue={state.values?.name} required autoComplete="name" className={input} />{err("name")}</label>
      <label className="text-sm font-medium text-site-navy">Firma *<input name="company" defaultValue={state.values?.company} required autoComplete="organization" className={input} />{err("company")}</label>
      <label className="text-sm font-medium text-site-navy">Position<input name="role" defaultValue={state.values?.role} autoComplete="organization-title" className={input} /></label>
      <label className="text-sm font-medium text-site-navy">Geschäftliche E-Mail *<input name="email" defaultValue={state.values?.email} type="email" required autoComplete="email" className={input} />{err("email")}</label>
      <label className="text-sm font-medium text-site-navy">Telefon<input name="phone" defaultValue={state.values?.phone} type="tel" autoComplete="tel" className={input} /></label>
      <label className="text-sm font-medium text-site-navy">Branche
        <select name="industry" className={input} defaultValue={state.values?.industry ?? ""}><option value="">bitte wählen</option>{INDUSTRIES.map((i) => <option key={i}>{i}</option>)}</select>
      </label>
      <label className="text-sm font-medium text-site-navy md:col-span-2">Ungefährer Jahresumsatz
        <select name="revenue" className={input} defaultValue={state.values?.revenue ?? "unknown"}>
          <option value="unknown">keine Angabe</option><option value="<20">unter 20 Mio. €</option><option value="20-50">20–50 Mio. €</option><option value="50-100">50–100 Mio. €</option><option value="100-200">100–200 Mio. €</option><option value=">200">über 200 Mio. €</option>
        </select>
      </label>
      <label className="text-sm font-medium text-site-navy md:col-span-2">Wo sehen Sie den größten Engpass in Ihrem Vertrieb?
        <textarea name="message" defaultValue={state.values?.message} rows={4} className={input} placeholder="z. B. Angebote dauern zu lange, zu wenige passende Neukunden …" />
      </label>
      <label className="flex items-start gap-3 text-sm text-site-text md:col-span-2">
        <input type="checkbox" name="consent" required className="mt-1" />
        <span>Ich bin einverstanden, dass meine Angaben zur Bearbeitung der Anfrage gespeichert und ich dazu kontaktiert werde. Details in der <Link href="/datenschutz" className="text-site-blue underline">Datenschutzerklärung</Link>. *</span>
      </label>
      {err("consent")}
      {state.error && <p role="alert" className="rounded bg-red-50 px-3 py-2 text-sm text-red-800 md:col-span-2">{state.error}</p>}
      <div className="md:col-span-2">
        <button disabled={pending} className="inline-flex items-center gap-2 rounded bg-site-blue px-6 py-3 text-sm font-semibold text-white hover:bg-site-bluedark disabled:opacity-60" data-testid="lead-submit">{pending ? "Wird gesendet …" : submitLabel} <span aria-hidden>→</span></button>
      </div>
    </form>
  );
}
