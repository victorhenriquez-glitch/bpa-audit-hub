/**
 * Bright Pink Agency — Dual-Mode Storage & State Adapter (v2.1)
 * Seamlessly abstracts data persistence:
 *  - Active Replit Backend Mode: Syncs reads and writes with `/api/clients*`
 *  - Static / Offline Mode: Persists mutations in localStorage with instant fallback to BPA_DATA seed.
 */

(function(window) {
  'use strict';

  const STORAGE_KEY = 'bpa_audit_hub_state_v2';
  const listeners = [];

  const StorageAdapter = {
    isBackendAvailable: false,
    backendBaseUrl: '',
    localCache: null,

    init: function() {
      this.loadLocalCache();
      this.checkBackend();
      return this;
    },

    loadLocalCache: function() {
      try {
        if (typeof window !== 'undefined' && window.localStorage) {
          const raw = window.localStorage.getItem(STORAGE_KEY);
          if (raw) {
            this.localCache = JSON.parse(raw);
          }
        }
      } catch (e) {
        console.warn('[BPA_STORAGE] Could not read from localStorage, using in-memory state.', e);
      }
      if (!this.localCache || typeof this.localCache !== 'object') {
        this.localCache = {};
      }
    },

    saveLocalCache: function() {
      try {
        if (typeof window !== 'undefined' && window.localStorage) {
          window.localStorage.setItem(STORAGE_KEY, JSON.stringify(this.localCache));
        }
      } catch (e) {
        console.warn('[BPA_STORAGE] Failed to write to localStorage:', e);
      }
      this.notifyListeners();
    },

    checkBackend: function() {
      if (typeof window !== 'undefined' && window.location && window.location.origin) {
        if (typeof fetch === 'function') {
          fetch('/api/health', { method: 'GET', headers: { 'Accept': 'application/json' } })
            .then(res => {
              if (res.ok) {
                this.isBackendAvailable = true;
                if (window.currentClient) {
                  this.syncClientFromBackend(window.currentClient);
                }
              }
            })
            .catch(() => {
              this.isBackendAvailable = false;
            });
        }
      }
    },

    syncClientFromBackend: function(slug) {
      if (!this.isBackendAvailable || typeof fetch !== 'function' || !slug) return;
      fetch(`/api/clients/${slug}`, { method: 'GET', headers: { 'Accept': 'application/json' } })
        .then(res => res.ok ? res.json() : null)
        .then(serverClient => {
          if (!serverClient || typeof serverClient !== 'object') return;
          this.localCache[slug] = Object.assign({}, this.localCache[slug] || {}, {
            tasks: Array.isArray(serverClient.tasks) ? serverClient.tasks : [],
            completedTasks: Array.isArray(serverClient.completedTasks) ? serverClient.completedTasks : [],
            monthlyKpiReports: Array.isArray(serverClient.monthlyKpiReports) ? serverClient.monthlyKpiReports : [],
            sprintSummary: serverClient.sprintSummary
          });
          this.saveLocalCache();
          if (window.currentClient === slug && typeof window.renderClient === 'function') {
            window.renderClient(slug);
          }
        })
        .catch(() => {});
    },

    onStateChange: function(fn) {
      if (typeof fn === 'function') listeners.push(fn);
    },

    notifyListeners: function() {
      listeners.forEach(fn => {
        try { fn(); } catch (err) { console.error('Error in state listener:', err); }
      });
    },

    getClient: function(slug) {
      const baseData = (window.BPA_DATA && window.BPA_DATA[slug]) ? window.BPA_DATA[slug] : null;
      if (!baseData) return null;

      const overrides = this.localCache[slug] || {};
      const merged = Object.assign({}, baseData, overrides);

      merged.tasks = overrides.tasks ? overrides.tasks.slice() : (baseData.tasks ? baseData.tasks.slice() : []);
      merged.completedTasks = overrides.completedTasks ? overrides.completedTasks.slice() : (baseData.completedTasks ? baseData.completedTasks.slice() : []);
      merged.monthlyKpiReports = overrides.monthlyKpiReports ? overrides.monthlyKpiReports.slice() : (baseData.monthlyKpiReports ? baseData.monthlyKpiReports.slice() : []);

      if (window.BPA_SECURITY && window.BPA_SECURITY.validateClientSchema) {
        return window.BPA_SECURITY.validateClientSchema(merged);
      }
      return merged;
    },

    getAllClientSlugs: function() {
      if (!window.BPA_DATA) return [];
      return Object.keys(window.BPA_DATA);
    },

    /**
     * Mark a task as completed or reopen it while preserving 100% of original ticket fields.
     */
    updateTaskStatus: function(clientSlug, taskId, status, meta) {
      meta = meta || {};
      const client = this.getClient(clientSlug);
      if (!client) return false;

      const tasks = client.tasks.slice();
      const completedTasks = client.completedTasks.slice();

      if (status === 'completed' || status === 'Completed') {
        const idx = tasks.findIndex(t => t.id === taskId);
        if (idx === -1) return false;
        const original = tasks[idx];
        tasks.splice(idx, 1);

        const author = meta.completedBy || meta.author || 'Víctor Henríquez';
        const dateStr = meta.completedDate || new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
        const completedItem = Object.assign({}, original, {
          status: 'Completed',
          completedDate: dateStr,
          verifiedDate: dateStr,
          completedBy: author,
          verifiedBy: author,
          investedMinutes: meta.investedMinutes !== undefined ? Number(meta.investedMinutes) : (original.estimatedMinutes || 15),
          summary: meta.summary || original.businessImpact || original.businessImpact_en || 'Task verified and completed in CMS/staging.',
          resolutionNote: meta.resolutionNote || ''
        });

        completedTasks.unshift(completedItem);
      } else if (status === 'reopen' || status === 'pending' || status === 'Pending' || status === 'active' || status === 'Active') {
        const cIdx = completedTasks.findIndex(t => t.id === taskId);
        if (cIdx === -1) return false;
        const original = completedTasks[cIdx];
        completedTasks.splice(cIdx, 1);

        const reopenedItem = Object.assign({}, original, {
          status: 'Ready for CMS Execution',
          phase: original.phase || 'Current Sprint',
          estimatedMinutes: original.estimatedMinutes || original.investedMinutes || 15
        });
        delete reopenedItem.completedDate;
        delete reopenedItem.verifiedDate;
        delete reopenedItem.completedBy;
        delete reopenedItem.verifiedBy;
        delete reopenedItem.resolutionNote;

        tasks.unshift(reopenedItem);
      } else {
        return false;
      }

      this.localCache[clientSlug] = this.localCache[clientSlug] || {};
      this.localCache[clientSlug].tasks = tasks;
      this.localCache[clientSlug].completedTasks = completedTasks;
      this.saveLocalCache();
      this.recalculateSprint(clientSlug);

      if (this.isBackendAvailable && typeof fetch === 'function') {
        const apiStatus = (status === 'completed' || status === 'Completed') ? 'completed' : 'active';
        fetch(`/api/clients/${clientSlug}/tasks/${taskId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: apiStatus, options: meta })
        }).catch(() => {});
      }

      return true;
    },

    recalculateSprint: function(clientSlug) {
      const client = this.getClient(clientSlug);
      if (!client || !client.sprintSummary) return;

      const activeSprintTasks = client.tasks.filter(t => t.phase === 'Current Sprint');
      const totalMins = activeSprintTasks.reduce((acc, t) => acc + (t.estimatedMinutes || 0), 0);
      const hours = (totalMins / 60).toFixed(2).replace(/\.00$/, '') + ' hrs';

      this.localCache[clientSlug] = this.localCache[clientSlug] || {};
      this.localCache[clientSlug].sprintSummary = Object.assign({}, client.sprintSummary, {
        totalEstimatedMinutes: totalMins,
        totalEstimatedHours: hours
      });
      this.saveLocalCache();
    },

    addMonthlyKpiReport: function(clientSlug, report) {
      const client = this.getClient(clientSlug);
      if (!client) return false;

      const reports = client.monthlyKpiReports ? client.monthlyKpiReports.slice() : [];
      reports.unshift(report);

      this.localCache[clientSlug] = this.localCache[clientSlug] || {};
      this.localCache[clientSlug].monthlyKpiReports = reports;
      this.saveLocalCache();

      if (this.isBackendAvailable && typeof fetch === 'function') {
        fetch(`/api/clients/${clientSlug}/kpis`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(report)
        }).catch(() => {});
      }
      return true;
    },

    addCustomTask: function(clientSlug, task) {
      const client = this.getClient(clientSlug);
      if (!client) return false;

      const tasks = client.tasks.slice();
      tasks.unshift(task);

      this.localCache[clientSlug] = this.localCache[clientSlug] || {};
      this.localCache[clientSlug].tasks = tasks;
      this.saveLocalCache();
      this.recalculateSprint(clientSlug);

      if (this.isBackendAvailable && typeof fetch === 'function') {
        fetch(`/api/clients/${clientSlug}/tasks`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(task)
        }).catch(() => {});
      }
      return true;
    },

    updateTaskMinutes: function(clientSlug, taskId, newMinutes, isCompleted) {
      const client = this.getClient(clientSlug);
      if (!client) return false;
      const mins = Math.max(0, Math.round(Number(newMinutes) || 0));

      const tasks = client.tasks.slice();
      const completedTasks = client.completedTasks.slice();

      if (isCompleted) {
        const cIdx = completedTasks.findIndex(t => t.id === taskId);
        if (cIdx === -1) return false;
        completedTasks[cIdx] = Object.assign({}, completedTasks[cIdx], { investedMinutes: mins });
      } else {
        const idx = tasks.findIndex(t => t.id === taskId);
        if (idx === -1) return false;
        tasks[idx] = Object.assign({}, tasks[idx], { estimatedMinutes: mins });
      }

      this.localCache[clientSlug] = this.localCache[clientSlug] || {};
      this.localCache[clientSlug].tasks = tasks;
      this.localCache[clientSlug].completedTasks = completedTasks;
      this.saveLocalCache();
      this.recalculateSprint(clientSlug);

      if (this.isBackendAvailable && typeof fetch === 'function') {
        fetch(`/api/clients/${clientSlug}/tasks/${taskId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'update_minutes', options: { minutes: mins, isCompleted: Boolean(isCompleted) } })
        }).catch(() => {});
      }
      return true;
    },

    resetClientDemoState: function(clientSlug) {
      if (this.localCache && this.localCache[clientSlug]) {
        delete this.localCache[clientSlug];
        this.saveLocalCache();
      }
      return true;
    },

    // ========================================================================
    // CRAWLER & CRAWL INGESTION BRIDGE (Milestone 3)
    // ========================================================================

    _mockCrawls: {},

    /**
     * Check crawler service availability and binary status.
     * @returns {Promise<{ available: boolean, version: string, license: string, defaultExportDir: string, mode: string, activeCrawls?: number }>}
     */
    checkCrawlerStatus: function() {
      if (!this.isBackendAvailable || typeof fetch !== 'function') {
        return Promise.resolve({
          available: false,
          version: 'Screaming Frog SEO Spider v24.1 (Simulated/Offline Mode)',
          license: 'Demo / Client-Side Mock',
          defaultExportDir: 'data/crawls',
          mode: 'simulation'
        });
      }

      return fetch('/api/crawler/crawls?limit=1', { headers: { 'Accept': 'application/json' } })
        .then(res => {
          if (!res.ok) throw new Error('Crawler API status: ' + res.status);
          return res.json();
        })
        .then(data => ({
          available: true,
          version: 'Screaming Frog SEO Spider v24.1 (CLI Worker)',
          license: 'Enterprise (Bright Pink Agency)',
          defaultExportDir: 'data/crawls',
          activeCrawls: (data && data.total) ? data.total : 0,
          mode: 'live'
        }))
        .catch(err => ({
          available: false,
          version: 'Screaming Frog SEO Spider (Simulated/Offline Mode)',
          license: 'Demo / Client-Side Mock',
          defaultExportDir: 'data/crawls',
          mode: 'simulation',
          error: err.message
        }));
    },

    /**
     * Initiate a new crawl for a client domain.
     * @param {Object} params { clientSlug, targetUrl, crawlMode, options }
     * @returns {Promise<{ success: boolean, crawlId: string, clientSlug: string, targetUrl: string, status: string, startedAt: string, statusUrl: string }>}
     */
    startCrawl: function(params) {
      params = params || {};
      const currentSlug = (typeof window !== 'undefined' && window.currentClient) ? window.currentClient : 'oh-deer';
      const clientSlug = params.clientSlug || currentSlug;
      const targetUrl = params.targetUrl || ('https://' + (clientSlug === 'oh-deer' ? 'oh-deer.com' : clientSlug + '.com'));
      const crawlMode = params.crawlMode || 'spider';
      const options = params.options || {};

      if (this.isBackendAvailable && typeof fetch === 'function') {
        return fetch('/api/crawler/crawl', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ clientSlug, targetUrl, crawlMode, options })
        })
        .then(res => res.json().then(data => {
          if (!res.ok) throw new Error(data.error || 'Failed to initiate crawl');
          return data;
        }));
      }

      // Offline / Mock Simulation Fallback
      const crawlId = 'crawl_' + clientSlug.replace(/[^a-z0-9]/gi, '') + '_' + Date.now();
      const mockCrawl = {
        crawlId: crawlId,
        clientSlug: clientSlug,
        targetUrl: targetUrl,
        crawlMode: crawlMode,
        status: 'running',
        startedAt: new Date().toISOString(),
        progressPercentage: 10,
        metrics: {
          urlsCrawled: 250,
          urlsEnqueued: 5692,
          currentUrl: targetUrl + '/locations/',
          elapsedSeconds: 1,
          estimatedRemainingSeconds: 25
        },
        flags: { paused: false, hasErrors: false },
        options: options
      };

      this._mockCrawls[crawlId] = mockCrawl;

      return Promise.resolve({
        success: true,
        crawlId: crawlId,
        clientSlug: clientSlug,
        targetUrl: targetUrl,
        status: 'running',
        startedAt: mockCrawl.startedAt,
        statusUrl: '/api/crawler/crawls/' + crawlId + '/status'
      });
    },

    /**
     * Poll live crawl status and progress metrics.
     * @param {string} crawlId
     * @returns {Promise<{ crawlId: string, clientSlug: string, status: string, progressPercentage: number, metrics: Object, flags?: Object, availableExports?: string[], exportFolder?: string, completedAt?: string }>}
     */
    getCrawlStatus: function(crawlId) {
      if (!crawlId) return Promise.reject(new Error('crawlId is required'));

      if (this.isBackendAvailable && typeof fetch === 'function' && !String(crawlId).startsWith('sim-') && !String(crawlId).startsWith('crawl_')) {
        return fetch('/api/crawler/crawls/' + encodeURIComponent(crawlId) + '/status', {
          headers: { 'Accept': 'application/json' }
        })
        .then(res => res.json().then(data => {
          if (!res.ok) throw new Error(data.error || 'Crawl not found');
          return data;
        }));
      }

      // Offline / Mock Progression
      const c = this._mockCrawls[crawlId] || {
        crawlId: crawlId,
        clientSlug: 'oh-deer',
        targetUrl: 'https://oh-deer.com',
        status: 'running',
        progressPercentage: 20,
        metrics: { urlsCrawled: 1200, urlsEnqueued: 5692, currentUrl: 'https://oh-deer.com/services/', elapsedSeconds: 2, estimatedRemainingSeconds: 20 }
      };

      if (c.status === 'running') {
        if (c.progressPercentage < 35) {
          c.progressPercentage = 45;
          c.metrics.urlsCrawled = 2450;
          c.metrics.currentUrl = c.targetUrl + '/locations/cape-cod/';
          c.metrics.elapsedSeconds = (c.metrics.elapsedSeconds || 0) + 2;
          c.metrics.estimatedRemainingSeconds = 15;
        } else if (c.progressPercentage < 70) {
          c.progressPercentage = 75;
          c.metrics.urlsCrawled = 4420;
          c.metrics.currentUrl = c.targetUrl + '/services/tick-control/';
          c.metrics.elapsedSeconds = (c.metrics.elapsedSeconds || 0) + 2;
          c.metrics.estimatedRemainingSeconds = 8;
        } else if (c.progressPercentage < 95) {
          c.progressPercentage = 95;
          c.metrics.urlsCrawled = 5410;
          c.metrics.currentUrl = c.targetUrl + '/blog/';
          c.metrics.elapsedSeconds = (c.metrics.elapsedSeconds || 0) + 2;
          c.metrics.estimatedRemainingSeconds = 2;
        } else {
          c.progressPercentage = 100;
          c.status = 'completed';
          c.completedAt = new Date().toISOString();
          c.metrics.urlsCrawled = 5692;
          c.metrics.currentUrl = c.targetUrl;
          c.metrics.elapsedSeconds = (c.metrics.elapsedSeconds || 0) + 1;
          c.metrics.estimatedRemainingSeconds = 0;
          c.totalCrawled = 5692;
          c.exportFolder = 'data/crawls/' + crawlId;
          c.availableExports = [
            'internal_all.csv',
            'crawl_overview.csv',
            'issues_overview.csv',
            'issues_reports/client_error_4xx.csv',
            'issues_reports/redirection_3xx.csv',
            'inlinks/client_error_4xx_inlinks.csv',
            'inlinks/redirection_3xx_inlinks.csv'
          ];
        }
      }

      this._mockCrawls[crawlId] = c;
      return Promise.resolve(JSON.parse(JSON.stringify(c)));
    },

    pollCrawlStatus: function(crawlId) {
      return this.getCrawlStatus(crawlId);
    },

    /**
     * Pause an active crawl.
     * @param {string} crawlId
     */
    pauseCrawl: function(crawlId) {
      if (this.isBackendAvailable && typeof fetch === 'function' && !String(crawlId).startsWith('sim-') && !String(crawlId).startsWith('crawl_')) {
        return fetch('/api/crawler/crawls/' + encodeURIComponent(crawlId) + '/pause', { method: 'POST' })
          .then(res => res.json());
      }
      if (this._mockCrawls[crawlId]) {
        this._mockCrawls[crawlId].status = 'paused';
        if (this._mockCrawls[crawlId].flags) this._mockCrawls[crawlId].flags.paused = true;
      }
      return Promise.resolve({ success: true, crawlId: crawlId, action: 'pause', currentStatus: 'paused' });
    },

    /**
     * Resume a paused crawl.
     * @param {string} crawlId
     */
    resumeCrawl: function(crawlId) {
      if (this.isBackendAvailable && typeof fetch === 'function' && !String(crawlId).startsWith('sim-') && !String(crawlId).startsWith('crawl_')) {
        return fetch('/api/crawler/crawls/' + encodeURIComponent(crawlId) + '/resume', { method: 'POST' })
          .then(res => res.json());
      }
      if (this._mockCrawls[crawlId]) {
        this._mockCrawls[crawlId].status = 'running';
        if (this._mockCrawls[crawlId].flags) this._mockCrawls[crawlId].flags.paused = false;
      }
      return Promise.resolve({ success: true, crawlId: crawlId, action: 'resume', currentStatus: 'running' });
    },

    /**
     * Cancel an active or paused crawl.
     * @param {string} crawlId
     */
    cancelCrawl: function(crawlId) {
      if (this.isBackendAvailable && typeof fetch === 'function' && !String(crawlId).startsWith('sim-') && !String(crawlId).startsWith('crawl_')) {
        return fetch('/api/crawler/crawls/' + encodeURIComponent(crawlId) + '/cancel', { method: 'POST' })
          .then(res => res.json());
      }
      if (this._mockCrawls[crawlId]) {
        this._mockCrawls[crawlId].status = 'cancelled';
      }
      return Promise.resolve({ success: true, crawlId: crawlId, action: 'cancel', currentStatus: 'cancelled' });
    },

    /**
     * List recent crawls from backend or mock store.
     * @param {Object} filter { clientSlug, status, limit }
     */
    listCrawls: function(filter) {
      filter = filter || {};
      if (this.isBackendAvailable && typeof fetch === 'function') {
        const q = new URLSearchParams();
        if (filter.clientSlug) q.set('clientSlug', filter.clientSlug);
        if (filter.status) q.set('status', filter.status);
        if (filter.limit) q.set('limit', filter.limit);
        return fetch('/api/crawler/crawls?' + q.toString(), { headers: { 'Accept': 'application/json' } })
          .then(res => res.json());
      }
      let crawls = Object.values(this._mockCrawls);
      if (filter.clientSlug) {
        crawls = crawls.filter(c => c.clientSlug === filter.clientSlug);
      }
      if (filter.status) {
        crawls = crawls.filter(c => c.status === filter.status);
      }
      if (filter.limit) {
        crawls = crawls.slice(0, Number(filter.limit));
      }
      return Promise.resolve({ total: crawls.length, crawls: crawls });
    },

    /**
     * Ingest crawl dataset from server export directory.
     * Supports both signature: ({ clientSlug, crawlId, crawlExportPath, options }) and (clientSlug, crawlId, crawlExportPath, options)
     */
    ingestCrawl: function(arg1, arg2, arg3, arg4) {
      let clientSlug, crawlId, crawlExportPath, options;
      if (arg1 && typeof arg1 === 'object') {
        clientSlug = arg1.clientSlug;
        crawlId = arg1.crawlId;
        crawlExportPath = arg1.crawlExportPath;
        options = arg1.options || {};
      } else {
        clientSlug = arg1;
        crawlId = arg2;
        crawlExportPath = arg3;
        options = arg4 || {};
      }

      const currentSlug = (typeof window !== 'undefined' && window.currentClient) ? window.currentClient : 'oh-deer';
      clientSlug = clientSlug || currentSlug;
      const isDryRun = Boolean(options && options.dryRun);

      if (this.isBackendAvailable && typeof fetch === 'function') {
        return fetch('/api/clients/' + encodeURIComponent(clientSlug) + '/ingest/crawl', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ crawlId, crawlExportPath, options })
        })
        .then(res => {
          if (!res.ok && crawlId) {
            return fetch('/api/crawler/crawls/' + encodeURIComponent(crawlId) + '/ingest', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ clientSlug, options })
            });
          }
          return res;
        })
        .then(res => res.json().then(data => {
          if (!res.ok) throw new Error(data.error || 'Ingestion failed');
          if (!isDryRun && data.updatedKpis) {
            this.localCache[clientSlug] = this.localCache[clientSlug] || {};
            this.localCache[clientSlug].kpis = data.updatedKpis;
            if (data.sprintSummary) this.localCache[clientSlug].sprintSummary = data.sprintSummary;
            this.saveLocalCache();
          }
          data.client = this.getClient(clientSlug);
          return data;
        }));
      }

      // Offline simulated ingestion using client base fixtures
      const baseClient = this.getClient(clientSlug) || (typeof window !== 'undefined' && window.BPA_DATA ? window.BPA_DATA[clientSlug] : null) || {};
      const updatedKpis = Object.assign({}, baseClient.kpis || {}, {
        totalCrawledUrls: 5692,
        clean200HtmlPages: 945,
        indexableHtmlCount: 945,
        internal301Redirects: 245,
        broken404Pages: 0,
        wafFalsePositive403: 818,
        healthScores: {
          rawSemrushScore: 78,
          calibratedTrueHealth: 92,
          calibrationNote: 'Recalibrated against clean 200 OK HTML pages. 818 Cloudflare WAF bot blocks isolated per Rule 2 & 27.'
        }
      });

      if (!isDryRun) {
        this.localCache[clientSlug] = this.localCache[clientSlug] || {};
        this.localCache[clientSlug].kpis = updatedKpis;
        this.saveLocalCache();
      }

      return Promise.resolve({
        success: true,
        dryRun: isDryRun,
        clientSlug: clientSlug,
        updatedKpis: updatedKpis,
        tasksGenerated: 3,
        completedTasksPreserved: (baseClient.completedTasks || []).length,
        sprintSummary: { totalEstimatedMinutes: 45, totalEstimatedHours: '0.75 hrs' },
        client: this.getClient(clientSlug)
      });
    },

    ingestCrawlExport: function(arg1, arg2, arg3, arg4) {
      return this.ingestCrawl(arg1, arg2, arg3, arg4);
    },

    /**
     * Ingest raw CSV payloads (Issues, Inlinks, Internal) into client store.
     * Supports both signature: ({ clientSlug, issuesCsv, inlinksCsv, internalCsv, options }) and (clientSlug, payloads, options)
     */
    uploadCrawlFiles: function(arg1, arg2, arg3) {
      let clientSlug, issuesCsv, inlinksCsv, internalCsv, options;
      if (arg1 && typeof arg1 === 'object') {
        clientSlug = arg1.clientSlug;
        issuesCsv = arg1.issuesCsv || '';
        inlinksCsv = arg1.inlinksCsv || '';
        internalCsv = arg1.internalCsv || '';
        options = arg1.options || {};
      } else {
        clientSlug = arg1;
        const payloads = arg2 || {};
        issuesCsv = payloads.issuesCsv || '';
        inlinksCsv = payloads.inlinksCsv || '';
        internalCsv = payloads.internalCsv || '';
        options = arg3 || {};
      }

      const currentSlug = (typeof window !== 'undefined' && window.currentClient) ? window.currentClient : 'oh-deer';
      clientSlug = clientSlug || currentSlug;
      const isDryRun = Boolean(options && options.dryRun);

      if (this.isBackendAvailable && typeof fetch === 'function') {
        return fetch('/api/clients/' + encodeURIComponent(clientSlug) + '/crawl/upload', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ issuesCsv, inlinksCsv, internalCsv, options })
        })
        .then(res => res.json().then(data => {
          if (!res.ok) throw new Error(data.error || 'Upload failed');
          if (!isDryRun && data.updatedKpis) {
            this.localCache[clientSlug] = this.localCache[clientSlug] || {};
            this.localCache[clientSlug].kpis = data.updatedKpis;
            if (data.sprintSummary) this.localCache[clientSlug].sprintSummary = data.sprintSummary;
            this.saveLocalCache();
          }
          data.client = this.getClient(clientSlug);
          return data;
        }));
      }

      // Offline / Mock Simulation Fallback
      const baseClient = this.getClient(clientSlug) || (typeof window !== 'undefined' && window.BPA_DATA ? window.BPA_DATA[clientSlug] : null) || {};
      const updatedKpis = Object.assign({}, baseClient.kpis || {}, {
        totalCrawledUrls: 5692,
        clean200HtmlPages: 945,
        indexableHtmlCount: 945,
        internal301Redirects: 245,
        broken404Pages: 0,
        wafFalsePositive403: 818,
        duplicateH1s: 0,
        crawlDepthBreakdown: { level1: 1, level2: 12, level3: 145, level4Plus: 87 },
        healthScores: {
          rawSemrushScore: 78,
          calibratedTrueHealth: 92,
          calibrationNote: 'Calibrated from Screaming Frog crawl: 945 clean HTML pages, 0 404s, 818 Cloudflare WAF false positives isolated.'
        }
      });

      if (!isDryRun) {
        this.localCache[clientSlug] = this.localCache[clientSlug] || {};
        this.localCache[clientSlug].kpis = updatedKpis;
        this.saveLocalCache();
      }

      return Promise.resolve({
        success: true,
        dryRun: isDryRun,
        clientSlug: clientSlug,
        updatedKpis: updatedKpis,
        tasksGenerated: 3,
        completedTasksPreserved: (baseClient.completedTasks || []).length,
        sprintSummary: { totalEstimatedMinutes: 45, totalEstimatedHours: '0.75 hrs' },
        client: this.getClient(clientSlug)
      });
    }
  };

  window.BPA_STORAGE = StorageAdapter.init();

})(typeof window !== 'undefined' ? window : global);
