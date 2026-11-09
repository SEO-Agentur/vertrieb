import { db } from "@/lib/db";
import { Section, Badge, Empty } from "@/components/ui";
import { dateTime } from "@/lib/format";
import type { TabProps } from "./types";

export default async function ActivitiesTab({ companyId }: TabProps) {
  const [activities, room] = await Promise.all([
    db.activity.findMany({ where: { companyId }, orderBy: { createdAt: "desc" }, take: 200, include: { user: { select: { name: true } } } }),
    db.room.findUnique({ where: { companyId }, select: { id: true } }),
  ]);
  const events = room ? await db.roomEvent.findMany({ where: { roomId: room.id }, orderBy: { createdAt: "desc" }, take: 100 }) : [];
  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <div className="lg:col-span-2">
        <Section title="Aktivitätsverlauf">
          {activities.length === 0 ? <Empty>Keine Aktivitäten.</Empty> : (
            <ol className="relative space-y-4 border-l border-ink-200 pl-5">
              {activities.map((a) => (
                <li key={a.id}>
                  <span className="absolute -left-1.5 mt-1 h-3 w-3 rounded-full border-2 border-white bg-ink-400" />
                  <div className="flex flex-wrap items-center gap-2 text-sm"><Badge>{a.type}</Badge><strong>{a.title}</strong><span className="text-xs text-ink-400">{dateTime(a.createdAt)}{a.user ? ` · ${a.user.name}` : ""}</span></div>
                  {a.body && <p className="mt-1 whitespace-pre-wrap text-sm text-ink-600">{a.body}</p>}
                </li>
              ))}
            </ol>
          )}
        </Section>
      </div>
      <Section title="Kundenwelt-Ereignisse">
        <p className="mb-2 text-xs text-ink-400">Nur Ereignisse, die mit Einwilligung bzw. technisch notwendig erfasst wurden (keine IP-Adressen).</p>
        {events.length === 0 ? <Empty>Keine Ereignisse.</Empty> : (
          <ul className="space-y-1 text-xs">{events.map((e) => <li key={e.id} className="flex justify-between gap-2"><span>{e.type}{e.meta && typeof e.meta === "object" && "section" in e.meta ? ` · ${String((e.meta as { section: string }).section)}` : ""}</span><span className="text-ink-400">{dateTime(e.createdAt)}</span></li>)}</ul>
        )}
      </Section>
    </div>
  );
}
