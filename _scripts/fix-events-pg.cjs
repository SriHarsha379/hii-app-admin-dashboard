const fs = require('fs');
let lines = fs.readFileSync('src/pages/Events.tsx', 'utf8').split('\n');

// Find the line with "const filteredEvents = eventList.filter"
// and the lines with pg inside it, remove them
const toRemove = [];
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('const pg = usePagination(filteredEvents') ||
      lines[i].includes('React.useEffect(() => { pg.setPage(1)')) {
    toRemove.push(i);
  }
}
// Remove from bottom up
for (let i = toRemove.length - 1; i >= 0; i--) {
  lines.splice(toRemove[i], 1);
}

// Find closing of filteredEvents sort (line with }).sort ... ending in ;)
// then find the next blank line after the sort block end
let sortEnd = -1;
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('return matchesSearch && matchesStatus && matchesCity') ) {
    // Find the closing }); after this
    for (let j = i; j < Math.min(i+10, lines.length); j++) {
      if (lines[j].match(/^\s*\}\)\s*;?\s*$/) || lines[j].match(/^\s*\}\)\s*\.sort/)) {
        sortEnd = j;
        break;
      }
    }
    break;
  }
}

// Find the end of the sort block
if (sortEnd > -1) {
  // Find the next }); after sortEnd
  for (let i = sortEnd; i < Math.min(sortEnd + 20, lines.length); i++) {
    if (lines[i].includes('.sort(')) {
      for (let j = i; j < Math.min(i + 20, lines.length); j++) {
        if (lines[j].match(/^\s*\}\)\s*;?\s*$/) && j > i) {
          // Insert pg after this line
          lines.splice(j + 1, 0, '',
            '  const pg = usePagination(filteredEvents, 20);',
            "  React.useEffect(() => { pg.setPage(1); }, [searchTerm]);"
          );
          console.log('Inserted pg at line', j + 1);
          break;
        }
      }
      break;
    }
  }
}

fs.writeFileSync('src/pages/Events.tsx', lines.join('\n'), 'utf8');
