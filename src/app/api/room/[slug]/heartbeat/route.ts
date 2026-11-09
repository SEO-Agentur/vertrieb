import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { recordRoomEvent, ROOM_MODULES } from "@/lib/rooms";
import { notify } from "@/lib/audit";
import { badRequest, unauthorized, visitorForSlug, visitorRateLimit } from "@/lib/room-visitor";

const SECTIONS = ROOM_MODULES.map((m) => m.key) as [string, ...string[]];
const Body = z.object({ section: z.enum(SECTIONS).nullable().optional() });

/** Anwesenheitssignal – nur mit Einwilligung (presenceConsent). */
export async function POST(req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const limited = await visitorRateLimit("heartbeat", 30);
  if (limited) return limited;
  const { slug } = await params;
  const v = await visitorForSlug(slug);
  if (!v) return unauthorized();
  if (!v.session.presenceConsent) return NextResponse.json({ ok: false, reason: "no-consent" });
  const parsed = Body.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return badRequest();
  const section = parsed.data.section ?? null;

  const started = await db.roomEvent.findFirst({ where: { sessionId: v.session.id, type: "SESSION_START" }, select: { id: true } });
  if (!started) {
    await recordRoomEvent(v.room.id, v.session.id, "SESSION_START");
    await notify({ tenantId: v.room.tenantId, userId: v.room.consultantId, type: "VISITOR_ACTIVE", title: `Besucher aktiv: ${v.room.displayName}`, body: "Ein eingeladener Besucher betrachtet gerade die Kundenwelt.", link: `/live` });
  }
  if (v.session.analyticsConsent && section && section !== v.session.currentSection) {
    await recordRoomEvent(v.room.id, v.session.id, "SECTION_VIEW", { section });
  }
  await db.roomSession.update({ where: { id: v.session.id }, data: { lastSeenAt: new Date(), currentSection: section } });
  return NextResponse.json({ ok: true });
}
