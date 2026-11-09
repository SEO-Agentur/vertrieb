/**
 * Hintergrund-Worker: verarbeitet Jobs aus der Tabelle "Job" und führt periodische Aufgaben aus.
 * Start: npm run worker (als eigener Prozess / Container neben der Web-App).
 */
import { PrismaClient } from "@prisma/client";
import { runRetention } from "../src/lib/retention";

const db = new PrismaClient();
const DAY = 86400_000;

async function scheduleDaily() {
  const tenants = await db.tenant.findMany({ select: { id: true } });
  for (const t of tenants) {
    const last = await db.job.findFirst({ where: { tenantId: t.id, type: "RETENTION" }, orderBy: { createdAt: "desc" } });
    if (!last || last.createdAt.getTime() < Date.now() - DAY) await db.job.create({ data: { tenantId: t.id, type: "RETENTION", payload: {} } });
    // Fällige Follow-ups → Benachrichtigung (einmal pro Nachricht)
    const due = await db.outreachMessage.findMany({ where: { tenantId: t.id, status: "SENT", followUpAt: { lte: new Date() } }, include: { company: true } });
    for (const m of due) {
      const exists = await db.notification.findFirst({ where: { tenantId: t.id, type: "FOLLOW_UP", link: `/companies/${m.companyId}?tab=outreach`, createdAt: { gte: m.followUpAt ?? new Date(0) } } });
      if (!exists) await db.notification.create({ data: { tenantId: t.id, type: "FOLLOW_UP", title: `Follow-up fällig: ${m.company.name}`, link: `/companies/${m.companyId}?tab=outreach` } });
    }
  }
}

async function processJobs() {
  const jobs = await db.job.findMany({ where: { status: "PENDING", runAt: { lte: new Date() } }, take: 10, orderBy: { runAt: "asc" } });
  for (const job of jobs) {
    const claimed = await db.job.updateMany({ where: { id: job.id, status: "PENDING" }, data: { status: "RUNNING", startedAt: new Date(), attempts: { increment: 1 } } });
    if (!claimed.count) continue;
    try {
      if (job.type === "RETENTION") await runRetention(job.tenantId);
      else throw new Error(`Unbekannter Job-Typ ${job.type}`);
      await db.job.update({ where: { id: job.id }, data: { status: "DONE", finishedAt: new Date() } });
    } catch (e) {
      const retry = job.attempts + 1 < 3;
      await db.job.update({ where: { id: job.id }, data: { status: retry ? "PENDING" : "FAILED", error: e instanceof Error ? e.message : String(e), runAt: new Date(Date.now() + 60_000) } });
    }
  }
}

async function loop() {
  console.log("Worker gestartet.");
  let lastDaily = 0;
  for (;;) {
    try {
      if (Date.now() - lastDaily > 10 * 60_000) { await scheduleDaily(); lastDaily = Date.now(); }
      await processJobs();
    } catch (e) {
      console.error("Worker-Fehler", e);
    }
    if (process.argv.includes("--once")) break;
    await new Promise((r) => setTimeout(r, 15_000));
  }
  await db.$disconnect();
}

loop();
