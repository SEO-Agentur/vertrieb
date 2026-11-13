import type { Metadata } from "next";
import { SiteHeader } from "@/components/site/SiteHeader";
import { SiteFooter } from "@/components/site/SiteFooter";
import { JsonLd } from "@/components/site/JsonLd";
import { SITE_URL } from "@/lib/site";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: "KI im Vertrieb für B2B-Unternehmen | kivertrieb.net", template: "%s | kivertrieb.net" },
  description: "KI im Vertrieb: gemeinsam herausfinden, wo Ihr Vertrieb Potenzial verschenkt – Potenzialanalyse, Kundenwelten und Vertriebsplattform für Kleinbetriebe und Mittelstand.",
  robots: { index: true, follow: true },
  openGraph: { type: "website", locale: "de_DE", siteName: "kivertrieb.net" },
};

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-white font-sans text-site-text antialiased">
      <a href="#inhalt" className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded focus:bg-white focus:px-3 focus:py-2">Zum Inhalt springen</a>
      <SiteHeader />
      <main id="inhalt">{children}</main>
      <SiteFooter />
      <JsonLd data={[
        { "@context": "https://schema.org", "@type": "Organization", name: "kivertrieb.net", url: SITE_URL, description: "Beratung und Plattform für KI im Vertrieb" },
        { "@context": "https://schema.org", "@type": "WebSite", name: "kivertrieb.net", url: SITE_URL, inLanguage: "de-DE" },
      ]} />
    </div>
  );
}
