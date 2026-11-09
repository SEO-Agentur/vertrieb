import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { nextActions } from "@/lib/recommendations";
import { activeVisitors } from "@/lib/live";
import { integrationStates } from "@/lib/integrations";
import { PageHeader, Stat, Section, Empty, Badge } from "@/components/ui";
import { eur, dateTime } from "@/lib/format";
import { offerTotals } from "@/lib/offers";

export const metadata = { title: "Dashboard" };
export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const user = await requireUser();
  const t = user.tenantId;
  const weekAgo = new Date(Date.now() - 7 * 86400_000);
  const [newCompanies, qualified, contactsNoOutreach, roomsReady, openMessages, scheduled, openOffers, pipeline, recs, visitors, requests, integrations] = await Promise.all([
    db.company.count({ where: { tenantId: t, createdAt: { gte: weekAgo } } }),
    db.company.count({ where: { tenantId: t, qualificationStatus: "QUALIFIED" } }),
    db.contact.count({ where: { tenantId: t, outreachStatus: "NONE" } }),
    db.room.count({ where: { tenantId: t, status: "PUBLISHED" } }),
    db.outreachMessage.count({ where: { tenantId: t, status: { in: ["DRAFT", "APPROVED"] } } }),
    db.meeting.findMany({ where: { tenantId: t, status: "SCHEDULED", scheduledAt: { gte: new Date() } }, orderBy: { scheduledAt: "asc" }, take: 5, include: { company: { select: { name: true } } } }),
    db.offer.findMany({ where: { tenantId: t, status: "PUBLISHED" }, include: { items: true, company: { select: { name: true } } } }),
    db.company.findMany({ where: { tenantId: t, stage: { isLost: false, isWon: false } }, select: { dealValue: true, stage: { select: { probability: true } } } }),
    nextActions(t),
    activeVisitors(t),
    db.meeting.count({ where: { tenantId: t, status: "REQUESTED" } }),
    Promise.resolve(integrationStates()),
  ]);
  const activeProspects = await db.company.count({ where: { tenantId: t, stage: { key: { in: ["ROOM_VISITED", "INTERESTED", "MEETING_SCHEDULED", "ANALYSIS_DONE", "SOLUTION_DEVELOPED", "OFFER_SENT", "NEGOTIATION"] } } } });
  const pipelineValue = pipeline.reduce((s, c) => s + (c.dealValue ?? 0), 0);
  const weighted = pipeline.reduce((s, c) => s + (c.dealValue ?? 0) * ((c.stage?.probability ?? 0) / 100), 0);
  const offerValue = openOffers.reduce((s, o) => s + offerTotals(o.items).oneTime, 0);
  return (
    <div className="space-y-6">
      <PageHeader title={`Guten Tag, ${user.name.split(" ")[0]}`} subtitle="Ihr Vertrieb auf einen Blick." />
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4 xl:grid-cols-6">
        <Stat label="Neu identifiziert (7 Tage)" value={newCompanies} href="/companies?sort=recent" />
        <Stat label="Qualifiziert" value={qualified} href="/companies?status=QUALIFIED" />
        <Stat label="Kontakte ohne Ansprache" value={contactsNoOutreach} href="/contacts?outreach=NONE" />
        <Stat label="Veröffentlichte Kundenwelten" value={roomsReady} href="/rooms" />
        <Stat label="Offene LinkedIn-Nachrichten" value={openMessages} href="/outreach" />
        <Stat label="Aktive Interessenten" value={activeProspects} href="/pipeline" />
        <Stat label="Live in Kundenwelten" value={visitors.length} href="/live" />
        <Stat label="Gesprächsanfragen" value={requests} href="/meetings" />
        <Stat label="Geplante Gespräche" value={scheduled.length} href="/meetings" />
        <Stat label="Offene Angebote" value={openOffers.length} hint={eur(offerValue) + " einmalig"} href="/offers" />
        <Stat label="Pipeline-Volumen" value={eur(pipelineValue)} href="/pipeline" />
        <Stat label="Gewichtetes Potenzial" value={eur(weighted)} hint="nach Phasen-Wahrscheinlichkeit" href="/reports" />
      </div>
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Section title="Nächste empfohlene Aktivitäten">
            {recs.length === 0 ? <Empty>Keine Empfehlungen – importieren Sie neue Unternehmen im <Link className="link" href="/prospecting">Prospecting</Link>.</Empty> : (
              <ol className="divide-y divide-ink-100">
                {recs.map((r, i) => (
                  <li key={i} className="flex items-center gap-3 py-2.5">
                    <span className="w-6 text-center text-xs text-ink-400">{i + 1}</span>
                    <div className="min-w-0 flex-1"><div className="text-sm font-medium">{r.title}</div><div className="truncate text-xs text-ink-500">{r.reason}</div></div>
                    <Link href={r.href} className="btn-secondary btn-sm">Öffnen</Link>
                  </li>
                ))}
              </ol>
            )}
          </Section>
        </div>
        <div className="space-y-6">
          <Section title="Geplante Gespräche">
            {scheduled.length === 0 ? <Empty>Keine.</Empty> : <ul className="space-y-1 text-sm">{scheduled.map((m) => <li key={m.id}><Link className="hover:underline" href={`/meetings/${m.id}`}>{m.company.name}</Link> <span className="text-xs text-ink-400">{dateTime(m.scheduledAt)}</span></li>)}</ul>}
          </Section>
          <Section title="Integrationen">
            <ul className="space-y-1 text-xs">{integrations.map((i) => <li key={i.key} className="flex justify-between gap-2"><span>{i.name}</span><Badge tone={i.enabled ? "green" : "amber"}>{i.enabled ? "aktiv" : "nicht aktiviert"}</Badge></li>)}</ul>
            <Link href="/settings?tab=integrations" className="mt-2 inline-block text-xs underline">Details</Link>
          </Section>
        </div>
      </div>
    </div>
  );
}
