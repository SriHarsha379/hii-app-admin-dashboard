#!/usr/bin/env bash
set -e
f=src/pages/Settings.tsx

cp "$f" "$f.bak"

# Point 5 (Option A) — remove the broken "Cities" tab from Settings.
# City management now lives only in Manage Filters > Cities (fully working:
# State dropdown + lat/lng, create/delete/activate/preferred).
perl -pi -e "s/^ *\{ id: 'cities', label: 'Cities', icon: MapPin, desc: 'Manage Locations' \},\n//" "$f"

if grep -q "id: 'cities'" "$f"; then
  echo "FAILED: tab entry still present — restoring backup."
  mv "$f.bak" "$f"
  exit 1
else
  echo "Point 5 applied — Cities tab removed from Settings. Backup at $f.bak"
fi
