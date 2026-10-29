/**
 * Empirical Adversarial Test Harness for Milestone 1
 * Screaming Frog API Server & Routes
 * 
 * Executed by: Challenger 1 (critic, specialist)
 * Tests invalid payloads, race conditions, 409 collisions, state transitions,
 * query boundaries, and edge cases against live HTTP endpoints.
 */

'use strict';

const assert = require('assert');
const http = require('http');

process.env.NODE_ENV = 'test';
process.env.SCREAMING_FROG_MODE = 'mock';

const app = require('./server/index');
const crawlerService = require('./server/services/screaming-frog');

async function runAdversarialHarness() {
  console.log('================================================================');
  console.log('⚡ RUNNING EMPIRICAL ADVERSARIAL STRESS HARNESS — MILESTONE 1');
  console.log('================================================================');

  // Start ephemeral test server
  const server = await new Promise((resolve) => {
    const s = app.listen(0, '127.0.0.1', () => resolve(s));
  });
  const port = server.address().port;
  const baseUrl = `http://127.0.0.1:${port}`;
  console.log(`📡 Adversarial test server active on: ${baseUrl}`);

  let totalTests = 0;
  let passedTests = 0;
  const failures = [];

  function test(condition, description) {
    totalTests++;
    if (condition) {
      console.log(`  ✅ [PASS] ${description}`);
      passedTests++;
    } else {
      console.error(`  ❌ [FAIL] ${description}`);
      failures.push(description);
    }
  }

  // Low-level helper for sending raw byte strings or malformed requests
  function rawPost(path, rawBody, headers = {}) {
    return new Promise((resolve, reject) => {
      const options = {
        hostname: '127.0.0.1',
        port: port,
        path: path,
        method: 'POST',
        headers: Object.assign({
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(rawBody)
        }, headers)
      };

      const req = http.request(options, (res) => {
        let data = '';
        res.on('data', (chunk) => { data += chunk; });
        res.on('end', () => {
          let json = null;
          try { json = JSON.parse(data); } catch (e) {}
          resolve({ status: res.statusCode, headers: res.headers, raw: data, json });
        });
      });

      req.on('error', reject);
      req.write(rawBody);
      req.end();
    });
  }

  try {
    // ========================================================================
    // 1. ADVERSARIAL PAYLOAD TESTING ON POST /api/crawler/crawl
    // ========================================================================
    console.log('\n--- Category 1: Adversarial Payload Stress Testing ---');

    // 1.1 Non-object / malformed payloads
    const malformedPayloads = [
      { name: 'Malformed JSON syntax', raw: '{"broken: json', expectedStatus: 400 },
      { name: 'JSON array instead of object', raw: '[]', expectedStatus: 400 },
      { name: 'Primitive string', raw: '"just a string"', expectedStatus: 400 },
      { name: 'Primitive number', raw: '12345', expectedStatus: 400 },
      { name: 'Boolean true', raw: 'true', expectedStatus: 400 },
      { name: 'Null payload', raw: 'null', expectedStatus: 400 }
    ];

    for (const p of malformedPayloads) {
      const res = await rawPost('/api/crawler/crawl', p.raw);
      test(res.status === p.expectedStatus, `${p.name} returns HTTP ${p.expectedStatus}`);
      test(res.json && Boolean(res.json.error), `${p.name} returns JSON error message`);
    }

    // 1.2 Invalid clientSlug variations
    const invalidSlugs = [
      { name: 'Missing clientSlug', body: { targetUrl: 'https://example.com' } },
      { name: 'Empty clientSlug', body: { clientSlug: '', targetUrl: 'https://example.com' } },
      { name: 'Whitespace clientSlug', body: { clientSlug: '   ', targetUrl: 'https://example.com' } },
      { name: 'Special characters in clientSlug', body: { clientSlug: 'slug;rm -rf', targetUrl: 'https://example.com' } },
      { name: 'Path traversal in clientSlug', body: { clientSlug: '../../etc/passwd', targetUrl: 'https://example.com' } },
      { name: 'Too short clientSlug (1 char)', body: { clientSlug: 'a', targetUrl: 'https://example.com' } },
      { name: 'Too long clientSlug (>64 chars)', body: { clientSlug: 'a'.repeat(70), targetUrl: 'https://example.com' } },
      { name: 'Object clientSlug', body: { clientSlug: { evil: true }, targetUrl: 'https://example.com' } }
    ];

    for (const s of invalidSlugs) {
      const res = await fetch(`${baseUrl}/api/crawler/crawl`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(s.body)
      });
      const data = await res.json();
      test(res.status === 400, `${s.name} returns 400 Bad Request`);
      test(data && data.error && data.error.includes('clientSlug'), `${s.name} error specifies clientSlug issue`);
    }

    // 1.3 Invalid targetUrl variations
    const invalidUrls = [
      { name: 'Missing targetUrl', body: { clientSlug: 'valid-slug' } },
      { name: 'Empty targetUrl', body: { clientSlug: 'valid-slug', targetUrl: '' } },
      { name: 'Whitespace targetUrl', body: { clientSlug: 'valid-slug', targetUrl: '   ' } },
      { name: 'Non-HTTP protocol (ftp://)', body: { clientSlug: 'valid-slug', targetUrl: 'ftp://ftp.example.com' } },
      { name: 'Javascript scheme', body: { clientSlug: 'valid-slug', targetUrl: 'javascript:alert(1)' } },
      { name: 'File scheme', body: { clientSlug: 'valid-slug', targetUrl: 'file:///C:/Windows/win.ini' } },
      { name: 'Relative URL', body: { clientSlug: 'valid-slug', targetUrl: '/just/a/path' } },
      { name: 'Plain string without domain', body: { clientSlug: 'valid-slug', targetUrl: 'not_a_valid_url' } },
      { name: 'Object targetUrl', body: { clientSlug: 'valid-slug', targetUrl: { evil: 'url' } } }
    ];

    for (const u of invalidUrls) {
      const res = await fetch(`${baseUrl}/api/crawler/crawl`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(u.body)
      });
      const data = await res.json();
      test(res.status === 400, `${u.name} returns 400 Bad Request`);
      test(data && data.error && data.error.includes('targetUrl'), `${u.name} error specifies targetUrl issue`);
    }

    // 1.4 Invalid crawlMode
    const resBadMode = await fetch(`${baseUrl}/api/crawler/crawl`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ clientSlug: 'valid-slug', targetUrl: 'https://example.com', crawlMode: 'invalid_mode' })
    });
    test(resBadMode.status === 400, 'Invalid crawlMode returns 400 Bad Request');

    // 1.5 Adversarial options validation
    const badOptions = [
      { name: 'maxCrawlDepth = 0', opt: { maxCrawlDepth: 0 } },
      { name: 'maxCrawlDepth = -5', opt: { maxCrawlDepth: -5 } },
      { name: 'maxCrawlDepth = 101', opt: { maxCrawlDepth: 101 } },
      { name: 'maxCrawlDepth = "string"', opt: { maxCrawlDepth: 'deep' } },
      { name: 'limitUrls = 0', opt: { limitUrls: 0 } },
      { name: 'limitUrls = -10', opt: { limitUrls: -10 } },
      { name: 'limitUrls = 2,000,000', opt: { limitUrls: 2000000 } },
      { name: 'limitUrls = "huge"', opt: { limitUrls: 'huge' } },
      { name: 'exportFormat = "pdf"', opt: { exportFormat: 'pdf' } },
      { name: 'exportFormat = "exe"', opt: { exportFormat: 'exe' } }
    ];

    for (const o of badOptions) {
      const res = await fetch(`${baseUrl}/api/crawler/crawl`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientSlug: 'valid-slug',
          targetUrl: 'https://example.com',
          options: o.opt
        })
      });
      test(res.status === 400, `Adversarial option (${o.name}) rejected with 400 Bad Request`);
    }

    // ========================================================================
    // 2. CONCURRENT CRAWL COLLISION (409 CONFLICT) & RACE CONDITIONS
    // ========================================================================
    console.log('\n--- Category 2: Concurrent Collision & Race Conditions ---');

    crawlerService._resetStoreForTesting();

    // 2.1 Start crawl 1 on oh-deer
    const resCrawl1 = await fetch(`${baseUrl}/api/crawler/crawl`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        clientSlug: 'oh-deer',
        targetUrl: 'https://oh-deer.com',
        options: { tickIntervalMs: 50, incrementStep: 5 } // 1 second run
      })
    });
    test(resCrawl1.status === 202, 'First crawl on "oh-deer" accepted (HTTP 202)');
    const crawl1Data = await resCrawl1.json();
    const crawl1Id = crawl1Data.crawlId;

    // 2.2 Immediate duplicate crawl on same clientSlug -> MUST 409
    const resCrawl1Dup = await fetch(`${baseUrl}/api/crawler/crawl`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        clientSlug: 'oh-deer',
        targetUrl: 'https://oh-deer.com'
      })
    });
    test(resCrawl1Dup.status === 409, 'Immediate duplicate crawl on "oh-deer" returns 409 Conflict');
    const dupData = await resCrawl1Dup.json();
    test(dupData.error && dupData.error.includes('already in progress'), '409 response specifies crawl in progress');

    // 2.3 Crawl on DIFFERENT clientSlug while oh-deer is running -> MUST SUCCEED (202)
    const resCrawl2 = await fetch(`${baseUrl}/api/crawler/crawl`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        clientSlug: 'us-lawns',
        targetUrl: 'https://uslawns.com',
        options: { tickIntervalMs: 50, incrementStep: 5 }
      })
    });
    test(resCrawl2.status === 202, 'Independent client "us-lawns" can crawl concurrently (HTTP 202)');
    const crawl2Data = await resCrawl2.json();
    const crawl2Id = crawl2Data.crawlId;

    // 2.4 High-concurrency Race Condition Test:
    // Fire 10 simultaneous requests for new client "image-studios"
    const racePromises = [];
    for (let i = 0; i < 10; i++) {
      racePromises.push(
        fetch(`${baseUrl}/api/crawler/crawl`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            clientSlug: 'image-studios',
            targetUrl: 'https://imagestudios360.com',
            options: { tickIntervalMs: 80, incrementStep: 5 }
          })
        }).then(async r => ({ status: r.status, data: await r.json() }))
      );
    }
    const raceResults = await Promise.all(racePromises);
    const acceptedCount = raceResults.filter(r => r.status === 202).length;
    const conflictCount = raceResults.filter(r => r.status === 409).length;

    test(acceptedCount === 1, `Race condition: Exactly 1 request accepted with 202 (got: ${acceptedCount})`);
    test(conflictCount === 9, `Race condition: Exactly 9 requests rejected with 409 Conflict (got: ${conflictCount})`);

    // ========================================================================
    // 3. LIFECYCLE STATE MACHINE & TRANSITION STRESS TESTING
    // ========================================================================
    console.log('\n--- Category 3: Lifecycle State Machine Stress Testing ---');

    // 3.1 Nonexistent Crawl ID on control endpoints
    const nonExistentId = 'crawl_ghost_99999999999999';
    const resPauseGhost = await fetch(`${baseUrl}/api/crawler/crawls/${nonExistentId}/pause`, { method: 'POST' });
    test(resPauseGhost.status === 404, 'Pause nonexistent crawl returns 404');
    const resResumeGhost = await fetch(`${baseUrl}/api/crawler/crawls/${nonExistentId}/resume`, { method: 'POST' });
    test(resResumeGhost.status === 404, 'Resume nonexistent crawl returns 404');
    const resCancelGhost = await fetch(`${baseUrl}/api/crawler/crawls/${nonExistentId}/cancel`, { method: 'POST' });
    test(resCancelGhost.status === 404, 'Cancel nonexistent crawl returns 404');
    const resStatusGhost = await fetch(`${baseUrl}/api/crawler/crawls/${nonExistentId}/status`);
    test(resStatusGhost.status === 404, 'Status on nonexistent crawl returns 404');

    // 3.2 State transition rules on a fresh active crawl
    // Start designated crawl for state machine tests with long tick interval (takes 20s)
    const resStateCrawl = await fetch(`${baseUrl}/api/crawler/crawl`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        clientSlug: 'state-machine-client',
        targetUrl: 'https://state-test.example.com',
        options: { tickIntervalMs: 200, incrementStep: 1 }
      })
    });
    test(resStateCrawl.status === 202, 'State machine test crawl accepted (HTTP 202)');
    const stateCrawlData = await resStateCrawl.json();
    const stateCrawlId = stateCrawlData.crawlId;

    // A. Cannot resume a running crawl
    const resResumeRunning = await fetch(`${baseUrl}/api/crawler/crawls/${stateCrawlId}/resume`, { method: 'POST' });
    test(resResumeRunning.status === 400, 'Resume on already running crawl returns 400 Bad Request');
    const resumeRunningData = await resResumeRunning.json();
    test(resumeRunningData.error.includes('not paused'), 'Error specifies crawl is not paused');

    // B. Pause running crawl
    const resPause1 = await fetch(`${baseUrl}/api/crawler/crawls/${stateCrawlId}/pause`, { method: 'POST' });
    test(resPause1.status === 200, 'Pause on running crawl returns 200 OK');
    const pause1Data = await resPause1.json();
    test(pause1Data.currentStatus === 'paused', 'Status transitioned to "paused"');

    // C. Resume paused crawl
    const resResume1 = await fetch(`${baseUrl}/api/crawler/crawls/${stateCrawlId}/resume`, { method: 'POST' });
    test(resResume1.status === 200, 'Resume on paused crawl returns 200 OK');
    const resume1Data = await resResume1.json();
    test(resume1Data.currentStatus === 'running', 'Status transitioned back to "running"');

    // D. Cancel crawl
    const resCancel1 = await fetch(`${baseUrl}/api/crawler/crawls/${stateCrawlId}/cancel`, { method: 'POST' });
    test(resCancel1.status === 200, 'Cancel returns 200 OK');
    const cancel1Data = await resCancel1.json();
    test(cancel1Data.currentStatus === 'cancelled', 'Status transitioned to "cancelled"');

    // E. Illegal transitions on cancelled crawl
    const resPauseCancelled = await fetch(`${baseUrl}/api/crawler/crawls/${stateCrawlId}/pause`, { method: 'POST' });
    test(resPauseCancelled.status === 400, 'Pause on cancelled crawl returns 400 Bad Request');
    const resResumeCancelled = await fetch(`${baseUrl}/api/crawler/crawls/${stateCrawlId}/resume`, { method: 'POST' });
    test(resResumeCancelled.status === 400, 'Resume on cancelled crawl returns 400 Bad Request');

    // 3.3 Completion state transitions
    // Wait for crawl2 (us-lawns) to reach completion
    console.log('  ⏳ Waiting for crawl2 (us-lawns) to complete...');
    let isCompleted = false;
    for (let attempt = 0; attempt < 30; attempt++) {
      await new Promise(r => setTimeout(r, 100));
      const st = await fetch(`${baseUrl}/api/crawler/crawls/${crawl2Id}/status`);
      const stData = await st.json();
      if (stData.status === 'completed') {
        isCompleted = true;
        break;
      }
    }
    test(isCompleted, 'Crawl2 reached "completed" status in mock daemon');

    // Illegal transitions on completed crawl
    const resPauseCompleted = await fetch(`${baseUrl}/api/crawler/crawls/${crawl2Id}/pause`, { method: 'POST' });
    test(resPauseCompleted.status === 400, 'Pause on completed crawl returns 400 Bad Request');
    const resResumeCompleted = await fetch(`${baseUrl}/api/crawler/crawls/${crawl2Id}/resume`, { method: 'POST' });
    test(resResumeCompleted.status === 400, 'Resume on completed crawl returns 400 Bad Request');

    // ========================================================================
    // 4. QUERY BOUNDARY CONDITIONS ON /issues AND /inlinks
    // ========================================================================
    console.log('\n--- Category 4: Query Parameter Boundary Testing ---');

    // 4.1 /issues query validation boundaries
    const issuesBadQueries = [
      { name: 'Invalid type "critical"', query: 'type=critical', expectedStatus: 400 },
      { name: 'Invalid type "injection"', query: 'type=%27%20OR%201=1', expectedStatus: 400 },
      { name: 'Negative minUrls (-1)', query: 'minUrls=-1', expectedStatus: 400 },
      { name: 'Negative minUrls (-99999)', query: 'minUrls=-99999', expectedStatus: 400 },
      { name: 'Non-numeric minUrls ("abc")', query: 'minUrls=abc', expectedStatus: 400 }
    ];

    for (const q of issuesBadQueries) {
      const res = await fetch(`${baseUrl}/api/crawler/crawls/${crawl2Id}/issues?${q.query}`);
      test(res.status === q.expectedStatus, `/issues with ${q.name} returns HTTP ${q.expectedStatus}`);
    }

    // Valid boundary values for /issues
    const issuesValidQueries = [
      { name: 'minUrls=0 (lower bound)', query: 'minUrls=0' },
      { name: 'minUrls=999999 (large bound)', query: 'minUrls=999999' },
      { name: 'type=issue', query: 'type=issue' },
      { name: 'type=warning', query: 'type=warning' },
      { name: 'type=opportunity', query: 'type=opportunity' },
      { name: 'type=all', query: 'type=all' }
    ];

    for (const q of issuesValidQueries) {
      const res = await fetch(`${baseUrl}/api/crawler/crawls/${crawl2Id}/issues?${q.query}`);
      test(res.status === 200, `/issues with ${q.name} returns HTTP 200 OK`);
    }

    // 4.2 /inlinks query validation boundaries
    const inlinksBadQueries = [
      { name: 'targetStatusCode below 100 (99)', query: 'targetStatusCode=99', expectedStatus: 400 },
      { name: 'targetStatusCode above 599 (600)', query: 'targetStatusCode=600', expectedStatus: 400 },
      { name: 'targetStatusCode 0', query: 'targetStatusCode=0', expectedStatus: 400 },
      { name: 'targetStatusCode negative (-200)', query: 'targetStatusCode=-200', expectedStatus: 400 },
      { name: 'targetStatusCode non-numeric ("xyz")', query: 'targetStatusCode=xyz', expectedStatus: 400 },
      { name: 'limit below 1 (0)', query: 'limit=0', expectedStatus: 400 },
      { name: 'limit negative (-10)', query: 'limit=-10', expectedStatus: 400 },
      { name: 'limit above 1000 (1001)', query: 'limit=1001', expectedStatus: 400 },
      { name: 'limit float (50.5)', query: 'limit=50.5', expectedStatus: 400 },
      { name: 'Invalid groupBy "root"', query: 'groupBy=root', expectedStatus: 400 },
      { name: 'Invalid groupBy "sql_inject"', query: 'groupBy=SELECT%20*', expectedStatus: 400 }
    ];

    for (const q of inlinksBadQueries) {
      const res = await fetch(`${baseUrl}/api/crawler/crawls/${crawl2Id}/inlinks?${q.query}`);
      test(res.status === q.expectedStatus, `/inlinks with ${q.name} returns HTTP ${q.expectedStatus}`);
    }

    // Valid boundary values for /inlinks
    const inlinksValidQueries = [
      { name: 'targetStatusCode=100 (lower bound)', query: 'targetStatusCode=100' },
      { name: 'targetStatusCode=599 (upper bound)', query: 'targetStatusCode=599' },
      { name: 'targetStatusCode=301 standard', query: 'targetStatusCode=301' },
      { name: 'limit=1 (lower bound)', query: 'limit=1' },
      { name: 'limit=1000 (upper bound)', query: 'limit=1000' },
      { name: 'groupBy=template', query: 'groupBy=template' },
      { name: 'groupBy=source', query: 'groupBy=source' },
      { name: 'groupBy=target', query: 'groupBy=target' }
    ];

    for (const q of inlinksValidQueries) {
      const res = await fetch(`${baseUrl}/api/crawler/crawls/${crawl2Id}/inlinks?${q.query}`);
      test(res.status === 200, `/inlinks with ${q.name} returns HTTP 200 OK`);
    }

    // ========================================================================
    // 5. CORS PREFLIGHT & TRANSPORT SECURITY
    // ========================================================================
    console.log('\n--- Category 5: CORS & Transport Security ---');

    // 5.1 Custom Origin Preflight
    const testOrigins = [
      'https://bright-audits.replit.app',
      'https://preview-bpa-audit-hub.vercel.app',
      'http://localhost:8080'
    ];

    for (const orig of testOrigins) {
      const preflight = await fetch(`${baseUrl}/api/crawler/crawl`, {
        method: 'OPTIONS',
        headers: {
          'Origin': orig,
          'Access-Control-Request-Method': 'POST',
          'Access-Control-Request-Headers': 'Content-Type, x-bpa-auth'
        }
      });
      test(preflight.status === 204, `Preflight from ${orig} returns 204 No Content`);
      test(preflight.headers.get('access-control-allow-origin') === orig, `CORS reflects origin ${orig}`);
      test(preflight.headers.get('access-control-allow-credentials') === 'true', 'CORS allows credentials');
      test(preflight.headers.get('access-control-allow-methods').includes('POST'), 'CORS allows POST');
      test(preflight.headers.get('access-control-allow-headers').includes('x-bpa-auth'), 'CORS allows x-bpa-auth');
    }

    // 5.2 Request without Origin header
    const noOriginRes = await fetch(`${baseUrl}/api/health`);
    test(noOriginRes.headers.get('access-control-allow-origin') === '*', 'No Origin header defaults to *');

    // ========================================================================
    // 6. PROCESS RESILIENCE & ERROR HANDLING INTEGRITY
    // ========================================================================
    console.log('\n--- Category 6: Process Resilience & Crash Resistance ---');

    // 6.1 Path traversal in URL params
    const resTraversal = await fetch(`${baseUrl}/api/crawler/crawls/..%2F..%2Fetc%2Fpasswd/status`);
    test(resTraversal.status === 404, 'Path traversal in crawlId returns 404 cleanly');
    const traversalData = await resTraversal.json();
    test(traversalData && traversalData.error, 'Path traversal returns structured JSON error');

    // 6.2 Arbitrary unmatched /api routes
    const unknownApiRes = await fetch(`${baseUrl}/api/v99/nonexistent/sub/path`);
    test(unknownApiRes.status === 404, 'Arbitrary /api route returns 404');
    const unknownData = await unknownApiRes.json();
    test(unknownData.status === 404 && unknownData.error.includes('API route not found'), 'Structured 404 JSON fallback preserved');

    // 6.3 Verify server process is still alive and responsive
    const finalHealth = await fetch(`${baseUrl}/api/health`);
    const finalData = await finalHealth.json();
    test(finalHealth.status === 200, 'Server process remained healthy across all attacks');
    test(finalData.status === 'healthy', 'Server health reports "healthy"');

    // ========================================================================
    // 7. RFC-4180 CSV PARSER STRESS TEST (Zero-Dependency Engine)
    // ========================================================================
    console.log('\n--- Category 7: Zero-Dependency CSV Engine Stress Testing ---');

    const parseCsv = crawlerService.parseCsv;

    // 7.1 Empty and single-row inputs
    test(Array.isArray(parseCsv('')) && parseCsv('').length === 0, 'parseCsv handles empty string');
    test(Array.isArray(parseCsv('Header1,Header2\n')) && parseCsv('Header1,Header2\n').length === 0, 'parseCsv handles headers-only CSV');

    // 7.2 UTF-8 BOM stripping
    const bomCsv = '\uFEFFAddress,Status Code,Status\n"https://example.com",200,"OK"';
    const bomParsed = parseCsv(bomCsv);
    test(bomParsed.length === 1, 'parseCsv parses BOM CSV');
    test(bomParsed[0]['Address'] === 'https://example.com', 'BOM stripped from first header cleanly');

    // 7.3 Commas and line breaks inside quotes
    const complexCsv = [
      'Address,Issue,Description',
      '"https://example.com/1","Redirection, 3xx","Redirected via 301, permanently moved"',
      '"https://example.com/2","Multiline Issue","Line 1 of issue description\nLine 2 of issue description\nLine 3 with ""escaped quotes"""'
    ].join('\n');
    const complexParsed = parseCsv(complexCsv);
    test(complexParsed.length === 2, 'parseCsv parses 2 complex rows with commas & newlines');
    test(complexParsed[0].Issue === 'Redirection, 3xx', 'Commas inside quotes parsed without splitting field');
    test(complexParsed[1].Description.includes('Line 2 of issue description'), 'Multi-line cell content preserved');
    test(complexParsed[1].Description.includes('"escaped quotes"'), 'Escaped quotes unescaped cleanly');

    // 7.4 CRLF vs LF line endings
    const crlfCsv = 'ColA,ColB\r\nValA,ValB\r\n';
    const crlfParsed = parseCsv(crlfCsv);
    test(crlfParsed.length === 1 && crlfParsed[0].ColA === 'ValA', 'CRLF line endings parsed identically to LF');

  } finally {
    // Teardown server cleanly
    await new Promise((resolve) => server.close(resolve));
    console.log('\n🛑 Ephemeral test server closed.');
  }

  console.log('\n================================================================');
  console.log(`📊 ADVERSARIAL TEST SUMMARY: ${passedTests} / ${totalTests} Passed (${((passedTests / totalTests) * 100).toFixed(1)}%)`);
  console.log('================================================================');

  if (failures.length > 0) {
    console.error('❌ Failures encountered:');
    failures.forEach(f => console.error(`   - ${f}`));
    process.exit(1);
  } else {
    console.log('🎉 ALL ADVERSARIAL STRESS TESTS PASSED WITH ZERO CRASHES!');
    process.exit(0);
  }
}

runAdversarialHarness().catch((err) => {
  console.error('FATAL UNCAUGHT ERROR IN HARNESS:', err);
  process.exit(1);
});
