import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { renderOfferPdf } from "@/lib/pdf";
import { getSetting } from "@/lib/settings";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return new Response("Unauthorized", { status: 401 });
  const { id } = await params;
  const offer = await db.offer.findFirst({ where: { id, tenantId: user.tenantId }, include: { items: true, company: true } });
  if (!offer) return new Response("Not found", { status: 404 });
  const brand = await getSetting(user.tenantId, "brand");
  const pdf = await renderOfferPdf(offer, { name: user.name, email: user.email, companyName: brand.companyName });
  return new Response(new Uint8Array(pdf), {
    headers: { "content-type": "application/pdf", "content-disposition": `inline; filename="Angebot-${offer.number}-v${offer.version}.pdf"`, "cache-control": "private, no-store" },
  });
}
