"use server";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { acceptanceDeclaration, offerContentHash } from "@/lib/offer-acceptance";
import { getVisitorSession, recordRoomEvent } from "@/lib/rooms";
import { audit, logActivity, notify } from "@/lib/audit";
import { advanceStage } from "@/lib/pipeline";
import { clientKey, rateLimit } from "@/lib/rate-limit";

export type AcceptState = { error?: string; ok?: boolean };

async function load(slug: string, offerId: string) {
  const room = await db.room.findUnique({ where: { slug } });
  if (!room) return null;
  const session = await getVisitorSession(room.id);
  if (!session || session.needsVerification) return null;
  const offer = await db.offer.findFirst({ where: { id: offerId, roomId: room.id, status: "PUBLISHED" }, include: { company: true } });
  if (!offer) return null;
  return { room, session, offer };
}

const AcceptSchema = z.object({
  name: z.string().trim().min(3).max(150),
  email: z.string().trim().toLowerCase().email().max(200),
  role: z.string().trim().min(2).max(150),
  authorized: z.literal("on"),
  accept: z.literal("on"),
});

export async function acceptOfferAction(slug: string, offerId: string, _prev: AcceptState, form: FormData): Promise<AcceptState> {
  const rl = rateLimit(`accept:${clientKey(await headers())}`, 10, 15 * 60_000);
  if (!rl.ok) return { error: "Zu viele Versuche." };
  const ctx = await load(slug, offerId);
  if (!ctx) return { error: "Dieses Angebot kann derzeit nicht angenommen werden." };
  const parsed = AcceptSchema.safeParse(Object.fromEntries(form));
  if (!parsed.success) return { error: "Bitte füllen Sie alle Felder aus und bestätigen Sie beide Erklärungen." };
  if (ctx.offer.validUntil && ctx.offer.validUntil < new Date()) return { error: "Die Gültigkeit dieses Angebots ist abgelaufen. Bitte wenden Sie sich an Ihren Ansprechpartner." };
  const { offer, room, session } = ctx;
  const declaration = acceptanceDeclaration(offer.company.name, offer.number, offer.version);
  const hash = await offerContentHash(offer.id);
  // Atomar: nur ein PUBLISHED-Angebot kann angenommen werden
  const upd = await db.offer.updateMany({
    where: { id: offer.id, status: "PUBLISHED" },
    data: {
      status: "ACCEPTED", acceptedAt: new Date(), acceptedByName: parsed.data.name, acceptedByEmail: parsed.data.email,
      acceptedRole: parsed.data.role, acceptanceText: declaration, acceptanceHash: hash, acceptanceSessionId: session.id,
    },
  });
  if (upd.count !== 1) return { error: "Dieses Angebot wurde bereits bearbeitet." };
  await db.project.create({ data: { tenantId: room.tenantId, companyId: room.companyId, offerId: offer.id, name: offer.title, status: "PLANNED" } });
  await recordRoomEvent(room.id, session.id, "OFFER_ACCEPTED", { offerId: offer.id });
  await notify({ tenantId: room.tenantId, userId: room.consultantId, type: "OFFER_ACCEPTED", title: `Angebot angenommen: ${room.displayName}`, body: `${offer.number} v${offer.version} durch ${parsed.data.name} (${parsed.data.role})`, link: `/offers/${offer.id}` });
  await logActivity({ tenantId: room.tenantId, companyId: room.companyId, type: "OFFER", title: `Angebot ${offer.number} v${offer.version} angenommen`, body: `durch ${parsed.data.name}, ${parsed.data.role} (${parsed.data.email})` });
  await audit({ tenantId: room.tenantId, actorType: "VISITOR", actorId: session.id, action: "offer.accepted", entity: "Offer", entityId: offer.id, meta: { name: parsed.data.name, email: parsed.data.email, role: parsed.data.role, hash, verifiedEmail: session.verifiedEmail } });
  await advanceStage(room.companyId, "WON");
  revalidatePath(`/room/${slug}/offers/${offerId}`);
  return { ok: true };
}

export async function declineOfferAction(slug: string, offerId: string, _prev: AcceptState, form: FormData): Promise<AcceptState> {
  const ctx = await load(slug, offerId);
  if (!ctx) return { error: "Dieses Angebot kann derzeit nicht bearbeitet werden." };
  const reason = String(form.get("reason") ?? "").trim().slice(0, 2000) || null;
  await db.offer.updateMany({ where: { id: offerId, status: "PUBLISHED" }, data: { status: "DECLINED", declinedAt: new Date(), declineReason: reason } });
  await recordRoomEvent(ctx.room.id, ctx.session.id, "OFFER_DECLINED", { offerId });
  await notify({ tenantId: ctx.room.tenantId, userId: ctx.room.consultantId, type: "OFFER_DECLINED", title: `Angebot abgelehnt: ${ctx.room.displayName}`, body: reason ?? undefined, link: `/offers/${offerId}` });
  await logActivity({ tenantId: ctx.room.tenantId, companyId: ctx.room.companyId, type: "OFFER", title: `Angebot ${ctx.offer.number} abgelehnt`, body: reason });
  await audit({ tenantId: ctx.room.tenantId, actorType: "VISITOR", actorId: ctx.session.id, action: "offer.declined", entity: "Offer", entityId: offerId });
  revalidatePath(`/room/${slug}/offers/${offerId}`);
  return { ok: true };
}
