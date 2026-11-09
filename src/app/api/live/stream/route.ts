import { getCurrentUser } from "@/lib/auth";
import { liveSnapshot } from "@/lib/live";

export const dynamic = "force-dynamic";

/** Server-Sent Events für das Command Center: Live-Besucher, Benachrichtigungen, Gesprächsanfragen. */
export async function GET(req: Request) {
  const user = await getCurrentUser();
  if (!user) return new Response("Unauthorized", { status: 401 });
  const enc = new TextEncoder();
  let timer: ReturnType<typeof setInterval> | undefined;
  const stream = new ReadableStream({
    async start(controller) {
      let last = "";
      const push = async () => {
        try {
          const snap = await liveSnapshot(user.tenantId, user.id);
          const json = JSON.stringify(snap);
          if (json !== last) {
            controller.enqueue(enc.encode(`data: ${json}\n\n`));
            last = json;
          } else controller.enqueue(enc.encode(`: ping\n\n`));
        } catch {
          /* Verbindung beendet */
        }
      };
      await push();
      timer = setInterval(push, 2500);
      req.signal.addEventListener("abort", () => {
        clearInterval(timer);
        try { controller.close(); } catch {}
      });
    },
    cancel() { clearInterval(timer); },
  });
  return new Response(stream, { headers: { "content-type": "text/event-stream", "cache-control": "no-cache, no-transform", connection: "keep-alive" } });
}
