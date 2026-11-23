const fs = require('fs');

// ─────────────────────────────────────────────────────────────────────────────
// POINT 2: Video preview in Ads & Broadcast — add preview button to ad menu
// ─────────────────────────────────────────────────────────────────────────────
let ads = fs.readFileSync('src/pages/AdsBroadcast.tsx', 'utf8');

// Add videoPreviewUrl state after editingAdId state
ads = ads.replace(
  `  const [editingAdId, setEditingAdId] = useState<string | null>(null);`,
  `  const [editingAdId, setEditingAdId] = useState<string | null>(null);
  const [videoPreviewUrl, setVideoPreviewUrl] = useState<string | null>(null);`
);

// Add "Preview Video" option in the actions menu, before Edit Ad
ads = ads.replace(
  `                                  <button
                                    onClick={() => openEditAd(ad)}
                                    className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-white hover:bg-white/5 rounded-lg transition-colors"
                                  >
                                    <Edit className="w-3.5 h-3.5" /> Edit Ad
                                  </button>`,
  `                                  {ad.ad_video && (
                                    <button
                                      onClick={() => { setVideoPreviewUrl(adAssetUrl(ad.ad_video)); setOpenMenuId(null); }}
                                      className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-purple-400 hover:bg-purple-400/10 rounded-lg transition-colors"
                                    >
                                      <Video className="w-3.5 h-3.5" /> Preview Video
                                    </button>
                                  )}
                                  <button
                                    onClick={() => openEditAd(ad)}
                                    className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-white hover:bg-white/5 rounded-lg transition-colors"
                                  >
                                    <Edit className="w-3.5 h-3.5" /> Edit Ad
                                  </button>`
);

// Add video preview modal before the closing </div> of the component
ads = ads.replace(
  `      <AnimatePresence>
        {isExportingAds && (`,
  `      {/* Video Preview Modal */}
      <AnimatePresence>
        {videoPreviewUrl && (
          <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-black/95 backdrop-blur-md" onClick={() => setVideoPreviewUrl(null)}>
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              className="relative w-full max-w-3xl rounded-3xl overflow-hidden border border-white/10 shadow-2xl bg-black"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
                    <Video className="w-4 h-4" />
                  </div>
                  <h3 className="text-sm font-black text-white uppercase tracking-widest">Video Preview</h3>
                </div>
                <button onClick={() => setVideoPreviewUrl(null)} className="w-9 h-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-white/40 hover:text-white hover:bg-white/10 transition-all">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="p-4 bg-black">
                <video
                  src={videoPreviewUrl}
                  controls
                  autoPlay
                  className="w-full rounded-2xl max-h-[70vh] object-contain bg-black"
                />
              </div>
              <div className="px-6 py-4 border-t border-white/10 flex items-center justify-between">
                <a href={videoPreviewUrl} target="_blank" rel="noreferrer"
                  className="text-[10px] font-black text-primary uppercase tracking-widest hover:underline flex items-center gap-2">
                  <Download className="w-3.5 h-3.5" /> Download Video
                </a>
                <button onClick={() => setVideoPreviewUrl(null)}
                  className="px-5 py-2 rounded-xl bg-white/5 border border-white/10 text-[10px] font-black text-white/60 uppercase tracking-widest hover:text-white hover:bg-white/10 transition-all">
                  Close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isExportingAds && (`
);

fs.writeFileSync('src/pages/AdsBroadcast.tsx', ads, 'utf8');
console.log('✅ Point 2: Video preview modal added to Ads & Broadcast');

// ─────────────────────────────────────────────────────────────────────────────
// POINT 3: Remove Vendor/Organiser from Add Clubs form
// ─────────────────────────────────────────────────────────────────────────────
let clubs = fs.readFileSync('src/pages/Clubs.tsx', 'utf8');

// Remove vendor dropdown from Step 1 of venue form
// Replace the vendor picker section with nothing (Super Admin creates venues
// and assigns to vendor later; the vendor_id is auto-set from selected club)
clubs = clubs.replace(
  `                            <div className="space-y-4 group/field">
                              <label className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] ml-1">Vendor / Organiser</label>
                              {isClubAdmin ? (
                                <div className="flex items-center gap-3 w-full bg-[#0c0c10] border border-white/[0.07] rounded-2xl px-4 py-3 text-sm text-white/60">
                                  <span className="truncate">{ownVendorForVenue?.name || user?.organisation || 'Your organisation'}</span>
                                  <span className="ml-auto text-[9px] font-black uppercase tracking-widest text-white/20 shrink-0">Locked to your account</span>
                                </div>
                              ) : (
                                <SingleSelectDropdown options={(vendorListForVenue || []).map((v: any) => ({ label: v.name, value: v._id || v.id }))} value={venueFormData.vendor_id} onChange={(val: string) => setVenueFormData({ ...venueFormData, vendor_id: val })} placeholder="Select vendor..." />
                              )}
                            </div>`,
  `{/* Vendor is set automatically from the selected club row — removed from Add Club form per client request (Point 3) */}`
);

fs.writeFileSync('src/pages/Clubs.tsx', clubs, 'utf8');
console.log('✅ Point 3: Vendor/Organiser removed from Add Club form');

// ─────────────────────────────────────────────────────────────────────────────
// POINT 4: Add Host/Organizers column to Events table
// ─────────────────────────────────────────────────────────────────────────────
let events = fs.readFileSync('src/pages/Events.tsx', 'utf8');

// Add Host/Organizer column header after Venue/City column
events = events.replace(
  `                    <th className="px-6 py-4 text-[10px] font-black text-muted-foreground uppercase tracking-widest cursor-pointer select-none hover:text-white transition-colors" onClick={() => handleSort('city')}>
                      <div className="flex items-center gap-1.5">Venue / City <SortIcon field="city" /></div>
                    </th>`,
  `                    <th className="px-6 py-4 text-[10px] font-black text-muted-foreground uppercase tracking-widest cursor-pointer select-none hover:text-white transition-colors" onClick={() => handleSort('city')}>
                      <div className="flex items-center gap-1.5">Venue / City <SortIcon field="city" /></div>
                    </th>
                    <th className="px-6 py-4 text-[10px] font-black text-muted-foreground uppercase tracking-widest">
                      Host / Organizer
                    </th>`
);

// Update colSpan from 5 to 6 for loading/empty states
events = events.replace(
  `                    <tr><td colSpan={5} className="px-6 py-12 text-center text-xs text-muted-foreground">Loading events…</td></tr>
                  ) : filteredEvents.length === 0 ? (
                    <tr><td colSpan={5} className="px-6 py-12 text-center text-xs text-muted-foreground">No events found.</td></tr>`,
  `                    <tr><td colSpan={6} className="px-6 py-12 text-center text-xs text-muted-foreground">Loading events…</td></tr>
                  ) : filteredEvents.length === 0 ? (
                    <tr><td colSpan={6} className="px-6 py-12 text-center text-xs text-muted-foreground">No events found.</td></tr>`
);

// Add Host/Organizer cell after the Venue/City cell in each row
events = events.replace(
  `                      <td className="px-6 py-4">
                        <p className="text-xs font-bold text-white">{event.vendor_id?.name || getVendorName(getVendorId(event)) || '—'}</p>
                        <p className="text-[10px] text-muted-foreground">{event.city || '—'}</p>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-xs font-bold text-white">{new Date(event.date || Date.now()).toLocaleDateString()}</p>`,
  `                      <td className="px-6 py-4">
                        <p className="text-xs font-bold text-white">{event.vendor_id?.name || getVendorName(getVendorId(event)) || '—'}</p>
                        <p className="text-[10px] text-muted-foreground">{event.city || '—'}</p>
                      </td>
                      <td className="px-6 py-4">
                        {(() => {
                          const hostName = event.vendor_id?.name || getVendorName(getVendorId(event)) || event.organizer || event.host || '';
                          return hostName ? (
                            <div className="flex items-center gap-2">
                              <div className="w-6 h-6 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary text-[10px] font-black shrink-0">
                                {hostName[0]?.toUpperCase()}
                              </div>
                              <p className="text-xs font-bold text-white truncate max-w-[120px]">{hostName}</p>
                            </div>
                          ) : (
                            <span className="text-[10px] text-white/20">—</span>
                          );
                        })()}
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-xs font-bold text-white">{new Date(event.date || Date.now()).toLocaleDateString()}</p>`
);

fs.writeFileSync('src/pages/Events.tsx', events, 'utf8');
console.log('✅ Point 4: Host/Organizer column added to Events table');

// ─────────────────────────────────────────────────────────────────────────────
// POINT 6: Fix white screen on Admins page — wrong animation import
// ─────────────────────────────────────────────────────────────────────────────
let admins = fs.readFileSync('src/pages/Admins.tsx', 'utf8');

// Fix the import — framer-motion doesn't exist, should be motion/react
admins = admins.replace(
  `import { AnimatePresence, motion } from 'framer-motion';`,
  `import { AnimatePresence, motion } from 'motion/react';`
);

// Also fix XCircle used in modal close — make sure it's imported
if (!admins.includes('XCircle')) {
  admins = admins.replace(
    `import {`,
    `import { XCircle,`
  );
}

fs.writeFileSync('src/pages/Admins.tsx', admins, 'utf8');
console.log('✅ Point 6: Fixed framer-motion → motion/react import in Admins.tsx (white screen fix)');

// ActivityLogs — wrap in try/catch to prevent white screen on API error
let logs = fs.readFileSync('src/pages/ActivityLogs.tsx', 'utf8');
logs = logs.replace(
  `      const res = await fetch(\`\${API_BASE}/activity-logs/get_all\`, {
        headers: { Authorization: \`Bearer \${token}\` }
      });
      const json = await res.json();
      return json.data?.logs ?? [];`,
  `      try {
        const res = await fetch(\`\${API_BASE}/activity-logs/get_all\`, {
          headers: { Authorization: \`Bearer \${token}\` }
        });
        const json = await res.json();
        return json.data?.logs ?? json.data ?? [];
      } catch {
        return [];
      }`
);
fs.writeFileSync('src/pages/ActivityLogs.tsx', logs, 'utf8');
console.log('✅ Point 6: ActivityLogs wrapped in try/catch to prevent white screen');

console.log('\n✅ All 4 remaining points fixed (1 + 5 already done)');
