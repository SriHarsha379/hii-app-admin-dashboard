#!/usr/bin/env bash
set -e
f=src/pages/AccountSettings.tsx
cp "$f" "$f.bak"

perl -pi -e "s{(import \{ FormSection, RefinedField \} from '../components/RefinedForm';)}{\$1\nimport ClubVenueMedia from '../components/ClubVenueMedia';}" "$f"
perl -0pi -e 's{(\n\s*\{/\* Dialogs - Modular UI \*/\})}{\n      <ClubVenueMedia />\n$1}' "$f"

if grep -q "import ClubVenueMedia" "$f" && grep -q "<ClubVenueMedia />" "$f"; then
  echo "Wired ClubVenueMedia into AccountSettings. Backup at $f.bak"
else
  echo "FAILED - restoring."; mv "$f.bak" "$f"; exit 1
fi
