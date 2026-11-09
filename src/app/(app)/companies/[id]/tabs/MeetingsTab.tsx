import Link from "next/link";
import type { TabProps } from "./types";
import { db } from "@/lib/db";
import { Section, Badge, Empty } from "@/components/ui";
import { SubmitButton } from "@/components/SubmitButton";
import { scheduleMeeting, respondMeeting } from "@/app/(app)/meetings/actions";
import { MEETING_STATUS_LABEL } from "@/app/(app)/meetings/labels";
import { dateTime } from "@/lib/format";
import { OfferLiveButton } from "@/components/analysis/OfferLiveButton";

export default async function MeetingsTab({ companyId }: TabProps) {
  const [meetings, room] = await Promise.all([
    db.meeting.findMany({ where: { companyId }, include: { _count: { select: { notes: true, findings: true } } }, orderBy: { createdAt: "desc" } }),
    db.room.findUnique({ where: { companyId }, select: { id: true, status: true } }),
  ]);
  return (
    <div className="space-y-6">
      <Section title="Gespräch vereinbaren">
        <form action={scheduleMeeting} className="flex flex-wrap items-end gap-3">
          <input type="hidden" name="companyId" value={companyId} />
          <label><span className="label">Datum & Uhrzeit</span><input type="datetime-local" name="scheduledAt" required className="input" data-testid="schedule-at" /></label>
          <label className="min-w-[240px] flex-1"><span className="label">Hinweis für den Interessenten (optional)</span><input name="note" className="input" /></label>
          <SubmitButton data-testid="schedule-meeting">Termin anlegen</SubmitButton>
        </form>
        <p className="mt-2 text-xs text-ink-500">Der Termin erscheint in der Kundenwelt unter „Nächste Schritte“. Eine Kalendereinladung wird nicht automatisch versendet.</p>
        {room?.status === "PUBLISHED" && (
          <div className="mt-4 border-t border-ink-100 pt-4">
            <OfferLiveButton roomId={room.id} />
            <span className="ml-3 text-xs text-ink-500">Der Besucher sieht das Angebot, wenn er die Kundenwelt geöffnet hat, und entscheidet selbst.</span>
          </div>
        )}
      </Section>
      <Section title="Gespräche">
        {meetings.length === 0 ? <Empty>Noch keine Gespräche.</Empty> : (
          <ul className="divide-y divide-ink-100">
            {meetings.map((m) => (
              <li key={m.id} className="flex flex-wrap items-center gap-3 py-3">
                <Badge tone={m.status === "LIVE" ? "green" : m.status === "REQUESTED" ? "violet" : "gray"}>{MEETING_STATUS_LABEL[m.status]}</Badge>
                <span className="text-sm">{m.kind === "LIVE" ? "Live-Gespräch" : "Termin"} {m.scheduledAt && `· ${dateTime(m.scheduledAt)}`}</span>
                <span className="text-xs text-ink-500">{m._count.notes} Notizen · {m._count.findings} Erkenntnisse · erstellt {dateTime(m.createdAt)}</span>
                <span className="ml-auto flex gap-2">
                  {["OFFERED", "REQUESTED", "ACCEPTED", "SCHEDULED"].includes(m.status) && (
                    <form action={respondMeeting}><input type="hidden" name="meetingId" value={m.id} /><SubmitButton name="decision" value="cancel" className="btn-ghost btn-sm">Absagen</SubmitButton></form>
                  )}
                  <Link className="btn-primary btn-sm" href={`/meetings/${m.id}`}>Workspace öffnen</Link>
                </span>
              </li>
            ))}
          </ul>
        )}
      </Section>
    </div>
  );
}
