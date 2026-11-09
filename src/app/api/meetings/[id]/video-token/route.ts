import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { createVideoToken, videoStatus } from "@/lib/video";
import { audit } from "@/lib/audit";

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user || user.role === "VIEWER") return NextResponse.json({ error: "Keine Berechtigung" }, { status: 403 });
  const { id } = await params;
  const meeting = await db.meeting.findFirst({ where: { id, tenantId: user.tenantId } });
  if (!meeting) return NextResponse.json({ error: "Nicht gefunden" }, { status: 404 });
  if (["ENDED", "CANCELLED", "DECLINED"].includes(meeting.status)) return NextResponse.json({ error: "Dieses Gespräch ist beendet." }, { status: 409 });
  const st = videoStatus();
  if (!st.enabled) return NextResponse.json({ error: st.reason, notActivated: true }, { status: 503 });
  const { token, url } = await createVideoToken({ roomName: meeting.videoRoomName, identity: `consultant-${user.id}`, name: user.name, isHost: true });
  await db.meeting.update({ where: { id }, data: { status: "LIVE", startedAt: meeting.startedAt ?? new Date() } });
  await audit({ tenantId: user.tenantId, actorType: "USER", actorId: user.id, action: "meeting.join", entity: "Meeting", entityId: id });
  return NextResponse.json({ token, url });
}
