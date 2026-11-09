#!/bin/sh
# Tägliches Backup (läuft im Container "backup"): Datenbank-Dump + hochgeladene Dokumente.
# Aufbewahrung: Dateien älter als 14 Tage im Ordner /backups werden entfernt.
set -eu
STAMP=$(date +%F-%H%M)
mkdir -p /backups
PGPASSWORD="$POSTGRES_PASSWORD" pg_dump -h db -U postgres salesplatform | gzip > "/backups/db-$STAMP.sql.gz"
tar -czf "/backups/storage-$STAMP.tar.gz" -C /storage .
find /backups -maxdepth 1 -type f \( -name 'db-*.sql.gz' -o -name 'storage-*.tar.gz' \) -mtime +14 -exec rm -f {} \;
echo "Backup $STAMP fertig: $(ls -1 /backups | wc -l) Dateien"
