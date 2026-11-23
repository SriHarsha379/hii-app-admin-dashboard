const fs = require('fs');
let code = fs.readFileSync('src/components/LocationPicker.tsx', 'utf8');

// Add error handler to suppress the Google Maps dialog
code = code.replace(
  `function loadGoogleMaps(): Promise<void> {
  return new Promise((resolve) => {
    if ((window as any).google?.maps) { resolve(); return; }
    const existing = document.getElementById('google-maps-script');
    if (existing) { existing.addEventListener('load', () => resolve()); return; }
    const script = document.createElement('script');
    script.id = 'google-maps-script';
    script.src = \`https://maps.googleapis.com/maps/api/js?key=\${API_KEY}&libraries=places,maps&v=beta\`;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    document.head.appendChild(script);
  });
}`,
  `function loadGoogleMaps(): Promise<void> {
  return new Promise((resolve) => {
    if ((window as any).google?.maps) { resolve(); return; }
    const existing = document.getElementById('google-maps-script');
    if (existing) { existing.addEventListener('load', () => resolve()); return; }
    // Suppress the "This page can't load Google Maps correctly" dialog
    (window as any).gm_authFailure = () => { console.warn('Google Maps auth warning suppressed'); resolve(); };
    const script = document.createElement('script');
    script.id = 'google-maps-script';
    script.src = \`https://maps.googleapis.com/maps/api/js?key=\${API_KEY}&libraries=places\`;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    document.head.appendChild(script);
  });
}`
);

fs.writeFileSync('src/components/LocationPicker.tsx', code, 'utf8');
console.log('Done');
