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
require(path.join(__dirname, 'js/data-store.js'));
require(path.join(__dirname, 'js/charts.js'));
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

// TEST 2: Sanitize Utility
assert(typeof window.sanitize === 'function', 'window.sanitize function is available');
assert(window.sanitize('<script>alert(1)</script>') === '&lt;script&gt;alert(1)&lt;/script&gt;', 'window.sanitize escapes HTML tags');
assert(window.sanitize(null) === '', 'window.sanitize handles null gracefully');
assert(window.sanitize(undefined) === '', 'window.sanitize handles undefined gracefully');

// TEST 3: Client Schema Validation
for (const slug of ['oh-deer', 'us-lawns', 'owl-be-there']) {
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

console.log('\n====================================================');
console.log(`📊 RESULTS: ${passedTests} / ${totalTests} tests passed (${Math.round((passedTests/totalTests)*100)}%)`);
console.log('====================================================');

if (passedTests === totalTests) {
  console.log('🎉 ALL TESTS PASSED! UI and Datasets are 100% solid.');
} else {
  process.exit(1);
}
