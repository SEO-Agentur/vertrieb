import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { createVideoToken, videoStatus } from "@/lib/video";
import { audit } from "@/lib/audit";
import { badRequest, unauthorized, visitorForSlug, visitorRateLimit } from "@/lib/room-visitor";

export async function POST(req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const limited = await visitorRateLimit("video", 20);
  if (limited) return limited;
  const { slug } = await params;
  const v = await visitorForSlug(slug);
  if (!v) return unauthorized();
  const meetingId = new URL(req.url).searchParams.get("meetingId");
  if (!meetingId) return badRequest();
  const meeting = await db.meeting.findFirst({ where: { id: meetingId, roomId: v.room.id, status: { in: ["ACCEPTED", "LIVE"] } } });
  if (!meeting) return badRequest("Gespräch nicht verfügbar");
  const st = videoStatus();
  if (!st.enabled) return NextResponse.json({ error: "Die Videofunktion ist noch nicht aktiviert.", notActivated: true }, { status: 503 });
  if (meeting.status !== "LIVE") await db.meeting.update({ where: { id: meeting.id }, data: { status: "LIVE", startedAt: meeting.startedAt ?? new Date() } });
  const name = v.session.displayName || v.session.verifiedEmail || `Gast (${v.room.displayName})`;
  const token = await createVideoToken({ roomName: meeting.videoRoomName, identity: `visitor-${v.session.id}`, name, isHost: false });
  await audit({ tenantId: v.room.tenantId, actorType: "VISITOR", actorId: v.session.id, action: "meeting.video_join", entity: "Meeting", entityId: meeting.id });
  return NextResponse.json(token);
}
