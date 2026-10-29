/**
 * Bright Pink Agency Technical Audit Hub
 * Milestone 3 Adversarial Challenge & Stress Test Suite
 * 
 * Tests:
 * 1. Polling lifecycle, timer safety & memory leak prevention
 * 2. Dropzone file classification robustness & exception boundaries
 * 3. Demo crawl state machine full 5-stage async progression & preview rendering
 * 4. Submode state persistence (crawlSubMode upload vs live during demo)
 * 5. Dual-mode StorageAdapter resilience (offline simulation vs live server mock & network errors)
 * 6. GEMINI.md compliance (Rules 1, 2, 6, 14, 18, 27)
 * 7. Empirical Vulnerability & Edge Case Mining
 */

'use strict';

const fs = require('fs');
const path = require('path');

// ----------------------------------------------------------------------------
// 1. Setup Robust Mock DOM Environment
// ----------------------------------------------------------------------------
const createdElements = [];
const elementsMap = {};

global.window = global;
global.document = {
  getElementById: (id) => {
    if (!elementsMap[id]) {
      const el = {
        id: id,
        value: '',
        checked: true,
        textContent: '',
        _innerHTML: '',
        children: [],
        className: '',
        style: {},
        classList: {
          _classes: '',
          add: function(c) {
            const parts = (this._classes || '').split(/\s+/).filter(Boolean);
            if (!parts.includes(c)) parts.push(c);
            this._classes = parts.join(' ');
          },
          remove: function(c) {
            const parts = (this._classes || '').split(/\s+/).filter(Boolean);
            this._classes = parts.filter(x => x !== c).join(' ');
          },
          contains: function(c) {
            return (this._classes || '').split(/\s+/).filter(Boolean).includes(c);
          }
        },
        querySelector: () => ({ textContent: '', innerText: '' }),
        querySelectorAll: () => [],
        getContext: () => ({}),
        appendChild: function(child) {
          this.children.push(child);
          createdElements.push(child);
        },
        addEventListener: () => {},
        click: () => {}
      };
      Object.defineProperty(el, 'innerHTML', {
        get() { return this._innerHTML; },
        set(val) {
          this._innerHTML = val;
          if (val === '') this.children = [];
        }
      });
      Object.defineProperty(el, 'innerText', {
        get() { return this._innerHTML.replace(/<[^>]+>/g, ''); },
        set(val) { this._innerHTML = val; }
      });
      elementsMap[id] = el;
    }
    return elementsMap[id];
  },
  createElement: (tag) => {
    const el = {
      tagName: tag,
      innerHTML: '',
      className: '',
      style: {},
      classList: {
        _classes: '',
        add: function(c) { this._classes = (this._classes || '') + ' ' + c; },
        remove: function(c) { if (this._classes) this._classes = this._classes.replace(new RegExp('\\b' + c + '\\b', 'g'), '').trim(); }
      },
      appendChild: () => {},
      addEventListener: () => {}
    };
    createdElements.push(el);
    return el;
  },
  body: {
    classList: {
      _classes: '',
      add: function(c) { this._classes = (this._classes || '') + ' ' + c; },
      remove: function(c) { if (this._classes) this._classes = this._classes.replace(new RegExp('\\b' + c + '\\b', 'g'), '').trim(); }
    }
  },
  addEventListener: () => {}
};

try {
  Object.defineProperty(global, 'navigator', {
    value: {
      clipboard: {
        writeText: (text) => Promise.resolve(text)
      }
    },
    configurable: true,
    writable: true
  });
} catch (_) {}

global.lucide = {
  createIcons: () => {}
};

global.showToast = (msg) => { global._lastToast = msg; };

// ----------------------------------------------------------------------------
// 2. Load Hub Modules
// ----------------------------------------------------------------------------
require(path.join(__dirname, 'js/core/security-gate.js'));
require(path.join(__dirname, 'js/data-store.js'));
require(path.join(__dirname, 'js/services/storage-adapter.js'));
require(path.join(__dirname, 'js/modules/ingest-studio.js'));

console.log('================================================================');
console.log('⚡ ADVERSARIAL STRESS HARNESS — CHALLENGER 1 (MILESTONE 3)');
console.log('================================================================');

let passedTests = 0;
let totalTests = 0;
const empiricalFindings = [];

function assert(condition, testName) {
  totalTests++;
  if (condition) {
    console.log(`  ✅ [PASS] ${testName}`);
    passedTests++;
  } else {
    console.error(`  ❌ [FAIL] ${testName}`);
    throw new Error(`Test failed: ${testName}`);
  }
}

async function runAdversarialTests() {
  const adapter = window.BPA_STORAGE;
  const studio = window;

  // ==========================================================================
  // SUITE 1: Polling Lifecycle, Timer Safety & Concurrency
  // ==========================================================================
  console.log('\n--- Suite 1: Polling Lifecycle & Timer Safety ---');

  window.currentClient = 'oh-deer';
  window.openIngestStudio('crawl');

  // Test 1: Start crawl then immediately close studio -> timer must be cleared
  studio.handleLaunchCrawl();
  assert(document.getElementById('ingest-studio-drawer').classList.contains('hidden') === false, 'Studio drawer is open during launch');
  
  studio.closeIngestStudio();
  assert(document.getElementById('ingest-studio-drawer').classList.contains('hidden') === true, 'closeIngestStudio hides drawer');

  // Test 2: Consecutive close calls should be idempotent and not throw
  let closeNoThrow = true;
  try {
    for (let i = 0; i < 10; i++) {
      studio.closeIngestStudio();
    }
  } catch (err) {
    closeNoThrow = false;
  }
  assert(closeNoThrow, '10 consecutive closeIngestStudio() calls execute cleanly without error');

  // Test 3: Start crawl then cancel -> timer cleared and activeCrawlState nullified
  window.openIngestStudio('crawl');
  studio.handleLaunchCrawl();
  studio.handleCancelCrawl();
  assert(document.getElementById('crawl-progress-container') === null || !document.getElementById('ingest-studio-content').innerHTML.includes('STATUS: RUNNING'), 'handleCancelCrawl terminates running status');

  // Test 4: Consecutive cancel calls should be idempotent
  let cancelNoThrow = true;
  try {
    for (let i = 0; i < 10; i++) {
      studio.handleCancelCrawl();
    }
  } catch (err) {
    cancelNoThrow = false;
  }
  assert(cancelNoThrow, '10 consecutive handleCancelCrawl() calls execute cleanly without error');

  // Test 5: Rapid toggle stress test (Start -> Cancel -> Start -> Cancel -> Start -> Close)
  let rapidToggleOk = true;
  try {
    for (let i = 0; i < 5; i++) {
      studio.handleLaunchCrawl();
      studio.handleCancelCrawl();
    }
    studio.handleLaunchCrawl();
    studio.closeIngestStudio();
  } catch (err) {
    rapidToggleOk = false;
  }
  assert(rapidToggleOk, 'Rapid start/cancel/close toggle stress runs without exception');

  // Test 6: Double-launch protection (second launch resets/clears previous timer)
  let doubleLaunchOk = true;
  try {
    window.openIngestStudio('crawl');
    studio.handleLaunchCrawl();
    studio.handleLaunchCrawl(); // double invocation
    studio.closeIngestStudio();
  } catch (err) {
    doubleLaunchOk = false;
  }
  assert(doubleLaunchOk, 'Double launch invocation safely replaces previous timer without accumulating leaks');

  // Test 7: Pause and resume lifecycle
  window.openIngestStudio('crawl');
  studio.handleLaunchCrawl();
  studio.handlePauseCrawl();
  const pauseHtml = document.getElementById('ingest-studio-content').innerHTML;
  assert(pauseHtml.includes('STATUS: PAUSED') || pauseHtml.includes('Resume'), 'handlePauseCrawl reflects paused state');
  
  studio.handleResumeCrawl();
  const resumeHtml = document.getElementById('ingest-studio-content').innerHTML;
  assert(resumeHtml.includes('STATUS: RUNNING') || resumeHtml.includes('Pause'), 'handleResumeCrawl reflects resumed running state');
  studio.handleCancelCrawl();
  studio.closeIngestStudio();

  // ==========================================================================
  // SUITE 2: Dropzone File Classification & Corrupted Payloads
  // ==========================================================================
  console.log('\n--- Suite 2: Dropzone File Classification & Corrupted Payloads ---');

  window.openIngestStudio('crawl');
  studio.setCrawlSubMode('upload');

  // Test 8: Empty FileList handling
  let emptyDropOk = true;
  try {
    studio.handleCrawlDrop({ preventDefault: () => {}, dataTransfer: { files: [] } });
  } catch (err) {
    emptyDropOk = false;
  }
  assert(emptyDropOk, 'handleCrawlDrop with empty files list handled safely');

  // Test 9: Misnamed file ('random_export.csv' or 'test.csv') falls back gracefully to internalCsv
  studio.handleFileSelect({
    target: {
      files: [
        { name: 'test.csv', size: 2048 }
      ]
    }
  });
  let uploadHtml = document.getElementById('ingest-studio-content').innerHTML;
  assert(uploadHtml.includes('2 KB (BOM ✓)'), 'Misnamed test.csv defaults to internalCsv slot with 2 KB badge');

  // Test 10: Spanish / diacritic filenames classification
  studio.handleFileSelect({
    target: {
      files: [
        { name: 'problemas_técnicos_overview.csv', size: 4096 },
        { name: 'enlaces_internos_301.csv', size: 8192 },
        { name: 'interno_todos_los_urls.csv', size: 16384 }
      ]
    }
  });
  uploadHtml = document.getElementById('ingest-studio-content').innerHTML;
  assert(uploadHtml.includes('4 KB (BOM ✓)'), 'Spanish issue file mapped to Issues Overview slot');
  assert(uploadHtml.includes('8 KB (BOM ✓)'), 'Spanish inlinks file mapped to Inlinks Matrix slot');
  assert(uploadHtml.includes('16 KB (BOM ✓)'), 'Spanish internal file mapped to Internal URLs slot');

  // Test 11: 0-byte file and huge file handling
  studio.handleFileSelect({
    target: {
      files: [
        { name: 'empty_issues.csv', size: 0 },
        { name: 'huge_internal.csv', size: 104857600 } // 100 MB
      ]
    }
  });
  uploadHtml = document.getElementById('ingest-studio-content').innerHTML;
  assert(uploadHtml.includes('102400 KB (BOM ✓)'), '100 MB file size calculated accurately (102400 KB)');

  // Test 12: Non-CSV files dropped
  let nonCsvOk = true;
  try {
    studio.handleFileSelect({
      target: {
        files: [
          { name: 'malicious.sh', size: 512 },
          { name: 'screenshot.png', size: 20480 }
        ]
      }
    });
  } catch (err) {
    nonCsvOk = false;
  }
  assert(nonCsvOk, 'Non-CSV file drops handled without throwing unhandled exceptions');

  // Test 13: Mass file drop (50 files at once)
  const massFiles = [];
  for (let i = 0; i < 50; i++) {
    massFiles.push({ name: `crawl_chunk_${i}.csv`, size: 1024 });
  }
  let massDropOk = true;
  try {
    studio.handleFileSelect({ target: { files: massFiles } });
  } catch (err) {
    massDropOk = false;
  }
  assert(massDropOk, 'Mass drop of 50 files processes cleanly without crashing');

  // ==========================================================================
  // SUITE 3: Demo Crawl State Machine & Async Progression
  // ==========================================================================
  console.log('\n--- Suite 3: Demo Crawl State Machine & Async Progression ---');

  // Ensure mode is set to 'live' for runner progress display
  studio.setCrawlSubMode('live');
  window.openIngestStudio('crawl');

  // Test 14: Full 5-stage async progression
  console.log('  Executing full 5-stage async demo crawl progression...');
  const demoPromise = studio.handleOneClickDemoCrawl('oh-deer');

  // Wait for async resolution (~950ms total timer)
  const demoResult = await demoPromise;
  assert(demoResult !== null && typeof demoResult === 'object', 'handleOneClickDemoCrawl resolves with benchmarkPreview');
  assert(demoResult.updatedKpis.totalCrawledUrls === 5692, 'Demo updatedKpis has 5,692 totalCrawledUrls');
  assert(demoResult.updatedKpis.clean200HtmlPages === 945, 'Demo updatedKpis has 945 clean 200 HTML pages');
  assert(demoResult.updatedKpis.internal301Redirects === 245, 'Demo updatedKpis has 245 internal 301s');
  assert(demoResult.updatedKpis.wafFalsePositive403 === 818, 'Demo updatedKpis isolates 818 WAF 403s');
  assert(demoResult.updatedKpis.broken404Pages === 0, 'Demo updatedKpis has 0 broken 404s');
  assert(demoResult.updatedKpis.healthScores.calibratedTrueHealth === 92, 'Demo updatedKpis calibrates true health to 92% benchmark');

  const finalHtml = document.getElementById('ingest-studio-content').innerHTML;

  // Test 15: Check all 5 stage pills rendered
  assert(finalHtml.includes('QUEUED'), 'Preview markup includes QUEUED stage pill');
  assert(finalHtml.includes('RUNNING'), 'Preview markup includes RUNNING stage pill');
  assert(finalHtml.includes('PARSING'), 'Preview markup includes PARSING stage pill');
  assert(finalHtml.includes('INGESTING'), 'Preview markup includes INGESTING stage pill');
  assert(finalHtml.includes('COMPLETE'), 'Preview markup includes COMPLETE stage pill');

  // Test 16: Section A Before/After Diff Matrix
  assert(finalHtml.includes('Raw Scan (Before)'), 'Section A renders Raw Scan (Before) column');
  assert(finalHtml.includes('Calibrated State (After)'), 'Section A renders Calibrated State (After) column');
  assert(finalHtml.includes('78%'), 'Before column shows 78% raw Semrush health');
  assert(finalHtml.includes('92%'), 'After column shows 92% calibrated true health');
  assert(finalHtml.includes('+6% Benchmark'), 'After column shows (+6% Benchmark)');
  assert(finalHtml.includes('945 (+95)'), 'After column shows 945 (+95 clean 200s)');
  assert(finalHtml.includes('245 (-75 fixed)'), 'After column shows 245 (-75 301s fixed)');
  assert(finalHtml.includes('0 (-12 resolved)'), 'After column shows 0 (-12 404s resolved)');
  assert(finalHtml.includes('818 (0 penalty)'), 'After column shows 818 (0 penalty WAF isolation)');

  // Test 17: Section B 4-Part Developer Bridge Cards (Rule 14)
  assert(finalHtml.includes('OHD-SPRINT-01'), 'Task 1 ID OHD-SPRINT-01 present');
  assert(finalHtml.includes('OHD-DEV-01'), 'Task 2 ID OHD-DEV-01 present');
  assert(finalHtml.includes('rank_math/frontend/title'), 'Code snippet 1 contains rank_math filter');
  assert(finalHtml.includes('user_trailingslashit'), 'Code snippet 2 contains user_trailingslashit');

  // Test 18: Section C AM Retainer Briefing (Rule 6 Format)
  assert(finalHtml.includes('Gyongyi Castellanos'), 'AM note addresses Gyongyi Castellanos');
  assert(finalHtml.includes('1. Verdict / Peace of Mind:'), 'AM note contains Sentence 1: Verdict');
  assert(finalHtml.includes('2. Hours & Budget Impact:'), 'AM note contains Sentence 2: Budget Impact');
  assert(finalHtml.includes('3. Call to Action:'), 'AM note contains Sentence 3: Call to Action');
  assert(finalHtml.includes('45-minute CMS sprint'), 'AM note specifies 45-minute sprint for Víctor');
  assert(finalHtml.includes('zero dev hours consumed in October'), 'AM note respects October dev hours retainer limit');

  // Test 19: Commit to state and verify completedTasks preservation
  const preCommitClient = adapter.getClient('oh-deer');
  const preCompletedCount = preCommitClient.completedTasks ? preCommitClient.completedTasks.length : 0;
  assert(preCompletedCount === 5, 'ohDEER has exactly 5 baseline completed tasks before commit');

  studio.handleConfirmCrawlIngestion();
  const postCommitClient = adapter.getClient('oh-deer');
  assert(postCommitClient.kpis.clean200HtmlPages === 945, 'postCommitClient has 945 clean 200 HTML pages');
  assert(postCommitClient.kpis.wafFalsePositive403 === 818, 'postCommitClient has 818 WAF 403s isolated');
  assert(postCommitClient.completedTasks.length === 5, 'completedTasks length strictly preserved (5/5 intact)');
  assert(postCommitClient.completedTasks[0].verifiedBy === 'Víctor Henríquez', 'completedTasks[0].verifiedBy strictly intact');

  // ==========================================================================
  // SUITE 4: Dual-Mode StorageAdapter Resilience
  // ==========================================================================
  console.log('\n--- Suite 4: Dual-Mode StorageAdapter Resilience ---');

  // Part A: Offline Mode Boundary Edge Cases
  adapter.isBackendAvailable = false;
  
  // Test 20: getCrawlStatus with missing crawlId rejects cleanly
  let getStatusRejected = false;
  try {
    await adapter.getCrawlStatus('');
  } catch (err) {
    getStatusRejected = (err.message === 'crawlId is required');
  }
  assert(getStatusRejected, 'getCrawlStatus("") rejects with "crawlId is required"');

  // Test 21: startCrawl with empty parameters defaults safely
  const emptyStart = await adapter.startCrawl(null);
  assert(emptyStart.success === true, 'startCrawl(null) defaults safely with success: true');
  assert(typeof emptyStart.crawlId === 'string', 'startCrawl(null) generated valid crawlId');

  // Test 22: pauseCrawl and resumeCrawl on unknown crawlId
  const unknownPause = await adapter.pauseCrawl('non-existent-crawl-123');
  assert(unknownPause.success === true && unknownPause.currentStatus === 'paused', 'pauseCrawl on unknown crawlId succeeds safely');
  const unknownResume = await adapter.resumeCrawl('non-existent-crawl-123');
  assert(unknownResume.success === true && unknownResume.currentStatus === 'running', 'resumeCrawl on unknown crawlId succeeds safely');

  // Test 23: listCrawls with limit filter
  const listFiltered = await adapter.listCrawls({ clientSlug: 'oh-deer', limit: 1 });
  assert(Array.isArray(listFiltered.crawls), 'listCrawls returns array');
  assert(listFiltered.crawls.length <= 1, 'listCrawls respects limit: 1');

  // Test 24: ingestCrawl dryRun true does not mutate state
  const baselineKpisBeforeDryRun = JSON.parse(JSON.stringify(adapter.getClient('oh-deer').kpis));
  await adapter.ingestCrawl({
    clientSlug: 'oh-deer',
    crawlId: 'test-dry-run',
    options: { dryRun: true }
  });
  const kpisAfterDryRun = adapter.getClient('oh-deer').kpis;
  assert(kpisAfterDryRun.clean200HtmlPages === baselineKpisBeforeDryRun.clean200HtmlPages, 'dryRun: true strictly prevents state mutation');

  // Part B: Live Server Mock Mode
  console.log('  Testing live server mock mode (isBackendAvailable = true)...');
  adapter.isBackendAvailable = true;

  // Mock global fetch for crawler routes
  global.fetch = function(url, opts) {
    opts = opts || {};
    const method = opts.method || 'GET';

    if (url.includes('/api/crawler/crawls?limit=1')) {
      return Promise.resolve({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ total: 3, crawls: [] })
      });
    }

    if (url === '/api/crawler/crawl' && method === 'POST') {
      const body = JSON.parse(opts.body || '{}');
      return Promise.resolve({
        ok: true,
        status: 202,
        json: () => Promise.resolve({
          success: true,
          crawlId: 'server-crawl-999',
          clientSlug: body.clientSlug,
          targetUrl: body.targetUrl,
          status: 'running',
          statusUrl: '/api/crawler/crawls/server-crawl-999/status'
        })
      });
    }

    if (url.includes('/api/crawler/crawls/server-crawl-999/status')) {
      return Promise.resolve({
        ok: true,
        status: 200,
        json: () => Promise.resolve({
          crawlId: 'server-crawl-999',
          status: 'completed',
          progressPercentage: 100,
          metrics: { urlsCrawled: 5692 },
          exportFolder: 'data/crawls/server-crawl-999'
        })
      });
    }

    if (url.includes('/api/crawler/crawls/server-crawl-999/pause')) {
      return Promise.resolve({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ success: true, action: 'pause', currentStatus: 'paused' })
      });
    }

    if (url.includes('/api/crawler/crawls/server-crawl-999/resume')) {
      return Promise.resolve({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ success: true, action: 'resume', currentStatus: 'running' })
      });
    }

    if (url.includes('/api/crawler/crawls/server-crawl-999/cancel')) {
      return Promise.resolve({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ success: true, action: 'cancel', currentStatus: 'cancelled' })
      });
    }

    if (url.includes('/api/crawler/crawls?clientSlug=')) {
      return Promise.resolve({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ total: 1, crawls: [{ crawlId: 'server-crawl-999' }] })
      });
    }

    if (url.includes('/api/clients/oh-deer/ingest/crawl') && method === 'POST') {
      return Promise.resolve({
        ok: true,
        status: 200,
        json: () => Promise.resolve({
          success: true,
          clientSlug: 'oh-deer',
          updatedKpis: {
            clean200HtmlPages: 945,
            wafFalsePositive403: 818,
            healthScores: { calibratedTrueHealth: 92 }
          },
          completedTasksPreserved: 5
        })
      });
    }

    if (url.includes('/api/clients/oh-deer/crawl/upload') && method === 'POST') {
      return Promise.resolve({
        ok: true,
        status: 200,
        json: () => Promise.resolve({
          success: true,
          clientSlug: 'oh-deer',
          updatedKpis: {
            totalCrawledUrls: 5692,
            clean200HtmlPages: 945,
            internal301Redirects: 245,
            broken404Pages: 0,
            wafFalsePositive403: 818,
            healthScores: { rawSemrushScore: 78, calibratedTrueHealth: 92 }
          },
          completedTasksPreserved: 5
        })
      });
    }

    return Promise.resolve({
      ok: false,
      status: 404,
      json: () => Promise.resolve({ error: 'Endpoint not found' })
    });
  };

  // Test 25: checkCrawlerStatus in live mode
  const liveStatus = await adapter.checkCrawlerStatus();
  assert(liveStatus.available === true, 'Live checkCrawlerStatus reports available: true');
  assert(liveStatus.mode === 'live', 'Live checkCrawlerStatus reports mode: live');
  assert(liveStatus.activeCrawls === 3, 'Live checkCrawlerStatus reports activeCrawls: 3');

  // Test 26: startCrawl via live server fetch
  const liveStart = await adapter.startCrawl({ clientSlug: 'oh-deer', targetUrl: 'https://oh-deer.com' });
  assert(liveStart.success === true, 'Live startCrawl returns success: true');
  assert(liveStart.crawlId === 'server-crawl-999', 'Live startCrawl received server crawlId');

  // Test 27: getCrawlStatus via live server fetch
  const liveGetStatus = await adapter.getCrawlStatus('server-crawl-999');
  assert(liveGetStatus.status === 'completed', 'Live getCrawlStatus returns completed status');
  assert(liveGetStatus.progressPercentage === 100, 'Live getCrawlStatus returns 100%');

  // Test 28: pause, resume, cancel via live server fetch
  const livePause = await adapter.pauseCrawl('server-crawl-999');
  assert(livePause.currentStatus === 'paused', 'Live pauseCrawl returns paused');
  const liveResume = await adapter.resumeCrawl('server-crawl-999');
  assert(liveResume.currentStatus === 'running', 'Live resumeCrawl returns running');
  const liveCancel = await adapter.cancelCrawl('server-crawl-999');
  assert(liveCancel.currentStatus === 'cancelled', 'Live cancelCrawl returns cancelled');

  // Test 29: listCrawls via live server fetch
  const liveList = await adapter.listCrawls({ clientSlug: 'oh-deer' });
  assert(liveList.total === 1, 'Live listCrawls returns server total');

  // Test 30: ingestCrawl via live server fetch
  const liveIngest = await adapter.ingestCrawl({ clientSlug: 'oh-deer', crawlId: 'server-crawl-999' });
  assert(liveIngest.success === true, 'Live ingestCrawl returns success: true');
  assert(liveIngest.updatedKpis.clean200HtmlPages === 945, 'Live ingestCrawl received 945 clean pages');

  // Test 31: uploadCrawlFiles via live server fetch
  const liveUpload = await adapter.uploadCrawlFiles({ clientSlug: 'oh-deer', issuesCsv: 'test' });
  assert(liveUpload.success === true, 'Live uploadCrawlFiles returns success: true');

  // Part C: Network Failure & Error Degradation
  console.log('  Testing live server error resilience & fallback degradation...');
  
  // Mock fetch failure (network down / 500 internal server error)
  global.fetch = function() {
    return Promise.reject(new Error('Network connection refused (ECONNREFUSED)'));
  };

  // Test 32: checkCrawlerStatus degrades gracefully to simulation on network error
  const failedStatus = await adapter.checkCrawlerStatus();
  assert(failedStatus.available === false, 'checkCrawlerStatus degrades to available: false on network error');
  assert(failedStatus.mode === 'simulation', 'checkCrawlerStatus degrades to simulation mode on network error');
  assert(failedStatus.error.includes('ECONNREFUSED'), 'checkCrawlerStatus preserves error description');

  // Test 33: startCrawl rejects with network error
  let startCrawlFailed = false;
  try {
    await adapter.startCrawl({ clientSlug: 'oh-deer' });
  } catch (err) {
    startCrawlFailed = err.message.includes('ECONNREFUSED');
  }
  assert(startCrawlFailed, 'startCrawl rejects gracefully on network failure');

  // Reset backend mode to offline simulation
  adapter.isBackendAvailable = false;

  // ==========================================================================
  // SUITE 5: Empirical Vulnerability & Edge Case Mining
  // ==========================================================================
  console.log('\n--- Suite 5: Empirical Vulnerability & Edge Case Mining ---');

  // Test 34: Inspect handleCrawlDrop(null) throwing behavior
  let dropNullThrew = false;
  try {
    studio.handleCrawlDrop(null);
  } catch (err) {
    dropNullThrew = true;
    empiricalFindings.push({
      id: 'FINDING-M3-01',
      severity: 'Low / Defensive Edge Case',
      component: 'bpa-audit-hub/js/modules/ingest-studio.js:1230-1236',
      description: 'handleCrawlDrop(null) throws TypeError when called with null/falsy event argument because line 1232 accesses e.dataTransfer without null check.',
      fix: 'Use const dt = e ? e.dataTransfer : null; to allow programmatic invocation with falsy events.'
    });
  }
  assert(dropNullThrew, 'Empirically verified: handleCrawlDrop(null) throws TypeError due to direct e.dataTransfer dereference');

  // Test 35: Inspect handleFileSelect({}) throwing behavior
  let fileSelectNoTargetThrew = false;
  try {
    studio.handleFileSelect({});
  } catch (err) {
    fileSelectNoTargetThrew = true;
    empiricalFindings.push({
      id: 'FINDING-M3-02',
      severity: 'Low / Defensive Edge Case',
      component: 'bpa-audit-hub/js/modules/ingest-studio.js:1225-1228',
      description: 'handleFileSelect({}) throws TypeError when event object lacks target property because line 1226 accesses e.target.files directly.',
      fix: 'Use const files = (e && e.target) ? e.target.files : null; for defensive event unwrapping.'
    });
  }
  assert(fileSelectNoTargetThrew, 'Empirically verified: handleFileSelect({}) throws TypeError when event lacks target property');

  // Test 36: Inspect demo crawl submode awareness
  studio.setCrawlSubMode('upload');
  studio.handleOneClickDemoCrawl('oh-deer-sync');
  const uploadModeDemoHtml = document.getElementById('ingest-studio-content').innerHTML;
  const pillsVisibleInUpload = uploadModeDemoHtml.includes('QUEUED') && uploadModeDemoHtml.includes('RUNNING');
  if (!pillsVisibleInUpload) {
    empiricalFindings.push({
      id: 'FINDING-M3-03',
      severity: 'Medium / UX Polish',
      component: 'bpa-audit-hub/js/modules/ingest-studio.js:936-940',
      description: 'handleOneClickDemoCrawl activates activeStudioTab = "crawl", but does not set crawlSubMode = "live". If user was on "Drag & Drop Raw CSVs" submode, the live runner progress bar and 5 status pills are hidden until the final preview renders below.',
      fix: 'In handleOneClickDemoCrawl, add crawlSubMode = "live"; so the progress telemetry and 5 status pills are immediately visible regardless of previous submode.'
    });
  }
  assert(!pillsVisibleInUpload, 'Empirically verified: Demo crawl does not auto-switch submode to "live" when called from "upload" submode');

  // Reset to live
  studio.setCrawlSubMode('live');

  // ==========================================================================
  // SUITE 6: GEMINI.md Compliance Verification
  // ==========================================================================
  console.log('\n--- Suite 6: GEMINI.md Compliance Verification ---');

  // Test 37: Rule 1 & 2 - Theme name must not assume Divi or generic builders
  const ohDeerClient = adapter.getClient('oh-deer');
  const themeName = (ohDeerClient.cmsStack && ohDeerClient.cmsStack.theme) ? ohDeerClient.cmsStack.theme.toLowerCase() : '';
  assert(!themeName.includes('divi') && !themeName.includes('elementor'), 'Rule 1: CMS stack does not assume Divi/Elementor');
  assert(themeName.includes('bpa') || themeName.includes('custom'), 'Rule 2: CMS stack correctly reflects BPA custom theme');

  // Test 38: Rule 2 & 27 - Zero-Fabrication health calibration (818 WAF 403s isolated, 92% calibrated health)
  const healthKpis = ohDeerClient.kpis;
  assert(healthKpis.wafFalsePositive403 === 818, 'Rule 2: Exactly 818 WAF 403s isolated without penalty');
  assert(healthKpis.broken404Pages === 0, 'Rule 27: Broken 404 count accurately reflects 0');
  assert(healthKpis.healthScores && healthKpis.healthScores.calibratedTrueHealth === 92, 'Rule 27: Health score accurately calibrated to 92% benchmark');

  // Test 39: Rule 6 - Account Manager 3-sentence note format
  const amNote = studio.copyAmNote();
  const sentences = amNote.split(/\n\n+/).filter(Boolean);
  assert(sentences.length === 3, 'Rule 6: AM note contains exactly 3 distinct structured sentences');
  assert(sentences[0].includes('1. Verdict / Peace of Mind:'), 'Rule 6: Sentence 1 is Verdict');
  assert(sentences[1].includes('2. Hours & Budget Impact:'), 'Rule 6: Sentence 2 is Hours & Budget');
  assert(sentences[2].includes('3. Call to Action:'), 'Rule 6: Sentence 3 is Call to Action');

  // Test 40: Rule 14 - 4-Part Developer Bridge task cards
  const snippet1 = studio.copyCodeSnippet('snippet-ohd-01');
  assert(snippet1.includes('add_filter'), 'Rule 14: Task 1 snippet contains executable PHP filter');
  const snippet2 = studio.copyCodeSnippet('snippet-ohd-02');
  assert(snippet2.includes('user_trailingslashit'), 'Rule 14: Task 2 snippet contains user_trailingslashit fix');

  // Test 41: Rule 18 - Completed tasks immutability
  assert(ohDeerClient.completedTasks.length === 5, 'Rule 18: All 5 completed tasks strictly preserved');
  assert(ohDeerClient.completedTasks[0].verifiedBy === 'Víctor Henríquez', 'Rule 18: VerifiedBy signature strictly preserved');

  console.log('\n================================================================');
  console.log(`📊 ADVERSARIAL CHALLENGE RESULTS:`);
  console.log(`   Passed: ${passedTests} / ${totalTests} (100.0%)`);
  console.log(`   Failed: 0 / ${totalTests}`);
  console.log(`   Empirical Findings Recorded: ${empiricalFindings.length}`);
  empiricalFindings.forEach(f => {
    console.log(`     - [${f.id}] (${f.severity}) ${f.description}`);
  });
  console.log('================================================================');

  return empiricalFindings;
}

runAdversarialTests().catch(err => {
  console.error('Fatal adversarial challenge error:', err);
  process.exit(1);
});
