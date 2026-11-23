const fs = require('fs');
let code = fs.readFileSync('src/pages/Clubs.tsx', 'utf8');

// 1. Add capacity to formData append
code = code.replace(
  `      body.append('about', venueFormData.description || '');`,
  `      body.append('about', venueFormData.description || '');
      body.append('capacity', venueFormData.capacity || '');
      body.append('contact_name', venueFormData.contactName || '');
      body.append('contact_number', venueFormData.phone || '');
      body.append('landline', venueFormData.landline || '');`
);

// 2. Fix city validation — native select stores _id directly so check should work
// but also check the step validation
code = code.replace(
  `                      if (venueStep === 2 && !venueFormData.city) { toastError('Select a city'); return; }`,
  `                      if (venueStep === 2 && !venueFormData.city) { toastError('Please select a city from the dropdown'); return; }
                      if (venueStep === 2 && !venueFormData.address) { toastError('Please pick a location on the map'); return; }`
);

fs.writeFileSync('src/pages/Clubs.tsx', code, 'utf8');
console.log('Done');
