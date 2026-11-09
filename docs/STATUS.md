# Status: Was funktioniert, was Zugangsdaten braucht

*Stand: 09.11.2026 · geprüft mit `npm test` (24 Unit-Tests), `npm run typecheck`, Produktions-Build und `npm run test:e2e`*

## Verbindlicher End-to-End-Test „Müller Maschinenbau GmbH“ (fiktiv)

`npm run test:e2e` führt den kompletten Vertriebsprozess mit zwei Browsern (Berater + Interessent) gegen die laufende App aus,
mit persistenten Daten. Letzter Lauf: **26/26 Schritte erfolgreich.**

| # | Schritt | Ergebnis |
|---|---|---|
| 1 | Unternehmen importieren (CSV) | ✔ |
| 2 | Ansprechpartner anlegen (aus Import) | ✔ |
| 3 | Unternehmen qualifizieren | ✔ Score wird berechnet und begründet |
| 4 | Recherche durchführen | ✔ regelbasiert (KI nicht aktiviert) |
| 5 | Verbesserungsthemen erhalten | ✔ als ungeprüfte Hypothesen |
| 6 | Recherche prüfen | ✔ |
| 7 | Persönliche Kundenwelt erstellen | ✔ |
| 8 | Umsatzpotenzial-Rechner konfigurieren | ✔ |
| 9 | Sicheren Einladungslink erzeugen | ✔ |
| 10 | LinkedIn-Nachricht vorbereiten | ✔ Entwurf → Freigabe |
| 11 | Kontaktaufnahme dokumentieren | ✔ manueller Versand dokumentiert |
| 12 | Kundenwelt als Interessent öffnen | ✔ ohne Einladung gesperrt, Token verschwindet aus der URL |
| 13 | Besucherbenachrichtigung | ✔ nach Einwilligung des Besuchers |
| 14 | Videogespräch anbieten | ✔ |
| 15 | Gespräch als Interessent annehmen | ✔ |
| 16 | Echte Videoverbindung | **nicht aktiviert** – LiveKit-Zugangsdaten fehlen, wird korrekt so angezeigt |
| 17 | Bildschirm teilen | **nicht getestet** – setzt aktiviertes Video voraus |
| 18 | Gemeinsam navigieren | ✔ nur nach Zustimmung, jederzeit beendbar |
| 19 | Vertriebsprobleme dokumentieren | ✔ |
| 20 | Passende Lösungen auswählen | ✔ |
| 21 | Wirtschaftlichkeitsrechnung | ✔ mit offengelegten Annahmen |
| 22 | Individuelles Angebot erzeugen | ✔ Positionen aus den gewählten Lösungen |
| 23 | Angebot in der Kundenwelt veröffentlichen | ✔ |
| 24 | Angebot als Interessent öffnen und annehmen | ✔ inkl. PDF |
| 25 | CRM-Status aktualisieren | ✔ Phase „Gewonnen“, Projekt angelegt |

Zusätzlich im Browser getestet: Telefon-Arbeitsliste und KI-Gesprächsleitfaden (regelbasierter Modus) inkl. Wiedervorlage.

## Funktioniert ohne weitere Zugangsdaten

Anmeldung & Rollen · Unternehmen, Kontakte, CSV-Import mit Dublettenprüfung · gespeicherte Sales-Navigator-Suchen ·
Qualifizierung & Lead-Scoring (konfigurierbar) · regelbasierte Recherche · Kundenwelten mit Einladungen, Einwilligung,
optionaler E-Mail-Verifizierung (Code im Postausgang, solange kein SMTP), Live-Besucheranzeige, Live-Gesprächsangebot,
gemeinsamem Navigieren · Outreach-Vorbereitung · Telefonleitfaden · Potenzialanalyse, Lösungskatalog, Wirtschaftlichkeit ·
Angebote mit Versionen, PDF und dokumentierter Annahme · Pipeline (Kanban/Tabelle) · Aufgaben · Auswertungen ·
Datenschutz-Einstellungen, Bereinigung, Audit-Log · Backups (Produktion).

## Benötigt Zugangsdaten (als „nicht aktiviert“ gekennzeichnet)

| Funktion | Umgebungsvariablen | Ohne Zugangsdaten |
|---|---|---|
| KI-Recherche, KI-Gesprächsassistent, KI-Telefonleitfaden, KI-Umformulierung | `ANTHROPIC_API_KEY` | regelbasiert, klar gekennzeichnet |
| Videoberatung inkl. Bildschirmfreigabe | `LIVEKIT_URL`, `LIVEKIT_API_KEY`, `LIVEKIT_API_SECRET` | Hinweis + Terminvereinbarung |
| E-Mail-Versand (Verifizierungscodes) | `SMTP_*` | Postausgang mit Status NOT_CONFIGURED |
| SEO-Scanner-API | `SEO_SCANNER_API_URL`, `SEO_SCANNER_API_KEY` | manueller JSON-/CSV-Import |

## Bewusst nicht umgesetzt

- LinkedIn-Automatisierung (Scraping, automatischer Versand) – verstößt gegen Nutzungsbedingungen
- Aufzeichnung/Transkription von Gesprächen – nur Einwilligungsfelder vorhanden
- Stimmungs-/Emotionsanalyse

## Bekannte Grenzen

- Rate-Limiting im Arbeitsspeicher (eine Instanz); für mehrere Instanzen Redis einsetzen
- Gesprächsleitfaden wird als JSON bearbeitet (kein grafischer Editor)
- Mandantenfähigkeit im Datenmodell vorbereitet, aber keine Selbstregistrierung/Abrechnung
- Rechtliche Prüfung offen: Datenschutzerklärung, Angebotsannahme (`docs/ANGEBOTSANNAHME.md`), AV-Verträge
