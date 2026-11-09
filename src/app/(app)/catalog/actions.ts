"use server";
import { revalidatePath } from "next/cache";
import type { PricingModel } from "@prisma/client";
import { db } from "@/lib/db";
import { requireEditor } from "@/lib/auth";
import { str, optStr, optNum, bool } from "@/lib/access";
import { OFFER_SECTIONS } from "@/lib/offers";
import { audit } from "@/lib/audit";

const PRICING: PricingModel[] = ["FIXED", "HOURLY", "DAILY", "MONTHLY", "YEARLY", "PER_UNIT"];
const done = () => revalidatePath("/catalog");
const lines = (v: string) => v.split(/\r?\n/).map((s) => s.trim()).filter(Boolean);

export async function saveCategory(form: FormData) {
  const user = await requireEditor();
  const id = optStr(form, "id");
  const name = str(form, "name");
  if (!name) throw new Error("Name fehlt");
  const data = { name, description: optStr(form, "description"), order: Math.round(optNum(form, "order") ?? 0), questions: lines(str(form, "questions")) };
  if (id) {
    await db.problemCategory.findFirstOrThrow({ where: { id, tenantId: user.tenantId } });
    await db.problemCategory.update({ where: { id }, data });
  } else {
    const key = (str(form, "key") || name).toUpperCase().replace(/Ä/g, "AE").replace(/Ö/g, "OE").replace(/Ü/g, "UE").replace(/ß/g, "SS").replace(/[^A-Z0-9]+/g, "_").replace(/^_|_$/g, "").slice(0, 40);
    await db.problemCategory.create({ data: { ...data, key, tenantId: user.tenantId } });
  }
  await audit({ tenantId: user.tenantId, actorType: "USER", actorId: user.id, action: "catalog.category.save", meta: { name } });
  done();
}

export async function deleteCategory(form: FormData) {
  const user = await requireEditor();
  await db.problemCategory.deleteMany({ where: { id: str(form, "id"), tenantId: user.tenantId } });
  done();
}

export async function saveProblem(form: FormData) {
  const user = await requireEditor();
  const id = optStr(form, "id");
  const categoryId = str(form, "categoryId");
  await db.problemCategory.findFirstOrThrow({ where: { id: categoryId, tenantId: user.tenantId } });
  const data = { categoryId, name: str(form, "name"), description: optStr(form, "description"), indicators: optStr(form, "indicators"), active: id ? bool(form, "active") : true };
  if (!data.name) throw new Error("Name fehlt");
  if (id) {
    await db.problem.findFirstOrThrow({ where: { id, category: { tenantId: user.tenantId } } });
    await db.problem.update({ where: { id }, data });
  } else await db.problem.create({ data });
  done();
}

export async function deleteProblem(form: FormData) {
  const user = await requireEditor();
  await db.problem.deleteMany({ where: { id: str(form, "id"), category: { tenantId: user.tenantId } } });
  done();
}

export async function saveSolution(form: FormData) {
  const user = await requireEditor();
  const id = optStr(form, "id");
  const name = str(form, "name");
  if (!name) throw new Error("Name fehlt");
  const problemIds = (await db.problem.findMany({ where: { id: { in: form.getAll("problemIds").map(String) }, category: { tenantId: user.tenantId } }, select: { id: true } })).map((p) => p.id);
  const serviceIds = (await db.service.findMany({ where: { id: { in: form.getAll("serviceIds").map(String) }, tenantId: user.tenantId }, select: { id: true } })).map((s) => s.id);
  const data = { name, description: optStr(form, "description"), benefits: optStr(form, "benefits"), active: id ? bool(form, "active") : true };
  await db.$transaction(async (tx) => {
    let solutionId = id;
    if (id) {
      await tx.solution.findFirstOrThrow({ where: { id, tenantId: user.tenantId } });
      await tx.solution.update({ where: { id }, data });
      await tx.problemSolution.deleteMany({ where: { solutionId: id } });
      await tx.solutionService.deleteMany({ where: { solutionId: id } });
    } else {
      solutionId = (await tx.solution.create({ data: { ...data, tenantId: user.tenantId } })).id;
    }
    await tx.problemSolution.createMany({ data: problemIds.map((problemId) => ({ problemId, solutionId: solutionId! })) });
    await tx.solutionService.createMany({ data: serviceIds.map((serviceId) => ({ serviceId, solutionId: solutionId! })) });
  });
  done();
}

export async function deleteSolution(form: FormData) {
  const user = await requireEditor();
  await db.solution.deleteMany({ where: { id: str(form, "id"), tenantId: user.tenantId } });
  done();
}

export async function saveService(form: FormData) {
  const user = await requireEditor();
  const id = optStr(form, "id");
  const pricingModel = PRICING.includes(str(form, "pricingModel") as PricingModel) ? (str(form, "pricingModel") as PricingModel) : "FIXED";
  const data = {
    name: str(form, "name"), description: optStr(form, "description"), pricingModel,
    unitPrice: Math.max(0, optNum(form, "unitPrice") ?? 0), unit: optStr(form, "unit"),
    recurring: bool(form, "recurring"), active: id ? bool(form, "active") : true,
  };
  if (!data.name) throw new Error("Name fehlt");
  const depIds = (await db.service.findMany({ where: { id: { in: form.getAll("dependsOn").map(String) }, tenantId: user.tenantId }, select: { id: true } })).map((s) => s.id);
  await db.$transaction(async (tx) => {
    let serviceId = id;
    if (id) {
      await tx.service.findFirstOrThrow({ where: { id, tenantId: user.tenantId } });
      await tx.service.update({ where: { id }, data });
      await tx.serviceDependency.deleteMany({ where: { serviceId: id } });
    } else serviceId = (await tx.service.create({ data: { ...data, tenantId: user.tenantId } })).id;
    await tx.serviceDependency.createMany({ data: depIds.filter((d) => d !== serviceId).map((dependsOnId) => ({ serviceId: serviceId!, dependsOnId })) });
  });
  done();
}

export async function deleteService(form: FormData) {
  const user = await requireEditor();
  await db.service.deleteMany({ where: { id: str(form, "id"), tenantId: user.tenantId } });
  done();
}

export async function savePackage(form: FormData) {
  const user = await requireEditor();
  const id = optStr(form, "id");
  const name = str(form, "name");
  if (!name) throw new Error("Name fehlt");
  const services = await db.service.findMany({ where: { tenantId: user.tenantId }, select: { id: true } });
  const items = services
    .map((s) => ({ serviceId: s.id, quantity: optNum(form, `qty_${s.id}`) ?? 0 }))
    .filter((i) => i.quantity > 0);
  await db.$transaction(async (tx) => {
    let packageId = id;
    if (id) {
      await tx.servicePackage.findFirstOrThrow({ where: { id, tenantId: user.tenantId } });
      await tx.servicePackage.update({ where: { id }, data: { name, description: optStr(form, "description") } });
      await tx.servicePackageItem.deleteMany({ where: { packageId: id } });
    } else packageId = (await tx.servicePackage.create({ data: { name, description: optStr(form, "description"), tenantId: user.tenantId } })).id;
    await tx.servicePackageItem.createMany({ data: items.map((i) => ({ ...i, packageId: packageId! })) });
  });
  done();
}

export async function deletePackage(form: FormData) {
  const user = await requireEditor();
  await db.servicePackage.deleteMany({ where: { id: str(form, "id"), tenantId: user.tenantId } });
  done();
}

export async function saveTemplate(form: FormData) {
  const user = await requireEditor();
  const id = optStr(form, "id");
  const name = str(form, "name") || "Angebotsvorlage";
  const sections = Object.fromEntries(OFFER_SECTIONS.map((s) => [s.key, str(form, `s_${s.key}`)]));
  if (id) {
    await db.offerTemplate.findFirstOrThrow({ where: { id, tenantId: user.tenantId } });
    await db.offerTemplate.update({ where: { id }, data: { name, sections } });
  } else await db.offerTemplate.create({ data: { tenantId: user.tenantId, name, sections } });
  done();
}

export async function deleteTemplate(form: FormData) {
  const user = await requireEditor();
  await db.offerTemplate.deleteMany({ where: { id: str(form, "id"), tenantId: user.tenantId } });
  done();
}
