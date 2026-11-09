import "server-only";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";
import type { Role } from "@prisma/client";
import { db } from "./db";
import { hashToken, randomToken } from "./crypto";

export const USER_COOKIE = "sp_session";
const SESSION_DAYS = 14;

export async function hashPassword(pw: string) {
  return bcrypt.hash(pw, 12);
}

export async function verifyPassword(pw: string, hash: string) {
  return bcrypt.compare(pw, hash);
}

export async function createUserSession(userId: string) {
  const token = randomToken();
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 86400_000);
  await db.userSession.create({ data: { userId, tokenHash: hashToken(token), expiresAt } });
  (await cookies()).set(USER_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: expiresAt,
  });
}

export async function destroyUserSession() {
  const jar = await cookies();
  const token = jar.get(USER_COOKIE)?.value;
  if (token) await db.userSession.deleteMany({ where: { tokenHash: hashToken(token) } });
  jar.delete(USER_COOKIE);
}

/** Liefert den angemeldeten Benutzer (serverseitig geprüft) oder null. */
export const getCurrentUser = cache(async () => {
  const token = (await cookies()).get(USER_COOKIE)?.value;
  if (!token) return null;
  const session = await db.userSession.findUnique({
    where: { tokenHash: hashToken(token) },
    include: { user: { include: { tenant: true } } },
  });
  if (!session || session.expiresAt < new Date() || !session.user.active) return null;
  if (Date.now() - session.lastSeenAt.getTime() > 5 * 60_000) {
    await db.userSession.update({ where: { id: session.id }, data: { lastSeenAt: new Date() } });
  }
  return session.user;
});

export type CurrentUser = NonNullable<Awaited<ReturnType<typeof getCurrentUser>>>;

export async function requireUser(roles?: Role[]): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (roles && !roles.includes(user.role)) throw new Error("Keine Berechtigung für diese Aktion.");
  return user;
}

/** Für Schreibaktionen: VIEWER dürfen nur lesen. */
export async function requireEditor() {
  return requireUser(["ADMIN", "CONSULTANT"]);
}

export async function requireAdmin() {
  return requireUser(["ADMIN"]);
}
