import { SITE_URL } from "@/lib/site";
export const dynamic = "force-static";
export function GET() {
  const t = `# kivertrieb.net

> Beratung und Plattform für KI im Vertrieb – für Kleinbetriebe und den B2B-Mittelstand in Deutschland. Grundsatz: Wir finden gemeinsam heraus, wo KI im Vertrieb wirtschaftlich sinnvoll ist, statt Standardlösungen vorab zu versprechen.

## Seiten
- [KI im Vertrieb](${SITE_URL}/): Überblick, Anwendungsfelder, Vorgehen, FAQ
- [Potenzialanalyse](${SITE_URL}/potenzialanalyse): Ablauf, Leistungen, Anfrage
- [Plattform](${SITE_URL}/plattform): CRM, KI-Telefonleitfaden, persönliche Kundenwelten, Angebote
- [Pakete & Preise](${SITE_URL}/preise)
- [KI-Agenten im Vertrieb](${SITE_URL}/ki-agenten): Definition, Abgrenzung, Einsatz, Grenzen
- [KI-Tools im Vertrieb](${SITE_URL}/ki-tools): Einsatzbereiche und Auswahlkriterien
- [Umsatzpotenzial-Rechner](${SITE_URL}/werkzeuge/umsatzpotenzial-rechner): Szenarien 0,05 / 0,1 / 0,5 % mit Deckungsbeitrag und Kosten
`;
  return new Response(t, { headers: { "content-type": "text/plain; charset=utf-8" } });
}
