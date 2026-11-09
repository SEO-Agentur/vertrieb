import nodemailer from "nodemailer";
import { db } from "./db";

export function smtpConfigured() {
  return Boolean(process.env.SMTP_HOST && process.env.SMTP_FROM);
}

/**
 * Versendet E-Mails über SMTP. Ohne SMTP-Konfiguration wird NICHT so getan, als sei versendet worden:
 * die Nachricht landet mit Status NOT_CONFIGURED im Postausgang (Einstellungen → Integrationen).
 */
export async function sendMail(tenantId: string, to: string, subject: string, body: string) {
  if (!smtpConfigured()) {
    await db.outboxEmail.create({ data: { tenantId, to, subject, body, status: "NOT_CONFIGURED" } });
    if (process.env.NODE_ENV !== "production") console.info(`[mail:not-configured] an ${to}: ${subject}\n${body}`);
    return { sent: false as const, reason: "SMTP nicht konfiguriert" };
  }
  try {
    const transport = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT ?? 587),
      secure: process.env.SMTP_SECURE === "true",
      auth: process.env.SMTP_USER ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS } : undefined,
    });
    await transport.sendMail({ from: process.env.SMTP_FROM, to, subject, text: body });
    await db.outboxEmail.create({ data: { tenantId, to, subject, body, status: "SENT" } });
    return { sent: true as const };
  } catch (e) {
    const error = e instanceof Error ? e.message : String(e);
    await db.outboxEmail.create({ data: { tenantId, to, subject, body, status: "FAILED", error } });
    return { sent: false as const, reason: error };
  }
}
