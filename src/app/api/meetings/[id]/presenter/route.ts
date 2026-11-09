import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";

const SECTIONS = ["greeting", "calculator", "areas", "approach", "video", "solutions", "offer", "next"] as const;

/** Präsentationsmodus: Berater gibt den Abschnitt vor. Wirksam beim Besucher nur nach dessen Zustimmung. */
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user || user.role === "VIEWER") return NextResponse.json({ error: "Keine Berechtigung" }, { status: 403 });
  const { id } = await params;
  const body = z.object({ active: z.boolean(), section: z.enum(SECTIONS).optional() }).safeParse(await req.json().catch(() => null));
  if (!body.success) return NextResponse.json({ error: "Ungültige Eingabe" }, { status: 400 });
  const meeting = await db.meeting.findFirst({ where: { id, tenantId: user.tenantId } });
  if (!meeting) return NextResponse.json({ error: "Nicht gefunden" }, { status: 404 });
  const updated = await db.meeting.update({
    where: { id },
    data: {
      presenterActive: body.data.active,
      presenterSection: body.data.section ?? (body.data.active ? meeting.presenterSection : null),
      presenterUpdatedAt: new Date(),
    },
  });
  return NextResponse.json({ active: updated.presenterActive, section: updated.presenterSection });
}
