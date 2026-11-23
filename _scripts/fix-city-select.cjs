const fs = require('fs');
let code = fs.readFileSync('src/pages/Clubs.tsx', 'utf8');

code = code.replace(
  `                              <SingleSelectDropdown
                                options={(Array.isArray(cities) ? cities : []).slice().sort((a: any, b: any) => (a.city_name || '').localeCompare(b.city_name || '')).map((city: any) => ({ label: city.city_name, value: city._id }))}
                                value={venueFormData.city}
                                onChange={(val: string) => setVenueFormData({ ...venueFormData, city: val })}
                                placeholder="Select City..."
                              />`,
  `                              <div className="relative">
                                <select
                                  value={venueFormData.city}
                                  onChange={(e) => setVenueFormData({ ...venueFormData, city: e.target.value })}
                                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-1 focus:ring-primary/50 appearance-none cursor-pointer"
                                >
                                  <option value="" disabled>Select City...</option>
                                  {(Array.isArray(cities) ? cities : []).slice().sort((a: any, b: any) => (a.city_name || '').localeCompare(b.city_name || '')).map((city: any) => (
                                    <option key={city._id} value={city._id}>{city.city_name}</option>
                                  ))}
                                </select>
                                <ChevronDown className="w-4 h-4 absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                              </div>`
);

fs.writeFileSync('src/pages/Clubs.tsx', code, 'utf8');
console.log('Done');
