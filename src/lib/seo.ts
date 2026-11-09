import "server-only";
import { z } from "zod";

/**
 * Integration des bestehenden SEO-Scanners von guaranteedseoservices.com.
 * Eine öffentliche API ist nicht dokumentiert/geprüft. Daher:
 *  - optionaler API-Modus, wenn SEO_SCANNER_API_URL + KEY gesetzt sind (erwartet JSON im unten definierten Format)
 *  - manueller Import von Scan-Ergebnissen (JSON oder CSV) – funktioniert immer.
 */
export function seoStatus() {
  const enabled = Boolean(process.env.SEO_SCANNER_API_URL && process.env.SEO_SCANNER_API_KEY);
  return { enabled, reason: enabled ? undefined : "SEO_SCANNER_API_URL / SEO_SCANNER_API_KEY nicht gesetzt (API-Verfügbarkeit noch zu klären)" };
}

export const SeoIssueSchema = z.object({
  title: z.string().max(300),
  severity: z.enum(["high", "medium", "low"]).catch("medium"),
  category: z.string().max(100).optional(),
  recommendation: z.string().max(2000).optional(),
});

export const SeoScanSchema = z.object({
  url: z.string().max(500),
  score: z.number().min(0).max(100).nullable().optional(),
  summary: z.string().max(5000).optional(),
  scannedAt: z.string().optional(),
  issues: z.array(SeoIssueSchema).max(500).default([]),
});
export type SeoScanData = z.infer<typeof SeoScanSchema>;

export function parseSeoImport(raw: string, fallbackUrl: string): SeoScanData {
  const trimmed = raw.trim();
  if (trimmed.startsWith("{")) return SeoScanSchema.parse(JSON.parse(trimmed));
  // CSV: title;severity;category;recommendation
  const lines = trimmed.split(/\r?\n/).filter(Boolean);
  const head = lines[0]?.toLowerCase() ?? "";
  const body = /title|titel|problem/.test(head) ? lines.slice(1) : lines;
  const issues = body.map((l) => {
    const [title, severity, category, recommendation] = l.split(/[;\t]/).map((s) => s?.trim());
    return SeoIssueSchema.parse({ title, severity: (severity ?? "medium").toLowerCase(), category, recommendation });
  });
  return { url: fallbackUrl, issues };
}

export async function triggerSeoScan(url: string): Promise<SeoScanData> {
  const st = seoStatus();
  if (!st.enabled) throw new Error(st.reason);
  const res = await fetch(process.env.SEO_SCANNER_API_URL!, {
    method: "POST",
    headers: { "content-type": "application/json", authorization: `Bearer ${process.env.SEO_SCANNER_API_KEY}` },
    body: JSON.stringify({ url }),
    signal: AbortSignal.timeout(60_000),
  });
  if (!res.ok) throw new Error(`SEO-Scanner antwortete mit HTTP ${res.status}`);
  return SeoScanSchema.parse(await res.json());
}
