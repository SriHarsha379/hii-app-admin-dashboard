const fs = require('fs');
let code = fs.readFileSync('src/pages/AdsBroadcast.tsx', 'utf8');

code = code.replace(
  `              className="glass-card w-full max-w-2xl rounded-[40px] border border-white/10 overflow-hidden shadow-2xl"`,
  `              className="glass-card w-full max-w-2xl rounded-[40px] border border-white/10 overflow-hidden shadow-2xl max-h-[90vh] flex flex-col"`
);

code = code.replace(
  `              <div className="p-8 space-y-6">`,
  `              <div className="p-8 space-y-6 overflow-y-auto flex-1">`
);

fs.writeFileSync('src/pages/AdsBroadcast.tsx', code, 'utf8');
console.log('Done');
