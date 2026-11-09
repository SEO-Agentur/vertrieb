# Wartung & Updates
```bash
ssh -i ~/.ssh/seowebsitesbuilder_vps root@187.77.74.66
cd /opt/kivertrieb
git pull && docker compose -f docker-compose.prod.yml up -d --build --remove-orphans
docker compose -f docker-compose.prod.yml ps
curl -s http://127.0.0.1:4300/api/health
```

## Logs
`docker compose -f docker-compose.prod.yml logs app --tail=100`

## Backup
`docker compose -f docker-compose.prod.yml exec -T db pg_dump -U postgres salesplatform | gzip > /root/kivertrieb-$(date +%F).sql.gz`
+ Volume `kivertrieb_storage`. Automatisierung: offen (Asana).

## Lokale Entwicklung (Mac)
`cd vertrieb && docker compose up -d db && npm run dev` → http://localhost:3000
Bei seltsamen Fehlern nach `git pull`: `rm -rf .next` und neu starten.
