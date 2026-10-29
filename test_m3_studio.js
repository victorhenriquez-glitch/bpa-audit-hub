/**
 * Bright Pink Agency Technical Audit Hub
 * Milestone 3 Test Suite: Crawl Ingestion Studio UI & StorageAdapter Bridge
 * 
 * Verifies:
 * - StorageAdapter crawler API bridge methods (dual-mode: server & offline mock)
 * - IngestStudio module exports and drawer lifecycle
 * - 4th Tab HTML rendering (Crawl Studio SF v24)
 * - 5-Stage status pills (QUEUED -> RUNNING -> PARSING -> INGESTING -> COMPLETE)
 * - One-Click ohDEER Benchmark demonstration execution
 * - KPI Diff cards, Rule 14 4-part developer task cards, and Rule 6 AM 3-sentence pitch
 * - Zero regressions across existing tabs (kpis, task, replit)
 */

'use strict';

const fs = require('fs');
const path = require('path');

// 1. Setup Mock DOM Environment
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
          add: function(c) { this._classes = (this._classes || '') + ' ' + c; },
          remove: function(c) { if (this._classes) this._classes = this._classes.replace(new RegExp('\\b' + c + '\\b', 'g'), '').trim(); },
          contains: function(c) { return (this._classes || '').includes(c); }
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

// 2. Load Hub Modules
require(path.join(__dirname, 'js/core/security-gate.js'));
require(path.join(__dirname, 'js/data-store.js'));
require(path.join(__dirname, 'js/services/storage-adapter.js'));
require(path.join(__dirname, 'js/modules/ingest-studio.js'));

console.log('====================================================');
console.log('🧪 RUNNING MILESTONE 3 CRAWL STUDIO TEST SUITE');
console.log('====================================================');

let passedTests = 0;
let totalTests = 0;

function assert(condition, testName) {
  totalTests++;
  if (condition) {
    console.log(`✅ [PASS] ${testName}`);
    passedTests++;
  } else {
    console.error(`❌ [FAIL] ${testName}`);
    throw new Error(`Test failed: ${testName}`);
  }
}

async function runTests() {
  const adapter = window.BPA_STORAGE;
  const studio = window;

  // --------------------------------------------------------------------------
  // SUITE 1: StorageAdapter Crawler Bridge Methods (Dual-Mode)
  // --------------------------------------------------------------------------
  console.log('\n--- Suite 1: StorageAdapter Crawler Bridge Methods ---');
  
  assert(typeof adapter.checkCrawlerStatus === 'function', 'adapter.checkCrawlerStatus is a function');
  assert(typeof adapter.startCrawl === 'function', 'adapter.startCrawl is a function');
  assert(typeof adapter.getCrawlStatus === 'function', 'adapter.getCrawlStatus is a function');
  assert(typeof adapter.pollCrawlStatus === 'function', 'adapter.pollCrawlStatus alias is a function');
  assert(typeof adapter.pauseCrawl === 'function', 'adapter.pauseCrawl is a function');
  assert(typeof adapter.resumeCrawl === 'function', 'adapter.resumeCrawl is a function');
  assert(typeof adapter.cancelCrawl === 'function', 'adapter.cancelCrawl is a function');
  assert(typeof adapter.listCrawls === 'function', 'adapter.listCrawls is a function');
  assert(typeof adapter.ingestCrawl === 'function', 'adapter.ingestCrawl is a function');
  assert(typeof adapter.ingestCrawlExport === 'function', 'adapter.ingestCrawlExport alias is a function');
  assert(typeof adapter.uploadCrawlFiles === 'function', 'adapter.uploadCrawlFiles is a function');

  // Test offline mode of checkCrawlerStatus
  adapter.isBackendAvailable = false;
  const statusOffline = await adapter.checkCrawlerStatus();
  assert(statusOffline.available === false, 'Offline status check reports available: false');
  assert(statusOffline.mode === 'simulation', 'Offline status check reports mode: simulation');
  assert(typeof statusOffline.version === 'string', 'Offline status check reports version string');
  assert(typeof statusOffline.defaultExportDir === 'string', 'Offline status check reports defaultExportDir');

  // Test startCrawl in simulation mode
  const startRes = await adapter.startCrawl({ clientSlug: 'oh-deer', targetUrl: 'https://oh-deer.com', crawlMode: 'spider' });
  assert(startRes.success === true, 'startCrawl returns success: true');
  assert(typeof startRes.crawlId === 'string' && startRes.crawlId.length > 5, 'startCrawl returns valid crawlId');
  assert(startRes.clientSlug === 'oh-deer', 'startCrawl preserves clientSlug');
  assert(startRes.status === 'running', 'startCrawl starts in running state');
  assert(typeof startRes.statusUrl === 'string', 'startCrawl provides statusUrl');

  // Test pollCrawlStatus progression
  const crawlId = startRes.crawlId;
  const poll1 = await adapter.pollCrawlStatus(crawlId);
  assert(poll1.crawlId === crawlId, 'pollCrawlStatus returns matching crawlId');
  assert(poll1.progressPercentage > 0, 'pollCrawlStatus returns positive progress %');
  assert(poll1.metrics && poll1.metrics.urlsCrawled > 0, 'pollCrawlStatus includes urlsCrawled metrics');

  // Advance poll until completion
  await adapter.pollCrawlStatus(crawlId);
  await adapter.pollCrawlStatus(crawlId);
  const pollComplete = await adapter.pollCrawlStatus(crawlId);
  assert(pollComplete.progressPercentage === 100, 'pollCrawlStatus reaches 100% completion');
  assert(pollComplete.status === 'completed', 'pollCrawlStatus transitions to completed');
  assert(pollComplete.totalCrawled === 5692, 'pollCrawlStatus sets totalCrawled benchmark');
  assert(Array.isArray(pollComplete.availableExports), 'pollCrawlStatus provides availableExports array');

  // Test pause / resume / cancel
  const pauseRes = await adapter.pauseCrawl(crawlId);
  assert(pauseRes.currentStatus === 'paused', 'pauseCrawl marks status paused');
  const resumeRes = await adapter.resumeCrawl(crawlId);
  assert(resumeRes.currentStatus === 'running', 'resumeCrawl marks status running');
  const cancelRes = await adapter.cancelCrawl(crawlId);
  assert(cancelRes.currentStatus === 'cancelled', 'cancelCrawl marks status cancelled');

  // Test listCrawls
  const listRes = await adapter.listCrawls({ clientSlug: 'oh-deer' });
  assert(listRes.total >= 1, 'listCrawls returns recorded crawls');
  assert(Array.isArray(listRes.crawls), 'listCrawls returns crawls array');

  // Test ingestCrawl in offline mode (both signatures)
  const ingestObjRes = await adapter.ingestCrawl({
    clientSlug: 'oh-deer',
    crawlId: crawlId,
    crawlExportPath: 'data/crawls/' + crawlId,
    options: { recalibrateHealth: true, generateSprintTasks: true, preserveCompletedTasks: true, dryRun: true }
  });
  assert(ingestObjRes.success === true, 'ingestCrawl (object signature) returns success: true');
  assert(ingestObjRes.clientSlug === 'oh-deer', 'ingestCrawl returns matching clientSlug');
  assert(ingestObjRes.updatedKpis.clean200HtmlPages === 945, 'ingestCrawl returns 945 clean 200 HTML pages');
  assert(ingestObjRes.updatedKpis.wafFalsePositive403 === 818, 'ingestCrawl isolates 818 WAF 403s');
  assert(ingestObjRes.updatedKpis.healthScores.calibratedTrueHealth === 92, 'ingestCrawl calibrates true health to 92% benchmark');
  assert(ingestObjRes.completedTasksPreserved === 5, 'ingestCrawl preserves all 5 completed tasks');

  // Test uploadCrawlFiles in offline mode
  const uploadRes = await adapter.uploadCrawlFiles({
    clientSlug: 'oh-deer',
    issuesCsv: 'Address,Issue\nhttps://oh-deer.com/page-1,Duplicate title',
    inlinksCsv: '',
    internalCsv: '',
    options: { dryRun: true }
  });
  assert(uploadRes.success === true, 'uploadCrawlFiles returns success: true');
  assert(uploadRes.dryRun === true, 'uploadCrawlFiles respects dryRun: true');
  assert(uploadRes.updatedKpis.clean200HtmlPages === 945, 'uploadCrawlFiles returns benchmark clean pages');

  // --------------------------------------------------------------------------
  // SUITE 2: IngestStudio Module Exports
  // --------------------------------------------------------------------------
  console.log('\n--- Suite 2: IngestStudio Module Exports ---');

  assert(typeof window.openIngestStudio === 'function', 'window.openIngestStudio exists');
  assert(typeof window.closeIngestStudio === 'function', 'window.closeIngestStudio exists');
  assert(typeof window.setStudioTab === 'function', 'window.setStudioTab exists');
  assert(typeof window.renderCrawlStudioTab === 'function', 'window.renderCrawlStudioTab exists');
  assert(typeof window.handleLaunchCrawl === 'function', 'window.handleLaunchCrawl exists');
  assert(typeof window.handleOneClickDemoCrawl === 'function', 'window.handleOneClickDemoCrawl exists');
  assert(typeof window.handlePauseCrawl === 'function', 'window.handlePauseCrawl exists');
  assert(typeof window.handleResumeCrawl === 'function', 'window.handleResumeCrawl exists');
  assert(typeof window.handleCancelCrawl === 'function', 'window.handleCancelCrawl exists');
  assert(typeof window.handleFileSelect === 'function', 'window.handleFileSelect exists');
  assert(typeof window.handleCrawlDrop === 'function', 'window.handleCrawlDrop exists');
  assert(typeof window.handleIngestUploadedFiles === 'function', 'window.handleIngestUploadedFiles exists');
  assert(typeof window.handleConfirmCrawlIngestion === 'function', 'window.handleConfirmCrawlIngestion exists');
  assert(typeof window.resetCrawlPreview === 'function', 'window.resetCrawlPreview exists');
  assert(typeof window.copyCodeSnippet === 'function', 'window.copyCodeSnippet exists');
  assert(typeof window.copyAmNote === 'function', 'window.copyAmNote exists');
  assert(typeof window.setCrawlSubMode === 'function', 'window.setCrawlSubMode exists');

  // --------------------------------------------------------------------------
  // SUITE 3: Drawer Markup & 4th Tab Navigation
  // --------------------------------------------------------------------------
  console.log('\n--- Suite 3: Drawer Markup & 4th Tab Navigation ---');

  window.currentClient = 'oh-deer';
  window.openIngestStudio('crawl');
  const drawerContent = document.getElementById('ingest-studio-content').innerHTML;

  assert(drawerContent.includes('🕷️ Crawl Studio (SF)'), 'Drawer navigation contains 4th tab button: 🕷️ Crawl Studio (SF)');
  assert(drawerContent.includes('v24'), 'Drawer 4th tab button contains v24 badge');
  assert(drawerContent.includes('One-Click ohDEER Deep Crawl Showcase'), 'Drawer body contains One-Click Benchmark Showcase card');
  assert(drawerContent.includes('Run Benchmark Ingestion'), 'Drawer body contains Run Benchmark Ingestion button');
  assert(drawerContent.includes('Live Crawl Runner'), 'Drawer body contains Live Crawl Runner mode button');
  assert(drawerContent.includes('Drag & Drop Raw CSVs'), 'Drawer body contains Drag & Drop Raw CSVs mode button');
  assert(drawerContent.includes('Ingestion Quality Gates (BPA Standard)'), 'Drawer body contains Ingestion Quality Gates container');
  assert(drawerContent.includes('Health Recalibration (Rule 27)'), 'Drawer body contains Health Recalibration toggle');
  assert(drawerContent.includes('4-Part Dev Bridge (Rule 14)'), 'Drawer body contains 4-Part Dev Bridge toggle');
  assert(drawerContent.includes('Preserve Completed Tasks (Rule 18)'), 'Drawer body contains Preserve Completed Tasks toggle');
  assert(drawerContent.includes('Safe Dry-Run Preview Mode'), 'Drawer body contains Safe Dry-Run toggle');

  // Test mode switcher to upload
  window.setCrawlSubMode('upload');
  const uploadContent = document.getElementById('ingest-studio-content').innerHTML;
  assert(uploadContent.includes('crawl-dropzone'), 'Upload mode renders #crawl-dropzone');
  assert(uploadContent.includes('crawl-file-input'), 'Upload mode renders hidden file input');
  assert(uploadContent.includes('Internal URLs'), 'Upload mode displays Internal URLs slot');
  assert(uploadContent.includes('Issues Overview'), 'Upload mode displays Issues Overview slot');
  assert(uploadContent.includes('Inlinks Matrix'), 'Upload mode displays Inlinks Matrix slot');
  assert(uploadContent.includes('btn-ingest-uploaded'), 'Upload mode displays Ingest Uploaded CSVs button');

  // Switch back to live runner
  window.setCrawlSubMode('live');
  const liveContent = document.getElementById('ingest-studio-content').innerHTML;
  assert(liveContent.includes('crawl-input-url'), 'Live mode renders #crawl-input-url');
  assert(liveContent.includes('crawl-input-mode'), 'Live mode renders #crawl-input-mode');
  assert(liveContent.includes('btn-start-crawl'), 'Live mode renders #btn-start-crawl');

  // --------------------------------------------------------------------------
  // SUITE 4: One-Click Demo Crawl Execution & Preview Verification
  // --------------------------------------------------------------------------
  console.log('\n--- Suite 4: One-Click Demo Crawl Execution & Preview ---');

  // Run demo crawl (synchronous test mode)
  const demoResult = await window.handleOneClickDemoCrawl('oh-deer-sync');
  assert(demoResult.clientSlug === 'oh-deer-sync', 'handleOneClickDemoCrawl completed for client');
  assert(demoResult.updatedKpis.clean200HtmlPages === 945, 'Demo updatedKpis has 945 clean 200 HTML pages');
  assert(demoResult.updatedKpis.internal301Redirects === 245, 'Demo updatedKpis has 245 internal 301s');
  assert(demoResult.updatedKpis.wafFalsePositive403 === 818, 'Demo updatedKpis isolates 818 WAF 403s');
  assert(demoResult.updatedKpis.healthScores.calibratedTrueHealth === 92, 'Demo updatedKpis calibrates true health to 92%');

  const previewHtml = document.getElementById('ingest-studio-content').innerHTML;
  
  // Verify 5-Stage Status Pills in HTML
  assert(previewHtml.includes('QUEUED'), 'Status pills contain QUEUED stage');
  assert(previewHtml.includes('RUNNING'), 'Status pills contain RUNNING stage');
  assert(previewHtml.includes('PARSING'), 'Status pills contain PARSING stage');
  assert(previewHtml.includes('INGESTING'), 'Status pills contain INGESTING stage');
  assert(previewHtml.includes('COMPLETE'), 'Status pills contain COMPLETE stage');

  // Verify Section A: KPI Diff Cards (Before vs After)
  assert(previewHtml.includes('Raw Scan (Before)'), 'Preview renders Raw Scan (Before) column');
  assert(previewHtml.includes('Calibrated State (After)'), 'Preview renders Calibrated State (After) column');
  assert(previewHtml.includes('78%') && previewHtml.includes('Semrush Health'), 'Preview renders 78% Semrush Health before');
  assert(previewHtml.includes('92%') && previewHtml.includes('+6% Benchmark'), 'Preview renders 92% (+6% Benchmark) after');
  assert(previewHtml.includes('945 (+95)'), 'Preview renders clean 200 gain (+95)');
  assert(previewHtml.includes('245 (-75 fixed)'), 'Preview renders 301 reduction (-75 fixed)');
  assert(previewHtml.includes('0 (-12 resolved)'), 'Preview renders 404 elimination (-12 resolved)');
  assert(previewHtml.includes('818 (0 penalty)'), 'Preview renders WAF 403 isolation with 0 penalty');

  // Verify Section B: 4-Part Developer Bridge Task Cards (Rule 14)
  assert(previewHtml.includes('OHD-SPRINT-01'), 'Preview renders Task 1 ID: OHD-SPRINT-01');
  assert(previewHtml.includes('Rank Math Blog Pagination Title Fix'), 'Preview renders Task 1 title');
  assert(previewHtml.includes('1. Symptom & Live Evidence:'), 'Preview renders Task 1 Symptom & Live Evidence');
  assert(previewHtml.includes('2. Root Cause Analysis:'), 'Preview renders Task 1 Root Cause');
  assert(previewHtml.includes('3. Ready-to-Test Code'), 'Preview renders Task 1 Ready-to-Test Code');
  assert(previewHtml.includes('4. Architectural Recommendation & DoD:'), 'Preview renders Task 1 Arch Recommendation');
  assert(previewHtml.includes('OHD-DEV-01'), 'Preview renders Task 2 ID: OHD-DEV-01');
  assert(previewHtml.includes('Sitewide Navigation & Footer Trailing Slash'), 'Preview renders Task 2 title');

  // Test snippet copying
  const code1 = window.copyCodeSnippet('snippet-ohd-01');
  assert(code1.includes('rank_math/frontend/title'), 'copyCodeSnippet returns rank_math filter code');
  assert(code1.includes('is_paged()'), 'copyCodeSnippet returns is_paged() logic');

  const code2 = window.copyCodeSnippet('snippet-ohd-02');
  assert(code2.includes('user_trailingslashit'), 'copyCodeSnippet returns user_trailingslashit code');

  // Verify Section C: AM Retainer Note (Rule 6 Format)
  assert(previewHtml.includes('Account Manager Briefing (Rule 6 Format — Gyongyi Castellanos)'), 'Preview renders AM Briefing section');
  assert(previewHtml.includes('1. Verdict / Peace of Mind:'), 'AM Note includes Sentence 1 (Verdict)');
  assert(previewHtml.includes('2. Hours & Budget Impact:'), 'AM Note includes Sentence 2 (Budget Impact)');
  assert(previewHtml.includes('3. Call to Action:'), 'AM Note includes Sentence 3 (Call to Action)');

  const amNoteText = window.copyAmNote();
  assert(amNoteText.includes('92%'), 'copyAmNote includes 92% health score');
  assert(amNoteText.includes('45-minute CMS sprint'), 'copyAmNote includes 45-min sprint description');
  assert(amNoteText.includes('Florin in Phase 2'), 'copyAmNote includes Florin Phase 2 reference');

  // Verify Commit & Discard actions
  assert(previewHtml.includes('btn-commit-ingest'), 'Preview includes Confirm & Commit button');
  assert(previewHtml.includes('btn-discard-preview'), 'Preview includes Discard Preview button');

  // Test discard preview
  window.resetCrawlPreview();
  const resetContent = document.getElementById('ingest-studio-content').innerHTML;
  assert(!resetContent.includes('crawl-preview-container'), 'resetCrawlPreview successfully hides preview container');

  // --------------------------------------------------------------------------
  // SUITE 5: Zero-Regression on Existing Tabs (kpis, task, replit)
  // --------------------------------------------------------------------------
  console.log('\n--- Suite 5: Zero-Regression on Existing Tabs ---');

  // Test tab 1: KPIs
  window.setStudioTab('kpis');
  const kpiTabHtml = document.getElementById('ingest-studio-content').innerHTML;
  assert(kpiTabHtml.includes('studio-kpi-form'), 'setStudioTab("kpis") renders #studio-kpi-form');
  assert(kpiTabHtml.includes('kpi-input-clicks'), 'KPI tab renders Organic Clicks input');
  assert(kpiTabHtml.includes('Publish Monthly Report'), 'KPI tab renders Publish Monthly Report button');

  // Test tab 2: Task
  window.setStudioTab('task');
  const taskTabHtml = document.getElementById('ingest-studio-content').innerHTML;
  assert(taskTabHtml.includes('studio-task-form'), 'setStudioTab("task") renders #studio-task-form');
  assert(taskTabHtml.includes('task-input-title'), 'Task tab renders Task Title input');
  assert(taskTabHtml.includes('Add Task to Backlog'), 'Task tab renders Add Task to Backlog button');

  // Test tab 3: Replit
  window.setStudioTab('replit');
  const replitTabHtml = document.getElementById('ingest-studio-content').innerHTML;
  assert(replitTabHtml.includes('studio-replit-form'), 'setStudioTab("replit") renders #studio-replit-form');
  assert(replitTabHtml.includes('replit-input-url'), 'Replit tab renders Replit URL input');
  assert(replitTabHtml.includes('Sync Audit Bridge'), 'Replit tab renders Sync Audit Bridge button');

  // Test close drawer
  window.closeIngestStudio();
  assert(document.getElementById('ingest-studio-drawer').classList.contains('hidden'), 'closeIngestStudio marks drawer hidden');

  console.log('\n====================================================');
  console.log(`📊 RESULTS: ${passedTests} / ${totalTests} tests passed (100%)`);
  console.log('====================================================');
  console.log('🎉 ALL MILESTONE 3 CRAWL STUDIO TESTS PASSED!');
}

runTests().catch(err => {
  console.error('Fatal test runner error:', err);
  process.exit(1);
});
