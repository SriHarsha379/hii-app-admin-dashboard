const fs = require('fs');

let clubs = fs.readFileSync('src/pages/Clubs.tsx', 'utf8');

// Backend field is contact_number not phone — fix the FormData append
clubs = clubs.replace(
  `      if (venueFormData.landline) body.append('landline', venueFormData.landline);`,
  `      if (venueFormData.phone) body.append('contact_number', venueFormData.phone);
      if (venueFormData.landline) body.append('landline', venueFormData.landline);`
);

// Also fix openEditVenue to read contact_number from existing venue
clubs = clubs.replace(
  `      phone: club.phone || club.phone_number || '',`,
  `      phone: club.phone || club.phone_number || club.contact_number || '',`
);

fs.writeFileSync('src/pages/Clubs.tsx', clubs, 'utf8');
console.log('✅ Field names fixed — contact_number + landline');

// Fix ClubProfilePreview to read contact_number too
let preview = fs.readFileSync('src/components/ClubProfilePreview.tsx', 'utf8');

preview = preview.replace(
  `      phone:       b.phone || b.phone_number || '',`,
  `      phone:       b.phone || b.phone_number || b.contact_number || '',`
);

fs.writeFileSync('src/components/ClubProfilePreview.tsx', preview, 'utf8');
console.log('✅ ClubProfilePreview reads contact_number');

