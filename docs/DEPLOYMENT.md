# Deployment

## Variante A: Docker (empfohlen)

1. PostgreSQL 16 bereitstellen (verwaltet oder Container), Backups aktivieren.
2. Image bauen: `docker build -t vertriebsplattform .`
3. Umgebungsvariablen gemäß `.env.example` setzen – insbesondere `APP_URL` (öffentliche HTTPS-URL), `SESSION_SECRET` (`openssl rand -hex 32`), `DATABASE_URL`.
4. Web-Container starten (führt `prisma migrate deploy` automatisch aus):
   `docker run -p 3000:3000 --env-file .env -v $(pwd)/storage:/app/storage vertriebsplattform`
5. Worker-Container mit demselben Image: `docker run --env-file .env vertriebsplattform npm run worker`
6. Ersten Admin anlegen: `docker run --env-file .env vertriebsplattform npm run db:seed` (Passwort über `SEED_ADMIN_PASSWORD`).
7. Reverse Proxy (Caddy/Nginx/Traefik) mit TLS davor. Für SSE: Response-Buffering deaktivieren (`proxy_buffering off;` bei Nginx).

`storage/` enthält hochgeladene Kundenwelt-Dokumente → persistentes Volume + Backup.

## Variante B: Node direkt

```bash
npm ci
npx prisma migrate deploy
npm run build
npm start            # Web
npm run worker       # separater Prozess (systemd/pm2)
```

## Video (LiveKit)

- **LiveKit Cloud** (einfachster Weg): Projekt anlegen, `LIVEKIT_URL` (wss://…), `LIVEKIT_API_KEY`, `LIVEKIT_API_SECRET` setzen. Region EU wählen.
- **Selbst gehostet** (maximale Datenkontrolle): https://docs.livekit.io/home/self-hosting/deployment/ – benötigt UDP-Ports und TURN/TLS.
- Lokal zum Testen: `docker compose --profile video up livekit` → `LIVEKIT_URL=ws://localhost:7880`, `LIVEKIT_API_KEY=devkey`, `LIVEKIT_API_SECRET=secret`.

## Skalierung

- Mehrere Web-Instanzen sind möglich; das In-Memory-Rate-Limiting (`src/lib/rate-limit.ts`) gilt dann je Instanz → für strikte Limits durch Redis ersetzen.
- SSE-Streams lesen den Zustand aus der Datenbank und funktionieren instanzübergreifend.
- Dateispeicher: für mehrere Instanzen `storage/` auf gemeinsames Volume oder S3-kompatiblen Speicher umstellen.

## Mandantenfähigkeit (später)

Alle Daten tragen bereits `tenantId`. Für SaaS-Betrieb fehlen: Mandanten-Registrierung, Mandantenauswahl bei Benutzern mit mehreren Mandanten, Abrechnung, Mandanten-spezifische Integrations-Zugangsdaten (heute global per ENV).
