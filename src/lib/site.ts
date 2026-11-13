export const SITE_URL = (process.env.SITE_URL ?? "https://kivertrieb.net").replace(/\/$/, "");
export const APP_URL_PUBLIC = process.env.APP_URL ?? "https://app.kivertrieb.net";

export const NAV = {
  leistungen: [
    { href: "/potenzialanalyse", label: "Potenzialanalyse", text: "Gemeinsam herausfinden, wo KI Ihrem Vertrieb hilft" },
    { href: "/plattform", label: "Plattform", text: "Kundenwelten, CRM, Telefonleitfaden – selbst nutzen" },
    { href: "/preise", label: "Pakete & Preise", text: "Vom Kleinbetrieb bis zum Mittelstand" },
  ],
  anwendungsfaelle: [
    { href: "/ki-agenten", label: "KI-Agenten im Vertrieb", text: "Was Agenten heute realistisch können" },
    { href: "/ki-tools", label: "KI-Tools im Vertrieb", text: "Überblick nach Einsatzbereich" },
    { href: "/werkzeuge/umsatzpotenzial-rechner", label: "Umsatzpotenzial-Rechner", text: "Was bereits 0,05 % bedeuten" },
  ],
};

export const SITE_PAGES = [
  "/", "/potenzialanalyse", "/plattform", "/preise", "/ki-agenten", "/ki-tools",
  "/werkzeuge/umsatzpotenzial-rechner", "/ueber-mich", "/kontakt", "/impressum", "/datenschutz",
];
