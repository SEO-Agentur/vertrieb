import type { Metadata } from "next";
import { ButtonLink, Container, CtaBand, Faq, PageHero, SectionTitle, Summary } from "@/components/site/Blocks";
import { ICONS, KundenweltMockup, LineIcon } from "@/components/site/Visuals";

export const metadata: Metadata = {
  title: "Vertriebsplattform mit KI, Kundenwelten und Telefonleitfaden",
  description: "Die Vertriebsplattform für Kleinbetriebe und Mittelstand: CRM, KI-Telefonleitfaden, persönliche Kundenwelten, Angebote mit Online-Annahme und Auswertungen – DSGVO-bewusst und ohne LinkedIn-Automatisierung.",
  alternates: { canonical: "/plattform" },
};

const FEATURES: [keyof typeof ICONS, string, string, string?][] = [
  ["search", "Prospecting & Import", "Unternehmen und Ansprechpartner per CSV oder aus Sales-Navigator-Listen übernehmen – mit Dublettenprüfung."],
  ["layers", "Qualifizierung & Lead-Scoring", "Nachvollziehbare Bewertung mit Begründung; Gewichtungen selbst einstellen."],
  ["phone", "KI-Telefonleitfaden", "Gesprächsschritte, Einwände per Klick, freie Antwort eintippen – die KI schlägt die nächste Formulierung vor. Ohne Mitschnitt."],
  ["target", "Wiedervorlagen & Absagegründe", "Rückrufe automatisch planen, Absagegründe auswerten und daraus lernen."],
  ["chat", "Persönliche Kundenwelten", "Jeder Interessent erhält eine geschützte Seite mit Rechner, Themen, Video-Beratung und Angebot – in Ihrem Design."],
  ["doc", "Angebote mit Online-Annahme", "Angebote aus Bausteinen, Versionen, PDF und dokumentierte Annahme direkt in der Kundenwelt."],
  ["chart", "Pipeline & Auswertungen", "Kanban, Trichter, Antwort- und Abschlussquoten auf einen Blick."],
  ["cube", "Ausschreibungs-Radar", "Passende öffentliche Ausschreibungen zu Ihrem Angebot mit Eckdaten und Ansprechpartnern.", "in Entwicklung"],
];

export default function Page() {
  return (
    <>
      <PageHero eyebrow="Plattform" title="Die Vertriebsplattform, mit der wir selbst verkaufen." crumbs={[{ href: "/plattform", label: "Plattform" }]}
        intro="Recherche, Ansprache, Telefonat, Kundenwelt und Angebot an einem Ort. Für Kleinbetriebe sofort nutzbar, für den Mittelstand erweiterbar – mit Beratung, Integration und individuellen KI-Agenten." />
      <section className="py-16">
        <Container className="grid gap-12 lg:grid-cols-[1.2fr_1fr]">
          <div>
            <SectionTitle title="Was die Plattform kann" />
            <ul className="mt-8 grid gap-6 sm:grid-cols-2">
              {FEATURES.map(([icon, t, d, badge]) => (
                <li key={t} className="flex gap-4"><LineIcon d={ICONS[icon]} /><div><p className="font-bold text-site-navy">{t}{badge && <span className="ml-2 rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-semibold text-amber-800">{badge}</span>}</p><p className="text-sm text-site-text">{d}</p></div></li>
              ))}
            </ul>
          </div>
          <div className="space-y-6">
            <Summary points={["Ein System für den ganzen Vertriebsablauf", "KI unterstützt, der Mensch entscheidet und gibt frei", "Kein automatischer LinkedIn-Versand, keine Gesprächsaufzeichnung", "Betrieb in der EU, Daten jederzeit löschbar"]} />
            <KundenweltMockup />
          </div>
        </Container>
      </section>
      <section className="bg-site-sky py-16">
        <Container className="grid items-center gap-8 md:grid-cols-[2fr_1fr]">
          <SectionTitle title="Pilotphase: Zugang anfragen">Die Plattform ist im Einsatz und wird mit ersten Pilotkunden weiterentwickelt. Fragen Sie einen Zugang an – wir richten ihn gemeinsam ein.</SectionTitle>
          <div className="flex flex-wrap gap-3 md:justify-end"><ButtonLink href="/kontakt?thema=plattform">Pilotzugang anfragen</ButtonLink><ButtonLink href="/preise" variant="light">Pakete ansehen</ButtonLink></div>
        </Container>
      </section>
      <section className="py-16"><Container className="grid gap-10 lg:grid-cols-[1fr_2fr]"><SectionTitle title="Häufige Fragen zur Plattform" /><Faq items={[
        { q: "Für wen ist die Plattform gedacht?", a: "Für alle, die aktiv verkaufen: Selbstständige, Kleinbetriebe und Vertriebsteams im Mittelstand – besonders im B2B." },
        { q: "Versendet die Plattform automatisch LinkedIn-Nachrichten?", a: "Nein. Nachrichten werden vorbereitet und von Ihnen freigegeben; versendet wird manuell. Das schützt Ihr Konto und Ihren Ruf." },
        { q: "Werden Telefonate aufgezeichnet?", a: "Nein. Der Telefonleitfaden verarbeitet nur Ihre Klicks und Eingaben. Eine Aufzeichnung wäre ohne Einwilligung des Gesprächspartners unzulässig." },
        { q: "Kann ich meine Kundenwelten an mein Corporate Design anpassen?", a: "Ja – Logo, Farben und Texte. Eine eigene Subdomain (z. B. angebote.ihre-firma.de) ist für Team- und Business-Pakete vorgesehen." },
      ]} /></Container></section>
      <CtaBand />
    </>
  );
}
