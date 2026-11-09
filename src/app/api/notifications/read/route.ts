import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Nicht angemeldet" }, { status: 401 });
  const { id } = (await req.json().catch(() => ({}))) as { id?: string };
  await db.notification.updateMany({ where: { tenantId: user.tenantId, readAt: null, ...(id ? { id } : {}) }, data: { readAt: new Date() } });
  return NextResponse.json({ ok: true });
}
