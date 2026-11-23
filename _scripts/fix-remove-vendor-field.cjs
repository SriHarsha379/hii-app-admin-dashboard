const fs = require('fs');

let clubs = fs.readFileSync('src/pages/Clubs.tsx', 'utf8');

// Find and remove the entire vendor/organiser block — search for the label text
// and remove everything from the opening <div> to its closing </div>

// Strategy: replace by finding the unique label string
const before = clubs.length;

// Remove the vendor section — it starts with the label "Vendor / Organiser"
// Use a regex to find and remove the whole block
clubs = clubs.replace(
  /<div className="space-y-4 group\/field">\s*<label[^>]*>Vendor \/ Organiser<\/label>[\s\S]*?<\/div>\s*<\/div>\s*<\/div>/,
  '<!-- Vendor/Organiser removed per client request -->'
);

if (clubs.length === before) {
  // Try alternate approach — find by the placeholder text
  clubs = clubs.replace(
    /<div[^>]*>[\s\S]*?Vendor \/ Organiser[\s\S]*?Select vendor[\s\S]*?<\/div>\s*<\/div>/,
    '<!-- Vendor/Organiser removed -->'
  );
}

if (clubs.length === before) {
  console.log('⚠️  Regex did not match — trying line-based approach');
  
  const lines = clubs.split('\n');
  let inVendorBlock = false;
  let depth = 0;
  let startLine = -1;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (!inVendorBlock && (line.includes('Vendor / Organiser') || line.includes('Vendor/Organiser') || line.includes('Select vendor'))) {
      // Find the opening div — go backwards a few lines
      for (let j = i; j >= Math.max(0, i - 5); j--) {
        if (lines[j].includes('<div')) {
          startLine = j;
          inVendorBlock = true;
          depth = 0;
          break;
        }
      }
    }
    if (inVendorBlock && startLine >= 0) {
      const opens = (line.match(/<div/g) || []).length;
      const closes = (line.match(/<\/div>/g) || []).length;
      depth += opens - closes;
      if (i === startLine) depth = Math.max(1, depth);
      if (depth <= 0 && i > startLine) {
        // Remove lines from startLine to i
        lines.splice(startLine, i - startLine + 1, '');
        console.log(\`Removed lines \${startLine}–\${i}\`);
        break;
      }
    }
  }
  clubs = lines.join('\n');
}

// Also remove the vendor_id validation in the Next button click handler
clubs = clubs.replace(
  `        if (!selectedClub && !venueFormData.vendor_id) { setVenueError('Select a vendor / organiser'); return; }`,
  `        // vendor_id check removed — vendor is linked separately`
);

// And remove vendor_id from the submit validation
clubs = clubs.replace(
  `      const vendorId = selectedClub ? (selectedClub.vendor_id || selectedClub._id) : venueFormData.vendor_id;
      if (!vendorId) throw new Error('Select a vendor/organiser for this venue');`,
  `      const vendorId = selectedClub ? (selectedClub.vendor_id || selectedClub._id) : venueFormData.vendor_id;
      // vendorId is optional when creating standalone venue`
);

fs.writeFileSync('src/pages/Clubs.tsx', clubs, 'utf8');
console.log('✅ Vendor/Organiser field removed');
console.log('File size before:', before, '→ after:', clubs.length);
