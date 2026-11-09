"use client";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { renderSay, OUTCOMES, OUTCOME_LABEL, REJECTION_REASONS, type AssistResult, type CallScript, type Outcome, type RejectionReason, type ScriptVars } from "@/lib/call-script";
import { assistAction, saveCallAction } from "./actions";

type Props = {
  contact: { id: string; firstName: string; lastName: string; title: string | null; phone: string | null; email: string | null; linkedinUrl: string | null };
  company: { id: string; name: string; industry: string | null; location: string | null; revenue: string; hasRoom: boolean };
  script: CallScript;
  vars: ScriptVars;
  topics: string[];
  history: { id: string; title: string; body: string | null; date: string }[];
  aiEnabled: boolean;
};

const KIND_STYLE: Record<string, string> = {
  positive: "border-emerald-300 bg-emerald-50 text-emerald-900 hover:bg-emerald-100",
  neutral: "border-ink-200 bg-white text-ink-800 hover:bg-ink-50",
  objection: "border-amber-300 bg-amber-50 text-amber-900 hover:bg-amber-100",
  negative: "border-red-200 bg-red-50 text-red-800 hover:bg-red-100",
};

function localInput(d: Date) {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
function inDays(days: number, hour = 10) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  d.setHours(hour, 0, 0, 0);
  return localInput(d);
}

export function CallWorkspace({ contact, company, script, vars, topics, history, aiEnabled }: Props) {
  const [nodeId, setNodeId] = useState(script.startId);
  const [suggestion, setSuggestion] = useState<string | null>(null);
  const [path, setPath] = useState<{ step: string; answer: string; nodeId: string }[]>([]);
  const [input, setInput] = useState("");
  const [notes, setNotes] = useState("");
  const [assist, setAssist] = useState<AssistResult | null>(null);
  const [outcome, setOutcome] = useState<Outcome | null>(null);
  const [reason, setReason] = useState<RejectionReason | "">("");
  const [followUpAt, setFollowUpAt] = useState("");
  const [appointmentAt, setAppointmentAt] = useState(inDays(3, 10));
  const [markLost, setMarkLost] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState<{ meetingId?: string } | null>(null);
  const [pending, start] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);

  const node = useMemo(() => script.nodes.find((n) => n.id === nodeId) ?? script.nodes[0], [script, nodeId]);
  const phases = useMemo(() => Array.from(new Set(script.nodes.map((n) => n.phase))), [script]);

  function chooseOutcome(o: Outcome, r?: RejectionReason) {
    setOutcome(o);
    setReason(r ?? "");
    if (o === "FOLLOW_UP") setFollowUpAt(inDays(3));
    else if (o === "NOT_REACHED") setFollowUpAt(inDays(1));
    else if (o === "REJECTED") setFollowUpAt(r === "TOO_LATE" ? inDays(180) : "");
    else setFollowUpAt("");
  }

  function pick(answerId: string) {
    const a = node.answers.find((x) => x.id === answerId);
    if (!a) return;
    setPath((p) => [...p, { step: node.title, answer: a.label, nodeId: node.id }]);
    setAssist(null);
    setSuggestion(null);
    if (a.outcome) chooseOutcome(a.outcome, a.reason);
    else if (a.next) setNodeId(a.next);
  }

  function back() {
    setPath((p) => {
      const last = p[p.length - 1];
      if (last) setNodeId(last.nodeId);
      return p.slice(0, -1);
    });
    setSuggestion(null);
    setAssist(null);
    setOutcome(null);
  }

  function analyze() {
    const text = input.trim();
    if (!text) return;
    start(async () => {
      const r = await assistAction(contact.id, node.id, text, path.map(({ step, answer }) => ({ step, answer })));
      setAssist(r);
    });
  }

  function applyAssist() {
    if (!assist) return;
    const said = input.trim();
    setPath((p) => [...p, { step: node.title, answer: `„${said}“`, nodeId: node.id }]);
    setNotes((n) => (n ? `${n}\n` : "") + `• ${said}`);
    setInput("");
    if (assist.outcome) chooseOutcome(assist.outcome, assist.reason ?? undefined);
    else if (assist.nextNodeId) {
      setNodeId(assist.nextNodeId);
      setSuggestion(assist.suggestedReply);
    } else if (assist.matchedAnswerId) {
      const a = node.answers.find((x) => x.id === assist.matchedAnswerId);
      if (a?.outcome) chooseOutcome(a.outcome, a.reason);
      else if (a?.next) setNodeId(a.next);
    }
    setAssist(null);
  }

  function save() {
    if (!outcome) return;
    setError(null);
    start(async () => {
      const res = await saveCallAction(contact.id, {
        outcome,
        reason: outcome === "REJECTED" ? reason || null : null,
        notes,
        path: path.map(({ step, answer }) => ({ step, answer })),
        followUpAt: followUpAt ? new Date(followUpAt).toISOString() : null,
        appointmentAt: outcome === "APPOINTMENT" ? new Date(appointmentAt).toISOString() : null,
        markCompanyLost: markLost,
      });
      if (res.ok) setSaved({ meetingId: res.meetingId });
      else setError(res.error);
    });
  }

  // Tastenkürzel 1–9 für Antwortoptionen (nicht beim Tippen)
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const t = e.target as HTMLElement;
      if (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.tagName === "SELECT" || outcome || saved) return;
      const i = Number(e.key);
      if (i >= 1 && i <= node.answers.length) pick(node.answers[i - 1].id);
      if (e.key === "/") { e.preventDefault(); inputRef.current?.focus(); }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  if (saved) {
    return (
      <div className="mx-auto max-w-lg rounded-lg border border-emerald-200 bg-white p-6 text-center" data-testid="call-saved">
        <div className="text-lg font-semibold text-emerald-800">Telefonat gespeichert: {outcome && OUTCOME_LABEL[outcome]}</div>
        <p className="mt-2 text-sm text-ink-600">Aktivität, Status{outcome === "FOLLOW_UP" || outcome === "NOT_REACHED" ? ", Wiedervorlage" : ""}{saved.meetingId ? " und Termin" : ""} wurden angelegt.</p>
        <div className="mt-4 flex justify-center gap-2">
          <Link href="/calls" className="btn-primary">Nächster Anruf</Link>
          {saved.meetingId && <Link href={`/meetings/${saved.meetingId}`} className="btn-secondary">Termin öffnen</Link>}
          <Link href={`/companies/${company.id}?tab=activities`} className="btn-secondary">Kundenakte</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="grid gap-5 xl:grid-cols-[280px_1fr_320px]">
      {/* Links: Kontakt & Kontext */}
      <aside className="space-y-4">
        <div className="card-pad">
          <div className="text-lg font-semibold">{contact.firstName} {contact.lastName}</div>
          <div className="text-sm text-ink-500">{contact.title ?? "Position unbekannt"}</div>
          <Link href={`/companies/${company.id}`} className="mt-1 block text-sm font-medium hover:underline">{company.name}</Link>
          <div className="text-xs text-ink-500">{company.industry ?? "Branche unbekannt"} · {company.location ?? "–"} · Umsatz {company.revenue}</div>
          <div className="mt-3 space-y-1.5 text-sm">
            {contact.phone ? <a href={`tel:${contact.phone.replace(/[^\d+]/g, "")}`} className="btn-primary w-full" data-testid="call-phone">Anrufen: {contact.phone}</a> : <div className="rounded bg-amber-50 px-2 py-1 text-xs text-amber-900">Keine Telefonnummer hinterlegt</div>}
            {contact.email && <div className="truncate text-xs text-ink-600">{contact.email}</div>}
            {contact.linkedinUrl && <a href={contact.linkedinUrl} target="_blank" rel="noopener noreferrer" className="link text-xs">LinkedIn-Profil ↗</a>}
          </div>
        </div>
        {topics.length > 0 && (
          <div className="card-pad">
            <div className="h2 mb-2">Mögliche Themen (Hypothesen)</div>
            <ul className="list-inside list-disc text-sm text-ink-700">{topics.map((t) => <li key={t}>{t}</li>)}</ul>
          </div>
        )}
        <div className="card-pad">
          <div className="h2 mb-2">Bisherige Kontakte</div>
          {history.length === 0 ? <p className="text-xs text-ink-400">Noch keine Aktivitäten.</p> : (
            <ul className="space-y-2 text-xs">{history.map((h) => <li key={h.id}><div className="font-medium">{h.title}</div><div className="text-ink-400">{h.date}</div></li>)}</ul>
          )}
        </div>
      </aside>

      {/* Mitte: Leitfaden */}
      <section className="space-y-4">
        <div className="flex flex-wrap gap-1 text-[11px]">
          {phases.map((p) => <span key={p} className={`rounded-full px-2 py-0.5 ${p === node.phase ? "bg-ink-900 text-white" : "bg-ink-100 text-ink-500"}`}>{p}</span>)}
        </div>
        <div className="card p-6" data-testid="call-step">
          <div className="mb-1 flex items-center justify-between text-xs text-ink-400"><span>{node.phase} · {node.title}</span>{path.length > 0 && <button onClick={back} className="underline">← zurück</button>}</div>
          {suggestion && (
            <div className="mb-3 rounded-md border border-violet-200 bg-violet-50 p-3">
              <div className="text-[11px] font-semibold uppercase tracking-wide text-violet-700">KI-Vorschlag</div>
              <p className="mt-1 text-lg leading-relaxed text-violet-950" data-testid="call-suggestion">{suggestion}</p>
            </div>
          )}
          <p className={`${suggestion ? "text-sm text-ink-500" : "text-xl leading-relaxed text-ink-950"}`} data-testid="call-say">{renderSay(node.say, vars)}</p>
          {node.hint && <p className="mt-3 text-xs text-ink-500">Tipp: {node.hint}</p>}
        </div>

        <div>
          <div className="mb-2 text-xs font-medium text-ink-500">Antwort des Gesprächspartners (Klick oder Taste 1–{node.answers.length})</div>
          <div className="grid gap-2 sm:grid-cols-2">
            {node.answers.map((a, i) => (
              <button key={a.id} onClick={() => pick(a.id)} disabled={!!outcome} data-testid={`answer-${a.id}`} className={`flex items-center gap-2 rounded-md border px-3 py-2.5 text-left text-sm transition disabled:opacity-50 ${KIND_STYLE[a.kind]}`}>
                <kbd className="rounded bg-white/70 px-1.5 text-[11px] text-ink-500">{i + 1}</kbd>
                <span className="flex-1">{a.label}</span>
                {a.outcome && <span className="text-[10px] uppercase opacity-70">{OUTCOME_LABEL[a.outcome]}</span>}
              </button>
            ))}
          </div>
        </div>

        <div className="card p-4">
          <label className="label" htmlFor="call-input">Andere Antwort eintippen (Taste „/“) – {aiEnabled ? "KI schlägt die passende Reaktion vor" : "regelbasierte Zuordnung (KI nicht aktiviert)"}</label>
          <div className="flex gap-2">
            <input id="call-input" ref={inputRef} value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); analyze(); } }} placeholder="z. B. „Wir arbeiten schon mit einer Agentur, die macht das ganz gut“" className="input" data-testid="call-input" disabled={!!outcome} />
            <button onClick={analyze} disabled={pending || !input.trim() || !!outcome} className="btn-primary" data-testid="call-analyze">{pending ? "…" : "Auswerten"}</button>
          </div>
          {assist && (
            <div className="mt-3 rounded-md border border-ink-200 bg-ink-50 p-3 text-sm" data-testid="call-assist">
              <div className="flex items-center gap-2 text-xs text-ink-500"><span className="rounded bg-white px-1.5">{assist.mode === "AI" ? "KI" : "regelbasiert"}</span>{assist.aiDisabledReason && <span>{assist.aiDisabledReason}</span>}</div>
              <p className="mt-1">{assist.interpretation}</p>
              {assist.suggestedReply && <p className="mt-1 text-violet-900">Vorschlag: „{assist.suggestedReply}“</p>}
              <div className="mt-2 flex gap-2">
                {(assist.nextNodeId || assist.outcome || assist.matchedAnswerId) && <button onClick={applyAssist} className="btn-primary btn-sm" data-testid="call-apply">Übernehmen{assist.outcome ? ` (${OUTCOME_LABEL[assist.outcome]})` : ""}</button>}
                <button onClick={() => { setNotes((n) => (n ? `${n}\n` : "") + `• ${input.trim()}`); setInput(""); setAssist(null); }} className="btn-secondary btn-sm">Nur als Notiz</button>
              </div>
            </div>
          )}
        </div>

        {path.length > 0 && (
          <div className="text-xs text-ink-500">
            <div className="mb-1 font-medium">Verlauf</div>
            <ol className="list-inside list-decimal space-y-0.5">{path.map((s, i) => <li key={i}>{s.step} → <span className="text-ink-800">{s.answer}</span></li>)}</ol>
          </div>
        )}
        <p className="text-[11px] text-ink-400">Datenschutz: Das Gespräch wird nicht aufgezeichnet. Verarbeitet werden nur Ihre Klicks und Eingaben.</p>
      </section>

      {/* Rechts: Notizen & Ergebnis */}
      <aside className="space-y-4">
        <div className="card-pad">
          <label className="h2 mb-2 block" htmlFor="call-notes">Gesprächsnotizen</label>
          <textarea id="call-notes" value={notes} onChange={(e) => setNotes(e.target.value)} rows={7} className="input" placeholder="Engpässe, genannte Systeme, Namen, nächste Schritte …" data-testid="call-notes" />
        </div>
        <div className="card-pad">
          <div className="h2 mb-2">Ergebnis</div>
          <div className="grid grid-cols-2 gap-1.5">
            {OUTCOMES.map((o) => (
              <button key={o} onClick={() => chooseOutcome(o)} data-testid={`outcome-${o}`} className={`rounded-md border px-2 py-1.5 text-xs ${outcome === o ? "border-ink-900 bg-ink-900 text-white" : "border-ink-200 bg-white hover:bg-ink-50"}`}>{OUTCOME_LABEL[o]}</button>
            ))}
          </div>
          {outcome && (
            <div className="mt-3 space-y-2 text-sm">
              {outcome === "REJECTED" && (
                <>
                  <label className="label" htmlFor="call-reason">Absagegrund</label>
                  <select id="call-reason" value={reason} onChange={(e) => { const r = e.target.value as RejectionReason; setReason(r); if (r === "TOO_LATE" && !followUpAt) setFollowUpAt(inDays(180)); }} className="input" data-testid="call-reason">
                    <option value="">bitte wählen</option>
                    {Object.entries(REJECTION_REASONS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                  </select>
                  <label className="flex items-center gap-2 text-xs"><input type="checkbox" checked={markLost} onChange={(e) => setMarkLost(e.target.checked)} /> Unternehmen in der Pipeline als „Verloren“ markieren</label>
                </>
              )}
              {outcome === "APPOINTMENT" && (
                <>
                  <label className="label" htmlFor="call-appointment">Termin</label>
                  <input id="call-appointment" type="datetime-local" value={appointmentAt} onChange={(e) => setAppointmentAt(e.target.value)} className="input" data-testid="call-appointment" />
                  {!company.hasRoom && <p className="text-xs text-amber-700">Noch keine Kundenwelt – für ein Videogespräch bitte anlegen.</p>}
                </>
              )}
              {(outcome === "FOLLOW_UP" || outcome === "NOT_REACHED" || outcome === "REJECTED") && (
                <>
                  <label className="label" htmlFor="call-followup">{outcome === "REJECTED" ? "Optional: später erneut versuchen am" : "Wiedervorlage am"}</label>
                  <input id="call-followup" type="datetime-local" value={followUpAt} onChange={(e) => setFollowUpAt(e.target.value)} className="input" data-testid="call-followup" />
                </>
              )}
              {error && <p className="rounded bg-red-50 px-2 py-1 text-xs text-red-700">{error}</p>}
              <button onClick={save} disabled={pending} className="btn-primary w-full" data-testid="call-save">{pending ? "Speichere …" : "Telefonat speichern"}</button>
              <button onClick={() => setOutcome(null)} className="btn-ghost w-full text-xs">Gespräch fortsetzen</button>
            </div>
          )}
        </div>
      </aside>
    </div>
  );
}
