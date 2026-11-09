import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { audit } from "@/lib/audit";
import { badRequest, unauthorized, visitorForSlug, visitorRateLimit } from "@/lib/room-visitor";

const Body = z.object({
  presence: z.boolean().optional(),
  analytics: z.boolean().optional(),
  followPresenter: z.boolean().optional(),
});

export async function POST(req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const limited = await visitorRateLimit("consent", 30);
  if (limited) return limited;
  const { slug } = await params;
  const v = await visitorForSlug(slug);
  if (!v) return unauthorized();
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return badRequest();
  const b = parsed.data;
  const data: Record<string, unknown> = {};
  if (b.presence !== undefined || b.analytics !== undefined) {
    const analytics = Boolean(b.analytics);
    data.analyticsConsent = analytics;
    data.presenceConsent = analytics || Boolean(b.presence); // Nutzungserfassung schließt Anwesenheit ein
    data.consentDecidedAt = new Date();
  }
  if (b.followPresenter !== undefined) data.followPresenter = b.followPresenter;
  await db.roomSession.update({ where: { id: v.session.id }, data });
  await audit({ tenantId: v.room.tenantId, actorType: "VISITOR", actorId: v.session.id, action: "room.consent", entity: "RoomSession", entityId: v.session.id, meta: b });
  return NextResponse.json({ ok: true });
}
