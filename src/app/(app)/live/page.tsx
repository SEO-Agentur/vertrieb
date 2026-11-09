import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { activeVisitors } from "@/lib/live";
import { PageHeader, Section, Empty, Badge } from "@/components/ui";
import { dateTime, relative } from "@/lib/format";

export const metadata = { title: "Live-Besucher" };
export const dynamic = "force-dynamic";

export default async function LivePage() {
  const user = await requireUser();
  const [active, recent] = await Promise.all([
    activeVisitors(user.tenantId),
    db.roomSession.findMany({ where: { room: { tenantId: user.tenantId } }, orderBy: { lastSeenAt: "desc" }, take: 50, include: { room: { select: { displayName: true, companyId: true } }, invite: { select: { label: true, contact: { select: { firstName: true, lastName: true } } } } } }),
  ]);
  return (
    <div className="space-y-6">
      <PageHeader title="Live-Besucher" subtitle="Anwesenheit wird nur angezeigt, wenn der Besucher dem ausdrücklich zugestimmt hat. Live-Meldungen erscheinen oben in der Leiste." />
      <Section title={`Gerade aktiv (${active.length})`}>
        {active.length === 0 ? <Empty>Aktuell kein Besucher mit Anwesenheits-Einwilligung aktiv.</Empty> : (
          <ul className="space-y-2 text-sm">{active.map((v) => <li key={v.sessionId}><strong>{v.visitorLabel}</strong> · <Link className="link" href={`/companies/${v.companyId}`}>{v.company}</Link> · {v.section ?? "–"} · {relative(v.lastSeenAt)}</li>)}</ul>
        )}
      </Section>
      <Section title="Letzte Sitzungen">
        {recent.length === 0 ? <Empty>Noch keine Besuche.</Empty> : (
          <table className="table">
            <thead><tr><th>Kundenwelt</th><th>Einladung</th><th>Verifiziert</th><th>Einwilligung</th><th>Beginn</th><th>Zuletzt aktiv</th></tr></thead>
            <tbody>{recent.map((s) => (
              <tr key={s.id}>
                <td><Link className="hover:underline" href={`/companies/${s.room.companyId}?tab=room`}>{s.room.displayName}</Link></td>
                <td>{s.invite.contact ? `${s.invite.contact.firstName} ${s.invite.contact.lastName}` : s.invite.label ?? "–"}</td>
                <td>{s.verifiedAt ? <Badge tone="green">{s.verifiedEmail}</Badge> : <Badge>eingeladener Besucher</Badge>}</td>
                <td className="text-xs">{s.presenceConsent ? "Anwesenheit" : "keine"}{s.analyticsConsent ? " + Nutzung" : ""}</td>
                <td className="text-xs">{dateTime(s.createdAt)}</td>
                <td className="text-xs">{s.presenceConsent ? relative(s.lastSeenAt) : "nicht erfasst"}</td>
              </tr>
            ))}</tbody>
          </table>
        )}
      </Section>
    </div>
  );
}
