"use server";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { createUserSession, destroyUserSession, verifyPassword } from "@/lib/auth";
import { rateLimit, clientKey } from "@/lib/rate-limit";
import { audit } from "@/lib/audit";

export async function loginAction(form: FormData) {
  const email = String(form.get("email") ?? "").trim().toLowerCase();
  const password = String(form.get("password") ?? "");
  const rl = rateLimit(`login:${clientKey(await headers())}`, 10, 15 * 60_000);
  if (!rl.ok) redirect(`/login?error=${encodeURIComponent(`Zu viele Versuche. Bitte in ${rl.retryAfterSec} s erneut versuchen.`)}`);
  const user = await db.user.findUnique({ where: { email } });
  if (!user || !user.active || !(await verifyPassword(password, user.passwordHash))) {
    redirect(`/login?error=${encodeURIComponent("E-Mail oder Passwort ist falsch.")}`);
  }
  await createUserSession(user.id);
  await audit({ tenantId: user.tenantId, actorType: "USER", actorId: user.id, action: "auth.login" });
  redirect("/dashboard");
}

export async function logoutAction() {
  await destroyUserSession();
  redirect("/login");
}
