const fs = require('fs');
let code = fs.readFileSync('src/pages/Clubs.tsx', 'utf8');

code = code.replace(
  `      // deleteVenueTarget is already merged withVenueData — use venue_id first
      const idToDelete = deleteVenueTarget.venue_id || deleteVenueTarget._id || deleteVenueTarget.id;`,
  `      // deleteVenueTarget is already merged withVenueData — use venue_id first
      const idToDelete = deleteVenueTarget.venue_id || deleteVenueTarget._id || deleteVenueTarget.id;
      console.log('Delete target:', { venue_id: deleteVenueTarget.venue_id, _id: deleteVenueTarget._id, idToDelete });`
);

fs.writeFileSync('src/pages/Clubs.tsx', code, 'utf8');
console.log('Done');
