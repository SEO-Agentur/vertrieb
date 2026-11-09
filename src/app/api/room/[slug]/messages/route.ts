import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { notify, logActivity } from "@/lib/audit";
import { badRequest, unauthorized, visitorForSlug, visitorRateLimit } from "@/lib/room-visitor";

const Body = z.object({ body: z.string().trim().min(1).max(4000), authorName: z.string().trim().max(120).optional(), offerId: z.string().max(64).optional() });

export async function POST(req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const limited = await visitorRateLimit("messages", 10);
  if (limited) return limited;
  const { slug } = await params;
  const v = await visitorForSlug(slug);
  if (!v) return unauthorized();
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return badRequest();
  const { body, authorName, offerId } = parsed.data;
  if (offerId) {
    const offer = await db.offer.findFirst({ where: { id: offerId, roomId: v.room.id, status: { in: ["PUBLISHED", "ACCEPTED", "DECLINED"] } } });
    if (!offer) return badRequest();
  }
  const name = authorName || v.session.displayName || v.session.verifiedEmail || "Besucher";
  const msg = await db.roomMessage.create({ data: { roomId: v.room.id, offerId: offerId ?? null, fromVisitor: true, authorName: name, body } });
  await notify({ tenantId: v.room.tenantId, userId: v.room.consultantId, type: "ROOM_MESSAGE", title: `${offerId ? "Rückfrage zum Angebot" : "Nachricht"}: ${v.room.displayName}`, body: body.slice(0, 140), link: offerId ? `/offers/${offerId}` : `/companies/${v.room.companyId}?tab=room` });
  await logActivity({ tenantId: v.room.tenantId, companyId: v.room.companyId, type: "ROOM_MESSAGE", title: offerId ? "Rückfrage zum Angebot" : "Nachricht aus der Kundenwelt", body });
  return NextResponse.json({ ok: true, id: msg.id });
}
