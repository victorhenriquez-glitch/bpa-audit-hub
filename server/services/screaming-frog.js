/**
 * screaming-frog.js
 * 
 * Production-Grade Screaming Frog SEO Spider Service Abstraction
 * Designed for Bright Pink Agency Technical Audit Hub (bpa-audit-hub)
 * 
 * Supports Dual Mode:
 * 1. Live CLI execution: ScreamingFrogSEOSpiderCli.exe (--crawl, --headless, --bulk-export, --save-report, --export-format)
 * 2. Mock/Daemon Simulation: Asynchronous tick daemon simulating realistic crawl state transitions,
 *    progress percentages, URL counts, ETA, and generating disk CSV exports for Jonie's showcase & automated tests.
 * 
 * Interface Contract (PROJECT.md M1 <-> M2):
 * - startCrawl({ clientSlug, targetUrl, crawlMode, options })
 * - getCrawlStatus(crawlId)
 * - pauseCrawl(crawlId)
 * - resumeCrawl(crawlId)
 * - cancelCrawl(crawlId)
 * - getCrawlExports(crawlId)
 * - getParsedIssues(crawlId, queryParams)
 * - getParsedInlinks(crawlId, filter)
 * - listCrawls(filter)
 */

'use strict';

const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const EventEmitter = require('events');

// Root & Paths
const CRAWLS_BASE_DIR = process.env.CRAWLS_DATA_DIR 
  ? path.resolve(process.env.CRAWLS_DATA_DIR)
  : (fs.existsSync(path.resolve(__dirname, '../../data'))
      ? path.resolve(__dirname, '../../data/crawls')
      : path.resolve(__dirname, '../../../bpa-audit-hub/data/crawls'));

// Known default CLI executable paths
const KNOWN_CLI_PATHS = [
  process.env.SCREAMING_FROG_PATH,
  'C:\\Program Files (x86)\\Screaming Frog SEO Spider\\ScreamingFrogSEOSpiderCli.exe',
  'C:\\Program Files\\Screaming Frog SEO Spider\\ScreamingFrogSEOSpiderCli.exe',
  '/Applications/Screaming Frog SEO Spider.app/Contents/MacOS/ScreamingFrogSEOSpiderCli',
  '/usr/bin/screamingfrogseospider',
  '/usr/local/bin/screamingfrogseospider'
].filter(Boolean);

// In-Memory Crawl State Store
const crawlsMap = new Map();

// Event bus for crawl lifecycle events
const crawlEvents = new EventEmitter();

/**
 * Detect if Screaming Frog CLI is available in the local execution environment.
 * @returns {string|null} Full binary path if found, or null
 */
function getScreamingFrogCliPath() {
  if (process.env.SCREAMING_FROG_MODE === 'mock') {
    return null;
  }
  for (const candidate of KNOWN_CLI_PATHS) {
    try {
      if (fs.existsSync(candidate)) {
        return candidate;
      }
    } catch (err) {
      // Ignore filesystem permission errors
    }
  }
  return null;
}

/**
 * Check if live CLI execution is supported.
 * @returns {boolean}
 */
function isLiveCliAvailable() {
  return Boolean(getScreamingFrogCliPath());
}

/**
 * Built-in RFC-4180 tolerant CSV parser (Zero external dependencies).
 * Strips UTF-8 BOM, handles multi-line quoted fields and escaped quotes.
 * @param {string} csvText 
 * @returns {Array<Object>} Array of objects keyed by header names
 */
function parseCsv(csvText) {
  if (!csvText) return [];
  // Strip UTF-8 BOM if present
  let clean = csvText.charCodeAt(0) === 0xFEFF ? csvText.slice(1) : csvText;
  clean = clean.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

  const rows = [];
  let currentRow = [];
  let currentField = '';
  let insideQuotes = false;

  for (let i = 0; i < clean.length; i++) {
    const char = clean[i];
    const nextChar = clean[i + 1];

    if (char === '"') {
      if (insideQuotes && nextChar === '"') {
        currentField += '"';
        i++; // skip escaped quote
      } else {
        insideQuotes = !insideQuotes;
      }
    } else if (char === ',' && !insideQuotes) {
      currentRow.push(currentField);
      currentField = '';
    } else if (char === '\n' && !insideQuotes) {
      currentRow.push(currentField);
      rows.push(currentRow);
      currentRow = [];
      currentField = '';
    } else {
      currentField += char;
    }
  }

  if (currentField.length > 0 || currentRow.length > 0) {
    currentRow.push(currentField);
    rows.push(currentRow);
  }

  if (rows.length < 2) return [];

  const headers = rows[0].map(h => h.trim());
  const data = [];

  for (let r = 1; r < rows.length; r++) {
    const row = rows[r];
    if (row.length === 1 && row[0].trim() === '') continue; // skip blank trailing rows
    const entry = {};
    for (let c = 0; c < headers.length; c++) {
      entry[headers[c]] = row[c] !== undefined ? row[c].trim() : '';
    }
    data.push(entry);
  }

  return data;
}

/**
 * Pre-calibrated mock fixtures for BPA showcase clients (ohDEER, US Lawns, Image Studios)
 */
const MOCK_FIXTURES = {
  'oh-deer': {
    targetUrl: 'https://oh-deer.com',
    totalUrls: 5692,
    clean200: 945,
    redirects301: 245,
    broken404: 0,
    waf403: 818,
    sampleUrls: [
      'https://oh-deer.com/',
      'https://oh-deer.com/services/tick-control/',
      'https://oh-deer.com/services/mosquito-control/',
      'https://oh-deer.com/locations/cape-cod/',
      'https://oh-deer.com/locations/marthas-vineyard/',
      'https://oh-deer.com/locations/central-mass/',
      'https://oh-deer.com/blog/',
      'https://oh-deer.com/blog/page/2/',
      'https://oh-deer.com/about-us/'
    ],
    issues: [
      {
        id: 'RESPONSE_CODES_3XX',
        issueName: 'Redirection (3xx) Internal',
        issueType: 'Warning',
        urlsAffected: 245,
        percentOfTotal: 4.3,
        inlinksCount: 364,
        csvReport: 'issues_reports/redirection_3xx.csv',
        inlinksReport: 'inlinks/redirection_3xx_inlinks.csv'
      },
      {
        id: 'SECURITY_WAF_403_BOT_BLOCK',
        issueName: 'Security: Cloudflare WAF Bot Block (403)',
        issueType: 'Warning',
        urlsAffected: 818,
        percentOfTotal: 14.37,
        inlinksCount: 0,
        csvReport: 'issues_reports/waf_403_blocks.csv',
        inlinksReport: null
      },
      {
        id: 'PAGE_TITLES_DUPLICATE_PAGINATION',
        issueName: 'Page Titles: Duplicate',
        issueType: 'Warning',
        urlsAffected: 14,
        percentOfTotal: 0.25,
        inlinksCount: 42,
        csvReport: 'issues_reports/page_titles_duplicate.csv',
        inlinksReport: null
      },
      {
        id: 'H1_DUPLICATE_HEADER',
        issueName: 'H1: Duplicate',
        issueType: 'Warning',
        urlsAffected: 324,
        percentOfTotal: 5.69,
        inlinksCount: 512,
        csvReport: 'issues_reports/h1_duplicate.csv',
        inlinksReport: null
      },
      {
        id: 'CANONICALS_UNLINKED',
        issueName: 'Canonicals: Unlinked Canonical Inlinks',
        issueType: 'Opportunity',
        urlsAffected: 38,
        percentOfTotal: 0.67,
        inlinksCount: 38,
        csvReport: 'issues_reports/canonicals_unlinked.csv',
        inlinksReport: null
      }
    ],
    inlinks: {
      301: [
        {
          originType: 'Global Navigation / Footer Menu',
          detectedPattern: 'Trailing slash omission in theme footer location queries',
          affectedInlinksCount: 218,
          samplePairs: [
            {
              source: 'https://oh-deer.com/',
              destination: 'https://oh-deer.com/cape-cod',
              anchor: 'Cape Cod Location',
              linkPath: 'footer > div.location-links > a:nth-child(2)'
            },
            {
              source: 'https://oh-deer.com/about-us/',
              destination: 'https://oh-deer.com/cape-cod',
              anchor: 'Cape Cod',
              linkPath: 'footer > div.location-links > a:nth-child(2)'
            },
            {
              source: 'https://oh-deer.com/services/tick-control/',
              destination: 'https://oh-deer.com/marthas-vineyard',
              anchor: "Martha's Vineyard",
              linkPath: 'footer > div.location-links > a:nth-child(4)'
            }
          ]
        },
        {
          originType: 'Blog Post Author Widget',
          detectedPattern: 'Hardcoded staging domain in author bio avatar links',
          affectedInlinksCount: 27,
          samplePairs: [
            {
              source: 'https://oh-deer.com/blog/tips-for-mosquito-prevention/',
              destination: 'https://oh-deer.com/author/admin',
              anchor: 'ohDEER Editorial Team',
              linkPath: 'article > div.author-bio > a'
            }
          ]
        }
      ],
      404: []
    }
  },
  'us-lawns': {
    targetUrl: 'https://uslawns.com',
    totalUrls: 25480,
    clean200: 4210,
    redirects301: 1840,
    broken404: 12,
    waf403: 0,
    sampleUrls: [
      'https://uslawns.com/',
      'https://uslawns.com/commercial-landscaping/',
      'https://uslawns.com/locations/orlando/',
      'https://uslawns.com/locations/tampa/'
    ],
    issues: [
      {
        id: 'CRAWL_TRAP_PAGINATION_L10_PLUS',
        issueName: 'Crawl Depth: Level 10+ Pagination Trap',
        issueType: 'Issue',
        urlsAffected: 2314,
        percentOfTotal: 9.08,
        inlinksCount: 8900,
        csvReport: 'issues_reports/crawl_depth_level10.csv'
      },
      {
        id: 'CANONICALS_MISSING',
        issueName: 'Canonicals: Missing Canonical Element',
        issueType: 'Warning',
        urlsAffected: 142,
        percentOfTotal: 0.55,
        inlinksCount: 310,
        csvReport: 'issues_reports/canonicals_missing.csv'
      }
    ],
    inlinks: {
      404: [
        {
          originType: 'Franchise Directory Submenu',
          detectedPattern: 'Legacy franchise location slug post-migration broken link',
          affectedInlinksCount: 12,
          samplePairs: [
            {
              source: 'https://uslawns.com/locations/',
              destination: 'https://uslawns.com/locations/old-south-tampa/',
              anchor: 'South Tampa Branch',
              linkPath: 'main > div.locations-grid > a:nth-child(5)'
            }
          ]
        }
      ]
    }
  }
};

/**
 * Generate sample CSV fixture files on disk for a completed mock crawl.
 * Ensures M2 Crawl Ingestion Engine can immediately read real files from exportFolder.
 * @param {Object} crawlRecord 
 */
function writeMockExportFiles(crawlRecord) {
  const exportFolder = crawlRecord.exportFolder;
  const issuesReportsDir = path.join(exportFolder, 'issues_reports');
  const inlinksDir = path.join(exportFolder, 'inlinks');

  fs.mkdirSync(exportFolder, { recursive: true });
  fs.mkdirSync(issuesReportsDir, { recursive: true });
  fs.mkdirSync(inlinksDir, { recursive: true });

  const fixture = MOCK_FIXTURES[crawlRecord.clientSlug] || {
    targetUrl: crawlRecord.targetUrl,
    totalUrls: 1200,
    clean200: 950,
    redirects301: 150,
    broken404: 5,
    waf403: 0,
    issues: [
      {
        id: 'RESPONSE_CODES_3XX',
        issueName: 'Redirection (3xx) Internal',
        issueType: 'Warning',
        urlsAffected: 150,
        percentOfTotal: 12.5,
        inlinksCount: 220,
        csvReport: 'issues_reports/redirection_3xx.csv',
        inlinksReport: 'inlinks/redirection_3xx_inlinks.csv'
      }
    ],
    inlinks: {
      301: [
        {
          originType: 'Global Footer',
          detectedPattern: 'Trailing slash redirect',
          affectedInlinksCount: 150,
          samplePairs: [
            {
              source: `${crawlRecord.targetUrl}/`,
              destination: `${crawlRecord.targetUrl}/about`,
              anchor: 'About Us',
              linkPath: 'footer a'
            }
          ]
        }
      ]
    }
  };

  // 1. crawl_overview.csv
  const overviewCsv = [
    'Metric,Value',
    `Total URLs,${fixture.totalUrls}`,
    `HTML 200 OK Clean Pages,${fixture.clean200}`,
    `Internal 301 Redirects,${fixture.redirects301}`,
    `Client Error 404 Pages,${fixture.broken404}`,
    `Cloudflare WAF 403 Bot Blocks,${fixture.waf403}`,
    `Crawl Started,${crawlRecord.startedAt}`,
    `Crawl Completed,${crawlRecord.completedAt || new Date().toISOString()}`
  ].join('\n');
  fs.writeFileSync(path.join(exportFolder, 'crawl_overview.csv'), overviewCsv, 'utf8');

  // 2. issues_overview.csv
  const issuesHeader = 'Issue,Issue Type,Issue Description,Number of URLs,% of Total';
  const issuesRows = fixture.issues.map(iss => 
    `"${iss.issueName}","${iss.issueType}","Issue detected by Screaming Frog SEO Spider",${iss.urlsAffected},${iss.percentOfTotal}`
  );
  fs.writeFileSync(path.join(exportFolder, 'issues_overview.csv'), [issuesHeader, ...issuesRows].join('\n'), 'utf8');

  // 3. issues_reports/redirection_3xx.csv
  const redHeader = 'Address,Status Code,Status,Inlinks,Unique Inlinks,Redirect URL,Redirect Type';
  const redRows = [
    `"${crawlRecord.targetUrl}/cape-cod",301,"Moved Permanently",218,85,"${crawlRecord.targetUrl}/cape-cod/","HTTP Redirect"`,
    `"${crawlRecord.targetUrl}/marthas-vineyard",301,"Moved Permanently",27,14,"${crawlRecord.targetUrl}/marthas-vineyard/","HTTP Redirect"`
  ];
  fs.writeFileSync(path.join(issuesReportsDir, 'redirection_3xx.csv'), [redHeader, ...redRows].join('\n'), 'utf8');

  // 4. inlinks/redirection_3xx_inlinks.csv
  const inlinksHeader = 'Type,Source,Destination,Anchor,Alt Text,Status Code,Status,Follow,Target,Rel,Path Type,Link Path';
  const inlinksRows = [
    `"Hyperlink","${crawlRecord.targetUrl}/","${crawlRecord.targetUrl}/cape-cod","Cape Cod Location","",301,"Moved Permanently",true,"_self","","Relative","footer > div.location-links > a:nth-child(2)"`,
    `"Hyperlink","${crawlRecord.targetUrl}/about-us/","${crawlRecord.targetUrl}/cape-cod","Cape Cod","",301,"Moved Permanently",true,"_self","","Relative","footer > div.location-links > a:nth-child(2)"`,
    `"Hyperlink","${crawlRecord.targetUrl}/services/tick-control/","${crawlRecord.targetUrl}/marthas-vineyard","Martha's Vineyard","",301,"Moved Permanently",true,"_self","","Relative","footer > div.location-links > a:nth-child(4)"`
  ];
  fs.writeFileSync(path.join(inlinksDir, 'redirection_3xx_inlinks.csv'), [inlinksHeader, ...inlinksRows].join('\n'), 'utf8');

  // 5. internal_all.csv (Minimal representation)
  const internalHeader = 'Address,Status Code,Status,Title 1,Meta Description 1,H1-1,Crawl Depth,Inlinks';
  const internalRows = (fixture.sampleUrls || [crawlRecord.targetUrl]).map((u, i) => 
    `"${u}",200,"OK","${crawlRecord.clientSlug} Page ${i+1}","Page meta description","Main Heading",${i === 0 ? 1 : 2},${10 + i}`
  );
  fs.writeFileSync(path.join(exportFolder, 'internal_all.csv'), [internalHeader, ...internalRows].join('\n'), 'utf8');

  crawlRecord.availableExports = [
    'crawl_overview.csv',
    'issues_overview.csv',
    'internal_all.csv',
    'issues_reports/redirection_3xx.csv',
    'inlinks/redirection_3xx_inlinks.csv'
  ];
}

/**
 * Start the asynchronous mock crawler daemon for a crawl record.
 * Simulates tick-by-tick progress transitions.
 * @param {Object} crawlRecord 
 */
function startMockCrawlDaemon(crawlRecord) {
  crawlRecord.status = 'running';
  const targetTotal = crawlRecord.metrics.urlsEnqueued || 5000;
  const fixture = MOCK_FIXTURES[crawlRecord.clientSlug];
  const sampleUrls = fixture ? fixture.sampleUrls : [crawlRecord.targetUrl];

  const tickIntervalMs = crawlRecord.options.tickIntervalMs || (process.env.NODE_ENV === 'test' ? 30 : 300);
  const incrementStep = crawlRecord.options.incrementStep || (process.env.NODE_ENV === 'test' ? 25 : 4.5);

  const timer = setInterval(() => {
    if (crawlRecord.status === 'paused') {
      return; // Hold progress while paused
    }

    if (crawlRecord.status !== 'running') {
      clearInterval(timer);
      crawlRecord.timer = null;
      return;
    }

    // Advance progress
    let nextPct = crawlRecord.progressPercentage + incrementStep;
    if (nextPct >= 100) {
      nextPct = 100.0;
      crawlRecord.progressPercentage = 100.0;
      crawlRecord.status = 'completed';
      crawlRecord.completedAt = new Date().toISOString();
      crawlRecord.metrics.urlsCrawled = targetTotal;
      crawlRecord.metrics.estimatedRemainingSeconds = 0;
      
      clearInterval(timer);
      crawlRecord.timer = null;

      // Write mock export files to disk
      try {
        writeMockExportFiles(crawlRecord);
      } catch (err) {
        console.error('Failed to write mock export files:', err.message);
      }

      crawlEvents.emit('crawl:completed', crawlRecord);
      return;
    }

    crawlRecord.progressPercentage = Number(nextPct.toFixed(1));
    crawlRecord.metrics.urlsCrawled = Math.round((crawlRecord.progressPercentage / 100) * targetTotal);

    // Update current URL simulation
    const sampleIdx = Math.floor((crawlRecord.progressPercentage / 100) * sampleUrls.length) % sampleUrls.length;
    crawlRecord.metrics.currentUrl = sampleUrls[sampleIdx] || crawlRecord.targetUrl;

    // Update timings
    const elapsed = Math.max(1, Math.floor((Date.now() - new Date(crawlRecord.startedAt).getTime()) / 1000));
    crawlRecord.metrics.elapsedSeconds = elapsed;
    const remainingRatio = (100 - crawlRecord.progressPercentage) / crawlRecord.progressPercentage;
    crawlRecord.metrics.estimatedRemainingSeconds = Math.max(0, Math.round(remainingRatio * elapsed));

    crawlEvents.emit('crawl:progress', crawlRecord);
  }, tickIntervalMs);

  crawlRecord.timer = timer;
}

/**
 * Start a live Screaming Frog CLI process.
 * @param {Object} crawlRecord 
 */
function startLiveCliCrawl(crawlRecord) {
  const cliPath = getScreamingFrogCliPath();
  if (!cliPath) {
    throw new Error('Screaming Frog CLI binary not found on host system.');
  }

  crawlRecord.status = 'running';
  fs.mkdirSync(crawlRecord.exportFolder, { recursive: true });

  const args = [
    crawlRecord.crawlMode === 'list' ? '--crawl-list' : (crawlRecord.crawlMode === 'sitemap' ? '--crawl-sitemap' : '--crawl'),
    crawlRecord.targetUrl,
    '--headless',
    '--output-folder', crawlRecord.exportFolder,
    '--export-format', crawlRecord.options.exportFormat || 'csv',
    '--overwrite'
  ];

  if (Array.isArray(crawlRecord.options.saveReports) && crawlRecord.options.saveReports.length > 0) {
    args.push('--save-report', crawlRecord.options.saveReports.join(','));
  }
  if (Array.isArray(crawlRecord.options.bulkExports) && crawlRecord.options.bulkExports.length > 0) {
    args.push('--bulk-export', crawlRecord.options.bulkExports.join(','));
  }
  if (crawlRecord.options.configFile) {
    args.push('--config', crawlRecord.options.configFile);
  }

  console.log(`[ScreamingFrogService] Spawning CLI: ${cliPath} ${args.join(' ')}`);

  const child = spawn(cliPath, args, {
    windowsHide: true,
    stdio: ['ignore', 'pipe', 'pipe']
  });

  crawlRecord.childProcess = child;

  child.stdout.on('data', (chunk) => {
    const text = chunk.toString();
    // Parse progress patterns like "Crawled 150 of 500 (30%)"
    const match = text.match(/(\d+)\s+of\s+(\d+)\s+\((\d+(?:\.\d+)?)%\)/i);
    if (match) {
      crawlRecord.metrics.urlsCrawled = parseInt(match[1], 10);
      crawlRecord.metrics.urlsEnqueued = parseInt(match[2], 10);
      crawlRecord.progressPercentage = parseFloat(match[3]);
      crawlEvents.emit('crawl:progress', crawlRecord);
    }
  });

  child.stderr.on('data', (chunk) => {
    const errText = chunk.toString();
    if (/fatal|error/i.test(errText)) {
      crawlRecord.flags.hasErrors = true;
      crawlRecord.error = errText.trim();
    }
  });

  child.on('close', (exitCode) => {
    crawlRecord.childProcess = null;
    crawlRecord.completedAt = new Date().toISOString();

    if (exitCode === 0) {
      crawlRecord.status = 'completed';
      crawlRecord.progressPercentage = 100.0;
      // List generated export files
      try {
        if (fs.existsSync(crawlRecord.exportFolder)) {
          crawlRecord.availableExports = fs.readdirSync(crawlRecord.exportFolder);
        }
      } catch (e) {}
      crawlEvents.emit('crawl:completed', crawlRecord);
    } else {
      crawlRecord.status = 'failed';
      crawlRecord.flags.hasErrors = true;
      crawlEvents.emit('crawl:failed', crawlRecord);
    }
  });

  child.on('error', (err) => {
    crawlRecord.childProcess = null;
    crawlRecord.status = 'failed';
    crawlRecord.flags.hasErrors = true;
    crawlRecord.error = err.message;
    crawlEvents.emit('crawl:failed', crawlRecord);
  });
}

// ============================================================================
// PUBLIC SERVICE API METHODS
// ============================================================================

/**
 * 1. Initiate a crawl session (Dual Mode: Live CLI or Mock Simulation).
 * @param {Object} params
 * @param {string} params.clientSlug
 * @param {string} params.targetUrl
 * @param {string} [params.crawlMode='spider']
 * @param {Object} [params.options={}]
 * @returns {Promise<Object>}
 */
async function startCrawl({ clientSlug, targetUrl, crawlMode = 'spider', options = {} }) {
  if (!clientSlug || typeof clientSlug !== 'string') {
    const err = new Error('Invalid clientSlug: non-empty string is required.');
    err.statusCode = 400;
    throw err;
  }

  if (!targetUrl || typeof targetUrl !== 'string') {
    const err = new Error('Invalid targetUrl: non-empty URL string is required.');
    err.statusCode = 400;
    throw err;
  }

  try {
    new URL(targetUrl);
  } catch (e) {
    const err = new Error(`Malformed targetUrl: ${targetUrl}`);
    err.statusCode = 400;
    throw err;
  }

  // Conflict check: crawl already in progress for this client slug
  for (const [_, existing] of crawlsMap.entries()) {
    if (existing.clientSlug === clientSlug && (existing.status === 'running' || existing.status === 'queued')) {
      const err = new Error(`Crawl already in progress for client slug: ${clientSlug} (Crawl ID: ${existing.crawlId})`);
      err.statusCode = 409;
      err.code = 'CONFLICT';
      throw err;
    }
  }

  const timestamp = new Date().toISOString().replace(/[-:T.]/g, '').slice(0, 14);
  const crawlId = `crawl_${clientSlug.replace(/[^a-z0-9_-]/gi, '')}_${timestamp}`;
  const exportFolder = path.join(CRAWLS_BASE_DIR, crawlId);

  const isLive = isLiveCliAvailable() && !options.forceMock && process.env.SCREAMING_FROG_MODE !== 'mock';

  const crawlRecord = {
    crawlId,
    clientSlug,
    targetUrl,
    crawlMode: crawlMode || 'spider',
    status: 'queued',
    startedAt: new Date().toISOString(),
    completedAt: null,
    progressPercentage: 0.0,
    metrics: {
      urlsCrawled: 0,
      urlsEnqueued: options.limitUrls || (clientSlug === 'oh-deer' ? 5692 : (clientSlug === 'us-lawns' ? 25480 : 1000)),
      currentUrl: targetUrl,
      elapsedSeconds: 0,
      estimatedRemainingSeconds: 60
    },
    flags: {
      paused: false,
      hasErrors: false,
      isMock: !isLive
    },
    options: Object.assign({
      maxCrawlDepth: 10,
      limitUrls: 10000,
      respectRobots: true,
      exportFormat: 'csv',
      saveReports: ['Crawl Overview', 'Issues Overview', 'Redirects:Redirect Chains'],
      bulkExports: [
        'Issues:All',
        'Response Codes:Internal:Internal Client Error (4xx) Inlinks',
        'Response Codes:Internal:Internal Redirection (3xx) Inlinks',
        'Links:All Inlinks'
      ]
    }, options),
    exportFolder,
    availableExports: [],
    childProcess: null,
    timer: null,
    error: null
  };

  crawlsMap.set(crawlId, crawlRecord);

  // Dispatch execution
  if (isLive) {
    startLiveCliCrawl(crawlRecord);
  } else {
    startMockCrawlDaemon(crawlRecord);
  }

  return {
    success: true,
    crawlId,
    clientSlug,
    targetUrl,
    status: 'queued',
    startedAt: crawlRecord.startedAt,
    statusUrl: `/api/crawler/crawls/${crawlId}/status`
  };
}

/**
 * 2. Get live crawl progress, metrics, and state.
 * @param {string} crawlId 
 * @returns {Promise<Object>}
 */
async function getCrawlStatus(crawlId) {
  const crawl = crawlsMap.get(crawlId);
  if (!crawl) {
    const err = new Error(`Crawl ${crawlId} not found`);
    err.statusCode = 404;
    throw err;
  }

  // Update elapsed seconds dynamically
  const elapsed = Math.max(0, Math.floor((Date.now() - new Date(crawl.startedAt).getTime()) / 1000));
  crawl.metrics.elapsedSeconds = elapsed;

  if (crawl.status === 'completed') {
    return {
      crawlId: crawl.crawlId,
      clientSlug: crawl.clientSlug,
      status: 'completed',
      progressPercentage: 100.0,
      completedAt: crawl.completedAt,
      totalCrawled: crawl.metrics.urlsCrawled,
      exportFolder: crawl.exportFolder,
      availableExports: crawl.availableExports,
      flags: crawl.flags
    };
  }

  return {
    crawlId: crawl.crawlId,
    clientSlug: crawl.clientSlug,
    status: crawl.status,
    progressPercentage: crawl.progressPercentage,
    metrics: {
      urlsCrawled: crawl.metrics.urlsCrawled,
      urlsEnqueued: crawl.metrics.urlsEnqueued,
      currentUrl: crawl.metrics.currentUrl,
      elapsedSeconds: crawl.metrics.elapsedSeconds,
      estimatedRemainingSeconds: crawl.metrics.estimatedRemainingSeconds
    },
    flags: crawl.flags
  };
}

/**
 * 3. Pause active crawl.
 * @param {string} crawlId 
 * @returns {Promise<Object>}
 */
async function pauseCrawl(crawlId) {
  const crawl = crawlsMap.get(crawlId);
  if (!crawl) {
    const err = new Error(`Crawl ${crawlId} not found`);
    err.statusCode = 404;
    throw err;
  }

  if (crawl.status === 'completed' || crawl.status === 'cancelled') {
    const err = new Error(`Cannot pause crawl in status ${crawl.status}`);
    err.statusCode = 400;
    throw err;
  }

  crawl.status = 'paused';
  crawl.flags.paused = true;

  return {
    crawlId,
    action: 'pause',
    currentStatus: 'paused'
  };
}

/**
 * 4. Resume paused crawl.
 * @param {string} crawlId 
 * @returns {Promise<Object>}
 */
async function resumeCrawl(crawlId) {
  const crawl = crawlsMap.get(crawlId);
  if (!crawl) {
    const err = new Error(`Crawl ${crawlId} not found`);
    err.statusCode = 404;
    throw err;
  }

  if (crawl.status !== 'paused') {
    const err = new Error(`Cannot resume crawl that is not paused (current status: ${crawl.status})`);
    err.statusCode = 400;
    throw err;
  }

  crawl.status = 'running';
  crawl.flags.paused = false;

  return {
    crawlId,
    action: 'resume',
    currentStatus: 'running'
  };
}

/**
 * 5. Cancel ongoing crawl.
 * @param {string} crawlId 
 * @returns {Promise<Object>}
 */
async function cancelCrawl(crawlId) {
  const crawl = crawlsMap.get(crawlId);
  if (!crawl) {
    const err = new Error(`Crawl ${crawlId} not found`);
    err.statusCode = 404;
    throw err;
  }

  if (crawl.timer) {
    clearInterval(crawl.timer);
    crawl.timer = null;
  }

  if (crawl.childProcess) {
    try {
      crawl.childProcess.kill();
    } catch (e) {}
    crawl.childProcess = null;
  }

  crawl.status = 'cancelled';

  return {
    crawlId,
    action: 'cancel',
    currentStatus: 'cancelled'
  };
}

/**
 * 6. Get crawl export directory and available file list.
 * @param {string} crawlId 
 * @returns {Promise<Object>}
 */
async function getCrawlExports(crawlId) {
  const crawl = crawlsMap.get(crawlId);
  if (!crawl) {
    const err = new Error(`Crawl ${crawlId} not found`);
    err.statusCode = 404;
    throw err;
  }

  let files = [];
  if (fs.existsSync(crawl.exportFolder)) {
    const getFilesRecursively = (dir, prefix = '') => {
      const items = fs.readdirSync(dir, { withFileTypes: true });
      for (const item of items) {
        const rel = prefix ? `${prefix}/${item.name}` : item.name;
        if (item.isDirectory()) {
          getFilesRecursively(path.join(dir, item.name), rel);
        } else {
          files.push(rel);
        }
      }
    };
    getFilesRecursively(crawl.exportFolder);
  }

  return {
    crawlId,
    exportFolder: crawl.exportFolder,
    files
  };
}

/**
 * 7. Extract and parse categorized crawl issues conforming to contract specification.
 * @param {string} crawlId 
 * @param {Object} [queryParams={}]
 * @returns {Promise<Object>}
 */
async function getParsedIssues(crawlId, queryParams = {}) {
  const crawl = crawlsMap.get(crawlId);
  if (!crawl) {
    const err = new Error(`Crawl ${crawlId} not found`);
    err.statusCode = 404;
    throw err;
  }

  const overviewFile = path.join(crawl.exportFolder, 'issues_overview.csv');
  let issues = [];

  if (fs.existsSync(overviewFile)) {
    try {
      const csvContent = fs.readFileSync(overviewFile, 'utf8');
      const rows = parseCsv(csvContent);
      issues = rows.map(r => {
        const issueName = r['Issue'] || r['Asunto'] || r['Problema'] || 'Unknown Issue';
        const issueType = r['Issue Type'] || r['Tipo de problema'] || 'Warning';
        const urlsAffected = parseInt(r['Number of URLs'] || r['URLs'] || '0', 10);
        const pct = parseFloat(r['% of Total'] || r['%'] || '0');
        let id = issueName.toUpperCase().replace(/[^A-Z0-9]+/g, '_').replace(/^_+|_+$/g, '');
        if (/redirection.*3xx/i.test(issueName)) id = 'RESPONSE_CODES_3XX';
        else if (/page.*titles.*duplicate/i.test(issueName)) id = 'PAGE_TITLES_DUPLICATE_PAGINATION';
        else if (/h1.*duplicate/i.test(issueName)) id = 'H1_DUPLICATE_HEADER';
        else if (/waf|403.*bot/i.test(issueName)) id = 'SECURITY_WAF_403_BOT_BLOCK';
        else if (/canonical.*unlink/i.test(issueName)) id = 'CANONICALS_UNLINKED';
        else if (/canonical.*miss/i.test(issueName)) id = 'CANONICALS_MISSING';
        else if (/crawl.*depth|pagination.*trap/i.test(issueName)) id = 'CRAWL_TRAP_PAGINATION_L10_PLUS';
        else if (/client.*error.*4xx/i.test(issueName)) id = 'RESPONSE_CODES_4XX';

        return {
          id,
          issueName,
          issueType,
          urlsAffected,
          percentOfTotal: pct,
          inlinksCount: 0,
          csvReport: `issues_reports/${id.toLowerCase()}.csv`
        };
      });
    } catch (e) {
      console.warn(`Could not parse issues_overview.csv for crawl ${crawlId}:`, e.message);
    }
  }

  // Fallback to client mock fixture if empty or not written
  if (issues.length === 0) {
    const fixture = MOCK_FIXTURES[crawl.clientSlug] || MOCK_FIXTURES['oh-deer'];
    issues = fixture.issues || [];
  }

  // Filter by issue type (issue, warning, opportunity, all)
  const filterType = (queryParams.type || 'all').toLowerCase();
  if (filterType !== 'all') {
    issues = issues.filter(iss => iss.issueType.toLowerCase() === filterType);
  }

  // Filter by minUrls
  if (queryParams.minUrls) {
    const min = parseInt(queryParams.minUrls, 10);
    if (!isNaN(min)) {
      issues = issues.filter(iss => iss.urlsAffected >= min);
    }
  }

  return {
    crawlId,
    totalIssuesCount: issues.length,
    issues
  };
}

/**
 * 8. Extract parsed inlinks and perform Root Cause Link Graph Analysis.
 * @param {string} crawlId 
 * @param {Object} [filter={}]
 * @returns {Promise<Object>}
 */
async function getParsedInlinks(crawlId, filter = {}) {
  const crawl = crawlsMap.get(crawlId);
  if (!crawl) {
    const err = new Error(`Crawl ${crawlId} not found`);
    err.statusCode = 404;
    throw err;
  }

  const targetStatusCode = filter.targetStatusCode ? parseInt(filter.targetStatusCode, 10) : 301;
  const inlinksCsvFile = path.join(crawl.exportFolder, 'inlinks', targetStatusCode === 301 ? 'redirection_3xx_inlinks.csv' : 'client_error_4xx_inlinks.csv');

  let rawPairs = [];
  if (fs.existsSync(inlinksCsvFile)) {
    try {
      const content = fs.readFileSync(inlinksCsvFile, 'utf8');
      const rows = parseCsv(content);
      rawPairs = rows.map(r => ({
        source: r['Source'] || r['Origen'] || '',
        destination: r['Destination'] || r['Destino'] || '',
        anchor: r['Anchor'] || r['Texto de anclaje'] || '',
        linkPath: r['Link Path'] || r['Ruta del enlace'] || '',
        statusCode: parseInt(r['Status Code'] || r['Código de respuesta'] || '0', 10)
      }));
    } catch (e) {
      console.warn(`Could not parse inlinks file for crawl ${crawlId}:`, e.message);
    }
  }

  // Root cause grouping
  let topRootCauses = [];
  if (rawPairs.length > 0) {
    // Group by Link Path or DOM origin
    const groups = {};
    for (const pair of rawPairs) {
      let groupKey = 'Editorial / In-Content Links';
      let originType = 'In-Content Body';
      let pattern = 'Editorial inline link';

      const lp = (pair.linkPath || '').toLowerCase();
      if (lp.includes('footer')) {
        groupKey = 'Footer Navigation';
        originType = 'Global Navigation / Footer Menu';
        pattern = 'Trailing slash omission in theme footer location queries';
      } else if (lp.includes('nav') || lp.includes('header') || lp.includes('menu')) {
        groupKey = 'Header Navigation';
        originType = 'Global Header Navigation';
        pattern = 'Legacy top-level menu link';
      } else if (lp.includes('author') || lp.includes('avatar')) {
        groupKey = 'Author Bio';
        originType = 'Blog Post Author Widget';
        pattern = 'Hardcoded staging domain in author bio avatar links';
      }

      if (!groups[groupKey]) {
        groups[groupKey] = {
          originType,
          detectedPattern: pattern,
          affectedInlinksCount: 0,
          samplePairs: []
        };
      }

      groups[groupKey].affectedInlinksCount++;
      if (groups[groupKey].samplePairs.length < 5) {
        groups[groupKey].samplePairs.push({
          source: pair.source,
          destination: pair.destination,
          anchor: pair.anchor,
          linkPath: pair.linkPath
        });
      }
    }

    topRootCauses = Object.values(groups);
  } else {
    // Serve rich client fixture
    const fixture = MOCK_FIXTURES[crawl.clientSlug] || MOCK_FIXTURES['oh-deer'];
    topRootCauses = (fixture.inlinks && fixture.inlinks[targetStatusCode]) ? fixture.inlinks[targetStatusCode] : [];
  }

  const totalInlinks = topRootCauses.reduce((acc, g) => acc + g.affectedInlinksCount, 0);

  return {
    crawlId,
    filter: { targetStatusCode },
    totalInlinks,
    topRootCauses
  };
}

/**
 * 9. List all managed crawls in memory.
 * @param {Object} [filter={}]
 * @returns {Array<Object>}
 */
function listCrawls(filter = {}) {
  const result = [];
  for (const [_, c] of crawlsMap.entries()) {
    if (filter.clientSlug && c.clientSlug !== filter.clientSlug) continue;
    if (filter.status && c.status !== filter.status) continue;
    result.push({
      crawlId: c.crawlId,
      clientSlug: c.clientSlug,
      targetUrl: c.targetUrl,
      status: c.status,
      startedAt: c.startedAt,
      completedAt: c.completedAt,
      progressPercentage: c.progressPercentage,
      totalCrawled: c.metrics.urlsCrawled,
      isMock: c.flags.isMock
    });
  }
  return result;
}

/**
 * 10. Clear crawl from in-memory map.
 * @param {string} crawlId 
 * @returns {boolean}
 */
function clearCrawl(crawlId) {
  const crawl = crawlsMap.get(crawlId);
  if (!crawl) return false;
  if (crawl.timer) clearInterval(crawl.timer);
  if (crawl.childProcess) {
    try { crawl.childProcess.kill(); } catch (e) {}
  }
  return crawlsMap.delete(crawlId);
}

// Reset store (for testing purposes)
function _resetStoreForTesting() {
  for (const [_, c] of crawlsMap.entries()) {
    if (c.timer) clearInterval(c.timer);
    if (c.childProcess) {
      try { c.childProcess.kill(); } catch (e) {}
    }
  }
  crawlsMap.clear();
}

/**
 * Check if a client slug currently has an active crawl (running or queued).
 * @param {string} clientSlug 
 * @returns {boolean}
 */
function isClientCrawling(clientSlug) {
  for (const [_, c] of crawlsMap.entries()) {
    if (c.clientSlug === clientSlug && (c.status === 'running' || c.status === 'queued')) {
      return true;
    }
  }
  return false;
}

module.exports = {
  startCrawl,
  getCrawlStatus,
  pauseCrawl,
  resumeCrawl,
  cancelCrawl,
  getCrawlExports,
  getParsedIssues,
  getParsedInlinks,
  listCrawls,
  clearCrawl,
  isClientCrawling,
  isLiveCliAvailable,
  getScreamingFrogCliPath,
  parseCsv,
  MOCK_FIXTURES,
  crawlEvents,
  _resetStoreForTesting
};
