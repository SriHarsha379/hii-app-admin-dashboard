const fs = require('fs');
let code = fs.readFileSync('src/pages/Clubs.tsx', 'utf8');

code = code.replace(
  `                                  onChange={(e) => setVenueFormData({ ...venueFormData, city: e.target.value })}`,
  `                                  onChange={(e) => { const v = e.target.value; setVenueFormData((prev: any) => ({ ...prev, city: v })); }}`
);

// Also update LocationPicker to use functional update and pass cityBias
code = code.replace(
  `<LocationPicker value={{ address: venueFormData.address, latitude: venueFormData.latitude, longitude: venueFormData.longitude }} onChange={(loc) => setVenueFormData({ ...venueFormData, address: loc.address, latitude: loc.latitude, longitude: loc.longitude })} placeholder="Search address or place..." />`,
  `<LocationPicker value={{ address: venueFormData.address, latitude: venueFormData.latitude, longitude: venueFormData.longitude }} onChange={(loc) => setVenueFormData((prev: any) => ({ ...prev, address: loc.address, latitude: loc.latitude, longitude: loc.longitude }))} cityBias={venueFormData.city} placeholder="Search address or place..." />`
);

fs.writeFileSync('src/pages/Clubs.tsx', code, 'utf8');
console.log('Done');
