/**
 * test_challenger_m2_r2_stress.js
 * 
 * Challenger 2 Round 2 Adversarial Stress & Performance Verification Harness
 * Milestone 2: Production Crawl Ingestion Engine
 * 
 * Verifies:
 * 1. High-volume parsing throughput (>10,000 rows/second), V8 heap stability, and flat memory ceilings (<50MB delta) under 25,000-row crawls.
 * 2. High-volume inlinks clustering (>1,000 inlinks up to 10,000 inlinks) with 4-decimal dominance ratio precision.
 * 3. WAF reconciliation and redirect evaluation SLA limits under high-volume workloads.
 * 4. End-to-end pipeline ingestion stress with task synthesis and completedTasks immutability.
 */

'use strict';

const fs = require('fs');
const path = require('path');
const { Readable } = require('stream');

const crawlPipeline = require('./server/ingestion/crawl-pipeline');

let passed = 0;
let failed = 0;
let total = 0;

function assert(condition, description, detail = '') {
  total++;
  if (condition) {
    passed++;
    console.log(`  ✅ [PASS] ${description}`);
  } else {
    failed++;
    console.error(`  ❌ [FAIL] ${description} ${detail ? '(' + detail + ')' : ''}`);
  }
}

async function runChallenger2R2Stress() {
  console.log('================================================================');
  console.log('🔥 CHALLENGER 2 (ROUND 2): 25,000-ROW PERFORMANCE & STRESS HARNESS');
  console.log('================================================================');

  const tmpDir = path.join(__dirname, 'test_tmp_challenger2_r2');
  if (!fs.existsSync(tmpDir)) {
    fs.mkdirSync(tmpDir, { recursive: true });
  }

  // ==========================================================================
  // SUITE 1: 25,000-ROW HIGH-VOLUME CRAWL INGESTION & V8 HEAP STABILITY
  // ==========================================================================
  console.log('\n--- Suite 1: 25,000-Row High-Volume Crawl Ingestion & V8 Heap Profiling ---');

  const rowCount25k = 25000;
  const crawlFile25k = path.join(tmpDir, 'internal_crawl_25k.csv');
  console.log(`  Generating ${rowCount25k.toLocaleString()} row crawl CSV at ${crawlFile25k}...`);

  const genStart = Date.now();
  const writeStream = fs.createWriteStream(crawlFile25k, { encoding: 'utf8' });

  // Include UTF-8 BOM and bilingual Spanish headers
  writeStream.write('\ufeff"Dirección","Código de respuesta","Estado","Tipo de contenido","Indexabilidad","Profundidad de rastreo","URL de redirección","Recuento de palabras"\n');

  let exp200 = 0;
  let exp301 = 0;
  let exp404 = 0;
  let exp403 = 0;
  let expL1 = 0;
  let expL2 = 0;
  let expL3 = 0;
  let expL4 = 0;
  let expTrap = 0;

  for (let i = 1; i <= rowCount25k; i++) {
    let statusCode, statusDesc, contentType, indexability, depth, redirectUrl = '', wordCount = 350;
    const depthMod = i % 16;
    depth = depthMod;

    if (depth <= 1) expL1++;
    else if (depth === 2) expL2++;
    else if (depth === 3) expL3++;
    else {
      expL4++;
      if (depth >= 10 && depth <= 16) expTrap++;
    }

    if (i % 25 === 0) {
      // 404 Not Found (4% = 1,000 rows)
      statusCode = 404;
      statusDesc = 'Not Found';
      contentType = 'text/html; charset=UTF-8';
      indexability = 'Non-Indexable';
      exp404++;
    } else if (i % 10 === 0) {
      // 301 Redirect (10% = 2,500 rows)
      statusCode = 301;
      statusDesc = 'Moved Permanently';
      contentType = 'text/html; charset=UTF-8';
      indexability = 'Non-Indexable';
      redirectUrl = `https://oh-deer.com/target-redirect-${i}/`;
      exp301++;
    } else if (i % 8 === 0) {
      // 403 WAF Cloudflare Bot Mitigation (12.5% = 3,125 rows minus collisions with 404/301 -> exactly calculated)
      statusCode = 403;
      statusDesc = 'Forbidden';
      contentType = 'text/html; charset=UTF-8';
      indexability = 'Non-Indexable';
      exp403++;
    } else {
      // 200 OK HTML Indexable
      statusCode = 200;
      statusDesc = 'OK';
      contentType = 'text/html; charset=UTF-8';
      indexability = 'Indexable';
      exp200++;
    }

    const rowUrl = `https://oh-deer.com/page-stress-${i}/`;
    writeStream.write(`"${rowUrl}","${statusCode}","${statusDesc}","${contentType}","${indexability}","${depth}","${redirectUrl}","${wordCount}"\n`);
  }

  await new Promise(resolve => writeStream.end(resolve));
  const fileSizeMb = (fs.statSync(crawlFile25k).size / (1024 * 1024)).toFixed(2);
  console.log(`  File generated: ${fileSizeMb} MB in ${Date.now() - genStart} ms`);

  // Force garbage collection if available (optional) and snapshot initial heap
  if (global.gc) global.gc();
  const heapBefore = process.memoryUsage().heapUsed;

  const parseStart = Date.now();
  const aggregateResult = await crawlPipeline.parseAndAggregateInternalFile(crawlFile25k);
  const parseElapsed = Date.now() - parseStart;

  const heapAfter = process.memoryUsage().heapUsed;
  const heapDeltaMb = Number(((heapAfter - heapBefore) / (1024 * 1024)).toFixed(2));
  const rowsPerSec = Math.round((rowCount25k / (parseElapsed || 1)) * 1000);

  console.log(`  ⏱️ Ingested 25,000 rows in ${parseElapsed} ms (${rowsPerSec.toLocaleString()} rows/sec)`);
  console.log(`  🧠 Heap Delta: ${heapDeltaMb} MB (Current Heap: ${(heapAfter / 1024 / 1024).toFixed(2)} MB)`);

  assert(aggregateResult.totalCrawledUrls === 25000, `25,000-row crawl processed 100% of rows (actual: ${aggregateResult.totalCrawledUrls})`);
  assert(aggregateResult.clean200HtmlPages === exp200, `Accurate 200 OK HTML count (${exp200} === ${aggregateResult.clean200HtmlPages})`);
  assert(aggregateResult.internal301Redirects === exp301, `Accurate internal 301 count (${exp301} === ${aggregateResult.internal301Redirects})`);
  assert(aggregateResult.broken404Pages === exp404, `Accurate broken 404 count (${exp404} === ${aggregateResult.broken404Pages})`);
  assert(aggregateResult.wafFalsePositive403 === exp403, `Accurate WAF 403 count (${exp403} === ${aggregateResult.wafFalsePositive403})`);
  assert(aggregateResult.crawlDepthBreakdown.level1 === expL1, `Accurate Level 1 count (${expL1})`);
  assert(aggregateResult.crawlDepthBreakdown.level2 === expL2, `Accurate Level 2 count (${expL2})`);
  assert(aggregateResult.crawlDepthBreakdown.level3 === expL3, `Accurate Level 3 count (${expL3})`);
  assert(aggregateResult.crawlDepthBreakdown.level4Plus === expL4, `Accurate Level 4+ count (${expL4})`);
  assert(aggregateResult.crawlDepthBreakdown.level10To16CrawlTrap === expTrap, `Accurate L10-16 crawl trap count (${expTrap})`);

  // Throughput and Heap SLA Checks
  assert(rowsPerSec > 10000, `Throughput exceeds SLA of > 10,000 rows/sec (actual: ${rowsPerSec.toLocaleString()} rows/sec)`);
  assert(heapDeltaMb < 50, `V8 heap delta is strictly bounded < 50MB (actual: ${heapDeltaMb} MB)`);
  assert(aggregateResult.sampleUrls.length <= 20, `Sample URLs correctly bounded (actual: ${aggregateResult.sampleUrls.length})`);
  assert(aggregateResult.sampleRedirects.length <= 50, `Sample redirects correctly bounded (actual: ${aggregateResult.sampleRedirects.length})`);
  assert(aggregateResult.sampleBroken.length <= 50, `Sample broken URLs correctly bounded (actual: ${aggregateResult.sampleBroken.length})`);

  // ==========================================================================
  // SUITE 2: HIGH-VOLUME INLINKS CLUSTERING (> 1,000 INLINKS) & 4-DECIMAL PRECISION
  // ==========================================================================
  console.log('\n--- Suite 2: High-Volume Inlinks Clustering (>1,000 inlinks) & 4-Decimal Dominance Ratio ---');

  // Test 2.1: 1,000 inlinks with 799 Footer (79.90%)
  const inlinks1k = [];
  for (let i = 1; i <= 1000; i++) {
    const isFooter = i <= 799;
    inlinks1k.push({
      source: `https://example.com/source-${i}/`,
      destination: 'https://example.com/broken-page/',
      anchor: isFooter ? 'Footer Link' : 'Content Link',
      linkPath: isFooter ? 'html > body > footer > div > a' : 'html > body > main > p > a'
    });
  }

  const tClust1 = Date.now();
  const clust1k = crawlPipeline.clusterInlinksByTemplate(inlinks1k, { minInlinks: 5, threshold: 0.80 });
  const tClustElapsed = Date.now() - tClust1;

  assert(clust1k.totalInlinks === 1000, `Total inlinks accurately counted: 1,000 (actual: ${clust1k.totalInlinks})`);
  assert(clust1k.dominanceRatio === 0.799, `Exact 4-decimal dominance ratio preserved without rounding up: 0.799 (actual: ${clust1k.dominanceRatio})`);
  assert(clust1k.isTemplateDefect === false, `At 79.9% dominance, isTemplateDefect is strictly false (actual: ${clust1k.isTemplateDefect})`);
  assert(clust1k.targetRole.includes('Víctor Henríquez'), `Correctly assigned to Víctor Henríquez (Technical SEO)`);
  assert(clust1k.suggestedPhase === 'Current Sprint (Immediate CMS)', `Correctly scheduled for Current Sprint (Immediate CMS)`);
  assert(tClustElapsed < 100, `Clustering latency for 1,000 inlinks is fast (actual: ${tClustElapsed} ms < 100ms)`);

  // Test 2.2: 1,000 inlinks with exactly 800 Footer (80.00%)
  const inlinks800 = [];
  for (let i = 1; i <= 1000; i++) {
    const isFooter = i <= 800;
    inlinks800.push({
      source: `https://example.com/source-${i}/`,
      destination: 'https://example.com/broken-page/',
      anchor: isFooter ? 'Footer Link' : 'Content Link',
      linkPath: isFooter ? 'html > body > footer > div > a' : 'html > body > main > p > a'
    });
  }

  const clust800 = crawlPipeline.clusterInlinksByTemplate(inlinks800, { minInlinks: 5, threshold: 0.80 });
  assert(clust800.dominanceRatio === 0.8, `Dominance ratio at 80% is 0.8 (actual: ${clust800.dominanceRatio})`);
  assert(clust800.isTemplateDefect === true, `At exactly 80.0%, isTemplateDefect is strictly true`);
  assert(clust800.targetRole.includes('Florin Chiriac'), `Correctly assigned to Dev Team (Florin/Jonie)`);
  assert(clust800.suggestedPhase === 'Phase 2 (Dev Backlog)', `Correctly routed to Phase 2 (Dev Backlog)`);
  assert(clust800.templateFileHint.includes('footer.php'), `Template file hint points to footer.php`);

  // Test 2.3: 10,000 high-volume inlinks with 8,001 Header (80.01%)
  const inlinks10k = [];
  for (let i = 1; i <= 10000; i++) {
    const isHeader = i <= 8001;
    inlinks10k.push({
      source: `https://example.com/source-page-${i}/`,
      destination: 'https://example.com/target-nav/',
      anchor: isHeader ? 'Nav Item' : 'Body Link',
      linkPath: isHeader ? 'html > body > header > nav > ul > li > a' : 'html > body > main > article > p > a'
    });
  }

  const t10kStart = Date.now();
  const clust10k = crawlPipeline.clusterInlinksByTemplate(inlinks10k, { minInlinks: 5, threshold: 0.80 });
  const t10kElapsed = Date.now() - t10kStart;

  assert(clust10k.totalInlinks === 10000, `Total inlinks for 10,000 dataset is 10,000 (actual: ${clust10k.totalInlinks})`);
  assert(clust10k.dominanceRatio === 0.8001, `4-decimal dominance ratio is 0.8001 (actual: ${clust10k.dominanceRatio})`);
  assert(clust10k.isTemplateDefect === true, `isTemplateDefect is strictly true for 80.01% Header`);
  assert(clust10k.dominantComponent === 'Header', `Dominant component is Header (actual: ${clust10k.dominantComponent})`);
  assert(clust10k.templateFileHint.includes('header.php'), `Template file hint points to header.php`);
  assert(t10kElapsed < 500, `10,000 inlinks clustered within SLA limit (actual: ${t10kElapsed} ms < 500ms)`);

  // Test 2.4: 2,000 inlinks with 1,999 Content (99.95%) - Must NOT flag template defect
  const inlinksContent = [];
  for (let i = 1; i <= 2000; i++) {
    const isContent = i <= 1999;
    inlinksContent.push({
      source: `https://example.com/blog-post-${i}/`,
      destination: 'https://example.com/service-page/',
      anchor: 'Read more',
      linkPath: isContent ? 'html > body > main > article > p > a' : 'html > body > footer > div > a'
    });
  }

  const clustContent = crawlPipeline.clusterInlinksByTemplate(inlinksContent, { minInlinks: 5, threshold: 0.80 });
  assert(clustContent.dominanceRatio === 0.9995, `4-decimal dominance ratio is 0.9995 (actual: ${clustContent.dominanceRatio})`);
  assert(clustContent.dominantComponent === 'Content', `Dominant component identified as Content`);
  assert(clustContent.isTemplateDefect === false, `Content dominance strictly does NOT flag template defect (editorial links)`);
  assert(clustContent.targetRole.includes('Víctor Henríquez'), `Content links route to Víctor Henríquez (Technical SEO)`);

  // ==========================================================================
  // SUITE 3: WAF RECONCILIATION & REDIRECT EVALUATION SLA LIMITS
  // ==========================================================================
  console.log('\n--- Suite 3: WAF Reconciliation & Redirect Evaluation SLA Limits ---');

  // Test 3.1: WAF Reconciliation under 25,000 rows
  const crawlItems25k = [];
  for (let i = 1; i <= 25000; i++) {
    let statusCode = 200;
    if (i % 8 === 0) statusCode = 403; // ~3,125 WAF blocks
    else if (i % 25 === 0) statusCode = 404; // 1,000 404s
    crawlItems25k.push({
      url: `https://oh-deer.com/item-${i}`,
      statusCode
    });
  }

  const tWafStart = Date.now();
  const wafReconciled = crawlPipeline.reconcileWafBlocks(crawlItems25k);
  const tWafElapsed = Date.now() - tWafStart;

  console.log(`  ⏱️ Reconciled 25,000 WAF items in ${tWafElapsed} ms`);
  assert(wafReconciled.wafDetected === true, `WAF detected under 3,125 403s`);
  assert(wafReconciled.wafCount === 3125, `Accurate WAF count: 3,125 (actual: ${wafReconciled.wafCount})`);
  assert(wafReconciled.clean200Count === 21000, `Clean 200 count preserved: 21,000 (actual: ${wafReconciled.clean200Count})`);
  assert(wafReconciled.broken404Count === 875, `Broken 404 count preserved: 875 (actual: ${wafReconciled.broken404Count})`);
  assert(wafReconciled.true4xxCount === 875, `true4xxCount excludes 403 WAF blocks (actual: ${wafReconciled.true4xxCount})`);
  assert(tWafElapsed < 100, `WAF reconciliation SLA met for 25,000 rows (actual: ${tWafElapsed} ms < 100ms)`);

  // Test 3.2: Redirect Evaluation SLA (5,000 evaluations across diverse edge cases)
  const redirectTestCases = [
    // Case A: Circular self-redirect
    { s: 'https://example.com/services/lawn-care/', t: 'https://example.com/services/lawn-care/', expStatus: 'CIRCULAR_SELF_REDIRECT', expRisk: true },
    // Case B: Circular self-redirect with trailing slash difference
    { s: 'https://example.com/about-us', t: 'https://example.com/about-us/', expStatus: 'CIRCULAR_SELF_REDIRECT', expRisk: true },
    // Case C: Single-segment subpage fallback (homepage trap protection)
    { s: 'https://example.com/missing-page/', t: 'https://example.com/', expStatus: 'ADJUSTED_ANTI_SOFT_404', expTarget: 'https://example.com/', expRisk: true },
    // Case D: Multi-segment blog post to homepage (parent hub fallback)
    { s: 'https://example.com/blog/2026/04/organic-tick-control/', t: 'https://example.com/', expStatus: 'ADJUSTED_ANTI_SOFT_404', expTarget: 'https://example.com/blog/', expRisk: true },
    // Case E: Multi-segment blog permalink without topic overlap (anti /blog/blog/ trap)
    { s: 'https://example.com/blog/2026/organic-tick-control/', t: 'https://example.com/blog/2026/commercial-snow-plowing/', expStatus: 'ADJUSTED_ANTI_SOFT_404', expTarget: 'https://example.com/blog/', expRisk: true },
    // Case F: Franchise location blog permalink (preserves location blog hub)
    { s: 'https://example.com/tampa/blog/2026/lawn-mowing-tips/', t: 'https://example.com/tampa/blog/2026/snow-removal/', expStatus: 'ADJUSTED_ANTI_SOFT_404', expTarget: 'https://example.com/tampa/blog/', expRisk: true },
    // Case G: Safe category hub whitelist
    { s: 'https://example.com/blog/old-post/', t: 'https://example.com/category/tick-control/', expStatus: 'CATEGORY_BLOG_HUB_SAFE', expTarget: 'https://example.com/category/tick-control/', expRisk: false },
    // Case H: Thematic match with high keyword overlap
    { s: 'https://example.com/blog/residential-lawn-aeration-guide/', t: 'https://example.com/blog/residential-lawn-aeration-services/', expStatus: 'DIRECT_THEMATIC_MATCH', expTarget: 'https://example.com/blog/residential-lawn-aeration-services/', expRisk: false },
    // Case I: Protocol upgrade (http -> https) is permitted
    { s: 'http://example.com/services/mowing/', t: 'https://example.com/services/mowing/', expStatus: 'DIRECT_THEMATIC_MATCH', expTarget: 'https://example.com/services/mowing/', expRisk: false },
    // Case J: Query param stripping is permitted
    { s: 'https://example.com/pricing/?utm_source=facebook', t: 'https://example.com/pricing/', expStatus: 'DIRECT_THEMATIC_MATCH', expTarget: 'https://example.com/pricing/', expRisk: false }
  ];

  const evalCount = 5000;
  const tRedirStart = Date.now();
  let correctStatusCount = 0;

  for (let i = 0; i < evalCount; i++) {
    const tc = redirectTestCases[i % redirectTestCases.length];
    const res = crawlPipeline.verifyAndAdjustRedirect(tc.s, tc.t);
    if (res.status === tc.expStatus && res.soft404Risk === tc.expRisk) {
      if (!tc.expTarget || res.targetUrl === tc.expTarget) {
        correctStatusCount++;
      }
    }
  }

  const tRedirElapsed = Date.now() - tRedirStart;
  const redirPerSec = Math.round((evalCount / (tRedirElapsed || 1)) * 1000);

  console.log(`  ⏱️ Evaluated 5,000 redirects in ${tRedirElapsed} ms (${redirPerSec.toLocaleString()} evals/sec)`);
  assert(correctStatusCount === evalCount, `All 5,000 redirect evaluations matched expected status and soft-404 rules (actual: ${correctStatusCount}/${evalCount})`);
  assert(redirPerSec > 10000, `Redirect evaluation throughput exceeds SLA of > 10,000 evals/sec (actual: ${redirPerSec.toLocaleString()} evals/sec)`);
  assert(tRedirElapsed < 500, `5,000 redirect evaluations completed in < 500ms (actual: ${tRedirElapsed} ms)`);

  // Verify specific guard correctness
  const doubleBlogCheck = crawlPipeline.verifyAndAdjustRedirect(
    'https://oh-deer.com/blog/2026/how-to-fertilize-lawn/',
    'https://oh-deer.com/blog/2026/commercial-snow-plowing/'
  );
  assert(doubleBlogCheck.targetUrl === 'https://oh-deer.com/blog/', `Double /blog/blog/ path prevented: targets https://oh-deer.com/blog/ (actual: ${doubleBlogCheck.targetUrl})`);
  assert(!doubleBlogCheck.targetUrl.includes('/blog/blog/'), `No double blog substring in target`);

  const selfRedirCheck = crawlPipeline.verifyAndAdjustRedirect(
    'https://oh-deer.com/services/tick-control/',
    'https://oh-deer.com/services/tick-control/'
  );
  assert(selfRedirCheck.status === 'CIRCULAR_SELF_REDIRECT', `Self-redirect flagged as CIRCULAR_SELF_REDIRECT`);
  assert(selfRedirCheck.soft404Risk === true, `Self-redirect flagged with soft404Risk: true`);

  const singleSegmentCheck = crawlPipeline.verifyAndAdjustRedirect(
    'https://oh-deer.com/missing-single-segment/',
    'https://oh-deer.com/'
  );
  assert(singleSegmentCheck.targetUrl === 'https://oh-deer.com/', `Single-segment subpage targets homepage without self-redirect (actual: ${singleSegmentCheck.targetUrl})`);
  assert(singleSegmentCheck.targetUrl !== 'https://oh-deer.com/missing-single-segment/', `Single-segment subpage does NOT redirect to itself`);

  // ==========================================================================
  // SUITE 4: END-TO-END PIPELINE INGESTION STRESS (25,000 ROWS + COMPLETED TASKS)
  // ==========================================================================
  console.log('\n--- Suite 4: End-to-End Pipeline Ingestion Stress & completedTasks Immutability ---');

  // Load baseline oh-deer.json
  const ohDeerBaselinePath = path.join(__dirname, 'data', 'clients', 'oh-deer.json');
  const ohDeerBaseline = JSON.parse(fs.readFileSync(ohDeerBaselinePath, 'utf8'));
  const baselineCompletedTasksCount = ohDeerBaseline.completedTasks ? ohDeerBaseline.completedTasks.length : 0;

  console.log(`  Baseline ohDEER has ${baselineCompletedTasksCount} completed tasks`);

  // Create a 5,000-line in-memory CSV for upload
  let csvUploadContent = '\ufeff"URL","Status Code","Status","Content Type","Indexability","Crawl Depth","Redirect URL"\n';
  for (let i = 1; i <= 5000; i++) {
    const isWaf = i % 8 === 0;
    const is301 = i % 10 === 0;
    const is404 = i % 25 === 0;
    const code = is404 ? 404 : is301 ? 301 : isWaf ? 403 : 200;
    csvUploadContent += `"https://oh-deer.com/page-${i}","${code}","${code === 200 ? 'OK' : 'Notice'}","text/html","${code === 200 ? 'Indexable' : 'Non-Indexable'}","${i % 8}","${is301 ? 'https://oh-deer.com/target' : ''}"\n`;
  }

  const inlinksCsvContent = `"Type","Source","Destination","Anchor","Link Path","Follow"\n"AHREF","https://oh-deer.com/page-1","https://oh-deer.com/missing","Contact","html > body > footer > div > a","true"\n"AHREF","https://oh-deer.com/page-2","https://oh-deer.com/missing","Contact","html > body > footer > div > a","true"\n"AHREF","https://oh-deer.com/page-3","https://oh-deer.com/missing","Contact","html > body > footer > div > a","true"\n"AHREF","https://oh-deer.com/page-4","https://oh-deer.com/missing","Contact","html > body > footer > div > a","true"\n"AHREF","https://oh-deer.com/page-5","https://oh-deer.com/missing","Contact","html > body > footer > div > a","true"\n`;

  const tUploadStart = Date.now();
  const uploadResult = await crawlPipeline.processRawUpload({
    clientSlug: 'oh-deer',
    payloads: {
      internalCsv: csvUploadContent,
      inlinksCsv: inlinksCsvContent
    },
    options: {
      recalibrateHealth: true,
      generateSprintTasks: true,
      preserveCompletedTasks: true,
      dryRun: true // Immutability test
    },
    existingClient: ohDeerBaseline
  });
  const tUploadElapsed = Date.now() - tUploadStart;

  console.log(`  ⏱️ Processed 5,000-row full pipeline upload in ${tUploadElapsed} ms`);
  assert(uploadResult.success === true, `Full upload returned success: true`);
  assert(uploadResult.completedTasksPreservedCount === baselineCompletedTasksCount, `completedTasks count strictly preserved (${baselineCompletedTasksCount} === ${uploadResult.completedTasksPreservedCount})`);
  assert(uploadResult.client.completedTasks.length === baselineCompletedTasksCount, `Client state preserves completedTasks length (${baselineCompletedTasksCount})`);
  assert(uploadResult.client.completedTasks[0].verifiedBy === 'Víctor Henríquez', `Víctor Henríquez verification signature intact`);
  assert(uploadResult.kpis.totalCrawledUrls === 5000, `KPIs accurately reflect 5,000 crawled URLs`);
  assert(uploadResult.tasksGeneratedCount > 0, `Actionable tasks generated from crawl (count: ${uploadResult.tasksGeneratedCount})`);
  assert(tUploadElapsed < 3000, `Full end-to-end pipeline upload completed in < 3000ms (actual: ${tUploadElapsed} ms)`);

  // Cleanup tmp directory
  try {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  } catch (err) {
    // Ignore cleanup error
  }

  // ==========================================================================
  // FINAL SCORECARD
  // ==========================================================================
  console.log('\n================================================================');
  console.log(`📊 CHALLENGER 2 (ROUND 2) RESULTS: ${passed} / ${total} tests passed (${((passed / total) * 100).toFixed(1)}%)`);
  if (failed > 0) {
    console.error(`❌ FAILED: ${failed} assertions`);
  } else {
    console.log(`🎉 ALL EMPIRICAL PERFORMANCE & STRESS TESTS PASSED WITH 0 FINDINGS!`);
  }
  console.log('================================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runChallenger2R2Stress().catch(err => {
  console.error('Unhandled test harness error:', err);
  process.exit(1);
});
