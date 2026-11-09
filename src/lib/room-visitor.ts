import "server-only";
import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { db } from "./db";
import { getVisitorSession } from "./rooms";
import { clientKey, rateLimit } from "./rate-limit";

/** Lädt Kundenwelt + gültige (verifizierte) Besuchersitzung für API-Routen. */
export async function visitorForSlug(slug: string, opts: { allowUnverified?: boolean } = {}) {
  const room = await db.room.findUnique({ where: { slug } });
  if (!room) return null;
  const session = await getVisitorSession(room.id);
  if (!session) return null;
  if (session.needsVerification && !opts.allowUnverified) return null;
  return { room, session };
}

export async function visitorRateLimit(scope: string, limit = 60, windowMs = 60_000) {
  const rl = rateLimit(`room:${scope}:${clientKey(await headers())}`, limit, windowMs);
  return rl.ok ? null : NextResponse.json({ error: "Zu viele Anfragen" }, { status: 429, headers: { "retry-after": String(rl.retryAfterSec) } });
}

export const unauthorized = () => NextResponse.json({ error: "Kein Zugang" }, { status: 401 });
export const badRequest = (msg = "Ungültige Eingabe") => NextResponse.json({ error: msg }, { status: 400 });
