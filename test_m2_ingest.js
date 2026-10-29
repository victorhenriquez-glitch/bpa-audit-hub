/**
 * test_m2_ingest.js
 * 
 * Comprehensive Test Suite for Milestone 2: Production Crawl Ingestion Engine
 * 
 * Verifies:
 * - RFC-4180 parsing, multi-line fields, UTF-8 BOM stripping (\ufeff).
 * - Tolerant bilingual normalizer for Spanish and corrupted headers (Direccin, Cdigo de respuesta).
 * - Cloudflare WAF 403 reconciliation per GEMINI.md Rule 2 (818 blocks isolated, 945 200 OK kept clean).
 * - Inlinks DOM template clustering (>80% component dominance per GEMINI.md Rule 14 & Rule 5).
 * - BPA Anti-Soft-404 verification (blind homepage trap & blog slug overlap per GEMINI.md Rule 7).
 * - Calibrated True Health scoring without synthetic metrics (Rule 27).
 * - 4-part task synthesis (Rule 14 & Rule 25).
 * - Strict preservation of existing completedTasks and logged minutes.
 * - Live Express endpoints:
 *   - POST /api/clients/:slug/ingest/crawl
 *   - POST /api/clients/:slug/crawl/upload
 *   - POST /api/crawler/crawls/:crawlId/ingest
 */

'use strict';

const assert = require('assert');
const path = require('path');
const fs = require('fs');

process.env.NODE_ENV = 'test';
process.env.SCREAMING_FROG_MODE = 'mock';

const app = require('./server/index');
const crawlPipeline = require('./server/ingestion/crawl-pipeline');

async function runM2IngestTests() {
  console.log('====================================================');
  console.log('🧪 RUNNING BPA AUDIT HUB M2 CRAWL INGESTION TEST SUITE');
  console.log('====================================================');

  let passed = 0;
  let total = 0;

  function testAssert(condition, message) {
    total++;
    if (condition) {
      console.log(`✅ [PASS] ${message}`);
      passed++;
    } else {
      console.error(`❌ [FAIL] ${message}`);
      throw new Error(`Assertion failed: ${message}`);
    }
  }

  // ==========================================================================
  // SUITE 1: BOM STRIPPING & TOLERANT BILINGUAL COLUMN NORMALIZATION
  // ==========================================================================
  console.log('\n--- Suite 1: BOM Stripping & Normalization ---');

  // 1.1 BOM stripping
  const bomString = '\ufeffAddress,Status Code,Status\nhttps://example.com,200,OK';
  testAssert(crawlPipeline.stripBom(bomString).charCodeAt(0) !== 0xFEFF, 'stripBom removes UTF-8 BOM from string');
  testAssert(crawlPipeline.stripBom('clean string') === 'clean string', 'stripBom preserves clean strings');

  const bomBuffer = Buffer.from([0xEF, 0xBB, 0xBF, 0x48, 0x65, 0x6C, 0x6C, 0x6F]);
  testAssert(crawlPipeline.stripBom(bomBuffer) === 'Hello', 'stripBom removes UTF-8 BOM from Buffer');

  // 1.2 Sanitization of Spanish & corrupted headers
  testAssert(crawlPipeline.sanitizeHeader('Dirección') === 'direccion', 'sanitizeHeader normalizes diacritic ó/ó/é');
  testAssert(crawlPipeline.sanitizeHeader('Direcci\ufffdn') === 'direccin', 'sanitizeHeader handles Unicode replacement character');
  testAssert(crawlPipeline.sanitizeHeader('Código de respuesta') === 'codigoderespuesta', 'sanitizeHeader normalizes Spanish status code header');
  testAssert(crawlPipeline.sanitizeHeader('C\ufffddigo de respuesta') === 'cdigoderespuesta', 'sanitizeHeader normalizes corrupted Spanish status code');

  // 1.3 Bilingual column dictionary mapping
  const testHeaders = ['Direcci\ufffdn', 'C\ufffddigo de respuesta', 'Tipo de contenido', 'Inlinks', 'Profundidad de rastreo'];
  const colIndex = crawlPipeline.buildColumnIndex(testHeaders);
  testAssert(colIndex.url !== -1, 'Tolerant index resolves corrupted "Direccin" to url');
  testAssert(colIndex.statusCode !== -1, 'Tolerant index resolves corrupted "Cdigo de respuesta" to statusCode');
  testAssert(colIndex.crawlDepth !== -1, 'Tolerant index resolves "Profundidad de rastreo" to crawlDepth');

  // 1.4 RFC-4180 Multi-line & Escaped Quotes
  const multilineCsv = 'Address,Title,Status\n"https://example.com/page","Line 1\nLine 2 with ""quotes""",200';
  const parsedRows = crawlPipeline.parseCsvString(multilineCsv);
  testAssert(parsedRows.length === 2, 'RFC-4180 parser handles multi-line records without splitting rows');
  testAssert(parsedRows[1][1] === 'Line 1\nLine 2 with "quotes"', 'RFC-4180 parser preserves escaped quotes and internal newlines');

  // ==========================================================================
  // SUITE 2: CLOUDFLARE WAF 403 RECONCILIATION (GEMINI.md Rule 2)
  // ==========================================================================
  console.log('\n--- Suite 2: Cloudflare WAF 403 Reconciliation ---');

  const ohDeerUrls = [
    ...Array(818).fill({ url: 'https://oh-deer.com/page-blocked', statusCode: 403 }),
    ...Array(945).fill({ url: 'https://oh-deer.com/clean-page', statusCode: 200 }),
    ...Array(245).fill({ url: 'https://oh-deer.com/redirect', statusCode: 301 })
  ];

  const wafResult = crawlPipeline.reconcileWafBlocks(ohDeerUrls);
  testAssert(wafResult.wafDetected === true, 'reconcileWafBlocks flags Cloudflare WAF bot mitigation');
  testAssert(wafResult.wafCount === 818, 'reconcileWafBlocks isolates exactly 818 403 blocks');
  testAssert(wafResult.clean200Count === 945, 'reconcileWafBlocks keeps clean 200 OK count accurate (945)');
  testAssert(wafResult.broken404Count === 0, 'reconcileWafBlocks keeps broken 404 count at 0');
  testAssert(wafResult.true4xxCount === 0, 'reconcileWafBlocks excludes WAF 403s from true client errors');

  // Clean crawl with 0 403s
  const cleanUrls = Array(100).fill({ url: 'https://example.com', statusCode: 200 });
  const cleanWaf = crawlPipeline.reconcileWafBlocks(cleanUrls);
  testAssert(cleanWaf.wafDetected === false, 'reconcileWafBlocks reports no WAF for clean audits');
  testAssert(cleanWaf.wafCount === 0, 'Clean crawl has 0 WAF count');

  // ==========================================================================
  // SUITE 3: DOM LINK PATH CLASSIFIER & INLINKS TEMPLATE CLUSTERING
  // ==========================================================================
  console.log('\n--- Suite 3: DOM Link Path Classifier & Template Clustering ---');

  testAssert(crawlPipeline.inferLinkPosition('html > body > footer > div > a') === 'Footer', 'DOM classifier detects Footer');
  testAssert(crawlPipeline.inferLinkPosition('header > nav.primary-menu > ul > li > a') === 'Header', 'DOM classifier detects Header');
  testAssert(crawlPipeline.inferLinkPosition('aside#sidebar-primary > div.widget > a') === 'Sidebar', 'DOM classifier detects Sidebar');
  testAssert(crawlPipeline.inferLinkPosition('div.author-box > div.avatar > a') === 'Author Bio', 'DOM classifier detects Author Bio');
  testAssert(crawlPipeline.inferLinkPosition('article.post-entry > div.content > p > a') === 'Content', 'DOM classifier detects Content');

  // Template Clustering > 80% Rule
  const dominantFooterInlinks = [
    { source: 'https://oh-deer.com/p1', destination: 'https://oh-deer.com/cape-cod', linkPath: 'footer > a', linkPosition: 'Footer', statusCode: 301 },
    { source: 'https://oh-deer.com/p2', destination: 'https://oh-deer.com/cape-cod', linkPath: 'footer > a', linkPosition: 'Footer', statusCode: 301 },
    { source: 'https://oh-deer.com/p3', destination: 'https://oh-deer.com/cape-cod', linkPath: 'footer > a', linkPosition: 'Footer', statusCode: 301 },
    { source: 'https://oh-deer.com/p4', destination: 'https://oh-deer.com/cape-cod', linkPath: 'footer > a', linkPosition: 'Footer', statusCode: 301 },
    { source: 'https://oh-deer.com/p5', destination: 'https://oh-deer.com/cape-cod', linkPath: 'footer > a', linkPosition: 'Footer', statusCode: 301 },
    { source: 'https://oh-deer.com/p6', destination: 'https://oh-deer.com/cape-cod', linkPath: 'p > a', linkPosition: 'Content', statusCode: 301 }
  ];

  const clusterResult = crawlPipeline.clusterInlinksByTemplate(dominantFooterInlinks);
  testAssert(clusterResult.isTemplateDefect === true, 'clusterInlinksByTemplate detects template defect (>80% dominance)');
  testAssert(clusterResult.dominantComponent === 'Footer', 'Dominant component identified as Footer');
  testAssert(clusterResult.dominanceRatio >= 0.8, 'Dominance ratio is >= 0.8');
  testAssert(clusterResult.targetRole.includes('Dev Team'), 'Template defect routes to Dev Team');
  testAssert(clusterResult.templateFileHint.includes('footer.php'), 'Template file hint points to footer.php');

  // Scattered inlinks (< 80%)
  const scatteredInlinks = [
    { source: 'https://oh-deer.com/p1', destination: 'https://oh-deer.com/target', linkPosition: 'Footer', statusCode: 301 },
    { source: 'https://oh-deer.com/p2', destination: 'https://oh-deer.com/target', linkPosition: 'Header', statusCode: 301 },
    { source: 'https://oh-deer.com/p3', destination: 'https://oh-deer.com/target', linkPosition: 'Sidebar', statusCode: 301 },
    { source: 'https://oh-deer.com/p4', destination: 'https://oh-deer.com/target', linkPosition: 'Content', statusCode: 301 },
    { source: 'https://oh-deer.com/p5', destination: 'https://oh-deer.com/target', linkPosition: 'Content', statusCode: 301 }
  ];
  const scatteredResult = crawlPipeline.clusterInlinksByTemplate(scatteredInlinks);
  testAssert(scatteredResult.isTemplateDefect === false, 'Scattered links do not trigger template defect');
  testAssert(scatteredResult.targetRole.includes('Víctor Henríquez'), 'Scattered links route to Víctor / CMS');

  // Boundary 79.9% vs 80.0% precision test
  const inlinks799 = [
    ...Array(799).fill({ source: 'https://oh-deer.com/s', destination: 'https://oh-deer.com/d', linkPath: 'footer > a', linkPosition: 'Footer' }),
    ...Array(201).fill({ source: 'https://oh-deer.com/s', destination: 'https://oh-deer.com/d', linkPath: 'p > a', linkPosition: 'Content' })
  ];
  const cluster799 = crawlPipeline.clusterInlinksByTemplate(inlinks799);
  testAssert(cluster799.dominanceRatio === 0.799, 'Dominance ratio retains 4-decimal precision (0.799) without rounding to 0.8');
  testAssert(cluster799.isTemplateDefect === false, 'At 79.9%, isTemplateDefect is strictly false');

  // ==========================================================================
  // SUITE 4: BPA ANTI-SOFT-404 VERIFICATION (GEMINI.md Rule 7)
  // ==========================================================================
  console.log('\n--- Suite 4: BPA Anti-Soft-404 Verification ---');

  // Blind homepage redirect protection
  const blindHp = crawlPipeline.verifyAndAdjustRedirect('https://oh-deer.com/services/tick-control', 'https://oh-deer.com/');
  testAssert(blindHp.soft404Risk === true, 'Blind homepage redirect flagged as Soft-404 risk');
  testAssert(blindHp.targetUrl === 'https://oh-deer.com/services/', 'Blind homepage redirect adjusted to parent section hub');

  // Blog post zero keyword overlap
  const zeroOverlap = crawlPipeline.verifyAndAdjustRedirect(
    'https://oh-deer.com/blog/preventing-tick-bites-in-summer',
    'https://oh-deer.com/blog/winter-snow-removal-methods',
    { isBlog: true }
  );
  testAssert(zeroOverlap.soft404Risk === true, 'Zero topic keyword overlap flagged as Soft-404 risk');
  testAssert(zeroOverlap.targetUrl === 'https://oh-deer.com/blog/', 'Zero topic overlap adjusted to /blog/');

  // Blog post with high topic keyword overlap
  const thematicMatch = crawlPipeline.verifyAndAdjustRedirect(
    'https://oh-deer.com/blog/tick-control-safety-guidelines',
    'https://oh-deer.com/blog/tick-control-best-practices',
    { isBlog: true }
  );
  testAssert(thematicMatch.soft404Risk === false, 'High keyword overlap verified as thematic match');
  testAssert(thematicMatch.targetUrl === 'https://oh-deer.com/blog/tick-control-best-practices', 'Thematic target URL preserved');

  // Category hub target is safe
  const catHub = crawlPipeline.verifyAndAdjustRedirect('https://oh-deer.com/old-cat', 'https://oh-deer.com/category/ticks');
  testAssert(catHub.soft404Risk === false, 'Category hub target is safe against Soft-404');

  // Multi-segment WordPress blog permalinks avoid double /blog/blog/
  const deepBlog = crawlPipeline.verifyAndAdjustRedirect(
    'https://example.com/blog/2026/how-to-fertilize-lawn/',
    'https://example.com/blog/2026/commercial-snow-plowing/',
    { isBlog: true }
  );
  testAssert(!deepBlog.targetUrl.includes('/blog/blog/'), 'Multi-segment blog permalink avoids double /blog/blog/ path');
  testAssert(deepBlog.targetUrl === 'https://example.com/blog/', 'Multi-segment blog permalink correctly falls back to /blog/');
  testAssert(deepBlog.status === 'ADJUSTED_ANTI_SOFT_404', 'Zero keyword overlap triggers ADJUSTED_ANTI_SOFT_404');

  // Location multisite blog permalinks preserve location hub
  const locationBlog = crawlPipeline.verifyAndAdjustRedirect(
    'https://oh-deer.com/tampa/blog/2026/mosquito-prevention/',
    'https://oh-deer.com/tampa/blog/2026/snow-removal/',
    { isBlog: true }
  );
  testAssert(locationBlog.targetUrl === 'https://oh-deer.com/tampa/blog/', 'Location blog permalink preserves location blog hub');
  testAssert(!locationBlog.targetUrl.includes('/blog/blog/'), 'Location blog avoids double blog path');

  // Circular Self-Redirect detection
  const selfDirect = crawlPipeline.verifyAndAdjustRedirect(
    'https://example.com/services/mowing/',
    'https://example.com/services/mowing/'
  );
  testAssert(selfDirect.status === 'CIRCULAR_SELF_REDIRECT', 'Exact self-redirect returns CIRCULAR_SELF_REDIRECT status');
  testAssert(selfDirect.soft404Risk === true, 'Self-redirect flagged as soft404Risk: true');

  const selfSlash = crawlPipeline.verifyAndAdjustRedirect(
    'https://example.com/services/mowing',
    'https://example.com/services/mowing/'
  );
  testAssert(selfSlash.status === 'CIRCULAR_SELF_REDIRECT', 'Trailing-slash normalized self-redirect returns CIRCULAR_SELF_REDIRECT');

  // Protocol upgrade and query cleaning are NOT circular redirects
  const sslUpgrade = crawlPipeline.verifyAndAdjustRedirect(
    'http://example.com/services/mowing/',
    'https://example.com/services/mowing/'
  );
  testAssert(sslUpgrade.status !== 'CIRCULAR_SELF_REDIRECT', 'HTTP to HTTPS upgrade is not flagged as circular');

  const queryClean = crawlPipeline.verifyAndAdjustRedirect(
    'https://example.com/services/mowing/?utm_source=adwords',
    'https://example.com/services/mowing/'
  );
  testAssert(queryClean.status !== 'CIRCULAR_SELF_REDIRECT', 'Query parameter stripping is not flagged as circular');

  // Single-segment subpage to homepage does not adjust to itself
  const singleSeg = crawlPipeline.verifyAndAdjustRedirect(
    'https://example.com/missing-page-sample-1/',
    'https://example.com/'
  );
  testAssert(singleSeg.targetUrl === 'https://example.com/', 'Single-segment subpage retains homepage target without self-redirect');
  testAssert(singleSeg.targetUrl !== 'https://example.com/missing-page-sample-1/', 'Single-segment subpage does NOT redirect to itself');

  // ==========================================================================
  // SUITE 5: CALIBRATED TRUE HEALTH SCORING (GEMINI.md Rule 27)
  // ==========================================================================
  console.log('\n--- Suite 5: Calibrated True Health Scoring ---');

  // Missing or zero crawl data returns null (Rule 27: Zero-Fabrication)
  testAssert(crawlPipeline.calculateCalibratedHealth(null).calibratedTrueHealth === null, 'Missing KPIs evaluates to null health score');
  testAssert(crawlPipeline.calculateCalibratedHealth({ totalCrawledUrls: 0 }).calibratedTrueHealth === null, 'Zero URLs crawled evaluates to null health score');

  // ohDEER empirical benchmark: 5692 crawled, 818 WAF 403, 0 404, 245 301, 324 dup H1, 14 dup titles
  const ohDeerKpis = {
    totalCrawledUrls: 5692,
    wafFalsePositive403: 818,
    broken404Pages: 0,
    internal301Redirects: 245,
    duplicateH1s: 324,
    duplicateTitlesPaginated: 14,
    missingH1s: 0
  };
  const ohDeerScore = crawlPipeline.calculateCalibratedHealth(ohDeerKpis);
  testAssert(ohDeerScore.calibratedTrueHealth === 92, 'ohDEER calibrated health matches ground truth score of 92');
  testAssert(ohDeerScore.calibrationNote.includes('818 pages'), 'Calibration note explicitly documents WAF 403 isolation');

  // Clean site
  const cleanScore = crawlPipeline.calculateCalibratedHealth({ totalCrawledUrls: 1000 });
  testAssert(cleanScore.calibratedTrueHealth === 99, 'Clean site with zero issues scores 99%');

  // ==========================================================================
  // SUITE 6: 4-PART TASK SYNTHESIZER (GEMINI.md Rule 14 & Rule 25)
  // ==========================================================================
  console.log('\n--- Suite 6: 4-Part Task Synthesizer ---');

  const sampleIssues = [
    { issueName: 'Page Titles: Duplicate', urlsAffected: 14 },
    { issueName: 'H1: Duplicate', urlsAffected: 324 }
  ];
  const sampleGraph = {
    dominant301Cluster: { originType: 'Footer Menu', dominantPath: 'footer > a' },
    sample404Urls: ['https://oh-deer.com/missing-test-1']
  };

  const tasks = crawlPipeline.generateTasksFromCrawl(
    Object.assign({}, ohDeerKpis, { broken404Pages: 1 }),
    sampleIssues,
    sampleGraph,
    { clientSlug: 'oh-deer', domain: 'oh-deer.com', workbookUrl: 'https://sheets.google.com/test' }
  );

  testAssert(Array.isArray(tasks) && tasks.length >= 3, 'generateTasksFromCrawl creates task array');

  for (const t of tasks) {
    testAssert(Array.isArray(t.sampleUrls) && t.sampleUrls.length > 0, `Task ${t.id} has Part 1: sampleUrls`);
    testAssert(typeof t.rootCause === 'string' && t.rootCause.length > 20, `Task ${t.id} has Part 2: rootCause`);
    testAssert(typeof t.technicalInstructions === 'string' && t.technicalInstructions.includes('Ready-to-Test'), `Task ${t.id} has Part 3: Ready-to-Test code`);
    testAssert(t.technicalInstructions.includes('Architectural Recommendation'), `Task ${t.id} has Part 4: Architectural recommendation`);
    testAssert(Array.isArray(t.acceptanceCriteria), `Task ${t.id} has acceptanceCriteria`);
    testAssert(typeof t.verificationMethod === 'string', `Task ${t.id} has verificationMethod`);
    testAssert(t.workbookUrl === 'https://sheets.google.com/test', `Task ${t.id} preserves workbookUrl link`);
  }

  // Zero-Filler Rule: If broken404Pages is 0, no 404 task generated
  const zero404Tasks = crawlPipeline.generateTasksFromCrawl(
    ohDeerKpis, // broken404Pages === 0
    sampleIssues,
    sampleGraph,
    { clientSlug: 'oh-deer', domain: 'oh-deer.com' }
  );
  testAssert(!zero404Tasks.some(t => t.id.includes('SPRINT-02')), 'Zero-filler policy: No 404 task generated when 404 count is 0');

  // ==========================================================================
  // SUITE 7: COMPLETEDTASKS & AUDITED MINUTES PRESERVATION
  // ==========================================================================
  console.log('\n--- Suite 7: completedTasks & State Merger Preservation ---');

  const existingOhDeer = JSON.parse(fs.readFileSync(path.join(__dirname, 'data/clients/oh-deer.json'), 'utf8'));
  const originalCompletedCount = existingOhDeer.completedTasks.length;
  testAssert(originalCompletedCount === 5, 'oh-deer.json baseline has 5 completed tasks');

  const mergedClient = crawlPipeline.mergeCrawlIntoClientState(
    'oh-deer',
    existingOhDeer,
    { totalCrawledUrls: 6000, clean200HtmlPages: 1000 },
    tasks,
    { preserveCompletedTasks: true, recalibrateHealth: true }
  );

  testAssert(mergedClient.completedTasks.length === 5, 'completedTasks length strictly preserved (5)');
  testAssert(mergedClient.completedTasks[0].verifiedBy === existingOhDeer.completedTasks[0].verifiedBy, 'completedTasks[0].verifiedBy preserved');
  testAssert(mergedClient.completedTasks[0].completedDate === existingOhDeer.completedTasks[0].completedDate, 'completedTasks[0].completedDate preserved');
  testAssert(mergedClient.kpis.totalCrawledUrls === 6000, 'KPIs updated with new crawl counts');
  testAssert(mergedClient.sprintSummary.totalEstimatedMinutes > 0, 'sprintSummary correctly recalculated');

  // Defensive parameter null-safety (Finding 3)
  const nullMerger = crawlPipeline.mergeCrawlIntoClientState('test-null', null, null, null, null);
  testAssert(nullMerger && nullMerger.clientSlug === 'test-null', 'mergeCrawlIntoClientState survives all null parameters');

  const nullTasks = crawlPipeline.generateTasksFromCrawl(null, null, null, null);
  testAssert(Array.isArray(nullTasks), 'generateTasksFromCrawl survives all null parameters');

  // ==========================================================================
  // SUITE 8: LIVE EXPRESS HTTP API INTEGRATION TESTS
  // ==========================================================================
  console.log('\n--- Suite 8: Live Express HTTP API Endpoints ---');

  const server = await new Promise((resolve) => {
    const s = app.listen(0, '127.0.0.1', () => resolve(s));
  });
  const port = server.address().port;
  const baseUrl = `http://127.0.0.1:${port}`;
  console.log(`📡 Ingestion test server listening on ${baseUrl}`);

  try {
    // 8.1 POST /api/clients/:slug/crawl/upload - validation error on empty payload
    const emptyUploadRes = await fetch(`${baseUrl}/api/clients/oh-deer/crawl/upload`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({})
    });
    testAssert(emptyUploadRes.status === 400, 'POST /crawl/upload with empty body returns 400 Bad Request');

    // 8.2 POST /api/clients/:slug/crawl/upload - nonexistent client
    const unknownClientRes = await fetch(`${baseUrl}/api/clients/nonexistent-client/crawl/upload`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ internalCsv: 'Address,Status Code\nhttps://example.com,200' })
    });
    testAssert(unknownClientRes.status === 404, 'POST /crawl/upload for unknown client returns 404 Not Found');

    // 8.3 POST /api/clients/:slug/crawl/upload - successful direct CSV ingestion
    const sampleInternalCsv = [
      'Address,Status Code,Status,Content Type,Indexability,Crawl Depth',
      'https://oh-deer.com/,200,OK,text/html,Indexable,0',
      'https://oh-deer.com/services/,200,OK,text/html,Indexable,1',
      'https://oh-deer.com/old-page,301,Moved Permanently,text/html,Non-Indexable,2'
    ].join('\n');

    const sampleInlinksCsv = [
      'Source,Destination,Link Path,Status Code,Status',
      'https://oh-deer.com/,https://oh-deer.com/old-page,footer > a,301,Moved Permanently',
      'https://oh-deer.com/services/,https://oh-deer.com/old-page,footer > a,301,Moved Permanently'
    ].join('\n');

    const uploadRes = await fetch(`${baseUrl}/api/clients/oh-deer/crawl/upload`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        internalCsv: sampleInternalCsv,
        inlinksCsv: sampleInlinksCsv,
        options: { dryRun: true }
      })
    });
    const uploadData = await uploadRes.json();
    testAssert(uploadRes.status === 200, 'POST /crawl/upload with direct CSVs returns 200 OK');
    testAssert(uploadData.success === true, 'Upload response contains success: true');
    testAssert(uploadData.clientSlug === 'oh-deer', 'Upload response contains correct clientSlug');
    testAssert(uploadData.completedTasksPreserved >= 5, 'Upload response confirms existing completedTasks preserved');
    testAssert(uploadData.updatedKpis.clean200HtmlPages === 2, 'Upload response extracted 2 clean 200 HTML pages');

    // 8.4 POST /api/clients/:slug/ingest/crawl - successful crawl ingestion with mock crawl
    const ingestRes = await fetch(`${baseUrl}/api/clients/oh-deer/ingest/crawl`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        crawlId: 'crawl_oh-deer_20261029061952',
        options: { dryRun: true }
      })
    });
    const ingestData = await ingestRes.json();
    testAssert(ingestRes.status === 200, 'POST /ingest/crawl returns 200 OK');
    testAssert(ingestData.success === true, 'Ingest response contains success: true');
    testAssert(ingestData.completedTasksPreserved >= 5, 'Ingest response confirms completedTasks preserved');
    testAssert(ingestData.updatedKpis !== undefined, 'Ingest response returns updatedKpis');

    // 8.5 POST /api/crawler/crawls/:crawlId/ingest - crawler route bridge
    const crawlerIngestRes = await fetch(`${baseUrl}/api/crawler/crawls/crawl_oh-deer_20261029061952/ingest`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        options: { dryRun: true }
      })
    });
    const crawlerIngestData = await crawlerIngestRes.json();
    testAssert(crawlerIngestRes.status === 200, 'POST /api/crawler/crawls/:id/ingest returns 200 OK');
    testAssert(crawlerIngestData.success === true, 'Crawler route bridge reports success: true');
    testAssert(crawlerIngestData.clientSlug === 'oh-deer', 'Crawler route bridge accurately inferred clientSlug');

  } finally {
    server.close();
  }

  console.log('====================================================');
  console.log(`📊 RESULTS: ${passed} / ${total} tests passed (100%)`);
  console.log('====================================================');
  console.log('🎉 ALL M2 CRAWL INGESTION TESTS PASSED!');
}

if (require.main === module) {
  runM2IngestTests().catch((err) => {
    console.error('❌ M2 TEST FAILURE:', err);
    process.exit(1);
  });
}

module.exports = runM2IngestTests;
