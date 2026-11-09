"use client";
import { useActionState, useState } from "react";
import { acceptOfferAction, declineOfferAction, type AcceptState } from "@/app/room/[slug]/offers/[offerId]/actions";

export function OfferDecision({ slug, offerId, companyName, declaration, defaultEmail, defaultName }: { slug: string; offerId: string; companyName: string; declaration: string; defaultEmail: string; defaultName: string }) {
  const [acc, accept, accPending] = useActionState(acceptOfferAction.bind(null, slug, offerId), {} as AcceptState);
  const [dec, decline, decPending] = useActionState(declineOfferAction.bind(null, slug, offerId), {} as AcceptState);
  const [mode, setMode] = useState<"none" | "accept" | "decline">("none");
  if (acc.ok || dec.ok) return <div className="mt-16 bg-white p-8 text-sm">Vielen Dank – Ihre Entscheidung wurde übermittelt.</div>;
  return (
    <section className="mt-16 bg-white p-8">
      <h2 className="font-serif text-2xl">Ihre Entscheidung</h2>
      {mode === "none" && (
        <div className="mt-6 flex flex-wrap gap-3">
          <button data-testid="offer-accept-open" onClick={() => setMode("accept")} className="rounded-sm bg-[var(--primary)] px-6 py-3 text-sm font-medium text-white">Angebot annehmen</button>
          <button onClick={() => setMode("decline")} className="rounded-sm border border-ink-300 px-6 py-3 text-sm">Ablehnen</button>
        </div>
      )}
      {mode === "accept" && (
        <form action={accept} className="mt-6 space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <label className="block"><span className="label">Vor- und Nachname</span><input data-testid="accept-name" name="name" required minLength={3} defaultValue={defaultName} className="input" /></label>
            <label className="block"><span className="label">E-Mail</span><input data-testid="accept-email" name="email" type="email" required defaultValue={defaultEmail} className="input" /></label>
            <label className="block"><span className="label">Funktion / Position</span><input data-testid="accept-role" name="role" required className="input" /></label>
          </div>
          <label className="flex gap-3 text-sm"><input data-testid="accept-authorized" type="checkbox" name="authorized" required className="mt-1" /><span>Ich bin berechtigt, für {companyName} verbindlich zu bestellen.</span></label>
          <label className="flex gap-3 text-sm"><input data-testid="accept-terms" type="checkbox" name="accept" required className="mt-1" /><span>{declaration}</span></label>
          <p className="text-xs text-ink-500">Mit dem Absenden wird Ihre Annahmeerklärung mit Name, E-Mail, Funktion, Zeitpunkt und einer Prüfsumme des Angebotsinhalts dokumentiert. Sie erhalten die Annahme im PDF des Angebots bestätigt.</p>
          {acc.error && <p className="text-sm text-red-700">{acc.error}</p>}
          <div className="flex gap-3">
            <button data-testid="offer-accept" disabled={accPending} className="rounded-sm bg-[var(--primary)] px-6 py-3 text-sm font-medium text-white disabled:opacity-50">Verbindlich annehmen</button>
            <button type="button" onClick={() => setMode("none")} className="px-4 text-sm text-ink-500">Abbrechen</button>
          </div>
        </form>
      )}
      {mode === "decline" && (
        <form action={decline} className="mt-6 space-y-4">
          <label className="block"><span className="label">Grund (optional)</span><textarea name="reason" rows={3} maxLength={2000} className="input" /></label>
          {dec.error && <p className="text-sm text-red-700">{dec.error}</p>}
          <div className="flex gap-3">
            <button disabled={decPending} className="rounded-sm border border-ink-400 px-6 py-3 text-sm">Angebot ablehnen</button>
            <button type="button" onClick={() => setMode("none")} className="px-4 text-sm text-ink-500">Abbrechen</button>
          </div>
        </form>
      )}
    </section>
  );
}
