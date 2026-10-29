/**
 * Bright Pink Agency — Client Audit Contract Validator & Bundle Sync CLI
 * 
 * Ensures `data/clients/*.json` is the single source of truth:
 * 1. Validates strict BPA Data Contract (Rule 4 & Rule 27).
 * 2. Regenerates `js/data-store.js` from `data/clients/*.json` (--sync-bundle).
 * 3. Optionally pushes a validated client JSON to the Replit API (--api <url>).
 * 
 * USAGE:
 *   node bpa-audit-hub/scripts/ingest_client.js --client <slug> [--json <file>] [--dry-run]
 *   node bpa-audit-hub/scripts/ingest_client.js --sync-bundle
 */

const fs = require('fs');
const path = require('path');

const hubDir = path.join(__dirname, '..');
const clientsDir = path.join(hubDir, 'data', 'clients');
const dataStorePath = path.join(hubDir, 'js', 'data-store.js');

const args = process.argv.slice(2);
function getArg(flag) {
  const idx = args.indexOf(flag);
  return idx !== -1 && args[idx + 1] ? args[idx + 1] : null;
}
const hasFlag = (flag) => args.includes(flag);

const clientSlug = getArg('--client');
const jsonFilePath = getArg('--json');
const apiUrl = getArg('--api') || process.env.AUDIT_HUB_API_URL;
const isDryRun = hasFlag('--dry-run');
const isSyncBundle = hasFlag('--sync-bundle');

function validateClientContract(data) {
  const errors = [];
  if (!data || typeof data !== 'object') return ['Payload is not an object'];
  if (!data.clientName || typeof data.clientName !== 'string') errors.push('Missing or invalid clientName');
  if (!data.domain || typeof data.domain !== 'string') errors.push('Missing or invalid domain');
  if (!data.cmsStack || typeof data.cmsStack !== 'object') errors.push('Missing or invalid cmsStack object');
  if (!data.cmsStack || !data.cmsStack.platform) errors.push('Missing cmsStack.platform');
  if (!data.kpis || typeof data.kpis !== 'object') errors.push('Missing or invalid kpis object');
  if (data.kpis && (typeof data.kpis.totalCrawledUrls !== 'number' || isNaN(data.kpis.totalCrawledUrls))) {
    errors.push('Missing or invalid kpis.totalCrawledUrls');
  }
  if (!Array.isArray(data.tasks)) errors.push('Field tasks must be an array');
  if (!Array.isArray(data.completedTasks)) errors.push('Field completedTasks must be an array');
  return errors;
}

function rebuildDataStoreBundle() {
  const files = fs.readdirSync(clientsDir).filter(f => f.endsWith('.json')).sort();
  const bundle = {};

  for (const file of files) {
    const slug = file.replace('.json', '');
    const content = JSON.parse(fs.readFileSync(path.join(clientsDir, file), 'utf8'));
    const errors = validateClientContract(content);
    if (errors.length > 0) {
      throw new Error(`Contract validation failed for ${file}: ${errors.join(', ')}`);
    }
    bundle[slug] = content;
  }

  const output = `/**
 * Bright Pink Agency - Technical SEO Audit Hub Data Store
 * Auto-generated from canonical data/clients/*.json files via scripts/ingest_client.js.
 * Do not edit manually; update data/clients/*.json and run: npm run build:data
 */

window.BPA_DATA = ${JSON.stringify(bundle, null, 4)};

// Defensive HTML Sanitizer Utility
window.sanitize = function(str) {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
};
`;

  fs.writeFileSync(dataStorePath, output, 'utf8');
  console.log(`[BUILD] Regenerated js/data-store.js from ${files.length} canonical client JSON files.`);
}

async function run() {
  if (isSyncBundle && !clientSlug) {
    rebuildDataStoreBundle();
    return;
  }

  if (!clientSlug) {
    console.log(`Usage:
  node bpa-audit-hub/scripts/ingest_client.js --client <slug> [--json <path>] [--dry-run]
  node bpa-audit-hub/scripts/ingest_client.js --sync-bundle`);
    process.exit(1);
  }

  const targetClientPath = path.join(clientsDir, `${clientSlug}.json`);
  const sourcePath = jsonFilePath
    ? (path.isAbsolute(jsonFilePath) ? jsonFilePath : path.join(process.cwd(), jsonFilePath))
    : targetClientPath;

  if (!fs.existsSync(sourcePath)) {
    console.error(`[INGEST] Source file not found: ${sourcePath}`);
    process.exit(1);
  }

  const incomingData = JSON.parse(fs.readFileSync(sourcePath, 'utf8'));
  const errors = validateClientContract(incomingData);
  if (errors.length > 0) {
    console.error(`[INGEST] Data Contract Validation Failed (Rule 4):`);
    errors.forEach(e => console.error(`  - ${e}`));
    process.exit(1);
  }

  console.log(`[INGEST] Validated ${incomingData.clientName} (${incomingData.domain})`);
  console.log(`  Crawled URLs: ${incomingData.kpis.totalCrawledUrls.toLocaleString()} | Active Tasks: ${incomingData.tasks.length} | Completed: ${incomingData.completedTasks.length}`);

  if (isDryRun) {
    console.log(`[DRY-RUN] Validation complete. No files modified.`);
    return;
  }

  // Merge preserving existing completedTasks if updating from external JSON
  if (jsonFilePath && fs.existsSync(targetClientPath)) {
    const existing = JSON.parse(fs.readFileSync(targetClientPath, 'utf8'));
    if (Array.isArray(existing.completedTasks) && existing.completedTasks.length > 0) {
      const incomingIds = new Set((incomingData.completedTasks || []).map(t => t.id));
      for (const cmp of existing.completedTasks) {
        if (!incomingIds.has(cmp.id)) {
          incomingData.completedTasks.push(cmp);
        }
      }
    }
  }

  fs.writeFileSync(targetClientPath, JSON.stringify(incomingData, null, 2), 'utf8');
  rebuildDataStoreBundle();

  if (apiUrl) {
    const syncSecret = process.env.SYNC_SECRET;
    if (!syncSecret) {
      console.error(`[INGEST] SYNC_SECRET environment variable is required to push to remote API.`);
      process.exit(1);
    }
    const syncUrl = `${apiUrl.replace(/\/$/, '')}/api/clients/${clientSlug}/sync`;
    const response = await fetch(syncUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-sync-secret': syncSecret
      },
      body: JSON.stringify(incomingData)
    });
    if (!response.ok) {
      console.error(`[INGEST] Remote sync failed: HTTP ${response.status} — ${await response.text()}`);
      process.exit(1);
    }
    console.log(`[INGEST] Synced ${clientSlug} to ${syncUrl}`);
  }
}

run().catch(err => {
  console.error('[INGEST] Fatal error:', err.message);
  process.exit(1);
});
