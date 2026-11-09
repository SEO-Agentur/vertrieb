# KI-gestützte B2B-Vertriebsplattform mit persönlichen Kundenwelten

> „Wir wissen nicht im Voraus, wo ein Unternehmen durch KI profitieren kann. Wir finden es gemeinsam heraus und entwickeln anschließend die passende Lösung.“

Interne Vertriebssteuerung (Sales Command Center) plus persönliche, geschützte **Kundenwelten** für jeden Interessenten:

**LinkedIn-Prospecting → Qualifizierung → Kundenwelt → persönliche Ansprache → Besuch → Live-Videoberatung → gemeinsame Potenzialanalyse → Lösung → Wirtschaftlichkeit → Angebot → Abschluss**

## Schnellstart (lokal)

Voraussetzungen: Node 22, PostgreSQL 16 (oder `docker compose up db`).

```bash
cp .env.example .env          # DATABASE_URL, SESSION_SECRET setzen
npm install
npx prisma migrate deploy
npm run db:seed               # Admin, Pipeline-Phasen, Lösungskatalog (SEED_DEMO=1 → 2 fiktive Demo-Firmen)
npm run dev                   # http://localhost:3000
```

Anmeldung mit `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD` (Standard nur für lokal: `berater@example.com` / `Vertrieb2026!` – sofort ändern).

Optional: `npm run worker` (Bereinigung nach Aufbewahrungsfristen, Follow-up-Hinweise).

## Tests

```bash
npm test             # Unit-Tests (Scoring, Rechner, Import, Normalisierung, Angebotssummen)
npm run typecheck
npm run test:e2e     # End-to-End-Szenario „Müller Maschinenbau GmbH“ (fiktiv) gegen laufende App
```

`npm run test:e2e` erwartet eine laufende App unter `E2E_BASE_URL` (Standard http://localhost:3000) mit geseedeter Datenbank.

## Dokumentation

- [docs/STATUS.md](docs/STATUS.md) – **was funktioniert, was Zugangsdaten benötigt**
- [docs/ARCHITEKTUR.md](docs/ARCHITEKTUR.md) – Aufbau, Datenmodell, Entscheidungen
- [docs/DATENSCHUTZ-SICHERHEIT.md](docs/DATENSCHUTZ-SICHERHEIT.md)
- [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md)
- [docs/ANGEBOTSANNAHME.md](docs/ANGEBOTSANNAHME.md) – elektronische Angebotsannahme

## Technologie

Next.js 15 · React 19 · TypeScript · Tailwind CSS · PostgreSQL · Prisma · Server-Sent Events · LiveKit (WebRTC) · Anthropic Claude (austauschbar) · pdf-lib · Docker
