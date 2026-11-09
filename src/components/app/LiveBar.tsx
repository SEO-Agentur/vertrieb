"use client";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

type Snapshot = {
  visitors: { sessionId: string; roomId: string; slug: string; company: string; companyId: string; visitorLabel: string; verified: boolean; section: string | null; lastSeenAt: string }[];
  notifications: { id: string; type: string; title: string; body: string | null; link: string | null; createdAt: string }[];
  meetings: { id: string; status: string; kind: string; company: string; companyId: string }[];
  offeredRoomIds: string[];
};

const SECTION_LABEL: Record<string, string> = { greeting: "Begrüßung", calculator: "Umsatzrechner", areas: "Verbesserungsbereiche", approach: "Beratungsansatz", video: "Live-Beratung", solutions: "Lösungen", offer: "Angebot", next: "Nächste Schritte" };

export function LiveBar() {
  const [snap, setSnap] = useState<Snapshot | null>(null);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const seen = useRef(new Set<string>());
  const router = useRouter();

  useEffect(() => {
    const es = new EventSource("/api/live/stream");
    es.onmessage = (e) => {
      const data = JSON.parse(e.data) as Snapshot;
      setSnap(data);
      // Browser-Benachrichtigung nur, wenn der Berater sie erlaubt hat
      for (const n of data.notifications) {
        if (seen.current.has(n.id)) continue;
        seen.current.add(n.id);
        if (typeof Notification !== "undefined" && Notification.permission === "granted" && document.hidden) new Notification(n.title, { body: n.body ?? undefined });
      }
    };
    return () => es.close();
  }, []);

  async function offer(roomId: string, sessionId: string) {
    setBusy(roomId);
    const res = await fetch("/api/live/offer", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ roomId, sessionId }) });
    setBusy(null);
    if (res.ok) {
      const { meetingId } = await res.json();
      router.push(`/meetings/${meetingId}`);
    }
  }

  async function markRead(id?: string) {
    await fetch("/api/notifications/read", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ id }) });
  }

  const unread = snap?.notifications.length ?? 0;
  return (
    <div className="sticky top-0 z-20 border-b border-ink-200 bg-white/90 backdrop-blur">
      {snap?.visitors.map((v) => (
        <div key={v.sessionId} data-testid="live-visitor" className="flex flex-wrap items-center gap-3 border-b border-emerald-200 bg-emerald-50 px-6 py-2 text-sm text-emerald-900">
          <span className="relative flex h-2.5 w-2.5"><span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" /><span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500" /></span>
          <span>
            <strong>{v.visitorLabel}</strong> betrachtet gerade die Kundenwelt von <strong>{v.company}</strong>
            {v.section && <> · Abschnitt: {SECTION_LABEL[v.section] ?? v.section}</>}
          </span>
          <span className="ml-auto flex gap-2">
            <Link className="btn-secondary btn-sm" href={`/companies/${v.companyId}`}>Kundenakte</Link>
            <Link className="btn-secondary btn-sm" href={`/companies/${v.companyId}?tab=meetings`}>Termin vorschlagen</Link>
            {snap.offeredRoomIds.includes(v.roomId) ? (
              <span className="btn-sm rounded bg-emerald-100 px-2 py-1 text-xs">Angebot gesendet – wartet auf Antwort</span>
            ) : (
              <button className="btn-primary btn-sm" disabled={busy === v.roomId} onClick={() => offer(v.roomId, v.sessionId)}>Live-Gespräch anbieten</button>
            )}
          </span>
        </div>
      ))}
      {snap?.meetings.filter((m) => m.status === "REQUESTED" || m.status === "ACCEPTED").map((m) => (
        <div key={m.id} data-testid="meeting-alert" className="flex items-center gap-3 border-b border-violet-200 bg-violet-50 px-6 py-2 text-sm text-violet-900">
          <span>
            {m.status === "ACCEPTED" ? <><strong>{m.company}</strong> hat das Live-Gespräch angenommen.</> : <><strong>{m.company}</strong> fragt ein {m.kind === "LIVE" ? "Live-Gespräch" : "Gespräch/Termin"} an.</>}
          </span>
          <Link className="btn-primary btn-sm ml-auto" href={`/meetings/${m.id}`}>{m.status === "ACCEPTED" ? "Gespräch beitreten" : "Öffnen"}</Link>
        </div>
      ))}
      <div className="flex items-center justify-end gap-3 px-6 py-2">
        <span className="text-xs text-ink-400">{snap ? `${snap.visitors.length} aktive Besucher` : "verbinde …"}</span>
        <div className="relative">
          <button className="btn-ghost btn-sm" onClick={() => setOpen((o) => !o)} aria-label="Benachrichtigungen">
            Benachrichtigungen {unread > 0 && <span className="rounded-full bg-red-600 px-1.5 text-[10px] text-white">{unread}</span>}
          </button>
          {open && (
            <div className="absolute right-0 mt-2 w-96 rounded-lg border border-ink-200 bg-white p-2 shadow-xl">
              <div className="flex items-center justify-between px-2 py-1">
                <span className="text-xs font-semibold text-ink-500">Ungelesen</span>
                <span className="flex gap-2">
                  {typeof Notification !== "undefined" && Notification.permission === "default" && (
                    <button className="text-xs underline" onClick={() => Notification.requestPermission()}>Browser-Hinweise erlauben</button>
                  )}
                  <button className="text-xs underline" onClick={() => markRead()}>Alle gelesen</button>
                </span>
              </div>
              {unread === 0 && <div className="px-2 py-4 text-center text-sm text-ink-400">Keine neuen Benachrichtigungen</div>}
              {snap?.notifications.map((n) => (
                <Link key={n.id} href={n.link ?? "#"} onClick={() => markRead(n.id)} className="block rounded px-2 py-2 hover:bg-ink-50">
                  <div className="text-sm font-medium">{n.title}</div>
                  {n.body && <div className="text-xs text-ink-500">{n.body}</div>}
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
