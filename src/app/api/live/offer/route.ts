import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { offerLiveCall } from "@/lib/live";

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user || user.role === "VIEWER") return NextResponse.json({ error: "Keine Berechtigung" }, { status: 403 });
  const body = z.object({ roomId: z.string(), sessionId: z.string().optional() }).safeParse(await req.json().catch(() => null));
  if (!body.success) return NextResponse.json({ error: "Ungültige Eingabe" }, { status: 400 });
  const meeting = await offerLiveCall({ tenantId: user.tenantId, userId: user.id, roomId: body.data.roomId, sessionId: body.data.sessionId });
  return NextResponse.json({ meetingId: meeting.id });
}
