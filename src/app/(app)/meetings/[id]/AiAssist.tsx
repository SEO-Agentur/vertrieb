"use client";
import { useActionState } from "react";
import { runAiAssist, type AiAssistResult } from "../actions";
import { addFinding } from "@/app/(app)/analyses/actions";

function List({ title, items }: { title: string; items: string[] }) {
  if (!items.length) return null;
  return (
    <div>
      <div className="text-xs font-semibold text-ink-500">{title}</div>
      <ul className="ml-4 list-disc text-sm">{items.map((i, k) => <li key={k}>{i}</li>)}</ul>
    </div>
  );
}

export function AiAssist({ meetingId, companyId }: { meetingId: string; companyId: string }) {
  const [state, action, pending] = useActionState<{ result?: AiAssistResult; error?: string } | null, FormData>(runAiAssist, null);
  const r = state?.result;
  return (
    <div className="space-y-3">
      <form action={action}>
        <input type="hidden" name="meetingId" value={meetingId} />
        <button className="btn-primary btn-sm" disabled={pending}>{pending ? "Analysiere Notizen …" : "Notizen mit KI auswerten"}</button>
      </form>
      {state?.error && <p className="text-sm text-red-700">{state.error}</p>}
      {r && (
        <div className="space-y-3 rounded-md border border-violet-200 bg-violet-50/50 p-3">
          <p className="text-xs text-violet-800">KI-Vorschläge – unbestätigte Hypothesen, bitte prüfen. Es wird nichts automatisch gespeichert.</p>
          <List title="Vorgeschlagene Rückfragen" items={r.suggestedQuestions} />
          {r.structuredInsights.length > 0 && (
            <div>
              <div className="text-xs font-semibold text-ink-500">Strukturierte Erkenntnisse</div>
              <ul className="space-y-2">
                {r.structuredInsights.map((i, k) => (
                  <li key={k} className="rounded bg-white p-2 text-sm">
                    <div className="font-medium">{i.title} <span className="text-xs text-ink-500">({i.area}{i.isConfirmedByClient ? ", laut Notizen bestätigt" : ", unbestätigt"})</span></div>
                    <div className="text-ink-600">{i.description}</div>
                    <form action={addFinding} className="mt-1 flex items-center gap-2">
                      <input type="hidden" name="companyId" value={companyId} />
                      <input type="hidden" name="meetingId" value={meetingId} />
                      <input type="hidden" name="area" value={i.area} />
                      <input type="hidden" name="title" value={i.title} />
                      <input type="hidden" name="description" value={i.description} />
                      <input type="hidden" name="origin" value="AI" />
                      <select name="status" defaultValue="HYPOTHESIS" className="input w-auto py-1 text-xs">
                        <option value="HYPOTHESIS">als Hypothese</option>
                        <option value="CONFIRMED">als bestätigt (geprüft)</option>
                      </select>
                      <button className="btn-secondary btn-sm">Als Erkenntnis übernehmen</button>
                    </form>
                  </li>
                ))}
              </ul>
            </div>
          )}
          <List title="Mögliche Ursachen" items={r.possibleCauses} />
          <List title="Lösungsideen" items={r.solutionIdeas} />
          <List title="Wirtschaftliche Annahmen (zu prüfen)" items={r.assumptions} />
          <List title="Offene Fragen" items={r.openQuestions} />
          <List title="Empfohlene nächste Schritte" items={r.nextSteps} />
        </div>
      )}
    </div>
  );
}
