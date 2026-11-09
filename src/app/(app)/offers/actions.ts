"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { PricingModel, Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { requireEditor } from "@/lib/auth";
import { companyForUser, offerForUser, str, optStr, optNum, bool } from "@/lib/access";
import { logActivity, audit } from "@/lib/audit";
import { advanceStage } from "@/lib/pipeline";
import { OFFER_SECTIONS, type OfferSections } from "@/lib/offers";
import { computeAll, sanitizeInputs, type CalculatorInputs } from "@/lib/calculator";
import { eur } from "@/lib/format";

const PRICING: PricingModel[] = ["FIXED", "HOURLY", "DAILY", "MONTHLY", "YEARLY", "PER_UNIT"];

function refresh(offerId: string, companyId: string) {
  revalidatePath(`/offers/${offerId}`);
  revalidatePath("/offers");
  revalidatePath(`/companies/${companyId}`);
}

async function nextOfferNumber(tenantId: string) {
  const year = new Date().getFullYear();
  const prefix = `A-${year}-`;
  const last = await db.offer.findFirst({ where: { tenantId, number: { startsWith: prefix } }, orderBy: { number: "desc" }, select: { number: true } });
  const seq = last ? parseInt(last.number.slice(prefix.length), 10) + 1 : 1;
  return `${prefix}${String(seq).padStart(4, "0")}`;
}

async function assertDraft(offerId: string, tenantId: string) {
  const o = await db.offer.findFirstOrThrow({ where: { id: offerId, tenantId } });
  if (o.status !== "DRAFT") throw new Error("Nur Entwürfe können bearbeitet werden. Bitte eine neue Version erstellen.");
  return o;
}

/** Erstellt einen Angebotsentwurf, vorbefüllt aus Vorlage, Erkenntnissen, ausgewählten Lösungen und Wirtschaftlichkeitsanalyse. */
export async function createOffer(form: FormData) {
  const user = await requireEditor();
  const company = await companyForUser(str(form, "companyId"), user);
  const templateId = optStr(form, "templateId");
  const [template, findings, solutions, analysis, room] = await Promise.all([
    templateId ? db.offerTemplate.findFirst({ where: { id: templateId, tenantId: user.tenantId } }) : db.offerTemplate.findFirst({ where: { tenantId: user.tenantId }, orderBy: { name: "asc" } }),
    db.finding.findMany({ where: { companyId: company.id, status: { not: "REJECTED" } }, orderBy: { createdAt: "asc" } }),
    db.companySolution.findMany({ where: { companyId: company.id, status: "SELECTED" }, include: { solution: { include: { services: { include: { service: true } } } } } }),
    db.economicAnalysis.findFirst({ where: { companyId: company.id }, orderBy: { updatedAt: "desc" } }),
    db.room.findUnique({ where: { companyId: company.id } }),
  ]);
  const base = (template?.sections ?? {}) as OfferSections;
  const sections: OfferSections = { ...base };
  const join = (a?: string, b?: string) => [a, b].filter((x) => x && x.trim()).join("\n\n");

  sections.situation = join(
    `${company.name}${company.industry ? ` ist im Bereich ${company.industry} tätig` : ""}${company.location ? ` mit Sitz in ${company.location}` : ""}. In einer gemeinsamen Potenzialanalyse haben wir die Vertriebsprozesse betrachtet und Verbesserungsmöglichkeiten identifiziert.`,
    base.situation,
  );
  if (findings.length) {
    sections.problems = join(findings.map((f) => `• ${f.title}${f.status === "HYPOTHESIS" ? " (noch zu bestätigen)" : ""}${f.description ? ` – ${f.description}` : ""}`).join("\n"), base.problems);
    sections.successCriteria = join(`Messbare Verbesserungen in den gemeinsam identifizierten Bereichen, insbesondere:\n${findings.filter((f) => f.status === "CONFIRMED").map((f) => `• ${f.title}`).join("\n") || "• (gemeinsam festzulegen)"}\nDie konkreten Kennzahlen und Ausgangswerte werden in Phase 1 gemeinsam festgelegt.`, base.successCriteria);
  }
  if (solutions.length) {
    sections.solution = join(solutions.map((s) => `${s.solution.name}: ${s.solution.description ?? ""}${s.note ? `\nAnpassung: ${s.note}` : ""}`).join("\n\n"), base.solution);
    sections.scope = join(`Leistungen:\n${[...new Set(solutions.flatMap((s) => s.solution.services.map((x) => x.service.name)))].map((n) => `• ${n}`).join("\n")}`, base.scope);
  }
  if (analysis) {
    const inp = sanitizeInputs(analysis.inputs as Partial<CalculatorInputs>);
    const r = computeAll(inp);
    sections.goals = join(
      `Ziel ist eine wirtschaftlich sinnvolle Verbesserung der Vertriebsprozesse. In der gemeinsamen Wirtschaftlichkeitsbetrachtung („${analysis.name}“) ergeben sich rechnerisch folgende Szenarien:\n${r.map((x) => `• +${x.upliftPct.toLocaleString("de-DE")} % Umsatz: zusätzlicher Deckungsbeitrag ${eur(x.additionalContribution)}, Einsparungen ${eur(x.savings)} pro Jahr${x.paybackMonths != null ? `, Amortisation ca. ${x.paybackMonths.toLocaleString("de-DE")} Monate` : ""}`).join("\n")}\nAnnahmen: ${analysis.assumptions ?? "–"}\nDiese Werte sind Szenarien auf Basis der genannten Annahmen und keine Zusage eines Ergebnisses.`,
      base.goals,
    );
  }
  const seen = new Set<string>();
  const items: Prisma.OfferItemCreateWithoutOfferInput[] = [];
  for (const s of solutions) for (const x of s.solution.services) {
    if (seen.has(x.serviceId) || !x.service.active) continue;
    seen.add(x.serviceId);
    items.push({
      service: { connect: { id: x.serviceId } }, name: x.service.name, description: x.service.description, pricingModel: x.service.pricingModel,
      quantity: x.service.pricingModel === "DAILY" ? 5 : 1, unit: x.service.unit, unitPrice: x.service.unitPrice, recurring: x.service.recurring, order: items.length,
    });
  }
  const offer = await db.offer.create({
    data: {
      tenantId: user.tenantId, companyId: company.id, roomId: room?.id ?? null, analysisId: analysis?.id ?? null,
      number: await nextOfferNumber(user.tenantId), title: str(form, "title") || `Angebot Vertriebsoptimierung für ${company.name}`,
      sections, validUntil: new Date(Date.now() + 30 * 86400_000), items: { create: items },
    },
  });
  await logActivity({ tenantId: user.tenantId, companyId: company.id, userId: user.id, type: "OFFER", title: `Angebotsentwurf ${offer.number} erstellt` });
  redirect(`/offers/${offer.id}`);
}

export async function updateOffer(form: FormData) {
  const user = await requireEditor();
  const o = await assertDraft(str(form, "offerId"), user.tenantId);
  const sections = Object.fromEntries(OFFER_SECTIONS.map((s) => [s.key, str(form, `s_${s.key}`).slice(0, 20000)]));
  const validUntil = optStr(form, "validUntil");
  await db.offer.update({ where: { id: o.id }, data: { title: str(form, "title") || o.title, sections, validUntil: validUntil ? new Date(validUntil) : null } });
  refresh(o.id, o.companyId);
}

function itemData(form: FormData) {
  const pricingModel = PRICING.includes(str(form, "pricingModel") as PricingModel) ? (str(form, "pricingModel") as PricingModel) : "FIXED";
  return {
    name: str(form, "name"), description: optStr(form, "description"), pricingModel,
    quantity: Math.max(0, optNum(form, "quantity") ?? 1), unit: optStr(form, "unit"), unitPrice: Math.max(0, optNum(form, "unitPrice") ?? 0),
    recurring: bool(form, "recurring") || pricingModel === "MONTHLY" || pricingModel === "YEARLY", optional: bool(form, "optional"), phase: optStr(form, "phase"),
  };
}

export async function addItem(form: FormData) {
  const user = await requireEditor();
  const o = await assertDraft(str(form, "offerId"), user.tenantId);
  const count = await db.offerItem.count({ where: { offerId: o.id } });
  const serviceId = optStr(form, "serviceId");
  if (serviceId) {
    const s = await db.service.findFirstOrThrow({ where: { id: serviceId, tenantId: user.tenantId } });
    await db.offerItem.create({ data: { offerId: o.id, serviceId: s.id, name: s.name, description: s.description, pricingModel: s.pricingModel, quantity: optNum(form, "quantity") ?? (s.pricingModel === "DAILY" ? 5 : 1), unit: s.unit, unitPrice: s.unitPrice, recurring: s.recurring, order: count } });
  } else {
    const d = itemData(form);
    if (!d.name) throw new Error("Bezeichnung fehlt");
    await db.offerItem.create({ data: { ...d, offerId: o.id, order: count } });
  }
  refresh(o.id, o.companyId);
}

export async function addPackage(form: FormData) {
  const user = await requireEditor();
  const o = await assertDraft(str(form, "offerId"), user.tenantId);
  const pkg = await db.servicePackage.findFirstOrThrow({ where: { id: str(form, "packageId"), tenantId: user.tenantId }, include: { items: { include: { service: true } } } });
  let order = await db.offerItem.count({ where: { offerId: o.id } });
  await db.offerItem.createMany({
    data: pkg.items.map((i) => ({ offerId: o.id, serviceId: i.serviceId, name: i.service.name, description: i.service.description, pricingModel: i.service.pricingModel, quantity: i.quantity, unit: i.service.unit, unitPrice: i.service.unitPrice, recurring: i.service.recurring, phase: pkg.name, order: order++ })),
  });
  refresh(o.id, o.companyId);
}

export async function updateItem(form: FormData) {
  const user = await requireEditor();
  const item = await db.offerItem.findFirstOrThrow({ where: { id: str(form, "itemId"), offer: { tenantId: user.tenantId } } });
  const o = await assertDraft(item.offerId, user.tenantId);
  if (str(form, "action") === "delete") await db.offerItem.delete({ where: { id: item.id } });
  else {
    const d = itemData(form);
    await db.offerItem.update({ where: { id: item.id }, data: { ...d, name: d.name || item.name } });
  }
  refresh(o.id, o.companyId);
}

export async function publishOffer(form: FormData) {
  const user = await requireEditor();
  const o = await assertDraft(str(form, "offerId"), user.tenantId);
  const room = o.roomId ? await db.room.findUnique({ where: { id: o.roomId } }) : await db.room.findUnique({ where: { companyId: o.companyId } });
  if (!room) redirect(`/offers/${o.id}?error=${encodeURIComponent("Für dieses Unternehmen existiert noch keine Kundenwelt. Bitte zuerst eine Kundenwelt erstellen.")}`);
  if (room.status !== "PUBLISHED") redirect(`/offers/${o.id}?error=${encodeURIComponent("Die Kundenwelt ist noch nicht veröffentlicht. Bitte zuerst die Kundenwelt veröffentlichen.")}`);
  const itemCount = await db.offerItem.count({ where: { offerId: o.id } });
  if (!itemCount) redirect(`/offers/${o.id}?error=${encodeURIComponent("Das Angebot enthält noch keine Positionen.")}`);
  await db.offer.update({ where: { id: o.id }, data: { status: "PUBLISHED", publishedAt: new Date(), roomId: room.id } });
  await logActivity({ tenantId: user.tenantId, companyId: o.companyId, userId: user.id, type: "OFFER", title: `Angebot ${o.number} v${o.version} in der Kundenwelt veröffentlicht` });
  await audit({ tenantId: user.tenantId, actorType: "USER", actorId: user.id, action: "offer.publish", entity: "Offer", entityId: o.id });
  await advanceStage(o.companyId, "OFFER_SENT", user.id);
  refresh(o.id, o.companyId);
}

export async function newVersion(form: FormData) {
  const user = await requireEditor();
  const o = await offerForUser(str(form, "offerId"), user);
  if (o.status === "ACCEPTED") throw new Error("Ein angenommenes Angebot kann nicht neu versioniert werden.");
  const items = await db.offerItem.findMany({ where: { offerId: o.id }, orderBy: { order: "asc" } });
  const maxV = await db.offer.aggregate({ where: { tenantId: user.tenantId, number: o.number }, _max: { version: true } });
  const copy = await db.offer.create({
    data: {
      tenantId: o.tenantId, companyId: o.companyId, roomId: o.roomId, analysisId: o.analysisId, number: o.number,
      version: (maxV._max.version ?? o.version) + 1, previousId: o.id, title: o.title, sections: o.sections as object, validUntil: o.validUntil,
      items: { create: items.map(({ id: _id, offerId: _o, ...rest }) => rest) },
    },
  });
  if (o.status === "PUBLISHED" || o.status === "DRAFT" || o.status === "DECLINED") await db.offer.update({ where: { id: o.id }, data: { status: "SUPERSEDED" } });
  await logActivity({ tenantId: user.tenantId, companyId: o.companyId, userId: user.id, type: "OFFER", title: `Neue Version ${copy.version} von Angebot ${o.number} erstellt` });
  redirect(`/offers/${copy.id}`);
}

export async function withdrawOffer(form: FormData) {
  const user = await requireEditor();
  const o = await offerForUser(str(form, "offerId"), user);
  if (o.status === "ACCEPTED") throw new Error("Angenommene Angebote können nicht zurückgezogen werden.");
  await db.offer.update({ where: { id: o.id }, data: { status: "WITHDRAWN" } });
  await logActivity({ tenantId: user.tenantId, companyId: o.companyId, userId: user.id, type: "OFFER", title: `Angebot ${o.number} v${o.version} zurückgezogen` });
  refresh(o.id, o.companyId);
}

export async function deleteOffer(form: FormData) {
  const user = await requireEditor();
  const o = await assertDraft(str(form, "offerId"), user.tenantId);
  await db.offer.delete({ where: { id: o.id } });
  revalidatePath(`/companies/${o.companyId}`);
  redirect(`/companies/${o.companyId}?tab=offers`);
}

export async function replyToQuestion(form: FormData) {
  const user = await requireEditor();
  const o = await offerForUser(str(form, "offerId"), user);
  const body = str(form, "body");
  if (!body || !o.roomId) return;
  await db.roomMessage.create({ data: { roomId: o.roomId, offerId: o.id, fromVisitor: false, authorName: user.name, body: body.slice(0, 5000) } });
  await db.roomMessage.updateMany({ where: { offerId: o.id, fromVisitor: true, readAt: null }, data: { readAt: new Date() } });
  await logActivity({ tenantId: user.tenantId, companyId: o.companyId, userId: user.id, type: "OFFER", title: `Rückfrage zu Angebot ${o.number} beantwortet` });
  refresh(o.id, o.companyId);
}
