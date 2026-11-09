import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { PageHeader, Section, Stat } from "@/components/ui";
import { eur } from "@/lib/format";

export const metadata = { title: "Auswertungen" };

export default async function ReportsPage() {
  const user = await requireUser();
  const t = user.tenantId;
  const [stages, companies, sources, outreach, rooms, sessions, meetings, offers] = await Promise.all([
    db.pipelineStage.findMany({ where: { tenantId: t }, orderBy: { order: "asc" } }),
    db.company.findMany({ where: { tenantId: t }, select: { stageId: true, dealValue: true, industry: true, score: true } }),
    db.company.groupBy({ by: ["source"], where: { tenantId: t }, _count: true }),
    db.outreachMessage.groupBy({ by: ["status"], where: { tenantId: t }, _count: true }),
    db.room.count({ where: { tenantId: t, status: "PUBLISHED" } }),
    db.roomSession.count({ where: { room: { tenantId: t } } }),
    db.meeting.groupBy({ by: ["status"], where: { tenantId: t }, _count: true }),
    db.offer.groupBy({ by: ["status"], where: { tenantId: t }, _count: true }),
  ]);
  const sent = outreach.filter((o) => ["SENT", "REPLIED", "NO_RESPONSE"].includes(o.status)).reduce((s, o) => s + o._count, 0);
  const replied = outreach.find((o) => o.status === "REPLIED")?._count ?? 0;
  const won = offers.find((o) => o.status === "ACCEPTED")?._count ?? 0;
  const sentOffers = offers.filter((o) => ["PUBLISHED", "ACCEPTED", "DECLINED"].includes(o.status)).reduce((s, o) => s + o._count, 0);
  const max = Math.max(1, ...stages.map((s) => companies.filter((c) => c.stageId === s.id).length));
  const industries = Object.entries(companies.reduce<Record<string, number>>((a, c) => ((a[c.industry ?? "unbekannt"] = (a[c.industry ?? "unbekannt"] ?? 0) + 1), a), {})).sort((a, b) => b[1] - a[1]);
  return (
    <div className="space-y-6">
      <PageHeader title="Auswertungen" />
      <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
        <Stat label="Antwortquote LinkedIn" value={sent ? `${Math.round((replied / sent) * 100)} %` : "–"} hint={`${replied} von ${sent}`} />
        <Stat label="Veröffentlichte Kundenwelten" value={rooms} />
        <Stat label="Besuchersitzungen" value={sessions} />
        <Stat label="Gespräche beendet" value={meetings.find((m) => m.status === "ENDED")?._count ?? 0} />
        <Stat label="Angebots-Abschlussquote" value={sentOffers ? `${Math.round((won / sentOffers) * 100)} %` : "–"} hint={`${won} von ${sentOffers}`} />
      </div>
      <Section title="Trichter nach Phase">
        <div className="space-y-1.5">
          {stages.map((s) => {
            const list = companies.filter((c) => c.stageId === s.id);
            return (
              <div key={s.id} className="flex items-center gap-3 text-sm">
                <span className="w-56 shrink-0 text-ink-600">{s.name}</span>
                <div className="h-5 flex-1 rounded bg-ink-50"><div className="h-5 rounded" style={{ width: `${(list.length / max) * 100}%`, background: s.color, minWidth: list.length ? 4 : 0 }} /></div>
                <span className="w-10 text-right tabular-nums">{list.length}</span>
                <span className="w-28 text-right text-xs text-ink-500">{eur(list.reduce((a, c) => a + (c.dealValue ?? 0), 0))}</span>
              </div>
            );
          })}
        </div>
      </Section>
      <div className="grid gap-6 md:grid-cols-2">
        <Section title="Herkunft"><ul className="space-y-1 text-sm">{sources.map((s) => <li key={s.source} className="flex justify-between"><span>{s.source}</span><span>{s._count}</span></li>)}</ul></Section>
        <Section title="Branchen"><ul className="space-y-1 text-sm">{industries.map(([k, v]) => <li key={k} className="flex justify-between"><span>{k}</span><span>{v}</span></li>)}</ul></Section>
      </div>
    </div>
  );
}
