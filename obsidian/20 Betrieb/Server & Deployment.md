# Server & Deployment
Ausführlich: `docs/DEPLOYMENT-KIVERTRIEB.md`

| | |
|---|---|
| Server | Hostinger-VPS 187.77.74.66 (geteilt mit anderen Stacks – **nicht anfassen**) |
| SSH | `ssh -i ~/.ssh/seowebsitesbuilder_vps root@187.77.74.66` (Schlüssel liegt auf dem Mac) |
| Ordner | `/opt/kivertrieb` |
| Container | `kivertrieb-db-1`, `kivertrieb-app-1`, `kivertrieb-worker-1` |
| Port | `127.0.0.1:4300` (nur lokal, Caddy davor) |
| Speicher | ca. 1,4 GB gesamt (768 + 384 + 256 MB) |
| TLS | `/etc/caddy/cf-origin-kivertrieb.crt/.key` (Cloudflare Origin) |
| Caddy | Block am Ende von `/etc/caddy/Caddyfile`, nur `reload`, nie `restart` |
| Geheimnisse | `/opt/kivertrieb/.env` (chmod 600) – **nicht** in diesen Vault |

## Regeln auf dem geteilten Server
- Keine fremden PM2-Prozesse, Container oder Caddy-Blöcke ändern
- Belegte Ports: 3000, 4000, 4100, 4200 (content-king), 5432, 5433, 6380
- `docker compose down -v` nur im Ordner `/opt/kivertrieb`

Siehe [[Wartung & Updates]]
