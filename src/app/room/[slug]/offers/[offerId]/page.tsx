import type { CSSProperties } from "react";
import { db } from "@/lib/db";
import { getVisitorSession, recordRoomEvent } from "@/lib/rooms";
import { notify } from "@/lib/audit";
import { AccessDenied } from "@/components/room/AccessDenied";
import { OFFER_SECTIONS, PRICING_LABEL, itemTotal, offerTotals, VAT_RATE, type OfferSections } from "@/lib/offers";
import { eur, date } from "@/lib/format";
import { MessageForm } from "@/components/room/RoomClient";
import { OfferDecision } from "@/components/room/OfferDecision";
import { acceptanceDeclaration } from "@/lib/offer-acceptance";

export const dynamic = "force-dynamic";
export const metadata = { title: "Ihr Angebot", robots: { index: false, follow: false } };

export default async function OfferPage({ params }: { params: Promise<{ slug: string; offerId: string }> }) {
  const { slug, offerId } = await params;
  const room = await db.room.findUnique({ where: { slug } });
  const session = room ? await getVisitorSession(room.id) : null;
  if (!room || !session || session.needsVerification) return <AccessDenied />;
  const offer = await db.offer.findFirst({
    where: { id: offerId, roomId: room.id, status: { in: ["PUBLISHED", "ACCEPTED", "DECLINED"] } },
    include: { items: { orderBy: { order: "asc" } }, company: { select: { name: true } }, messages: { orderBy: { createdAt: "asc" } } },
  });
  if (!offer) return <AccessDenied />;

  if (!offer.firstViewedAt) {
    const upd = await db.offer.updateMany({ where: { id: offer.id, firstViewedAt: null }, data: { firstViewedAt: new Date() } });
    if (upd.count) await notify({ tenantId: room.tenantId, userId: room.consultantId, type: "OFFER_VIEWED", title: `Angebot geöffnet: ${room.displayName}`, body: `${offer.number} v${offer.version}`, link: `/offers/${offer.id}` });
  }
  await recordRoomEvent(room.id, session.id, "OFFER_VIEWED", { offerId: offer.id });

  const sections = offer.sections as OfferSections;
  const totals = offerTotals(offer.items);
  const style = { "--primary": room.primaryColor, "--accent": room.accentColor } as CSSProperties;
  return (
    <div style={style} className="min-h-screen bg-[#f7f5f0] text-ink-900">
      <header className="border-b border-black/5 bg-white">
        <div className="mx-auto flex max-w-4xl items-center gap-4 px-6 py-4">
          <a href={`/room/${slug}#offer`} className="text-sm text-ink-500 hover:text-ink-900">← Zurück zur Übersicht</a>
          <a href={`/api/room/${slug}/offers/${offer.id}/pdf`} data-testid="offer-pdf" className="ml-auto text-sm underline decoration-ink-300 underline-offset-4">PDF herunterladen</a>
        </div>
      </header>
      <main className="mx-auto max-w-4xl px-6 py-16">
        <div className="text-xs uppercase tracking-[0.25em] text-[var(--accent)]">Angebot {offer.number} · Version {offer.version}</div>
        <h1 className="mt-4 font-serif text-4xl leading-tight md:text-5xl" data-testid="offer-title">{offer.title}</h1>
        <p className="mt-4 text-ink-500">für {offer.company.name} · {date(offer.publishedAt)}{offer.validUntil ? ` · gültig bis ${date(offer.validUntil)}` : ""}</p>

        {offer.status === "ACCEPTED" && (
          <div className="mt-10 border-l-4 border-emerald-600 bg-white p-6" data-testid="offer-accepted">
            <div className="font-serif text-xl">Angebot angenommen</div>
            <p className="mt-1 text-sm text-ink-600">am {date(offer.acceptedAt)} durch {offer.acceptedByName} ({offer.acceptedRole}). Vielen Dank für Ihr Vertrauen – wir melden uns zur Projektplanung.</p>
          </div>
        )}
        {offer.status === "DECLINED" && <div className="mt-10 border-l-4 border-ink-400 bg-white p-6 text-sm">Dieses Angebot wurde abgelehnt. Bei Fragen stehen wir Ihnen gerne zur Verfügung.</div>}

        <div className="mt-14 space-y-12">
          {OFFER_SECTIONS.map((s) => sections[s.key]?.trim() ? (
            <section key={s.key}>
              <h2 className="font-serif text-2xl text-ink-950">{s.label}</h2>
              <div className="mt-3 whitespace-pre-line leading-relaxed text-ink-700">{sections[s.key]}</div>
            </section>
          ) : null)}
        </div>

        <section className="mt-16 bg-white p-8">
          <h2 className="font-serif text-2xl">Kosten</h2>
          <div className="mt-6 overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="border-b border-ink-200 text-left text-xs uppercase tracking-wider text-ink-500"><th className="py-2">Leistung</th><th>Menge</th><th>Einzelpreis</th><th className="text-right">Summe</th></tr></thead>
              <tbody>
                {offer.items.map((i) => (
                  <tr key={i.id} className="border-b border-ink-100 align-top">
                    <td className="py-3 pr-4">
                      <div className="font-medium">{i.name}{i.optional && <span className="ml-2 text-xs text-ink-400">optional</span>}</div>
                      {i.description && <div className="text-ink-500">{i.description}</div>}
                      {i.recurring && <div className="text-xs text-ink-400">laufend {PRICING_LABEL[i.pricingModel]}</div>}
                    </td>
                    <td className="tabular-nums">{i.quantity.toLocaleString("de-DE")} {i.unit}</td>
                    <td className="tabular-nums">{eur(i.unitPrice, true)}</td>
                    <td className="text-right tabular-nums">{eur(itemTotal(i), true)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <dl className="mt-6 space-y-1 text-sm">
            <div className="flex justify-between font-medium"><dt>Einmalige Kosten (netto)</dt><dd className="tabular-nums" data-testid="offer-total">{eur(totals.oneTime, true)}</dd></div>
            <div className="flex justify-between text-ink-500"><dt>zzgl. {Math.round(VAT_RATE * 100)} % USt. – brutto</dt><dd className="tabular-nums">{eur(totals.oneTime * (1 + VAT_RATE), true)}</dd></div>
            {totals.recurringPerYear > 0 && <div className="flex justify-between font-medium"><dt>Laufende Kosten (netto)</dt><dd className="tabular-nums">{eur(totals.monthly, true)} / Monat{totals.yearly ? ` + ${eur(totals.yearly, true)} / Jahr` : ""}</dd></div>}
            {(totals.optionalOneTime > 0 || totals.optionalRecurringYearly > 0) && <div className="flex justify-between text-ink-500"><dt>Optionale Positionen (nicht enthalten)</dt><dd className="tabular-nums">{eur(totals.optionalOneTime, true)} einmalig · {eur(totals.optionalRecurringYearly, true)} / Jahr</dd></div>}
          </dl>
          <p className="mt-6 text-xs text-ink-400">Wirtschaftlichkeitsangaben sind Szenarien auf Basis offengelegter Annahmen und keine Ergebniszusagen.</p>
        </section>

        {offer.status === "PUBLISHED" && (
          <OfferDecision slug={slug} offerId={offer.id} companyName={offer.company.name} declaration={acceptanceDeclaration(offer.company.name, offer.number, offer.version)} defaultEmail={session.verifiedEmail ?? ""} defaultName={session.displayName ?? ""} />
        )}

        <section className="mt-16">
          <h2 className="font-serif text-2xl">Rückfragen zum Angebot</h2>
          <div className="mt-6 space-y-3">
            {offer.messages.map((msg) => (
              <div key={msg.id} className={`max-w-[85%] rounded-sm px-4 py-3 text-sm ${msg.fromVisitor ? "ml-auto bg-[var(--primary)] text-white" : "bg-white"}`}>
                <div className={`mb-1 text-[11px] ${msg.fromVisitor ? "text-white/60" : "text-ink-400"}`}>{msg.authorName} · {date(msg.createdAt)}</div>
                <div className="whitespace-pre-line">{msg.body}</div>
              </div>
            ))}
          </div>
          <div className="mt-6"><MessageForm slug={slug} offerId={offer.id} placeholder="Ihre Frage zum Angebot …" sendLabel="Frage senden" defaultName={session.displayName ?? ""} /></div>
        </section>
      </main>
    </div>
  );
}
