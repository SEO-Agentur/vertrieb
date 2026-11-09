import "server-only";
import { db } from "./db";
import { CallScriptSchema, DEFAULT_CALL_SCRIPT, type CallScript } from "./call-script";

export const CALL_SCRIPT_KEY = "callScript";

/** Leitfaden des Mandanten (Einstellungen) oder Standard-Leitfaden. */
export async function loadCallScript(tenantId: string): Promise<CallScript> {
  const row = await db.setting.findUnique({ where: { tenantId_key: { tenantId, key: CALL_SCRIPT_KEY } } });
  if (!row) return DEFAULT_CALL_SCRIPT;
  const parsed = CallScriptSchema.safeParse(row.value);
  return parsed.success ? parsed.data : DEFAULT_CALL_SCRIPT;
}
