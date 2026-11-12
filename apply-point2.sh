#!/usr/bin/env bash
set -e

# Point 2 — show the themed scrollbar in the create/edit modals
# (Add New Club + club-admin Create Event live in Clubs.tsx; Create New Event in Events.tsx)

# Clubs & Venues: Add New Club modal AND club-admin Create Event modal (both match this string)
perl -pi -e 's{p-10 lg:p-12 scrollbar-hide}{p-10 lg:p-12 custom-scrollbar}g' src/pages/Clubs.tsx

# Create New Event modal (anchored on its unique id so the analytics modal is left alone)
perl -pi -e 's{p-8 scrollbar-hide" id="modal-scroll-body"}{p-8 custom-scrollbar" id="modal-scroll-body"}g' src/pages/Events.tsx

echo "Point 2 applied."
