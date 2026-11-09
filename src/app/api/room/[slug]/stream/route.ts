import { db } from "@/lib/db";
import { visitorForSlug } from "@/lib/room-visitor";

export const dynamic = "force-dynamic";

/** SSE für Besucher: Live-Gesprächsangebote, gemeinsame Navigation, neue Angebote/Nachrichten. */
export async function GET(req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const first = await visitorForSlug(slug);
  if (!first) return new Response("Unauthorized", { status: 401 });
  const roomId = first.room.id;
  const enc = new TextEncoder();
  let timer: ReturnType<typeof setInterval> | undefined;
  const stream = new ReadableStream({
    async start(controller) {
      let last = "";
      let closed = false;
      const close = () => {
        if (closed) return;
        closed = true;
        clearInterval(timer);
        try { controller.close(); } catch {}
      };
      const push = async () => {
        if (closed) return;
        try {
          // Sitzung bei jedem Tick neu prüfen (Widerruf/Ablauf beendet den Stream)
          const v = await visitorForSlug(slug);
          if (!v) {
            controller.enqueue(enc.encode(`event: ended\ndata: {}\n\n`));
            return close();
          }
          const [meeting, offers, lastMsg] = await Promise.all([
            db.meeting.findFirst({
              where: { roomId, status: { in: ["OFFERED", "ACCEPTED", "LIVE"] } },
              orderBy: { createdAt: "desc" },
              select: { id: true, status: true, presenterActive: true, presenterSection: true, initiatedBy: true },
            }),
            db.offer.count({ where: { roomId, status: { in: ["PUBLISHED", "ACCEPTED", "DECLINED"] } } }),
            db.roomMessage.findFirst({ where: { roomId, fromVisitor: false }, orderBy: { createdAt: "desc" }, select: { createdAt: true } }),
          ]);
          const json = JSON.stringify({ meeting, offers, lastConsultantMessageAt: lastMsg?.createdAt ?? null, followPresenter: v.session.followPresenter });
          if (json !== last) {
            controller.enqueue(enc.encode(`data: ${json}\n\n`));
            last = json;
          } else controller.enqueue(enc.encode(`: ping\n\n`));
        } catch {
          close();
        }
      };
      await push();
      timer = setInterval(push, 2000);
      req.signal.addEventListener("abort", close);
    },
    cancel() { clearInterval(timer); },
  });
  return new Response(stream, { headers: { "content-type": "text/event-stream", "cache-control": "no-cache, no-transform", connection: "keep-alive" } });
}
