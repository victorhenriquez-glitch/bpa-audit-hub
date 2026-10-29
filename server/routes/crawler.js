/**
 * Bright Pink Agency Technical Audit Hub
 * Express Router: /api/crawler
 * 
 * Implements the Screaming Frog API Server specification conforming strictly to
 * BPA_ScreamingFrog_API_Contract_for_Jonie.md.
 * 
 * Endpoints:
 * - POST /api/crawler/crawl                   (Initiate crawl, returns 202 Accepted)
 * - GET  /api/crawler/crawls/:id/status       (Live status, progress %, export list)
 * - POST /api/crawler/crawls/:id/pause        (Pause crawl)
 * - POST /api/crawler/crawls/:id/resume       (Resume crawl)
 * - POST /api/crawler/crawls/:id/cancel       (Cancel crawl)
 * - GET  /api/crawler/crawls/:id/issues       (Issues extraction with type and minUrls filters)
 * - GET  /api/crawler/crawls/:id/inlinks      (Inlinks extraction with targetStatusCode, limit, groupBy)
 * - GET  /api/crawler/crawls                  (List recent crawls)
 */

'use strict';

const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');

// Lazy or direct import of screamingFrogService with defensive fallback
let screamingFrogService;
try {
  screamingFrogService = require('../services/screaming-frog');
} catch (err) {
  // Graceful fallback during modular development / unit testing
  screamingFrogService = null;
}

/**
 * Dependency injection helper for unit tests and mocks
 */
router.setCrawlerService = function(service) {
  screamingFrogService = service;
};

router.getCrawlerService = function() {
  return screamingFrogService;
};

// ============================================================================
// PAYLOAD & QUERY VALIDATORS (Strict Contract Conformance, Zero Dependencies)
// ============================================================================

/**
 * Validates URL format (must be valid HTTP or HTTPS)
 */
function isValidHttpUrl(string) {
  try {
    const url = new URL(string);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch (_) {
    return false;
  }
}

/**
 * Validates client slug format (alphanumeric, hyphens, underscores)
 */
function isValidSlug(slug) {
  return typeof slug === 'string' && /^[a-zA-Z0-9_-]{2,64}$/.test(slug.trim());
}

/**
 * Validates crawl initiation payload conforming to contract schema
 */
function validateCrawlPayload(body) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return { valid: false, status: 400, error: 'Request body must be a valid JSON object' };
  }

  const { clientSlug, targetUrl, crawlMode, options } = body;

  if (!clientSlug || typeof clientSlug !== 'string' || !isValidSlug(clientSlug)) {
    return {
      valid: false,
      status: 400,
      error: 'Invalid or missing clientSlug. Must be an alphanumeric slug (e.g. "oh-deer")'
    };
  }

  if (!targetUrl || typeof targetUrl !== 'string' || !isValidHttpUrl(targetUrl.trim())) {
    return {
      valid: false,
      status: 400,
      error: 'Invalid or missing targetUrl. Must be a valid absolute HTTP/HTTPS URL'
    };
  }

  const validModes = ['spider', 'list', 'sitemap'];
  const mode = crawlMode ? String(crawlMode).toLowerCase() : 'spider';
  if (!validModes.includes(mode)) {
    return {
      valid: false,
      status: 400,
      error: `Invalid crawlMode "${crawlMode}". Allowed values: ${validModes.join(', ')}`
    };
  }

  const sanitizedOptions = {
    maxCrawlDepth: 10,
    limitUrls: 10000,
    respectRobots: true,
    exportReports: ['Crawl Overview', 'Issues Overview', 'Redirects:Redirect Chains'],
    bulkExports: [
      'Issues:All',
      'Response Codes:Internal:Internal Client Error (4xx) Inlinks',
      'Response Codes:Internal:Internal Redirection (3xx) Inlinks',
      'Links:All Inlinks'
    ],
    exportFormat: 'csv'
  };

  if (options && typeof options === 'object' && !Array.isArray(options)) {
    if (options.maxCrawlDepth !== undefined) {
      const depth = Number(options.maxCrawlDepth);
      if (!Number.isInteger(depth) || depth < 1 || depth > 100) {
        return { valid: false, status: 400, error: 'options.maxCrawlDepth must be an integer between 1 and 100' };
      }
      sanitizedOptions.maxCrawlDepth = depth;
    }

    if (options.limitUrls !== undefined) {
      const limit = Number(options.limitUrls);
      if (!Number.isInteger(limit) || limit < 1 || limit > 1000000) {
        return { valid: false, status: 400, error: 'options.limitUrls must be an integer between 1 and 1,000,000' };
      }
      sanitizedOptions.limitUrls = limit;
    }

    if (options.respectRobots !== undefined) {
      sanitizedOptions.respectRobots = Boolean(options.respectRobots);
    }

    if (options.exportFormat !== undefined) {
      const fmt = String(options.exportFormat).toLowerCase();
      if (!['csv', 'xlsx'].includes(fmt)) {
        return { valid: false, status: 400, error: 'options.exportFormat must be "csv" or "xlsx"' };
      }
      sanitizedOptions.exportFormat = fmt;
    }

    if (Array.isArray(options.exportReports)) {
      sanitizedOptions.exportReports = options.exportReports.map(String);
    }

    if (Array.isArray(options.bulkExports)) {
      sanitizedOptions.bulkExports = options.bulkExports.map(String);
    }

    if (options.configFile && typeof options.configFile === 'string') {
      sanitizedOptions.configFile = options.configFile.trim();
    }
  }

  return {
    valid: true,
    data: {
      clientSlug: clientSlug.trim(),
      targetUrl: targetUrl.trim(),
      crawlMode: mode,
      options: sanitizedOptions
    }
  };
}

/**
 * Validates issues query parameters
 */
function validateIssuesQuery(query) {
  const result = { type: 'all', minUrls: 0 };

  if (query.type) {
    const t = String(query.type).toLowerCase();
    const allowed = ['issue', 'warning', 'opportunity', 'all'];
    if (!allowed.includes(t)) {
      return { valid: false, status: 400, error: `Invalid type "${query.type}". Allowed: ${allowed.join(', ')}` };
    }
    result.type = t;
  }

  if (query.minUrls !== undefined) {
    const min = Number(query.minUrls);
    if (isNaN(min) || min < 0) {
      return { valid: false, status: 400, error: 'minUrls must be a non-negative integer' };
    }
    result.minUrls = Math.floor(min);
  }

  return { valid: true, data: result };
}

/**
 * Validates inlinks query parameters
 */
function validateInlinksQuery(query) {
  const result = { targetStatusCode: null, limit: 100, groupBy: 'template' };

  if (query.targetStatusCode !== undefined) {
    const code = Number(query.targetStatusCode);
    if (!Number.isInteger(code) || code < 100 || code > 599) {
      return { valid: false, status: 400, error: 'targetStatusCode must be a valid HTTP status code (100-599)' };
    }
    result.targetStatusCode = code;
  }

  if (query.limit !== undefined) {
    const limit = Number(query.limit);
    if (!Number.isInteger(limit) || limit < 1 || limit > 1000) {
      return { valid: false, status: 400, error: 'limit must be an integer between 1 and 1000' };
    }
    result.limit = limit;
  }

  if (query.groupBy !== undefined) {
    const gb = String(query.groupBy).toLowerCase();
    const allowed = ['template', 'source', 'target'];
    if (!allowed.includes(gb)) {
      return { valid: false, status: 400, error: `groupBy must be one of: ${allowed.join(', ')}` };
    }
    result.groupBy = gb;
  }

  return { valid: true, data: result };
}

// ============================================================================
// ROUTE HANDLERS
// ============================================================================

/**
 * 1. INITIATE CRAWL
 * POST /api/crawler/crawl
 */
router.post('/crawl', async (req, res, next) => {
  try {
    const validation = validateCrawlPayload(req.body);
    if (!validation.valid) {
      return res.status(validation.status).json({ error: validation.error });
    }

    if (!screamingFrogService) {
      return res.status(503).json({
        error: 'Crawler service is not initialized or unavailable on this host'
      });
    }

    const { clientSlug, targetUrl, crawlMode, options } = validation.data;

    // Check if client is already actively crawling (Conflict: 409)
    if (typeof screamingFrogService.isClientCrawling === 'function') {
      const isCrawling = screamingFrogService.isClientCrawling(clientSlug);
      if (isCrawling) {
        return res.status(409).json({
          error: `Crawl already in progress for client slug "${clientSlug}"`
        });
      }
    }

    const crawlResult = await screamingFrogService.startCrawl({
      clientSlug,
      targetUrl,
      crawlMode,
      options
    });

    const crawlId = crawlResult.crawlId;
    const startedAt = crawlResult.startedAt || new Date().toISOString();
    const status = crawlResult.status || 'queued';

    return res.status(202).json({
      success: true,
      crawlId: crawlId,
      clientSlug: clientSlug,
      targetUrl: targetUrl,
      status: status,
      startedAt: startedAt,
      statusUrl: `/api/crawler/crawls/${crawlId}/status`
    });

  } catch (err) {
    if (err.statusCode === 409 || err.code === 'CONFLICT') {
      return res.status(409).json({ error: err.message });
    }
    return next(err);
  }
});

/**
 * 2. CRAWL STATUS & PROGRESS MONITORING
 * GET /api/crawler/crawls/:id/status
 */
router.get('/crawls/:id/status', async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!id || typeof id !== 'string') {
      return res.status(400).json({ error: 'Crawl ID is required' });
    }

    if (!screamingFrogService) {
      return res.status(503).json({ error: 'Crawler service unavailable' });
    }

    const statusData = await screamingFrogService.getCrawlStatus(id);
    if (!statusData) {
      return res.status(404).json({ error: `Crawl with ID "${id}" not found` });
    }

    return res.json(statusData);

  } catch (err) {
    if (err.statusCode === 404 || err.code === 'NOT_FOUND') {
      return res.status(404).json({ error: err.message });
    }
    return next(err);
  }
});

/**
 * 3. PAUSE CRAWL
 * POST /api/crawler/crawls/:id/pause
 */
router.post('/crawls/:id/pause', async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!screamingFrogService) {
      return res.status(503).json({ error: 'Crawler service unavailable' });
    }

    const result = await screamingFrogService.pauseCrawl(id);
    if (!result) {
      return res.status(404).json({ error: `Crawl with ID "${id}" not found` });
    }

    return res.json({
      crawlId: id,
      action: 'pause',
      currentStatus: result.currentStatus || 'paused'
    });

  } catch (err) {
    if (err.statusCode === 404 || err.code === 'NOT_FOUND') {
      return res.status(404).json({ error: err.message });
    }
    if (err.statusCode === 400 || err.code === 'INVALID_STATE') {
      return res.status(400).json({ error: err.message });
    }
    return next(err);
  }
});

/**
 * 4. RESUME CRAWL
 * POST /api/crawler/crawls/:id/resume
 */
router.post('/crawls/:id/resume', async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!screamingFrogService) {
      return res.status(503).json({ error: 'Crawler service unavailable' });
    }

    const result = await screamingFrogService.resumeCrawl(id);
    if (!result) {
      return res.status(404).json({ error: `Crawl with ID "${id}" not found` });
    }

    return res.json({
      crawlId: id,
      action: 'resume',
      currentStatus: result.currentStatus || 'running'
    });

  } catch (err) {
    if (err.statusCode === 404 || err.code === 'NOT_FOUND') {
      return res.status(404).json({ error: err.message });
    }
    if (err.statusCode === 400 || err.code === 'INVALID_STATE') {
      return res.status(400).json({ error: err.message });
    }
    return next(err);
  }
});

/**
 * 5. CANCEL CRAWL
 * POST /api/crawler/crawls/:id/cancel
 */
router.post('/crawls/:id/cancel', async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!screamingFrogService) {
      return res.status(503).json({ error: 'Crawler service unavailable' });
    }

    const result = await screamingFrogService.cancelCrawl(id);
    if (!result) {
      return res.status(404).json({ error: `Crawl with ID "${id}" not found` });
    }

    return res.json({
      crawlId: id,
      action: 'cancel',
      currentStatus: result.currentStatus || 'cancelled'
    });

  } catch (err) {
    if (err.statusCode === 404 || err.code === 'NOT_FOUND') {
      return res.status(404).json({ error: err.message });
    }
    return next(err);
  }
});

/**
 * 6. ISSUES EXTRACTION
 * GET /api/crawler/crawls/:id/issues
 */
router.get('/crawls/:id/issues', async (req, res, next) => {
  try {
    const { id } = req.params;
    const queryValidation = validateIssuesQuery(req.query);
    if (!queryValidation.valid) {
      return res.status(queryValidation.status).json({ error: queryValidation.error });
    }

    if (!screamingFrogService) {
      return res.status(503).json({ error: 'Crawler service unavailable' });
    }

    const issuesData = await screamingFrogService.getParsedIssues(id, queryValidation.data);
    if (!issuesData) {
      return res.status(404).json({ error: `Crawl with ID "${id}" not found` });
    }

    return res.json(issuesData);

  } catch (err) {
    if (err.statusCode === 404 || err.code === 'NOT_FOUND') {
      return res.status(404).json({ error: err.message });
    }
    return next(err);
  }
});

/**
 * 7. INLINKS EXTRACTION & GRAPH ANALYSIS
 * GET /api/crawler/crawls/:id/inlinks
 */
router.get('/crawls/:id/inlinks', async (req, res, next) => {
  try {
    const { id } = req.params;
    const queryValidation = validateInlinksQuery(req.query);
    if (!queryValidation.valid) {
      return res.status(queryValidation.status).json({ error: queryValidation.error });
    }

    if (!screamingFrogService) {
      return res.status(503).json({ error: 'Crawler service unavailable' });
    }

    const inlinksData = await screamingFrogService.getParsedInlinks(id, queryValidation.data);
    if (!inlinksData) {
      return res.status(404).json({ error: `Crawl with ID "${id}" not found` });
    }

    return res.json(inlinksData);

  } catch (err) {
    if (err.statusCode === 404 || err.code === 'NOT_FOUND') {
      return res.status(404).json({ error: err.message });
    }
    return next(err);
  }
});

/**
 * 8. LIST RECENT CRAWLS
 * GET /api/crawler/crawls
 */
router.get('/crawls', async (req, res, next) => {
  try {
    if (!screamingFrogService) {
      return res.status(503).json({ error: 'Crawler service unavailable' });
    }

    const { clientSlug, status, limit } = req.query;
    const filter = {};
    if (clientSlug) filter.clientSlug = String(clientSlug).trim();
    if (status) filter.status = String(status).trim().toLowerCase();
    if (limit) {
      const parsedLimit = Number(limit);
      if (Number.isInteger(parsedLimit) && parsedLimit > 0) {
        filter.limit = Math.min(parsedLimit, 200);
      }
    }

    const crawls = await screamingFrogService.listCrawls(filter);
    const list = Array.isArray(crawls) ? crawls : (crawls.crawls || []);

    return res.json({
      total: list.length,
      crawls: list
    });

  } catch (err) {
    return next(err);
  }
});

/**
 * 9. INGEST CRAWL DATA INTO CLIENT STORE (M2 Pipeline Bridge)
 * POST /api/crawler/crawls/:crawlId/ingest
 */
router.post('/crawls/:crawlId/ingest', async (req, res, next) => {
  try {
    const { crawlId } = req.params;
    const { clientSlug, options } = req.body || {};

    if (!screamingFrogService) {
      return res.status(503).json({ error: 'Crawler service unavailable' });
    }

    let targetSlug = clientSlug;
    try {
      const statusObj = await screamingFrogService.getCrawlStatus(crawlId);
      if (statusObj && statusObj.clientSlug) {
        targetSlug = targetSlug || statusObj.clientSlug;
      }
    } catch (_) {
      // Check if crawl directory exists on disk
      const crawlDir = path.resolve(__dirname, '../../data/crawls', crawlId);
      if (!fs.existsSync(crawlDir) && !targetSlug) {
        return res.status(404).json({ error: `Crawl ID "${crawlId}" not recognized` });
      }
    }

    if (!targetSlug && crawlId.startsWith('crawl_')) {
      const parts = crawlId.split('_');
      if (parts.length >= 2) targetSlug = parts[1];
    }

    if (!targetSlug) {
      return res.status(400).json({ error: 'Missing clientSlug in crawl metadata or request payload' });
    }

    const crawlPipeline = require('../ingestion/crawl-pipeline');
    const result = await crawlPipeline.handleIngestCrawlRequest({
      clientSlug: targetSlug,
      crawlId,
      options,
      screamingFrogService
    });

    return res.json({
      success: true,
      crawlId,
      clientSlug: targetSlug,
      updatedKpis: result.kpis,
      tasksGenerated: result.tasksGeneratedCount,
      completedTasksPreserved: result.completedTasksPreservedCount
    });
  } catch (err) {
    if (err.statusCode === 404 || err.code === 'NOT_FOUND') {
      return res.status(404).json({ error: err.message });
    }
    return next(err);
  }
});

module.exports = router;
