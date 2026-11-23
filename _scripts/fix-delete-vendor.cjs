const fs = require('fs');
let code = fs.readFileSync('src/pages/Clubs.tsx', 'utf8');

// Fix handleDeleteVenue to delete vendor if no venue exists
code = code.replace(
  `      // deleteVenueTarget is already merged withVenueData — use venue_id first
      const idToDelete = deleteVenueTarget.venue_id || deleteVenueTarget._id || deleteVenueTarget.id;
      console.log('Delete target:', { venue_id: deleteVenueTarget.venue_id, _id: deleteVenueTarget._id, idToDelete });
      await deleteVenueMutation.mutateAsync(idToDelete);`,
  `      const venueId = deleteVenueTarget.venue_id;
      const vendorId = deleteVenueTarget._id || deleteVenueTarget.id;
      if (venueId) {
        // Has a venue — delete the venue
        await deleteVenueMutation.mutateAsync(venueId);
      } else {
        // No venue yet — delete the vendor account directly
        const res = await fetch(\`\${API_BASE}/vendor/delete_vendor/\${vendorId}\`, {
          method: 'DELETE',
          headers: { Authorization: \`Bearer \${token}\` },
        });
        if (!res.ok) throw new Error('Failed to delete vendor');
        queryClient.invalidateQueries({ queryKey: ['clubs'] });
        success('Club deleted successfully');
        setDeleteVenueTarget(null);
      }`
);

fs.writeFileSync('src/pages/Clubs.tsx', code, 'utf8');
console.log('Done');
