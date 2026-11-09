import "server-only";
import { notFound, redirect } from "next/navigation";
import { db } from "./db";
import type { CurrentUser } from "./auth";

/** Mandantensichere Lookups – jede interne Abfrage eines Datensatzes per ID läuft hierüber. */
export async function companyForUser(id: string, user: CurrentUser) {
  const c = await db.company.findFirst({ where: { id, tenantId: user.tenantId } });
  if (!c) notFound();
  return c;
}

export async function roomForUser(id: string, user: CurrentUser) {
  const r = await db.room.findFirst({ where: { id, tenantId: user.tenantId } });
  if (!r) notFound();
  return r;
}

export async function offerForUser(id: string, user: CurrentUser) {
  const o = await db.offer.findFirst({ where: { id, tenantId: user.tenantId } });
  if (!o) notFound();
  return o;
}

export async function meetingForUser(id: string, user: CurrentUser) {
  const m = await db.meeting.findFirst({ where: { id, tenantId: user.tenantId } });
  if (!m) notFound();
  return m;
}

export function str(form: FormData, key: string): string {
  return String(form.get(key) ?? "").trim();
}
export function optStr(form: FormData, key: string): string | null {
  const v = str(form, key);
  return v === "" ? null : v;
}
export function optNum(form: FormData, key: string): number | null {
  const v = str(form, key).replace(/\./g, "").replace(",", ".");
  if (v === "") return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}
export function optInt(form: FormData, key: string): number | null {
  const n = optNum(form, key);
  return n == null ? null : Math.round(n);
}
export function bool(form: FormData, key: string): boolean {
  const v = form.get(key);
  return v === "on" || v === "true" || v === "1";
}

/**
 * Nutzerfreundlicher Fehler: leitet mit ?error=… zurück (Next.js blendet Fehlermeldungen geworfener Errors in Produktion aus).
 */
export function failTo(path: string, message: string): never {
  const sep = path.includes("?") ? "&" : "?";
  return redirect(`${path}${sep}error=${encodeURIComponent(message)}`);
}
