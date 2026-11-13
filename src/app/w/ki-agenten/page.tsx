import type { Metadata } from "next";
import Link from "next/link";
import { Container, CtaBand, Faq, PageHero, Prose, Summary, Table } from "@/components/site/Blocks";
import { JsonLd } from "@/components/site/JsonLd";
import { SITE_URL } from "@/lib/site";

export const metadata: Metadata = {
  title: "KI-Agenten im Vertrieb: Was sie heute realistisch können",
  description: "Was ist ein KI-Agent im Vertrieb? Unterschiede zu Chatbot und Assistent, Agenten für Recherche, Leadqualifizierung, Follow-up und Angebote – mit Grenzen und menschlicher Freigabe.",
  alternates: { canonical: "/ki-agenten" },
};

const FAQ = [
  { q: "Was ist ein KI-Agent für den Vertrieb?", a: "Ein KI-Agent ist eine Software, die eine Vertriebsaufgabe in mehreren Schritten selbstständig bearbeitet – zum Beispiel ein Unternehmen recherchieren, die Informationen bewerten und einen Gesprächsvorschlag vorbereiten. Ein Mensch legt Ziel und Regeln fest und gibt Ergebnisse frei." },
  { q: "Ersetzen KI-Agenten Vertriebsmitarbeiter?", a: "Nein. Sie übernehmen wiederkehrende Vor- und Nacharbeit. Beziehung, Verhandlung und Entscheidung bleiben beim Menschen – und sollten es auch, besonders im B2B." },
  { q: "Dürfen KI-Agenten selbstständig Kunden anschreiben?", a: "Technisch möglich, aber im B2B selten sinnvoll und rechtlich heikel: Werbe-E-Mails brauchen in Deutschland grundsätzlich eine Einwilligung, LinkedIn verbietet Automatisierung. Wir setzen deshalb auf Vorbereitung durch den Agenten und Freigabe durch den Menschen." },
  { q: "Was braucht man, um einen KI-Agenten einzuführen?", a: "Eine klar umrissene Aufgabe, Zugriff auf die nötigen Daten (z. B. CRM), Regeln für Freigaben und eine Erfolgsgröße. Ob sich das lohnt, klärt eine Potenzialanalyse." },
];

export default function Page() {
  return (
    <>
      <PageHero eyebrow="Anwendungsfall" title="KI-Agenten im Vertrieb – Möglichkeiten und Grenzen" crumbs={[{ href: "/ki-agenten", label: "KI-Agenten im Vertrieb" }]}
        intro={<><strong className="text-white">Ein KI-Agent im Vertrieb ist eine Software, die eine Aufgabe in mehreren Schritten selbstständig bearbeitet</strong> – etwa recherchieren, bewerten und einen nächsten Schritt vorbereiten. Der Mensch setzt Ziel und Regeln und gibt das Ergebnis frei.</>} />
      <section className="py-16">
        <Container className="grid gap-12 lg:grid-cols-[2fr_1fr]">
          <Prose>
            <h2>Chatbot, Assistent oder Agent – was ist der Unterschied?</h2>
            <Table head={["", "Chatbot", "KI-Assistent", "KI-Agent"]} rows={[
              ["Arbeitsweise", "beantwortet Fragen", "unterstützt bei einer Aufgabe auf Zuruf", "bearbeitet eine Aufgabe in mehreren Schritten"],
              ["Initiative", "reagiert", "reagiert", "handelt innerhalb festgelegter Regeln"],
              ["Typisches Beispiel", "FAQ auf der Website", "Mail-Entwurf im CRM", "Lead recherchieren, bewerten, Wiedervorlage anlegen"],
              ["Menschliche Kontrolle", "gering nötig", "pro Ergebnis", "Freigabe an definierten Punkten"],
            ]} />
            <h2>KI-Agenten nach Vertriebsaufgabe</h2>
            <h3>Recherche-Agent</h3>
            <p>Sammelt öffentlich verfügbare Informationen zu einem Unternehmen, fasst sie zusammen und kennzeichnet, was belegt und was nur vermutet ist. Freigabe: Der Mensch prüft die Zusammenfassung, bevor sie verwendet wird.</p>
            <h3>Leadqualifizierungs-Agent</h3>
            <p>Bewertet neue Kontakte nach festen Kriterien (Branche, Größe, Bedarfssignale) und begründet die Bewertung. Freigabe: Die Priorisierung bleibt nachvollziehbar und änderbar.</p>
            <h3>Follow-up-Agent</h3>
            <p>Erkennt fällige Wiedervorlagen, schlägt Zeitpunkt und Formulierung vor und bereitet die Nachricht vor. Freigabe: Versendet wird erst nach Ihrem Klick.</p>
            <h3>Angebots-Agent</h3>
            <p>Erstellt aus Gesprächsnotizen und Leistungskatalog einen Angebotsentwurf mit Positionen. Freigabe: Preise und Inhalte prüft der Mensch.</p>
            <h3>CRM-Agent</h3>
            <p>Hält Kontakte, Notizen und Status aktuell und weist auf Lücken hin. Freigabe: Änderungen sind protokolliert und umkehrbar.</p>
            <h2>Was KI-Agenten heute nicht können</h2>
            <ul>
              <li>Vertrauen aufbauen und verhandeln – das bleibt Aufgabe Ihres Vertriebs.</li>
              <li>Fehlende oder falsche Daten ausgleichen: Ohne gepflegte Daten werden die Ergebnisse unzuverlässig.</li>
              <li>Fehlerfrei arbeiten: Agenten können Fakten falsch zusammenfassen. Deshalb gehören Freigaben an die kritischen Stellen.</li>
            </ul>
            <h2>Selbst bauen oder kaufen?</h2>
            <p>Für Standardaufgaben reichen oft vorhandene Werkzeuge – siehe <Link href="/ki-tools">KI-Tools im Vertrieb</Link>. Individuelle Agenten lohnen sich, wenn Ihre Abläufe, Daten oder Systeme (z. B. ERP) speziell sind. Welche Variante wirtschaftlich ist, rechnen wir in der <Link href="/potenzialanalyse">Potenzialanalyse</Link> mit Ihren Zahlen durch.</p>
            <h2>Häufige Fragen</h2>
            <Faq items={FAQ} />
          </Prose>
          <div className="space-y-6 lg:sticky lg:top-24 lg:self-start">
            <Summary points={["Agenten bearbeiten Aufgaben in mehreren Schritten", "Der Mensch setzt Regeln und gibt frei", "Größter Nutzen: Recherche, Qualifizierung, Follow-up, Angebote", "Ohne gute Daten keine guten Ergebnisse"]} />
            <div className="rounded-lg border border-site-line p-5 text-sm"><p className="font-bold text-site-navy">Weiterlesen</p><ul className="mt-2 space-y-1.5"><li><Link className="text-site-blue underline" href="/">KI im Vertrieb</Link></li><li><Link className="text-site-blue underline" href="/ki-tools">KI-Tools im Vertrieb</Link></li><li><Link className="text-site-blue underline" href="/werkzeuge/umsatzpotenzial-rechner">Umsatzpotenzial-Rechner</Link></li></ul></div>
          </div>
        </Container>
      </section>
      <CtaBand title="Welcher KI-Agent lohnt sich für Ihren Vertrieb?" />
      <JsonLd data={{ "@context": "https://schema.org", "@type": "Article", headline: "KI-Agenten im Vertrieb – Möglichkeiten und Grenzen", inLanguage: "de-DE", dateModified: "2026-11-13", author: { "@type": "Organization", name: "kivertrieb.net" }, mainEntityOfPage: `${SITE_URL}/ki-agenten` }} />
    </>
  );
}
