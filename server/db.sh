#!/usr/bin/env bash
# Create the darsy database and apply every migration in order.
# Re-runnable: it drops and rebuilds, so it is for development only.
set -euo pipefail

DB="${DARSY_DB:-darsy}"
PSQL="psql -v ON_ERROR_STOP=1 --quiet"

run_as_postgres() { su postgres -c "$1"; }

# A role for the application, so nothing ever connects as the superuser.
APP_USER="${DARSY_DB_USER:-darsy}"
APP_PASS="${DARSY_DB_PASSWORD:-darsy}"

run_as_postgres "psql -v ON_ERROR_STOP=1 -c \"drop database if exists $DB;\"" >/dev/null
run_as_postgres "psql -v ON_ERROR_STOP=1 -tc \"select 1 from pg_roles where rolname='$APP_USER'\" | grep -q 1 || psql -v ON_ERROR_STOP=1 -c \"create role $APP_USER login password '$APP_PASS';\"" >/dev/null
run_as_postgres "psql -v ON_ERROR_STOP=1 -c \"create database $DB owner $APP_USER;\"" >/dev/null

for file in "$(dirname "$0")"/migrations/*.sql; do
  echo "→ $(basename "$file")"
  run_as_postgres "$PSQL -d $DB -f $(readlink -f "$file")"
done

run_as_postgres "psql -v ON_ERROR_STOP=1 -d $DB -c \"grant all on schema public to $APP_USER; grant all on all tables in schema public to $APP_USER; grant all on all sequences in schema public to $APP_USER;\"" >/dev/null

echo "✓ قاعدة البيانات $DB جاهزة للدور $APP_USER"
