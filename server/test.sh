#!/usr/bin/env bash
# Rebuild the database, then try to break every rule once.
set -euo pipefail
cd "$(dirname "$0")"

./db.sh >/dev/null 2>&1

OUT=$(su postgres -c "psql -d ${DARSY_DB:-darsy} -f $(readlink -f tests/constraints.sql)" 2>&1 \
      | sed 's/psql:[^ ]*sql:[0-9]*: //; s/NOTICE:  //; s/WARNING:  //')

echo "$OUT" | grep -E '✓|✗|──' || true

PASS=$(echo "$OUT" | grep -c '✓' || true)
FAIL=$(echo "$OUT" | grep -c '✗' || true)

echo
echo "───────────────────────────────"
echo "نجح: $PASS   ·   فشل: $FAIL"
[ "$FAIL" -eq 0 ] || exit 1
