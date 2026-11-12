#!/usr/bin/env bash
set -e
f=src/model/venueModel.js
cp "$f" "$f.bak"

# Point 6 — "Server error adding clubs": Venue schema required `about`,
# but the Add New Club form sends "" when description is left blank.
# Empty required String -> Mongoose ValidationError -> generic 500.
# Make `about` optional with an empty-string default.
perl -0pi -e 's/about:\s*\{\s*type:\s*String,\s*required:\s*true\s*\}/about: { type: String, default: "" }/' "$f"

if grep -q 'about: { type: String, default:' "$f"; then
  echo "Point 6 applied - venue about is now optional. Backup at $f.bak"
else
  echo "FAILED: pattern not matched - restoring backup."
  mv "$f.bak" "$f"
  exit 1
fi
