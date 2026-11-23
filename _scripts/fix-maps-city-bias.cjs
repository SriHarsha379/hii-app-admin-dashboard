const fs = require('fs');

// 1. Add cityBias prop to LocationPicker
let code = fs.readFileSync('src/components/LocationPicker.tsx', 'utf8');

// Add cityBias to interface
code = code.replace(
  `interface LocationPickerProps {
  value: LocationValue;
  onChange: (val: LocationValue) => void;
  placeholder?: string;
  className?: string;
}`,
  `interface LocationPickerProps {
  value: LocationValue;
  onChange: (val: LocationValue) => void;
  placeholder?: string;
  className?: string;
  cityBias?: string;
}`
);

// Add cityBias to component params
code = code.replace(
  `export function LocationPicker({ value, onChange, placeholder = 'Search address...', className }: LocationPickerProps) {`,
  `export function LocationPicker({ value, onChange, placeholder = 'Search address...', className, cityBias }: LocationPickerProps) {`
);

// Pass location bias when creating PlaceAutocompleteElement
code = code.replace(
  `      const el = new google.maps.places.PlaceAutocompleteElement({
        types: ['establishment', 'geocode'],
      });`,
  `      const elOptions: any = { types: ['establishment', 'geocode'] };
      // Bias results toward selected city using geocoding
      if (cityBias) {
        const gc = new google.maps.Geocoder();
        gc.geocode({ address: cityBias + ', India' }, (results: any, status: any) => {
          if (status === 'OK' && results[0]) {
            const loc = results[0].geometry.location;
            const circle = new google.maps.Circle({ center: loc, radius: 50000 });
            if (el.componentRestrictions === undefined) {
              try { (el as any).locationBias = circle.getBounds(); } catch(e) {}
            }
          }
        });
      }
      const el = new google.maps.places.PlaceAutocompleteElement(elOptions);`
);

fs.writeFileSync('src/components/LocationPicker.tsx', code, 'utf8');
console.log('1. LocationPicker updated');

// 2. Pass cityBias from Clubs form
let clubs = fs.readFileSync('src/pages/Clubs.tsx', 'utf8');
clubs = clubs.replace(
  `<LocationPicker
                              value={{ address: venueFormData.address, latitude: venueFormData.latitude, longitude: venueFormData.longitude }}
                              onChange={(loc) => setVenueFormData({ ...venueFormData, address: loc.address, latitude: loc.latitude, longitude: loc.longitude })}
                              placeholder="Search address or place..."`,
  `<LocationPicker
                              value={{ address: venueFormData.address, latitude: venueFormData.latitude, longitude: venueFormData.longitude }}
                              onChange={(loc) => setVenueFormData({ ...venueFormData, address: loc.address, latitude: loc.latitude, longitude: loc.longitude })}
                              cityBias={venueFormData.city}
                              placeholder="Search address or place..."`
);
fs.writeFileSync('src/pages/Clubs.tsx', clubs, 'utf8');
console.log('2. Clubs updated with cityBias');

// 3. Pass cityBias from Events form
let events = fs.readFileSync('src/pages/Events.tsx', 'utf8');
events = events.replace(
  `<LocationPicker
                      value={{ address: eventFormData.address, latitude: eventFormData.latitude, longitude: eventFormData.longitude }}
                      onChange={(loc) => setEventFormData({ ...eventFormData, address: loc.address, latitude: loc.latitude, longitude: loc.longitude })}`,
  `<LocationPicker
                      value={{ address: eventFormData.address, latitude: eventFormData.latitude, longitude: eventFormData.longitude }}
                      onChange={(loc) => setEventFormData({ ...eventFormData, address: loc.address, latitude: loc.latitude, longitude: loc.longitude })}
                      cityBias={eventFormData.city}`
);
fs.writeFileSync('src/pages/Events.tsx', events, 'utf8');
console.log('3. Events updated with cityBias');
