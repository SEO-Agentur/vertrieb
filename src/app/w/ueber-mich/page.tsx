import type { Metadata } from "next";
import { Container, CtaBand, PageHero, Prose } from "@/components/site/Blocks";

export const metadata: Metadata = { title: "Über mich", description: "Wer hinter kivertrieb.net steht: Erfahrung, Arbeitsweise und Haltung zu KI im Vertrieb.", alternates: { canonical: "/ueber-mich" } };

export default function Page() {
  return (
    <>
      <PageHero eyebrow="Über mich" title="Wer hinter kivertrieb.net steht" crumbs={[{ href: "/ueber-mich", label: "Über mich" }]} intro="Ich helfe Unternehmen herauszufinden, wo sie ihren Vertrieb mit KI verbessern können – und entwickle anschließend die passende Lösung." />
      <section className="py-16"><Container className="max-w-3xl"><Prose>
        {/* PLATZHALTER: vor dem Livegang durch echte Angaben ersetzen (Foto, Werdegang, Referenzen nur mit Freigabe) */}
        <p className="rounded border border-dashed border-amber-400 bg-amber-50 p-4 text-sm text-amber-900">[Platzhalter: Foto, Werdegang, Schwerpunkte und LinkedIn-Profil hier einsetzen.]</p>
        <h2>Arbeitsweise</h2>
        <ul><li>Erst verstehen, dann empfehlen – keine Standardlösung vorab.</li><li>Wirtschaftlichkeit mit offengelegten Annahmen statt Versprechen.</li><li>KI unterstützt, Menschen entscheiden und geben frei.</li><li>Datenschutz und Transparenz von Anfang an.</li></ul>
      </Prose></Container></section>
      <CtaBand />
    </>
  );
}
