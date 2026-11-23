const fs = require('fs');

// 1. Remove Vendor/Organiser block from Clubs form (for non-club-admin only)
let clubs = fs.readFileSync('src/pages/Clubs.tsx', 'utf8');
clubs = clubs.replace(
  `                            <div className="space-y-4 group/field">
                              <label className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] ml-1">Vendor / Organiser</label>
                              {isClubAdmin ? (
                                <div className="flex items-center gap-3 w-full bg-[#09090B] border border-white/5 rounded-[24px] px-8 py-5 text-sm text-white/60">
                                  <span className="truncate">{ownVendorForVenue?.name || user?.organisation || 'Your organisation'}</span>
                                  <span className="ml-auto text-[9px] font-black uppercase tracking-widest text-white/20 shrink-0">Locked to your account</span>
                                </div>
                              ) : (
                                <SingleSelectDropdown
                                  options={(vendorListForVenue || []).map((v: any) => ({ label: v.name, value: v._id || v.id }))}
                                  value={venueFormData.vendor_id}
                                  onChange={(val: string) => setVenueFormData({ ...venueFormData, vendor_id: val })}
                                  placeholder="Select vendor..."
                                />
                              )}
                              <p className="text-[9px] text-white/20 ml-1">Note: each vendor can only have one venue on the backend.</p>
                            </div>`,
  `{/* Vendor/Organiser field moved to Create New Events */}`
);
fs.writeFileSync('src/pages/Clubs.tsx', clubs, 'utf8');
console.log('1. Removed vendor field from Clubs');

// 2. Update label in Events form from empty to "Vendor / Organiser"
let events = fs.readFileSync('src/pages/Events.tsx', 'utf8');
events = events.replace(
  `              <SingleSelectDropdown value={eventFormData.vendor_id || eventFormData.venue_id} onChange={(vendorId) => setEventFormData({ ...eventFormData, vendor_id: vendorId, venue_id: vendorId })} options={vendorList.map((v: any) => ({ label: v.name, value: v._id || v.id }))} placeholder="Select venue" />`,
  `              <SingleSelectDropdown value={eventFormData.vendor_id || eventFormData.venue_id} onChange={(vendorId) => setEventFormData({ ...eventFormData, vendor_id: vendorId, venue_id: vendorId })} options={vendorList.map((v: any) => ({ label: v.name, value: v._id || v.id }))} placeholder="Select organiser / venue..." />`
);
fs.writeFileSync('src/pages/Events.tsx', events, 'utf8');
console.log('2. Updated Events vendor placeholder');
