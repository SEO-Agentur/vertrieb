import "server-only";
import { db } from "../db";
import { decryptSecret, encryptSecret } from "../secrets";

export const AI_MODELS = [
  { id: "claude-opus-5-5", label: "Claude Opus 5.5 – beste Qualität (Standard)" },
  { id: "claude-sonnet-5-5", label: "Claude Sonnet 5.5 – schneller, günstiger" },
  { id: "claude-haiku-5-5", label: "Claude Haiku 5.5 – am günstigsten, für einfache Aufgaben" },
] as const;

const KEY = "ai";
type Stored = { cipher?: string; hint?: string; model?: string; updatedAt?: string; updatedBy?: string };
export type AiConfig = { apiKey: string | null; model: string; source: "settings" | "env" | null; hint: string | null; updatedAt: string | null; decryptFailed: boolean };

const cache = new Map<string, { at: number; cfg: AiConfig }>();

async function resolveTenantId(tenantId?: string) {
  if (tenantId) return tenantId;
  const t = (await db.tenant.findFirst({ where: { slug: process.env.SITE_TENANT_SLUG ?? "default" } })) ?? (await db.tenant.findFirst({ orderBy: { createdAt: "asc" } }));
  return t?.id ?? "none";
}

/** KI-Zugang: in den Einstellungen hinterlegter Key hat Vorrang vor der Umgebungsvariable ANTHROPIC_API_KEY. */
export async function getAiConfig(tenantId?: string): Promise<AiConfig> {
  const tid = await resolveTenantId(tenantId);
  const hit = cache.get(tid);
  if (hit && Date.now() - hit.at < 30_000) return hit.cfg;
  const row = tid === "none" ? null : await db.setting.findUnique({ where: { tenantId_key: { tenantId: tid, key: KEY } } });
  const s = (row?.value ?? {}) as Stored;
  const model = s.model || process.env.AI_MODEL || "claude-opus-5-5";
  let cfg: AiConfig;
  if (s.cipher) {
    const k = decryptSecret(s.cipher);
    cfg = k
      ? { apiKey: k, model, source: "settings", hint: s.hint ?? null, updatedAt: s.updatedAt ?? null, decryptFailed: false }
      : { apiKey: process.env.ANTHROPIC_API_KEY || null, model, source: process.env.ANTHROPIC_API_KEY ? "env" : null, hint: null, updatedAt: null, decryptFailed: true };
  } else {
    cfg = { apiKey: process.env.ANTHROPIC_API_KEY || null, model, source: process.env.ANTHROPIC_API_KEY ? "env" : null, hint: process.env.ANTHROPIC_API_KEY ? process.env.ANTHROPIC_API_KEY.slice(-4) : null, updatedAt: null, decryptFailed: false };
  }
  cache.set(tid, { at: Date.now(), cfg });
  return cfg;
}

export async function saveAiConfig(tenantId: string, input: { apiKey?: string | null; model?: string; userId: string }) {
  const row = await db.setting.findUnique({ where: { tenantId_key: { tenantId, key: KEY } } });
  const s = { ...((row?.value ?? {}) as Stored) };
  if (input.apiKey === null) { delete s.cipher; delete s.hint; }
  else if (input.apiKey) { s.cipher = encryptSecret(input.apiKey); s.hint = input.apiKey.slice(-4); }
  if (input.model) s.model = input.model;
  s.updatedAt = new Date().toISOString();
  s.updatedBy = input.userId;
  await db.setting.upsert({ where: { tenantId_key: { tenantId, key: KEY } }, update: { value: s }, create: { tenantId, key: KEY, value: s } });
  cache.delete(tenantId);
}
