import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { PageHeader, Section, Empty, Badge, ScoreBadge } from "@/components/ui";
import { dateTime } from "@/lib/format";
import { roleLabels } from "@/lib/normalize";
import { REJECTION_REASONS, OUTCOME_LABEL, type Outcome, type RejectionReason } from "@/lib/call-script";

export const metadata = { title: "Telefonate" };
export const dynamic = "force-dynamic";

export default async function CallsPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const user = await requireUser();
  const { q } = await searchParams;
  const endOfDay = new Date();
  endOfDay.setHours(23, 59, 59, 999);
  const monthAgo = new Date(Date.now() - 30 * 86400_000);
  const [due, fresh, calls] = await Promise.all([
    db.task.findMany({ where: { tenantId: user.tenantId, kind: "CALLBACK", doneAt: null, contactId: { not: null } }, orderBy: { dueAt: "asc" }, take: 100, include: { contact: { include: { company: { select: { name: true } } } } } }),
    db.contact.findMany({
      where: {
        tenantId: user.tenantId, phone: { not: null }, outreachStatus: { in: ["NONE", "PREPARED", "SENT"] },
        company: { qualificationStatus: { in: ["QUALIFIED", "IN_PROGRESS"] }, stage: { isLost: false } },
        ...(q ? { OR: [{ lastName: { contains: q, mode: "insensitive" } }, { company: { name: { contains: q, mode: "insensitive" } } }] } : {}),
      },
      include: { company: { select: { name: true, score: true, industry: true } } },
      orderBy: { company: { score: { sort: "desc", nulls: "last" } } },
      take: 100,
    }),
    db.activity.findMany({ where: { tenantId: user.tenantId, type: "CALL", createdAt: { gte: monthAgo } }, select: { meta: true } }),
  ]);
  const dueNow = due.filter((t) => !t.dueAt || t.dueAt <= endOfDay);
  const dueLater = due.filter((t) => t.dueAt && t.dueAt > endOfDay);
  const outcomes: Record<string, number> = {};
  const reasons: Record<string, number> = {};
  for (const c of calls) {
    const m = (c.meta ?? {}) as { outcome?: Outcome; reason?: RejectionReason };
    if (m.outcome) outcomes[m.outcome] = (outcomes[m.outcome] ?? 0) + 1;
    if (m.reason) reasons[m.reason] = (reasons[m.reason] ?? 0) + 1;
  }
  const rejected = outcomes.REJECTED ?? 0;
  return (
    <div className="space-y-6">
      <PageHeader title="Telefonate" subtitle="Arbeitsliste mit KI-gestütztem Gesprächsleitfaden. Es wird nichts aufgezeichnet." actions={<Link href="/settings?tab=callscript" className="btn-secondary">Leitfaden bearbeiten</Link>} />
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Section title={`Heute fällig (${dueNow.length})`}>
            {dueNow.length === 0 ? <Empty>Keine fälligen Rückrufe.</Empty> : (
              <ul className="divide-y divide-ink-100">{dueNow.map((t) => t.contact && (
                <li key={t.id} className="flex items-center gap-3 py-2 text-sm">
                  <div className="flex-1"><div className="font-medium">{t.contact.firstName} {t.contact.lastName} · {t.contact.company.name}</div><div className="text-xs text-ink-500">{t.title} · {dateTime(t.dueAt)}</div></div>
                  <Link href={`/calls/${t.contact.id}`} className="btn-primary btn-sm">Anrufen</Link>
                </li>
              ))}</ul>
            )}
          </Section>
          <Section title={`Neue Kontakte mit Telefonnummer (${fresh.length})`}>
            <form className="mb-3"><input name="q" defaultValue={q} placeholder="Name oder Unternehmen" className="input w-64" /></form>
            {fresh.length === 0 ? <Empty>Keine offenen Kontakte – Telefonnummern bei qualifizierten Unternehmen ergänzen.</Empty> : (
              <ul className="divide-y divide-ink-100">{fresh.map((c) => (
                <li key={c.id} className="flex items-center gap-3 py-2 text-sm">
                  <ScoreBadge score={c.company.score} />
                  <div className="flex-1"><div className="font-medium">{c.firstName} {c.lastName} <span className="text-ink-400">· {roleLabels[c.roleCategory ?? "OTHER"]}</span></div><div className="text-xs text-ink-500">{c.company.name} · {c.company.industry ?? "–"}</div></div>
                  <Link href={`/calls/${c.id}`} className="btn-secondary btn-sm" data-testid="start-call">Anrufen</Link>
                </li>
              ))}</ul>
            )}
          </Section>
          {dueLater.length > 0 && (
            <Section title={`Geplante Wiedervorlagen (${dueLater.length})`}>
              <ul className="space-y-1 text-sm">{dueLater.map((t) => t.contact && <li key={t.id}><Link className="hover:underline" href={`/calls/${t.contact.id}`}>{t.contact.firstName} {t.contact.lastName} · {t.contact.company.name}</Link> <Badge>{dateTime(t.dueAt)}</Badge></li>)}</ul>
            </Section>
          )}
        </div>
        <div className="space-y-6">
          <Section title="Ergebnisse (30 Tage)">
            {calls.length === 0 ? <Empty>Noch keine Telefonate.</Empty> : (
              <ul className="space-y-1 text-sm">{Object.entries(outcomes).sort((a, b) => b[1] - a[1]).map(([k, v]) => <li key={k} className="flex justify-between"><span>{OUTCOME_LABEL[k as Outcome]}</span><span className="tabular-nums">{v}</span></li>)}</ul>
            )}
          </Section>
          <Section title="Absagegründe (30 Tage)">
            {rejected === 0 ? <Empty>Keine Absagen erfasst.</Empty> : (
              <ul className="space-y-1.5 text-sm">{Object.entries(reasons).sort((a, b) => b[1] - a[1]).map(([k, v]) => (
                <li key={k}>
                  <div className="flex justify-between"><span>{REJECTION_REASONS[k as RejectionReason] ?? k}</span><span className="tabular-nums">{Math.round((v / rejected) * 100)} %</span></div>
                  <div className="mt-0.5 h-1.5 rounded bg-ink-100"><div className="h-1.5 rounded bg-ink-700" style={{ width: `${(v / rejected) * 100}%` }} /></div>
                </li>
              ))}</ul>
            )}
          </Section>
        </div>
      </div>
    </div>
  );
}
