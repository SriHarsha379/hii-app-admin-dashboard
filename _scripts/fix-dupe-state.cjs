const fs = require('fs');

let clubs = fs.readFileSync('src/pages/Clubs.tsx', 'utf8');

// Remove the duplicate line — keep only one
clubs = clubs.replace(
  `  const [venueSubmitError, setVenueSubmitError] = useState('');
  const [venueSubmitError, setVenueSubmitError] = useState('');`,
  `  const [venueSubmitError, setVenueSubmitError] = useState('');`
);

fs.writeFileSync('src/pages/Clubs.tsx', clubs, 'utf8');
console.log('✅ Duplicate state removed');
