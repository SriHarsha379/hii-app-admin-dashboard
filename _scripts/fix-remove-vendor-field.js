const fs = require('fs');

let clubs = fs.readFileSync('src/pages/Clubs.tsx', 'utf8');

// Find the line numbers of the vendor block
const lines = clubs.split('\n');
let startLine = -1;
let endLine = -1;
let depth = 0;

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  
  // Find the label line
  if (startLine === -1 && (line.includes('Vendor / Organiser') || line.includes('Vendor/Organiser'))) {
    // Walk back to find opening div
    for (let j = i; j >= Math.max(0, i - 6); j--) {
      if (lines[j].trim().startsWith('<div')) {
        startLine = j;
        break;
      }
    }
    if (startLine === -1) startLine = i;
    depth = 0;
    console.log('Found vendor label at line', i, '— block starts at', startLine);
  }
  
  if (startLine !== -1 && endLine === -1) {
    const opens  = (line.match(/<div/g)   || []).length;
    const closes = (line.match(/<\/div>/g) || []).length;
    if (i === startLine) depth = 1;
    else depth += opens - closes;
    
    if (depth <= 0 && i > startLine) {
      endLine = i;
      console.log('Block ends at line', endLine);
      break;
    }
  }
}

if (startLine !== -1 && endLine !== -1) {
  lines.splice(startLine, endLine - startLine + 1);
  console.log('Removed', endLine - startLine + 1, 'lines');
} else {
  console.log('Could not find vendor block by DOM walking — trying string replace');
  clubs = clubs
    .replace(/\{\/\* Vendor is set automatically.*?\*\/\}/s, '')
    .replace(/\{\/\* Vendor\/Organiser removed.*?\*\/\}/s, '');
}

clubs = lines.join('\n');

// Remove vendor_id check in Next button
clubs = clubs.replace(
  "if (!selectedClub && !venueFormData.vendor_id) { setVenueError('Select a vendor / organiser'); return; }",
  "// vendor check removed"
);

// Remove vendor_id required throw in submit
clubs = clubs.replace(
  "if (!vendorId) throw new Error('Select a vendor/organiser for this venue');",
  "// vendor optional"
);

fs.writeFileSync('src/pages/Clubs.tsx', clubs, 'utf8');
console.log('Done. Lines now:', clubs.split('\n').length);
