# Konzept: kivertrieb.net – SEO-Website mit Kundenportal

**Ziel:** Entscheider im deutschen B2B-Mittelstand finden kivertrieb.net über Google und KI-Suchen, nutzen kostenlose Werkzeuge
zur Verbesserung ihres Vertriebs und werden darüber zu qualifizierten Leads für die gemeinsame Potenzialanalyse.

**Positionierung (unverändert):** „Wir wissen nicht im Voraus, wo ein Unternehmen durch KI profitieren kann. Wir finden es gemeinsam heraus
und entwickeln anschließend die passende Lösung.“ – keine Tool-Verkaufsseite, keine Renditeversprechen.

Datenbasis: Ahrefs-Export „übereinstimmende Begriffe“ zu *ki vertri…*, Google DE, Stand 09.11.2026 (98 Keywords).

---

## 1. Keyword-Analyse

Das Gesamtvolumen ist klein (≈ 3.000 Suchen/Monat in DE), aber hochwertig: Wer „KI im B2B-Vertrieb“ sucht, ist fast immer
Vertriebsleiter, Geschäftsführer oder Berater. Für ein Beratungsangebot mit Projektgrößen im fünfstelligen Bereich reichen wenige Leads.

### Die wichtigsten Erkenntnisse

| Erkenntnis | Daten | Konsequenz |
|---|---|---|
| Das Hauptkeyword ist leicht | „ki im vertrieb“: 600/Monat, **KD 1**, Traffic-Potenzial 300 | Säulenseite mit hoher Qualität kann realistisch Top 3 erreichen |
| „ki vertrieb“ ist umkämpfter | 200/Monat, KD 53 | gleiche Säulenseite, langfristiges Ziel |
| **KI-Agenten wachsen stark** | „ki agenten im vertrieb“ 0 → 143 in 12 Monaten (KD 0); „ki agenten vertrieb“ 27 → 124 | früh eigene Seite besetzen – größter Hebel |
| Beispiele/Use Cases gefragt | „beispiele“ 100 (zuletzt 197), „nutzen“ 100, „einsetzen“ 60, „use cases“ 30 | Beispielseite mit konkreten, ehrlichen Szenarien |
| B2B-Spezifisch | „ki im b2b vertrieb“ 100 (KD 3) + Varianten ≈ 200 | eigene B2B-Seite (passt exakt zur Zielgruppe) |
| Tools | „ki tools vertrieb“ 200 (KD 45) + Varianten ≈ 400 | neutraler Tool-Überblick – Einstieg für Vergleichs-Suchende |
| Weiterbildung = kaufbereit | seminar / schulung / weiterbildung / kurs / inhouse ≈ 250 | **Workshop-Angebot** als Produktseite |
| Bedenken | „ki bedenken vertrieb“ 90 (rückläufig) | Seite „Risiken, Datenschutz, Grenzen“ – stärkt Vertrauen |
| Mittelstand & Branchen | „ki vertrieb mittelstand“, „beste ki-lösung für vertrieb im mittelstand“, „großhandel“, „technischer vertrieb“, „maschinenbau“ | geringes Volumen, **höchste Kaufabsicht** → Branchenseiten |
| AI Overviews | erscheinen bei „ki im vertrieb“ und „ki vertrieb“ | GEO: klare Definitionen, Listen, Tabellen, Quellen |

### Keyword-Cluster → Seiten

| Cluster | Keywords (Volumen) | Zielseite |
|---|---|---|
| **Säule** | ki im vertrieb (600), ki vertrieb (200), ki für vertrieb (90), vertrieb ki (80), ki für den vertrieb (30), ki in vertrieb, ki und vertrieb, ki-gestützter vertrieb | `/ki-im-vertrieb/` |
| Beispiele & Einsatz | beispiele (100), nutzen (100), einsetzen (60), einsatz von ki (30), use cases (30), wie kann ich ki im vertrieb nutzen, was bringt ki im b2b-vertrieb konkret | `/ki-im-vertrieb/beispiele/` |
| B2B | ki im b2b vertrieb (100), b2b vertrieb ki (40), ki im vertrieb b2b (30), ki im b2b-vertrieb (20), ki für b2b vertrieb | `/ki-im-vertrieb/b2b/` |
| KI-Agenten | ki agenten im vertrieb (100 ↑), ki agenten vertrieb (50 ↑), vertrieb ki agenten (20), was ist ein ki-agent für den vertrieb, ki agenten für den vertrieb | `/ki-agenten-vertrieb/` |
| Tools | ki tools vertrieb (200), ki tools für vertrieb (50), die besten ki-tools im vertrieb (40), ki software vertrieb (40), ki tools im vertrieb (30), ki-tools b2b-vertrieb deutschland (30) | `/ki-tools-vertrieb/` |
| Assistent & Chatbot | ki assistent vertrieb (30), ki chatbot für vertrieb (20) | `/ki-assistent-vertrieb/` |
| Generative KI | generative ki im vertrieb (70), generative ki für den vertrieb | `/ki-im-vertrieb/generative-ki/` |
| Bedenken | ki bedenken vertrieb (90) | `/ki-im-vertrieb/risiken-datenschutz/` |
| Weiterbildung | seminar (50+50+30), weiterbildung (40), schulung, kurs, inhouse schulung | `/workshop-ki-im-vertrieb/` |
| Mittelstand | ki vertrieb mittelstand, beste ki-lösung für vertrieb im mittelstand (+ Varianten) | `/ki-im-vertrieb/mittelstand/` |
| Marketing + Vertrieb | ki im marketing und vertrieb, marketing und vertrieb mit ki verbinden (Saisonspitze) | Abschnitt auf Säule, keine eigene Seite |
| Branchen | großhandel (20), technischer vertrieb, maschinenbau, logistik | `/branchen/<branche>/` |

**Nicht bedienen:** „ki vertrieb jobs“ (Jobsuche), Marken-Keywords fremder Anbieter (Sage, Amplifa, Personennamen), „buch“.

**Ergänzende Recherche empfohlen** (nicht im Export enthalten): *ki leadgenerierung, ki angebotserstellung, crm ki, vertriebsautomatisierung,
ki leadqualifizierung, ki cross selling, sales intelligence, ki kaltakquise* – diese passen zu den Anwendungsfall-Seiten.

---

## 2. Seitenstruktur

```
kivertrieb.net/
├── /                                   Startseite – „KI im Vertrieb für den B2B-Mittelstand“
├── /ki-im-vertrieb/                    SÄULE (Ratgeber, 3.000–4.000 Wörter, Inhaltsverzeichnis, FAQ)
│   ├── /beispiele/                     15–20 konkrete Szenarien, nach Vertriebsphase sortiert
│   ├── /b2b/                           Besonderheiten B2B (lange Zyklen, Buying Center, Angebote)
│   ├── /mittelstand/                   Wo anfangen, Budget, Entscheidungswege
│   ├── /generative-ki/
│   └── /risiken-datenschutz/           Bedenken, DSGVO, EU AI Act, menschliche Freigabe
├── /ki-agenten-vertrieb/               Was sind KI-Agenten, was können sie heute realistisch
├── /ki-tools-vertrieb/                 Neutraler Überblick nach Kategorien (Recherche, CRM, Gespräch, Angebot)
├── /ki-assistent-vertrieb/
├── /anwendungsfaelle/                  aus dem Lösungskatalog der Plattform gespeist
│   ├── /leadqualifizierung/
│   ├── /angebotserstellung/
│   ├── /bestandskunden-cross-selling/
│   ├── /crm-automatisierung/
│   └── /leadgenerierung/
├── /branchen/                          je Branche: typische Vertriebsabläufe + mögliche Themen
│   ├── /maschinenbau/  /technischer-grosshandel/  /industriebedarf/  /zulieferer/
│   ├── /verpackungsindustrie/  /b2b-logistik/  /it-systemhaus/  /personaldienstleister/
├── /werkzeuge/                         KUNDENPORTAL-Einstieg (siehe Kap. 3)
│   ├── /umsatzpotenzial-rechner/       0,05 %-Rechner (öffentlich, verlinkbar)
│   ├── /vertriebs-check/               KI-Reifegrad-Check
│   └── /use-case-finder/
├── /potenzialanalyse/                  Kernangebot + Ablauf + Termin
├── /workshop-ki-im-vertrieb/           Inhouse-Workshop / Seminar (kommerzielles Keyword)
├── /ueber-mich/                        E-E-A-T: Person, Erfahrung, Arbeitsweise
├── /glossar/                           KI-Agent, LLM, RAG, Lead-Scoring … (kurze Definitionen für KI-Suchen)
├── /kontakt/  /impressum/  /datenschutz/
└── app.kivertrieb.net                  Plattform (noindex)
```

**Interne Verlinkung:** Jede Unterseite verlinkt zur Säule und zu 2–3 Geschwisterseiten; jede Inhaltsseite endet mit einem passenden
Werkzeug (Rechner, Check) und der Potenzialanalyse. Branchenseiten verlinken die passenden Anwendungsfälle und umgekehrt.

**Fallstudien:** erst veröffentlichen, wenn echte, freigegebene Projekte vorliegen. Bis dahin „Beispielszenarien“ – klar als solche benannt.

---

## 3. Kundenportal: Werkzeuge, die Besucher wirklich nutzen

Das Portal ist der Self-Service-Zugang zur bestehenden Plattform. Die eingeladene Kundenwelt (Outbound) bekommt damit ein
Gegenstück für Inbound-Besucher – auf derselben Technik und mit demselben CRM.

### Stufe 1 – ohne Anmeldung (SEO-Assets, verlinkbar)

| Werkzeug | Nutzen für Besucher | SEO-/Vertriebsnutzen |
|---|---|---|
| **Umsatzpotenzial-Rechner** | „Was bedeuten 0,05 % mehr Umsatz für uns?“ inkl. Deckungsbeitrag, Kosten, Amortisation | Linkable Asset, Einstieg in die Kernbotschaft |
| **Vertriebs-Check** (12–15 Fragen, 5 Minuten) | Einordnung je Bereich: Neukunden, Prozesse, Bestandskunden, Daten, Automatisierung | Ergebnis gibt Hinweise statt Diagnosen; Lead-Qualifizierung |
| **Use-Case-Finder** | Branche + Rolle + Herausforderung wählen → passende Anwendungsfälle | Nutzt den Lösungskatalog; interne Links zu Anwendungsfall-Seiten |

### Stufe 2 – mit kostenloser Anmeldung (E-Mail-Bestätigung)

- **Persönliche Kundenwelt (Self-Service):** Unternehmen eintragen → eigene Kundenwelt mit gespeicherten Rechner-Ergebnissen, Check-Auswertung,
  passenden Themen als Hypothesen und Button „Gemeinsame Potenzialanalyse anfragen“.
- **Ergebnisbericht als PDF** (Check + Rechner) zum internen Weitergeben – wichtig für Buying Center im Mittelstand.
- **Prompt-Bibliothek für den Vertrieb** (Gesprächsvorbereitung, Angebotsentwürfe, Follow-ups) mit Datenschutzhinweisen.
- **Vorlagen:** Lastenheft „KI im Vertrieb“, Checkliste Datenschutz/AI Act, Business-Case-Vorlage.

### Stufe 3 – Beratungskunden (bestehende Plattform)

Live-Videoberatung, gemeinsame Potenzialanalyse, freigegebene Lösungen, Angebot, Projektstatus – unverändert wie implementiert.

### Grundsätze

- Keine erfundenen Benchmarks: Der Check vergleicht nicht mit „Branchendurchschnitten“, solange keine echten Daten vorliegen.
- Ergebnisse sind Hinweise und Gesprächsthemen, keine Diagnose.
- KI-Funktionen nur, wenn ein Provider aktiv ist; sonst regelbasiert und so gekennzeichnet.
- Einwilligung für Newsletter getrennt von der Anmeldung (Double-Opt-in).

---

## 4. Technik-Empfehlung: Next.js statt WordPress

| Kriterium | Next.js (bestehende Plattform erweitern) | WordPress (+ WopCart) |
|---|---|---|
| Werkzeuge/Portal | direkt in derselben Anwendung, gemeinsame Datenbank und CRM | Rechner/Check als Plugin oder iFrame, Daten müssen ins CRM synchronisiert werden |
| Ein Login für Portal + Kundenwelt | ja | zwei Systeme, zwei Logins |
| Core Web Vitals | statisch generierte Seiten, sehr schnell | gut erreichbar, braucht Caching/Optimierung |
| Programmatische Seiten (Branchen, Anwendungsfälle) | direkt aus dem Lösungskatalog der Datenbank | eigener Import-Prozess |
| Redaktion ohne Entwickler | braucht eingebautes Content-Modul oder Markdown/MDX | stärkste Seite von WordPress |
| Sicherheit auf dem geteilten VPS | ein Container, keine Plugins | PHP + Plugins = zusätzliche Angriffsfläche, Updates |
| Betrieb | ein Deployment, ein Backup | zweiter Stack (PHP, MySQL) auf dem Server |

**Empfehlung:** Website und Portal in **Next.js als Teil der bestehenden Anwendung** (eigener Bereich `kivertrieb.net`, Plattform weiter unter `app.`).
Seiteninhalte als Markdown/MDX im Repository oder über ein kleines Content-Modul im Admin-Bereich.

**WordPress lohnt sich nur,** wenn regelmäßig mehrere Personen ohne technische Kenntnisse Artikel schreiben sollen. Dann: WordPress nur für
den Ratgeber/Blog auf `kivertrieb.net`, alle Werkzeuge und das Portal bleiben in der Next.js-Plattform.

**WopCart:** Ein Shop-System wird nicht gebraucht – verkauft wird Beratung über individuelle Angebote, nicht über einen Warenkorb.
Sinnvoll wäre es höchstens später für standardisierte Produkte (z.B. buchbarer Workshop zum Festpreis). *Hinweis: Der genaue
Funktionsumfang von WopCart ist mir nicht bekannt – diese Einschätzung gilt für Shop-Systeme allgemein.*

---

## 5. Technisches SEO & GEO (KI-Suchen)

- Statisch generierte Seiten, saubere URLs mit Trailing-Slash-Konvention, kanonische URLs, XML-Sitemap, `robots.txt`
  (in Cloudflare „Managed robots.txt“ deaktivieren), `app.kivertrieb.net` bleibt `noindex`.
- Strukturierte Daten: `Organization`, `Person` (Autor), `ProfessionalService`/`Service`, `BreadcrumbList`, `FAQPage`,
  `WebApplication` für Rechner und Check, `Article` mit Autor und Aktualisierungsdatum.
- **GEO:** Jede Seite beginnt mit einer 2–3-Satz-Definition oder Antwort; Listen und Tabellen statt Fließtext für Vergleiche;
  Quellen verlinken; klare Autorenschaft; `llms.txt` mit Seitenübersicht.
- Core Web Vitals: LCP < 2,0 s, keine Layout-Sprünge, Schriften lokal, Bilder als AVIF/WebP.
- Messung: Google Search Console + datenschutzfreundliche Analyse (Plausible oder Matomo, selbst gehostet), Ziele:
  Rechner genutzt, Check abgeschlossen, Registrierung, Potenzialanalyse angefragt.
- E-E-A-T: echte Person mit Foto, Werdegang, LinkedIn; Impressum; transparente Arbeitsweise; Aktualisierungsdatum je Artikel.

---

## 6. Umsetzungsplan

| Phase | Inhalt | Ergebnis |
|---|---|---|
| **1 – Fundament (2 Wochen)** | Design, Startseite, Säule „KI im Vertrieb“, Potenzialanalyse, Über mich, Kontakt, Rechtliches, technisches SEO, Rechner öffentlich | indexierbare Website mit Kernangebot |
| **2 – Cluster (3–4 Wochen)** | KI-Agenten, Beispiele, B2B, Tools, Risiken/Datenschutz, Workshop-Seite, Glossar | Abdeckung aller Keyword-Cluster |
| **3 – Portal (3 Wochen)** | Vertriebs-Check, Use-Case-Finder, Self-Service-Registrierung mit eigener Kundenwelt, PDF-Bericht | Inbound-Leads direkt in der Pipeline |
| **4 – Skalierung (laufend)** | Branchen- und Anwendungsfall-Seiten aus dem Katalog, Prompt-Bibliothek, Vorlagen, Fallstudien sobald vorhanden | Long-Tail und Vertrauen |

**Erfolgskennzahlen (realistisch, nach 6 Monaten):** Top 3 für „ki im vertrieb“, Top 10 für „ki agenten vertrieb“ und „ki im b2b vertrieb“,
Nutzung der Werkzeuge, Anzahl angefragter Potenzialanalysen. Keine Traffic-Versprechen – das Volumen der Nische ist begrenzt.
