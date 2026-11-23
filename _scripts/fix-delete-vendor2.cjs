const fs = require('fs');
let code = fs.readFileSync('src/pages/Clubs.tsx', 'utf8');

code = code.replace(
  `        const res = await fetch(\`\${API_BASE}/vendor/delete_vendor/\${vendorId}\`, {`,
  `        const res = await fetch(\`\${API_BASE}/vendor/delete_vendor/\${vendorId}\`, {`
);

// Fix the vendor delete — already correct from previous script, just verify
console.log('vendor delete URL:', code.includes('/vendor/delete_vendor/'));
fs.writeFileSync('src/pages/Clubs.tsx', code, 'utf8');
