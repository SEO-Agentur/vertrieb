// Start-Katalog – vollständig im Adminbereich änderbar (nicht fest im Code verdrahtet).
export const CATEGORIES = [
  { key: "NEUKUNDEN", name: "Neukundengewinnung", questions: ["Wie entstehen neue Leads?", "Welche Kanäle funktionieren?", "Wie hoch ist die Leadqualität?", "Wie werden Leads priorisiert?"] },
  { key: "PROZESSE", name: "Vertriebsprozesse", questions: ["Wie werden Anfragen bearbeitet?", "Wie werden Angebote erstellt?", "Welche Schritte dauern besonders lange?", "Wo entstehen Medienbrüche?"] },
  { key: "BESTAND", name: "Bestandskunden", questions: ["Wie werden Kunden betreut?", "Wie werden Cross-Selling-Möglichkeiten erkannt?", "Wie werden inaktive Kunden reaktiviert?"] },
  { key: "DATEN", name: "Daten und Systeme", questions: ["Welche CRM-Systeme werden eingesetzt?", "Welche Daten stehen zur Verfügung?", "Welche Systeme sind miteinander verbunden?", "Wo fehlen Auswertungen?"] },
  { key: "AUTOMATISIERUNG", name: "Automatisierung", questions: ["Welche Tätigkeiten wiederholen sich?", "Welche Aufgaben könnten KI-Assistenten übernehmen?", "Wo sind menschliche Freigaben notwendig?"] },
  { key: "SICHTBARKEIT", name: "Digitale Sichtbarkeit", questions: ["Wie viele Anfragen entstehen über die Website?", "Wie sichtbar ist das Unternehmen in Suchmaschinen und KI-Suche?"] },
];

export const PROBLEMS: Record<string, { name: string; description: string }[]> = {
  NEUKUNDEN: [
    { name: "Zu wenige qualifizierte Leads", description: "Die Pipeline wird nicht ausreichend mit passenden Interessenten gefüllt." },
    { name: "Leads werden nicht priorisiert", description: "Alle Anfragen werden gleich behandelt; vielversprechende Chancen gehen unter." },
  ],
  PROZESSE: [
    { name: "Angebotserstellung dauert zu lange", description: "Kalkulation und Erstellung von Angeboten binden viel Zeit im Innen-/Außendienst." },
    { name: "Medienbrüche zwischen Systemen", description: "Daten werden zwischen E-Mail, Excel, ERP und CRM manuell übertragen." },
    { name: "Langsame Reaktion auf Anfragen", description: "Zwischen Anfrage und erster qualifizierter Antwort vergeht zu viel Zeit." },
  ],
  BESTAND: [
    { name: "Cross-Selling-Potenziale bleiben ungenutzt", description: "Kaufmuster werden nicht systematisch ausgewertet." },
    { name: "Inaktive Kunden werden spät erkannt", description: "Abwanderung wird erst bemerkt, wenn der Umsatz bereits weg ist." },
  ],
  DATEN: [
    { name: "Fehlende Vertriebsauswertungen", description: "Entscheidungen beruhen eher auf Bauchgefühl als auf Daten." },
    { name: "CRM wird unvollständig gepflegt", description: "Kundeninformationen sind lückenhaft oder veraltet." },
  ],
  AUTOMATISIERUNG: [
    { name: "Wiederkehrende manuelle Routinearbeiten", description: "Vertriebsmitarbeiter verbringen viel Zeit mit Dokumentation und Recherche." },
  ],
  SICHTBARKEIT: [
    { name: "Website erzeugt kaum Anfragen", description: "Die Website wird als Visitenkarte genutzt, nicht als Vertriebskanal." },
    { name: "Geringe Sichtbarkeit in Suche und KI-Assistenten", description: "Potenzielle Kunden finden das Unternehmen bei relevanten Suchanfragen nicht." },
  ],
};

export const SERVICES = [
  { name: "Potenzialanalyse-Workshop", description: "Gemeinsame Analyse der Vertriebsprozesse inkl. Ergebnisbericht", pricingModel: "FIXED", unitPrice: 4800, unit: "Pauschal" },
  { name: "Vertriebsoptimierung (Beratung)", description: "Prozessaufnahme, Soll-Konzept und Begleitung", pricingModel: "DAILY", unitPrice: 1400, unit: "Tag" },
  { name: "KI-Leadqualifizierung", description: "Automatische Bewertung und Priorisierung eingehender Leads", pricingModel: "FIXED", unitPrice: 18000, unit: "Pauschal" },
  { name: "KI-Vertriebsassistent", description: "Assistent für Recherche, Gesprächsvorbereitung und Dokumentation", pricingModel: "FIXED", unitPrice: 24000, unit: "Pauschal" },
  { name: "CRM-Automatisierung", description: "Automatisierte Datenpflege, Workflows und Erinnerungen", pricingModel: "DAILY", unitPrice: 1200, unit: "Tag" },
  { name: "Individuelle KI-Anwendung", description: "Maßgeschneiderte Anwendung nach Anforderung", pricingModel: "DAILY", unitPrice: 1300, unit: "Tag" },
  { name: "Angebotsautomatisierung", description: "Konfigurator und automatisierte Angebotserstellung", pricingModel: "FIXED", unitPrice: 22000, unit: "Pauschal" },
  { name: "Website-Entwicklung", description: "Conversion-orientierte B2B-Website", pricingModel: "FIXED", unitPrice: 15000, unit: "Pauschal" },
  { name: "Suchmaschinenoptimierung", description: "Laufende SEO-Betreuung", pricingModel: "MONTHLY", unitPrice: 1500, unit: "Monat", recurring: true },
  { name: "Technisches SEO", description: "Technisches Audit und Umsetzung", pricingModel: "FIXED", unitPrice: 4500, unit: "Pauschal" },
  { name: "Internationale SEO", description: "Mehrsprachige Sichtbarkeit in Zielmärkten", pricingModel: "MONTHLY", unitPrice: 2200, unit: "Monat", recurring: true },
  { name: "KI-Sichtbarkeit (GEO)", description: "Optimierung für KI-Suchmaschinen und Assistenten", pricingModel: "MONTHLY", unitPrice: 1200, unit: "Monat", recurring: true },
  { name: "Conversion-Optimierung", description: "Analyse und Optimierung von Anfragewegen", pricingModel: "FIXED", unitPrice: 6000, unit: "Pauschal" },
  { name: "Business Intelligence", description: "Vertriebsdashboards und Kennzahlen", pricingModel: "FIXED", unitPrice: 14000, unit: "Pauschal" },
  { name: "Big-Data-Analysen", description: "Auswertung großer Transaktions- und Kundendaten", pricingModel: "DAILY", unitPrice: 1400, unit: "Tag" },
  { name: "Workflow-Automatisierung", description: "Automatisierung wiederkehrender Abläufe", pricingModel: "DAILY", unitPrice: 1200, unit: "Tag" },
  { name: "Datenintegration", description: "Anbindung von ERP, CRM und weiteren Systemen", pricingModel: "DAILY", unitPrice: 1300, unit: "Tag" },
  { name: "Prozessdigitalisierung", description: "Digitalisierung papier- oder Excel-basierter Prozesse", pricingModel: "DAILY", unitPrice: 1200, unit: "Tag" },
  { name: "Betrieb & Wartung KI-Anwendung", description: "Hosting, Monitoring, Modellkosten-Pauschale, Support", pricingModel: "MONTHLY", unitPrice: 690, unit: "Monat", recurring: true },
] as const;

export const SOLUTIONS: { name: string; description: string; benefits: string; problems: string[]; services: string[] }[] = [
  { name: "KI-gestützte Leadpriorisierung", description: "Eingehende und recherchierte Leads werden automatisch anhand definierter Kriterien bewertet.", benefits: "Vertrieb konzentriert sich auf die aussichtsreichsten Chancen.", problems: ["Leads werden nicht priorisiert", "Zu wenige qualifizierte Leads"], services: ["KI-Leadqualifizierung", "Betrieb & Wartung KI-Anwendung"] },
  { name: "Automatisierte Angebotserstellung", description: "Konfigurator mit Kalkulationslogik erzeugt Angebotsentwürfe in Minuten.", benefits: "Kürzere Angebotszeiten, weniger Fehler, mehr Zeit für Kunden.", problems: ["Angebotserstellung dauert zu lange", "Langsame Reaktion auf Anfragen"], services: ["Angebotsautomatisierung", "Datenintegration", "Betrieb & Wartung KI-Anwendung"] },
  { name: "KI-Vertriebsassistent", description: "Assistent für Recherche, Gesprächsvorbereitung, Zusammenfassungen und CRM-Pflege.", benefits: "Weniger Routinearbeit, vollständigere Kundendaten.", problems: ["Wiederkehrende manuelle Routinearbeiten", "CRM wird unvollständig gepflegt"], services: ["KI-Vertriebsassistent", "CRM-Automatisierung", "Betrieb & Wartung KI-Anwendung"] },
  { name: "Bestandskunden-Radar", description: "Analyse von Kaufmustern zur Erkennung von Cross-Selling-Chancen und Abwanderungssignalen.", benefits: "Mehr Umsatz mit bestehenden Kunden, frühere Reaktion auf Abwanderung.", problems: ["Cross-Selling-Potenziale bleiben ungenutzt", "Inaktive Kunden werden spät erkannt"], services: ["Big-Data-Analysen", "Business Intelligence"] },
  { name: "Vertriebs-Cockpit", description: "Zentrale Kennzahlen und Auswertungen aus CRM und ERP.", benefits: "Datenbasierte Vertriebssteuerung.", problems: ["Fehlende Vertriebsauswertungen", "Medienbrüche zwischen Systemen"], services: ["Business Intelligence", "Datenintegration"] },
  { name: "Digitale Leadgenerierung", description: "Website, SEO und KI-Sichtbarkeit als planbarer Anfragekanal.", benefits: "Mehr qualifizierte Anfragen über digitale Kanäle.", problems: ["Website erzeugt kaum Anfragen", "Geringe Sichtbarkeit in Suche und KI-Assistenten"], services: ["Technisches SEO", "Suchmaschinenoptimierung", "KI-Sichtbarkeit (GEO)", "Conversion-Optimierung"] },
  { name: "Prozessautomatisierung im Innendienst", description: "Automatisierung wiederkehrender Abläufe zwischen E-Mail, ERP und CRM.", benefits: "Schnellere Bearbeitung, weniger manuelle Übertragung.", problems: ["Medienbrüche zwischen Systemen", "Wiederkehrende manuelle Routinearbeiten"], services: ["Workflow-Automatisierung", "Prozessdigitalisierung", "Datenintegration"] },
];

export const OFFER_TEMPLATE = {
  name: "Standardangebot Vertriebsoptimierung",
  sections: {
    situation: "",
    problems: "",
    goals: "",
    solution: "",
    technical: "Umsetzung als modulare Anwendung mit Anbindung an Ihre bestehenden Systeme. Datenschutzkonformer Betrieb in der EU.",
    scope: "",
    phases: "1. Detailanalyse & Konzept\n2. Prototyp & Abstimmung\n3. Umsetzung & Integration\n4. Einführung & Schulung\n5. Betrieb & Weiterentwicklung",
    timeline: "",
    successCriteria: "",
    prerequisites: "Benennung einer verantwortlichen Ansprechperson, Zugang zu relevanten Systemen und Daten, Verfügbarkeit von Fachanwendern für Abstimmungen.",
    risks: "Datenqualität und Verfügbarkeit von Schnittstellen können Aufwand und Zeitplan beeinflussen. Wirtschaftliche Effekte sind Szenarien und nicht garantiert.",
    options: "",
  },
};
