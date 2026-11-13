import type { Metadata } from "next";
import { Container, PageHero, SectionTitle } from "@/components/site/Blocks";
import { LeadForm } from "@/components/site/LeadForm";

export const metadata: Metadata = { title: "Kontakt", description: "Kontakt zu kivertrieb.net – Erstgespräch, Pilotzugang zur Plattform oder allgemeine Fragen.", alternates: { canonical: "/kontakt" } };

export default async function Page({ searchParams }: { searchParams: Promise<{ thema?: string }> }) {
  const { thema } = await searchParams;
  const kind = thema === "plattform" ? "PLATTFORM" : "KONTAKT";
  return (
    <>
      <PageHero eyebrow="Kontakt" title={kind === "PLATTFORM" ? "Pilotzugang zur Plattform anfragen" : "Kontakt aufnehmen"} crumbs={[{ href: "/kontakt", label: "Kontakt" }]} intro="Schreiben Sie mir kurz, worum es geht. Ich melde mich innerhalb eines Werktags persönlich." />
      <section className="py-16">
        <Container className="grid gap-10 lg:grid-cols-[1fr_1.6fr]">
          <SectionTitle title={kind === "PLATTFORM" ? "Pilotzugang" : "Ihre Nachricht"}>
            {kind === "PLATTFORM" ? "Wir richten Ihren Zugang gemeinsam ein und passen Leitfaden und Kundenwelten an Ihr Unternehmen an." : "Für ein Erstgespräch zur Potenzialanalyse, Fragen zur Plattform oder Kooperationen."}
          </SectionTitle>
          <div className="rounded-xl border border-site-line p-6 md:p-8"><LeadForm kind={kind} submitLabel={kind === "PLATTFORM" ? "Pilotzugang anfragen" : "Nachricht senden"} /></div>
        </Container>
      </section>
    </>
  );
}
