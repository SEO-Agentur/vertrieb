import { createHash, createHmac, randomBytes, timingSafeEqual, randomInt } from "node:crypto";

/** Kryptografisch zufälliges, URL-sicheres Token (Standard: 32 Byte ≈ 256 Bit). */
export function randomToken(bytes = 32): string {
  return randomBytes(bytes).toString("base64url");
}

export function sha256(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

/** Token-Hash mit serverseitigem Secret – in der DB wird nie das Klartext-Token gespeichert. */
export function hashToken(token: string): string {
  const secret = process.env.SESSION_SECRET;
  if (!secret || secret.length < 16) throw new Error("SESSION_SECRET fehlt oder ist zu kurz (min. 16 Zeichen).");
  return createHmac("sha256", secret).update(token).digest("hex");
}

export function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  return ab.length === bb.length && timingSafeEqual(ab, bb);
}

export function numericCode(digits = 6): string {
  return Array.from({ length: digits }, () => randomInt(0, 10)).join("");
}
