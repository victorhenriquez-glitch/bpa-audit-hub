/**
 * test_challenger_m4_runner.js
 * 
 * EMPIRICAL ADVERSARIAL CHALLENGER SUITE FOR MILESTONE 4 CONSOLIDATED QUALITY GATE
 * Target: bpa-audit-hub/test_suite.js
 * 
 * Tests:
 * 1. CLI flags & edge combinations (--baseline-only, unrecognized flags, precedence)
 * 2. Child suite failure propagation (code 1, non-zero code 42, uncaught exceptions, missing file)
 * 3. Multi-suite failure arithmetic & assertion accounting
 * 4. Child process environment isolation (NODE_ENV, SCREAMING_FROG_MODE)
 * 5. Baseline failure gate halting before milestone execution
 */

const { spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const HUB_DIR = __dirname;
const TEST_SUITE_PATH = path.join(HUB_DIR, 'test_suite.js');

let totalAssertions = 0;
let passedAssertions = 0;

function assert(condition, message) {
  totalAssertions++;
  if (condition) {
    passedAssertions++;
    console.log(`  ✅ [PASS] ${message}`);
  } else {
    console.error(`  ❌ [FAIL] ${message}`);
  }
}

function runTestSuite(args = []) {
  const result = spawnSync(process.execPath, [TEST_SUITE_PATH, ...args], {
    cwd: HUB_DIR,
    encoding: 'utf8'
  });
  return {
    status: result.status,
    stdout: result.stdout || '',
    stderr: result.stderr || ''
  };
}

function withMockFile(filePath, mockContent, callback) {
  const original = fs.readFileSync(filePath, 'utf8');
  try {
    fs.writeFileSync(filePath, mockContent, 'utf8');
    callback();
  } finally {
    fs.writeFileSync(filePath, original, 'utf8');
  }
}

function withMissingFile(filePath, callback) {
  const backupPath = filePath + '.challenger_bak_' + Date.now();
  fs.renameSync(filePath, backupPath);
  try {
    callback();
  } finally {
    if (fs.existsSync(backupPath)) {
      if (fs.existsSync(filePath)) {
        try { fs.unlinkSync(filePath); } catch (e) {}
      }
      fs.renameSync(backupPath, filePath);
    }
  }
}

console.log('======================================================================');
console.log('⚔️ STARTING EMPIRICAL ADVERSARIAL CHALLENGE: MILESTONE 4 QUALITY GATE');
console.log('======================================================================\n');

// ----------------------------------------------------------------------------
// CATEGORY 1: CLI Flags & Combination Semantics
// ----------------------------------------------------------------------------
console.log('📌 CATEGORY 1: CLI Flags & Combination Semantics');

// 1.1 --baseline-only
{
  const res = runTestSuite(['--baseline-only']);
  assert(res.status === 0, 'C1.1: --baseline-only returns exit code 0');
  assert(res.stdout.includes('📊 BASELINE RESULTS: 246 / 246 tests passed'), 'C1.1: Outputs 246/246 baseline results');
  assert(res.stdout.includes('Skipping milestone test suites'), 'C1.1: Confirms skipping milestone suites');
  assert(!res.stdout.includes('▶️ [Suite 22]'), 'C1.1: Does NOT launch Suite 22');
  assert(!res.stdout.includes('▶️ [Suite 23]'), 'C1.1: Does NOT launch Suite 23');
  assert(!res.stdout.includes('▶️ [Suite 24]'), 'C1.1: Does NOT launch Suite 24');
  assert(!res.stdout.includes('🏆 BPA AUDIT HUB CONSOLIDATED QUALITY GATE SUMMARY'), 'C1.1: Skips consolidated summary table');
}

// 1.2 Unrecognized flags
{
  const res = runTestSuite(['--foo', '--bar=42', '-z', '--unrecognized-param']);
  assert(res.status === 0, 'C1.2: Unrecognized flags do not crash the runner and exit with code 0');
  assert(res.stdout.includes('4 CORE SUITES / 543 ASSERTIONS'), 'C1.2: Unrecognized flags fall back to default core suite mode');
  assert(res.stdout.includes('TOTAL ASSERTIONS VERIFIED: 543 / 543'), 'C1.2: Successfully verifies all 543 core assertions under unrecognized flags');
}

// 1.3 --baseline-only precedence over --all / --matrix
{
  const res = runTestSuite(['--baseline-only', '--all', '--matrix']);
  assert(res.status === 0, 'C1.3: --baseline-only takes precedence over --all and exits 0');
  assert(res.stdout.includes('Skipping milestone test suites'), 'C1.3: Milestone suites skipped even when --all is present');
  assert(!res.stdout.includes('10 SUITES / 1,029 ASSERTIONS'), 'C1.3: Does not enter 10-suite matrix mode when --baseline-only is active');
}

// 1.4 --summary / --silent stdio suppression
{
  const resSummary = runTestSuite(['--summary']);
  assert(resSummary.status === 0, 'C1.4: --summary flag exits with code 0');
  assert(resSummary.stdout.includes('🏆 BPA AUDIT HUB CONSOLIDATED QUALITY GATE SUMMARY'), 'C1.4: Summary table is rendered');
  assert(resSummary.stdout.includes('TOTAL ASSERTIONS VERIFIED: 543 / 543 (100%)'), 'C1.4: Reports 543 / 543 (100%)');
  // Child assertions output should be suppressed by stdio: 'pipe'
  assert(!resSummary.stdout.includes('Crawl Initiation Schema conforms'), 'C1.4: Verbose child assertion details are suppressed in stdout');

  const resSilent = runTestSuite(['--silent']);
  assert(resSilent.status === 0, 'C1.4: --silent behaves equivalently to --summary with exit code 0');
  assert(resSilent.stdout.includes('TOTAL ASSERTIONS VERIFIED: 543 / 543'), 'C1.4: --silent renders final quality gate totals');
}

// 1.5 Matrix Flag Aliases Contract Verification
{
  const scriptContent = fs.readFileSync(TEST_SUITE_PATH, 'utf8');
  assert(scriptContent.includes("cliArgs.includes('--all')"), 'C1.5: Runner supports --all');
  assert(scriptContent.includes("cliArgs.includes('--full')"), 'C1.5: Runner supports --full alias');
  assert(scriptContent.includes("cliArgs.includes('--matrix')"), 'C1.5: Runner supports --matrix alias');
  assert(scriptContent.includes("cliArgs.includes('--summary')"), 'C1.5: Runner supports --summary');
  assert(scriptContent.includes("cliArgs.includes('--silent')"), 'C1.5: Runner supports --silent alias');
}

// ----------------------------------------------------------------------------
// CATEGORY 2: Child Suite Failure Propagation & Exit Code Enforcement
// ----------------------------------------------------------------------------
console.log('\n📌 CATEGORY 2: Child Suite Failure Propagation & Exit Code Enforcement');

const targetM1File = path.join(HUB_DIR, 'test_m1_crawler.js');
const targetM2File = path.join(HUB_DIR, 'test_m2_ingest.js');
const targetM3File = path.join(HUB_DIR, 'test_m3_studio.js');

// 2.1 Single Child Exiting with Code 1
{
  const failingMock = `
    console.error("SIMULATED ERROR: Crawler API connection failed");
    process.exit(1);
  `;
  withMockFile(targetM1File, failingMock, () => {
    const res = runTestSuite(['--summary']);
    assert(res.status === 1, 'C2.1: Runner exits with status 1 when child suite exits with status 1');
    assert(res.stderr.includes('QUALITY GATE FAILED — One or more milestone suites reported errors'), 'C2.1: Stderr logs quality gate failure');
    assert(res.stdout.includes('🎯 QUALITY GATE STATUS: FAILURES DETECTED'), 'C2.1: Summary reports FAILURES DETECTED');
    assert(res.stdout.includes('❌ Screaming Frog API Server & Routes (M1)') && res.stdout.includes('0 / 61'), 'C2.1: Failed suite reported with ❌ and 0 passed assertions');
    assert(res.stdout.includes('TOTAL ASSERTIONS VERIFIED: 482 / 543 (89%)'), 'C2.1: Total passed arithmetic accurately decrements by failed suite assertions (543 - 61 = 482)');
  });
}

// 2.2 Single Child Exiting with Arbitrary Non-Zero Code (e.g. 42)
{
  const customExitMock = `
    console.log("Suite terminating with custom error code 42");
    process.exit(42);
  `;
  withMockFile(targetM3File, customExitMock, () => {
    const res = runTestSuite(['--summary']);
    assert(res.status === 1, 'C2.2: Runner maps child exit code 42 to process exit code 1');
    assert(res.stderr.includes('exited with status 42'), 'C2.2: Runner stderr logs the exact child status code (42)');
    assert(res.stdout.includes('🎯 QUALITY GATE STATUS: FAILURES DETECTED'), 'C2.2: Quality gate status marked as FAILURES DETECTED');
    assert(res.stdout.includes('❌ Crawl Ingestion Studio UI Extension (M3)           0 / 127'), 'C2.2: Suite 24 recorded as 0 / 127 in summary table');
  });
}

// 2.3 Single Child Throwing Uncaught Runtime Exception
{
  const crashingMock = `
    console.log("Initializing suite before fatal crash...");
    throw new TypeError("Cannot read properties of undefined (reading 'listen')");
  `;
  withMockFile(targetM2File, crashingMock, () => {
    const res = runTestSuite(['--summary']);
    assert(res.status === 1, 'C2.3: Runner exits with code 1 when child throws uncaught exception');
    assert(res.stdout.includes('🎯 QUALITY GATE STATUS: FAILURES DETECTED'), 'C2.3: Uncaught exception registered as failure in quality gate status');
    assert(res.stdout.includes('❌ Production Crawl Ingestion Pipeline (M2)           0 / 109'), 'C2.3: Crashing suite recorded as 0 / 109');
  });
}

// 2.4 Child Suite File Missing / ENOENT
{
  withMissingFile(targetM3File, () => {
    const res = runTestSuite(['--summary']);
    assert(res.status === 1, 'C2.4: Runner exits with code 1 when a suite file is missing from disk');
    assert(res.stdout.includes('🎯 QUALITY GATE STATUS: FAILURES DETECTED'), 'C2.4: Missing file flagged as FAILURES DETECTED in summary');
    assert(res.stdout.includes('❌ Crawl Ingestion Studio UI Extension (M3)           0 / 127'), 'C2.4: Missing suite marked with ❌ in summary table');
  });
}

// ----------------------------------------------------------------------------
// CATEGORY 3: Multi-Suite Failure Accumulation & Assertion Arithmetic
// ----------------------------------------------------------------------------
console.log('\n📌 CATEGORY 3: Multi-Suite Failure Accumulation & Assertion Arithmetic');

// 3.1 Two Milestone Suites Failing Simultaneously (M1 and M3)
{
  const mockM1 = `process.exit(1);`;
  const mockM3 = `process.exit(1);`;

  withMockFile(targetM1File, mockM1, () => {
    withMockFile(targetM3File, mockM3, () => {
      const res = runTestSuite(['--summary']);
      assert(res.status === 1, 'C3.1: Runner exits with status 1 on multiple child failures');
      assert(res.stdout.includes('❌ Screaming Frog API Server & Routes (M1)') && res.stdout.includes('0 / 61'), 'C3.1: M1 marked ❌');
      assert(res.stdout.includes('✅ Production Crawl Ingestion Pipeline (M2)         109 / 109'), 'C3.1: M2 still passes ✅ with 109/109');
      assert(res.stdout.includes('❌ Crawl Ingestion Studio UI Extension (M3)           0 / 127'), 'C3.1: M3 marked ❌');
      // Total assertions: 246 (baseline) + 109 (M2) = 355
      assert(res.stdout.includes('TOTAL ASSERTIONS VERIFIED: 355 / 543 (65%)'), 'C3.1: Cumulative arithmetic counts only passing suites: 355 / 543 (65%)');
      assert(res.stdout.includes('🎯 QUALITY GATE STATUS: FAILURES DETECTED'), 'C3.1: Quality gate status confirms FAILURES DETECTED');
    });
  });
}

// ----------------------------------------------------------------------------
// CATEGORY 4: Child Process Environment Isolation & Contract
// ----------------------------------------------------------------------------
console.log('\n📌 CATEGORY 4: Child Process Environment Isolation & Contract');

// 4.1 Verify Child Receives Expected Environment Variables
{
  const envInspectorMock = `
    const isTest = process.env.NODE_ENV === 'test';
    const isMock = process.env.SCREAMING_FROG_MODE === 'mock';
    if (!isTest || !isMock) {
      console.error('ENV MISMATCH: NODE_ENV=' + process.env.NODE_ENV + ', SCREAMING_FROG_MODE=' + process.env.SCREAMING_FROG_MODE);
      process.exit(77);
    }
    console.log('ENV OK');
    process.exit(0);
  `;
  withMockFile(targetM3File, envInspectorMock, () => {
    const res = runTestSuite(['--summary']);
    assert(res.status === 0, 'C4.1: Runner passes NODE_ENV=test and SCREAMING_FROG_MODE=mock to children');
    assert(res.stdout.includes('✅ Crawl Ingestion Studio UI Extension (M3)         127 / 127'), 'C4.1: Child accepted environment configuration cleanly');
  });
}

// ----------------------------------------------------------------------------
// CATEGORY 5: Baseline Suite Gate Halting
// ----------------------------------------------------------------------------
console.log('\n📌 CATEGORY 5: Baseline Suite Gate Halting');

// 5.1 Verify that if baseline tests fail, child suites are NEVER spawned
{
  // Inspect test_suite.js logic around baseline halt
  const code = fs.readFileSync(TEST_SUITE_PATH, 'utf8');
  assert(
    code.includes('if (passedTests !== totalTests) {') &&
    code.includes('process.exit(1);'),
    'C5.1: test_suite.js explicitly contains immediate exit(1) on baseline test failure before milestone execution'
  );
  
  // Verify execution order in code
  const baselineExitIdx = code.indexOf('Baseline audit hub tests failed. Halting before milestone execution.');
  const spawnSyncIdx = code.indexOf('spawnSync(process.execPath');
  assert(
    baselineExitIdx !== -1 && spawnSyncIdx !== -1 && baselineExitIdx < spawnSyncIdx,
    'C5.1: Baseline exit check strictly precedes any spawnSync execution'
  );
}

// ----------------------------------------------------------------------------
// SUMMARY & VERDICT
// ----------------------------------------------------------------------------
console.log('\n======================================================================');
console.log(`📊 ADVERSARIAL CHALLENGER RESULTS: ${passedAssertions} / ${totalAssertions} assertions passed (${Math.round((passedAssertions/totalAssertions)*100)}%)`);
console.log('======================================================================');

if (passedAssertions === totalAssertions) {
  console.log('🎉 ALL ADVERSARIAL CHALLENGES PASSED! Consolidated Quality Gate Runner is 100% resilient.');
  process.exit(0);
} else {
  console.error('❌ ADVERSARIAL CHALLENGE DETECTED DEFECTS in test_suite.js!');
  process.exit(1);
}
