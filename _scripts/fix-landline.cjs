const fs = require('fs');
let code = fs.readFileSync('src/pages/Clubs.tsx', 'utf8');

// 1. Add landline to initial state (both add and edit)
code = code.replace(
  /phone: '', description: '', city: '', address: '', vendor_id: '',/g,
  "phone: '', landline: '', description: '', city: '', address: '', vendor_id: '',"
);

// 2. Add landline to edit prefill
code = code.replace(
  "contactName: club.contactName || '',",
  "contactName: club.contactName || '',\n      landline: club.landline || '',"
);

// 3. Add landline field after phone field in form
code = code.replace(
  `<RefinedField label="Contact Number" name="phone" value={venueFormData.phone} onChange={(e: any) => setVenueFormData({ ...venueFormData, phone: e.target.value.replace(/\\D/g, '').slice(0, 10) })} placeholder="10-digit mobile number" icon={<Phone className="w-4 h-4" />} />`,
  `<RefinedField label="Contact Number" name="phone" value={venueFormData.phone} onChange={(e: any) => setVenueFormData({ ...venueFormData, phone: e.target.value.replace(/\\D/g, '').slice(0, 10) })} placeholder="10-digit mobile number" icon={<Phone className="w-4 h-4" />} />
                            <RefinedField label="Landline Number" name="landline" value={venueFormData.landline} onChange={(e: any) => setVenueFormData({ ...venueFormData, landline: e.target.value.replace(/[^0-9+\\-() ]/g, '').slice(0, 15) })} placeholder="e.g. +91-80-12345678" icon={<Phone className="w-4 h-4" />} />`
);

// 4. Append landline to formData when submitting
code = code.replace(
  "formData.append('phone', venueFormData.phone);",
  "formData.append('phone', venueFormData.phone);\n      formData.append('landline', venueFormData.landline || '');"
);

fs.writeFileSync('src/pages/Clubs.tsx', code, 'utf8');
console.log('Done');
