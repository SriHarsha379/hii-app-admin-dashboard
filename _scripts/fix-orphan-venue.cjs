const fs = require('fs');

// ── Fix handleSubmitVenue in Clubs.tsx ───────────────────────────────────────
// Replace the alert() in handleSubmitVenue with inline error
let clubs = fs.readFileSync('src/pages/Clubs.tsx', 'utf8');

// Replace the alert in handleSubmitVenue
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

// Add venueSubmitError state near venueError state
clubs = clubs.replace(
  `  const [venueError, setVenueError] = useState('');`,
  `  const [venueError, setVenueError] = useState('');
  const [venueSubmitError, setVenueSubmitError] = useState('');`
);

// Clear venueSubmitError on resetVenueForm
clubs = clubs.replace(
  `    setVenueStep(1); setIsEditingVenue(false); setVenueError('');`,
  `    setVenueStep(1); setIsEditingVenue(false); setVenueError(''); setVenueSubmitError('');`
);

// Replace the existing venueError banner with one that handles both errors
// and shows "Edit existing venue" button when it's the duplicate error
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
                      // Find the existing venue for this vendor and open edit
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
                        setVenueSubmitError('Venue found on server but not loaded yet — refresh the page and try Edit instead.');
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
console.log('✅ Clubs.tsx — inline venue submit error + Edit Existing button');

// ── Fix backend deleteVendor to also soft-delete linked venue ────────────────
let vendorController = fs.readFileSync('src/controller/admin/vendorController.js', 'utf8');

// Add Venue to the import if not already there
if (!vendorController.includes('import { Vendor, Event, Venue')) {
  vendorController = vendorController.replace(
    'import { Vendor, Event, Venue, Booking, WithdrawRequest, Admin }',
    'import { Vendor, Event, Venue, Booking, WithdrawRequest, Admin }'
  );
}

// In deleteVendor, add venue soft-delete after the vendor soft-delete
vendorController = vendorController.replace(
  `    await Vendor.findOneAndUpdate(
      { _id: id, is_deleted: { $ne: true } },
      { is_deleted: true, is_active: false, deleted_at: new Date() },
      { new: true, runValidators: false }
    );`,
  `    await Vendor.findOneAndUpdate(
      { _id: id, is_deleted: { $ne: true } },
      { is_deleted: true, is_active: false, deleted_at: new Date() },
      { new: true, runValidators: false }
    );

    // Also soft-delete any linked venue so the "already have a venue"
    // block in createVenue doesn't block re-creating after a vendor delete.
    try {
      await Venue.findOneAndUpdate(
        { vendor_id: id, is_deleted: false },
        { is_deleted: true },
        { runValidators: false }
      );
    } catch (venueErr) {
      console.warn('[deleteVendor] could not soft-delete linked venue:', venueErr.message);
    }`
);

fs.writeFileSync('src/controller/admin/vendorController.js', vendorController, 'utf8');
console.log('✅ vendorController.js — deleteVendor now also soft-deletes linked venue');

console.log('\n✅ All done');
