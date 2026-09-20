#!/usr/bin/env bash
# Create the darsy database and apply every migration in order.
# Re-runnable: it drops and rebuilds, so it is for development only.
set -euo pipefail

DB="${DARSY_DB:-darsy}"
PSQL="psql -v ON_ERROR_STOP=1 --quiet"

run_as_postgres() { su postgres -c "$1"; }

run_as_postgres "psql -v ON_ERROR_STOP=1 -c \"drop database if exists $DB;\"" >/dev/null
run_as_postgres "psql -v ON_ERROR_STOP=1 -c \"create database $DB;\"" >/dev/null

for file in "$(dirname "$0")"/migrations/*.sql; do
  echo "→ $(basename "$file")"
  run_as_postgres "$PSQL -d $DB -f $(readlink -f "$file")"
done

echo "✓ قاعدة البيانات $DB جاهزة"
