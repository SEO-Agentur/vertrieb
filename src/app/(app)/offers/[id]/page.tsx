import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { offerForUser } from "@/lib/access";
import { db } from "@/lib/db";
import { Badge, Section } from "@/components/ui";
import { SubmitButton } from "@/components/SubmitButton";
import { OFFER_SECTIONS, PRICING_LABEL, itemTotal, offerTotals, VAT_RATE, type OfferSections } from "@/lib/offers";
import { eur, dateTime, date } from "@/lib/format";
import { OFFER_STATUS } from "../labels";
import * as A from "../actions";

export const metadata = { title: "Angebot" };

export default async function OfferEditor({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ error?: string }> }) {
  const user = await requireUser();
  const { id } = await params;
  const { error } = await searchParams;
  const base = await offerForUser(id, user);
  const offer = await db.offer.findUniqueOrThrow({
    where: { id: base.id },
    include: { items: { orderBy: { order: "asc" }, include: { service: { include: { dependsOn: { include: { dependsOn: true } } } } } }, company: true, room: true, messages: { orderBy: { createdAt: "asc" } }, project: true },
  });
  const [services, packages, versions] = await Promise.all([
    db.service.findMany({ where: { tenantId: user.tenantId, active: true }, orderBy: { name: "asc" } }),
    db.servicePackage.findMany({ where: { tenantId: user.tenantId }, orderBy: { name: "asc" } }),
    db.offer.findMany({ where: { tenantId: user.tenantId, number: offer.number }, orderBy: { version: "asc" }, select: { id: true, version: true, status: true } }),
  ]);
  const draft = offer.status === "DRAFT";
  const sections = offer.sections as OfferSections;
  const totals = offerTotals(offer.items);
  const included = new Set(offer.items.map((i) => i.serviceId).filter(Boolean));
  const missingDeps = offer.items.flatMap((i) => (i.service?.dependsOn ?? []).filter((d) => !included.has(d.dependsOnId)).map((d) => `„${i.name}“ setzt „${d.dependsOn.name}“ voraus`));
  const [statusLabel, tone] = OFFER_STATUS[offer.status] ?? [offer.status, "gray"];

  return (
    <div>
      <div className="mb-1 text-xs text-ink-400"><Link href="/offers" className="hover:underline">Angebote</Link> / <Link href={`/companies/${offer.companyId}?tab=offers`} className="hover:underline">{offer.company.name}</Link></div>
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <h1 className="h1">{offer.number} · Version {offer.version}</h1>
        <Badge tone={tone}>{statusLabel}</Badge>
        {versions.length > 1 && <span className="text-xs text-ink-500">Versionen: {versions.map((v) => <Link key={v.id} href={`/offers/${v.id}`} className={`ml-1 ${v.id === offer.id ? "font-bold" : "link"}`}>v{v.version}</Link>)}</span>}
        <div className="ml-auto flex flex-wrap gap-2">
          <a className="btn-secondary" href={`/api/offers/${offer.id}/pdf`} target="_blank" rel="noreferrer">PDF</a>
          {draft && (
            <form action={A.publishOffer}><input type="hidden" name="offerId" value={offer.id} /><SubmitButton confirm="Angebot in der Kundenwelt veröffentlichen? Danach sind nur noch neue Versionen möglich." data-testid="publish-offer">In Kundenwelt veröffentlichen</SubmitButton></form>
          )}
          {offer.status !== "ACCEPTED" && offer.status !== "SUPERSEDED" && (
            <form action={A.newVersion}><input type="hidden" name="offerId" value={offer.id} /><SubmitButton className="btn-secondary">Neue Version</SubmitButton></form>
          )}
          {offer.status === "PUBLISHED" && <form action={A.withdrawOffer}><input type="hidden" name="offerId" value={offer.id} /><SubmitButton className="btn-danger" confirm="Angebot zurückziehen?">Zurückziehen</SubmitButton></form>}
          {draft && <form action={A.deleteOffer}><input type="hidden" name="offerId" value={offer.id} /><SubmitButton className="btn-danger" confirm="Entwurf löschen?">Löschen</SubmitButton></form>}
        </div>
      </div>
      {error && <p className="mb-4 rounded bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
      {offer.status === "PUBLISHED" && <p className="mb-4 rounded bg-sky-50 px-3 py-2 text-sm text-sky-800">Veröffentlicht am {dateTime(offer.publishedAt)} in der Kundenwelt{offer.room ? ` /room/${offer.room.slug}` : ""}.{offer.firstViewedAt ? ` Erstmals angesehen: ${dateTime(offer.firstViewedAt)}.` : " Noch nicht angesehen."}</p>}
      {offer.status === "ACCEPTED" && (
        <div className="mb-4 rounded border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900" data-testid="acceptance-record">
          <div className="font-semibold">Angenommen am {dateTime(offer.acceptedAt)}</div>
          <div>durch {offer.acceptedByName} ({offer.acceptedByEmail}{offer.acceptedRole ? `, ${offer.acceptedRole}` : ""})</div>
          {offer.acceptanceText && <div className="mt-1 text-xs">Erklärung: „{offer.acceptanceText}“</div>}
          <div className="mt-1 font-mono text-[11px]">Prüfsumme: {offer.acceptanceHash}</div>
          {offer.project && <div className="mt-1">Projekt: {offer.project.name} ({offer.project.status})</div>}
        </div>
      )}
      {offer.status === "DECLINED" && <p className="mb-4 rounded bg-red-50 px-3 py-2 text-sm text-red-800">Abgelehnt am {dateTime(offer.declinedAt)}{offer.declineReason ? `: „${offer.declineReason}“` : ""}</p>}

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        <Section title="Inhalt">
          <form action={A.updateOffer} className="space-y-3">
            <input type="hidden" name="offerId" value={offer.id} />
            <fieldset disabled={!draft} className="space-y-3">
              <div className="grid gap-3 md:grid-cols-[1fr_180px]">
                <label><span className="label">Titel</span><input name="title" defaultValue={offer.title} className="input" /></label>
                <label><span className="label">Gültig bis</span><input name="validUntil" type="date" defaultValue={offer.validUntil?.toISOString().slice(0, 10)} className="input" /></label>
              </div>
              {OFFER_SECTIONS.map((s) => (
                <label key={s.key} className="block"><span className="label">{s.label}</span><textarea name={`s_${s.key}`} rows={Math.min(10, Math.max(3, (sections[s.key] ?? "").split("\n").length + 1))} defaultValue={sections[s.key] ?? ""} className="input" /></label>
              ))}
              {draft && <SubmitButton pendingText="Speichere …">Inhalt speichern</SubmitButton>}
            </fieldset>
          </form>
        </Section>

        <div className="space-y-6">
          <Section title="Positionen & Kosten">
            {missingDeps.length > 0 && <div className="mb-3 rounded bg-amber-50 px-3 py-2 text-xs text-amber-900">Abhängigkeiten fehlen: {missingDeps.join("; ")}</div>}
            <ul className="divide-y divide-ink-100">
              {offer.items.map((i) => (
                <li key={i.id} className="py-2">
                  {draft ? (
                    <details>
                      <summary className="flex cursor-pointer items-center gap-2 text-sm">
                        <span className="flex-1">{i.name}{i.optional && <Badge tone="amber">optional</Badge>}{i.recurring && <Badge tone="blue">laufend</Badge>}</span>
                        <span className="tabular-nums">{i.quantity} × {eur(i.unitPrice, true)} = <strong>{eur(itemTotal(i), true)}</strong></span>
                      </summary>
                      <form action={A.updateItem} className="mt-2 grid grid-cols-2 gap-2">
                        <input type="hidden" name="itemId" value={i.id} />
                        <input name="name" defaultValue={i.name} className="input col-span-2" />
                        <input name="description" defaultValue={i.description ?? ""} placeholder="Beschreibung" className="input col-span-2" />
                        <select name="pricingModel" defaultValue={i.pricingModel} className="input">{Object.entries(PRICING_LABEL).map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select>
                        <input name="phase" defaultValue={i.phase ?? ""} placeholder="Phase" className="input" />
                        <input name="quantity" type="number" step="0.5" min={0} defaultValue={i.quantity} className="input" aria-label="Menge" />
                        <input name="unitPrice" type="number" step="0.01" min={0} defaultValue={i.unitPrice} className="input" aria-label="Einzelpreis" />
                        <input name="unit" defaultValue={i.unit ?? ""} placeholder="Einheit" className="input" />
                        <span className="flex items-center gap-3 text-xs"><label><input type="checkbox" name="recurring" defaultChecked={i.recurring} /> laufend</label><label><input type="checkbox" name="optional" defaultChecked={i.optional} /> optional</label></span>
                        <div className="col-span-2 flex gap-2"><button name="action" value="save" className="btn-primary btn-sm">Speichern</button><button name="action" value="delete" className="btn-danger btn-sm">Entfernen</button></div>
                      </form>
                    </details>
                  ) : (
                    <div className="flex items-center gap-2 text-sm"><span className="flex-1">{i.name} {i.optional && <Badge tone="amber">optional</Badge>}{i.recurring && <Badge tone="blue">{PRICING_LABEL[i.pricingModel]}</Badge>}</span><span className="tabular-nums">{i.quantity} × {eur(i.unitPrice, true)} = {eur(itemTotal(i), true)}</span></div>
                  )}
                </li>
              ))}
            </ul>
            <div className="mt-3 space-y-1 border-t border-ink-200 pt-3 text-sm" data-testid="offer-totals">
              <div className="flex justify-between"><span>Einmalig (netto)</span><strong>{eur(totals.oneTime, true)}</strong></div>
              <div className="flex justify-between text-ink-500"><span>Einmalig (brutto, {Math.round(VAT_RATE * 100)} % USt.)</span><span>{eur(totals.oneTime * (1 + VAT_RATE), true)}</span></div>
              <div className="flex justify-between"><span>Laufend pro Jahr (netto)</span><strong>{eur(totals.recurringPerYear, true)}</strong></div>
              {(totals.optionalOneTime > 0 || totals.optionalRecurringYearly > 0) && <div className="flex justify-between text-ink-500"><span>Optional (nicht enthalten)</span><span>{eur(totals.optionalOneTime, true)} + {eur(totals.optionalRecurringYearly, true)}/Jahr</span></div>}
            </div>
            {draft && (
              <div className="mt-4 space-y-3 border-t border-ink-100 pt-4">
                <form action={A.addItem} className="flex gap-2">
                  <input type="hidden" name="offerId" value={offer.id} />
                  <select name="serviceId" className="input">{services.map((s) => <option key={s.id} value={s.id}>{s.name} ({eur(s.unitPrice)} {PRICING_LABEL[s.pricingModel]})</option>)}</select>
                  <SubmitButton className="btn-secondary btn-sm">+ Leistung</SubmitButton>
                </form>
                {packages.length > 0 && (
                  <form action={A.addPackage} className="flex gap-2">
                    <input type="hidden" name="offerId" value={offer.id} />
                    <select name="packageId" className="input">{packages.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</select>
                    <SubmitButton className="btn-secondary btn-sm">+ Paket</SubmitButton>
                  </form>
                )}
                <details>
                  <summary className="cursor-pointer text-xs font-medium">Freie Position</summary>
                  <form action={A.addItem} className="mt-2 grid grid-cols-2 gap-2">
                    <input type="hidden" name="offerId" value={offer.id} />
                    <input name="name" required placeholder="Bezeichnung" className="input col-span-2" />
                    <select name="pricingModel" className="input">{Object.entries(PRICING_LABEL).map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select>
                    <input name="unit" placeholder="Einheit" className="input" />
                    <input name="quantity" type="number" step="0.5" min={0} defaultValue={1} className="input" />
                    <input name="unitPrice" type="number" step="0.01" min={0} placeholder="Einzelpreis" className="input" />
                    <span className="col-span-2 flex gap-3 text-xs"><label><input type="checkbox" name="recurring" /> laufend</label><label><input type="checkbox" name="optional" /> optional</label></span>
                    <SubmitButton className="btn-secondary btn-sm">Hinzufügen</SubmitButton>
                  </form>
                </details>
              </div>
            )}
          </Section>

          <Section title="Rückfragen aus der Kundenwelt">
            {offer.messages.length === 0 ? <p className="text-sm text-ink-500">Keine Rückfragen.</p> : (
              <ul className="mb-3 space-y-2 text-sm">
                {offer.messages.map((m) => (
                  <li key={m.id} className={`rounded p-2 ${m.fromVisitor ? "bg-amber-50" : "bg-ink-50"}`}><strong>{m.authorName}</strong> <span className="text-xs text-ink-400">{dateTime(m.createdAt)}</span><div className="whitespace-pre-wrap">{m.body}</div></li>
                ))}
              </ul>
            )}
            {offer.roomId && (
              <form action={A.replyToQuestion} className="space-y-2">
                <input type="hidden" name="offerId" value={offer.id} />
                <textarea name="body" rows={2} className="input" placeholder="Antwort (sichtbar in der Kundenwelt)" />
                <SubmitButton className="btn-secondary btn-sm">Antworten</SubmitButton>
              </form>
            )}
          </Section>
          <p className="text-xs text-ink-500">Erstellt {date(offer.createdAt)} · zuletzt geändert {dateTime(offer.updatedAt)}</p>
        </div>
      </div>
    </div>
  );
}
