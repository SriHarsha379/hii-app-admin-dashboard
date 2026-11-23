const fs = require('fs');

function fixFile(filename) {
  let lines = fs.readFileSync(filename, 'utf8').split('\n');
  
  // Remove hook lines inside filter
  const toRemove = [];
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes('const pg = usePagination(') ||
        lines[i].includes('React.useEffect(() => { pg.setPage(1)')) {
      toRemove.push(i);
    }
  }
  for (let i = toRemove.length - 1; i >= 0; i--) {
    lines.splice(toRemove[i], 1);
  }

  // Find closing of filter().  Look for line with just });
  // then insert pg after it
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].match(/^\s*\}\);\s*$/) && i > 10) {
      // Check if previous lines contain filter logic
      const nearby = lines.slice(Math.max(0,i-15), i).join('\n');
      if (nearby.includes('matchesSearch') || nearby.includes('matchesRole') || nearby.includes('filteredData') || nearby.includes('filteredAdmins')) {
        // Find the variable name (filteredX)
        const varMatch = nearby.match(/const (filtered\w+)/);
        const varName = varMatch ? varMatch[1] : 'filteredData';
        lines.splice(i + 1, 0, '',
          `  const pg = usePagination(${varName}, 20);`,
          `  React.useEffect(() => { pg.setPage(1); }, [searchTerm]);`
        );
        console.log(`${filename}: inserted pg after line ${i+1} using ${varName}`);
        break;
      }
    }
  }

  fs.writeFileSync(filename, lines.join('\n'), 'utf8');
}

fixFile('src/pages/ActivityLogs.tsx');
fixFile('src/pages/Admins.tsx');
console.log('Done');
