import Link from "next/link";
import type { TabProps } from "./types";
import { db } from "@/lib/db";
import { Section, Badge, Empty } from "@/components/ui";
import { SubmitButton } from "@/components/SubmitButton";
import { createOffer } from "@/app/(app)/offers/actions";
import { OFFER_STATUS } from "@/app/(app)/offers/labels";
import { offerTotals } from "@/lib/offers";
import { eur, date } from "@/lib/format";

export default async function OffersTab({ companyId, user }: TabProps) {
  const [offers, templates, selected, analyses, room] = await Promise.all([
    db.offer.findMany({ where: { companyId }, include: { items: true }, orderBy: [{ number: "desc" }, { version: "desc" }] }),
    db.offerTemplate.findMany({ where: { tenantId: user.tenantId }, orderBy: { name: "asc" } }),
    db.companySolution.count({ where: { companyId, status: "SELECTED" } }),
    db.economicAnalysis.count({ where: { companyId } }),
    db.room.findUnique({ where: { companyId }, select: { status: true } }),
  ]);
  return (
    <div className="space-y-6">
      <Section title="Angebot erstellen">
        <ul className="mb-3 space-y-1 text-sm text-ink-600">
          <li>{selected ? "✓" : "○"} {selected} ausgewählte Lösung(en) – Positionen werden daraus vorbefüllt</li>
          <li>{analyses ? "✓" : "○"} Wirtschaftlichkeitsanalyse – Ziele werden mit offengelegten Annahmen vorbefüllt</li>
          <li>{room?.status === "PUBLISHED" ? "✓" : "○"} Veröffentlichte Kundenwelt – Voraussetzung für die Veröffentlichung</li>
        </ul>
        <form action={createOffer} className="flex flex-wrap items-end gap-2">
          <input type="hidden" name="companyId" value={companyId} />
          <label className="min-w-[280px] flex-1"><span className="label">Titel (optional)</span><input name="title" className="input" placeholder="Angebot Vertriebsoptimierung …" /></label>
          {templates.length > 0 && <label><span className="label">Vorlage</span><select name="templateId" className="input">{templates.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}</select></label>}
          <SubmitButton pendingText="Erstelle …" data-testid="create-offer">Angebotsentwurf erstellen</SubmitButton>
        </form>
      </Section>
      <Section title="Angebote">
        {offers.length === 0 ? <Empty>Noch keine Angebote.</Empty> : (
          <table className="table">
            <thead><tr><th>Nummer</th><th>Titel</th><th>Status</th><th>Einmalig</th><th>Laufend/Jahr</th><th>Datum</th></tr></thead>
            <tbody>
              {offers.map((o) => {
                const t = offerTotals(o.items);
                const [l, tone] = OFFER_STATUS[o.status] ?? [o.status, "gray" as const];
                return (
                  <tr key={o.id}>
                    <td><Link className="link" href={`/offers/${o.id}`}>{o.number} v{o.version}</Link></td>
                    <td>{o.title}</td>
                    <td><Badge tone={tone}>{l}</Badge></td>
                    <td>{eur(t.oneTime)}</td>
                    <td>{eur(t.recurringPerYear)}</td>
                    <td>{date(o.publishedAt ?? o.createdAt)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </Section>
    </div>
  );
}
