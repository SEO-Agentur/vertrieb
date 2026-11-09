"use client";
import { useState } from "react";
import { LiveKitRoom, VideoConference, RoomAudioRenderer, ConnectionStateToast } from "@livekit/components-react";
import "@livekit/components-styles";

type State =
  | { phase: "idle" }
  | { phase: "loading" }
  | { phase: "joined"; token: string; url: string }
  | { phase: "error"; message: string; notActivated?: boolean }
  | { phase: "left" };

/**
 * Eingebettete Videoberatung (LiveKit/WebRTC).
 * Kamera und Mikrofon sind beim Beitritt AUS – Teilnehmer aktivieren sie selbst über die Steuerleiste.
 */
export function VideoCall({ tokenUrl, onLeave, compact }: { tokenUrl: string; onLeave?: () => void; compact?: boolean }) {
  const [state, setState] = useState<State>({ phase: "idle" });

  async function join() {
    setState({ phase: "loading" });
    try {
      const res = await fetch(tokenUrl, { method: "POST" });
      const data = (await res.json().catch(() => ({}))) as { token?: string; url?: string; error?: string; notActivated?: boolean };
      if (!res.ok || !data.token || !data.url) {
        setState({ phase: "error", message: data.error ?? `Fehler ${res.status}`, notActivated: data.notActivated });
        return;
      }
      setState({ phase: "joined", token: data.token, url: data.url });
    } catch (e) {
      setState({ phase: "error", message: e instanceof Error ? e.message : "Verbindung fehlgeschlagen" });
    }
  }

  const height = compact ? "h-[360px]" : "h-[520px]";

  if (state.phase === "joined") {
    return (
      <div data-lk-theme="default" className={`${height} w-full overflow-hidden rounded-lg bg-black`} data-testid="video-joined">
        <LiveKitRoom
          serverUrl={state.url}
          token={state.token}
          connect
          audio={false}
          video={false}
          onDisconnected={() => {
            setState({ phase: "left" });
            onLeave?.();
          }}
          onError={(e) => setState({ phase: "error", message: e.message })}
          style={{ height: "100%" }}
        >
          <VideoConference />
          <RoomAudioRenderer />
          <ConnectionStateToast />
        </LiveKitRoom>
      </div>
    );
  }

  return (
    <div className={`flex ${height} w-full flex-col items-center justify-center gap-3 rounded-lg bg-ink-950 p-6 text-center text-white`}>
      {state.phase === "error" ? (
        state.notActivated ? (
          <>
            <div className="text-base font-semibold">Videointegration noch nicht aktiviert</div>
            <p className="max-w-md text-sm text-ink-300">Für Videogespräche müssen die LiveKit-Zugangsdaten konfiguriert werden. Alternativ kann ein Termin vereinbart oder telefonisch gesprochen werden.</p>
          </>
        ) : (
          <>
            <div className="text-base font-semibold">Verbindung nicht möglich</div>
            <p className="max-w-md text-sm text-ink-300">{state.message}</p>
            <button className="btn bg-white text-ink-900" onClick={join}>Erneut versuchen</button>
          </>
        )
      ) : (
        <>
          <div className="text-base font-semibold">{state.phase === "left" ? "Gespräch verlassen" : "Videogespräch"}</div>
          <p className="max-w-md text-sm text-ink-300">Kamera und Mikrofon bleiben aus, bis Sie sie selbst einschalten. Keine Installation erforderlich.</p>
          <button className="btn bg-white text-ink-900 hover:bg-ink-100" onClick={join} disabled={state.phase === "loading"} data-testid="join-video">
            {state.phase === "loading" ? "Verbinde …" : state.phase === "left" ? "Erneut beitreten" : "Beitreten"}
          </button>
        </>
      )}
    </div>
  );
}
