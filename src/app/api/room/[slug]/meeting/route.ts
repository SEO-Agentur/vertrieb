import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { randomToken } from "@/lib/crypto";
import { recordRoomEvent } from "@/lib/rooms";
import { audit, logActivity, notify } from "@/lib/audit";
import { advanceStage } from "@/lib/pipeline";
import { rescoreCompany } from "@/lib/company-score";
import { badRequest, unauthorized, visitorForSlug, visitorRateLimit } from "@/lib/room-visitor";

const Body = z.object({
  action: z.enum(["accept", "decline", "later", "request", "schedule"]),
  meetingId: z.string().max(64).optional(),
  message: z.string().max(2000).optional(),
  preferredTimes: z.string().max(500).optional(),
});

export async function POST(req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const limited = await visitorRateLimit("meeting", 10);
  if (limited) return limited;
  const { slug } = await params;
  const v = await visitorForSlug(slug);
  if (!v) return unauthorized();
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return badRequest();
  const { action, meetingId, message, preferredTimes } = parsed.data;
  const { room, session } = v;
  const base = { tenantId: room.tenantId, userId: room.consultantId };
  const link = (id: string) => `/meetings/${id}`;

  if (action === "request" || action === "schedule") {
    const meeting = await db.meeting.create({
      data: {
        tenantId: room.tenantId, companyId: room.companyId, roomId: room.id, status: "REQUESTED",
        kind: action === "request" ? "LIVE" : "SCHEDULED", initiatedBy: "VISITOR", visitorSessionId: session.id,
        visitorMessage: message || null, preferredTimes: preferredTimes || null, videoRoomName: `kw-${randomToken(12)}`,
      },
    });
    await recordRoomEvent(room.id, session.id, "CALL_REQUESTED", { kind: meeting.kind });
    await notify({ ...base, type: "MEETING_REQUEST", title: `${action === "request" ? "Gesprächsanfrage" : "Terminwunsch"}: ${room.displayName}`, body: [message, preferredTimes && `Zeiten: ${preferredTimes}`].filter(Boolean).join(" · ") || undefined, link: link(meeting.id) });
    await logActivity({ tenantId: room.tenantId, companyId: room.companyId, type: "MEETING", title: action === "request" ? "Besucher fragt Videogespräch an" : "Besucher wünscht Termin", body: message ?? null });
    await advanceStage(room.companyId, "INTERESTED");
    await rescoreCompany(room.companyId).catch(() => {});
    await audit({ tenantId: room.tenantId, actorType: "VISITOR", actorId: session.id, action: `meeting.${action}`, entity: "Meeting", entityId: meeting.id });
    return NextResponse.json({ ok: true, meetingId: meeting.id });
  }

  if (!meetingId) return badRequest();
  const meeting = await db.meeting.findFirst({ where: { id: meetingId, roomId: room.id } });
  if (!meeting) return badRequest("Gespräch nicht gefunden");

  if (action === "accept") {
    if (!["OFFERED", "ACCEPTED", "LIVE"].includes(meeting.status)) return badRequest("Gespräch nicht mehr verfügbar");
    await db.meeting.update({ where: { id: meeting.id }, data: { status: meeting.status === "LIVE" ? "LIVE" : "ACCEPTED", visitorSessionId: session.id } });
    await recordRoomEvent(room.id, session.id, "CALL_ACCEPTED");
    await notify({ ...base, type: "MEETING_ACCEPTED", title: `Live-Gespräch angenommen: ${room.displayName}`, body: "Der Besucher wartet im Videoraum.", link: link(meeting.id) });
    await logActivity({ tenantId: room.tenantId, companyId: room.companyId, type: "MEETING", title: "Besucher hat Live-Gespräch angenommen" });
    await advanceStage(room.companyId, "MEETING_SCHEDULED");
  } else {
    const status = action === "decline" ? "DECLINED" : "LATER";
    if (meeting.status === "OFFERED") await db.meeting.update({ where: { id: meeting.id }, data: { status } });
    await notify({ ...base, type: "MEETING_DECLINED", title: `Live-Gespräch ${action === "decline" ? "abgelehnt" : "auf später verschoben"}: ${room.displayName}`, link: link(meeting.id) });
  }
  await audit({ tenantId: room.tenantId, actorType: "VISITOR", actorId: session.id, action: `meeting.${action}`, entity: "Meeting", entityId: meeting.id });
  return NextResponse.json({ ok: true, meetingId: meeting.id });
}
