# Prompt für v0: Website kivertrieb.net (MVP)

Den Block zwischen den Linien komplett in v0 einfügen. Danach Seite für Seite verfeinern (siehe „Folge-Prompts“ unten).

---

Baue die Marketing-Website **kivertrieb.net** als Next.js-App (App Router, TypeScript, Tailwind CSS, shadcn/ui erlaubt). Sprache: **Deutsch** (`<html lang="de">`), Zielgruppe: Geschäftsführer, Inhaber und Vertriebsleiter im deutschen B2B-Mittelstand (20–200 Mio. € Umsatz; Maschinenbau, technischer Großhandel, Industriebedarf, Zulieferer, Logistik, IT-Systemhäuser). Ziel der Website: über Google und KI-Suchen gefunden werden und Besucher zu einer **Anfrage für eine Potenzialanalyse** führen.

## Positionierung (prägt jeden Text)
- Kernbotschaft: „Ich helfe Ihnen herauszufinden, wo Sie Ihren Vertrieb mit KI verbessern können – und entwickle anschließend die passende Lösung.“
- Produktprinzip: „Wir wissen nicht im Voraus, wo Ihr Unternehmen durch KI profitiert. Wir finden es gemeinsam heraus.“
- Ton: sachlich, kompetent, ruhig, auf Augenhöhe mit Mittelständlern. Keine Hype-Wörter („revolutionär“, „game changer“), keine Renditeversprechen, keine Garantien.
- **Keine erfundenen Inhalte:** keine Kundenlogos, Testimonials, Fallstudien, Bewertungssterne, Nutzerzahlen oder Statistiken. Wo später echte Inhalte hinkommen, einen klar markierten Platzhalter-Kommentar im Code setzen, aber nichts davon im Frontend anzeigen.

## Design
- Anmutung: hochwertig, editorial, vertrauenswürdig – eher Unternehmensberatung als Start-up. **Kein** generischer SaaS-Look (keine lila Verläufe, keine Glassmorphism-Karten, keine Emoji-Icons).
- Farben: tiefes Anthrazit/Navy (#0F172A) als Hauptfarbe, warmes Off-White (#FAF8F5) als Hintergrund, ein gedämpftes Gold (#C8A96A) als Akzent sparsam für CTAs und Hervorhebungen. Ausreichender Kontrast (WCAG AA).
- Typografie: Überschriften in einer eleganten Serifenschrift (z. B. „Fraunces“ oder „Source Serif 4“ via `next/font`), Fließtext in einer klaren Sans (z. B. „Inter“). Großzügige Weißräume, 8-px-Raster, max. Textbreite ~70 Zeichen.
- Visuelle Elemente: feine Linien, nummerierte Abschnitte, dezente Diagramme/Illustrationen aus SVG (keine Stockfotos von Menschen am Laptop). Ein ruhiges, abstraktes Hero-Motiv (z. B. Linien, die einen Vertriebstrichter andeuten).
- Mobile first, vollständig responsiv, sichtbarer Fokus für Tastaturnutzer, `prefers-reduced-motion` respektieren. Animationen nur subtil.

## Navigation
Header (sticky, schlicht): Logo-Wortmarke „kivertrieb“ links · Menü: **KI-Vertrieb** (= Startseite) · **KI-Tools** · **KI-Agenten** · **Werkzeuge** · rechts Button **„Potenzialanalyse anfragen“** (Akzentfarbe) und dezenter Link „Login“ → `https://app.kivertrieb.net/login`.
Mobile: Hamburger-Menü mit denselben Punkten.
Footer: Kurzbeschreibung, Links zu allen Seiten, Über mich, Kontakt, Impressum, Datenschutz.

## Seiten im MVP

### 1. `/` – KI-Vertrieb (Startseite, Haupt-Keyword „ki im vertrieb“)
- Title: „KI im Vertrieb für den B2B-Mittelstand | kivertrieb.net“ · Description: „Wo bringt KI Ihrem Vertrieb wirklich etwas? Gemeinsame Potenzialanalyse für mittelständische B2B-Unternehmen – ehrlich, konkret, ohne Versprechen.“
- H1: „KI im Vertrieb – gemeinsam herausfinden, was sich für Sie lohnt“
- Direkt unter der H1 eine 2–3-Satz-Antwort auf „Was bringt KI im Vertrieb?“ (für Google und KI-Suchen zitierfähig).
- Abschnitte:
  1. Hero mit Kernbotschaft, primärem CTA „Potenzialanalyse anfragen“, sekundärem CTA „Umsatzpotenzial berechnen“.
  2. „Was bereits 0,05 % bedeuten“: kompakte Version des Rechners (siehe Werkzeuge) mit Beispiel 100 Mio. € → 50.000 € Zusatzumsatz, Hinweis „Umsatz ist nicht gleich Gewinn“.
  3. „Wo KI im B2B-Vertrieb ansetzen kann“: 6 Karten – Neukundengewinnung, Leadqualifizierung, Angebotserstellung, Bestandskunden & Cross-Selling, CRM & Datenpflege, Website & digitale Leadgenerierung. Jede Karte: 2 Sätze, formuliert als Möglichkeit („kann“, „zu prüfen“), nicht als Diagnose.
  4. „So arbeiten wir“: 4 nummerierte Schritte – Gespräch → gemeinsame Potenzialanalyse → Lösung & Wirtschaftlichkeit → Umsetzung.
  5. „Ihre persönliche Kundenwelt“: kurze Erklärung, dass jeder Interessent eine eigene, geschützte Seite mit Analyse, Rechner und Angebot erhält (abstrakte UI-Skizze als SVG, keine Fake-Screenshots mit erfundenen Firmen).
  6. Beispiele & Anwendungsfälle: 6 kurze Szenarien nach Vertriebsphase (z. B. „Anfragen automatisch priorisieren“, „Angebotsentwurf in Minuten statt Tagen – wo Daten und Kalkulation das zulassen“).
  7. Risiken & Datenschutz: kurz und ehrlich (DSGVO, EU AI Act, menschliche Freigabe, keine Gesprächsaufzeichnung ohne Einwilligung).
  8. FAQ (6–8 Fragen, z. B. „Was kostet eine Potenzialanalyse?“ → „Festpreis, wird im Erstgespräch genannt“, „Brauchen wir schon ein CRM?“, „Wie lange dauert es?“, „Ist das DSGVO-konform?“).
  9. Abschluss-CTA mit Anfrageformular.
- Inhaltsverzeichnis (Sprungmarken) bei langer Seite.

### 2. `/ki-tools/` – KI-Tools im Vertrieb (Keywords „ki tools vertrieb“, „ki tools für vertrieb“)
- Title: „KI-Tools im Vertrieb: Überblick nach Einsatzbereich | kivertrieb.net“
- H1: „KI-Tools für den Vertrieb – was es gibt und wann sie sich lohnen“
- Aufbau: Definition oben · Kategorien als Abschnitte (Recherche & Leadgenerierung · CRM & Datenpflege · Gesprächs- und Meeting-Assistenten · Angebotserstellung · Digitale Kundenräume/Sales Rooms) – je Kategorie: wofür, worauf achten, typische Grenzen. **Keine Anbieter-Rankings oder Preise erfinden**; allgemeine Kategorien statt konkreter Produktbewertungen.
- Abschnitt „Auswahlkriterien“ als Tabelle (Datenschutz/Serverstandort, Integration ins CRM/ERP, Aufwand, laufende Kosten, menschliche Kontrolle).
- Abschnitt „Tool oder individuelle Lösung?“ als Brücke zur Potenzialanalyse. FAQ (4 Fragen). CTA.

### 3. `/ki-agenten/` – KI-Agenten im Vertrieb (Keywords „ki agenten im vertrieb“, „ki agenten vertrieb“, „was ist ein ki-agent für den vertrieb“)
- Title: „KI-Agenten im Vertrieb: Was sie heute realistisch können | kivertrieb.net“
- H1: „KI-Agenten im Vertrieb – Möglichkeiten und Grenzen“
- Aufbau: Definition „Was ist ein KI-Agent?“ in 2–3 Sätzen · Unterschied Chatbot / Assistent / Agent (Tabelle) · Agenten nach Aufgabe: Recherche, Leadqualifizierung, Follow-up, Angebot, CRM-Pflege (je: Aufgabe, nötige Daten, wo der Mensch freigibt) · „Was Agenten heute nicht können“ · „Selbst bauen oder kaufen?“ · FAQ · CTA.

### 4. `/werkzeuge/umsatzpotenzial-rechner/` – interaktiver Rechner (Client Component)
- Title: „Umsatzpotenzial-Rechner: Was bringen 0,05 % mehr Umsatz? | kivertrieb.net“
- Eingaben (alle editierbar, deutsches Zahlenformat): Jahresumsatz (€), Szenarien in % (Standard 0,05 / 0,1 / 0,5), Deckungsbeitragsmarge (%, Standard 30), eingesparte Stunden pro Monat, Kosten je Stunde (€, Standard 65), sonstige Prozesskosteneinsparung pro Jahr (€), einmalige Projektkosten (€), laufende Kosten pro Jahr (€).
- Berechnung je Szenario: Zusatzumsatz = Umsatz × % · Zusatz-Deckungsbeitrag = Zusatzumsatz × Marge · Einsparungen = Stunden × 12 × Stundensatz + sonstige Einsparung · Nutzen/Jahr = DB + Einsparungen · Netto/Jahr = Nutzen − laufende Kosten · Amortisation (Monate) = einmalige Kosten ÷ Netto × 12 (nur wenn Netto > 0) · Ergebnis Jahr 1 = Netto − einmalige Kosten.
- Ergebnis als Tabelle + schlichtes Balkendiagramm; Pflichthinweis darunter: „Rechenbeispiel auf Basis Ihrer Annahmen. Zusätzlicher Umsatz ist nicht gleich Gewinn. Keine Zusage oder Garantie eines Ergebnisses.“
- CTA darunter: „Mit Ihren echten Zahlen gemeinsam prüfen → Potenzialanalyse anfragen“.
- `/werkzeuge/` als Übersicht: Rechner (aktiv) + „Vertriebs-Check“ und „Use-Case-Finder“ als „demnächst“ gekennzeichnet (nicht klickbar, kein Fake).

### 5. `/potenzialanalyse/` – Angebot & Anfrage (Conversion-Seite)
- Title: „Potenzialanalyse KI im Vertrieb – Ablauf & Anfrage | kivertrieb.net“
- Inhalte: Für wen · Ablauf (Erstgespräch 30 Min. kostenlos → Analyse-Workshop → Ergebnisbericht mit Maßnahmen und Wirtschaftlichkeit) · Was Sie erhalten · Was wir nicht tun (keine Standardsoftware aufdrängen, keine Versprechen) · FAQ · Formular.
- Formular (Server Action oder `POST /api/lead`): Name*, Firma*, Position, geschäftliche E-Mail*, Telefon, Branche (Select), ungefährer Jahresumsatz (Select: unter 20 Mio. / 20–50 / 50–100 / 100–200 / über 200 Mio. €), „Wo sehen Sie den größten Engpass?“ (Textarea), Pflicht-Checkbox Datenschutzhinweis, Honeypot-Feld gegen Spam. Validierung mit zod, Erfolgsmeldung auf der Seite. Die API-Route speichert noch nichts dauerhaft, sondern loggt serverseitig und hat einen klar markierten `TODO: an app.kivertrieb.net weiterleiten`.

### 6. `/ueber-mich/`, `/kontakt/`, `/impressum/`, `/datenschutz/`
- Über mich: Platzhalter für Foto, Werdegang, Arbeitsweise (E-E-A-T) – Platzhaltertexte deutlich als `[Platzhalter: …]` sichtbar, damit sie vor dem Livegang ersetzt werden.
- Impressum/Datenschutz: Gerüst mit Überschriften und `[Platzhalter]`, keinen Rechtstext erfinden.

## Technisches SEO (Pflicht)
- Alle Seiten statisch generiert; Metadata API pro Seite (title, description, canonical `https://kivertrieb.net/...` mit Trailing Slash, Open Graph, Twitter Card); `trailingSlash: true` in `next.config`.
- `app/sitemap.ts`, `app/robots.ts` (alles erlauben, Sitemap verlinken), `public/llms.txt` mit kurzer Seitenübersicht.
- JSON-LD: `Organization` + `WebSite` (global), `ProfessionalService` auf Start- und Potenzialanalyse-Seite, `BreadcrumbList` auf Unterseiten, `FAQPage` überall dort, wo FAQs stehen, `WebApplication` für den Rechner, `Article` (mit Autor und `dateModified`) für KI-Tools und KI-Agenten.
- Genau eine H1 pro Seite, logische H2/H3-Hierarchie, sprechende Linktexte, interne Verlinkung: jede Seite verlinkt Startseite, mindestens zwei Schwesterseiten und den Rechner; jede Seite endet mit dem Potenzialanalyse-CTA.
- Inhalte für KI-Suchen: Jede Seite beginnt mit einer klaren Definition/Antwort; Vergleiche als Tabellen; kurze Absätze; Abschnitt „Kurz zusammengefasst“ mit 3–5 Stichpunkten.
- Performance: Lighthouse ≥ 95 in allen Kategorien; keine Client-Komponenten außer Rechner, Formular und Mobile-Menü; Bilder als SVG oder `next/image`; Schriften über `next/font` (lokal gehostet, kein Google-Fonts-Request zur Laufzeit).
- Datenschutz: keine Tracking-Skripte, keine Cookies, kein Cookie-Banner nötig. Platzhalter-Kommentar für späteres datenschutzfreundliches Analytics (Plausible/Matomo).
- Barrierefreiheit: semantisches HTML, Labels an allen Formularfeldern, Alt-Texte, Kontrast AA.

## Code-Struktur
- `app/(site)/...` für die Seiten, `components/` für wiederverwendbare Bausteine (Section, FAQ, CTA-Band, Breadcrumbs, JsonLd, Calculator, LeadForm).
- Seiteninhalte (Texte, FAQs) in `content/*.ts` als typisierte Objekte, damit sie ohne Layoutänderung bearbeitet werden können.
- Rechenlogik des Rechners als reine Funktion in `lib/calculator.ts` (testbar), deutsches Zahlen-/Währungsformat über `Intl.NumberFormat("de-DE")`.

Schreibe vollständige, ausformulierte deutsche Texte (keine Lorem-ipsum), jeweils so, dass sie die Positionierung und die genannten Keywords natürlich enthalten.

---

## Folge-Prompts für v0 (einzeln nacheinander)

1. „Überarbeite die Startseite: Hero wirkungsvoller, mehr Weißraum, Abschnittsnummern im Editorial-Stil, prüfe, dass ‚KI im Vertrieb‘ in H1, erstem Absatz, einer H2 und der Meta-Description vorkommt.“
2. „Erweitere /ki-agenten/ auf ca. 1.500 Wörter mit Tabelle ‚Chatbot vs. Assistent vs. Agent‘ und einem Abschnitt ‚Agenten im B2B-Vertrieb – Beispiele nach Vertriebsphase‘.“
3. „Füge Unterseiten /ki-vertrieb/beispiele/ und /ki-vertrieb/b2b/ hinzu (Keywords ‚ki im vertrieb beispiele‘, ‚ki im b2b vertrieb‘), verlinkt aus der Startseite und Navigation.“
4. „Füge die Seite /workshop-ki-im-vertrieb/ hinzu (Keywords ‚ki im vertrieb seminar‘, ‚schulung‘, ‚weiterbildung‘): Inhouse-Workshop, Inhalte, Ablauf, Anfrageformular.“
5. „Prüfe alle Seiten auf: eine H1, Canonical mit Trailing Slash, gültiges JSON-LD, interne Links, Alt-Texte, Lighthouse ≥ 95.“

## Nach dem Export aus v0

- Code ins Repository übernehmen (eigener Ordner oder als `(site)`-Bereich der Plattform) – dann Rechner und Formular an die Plattform anbinden (Leads direkt ins CRM).
- Platzhalter ersetzen (Über mich, Impressum, Datenschutz), Search Console einrichten, Sitemap einreichen.
- In Cloudflare „Managed robots.txt“ deaktivieren, damit die eigene `robots.txt` gilt.
