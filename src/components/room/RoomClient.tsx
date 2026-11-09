"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import type { CalculatorInputs } from "@/lib/calculator";
import type { RoomDict } from "@/lib/room-i18n";
import { PotentialCalculator } from "./PotentialCalculator";

export function CalculatorSection({ slug, initial, analytics }: { slug: string; initial: CalculatorInputs; analytics: boolean }) {
  return (
    <PotentialCalculator
      initial={initial}
      onUse={() => {
        if (analytics) fetch(`/api/room/${slug}/events`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ type: "CALC_USED" }) }).catch(() => {});
      }}
    />
  );
}

export function CallRequest({ slug, t, hasOpenRequest }: { slug: string; t: RoomDict; hasOpenRequest: boolean }) {
  const [mode, setMode] = useState<null | "request" | "schedule">(null);
  const [sent, setSent] = useState(hasOpenRequest);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const router = useRouter();

  async function submit(form: FormData) {
    setBusy(true);
    setError(null);
    const res = await fetch(`/api/room/${slug}/meeting`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ action: mode, message: String(form.get("message") ?? "") || undefined, preferredTimes: String(form.get("preferredTimes") ?? "") || undefined }),
    });
    setBusy(false);
    if (!res.ok) return setError("Die Anfrage konnte nicht gesendet werden. Bitte versuchen Sie es erneut.");
    setSent(true);
    setMode(null);
    router.refresh();
  }

  if (sent && !mode) {
    return (
      <div>
        <p className="font-serif text-2xl text-ink-950" data-testid="call-request-sent">{t.requestSent}</p>
        <button className="mt-6 text-sm underline decoration-ink-300 underline-offset-4" onClick={() => setSent(false)}>Weitere Anfrage senden</button>
      </div>
    );
  }
  return (
    <div>
      <div className="flex flex-wrap gap-3">
        <button data-testid="request-call" onClick={() => setMode("request")} className={`rounded-sm px-6 py-3 text-sm font-medium transition ${mode === "request" ? "bg-[var(--primary)] text-white" : "bg-[var(--primary)] text-white hover:opacity-90"}`}>{t.requestCall}</button>
        <button data-testid="schedule-call" onClick={() => setMode("schedule")} className="rounded-sm border border-ink-300 px-6 py-3 text-sm font-medium hover:border-ink-900">{t.scheduleCall}</button>
      </div>
      {mode && (
        <form action={submit} className="mt-8 max-w-xl space-y-5">
          <label className="block"><span className="mb-1 block text-xs uppercase tracking-wider text-ink-500">{t.message}</span><textarea name="message" rows={3} maxLength={2000} className="w-full border-b border-ink-300 bg-transparent py-2 outline-none focus:border-[var(--accent)]" /></label>
          {mode === "schedule" && <label className="block"><span className="mb-1 block text-xs uppercase tracking-wider text-ink-500">{t.preferredTimes}</span><input name="preferredTimes" maxLength={500} placeholder="z. B. Di/Do vormittags" className="w-full border-b border-ink-300 bg-transparent py-2 outline-none focus:border-[var(--accent)]" /></label>}
          {error && <p className="text-sm text-red-700">{error}</p>}
          <div className="flex gap-3">
            <button data-testid="submit-call-request" disabled={busy} className="rounded-sm bg-[var(--primary)] px-6 py-3 text-sm font-medium text-white disabled:opacity-50">{t.send}</button>
            <button type="button" onClick={() => setMode(null)} className="px-4 text-sm text-ink-500">Abbrechen</button>
          </div>
        </form>
      )}
    </div>
  );
}

export function MessageForm({ slug, placeholder, sendLabel, defaultName, offerId }: { slug: string; placeholder: string; sendLabel: string; defaultName?: string; offerId?: string }) {
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const router = useRouter();
  async function submit(form: FormData) {
    setBusy(true);
    const res = await fetch(`/api/room/${slug}/messages`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ body: String(form.get("body") ?? ""), authorName: String(form.get("authorName") ?? "") || undefined, offerId }),
    });
    setBusy(false);
    if (res.ok) {
      setDone(true);
      router.refresh();
    }
  }
  return (
    <form action={submit} className="space-y-4" onChange={() => setDone(false)}>
      <input name="authorName" defaultValue={defaultName} placeholder="Ihr Name" maxLength={120} className="w-full border-b border-ink-300 bg-transparent py-2 text-sm outline-none focus:border-[var(--accent)]" />
      <textarea name="body" required rows={4} maxLength={4000} placeholder={placeholder} data-testid="message-body" className="w-full border-b border-ink-300 bg-transparent py-2 text-sm outline-none focus:border-[var(--accent)]" />
      <div className="flex items-center gap-4">
        <button disabled={busy} data-testid="message-send" className="rounded-sm bg-[var(--primary)] px-5 py-2.5 text-sm font-medium text-white disabled:opacity-50">{sendLabel}</button>
        {done && <span className="text-sm text-ink-500">Gesendet – vielen Dank.</span>}
      </div>
    </form>
  );
}
