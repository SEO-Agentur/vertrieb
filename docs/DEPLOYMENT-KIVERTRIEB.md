# Deployment auf app.kivertrieb.net (geteilter Hostinger-VPS 187.77.74.66)

Auf dem Server laufen bereits andere Produktions-Stacks (seowebsitesbuilder, accessiblewebsite, ggf. content-king).
**Nichts davon wird angefasst.** Dieser Stack:

| | |
|---|---|
| Ordner | `/opt/kivertrieb` |
| Container | `kivertrieb-db-1`, `kivertrieb-app-1`, `kivertrieb-worker-1` (Compose-Projekt `kivertrieb`) |
| Port | nur `127.0.0.1:4300` (Next.js); Postgres ohne Host-Port, nur intern |
| Speicher | 768 MB App + 384 MB DB + 256 MB Worker ≈ 1,4 GB |
| TLS | eigenes Cloudflare-Origin-Zertifikat `/etc/caddy/cf-origin-kivertrieb.crt/.key` |
| Caddy | ein Block am **Ende** von `/etc/caddy/Caddyfile`, Reload (kein Restart) |

## 1. Cloudflare (Zone kivertrieb.net)
- DNS: `kivertrieb.net` A → 187.77.74.66, `app` + `www` CNAME → kivertrieb.net, alle „Proxied“ (vorhanden).
- SSL/TLS → Overview → **Full (strict)**.
- SSL/TLS → Edge Certificates → **Always Use HTTPS** an, **Automatic HTTPS Rewrites** an.
- SSL/TLS → Origin Server → **Create Certificate** für `kivertrieb.net, *.kivertrieb.net` (Inhalt für Schritt 3 bereithalten).
- Security/Bots: **Managed robots.txt aus**.

## 2. Vorabprüfung (nur lesend)
```bash
ssh -i ~/.ssh/seowebsitesbuilder_vps root@187.77.74.66 'docker ps; pm2 list; free -h; df -h /opt; ss -tlnp | grep ":4300 "'
```
Die letzte Zeile muss leer sein (Port frei).

## 3. Einrichten (auf dem Server)
```bash
git clone https://github.com/SEO-Agentur/vertrieb /opt/kivertrieb && cd /opt/kivertrieb
cp deploy/env.production.example .env && chmod 600 .env && nano .env
nano /etc/caddy/cf-origin-kivertrieb.crt      # Origin-Zertifikat einfügen
nano /etc/caddy/cf-origin-kivertrieb.key      # privaten Schlüssel einfügen
chmod 600 /etc/caddy/cf-origin-kivertrieb.key && chown caddy:caddy /etc/caddy/cf-origin-kivertrieb.*
docker compose -f docker-compose.prod.yml up -d --build
docker compose -f docker-compose.prod.yml logs -f --tail=100     # ~60 s beobachten, dann Strg+C
docker compose -f docker-compose.prod.yml exec app npm run db:seed
```

## 4. Caddy (Block anhängen, validieren, neu laden – nicht neu starten)
```bash
cp /etc/caddy/Caddyfile /etc/caddy/Caddyfile.bak-$(date +%F-%H%M)
cat /opt/kivertrieb/deploy/Caddyfile.snippet >> /etc/caddy/Caddyfile
caddy validate --config /etc/caddy/Caddyfile && systemctl reload caddy
```
Schlägt `validate` fehl: Backup zurückkopieren, **nicht** neu laden.

## 5. Prüfen
```bash
curl -sI https://app.kivertrieb.net/login | head -1      # 200
curl -s https://app.kivertrieb.net/api/health            # {"ok":true}
docker compose -f docker-compose.prod.yml ps
docker stats --no-stream
```

## Updates
```bash
cd /opt/kivertrieb && git pull && docker compose -f docker-compose.prod.yml up -d --build --remove-orphans
```
Migrationen laufen beim Start des App-Containers automatisch.

## Backups (automatisch)
Der Container `backup` sichert täglich um 03:17 Uhr (UTC) Datenbank und Dokumente nach `/opt/kivertrieb/backups/` (14 Tage).
Manuell auslösen: `docker compose -f docker-compose.prod.yml exec backup /backup.sh`
Zusätzlich die Dateien in `backups/` regelmäßig vom Server herunterladen (z.B. per `scp`), damit eine Kopie außerhalb des Servers existiert.

Manueller Einzel-Dump:
```bash
cd /opt/kivertrieb && docker compose -f docker-compose.prod.yml exec -T db pg_dump -U postgres salesplatform | gzip > /root/kivertrieb-$(date +%F).sql.gz
```
Zusätzlich Volume `kivertrieb_storage` (hochgeladene Dokumente) sichern.

## Video & E-Mail
- **Video:** WebRTC läuft nicht über den Cloudflare-Proxy → LiveKit Cloud (Region EU), Werte in `.env`, danach `up -d`.
- **E-Mail:** Port 25 ist bei Hostinger gesperrt → Transaktionsdienst (Resend, Postmark …) per SMTP auf Port 587.

## Website auf kivertrieb.net (seit 13.11.2026)

Die Website ist Teil derselben Anwendung (`src/app/w`). Die Middleware erkennt die Domain: `kivertrieb.net` zeigt die
Website, `www.` leitet auf die Hauptdomain um, `app.kivertrieb.net` bleibt die Plattform. Anfragen aus den Formularen
landen als Unternehmen + Kontakt + Aufgabe + Benachrichtigung im CRM (Quelle „WEBSITE“).

Umstellung auf dem Server (einmalig):
```bash
cd /opt/kivertrieb && git pull && docker compose -f docker-compose.prod.yml up -d --build
cp /etc/caddy/Caddyfile /etc/caddy/Caddyfile.bak-$(date +%F-%H%M)
nano /etc/caddy/Caddyfile   # den bisherigen kivertrieb-Teil (app-Block + Redirect-Block) durch deploy/Caddyfile.snippet ersetzen
caddy validate --config /etc/caddy/Caddyfile && systemctl reload caddy
curl -sI https://kivertrieb.net/ | head -1          # 200
curl -sI https://app.kivertrieb.net/login | head -1 # 200
```
Optional in `.env`: `SITE_URL=https://kivertrieb.net`, `SITE_HOSTS=kivertrieb.net,www.kivertrieb.net` (Standardwerte).
Vor dem Livegang: Impressum, Datenschutz und „Über mich“ ersetzen (Platzhalter in `src/app/w/`).
