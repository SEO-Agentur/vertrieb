"use client";
import { useActionState } from "react";
import { SubmitButton } from "@/components/SubmitButton";
import { saveAiKeyAction, type AiKeyState } from "./actions";

type Props = { isAdmin: boolean; source: "settings" | "env" | null; hint: string | null; model: string; updatedAt: string | null; decryptFailed: boolean; models: { id: string; label: string }[] };

export function AiKeyForm({ isAdmin, source, hint, model, updatedAt, decryptFailed, models }: Props) {
  const [state, action] = useActionState<AiKeyState, FormData>(saveAiKeyAction, {});
  return (
    <form action={action} className="space-y-4" autoComplete="off">
      <div className="text-sm">
        Status:{" "}
        {source === "settings" && <span className="rounded bg-emerald-50 px-1.5 py-0.5 text-emerald-800">aktiv – Key endet auf …{hint}{updatedAt ? `, gespeichert ${new Date(updatedAt).toLocaleString("de-DE")}` : ""}</span>}
        {source === "env" && <span className="rounded bg-emerald-50 px-1.5 py-0.5 text-emerald-800">aktiv über Umgebungsvariable (…{hint}) – ein hier gespeicherter Key hat Vorrang</span>}
        {!source && <span className="rounded bg-amber-50 px-1.5 py-0.5 text-amber-800">nicht aktiviert – KI-Funktionen laufen regelbasiert</span>}
        {decryptFailed && <p className="mt-2 rounded bg-red-50 px-2 py-1 text-xs text-red-700">Der gespeicherte Key kann nicht entschlüsselt werden (SESSION_SECRET geändert?). Bitte neu eingeben.</p>}
      </div>
      {isAdmin ? (
        <>
          <div className="grid gap-3 md:grid-cols-2">
            <label className="block"><span className="label">Anthropic-API-Key {source === "settings" ? "(leer lassen = unverändert)" : ""}</span>
              <input name="apiKey" type="password" placeholder="sk-ant-…" className="input font-mono" autoComplete="new-password" spellCheck={false} data-testid="ai-key-input" />
            </label>
            <label className="block"><span className="label">Modell</span>
              <select name="model" defaultValue={model} className="input">{models.map((m) => <option key={m.id} value={m.id}>{m.label}</option>)}</select>
            </label>
          </div>
          <p className="text-xs text-ink-500">Der Key wird verschlüsselt gespeichert und nie wieder vollständig angezeigt. Er wird vor dem Speichern mit einer kostenlosen Abfrage geprüft. Den Key erstellst du in der Anthropic Console unter „API Keys“.</p>
          <div className="flex flex-wrap gap-2">
            <SubmitButton name="op" value="save" data-testid="ai-key-save">Speichern & prüfen</SubmitButton>
            {source && <SubmitButton name="op" value="test" className="btn-secondary">Verbindung testen</SubmitButton>}
            {source === "settings" && <SubmitButton name="op" value="remove" className="btn-danger" confirm="API-Key wirklich entfernen?">Key entfernen</SubmitButton>}
          </div>
        </>
      ) : <p className="text-xs text-ink-500">Nur Administratoren können den Key ändern.</p>}
      {state.message && <p className="rounded bg-emerald-50 px-3 py-2 text-sm text-emerald-800" data-testid="ai-key-message">{state.message}</p>}
      {state.error && <p className="rounded bg-red-50 px-3 py-2 text-sm text-red-700" data-testid="ai-key-error">{state.error}</p>}
    </form>
  );
}
