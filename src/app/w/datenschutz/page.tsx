import type { Metadata } from "next";
import { Container, PageHero, Prose } from "@/components/site/Blocks";

export const metadata: Metadata = { title: "Datenschutzerklärung", alternates: { canonical: "/datenschutz" }, robots: { index: false, follow: true } };

export default function Page() {
  return (
    <>
      <PageHero eyebrow="Rechtliches" title="Datenschutzerklärung" crumbs={[{ href: "/datenschutz", label: "Datenschutzerklärung" }]} intro="" />
      <section className="py-16"><Container className="max-w-3xl"><Prose>
        {/* PLATZHALTER: Rechtstext vor dem Livegang durch geprüften Text ersetzen – hier wird bewusst kein Rechtstext erfunden. */}
        <p className="rounded border border-dashed border-amber-400 bg-amber-50 p-4 text-sm text-amber-900">[Platzhalter: Datenschutzerklärung – bitte durch einen geprüften Text ersetzen.]</p>
      </Prose></Container></section>
    </>
  );
}
