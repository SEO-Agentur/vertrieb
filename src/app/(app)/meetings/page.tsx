import Link from "next/link";
import { SubmitButton } from "@/components/SubmitButton";
import type { MeetingStatus } from "@prisma/client";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { PageHeader, Badge, Empty, NotActivated } from "@/components/ui";
import { dateTime } from "@/lib/format";
import { videoStatus } from "@/lib/video";
import { respondMeeting } from "./actions";
import { MEETING_STATUS_LABEL } from "./labels";

export const metadata = { title: "Videogespräche" };

const FILTERS: [string, string, MeetingStatus[] | null][] = [
  ["open", "Offen", ["OFFERED", "REQUESTED", "ACCEPTED", "SCHEDULED", "LIVE"]],
  ["ended", "Beendet", ["ENDED"]],
  ["closed", "Abgelehnt/abgesagt", ["DECLINED", "CANCELLED", "LATER"]],
  ["all", "Alle", null],
];

export default async function MeetingsPage({ searchParams }: { searchParams: Promise<{ f?: string }> }) {
  const user = await requireUser();
  const { f = "open" } = await searchParams;
  const filter = FILTERS.find((x) => x[0] === f) ?? FILTERS[0];
  const [meetings, requests] = await Promise.all([
    db.meeting.findMany({ where: { tenantId: user.tenantId, ...(filter[2] ? { status: { in: filter[2] } } : {}) }, include: { company: { select: { name: true } } }, orderBy: [{ scheduledAt: "asc" }, { createdAt: "desc" }], take: 200 }),
    db.meeting.findMany({ where: { tenantId: user.tenantId, status: "REQUESTED" }, include: { company: { select: { name: true } } }, orderBy: { createdAt: "asc" } }),
  ]);
  const video = videoStatus();
  const upcoming = meetings.filter((m) => m.status === "SCHEDULED" && m.scheduledAt && m.scheduledAt > new Date());
  return (
    <div>
      <PageHeader title="Videogespräche" subtitle="Live-Beratungen, Gesprächsanfragen und geplante Termine." />
      {!video.enabled && <div className="mb-4"><NotActivated name="Videointegration (LiveKit)" detail={video.reason} /></div>}

      {requests.length > 0 && (
        <section className="card mb-6 border-violet-200">
          <div className="border-b border-violet-100 bg-violet-50 px-5 py-3 text-sm font-semibold text-violet-900">Offene Anfragen ({requests.length})</div>
          <ul className="divide-y divide-ink-100">
            {requests.map((m) => (
              <li key={m.id} className="flex flex-wrap items-end gap-3 px-5 py-3">
                <div className="min-w-0 flex-1">
                  <Link href={`/meetings/${m.id}`} className="link font-medium">{m.company.name}</Link>
                  <div className="text-xs text-ink-500">{m.kind === "LIVE" ? "Live-Gespräch" : "Terminwunsch"} · {dateTime(m.createdAt)}{m.preferredTimes && ` · Wunsch: ${m.preferredTimes}`}</div>
                  {m.visitorMessage && <div className="text-sm text-ink-600">„{m.visitorMessage}“</div>}
                </div>
                <form action={respondMeeting} className="flex flex-wrap items-end gap-2">
                  <input type="hidden" name="meetingId" value={m.id} />
                  <input type="datetime-local" name="scheduledAt" className="input w-auto" aria-label="Termin" />
                  <SubmitButton name="decision" value="accept" className="btn-primary btn-sm">Annehmen</SubmitButton>
                  <SubmitButton name="decision" value="decline" className="btn-secondary btn-sm">Ablehnen</SubmitButton>
                </form>
              </li>
            ))}
          </ul>
        </section>
      )}

      {upcoming.length > 0 && (
        <div className="mb-6 text-sm">
          <span className="font-medium">Nächste Termine:</span> {upcoming.slice(0, 5).map((m) => <Link key={m.id} href={`/meetings/${m.id}`} className="link ml-2">{m.company.name} ({dateTime(m.scheduledAt)})</Link>)}
        </div>
      )}

      <div className="mb-3 flex gap-1">
        {FILTERS.map(([key, label]) => <Link key={key} href={`/meetings?f=${key}`} className={key === filter[0] ? "btn-primary btn-sm" : "btn-secondary btn-sm"}>{label}</Link>)}
      </div>
      {meetings.length === 0 ? <Empty>Keine Gespräche in dieser Ansicht.</Empty> : (
        <div className="card overflow-x-auto">
          <table className="table">
            <thead><tr><th>Unternehmen</th><th>Status</th><th>Art</th><th>Initiiert von</th><th>Termin</th><th>Erstellt</th><th></th></tr></thead>
            <tbody>
              {meetings.map((m) => (
                <tr key={m.id}>
                  <td><Link className="link" href={`/companies/${m.companyId}?tab=meetings`}>{m.company.name}</Link></td>
                  <td><Badge tone={m.status === "LIVE" ? "green" : m.status === "REQUESTED" || m.status === "ACCEPTED" ? "violet" : "gray"}>{MEETING_STATUS_LABEL[m.status]}</Badge></td>
                  <td>{m.kind === "LIVE" ? "Live" : "Termin"}</td>
                  <td>{m.initiatedBy === "VISITOR" ? "Besucher" : "Berater"}</td>
                  <td>{dateTime(m.scheduledAt)}</td>
                  <td>{dateTime(m.createdAt)}</td>
                  <td><Link className="btn-secondary btn-sm" href={`/meetings/${m.id}`}>Öffnen</Link></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
