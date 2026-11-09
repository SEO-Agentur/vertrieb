"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

/** Einwilligung zur Anwesenheitsanzeige / Nutzungserfassung. Ohne Zustimmung: kein Tracking. */
export function ConsentBanner({ slug, decided, presence, analytics }: { slug: string; decided: boolean; presence: boolean; analytics: boolean }) {
  const [open, setOpen] = useState(!decided);
  const [busy, setBusy] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const handler = (e: Event) => {
      const el = (e.target as HTMLElement).closest("[data-consent-open]");
      if (el) { e.preventDefault(); setOpen(true); }
    };
    document.addEventListener("click", handler);
    return () => document.removeEventListener("click", handler);
  }, []);

  async function choose(p: boolean, a: boolean) {
    setBusy(true);
    await fetch(`/api/room/${slug}/consent`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ presence: p, analytics: a }) });
    setBusy(false);
    setOpen(false);
    router.refresh();
  }

  if (!open) return null;
  return (
    <div id="consent" role="dialog" aria-label="Einwilligung" className="fixed inset-x-0 bottom-0 z-50 border-t border-ink-200 bg-white px-6 py-6 shadow-[0_-12px_40px_rgba(0,0,0,0.08)]">
      <div className="mx-auto flex max-w-5xl flex-col gap-5 md:flex-row md:items-center">
        <div className="text-sm leading-relaxed text-ink-700">
          <div className="mb-1 font-serif text-lg text-ink-950">Ihre Privatsphäre</div>
          Möchten Sie, dass Ihr Ansprechpartner sieht, wann Sie diese Seite geöffnet haben? Dann kann er Ihnen eine Live-Beratung anbieten – Sie entscheiden jedes Mal selbst, ob Sie annehmen.
          Optional können Sie zusätzlich erlauben, dass erfasst wird, welche Abschnitte Sie ansehen. Ihre Wahl können Sie jederzeit unten auf der Seite ändern.
          {decided && <span className="mt-1 block text-xs text-ink-500">Aktuell: {analytics ? "Anwesenheit und Nutzung" : presence ? "Anwesenheit" : "keine Erfassung"}</span>}
        </div>
        <div className="flex shrink-0 flex-col gap-2 md:w-72">
          <button data-testid="consent-presence" disabled={busy} onClick={() => choose(true, false)} className="rounded-sm bg-[var(--primary)] px-4 py-2.5 text-sm font-medium text-white">Anwesenheit anzeigen (ermöglicht Live-Beratung)</button>
          <button data-testid="consent-analytics" disabled={busy} onClick={() => choose(true, true)} className="rounded-sm border border-ink-300 px-4 py-2.5 text-sm">Auch Abschnitts-Nutzung erfassen</button>
          <button data-testid="consent-none" disabled={busy} onClick={() => choose(false, false)} className="px-4 py-2 text-sm text-ink-500 underline">Nur ansehen</button>
        </div>
      </div>
    </div>
  );
}
