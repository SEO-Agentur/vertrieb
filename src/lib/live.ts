import "server-only";
import { db } from "./db";
import { randomToken } from "./crypto";
import { logActivity, notify, audit } from "./audit";

export const PRESENCE_WINDOW_MS = 45_000;

/** Aktive Besucher: nur Sitzungen mit ausdrücklicher Einwilligung zur Anwesenheitsanzeige. */
export async function activeVisitors(tenantId: string) {
  const since = new Date(Date.now() - PRESENCE_WINDOW_MS);
  const sessions = await db.roomSession.findMany({
    where: { room: { tenantId }, presenceConsent: true, lastSeenAt: { gte: since }, endedAt: null },
    include: { room: { select: { id: true, slug: true, displayName: true, companyId: true } }, invite: { select: { contact: { select: { firstName: true, lastName: true } } } } },
    orderBy: { lastSeenAt: "desc" },
  });
  return sessions.map((s) => ({
    sessionId: s.id,
    roomId: s.room.id,
    slug: s.room.slug,
    company: s.room.displayName,
    companyId: s.room.companyId,
    // Verifiziert nur, wenn E-Mail-Bestätigung erfolgt ist – sonst "eingeladener Besucher"
    visitorLabel: s.verifiedAt ? `${s.displayName ?? s.verifiedEmail} (verifiziert)` : s.invite.contact ? `Eingeladener Besucher (Einladung an ${s.invite.contact.firstName} ${s.invite.contact.lastName})` : "Eingeladener Besucher",
    verified: Boolean(s.verifiedAt),
    section: s.currentSection,
    lastSeenAt: s.lastSeenAt,
    since: s.createdAt,
  }));
}

export async function offerLiveCall(params: { tenantId: string; userId: string; roomId: string; sessionId?: string | null }) {
  const room = await db.room.findFirstOrThrow({ where: { id: params.roomId, tenantId: params.tenantId } });
  // Offene Angebote nicht doppeln
  const open = await db.meeting.findFirst({ where: { roomId: room.id, status: { in: ["OFFERED", "ACCEPTED", "LIVE"] } } });
  if (open) return open;
  const meeting = await db.meeting.create({
    data: {
      tenantId: params.tenantId, companyId: room.companyId, roomId: room.id, status: "OFFERED", kind: "LIVE",
      initiatedBy: "CONSULTANT", visitorSessionId: params.sessionId ?? null, videoRoomName: `kw-${randomToken(12)}`,
    },
  });
  await logActivity({ tenantId: params.tenantId, companyId: room.companyId, userId: params.userId, type: "MEETING", title: "Live-Gespräch angeboten" });
  await audit({ tenantId: params.tenantId, actorType: "USER", actorId: params.userId, action: "meeting.offer", entity: "Meeting", entityId: meeting.id });
  return meeting;
}

export async function liveSnapshot(tenantId: string, userId: string) {
  const [visitors, notifications, requests, offered] = await Promise.all([
    activeVisitors(tenantId),
    db.notification.findMany({ where: { tenantId, readAt: null, OR: [{ userId }, { userId: null }] }, orderBy: { createdAt: "desc" }, take: 15 }),
    db.meeting.findMany({ where: { tenantId, status: { in: ["REQUESTED", "ACCEPTED"] } }, include: { company: { select: { name: true } } }, orderBy: { updatedAt: "desc" }, take: 10 }),
    db.meeting.findMany({ where: { tenantId, status: "OFFERED" }, select: { id: true, roomId: true } }),
  ]);
  return {
    visitors,
    notifications: notifications.map((n) => ({ id: n.id, type: n.type, title: n.title, body: n.body, link: n.link, createdAt: n.createdAt })),
    meetings: requests.map((m) => ({ id: m.id, status: m.status, kind: m.kind, company: m.company.name, companyId: m.companyId, updatedAt: m.updatedAt })),
    offeredRoomIds: offered.map((o) => o.roomId),
  };
}

export { notify };
