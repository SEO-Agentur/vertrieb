"use client";
import { useActionState, useState } from "react";
import { createInviteAction, type InviteResult } from "./actions";

export function InviteCreator({ roomId, contacts }: { roomId: string; contacts: { id: string; name: string; email: string | null }[] }) {
  const [state, action, pending] = useActionState(createInviteAction.bind(null, roomId), {} as InviteResult);
  const [copied, setCopied] = useState(false);
  return (
    <div>
      <form action={action} className="grid gap-3 md:grid-cols-5">
        <label className="block md:col-span-2"><span className="label">Ansprechpartner</span>
          <select name="contactId" className="input">
            <option value="">– ohne Zuordnung –</option>
            {contacts.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </label>
        <label className="block"><span className="label">E-Mail (für Verifizierung, optional)</span><input name="email" type="email" className="input" /></label>
        <label className="block"><span className="label">Gültig (Tage)</span><input name="days" type="number" min={1} max={365} defaultValue={30} className="input" /></label>
        <label className="block"><span className="label">Max. Aufrufe (optional)</span><input name="maxUses" type="number" min={1} className="input" /></label>
        <label className="block md:col-span-4"><span className="label">Bezeichnung (optional)</span><input name="label" placeholder="z. B. LinkedIn-Erstansprache" className="input" /></label>
        <div className="flex items-end"><button data-testid="create-invite" disabled={pending} className="btn-primary w-full">Einladungslink erzeugen</button></div>
      </form>
      {state.url && (
        <div className="mt-4 rounded-md border border-emerald-200 bg-emerald-50 p-3">
          <div className="text-xs font-medium text-emerald-800">Einladungslink – wird nur jetzt angezeigt und nicht im Klartext gespeichert:</div>
          <div className="mt-2 flex gap-2">
            <input readOnly value={state.url} data-testid="invite-url" className="input font-mono text-xs" onFocus={(e) => e.currentTarget.select()} />
            <button type="button" className="btn-secondary" onClick={() => { navigator.clipboard?.writeText(state.url!); setCopied(true); }}>{copied ? "Kopiert" : "Kopieren"}</button>
          </div>
        </div>
      )}
      {state.error && <p className={`mt-2 text-sm ${state.url ? "text-amber-700" : "text-red-700"}`}>{state.error}</p>}
    </div>
  );
}
