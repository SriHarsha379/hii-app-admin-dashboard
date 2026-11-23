const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src/pages/Clubs.tsx');
let code = fs.readFileSync(filePath, 'utf8');
let changed = 0;

// ── Fix 1: invalidate venues-for-clubs after save ──────────────────────────
// Find the exact line in handleSubmitVenue after the success check
const old1 = `      queryClient.invalidateQueries({ queryKey: ['clubs'] });
      setIsCreatingClub(false);
      resetVenueForm();`;

const new1 = `      queryClient.invalidateQueries({ queryKey: ['clubs'] });
      queryClient.invalidateQueries({ queryKey: ['venues-for-clubs'] }); // FIX: refresh venue data too
      setIsCreatingClub(false);
      resetVenueForm();`;

if (code.includes(old1)) {
  code = code.replace(old1, new1);
  changed++;
  console.log('✅ Fix 1 applied: venues-for-clubs invalidation added');
} else {
  console.log('⚠️  Fix 1 already applied or string not found — skipping');
}

// ── Fix 2: use venue_id when updating (not vendor _id) ────────────────────
const old2 = '`${API_BASE}/venue/update_venue/${selectedClub._id}`';
const new2 = '`${API_BASE}/venue/update_venue/${selectedClub.venue_id || selectedClub._id}`';

if (code.includes(old2)) {
  code = code.replace(old2, new2);
  changed++;
  console.log('✅ Fix 2 applied: venue_id used for update URL');
} else {
  console.log('⚠️  Fix 2 already applied or string not found — skipping');
}

// ── Fix 3: merge venue data into every row before filtering ───────────────
const old3 = `const filteredClubs = (Array.isArray(clubs) ? clubs : []).filter((c: any) => {`;
const new3 = `const filteredClubs = (Array.isArray(clubs) ? clubs : [])
  .map((c: any) => withVenueData(c)) // FIX: merge venue data for every row
  .filter((c: any) => {`;

if (code.includes(old3)) {
  code = code.replace(old3, new3);
  changed++;
  console.log('✅ Fix 3 applied: withVenueData applied to list rows');
} else {
  console.log('⚠️  Fix 3 already applied or string not found — skipping');
}

fs.writeFileSync(filePath, code, 'utf8');
console.log(`\n✅ Done — ${changed}/3 fixes applied to src/pages/Clubs.tsx`);
