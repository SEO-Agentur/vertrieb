"use server";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { hashToken, numericCode, safeEqual } from "@/lib/crypto";
import { sendMail, smtpConfigured } from "@/lib/mailer";
import { clientKey, rateLimit } from "@/lib/rate-limit";
import { getVisitorSession } from "@/lib/rooms";
import { audit, notify } from "@/lib/audit";

export type VerifyState = { step: "email" | "code"; email?: string; error?: string; info?: string };

async function load(slug: string) {
  const room = await db.room.findUnique({ where: { slug } });
  if (!room) return null;
  const session = await getVisitorSession(room.id);
  return session ? { room, session } : null;
}

export async function requestCodeAction(slug: string, _prev: VerifyState, form: FormData): Promise<VerifyState> {
  const ctx = await load(slug);
  if (!ctx) return { step: "email", error: "Ihre Sitzung ist abgelaufen. Bitte öffnen Sie Ihren Einladungslink erneut." };
  const rl = rateLimit(`verify-req:${clientKey(await headers())}`, 5, 15 * 60_000);
  if (!rl.ok) return { step: "email", error: "Zu viele Versuche. Bitte warten Sie einige Minuten." };
  const parsed = z.string().trim().toLowerCase().email().max(200).safeParse(form.get("email"));
  if (!parsed.success) return { step: "email", error: "Bitte geben Sie eine gültige E-Mail-Adresse ein." };
  const email = parsed.data;
  const expected = ctx.session.invite.email;
  // Bei abweichender Adresse keinen Code senden, aber auch nicht verraten, welche Adresse erwartet wird.
  if (expected && expected !== email) {
    await audit({ tenantId: ctx.room.tenantId, actorType: "VISITOR", actorId: ctx.session.id, action: "room.verify_mismatch" });
    return { step: "email", error: "Diese E-Mail-Adresse ist für diese Einladung nicht freigeschaltet." };
  }
  const code = numericCode(6);
  await db.emailVerification.create({ data: { sessionId: ctx.session.id, email, codeHash: hashToken(`${ctx.session.id}:${code}`), expiresAt: new Date(Date.now() + 15 * 60_000) } });
  const sent = await sendMail(ctx.room.tenantId, email, "Ihr Bestätigungscode", `Ihr Bestätigungscode für Ihre persönliche Seite lautet: ${code}\n\nDer Code ist 15 Minuten gültig. Falls Sie diesen Code nicht angefordert haben, können Sie diese E-Mail ignorieren.`);
  if (!sent.sent) {
    await notify({ tenantId: ctx.room.tenantId, userId: ctx.room.consultantId, type: "VERIFY_PENDING", title: `Bestätigungscode angefordert: ${ctx.room.displayName}`, body: "SMTP ist nicht konfiguriert – der Code liegt im Postausgang (Einstellungen → Integrationen).", link: "/settings?tab=integrations" });
  }
  return {
    step: "code",
    email,
    info: smtpConfigured() && sent.sent
      ? "Wir haben Ihnen einen sechsstelligen Code per E-Mail gesendet."
      : "Der E-Mail-Versand ist derzeit nicht eingerichtet. Ihr Ansprechpartner wurde informiert und kann Ihnen den Code mitteilen.",
  };
}

export async function verifyCodeAction(slug: string, prev: VerifyState, form: FormData): Promise<VerifyState> {
  const ctx = await load(slug);
  if (!ctx) return { step: "email", error: "Ihre Sitzung ist abgelaufen. Bitte öffnen Sie Ihren Einladungslink erneut." };
  const rl = rateLimit(`verify-code:${clientKey(await headers())}`, 15, 15 * 60_000);
  if (!rl.ok) return { ...prev, error: "Zu viele Versuche. Bitte warten Sie einige Minuten." };
  const code = String(form.get("code") ?? "").replace(/\D/g, "");
  const name = String(form.get("name") ?? "").trim().slice(0, 120);
  const v = await db.emailVerification.findFirst({ where: { sessionId: ctx.session.id, usedAt: null, expiresAt: { gt: new Date() } }, orderBy: { createdAt: "desc" } });
  if (!v) return { step: "email", error: "Der Code ist abgelaufen. Bitte fordern Sie einen neuen an." };
  if (v.attempts >= 5) return { step: "email", error: "Zu viele Fehlversuche. Bitte fordern Sie einen neuen Code an." };
  if (!safeEqual(v.codeHash, hashToken(`${ctx.session.id}:${code}`))) {
    await db.emailVerification.update({ where: { id: v.id }, data: { attempts: { increment: 1 } } });
    return { ...prev, step: "code", error: "Der Code ist nicht korrekt." };
  }
  await db.emailVerification.update({ where: { id: v.id }, data: { usedAt: new Date() } });
  await db.roomSession.update({ where: { id: ctx.session.id }, data: { verifiedAt: new Date(), verifiedEmail: v.email, displayName: name || null } });
  await audit({ tenantId: ctx.room.tenantId, actorType: "VISITOR", actorId: ctx.session.id, action: "room.verified", meta: { email: v.email } });
  revalidatePath(`/room/${slug}`);
  return { step: "code", email: v.email, info: "Bestätigt." };
}
