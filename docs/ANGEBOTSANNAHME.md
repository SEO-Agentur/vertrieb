# Elektronische Angebotsannahme in der Kundenwelt

## Ablauf
1. Der Berater veröffentlicht ein Angebot (Status `PUBLISHED`) in der Kundenwelt.
2. Der Interessent öffnet es über seine persönliche, eingeladene Sitzung (`/room/<slug>/offers/<id>`).
   Bei aktivierter E-Mail-Verifizierung ist die Sitzung zusätzlich an eine bestätigte E-Mail-Adresse gebunden.
3. Zur Annahme gibt der Interessent **Vor- und Nachname, E-Mail und Funktion** an und bestätigt ausdrücklich
   - „Ich bin berechtigt, für <Firma> verbindlich zu bestellen.“ und
   - den angezeigten Wortlaut der Annahmeerklärung (`acceptanceDeclaration()` in `src/lib/offer-acceptance.ts`).
4. Die Annahme ist nur für Angebote im Status `PUBLISHED` und innerhalb der Gültigkeit möglich (atomare Statusänderung – keine Doppelannahme).

## Was dokumentiert wird
| Feld | Inhalt |
|---|---|
| `acceptedAt` | Zeitpunkt (Serverzeit) |
| `acceptedByName`, `acceptedByEmail`, `acceptedRole` | Angaben des Annehmenden |
| `acceptanceText` | exakter Wortlaut der abgegebenen Erklärung |
| `acceptanceHash` | SHA-256 über Abschnitte, Positionen, Angebotsnummer und Version – belegt, welcher Inhalt angenommen wurde |
| `acceptanceSessionId` | Besuchersitzung (verknüpft mit Einladung und ggf. verifizierter E-Mail) |
| `AuditLog` (`offer.accepted`) | inkl. Hash und verifizierter E-Mail der Sitzung |

Angebote werden nach Veröffentlichung nicht überschrieben; Änderungen erfolgen über neue Versionen. Das PDF des Angebots enthält nach Annahme einen Annahmevermerk mit Prüfsumme.

## Rechtliche Einordnung (Hinweis, keine Rechtsberatung)
- Die Annahme erfolgt als einfache elektronische Erklärung (vergleichbar Textform, § 126b BGB). Für B2B-Dienst- und Werkverträge ist in der Regel keine besondere Form vorgeschrieben.
- Es handelt sich **nicht** um eine qualifizierte elektronische Signatur (eIDAS). Wo Schriftform vereinbart oder gesetzlich erforderlich ist, genügt dieses Verfahren nicht.
- Die Vertretungsberechtigung wird nur durch Erklärung des Annehmenden bestätigt, nicht geprüft. Bei größeren Aufträgen empfiehlt sich eine zusätzliche Auftragsbestätigung.
- AGB müssen vor Annahme einbezogen werden (z. B. als Dokument in der Kundenwelt bzw. Abschnitt „Voraussetzungen“).
- **Empfehlung:** Wortlaut, AGB-Einbeziehung und Prozess vor dem Produktiveinsatz anwaltlich prüfen lassen.
