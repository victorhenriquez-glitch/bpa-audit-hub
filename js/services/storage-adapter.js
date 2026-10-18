/**
 * Bright Pink Agency — Dual-Mode Storage & State Adapter (v2.0)
 * Seamlessly abstracts data persistence:
 *  - Active Replit Backend Mode: Calls REST endpoints
 *  - Static Vercel / Offline Mode: Persists mutations in localStorage with instant fallback to BPA_DATA seed.
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
        // Attempt quick health check without blocking
        if (typeof fetch === 'function') {
          fetch('/api/health', { method: 'GET', headers: { 'Accept': 'application/json' } })
            .then(res => {
              if (res.ok) {
                this.isBackendAvailable = true;
                console.log('[BPA_STORAGE] Connected to Replit Full-Stack Backend.');
              }
            })
            .catch(() => {
              this.isBackendAvailable = false;
            });
        }
      }
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

      // Merge with local overrides if any
      const overrides = this.localCache[slug] || {};
      const merged = Object.assign({}, baseData, overrides);

      // Deep copy arrays to avoid accidental cross-contamination
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
     * Mark a task as completed or reopen it
     */
    updateTaskStatus: function(clientSlug, taskId, status, meta) {
      meta = meta || {};
      const client = this.getClient(clientSlug);
      if (!client) return false;

      const tasks = client.tasks.slice();
      const completedTasks = client.completedTasks.slice();

      if (status === 'completed' || status === 'Completed') {
        const idx = tasks.findIndex(t => t.id === taskId);
        if (idx !== -1) {
          const original = tasks[idx];
          tasks.splice(idx, 1);

          const completedItem = Object.assign({}, original, {
            status: 'Completed',
            completedDate: meta.completedDate || new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
            completedBy: meta.completedBy || 'Víctor Henríquez',
            investedMinutes: meta.investedMinutes !== undefined ? meta.investedMinutes : (original.estimatedMinutes || 15),
            summary: meta.summary || original.businessImpact || original.businessImpact_en || 'Task verified and completed in CMS/staging.',
            resolutionNote: meta.resolutionNote || ''
          });

          // Insert at top of completed
          completedTasks.unshift(completedItem);
        }
      } else if (status === 'reopen' || status === 'pending' || status === 'Pending' || status === 'active' || status === 'Active') {
        const cIdx = completedTasks.findIndex(t => t.id === taskId);
        if (cIdx !== -1) {
          const original = completedTasks[cIdx];
          completedTasks.splice(cIdx, 1);

          const reopenedItem = Object.assign({}, original, {
            status: 'Ready for CMS Execution',
            phase: original.phase || 'Current Sprint'
          });
          delete reopenedItem.completedDate;
          delete reopenedItem.completedBy;
          delete reopenedItem.resolutionNote;

          tasks.unshift(reopenedItem);
        }
      }

      this.localCache[clientSlug] = this.localCache[clientSlug] || {};
      this.localCache[clientSlug].tasks = tasks;
      this.localCache[clientSlug].completedTasks = completedTasks;
      this.saveLocalCache();

      // Recalculate sprint hours if applicable
      this.recalculateSprint(clientSlug);

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
      // Prepend so latest month is first
      reports.unshift(report);

      this.localCache[clientSlug] = this.localCache[clientSlug] || {};
      this.localCache[clientSlug].monthlyKpiReports = reports;
      this.saveLocalCache();
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
      return true;
    },

    resetClientDemoState: function(clientSlug) {
      if (this.localCache && this.localCache[clientSlug]) {
        delete this.localCache[clientSlug];
        this.saveLocalCache();
      }
      return true;
    }
  };

  // Export to window
  window.BPA_STORAGE = StorageAdapter.init();

})(typeof window !== 'undefined' ? window : global);
