const fs = require('fs');
let code = fs.readFileSync('src/components/LocationPicker.tsx', 'utf8');

// Replace loadGoogleMaps to just check if already loaded
code = code.replace(
  /function loadGoogleMaps\(\)[\s\S]*?^}/m,
  `function loadGoogleMaps(): Promise<void> {
  return new Promise((resolve) => {
    if ((window as any).google?.maps) { resolve(); return; }
    // Script is preloaded in index.html — just wait for it
    const check = setInterval(() => {
      if ((window as any).google?.maps) { clearInterval(check); resolve(); }
    }, 50);
    setTimeout(() => { clearInterval(check); resolve(); }, 5000);
  });
}`
);

fs.writeFileSync('src/components/LocationPicker.tsx', code, 'utf8');
console.log('Done');
