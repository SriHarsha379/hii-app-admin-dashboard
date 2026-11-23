const fs = require('fs');
let code = fs.readFileSync('src/components/LocationPicker.tsx', 'utf8');

// Reduce map height 
code = code.replace(
  `<div ref={mapRef} className="w-full rounded-2xl overflow-hidden border border-white/10" style={{ height: '280px' }} />`,
  `<div ref={mapRef} className="w-full rounded-2xl overflow-hidden border border-white/10" style={{ height: '220px' }} />`
);

// Make dropdown appear with higher z-index and position fixed relative to viewport
code = code.replace(
  `      {isOpen && results.length > 0 && (
        <div className="absolute top-14 left-0 right-0 z-[9999] bg-[#0B0B0F] border border-white/10 rounded-2xl shadow-2xl overflow-hidden">`,
  `      {isOpen && results.length > 0 && (
        <div className="absolute top-full left-0 right-0 z-[9999] mt-1 bg-[#0B0B0F] border border-white/10 rounded-2xl shadow-2xl overflow-hidden max-h-48 overflow-y-auto">`
);

fs.writeFileSync('src/components/LocationPicker.tsx', code, 'utf8');
console.log('Done');
