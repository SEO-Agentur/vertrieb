import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { aiStatus } from "@/lib/ai/provider";
import { PageHeader, Section, Empty, Badge, NotActivated } from "@/components/ui";
import { date } from "@/lib/format";

export const metadata = { title: "Unternehmensrecherche" };

export default async function ResearchPage() {
  const user = await requireUser();
  const ai = aiStatus();
  const [pending, notResearched, unverifiedRevenue] = await Promise.all([
    db.company.findMany({ where: { tenantId: user.tenantId, hypotheses: { some: { reviewed: false } } }, include: { _count: { select: { hypotheses: { where: { reviewed: false } } } } } }),
    db.company.findMany({ where: { tenantId: user.tenantId, researchedAt: null, qualificationStatus: { in: ["QUALIFIED", "IN_PROGRESS", "NEW"] } }, orderBy: { score: { sort: "desc", nulls: "last" } }, take: 50 }),
    db.company.findMany({ where: { tenantId: user.tenantId, revenueEur: { not: null }, revenueStatus: { not: "VERIFIED" } }, take: 50, orderBy: { score: { sort: "desc", nulls: "last" } } }),
  ]);
  return (
    <div className="space-y-6">
      <PageHeader title="Unternehmensrecherche" subtitle="Ergebnisse unterscheiden verifizierte Informationen, Schätzungen, Hypothesen und Unbekanntes." />
      {!ai.enabled && <NotActivated name="KI-Recherche" detail={ai.reason} />}
      <Section title={`Zu prüfende Hypothesen (${pending.length})`}>
        {pending.length === 0 ? <Empty>Alles geprüft.</Empty> : <ul className="space-y-1 text-sm">{pending.map((c) => <li key={c.id}><Link className="hover:underline" href={`/companies/${c.id}?tab=research`}>{c.name}</Link> <Badge tone="amber">{c._count.hypotheses} ungeprüft</Badge></li>)}</ul>}
      </Section>
      <Section title="Noch nicht recherchiert">
        {notResearched.length === 0 ? <Empty>Keine.</Empty> : <ul className="space-y-1 text-sm">{notResearched.map((c) => <li key={c.id}><Link className="hover:underline" href={`/companies/${c.id}?tab=research`}>{c.name}</Link> <span className="text-xs text-ink-400">angelegt {date(c.createdAt)}</span></li>)}</ul>}
      </Section>
      <Section title="Umsatz nicht verifiziert">
        {unverifiedRevenue.length === 0 ? <Empty>Keine.</Empty> : <ul className="space-y-1 text-sm">{unverifiedRevenue.map((c) => <li key={c.id}><Link className="hover:underline" href={`/companies/${c.id}`}>{c.name}</Link> <Badge tone="amber">{c.revenueStatus}</Badge></li>)}</ul>}
      </Section>
    </div>
  );
}
