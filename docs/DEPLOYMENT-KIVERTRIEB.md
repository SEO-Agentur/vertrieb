# Deployment auf app.kivertrieb.net (Server 187.77.74.66, Cloudflare)

## 1. Cloudflare
- DNS: `kivertrieb.net` A → 187.77.74.66, `app` und `www` CNAME → kivertrieb.net (alle „Proxied“) – bereits eingerichtet.
- **SSL/TLS → Overview → Modus „Full (strict)“.**
- **SSL/TLS → Origin Server → Create Certificate** (RSA, Hostnames `kivertrieb.net, *.kivertrieb.net`, 15 Jahre).
  Zertifikat als `deploy/certs/origin.pem`, privaten Schlüssel als `deploy/certs/origin.key` auf dem Server speichern.
- Optional: SSL/TLS → Edge Certificates → „Always Use HTTPS“ an.

## 2. Server vorbereiten (Ubuntu/Debian, als root)
```bash
curl -fsSL https://get.docker.com | sh
git clone https://github.com/SEO-Agentur/vertrieb /opt/vertrieb && cd /opt/vertrieb
cp deploy/env.production.example .env.production && nano .env.production   # ausfüllen
mkdir -p deploy/certs && nano deploy/certs/origin.pem && nano deploy/certs/origin.key
chmod 600 deploy/certs/origin.key .env.production
```
Firewall: nur 22, 80, 443 öffnen (z.B. `ufw allow 22,80,443/tcp && ufw enable`). Port 3000 und 5432 bleiben intern.

## 3. Starten
```bash
docker compose -f docker-compose.prod.yml --env-file .env.production up -d --build
docker compose -f docker-compose.prod.yml --env-file .env.production run --rm app npm run db:seed
```
Dann https://app.kivertrieb.net aufrufen und mit `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD` anmelden.

## 4. Updates
```bash
cd /opt/vertrieb && git pull
docker compose -f docker-compose.prod.yml --env-file .env.production up -d --build
```
Datenbank-Migrationen laufen beim Start automatisch.

## 5. Backups
```bash
docker compose -f docker-compose.prod.yml exec db pg_dump -U postgres salesplatform | gzip > backup-$(date +%F).sql.gz
```
Zusätzlich das Volume `storage` (hochgeladene Dokumente) sichern. Täglich per Cron einrichten.

## 6. Video (LiveKit)
WebRTC-Medienverkehr kann **nicht** über den Cloudflare-Proxy laufen. Empfehlung für den Start: **LiveKit Cloud** (Region EU)
→ `LIVEKIT_URL=wss://…livekit.cloud`, Key und Secret in `.env.production`, danach `up -d` erneut ausführen.
Selbst hosten ist möglich (eigene Subdomain mit „DNS only“, UDP-Ports), aber deutlich aufwendiger.

## Hinweise
- Live-Besucher (Server-Sent Events) funktionieren über Cloudflare; die App sendet alle 2,5 s ein Lebenszeichen.
- Kundenwelten werden per `X-Robots-Tag: noindex` von Suchmaschinen ausgeschlossen.
