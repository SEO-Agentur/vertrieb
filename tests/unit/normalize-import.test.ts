import { describe, it, expect } from "vitest";
import { normalizeCompanyName, parseRevenue, classifyRole, normalizeLinkedinUrl, extractDomain, slugify } from "@/lib/normalize";
import { parseCsv } from "@/lib/import";
import { offerTotals } from "@/lib/offers";

describe("Normalisierung", () => {
  it("entfernt Rechtsformen für die Dublettenprüfung", () => {
    expect(normalizeCompanyName("Müller Maschinenbau GmbH")).toBe(normalizeCompanyName("MÜLLER Maschinenbau GmbH & Co. KG"));
  });
  it("parst deutsche Umsatzangaben", () => {
    expect(parseRevenue("65 Mio")).toBe(65e6);
    expect(parseRevenue("65.000.000 €")).toBe(65e6);
    expect(parseRevenue("1,2 Mrd")).toBe(1.2e9);
    expect(parseRevenue("")).toBeNull();
  });
  it("ordnet Rollen zu", () => {
    expect(classifyRole("Geschäftsführer")).toBe("CEO");
    expect(classifyRole("Head of Sales DACH")).toBe("SALES_HEAD");
    expect(classifyRole("Inhaber")).toBe("OWNER");
  });
  it("akzeptiert nur LinkedIn-URLs", () => {
    expect(normalizeLinkedinUrl("linkedin.com/in/max-muster/")).toBe("https://www.linkedin.com/in/max-muster");
    expect(normalizeLinkedinUrl("https://evil.example/in/x")).toBeNull();
  });
  it("Domain und Slug", () => {
    expect(extractDomain("https://www.mueller-maschinenbau.de/kontakt")).toBe("mueller-maschinenbau.de");
    expect(slugify("Müller Maschinenbau GmbH")).toBe("mueller-maschinenbau");
  });
});

describe("CSV-Import", () => {
  it("erkennt deutsche Spalten mit Semikolon", () => {
    const csv = "Unternehmen;Branche;Umsatz;Vorname;Nachname;Position;LinkedIn\nMüller Maschinenbau GmbH;Maschinenbau;65 Mio;Thomas;Müller;Geschäftsführer;https://www.linkedin.com/in/thomas-mueller-fiktiv";
    const { rows, mapping } = parseCsv(csv);
    expect(mapping.company).toBe("Unternehmen");
    expect(rows[0].company.revenueEur).toBe(65e6);
    expect(rows[0].contact?.roleCategory).toBe("CEO");
    expect(rows[0].errors).toEqual([]);
  });
  it("meldet fehlenden Namen", () => {
    const { rows } = parseCsv("Unternehmen,Branche\n,Maschinenbau");
    expect(rows[0].errors[0]).toContain("fehlt");
  });
});

describe("Angebotssummen", () => {
  it("trennt einmalige, laufende und optionale Kosten", () => {
    const t = offerTotals([
      { quantity: 1, unitPrice: 20000, recurring: false, optional: false, pricingModel: "FIXED" },
      { quantity: 5, unitPrice: 1200, recurring: false, optional: false, pricingModel: "DAILY" },
      { quantity: 1, unitPrice: 690, recurring: true, optional: false, pricingModel: "MONTHLY" },
      { quantity: 1, unitPrice: 5000, recurring: false, optional: true, pricingModel: "FIXED" },
    ]);
    expect(t.oneTime).toBe(26000);
    expect(t.recurringPerYear).toBe(8280);
    expect(t.optionalOneTime).toBe(5000);
  });
});
