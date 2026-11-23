const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

// Add import
code = code.replace(
  `import React from 'react';`,
  `import React from 'react';\nimport { ToastProvider } from './context/ToastContext';`
);

// Wrap AuthProvider with ToastProvider
code = code.replace(
  `        <AuthProvider>`,
  `        <ToastProvider>\n        <AuthProvider>`
);
code = code.replace(
  `      </AuthProvider>`,
  `      </AuthProvider>\n        </ToastProvider>`
);

fs.writeFileSync('src/App.tsx', code, 'utf8');
console.log('Done');
