import "server-only";
import { cookies } from "next/headers";
import type { Company, Room, User } from "@prisma/client";
import { db } from "./db";
import { hashToken, randomToken } from "./crypto";
import { DEFAULT_CALCULATOR, sanitizeInputs, type CalculatorInputs } from "./calculator";
import { slugify } from "./normalize";
import { getSetting } from "./settings";

export const ROOM_MODULES = [
  { key: "greeting", label: "Persönliche Begrüßung" },
  { key: "calculator", label: "Umsatzpotenzial-Rechner" },
  { key: "areas", label: "Mögliche Verbesserungsbereiche" },
  { key: "approach", label: "Gemeinsame Potenzialanalyse" },
  { key: "video", label: "Live-Videoberatung" },
  { key: "solutions", label: "Individuelle Lösungen" },
  { key: "offer", label: "Persönliches Angebot" },
  { key: "next", label: "Nächste Schritte & Dokumente" },
] as const;
export type ModuleKey = (typeof ROOM_MODULES)[number]["key"];
export type RoomModules = Record<ModuleKey, boolean>;

export const DEFAULT_MODULES: RoomModules = { greeting: true, calculator: true, areas: true, approach: true, video: true, solutions: true, offer: true, next: true };

export function roomUrl(slug: string) {
  return `${process.env.APP_URL ?? "http://localhost:3000"}/room/${slug}`;
}
export function inviteUrl(token: string) {
  return `${process.env.APP_URL ?? "http://localhost:3000"}/i/${token}`;
}

async function uniqueSlug(base: string) {
  let slug = base;
  for (let i = 2; await db.room.findUnique({ where: { slug } }); i++) slug = `${base}-${i}`;
  return slug;
}

export function defaultRoomTexts(company: Pick<Company, "name">, lang: string) {
  if (lang === "en") {
    return {
      greeting: `Welcome, ${company.name}.`,
      intro: "We have looked into your company and would like to find out together with you where your sales can be developed further with intelligent technologies.",
      approachText: "We don't claim to know your challenges in advance. Together we find out where improvements are possible and economically worthwhile – and only then develop the right solution.",
    };
  }
  return {
    greeting: `Willkommen, ${company.name}.`,
    intro: "Wir haben uns mit Ihrem Unternehmen beschäftigt und möchten gemeinsam mit Ihnen herausfinden, wo sich Ihr Vertrieb durch intelligente Technologien weiterentwickeln lässt.",
    approachText: "Wir behaupten nicht, Ihre Herausforderungen bereits zu kennen. Wir finden gemeinsam heraus, wo Verbesserungen möglich und wirtschaftlich sinnvoll sind – und entwickeln erst dann die passende Lösung.",
  };
}

/** Erstellt eine Kundenwelt aus den Unternehmensdaten (eine Anwendung, keine separaten Codebasen). */
export async function createRoomForCompany(company: Company, consultant: User, lang = "de"): Promise<Room> {
  const existing = await db.room.findUnique({ where: { companyId: company.id } });
  if (existing) return existing;
  const slug = await uniqueSlug(slugify(company.name));
  const texts = defaultRoomTexts(company, lang);
  const calculator: CalculatorInputs = {
    ...DEFAULT_CALCULATOR,
    revenueEur: company.revenueEur ?? 0,
    revenueIsVerified: company.revenueStatus === "VERIFIED",
  };
  return db.room.create({
    data: {
      tenantId: company.tenantId,
      companyId: company.id,
      slug,
      language: lang,
      displayName: company.name,
      greeting: texts.greeting,
      intro: texts.intro,
      approachText: texts.approachText,
      modules: DEFAULT_MODULES,
      calculator,
      consultantId: consultant.id,
    },
  });
}

/** Erzeugt einen Einladungslink. Das Klartext-Token wird nur einmal zurückgegeben und nie gespeichert. */
export async function createInvite(roomId: string, opts: { contactId?: string | null; label?: string; email?: string | null; days?: number; maxUses?: number | null }) {
  const room = await db.room.findUniqueOrThrow({ where: { id: roomId } });
  const privacy = await getSetting(room.tenantId, "privacy");
  const token = randomToken(24);
  const invite = await db.roomInvite.create({
    data: {
      roomId,
      contactId: opts.contactId ?? null,
      label: opts.label,
      email: opts.email?.toLowerCase() || null,
      tokenHash: hashToken(token),
      tokenHint: token.slice(-4),
      expiresAt: new Date(Date.now() + (opts.days ?? privacy.inviteDefaultDays) * 86400_000),
      maxUses: opts.maxUses ?? null,
    },
  });
  return { invite, token, url: inviteUrl(token) };
}

export const visitorCookieName = (roomId: string) => `kw_${roomId}`;

export type InviteCheck =
  | { ok: true; invite: NonNullable<Awaited<ReturnType<typeof findInvite>>> }
  | { ok: false; reason: "INVALID" | "EXPIRED" | "REVOKED" | "EXHAUSTED" | "UNPUBLISHED" };

async function findInvite(token: string) {
  return db.roomInvite.findUnique({ where: { tokenHash: hashToken(token) }, include: { room: true } });
}

export async function checkInvite(token: string): Promise<InviteCheck> {
  if (!token || token.length < 16 || token.length > 128) return { ok: false, reason: "INVALID" };
  const invite = await findInvite(token);
  if (!invite) return { ok: false, reason: "INVALID" };
  if (invite.revokedAt) return { ok: false, reason: "REVOKED" };
  if (invite.expiresAt < new Date()) return { ok: false, reason: "EXPIRED" };
  if (invite.maxUses != null && invite.useCount >= invite.maxUses) return { ok: false, reason: "EXHAUSTED" };
  if (invite.room.status !== "PUBLISHED") return { ok: false, reason: "UNPUBLISHED" };
  return { ok: true, invite };
}

/** Holt die Besuchersitzung für eine Kundenwelt – serverseitig geprüft inkl. Einladungsstatus. */
export async function getVisitorSession(roomId: string) {
  const token = (await cookies()).get(visitorCookieName(roomId))?.value;
  if (!token) return null;
  const session = await db.roomSession.findUnique({ where: { tokenHash: hashToken(token) }, include: { invite: true, room: true } });
  if (!session || session.roomId !== roomId) return null;
  if (session.endedAt || session.expiresAt < new Date()) return null;
  if (session.invite.revokedAt) return null; // Widerruf beendet auch laufende Sitzungen
  if (session.room.status !== "PUBLISHED") return null;
  if (session.room.requireEmailVerification && !session.verifiedAt) return { ...session, needsVerification: true as const };
  return { ...session, needsVerification: false as const };
}

export type VisitorSession = NonNullable<Awaited<ReturnType<typeof getVisitorSession>>>;

/**
 * Öffentliche Projektion einer Kundenwelt. NUR hier wird festgelegt, was ein Besucher sehen darf.
 * Interne Felder (Notizen, Scores, Fakten, Rohhypothesen, interne Dokumente) werden nie ausgeliefert.
 */
export async function getPublicRoom(roomId: string, sessionId: string) {
  const room = await db.room.findUniqueOrThrow({
    where: { id: roomId },
    include: {
      consultant: { select: { name: true, title: true, bio: true, avatarUrl: true, calendarUrl: true, linkedinUrl: true, email: true, phone: true } },
      company: {
        select: {
          id: true,
          name: true,
          hypotheses: { where: { visibleInRoom: true, status: { not: "REJECTED" } }, orderBy: { order: "asc" }, select: { id: true, topic: true, rationale: true, status: true } },
          findings: { where: { shareWithClient: true }, orderBy: { createdAt: "asc" }, select: { id: true, area: true, title: true, description: true, impact: true, status: true } },
          solutions: { where: { shareWithClient: true, status: { not: "REJECTED" } }, select: { id: true, note: true, status: true, solution: { select: { name: true, description: true, benefits: true } } } },
          analyses: { where: { shareWithClient: true }, orderBy: { updatedAt: "desc" }, select: { id: true, name: true, inputs: true, assumptions: true, updatedAt: true } },
          seoScans: { where: { shareWithClient: true }, orderBy: { createdAt: "desc" }, take: 1, select: { id: true, url: true, score: true, summary: true, issues: true, scannedAt: true } },
          projects: { select: { id: true, name: true, status: true, startDate: true } },
        },
      },
      offers: { where: { status: { in: ["PUBLISHED", "ACCEPTED", "DECLINED"] } }, orderBy: { createdAt: "desc" }, select: { id: true, number: true, version: true, title: true, status: true, publishedAt: true, validUntil: true, acceptedAt: true } },
      documents: { where: { visibility: "ROOM" }, orderBy: { createdAt: "desc" }, select: { id: true, name: true, size: true, createdAt: true } },
      meetings: { where: { status: { in: ["OFFERED", "REQUESTED", "ACCEPTED", "SCHEDULED", "LIVE"] } }, orderBy: { createdAt: "desc" }, select: { id: true, status: true, kind: true, scheduledAt: true, initiatedBy: true } },
      messages: { orderBy: { createdAt: "asc" }, take: 100, select: { id: true, fromVisitor: true, authorName: true, body: true, createdAt: true, offerId: true } },
    },
  });
  void sessionId;
  return {
    slug: room.slug,
    language: room.language,
    displayName: room.displayName,
    greeting: room.greeting,
    intro: room.intro,
    approachText: room.approachText,
    logoUrl: room.logoUrl,
    primaryColor: room.primaryColor,
    accentColor: room.accentColor,
    modules: { ...DEFAULT_MODULES, ...(room.modules as Partial<RoomModules>) },
    calculator: sanitizeInputs(room.calculator as Partial<CalculatorInputs>),
    liveAvailable: room.liveAvailable,
    consultant: room.consultant,
    hypotheses: room.company.hypotheses,
    findings: room.company.findings,
    solutions: room.company.solutions,
    analyses: room.company.analyses.map((a) => ({ ...a, inputs: sanitizeInputs(a.inputs as Partial<CalculatorInputs>) })),
    seoScan: room.company.seoScans[0] ?? null,
    projects: room.company.projects,
    offers: room.offers,
    documents: room.documents,
    meetings: room.meetings,
    messages: room.messages,
  };
}
export type PublicRoom = Awaited<ReturnType<typeof getPublicRoom>>;

export async function recordRoomEvent(roomId: string, sessionId: string | null, type: string, meta?: Record<string, unknown>) {
  await db.roomEvent.create({ data: { roomId, sessionId, type, meta: (meta ?? undefined) as object | undefined } });
}
