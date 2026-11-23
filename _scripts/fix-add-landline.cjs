const fs = require('fs');

let clubs = fs.readFileSync('src/pages/Clubs.tsx', 'utf8');

// 1. Add landline to initial venueFormData state
clubs = clubs.replace(
  `    name: '', type: [], email: '', capacity: '', contactName: '',
    phone: '', description: '', city: '', address: '', vendor_id: '',
    landscape_urls: [''], portrait_url: '',
    table_reservation_fee: '', bill_discount_percentage: '', tax_percentage: '',`,
  `    name: '', type: [], email: '', capacity: '', contactName: '',
    phone: '', landline: '', description: '', city: '', address: '', vendor_id: '',
    landscape_urls: [''], portrait_url: '',
    table_reservation_fee: '', bill_discount_percentage: '', tax_percentage: '',`
);

// 2. Add landline to resetVenueForm
clubs = clubs.replace(
  `name: '', type: [], email: '', capacity: '', contactName: '', phone: '', description: '', city: '', address: '', vendor_id: '', landscape_urls: [''], portrait_url: '', table_reservation_fee: '', bill_discount_percentage: '', tax_percentage: ''`,
  `name: '', type: [], email: '', capacity: '', contactName: '', phone: '', landline: '', description: '', city: '', address: '', vendor_id: '', landscape_urls: [''], portrait_url: '', table_reservation_fee: '', bill_discount_percentage: '', tax_percentage: ''`
);

// 3. Add landline to openEditVenue
clubs = clubs.replace(
  `      phone: club.phone || club.phone_number || '',`,
  `      phone: club.phone || club.phone_number || '',
      landline: club.landline || club.landline_number || '',`
);

// 4. Add landline to FormData in handleSubmitVenue (send to backend)
clubs = clubs.replace(
  `      body.append('about', venueFormData.description || '');`,
  `      body.append('about', venueFormData.description || '');
      if (venueFormData.landline) body.append('landline', venueFormData.landline);`
);

// 5. Add landline field in Step 1 UI — after the phone field
clubs = clubs.replace(
  `                            <RefinedField label="Contact Number" name="phone" value={venueFormData.phone} onChange={(e: any) => setVenueFormData({ ...venueFormData, phone: e.target.value.replace(/\\D/g, '').slice(0, 10) })} placeholder="10-digit mobile number" icon={<Phone className="w-4 h-4" />} />`,
  `                            <RefinedField label="Contact Number" name="phone" value={venueFormData.phone} onChange={(e: any) => setVenueFormData({ ...venueFormData, phone: e.target.value.replace(/\\D/g, '').slice(0, 10) })} placeholder="10-digit mobile number" icon={<Phone className="w-4 h-4" />} />
                            <RefinedField label="Landline Number" name="landline" value={venueFormData.landline} onChange={(e: any) => setVenueFormData({ ...venueFormData, landline: e.target.value.replace(/\\D/g, '').slice(0, 11) })} placeholder="e.g. 02212345678" icon={<Phone className="w-4 h-4" />} hint="Optional" />`
);

fs.writeFileSync('src/pages/Clubs.tsx', clubs, 'utf8');
console.log('✅ Landline field added to venue form');

// 6. Add landline to ClubProfilePreview info tab
let preview = fs.readFileSync('src/components/ClubProfilePreview.tsx', 'utf8');

preview = preview.replace(
  `      phone:       b.phone || b.phone_number || '',`,
  `      phone:       b.phone || b.phone_number || '',
      landline:    b.landline || b.landline_number || '',`
);

preview = preview.replace(
  `      {data.phone   && <div className="flex items-center gap-3 text-sm text-white/70"><Phone  className="w-4 h-4 text-white/30 shrink-0" />{data.phone}</div>}`,
  `      {data.phone   && <div className="flex items-center gap-3 text-sm text-white/70"><Phone  className="w-4 h-4 text-white/30 shrink-0" />{data.phone} <span className="text-[10px] text-white/30 uppercase tracking-widest">Mobile</span></div>}
      {data.landline && <div className="flex items-center gap-3 text-sm text-white/70"><Phone  className="w-4 h-4 text-white/30 shrink-0" />{data.landline} <span className="text-[10px] text-white/30 uppercase tracking-widest">Landline</span></div>}`
);

fs.writeFileSync('src/components/ClubProfilePreview.tsx', preview, 'utf8');
console.log('✅ Landline shown in ClubProfilePreview');

console.log('\n✅ All done');
