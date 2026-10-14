const fs = require('fs');
const path = require('path');

const baseDir = path.join(__dirname);

// 1. Check index.html exists and references external modules
const indexHtml = fs.readFileSync(path.join(baseDir, 'index.html'), 'utf8');

const requiredFiles = [
  'css/styles.css',
  'js/data-store.js',
  'js/charts.js',
  'js/app.js'
];

console.log('--- Checking File References in index.html ---');
for (const relPath of requiredFiles) {
  const fullPath = path.join(baseDir, relPath);
  if (!fs.existsSync(fullPath)) {
    throw new Error(`Missing expected file: ${relPath}`);
  }
  const stat = fs.statSync(fullPath);
  console.log(`[FOUND] ${relPath} (${stat.size} bytes)`);

  if (!indexHtml.includes(relPath)) {
    throw new Error(`index.html does not link to: ${relPath}`);
  }
}
console.log('OK: All CSS and JS modules are linked in index.html');

// 2. Syntax Check JS Files
console.log('\n--- Checking JS Syntax ---');
const jsFiles = ['js/data-store.js', 'js/charts.js', 'js/app.js'];

for (const jsRel of jsFiles) {
  const code = fs.readFileSync(path.join(baseDir, jsRel), 'utf8');
  try {
    new Function(code);
    console.log(`[SYNTAX OK] ${jsRel}`);
  } catch (err) {
    console.error(`SYNTAX ERROR in ${jsRel}:`, err);
    process.exit(1);
  }
}

// 3. Verify Data Store Integrity
console.log('\n--- Checking Data Store Objects ---');
const window = {};
global.window = window;
eval(fs.readFileSync(path.join(baseDir, 'js/data-store.js'), 'utf8'));

if (!window.BPA_DATA || !window.BPA_DATA['oh-deer'] || !window.BPA_DATA['us-lawns']) {
  throw new Error('window.BPA_DATA missing clients');
}

console.log(`oh-deer tasks count: ${window.BPA_DATA['oh-deer'].tasks.length}`);
console.log(`us-lawns tasks count: ${window.BPA_DATA['us-lawns'].tasks.length}`);

// Test sanitizer
console.log(`sanitize test: ${window.sanitize("<script>alert('xss')</script>")}`);

console.log('\nALL VERIFICATIONS PASSED SUCCESSFULLY!');
