import "server-only";
import { db } from "./db";
import { sha256 } from "./crypto";

/** Exakter Wortlaut der Annahmeerklärung – wird so angezeigt und so gespeichert. */
export function acceptanceDeclaration(company: string, number: string, version: number) {
  return `Hiermit nehme ich das Angebot ${number} (Version ${version}) im Namen der ${company} verbindlich an. Ich bestätige, dass ich berechtigt bin, für ${company} verbindlich zu bestellen, und dass ich den Inhalt des Angebots einschließlich der Kosten und Voraussetzungen zur Kenntnis genommen habe.`;
}

/** Prüfsumme über den Angebotsinhalt – belegt, welcher Stand angenommen wurde. */
export async function offerContentHash(offerId: string) {
  const o = await db.offer.findUniqueOrThrow({ where: { id: offerId }, include: { items: { orderBy: { order: "asc" } } } });
  const items = o.items.map((i) => ({ name: i.name, description: i.description, pricingModel: i.pricingModel, quantity: i.quantity, unit: i.unit, unitPrice: i.unitPrice, recurring: i.recurring, optional: i.optional }));
  return sha256(JSON.stringify({ sections: o.sections, items, number: o.number, version: o.version }));
}
