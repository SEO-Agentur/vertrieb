import "server-only";
import { z } from "zod";
import type { Company, Contact } from "@prisma/client";
import { db } from "./db";
import { generateStructured, aiStatus } from "./ai/provider";

/** Standard-Verbesserungsbereiche, die in jeder Kundenwelt als Hypothesen angeboten werden können. */
export const IMPROVEMENT_TOPICS = [
  "Neukundengewinnung",
  "Leadqualifizierung",
  "Angebotserstellung",
  "Vertriebsautomatisierung",
  "Bestandskundenmanagement",
  "Datenanalyse",
  "CRM-Prozesse",
  "Website und digitale Leadgenerierung",
] as const;

type Hyp = { topic: string; rationale: string };

/**
 * Regelbasierte Hypothesen (keine KI). Leitet aus Branche und Größe plausible Gesprächsthemen ab.
 * Diese Themen sind ausdrücklich keine festgestellten Schwächen.
 */
export function ruleBasedHypotheses(c: Pick<Company, "industry" | "revenueEur" | "salesTeamSize" | "businessModel" | "website">): Hyp[] {
  const ind = (c.industry ?? "").toLowerCase();
  const out: Hyp[] = [];
  const add = (topic: string, rationale: string) => out.push({ topic, rationale });
  if (/maschinenbau|fertigung|zuliefer|industrie/.test(ind)) {
    add("Angebotserstellung", "In variantenreichen Industriegeschäften ist die Angebotserstellung häufig aufwendig – zu prüfen, ob Kalkulation und Konfiguration Zeit kosten.");
    add("Bestandskundenmanagement", "Ersatzteil-, Service- und Wiederholgeschäft könnte systematischer erschlossen werden – zu prüfen, ob Cross-Selling-Signale genutzt werden.");
    add("Leadqualifizierung", "Bei langen Entscheidungszyklen kann eine bessere Priorisierung von Anfragen Ressourcen freisetzen – zu prüfen.");
  }
  if (/großhandel|grosshandel|handel|industriebedarf/.test(ind)) {
    add("Bestandskundenmanagement", "Im Großhandel entsteht viel Umsatz mit Bestandskunden – zu prüfen, ob inaktive Kunden und Sortimentslücken erkannt werden.");
    add("Vertriebsautomatisierung", "Hohe Anfragevolumen im Innendienst – zu prüfen, ob wiederkehrende Tätigkeiten automatisierbar sind.");
    add("Datenanalyse", "Transaktionsdaten könnten für Kaufmuster- und Preisanalysen genutzt werden – zu prüfen, welche Auswertungen fehlen.");
  }
  if (/logistik/.test(ind)) {
    add("Angebotserstellung", "Frachtanfragen erfordern oft schnelle Kalkulationen – zu prüfen, wie lange die Angebotserstellung dauert.");
    add("Neukundengewinnung", "Zu prüfen, wie neue Verlader gezielt identifiziert und angesprochen werden.");
  }
  if (/it-|system|managed|software/.test(ind)) {
    add("Leadqualifizierung", "Zu prüfen, wie Marketing-Leads priorisiert und an den Vertrieb übergeben werden.");
    add("Bestandskundenmanagement", "Wiederkehrende Verträge bieten Potenzial für Upselling und Churn-Prävention – zu prüfen.");
  }
  if (/personal/.test(ind)) {
    add("Neukundengewinnung", "Zu prüfen, wie Unternehmen mit akutem Personalbedarf frühzeitig erkannt werden.");
    add("CRM-Prozesse", "Zu prüfen, ob Kunden- und Kandidateninformationen durchgängig gepflegt werden.");
  }
  if (c.website) add("Website und digitale Leadgenerierung", "Zu prüfen, wie viele qualifizierte Anfragen über die Website entstehen und ob Sichtbarkeit (inkl. KI-Suche) ausbaufähig ist.");
  add("CRM-Prozesse", "Zu prüfen, welche Systeme im Vertrieb genutzt werden und wo Medienbrüche entstehen.");
  add("Neukundengewinnung", "Zu prüfen, über welche Kanäle neue Kunden heute gewonnen werden und welche skaliert werden könnten.");
  const seen = new Set<string>();
  return out.filter((h) => (seen.has(h.topic) ? false : (seen.add(h.topic), true))).slice(0, 6);
}

const AiResearchSchema = z.object({
  summary: z.string().describe("Kurze Zusammenfassung, was über das Unternehmen bekannt ist – nur auf Basis der Daten."),
  hypotheses: z
    .array(z.object({ topic: z.string(), rationale: z.string() }))
    .describe("3–6 mögliche Verbesserungsthemen im Vertrieb, als Hypothesen formuliert."),
  openQuestions: z.array(z.string()).describe("Offene Fragen, die im Gespräch geklärt werden sollten."),
  missingData: z.array(z.string()).describe("Wichtige Informationen, die fehlen oder unbekannt sind."),
});

export type ResearchResult = {
  mode: "AI" | "RULE";
  summary?: string;
  hypotheses: Hyp[];
  openQuestions: string[];
  missingData: string[];
  aiDisabledReason?: string;
};

function missingFields(c: Company): string[] {
  const m: string[] = [];
  if (c.revenueEur == null) m.push("Jahresumsatz");
  else if (c.revenueStatus !== "VERIFIED") m.push("Verifizierung des Jahresumsatzes (Quelle)");
  if (!c.employees) m.push("Mitarbeiterzahl");
  if (!c.products) m.push("Produkte und Dienstleistungen");
  if (!c.ownership) m.push("Eigentümerstruktur");
  if (!c.technologies) m.push("Eingesetzte Systeme (CRM/ERP)");
  if (!c.salesTeamSize) m.push("Größe des Vertriebsteams");
  return m;
}

/**
 * Führt eine Recherche durch: mit KI, falls konfiguriert, sonst regelbasiert.
 * Ergebnisse werden als UNGEPRÜFTE Hypothesen gespeichert und müssen vom Berater geprüft werden.
 */
export async function runResearch(company: Company & { contacts: Contact[] }, opts: { preferAi: boolean }): Promise<ResearchResult> {
  const facts = await db.companyFact.findMany({ where: { companyId: company.id, status: { in: ["VERIFIED", "ESTIMATED"] } } });
  const status = aiStatus();
  if (opts.preferAi && status.enabled) {
    const result = await generateStructured({
      task: "Analysiere das folgende Unternehmen für eine gemeinsame Vertriebs-Potenzialanalyse. Leite mögliche Verbesserungsthemen nur als Hypothesen ab. Erfinde keine Fakten.",
      untrustedData: {
        unternehmen: {
          name: company.name, branche: company.industry, standort: company.location, website: company.website,
          umsatzEur: company.revenueEur, umsatzStatus: company.revenueStatus, mitarbeiter: company.employees,
          produkte: company.products, maerkte: company.markets, geschaeftsmodell: company.businessModel,
          eigentuemer: company.ownership, technologien: company.technologies, beschreibung: company.description, notizen: company.notes,
        },
        gepruefteFakten: facts.map((f) => ({ kategorie: f.category, bezeichnung: f.label, wert: f.value, status: f.status, quelle: f.sourceName })),
        ansprechpartnerRollen: company.contacts.map((c) => c.title),
      },
      schema: AiResearchSchema,
      effort: "medium",
    });
    return { mode: "AI", ...result };
  }
  return {
    mode: "RULE",
    hypotheses: ruleBasedHypotheses(company),
    openQuestions: [
      "Wie entstehen heute neue Leads und welche Kanäle funktionieren am besten?",
      "Wie lange dauert die Erstellung eines typischen Angebots?",
      "Welches CRM-/ERP-System wird im Vertrieb eingesetzt?",
      "Wie werden Bestandskunden betreut und Cross-Selling-Chancen erkannt?",
    ],
    missingData: missingFields(company),
    aiDisabledReason: status.enabled ? undefined : status.reason,
  };
}
