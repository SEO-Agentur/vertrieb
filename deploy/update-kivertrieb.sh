#!/usr/bin/env bash
# Update von kivertrieb.net auf dem Server – in einem Durchgang:
#   1. Code holen und Container neu bauen
#   2. Warten, bis die App gesund ist
#   3. Caddy umstellen (kivertrieb-Blöcke ersetzen) – mit Backup, Prüfung, Rückfrage und Rollback
#   4. Ergebnis prüfen
# Aufruf auf dem Server (als root):  cd /opt/kivertrieb && git pull && bash deploy/update-kivertrieb.sh
# Andere Projekte und deren Caddy-Blöcke werden nicht verändert.
set -euo pipefail

APP_DIR=/opt/kivertrieb
CADDYFILE=/etc/caddy/Caddyfile
COMPOSE="docker compose -f docker-compose.prod.yml"
STAMP=$(date +%F-%H%M%S)

say() { printf '\n\033[1;34m▶ %s\033[0m\n' "$*"; }
ok() { printf '\033[1;32m✔ %s\033[0m\n' "$*"; }
fail() { printf '\033[1;31m✘ %s\033[0m\n' "$*"; exit 1; }

[ "$(id -u)" = 0 ] || fail "Bitte als root ausführen."
cd "$APP_DIR" || fail "$APP_DIR nicht gefunden."
[ -f .env ] || fail ".env fehlt in $APP_DIR."

say "1/4 Code aktualisieren und Container bauen"
git pull --ff-only
$COMPOSE up -d --build --remove-orphans
ok "Container gestartet"

say "2/4 Warte auf die App (max. 3 Minuten)"
for i in $(seq 1 36); do
  if curl -fsS http://127.0.0.1:4300/api/health >/dev/null 2>&1; then ok "App antwortet auf 127.0.0.1:4300"; break; fi
  [ "$i" = 36 ] && { $COMPOSE logs app --tail=60; fail "App antwortet nicht – Logs oben. Caddy wurde NICHT verändert."; }
  sleep 5
done

say "3/4 Caddy umstellen"
[ -f /etc/caddy/cf-origin-kivertrieb.crt ] && [ -f /etc/caddy/cf-origin-kivertrieb.key ] || fail "Zertifikat /etc/caddy/cf-origin-kivertrieb.* fehlt."
BACKUP="$CADDYFILE.bak-$STAMP"
NEW="$(mktemp /tmp/Caddyfile.kivertrieb.XXXXXX)"
cp "$CADDYFILE" "$BACKUP"
ok "Backup: $BACKUP"

# Entfernt nur Blöcke auf oberster Ebene, deren Adresszeile kivertrieb.net enthält, sowie die alte Kommentarzeile,
# und hängt den aktuellen Block aus deploy/Caddyfile.snippet an.
python3 - "$CADDYFILE" "$APP_DIR/deploy/Caddyfile.snippet" "$NEW" <<'PY'
import re, sys
src, snippet, out = sys.argv[1:4]
lines = open(src, encoding="utf-8").read().split("\n")
result, i, removed = [], 0, []
while i < len(lines):
    line = lines[i]
    stripped = line.strip()
    if stripped.startswith("#") and "kivertrieb" in stripped:
        i += 1
        continue
    # Kopfzeile eines Site-Blocks auf oberster Ebene: "adresse[, adresse] {"
    if not line.startswith((" ", "\t")) and stripped.endswith("{") and stripped != "{":
        addresses = [a.strip() for a in stripped[:-1].split(",")]
        if any(re.fullmatch(r"(https?://)?([a-z0-9-]+\.)*kivertrieb\.net(:\d+)?", a) for a in addresses):
            depth = line.count("{") - line.count("}")
            j = i + 1
            while j < len(lines) and depth > 0:
                depth += lines[j].count("{") - lines[j].count("}")
                j += 1
            if depth != 0:
                sys.exit("Klammern im Caddyfile nicht ausgeglichen – Abbruch, nichts verändert.")
            removed.append(stripped)
            i = j
            continue
    result.append(line)
    i += 1
text = "\n".join(result).rstrip("\n") + "\n\n" + open(snippet, encoding="utf-8").read().strip("\n") + "\n"
text = re.sub(r"\n{3,}", "\n\n", text)
open(out, "w", encoding="utf-8").write(text)
print("Entfernte kivertrieb-Blöcke:", removed if removed else "keine")
PY

echo "── Änderungen (alt → neu) ──"
diff -u "$CADDYFILE" "$NEW" || true

caddy validate --config "$NEW" --adapter caddyfile >/dev/null 2>&1 || { caddy validate --config "$NEW" --adapter caddyfile; fail "Neue Konfiguration ungültig – Caddy wurde NICHT verändert."; }
ok "Neue Konfiguration ist gültig"

read -r -p "Caddy jetzt mit dieser Konfiguration neu laden? [j/N] " answer
if [[ ! "$answer" =~ ^[jJyY]$ ]]; then
  echo "Abgebrochen. Vorschlag liegt unter $NEW – nichts verändert."
  exit 0
fi
cp "$NEW" "$CADDYFILE"
if ! systemctl reload caddy; then
  cp "$BACKUP" "$CADDYFILE"
  systemctl reload caddy || true
  fail "Reload fehlgeschlagen – alte Konfiguration wiederhergestellt."
fi
ok "Caddy neu geladen (reload, kein Restart)"

say "4/4 Prüfen"
sleep 2
check() {
  local url=$1 expect=$2 code
  code=$(curl -s -o /dev/null -w '%{http_code}' --max-time 15 "$url" || echo 000)
  if [[ "$code" =~ $expect ]]; then ok "$url → $code"; else printf '\033[1;33m! %s → %s (erwartet %s)\033[0m\n' "$url" "$code" "$expect"; fi
}
check https://kivertrieb.net/ '^200$'
check https://kivertrieb.net/sitemap.xml '^200$'
check https://www.kivertrieb.net/ '^30[178]$'
check https://app.kivertrieb.net/login '^200$'
check https://app.kivertrieb.net/robots.txt '^200$'

echo
$COMPOSE ps
read -r -p "Jetzt ein Test-Backup erstellen? [j/N] " b
if [[ "$b" =~ ^[jJyY]$ ]]; then $COMPOSE exec backup /backup.sh && ls -lh "$APP_DIR/backups" | tail -3; fi
echo
ok "Fertig. Rückgängig machen falls nötig: cp $BACKUP $CADDYFILE && systemctl reload caddy"
