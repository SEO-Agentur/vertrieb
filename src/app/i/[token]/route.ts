import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { checkInvite, recordRoomEvent, visitorCookieName } from "@/lib/rooms";
import { hashToken, randomToken } from "@/lib/crypto";
import { clientKey, rateLimit } from "@/lib/rate-limit";
import { getSetting } from "@/lib/settings";
import { audit, logActivity, notify } from "@/lib/audit";
import { advanceStage } from "@/lib/pipeline";

export const dynamic = "force-dynamic";

/** Einlösen eines Einladungslinks → Besuchersitzung + Cookie, Token verschwindet aus der URL. */
export async function GET(req: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const base = new URL(req.url);
  const deny = (status: string) => NextResponse.redirect(new URL(`/room/zugang?status=${status}`, base), { status: 303 });

  const rl = rateLimit(`invite:${clientKey(req.headers)}`, 20, 10 * 60_000);
  if (!rl.ok) return deny("limit");

  const check = await checkInvite(token);
  // Gleiche Antwort für alle Fehlerfälle – keine Rückschlüsse auf Existenz.
  if (!check.ok) return deny("invalid");
  const { invite } = check;
  const room = invite.room;
  const privacy = await getSetting(room.tenantId, "privacy");

  const sessionToken = randomToken();
  const expiresAt = new Date(Date.now() + privacy.roomSessionDays * 86400_000);
  const session = await db.roomSession.create({
    data: { roomId: room.id, inviteId: invite.id, tokenHash: hashToken(sessionToken), expiresAt },
  });
  await db.roomInvite.update({ where: { id: invite.id }, data: { useCount: { increment: 1 }, lastUsedAt: new Date() } });
  await recordRoomEvent(room.id, session.id, "INVITE_REDEEMED", { inviteHint: invite.tokenHint });
  await audit({ tenantId: room.tenantId, actorType: "VISITOR", actorId: session.id, action: "room.invite_redeemed", entity: "RoomInvite", entityId: invite.id });
  await notify({ tenantId: room.tenantId, userId: room.consultantId, type: "ROOM_VISIT", title: `Einladung geöffnet: ${room.displayName}`, body: "Ein eingeladener Besucher hat die Kundenwelt geöffnet.", link: `/companies/${room.companyId}?tab=room` });
  await logActivity({ tenantId: room.tenantId, companyId: room.companyId, type: "ROOM_VISIT", title: "Einladungslink eingelöst – Kundenwelt geöffnet" });
  await advanceStage(room.companyId, "ROOM_VISITED");

  const res = NextResponse.redirect(new URL(`/room/${room.slug}`, base), { status: 303 });
  res.cookies.set(visitorCookieName(room.id), sessionToken, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: expiresAt,
  });
  res.headers.set("Referrer-Policy", "no-referrer");
  return res;
}
