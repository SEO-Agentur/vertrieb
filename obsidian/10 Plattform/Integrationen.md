# Integrationen
| Integration | Status | Benötigt (in `/opt/kivertrieb/.env`) |
|---|---|---|
| KI (Anthropic, Modell `claude-opus-5-5`) | nicht aktiviert | `ANTHROPIC_API_KEY` |
| Video (LiveKit Cloud, EU) | nicht aktiviert | `LIVEKIT_URL`, `LIVEKIT_API_KEY`, `LIVEKIT_API_SECRET` |
| E-Mail (Resend/Postmark) | nicht aktiviert | `SMTP_HOST`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM` (Port 587) |
| SEO-Scanner guaranteedseoservices.com | API ungeklärt, manueller Import geht | `SEO_SCANNER_API_URL`, `SEO_SCANNER_API_KEY` |
| LinkedIn / Sales Navigator | bewusst keine API-Automatisierung | – (CSV-Import, manuelle URLs) |

Ohne Zugangsdaten zeigt die Plattform „nicht aktiviert“ – keine simulierten Ergebnisse.
Nach Änderungen: `docker compose -f docker-compose.prod.yml up -d`
Status live prüfen: Einstellungen → Integrationen.
