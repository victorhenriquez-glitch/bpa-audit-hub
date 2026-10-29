/**
 * Integration Test Suite for Milestone 1: Screaming Frog API Server & Routes
 * 
 * Tests the live Express server (`server/index.js`), crawler service (`server/services/screaming-frog.js`),
 * and crawler routes (`server/routes/crawler.js`) over real HTTP using Node's native fetch.
 */

'use strict';

const assert = require('assert');
const path = require('path');
const fs = require('fs');

// Ensure test mode
process.env.NODE_ENV = 'test';
process.env.SCREAMING_FROG_MODE = 'mock';

const app = require('./server/index');
const crawlerService = require('./server/services/screaming-frog');

async function runM1IntegrationTests() {
  console.log('====================================================');
  console.log('🧪 RUNNING BPA AUDIT HUB M1 CRAWLER INTEGRATION TESTS');
  console.log('====================================================');

  // Start server on an ephemeral port
  const server = await new Promise((resolve) => {
    const s = app.listen(0, '127.0.0.1', () => resolve(s));
  });
  const port = server.address().port;
  const baseUrl = `http://127.0.0.1:${port}`;
  console.log(`📡 Test server listening on ${baseUrl}`);

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

  try {
    // 1. Health check
    const healthRes = await fetch(`${baseUrl}/api/health`);
    const healthData = await healthRes.json();
    testAssert(healthRes.status === 200, 'GET /api/health returns 200 OK');
    testAssert(healthData.status === 'healthy', 'GET /api/health reports status healthy');
    testAssert(healthData.version === '2.2.0', 'GET /api/health reports version 2.2.0');

    // 2. CORS Preflight OPTIONS
    const corsRes = await fetch(`${baseUrl}/api/crawler/crawl`, {
      method: 'OPTIONS',
      headers: {
        'Origin': 'https://bright-audits.replit.app',
        'Access-Control-Request-Method': 'POST',
        'Access-Control-Request-Headers': 'Content-Type, x-bpa-auth'
      }
    });
    testAssert(corsRes.status === 204, 'OPTIONS /api/crawler/crawl returns 204 No Content');
    testAssert(corsRes.headers.get('access-control-allow-origin') === 'https://bright-audits.replit.app', 'CORS origin reflected');
    testAssert(corsRes.headers.get('access-control-allow-methods').includes('POST'), 'CORS methods include POST');
    testAssert(corsRes.headers.get('access-control-allow-headers').includes('x-bpa-auth'), 'CORS headers include x-bpa-auth');

    // 3. Validation: POST /api/crawler/crawl empty payload
    const emptyCrawlRes = await fetch(`${baseUrl}/api/crawler/crawl`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({})
    });
    const emptyCrawlData = await emptyCrawlRes.json();
    testAssert(emptyCrawlRes.status === 400, 'POST /api/crawler/crawl empty body returns 400 Bad Request');
    testAssert(emptyCrawlData.error.includes('clientSlug'), 'Error specifies clientSlug requirement');

    // 4. Validation: POST /api/crawler/crawl invalid targetUrl
    const invalidUrlRes = await fetch(`${baseUrl}/api/crawler/crawl`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ clientSlug: 'oh-deer', targetUrl: 'invalid-url-string' })
    });
    const invalidUrlData = await invalidUrlRes.json();
    testAssert(invalidUrlRes.status === 400, 'POST /api/crawler/crawl invalid targetUrl returns 400');
    testAssert(invalidUrlData.error.includes('targetUrl'), 'Error specifies targetUrl requirement');

    // 5. Validation: POST /api/crawler/crawl invalid options
    const invalidOptionsRes = await fetch(`${baseUrl}/api/crawler/crawl`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        clientSlug: 'oh-deer',
        targetUrl: 'https://oh-deer.com',
        options: { maxCrawlDepth: 500 }
      })
    });
    const invalidOptionsData = await invalidOptionsRes.json();
    testAssert(invalidOptionsRes.status === 400, 'POST /api/crawler/crawl invalid maxCrawlDepth returns 400');
    testAssert(invalidOptionsData.error.includes('maxCrawlDepth'), 'Error specifies maxCrawlDepth constraint');

    // 6. Successful Crawl Initiation: POST /api/crawler/crawl
    crawlerService._resetStoreForTesting();
    const startRes = await fetch(`${baseUrl}/api/crawler/crawl`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        clientSlug: 'oh-deer',
        targetUrl: 'https://oh-deer.com',
        crawlMode: 'spider',
        options: { forceMock: true, tickIntervalMs: 20, incrementStep: 25 }
      })
    });
    const startData = await startRes.json();
    testAssert(startRes.status === 202, 'POST /api/crawler/crawl returns 202 Accepted');
    testAssert(startData.success === true, 'Response contains success: true');
    testAssert(startData.crawlId && startData.crawlId.startsWith('crawl_oh-deer_'), 'Crawl ID follows canonical naming convention');
    testAssert(startData.statusUrl === `/api/crawler/crawls/${startData.crawlId}/status`, 'statusUrl matches API contract');
    const crawlId = startData.crawlId;

    // 7. Duplicate Crawl Conflict: 409 Conflict
    const dupRes = await fetch(`${baseUrl}/api/crawler/crawl`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        clientSlug: 'oh-deer',
        targetUrl: 'https://oh-deer.com'
      })
    });
    const dupData = await dupRes.json();
    testAssert(dupRes.status === 409, 'Concurrent crawl on same clientSlug returns 409 Conflict');
    testAssert(dupData.error.includes('already in progress'), 'Error message specifies crawl in progress');

    // 8. Progress Monitoring: GET /api/crawler/crawls/:id/status
    const statusRes = await fetch(`${baseUrl}/api/crawler/crawls/${crawlId}/status`);
    const statusData = await statusRes.json();
    testAssert(statusRes.status === 200, 'GET /api/crawler/crawls/:id/status returns 200 OK');
    testAssert(statusData.crawlId === crawlId, 'status payload contains correct crawlId');
    testAssert(['queued', 'running', 'completed'].includes(statusData.status), 'status is valid lifecycle state');

    // 9. Pause Crawl: POST /api/crawler/crawls/:id/pause
    const pauseRes = await fetch(`${baseUrl}/api/crawler/crawls/${crawlId}/pause`, { method: 'POST' });
    const pauseData = await pauseRes.json();
    testAssert(pauseRes.status === 200, 'POST /api/crawler/crawls/:id/pause returns 200 OK');
    testAssert(pauseData.action === 'pause' && pauseData.currentStatus === 'paused', 'action=pause and currentStatus=paused');

    // 10. Resume Crawl: POST /api/crawler/crawls/:id/resume
    const resumeRes = await fetch(`${baseUrl}/api/crawler/crawls/${crawlId}/resume`, { method: 'POST' });
    const resumeData = await resumeRes.json();
    testAssert(resumeRes.status === 200, 'POST /api/crawler/crawls/:id/resume returns 200 OK');
    testAssert(resumeData.action === 'resume' && resumeData.currentStatus === 'running', 'action=resume and currentStatus=running');

    // 11. Wait for completion and verify completed status
    await new Promise(resolve => setTimeout(resolve, 350));
    const completedStatusRes = await fetch(`${baseUrl}/api/crawler/crawls/${crawlId}/status`);
    const completedStatusData = await completedStatusRes.json();
    testAssert(completedStatusRes.status === 200, 'GET completed status returns 200 OK');
    testAssert(completedStatusData.status === 'completed', 'Crawl status transitioned to completed');
    testAssert(completedStatusData.progressPercentage === 100, 'Progress percentage is 100%');
    testAssert(completedStatusData.totalCrawled > 0, 'totalCrawled is populated');
    testAssert(Array.isArray(completedStatusData.availableExports), 'availableExports is array');
    testAssert(completedStatusData.availableExports.includes('crawl_overview.csv'), 'Export includes crawl_overview.csv');
    testAssert(completedStatusData.availableExports.includes('issues_overview.csv'), 'Export includes issues_overview.csv');

    // 12. Issues Extraction: GET /api/crawler/crawls/:id/issues
    const issuesRes = await fetch(`${baseUrl}/api/crawler/crawls/${crawlId}/issues`);
    const issuesData = await issuesRes.json();
    testAssert(issuesRes.status === 200, 'GET /api/crawler/crawls/:id/issues returns 200 OK');
    testAssert(issuesData.totalIssuesCount > 0, 'Issues returned count > 0');
    testAssert(Array.isArray(issuesData.issues), 'issues property is an array');
    const redirectIssue = issuesData.issues.find(iss => iss.id === 'RESPONSE_CODES_3XX');
    testAssert(Boolean(redirectIssue), 'RESPONSE_CODES_3XX issue extracted');
    testAssert(redirectIssue.urlsAffected === 245, 'URLs affected matches ohDEER audit (245)');

    // 13. Issues Filtering: GET /api/crawler/crawls/:id/issues?type=warning&minUrls=100
    const filteredIssuesRes = await fetch(`${baseUrl}/api/crawler/crawls/${crawlId}/issues?type=warning&minUrls=100`);
    const filteredIssuesData = await filteredIssuesRes.json();
    testAssert(filteredIssuesRes.status === 200, 'GET /api/crawler/crawls/:id/issues with query params returns 200 OK');
    testAssert(filteredIssuesData.issues.every(i => i.issueType.toLowerCase() === 'warning' && i.urlsAffected >= 100), 'Issues filtered correctly by type and minUrls');

    // 14. Inlinks Extraction & Graph: GET /api/crawler/crawls/:id/inlinks?targetStatusCode=301
    const inlinksRes = await fetch(`${baseUrl}/api/crawler/crawls/${crawlId}/inlinks?targetStatusCode=301`);
    const inlinksData = await inlinksRes.json();
    testAssert(inlinksRes.status === 200, 'GET /api/crawler/crawls/:id/inlinks returns 200 OK');
    testAssert(inlinksData.totalInlinks > 0, 'totalInlinks > 0');
    testAssert(Array.isArray(inlinksData.topRootCauses) && inlinksData.topRootCauses.length > 0, 'topRootCauses grouped by DOM/template pattern');
    const footerCause = inlinksData.topRootCauses.find(c => c.originType.includes('Footer'));
    testAssert(Boolean(footerCause), 'Footer Navigation root cause detected');
    testAssert(footerCause.samplePairs.length > 0, 'Root cause contains sample inlink pairs');

    // 15. Inlinks Query Validation: invalid targetStatusCode
    const invalidInlinksRes = await fetch(`${baseUrl}/api/crawler/crawls/${crawlId}/inlinks?targetStatusCode=999`);
    testAssert(invalidInlinksRes.status === 400, 'GET /api/crawler/crawls/:id/inlinks invalid targetStatusCode returns 400');

    // 16. List Crawls: GET /api/crawler/crawls
    const listRes = await fetch(`${baseUrl}/api/crawler/crawls`);
    const listData = await listRes.json();
    testAssert(listRes.status === 200, 'GET /api/crawler/crawls returns 200 OK');
    testAssert(listData.total >= 1, 'Total crawls in memory >= 1');
    testAssert(listData.crawls.some(c => c.crawlId === crawlId), 'Managed crawl listed in results');

    // 17. Cancel Crawl: POST /api/crawler/crawls/:id/cancel
    const cancelRes = await fetch(`${baseUrl}/api/crawler/crawls/${crawlId}/cancel`, { method: 'POST' });
    const cancelData = await cancelRes.json();
    testAssert(cancelRes.status === 200, 'POST /api/crawler/crawls/:id/cancel returns 200 OK');
    testAssert(cancelData.currentStatus === 'cancelled', 'currentStatus=cancelled');

    // 18. Unknown Crawl 404
    const notFoundCrawlRes = await fetch(`${baseUrl}/api/crawler/crawls/nonexistent_id/status`);
    testAssert(notFoundCrawlRes.status === 404, 'GET status on nonexistent crawl returns 404 Not Found');

    // 19. Unmatched /api/* 404 JSON Fallback
    const api404Res = await fetch(`${baseUrl}/api/unknown/endpoint`);
    const api404Data = await api404Res.json();
    testAssert(api404Res.status === 404, 'GET /api/unknown/endpoint returns 404 Not Found');
    testAssert(api404Data.error && api404Data.status === 404, '404 returns structured JSON { error, status: 404 }');

    // 20. Existing Client Endpoints Backward Compatibility
    const clientsRes = await fetch(`${baseUrl}/api/clients`);
    const clientsData = await clientsRes.json();
    testAssert(clientsRes.status === 200, 'GET /api/clients returns 200 OK');
    testAssert(Array.isArray(clientsData) && clientsData.length >= 5, 'All 5 agency clients listed');

    const singleClientRes = await fetch(`${baseUrl}/api/clients/oh-deer`);
    const singleClientData = await singleClientRes.json();
    testAssert(singleClientRes.status === 200, 'GET /api/clients/oh-deer returns 200 OK');
    testAssert(singleClientData.clientName === 'ohDEER', 'Client data integrity preserved');

    // 21. RFC-4180 CSV Parser Edge Cases
    const multilineCsv = 'Header1,Header2\n"Line 1\nLine 2","Field with ""quotes"" and , comma"\n';
    const parsedCsv = crawlerService.parseCsv(multilineCsv);
    testAssert(parsedCsv.length === 1, 'RFC-4180 parser handles multiline cells');
    testAssert(parsedCsv[0].Header1 === 'Line 1\nLine 2', 'Multiline cell content preserved');
    testAssert(parsedCsv[0].Header2 === 'Field with "quotes" and , comma', 'Escaped quotes and commas preserved');

    console.log('====================================================');
    console.log(`📊 RESULTS: ${passed} / ${total} tests passed (100%)`);
    console.log('====================================================');
    console.log('🎉 ALL M1 CRAWLER INTEGRATION TESTS PASSED!');

  } finally {
    crawlerService._resetStoreForTesting();
    server.close();
  }
}

runM1IntegrationTests().catch(err => {
  console.error('❌ M1 Integration Tests Failed:', err);
  process.exit(1);
});
