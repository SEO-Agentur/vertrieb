import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { meetingForUser } from "@/lib/access";
import { db } from "@/lib/db";
import { Badge, InfoStatusBadge, NotActivated, Empty } from "@/components/ui";
import { VideoCall } from "@/components/video/VideoCall";
import { FindingForm } from "@/components/analysis/FindingForm";
import { SubmitButton } from "@/components/SubmitButton";
import { PresenterControls } from "./PresenterControls";
import { AiAssist } from "./AiAssist";
import { addMeetingNote, deleteMeetingNote, endMeeting, setMeetingConsent, respondMeeting } from "../actions";
import { suggestSolution } from "@/app/(app)/analyses/actions";
import { aiStatus } from "@/lib/ai/provider";
import { videoStatus } from "@/lib/video";
import { millions, number, dateTime, infoStatusLabel } from "@/lib/format";
import { MEETING_STATUS_LABEL } from "../labels";

export const metadata = { title: "Gespräch" };

const PANELS = [
  ["company", "Unternehmen"], ["comms", "Kommunikation"], ["research", "Recherche"], ["guide", "Leitfaden"],
  ["notes", "Notizen"], ["findings", "Erkenntnisse"], ["solutions", "Lösungen"], ["ai", "KI-Assistent"],
] as const;

export default async function MeetingWorkspace({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ panel?: string }> }) {
  const user = await requireUser();
  const { id } = await params;
  const { panel = "notes" } = await searchParams;
  const m = await meetingForUser(id, user);
  const [company, notes, findings, categories, room] = await Promise.all([
    db.company.findUniqueOrThrow({ where: { id: m.companyId }, include: { contacts: true, facts: { orderBy: { createdAt: "desc" } }, hypotheses: { orderBy: { order: "asc" } } } }),
    db.meetingNote.findMany({ where: { meetingId: m.id }, orderBy: { createdAt: "asc" } }),
    db.finding.findMany({ where: { companyId: m.companyId }, include: { problem: true }, orderBy: { createdAt: "asc" } }),
    db.problemCategory.findMany({ where: { tenantId: user.tenantId }, orderBy: { order: "asc" } }),
    m.roomId ? db.room.findUnique({ where: { id: m.roomId } }) : null,
  ]);
  const closed = ["ENDED", "CANCELLED", "DECLINED"].includes(m.status);
  const video = videoStatus();
  const ai = aiStatus();

  return (
    <div>
      <div className="mb-1 text-xs text-ink-400"><Link href="/meetings" className="hover:underline">Videogespräche</Link> /</div>
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <h1 className="h1">Gespräch mit <Link className="link" href={`/companies/${company.id}`}>{company.name}</Link></h1>
        <Badge tone={m.status === "LIVE" ? "green" : closed ? "gray" : "amber"}>{MEETING_STATUS_LABEL[m.status] ?? m.status}</Badge>
        {m.scheduledAt && <span className="text-sm text-ink-500">Termin: {dateTime(m.scheduledAt)}</span>}
        {!closed && (
          <form action={endMeeting} className="ml-auto">
            <input type="hidden" name="meetingId" value={m.id} />
            <SubmitButton className="btn-danger" confirm="Gespräch beenden?" data-testid="end-meeting">Gespräch beenden</SubmitButton>
          </form>
        )}
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
        <div className="space-y-4">
          {!video.enabled && <NotActivated name="Videointegration (LiveKit)" detail={video.reason} />}
          {closed ? <Empty>Dieses Gespräch ist {MEETING_STATUS_LABEL[m.status]?.toLowerCase()}.</Empty> : <VideoCall tokenUrl={`/api/meetings/${m.id}/video-token`} />}
          {m.status === "REQUESTED" && (
            <div className="card-pad">
              <div className="mb-2 text-sm font-medium">Anfrage des Besuchers</div>
              {m.visitorMessage && <p className="mb-2 text-sm text-ink-600">„{m.visitorMessage}“</p>}
              {m.preferredTimes && <p className="mb-2 text-xs text-ink-500">Wunschzeiten: {m.preferredTimes}</p>}
              <form action={respondMeeting} className="flex flex-wrap items-end gap-2">
                <input type="hidden" name="meetingId" value={m.id} />
                <label><span className="label">Termin (leer = jetzt live)</span><input type="datetime-local" name="scheduledAt" className="input" /></label>
                <button name="decision" value="accept" className="btn-primary">Annehmen</button>
                <button name="decision" value="decline" className="btn-secondary">Ablehnen</button>
              </form>
            </div>
          )}
          <div className="card-pad">
            <div className="mb-2 text-sm font-medium">Gemeinsam durch die Kundenwelt navigieren</div>
            <PresenterControls meetingId={m.id} initialActive={m.presenterActive} initialSection={m.presenterSection} hasRoom={Boolean(room)} />
            {room && <p className="mt-2 text-xs text-ink-500">Kundenwelt: /room/{room.slug} ({room.status === "PUBLISHED" ? "veröffentlicht" : "nicht veröffentlicht"})</p>}
          </div>
          <div className="card-pad">
            <div className="mb-2 text-sm font-medium">Einwilligungen</div>
            <form action={setMeetingConsent} className="flex flex-wrap items-center gap-4 text-sm">
              <input type="hidden" name="meetingId" value={m.id} />
              <label className="flex items-center gap-2"><input type="checkbox" name="recordingConsent" defaultChecked={m.recordingConsent} /> Aufzeichnung erlaubt</label>
              <label className="flex items-center gap-2"><input type="checkbox" name="transcriptionConsent" defaultChecked={m.transcriptionConsent} /> Transkription erlaubt</label>
              <SubmitButton className="btn-secondary btn-sm">Speichern</SubmitButton>
            </form>
            <p className="mt-2 text-xs text-ink-500">Hinweis: Aufzeichnung und Transkription sind derzeit nicht implementiert; es wird ausschließlich die dokumentierte Einwilligung gespeichert. Es findet keine heimliche Aufzeichnung statt.</p>
          </div>
        </div>

        <div className="card min-w-0">
          <nav className="flex flex-wrap gap-1 border-b border-ink-100 px-3 pt-2">
            {PANELS.map(([key, label]) => (
              <Link key={key} href={`/meetings/${m.id}?panel=${key}`} className={`-mb-px border-b-2 px-2 py-1.5 text-xs ${panel === key ? "border-ink-900 font-medium" : "border-transparent text-ink-500"}`}>{label}</Link>
            ))}
          </nav>
          <div className="max-h-[75vh] overflow-y-auto p-4 text-sm">
            {panel === "company" && (
              <dl className="grid grid-cols-[140px_1fr] gap-x-3 gap-y-1.5">
                <dt className="text-ink-500">Branche</dt><dd>{company.industry ?? "unbekannt"}</dd>
                <dt className="text-ink-500">Standort</dt><dd>{company.location ?? "unbekannt"}</dd>
                <dt className="text-ink-500">Umsatz</dt><dd>{millions(company.revenueEur)} <InfoStatusBadge status={company.revenueStatus} />{company.revenueSource && <span className="text-xs text-ink-400"> Quelle: {company.revenueSource}</span>}</dd>
                <dt className="text-ink-500">Mitarbeiter</dt><dd>{number(company.employees)} <span className="text-xs text-ink-400">({infoStatusLabel[company.employeesStatus]})</span></dd>
                <dt className="text-ink-500">Vertriebsteam</dt><dd>{number(company.salesTeamSize)}</dd>
                <dt className="text-ink-500">Produkte</dt><dd>{company.products ?? "–"}</dd>
                <dt className="text-ink-500">Märkte</dt><dd>{company.markets ?? "–"}</dd>
                <dt className="text-ink-500">Systeme</dt><dd>{company.technologies ?? "–"}</dd>
                <dt className="text-ink-500">Eigentümer</dt><dd>{company.ownership ?? "–"}</dd>
                <dt className="text-ink-500">Kontakte</dt><dd>{company.contacts.map((c) => `${c.firstName} ${c.lastName}${c.title ? ` (${c.title})` : ""}`).join(", ") || "–"}</dd>
              </dl>
            )}
            {panel === "comms" && <Comms companyId={company.id} roomId={m.roomId} />}
            {panel === "research" && (
              <div className="space-y-4">
                <div>
                  <div className="h2 mb-2">Fakten</div>
                  {company.facts.length === 0 ? <p className="text-ink-500">Keine Fakten erfasst.</p> : (
                    <ul className="space-y-1">{company.facts.map((f) => <li key={f.id}><InfoStatusBadge status={f.status} /> <strong>{f.label}:</strong> {f.value} {f.sourceName && <span className="text-xs text-ink-400">({f.sourceName})</span>}</li>)}</ul>
                  )}
                </div>
                <div>
                  <div className="h2 mb-2">Verbesserungs-Hypothesen</div>
                  <ul className="space-y-1">{company.hypotheses.map((h) => <li key={h.id}><InfoStatusBadge status={h.status} /> <strong>{h.topic}</strong> – {h.rationale}</li>)}</ul>
                </div>
              </div>
            )}
            {panel === "guide" && (
              <div className="space-y-4">
                {categories.map((c) => (
                  <div key={c.id}>
                    <div className="font-medium">{c.name}</div>
                    <ul className="ml-4 list-disc text-ink-600">{(c.questions as string[]).map((q, i) => <li key={i}>{q}</li>)}</ul>
                  </div>
                ))}
              </div>
            )}
            {panel === "notes" && (
              <div className="space-y-3">
                <p className="text-xs text-ink-500">Interne Notizen – für den Interessenten nicht sichtbar.</p>
                <form action={addMeetingNote} className="space-y-2">
                  <input type="hidden" name="meetingId" value={m.id} />
                  <select name="area" className="input">
                    <option value="ALLGEMEIN">Allgemein</option>
                    {categories.map((c) => <option key={c.id} value={c.key}>{c.name}</option>)}
                  </select>
                  <textarea name="body" rows={3} className="input" placeholder="Notiz …" data-testid="meeting-note" />
                  <SubmitButton className="btn-primary btn-sm">Notiz speichern</SubmitButton>
                </form>
                <ul className="divide-y divide-ink-100">
                  {notes.map((n) => (
                    <li key={n.id} className="flex gap-2 py-2">
                      <div className="flex-1"><Badge>{n.area ?? "ALLGEMEIN"}</Badge> <span className="whitespace-pre-wrap">{n.body}</span></div>
                      <form action={deleteMeetingNote}><input type="hidden" name="id" value={n.id} /><button className="text-xs text-ink-400 hover:text-red-600">×</button></form>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {panel === "findings" && (
              <div className="space-y-4">
                <FindingForm tenantId={user.tenantId} companyId={company.id} meetingId={m.id} />
                <ul className="divide-y divide-ink-100">
                  {findings.map((f) => (
                    <li key={f.id} className="py-2"><strong>{f.title}</strong> <InfoStatusBadge status={f.status} /> <Badge>{f.area}</Badge>{f.shareWithClient && <> <Badge tone="green">freigegeben</Badge></>}</li>
                  ))}
                </ul>
              </div>
            )}
            {panel === "solutions" && <SolutionsPanel companyId={company.id} meetingId={m.id} tenantId={user.tenantId} />}
            {panel === "ai" && (
              <div className="space-y-3">
                {ai.enabled ? <AiAssist meetingId={m.id} companyId={company.id} /> : (
                  <>
                    <NotActivated name="KI-Assistent" detail={ai.reason} />
                    <div className="text-xs font-semibold text-ink-500">Regelbasierte Hilfe (keine KI): noch nicht besprochene Bereiche</div>
                    {categories.filter((c) => !notes.some((n) => n.area === c.key) && !findings.some((f) => f.area === c.key)).map((c) => (
                      <div key={c.id}>
                        <div className="font-medium">{c.name}</div>
                        <ul className="ml-4 list-disc text-ink-600">{(c.questions as string[]).map((q, i) => <li key={i}>{q}</li>)}</ul>
                      </div>
                    ))}
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

async function Comms({ companyId, roomId }: { companyId: string; roomId: string | null }) {
  const [acts, outreach, messages] = await Promise.all([
    db.activity.findMany({ where: { companyId }, orderBy: { createdAt: "desc" }, take: 30 }),
    db.outreachMessage.findMany({ where: { companyId }, orderBy: { createdAt: "desc" } }),
    roomId ? db.roomMessage.findMany({ where: { roomId }, orderBy: { createdAt: "desc" }, take: 20 }) : [],
  ]);
  return (
    <div className="space-y-4">
      <div>
        <div className="h2 mb-2">Outreach</div>
        {outreach.length === 0 ? <p className="text-ink-500">Keine Nachrichten.</p> : outreach.map((o) => (
          <details key={o.id} className="mb-1"><summary>{o.channel} · {o.status} · {dateTime(o.sentAt ?? o.createdAt)}</summary><pre className="whitespace-pre-wrap text-xs text-ink-600">{o.body}</pre></details>
        ))}
      </div>
      {messages.length > 0 && (
        <div>
          <div className="h2 mb-2">Nachrichten in der Kundenwelt</div>
          {messages.map((x) => <p key={x.id} className="mb-1"><strong>{x.authorName}:</strong> {x.body} <span className="text-xs text-ink-400">{dateTime(x.createdAt)}</span></p>)}
        </div>
      )}
      <div>
        <div className="h2 mb-2">Aktivitäten</div>
        <ul className="space-y-1">{acts.map((a) => <li key={a.id}><span className="text-xs text-ink-400">{dateTime(a.createdAt)}</span> {a.title}</li>)}</ul>
      </div>
    </div>
  );
}

async function SolutionsPanel({ companyId, meetingId, tenantId }: { companyId: string; meetingId: string; tenantId: string }) {
  const [findings, linked, solutions] = await Promise.all([
    db.finding.findMany({ where: { companyId, status: { not: "REJECTED" }, problemId: { not: null } } }),
    db.companySolution.findMany({ where: { companyId }, include: { solution: true } }),
    db.solution.findMany({ where: { tenantId, active: true }, include: { problems: { include: { problem: true } }, services: { include: { service: true } } }, orderBy: { name: "asc" } }),
  ]);
  const problemIds = new Set(findings.map((f) => f.problemId!));
  const linkedIds = new Set(linked.map((l) => l.solutionId));
  const matching = solutions.filter((s) => s.problems.some((p) => problemIds.has(p.problemId)));
  const rest = solutions.filter((s) => !matching.includes(s));
  const Item = ({ s }: { s: (typeof solutions)[number] }) => (
    <li className="py-2">
      <div className="flex items-start gap-2">
        <div className="flex-1">
          <div className="font-medium">{s.name}</div>
          <div className="text-xs text-ink-500">{s.description}</div>
          <div className="text-xs text-ink-400">Adressiert: {s.problems.map((p) => p.problem.name).join(", ") || "–"} · Leistungen: {s.services.map((x) => x.service.name).join(", ") || "–"}</div>
        </div>
        {linkedIds.has(s.id) ? <Badge tone="green">vorgeschlagen</Badge> : (
          <form action={suggestSolution}>
            <input type="hidden" name="companyId" value={companyId} />
            <input type="hidden" name="meetingId" value={meetingId} />
            <input type="hidden" name="solutionId" value={s.id} />
            {findings.filter((f) => s.problems.some((p) => p.problemId === f.problemId)).map((f) => <input key={f.id} type="hidden" name="findingIds" value={f.id} />)}
            <button className="btn-secondary btn-sm" data-testid="suggest-solution">Vorschlagen</button>
          </form>
        )}
      </div>
    </li>
  );
  return (
    <div className="space-y-4">
      <div>
        <div className="h2 mb-1">Passend zu dokumentierten Problemen</div>
        {matching.length === 0 ? <p className="text-ink-500">Ordnen Sie Erkenntnissen ein Katalog-Problem zu, um passende Lösungen zu sehen.</p> : <ul className="divide-y divide-ink-100">{matching.map((s) => <Item key={s.id} s={s} />)}</ul>}
      </div>
      <details>
        <summary className="cursor-pointer text-xs font-semibold text-ink-500">Gesamter Lösungskatalog ({rest.length})</summary>
        <ul className="divide-y divide-ink-100">{rest.map((s) => <Item key={s.id} s={s} />)}</ul>
      </details>
      <div className="flex gap-3 border-t border-ink-100 pt-3">
        <Link className="link" href={`/companies/${companyId}?tab=analysis`}>Lösungen auswählen & Wirtschaftlichkeit</Link>
        <Link className="link" href={`/companies/${companyId}?tab=offers`}>Angebotskonfigurator</Link>
      </div>
    </div>
  );
}
