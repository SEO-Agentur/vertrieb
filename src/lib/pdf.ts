import "server-only";
import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage } from "pdf-lib";
import type { Offer, OfferItem, Company } from "@prisma/client";
import { OFFER_SECTIONS, PRICING_LABEL, itemTotal, offerTotals, VAT_RATE, type OfferSections } from "./offers";
import { eur, date } from "./format";

// WinAnsi-taugliche Zeichen sicherstellen (Standardfonts kennen z.B. keine typografischen Sonderzeichen außerhalb von CP1252)
function clean(s: string) {
  return s.replace(/[‐-―]/g, "-").replace(/[‘’]/g, "'").replace(/[“-„]/g, '"').replace(/…/g, "...").replace(/→/g, "->").replace(/[^\x09\x0A\x0D\x20-\x7E\xA0-\xFF€]/g, "");
}

function wrap(text: string, font: PDFFont, size: number, width: number): string[] {
  const lines: string[] = [];
  for (const para of clean(text).split(/\n/)) {
    let line = "";
    for (const word of para.split(/\s+/)) {
      const test = line ? `${line} ${word}` : word;
      if (font.widthOfTextAtSize(test, size) > width && line) {
        lines.push(line);
        line = word;
      } else line = test;
    }
    lines.push(line);
  }
  return lines;
}

export async function renderOfferPdf(offer: Offer & { items: OfferItem[]; company: Company }, consultant: { name: string; email: string; companyName: string }) {
  const doc = await PDFDocument.create();
  doc.setTitle(`${offer.title} (${offer.number}-v${offer.version})`);
  doc.setAuthor(consultant.companyName);
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);
  const margin = 56;
  const W = 595.28, H = 841.89;
  const maxW = W - margin * 2;
  let page: PDFPage = doc.addPage([W, H]);
  let y = H - margin;

  const ensure = (h: number) => {
    if (y - h < margin + 20) {
      page = doc.addPage([W, H]);
      y = H - margin;
    }
  };
  const text = (t: string, opts: { size?: number; f?: PDFFont; color?: [number, number, number]; gap?: number } = {}) => {
    const size = opts.size ?? 10;
    const f = opts.f ?? font;
    for (const line of wrap(t, f, size, maxW)) {
      ensure(size + 4);
      page.drawText(line, { x: margin, y: y - size, size, font: f, color: rgb(...(opts.color ?? [0.12, 0.13, 0.16])) });
      y -= size + 4;
    }
    y -= opts.gap ?? 4;
  };

  text(consultant.companyName, { size: 9, color: [0.4, 0.42, 0.48] });
  text(offer.title, { size: 20, f: bold, gap: 2 });
  text(`Angebot ${offer.number} · Version ${offer.version} · ${date(offer.publishedAt ?? offer.createdAt)}${offer.validUntil ? ` · gültig bis ${date(offer.validUntil)}` : ""}`, { size: 9, color: [0.4, 0.42, 0.48] });
  text(`für ${offer.company.name}`, { size: 11, f: bold, gap: 12 });

  const sections = offer.sections as OfferSections;
  for (const s of OFFER_SECTIONS) {
    const v = sections[s.key];
    if (!v?.trim()) continue;
    ensure(40);
    text(s.label, { size: 12, f: bold, gap: 2 });
    text(v, { size: 10, gap: 10 });
  }

  // Positionen
  ensure(60);
  text("Kosten", { size: 12, f: bold, gap: 4 });
  const cols = [margin, margin + 270, margin + 330, margin + 410];
  const header = ["Leistung", "Menge", "Einzelpreis", "Summe"];
  header.forEach((h, i) => page.drawText(h, { x: cols[i], y: y - 9, size: 9, font: bold }));
  y -= 16;
  for (const it of [...offer.items].sort((a, b) => a.order - b.order)) {
    const nameLines = wrap(`${it.name}${it.optional ? " (optional)" : ""}${it.recurring ? ` – laufend ${PRICING_LABEL[it.pricingModel]}` : ""}`, font, 9, 260);
    ensure(nameLines.length * 12 + 6);
    nameLines.forEach((l, i) => page.drawText(l, { x: cols[0], y: y - 9 - i * 12, size: 9, font }));
    page.drawText(clean(`${it.quantity} ${it.unit ?? ""}`), { x: cols[1], y: y - 9, size: 9, font });
    page.drawText(clean(eur(it.unitPrice, true)), { x: cols[2], y: y - 9, size: 9, font });
    page.drawText(clean(eur(itemTotal(it), true)), { x: cols[3], y: y - 9, size: 9, font });
    y -= nameLines.length * 12 + 6;
  }
  const t = offerTotals(offer.items);
  y -= 6;
  text(`Einmalige Kosten (netto): ${eur(t.oneTime, true)}  ·  zzgl. ${Math.round(VAT_RATE * 100)} % USt.: ${eur(t.oneTime * (1 + VAT_RATE), true)} brutto`, { size: 10, f: bold });
  if (t.recurringPerYear) text(`Laufende Kosten (netto): ${eur(t.monthly, true)} / Monat + ${eur(t.yearly, true)} / Jahr = ${eur(t.recurringPerYear, true)} / Jahr`, { size: 10, f: bold });
  if (t.optionalOneTime || t.optionalRecurringYearly) text(`Optionale Positionen: ${eur(t.optionalOneTime, true)} einmalig, ${eur(t.optionalRecurringYearly, true)} / Jahr (nicht in Summen enthalten)`, { size: 9 });

  y -= 10;
  if (offer.acceptedAt) {
    text("Annahme", { size: 12, f: bold, gap: 2 });
    text(`Angenommen am ${date(offer.acceptedAt)} durch ${offer.acceptedByName ?? ""} (${offer.acceptedByEmail ?? ""}${offer.acceptedRole ? `, ${offer.acceptedRole}` : ""}). Dokument-Prüfsumme: ${offer.acceptanceHash ?? ""}`, { size: 9 });
  }
  text("Alle Wirtschaftlichkeitsangaben sind Szenarien auf Basis offengelegter Annahmen und keine Ergebniszusagen.", { size: 8, color: [0.4, 0.42, 0.48] });
  text(`${consultant.name} · ${consultant.email}`, { size: 8, color: [0.4, 0.42, 0.48] });

  return Buffer.from(await doc.save());
}
