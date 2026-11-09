import type { Metadata } from "next";
import { db } from "@/lib/db";
import { getPublicRoom, getVisitorSession } from "@/lib/rooms";
import { getSetting } from "@/lib/settings";
import { AccessDenied } from "@/components/room/AccessDenied";
import { VerifyEmail } from "@/components/room/VerifyEmail";
import { RoomView } from "@/components/room/RoomView";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Ihre persönliche Seite", robots: { index: false, follow: false } };

export default async function RoomPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const room = await db.room.findUnique({ where: { slug }, select: { id: true, tenantId: true, primaryColor: true, accentColor: true } });
  // Kein Raum, kein Zugang, unveröffentlicht → identische neutrale Seite
  const session = room ? await getVisitorSession(room.id) : null;
  if (!room || !session) return <AccessDenied />;
  if (session.needsVerification) return <VerifyEmail slug={slug} presetEmail={session.invite.email ? "" : undefined} />;
  const [data, privacy, brand] = await Promise.all([getPublicRoom(room.id, session.id), getSetting(room.tenantId, "privacy"), getSetting(room.tenantId, "brand")]);
  return (
    <RoomView
      slug={slug}
      data={data}
      privacy={{ privacyUrl: privacy.privacyUrl, imprintUrl: privacy.imprintUrl, contact: privacy.privacyContactEmail }}
      brandName={brand.companyName}
      session={{ consentDecided: Boolean(session.consentDecidedAt), presence: session.presenceConsent, analytics: session.analyticsConsent, followPresenter: session.followPresenter, name: session.displayName ?? "" }}
    />
  );
}
