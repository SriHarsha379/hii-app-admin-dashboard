// check-api-urls.cjs
//
// Cross-checks every fetch() call in your frontend `src/` folder against the
// REAL routes defined in your backend `src/routes/admin/` folder, and reports
// any frontend call that doesn't match a real backend route.
//
// USAGE:
//   node check-api-urls.cjs --frontend "src" --backend "~/Downloads/admin-routes"

const fs = require('fs');
const path = require('path');
const os = require('os');

function resolveHome(p) {
  if (p.startsWith('~')) return path.join(os.homedir(), p.slice(1));
  return p;
}

function parseArgs() {
  const args = process.argv.slice(2);
  const opts = { frontend: 'src', backend: null, index: 'index.js', prefix: '/app/server/api/v1/admin' };
  for (let i = 0; i < args.length; i += 2) {
    const key = args[i].replace(/^--/, '');
    opts[key] = args[i + 1];
  }
  if (!opts.backend) {
    console.error('Missing required --backend <path to routes/admin folder>');
    process.exit(1);
  }
  opts.frontend = resolveHome(opts.frontend);
  opts.backend = resolveHome(opts.backend);
  return opts;
}

function walk(dir, exts, files = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === 'node_modules' || entry.name.startsWith('.')) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, exts, files);
    else if (exts.some(e => entry.name.endsWith(e))) files.push(full);
  }
  return files;
}

function parseIndexMounts(indexPath) {
  const content = fs.readFileSync(indexPath, 'utf8');
  const importMap = {};
  for (const m of content.matchAll(/import\s+(\w+)\s+from\s+["']\.\/(.+?)["']/g)) {
    importMap[m[1]] = m[2];
  }
  const mounts = [];
  for (const m of content.matchAll(/\{\s*path:\s*["']([^"']+)["']\s*,\s*route:\s*(\w+)\s*\}/g)) {
    const mountPath = m[1];
    const importName = m[2];
    const file = importMap[importName];
    if (file) mounts.push({ mountPath, file });
  }
  return mounts;
}

function parseRouteFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const routes = [];
  const re = /\.(get|post|put|patch|delete)\(\s*["']([^"']*)["']/g;
  for (const m of content.matchAll(re)) {
    routes.push({ method: m[1].toUpperCase(), subPath: m[2] });
  }
  return routes;
}

function buildValidEndpoints(opts) {
  const indexPath = path.join(opts.backend, opts.index);
  if (!fs.existsSync(indexPath)) {
    console.error(`Could not find index file at: ${indexPath}`);
    process.exit(1);
  }
  const mounts = parseIndexMounts(indexPath);
  const valid = new Set();
  const detail = [];

  for (const { mountPath, file } of mounts) {
    const filePath = path.join(opts.backend, file);
    if (!fs.existsSync(filePath)) {
      console.warn(`  (warning: route file not found for mount "${mountPath}": ${filePath})`);
      continue;
    }
    const routes = parseRouteFile(filePath);
    for (const { method, subPath } of routes) {
      const fullPath = (opts.prefix + mountPath + subPath).replace(/\/{2,}/g, '/');
      valid.add(`${method} ${fullPath}`);
      detail.push({ method, fullPath, file });
    }
  }
  return { valid, detail };
}

function scanFrontendFetches(frontendDir, prefix) {
  const files = walk(frontendDir, ['.ts', '.tsx', '.js', '.jsx']);
  const calls = [];
  const re = /fetch\(\s*`\$\{API_BASE\}([^`]*)`\s*(,\s*\{([^}]*)\})?/g;

  for (const file of files) {
    const content = fs.readFileSync(file, 'utf8');
    for (const m of content.matchAll(re)) {
      let subPath = m[1].split('?')[0];
      const optsBlock = m[3] || '';
      const methodMatch = optsBlock.match(/method:\s*['"](\w+)['"]/);
      const method = methodMatch ? methodMatch[1].toUpperCase() : 'GET';
      const fullPath = (prefix + subPath).replace(/\/{2,}/g, '/');
      calls.push({ file: path.relative(process.cwd(), file), method, fullPath });
    }
  }
  return calls;
}

function main() {
  const opts = parseArgs();

  console.log(`\nScanning backend routes in: ${opts.backend}`);
  const { valid } = buildValidEndpoints(opts);
  console.log(`Found ${valid.size} valid backend endpoints.\n`);

  console.log(`Scanning frontend fetch() calls in: ${opts.frontend}`);
  const calls = scanFrontendFetches(opts.frontend, opts.prefix);
  console.log(`Found ${calls.length} frontend fetch() calls using API_BASE.\n`);

  console.log('-'.repeat(70));
  let mismatchCount = 0;
  for (const call of calls) {
    const key = `${call.method} ${call.fullPath}`;
    const ok = valid.has(key);
    if (!ok) {
      mismatchCount++;
      console.log(`MISMATCH  [${call.file}]`);
      console.log(`   Frontend calls: ${call.method} ${call.fullPath}`);
      const suggestions = [...valid].filter(v => v.startsWith(call.method) && v.toLowerCase().includes(call.fullPath.split('/').pop().toLowerCase()));
      if (suggestions.length) {
        console.log(`   Possible match: ${suggestions[0]}`);
      }
      console.log('');
    }
  }
  console.log('-'.repeat(70));
  console.log(`\n${mismatchCount} mismatch(es) found out of ${calls.length} calls checked.\n`);

  if (mismatchCount === 0) {
    console.log('All frontend fetch() calls match a real backend route path (method + path).');
    console.log('Note: this does NOT verify response-shape unwrapping (.data) - check that separately.\n');
  }
}

main();
