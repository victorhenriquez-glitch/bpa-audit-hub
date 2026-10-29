/**
 * test_m2_adversarial_challenger.js
 * 
 * Empirical Adversarial & Stress Harness for Milestone 2: Production Crawl Ingestion Engine
 * Challenger 1 Verification Suite
 */

'use strict';

const assert = require('assert');
const path = require('path');
const fs = require('fs');
const http = require('http');
const { Readable } = require('stream');

process.env.NODE_ENV = 'test';
process.env.SCREAMING_FROG_MODE = 'mock';

const crawlPipeline = require('./server/ingestion/crawl-pipeline');
const app = require('./server/index');

const findings = [];
let passedCount = 0;
let failedCount = 0;
let totalCount = 0;

function challengeAssert(condition, message, findingOnFail = null) {
  totalCount++;
  if (condition) {
    console.log(`  ✅ [PASS] ${message}`);
    passedCount++;
    return true;
  } else {
    console.error(`  ❌ [FAIL] ${message}`);
    failedCount++;
    if (findingOnFail) {
      findings.push(findingOnFail);
    } else {
      findings.push({ severity: 'HIGH', title: message, detail: `Failed assertion: ${message}` });
    }
    return false;
  }
}

function recordObservation(severity, title, detail) {
  findings.push({ severity, title, detail });
  console.log(`  ⚠️  [OBSERVED ${severity}] ${title}: ${detail}`);
}

async function runAdversarialTests() {
  console.log('================================================================');
  console.log('⚡ ADVERSARIAL STRESS HARNESS — CHALLENGER 1 (MILESTONE 2)');
  console.log('================================================================');

  // ============================================================================
  // SUITE 1: PARSER STRESS & MALFORMED PAYLOADS
  // ============================================================================
  console.log('\n--- Suite 1: Parser Stress & Malformed Payloads ---');

  // 1.1: 0-byte inputs and empty buffers
  challengeAssert(crawlPipeline.stripBom('') === '', 'stripBom handles empty string');
  challengeAssert(crawlPipeline.stripBom(Buffer.alloc(0)) === '', 'stripBom handles empty Buffer');
  challengeAssert(crawlPipeline.stripBom(null) === '', 'stripBom handles null safely');
  challengeAssert(crawlPipeline.stripBom(undefined) === '', 'stripBom handles undefined safely');
  challengeAssert(crawlPipeline.parseCsvString('').length === 0, 'parseCsvString handles 0-byte string');
  challengeAssert(crawlPipeline.parseCsvString(Buffer.alloc(0)).length === 0, 'parseCsvString handles 0-byte Buffer');
  challengeAssert(crawlPipeline.parseCsvString(null).length === 0, 'parseCsvString handles null safely');
  challengeAssert(crawlPipeline.parseCsvString(undefined).length === 0, 'parseCsvString handles undefined safely');
  challengeAssert(crawlPipeline.parseIssuesOverviewCsv('').length === 0, 'parseIssuesOverviewCsv handles 0-byte input');
  
  const inlinksEmpty = crawlPipeline.parseInlinksCsv('');
  challengeAssert(inlinksEmpty.totalInlinks === 0 && inlinksEmpty.inlinks.length === 0, 'parseInlinksCsv handles 0-byte input');

  // 1.2: Whitespace-only and single-row CSVs
  const whitespaceCsv = '   \r\n\r\n   \r\n   ';
  challengeAssert(crawlPipeline.parseCsvString(whitespaceCsv).length === 0, 'parseCsvString discards blank/whitespace rows');

  const singleHeaderCsv = 'Address,Status Code,Status Description';
  const parsedSingle = crawlPipeline.parseCsvString(singleHeaderCsv);
  challengeAssert(parsedSingle.length === 1 && parsedSingle[0].length === 3, 'parseCsvString parses single header line without newline');

  const singleCellCsv = 'SingleHeaderOnly';
  const parsedSingleCell = crawlPipeline.parseCsvString(singleCellCsv);
  challengeAssert(parsedSingleCell.length === 1 && parsedSingleCell[0][0] === 'SingleHeaderOnly', 'parseCsvString parses single cell without trailing newline');

  // 1.3: Unclosed quotes recovery
  const unclosedQuoteCsv = 'Address,Status Code,Status Description\nhttps://example.com,"unclosed quote field here,200\nhttps://example.com/2,200,OK';
  let unclosedParsed = [];
  try {
    unclosedParsed = crawlPipeline.parseCsvString(unclosedQuoteCsv);
    challengeAssert(unclosedParsed.length >= 1, 'parseCsvString survives unclosed quote without hanging or throwing');
  } catch (err) {
    challengeAssert(false, 'parseCsvString threw on unclosed quote', {
      severity: 'HIGH',
      title: 'CSV Parser Throws on Unclosed Quote',
      detail: err.message
    });
  }

  // 1.4: Massive fields (100KB field)
  const massiveContent = 'A'.repeat(100 * 1024);
  const massiveCsv = `Address,Status Code,Notes\nhttps://example.com,200,"${massiveContent}"\n`;
  const parsedMassive = crawlPipeline.parseCsvString(massiveCsv);
  challengeAssert(parsedMassive.length === 2, 'parseCsvString handles 100KB field without memory crash');
  challengeAssert(parsedMassive[1][2].length === 100 * 1024, '100KB field content preserved exactly');

  // 1.5: Multi-line CRLF / LF splits across stream chunk boundaries
  const streamData1 = 'Address,Title,Status\r\nhttps://example.com,"Multi-line\r';
  const streamData2 = '\nTitle Continued",200\r\n';
  
  const transform = new crawlPipeline.CsvRowTransform();
  const streamRows = [];
  transform.on('data', row => streamRows.push(row));

  await new Promise((resolve, reject) => {
    transform.on('end', resolve);
    transform.on('error', reject);
    transform.write(streamData1);
    transform.write(streamData2);
    transform.end();
  });

  challengeAssert(streamRows.length === 2, 'CsvRowTransform safely merges CRLF split across chunk boundaries');
  challengeAssert(streamRows[1] && streamRows[1][1] === 'Multi-line\r\nTitle Continued', 'CsvRowTransform preserves multi-line field with split CRLF');

  // 1.6: Ragged rows handling (missing columns and extra columns)
  const raggedCsv = 'Address,Status Code,Content Type,Crawl Depth\n' +
                    'https://example.com/short,200\n' + // only 2 cols
                    'https://example.com/extra,200,text/html,1,EXTRA_COL_1,EXTRA_COL_2\n' + // 6 cols
                    ',,,\n' + // empty cols
                    'https://example.com/normal,200,text/html,2\n';

  const raggedAgg = await crawlPipeline.parseAndAggregateInternalString(raggedCsv);
  challengeAssert(raggedAgg.totalCrawledUrls === 4, 'aggregateCrawlStream parses all 4 data rows despite ragged column lengths');
  challengeAssert(raggedAgg.clean200HtmlPages >= 2, 'aggregateCrawlStream accurately extracts clean 200 HTML pages from ragged rows');

  // ============================================================================
  // SUITE 2: TOLERANT BILINGUAL ENCODINGS & SPANISH CORRUPTED HEADERS
  // ============================================================================
  console.log('\n--- Suite 2: Tolerant Bilingual Encodings & Spanish Headers ---');

  // 2.1: BOM variations
  const utf16leBom = Buffer.from([0xFF, 0xFE, 0x41, 0x00, 0x64, 0x00]); // "Ad" in UTF-16LE
  challengeAssert(crawlPipeline.stripBom(utf16leBom).startsWith('Ad'), 'stripBom handles UTF-16LE BOM header in buffer');

  // 2.2: Spanish and corrupted diacritics
  const spanishHeaders = [
    'Dirección',
    'Direccin',
    'CÓDIGO DE RESPUESTA',
    'Cdigo de respuesta',
    'Tipo de Contenido',
    'Tamaño (bytes)',
    'Profundidad de rastreo',
    'Enlaces internos únicos',
    'Recuento de palabras'
  ];

  const colIdx = crawlPipeline.buildColumnIndex(spanishHeaders);
  challengeAssert(colIdx.url === 0, 'buildColumnIndex maps "Dirección" to url');
  challengeAssert(colIdx.statusCode === 2 || colIdx.statusCode === 3, 'buildColumnIndex maps uppercase "CÓDIGO DE RESPUESTA" to statusCode');
  challengeAssert(colIdx.contentType === 4, 'buildColumnIndex maps "Tipo de Contenido" to contentType');
  challengeAssert(colIdx.sizeBytes === 5, 'buildColumnIndex maps "Tamaño (bytes)" to sizeBytes');
  challengeAssert(colIdx.crawlDepth === 6, 'buildColumnIndex maps "Profundidad de rastreo" to crawlDepth');
  challengeAssert(colIdx.inlinks === 7, 'buildColumnIndex maps "Enlaces internos únicos" to inlinks');
  challengeAssert(colIdx.wordCount === 8, 'buildColumnIndex maps "Recuento de palabras" to wordCount');

  // 2.3: Non-matching / garbage headers
  const garbageHeaders = ['###', '???', '12345', 'Unrelated_Random_Column_XYZ'];
  const garbageIdx = crawlPipeline.buildColumnIndex(garbageHeaders);
  challengeAssert(Object.keys(garbageIdx).length === 0, 'buildColumnIndex gracefully ignores non-matching headers without throwing');

  // ============================================================================
  // SUITE 3: CLUSTERING & EXACT BOUNDARY THRESHOLD STRESS
  // ============================================================================
  console.log('\n--- Suite 3: Clustering & Exact Boundary Threshold Stress ---');

  // 3.1: Undefined, null, and empty DOM linkPath
  const emptyDomInlinks = [
    { source: 'https://example.com/a', destination: 'https://example.com/b', linkPath: undefined, linkPosition: undefined },
    { source: 'https://example.com/c', destination: 'https://example.com/d', linkPath: null, linkPosition: null },
    { source: 'https://example.com/e', destination: 'https://example.com/f', linkPath: '', linkPosition: '' },
    { source: 'https://example.com/g', destination: 'https://example.com/h', linkPath: '   ', linkPosition: '   ' }
  ];

  let emptyDomClustered;
  try {
    emptyDomClustered = crawlPipeline.clusterInlinksByTemplate(emptyDomInlinks);
    challengeAssert(emptyDomClustered.isTemplateDefect === false, 'clusterInlinksByTemplate defaults empty DOM paths to non-template defect');
    challengeAssert(emptyDomClustered.dominantComponent === 'Content', 'clusterInlinksByTemplate defaults empty DOM paths to Content');
  } catch (err) {
    challengeAssert(false, 'clusterInlinksByTemplate threw on empty DOM paths', {
      severity: 'HIGH',
      title: 'Clustering Throws on Empty DOM Paths',
      detail: err.message
    });
  }

  // 3.2: Exact boundary test: 79.9% vs 80.0% template dominance
  // 79.9% dominance: 799 Footer, 201 Content out of 1000
  const inlinks799 = [
    ...Array(799).fill({ source: 'https://example.com/s', destination: 'https://example.com/d', linkPath: 'footer > a', linkPosition: 'Footer' }),
    ...Array(201).fill({ source: 'https://example.com/s', destination: 'https://example.com/d', linkPath: 'div.body > a', linkPosition: 'Content' })
  ];

  const cluster799 = crawlPipeline.clusterInlinksByTemplate(inlinks799);
  challengeAssert(cluster799.isTemplateDefect === false, 'At 79.9% dominance, isTemplateDefect is strictly FALSE (below 80% threshold)');
  challengeAssert(cluster799.targetRole.includes('Víctor'), 'At 79.9% dominance, task routes to Technical SEO (Víctor)');
  
  challengeAssert(cluster799.dominanceRatio === 0.799, 'clusterInlinksByTemplate returns 4-decimal precision ratio (0.799) avoiding premature 0.8 rounding');

  // 80.0% dominance: 800 Footer, 200 Content out of 1000
  const inlinks800 = [
    ...Array(800).fill({ source: 'https://example.com/s', destination: 'https://example.com/d', linkPath: 'footer > a', linkPosition: 'Footer' }),
    ...Array(200).fill({ source: 'https://example.com/s', destination: 'https://example.com/d', linkPath: 'div.body > a', linkPosition: 'Content' })
  ];

  const cluster800 = crawlPipeline.clusterInlinksByTemplate(inlinks800);
  challengeAssert(cluster800.isTemplateDefect === true, 'At exactly 80.0% dominance, isTemplateDefect is strictly TRUE');
  challengeAssert(cluster800.targetRole.includes('Florin') || cluster800.targetRole.includes('Dev'), 'At 80.0% dominance, task routes to Dev Team (Florin/Jonie)');
  challengeAssert(cluster800.templateFileHint === 'footer.php or template-parts/footer/', 'At 80.0% Footer dominance, templateFileHint points to footer.php');

  // 3.3: Small sample size (< minInlinks): 4 links with 100% Footer
  const inlinksSmall = [
    ...Array(4).fill({ source: 'https://example.com/s', destination: 'https://example.com/d', linkPath: 'footer > a', linkPosition: 'Footer' })
  ];
  const clusterSmall = crawlPipeline.clusterInlinksByTemplate(inlinksSmall, { minInlinks: 5 });
  challengeAssert(clusterSmall.isTemplateDefect === false, 'Inlink count below minInlinks (4 < 5) does not trigger template defect even with 100% footer ratio');

  // 3.4: Content dominance (95% in-content): Must NOT flag as template defect
  const inlinksContent = [
    ...Array(95).fill({ source: 'https://example.com/s', destination: 'https://example.com/d', linkPath: 'div.entry-content > p > a', linkPosition: 'Content' }),
    ...Array(5).fill({ source: 'https://example.com/s', destination: 'https://example.com/d', linkPath: 'footer > a', linkPosition: 'Footer' })
  ];
  const clusterContent = crawlPipeline.clusterInlinksByTemplate(inlinksContent);
  challengeAssert(clusterContent.isTemplateDefect === false, '95% Content dominance correctly does NOT trigger template defect (editorial links)');
  challengeAssert(clusterContent.targetRole.includes('Víctor'), 'Content links route to Víctor (Technical SEO)');

  // ============================================================================
  // SUITE 4: ANTI-SOFT-404 FALLBACK & REDIRECT EDGE CASES
  // ============================================================================
  console.log('\n--- Suite 4: Anti-Soft-404 Fallback & Redirect Edge Cases ---');

  // 4.1: Blind homepage trap adjustment
  const subpageHome = crawlPipeline.verifyAndAdjustRedirect('https://example.com/services/lawn-aeration/', 'https://example.com/');
  challengeAssert(subpageHome.status === 'ADJUSTED_ANTI_SOFT_404', 'Blind subpage redirect to homepage triggers ADJUSTED_ANTI_SOFT_404');
  challengeAssert(subpageHome.targetUrl === 'https://example.com/services/', 'Blind subpage redirect adjusted to parent section hub /services/');

  // 4.2: Safe Category / Blog Hub Whitelist
  const catHub = crawlPipeline.verifyAndAdjustRedirect('https://example.com/old-cat-post/', 'https://example.com/category/lawn-care/');
  challengeAssert(catHub.status === 'CATEGORY_BLOG_HUB_SAFE', 'Redirect to /category/ is recognized as CATEGORY_BLOG_HUB_SAFE');
  challengeAssert(catHub.targetUrl === 'https://example.com/category/lawn-care/', 'Safe category hub URL preserved');

  // 4.3: Blog post keyword overlap
  const highOverlap = crawlPipeline.verifyAndAdjustRedirect(
    'https://example.com/blog/residential-lawn-aeration-guide/',
    'https://example.com/blog/residential-lawn-aeration-services/',
    { isBlog: true }
  );
  challengeAssert(highOverlap.status === 'DIRECT_THEMATIC_MATCH', 'Blog post with shared keywords ("residential", "lawn", "aeration") verified as DIRECT_THEMATIC_MATCH');

  const zeroOverlap = crawlPipeline.verifyAndAdjustRedirect(
    'https://example.com/blog/summer-mosquito-tick-prevention/',
    'https://example.com/blog/winter-snow-removal-commercial/',
    { isBlog: true }
  );
  challengeAssert(zeroOverlap.status === 'ADJUSTED_ANTI_SOFT_404', 'Blog post with zero keyword overlap adjusted to prevent Soft-404');
  challengeAssert(zeroOverlap.targetUrl === 'https://example.com/blog/', 'Zero-overlap post adjusted to /blog/');

  // 4.4: Multi-segment WordPress permalink anomaly check
  // E.g. /blog/2026/how-to-fertilize-lawn/
  const deepBlog = crawlPipeline.verifyAndAdjustRedirect(
    'https://example.com/blog/2026/how-to-fertilize-lawn/',
    'https://example.com/blog/2026/commercial-snow-plowing/',
    { isBlog: true }
  );
  challengeAssert(!deepBlog.targetUrl.includes('/blog/blog/'), 'verifyAndAdjustRedirect avoids double /blog/blog/ path on multi-segment permalinks');
  challengeAssert(deepBlog.targetUrl === 'https://example.com/blog/', 'verifyAndAdjustRedirect targets clean /blog/ hub');

  // 4.5: Self-redirect / Circular Redirect edge case
  const selfRedirect = crawlPipeline.verifyAndAdjustRedirect(
    'https://example.com/services/mowing/',
    'https://example.com/services/mowing/'
  );
  challengeAssert(selfRedirect.status === 'CIRCULAR_SELF_REDIRECT', 'verifyAndAdjustRedirect rejects self-redirect with CIRCULAR_SELF_REDIRECT status');
  challengeAssert(selfRedirect.soft404Risk === true, 'Self-redirect flagged with soft404Risk: true');

  // 4.6: URLs without path tokens
  const rootDomain = crawlPipeline.verifyAndAdjustRedirect('https://example.com', 'https://example.com');
  challengeAssert(rootDomain.status !== undefined, 'verifyAndAdjustRedirect handles root domains without path tokens without throwing');

  // 4.7: Invalid URL syntax
  const invalidUrl = crawlPipeline.verifyAndAdjustRedirect('not-a-valid-url', 'https://example.com/');
  challengeAssert(invalidUrl.status === 'INVALID_URL', 'verifyAndAdjustRedirect returns INVALID_URL for malformed URL strings');

  // ============================================================================
  // SUITE 5: HEALTH CALIBRATION & ZERO-FABRICATION RULE 27
  // ============================================================================
  console.log('\n--- Suite 5: Health Calibration & Zero-Fabrication Rule 27 ---');

  // 5.1: Zero-URL crawl input: Must return calibratedTrueHealth: null (Rule 27)
  const emptyKpis1 = { totalCrawledUrls: 0 };
  const healthEmpty1 = crawlPipeline.calculateCalibratedHealth(emptyKpis1);
  challengeAssert(healthEmpty1.calibratedTrueHealth === null, 'totalCrawledUrls: 0 evaluates to calibratedTrueHealth: null');

  const emptyKpis2 = {};
  const healthEmpty2 = crawlPipeline.calculateCalibratedHealth(emptyKpis2);
  challengeAssert(healthEmpty2.calibratedTrueHealth === null, 'Empty KPIs object evaluates to calibratedTrueHealth: null');

  const nullHealth = crawlPipeline.calculateCalibratedHealth(null);
  challengeAssert(nullHealth.calibratedTrueHealth === null, 'null KPIs evaluates to calibratedTrueHealth: null');

  // 5.2: Negative values handling
  const negativeKpis = { totalCrawledUrls: -10, broken404Pages: 5 };
  const negativeHealth = crawlPipeline.calculateCalibratedHealth(negativeKpis);
  challengeAssert(negativeHealth.calibratedTrueHealth === null, 'Negative totalCrawledUrls evaluates to calibratedTrueHealth: null');

  // 5.3: Extreme 404 count clamping: 50,000 404s
  const disasterKpis = { totalCrawledUrls: 100000, broken404Pages: 50000 };
  const disasterHealth = crawlPipeline.calculateCalibratedHealth(disasterKpis);
  challengeAssert(disasterHealth.calibratedTrueHealth === 50, 'Disaster crawl with 50,000 404s clamps strictly to minimum health floor of 50');

  // 5.4: Clean site scoring (zero issues)
  const cleanKpis = { totalCrawledUrls: 1000, clean200HtmlPages: 1000, broken404Pages: 0, internal301Redirects: 0, duplicateH1s: 0 };
  const cleanHealth = crawlPipeline.calculateCalibratedHealth(cleanKpis);
  challengeAssert(cleanHealth.calibratedTrueHealth === 99, 'Clean site with zero issues scores calibratedTrueHealth: 99 (100 reserved)');

  // 5.5: Cloudflare WAF bot mitigation isolation (ohDEER ground truth benchmark)
  const wafKpis = {
    totalCrawledUrls: 5692,
    clean200HtmlPages: 945,
    wafFalsePositive403: 818,
    internal301Redirects: 245,
    broken404Pages: 0,
    duplicateTitlesPaginated: 14,
    duplicateH1s: 324
  };
  const wafHealth = crawlPipeline.calculateCalibratedHealth(wafKpis);
  challengeAssert(wafHealth.calibratedTrueHealth === 92, 'ohDEER WAF isolation produces calibratedTrueHealth: 92 matching benchmark');
  challengeAssert(wafHealth.calibrationNote.includes('Cloudflare WAF bot mitigation'), 'Calibration note explicitly explains WAF bot block isolation');

  // 5.6: Crawl depth trap penalty (L4+ ratio > 20%)
  const deepTrapKpis = {
    totalCrawledUrls: 1000,
    clean200HtmlPages: 900,
    crawlDepthBreakdown: { level1: 100, level2: 200, level3: 300, level4Plus: 400 } // 40% in L4+
  };
  const deepHealth = crawlPipeline.calculateCalibratedHealth(deepTrapKpis);
  // Base raw score 100 - 5 depth penalty = 95
  challengeAssert(deepHealth.calibratedTrueHealth === 95, 'Crawl depth trap (>20% in L4+) applies calibrated -5 penalty');

  // ============================================================================
  // SUITE 6: CONCURRENCY & STATE MUTATION ROBUSTNESS
  // ============================================================================
  console.log('\n--- Suite 6: Concurrency & State Mutation Robustness ---');

  // 6.1: Concurrent atomic writes
  const testSlug = 'temp-concurrency-test';
  const testClientsDir = path.resolve(__dirname, 'data/clients');
  const targetFile = path.join(testClientsDir, `${testSlug}.json`);

  const initialClientData = {
    clientSlug: testSlug,
    clientName: 'Concurrency Test Client',
    domain: 'concurrency-test.com',
    cmsStack: { platform: 'WordPress Multisite', theme: 'bpa-test' },
    kpis: { totalCrawledUrls: 100 },
    tasks: [],
    completedTasks: [{ id: 'COMP-01', title: 'Existing Completed Task', verifiedBy: 'Víctor', estimatedMinutes: 30 }]
  };

  // Run 20 concurrent atomic writes to the same slug with syncBundle: false
  const concurrentWrites = Array.from({ length: 20 }, (_, idx) => {
    const dataCopy = JSON.parse(JSON.stringify(initialClientData));
    dataCopy.kpis.totalCrawledUrls = 100 + idx;
    return Promise.resolve().then(() => {
      crawlPipeline.saveClientStateAtomically(testSlug, dataCopy, {
        clientsDir: testClientsDir,
        syncBundle: false
      });
    });
  });

  try {
    await Promise.all(concurrentWrites);
    challengeAssert(fs.existsSync(targetFile), 'Target JSON file exists after 20 concurrent atomic writes');
    const finalContent = JSON.parse(fs.readFileSync(targetFile, 'utf8'));
    challengeAssert(finalContent.clientName === 'Concurrency Test Client', 'Final JSON file is valid JSON without corrupted bytes');
    challengeAssert(finalContent.completedTasks.length === 1, 'Completed tasks preserved across all concurrent writes');
  } catch (err) {
    challengeAssert(false, 'Concurrent atomic writes threw exception', {
      severity: 'CRITICAL',
      title: 'Concurrent Atomic Writes Race Condition',
      detail: err.message
    });
  } finally {
    // Clean up temporary test file
    if (fs.existsSync(targetFile)) {
      try { fs.unlinkSync(targetFile); } catch (_) {}
    }
  }

  // 6.2: State preservation: Completed tasks must NEVER be dropped
  const existingClientWithCompleted = {
    clientSlug: 'test-preservation',
    clientName: 'Preservation Client',
    domain: 'test-preservation.com',
    tasks: [{ id: 'ACT-01', title: 'Active Task 1', phase: 'Current Sprint', estimatedMinutes: 15 }],
    completedTasks: [
      { id: 'DONE-01', title: 'Completed Fix 1', loggedMinutes: 30, verifiedDate: '2026-09-15' },
      { id: 'DONE-02', title: 'Completed Fix 2', loggedMinutes: 45, verifiedDate: '2026-09-20' }
    ]
  };

  const newCrawlKpis = { totalCrawledUrls: 500, broken404Pages: 2 };
  const newTasks = [{ id: 'DONE-01', title: 'Should be suppressed because completed' }, { id: 'NEW-01', title: 'Brand new task' }];

  const mergedPreservation = crawlPipeline.mergeCrawlIntoClientState(
    'test-preservation',
    existingClientWithCompleted,
    newCrawlKpis,
    newTasks
  );

  challengeAssert(mergedPreservation.completedTasks.length === 2, 'mergeCrawlIntoClientState strictly preserves 2/2 completed tasks');
  challengeAssert(mergedPreservation.completedTasks[0].id === 'DONE-01', 'completedTask metadata intact');
  challengeAssert(!mergedPreservation.tasks.some(t => t.id === 'DONE-01'), 'Completed task ID is suppressed from active tasks');
  challengeAssert(mergedPreservation.tasks.some(t => t.id === 'NEW-01'), 'New active task successfully appended');

  // 6.3: Defensive check on null arguments to mergeCrawlIntoClientState
  try {
    const res = crawlPipeline.mergeCrawlIntoClientState('test-null', null, null, null, null);
    challengeAssert(res && res.clientSlug === 'test-null', 'mergeCrawlIntoClientState survives null existingClient without throwing');
  } catch (err) {
    challengeAssert(false, `mergeCrawlIntoClientState crashed on null: ${err.message}`);
  }

  // 6.4: Defensive check on null arguments to generateTasksFromCrawl
  try {
    const tasks = crawlPipeline.generateTasksFromCrawl(null, null, null, null);
    challengeAssert(Array.isArray(tasks), 'generateTasksFromCrawl survives null crawlKpis without throwing');
  } catch (err) {
    challengeAssert(false, `generateTasksFromCrawl crashed on null: ${err.message}`);
  }

  // ============================================================================
  // SUITE 7: LIVE EXPRESS INGESTION ROUTE STRESS
  // ============================================================================
  console.log('\n--- Suite 7: Live Express Ingestion Route Stress ---');

  const server = http.createServer(app);
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const port = server.address().port;
  const baseUrl = `http://127.0.0.1:${port}`;

  function httpPost(urlPath, body) {
    return new Promise((resolve, reject) => {
      const payload = JSON.stringify(body);
      const req = http.request(baseUrl + urlPath, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(payload)
        }
      }, res => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          try {
            resolve({ status: res.statusCode, body: JSON.parse(data) });
          } catch (_) {
            resolve({ status: res.statusCode, raw: data });
          }
        });
      });
      req.on('error', reject);
      req.write(payload);
      req.end();
    });
  }

  function httpGet(urlPath) {
    return new Promise((resolve, reject) => {
      const req = http.request(baseUrl + urlPath, {
        method: 'GET'
      }, res => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          try {
            resolve({ status: res.statusCode, body: JSON.parse(data) });
          } catch (_) {
            resolve({ status: res.statusCode, raw: data });
          }
        });
      });
      req.on('error', reject);
      req.end();
    });
  }

  try {
    // 7.1: Upload route with empty CSV strings
    const emptyUploadRes = await httpPost('/api/clients/oh-deer/crawl/upload', {
      internalCsv: '',
      issuesCsv: '',
      inlinksCsv: ''
    });
    challengeAssert(emptyUploadRes.status === 400, 'POST /api/clients/:slug/crawl/upload rejects empty CSV payloads with 400 Bad Request');

    // 7.2: Upload route with Spanish BOM CSV
    const spanishCsvPayload = '\ufeffDirección,Código de respuesta,Tipo de contenido\nhttps://oh-deer.com/es-test,200,text/html';
    const spanishUploadRes = await httpPost('/api/clients/oh-deer/crawl/upload', {
      internalCsv: spanishCsvPayload,
      options: { dryRun: true }
    });
    challengeAssert(spanishUploadRes.status === 200, 'POST /api/clients/:slug/crawl/upload handles Spanish BOM CSV successfully (200 OK)');
    challengeAssert(spanishUploadRes.body.updatedKpis.clean200HtmlPages === 1, 'Spanish BOM CSV extracted 1 clean 200 HTML page');

    // 7.3: Ingest route with invalid client slug
    const invalidSlugRes = await httpPost('/api/clients/non-existent-client-999/ingest/crawl', {
      crawlExportPath: 'invalid/path'
    });
    challengeAssert(invalidSlugRes.status === 404, 'POST /api/clients/:slug/ingest/crawl returns 404 for unknown client');

    // 7.4: Ingest route with invalid/nonexistent export directory
    const invalidDirRes = await httpPost('/api/clients/oh-deer/ingest/crawl', {
      crawlExportPath: path.resolve(__dirname, 'non-existent-directory-xyz')
    });
    challengeAssert(invalidDirRes.status >= 400, 'POST /api/clients/:slug/ingest/crawl returns error status for nonexistent export directory');

    // 7.5: dryRun immutability check on live route
    const preRes = await httpGet('/api/clients/oh-deer');
    const preTasksCount = preRes.body.tasks.length;
    const dryRunUploadRes = await httpPost('/api/clients/oh-deer/crawl/upload', {
      issuesCsv: 'Issue Name,URLs\nDuplicate Titles,5\n',
      options: { dryRun: true }
    });
    challengeAssert(dryRunUploadRes.status === 200, 'POST /crawl/upload with dryRun: true returns 200 OK');
    challengeAssert(dryRunUploadRes.body.dryRun === true, 'dryRun response confirms dryRun: true');
    const postRes = await httpGet('/api/clients/oh-deer');
    challengeAssert(postRes.body.tasks.length === preTasksCount, 'In-memory clientsStore was NOT mutated during dryRun: true');

  } finally {
    server.close();
  }

  // ============================================================================
  // SUMMARY & VERDICT
  // ============================================================================
  console.log('\n================================================================');
  console.log(`📊 CHALLENGER 1 ADVERSARIAL TEST RESULTS:`);
  console.log(`   Passed: ${passedCount} / ${totalCount} (${((passedCount / totalCount) * 100).toFixed(1)}%)`);
  console.log(`   Failed: ${failedCount} / ${totalCount}`);
  console.log(`   Findings Recorded: ${findings.length}`);
  console.log('================================================================');

  if (findings.length > 0) {
    console.log('\n📋 RECORDED FINDINGS & OBSERVATIONS:');
    findings.forEach((f, i) => {
      console.log(`   ${i + 1}. [${f.severity}] ${f.title}: ${f.detail}`);
    });
  }

  return {
    passedCount,
    failedCount,
    totalCount,
    findings
  };
}

if (require.main === module) {
  runAdversarialTests().then(res => {
    process.exit(res.failedCount > 0 ? 1 : 0);
  }).catch(err => {
    console.error('Fatal testing error:', err);
    process.exit(1);
  });
}

module.exports = { runAdversarialTests };
