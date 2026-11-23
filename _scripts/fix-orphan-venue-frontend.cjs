const fs = require('fs');

let clubs = fs.readFileSync('src/pages/Clubs.tsx', 'utf8');

clubs = clubs.replace(
  `    } catch (err: any) {
      alert(err.message || 'Failed to save venue.');
    } finally { setIsSubmitting(false); }
  };`,
  `    } catch (err: any) {
      setVenueSubmitError(err.message || 'Failed to save venue.');
    } finally { setIsSubmitting(false); }
  };`
);

clubs = clubs.replace(
  `  const [venueError, setVenueError] = useState('');`,
  `  const [venueError, setVenueError] = useState('');
  const [venueSubmitError, setVenueSubmitError] = useState('');`
);

clubs = clubs.replace(
  `    setVenueStep(1); setIsEditingVenue(false); setVenueError('');`,
  `    setVenueStep(1); setIsEditingVenue(false); setVenueError(''); setVenueSubmitError('');`
);

clubs = clubs.replace(
  `{(venueError || venueSubmitError) && (
              <div className="px-6 py-3 bg-red-500/10 border-t border-red-500/20 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-400 shrink-0" />
                  <p className="text-xs text-red-400 font-bold truncate">{venueSubmitError || venueError}</p>
                </div>
                {venueSubmitError?.toLowerCase().includes('already have a venue') && (
                  <button
                    type="button"
                    onClick={() => {
                      const vendorId = venueFormData.vendor_id || selectedClub?._id || selectedClub?.id;
                      const existingVenue = Array.isArray(venues)
                        ? venues.find((v: any) => {
                            const vid = typeof v.vendor_id === 'object' ? v.vendor_id?._id : v.vendor_id;
                            return String(vid) === String(vendorId);
                          })
                        : null;
                      if (existingVenue) {
                        const vendor = Array.isArray(clubs)
                          ? (clubs as any[]).find((c: any) => String(c._id || c.id) === String(vendorId))
                          : null;
                        setVenueSubmitError('');
                        setIsCreatingClub(false);
                        openEditVenue(vendor ? { ...vendor, ...existingVenue, _id: vendor._id, vendor_id: vendor._id } : existingVenue);
                      } else {
                        setVenueSubmitError('Venue found on server but not loaded yet — refresh and try Edit instead.');
                      }
                    }}
                    className="px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-[10px] font-black text-amber-400 uppercase tracking-widest hover:bg-amber-500/20 transition-all shrink-0 whitespace-nowrap"
                  >
                    Edit Existing →
                  </button>
                )}
              </div>
            )}`,
  `{venueError && (
              <div className="px-6 py-3 bg-red-500/10 border-t border-red-500/20 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-red-400 shrink-0" />
                <p className="text-xs text-red-400 font-bold">{venueError}</p>
              </div>
            )}`
);

// Now add the proper combined error banner
clubs = clubs.replace(
  `{venueError && (
              <div className="px-6 py-3 bg-red-500/10 border-t border-red-500/20 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-red-400 shrink-0" />
                <p className="text-xs text-red-400 font-bold">{venueError}</p>
              </div>
            )}`,
  `{(venueError || venueSubmitError) && (
              <div className="px-6 py-3 bg-red-500/10 border-t border-red-500/20 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-400 shrink-0" />
                  <p className="text-xs text-red-400 font-bold truncate">{venueSubmitError || venueError}</p>
                </div>
                {venueSubmitError?.toLowerCase().includes('already have a venue') && (
                  <button
                    type="button"
                    onClick={() => {
                      const vendorId = venueFormData.vendor_id || selectedClub?._id || selectedClub?.id;
                      const existingVenue = Array.isArray(venues)
                        ? venues.find((v: any) => {
                            const vid = typeof v.vendor_id === 'object' ? v.vendor_id?._id : v.vendor_id;
                            return String(vid) === String(vendorId);
                          })
                        : null;
                      if (existingVenue) {
                        const vendor = Array.isArray(clubs)
                          ? (clubs as any[]).find((c: any) => String(c._id || c.id) === String(vendorId))
                          : null;
                        setVenueSubmitError('');
                        setIsCreatingClub(false);
                        openEditVenue(vendor ? { ...vendor, ...existingVenue, _id: vendor._id, vendor_id: vendor._id } : existingVenue);
                      } else {
                        setVenueSubmitError('Venue found on server but not loaded — refresh and try Edit instead.');
                      }
                    }}
                    className="px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-[10px] font-black text-amber-400 uppercase tracking-widest hover:bg-amber-500/20 transition-all shrink-0 whitespace-nowrap"
                  >
                    Edit Existing →
                  </button>
                )}
              </div>
            )}`
);

fs.writeFileSync('src/pages/Clubs.tsx', clubs, 'utf8');
console.log('✅ Clubs.tsx done');
