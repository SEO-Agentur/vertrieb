import "server-only";
import path from "node:path";
import { mkdir, writeFile, unlink } from "node:fs/promises";
import { randomToken } from "./crypto";

/** Dateiablage außerhalb von public/ – Auslieferung nur über zugriffsgeprüfte Routen. */
export const STORAGE_DIR = path.join(process.cwd(), "storage");

export function storagePath(key: string): string | null {
  if (!/^[A-Za-z0-9_-]{8,128}$/.test(key)) return null;
  const file = path.join(STORAGE_DIR, key);
  return file.startsWith(STORAGE_DIR + path.sep) ? file : null;
}

export async function saveFile(data: Uint8Array): Promise<string> {
  await mkdir(STORAGE_DIR, { recursive: true });
  const key = randomToken(24);
  await writeFile(path.join(STORAGE_DIR, key), data);
  return key;
}

export async function deleteFile(key: string) {
  const p = storagePath(key);
  if (p) await unlink(p).catch(() => {});
}
