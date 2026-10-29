/**
 * test_challenger_m2_perf.js
 * 
 * Challenger 2 Adversarial Stress & Performance Test Suite
 * Milestone 2: Production Crawl Ingestion Engine
 * 
 * Verifies:
 * 1. High-volume crawl ingestion (5,000 - 10,000+ rows) & V8 heap memory footprint
 * 2. 50MB payload limits & HTTP 413 boundary behavior
 * 3. 100+ issues task synthesis & deduplication
 * 4. completedTasks immutability under high concurrency & error states
 */

'use strict';

const fs = require('fs');
const path = require('path');
const http = require('http');
const { Readable } = require('stream');

const crawlPipeline = require('./server/ingestion/crawl-pipeline');
const app = require('./server/index');

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

async function runChallenger2Tests() {
  console.log('====================================================');
  console.log('🔥 CHALLENGER 2: PERFORMANCE & HIGH-VOLUME ADVERSARIAL SUITE');
  console.log('====================================================');

  const tmpDir = path.join(__dirname, 'test_tmp_challenger2');
  if (!fs.existsSync(tmpDir)) {
    fs.mkdirSync(tmpDir, { recursive: true });
  }

  // ==========================================================================
  // SUITE 1: HIGH-VOLUME CRAWL INGESTION & V8 HEAP PROFILING
  // ==========================================================================
  console.log('\n--- Suite 1: High-Volume Crawl Ingestion & V8 Heap Profiling ---');

  // 1.1 Generate 5,000-Row Realistic Screaming Frog Export
  const rowCount5k = 5000;
  const largeCrawlPath = path.join(tmpDir, 'internal_crawl_5k.csv');
  console.log(`  Generating ${rowCount5k.toLocaleString()} row crawl CSV at ${largeCrawlPath}...`);

  const csvStream = fs.createWriteStream(largeCrawlPath, { encoding: 'utf8' });
  // Include UTF-8 BOM and bilingual mixed headers to stress normalizer simultaneously
  csvStream.write('\ufeff"Dirección","Código de respuesta","Estado","Tipo de contenido","Indexabilidad","Profundidad de rastreo","URL de redirección"\n');

  let exp200 = 0;
  let exp301 = 0;
  let exp404 = 0;
  let exp403 = 0;
  let expL1 = 0;
  let expL2 = 0;
  let expL3 = 0;
  let expL4 = 0;
  let expTrap = 0;

  for (let i = 1; i <= rowCount5k; i++) {
    let statusCode, statusDesc, contentType, indexability, depth, redirectUrl = '';
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
      // 404
      statusCode = 404;
      statusDesc = 'Not Found';
      contentType = 'text/html';
      indexability = 'Non-Indexable';
      exp404++;
    } else if (i % 10 === 0) {
      // 301
      statusCode = 301;
      statusDesc = 'Moved Permanently';
      contentType = 'text/html';
      indexability = 'Non-Indexable';
      redirectUrl = `https://oh-deer.com/target-page-${i}/`;
      exp301++;
    } else if (i % 7 === 0) {
      // 403 WAF bot mitigation
      statusCode = 403;
      statusDesc = 'Forbidden';
      contentType = 'text/html';
      indexability = 'Non-Indexable';
      exp403++;
    } else {
      // 200 OK HTML
      statusCode = 200;
      statusDesc = 'OK';
      contentType = 'text/html; charset=UTF-8';
      indexability = 'Indexable';
      exp200++;
    }

    const row = `"https://oh-deer.com/page-slug-sample-${i}",${statusCode},"${statusDesc}","${contentType}","${indexability}",${depth},"${redirectUrl}"\n`;
    csvStream.write(row);
  }

  await new Promise(res => csvStream.end(res));
  const fileSize5k = fs.statSync(largeCrawlPath).size;
  console.log(`  File generated: ${(fileSize5k / 1024 / 1024).toFixed(2)} MB`);

  // 1.2 Ingest 5,000-Row Crawl & Profile Heap
  if (global.gc) global.gc();
  const heapBefore5k = process.memoryUsage().heapUsed;
  const start5k = Date.now();

  const aggResult5k = await crawlPipeline.parseAndAggregateInternalFile(largeCrawlPath);

  const duration5k = Date.now() - start5k;
  const heapAfter5k = process.memoryUsage().heapUsed;
  const heapDelta5kMb = (heapAfter5k - heapBefore5k) / 1024 / 1024;

  console.log(`  ⏱️ Ingested 5,000 rows in ${duration5k} ms (${Math.round(rowCount5k / (duration5k / 1000))} rows/sec)`);
  console.log(`  🧠 Heap Delta: ${heapDelta5kMb.toFixed(2)} MB (Used: ${(heapAfter5k / 1024 / 1024).toFixed(2)} MB)`);

  assert(aggResult5k.totalCrawledUrls === 5000, '5,000-row crawl processed 100% of rows (totalCrawledUrls === 5000)');
  assert(aggResult5k.clean200HtmlPages === exp200, `Accurate 200 OK HTML pages count (${aggResult5k.clean200HtmlPages} === ${exp200})`);
  assert(aggResult5k.internal301Redirects === exp301, `Accurate internal 301 redirects count (${aggResult5k.internal301Redirects} === ${exp301})`);
  assert(aggResult5k.broken404Pages === exp404, `Accurate broken 404 count (${aggResult5k.broken404Pages} === ${exp404})`);
  assert(aggResult5k.wafFalsePositive403 === exp403, `Accurate WAF 403 count (${aggResult5k.wafFalsePositive403} === ${exp403})`);
  assert(aggResult5k.crawlDepthBreakdown.level1 === expL1, `Accurate Level 1 depth tier count (${aggResult5k.crawlDepthBreakdown.level1})`);
  assert(aggResult5k.crawlDepthBreakdown.level10To16CrawlTrap === expTrap, `Accurate L10-16 crawl trap count (${aggResult5k.crawlDepthBreakdown.level10To16CrawlTrap})`);
  assert(duration5k < 3000, `Execution time is performant (${duration5k} ms < 3000 ms)`);
  assert(heapDelta5kMb < 35, `Heap memory delta is strictly bounded (${heapDelta5kMb.toFixed(2)} MB < 35 MB)`);

  // 1.3 Ultra-Large 10,000-Row Stream Processing
  console.log('  Testing 10,000-row streaming throughput via CsvRowTransform...');
  const rowCount10k = 10000;
  let rowsEmitted = 0;
  const start10k = Date.now();
  const heapBefore10k = process.memoryUsage().heapUsed;

  const transformStream = new crawlPipeline.CsvRowTransform();
  transformStream.on('data', () => { rowsEmitted++; });

  const stream10k = new Readable({
    read() {
      // Emit chunks of 50 rows
      const chunkRows = [];
      for (let j = 0; j < 50; j++) {
        chunkRows.push(`"https://example.com/item-${Math.random()}","200","OK","text/html","Indexable","2"`);
      }
      this.push(chunkRows.join('\r\n') + '\r\n');
    }
  });

  // Pipe through transform and limit to 10k rows
  await new Promise((resolve, reject) => {
    transformStream.on('data', () => {
      if (rowsEmitted >= rowCount10k) {
        stream10k.destroy();
        resolve();
      }
    });
    transformStream.on('error', reject);
    stream10k.pipe(transformStream);
  });

  const duration10k = Date.now() - start10k;
  const heapAfter10k = process.memoryUsage().heapUsed;
  const heapDelta10kMb = (heapAfter10k - heapBefore10k) / 1024 / 1024;
  console.log(`  ⏱️ Processed ${rowsEmitted.toLocaleString()} stream rows in ${duration10k} ms`);
  console.log(`  🧠 Heap Delta: ${heapDelta10kMb.toFixed(2)} MB`);

  assert(rowsEmitted >= rowCount10k, 'CsvRowTransform emitted all 10,000 rows without memory truncation');
  assert(heapDelta10kMb < 30, `Streaming heap memory is flat and bounded (${heapDelta10kMb.toFixed(2)} MB < 30 MB)`);

  // 1.4 High-Volume Inlinks Parsing (10,000 inlinks)
  console.log('  Testing 10,000 inlinks parsing & template dominance clustering...');
  const inlinksRows = ['Source,Destination,Link Path,Status Code,Status'];
  for (let k = 1; k <= 10000; k++) {
    if (k <= 8500) {
      // 85% Footer links
      inlinksRows.push(`https://oh-deer.com/page-${k},https://oh-deer.com/target,footer > div.nav > a,301,Moved Permanently`);
    } else if (k <= 9500) {
      // 10% Header links
      inlinksRows.push(`https://oh-deer.com/page-${k},https://oh-deer.com/target,header > nav > a,301,Moved Permanently`);
    } else {
      // 5% Content links
      inlinksRows.push(`https://oh-deer.com/page-${k},https://oh-deer.com/target,div.entry-content > p > a,301,Moved Permanently`);
    }
  }
  const inlinksCsv10k = inlinksRows.join('\n');
  const startInlinks = Date.now();
  const parsedInlinks10k = crawlPipeline.parseInlinksCsv(inlinksCsv10k);
  const cluster10k = crawlPipeline.clusterInlinksByTemplate(parsedInlinks10k.inlinks);
  const durationInlinks = Date.now() - startInlinks;

  console.log(`  ⏱️ Parsed 10,000 inlinks in ${durationInlinks} ms`);
  assert(parsedInlinks10k.totalInlinks === 10000, 'totalInlinks accurately counts 10,000 inlinks');
  assert(parsedInlinks10k.inlinks.length <= 500, `inlinks array memory capped to 500 sample rows (actual: ${parsedInlinks10k.inlinks.length})`);
  assert(cluster10k.isTemplateDefect === true, 'Accurately detected template defect on 85% dominance');
  assert(cluster10k.dominantComponent === 'Footer', 'Dominant component accurately identified as Footer');
  assert(cluster10k.dominanceRatio >= 0.85, `Dominance ratio is >= 85% (actual: ${cluster10k.dominanceRatio})`);

  // ==========================================================================
  // SUITE 2: PAYLOAD SIZE BOUNDARIES & EXPRESS HTTP LIMITS (50MB LIMIT)
  // ==========================================================================
  console.log('\n--- Suite 2: Payload Size Boundaries & Express HTTP Limits ---');

  const server = await new Promise(resolve => {
    const s = app.listen(0, '127.0.0.1', () => resolve(s));
  });
  const port = server.address().port;
  const baseUrl = `http://127.0.0.1:${port}`;
  console.log(`  📡 Test server running on ${baseUrl}`);

  try {
    // 2.1 Valid High-Volume CSV Upload (5MB JSON payload)
    console.log('  Testing valid high-volume CSV payload upload (~5.3MB)...');
    let validBigCsv = 'Address,Status Code,Status,Content Type,Indexability,Crawl Depth\n';
    const sampleRow = 'https://oh-deer.com/service/mosquito-and-tick-control-long-slug-sample,200,OK,text/html,Indexable,2\n';
    const repeatCount = Math.floor(5 * 1024 * 1024 / sampleRow.length);
    validBigCsv += sampleRow.repeat(repeatCount);

    const validPayload = JSON.stringify({
      internalCsv: validBigCsv,
      options: { dryRun: true }
    });
    const payloadBytes = Buffer.byteLength(validPayload);
    console.log(`  Sending ${payloadBytes.toLocaleString()} bytes (~${(payloadBytes / 1024 / 1024).toFixed(2)} MB)...`);

    const validUploadRes = await fetch(`${baseUrl}/api/clients/oh-deer/crawl/upload`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: validPayload
    });

    const validUploadData = await validUploadRes.json();
    assert(validUploadRes.status === 200, 'Valid 5MB payload returns HTTP 200 OK');
    assert(validUploadData.success === true, 'Upload response reports success: true');
    assert(validUploadData.updatedKpis.clean200HtmlPages >= 50000, `Parsed ~60,000 URLs successfully (${validUploadData.updatedKpis.clean200HtmlPages})`);
    assert(validUploadData.completedTasksPreserved >= 5, 'completedTasks strictly preserved on large upload');

    // 2.2 Boundary Rejection: Payload > 50MB (51MB)
    console.log('  Testing boundary rejection: payload > 50MB (51MB) must return HTTP 413...');
    const oversizedBytes = 51 * 1024 * 1024;
    const chunk1Mb = Buffer.alloc(1024 * 1024, 'z');

    const oversizedStatus = await new Promise((resolve) => {
      const req = http.request({
        hostname: '127.0.0.1',
        port,
        path: '/api/clients/oh-deer/crawl/upload',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': oversizedBytes
        }
      }, (res) => {
        let responseBody = '';
        res.on('data', d => { responseBody += d; });
        res.on('end', () => {
          resolve({ status: res.statusCode, body: responseBody });
        });
      });

      req.on('error', (err) => {
        // Socket closed by server after emitting 413
      });

      for (let c = 0; c < 51; c++) {
        req.write(chunk1Mb);
      }
      req.end();
    });

    assert(oversizedStatus.status === 413, `Oversized 51MB payload rejected with HTTP 413 (actual: ${oversizedStatus.status})`);
    let is413Json = false;
    try {
      const errObj = JSON.parse(oversizedStatus.body);
      is413Json = errObj.error && errObj.error.includes('too large');
    } catch (_) {}
    assert(is413Json, `HTTP 413 body contains JSON error: "${oversizedStatus.body.trim()}"`);

    // 2.3 Server Resilience: Verify server is responsive immediately after 413 rejection
    const followUpRes = await fetch(`${baseUrl}/api/clients/oh-deer/crawl/upload`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        internalCsv: 'Address,Status Code\nhttps://oh-deer.com/,200',
        options: { dryRun: true }
      })
    });
    const followUpData = await followUpRes.json();
    assert(followUpRes.status === 200, 'Server remains fully responsive after 413 rejection (HTTP 200 OK)');
    assert(followUpData.success === true, 'Follow-up request successfully processed');

    // 2.4 Malformed JSON rejection
    const malformedRes = await fetch(`${baseUrl}/api/clients/oh-deer/crawl/upload`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: '{"internalCsv": "Address,Status Code\nhttps://example.com,200"' // unclosed JSON
    });
    assert(malformedRes.status === 400, `Malformed JSON body returns HTTP 400 Bad Request (actual: ${malformedRes.status})`);

  } finally {
    server.close();
  }

  // ==========================================================================
  // SUITE 3: TASK & STATE SYNTHESIS STRESS (100+ ISSUES & DEDUPLICATION)
  // ==========================================================================
  console.log('\n--- Suite 3: Task & State Synthesis Stress (100+ Issues & Deduplication) ---');

  // 3.1 Ingestion of 150 Unique Issues
  console.log('  Generating 150 unique issues in issues_overview.csv...');
  const issuesRows = ['Issue Name,Issue Type,Issue Priority,URLs,URLs %,URLs Total,Description,How to Fix'];

  // Add key SEO issues that feed task synthesizers
  issuesRows.push('H1: Duplicate,Warning,Medium,42,4.5,945,Duplicate H1 tags detected sitewide,Update template to ensure single H1');
  issuesRows.push('Page Title: Duplicate (Paginated Archives),Warning,Medium,18,1.9,945,Paginated archives share page 1 title,Add %page% to title format in Rank Math');

  for (let m = 1; m <= 148; m++) {
    const p = m % 3 === 0 ? 'High' : (m % 2 === 0 ? 'Medium' : 'Low');
    const t = m % 4 === 0 ? 'Error' : (m % 2 === 0 ? 'Warning' : 'Opportunity');
    issuesRows.push(`Synthetic Issue ${m}: Title Parameter Variant ${m},${t},${p},${m * 2},${(m * 0.1).toFixed(1)},945,Detailed audit note for issue ${m},Remediation steps for issue ${m}`);
  }

  const issuesCsv150 = issuesRows.join('\n');
  const parsedIssues150 = crawlPipeline.parseIssuesOverviewCsv(issuesCsv150);

  assert(parsedIssues150.length === 150, `Parsed all 150 unique issues (actual: ${parsedIssues150.length})`);
  assert(parsedIssues150[0].issueName === 'H1: Duplicate', 'Parsed issue name correctly');
  assert(parsedIssues150[0].urlsAffected === 42, 'Extracted URLs affected count (42)');
  assert(parsedIssues150[1].urlsAffected === 18, 'Extracted paginated titles affected count (18)');

  // 3.2 Task Synthesis with 150 Issues
  const testKpis = {
    totalCrawledUrls: 1200,
    clean200HtmlPages: 900,
    internal301Redirects: 45,
    broken404Pages: 12,
    wafFalsePositive403: 0,
    duplicateH1s: 42,
    duplicateTitlesPaginated: 18
  };

  const synthesizedTasks = crawlPipeline.generateTasksFromCrawl(testKpis, parsedIssues150, {
    dominant301Cluster: { originType: 'Footer Menu', dominantPath: 'footer > a' }
  }, {
    clientSlug: 'oh-deer',
    domain: 'oh-deer.com',
    workbookUrl: 'https://docs.google.com/spreadsheets/d/test-sheet'
  });

  assert(synthesizedTasks.length > 0, `Generated ${synthesizedTasks.length} actionable tasks`);

  // Assert unique task IDs
  const taskIds = synthesizedTasks.map(t => t.id);
  const uniqueTaskIds = new Set(taskIds);
  assert(taskIds.length === uniqueTaskIds.size, `Zero duplicate task IDs among synthesized tasks (${taskIds.length} === ${uniqueTaskIds.size})`);

  // Assert Rule 14 (4 parts) on all tasks
  let allHave4Parts = true;
  for (const t of synthesizedTasks) {
    if (!t.sampleUrls || t.sampleUrls.length === 0 || !t.rootCause || !t.technicalInstructions || !t.technicalInstructions.includes('Architectural Recommendation')) {
      allHave4Parts = false;
      break;
    }
  }
  assert(allHave4Parts, 'All synthesized tasks satisfy GEMINI.md Rule 14 (Symptom, Root Cause, Code, Architecture)');

  // Assert Zero-Filler Budget Discipline (Rule 5)
  const sprintTasks = synthesizedTasks.filter(t => t.phase === 'Current Sprint');
  const totalSprintMins = sprintTasks.reduce((acc, t) => acc + t.estimatedMinutes, 0);
  assert(totalSprintMins <= 60, `Sprint tasks adhere to strict AM budget discipline (${totalSprintMins} mins <= 60 mins)`);

  // 3.3 Repeated Ingestion Idempotency
  console.log('  Testing repeated ingestion idempotency (5 consecutive ingestions)...');
  let clientState = {
    clientSlug: 'oh-deer',
    clientName: 'ohDEER',
    domain: 'oh-deer.com',
    tasks: [],
    completedTasks: [
      { id: 'OHD-CMP-01', title: 'Historic Fix 1', verifiedBy: 'Víctor Henríquez', completedDate: '2026-09-15' },
      { id: 'OHD-CMP-02', title: 'Historic Fix 2', verifiedBy: 'Víctor Henríquez', completedDate: '2026-10-01' }
    ]
  };

  for (let pass = 1; pass <= 5; pass++) {
    clientState = crawlPipeline.mergeCrawlIntoClientState('oh-deer', clientState, testKpis, synthesizedTasks, {
      recalibrateHealth: true,
      generateSprintTasks: true
    });
  }

  assert(clientState.tasks.length === synthesizedTasks.length, `Task count remains stable across 5 consecutive ingestions (count: ${clientState.tasks.length})`);
  assert(clientState.completedTasks.length === 2, `Completed tasks count strictly preserved across 5 runs (count: ${clientState.completedTasks.length})`);
  const activeIdsAfter5 = new Set(clientState.tasks.map(t => t.id));
  assert(activeIdsAfter5.size === clientState.tasks.length, 'No duplicate task IDs in client state after repeated ingestion');

  // 3.4 Integration with Pre-Existing 100 Active Tasks
  console.log('  Testing merger when client already has 100 pre-existing active tasks...');
  const preExistingTasks = [];
  for (let p = 1; p <= 100; p++) {
    preExistingTasks.push({
      id: `OHD-EXISTING-${p}`,
      title: `Pre-existing Task ${p}`,
      phase: p <= 3 ? 'Current Sprint' : 'Phase 2 (Dev Team)',
      estimatedMinutes: 20
    });
  }

  const clientWith100Tasks = {
    clientSlug: 'oh-deer',
    clientName: 'ohDEER',
    domain: 'oh-deer.com',
    tasks: preExistingTasks,
    completedTasks: clientState.completedTasks
  };

  const mergedWith100 = crawlPipeline.mergeCrawlIntoClientState('oh-deer', clientWith100Tasks, testKpis, synthesizedTasks, {
    recalibrateHealth: true,
    generateSprintTasks: true
  });

  assert(mergedWith100.tasks.length === 100 + synthesizedTasks.length, `Successfully merged into 100 pre-existing tasks without data loss (${mergedWith100.tasks.length} tasks)`);
  assert(!isNaN(mergedWith100.sprintSummary.totalEstimatedMinutes), `Sprint summary minutes is a valid number (${mergedWith100.sprintSummary.totalEstimatedMinutes} mins)`);

  // ==========================================================================
  // SUITE 4: completedTasks IMMUTABILITY UNDER CONCURRENCY & ERROR STATES
  // ==========================================================================
  console.log('\n--- Suite 4: completedTasks Immutability Under Concurrency & Error States ---');

  // Baseline inspection from disk
  const ohDeerDiskPath = path.resolve(__dirname, 'data/clients/oh-deer.json');
  const baselineOhDeer = JSON.parse(fs.readFileSync(ohDeerDiskPath, 'utf8'));
  const baselineCompletedCount = baselineOhDeer.completedTasks.length;
  const baselineCompletedSignatures = baselineOhDeer.completedTasks.map(t => ({
    id: t.id,
    verifiedBy: t.verifiedBy,
    completedDate: t.completedDate
  }));

  console.log(`  Baseline ohDEER has ${baselineCompletedCount} completed tasks verified by Víctor Henríquez`);

  // 4.1 Error State Immutability: Verify completedTasks is never mutated when errors occur
  const failingScenarios = [
    { name: 'null payload', payloads: null },
    { name: 'empty CSVs', payloads: {} },
    { name: 'invalid client config', payloads: { internalCsv: 'invalid' } }
  ];

  for (const scenario of failingScenarios) {
    try {
      await crawlPipeline.processRawUpload({
        clientSlug: 'oh-deer',
        payloads: scenario.payloads,
        options: { dryRun: true },
        existingClient: baselineOhDeer
      });
    } catch (_) {
      // Expected error
    }

    assert(baselineOhDeer.completedTasks.length === baselineCompletedCount, `completedTasks length preserved after ${scenario.name} error`);
    assert(baselineOhDeer.completedTasks[0].verifiedBy === baselineCompletedSignatures[0].verifiedBy, `verifiedBy signature preserved after ${scenario.name} error`);
  }

  // 4.2 High-Concurrency Stress (30 Concurrent Requests)
  console.log('  Testing 30 concurrent ingestion requests on oh-deer...');
  const concurrentServer = await new Promise(resolve => {
    const s = app.listen(0, '127.0.0.1', () => resolve(s));
  });
  const concurrentPort = concurrentServer.address().port;
  const concurrentUrl = `http://127.0.0.1:${concurrentPort}`;

  try {
    const concurrentRequests = [];
    for (let c = 1; c <= 30; c++) {
      const csvData = [
        'Address,Status Code,Status,Content Type,Indexability,Crawl Depth',
        `https://oh-deer.com/page-c-${c}-1,200,OK,text/html,Indexable,1`,
        `https://oh-deer.com/page-c-${c}-2,301,Moved Permanently,text/html,Non-Indexable,2`,
        `https://oh-deer.com/page-c-${c}-3,404,Not Found,text/html,Non-Indexable,3`
      ].join('\n');

      concurrentRequests.push(
        fetch(`${concurrentUrl}/api/clients/oh-deer/crawl/upload`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            internalCsv: csvData,
            options: { dryRun: true }
          })
        }).then(res => res.json())
      );
    }

    const concurrentResults = await Promise.all(concurrentRequests);
    assert(concurrentResults.length === 30, 'All 30 concurrent requests completed successfully');

    let allCompletedPreserved = true;
    for (const r of concurrentResults) {
      if (r.completedTasksPreserved < baselineCompletedCount) {
        allCompletedPreserved = false;
        break;
      }
    }
    assert(allCompletedPreserved, `Every single concurrent response preserved all ${baselineCompletedCount} completed tasks`);

    // Verify on-disk file remains clean and valid JSON
    const postConcurrentDisk = JSON.parse(fs.readFileSync(ohDeerDiskPath, 'utf8'));
    assert(postConcurrentDisk.completedTasks.length === baselineCompletedCount, 'Disk client completedTasks count is 100% intact after concurrency stress');
    assert(postConcurrentDisk.completedTasks[0].verifiedBy === baselineCompletedSignatures[0].verifiedBy, 'Disk completedTasks[0].verifiedBy is intact');
    assert(postConcurrentDisk.completedTasks[0].completedDate === baselineCompletedSignatures[0].completedDate, 'Disk completedTasks[0].completedDate is intact');

  } finally {
    concurrentServer.close();
  }

  // 4.3 Atomic File Persistence Stress (20 Parallel Writes to Isolated Directory)
  console.log('  Testing saveClientStateAtomically with 20 parallel writes...');
  const atomicTestDir = path.join(tmpDir, 'atomic_clients');
  if (!fs.existsSync(atomicTestDir)) {
    fs.mkdirSync(atomicTestDir, { recursive: true });
  }

  const parallelSaves = [];
  for (let s = 1; s <= 20; s++) {
    const mockClientData = {
      clientSlug: 'perf-test-client',
      clientName: 'Performance Test Client',
      domain: 'perf-test.com',
      iteration: s,
      tasks: [{ id: `TASK-${s}`, title: `Task ${s}`, phase: 'Current Sprint', estimatedMinutes: 15 }],
      completedTasks: baselineOhDeer.completedTasks
    };

    parallelSaves.push(
      new Promise((res, rej) => {
        try {
          const savedPath = crawlPipeline.saveClientStateAtomically('perf-test-client', mockClientData, {
            clientsDir: atomicTestDir,
            syncBundle: false
          });
          res(savedPath);
        } catch (err) {
          rej(err);
        }
      })
    );
  }

  const savedPaths = await Promise.all(parallelSaves);
  assert(savedPaths.length === 20, 'All 20 atomic writes resolved without throw');

  // Verify file on disk is valid JSON
  const finalSavedFile = path.join(atomicTestDir, 'perf-test-client.json');
  assert(fs.existsSync(finalSavedFile), 'Atomic target file exists on disk');
  const parsedFinalDisk = JSON.parse(fs.readFileSync(finalSavedFile, 'utf8'));
  assert(parsedFinalDisk.clientSlug === 'perf-test-client', 'Saved file content is valid, parseable JSON with correct clientSlug');
  assert(parsedFinalDisk.completedTasks.length === baselineCompletedCount, 'Saved file preserves completedTasks length');

  // Check for lingering .tmp files
  const dirFiles = fs.readdirSync(atomicTestDir);
  const tmpFiles = dirFiles.filter(f => f.includes('.tmp'));
  assert(tmpFiles.length === 0, `Zero lingering .tmp files in target directory (count: ${tmpFiles.length})`);

  // Cleanup temporary directory
  try {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  } catch (_) {}

  // ==========================================================================
  // FINAL SCOREBOARD
  // ==========================================================================
  console.log('====================================================');
  console.log(`📊 CHALLENGER 2 RESULTS: ${passed} / ${total} tests passed (${Math.round((passed / total) * 100)}%)`);
  console.log('====================================================');

  if (failed === 0) {
    console.log('🏆 VERDICT: APPROVE — Milestone 2 handles high-volume payloads, large datasets, and concurrency safely.');
  } else {
    console.error(`⚠️ VERDICT: REQUEST_CHANGES — ${failed} adversarial tests failed.`);
    process.exit(1);
  }
}

if (require.main === module) {
  runChallenger2Tests().catch(err => {
    console.error('💥 UNHANDLED TEST FAILURE:', err);
    process.exit(1);
  });
}

module.exports = runChallenger2Tests;
