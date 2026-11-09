import { db } from "@/lib/db";
import { renderOfferPdf } from "@/lib/pdf";
import { getSetting } from "@/lib/settings";
import { visitorForSlug, visitorRateLimit } from "@/lib/room-visitor";

export async function GET(_req: Request, { params }: { params: Promise<{ slug: string; offerId: string }> }) {
  const limited = await visitorRateLimit("pdf", 20);
  if (limited) return limited;
  const { slug, offerId } = await params;
  const v = await visitorForSlug(slug);
  if (!v) return new Response("Kein Zugang", { status: 401 });
  const offer = await db.offer.findFirst({ where: { id: offerId, roomId: v.room.id, status: { in: ["PUBLISHED", "ACCEPTED", "DECLINED"] } }, include: { items: true, company: true } });
  if (!offer) return new Response("Nicht gefunden", { status: 404 });
  const consultant = v.room.consultantId ? await db.user.findUnique({ where: { id: v.room.consultantId }, select: { name: true, email: true } }) : null;
  const brand = await getSetting(v.room.tenantId, "brand");
  const pdf = await renderOfferPdf(offer, { name: consultant?.name ?? brand.companyName, email: consultant?.email ?? "", companyName: brand.companyName });
  return new Response(new Uint8Array(pdf), {
    headers: { "content-type": "application/pdf", "content-disposition": `attachment; filename="Angebot-${offer.number}-v${offer.version}.pdf"`, "cache-control": "private, no-store" },
  });
}
