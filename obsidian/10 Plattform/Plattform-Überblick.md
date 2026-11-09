# Plattform-Überblick
- Repo: `SEO-Agentur/vertrieb` · Doku: `docs/ARCHITEKTUR.md`
- Next.js 15 · React 19 · TypeScript · Tailwind · PostgreSQL (Prisma) · SSE · LiveKit · Anthropic · pdf-lib
- Modularer Monolith, alle Daten mit `tenantId` (später SaaS)

## Bereiche im Command Center
Dashboard · Prospecting · Unternehmen · Ansprechpartner · Qualifizierung · Recherche · Kundenwelten · Outreach ·
Aktivitäten · Live-Besucher · Videogespräche · Potenzialanalysen · Lösungen (Katalog) · Angebote · Pipeline · Aufgaben · Auswertungen · Einstellungen

## Wichtige Prinzipien
- Was Besucher sehen, legt nur `getPublicRoom()` fest → [[Kundenwelt]]
- KI-Ergebnisse = Hypothesen, menschliche Prüfung nötig
- Keine LinkedIn-Automatisierung → [[Outreach-Regeln]]
- Pipeline rückt bei Ereignissen nur vorwärts vor → [[Vertriebsprozess]]

Siehe auch [[Integrationen]], [[Datenschutz & Sicherheit]]
