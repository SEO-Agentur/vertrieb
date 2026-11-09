import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { PageHeader, Badge, Empty, Stat } from "@/components/ui";
import { dateTime, date } from "@/lib/format";

export const metadata = { title: "Outreach" };

const LABEL: Record<string, string> = { DRAFT: "Entwurf", APPROVED: "Freigegeben", SENT: "Gesendet", REPLIED: "Antwort", NO_RESPONSE: "Keine Reaktion" };
const TONE: Record<string, "amber" | "blue" | "green" | "gray"> = { DRAFT: "amber", APPROVED: "blue", SENT: "green", REPLIED: "green", NO_RESPONSE: "gray" };

export default async function OutreachPage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const user = await requireUser();
  const { status } = await searchParams;
  const where = { tenantId: user.tenantId, ...(status && LABEL[status] ? { status: status as "DRAFT" } : {}) };
  const [messages, counts, due, noContact] = await Promise.all([
    db.outreachMessage.findMany({ where, include: { company: { select: { id: true, name: true } }, contact: { select: { firstName: true, lastName: true } } }, orderBy: { updatedAt: "desc" }, take: 200 }),
    db.outreachMessage.groupBy({ by: ["status"], where: { tenantId: user.tenantId }, _count: true }),
    db.outreachMessage.findMany({ where: { tenantId: user.tenantId, status: "SENT", followUpAt: { lte: new Date() } }, include: { company: { select: { id: true, name: true } }, contact: { select: { firstName: true, lastName: true } } }, orderBy: { followUpAt: "asc" } }),
    db.contact.count({ where: { tenantId: user.tenantId, outreachStatus: "NONE", company: { qualificationStatus: "QUALIFIED" } } }),
  ]);
  const c = (s: string) => counts.find((x) => x.status === s)?._count ?? 0;
  return (
    <div>
      <PageHeader title="Outreach" subtitle="LinkedIn-Nachrichten vorbereiten, freigeben und den manuellen Versand dokumentieren. Es erfolgt kein automatisierter Versand über LinkedIn." />
      <div className="mb-6 grid gap-3 md:grid-cols-5">
        <Stat label="Entwürfe (Freigabe offen)" value={c("DRAFT")} href="/outreach?status=DRAFT" />
        <Stat label="Freigegeben, nicht gesendet" value={c("APPROVED")} href="/outreach?status=APPROVED" />
        <Stat label="Gesendet" value={c("SENT")} href="/outreach?status=SENT" />
        <Stat label="Antworten" value={c("REPLIED")} href="/outreach?status=REPLIED" />
        <Stat label="Qualifizierte Kontakte ohne Ansprache" value={noContact} href="/contacts" />
      </div>
      {due.length > 0 && (
        <div className="card mb-6 p-4">
          <h2 className="h2 mb-3">Fällige Follow-ups</h2>
          <ul className="divide-y divide-ink-100 text-sm">
            {due.map((m) => (
              <li key={m.id} className="flex items-center gap-3 py-2">
                <Link className="link" href={`/companies/${m.company.id}?tab=outreach`}>{m.company.name}</Link>
                <span className="text-ink-500">{m.contact ? `${m.contact.firstName} ${m.contact.lastName}` : ""}</span>
                <span className="ml-auto text-xs text-red-700">fällig seit {date(m.followUpAt)}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
      <div className="mb-3 flex gap-2 text-sm">
        <Link href="/outreach" className={!status ? "font-semibold" : "text-ink-500"}>Alle</Link>
        {Object.entries(LABEL).map(([k, v]) => <Link key={k} href={`/outreach?status=${k}`} className={status === k ? "font-semibold" : "text-ink-500"}>{v}</Link>)}
      </div>
      {messages.length === 0 ? <Empty>Keine Nachrichten. Nachrichten werden in der Unternehmensakte (Tab „Outreach“) erstellt.</Empty> : (
        <div className="card overflow-x-auto">
          <table className="table">
            <thead><tr><th>Unternehmen</th><th>Kontakt</th><th>Art</th><th>Status</th><th>Gesendet</th><th>Follow-up</th><th>Aktualisiert</th></tr></thead>
            <tbody>
              {messages.map((m) => (
                <tr key={m.id}>
                  <td><Link className="link" href={`/companies/${m.company.id}?tab=outreach`}>{m.company.name}</Link></td>
                  <td>{m.contact ? `${m.contact.firstName} ${m.contact.lastName}` : "–"}</td>
                  <td className="text-xs">{m.kind === "FOLLOW_UP" ? "Follow-up" : "Erstansprache"}</td>
                  <td><Badge tone={TONE[m.status]}>{LABEL[m.status]}</Badge></td>
                  <td className="text-xs">{date(m.sentAt)}</td>
                  <td className="text-xs">{m.status === "SENT" ? date(m.followUpAt) : "–"}</td>
                  <td className="text-xs text-ink-500">{dateTime(m.updatedAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
