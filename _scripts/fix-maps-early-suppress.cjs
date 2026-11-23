const fs = require('fs');
let code = fs.readFileSync('src/components/LocationPicker.tsx', 'utf8');

code = code.replace(
  `    // Suppress the "This page can't load Google Maps correctly" dialog
    (window as any).gm_authFailure = () => { console.warn('Google Maps auth warning suppressed'); resolve(); };`,
  `    // Suppress the "This page can't load Google Maps correctly" dialog BEFORE script loads
    (window as any).gm_authFailure = () => { console.warn('Google Maps auth warning suppressed'); };`
);

// Also add it at module level before loadGoogleMaps is called
code = code.replace(
  `const API_KEY = import.meta.env.VITE_GOOGLE_MAPS_KEY || '';`,
  `const API_KEY = import.meta.env.VITE_GOOGLE_MAPS_KEY || '';
// Suppress Google Maps auth dialog globally
if (typeof window !== 'undefined') (window as any).gm_authFailure = () => {};`
);

fs.writeFileSync('src/components/LocationPicker.tsx', code, 'utf8');
console.log('Done');
