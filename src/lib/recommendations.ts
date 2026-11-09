import { db } from "./db";

export type Recommendation = { priority: number; title: string; reason: string; href: string };

/** Regelbasierte Priorisierung der nächsten Schritte (nachvollziehbar, keine Blackbox). */
export async function nextActions(tenantId: string): Promise<Recommendation[]> {
  const recs: Recommendation[] = [];
  const now = new Date();
  const [requests, accepted, offersQuestions, followUps, qualifiedNoRoom, roomNoOutreach, approvedNotSent, visitedNoMeeting, unreviewed, overdue] = await Promise.all([
    db.meeting.findMany({ where: { tenantId, status: "REQUESTED" }, include: { company: { select: { name: true } } } }),
    db.meeting.findMany({ where: { tenantId, status: "ACCEPTED" }, include: { company: { select: { name: true } } } }),
    db.roomMessage.findMany({ where: { room: { tenantId }, fromVisitor: true, readAt: null }, include: { room: { select: { companyId: true, displayName: true } } }, take: 10 }),
    db.outreachMessage.findMany({ where: { tenantId, status: "SENT", followUpAt: { lte: now } }, include: { company: { select: { id: true, name: true } } }, take: 10 }),
    db.company.findMany({ where: { tenantId, qualificationStatus: "QUALIFIED", room: null }, orderBy: { score: "desc" }, take: 5 }),
    db.company.findMany({ where: { tenantId, room: { status: "PUBLISHED" }, outreach: { none: {} } }, take: 5 }),
    db.outreachMessage.findMany({ where: { tenantId, status: "APPROVED" }, include: { company: { select: { id: true, name: true } } }, take: 5 }),
    db.company.findMany({ where: { tenantId, stage: { key: { in: ["ROOM_VISITED", "INTERESTED"] } }, meetings: { none: {} } }, take: 5 }),
    db.company.findMany({ where: { tenantId, hypotheses: { some: { reviewed: false } } }, take: 5 }),
    db.task.count({ where: { tenantId, doneAt: null, dueAt: { lt: now } } }),
  ]);
  for (const m of accepted) recs.push({ priority: 100, title: `Gespräch mit ${m.company.name} beitreten`, reason: "Interessent hat das Live-Gespräch angenommen.", href: `/meetings/${m.id}` });
  for (const m of requests) recs.push({ priority: 95, title: `Gesprächsanfrage von ${m.company.name} beantworten`, reason: "Eingehende Anfrage aus der Kundenwelt.", href: `/meetings/${m.id}` });
  for (const q of offersQuestions) recs.push({ priority: 90, title: `Rückfrage von ${q.room.displayName} beantworten`, reason: q.body.slice(0, 80), href: `/companies/${q.room.companyId}?tab=room` });
  for (const v of visitedNoMeeting) recs.push({ priority: 80, title: `${v.name}: Gespräch vorschlagen`, reason: "Kundenwelt wurde besucht, noch kein Gespräch.", href: `/companies/${v.id}?tab=meetings` });
  for (const f of followUps) recs.push({ priority: 70, title: `Follow-up an ${f.company.name}`, reason: "Follow-up-Termin erreicht.", href: `/companies/${f.company.id}?tab=outreach` });
  for (const a of approvedNotSent) recs.push({ priority: 65, title: `Freigegebene Nachricht an ${a.company.name} versenden`, reason: "Nachricht ist freigegeben, aber noch nicht als gesendet dokumentiert.", href: `/companies/${a.company.id}?tab=outreach` });
  for (const c of roomNoOutreach) recs.push({ priority: 60, title: `${c.name}: LinkedIn-Nachricht vorbereiten`, reason: "Kundenwelt ist veröffentlicht, aber noch keine Ansprache vorbereitet.", href: `/companies/${c.id}?tab=outreach` });
  for (const c of qualifiedNoRoom) recs.push({ priority: 50 + Math.round((c.score ?? 0) / 10), title: `${c.name}: Kundenwelt erstellen`, reason: `Qualifiziert (Score ${c.score ?? "–"}), noch keine Kundenwelt.`, href: `/companies/${c.id}?tab=room` });
  for (const c of unreviewed) recs.push({ priority: 40, title: `${c.name}: Recherche prüfen`, reason: "Ungeprüfte Hypothesen vorhanden.", href: `/companies/${c.id}?tab=research` });
  if (overdue) recs.push({ priority: 45, title: `${overdue} überfällige Aufgabe(n)`, reason: "Fälligkeitsdatum überschritten.", href: "/tasks" });
  return recs.sort((a, b) => b.priority - a.priority).slice(0, 12);
}
