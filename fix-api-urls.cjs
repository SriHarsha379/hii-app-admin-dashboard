// fix-api-urls.js
// One-time script: rewrites every fetch('/api/...') call in src/ to use
// the shared API_BASE constant, and adds the import automatically.
//
// Run with:  node fix-api-urls.js
// Then review the printed list of changed files before rebuilding.

const fs = require('fs');
const path = require('path');

const SRC_DIR = path.join(__dirname, 'src');
const API_CONFIG_PATH = path.join(SRC_DIR, 'lib', 'apiConfig.ts');

// Matches a quoted string starting with /api/  e.g. '/api/auth/login', "/api/users", `/api/events`
const API_STRING_RE = /(['"`])\/api((?:\/[^'"`]*)?)\1/g;

function walk(dir, files = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === 'node_modules' || entry.name.startsWith('.')) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, files);
    else if (/\.(tsx?|jsx?)$/.test(entry.name)) files.push(full);
  }
  return files;
}

function relativeImportPath(fromFile) {
  const fromDir = path.dirname(fromFile);
  let rel = path.relative(fromDir, API_CONFIG_PATH).replace(/\.ts$/, '');
  if (!rel.startsWith('.')) rel = './' + rel;
  return rel.split(path.sep).join('/'); // normalize for Windows just in case
}

let changedFiles = [];

for (const file of walk(SRC_DIR)) {
  if (file === API_CONFIG_PATH) continue;
  const original = fs.readFileSync(file, 'utf8');
  if (!API_STRING_RE.test(original)) continue;
  API_STRING_RE.lastIndex = 0; // reset regex state after .test()

  let updated = original.replace(API_STRING_RE, (_match, _quote, pathPart) => {
    return '`${API_BASE}' + pathPart + '`';
  });

  // Add the import if not already present
  const importLine = `import { API_BASE } from '${relativeImportPath(file)}';`;
  if (!updated.includes('API_BASE') || updated.includes(importLine)) {
    // no-op safeguard
  }
  if (updated.includes('API_BASE') && !new RegExp(importLine.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).test(updated)) {
    // Insert after the last existing import statement, or at the top
    const importMatches = [...updated.matchAll(/^import .+;\s*$/gm)];
    if (importMatches.length > 0) {
      const last = importMatches[importMatches.length - 1];
      const insertPos = last.index + last[0].length;
      updated = updated.slice(0, insertPos) + '\n' + importLine + updated.slice(insertPos);
    } else {
      updated = importLine + '\n' + updated;
    }
  }

  if (updated !== original) {
    fs.writeFileSync(file, updated, 'utf8');
    changedFiles.push(path.relative(__dirname, file));
  }
}

console.log(`\nDone. ${changedFiles.length} file(s) updated:\n`);
changedFiles.forEach(f => console.log('  -', f));
console.log('\nReview each file (git diff) before rebuilding.\n');