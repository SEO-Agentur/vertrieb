import type { Metadata } from "next";
import Link from "next/link";
import { ArchLines, ButtonLink, Container, CtaBand, Faq, SectionTitle } from "@/components/site/Blocks";
import { ICONS, KundenweltMockup, LineIcon, SalesFlow } from "@/components/site/Visuals";
import { JsonLd } from "@/components/site/JsonLd";
import { SITE_URL } from "@/lib/site";

export const metadata: Metadata = {
  title: { absolute: "KI im Vertrieb für Kleinbetriebe und Mittelstand | kivertrieb.net" },
  description: "KI im Vertrieb: Wir finden gemeinsam heraus, wo Ihr Vertrieb Umsatz liegen lässt – mit Potenzialanalyse, persönlicher Kundenwelt und einer Vertriebsplattform, die Sie selbst nutzen können.",
  alternates: { canonical: "/" },
};

const LEAKS = [
  ["clock", "Langsame Lead-Bearbeitung", "Anfragen werden zu spät oder gar nicht systematisch nachverfolgt."],
  ["users", "Uneinheitliches Nachfassen", "Wertvolle Kontakte verlaufen im Sand, weil Wiedervorlagen fehlen."],
  ["db", "Unvollständige CRM-Daten", "Fehlende Informationen erschweren Priorisierung und Steuerung."],
  ["doc", "Offene Angebote ohne Nachverfolgung", "Angebote bleiben zu lange liegen, ohne systematische Rückfrage."],
  ["target", "Unklare Priorisierung", "Aufwand fließt nicht immer in die aussichtsreichsten Chancen."],
] as const;

const AREAS = [
  ["search", "Leadgenerierung", "Passende Unternehmen und Ansprechpartner systematisch finden."],
  ["layers", "Leadqualifizierung", "Anfragen nachvollziehbar bewerten und priorisieren."],
  ["chat", "Kundenkommunikation", "Persönlicher ansprechen – mit Kundenwelten statt Massenmails."],
  ["bolt", "Prozessautomatisierung", "Wiederkehrende Vertriebsaufgaben automatisieren."],
  ["db", "CRM & Datenintegration", "Daten aus CRM und ERP verbinden und pflegen."],
  ["chart", "Vertriebsanalysen", "Absagegründe, Abschlussquoten und Potenziale sichtbar machen."],
  ["cube", "KI-Agenten", "Spezialisierte Assistenten für Recherche, Follow-up und Angebote."],
  ["doc", "Angebotserstellung", "Angebote schneller, einheitlicher und fehlerärmer erstellen."],
  ["users", "Bestandskunden", "Cross-Selling-Chancen und Abwanderungssignale früher erkennen."],
  ["code", "Individuelle Software", "Lösungen, die sich nahtlos in Ihre Abläufe einfügen."],
] as const;

const STEPS = [
  ["01", "Verstehen", "Ihre Ziele, Herausforderungen und Vertriebsprozesse im Gespräch erfassen."],
  ["02", "Analysieren", "Potenziale, Daten und Abläufe gemeinsam strukturiert bewerten."],
  ["03", "Entwickeln", "Die passende Lösung konzipieren, wirtschaftlich bewerten und umsetzen."],
  ["04", "Optimieren", "Wirkung messen und den Nutzen gezielt weiterentwickeln."],
] as const;

const FAQ = [
  { q: "Was bringt KI im Vertrieb konkret?", a: "KI kann Recherche, Priorisierung, Nachfassen und Angebotserstellung beschleunigen und Muster in Ihren Vertriebsdaten sichtbar machen. Wie viel davon sich für Ihr Unternehmen lohnt, hängt von Ihren Prozessen und Daten ab – genau das klären wir in der Potenzialanalyse." },
  { q: "Ist das auch für kleine Betriebe sinnvoll?", a: "Ja. Kleinbetriebe nutzen die Plattform direkt: Kontakte, Telefonleitfaden, Wiedervorlagen, persönliche Kundenwelten und Angebote an einem Ort – ohne Beratungsprojekt. Für größere Unternehmen kommen Analyse, Einrichtung und individuelle Lösungen hinzu." },
  { q: "Was kostet eine Potenzialanalyse?", a: "Das Erstgespräch ist kostenlos. Die Potenzialanalyse selbst wird zum Festpreis angeboten, den Sie vorab kennen. Erst danach entscheiden Sie, ob und was umgesetzt wird." },
  { q: "Brauchen wir schon ein CRM?", a: "Nein. Die Plattform enthält ein eigenes CRM. Vorhandene Systeme wie HubSpot lassen sich anbinden oder per CSV-Import übernehmen." },
  { q: "Ist das DSGVO-konform?", a: "Die Plattform wird in der EU betrieben, Besucher von Kundenwelten entscheiden selbst über die Erfassung, Gespräche werden nicht aufgezeichnet und externe Nachrichten werden immer von einem Menschen freigegeben. Die rechtliche Bewertung Ihres konkreten Einsatzes ersetzt das nicht." },
  { q: "Garantieren Sie eine Umsatzsteigerung?", a: "Nein. Alle Berechnungen sind Szenarien auf Basis offengelegter Annahmen. Zusätzlicher Umsatz ist nicht gleich Gewinn – maßgeblich sind Deckungsbeitrag, Einsparungen und die Kosten der Lösung." },
];

export default function HomePage() {
  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-site-deep via-site-navy to-[#173A5E] text-white">
        <ArchLines />
        <Container className="relative grid items-center gap-12 py-16 md:py-24 lg:grid-cols-[1fr_1.05fr]">
          <div>
            <h1 className="text-4xl font-extrabold leading-[1.08] tracking-tight md:text-[3.2rem]"><span className="mb-4 block text-xs font-semibold uppercase tracking-[0.16em] text-sky-300">KI im Vertrieb · für Kleinbetriebe und Mittelstand</span>Ihr Vertrieb hat mehr Potenzial, als Sie nutzen.</h1>
            <span aria-hidden className="mt-6 block h-1 w-12 rounded bg-site-blue" />
            <p className="mt-6 max-w-xl text-[17px] leading-relaxed text-white/85">
              Wir finden gemeinsam heraus, wo Ihr Vertrieb Umsatz liegen lässt – und verbessern Ihre Prozesse mit KI, Automatisierung und intelligenten Datenlösungen. Ohne Versprechen, mit Ihren echten Zahlen.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <ButtonLink href="/potenzialanalyse#anfrage">Potenzialgespräch vereinbaren</ButtonLink>
              <ButtonLink href="/plattform" variant="outline">Plattform selbst nutzen</ButtonLink>
            </div>
          </div>
          <SalesFlow />
        </Container>
      </section>

      {/* Umsatzlecks */}
      <section className="py-16 md:py-20">
        <Container className="grid gap-10 md:grid-cols-[1fr_1.4fr] md:gap-16">
          <div className="md:border-r md:border-site-line md:pr-12">
            <SectionTitle title="Wie viel Umsatz bleibt in Ihrem Vertrieb liegen?">
              In vielen B2B-Unternehmen steckt erhebliches Potenzial – oft nicht in der Strategie, sondern in den Prozessen, den Daten und der konsequenten Umsetzung im Vertriebsalltag.
            </SectionTitle>
          </div>
          <ul className="divide-y divide-site-line">
            {LEAKS.map(([icon, title, text]) => (
              <li key={title} className="grid grid-cols-[auto_1fr] gap-4 py-3.5 sm:grid-cols-[auto_220px_1fr]">
                <LineIcon d={ICONS[icon]} />
                <span className="text-[15px] font-bold text-site-navy">{title}</span>
                <span className="col-span-2 text-sm text-site-text sm:col-span-1">{text}</span>
              </li>
            ))}
          </ul>
        </Container>
      </section>

      {/* 0,05 % */}
      <section className="bg-site-sky py-16 md:py-20">
        <Container className="grid items-center gap-10 md:grid-cols-2">
          <SectionTitle title="Kleine Verbesserungen können einen großen Unterschied machen.">
            Schon minimale Steigerungen wirken bei Ihrem Umsatzvolumen spürbar. Bei 100 Mio. € Jahresumsatz entsprechen 0,05 % rechnerisch 50.000 € – zusätzlicher Umsatz, wohlgemerkt, nicht Gewinn.
            <div className="mt-6"><ButtonLink href="/werkzeuge/umsatzpotenzial-rechner" variant="light">Mit eigenen Zahlen rechnen</ButtonLink></div>
          </SectionTitle>
          <div className="rounded-xl border border-site-line bg-white p-6 shadow-sm">
            <p className="font-bold text-site-navy">Ihr Potenzial – ein Rechenbeispiel</p>
            <p className="text-xs text-site-text">Ausgangsbasis: 100 Mio. € Jahresumsatz</p>
            <table className="mt-4 w-full text-sm">
              <thead><tr className="text-left text-xs text-site-text"><th className="pb-2 font-medium">Verbesserung der Vertriebsleistung</th><th className="pb-2 text-right font-medium">Zusätzlicher Umsatz pro Jahr</th></tr></thead>
              <tbody>
                {[["+ 0,05 %", "+ 50.000 €"], ["+ 0,1 %", "+ 100.000 €"], ["+ 0,5 %", "+ 500.000 €"]].map(([a, b]) => (
                  <tr key={a}><td className="border-t border-site-line py-3 font-semibold text-site-navy">{a}</td><td className="border-t border-site-line py-3 text-right"><span className="inline-block min-w-[9rem] rounded bg-site-sky px-3 py-1.5 text-right text-base font-extrabold text-site-blue">{b}</span></td></tr>
                ))}
              </tbody>
            </table>
            <p className="mt-4 text-[11px] leading-relaxed text-site-text">Beispielrechnung. Zusätzlicher Umsatz ist nicht gleich Gewinn; keine Zusage eines Ergebnisses.</p>
          </div>
        </Container>
      </section>

      {/* Anwendungsfelder */}
      <section className="py-16 md:py-20">
        <Container className="grid gap-12 lg:grid-cols-[1fr_2fr]">
          <SectionTitle title={<>KI im Vertrieb – gemeinsam herausfinden, was sich lohnt.</>}>
            Wir analysieren Ihre Prozesse, identifizieren relevante Anwendungsfälle und entwickeln passende Lösungen – pragmatisch, wirtschaftlich und mit klarer Wirkung auf Ihren Vertrieb. Welche davon für Sie sinnvoll sind, ist zu Beginn offen.
          </SectionTitle>
          <ul className="grid gap-x-10 gap-y-5 sm:grid-cols-2">
            {AREAS.map(([icon, title, text]) => (
              <li key={title} className="flex gap-4">
                <LineIcon d={ICONS[icon]} />
                <div><p className="text-[15px] font-bold text-site-navy">{title}</p><p className="text-sm text-site-text">{text}</p></div>
              </li>
            ))}
          </ul>
        </Container>
        <Container className="mt-10 flex flex-wrap gap-4 text-sm">
          <Link href="/ki-agenten" className="font-semibold text-site-blue underline">Mehr zu KI-Agenten im Vertrieb</Link>
          <Link href="/ki-tools" className="font-semibold text-site-blue underline">Überblick über KI-Tools im Vertrieb</Link>
        </Container>
      </section>

      {/* Vorgehen */}
      <section className="bg-site-sky py-16 md:py-20">
        <Container className="grid gap-12 lg:grid-cols-[1fr_2.2fr]">
          <SectionTitle title="Keine Lösungen von der Stange.">
            Wir entwickeln keine generischen Tools, sondern Lösungen, die zu Ihrem Unternehmen, Ihren Prozessen und Ihren Zielen passen.
          </SectionTitle>
          <ol className="relative grid gap-8 sm:grid-cols-4">
            <span aria-hidden className="absolute left-5 right-5 top-5 hidden h-px bg-site-navy/30 sm:block" />
            {STEPS.map(([n, title, text]) => (
              <li key={n} className="relative">
                <span className="relative z-10 flex h-10 w-10 items-center justify-center rounded-full bg-site-navy text-sm font-bold text-white">{n}</span>
                <p className="mt-4 text-lg font-extrabold text-site-navy">{title}</p>
                <p className="mt-1 text-sm text-site-text">{text}</p>
              </li>
            ))}
          </ol>
        </Container>
      </section>

      {/* Zwei Wege */}
      <section className="py-16 md:py-20">
        <Container>
          <SectionTitle title="Zwei Wege – je nachdem, was Sie brauchen." />
          <div className="mt-10 grid gap-6 md:grid-cols-2">
            <div className="rounded-xl border border-site-line p-8">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-site-blue">Für Kleinbetriebe & Vertriebsteams</p>
              <h3 className="mt-2 text-2xl font-extrabold text-site-navy">Plattform selbst nutzen</h3>
              <p className="mt-3 text-[15px] text-site-text">Kontakte, Telefonleitfaden mit Einwandbehandlung, Wiedervorlagen, persönliche Kundenwelten und Angebote mit Online-Annahme – sofort einsetzbar, ohne Beratungsprojekt.</p>
              <ul className="mt-5 space-y-2 text-sm text-site-text">{["Gesprächsleitfaden mit KI-Unterstützung", "Kundenwelten in Ihrem Design", "Absagegründe und Abschlussquoten auswerten"].map((t) => <li key={t} className="flex gap-2"><LineIcon d={ICONS.check} />{t}</li>)}</ul>
              <div className="mt-6"><ButtonLink href="/plattform" variant="light">Plattform ansehen</ButtonLink></div>
            </div>
            <div className="rounded-xl bg-site-navy p-8 text-white">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-sky-300">Für den Mittelstand</p>
              <h3 className="mt-2 text-2xl font-extrabold">Gemeinsame Potenzialanalyse</h3>
              <p className="mt-3 text-[15px] text-white/85">Wir analysieren Ihre Vertriebsprozesse, bewerten Lösungen wirtschaftlich und setzen um, was sich rechnet – von KI-Agenten bis zur Anbindung an Ihr ERP.</p>
              <ul className="mt-5 space-y-2 text-sm text-white/85">{["Festpreis, kostenloses Erstgespräch", "Wirtschaftlichkeit mit Ihren Zahlen", "Individuelle Lösungen statt Standardsoftware"].map((t) => <li key={t} className="flex gap-2"><svg aria-hidden viewBox="0 0 24 24" className="h-6 w-6 shrink-0" fill="none" stroke="currentColor" strokeWidth="1.5"><path d={ICONS.check} /></svg>{t}</li>)}</ul>
              <div className="mt-6"><ButtonLink href="/potenzialanalyse">Zur Potenzialanalyse</ButtonLink></div>
            </div>
          </div>
        </Container>
      </section>

      {/* Kundenwelt */}
      <section className="bg-site-sky py-16 md:py-20">
        <Container className="grid items-center gap-12 lg:grid-cols-[1fr_1.4fr_0.9fr]">
          <SectionTitle title="Ihr Unternehmen. Ihre Analyse. Ihre persönliche Kundenwelt.">
            Für jedes Kundenprojekt entsteht eine geschützte, persönliche Kundenwelt – ein zentraler Bereich für Analyse, Potenziale, Projektsteuerung und die direkte Zusammenarbeit.
          </SectionTitle>
          <KundenweltMockup />
          <ul className="space-y-4">
            {[["Begrüßung & Projektübersicht", "Alle relevanten Informationen an einem Ort."], ["Unternehmensanalyse", "Strukturierte Auswertung Ihrer Vertriebsprozesse."], ["Potenzialberechnung", "Umsatzpotenziale transparent dargestellt."], ["Projektvorschlag", "Plan mit Maßnahmen, Aufwand und Nutzen."], ["Direkte Kommunikation", "Rückfragen und Dokumente sicher austauschen."], ["Integrierte Video-Meetings", "Abstimmungen ohne zusätzliche Software."]].map(([t, d]) => (
              <li key={t} className="flex gap-3"><LineIcon d={ICONS.check} /><div><p className="text-sm font-bold text-site-navy">{t}</p><p className="text-xs text-site-text">{d}</p></div></li>
            ))}
          </ul>
        </Container>
      </section>

      {/* FAQ */}
      <section className="py-16 md:py-20">
        <Container className="grid gap-10 lg:grid-cols-[1fr_2fr]">
          <SectionTitle title="Häufige Fragen zu KI im Vertrieb" />
          <Faq items={FAQ} />
        </Container>
      </section>

      <CtaBand />
      <JsonLd data={{ "@context": "https://schema.org", "@type": "ProfessionalService", name: "kivertrieb.net", url: SITE_URL, areaServed: "DE", description: "Potenzialanalyse und Vertriebsplattform für KI im Vertrieb", serviceType: ["Vertriebsberatung", "KI-Beratung", "Vertriebssoftware"] }} />
    </>
  );
}
