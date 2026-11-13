import type { Metadata } from "next";
import { ButtonLink, Container, CtaBand, PageHero } from "@/components/site/Blocks";
import { SiteCalculator } from "@/components/site/SiteCalculator";
import { JsonLd } from "@/components/site/JsonLd";
import { SITE_URL } from "@/lib/site";

export const metadata: Metadata = {
  title: "Umsatzpotenzial-Rechner: Was bringen 0,05 % mehr Umsatz?",
  description: "Kostenloser Rechner: Was bedeuten 0,05 %, 0,1 % oder 0,5 % mehr Umsatz für Ihr Unternehmen – inklusive Deckungsbeitrag, Einsparungen, Kosten und Amortisation.",
  alternates: { canonical: "/werkzeuge/umsatzpotenzial-rechner" },
};

export default function Page() {
  return (
    <>
      <PageHero eyebrow="Werkzeug" title="Umsatzpotenzial-Rechner: Was bedeuten bereits 0,05 %?" crumbs={[{ href: "/werkzeuge/umsatzpotenzial-rechner", label: "Umsatzpotenzial-Rechner" }]}
        intro="Bei 100 Mio. € Jahresumsatz entsprechen 0,05 % rechnerisch 50.000 € zusätzlichem Umsatz. Tragen Sie Ihre eigenen Zahlen ein – inklusive Deckungsbeitrag, Einsparungen und Kosten. Alle Berechnungen laufen nur in Ihrem Browser." />
      <section className="py-16"><Container><SiteCalculator /></Container></section>
      <section className="bg-site-sky py-14">
        <Container className="flex flex-wrap items-center justify-between gap-6">
          <p className="max-w-2xl text-site-navy"><strong>Mit Ihren echten Zahlen gemeinsam prüfen:</strong> Welche Maßnahmen die Annahmen tatsächlich erreichen können, klären wir in der Potenzialanalyse.</p>
          <ButtonLink href="/potenzialanalyse#anfrage">Potenzialanalyse anfragen</ButtonLink>
        </Container>
      </section>
      <CtaBand />
      <JsonLd data={{ "@context": "https://schema.org", "@type": "WebApplication", name: "Umsatzpotenzial-Rechner", applicationCategory: "BusinessApplication", operatingSystem: "Web", url: `${SITE_URL}/werkzeuge/umsatzpotenzial-rechner`, offers: { "@type": "Offer", price: "0", priceCurrency: "EUR" }, inLanguage: "de-DE" }} />
    </>
  );
}
