/**
 * Bright Pink Agency Technical Audit Hub - Express Backend (v2.2-PROD)
 * 
 * Internal Agency Platform ready for Screaming Frog API Server & Replit deployment.
 * - 50MB body limit for large crawl datasets, issues reports, and inlinks graphs.
 * - Full CORS middleware supporting cross-origin automation (Replit, Vercel, local dev).
 * - Centralized JSON error handling and /api/* 404 fallback.
 * - Modular Screaming Frog crawler route mounting (/api/crawler).
 * - Preserves 100% of task metadata on complete/reopen/minutes updates.
 * - Restricts static file serving strictly to frontend assets (/css, /js, /assets, /index.html).
 */

'use strict';

const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;
const ROOT_DIR = path.join(__dirname, '..');

// ============================================================================
// 1. HARDENED MIDDLEWARE PIPELINE
// ============================================================================

// A. Full CORS Middleware (Native Express, zero external dependencies)
app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (origin) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Credentials', 'true');
  } else {
    res.setHeader('Access-Control-Allow-Origin', '*');
  }
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-sync-secret, X-Requested-With, x-bpa-auth');
  res.setHeader('Access-Control-Max-Age', '86400'); // 24 hours preflight cache

  // Immediately terminate preflight OPTIONS requests
  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }
  next();
});

// B. Request Body Parsers (50MB ceiling for bulk crawl exports & inlinks)
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// ============================================================================
// 2. DATA STORE INITIALIZATION
// ============================================================================

let clientsStore = {};
const cachePath = path.join(ROOT_DIR, 'data', 'runtime-cache.json');

function saveDataStore() {
  if (process.env.NODE_ENV === 'production') return;
  try {
    fs.writeFileSync(cachePath, JSON.stringify(clientsStore, null, 2), 'utf8');
  } catch (err) {
    // Non-fatal in read-only environments
  }
}

function recalculateSprintSummary(client) {
  if (!client || !client.sprintSummary) return;
  const activeSprintTasks = (client.tasks || []).filter(t => t.phase === 'Current Sprint');
  const totalMins = activeSprintTasks.reduce((acc, t) => acc + (t.estimatedMinutes || 0), 0);
  const hours = (totalMins / 60).toFixed(2).replace(/\.00$/, '') + ' hrs';
  client.sprintSummary = Object.assign({}, client.sprintSummary, {
    totalEstimatedMinutes: totalMins,
    totalEstimatedHours: hours
  });
}

function initDataStore() {
  const clientsDir = path.join(ROOT_DIR, 'data', 'clients');
  if (fs.existsSync(clientsDir)) {
    const files = fs.readdirSync(clientsDir).filter(f => f.endsWith('.json'));
    files.forEach(file => {
      try {
        const content = fs.readFileSync(path.join(clientsDir, file), 'utf8');
        const data = JSON.parse(content);
        const slug = data.clientSlug || file.replace('.json', '');
        clientsStore[slug] = data;
      } catch (err) {
        console.error(`Error loading client ${file}:`, err.message);
      }
    });
  }

  if (process.env.NODE_ENV !== 'production' && fs.existsSync(cachePath)) {
    try {
      const cached = JSON.parse(fs.readFileSync(cachePath, 'utf8'));
      Object.keys(cached).forEach(slug => {
        if (clientsStore[slug]) {
          if (cached[slug].tasks) clientsStore[slug].tasks = cached[slug].tasks;
          if (cached[slug].completedTasks) clientsStore[slug].completedTasks = cached[slug].completedTasks;
          if (cached[slug].monthlyKpiReports) clientsStore[slug].monthlyKpiReports = cached[slug].monthlyKpiReports;
          if (cached[slug].sprintSummary) clientsStore[slug].sprintSummary = cached[slug].sprintSummary;
        }
      });
    } catch (err) {
      console.warn('Could not load local dev cache:', err.message);
    }
  }
}

initDataStore();

// ============================================================================
// 3. CORE API ENDPOINTS
// ============================================================================

// --- Health Check ---
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '2.2.0',
    clientsCount: Object.keys(clientsStore).length,
    backend: 'Bright Pink Agency Technical Audit Hub'
  });
});

// --- Clients List ---
app.get('/api/clients', (req, res) => {
  const summaries = Object.keys(clientsStore).map(slug => {
    const c = clientsStore[slug];
    return {
      slug: slug,
      name: c.clientName,
      domain: c.domain,
      industry: c.industry,
      accountManager: c.accountManager || null,
      healthScore: (c.kpis && c.kpis.healthScores && c.kpis.healthScores.calibratedTrueHealth != null)
        ? c.kpis.healthScores.calibratedTrueHealth
        : null,
      activeSprintTasks: (c.tasks || []).filter(t => t.phase === 'Current Sprint').length,
      completedTasksCount: (c.completedTasks || []).length
    };
  });
  res.json(summaries);
});

// --- Single Client Detail ---
app.get('/api/clients/:slug', (req, res) => {
  const slug = req.params.slug;
  if (!clientsStore[slug]) {
    return res.status(404).json({ error: `Client ${slug} not found` });
  }
  res.json(clientsStore[slug]);
});

// --- Task Status Update (Complete / Reopen / Minutes) ---
app.patch('/api/clients/:slug/tasks/:taskId', (req, res) => {
  const { slug, taskId } = req.params;
  const { status, options } = req.body || {};
  const meta = options || {};

  const client = clientsStore[slug];
  if (!client) {
    return res.status(404).json({ error: `Client ${slug} not found` });
  }

  client.tasks = client.tasks || [];
  client.completedTasks = client.completedTasks || [];

  if (status === 'completed') {
    const taskIndex = client.tasks.findIndex(t => t.id === taskId);
    if (taskIndex === -1) {
      return res.status(404).json({ error: `Task ${taskId} not found in active tasks` });
    }

    const [original] = client.tasks.splice(taskIndex, 1);
    const author = meta.completedBy || meta.author || original.assignedRole || 'Víctor Henríquez';
    const dateStr = meta.completedDate || new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

    // Preserve 100% of original ticket fields (rootCause, technicalInstructions, sampleUrls, clickupUrl, workbookUrl)
    const completedEntry = Object.assign({}, original, {
      status: 'Completed',
      completedBy: author,
      verifiedBy: author,
      completedDate: dateStr,
      verifiedDate: dateStr,
      investedMinutes: meta.investedMinutes !== undefined ? Number(meta.investedMinutes) : (original.estimatedMinutes || 15),
      summary: meta.summary || original.businessImpact || original.businessImpact_en || 'Task verified and completed in CMS/staging.',
      resolutionNote: meta.resolutionNote || ''
    });

    client.completedTasks.unshift(completedEntry);
    recalculateSprintSummary(client);
    saveDataStore();
    return res.json({ success: true, action: 'completed', task: completedEntry });

  } else if (status === 'active' || status === 'reopen') {
    const completedIndex = client.completedTasks.findIndex(t => t.id === taskId);
    if (completedIndex === -1) {
      return res.status(404).json({ error: `Task ${taskId} not found in completed tasks` });
    }

    const [original] = client.completedTasks.splice(completedIndex, 1);
    const reopenedTask = Object.assign({}, original, {
      status: 'Ready for CMS Execution',
      phase: original.phase || 'Current Sprint',
      estimatedMinutes: original.estimatedMinutes || original.investedMinutes || 15
    });
    delete reopenedTask.completedDate;
    delete reopenedTask.verifiedDate;
    delete reopenedTask.completedBy;
    delete reopenedTask.verifiedBy;
    delete reopenedTask.resolutionNote;

    client.tasks.unshift(reopenedTask);
    recalculateSprintSummary(client);
    saveDataStore();
    return res.json({ success: true, action: 'reopened', task: reopenedTask });

  } else if (status === 'update_minutes') {
    const mins = Math.max(0, Math.round(Number(meta.minutes) || 0));
    const isCompleted = Boolean(meta.isCompleted);
    if (isCompleted) {
      const cIdx = client.completedTasks.findIndex(t => t.id === taskId);
      if (cIdx === -1) return res.status(404).json({ error: `Completed task ${taskId} not found` });
      client.completedTasks[cIdx].investedMinutes = mins;
    } else {
      const idx = client.tasks.findIndex(t => t.id === taskId);
      if (idx === -1) return res.status(404).json({ error: `Active task ${taskId} not found` });
      client.tasks[idx].estimatedMinutes = mins;
    }
    recalculateSprintSummary(client);
    saveDataStore();
    return res.json({ success: true, action: 'update_minutes', taskId, minutes: mins });
  }

  res.status(400).json({ error: `Unsupported status ${status}` });
});

// --- Add Custom Task ---
app.post('/api/clients/:slug/tasks', (req, res) => {
  const { slug } = req.params;
  const task = req.body;
  const client = clientsStore[slug];
  if (!client) {
    return res.status(404).json({ error: `Client ${slug} not found` });
  }
  if (!task || !task.id || !task.title) {
    return res.status(400).json({ error: 'Invalid task payload: id and title are required' });
  }

  client.tasks = client.tasks || [];
  client.tasks.unshift(task);
  recalculateSprintSummary(client);
  saveDataStore();
  res.json({ success: true, task });
});

// --- Monthly KPIs Ingestion ---
app.post('/api/clients/:slug/kpis', (req, res) => {
  const { slug } = req.params;
  const report = req.body;

  const client = clientsStore[slug];
  if (!client) {
    return res.status(404).json({ error: `Client ${slug} not found` });
  }

  client.monthlyKpiReports = client.monthlyKpiReports || [];
  client.monthlyKpiReports.unshift(report);
  saveDataStore();

  res.json({ success: true, message: 'Monthly KPI report stored', report });
});

// --- Idempotent Audit Ingestion Sync ---
app.post('/api/clients/:slug/sync', (req, res) => {
  const { slug } = req.params;
  const incoming = req.body;

  const syncSecret = process.env.SYNC_SECRET;
  if (!syncSecret || req.headers['x-sync-secret'] !== syncSecret) {
    return res.status(401).json({ error: 'Unauthorized: Valid SYNC_SECRET required' });
  }

  if (!incoming || !incoming.clientName || !incoming.domain || !Array.isArray(incoming.tasks)) {
    return res.status(400).json({ error: 'Invalid client payload contract' });
  }

  const existing = clientsStore[slug];
  if (existing && Array.isArray(existing.completedTasks)) {
    const incomingIds = new Set((incoming.completedTasks || []).map(t => t.id));
    incoming.completedTasks = incoming.completedTasks || [];
    existing.completedTasks.forEach(cmp => {
      if (!incomingIds.has(cmp.id)) {
        incoming.completedTasks.push(cmp);
      }
    });
  }

  clientsStore[slug] = Object.assign({}, existing || {}, incoming, { clientSlug: slug });
  recalculateSprintSummary(clientsStore[slug]);
  saveDataStore();
  res.json({ success: true, client: clientsStore[slug] });
});

// ============================================================================
// 3.1 CRAWL INGESTION & PIPELINE ENDPOINTS (M2)
// ============================================================================

try {
  const crawlPipeline = require('./ingestion/crawl-pipeline');

  // Trigger ingestion from existing crawl ID or export directory
  app.post('/api/clients/:slug/ingest/crawl', async (req, res, next) => {
    try {
      const { slug } = req.params;
      const { crawlId, crawlExportPath, options } = req.body || {};

      if (!clientsStore[slug]) {
        return res.status(404).json({ error: `Client "${slug}" not found in data store` });
      }

      const isDryRun = Boolean(options && (options.dryRun === true || options.dryRun === 'true' || options.dryRun === 1 || options.dryRun === '1'));

      let screamingFrogService = null;
      try {
        screamingFrogService = require('./services/screaming-frog');
      } catch (_) {
        // service optional
      }

      const result = await crawlPipeline.handleIngestCrawlRequest({
        clientSlug: slug,
        crawlId,
        crawlExportPath,
        options,
        clientsStore,
        screamingFrogService
      });

      if (result.client && !isDryRun) {
        clientsStore[slug] = result.client;
        saveDataStore();
      }

      return res.json({
        success: true,
        dryRun: isDryRun,
        clientSlug: slug,
        updatedKpis: result.client.kpis,
        tasksGenerated: result.tasksGeneratedCount,
        completedTasksPreserved: (result.client.completedTasks || []).length,
        sprintSummary: result.client.sprintSummary
      });
    } catch (err) {
      return next(err);
    }
  });

  // Direct CSV upload ingestion
  app.post('/api/clients/:slug/crawl/upload', async (req, res, next) => {
    try {
      const { slug } = req.params;
      const { issuesCsv, inlinksCsv, internalCsv, options } = req.body || {};

      if (!clientsStore[slug]) {
        return res.status(404).json({ error: `Client "${slug}" not found in data store` });
      }

      if (!issuesCsv && !inlinksCsv && !internalCsv) {
        return res.status(400).json({ error: 'At least one CSV payload (issuesCsv, inlinksCsv, internalCsv) is required' });
      }

      const isDryRun = Boolean(options && (options.dryRun === true || options.dryRun === 'true' || options.dryRun === 1 || options.dryRun === '1'));

      const result = await crawlPipeline.handleCrawlUploadRequest({
        clientSlug: slug,
        payloads: { issuesCsv, inlinksCsv, internalCsv },
        options,
        clientsStore
      });

      if (result.client && !isDryRun) {
        clientsStore[slug] = result.client;
        saveDataStore();
      }

      return res.json({
        success: true,
        dryRun: isDryRun,
        clientSlug: slug,
        updatedKpis: result.client.kpis,
        tasksGenerated: result.tasksGeneratedCount,
        completedTasksPreserved: (result.client.completedTasks || []).length,
        sprintSummary: result.client.sprintSummary
      });
    } catch (err) {
      return next(err);
    }
  });

} catch (err) {
  if (process.env.NODE_ENV !== 'production') {
    console.warn('[Server] Notice: crawl-pipeline not mounted yet:', err.message);
  }
}

// ============================================================================
// 4. MODULAR SCREAMING FROG CRAWLER ROUTES
// ============================================================================

try {
  const crawlerRouter = require('./routes/crawler');
  app.use('/api/crawler', crawlerRouter);
} catch (err) {
  // Graceful initialization if crawler routes are being provisioned in stages
  if (process.env.NODE_ENV !== 'production') {
    console.warn('[Server] Notice: server/routes/crawler.js not mounted yet:', err.message);
  }
}

// ============================================================================
// 5. 404 JSON FALLBACK FOR UNMATCHED /api/* ROUTES
// ============================================================================

app.use('/api', (req, res) => {
  res.status(404).json({
    error: `API route not found: ${req.method} ${req.originalUrl || req.url}`,
    status: 404
  });
});

// ============================================================================
// 6. RESTRICTED STATIC FRONTEND SERVING
// ============================================================================

app.use('/css', express.static(path.join(ROOT_DIR, 'css')));
app.use('/js', express.static(path.join(ROOT_DIR, 'js')));
app.use('/assets', express.static(path.join(ROOT_DIR, 'assets')));

app.get('/', (req, res) => {
  res.sendFile(path.join(ROOT_DIR, 'index.html'));
});

app.get('/index.html', (req, res) => {
  res.sendFile(path.join(ROOT_DIR, 'index.html'));
});

// ============================================================================
// 7. CENTRALIZED JSON ERROR HANDLING MIDDLEWARE
// ============================================================================

app.use((err, req, res, next) => {
  console.error('[API Error]', err.message || err);
  const status = err.status || err.statusCode || 500;
  res.status(status).json({
    error: err.message || 'Internal Server Error'
  });
});

// ============================================================================
// 8. SERVER START & EXPORT
// ============================================================================

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`BPA Technical Audit Hub server running on port ${PORT}`);
  });
}

module.exports = app;
