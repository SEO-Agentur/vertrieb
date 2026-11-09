"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { VideoCall } from "@/components/video/VideoCall";

type MeetingState = { id: string; status: string; presenterActive: boolean; presenterSection: string | null; initiatedBy: string } | null;
type StreamData = { meeting: MeetingState; offers: number; lastConsultantMessageAt: string | null; followPresenter: boolean };

/**
 * Live-Funktionen der Kundenwelt: Anwesenheit (nur mit Einwilligung), Gesprächsangebote,
 * eingebettetes Video (Kamera/Mikro nie automatisch) und gemeinsames Navigieren (nur mit Zustimmung).
 */
export function RoomLive({ slug, presence, initialFollow }: { slug: string; presence: boolean; initialFollow: boolean }) {
  const [data, setData] = useState<StreamData | null>(null);
  const [dismissed, setDismissed] = useState<string | null>(null);
  const [inCall, setInCall] = useState<string | null>(null);
  const [follow, setFollow] = useState(initialFollow);
  const [declinedFollow, setDeclinedFollow] = useState(false);
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const section = useRef<string | null>(null);
  const prev = useRef<{ offers: number; msg: string | null } | null>(null);
  const router = useRouter();

  // Sichtbaren Abschnitt bestimmen
  useEffect(() => {
    const els = Array.from(document.querySelectorAll<HTMLElement>("[data-room-section]"));
    const obs = new IntersectionObserver(
      (entries) => {
        const vis = entries.filter((e) => e.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (vis) section.current = (vis.target as HTMLElement).dataset.roomSection ?? null;
      },
      { threshold: [0.25, 0.5, 0.75] },
    );
    els.forEach((el) => obs.observe(el));
    return () => obs.disconnect();
  }, []);

  // Heartbeat nur mit Einwilligung
  useEffect(() => {
    if (!presence) return;
    const beat = () => fetch(`/api/room/${slug}/heartbeat`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ section: section.current }) }).catch(() => {});
    beat();
    const t = setInterval(beat, 15_000);
    const onVis = () => { if (!document.hidden) beat(); };
    document.addEventListener("visibilitychange", onVis);
    return () => { clearInterval(t); document.removeEventListener("visibilitychange", onVis); };
  }, [presence, slug]);

  // Live-Stream
  useEffect(() => {
    const es = new EventSource(`/api/room/${slug}/stream`);
    es.onmessage = (e) => {
      const d = JSON.parse(e.data) as StreamData;
      setData(d);
      setFollow(d.followPresenter);
      const p = prev.current;
      if (p && (p.offers !== d.offers || p.msg !== d.lastConsultantMessageAt)) router.refresh();
      prev.current = { offers: d.offers, msg: d.lastConsultantMessageAt };
    };
    es.addEventListener("ended", () => { es.close(); router.refresh(); });
    return () => es.close();
  }, [slug, router]);

  // Gemeinsame Navigation – nur wenn zugestimmt
  const meeting = data?.meeting ?? null;
  useEffect(() => {
    if (!follow || !meeting?.presenterActive || !meeting.presenterSection) return;
    document.getElementById(meeting.presenterSection)?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [follow, meeting?.presenterActive, meeting?.presenterSection]);

  const setFollowServer = useCallback(async (v: boolean) => {
    setFollow(v);
    if (!v) setDeclinedFollow(true);
    await fetch(`/api/room/${slug}/consent`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ followPresenter: v }) });
  }, [slug]);

  async function act(action: "accept" | "decline" | "later" | "schedule", extra: Record<string, string> = {}) {
    if (!meeting && action !== "schedule") return;
    const res = await fetch(`/api/room/${slug}/meeting`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ action, meetingId: meeting?.id, ...extra }) });
    if (meeting) setDismissed(meeting.id);
    if (action === "accept" && res.ok && meeting) setInCall(meeting.id);
    if (action === "schedule") { setScheduleOpen(false); router.refresh(); }
  }

  const showOffer = meeting && meeting.status === "OFFERED" && dismissed !== meeting.id && !inCall;
  const canJoin = meeting && (meeting.status === "ACCEPTED" || meeting.status === "LIVE") && !inCall;

  return (
    <>
      {showOffer && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 px-6" role="dialog" aria-modal="true" data-testid="live-offer-modal">
          <div className="w-full max-w-lg rounded-sm bg-white p-10 shadow-2xl">
            <div className="mb-3 flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-emerald-700"><span className="h-2 w-2 rounded-full bg-emerald-500" />Jetzt verfügbar</div>
            <p className="font-serif text-2xl leading-snug text-ink-950">Ihr Ansprechpartner ist gerade verfügbar. Möchten Sie Ihre Möglichkeiten direkt gemeinsam besprechen?</p>
            <p className="mt-3 text-sm text-ink-500">Das Gespräch findet direkt im Browser statt. Kamera und Mikrofon schalten Sie selbst ein.</p>
            {!scheduleOpen ? (
              <div className="mt-8 flex flex-col gap-2">
                <button data-testid="accept-call" onClick={() => act("accept")} className="rounded-sm bg-[var(--primary)] px-5 py-3 text-sm font-medium text-white">Videogespräch starten</button>
                <button onClick={() => setScheduleOpen(true)} className="rounded-sm border border-ink-300 px-5 py-3 text-sm">Termin vereinbaren</button>
                <button data-testid="later-call" onClick={() => act("later")} className="px-5 py-2 text-sm text-ink-500 underline">Später</button>
              </div>
            ) : (
              <form className="mt-6 space-y-3" action={(f) => { act("later"); act("schedule", { preferredTimes: String(f.get("preferredTimes") ?? ""), message: "Terminwunsch aus Live-Angebot" }); }}>
                <input name="preferredTimes" placeholder="Bevorzugte Zeiten, z. B. Mi 10–12 Uhr" className="input" />
                <div className="flex gap-2"><button className="rounded-sm bg-[var(--primary)] px-5 py-2.5 text-sm text-white">Terminwunsch senden</button><button type="button" onClick={() => setScheduleOpen(false)} className="px-3 text-sm text-ink-500">Zurück</button></div>
              </form>
            )}
          </div>
        </div>
      )}

      {canJoin && (
        <div className="fixed bottom-6 right-6 z-40 rounded-sm bg-white p-5 shadow-2xl ring-1 ring-black/5">
          <div className="text-sm text-ink-700">Ihr Gesprächsraum ist bereit.</div>
          <button data-testid="join-call" onClick={() => setInCall(meeting!.id)} className="mt-3 w-full rounded-sm bg-[var(--primary)] px-4 py-2.5 text-sm font-medium text-white">Gespräch beitreten</button>
        </div>
      )}

      {inCall && (
        <div className="fixed bottom-4 right-4 z-[55] w-[min(92vw,30rem)] overflow-hidden rounded-sm bg-ink-950 shadow-2xl" data-testid="video-panel">
          <div className="flex items-center justify-between px-4 py-2 text-xs text-white/70">
            <span>Live-Beratung</span>
            <button onClick={() => setInCall(null)} className="underline">Schließen</button>
          </div>
          <VideoCall tokenUrl={`/api/room/${slug}/video-token?meetingId=${inCall}`} onLeave={() => setInCall(null)} compact />
        </div>
      )}

      {meeting?.presenterActive && !follow && !declinedFollow && (
        <div className="fixed left-1/2 top-20 z-50 w-[min(92vw,34rem)] -translate-x-1/2 rounded-sm bg-white p-5 shadow-2xl ring-1 ring-black/5" data-testid="presenter-prompt">
          <p className="text-sm text-ink-800">Ihr Berater möchte Sie durch die Seite führen – folgen?</p>
          <p className="mt-1 text-xs text-ink-500">Die Seite scrollt dann zu dem Abschnitt, den Ihr Berater zeigt. Sie können jederzeit beenden.</p>
          <div className="mt-4 flex gap-2">
            <button data-testid="follow-presenter" onClick={() => setFollowServer(true)} className="rounded-sm bg-[var(--primary)] px-4 py-2 text-sm text-white">Folgen</button>
            <button onClick={() => setDeclinedFollow(true)} className="px-3 text-sm text-ink-500 underline">Nein, danke</button>
          </div>
        </div>
      )}

      {follow && meeting?.presenterActive && (
        <div className="fixed left-1/2 top-16 z-50 -translate-x-1/2 rounded-full bg-[var(--primary)] px-4 py-2 text-xs text-white shadow-lg" data-testid="following-indicator">
          Sie folgen der Führung Ihres Beraters ·{" "}
          <button data-testid="stop-follow" onClick={() => setFollowServer(false)} className="underline">Führung beenden</button>
        </div>
      )}
    </>
  );
}
