"use client";
import { useState } from "react";
import { SubmitButton } from "@/components/SubmitButton";
import { approveMessageAction, markSentAction, markReplyAction, updateMessageAction, deleteMessageAction, aiRewriteAction } from "./actions";

type Msg = { id: string; body: string; status: string; kind: string; origin: string; sentAt: string | null; followUpAt: string | null; contactName: string | null; linkedinUrl: string | null; inviteUrlIncluded: boolean };

const STATUS: Record<string, [string, string]> = {
  DRAFT: ["Entwurf – Freigabe erforderlich", "bg-amber-50 text-amber-800"],
  APPROVED: ["Freigegeben – bereit zum manuellen Versand", "bg-sky-50 text-sky-800"],
  SENT: ["Gesendet", "bg-emerald-50 text-emerald-800"],
  REPLIED: ["Antwort erhalten", "bg-emerald-100 text-emerald-900"],
  NO_RESPONSE: ["Keine Reaktion", "bg-ink-100 text-ink-700"],
};

export function MessageCard({ m, aiEnabled, editor }: { m: Msg; aiEnabled: boolean; editor: boolean }) {
  const [text, setText] = useState(m.body);
  const [copied, setCopied] = useState(false);
  const locked = m.status === "SENT" || m.status === "REPLIED" || m.status === "NO_RESPONSE";
  const dirty = text !== m.body;
  const [label, cls] = STATUS[m.status] ?? [m.status, ""];
  return (
    <div className="card p-4" data-testid="outreach-message">
      <div className="mb-2 flex flex-wrap items-center gap-2 text-xs">
        <span className={`rounded px-1.5 py-0.5 font-medium ${cls}`} data-testid="message-status">{label}</span>
        <span className="text-ink-500">{m.kind === "FOLLOW_UP" ? "Follow-up" : "Erstansprache"} · {m.origin === "AI" ? "KI-überarbeitet" : m.origin === "USER" ? "bearbeitet" : "Vorlage"}{m.contactName && ` · an ${m.contactName}`}</span>
        {m.inviteUrlIncluded && <span className="text-ink-400">mit Einladungslink</span>}
        {m.sentAt && <span className="text-ink-400">gesendet {new Date(m.sentAt).toLocaleDateString("de-DE")}</span>}
        {m.followUpAt && m.status === "SENT" && <span className="text-ink-400">Follow-up {new Date(m.followUpAt).toLocaleDateString("de-DE")}</span>}
      </div>
      <form action={updateMessageAction.bind(null, m.id)}>
        <textarea name="body" value={text} onChange={(e) => setText(e.target.value)} readOnly={locked || !editor} rows={Math.min(14, Math.max(5, text.split("\n").length + 1))} className="input font-[inherit] text-sm" data-testid="message-text" />
        <div className="mt-1 flex justify-between text-[11px] text-ink-400">
          <span>{text.length} Zeichen{text.length > 300 && " · Kontaktanfragen mit Notiz sind auf 300 Zeichen begrenzt"}</span>
          {dirty && !locked && editor && <SubmitButton className="btn-secondary btn-sm">Änderungen speichern</SubmitButton>}
        </div>
      </form>
      <div className="mt-3 flex flex-wrap gap-2">
        <button type="button" className="btn-secondary btn-sm" onClick={() => { navigator.clipboard?.writeText(text); setCopied(true); }}>{copied ? "Kopiert" : "Kopieren"}</button>
        {m.linkedinUrl && <a className="btn-secondary btn-sm" href={m.linkedinUrl} target="_blank" rel="noopener noreferrer">LinkedIn-Profil öffnen</a>}
        {editor && m.status === "DRAFT" && !dirty && <form action={approveMessageAction.bind(null, m.id)}><SubmitButton className="btn-primary btn-sm"><span data-testid="approve-message">Freigeben</span></SubmitButton></form>}
        {editor && m.status === "APPROVED" && (
          <form action={markSentAction.bind(null, m.id)} className="flex items-center gap-1">
            <SubmitButton className="btn-primary btn-sm"><span data-testid="mark-sent">Als gesendet markieren</span></SubmitButton>
            <span className="text-[11px] text-ink-500">Follow-up in</span><input name="followUpDays" type="number" min={1} defaultValue={5} className="input w-14 px-1 py-0.5 text-xs" /><span className="text-[11px] text-ink-500">Tagen</span>
          </form>
        )}
        {editor && (m.status === "SENT" || m.status === "NO_RESPONSE") && <form action={markReplyAction.bind(null, m.id, true)}><SubmitButton className="btn-secondary btn-sm"><span data-testid="mark-replied">Antwort erhalten</span></SubmitButton></form>}
        {editor && m.status === "SENT" && <form action={markReplyAction.bind(null, m.id, false)}><SubmitButton className="btn-ghost btn-sm">Keine Reaktion</SubmitButton></form>}
        {editor && !locked && aiEnabled && (
          <form action={aiRewriteAction.bind(null, m.id)} className="flex gap-1">
            <input name="instruction" placeholder="KI-Wunsch, z. B. kürzer" className="input w-48 py-1 text-xs" />
            <SubmitButton className="btn-ghost btn-sm" pendingText="KI arbeitet …">Mit KI überarbeiten</SubmitButton>
          </form>
        )}
        {editor && !locked && <form action={deleteMessageAction.bind(null, m.id)} className="ml-auto"><SubmitButton className="btn-ghost btn-sm" confirm="Entwurf löschen?">Löschen</SubmitButton></form>}
      </div>
    </div>
  );
}
