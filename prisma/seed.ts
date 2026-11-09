import { PrismaClient, type PricingModel } from "@prisma/client";
import bcrypt from "bcryptjs";
import { CATEGORIES, PROBLEMS, SERVICES, SOLUTIONS, OFFER_TEMPLATE } from "./catalog-data";
import { DEFAULT_STAGES } from "../src/lib/pipeline";

const db = new PrismaClient();

async function main() {
  const email = (process.env.SEED_ADMIN_EMAIL || "berater@example.com").toLowerCase();
  const password = process.env.SEED_ADMIN_PASSWORD || "Vertrieb2026!";
  let tenant = await db.tenant.findFirst({ where: { slug: "default" } });
  if (!tenant) tenant = await db.tenant.create({ data: { name: "Vertriebspotenzial-Beratung", slug: "default" } });
  const tenantId = tenant.id;

  await db.user.upsert({
    where: { email },
    update: {},
    create: {
      tenantId, email, name: process.env.SEED_ADMIN_NAME ?? "Alex Berater", role: "ADMIN",
      passwordHash: await bcrypt.hash(password, 12), title: "Berater für KI im Vertrieb",
      bio: "Ich unterstütze mittelständische B2B-Unternehmen dabei, Potenziale im Vertrieb zu finden und passende KI- und Softwarelösungen umzusetzen.",
    },
  });

  if (!(await db.pipelineStage.count({ where: { tenantId } }))) {
    await db.pipelineStage.createMany({ data: DEFAULT_STAGES.map((s, i) => ({ tenantId, key: s.key, name: s.name, color: s.color, order: i, probability: s.probability, isWon: !!s.isWon, isLost: !!s.isLost })) });
  }

  if (!(await db.problemCategory.count({ where: { tenantId } }))) {
    const problemIds: Record<string, string> = {};
    for (const [i, c] of CATEGORIES.entries()) {
      const cat = await db.problemCategory.create({ data: { tenantId, key: c.key, name: c.name, order: i, questions: c.questions } });
      for (const p of PROBLEMS[c.key] ?? []) {
        const prob = await db.problem.create({ data: { categoryId: cat.id, name: p.name, description: p.description } });
        problemIds[p.name] = prob.id;
      }
    }
    const serviceIds: Record<string, string> = {};
    for (const s of SERVICES) {
      const svc = await db.service.create({ data: { tenantId, name: s.name, description: s.description, pricingModel: s.pricingModel as PricingModel, unitPrice: s.unitPrice, unit: s.unit, recurring: "recurring" in s ? s.recurring : false } });
      serviceIds[s.name] = svc.id;
    }
    // Abhängigkeit: Betrieb setzt eine KI-Anwendung voraus
    await db.serviceDependency.create({ data: { serviceId: serviceIds["Betrieb & Wartung KI-Anwendung"], dependsOnId: serviceIds["KI-Vertriebsassistent"] } });
    for (const sol of SOLUTIONS) {
      await db.solution.create({
        data: {
          tenantId, name: sol.name, description: sol.description, benefits: sol.benefits,
          problems: { create: sol.problems.filter((p) => problemIds[p]).map((p) => ({ problemId: problemIds[p] })) },
          services: { create: sol.services.filter((s) => serviceIds[s]).map((s) => ({ serviceId: serviceIds[s] })) },
        },
      });
    }
    await db.servicePackage.create({
      data: { tenantId, name: "Einstiegspaket Potenzialanalyse", description: "Workshop + 2 Beratungstage", items: { create: [{ serviceId: serviceIds["Potenzialanalyse-Workshop"], quantity: 1 }, { serviceId: serviceIds["Vertriebsoptimierung (Beratung)"], quantity: 2 }] } },
    });
    await db.offerTemplate.create({ data: { tenantId, name: OFFER_TEMPLATE.name, sections: OFFER_TEMPLATE.sections } });
  }

  if (process.env.SEED_DEMO === "1" && !(await db.company.count({ where: { tenantId } }))) {
    const found = await db.pipelineStage.findFirstOrThrow({ where: { tenantId, key: "FOUND" } });
    // Ausdrücklich fiktive Demo-Unternehmen
    await db.company.createMany({
      data: [
        { tenantId, name: "Beispiel Verpackungstechnik GmbH (fiktiv)", normalizedName: "beispiel verpackungstechnik fiktiv", industry: "Verpackungsindustrie", location: "Bielefeld", revenueEur: 48_000_000, revenueStatus: "ESTIMATED", revenueSource: "Fiktive Demo-Daten", stageId: found.id, source: "MANUAL" },
        { tenantId, name: "Muster Industriebedarf KG (fiktiv)", normalizedName: "muster industriebedarf fiktiv", industry: "Industriebedarf", location: "Ulm", stageId: found.id, source: "MANUAL", qualificationStatus: "REVENUE_REVIEW" },
      ],
    });
  }
  console.log(`Seed abgeschlossen. Anmeldung: ${email} / ${process.env.SEED_ADMIN_PASSWORD ? "(aus SEED_ADMIN_PASSWORD)" : password}`);
}

main().finally(() => db.$disconnect());
