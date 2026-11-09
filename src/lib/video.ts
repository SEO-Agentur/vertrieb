import "server-only";
import { AccessToken } from "livekit-server-sdk";

/**
 * Videoberatung über LiveKit (WebRTC). Gewählt wegen Open-Source-Server (selbst hostbar in der EU → Datenschutz),
 * Bildschirmfreigabe, Wiederverbindung, Mobilunterstützung und fertiger React-Komponenten.
 * Ohne Zugangsdaten ist die Videofunktion als "nicht aktiviert" gekennzeichnet.
 */
export function videoStatus() {
  const url = process.env.LIVEKIT_URL;
  const enabled = Boolean(url && process.env.LIVEKIT_API_KEY && process.env.LIVEKIT_API_SECRET);
  return { enabled, provider: "LiveKit", url: url ?? null, reason: enabled ? undefined : "LIVEKIT_URL, LIVEKIT_API_KEY und LIVEKIT_API_SECRET sind nicht gesetzt." };
}

export async function createVideoToken(opts: { roomName: string; identity: string; name: string; isHost: boolean }) {
  const st = videoStatus();
  if (!st.enabled) throw new Error(st.reason);
  const at = new AccessToken(process.env.LIVEKIT_API_KEY, process.env.LIVEKIT_API_SECRET, { identity: opts.identity, name: opts.name, ttl: "2h" });
  at.addGrant({ room: opts.roomName, roomJoin: true, canPublish: true, canSubscribe: true, canPublishData: true, roomAdmin: opts.isHost });
  return { token: await at.toJwt(), url: st.url! };
}
