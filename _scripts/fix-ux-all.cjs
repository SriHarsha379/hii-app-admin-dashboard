const fs = require('fs');

// ── 1. UserProfilePreview: fix hardcoded "Status: Verified" ─────────────────
let upr = fs.readFileSync('src/components/UserProfilePreview.tsx', 'utf8');
upr = upr.replace(
  `<p className="text-[9px] font-black text-white uppercase tracking-widest">Status: Verified</p>`,
  `<p className="text-[9px] font-black text-white uppercase tracking-widest">Status: {user?.status === 'BANNED' ? 'Banned' : user?.is_verified ? 'Verified' : 'Unverified'}</p>`
);
upr = upr.replace(
  `<div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />`,
  `<div className={\`w-2 h-2 rounded-full animate-pulse \${user?.status === 'BANNED' ? 'bg-red-500' : user?.is_verified ? 'bg-blue-500' : 'bg-amber-500'}\`} />`
);
fs.writeFileSync('src/components/UserProfilePreview.tsx', upr, 'utf8');
console.log('1. UserProfilePreview fixed');

// ── 2. EventProfilePreview: fix hardcoded "Status: Active" ──────────────────
let epr = fs.readFileSync('src/components/EventProfilePreview.tsx', 'utf8');
epr = epr.replace(
  `<p className="text-[9px] font-black text-white uppercase tracking-widest">Status: Active</p>`,
  `<p className="text-[9px] font-black text-white uppercase tracking-widest">Status: {eventData?.status || 'Active'}</p>`
);
epr = epr.replace(
  `<div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />`,
  `<div className={\`w-2 h-2 rounded-full animate-pulse \${eventData?.status === 'CANCELLED' ? 'bg-red-500' : eventData?.status === 'COMPLETED' ? 'bg-zinc-500' : 'bg-green-500'}\`} />`
);
fs.writeFileSync('src/components/EventProfilePreview.tsx', epr, 'utf8');
console.log('2. EventProfilePreview fixed');

// ── 3. Users.tsx: fix Export CSV to export all users not just page ───────────
let users = fs.readFileSync('src/pages/Users.tsx', 'utf8');
users = users.replace(
  `const rows = pg.pageItems.map((u: any) => [`,
  `const rows = filteredUsers.map((u: any) => [`
);
fs.writeFileSync('src/pages/Users.tsx', users, 'utf8');
console.log('3. Users Export CSV fixed');

console.log('All done!');
