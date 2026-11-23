const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

// Remove any duplicate ToastProvider closing tags
code = code.replace(/\s*<\/ToastProvider>\s*\n\s*<\/AuthProvider>\s*\n\s*<\/ToastProvider>/g, '\n        </AuthProvider>\n        </ToastProvider>');

fs.writeFileSync('src/App.tsx', code, 'utf8');
console.log('Fixed');
