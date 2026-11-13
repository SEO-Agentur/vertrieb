import type { Metadata } from "next";
import Link from "next/link";
import { Container, CtaBand, Faq, PageHero, Prose, Summary, Table } from "@/components/site/Blocks";
import { JsonLd } from "@/components/site/JsonLd";
import { SITE_URL } from "@/lib/site";

export const metadata: Metadata = {
  title: "KI-Tools im Vertrieb: Überblick nach Einsatzbereich",
  description: "KI-Tools für den Vertrieb im Überblick: Recherche, CRM, Gesprächs-Assistenten, Angebotserstellung und digitale Kundenräume – mit Auswahlkriterien für Datenschutz, Integration und Kosten.",
  alternates: { canonical: "/ki-tools" },
};

export default function Page() {
  return (
    <>
      <PageHero eyebrow="Anwendungsfall" title="KI-Tools für den Vertrieb – was es gibt und wann sie sich lohnen" crumbs={[{ href: "/ki-tools", label: "KI-Tools im Vertrieb" }]}
        intro={<><strong className="text-white">KI-Tools im Vertrieb sind Programme, die einzelne Vertriebsaufgaben mit künstlicher Intelligenz unterstützen</strong> – von der Recherche über die Gesprächsvorbereitung bis zum Angebot. Entscheidend ist nicht das einzelne Tool, sondern ob es in Ihren Ablauf passt.</>} />
      <section className="py-16">
        <Container className="grid gap-12 lg:grid-cols-[2fr_1fr]">
          <Prose>
            <h2>KI-Tools nach Einsatzbereich</h2>
            <h3>Recherche & Leadgenerierung</h3>
            <p>Finden passende Unternehmen und Ansprechpartner, reichern Daten an und fassen öffentlich verfügbare Informationen zusammen. Worauf achten: Herkunft und Lizenz der Daten, DSGVO-Konformität, Abdeckung des deutschen Mittelstands.</p>
            <h3>CRM & Datenpflege</h3>
            <p>Erfassen Gesprächsnotizen, schlagen nächste Schritte vor und halten Daten aktuell. Worauf achten: Anbindung an Ihr bestehendes CRM oder ERP, nachvollziehbare Änderungen.</p>
            <h3>Gesprächs- und Meeting-Assistenten</h3>
            <p>Unterstützen bei Vorbereitung, Leitfaden und Zusammenfassung. Worauf achten: Aufzeichnung und Transkription sind nur mit Einwilligung aller Beteiligten zulässig; ein Leitfaden, der nur Ihre eigenen Eingaben verarbeitet, kommt ohne aus.</p>
            <h3>Angebotserstellung</h3>
            <p>Erzeugen Angebotsentwürfe aus Bausteinen, Kalkulationen und Gesprächsnotizen. Worauf achten: Preise und Leistungsumfang immer durch einen Menschen prüfen lassen.</p>
            <h3>Digitale Kundenräume (Sales Rooms)</h3>
            <p>Bündeln Informationen, Rechner, Videoberatung und Angebot auf einer persönlichen Seite pro Interessent. Worauf achten: Zugriffsschutz, Einwilligung zur Besuchererfassung, eigenes Corporate Design – so wie in unserer <Link href="/plattform">Plattform</Link>.</p>
            <h2>Auswahlkriterien im Überblick</h2>
            <Table head={["Kriterium", "Worauf es ankommt"]} rows={[
              ["Datenschutz", "Serverstandort, Auftragsverarbeitungsvertrag, Umgang mit Kundendaten und Gesprächsinhalten"],
              ["Integration", "Anbindung an CRM, ERP, Kalender und E-Mail – sonst entstehen neue Medienbrüche"],
              ["Aufwand", "Einrichtung, Schulung und laufende Pflege realistisch einplanen"],
              ["Kosten", "Lizenzen, nutzungsabhängige Kosten (z. B. Datenabrufe, KI-Nutzung) und interne Zeit"],
              ["Kontrolle", "Freigaben an kritischen Stellen, nachvollziehbare Ergebnisse, Abschaltbarkeit"],
            ]} />
            <h2>Tool oder individuelle Lösung?</h2>
            <p>Standard-Tools sind schnell eingeführt, passen aber nicht immer zu speziellen Abläufen, etwa variantenreichen Angeboten im Maschinenbau. Individuelle Lösungen lohnen sich, wenn der Nutzen groß und der Ablauf speziell ist. Wo die Grenze für Ihr Unternehmen liegt, klären wir in der <Link href="/potenzialanalyse">Potenzialanalyse</Link>. Mehr zu selbstständig arbeitender KI: <Link href="/ki-agenten">KI-Agenten im Vertrieb</Link>.</p>
            <h2>Häufige Fragen</h2>
            <Faq items={[
              { q: "Welches KI-Tool ist das beste für den Vertrieb?", a: "Das hängt von Ihrer Aufgabe, Ihren Daten und Systemen ab. Ein Tool, das nicht ins CRM passt oder nicht genutzt wird, bringt keinen Nutzen – deshalb zuerst den Engpass bestimmen, dann das Werkzeug wählen." },
              { q: "Sind KI-Tools DSGVO-konform?", a: "Nicht automatisch. Prüfen Sie Serverstandort, Auftragsverarbeitungsvertrag und welche Daten an die KI übermittelt werden." },
              { q: "Was kosten KI-Tools im Vertrieb?", a: "Neben Lizenzen fallen oft nutzungsabhängige Kosten an, etwa für Datenabrufe oder KI-Anfragen, sowie interne Zeit für Einführung und Pflege." },
            ]} />
          </Prose>
          <div className="space-y-6 lg:sticky lg:top-24 lg:self-start">
            <Summary points={["Fünf Einsatzbereiche: Recherche, CRM, Gespräch, Angebot, Kundenräume", "Integration entscheidet über den Nutzen", "Datenschutz und Freigaben vorab klären", "Erst den Engpass bestimmen, dann das Tool"]} />
            <div className="rounded-lg border border-site-line p-5 text-sm"><p className="font-bold text-site-navy">Weiterlesen</p><ul className="mt-2 space-y-1.5"><li><Link className="text-site-blue underline" href="/">KI im Vertrieb</Link></li><li><Link className="text-site-blue underline" href="/ki-agenten">KI-Agenten im Vertrieb</Link></li><li><Link className="text-site-blue underline" href="/werkzeuge/umsatzpotenzial-rechner">Umsatzpotenzial-Rechner</Link></li></ul></div>
          </div>
        </Container>
      </section>
      <CtaBand title="Welche KI-Tools passen zu Ihrem Vertrieb?" />
      <JsonLd data={{ "@context": "https://schema.org", "@type": "Article", headline: "KI-Tools für den Vertrieb – was es gibt und wann sie sich lohnen", inLanguage: "de-DE", dateModified: "2026-11-13", author: { "@type": "Organization", name: "kivertrieb.net" }, mainEntityOfPage: `${SITE_URL}/ki-tools` }} />
    </>
  );
}
