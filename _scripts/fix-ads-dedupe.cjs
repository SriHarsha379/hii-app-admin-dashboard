const fs = require('fs');
let lines = fs.readFileSync('src/pages/AdsBroadcast.tsx', 'utf8').split('\n');

// Find all 3 selectedAd modal start lines
const starts = [];
for (let i = 0; i < lines.length; i++) {
  if (lines[i].trim() === '{selectedAd && (') starts.push(i);
}
console.log('selectedAd modal starts:', starts.map(s => s+1));

// Find end of each modal block (matching closing )}  )
function findBlockEnd(lines, start) {
  let depth = 0;
  for (let i = start; i < lines.length; i++) {
    for (const ch of lines[i]) {
      if (ch === '(') depth++;
      if (ch === ')') { depth--; if (depth <= 0 && i > start) return i; }
    }
  }
  return -1;
}

const ends = starts.map(s => findBlockEnd(lines, s));
console.log('ends:', ends.map(e => e+1));

// Keep only the first one, remove the 2nd and 3rd (remove from bottom up)
for (let i = starts.length - 1; i >= 1; i--) {
  lines.splice(starts[i], ends[i] - starts[i] + 1);
  console.log(`Removed block ${i+1} (lines ${starts[i]+1}-${ends[i]+1})`);
}

fs.writeFileSync('src/pages/AdsBroadcast.tsx', lines.join('\n'), 'utf8');
console.log('Done. Remaining selectedAd blocks:', lines.filter(l => l.trim() === '{selectedAd && (').length);
