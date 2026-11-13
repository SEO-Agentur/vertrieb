import type { Metadata } from "next";
import { Container, CtaBand, Faq, PageHero, SectionTitle } from "@/components/site/Blocks";
import { LeadForm } from "@/components/site/LeadForm";
import { ICONS, LineIcon } from "@/components/site/Visuals";

export const metadata: Metadata = {
  title: "Potenzialanalyse KI im Vertrieb – Ablauf & Anfrage",
  description: "Gemeinsam herausfinden, wo KI Ihrem Vertrieb wirklich hilft: kostenloses Erstgespräch, Potenzialanalyse zum Festpreis, Ergebnisbericht mit Maßnahmen und Wirtschaftlichkeit.",
  alternates: { canonical: "/potenzialanalyse" },
};

const FAQ = [
  { q: "Wie läuft die Potenzialanalyse ab?", a: "Nach einem kostenlosen Erstgespräch (ca. 30 Minuten) analysieren wir in einem Workshop Ihre Vertriebsprozesse – Neukundengewinnung, Angebote, Bestandskunden, Daten und Systeme. Sie erhalten einen Bericht mit priorisierten Maßnahmen und einer Wirtschaftlichkeitsbetrachtung." },
  { q: "Was kostet die Potenzialanalyse?", a: "Sie wird zum Festpreis angeboten, den Sie nach dem Erstgespräch kennen. Es gibt keine versteckten Folgekosten und keine Pflicht, anschließend etwas umzusetzen." },
  { q: "Welche Daten brauchen Sie von uns?", a: "Für den Einstieg genügen Ihre Einschätzungen und ein Blick auf die wichtigsten Abläufe. Je genauer die Zahlen (Umsatz, Deckungsbeitrag, Aufwände), desto belastbarer die Wirtschaftlichkeitsrechnung – alles freiwillig." },
  { q: "Für welche Unternehmen eignet sich das?", a: "Vor allem für B2B-Unternehmen mit aktivem Vertrieb, etwa Maschinenbau, technischer Großhandel, Zulieferer, Logistik oder IT-Dienstleister. Kleinere Betriebe starten oft direkt mit der Plattform." },
];

export default function Page() {
  return (
    <>
      <PageHero eyebrow="Leistung" title="Potenzialanalyse: Wo bringt KI Ihrem Vertrieb wirklich etwas?" crumbs={[{ href: "/potenzialanalyse", label: "Potenzialanalyse" }]}
        intro="Wir behaupten nicht, Ihre Herausforderungen schon zu kennen. Gemeinsam untersuchen wir, wo Verkaufschancen verloren gehen, welche Abläufe zu lange dauern und welche Lösung sich wirtschaftlich lohnt." />
      <section className="py-16">
        <Container className="grid gap-12 lg:grid-cols-2">
          <div>
            <SectionTitle title="So läuft es ab" />
            <ol className="mt-8 space-y-6">
              {[["Erstgespräch", "30 Minuten, kostenlos: Ziele, Ausgangslage, erste Themen."], ["Analyse-Workshop", "Neukundengewinnung, Angebotsprozess, Bestandskunden, Daten und Systeme strukturiert durchgehen."], ["Ergebnisbericht", "Priorisierte Maßnahmen, Lösungsoptionen und eine Wirtschaftlichkeitsrechnung mit offengelegten Annahmen."], ["Entscheidung", "Sie entscheiden, ob und was umgesetzt wird – mit uns, mit der Plattform oder intern."]].map(([t, d], i) => (
                <li key={t} className="flex gap-4"><span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-site-navy text-sm font-bold text-white">{i + 1}</span><div><p className="font-bold text-site-navy">{t}</p><p className="text-sm text-site-text">{d}</p></div></li>
              ))}
            </ol>
          </div>
          <div className="space-y-8">
            <div className="rounded-xl border border-site-line p-6">
              <p className="font-bold text-site-navy">Was Sie erhalten</p>
              <ul className="mt-3 space-y-2 text-sm text-site-text">{["Klarheit, wo Ihr Vertrieb Zeit und Chancen verliert", "Konkrete Anwendungsfälle für KI und Automatisierung", "Wirtschaftlichkeit pro Maßnahme (Deckungsbeitrag, Einsparung, Kosten, Amortisation)", "Eine persönliche Kundenwelt mit allen Ergebnissen"].map((t) => <li key={t} className="flex gap-2"><LineIcon d={ICONS.check} />{t}</li>)}</ul>
            </div>
            <div className="rounded-xl bg-site-sky p-6">
              <p className="font-bold text-site-navy">Was wir nicht tun</p>
              <ul className="mt-3 space-y-1.5 text-sm text-site-text"><li>– Ihnen Standardsoftware aufdrängen</li><li>– Umsatzsteigerungen versprechen</li><li>– Daten ohne Ihre Zustimmung verarbeiten</li></ul>
            </div>
          </div>
        </Container>
      </section>
      <section id="anfrage" className="scroll-mt-24 bg-site-sky py-16">
        <Container className="grid gap-10 lg:grid-cols-[1fr_1.6fr]">
          <SectionTitle title="Kostenloses Erstgespräch anfragen">Ich melde mich innerhalb eines Werktags persönlich bei Ihnen.</SectionTitle>
          <div className="rounded-xl border border-site-line bg-white p-6 md:p-8"><LeadForm kind="POTENZIALANALYSE" submitLabel="Erstgespräch anfragen" /></div>
        </Container>
      </section>
      <section className="py-16"><Container className="grid gap-10 lg:grid-cols-[1fr_2fr]"><SectionTitle title="Häufige Fragen" /><Faq items={FAQ} /></Container></section>
      <CtaBand />
    </>
  );
}
