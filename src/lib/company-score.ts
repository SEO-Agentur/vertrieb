import { db } from "./db";
import { computeScore } from "./scoring";
import { getSetting } from "./settings";

/** Berechnet den Lead-Score eines Unternehmens neu und speichert Gesamtwert + Begründung. */
export async function rescoreCompany(companyId: string) {
  const c = await db.company.findUniqueOrThrow({
    where: { id: companyId },
    include: { contacts: true, hypotheses: { where: { status: { not: "REJECTED" } } }, room: true, outreach: true, meetings: true },
  });
  const [icp, scoring] = await Promise.all([getSetting(c.tenantId, "icp"), getSetting(c.tenantId, "scoring")]);
  const events = c.room
    ? await db.roomEvent.groupBy({ by: ["type"], where: { roomId: c.room.id }, _count: true })
    : [];
  const ev = (t: string) => events.find((e) => e.type === t)?._count ?? 0;
  const result = computeScore(
    {
      industry: c.industry, revenueEur: c.revenueEur, revenueStatus: c.revenueStatus, country: c.country, ownership: c.ownership,
      salesDependency: c.salesDependency, digitalSignals: c.digitalSignals, regulatoryHurdle: c.regulatoryHurdle, procurementEffort: c.procurementEffort,
      contactRoles: c.contacts.map((x) => x.roleCategory ?? "OTHER"),
      engagement: {
        roomVisits: ev("SESSION_START"),
        sectionViews: ev("SECTION_VIEW"),
        callRequests: ev("CALL_REQUESTED"),
        meetings: c.meetings.filter((m) => m.status === "ENDED" || m.status === "LIVE").length,
        replies: c.outreach.filter((o) => o.status === "REPLIED").length,
      },
      hypothesesCount: c.hypotheses.length,
    },
    icp,
    scoring,
  );
  await db.company.update({ where: { id: c.id }, data: { score: result.total, scoreBreakdown: result as unknown as object, scoredAt: new Date() } });
  return result;
}
