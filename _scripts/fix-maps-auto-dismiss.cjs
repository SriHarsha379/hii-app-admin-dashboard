const fs = require('fs');
let code = fs.readFileSync('src/components/LocationPicker.tsx', 'utf8');

// Add auto-dismiss observer after the gm_authFailure handler
code = code.replace(
  `// Suppress Google Maps auth dialog globally
if (typeof window !== 'undefined') (window as any).gm_authFailure = () => {};`,
  `// Suppress Google Maps auth dialog globally
if (typeof window !== 'undefined') {
  (window as any).gm_authFailure = () => {};
  // Auto-dismiss the "can't load Google Maps" dialog if it appears
  const observer = new MutationObserver(() => {
    const dialogs = document.querySelectorAll('.dismissButton, [class*="dismissButton"]');
    dialogs.forEach((el: any) => el.click());
    // Also find by text content
    document.querySelectorAll('button').forEach((btn: any) => {
      if (btn.textContent?.trim() === 'OK' && btn.closest('[class*="gm-"]')) btn.click();
    });
  });
  observer.observe(document.body, { childList: true, subtree: true });
}`
);

fs.writeFileSync('src/components/LocationPicker.tsx', code, 'utf8');
console.log('Done');
