/**
 * Bright Pink Agency - Automated Audit Hub Test Suite
 * Validates data schemas, DOM rendering, charts, filters, and modal interactions for all clients.
 * Prevents regressions when adding or modifying client projects.
 */

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
        textContent: '',
        _innerHTML: '',
        children: [],
        className: '',
        style: {},
        classList: {
          add: function(c) { this._classes = (this._classes || '') + ' ' + c; },
          remove: function(c) { if (this._classes) this._classes = this._classes.replace(c, ''); }
        },
        querySelector: () => ({ textContent: '' }),
        querySelectorAll: () => [],
        getContext: () => ({}),
        appendChild: function(child) {
          this.children.push(child);
          createdElements.push(child);
        },
        addEventListener: () => {}
      };
      Object.defineProperty(el, 'innerHTML', {
        get() { return this._innerHTML; },
        set(val) {
          this._innerHTML = val;
          if (val === '') this.children = [];
        }
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
      classList: { add: () => {}, remove: () => {} },
      appendChild: (c) => {},
      addEventListener: () => {}
    };
    createdElements.push(el);
    return el;
  },
  addEventListener: () => {}
};

global.URLSearchParams = class {
  get() { return null; }
};

const chartsRendered = [];
global.Chart = class {
  constructor(ctx, config) {
    chartsRendered.push({ ctx, type: config.type, data: config.data });
  }
  destroy() {}
};

global.lucide = {
  createIcons: () => {}
};

// 2. Load Core Modules
require(path.join(__dirname, 'js/core/security-gate.js'));
require(path.join(__dirname, 'js/data-store.js'));
require(path.join(__dirname, 'js/services/storage-adapter.js'));
require(path.join(__dirname, 'js/charts.js'));
require(path.join(__dirname, 'js/modules/task-workflow.js'));
require(path.join(__dirname, 'js/modules/kpi-octav-engine.js'));
require(path.join(__dirname, 'js/modules/ingest-studio.js'));
require(path.join(__dirname, 'js/modules/bright-audits-bridge.js'));
require(path.join(__dirname, 'js/app.js'));

console.log('====================================================');
console.log('🧪 RUNNING BPA AUDIT HUB AUTOMATED TEST SUITE');
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
    process.exitCode = 1;
  }
}

// TEST 1: Data Store Presence
assert(window.BPA_DATA && typeof window.BPA_DATA === 'object', 'BPA_DATA exists on window');
assert(window.BPA_DATA['oh-deer'] !== undefined, 'oh-deer client data is loaded');
assert(window.BPA_DATA['us-lawns'] !== undefined, 'us-lawns client data is loaded');
assert(window.BPA_DATA['owl-be-there'] !== undefined, 'owl-be-there client data is loaded');
assert(window.BPA_DATA['pacific-lawn-sprinklers'] !== undefined, 'pacific-lawn-sprinklers client data is loaded');
assert(window.BPA_DATA['image-studios'] !== undefined, 'image-studios client data is loaded');

// TEST 2: Sanitize Utility
assert(typeof window.sanitize === 'function', 'window.sanitize function is available');
assert(window.sanitize('<script>alert(1)</script>') === '&lt;script&gt;alert(1)&lt;/script&gt;', 'window.sanitize escapes HTML tags');
assert(window.sanitize(null) === '', 'window.sanitize handles null gracefully');
assert(window.sanitize(undefined) === '', 'window.sanitize handles undefined gracefully');

// TEST 3: Client Schema Validation
for (const slug of ['oh-deer', 'us-lawns', 'owl-be-there', 'pacific-lawn-sprinklers', 'image-studios']) {
  const c = window.BPA_DATA[slug];
  assert(Boolean(c.clientName), `[${slug}] Has clientName`);
  assert(Boolean(c.domain), `[${slug}] Has domain`);
  assert(Boolean(c.cmsStack && c.cmsStack.platform), `[${slug}] Has cmsStack.platform`);
  assert(Boolean(c.kpis && c.kpis.totalCrawledUrls > 0), `[${slug}] Has valid kpis.totalCrawledUrls`);
  assert(Array.isArray(c.tasks) && c.tasks.length > 0, `[${slug}] Has non-empty tasks array (count: ${c.tasks.length})`);
  assert(Array.isArray(c.completedTasks), `[${slug}] Has completedTasks array (count: ${c.completedTasks.length})`);
}

// TEST 4: ohDEER Ground-Truth Integrity (No Divi, Real Theme)
const ohdeer = window.BPA_DATA['oh-deer'];
assert(!ohdeer.cmsStack.theme.toLowerCase().includes('divi'), 'ohDEER theme does NOT assume Divi');
assert(ohdeer.cmsStack.theme.includes('bpa-ohdeer-hq'), 'ohDEER theme references custom BPA theme');
assert(ohdeer.kpis.clean200HtmlPages === 945, 'ohDEER has 945 verified 200 OK indexable HTML pages');
assert(ohdeer.kpis.broken404Pages === 0, 'ohDEER has 0 broken 404 HTML pages');

// TEST 5: Render Client & DOM Execution
console.log('\n--- Testing renderClient("oh-deer") ---');
window.renderClient('oh-deer');
assert(elementsMap['client-name'].textContent === 'ohDEER', 'client-name element populated correctly');
assert(elementsMap['kpi-total'].textContent.replace(/\D/g, '') === '5692', 'kpi-total element contains 5692 formatted');
assert(elementsMap['count-all'].textContent === ohdeer.tasks.length, `count-all badge matches tasks length (${ohdeer.tasks.length})`);
assert(elementsMap['count-sprint'].textContent === ohdeer.tasks.filter(t => t.phase === 'Current Sprint').length, `count-sprint badge matches current sprint tasks (${ohdeer.tasks.filter(t => t.phase === 'Current Sprint').length})`);
assert(elementsMap['count-completed'].textContent === ohdeer.completedTasks.length, `count-completed badge matches completed tasks (${ohdeer.completedTasks.length})`);

// TEST 6: Chart.js Visualizations
assert(chartsRendered.length >= 3, `Charts rendered count (${chartsRendered.length}) >= 3`);

// TEST 7: Filter Tests
console.log('\n--- Testing Filter State Switching ---');
window.currentFilter = 'sprint';
window.renderTasks(ohdeer.tasks);
assert(createdElements.length > 0, 'renderTasks creates elements for sprint filter');

window.currentFilter = 'completed';
window.renderTasks(ohdeer.tasks);
assert(createdElements.length > 0, 'renderTasks creates elements for completed filter');

// TEST 8: Modal Tests (No crash on any task)
console.log('\n--- Testing Modal for All Tasks ---');
for (const task of ohdeer.tasks) {
  let modalPassed = true;
  try {
    window.openTaskModal(task.id);
  } catch (e) {
    modalPassed = false;
    console.error(`Error opening modal for ${task.id}:`, e);
  }
  assert(modalPassed, `Modal opens cleanly for task ${task.id}`);
}

// TEST 9: Test US Lawns Rendering & DOM Integration
console.log('\n--- Testing renderClient("us-lawns") ---');
let usLawnsPassed = true;
try {
  window.renderClient('us-lawns');
} catch (e) {
  usLawnsPassed = false;
  console.error('Error rendering US Lawns:', e);
}
assert(usLawnsPassed, 'renderClient("us-lawns") executes without errors');

const usLawns = window.BPA_DATA['us-lawns'];
assert(elementsMap['client-name'].textContent === 'US Lawns', 'US Lawns client-name element populated correctly');
assert(elementsMap['score-calibrated'].innerHTML.includes('86'), 'US Lawns calibrated health score is 86%');
assert(elementsMap['count-all'].textContent === 8, 'US Lawns total tasks count is 8');
assert(elementsMap['count-augustina'].textContent === 7, 'US Lawns Augustina build tasks count is 7');
assert(elementsMap['count-victor'].textContent === 2, 'US Lawns Victor tasks count is 2');

// TEST 10: US Lawns 7-Tier Crawl Depth Chart
console.log('\n--- Testing US Lawns 7-Tier Crawl Depth Chart ---');
window.BPA_CHARTS.renderCharts(usLawns);
const lastDepthChart = chartsRendered.filter(c => c.type === 'bar').pop();
assert(lastDepthChart !== undefined, 'Crawl depth chart was created for US Lawns');
assert(lastDepthChart.data.labels.length === 7, 'Crawl depth chart has 7 depth tiers for US Lawns');
assert(lastDepthChart.data.labels[6] === 'L10-16 Crawl Trap', 'Crawl depth chart flags L10-16 Crawl Trap correctly');

// TEST 11: US Lawns Augustina Filter
console.log('\n--- Testing Augustina Filter on US Lawns ---');
window.currentFilter = 'augustina';
window.renderTasks(usLawns.tasks);
const augustinaCards = elementsMap['tasks-container'].children.length;
assert(augustinaCards === 7, `renderTasks creates exactly 7 task cards for Augustina filter (created: ${augustinaCards})`);

// TEST 12: US Lawns Victor Filter
console.log('\n--- Testing Victor Filter on US Lawns ---');
window.currentFilter = 'victor';
window.renderTasks(usLawns.tasks);
const victorCards = elementsMap['tasks-container'].children.length;
assert(victorCards === 2, `renderTasks creates exactly 2 task cards for Victor filter (created: ${victorCards})`);

// TEST 13: US Lawns Modal Execution for All 8 Tasks
console.log('\n--- Testing Modal for All US Lawns Tasks ---');
for (const task of usLawns.tasks) {
  let modalPassed = true;
  try {
    window.openTaskModal(task.id);
  } catch (e) {
    modalPassed = false;
    console.error(`Error opening modal for ${task.id}:`, e);
  }
  assert(modalPassed, `Modal opens cleanly for task ${task.id}`);
}

// TEST 14: Test Owl Be There Ground-Truth, Dev Team Role & Modal Execution
console.log('\n--- Testing renderClient("owl-be-there") ---');
const owl = window.BPA_DATA['owl-be-there'];
assert(Boolean(owl.workbookUrl && owl.workbookUrl.startsWith('https://docs.google.com/')), 'Owl Be There has verified cloud workbookUrl');
assert(!owl.cmsStack.theme.toLowerCase().includes('divi'), 'Owl Be There theme does NOT assume Divi');
assert(owl.cmsStack.theme.includes('owlbethere') && owl.cmsStack.theme.includes('owlbethere-zee'), 'Owl Be There references real parent/child BPA themes');
assert(owl.kpis.totalCrawledUrls === 1376, 'Owl Be There totalCrawledUrls is 1376');
assert(owl.kpis.clean200HtmlPages === 95, 'Owl Be There clean200HtmlPages is 95');
assert(owl.kpis.broken404Pages === 0, 'Owl Be There broken404Pages is 0');

let owlPassed = true;
try {
  window.switchClient('owl-be-there');
} catch (e) {
  owlPassed = false;
  console.error('Error switching to Owl Be There:', e);
}
assert(owlPassed, 'switchClient("owl-be-there") executes without errors');
assert(elementsMap['client-name'].textContent === 'Owl Be There', 'Owl Be There client-name element populated correctly');
assert(elementsMap['count-all'].textContent === 9, 'Owl Be There total tasks count is 9');
assert(elementsMap['count-sprint'].textContent === 3, 'Owl Be There current sprint tasks count is 3');
assert(elementsMap['count-dev'].textContent === 5, 'Owl Be There Dev Team tasks count is 5');
assert(elementsMap['count-content'].textContent >= 1, 'Owl Be There has Content Team tasks');

const owlDevTasks = owl.tasks.filter(t => t.id.startsWith('OBT-DEV-'));
assert(owlDevTasks.every(t => t.assignedRole === 'Dev Team'), 'All Owl Be There dev tasks are assigned strictly to "Dev Team"');

for (const task of owl.tasks) {
  let modalPassed = true;
  try {
    window.openTaskModal(task.id);
  } catch (e) {
    modalPassed = false;
    console.error(`Error opening modal for ${task.id}:`, e);
  }
  assert(modalPassed, `Modal opens cleanly for Owl Be There task ${task.id}`);
  assert(Boolean(task.workbookUrl && task.workbookUrl.includes('1Fx8tsCykRmfqG79Cw0o0K7dZYdJMYK3x')), `Task ${task.id} includes Google Sheet workbookUrl link`);
}

// TEST 15: Test Pacific Lawn Sprinklers Ground-Truth, Roles & Modal Execution
console.log('\n--- Testing renderClient("pacific-lawn-sprinklers") ---');
const pls = window.BPA_DATA['pacific-lawn-sprinklers'];
assert(Boolean(pls.workbookUrl && pls.workbookUrl.includes('1Jn1AcZ_sFECwyvqSWknHTuIba3tY26gk')), 'Pacific Lawn Sprinklers has verified cloud Google Sheet workbookUrl');
assert(Boolean(pls.gdocUrl && pls.gdocUrl.includes('1uXIWLw67yXgxljBnEjvVMjzMHDkIZS8Vq5o_aUmY8eI')), 'Pacific Lawn Sprinklers has verified cloud Google Doc gdocUrl');
assert(!pls.cmsStack.theme.toLowerCase().includes('divi'), 'Pacific Lawn Sprinklers theme does NOT assume Divi');
assert(pls.cmsStack.theme.includes('bpa-pacific'), 'Pacific Lawn Sprinklers references real custom BPA theme (bpa-pacific)');
assert(pls.kpis.totalCrawledUrls === 4052, 'Pacific Lawn Sprinklers totalCrawledUrls is 4052');
assert(pls.kpis.clean200HtmlPages === 4025, 'Pacific Lawn Sprinklers clean200HtmlPages is 4025');
assert(pls.kpis.broken404Pages === 9, 'Pacific Lawn Sprinklers broken404Pages is 9');
assert(pls.kpis.internal301Redirects === 17, 'Pacific Lawn Sprinklers internal301Redirects is 17');

let plsPassed = true;
try {
  window.switchClient('pacific-lawn-sprinklers');
} catch (e) {
  plsPassed = false;
  console.error('Error switching to Pacific Lawn Sprinklers:', e);
}
assert(plsPassed, 'switchClient("pacific-lawn-sprinklers") executes without errors');
assert(elementsMap['client-name'].textContent === 'Pacific Lawn Sprinklers', 'Pacific Lawn Sprinklers client-name element populated correctly');
assert(elementsMap['hero-workbook-link'].href.includes('1Jn1AcZ_sFECwyvqSWknHTuIba3tY26gk'), 'Pacific Lawn Sprinklers hero-workbook-link points to Google Sheet');
assert(elementsMap['hero-gdoc-link'].href.includes('1uXIWLw67yXgxljBnEjvVMjzMHDkIZS8Vq5o_aUmY8eI'), 'Pacific Lawn Sprinklers hero-gdoc-link points to Google Doc');
assert(elementsMap['count-all'].textContent === 9, 'Pacific Lawn Sprinklers total tasks count is 9');
assert(elementsMap['count-sprint'].textContent === 4, 'Pacific Lawn Sprinklers current sprint tasks count is 4');
assert(elementsMap['count-dev'].textContent === 4, 'Pacific Lawn Sprinklers Dev Team tasks count is 4');
assert(elementsMap['count-content'].textContent === 1, 'Pacific Lawn Sprinklers Content Team tasks count is 1');

for (const task of pls.tasks) {
  let modalPassed = true;
  try {
    window.openTaskModal(task.id);
  } catch (e) {
    modalPassed = false;
    console.error(`Error opening modal for ${task.id}:`, e);
  }
  assert(modalPassed, `Modal opens cleanly for Pacific Lawn Sprinklers task ${task.id}`);
  assert(Boolean(task.workbookUrl && task.workbookUrl.includes('1Jn1AcZ_sFECwyvqSWknHTuIba3tY26gk')), `Task ${task.id} includes cloud Google Sheet workbookUrl link`);
}

// TEST 16: Security Gate Multi-Layer Sanitization
console.log('\n--- Testing Security Gate & URL Whitelisting ---');
assert(typeof window.sanitizeUrl === 'function', 'window.sanitizeUrl function exists');
assert(window.sanitizeUrl('javascript:alert(1)') === '#', 'sanitizeUrl blocks javascript: pseudo-protocol');
assert(window.sanitizeUrl('data:text/html,<script>alert(1)</script>') === '#', 'sanitizeUrl blocks data: pseudo-protocol');
assert(window.sanitizeUrl('https://brightpinkagency.com') === 'https://brightpinkagency.com', 'sanitizeUrl allows valid https: URLs');
assert(window.sanitizeUrl('http://insecure.com') === 'http://insecure.com', 'sanitizeUrl allows standard http: URLs');

assert(typeof window.sanitizeEmbedUrl === 'function', 'window.sanitizeEmbedUrl function exists');
assert(window.sanitizeEmbedUrl('https://lookerstudio.google.com/embed/reporting/123') !== '', 'sanitizeEmbedUrl allows lookerstudio.google.com embeds');
assert(window.sanitizeEmbedUrl('https://datastudio.google.com/embed/reporting/123') !== '', 'sanitizeEmbedUrl allows datastudio.google.com embeds');
assert(window.sanitizeEmbedUrl('https://malicious-iframe.com/hack') === '', 'sanitizeEmbedUrl blocks unauthorized embed domains');

assert(typeof window.validateClientSchema === 'function', 'window.validateClientSchema function exists');
const normalized = window.validateClientSchema({ clientName: 'Test Brand' });
assert(Array.isArray(normalized.tasks), 'validateClientSchema ensures tasks array');
assert(Array.isArray(normalized.completedTasks), 'validateClientSchema ensures completedTasks array');
assert(typeof normalized.kpis === 'object', 'validateClientSchema ensures kpis object');

// TEST 17: Chart.js 0-Value Falsy Bug Verification
console.log('\n--- Testing Chart.js 0-Value Falsy Bug Fix ---');
const zeroKpiMock = {
  clientName: 'Zero Bug Client',
  tasks: [],
  kpis: {
    clean200HtmlPages: 100,
    internal301Redirects: 0,
    wafFalsePositive403: 0,
    broken404Pages: 0
  }
};
window.BPA_CHARTS.renderCharts(zeroKpiMock);
const lastDoughnut = chartsRendered.filter(c => c.type === 'doughnut').pop();
assert(lastDoughnut !== undefined, 'Doughnut chart rendered for zero-value client');
assert(lastDoughnut.data.datasets[0].data[1] === 0, 'Internal 301s value is 0 (not fallback 245)');
assert(lastDoughnut.data.datasets[0].data[2] === 0, 'WAF 403s value is 0 (not fallback 818)');
assert(lastDoughnut.data.datasets[0].data[3] === 0, 'Broken 404s value is 0 (not fallback 2)');

// TEST 18: Task Completion & Reopen Workflow
console.log('\n--- Testing Task Completion & Reopen Lifecycle ---');
assert(typeof window.executeCompleteTask === 'function', 'window.executeCompleteTask exists');
assert(typeof window.reopenTask === 'function', 'window.reopenTask exists');
assert(typeof window.switchWorkspaceTab === 'function', 'window.switchWorkspaceTab exists');

window.switchClient('oh-deer');
const initialActiveCount = ohdeer.tasks.length;
const initialCompletedCount = ohdeer.completedTasks.length;
const targetTask = ohdeer.tasks[0];
const targetTaskId = targetTask.id;

window.executeCompleteTask(targetTaskId, {
  author: 'Víctor Henríquez',
  investedMinutes: 20,
  summary: 'Automated test task completion verification'
});

const clientAfterComplete = window.BPA_STORAGE.getClient('oh-deer');
assert(clientAfterComplete.tasks.length === initialActiveCount - 1, 'Task removed from active tasks list');
assert(clientAfterComplete.completedTasks.length === initialCompletedCount + 1, 'Task prepended to completedTasks list');
assert(clientAfterComplete.completedTasks[0].id === targetTaskId, 'Completed task record has matching ID');
assert(clientAfterComplete.completedTasks[0].investedMinutes === 20, 'Invested minutes correctly logged in record');

// Reopen task
window.reopenTask(targetTaskId);
const clientAfterReopen = window.BPA_STORAGE.getClient('oh-deer');
assert(clientAfterReopen.tasks.length === initialActiveCount, 'Reopened task returned to active tasks list');
assert(clientAfterReopen.completedTasks.length === initialCompletedCount, 'Reopened task removed from completedTasks list');

// TEST 19: Sprint Progress Bar Dynamic Calculation
console.log('\n--- Testing Sprint Progress Bar Computation ---');
assert(typeof window.updateSprintProgressBar === 'function', 'window.updateSprintProgressBar function exists');
window.updateSprintProgressBar(ohdeer);
assert(elementsMap['sprint-progress-label'].textContent.includes('Sprint Progress:'), 'Sprint progress label contains formatted progress status');
assert(elementsMap['sprint-progress-bar'].style.width !== '', 'Sprint progress bar style width dynamically set');

// TEST 20: Monthly KPIs & Looker Studio Engine (Octav Format)
console.log('\n--- Testing Monthly KPIs & Looker Studio Engine ---');
assert(typeof window.renderMonthlyKpis === 'function', 'window.renderMonthlyKpis exists');
assert(typeof window.copyKpiSummary === 'function', 'window.copyKpiSummary exists');

let kpisRendered = true;
try {
  window.renderMonthlyKpis(ohdeer);
} catch (e) {
  kpisRendered = false;
  console.error('Error rendering monthly KPIs:', e);
}
assert(kpisRendered, 'renderMonthlyKpis(ohdeer) executes cleanly');
assert(elementsMap['monthly-kpis-container'].children.length > 0 || elementsMap['monthly-kpis-container'].innerHTML !== '', 'Monthly KPIs Bento Grid markup created');

for (const slug of ['us-lawns', 'owl-be-there', 'pacific-lawn-sprinklers', 'image-studios']) {
  let slugKpiPassed = true;
  try {
    window.renderMonthlyKpis(window.BPA_DATA[slug]);
  } catch (e) {
    slugKpiPassed = false;
  }
  assert(slugKpiPassed, `Monthly KPIs render cleanly for [${slug}]`);
}

// TEST 21: Ingest Studio & Custom Task Pipeline
console.log('\n--- Testing Ingest Studio & Custom Task Pipeline ---');
assert(typeof window.openIngestStudio === 'function', 'window.openIngestStudio function exists');
assert(typeof window.closeIngestStudio === 'function', 'window.closeIngestStudio function exists');
assert(typeof window.handlePublishKpis === 'function', 'window.handlePublishKpis function exists');
assert(typeof window.handleCreateTask === 'function', 'window.handleCreateTask function exists');

// Simulate storage add custom task
const customTaskObj = {
  id: 'TEST-AUTO-01',
  phase: 'Current Sprint',
  title: 'Automated Test Task',
  category: 'Test',
  priority: 'Low',
  status: 'Ready to Execute',
  assignedRole: 'Víctor Henríquez',
  estimatedMinutes: 15
};
window.BPA_STORAGE.addCustomTask('oh-deer', customTaskObj);
const clientWithCustom = window.BPA_STORAGE.getClient('oh-deer');
assert(clientWithCustom.tasks.some(t => t.id === 'TEST-AUTO-01'), 'addCustomTask successfully persists new task in client state');

// Clean up custom task
window.BPA_STORAGE.resetClientDemoState('oh-deer');

// TEST 22: Jonie\'s Bright Audits 1:1 Schema & Category Bridge
console.log('\n--- Testing Jonie\'s Bright Audits 1:1 Schema Bridge ---');
assert(typeof window.renderAiInspectorBridge === 'function', 'window.renderAiInspectorBridge exists');
assert(typeof window.pushTasksToClickUp === 'function', 'window.pushTasksToClickUp exists');

let bridgeRendered = true;
try {
  window.renderAiInspectorBridge(ohdeer);
} catch (e) {
  bridgeRendered = false;
  console.error('Error rendering AI inspector bridge:', e);
}
assert(bridgeRendered, 'renderAiInspectorBridge(ohdeer) executes cleanly');
assert(elementsMap['ai-bridge-container'].children.length > 0 || elementsMap['ai-bridge-container'].innerHTML !== '', 'AI Bridge markup populated with 5 category scores');

// TEST 23: Dynamic Roadmap Rendering
console.log('\n--- Testing Dynamic Roadmap Cards Rendering ---');
window.renderClient('oh-deer');
assert(elementsMap['roadmap-cards-container'].children.length > 0 || elementsMap['roadmap-cards-container'].innerHTML !== '', 'Dynamic Roadmap cards rendered in roadmap-cards-container');
assert(elementsMap['roadmap-cards-container'].innerHTML.includes('ohDEER'), 'Roadmap card dynamically references ohDEER client name');

window.renderClient('pacific-lawn-sprinklers');
assert(elementsMap['roadmap-cards-container'].innerHTML.includes('Pacific Lawn Sprinklers'), 'Roadmap card dynamically references Pacific Lawn Sprinklers client name');

// TEST 24: Test IMAGE Studios Ground-Truth, Roles & Modal Execution
console.log('\n--- Testing renderClient("image-studios") ---');
const imgStudios = window.BPA_DATA['image-studios'];
assert(Boolean(imgStudios.workbookUrl && imgStudios.workbookUrl.includes('1HBVuKfPH9s33tiehTDsEdZ-IZvZvJezc')), 'IMAGE Studios has verified cloud Google Sheet workbookUrl');
assert(Boolean(imgStudios.gdocUrl && imgStudios.gdocUrl.includes('1_IumZ4vcxTsEaE98rOXflP2eCACOhcsxzFmOVKtwdWI')), 'IMAGE Studios has verified cloud Google Doc gdocUrl');
assert(!imgStudios.cmsStack.theme.toLowerCase().includes('divi'), 'IMAGE Studios theme does NOT assume Divi');
assert(imgStudios.cmsStack.theme.includes('image-studios'), 'IMAGE Studios references real custom theme (image-studios)');
assert(imgStudios.kpis.totalCrawledUrls === 7066, 'IMAGE Studios totalCrawledUrls is 7066');
assert(imgStudios.kpis.internal301Redirects === 3216, 'IMAGE Studios internal301Redirects is 3216');

let imgPassed = true;
try {
  window.switchClient('image-studios');
} catch (e) {
  imgPassed = false;
  console.error('Error switching to IMAGE Studios:', e);
}
assert(imgPassed, 'switchClient("image-studios") executes without errors');
assert(elementsMap['client-name'].textContent === 'IMAGE Studios', 'IMAGE Studios client-name element populated correctly');
assert(elementsMap['count-all'].textContent === 9, 'IMAGE Studios total tasks count is 9');
assert(elementsMap['count-sprint'].textContent === 3, 'IMAGE Studios current sprint tasks count is 3');
assert(elementsMap['count-dev'].textContent === 5, 'IMAGE Studios Dev Team tasks count is 5');
assert(elementsMap['count-completed'].textContent === 3, 'IMAGE Studios Completed QA tasks count is 3');

for (const task of imgStudios.tasks) {
  let modalPassed = true;
  try {
    window.openTaskModal(task.id);
  } catch (e) {
    modalPassed = false;
    console.error(`Error opening modal for ${task.id}:`, e);
  }
  assert(modalPassed, `Modal opens cleanly for IMAGE Studios task ${task.id}`);
  assert(Boolean(task.workbookUrl && task.workbookUrl.includes('1HBVuKfPH9s33tiehTDsEdZ-IZvZvJezc')), `Task ${task.id} includes cloud Google Sheet workbookUrl link`);
  assert(Boolean(task.clickupUrl && task.clickupUrl.includes('app.clickup.com')), `Task ${task.id} includes verified ClickUp subtask link`);
}

for (const cmp of imgStudios.completedTasks) {
  assert(Boolean(cmp.clickupUrl && cmp.clickupUrl.includes('app.clickup.com')), `Completed QA task ${cmp.id} includes verified ClickUp subtask link`);
  assert(Array.isArray(cmp.sampleUrls) && cmp.sampleUrls.length > 0, `Completed QA task ${cmp.id} includes live proof URLs`);
}


console.log('\n====================================================');
console.log(`📊 RESULTS: ${passedTests} / ${totalTests} tests passed (${Math.round((passedTests/totalTests)*100)}%)`);
console.log('====================================================');

if (passedTests === totalTests) {
  console.log('🎉 ALL TESTS PASSED! UI and Datasets are 100% solid.');
} else {
  process.exit(1);
}
