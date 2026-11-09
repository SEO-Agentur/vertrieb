import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { PageHeader, Badge, Empty } from "@/components/ui";
import { offerTotals } from "@/lib/offers";
import { eur, date } from "@/lib/format";
import { OFFER_STATUS } from "./labels";

export const metadata = { title: "Angebote" };

export default async function OffersPage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const user = await requireUser();
  const { status } = await searchParams;
  const offers = await db.offer.findMany({
    where: { tenantId: user.tenantId, ...(status ? { status: status as never } : { status: { not: "SUPERSEDED" } }) },
    include: { items: true, company: { select: { name: true } }, _count: { select: { messages: { where: { fromVisitor: true, readAt: null } } } } },
    orderBy: { updatedAt: "desc" },
  });
  const open = offers.filter((o) => o.status === "PUBLISHED");
  const openValue = open.reduce((s, o) => s + offerTotals(o.items).oneTime, 0);
  return (
    <div>
      <PageHeader title="Angebote" subtitle={`${open.length} offene Angebote · ${eur(openValue)} einmaliges Volumen (netto)`} />
      <div className="mb-3 flex flex-wrap gap-1">
        <Link href="/offers" className={!status ? "btn-primary btn-sm" : "btn-secondary btn-sm"}>Aktuell</Link>
        {Object.entries(OFFER_STATUS).map(([k, [l]]) => <Link key={k} href={`/offers?status=${k}`} className={status === k ? "btn-primary btn-sm" : "btn-secondary btn-sm"}>{l}</Link>)}
      </div>
      {offers.length === 0 ? <Empty>Keine Angebote. Angebote werden in der Unternehmensakte (Tab „Angebote“) erstellt.</Empty> : (
        <div className="card overflow-x-auto">
          <table className="table">
            <thead><tr><th>Nummer</th><th>Unternehmen</th><th>Titel</th><th>Status</th><th>Einmalig</th><th>Laufend/Jahr</th><th>Veröffentlicht</th><th>Rückfragen</th></tr></thead>
            <tbody>
              {offers.map((o) => {
                const t = offerTotals(o.items);
                const [l, tone] = OFFER_STATUS[o.status] ?? [o.status, "gray" as const];
                return (
                  <tr key={o.id}>
                    <td><Link className="link" href={`/offers/${o.id}`}>{o.number} v{o.version}</Link></td>
                    <td><Link className="link" href={`/companies/${o.companyId}?tab=offers`}>{o.company.name}</Link></td>
                    <td>{o.title}</td>
                    <td><Badge tone={tone}>{l}</Badge></td>
                    <td className="tabular-nums">{eur(t.oneTime)}</td>
                    <td className="tabular-nums">{eur(t.recurringPerYear)}</td>
                    <td>{date(o.publishedAt)}</td>
                    <td>{o._count.messages > 0 ? <Badge tone="amber">{o._count.messages} neu</Badge> : "–"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
