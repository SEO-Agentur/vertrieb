import { NextResponse } from "next/server";
import { z } from "zod";
import { recordRoomEvent } from "@/lib/rooms";
import { badRequest, unauthorized, visitorForSlug, visitorRateLimit } from "@/lib/room-visitor";

const Body = z.object({ type: z.enum(["CALC_USED"]) });

/** Nutzungsereignisse – nur mit Einwilligung zur Nutzungserfassung. */
export async function POST(req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const limited = await visitorRateLimit("events", 20);
  if (limited) return limited;
  const { slug } = await params;
  const v = await visitorForSlug(slug);
  if (!v) return unauthorized();
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return badRequest();
  if (!v.session.analyticsConsent) return NextResponse.json({ ok: false, reason: "no-consent" });
  await recordRoomEvent(v.room.id, v.session.id, parsed.data.type);
  return NextResponse.json({ ok: true });
}
