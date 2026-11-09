"use client";
import { useActionState } from "react";
import { saveCallScriptAction, type SaveScriptState } from "../calls/actions";

export function CallScriptEditor({ initial, isAdmin, isDefault }: { initial: string; isAdmin: boolean; isDefault: boolean }) {
  const [state, action, pending] = useActionState<SaveScriptState, FormData>(saveCallScriptAction, {});
  return (
    <form action={action} className="space-y-3">
      <p className="text-sm text-ink-600">
        Der Leitfaden ist ein Ablauf aus Schritten (<code>nodes</code>). Jeder Schritt hat einen Text zum Sagen (<code>say</code>, Platzhalter
        <code> {"{{firstName}} {{lastName}} {{company}} {{industry}} {{topic}} {{consultant}}"}</code>) und Antwortoptionen. Eine Antwort führt
        entweder zum nächsten Schritt (<code>next</code>) oder beendet das Gespräch (<code>outcome</code>: APPOINTMENT, FOLLOW_UP, REJECTED mit
        <code> reason</code>, NOT_REACHED, WRONG_NUMBER, WRONG_PERSON). <code>kind</code>: positive, neutral, objection, negative.
      </p>
      <p className="text-xs text-ink-500">{isDefault ? "Aktuell: Standard-Leitfaden." : "Aktuell: angepasster Leitfaden."} Vor dem Speichern wird geprüft, ob alle Verweise gültig sind.</p>
      <textarea name="script" defaultValue={initial} rows={28} spellCheck={false} className="input font-mono text-xs" disabled={!isAdmin} />
      {state.error && <p className="rounded bg-red-50 px-3 py-2 text-sm text-red-700">{state.error}</p>}
      {state.ok && <p className="rounded bg-emerald-50 px-3 py-2 text-sm text-emerald-800">Gespeichert.</p>}
      {isAdmin && (
        <div className="flex gap-2">
          <button className="btn-primary" disabled={pending}>{pending ? "Prüfe …" : "Leitfaden speichern"}</button>
          <button name="reset" value="1" className="btn-secondary" disabled={pending} onClick={(e) => { if (!confirm("Auf Standard-Leitfaden zurücksetzen?")) e.preventDefault(); }}>Standard wiederherstellen</button>
        </div>
      )}
    </form>
  );
}
