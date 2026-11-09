import { readFile } from "node:fs/promises";
import { db } from "@/lib/db";
import { visitorForSlug, visitorRateLimit } from "@/lib/room-visitor";
import { recordRoomEvent } from "@/lib/rooms";
import { storagePath } from "@/lib/storage";

export async function GET(_req: Request, { params }: { params: Promise<{ slug: string; docId: string }> }) {
  const limited = await visitorRateLimit("docs", 30);
  if (limited) return limited;
  const { slug, docId } = await params;
  const v = await visitorForSlug(slug);
  if (!v) return new Response("Kein Zugang", { status: 401 });
  const doc = await db.document.findFirst({ where: { id: docId, roomId: v.room.id, visibility: "ROOM" } });
  const file = doc ? storagePath(doc.storageKey) : null;
  if (!doc || !file) return new Response("Nicht gefunden", { status: 404 });
  const data = await readFile(file).catch(() => null);
  if (!data) return new Response("Nicht gefunden", { status: 404 });
  if (v.session.analyticsConsent) await recordRoomEvent(v.room.id, v.session.id, "DOCUMENT_DOWNLOADED", { documentId: doc.id });
  return new Response(new Uint8Array(data), {
    headers: {
      "content-type": doc.mimeType,
      "content-disposition": `attachment; filename*=UTF-8''${encodeURIComponent(doc.name)}`,
      "cache-control": "private, no-store",
      "x-content-type-options": "nosniff",
    },
  });
}
