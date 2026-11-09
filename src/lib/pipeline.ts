import { db } from "./db";
import { logActivity } from "./audit";

export const DEFAULT_STAGES: { key: string; name: string; color: string; probability: number; isWon?: boolean; isLost?: boolean }[] = [
  { key: "FOUND", name: "Unternehmen gefunden", color: "#94a3b8", probability: 1 },
  { key: "QUALIFYING", name: "Qualifizierung läuft", color: "#94a3b8", probability: 2 },
  { key: "QUALIFIED", name: "Qualifiziert", color: "#64748b", probability: 4 },
  { key: "RESEARCHED", name: "Recherche abgeschlossen", color: "#64748b", probability: 5 },
  { key: "ROOM_READY", name: "Kundenwelt vorbereitet", color: "#0ea5e9", probability: 6 },
  { key: "OUTREACH_READY", name: "Kontaktaufnahme vorbereitet", color: "#0ea5e9", probability: 7 },
  { key: "CONTACTED", name: "Kontaktiert", color: "#0284c7", probability: 8 },
  { key: "ROOM_VISITED", name: "Kundenwelt besucht", color: "#6366f1", probability: 12 },
  { key: "INTERESTED", name: "Interesse signalisiert", color: "#6366f1", probability: 18 },
  { key: "MEETING_SCHEDULED", name: "Gespräch vereinbart", color: "#8b5cf6", probability: 25 },
  { key: "ANALYSIS_DONE", name: "Potenzialanalyse durchgeführt", color: "#a855f7", probability: 35 },
  { key: "SOLUTION_DEVELOPED", name: "Lösung entwickelt", color: "#d946ef", probability: 45 },
  { key: "OFFER_SENT", name: "Angebot versendet", color: "#f59e0b", probability: 55 },
  { key: "NEGOTIATION", name: "Verhandlung", color: "#f97316", probability: 70 },
  { key: "WON", name: "Gewonnen", color: "#16a34a", probability: 100, isWon: true },
  { key: "LOST", name: "Verloren", color: "#dc2626", probability: 0, isLost: true },
];

export async function ensureStages(tenantId: string) {
  const count = await db.pipelineStage.count({ where: { tenantId } });
  if (count) return;
  await db.pipelineStage.createMany({
    data: DEFAULT_STAGES.map((s, i) => ({ tenantId, key: s.key, name: s.name, color: s.color, order: i, probability: s.probability, isWon: !!s.isWon, isLost: !!s.isLost })),
  });
}

export async function setStage(companyId: string, stageId: string, userId?: string | null) {
  const company = await db.company.findUniqueOrThrow({ where: { id: companyId }, include: { stage: true } });
  const stage = await db.pipelineStage.findFirstOrThrow({ where: { id: stageId, tenantId: company.tenantId } });
  if (company.stageId === stageId) return;
  await db.company.update({ where: { id: companyId }, data: { stageId, stageSince: new Date() } });
  await logActivity({
    tenantId: company.tenantId, companyId, userId, type: "STAGE_CHANGE",
    title: `Phase: ${company.stage?.name ?? "–"} → ${stage.name}`,
  });
}

/**
 * Rückt ein Unternehmen automatisch in eine Phase vor – aber nur vorwärts und nie aus Gewonnen/Verloren heraus.
 * Die Zuordnung erfolgt über den Stage-Key; fehlt der Key (konfigurierte Pipeline), passiert nichts.
 */
export async function advanceStage(companyId: string, key: string, userId?: string | null) {
  const company = await db.company.findUnique({ where: { id: companyId }, include: { stage: true } });
  if (!company) return;
  const target = await db.pipelineStage.findUnique({ where: { tenantId_key: { tenantId: company.tenantId, key } } });
  if (!target) return;
  if (company.stage && (company.stage.isWon || company.stage.isLost)) return;
  if (company.stage && company.stage.order >= target.order) return;
  await setStage(companyId, target.id, userId);
}
