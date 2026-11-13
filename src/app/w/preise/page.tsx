import type { Metadata } from "next";
import { ButtonLink, Container, CtaBand, PageHero } from "@/components/site/Blocks";
import { ICONS, LineIcon } from "@/components/site/Visuals";

export const metadata: Metadata = {
  title: "Pakete & Preise: Vertriebsplattform und Beratung",
  description: "Pakete für Selbstständige, Kleinbetriebe, Vertriebsteams und Mittelstand – von kostenlosen Werkzeugen bis zur Potenzialanalyse mit individueller Umsetzung.",
  alternates: { canonical: "/preise" },
};

const PLANS = [
  { name: "Kostenlos", for: "Zum Ausprobieren", price: "0 €", items: ["Umsatzpotenzial-Rechner", "Standard-Telefonleitfaden", "1 persönliche Kundenwelt", "Kontakte in begrenzter Zahl"], cta: ["Zugang anfragen", "/kontakt?thema=plattform"] },
  { name: "Solo", for: "Selbstständige & Kleinbetriebe", price: "Pilotpreis auf Anfrage", items: ["CRM, Wiedervorlagen, Absagegründe", "Eigener Gesprächsleitfaden", "Kundenwelten mit eigenem Logo", "Angebote mit PDF & Online-Annahme"], cta: ["Pilotzugang anfragen", "/kontakt?thema=plattform"], highlight: true },
  { name: "Team", for: "Vertriebsteams (3–20 Personen)", price: "Pilotpreis auf Anfrage", items: ["Mehrere Nutzer & Rollen", "Eigene Domain & Corporate Design", "Videoberatung in der Kundenwelt", "KI-Assistent & Integrationen"], cta: ["Pilotzugang anfragen", "/kontakt?thema=plattform"] },
  { name: "Business + Beratung", for: "Mittelstand", price: "individuell", items: ["Potenzialanalyse zum Festpreis", "Einrichtung & ERP-/CRM-Anbindung", "Individuelle KI-Agenten", "Auftragsverarbeitungsvertrag"], cta: ["Erstgespräch vereinbaren", "/potenzialanalyse#anfrage"] },
];

export default function Page() {
  return (
    <>
      <PageHero eyebrow="Pakete" title="Pakete für jede Unternehmensgröße" crumbs={[{ href: "/preise", label: "Pakete & Preise" }]}
        intro="Die Plattform befindet sich in der Pilotphase. Preise legen wir gemeinsam mit den ersten Kunden fest – transparent, monatlich kündbar und ohne versteckte Kosten." />
      <section className="py-16">
        <Container className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
          {PLANS.map((p) => (
            <div key={p.name} className={`flex flex-col rounded-xl p-6 ${p.highlight ? "border-2 border-site-blue shadow-lg" : "border border-site-line"}`}>
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-site-blue">{p.for}</p>
              <h2 className="mt-2 text-2xl font-extrabold text-site-navy">{p.name}</h2>
              <p className="mt-2 text-lg font-bold text-site-navy">{p.price}</p>
              <ul className="mt-5 flex-1 space-y-2 text-sm text-site-text">{p.items.map((i) => <li key={i} className="flex gap-2"><LineIcon d={ICONS.check} />{i}</li>)}</ul>
              <div className="mt-6"><ButtonLink href={p.cta[1]} variant={p.highlight ? "primary" : "light"}>{p.cta[0]}</ButtonLink></div>
            </div>
          ))}
        </Container>
        <Container className="mt-8 text-sm text-site-text">
          <p>Zusätzlich buchbar: Recherche-Kontingente für Unternehmens- und Kontaktdaten aus lizenzierten Quellen sowie Einrichtung als Festpreis-Service. Alle Preise verstehen sich zzgl. USt.</p>
        </Container>
      </section>
      <CtaBand title="Welches Paket passt zu Ihnen?" text="Im kostenlosen Erstgespräch klären wir, ob Sie mit der Plattform direkt starten oder eine Potenzialanalyse sinnvoller ist." />
    </>
  );
}
