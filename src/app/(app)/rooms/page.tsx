import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { PageHeader, Badge, Empty } from "@/components/ui";
import { dateTime, relative } from "@/lib/format";

export const metadata = { title: "Kundenwelten" };

export default async function RoomsPage() {
  const user = await requireUser();
  const rooms = await db.room.findMany({
    where: { tenantId: user.tenantId },
    include: {
      company: { select: { id: true, name: true } },
      invites: { select: { revokedAt: true, expiresAt: true } },
      sessions: { orderBy: { lastSeenAt: "desc" }, take: 1, select: { lastSeenAt: true, createdAt: true } },
      _count: { select: { sessions: true, events: true, offers: true } },
    },
    orderBy: { updatedAt: "desc" },
  });
  const now = new Date();
  return (
    <div>
      <PageHeader title="Kundenwelten" subtitle="Persönliche, geschützte Seiten je Unternehmen – erstellt aus einer gemeinsamen Anwendung." />
      {rooms.length === 0 ? (
        <Empty>Noch keine Kundenwelten. Erstellen Sie eine Kundenwelt in der Unternehmensakte (Tab „Kundenwelt“).</Empty>
      ) : (
        <div className="card overflow-x-auto">
          <table className="table">
            <thead><tr><th>Unternehmen</th><th>Status</th><th>Aktive Einladungen</th><th>Besuche</th><th>Letzter Besuch</th><th>Angebote</th><th>Aktualisiert</th></tr></thead>
            <tbody>
              {rooms.map((r) => (
                <tr key={r.id}>
                  <td><Link className="link" href={`/companies/${r.company.id}?tab=room`}>{r.company.name}</Link><div className="text-xs text-ink-400">/room/{r.slug}</div></td>
                  <td><Badge tone={r.status === "PUBLISHED" ? "green" : r.status === "ARCHIVED" ? "gray" : "amber"}>{r.status === "PUBLISHED" ? "veröffentlicht" : r.status === "ARCHIVED" ? "archiviert" : "Entwurf"}</Badge></td>
                  <td className="tabular-nums">{r.invites.filter((i) => !i.revokedAt && i.expiresAt > now).length}</td>
                  <td className="tabular-nums">{r._count.sessions}</td>
                  <td>{r.sessions[0] ? relative(r.sessions[0].lastSeenAt) : "–"}</td>
                  <td className="tabular-nums">{r._count.offers}</td>
                  <td className="text-xs text-ink-500">{dateTime(r.updatedAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
