# Datenschutz & Sicherheit

| Anforderung | Umsetzung |
|---|---|
| Sichere Anmeldung | bcrypt (Kosten 12), Sitzungs-Token 256 Bit, nur HMAC-Hash in der DB, httpOnly/SameSite-Cookie, Login-Rate-Limit |
| Rollen | ADMIN, CONSULTANT, VIEWER; Schreibaktionen über `requireEditor()`, Einstellungen über `requireAdmin()` |
| Geschützte Kundenwelten | Zugriff nur mit gültiger Besuchersitzung (aus Einladungslink). Unbekannte/erratene Slugs und fehlende Sitzungen erhalten dieselbe neutrale Seite ohne Firmendaten |
| Einladungen | 192-Bit-Token, nur Hash gespeichert, Ablaufdatum, max. Nutzungen, widerrufbar (Widerruf beendet auch laufende Sitzungen), Token wird nach Einlösen aus der URL entfernt |
| Verifizierter vs. eingeladener Besucher | Optional E-Mail-Code (gehasht, 5 Versuche, Ablaufzeit). Ohne Verifizierung heißt der Besucher im System stets „eingeladener Besucher“ |
| Einwilligungen | Banner beim ersten Besuch: Anwesenheit anzeigen / Abschnitts-Nutzung erfassen / nur ansehen. Ohne Einwilligung kein Heartbeat, keine Abschnitts-Events. Keine IP-Adressen gespeichert |
| Video | Kamera/Mikrofon standardmäßig aus, kein automatischer Beitritt, Live-Gespräch nur nach Annahme durch den Besucher. Keine Aufzeichnung implementiert; Einwilligungsfelder vorbereitet |
| Gemeinsames Navigieren | nur nach ausdrücklicher Zustimmung, jederzeit beendbar, keine Fernsteuerung – nur Scroll-Synchronisation |
| Trennung intern/extern | zentrale Projektion `getPublicRoom()`; interne Dokumente nur mit Sichtbarkeit `ROOM` downloadbar |
| Audit-Log | Anmeldungen, Änderungen, Einladungen, Annahmen, Bereinigungen |
| Löschung & Fristen | Unternehmen vollständig löschbar (Kaskade), Worker setzt Fristen durch (Events, Sitzungen, disqualifizierte Unternehmen) |
| Prompt Injection | externe Inhalte als `<untrusted_data>`, Zod-validierte strukturierte Ausgaben, keine Tool-Ausführung, Ergebnisse nur als Hypothese |
| Eingabevalidierung | Zod in allen öffentlichen Endpunkten, Formularfelder serverseitig normalisiert |
| Rate Limiting | Login, Einladungslinks, Verifizierungscodes, Besucher-Endpunkte (In-Memory; für Mehrinstanzbetrieb Redis einsetzen) |
| Externe Nachrichten | LinkedIn-Nachrichten: Entwurf → Freigabe → manueller Versand → Dokumentation. Kein automatischer Versand |
| Header | X-Robots-Tag noindex für Kundenwelten, Referrer-Policy no-referrer für Einladungslinks, Permissions-Policy für Kamera/Mikrofon |

**Hinweis:** Die technische Umsetzung ersetzt keine rechtliche Prüfung (Datenschutzerklärung, Auftragsverarbeitung mit KI-/Video-Anbietern, Rechtsgrundlage der Besuchererfassung).
