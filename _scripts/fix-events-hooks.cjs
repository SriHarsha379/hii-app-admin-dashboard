const fs = require('fs');
let code = fs.readFileSync('src/pages/Events.tsx', 'utf8');

// Remove the hook calls that are inside the filter
code = code.replace(
  `\n  const pg = usePagination(filteredEvents, 20);\n\n  // Reset to page 1 whenever the search/filter changes\n  React.useEffect(() => { pg.setPage(1); }, [searchTerm]);\n`,
  '\n'
);

// Find where filteredEvents ends (after the .sort()) and insert pg there
code = code.replace(
  `    return matchesSearch && matchesStatus && matchesCity;\n  })`,
  `    return matchesSearch && matchesStatus && matchesCity;\n  })`
);

// Add pg after the sort block
code = code.replace(
  `  }).sort(`,
  `  }).sort(`
);

// Find the sort's closing and add pg after it
const sortEnd = `  });\n\n  const pg = usePagination(filteredEvents, 20);\n  React.useEffect(() => { pg.setPage(1); }, [searchTerm]);`;
code = code.replace(
  /(\s*\}\)\.sort\([^)]+\)\s*\{[^}]+\}\s*\}\)\s*;)/,
  (match) => match + `\n\n  const pg = usePagination(filteredEvents, 20);\n  React.useEffect(() => { pg.setPage(1); }, [searchTerm]);`
);

fs.writeFileSync('src/pages/Events.tsx', code, 'utf8');
console.log('hooks after filter:', (code.match(/const pg = usePagination/g)||[]).length);
