import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { PageHeader, Badge, Empty } from "@/components/ui";
import { dateTime } from "@/lib/format";

export const metadata = { title: "Aktivitäten" };

export default async function ActivitiesPage({ searchParams }: { searchParams: Promise<{ type?: string }> }) {
  const user = await requireUser();
  const { type } = await searchParams;
  const activities = await db.activity.findMany({ where: { tenantId: user.tenantId, ...(type ? { type } : {}) }, orderBy: { createdAt: "desc" }, take: 300, include: { company: { select: { id: true, name: true } }, user: { select: { name: true } } } });
  const types = await db.activity.groupBy({ by: ["type"], where: { tenantId: user.tenantId }, _count: true });
  return (
    <div>
      <PageHeader title="Aktivitäten" />
      <div className="mb-4 flex flex-wrap gap-1">
        <Link href="/activities" className={`btn-sm ${!type ? "btn-primary" : "btn-secondary"}`}>Alle</Link>
        {types.map((t) => <Link key={t.type} href={`/activities?type=${t.type}`} className={`btn-sm ${type === t.type ? "btn-primary" : "btn-secondary"}`}>{t.type} ({t._count})</Link>)}
      </div>
      {activities.length === 0 ? <Empty>Keine Aktivitäten.</Empty> : (
        <div className="card divide-y divide-ink-100">
          {activities.map((a) => (
            <div key={a.id} className="flex flex-wrap items-start gap-3 px-4 py-3 text-sm">
              <span className="w-32 shrink-0 text-xs text-ink-400">{dateTime(a.createdAt)}</span>
              <Badge>{a.type}</Badge>
              <div className="min-w-0 flex-1">
                <div><strong>{a.title}</strong>{a.company && <> · <Link className="hover:underline" href={`/companies/${a.company.id}?tab=activities`}>{a.company.name}</Link></>}</div>
                {a.body && <p className="whitespace-pre-wrap text-ink-600">{a.body}</p>}
              </div>
              <span className="text-xs text-ink-400">{a.user?.name ?? "System"}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
