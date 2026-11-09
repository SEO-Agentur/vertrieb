import { db } from "./db";
import { getSetting } from "./settings";

/** Datenschutz: Aufbewahrungsfristen durchsetzen. Läuft im Worker (täglich) oder manuell in den Einstellungen. */
export async function runRetention(tenantId: string) {
  const p = await getSetting(tenantId, "privacy");
  const now = Date.now();
  const events = await db.roomEvent.deleteMany({ where: { room: { tenantId }, createdAt: { lt: new Date(now - p.roomEventRetentionDays * 86400_000) } } });
  const sessions = await db.roomSession.deleteMany({ where: { room: { tenantId }, expiresAt: { lt: new Date(now - 30 * 86400_000) } } });
  const verifications = await db.emailVerification.deleteMany({ where: { session: { room: { tenantId } }, expiresAt: { lt: new Date(now) } } });
  const userSessions = await db.userSession.deleteMany({ where: { user: { tenantId }, expiresAt: { lt: new Date(now) } } });
  const disqualified = await db.company.deleteMany({ where: { tenantId, qualificationStatus: "DISQUALIFIED", updatedAt: { lt: new Date(now - p.disqualifiedRetentionDays * 86400_000) } } });
  const notifications = await db.notification.deleteMany({ where: { tenantId, readAt: { lt: new Date(now - 90 * 86400_000) } } });
  const result = { roomEvents: events.count, roomSessions: sessions.count, verifications: verifications.count, userSessions: userSessions.count, disqualifiedCompanies: disqualified.count, notifications: notifications.count };
  await db.auditLog.create({ data: { tenantId, actorType: "SYSTEM", action: "retention.run", meta: result } });
  return result;
}
