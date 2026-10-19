/**
 * Bright Pink Agency Technical Audit Hub - Core Application Controller
 * Handles client switching, task rendering, filtering, search, modal interactions, and ClickUp exports.
 * Pure English Edition - Streamlined and High Performance.
 */

window.currentClient = 'oh-deer';
window.currentTask = null;
window.isClientView = false;
window.currentFilter = 'all';
window.currentSearchTerm = '';

// --- 0. DEFENSIVE UTILITIES ---
if (typeof window.sanitize !== 'function') {
  window.sanitize = function(str) {
    if (str === null || str === undefined) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  };
}

// --- 1. INITIALIZATION ---
window.initApp = function() {
  try {
    let paramClient = null;
    let paramView = null;
    if (typeof window !== 'undefined' && window.location && window.location.search) {
      const urlParams = new URLSearchParams(window.location.search);
      paramClient = urlParams.get('client');
      paramView = urlParams.get('view') || urlParams.get('mode');
    }

    if (paramClient && window.BPA_DATA && window.BPA_DATA[paramClient]) {
      window.currentClient = paramClient;
    }

    if (paramView === 'client') {
      window.isClientView = true;
    }

    window.applyViewModeUI();
    window.renderClient(window.currentClient);

    if (window.lucide) {
      lucide.createIcons();
    }
  } catch (err) {
    console.error('Initialization error in initApp:', err);
  }
};

// --- 2. VIEW MODE TOGGLE (CLIENT PORTAL VS AGENCY INTERNAL) ---
window.toggleViewMode = function() {
  window.isClientView = !window.isClientView;
  window.applyViewModeUI();
  const client = window.BPA_DATA ? window.BPA_DATA[window.currentClient] : null;
  if (client) window.renderTasks(client.tasks || []);
  if (window.lucide) lucide.createIcons();
};

window.applyViewModeUI = function() {
  const switcher = document.getElementById('agency-client-switcher');
  const banner = document.getElementById('client-view-banner');
  const clickupBtn = document.getElementById('btn-clickup-summary');
  const shareBtn = document.getElementById('btn-copy-client-link');
  const viewBtnText = document.getElementById('view-mode-text');

  if (window.isClientView) {
    if (switcher) switcher.classList.add('hidden');
    if (banner) {
      banner.classList.remove('hidden');
      banner.classList.add('flex');
    }
    if (clickupBtn) clickupBtn.classList.add('hidden');
    if (shareBtn) shareBtn.classList.remove('hidden');
    if (viewBtnText) viewBtnText.textContent = 'Agency View';
  } else {
    if (switcher) switcher.classList.remove('hidden');
    if (banner) {
      banner.classList.add('hidden');
      banner.classList.remove('flex');
    }
    if (clickupBtn) clickupBtn.classList.remove('hidden');
    if (shareBtn) shareBtn.classList.add('hidden');
    if (viewBtnText) viewBtnText.textContent = 'Client View';
  }
};

// --- 3. CLIENT SWITCHING ---
window.switchClient = function(slug) {
  if (!window.BPA_DATA || !window.BPA_DATA[slug]) return;
  window.currentClient = slug;

  const btnMap = {
    'oh-deer': document.getElementById('btn-client-ohdeer'),
    'us-lawns': document.getElementById('btn-client-uslawns'),
    'owl-be-there': document.getElementById('btn-client-owlbethere'),
    'pacific-lawn-sprinklers': document.getElementById('btn-client-pacificlawn'),
    'image-studios': document.getElementById('btn-client-imagestudios')
  };

  const activeClass = 'px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-lg text-xs font-bold transition-all bg-white text-bpa-magenta shadow-xs border border-purple-100';
  const inactiveClass = 'px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-lg text-xs font-semibold transition-all text-slate-600 hover:text-bpa-violet';

  Object.keys(btnMap).forEach(key => {
    const btn = btnMap[key];
    if (btn) {
      btn.className = (key === slug) ? activeClass : inactiveClass;
    }
  });

  window.renderClient(slug);
};

// --- 4. RENDER CLIENT PROFILE ---
window.renderClient = function(slug) {
  const data = (window.BPA_STORAGE && typeof window.BPA_STORAGE.getClient === 'function')
    ? window.BPA_STORAGE.getClient(slug)
    : (window.BPA_DATA ? window.BPA_DATA[slug] : null);
  if (!data) return;

  try {
    // Hero Elements
    const elName = document.getElementById('client-name');
    if (elName) elName.textContent = data.clientName;

    const elDomain = document.getElementById('client-domain');
    if (elDomain) {
      const domainSpan = elDomain.querySelector('span');
      if (domainSpan) domainSpan.textContent = data.domain;
      elDomain.href = 'https://' + data.domain;
    }

    const elInd = document.getElementById('client-industry');
    if (elInd) {
      elInd.textContent = data.industry_en || data.industry;
    }

    const elAm = document.getElementById('client-am');
    if (elAm) elAm.textContent = data.accountManager;

    const elSeo = document.getElementById('client-seo-title');
    if (elSeo) elSeo.textContent = data.technicalSeoLead || 'Víctor Henríquez';

    const elSprintTime = document.getElementById('hero-sprint-time');
    if (elSprintTime && data.sprintSummary) elSprintTime.textContent = data.sprintSummary.totalEstimatedHours;

    const elCycle = document.getElementById('badge-cycle');
    if (elCycle) {
      const cycleText = data.auditCycle_en || data.auditCycle;
      elCycle.textContent = `${data.auditDate} — ${cycleText}`;
    }

    const elCms = document.getElementById('badge-cms');
    if (elCms && data.cmsStack) {
      elCms.innerHTML = `<i data-lucide="code" class="w-3.5 h-3.5"></i> ${window.sanitize(data.cmsStack.platform)}`;
    }

    const elWb = document.getElementById('hero-workbook-link');
    if (elWb) {
      if (data.workbookUrl) {
        elWb.href = data.workbookUrl;
        elWb.classList.remove('hidden');
        elWb.classList.add('inline-flex');
      } else {
        elWb.classList.add('hidden');
        elWb.classList.remove('inline-flex');
      }
    }

    const elGdoc = document.getElementById('hero-gdoc-link');
    if (elGdoc) {
      if (data.gdocUrl) {
        elGdoc.href = data.gdocUrl;
        elGdoc.classList.remove('hidden');
        elGdoc.classList.add('inline-flex');
      } else {
        elGdoc.classList.add('hidden');
        elGdoc.classList.remove('inline-flex');
      }
    }

    // Health Scores
    if (data.kpis && data.kpis.healthScores) {
      const elRaw = document.getElementById('score-raw');
      if (elRaw) elRaw.textContent = data.kpis.healthScores.rawSemrushScore + '%';

      const elRawSub = document.getElementById('score-raw-sub');
      if (elRawSub) {
        const waf = data.kpis.wafFalsePositive403 || 0;
        const err404 = data.kpis.broken404Pages || 0;
        if (waf > 0) {
          elRawSub.textContent = `${waf.toLocaleString()} WAF 403 Blocks`;
        } else if (err404 > 0) {
          elRawSub.textContent = `${err404.toLocaleString()} 404 Errors Flagged`;
        } else {
          elRawSub.textContent = 'Clean / 0 False Positives';
        }
      }

      const elCalibrated = document.getElementById('score-calibrated');
      if (elCalibrated) elCalibrated.innerHTML = `${data.kpis.healthScores.calibratedTrueHealth}<span class="text-2xl">%</span>`;

      const elSop = document.getElementById('sop-note');
      if (elSop) {
        const note = data.kpis.healthScores.calibrationNote_en || data.kpis.healthScores.calibrationNote;
        elSop.innerHTML = window.sanitize(note);
      }
    }

    const elSopBtn = document.getElementById('sop-sprint-btn-text');
    if (elSopBtn) {
      const sprintTime = (data.sprintSummary && data.sprintSummary.totalEstimatedHours) ? data.sprintSummary.totalEstimatedHours : '45 min';
      elSopBtn.textContent = `View Sprint (${sprintTime})`;
    }

    // KPIs
    if (data.kpis) {
      const setKpi = (id, val) => {
        const el = document.getElementById(id);
        if (el && val !== undefined) el.textContent = val.toLocaleString();
      };
      setKpi('kpi-total', data.kpis.totalCrawledUrls);
      setKpi('kpi-html-count', data.kpis.indexableHtmlCount);
      setKpi('kpi-clean', data.kpis.clean200HtmlPages);
      setKpi('kpi-403', data.kpis.wafFalsePositive403);
      setKpi('kpi-301', data.kpis.internal301Redirects);
    }

    // Sprint Header
    if (data.sprintSummary) {
      const elSTime = document.getElementById('sprint-total-time');
      if (elSTime) elSTime.textContent = data.sprintSummary.totalEstimatedHours;

      const elSStatus = document.getElementById('sprint-approval-status');
      if (elSStatus) {
        elSStatus.textContent = data.sprintSummary.approvalStatus_en || data.sprintSummary.approvalStatus;
      }
    }

    // Dynamic Roadmap Cards
    const elRoadmap = document.getElementById('roadmap-cards-container');
    if (elRoadmap) {
      const roadmapItems = data.roadmap || [
        {
          phase: 'Phase 2 — Upcoming Retainer Cycle',
          hours: '4.0 hrs',
          title: `${data.clientName} Code Architecture & Template Normalization`,
          description: `Consolidation of site templates, structured data refinements, and internal link normalization across ${data.domain}.`,
          deliverables: [
            'Global heading hierarchy alignment and normalization (2.5h)',
            'Internal redirect and dead link cleanup in menu & footer (1.5h)'
          ],
          badge: 'Planned / Next Retainer'
        },
        {
          phase: 'Phase 3 — Quarterly Technical Roadmap',
          hours: '4.5 hrs',
          title: `${data.clientName} Local Entity & Speed Enhancement`,
          description: `Advanced schema entity maps, Core Web Vitals optimization, and high-authority location expansion.`,
          deliverables: [
            'Rich snippet entity validation and local hub links (2.5h)',
            'Asset minification, WebP conversion & cache audit (2.0h)'
          ],
          badge: 'Upcoming Roadmap'
        }
      ];

      elRoadmap.innerHTML = roadmapItems.map((item, idx) => `
        <div class="bg-white rounded-3xl p-6 border border-purple-100 shadow-xs space-y-4 hover:border-purple-200 transition-colors">
          <div class="flex items-center justify-between">
            <span class="px-2.5 py-1 rounded-full text-xs font-bold ${idx === 0 ? 'bg-purple-50 text-purple-900 border border-purple-200' : 'bg-pink-50 text-bpa-magenta border border-pink-200'}">
              ${window.sanitize(item.phase)}
            </span>
            <span class="text-xs font-mono font-bold text-slate-500">${window.sanitize(item.hours)}</span>
          </div>
          <div>
            <h3 class="text-base font-bold text-bpa-violet">
              ${window.sanitize(item.title)}
            </h3>
            <p class="text-xs text-slate-600 mt-1.5 leading-relaxed">
              ${window.sanitize(item.description)}
            </p>
          </div>
          <div class="space-y-2 text-xs pt-2 border-t border-purple-50">
            ${(item.deliverables || []).map(d => `
              <div class="flex items-center gap-2 text-slate-700 font-medium">
                <i data-lucide="check" class="w-3.5 h-3.5 text-emerald-500 shrink-0"></i>
                <span>${window.sanitize(d)}</span>
              </div>
            `).join('')}
          </div>
          <div class="pt-2">
            <span class="inline-block px-3 py-1 rounded-lg text-[11px] font-semibold bg-slate-100 text-slate-600">
              ${window.sanitize(item.badge || 'Ready for estimation')}
            </span>
          </div>
        </div>
      `).join('');
    }

    // Conditional Workspace Tabs (Rule #27: Hide Monthly KPIs & AI Bridge when client has no verified data)
    const hasKpis = Array.isArray(data.monthlyKpiReports) && data.monthlyKpiReports.length > 0;
    const hasAiBridge = Boolean(data.brightAuditsBridge && data.brightAuditsBridge.scores);

    const tabKpis = document.getElementById('tab-btn-kpis');
    if (tabKpis && tabKpis.classList) {
      if (hasKpis) {
        tabKpis.classList.remove('hidden');
      } else {
        tabKpis.classList.add('hidden');
      }
    }

    const tabAiBridge = document.getElementById('tab-btn-ai-bridge');
    if (tabAiBridge && tabAiBridge.classList) {
      if (hasAiBridge) {
        tabAiBridge.classList.remove('hidden');
      } else {
        tabAiBridge.classList.add('hidden');
      }
    }

    if ((window.currentWorkspaceTab === 'kpis' && !hasKpis) || (window.currentWorkspaceTab === 'ai-bridge' && !hasAiBridge)) {
      if (typeof window.switchWorkspaceTab === 'function') {
        window.switchWorkspaceTab('audit');
      }
    }

    // Update Visualizations & Task List
    window.renderCharts(data);
    window.updateTaskCounts(data);
    window.renderTasks(data.tasks || []);

    // Update Sprint Progress Bar if workflow module is present
    if (typeof window.updateSprintProgressBar === 'function') {
      window.updateSprintProgressBar(data);
    }

    // Update Monthly KPIs if KPI engine is present
    if (typeof window.renderMonthlyKpis === 'function') {
      window.renderMonthlyKpis(data);
    }

    // Update AI Inspector Bridge if bridge is present
    if (typeof window.renderAiInspectorBridge === 'function') {
      window.renderAiInspectorBridge(data);
    }

    if (window.lucide) lucide.createIcons();
  } catch (err) {
    console.error('Error in renderClient:', err);
  }
};

// --- 5. TASK COUNTERS ---
window.updateTaskCounts = function(data) {
  const tasks = data.tasks || [];
  const completed = data.completedTasks || [];

  const setBadge = (id, count) => {
    const el = document.getElementById(id);
    if (el) el.textContent = count;
  };

  setBadge('count-all', tasks.length);
  setBadge('count-sprint', tasks.filter(t => t.phase === 'Current Sprint').length);
  setBadge('count-victor', tasks.filter(t => (t.assignedRole || '').includes('Victor') || (t.assignedRole || '').includes('Víctor')).length);
  setBadge('count-augustina', tasks.filter(t => (t.assignedRole || '').includes('Augustina')).length);
  setBadge('count-dev', tasks.filter(t => {
    const r = t.assignedRole || '';
    return r.includes('Jonie') || r.includes('Dev') || r.includes('Augustina');
  }).length);
  setBadge('count-content', tasks.filter(t => {
    const r = t.assignedRole || '';
    return r.includes('Donna') || r.includes('Content');
  }).length);
  setBadge('count-completed', completed.length);
};

// --- 6. TASK LIST RENDERER ---
window.renderTasks = function(tasks) {
  const container = document.getElementById('tasks-container');
  if (!container) return;
  container.innerHTML = '';

  const client = (window.BPA_STORAGE && typeof window.BPA_STORAGE.getClient === 'function')
    ? window.BPA_STORAGE.getClient(window.currentClient)
    : (window.BPA_DATA ? window.BPA_DATA[window.currentClient] : null);
  if (!client) return;

  // Handle Completed Tab Filter
  if (window.currentFilter === 'completed') {
    const completedTasks = client.completedTasks || [];
    if (completedTasks.length === 0) {
      container.innerHTML = `
        <div class="bg-white rounded-2xl p-10 text-center border border-purple-100">
          <i data-lucide="check-circle-2" class="w-10 h-10 text-emerald-300 mx-auto mb-2"></i>
          <h4 class="text-sm font-bold text-bpa-violet">No completed tasks archived in this cycle</h4>
        </div>
      `;
      if (window.lucide) lucide.createIcons();
      return;
    }

    completedTasks.forEach(task => {
      const card = document.createElement('div');
      card.className = 'bg-white rounded-2xl p-5 border border-emerald-200/80 shadow-xs space-y-3.5 hover:border-emerald-300 transition-all';
      const title = task.title_en || task.title || 'Untitled Completed Task';
      const impact = task.summary || task.impactSummary_en || task.impactSummary || 'Verified completed in maintenance cycle.';
      const invested = task.investedMinutes !== undefined ? task.investedMinutes : 15;
      const role = task.assignedRole || task.verifiedBy || 'Víctor Henríquez';
      const date = task.completedDate || task.verifiedDate || 'October 2026';
      const proofUrls = task.sampleUrls || [];
      const clickupUrl = task.clickupUrl || '';
      const sheetUrl = task.workbookUrl || client.workbookUrl || '';

      card.innerHTML = `
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div class="flex flex-wrap items-center gap-2">
            <span class="px-2 py-0.5 rounded text-[10px] font-extrabold uppercase bg-emerald-100 text-emerald-800 border border-emerald-200">
              COMPLETED
            </span>
            ${task.category ? `
              <span class="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-100">
                ${window.sanitize(task.category)}
              </span>
            ` : ''}
            <span class="text-xs font-mono font-bold text-slate-400">${window.sanitize(task.id)}</span>
            <span class="text-xs text-slate-500 font-semibold">• ${window.sanitize(date)}</span>
          </div>
          <div class="flex flex-wrap items-center gap-2">
            <button onclick="promptEditTaskMinutes('${task.id}', true)" class="text-xs font-mono font-bold text-slate-700 bg-slate-50 hover:bg-purple-50 hover:text-bpa-magenta px-2.5 py-1 rounded-lg border border-slate-200 hover:border-purple-200 transition-colors flex items-center gap-1 cursor-pointer" title="Click to adjust logged minutes">
              <span>⏱️ ${invested} min</span>
              <i data-lucide="pencil" class="w-3 h-3 text-slate-400"></i>
            </button>
            <span class="text-xs font-semibold text-purple-900 bg-purple-50 px-2.5 py-1 rounded-lg border border-purple-100">
              ${window.sanitize(role)}
            </span>
            ${clickupUrl ? `
              <a href="${window.sanitizeUrl(clickupUrl)}" target="_blank" rel="noopener noreferrer" class="px-2.5 py-1 rounded-lg text-xs font-semibold text-pink-900 bg-pink-50 hover:bg-pink-100 border border-pink-200 transition-colors flex items-center gap-1" title="Open verified ClickUp subtask">
                <i data-lucide="check-square" class="w-3 h-3 text-bpa-magenta"></i>
                <span>ClickUp</span>
                <i data-lucide="external-link" class="w-3 h-3 text-bpa-magenta"></i>
              </a>
            ` : ''}
            ${sheetUrl ? `
              <a href="${window.sanitizeUrl(sheetUrl)}" target="_blank" rel="noopener noreferrer" class="px-2.5 py-1 rounded-lg text-xs font-semibold text-emerald-900 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 transition-colors flex items-center gap-1" title="Open in Master Google Sheet">
                <i data-lucide="sheet" class="w-3 h-3 text-emerald-600"></i>
                <span>Sheet</span>
              </a>
            ` : ''}
            <button onclick="reopenTask('${task.id}')" class="px-2.5 py-1 rounded-lg text-xs font-semibold text-slate-600 bg-white hover:bg-purple-50 border border-slate-200 hover:border-purple-200 transition-colors flex items-center gap-1 shadow-2xs" title="Return task to active sprint">
              <i data-lucide="rotate-ccw" class="w-3 h-3 text-purple-600"></i>
              <span>Reopen</span>
            </button>
          </div>
        </div>
        <div>
          <h3 class="text-base font-bold text-slate-800">${window.sanitize(title)}</h3>
          <p class="text-xs text-slate-600 mt-1 leading-relaxed">
            <strong>What Was Verified & Solved:</strong> ${window.sanitize(impact)}
          </p>
        </div>
        ${proofUrls.length > 0 ? `
          <div class="bg-emerald-50/40 rounded-xl border border-emerald-100 p-2.5 text-xs">
            <div class="flex items-center justify-between cursor-pointer" onclick="toggleUrlsDrawer('${task.id}')">
              <span class="font-bold text-emerald-900 flex items-center gap-1.5">
                <i data-lucide="shield-check" class="w-3.5 h-3.5 text-emerald-600"></i>
                Verified Live Proof URLs (${proofUrls.length})
              </span>
              <span class="text-[11px] text-emerald-700 font-semibold hover:underline flex items-center gap-1">
                <span id="drawer-toggle-text-${task.id}">Show</span>
                <i data-lucide="chevron-down" id="drawer-icon-${task.id}" class="w-3.5 h-3.5 transition-transform"></i>
              </span>
            </div>
            <div id="urls-drawer-${task.id}" class="hidden pt-2.5 space-y-1.5 border-t border-emerald-100/80 mt-2">
              ${proofUrls.map(u => {
                const parsed = window.parseUrlItem(u);
                const cleanUrl = parsed && parsed.url ? parsed.url : String(u);
                return `
                  <div class="flex items-center justify-between bg-white px-3 py-1.5 rounded-lg border border-emerald-100 font-mono text-[11px] hover:border-emerald-300 transition-colors">
                    <a href="${window.sanitizeUrl(cleanUrl)}" target="_blank" rel="noopener noreferrer" class="text-emerald-800 hover:text-bpa-magenta underline truncate mr-2">${window.sanitize(String(u))}</a>
                    <a href="${window.sanitizeUrl(cleanUrl)}" target="_blank" rel="noopener noreferrer" class="text-emerald-700 hover:text-bpa-magenta shrink-0 flex items-center gap-1 text-[10px] font-sans font-semibold">
                      <span>Open Live Proof</span>
                      <i data-lucide="external-link" class="w-3 h-3"></i>
                    </a>
                  </div>
                `;
              }).join('')}
            </div>
          </div>
        ` : ''}
      `;
      container.appendChild(card);
    });
    if (window.lucide) lucide.createIcons();
    return;
  }

  let filtered = tasks.slice();

  // Apply Filter Tab
  if (window.currentFilter === 'sprint') {
    filtered = filtered.filter(t => t.phase === 'Current Sprint');
  } else if (window.currentFilter === 'victor') {
    filtered = filtered.filter(t => (t.assignedRole || '').includes('Victor') || (t.assignedRole || '').includes('Víctor'));
  } else if (window.currentFilter === 'augustina') {
    filtered = filtered.filter(t => (t.assignedRole || '').includes('Augustina'));
  } else if (window.currentFilter === 'dev') {
    filtered = filtered.filter(t => {
      const r = t.assignedRole || '';
      return r.includes('Jonie') || r.includes('Dev') || r.includes('Augustina');
    });
  } else if (window.currentFilter === 'content') {
    filtered = filtered.filter(t => {
      const r = t.assignedRole || '';
      return r.includes('Donna') || r.includes('Content');
    });
  }

  // Apply Live Search
  if (window.currentSearchTerm.trim() !== '') {
    const term = window.currentSearchTerm.toLowerCase();
    filtered = filtered.filter(t => {
      const title = (t.title || '').toLowerCase() + ' ' + (t.title_en || '').toLowerCase();
      const cause = (t.rootCause || '').toLowerCase() + ' ' + (t.rootCause_en || '').toLowerCase();
      const cat = (t.category || '').toLowerCase();
      const tid = (t.id || '').toLowerCase();
      const role = (t.assignedRole || '').toLowerCase();
      return title.includes(term) || cause.includes(term) || cat.includes(term) || tid.includes(term) || role.includes(term);
    });
  }

  if (filtered.length === 0) {
    container.innerHTML = `
      <div class="bg-white rounded-2xl p-10 text-center border border-purple-100">
        <i data-lucide="check-circle-2" class="w-10 h-10 text-purple-300 mx-auto mb-2"></i>
        <h4 class="text-sm font-bold text-bpa-violet">No tasks match this filter</h4>
        <p class="text-xs text-slate-500 mt-1">Try selecting another filter or clearing your search keywords.</p>
      </div>
    `;
    if (window.lucide) lucide.createIcons();
    return;
  }

  filtered.forEach(task => {
    const isSprint = task.phase === 'Current Sprint';
    const priorityColors = {
      'Critical': 'bg-rose-100 text-rose-800 border-rose-200',
      'High': 'bg-pink-100 text-pink-800 border-pink-200',
      'Medium': 'bg-amber-100 text-amber-800 border-amber-200',
      'Low': 'bg-blue-100 text-blue-800 border-blue-200'
    };
    const pClass = priorityColors[task.priority] || 'bg-slate-100 text-slate-800';
    const taskTitle = task.title_en || task.title;
    const taskRootCause = task.rootCause_en || task.rootCause;
    const taskImpact = task.businessImpact_en || task.businessImpact;
    const sampleUrls = task.sampleUrls || [];
    const sampleCount = sampleUrls.length;

    const card = document.createElement('div');
    card.className = `bg-white rounded-2xl p-5 border ${isSprint ? 'border-pink-200/90 shadow-xs' : 'border-purple-100'} hover:border-bpa-magenta/50 transition-all space-y-3.5`;

    card.innerHTML = `
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
        <div class="flex flex-wrap items-center gap-2">
          <span class="px-2 py-0.5 rounded text-[10px] font-extrabold uppercase border ${pClass}">
            ${window.sanitize(task.priority)}
          </span>
          <span class="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-100">
            ${window.sanitize(task.category)}
          </span>
          <span class="text-xs font-mono font-bold text-slate-400">
            ${window.sanitize(task.id)}
          </span>
          ${isSprint ? `
            <span class="px-2 py-0.5 rounded text-[10px] font-bold bg-pink-50 text-bpa-magenta border border-pink-100 flex items-center gap-1">
              <i data-lucide="zap" class="w-3 h-3"></i> Active Sprint
            </span>
          ` : ''}
        </div>

        <div class="flex items-center gap-3">
          <button onclick="promptEditTaskMinutes('${task.id}', false)" class="text-xs font-mono font-bold text-slate-700 bg-slate-50 hover:bg-purple-50 hover:text-bpa-magenta px-2.5 py-1 rounded-lg border border-slate-200 hover:border-purple-200 transition-colors flex items-center gap-1 cursor-pointer" title="Click to adjust estimated minutes">
            <i data-lucide="clock" class="w-3.5 h-3.5 text-bpa-magenta"></i>
            <span>${task.estimatedMinutes} min</span>
            <i data-lucide="pencil" class="w-3 h-3 text-slate-400"></i>
          </button>
          <span class="text-xs font-semibold text-purple-900 bg-purple-50 px-2.5 py-1 rounded-lg border border-purple-100 flex items-center gap-1">
            <i data-lucide="user" class="w-3.5 h-3.5 text-purple-600"></i>
            ${window.sanitize(task.assignedRole)}
          </span>
        </div>
      </div>

      <div>
        <h3 class="text-sm sm:text-base font-bold text-bpa-violet hover:text-bpa-magenta transition-colors cursor-pointer" onclick="openTaskModal('${task.id}')">
          ${window.sanitize(taskTitle)}
        </h3>
        <p class="text-xs text-slate-600 mt-1 line-clamp-2 leading-relaxed">
          <strong>Root Cause:</strong> ${window.sanitize(taskRootCause)}
        </p>
      </div>

      <!-- Collapsible Sample URLs Drawer -->
      ${sampleCount > 0 ? `
        <div class="bg-purple-50/40 rounded-xl border border-purple-100 p-2.5 text-xs">
          <div class="flex items-center justify-between cursor-pointer" onclick="toggleUrlsDrawer('${task.id}')">
            <span class="font-bold text-purple-900 flex items-center gap-1.5">
              <i data-lucide="link" class="w-3.5 h-3.5 text-bpa-magenta"></i>
              Sample Affected URLs (${sampleCount})
            </span>
            <span class="text-[11px] text-bpa-magenta font-semibold hover:underline flex items-center gap-1">
              <span id="drawer-toggle-text-${task.id}">Show</span>
              <i data-lucide="chevron-down" id="drawer-icon-${task.id}" class="w-3.5 h-3.5 transition-transform"></i>
            </span>
          </div>
          <div id="urls-drawer-${task.id}" class="hidden pt-2.5 space-y-2 border-t border-purple-100/80 mt-2">
            <div class="space-y-1.5">
              ${sampleUrls.map(u => {
                const parsed = window.parseUrlItem(u);
                if (!parsed) return '';

                if (parsed.type === 'redirect') {
                  return `
                    <div class="flex flex-col sm:flex-row sm:items-center justify-between bg-white px-3 py-2 rounded-lg border border-purple-100 gap-2 text-[11px] font-mono shadow-2xs hover:border-bpa-magenta/40 transition-colors">
                      <div class="flex items-center gap-1.5 flex-wrap min-w-0">
                        <span class="px-1.5 py-0.2 rounded text-[9px] font-bold uppercase bg-amber-50 text-amber-700 border border-amber-200 shrink-0">301</span>
                        <span class="text-rose-600 line-through truncate max-w-[180px] sm:max-w-[260px]" title="Source URL triggering redirect">${window.sanitize(parsed.source)}</span>
                        <i data-lucide="arrow-right" class="w-3.5 h-3.5 text-bpa-magenta shrink-0"></i>
                        <span class="px-1.5 py-0.2 rounded text-[9px] font-bold uppercase bg-emerald-50 text-emerald-700 border border-emerald-200 shrink-0">200 OK</span>
                        <a href="${window.sanitize(parsed.target)}" target="_blank" rel="noopener noreferrer" class="text-emerald-800 hover:text-bpa-magenta font-semibold underline truncate max-w-[200px] sm:max-w-[280px]" title="Target canonical destination">${window.sanitize(parsed.target)}</a>
                      </div>
                      <div class="flex items-center gap-1.5 shrink-0 self-end sm:self-auto">
                        <a href="${window.sanitize(parsed.source)}" target="_blank" rel="noopener noreferrer" title="Test live 301 redirect in new tab" class="px-2 py-0.5 rounded text-[10px] font-sans font-medium text-slate-500 hover:text-rose-600 hover:bg-rose-50 border border-slate-200 transition-colors flex items-center gap-1">
                          <i data-lucide="compass" class="w-3 h-3 text-rose-500"></i> Test 301
                        </a>
                        <a href="${window.sanitize(parsed.target)}" target="_blank" rel="noopener noreferrer" title="Open canonical 200 OK target" class="px-2 py-0.5 rounded text-[10px] font-sans font-semibold text-emerald-700 hover:text-emerald-900 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 transition-colors flex items-center gap-1">
                          <i data-lucide="external-link" class="w-3 h-3 text-emerald-600"></i> Open Target
                        </a>
                      </div>
                    </div>
                  `;
                }

                return `
                  <div class="flex items-center justify-between bg-white px-3 py-1.5 rounded-lg border border-purple-100 font-mono text-[11px] hover:border-bpa-magenta/40 transition-colors">
                    <a href="${window.sanitize(parsed.url)}" target="_blank" rel="noopener noreferrer" class="text-purple-700 hover:text-bpa-magenta truncate mr-2">${window.sanitize(parsed.url)}</a>
                    <a href="${window.sanitize(parsed.url)}" target="_blank" rel="noopener noreferrer" class="text-slate-400 hover:text-bpa-magenta shrink-0 flex items-center gap-1 text-[10px] font-sans">
                      <span>Open</span>
                      <i data-lucide="external-link" class="w-3 h-3"></i>
                    </a>
                  </div>
                `;
              }).join('')}
            </div>
            <div class="flex justify-end pt-1">
              <button onclick="copyUrlsList('${task.id}')" class="text-[11px] font-bold text-bpa-magenta hover:text-purple-900 flex items-center gap-1">
                <i data-lucide="copy" class="w-3 h-3"></i>
                Copy All URLs
              </button>
            </div>
          </div>
        </div>
      ` : ''}

      <div class="pt-2 border-t border-purple-50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div class="text-slate-500 italic">
          <strong>Impact:</strong> ${window.sanitize(taskImpact)}
        </div>

        <div class="flex flex-wrap items-center gap-2 shrink-0">
          ${task.clickupUrl ? `
            <a href="${window.sanitizeUrl(task.clickupUrl)}" target="_blank" rel="noopener noreferrer" class="px-3 py-1.5 rounded-lg font-semibold text-pink-900 bg-pink-50 hover:bg-pink-100 border border-pink-200 transition-colors flex items-center gap-1.5" title="Open verified ClickUp subtask">
              <i data-lucide="check-square" class="w-3.5 h-3.5 text-bpa-magenta"></i>
              <span>ClickUp</span>
              <i data-lucide="external-link" class="w-3 h-3 text-bpa-magenta"></i>
            </a>
          ` : ''}

          <button onclick="promptCompleteTask('${task.id}')" class="px-3 py-1.5 rounded-lg font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 transition-all flex items-center gap-1.5 shadow-2xs" title="Mark this task as completed">
            <i data-lucide="check" class="w-3.5 h-3.5 text-emerald-600"></i>
            <span>Complete</span>
          </button>

          <button onclick="openTaskModal('${task.id}')" class="px-3 py-1.5 rounded-lg font-semibold text-bpa-violet bg-bpa-purple-light hover:bg-purple-100 border border-purple-200 transition-colors flex items-center gap-1.5">
            <i data-lucide="eye" class="w-3.5 h-3.5 text-bpa-magenta"></i>
            <span>View Details</span>
          </button>

          <button onclick="copyDevTicket('${task.id}')" class="px-3 py-1.5 rounded-lg font-bold text-white gradient-magenta hover:opacity-90 shadow-xs transition-opacity flex items-center gap-1.5">
            <i data-lucide="copy" class="w-3.5 h-3.5"></i>
            <span>Copy Ticket</span>
          </button>
        </div>
      </div>
    `;

    container.appendChild(card);
  });

  if (window.lucide) lucide.createIcons();
};

// --- 7. DRAWER & SMART URL UTILITIES ---
/**
 * Smart URL Parser: Distinguishes standard URLs from redirect pairs (source -> target).
 */
window.parseUrlItem = function(item) {
  if (!item) return null;
  if (typeof item === 'object') {
    const source = item.source || item.from || item.oldUrl;
    const target = item.target || item.to || item.newUrl;
    if (source && target) {
      return { type: 'redirect', source: String(source).trim(), target: String(target).trim() };
    }
  }
  const str = String(item).trim();

  // Pattern 1: url (redirects to target) or url (redirige a target)
  const redirectMatch = str.match(/^(https?:\/\/[^\s]+)\s*\((?:redirects\s+to|redirige\s+a)\s+(https?:\/\/[^\s\)]+)\)/i);
  if (redirectMatch) {
    return { type: 'redirect', source: redirectMatch[1].trim(), target: redirectMatch[2].trim() };
  }

  // Pattern 2: url -> target or url => target or url → target
  const arrowMatch = str.match(/^(https?:\/\/[^\s]+)\s*(?:->|=>|→)\s*(https?:\/\/[^\s]+)/i);
  if (arrowMatch) {
    return { type: 'redirect', source: arrowMatch[1].trim(), target: arrowMatch[2].trim() };
  }

  // Pattern 3: Standard single URL (strips trailing comment if present)
  const cleanUrlMatch = str.match(/^(https?:\/\/[^\s]+)/i);
  if (cleanUrlMatch) {
    return { type: 'single', url: cleanUrlMatch[1].trim() };
  }

  return { type: 'single', url: str };
};

window.toggleUrlsDrawer = function(taskId) {
  const drawer = document.getElementById(`urls-drawer-${taskId}`);
  const icon = document.getElementById(`drawer-icon-${taskId}`);
  const text = document.getElementById(`drawer-toggle-text-${taskId}`);
  if (!drawer || !icon || !text) return;

  if (drawer.classList.contains('hidden')) {
    drawer.classList.remove('hidden');
    text.textContent = 'Hide';
    icon.classList.add('rotate-180');
  } else {
    drawer.classList.add('hidden');
    text.textContent = 'Show';
    icon.classList.remove('rotate-180');
  }
};

window.copyUrlsList = function(taskId) {
  const client = window.BPA_DATA ? window.BPA_DATA[window.currentClient] : null;
  if (!client || !client.tasks) return;
  const task = client.tasks.find(t => t.id === taskId);
  if (!task || !task.sampleUrls) return;

  const lines = task.sampleUrls.map(u => {
    const parsed = window.parseUrlItem(u);
    if (!parsed) return String(u);
    if (parsed.type === 'redirect') {
      return `${parsed.source} -> ${parsed.target}`;
    }
    return parsed.url;
  });

  navigator.clipboard.writeText(lines.join('\n')).then(() => {
    window.showToast('URLs copied to clipboard');
  });
};

// --- 8. FILTERS & SEARCH ---
window.filterTasks = function(type) {
  window.currentFilter = type;
  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.className = 'filter-btn px-3 py-1.5 rounded-lg text-xs font-medium text-slate-600 hover:text-bpa-violet hover:bg-purple-50 transition-colors';
  });

  const activeBtn = document.getElementById(`filter-${type}`);
  if (activeBtn) {
    if (type === 'completed') {
      activeBtn.className = 'filter-btn px-3 py-1.5 rounded-lg text-xs font-bold text-white bg-emerald-600 shadow-xs';
    } else {
      activeBtn.className = 'filter-btn px-3 py-1.5 rounded-lg text-xs font-bold transition-all bg-bpa-magenta text-white shadow-xs';
    }
  }

  const client = window.BPA_DATA ? window.BPA_DATA[window.currentClient] : null;
  if (client) window.renderTasks(client.tasks || []);
};

window.handleTaskSearch = function(term) {
  window.currentSearchTerm = term;
  const client = window.BPA_DATA ? window.BPA_DATA[window.currentClient] : null;
  if (client) window.renderTasks(client.tasks || []);
};

// --- 9. MODAL CONTROLS ---
window.openTaskModal = function(taskId) {
  try {
    const client = window.BPA_DATA ? window.BPA_DATA[window.currentClient] : null;
    if (!client || !client.tasks) return;
    const task = client.tasks.find(t => t.id === taskId);
    if (!task) return;

    window.currentTask = task;
    const modal = document.getElementById('task-modal');
    if (!modal) return;

    const title = task.title_en || task.title;
    const rootCause = task.rootCause_en || task.rootCause;
    const impact = task.businessImpact_en || task.businessImpact;
    const instructions = task.technicalInstructions_en || task.technicalInstructions;
    const criteria = task.acceptanceCriteria_en || task.acceptanceCriteria || [];

    // 1. Priority Badge
    const elPriority = document.getElementById('modal-priority-badge');
    if (elPriority) {
      const priorityColors = {
        'Critical': 'bg-rose-100 text-rose-800 border border-rose-200',
        'High': 'bg-pink-100 text-pink-800 border border-pink-200',
        'Medium': 'bg-amber-100 text-amber-800 border border-amber-200',
        'Low': 'bg-blue-100 text-blue-800 border border-blue-200'
      };
      elPriority.className = `px-2 py-0.5 rounded text-[11px] font-bold uppercase tracking-wider ${priorityColors[task.priority] || 'bg-slate-100 text-slate-800'}`;
      elPriority.textContent = task.priority;
    }

    // 2. Task ID & Category
    const elId = document.getElementById('modal-task-id');
    if (elId) {
      elId.textContent = `${task.id} • ${task.category || ''}`;
    }

    // 3. Title
    const elTitle = document.getElementById('modal-title');
    if (elTitle) elTitle.textContent = title;

    // 4. Assignee
    const elAssignee = document.getElementById('modal-assignee');
    if (elAssignee) elAssignee.textContent = task.assignedRole || 'Víctor Henríquez';

    // 5. Estimated Time
    const elTime = document.getElementById('modal-time');
    if (elTime) elTime.textContent = `${task.estimatedMinutes} min`;

    // 6. Root Cause
    const elCause = document.getElementById('modal-root-cause');
    if (elCause) elCause.textContent = rootCause;

    // 7. Business Impact
    const elImpact = document.getElementById('modal-impact');
    if (elImpact) elImpact.textContent = impact;

    // 8. Technical Instructions
    const elInst = document.getElementById('modal-instructions');
    if (elInst) elInst.textContent = instructions;

    // 9. Acceptance Criteria (DoD)
    const elAccept = document.getElementById('modal-acceptance');
    if (elAccept) {
      elAccept.innerHTML = criteria.map(c => `
        <li class="flex items-start gap-2">
          <input type="checkbox" class="mt-0.5 rounded text-bpa-magenta focus:ring-bpa-magenta">
          <span>${window.sanitize(c)}</span>
        </li>
      `).join('');
    }

    // 10. Verification Command
    const verifContainer = document.getElementById('modal-verification-container');
    const verifCode = document.getElementById('modal-verification');
    const verifText = task.verificationCommand || task.verificationMethod;
    if (verifText && verifContainer && verifCode) {
      verifContainer.classList.remove('hidden');
      verifCode.textContent = verifText;
    } else if (verifContainer) {
      verifContainer.classList.add('hidden');
    }

    // 11. Google Sheet Link
    const elModalSheet = document.getElementById('modal-sheet-link');
    if (elModalSheet) {
      const wbUrl = task.workbookUrl || client.workbookUrl;
      if (wbUrl) {
        elModalSheet.href = wbUrl;
        elModalSheet.classList.remove('hidden');
        elModalSheet.classList.add('inline-flex');
      } else {
        elModalSheet.classList.add('hidden');
        elModalSheet.classList.remove('inline-flex');
      }
    }

    // 12. ClickUp Subtask Link
    const elModalClickUp = document.getElementById('modal-clickup-link');
    if (elModalClickUp) {
      if (task.clickupUrl) {
        elModalClickUp.href = task.clickupUrl;
        elModalClickUp.classList.remove('hidden');
        elModalClickUp.classList.add('inline-flex');
      } else {
        elModalClickUp.classList.add('hidden');
        elModalClickUp.classList.remove('inline-flex');
      }
    }

    // Show Modal
    if (modal) {
      modal.classList.remove('hidden');
      modal.classList.add('flex');
    }
    if (document.body && document.body.classList) {
      document.body.classList.add('overflow-hidden');
    }

    if (window.lucide) lucide.createIcons();
  } catch (err) {
    console.error('Error opening task modal:', err);
  }
};

window.closeModal = function() {
  const modal = document.getElementById('task-modal');
  if (modal) {
    modal.classList.add('hidden');
    modal.classList.remove('flex');
  }
  if (document.body && document.body.classList) {
    document.body.classList.remove('overflow-hidden');
  }
  window.currentTask = null;
};

/**
 * Allows Account Managers, PMs, and Technical Leads to adjust estimated or logged minutes on any task.
 */
window.promptEditTaskMinutes = function(taskId, isCompleted) {
  const client = (window.BPA_STORAGE && typeof window.BPA_STORAGE.getClient === 'function')
    ? window.BPA_STORAGE.getClient(window.currentClient)
    : (window.BPA_DATA ? window.BPA_DATA[window.currentClient] : null);
  if (!client) return;

  const list = isCompleted ? (client.completedTasks || []) : (client.tasks || []);
  const task = list.find(t => t.id === taskId);
  if (!task) return;

  const currentMins = isCompleted ? (task.investedMinutes !== undefined ? task.investedMinutes : 15) : (task.estimatedMinutes || 15);
  const label = isCompleted ? 'logged' : 'estimated';

  if (typeof window.prompt === 'function') {
    const input = window.prompt(`Update ${label} time (in minutes) for [${task.id}] ${task.title_en || task.title}:`, String(currentMins));
    if (input === null) return;
    const parsed = Math.round(Number(input));
    if (isNaN(parsed) || parsed < 0) {
      if (typeof window.showToast === 'function') window.showToast('Please enter a valid number of minutes.');
      return;
    }
    if (window.BPA_STORAGE && typeof window.BPA_STORAGE.updateTaskMinutes === 'function') {
      window.BPA_STORAGE.updateTaskMinutes(window.currentClient, taskId, parsed, Boolean(isCompleted));
      window.renderClient(window.currentClient);
      if (typeof window.showToast === 'function') {
        window.showToast(`⏱️ Updated ${task.id} to ${parsed} min (${(parsed / 60).toFixed(2).replace(/\.00$/, '')} hrs)`);
      }
    }
  }
};

// --- 10. CLICKUP & SHARE EXPORTERS ---
window.copyDevTicket = function(taskId) {
  const client = window.BPA_DATA ? window.BPA_DATA[window.currentClient] : null;
  if (!client || !client.tasks) return;
  const task = client.tasks.find(t => t.id === taskId);
  if (!task) return;

  const title = task.title_en || task.title;
  const rootCause = task.rootCause_en || task.rootCause;
  const impact = task.businessImpact_en || task.businessImpact;
  const instructions = task.technicalInstructions_en || task.technicalInstructions;
  const criteria = task.acceptanceCriteria_en || task.acceptanceCriteria || [];

  const ticketMarkdown = `### [${task.id}] ${title}
**Client:** ${client.clientName} (${client.domain})
**Assigned Owner:** ${task.assignedRole}
**Estimated Time:** ${task.estimatedMinutes} mins (Billable Retainer)
**Priority:** ${task.priority} | **Category:** ${task.category}

---
#### 1. Root Cause (Technical Analysis)
${rootCause}

#### 2. Business & Search Impact
${impact}

#### 3. Technical Execution Instructions
${instructions}

#### 4. Acceptance Criteria (DoD)
${criteria.map(c => `- [ ] ${c}`).join('\n')}

${task.verificationCommand ? `#### 5. Verification Method\n\`\`\`bash\n${task.verificationCommand}\n\`\`\`` : ''}

*Auto-generated from Bright Pink Agency Technical SEO Hub*`;

  navigator.clipboard.writeText(ticketMarkdown).then(() => {
    window.showToast(`Ticket ${task.id} copied for ClickUp`);
  });
};

window.copyCurrentModalTicket = function() {
  if (window.currentTask) window.copyDevTicket(window.currentTask.id);
};

window.copyClientShareLink = function() {
  const url = `${window.location.origin}${window.location.pathname}?client=${window.currentClient}&view=client`;
  navigator.clipboard.writeText(url).then(() => {
    window.showToast('Client portal link copied to clipboard');
  });
};

/**
 * Universal Objective Executive Summary for ClickUp
 * Designed for anyone (AMs, Leads, Developers) to paste into ClickUp docs or task descriptions.
 */
window.copyExecutiveSummaryClickUp = function() {
  const client = window.BPA_DATA ? window.BPA_DATA[window.currentClient] : null;
  if (!client) return;

  const kpis = client.kpis || {};
  const health = kpis.healthScores || {};
  const sprint = client.sprintSummary || {};
  const activeTasks = (client.tasks || []).filter(t => t.phase === 'Current Sprint');

  const summary = `# 📊 Technical SEO Audit & Retainer Summary — ${client.clientName}

**Domain:** ${client.domain} | **CMS Stack:** ${client.cmsStack ? client.cmsStack.platform : 'WordPress'}
**Audit Date:** ${client.auditDate} (${client.auditCycle_en || client.auditCycle})
**Account Manager:** ${client.accountManager} | **Technical SEO:** ${client.technicalSeoLead}

---

### 1. Technical Health & Global Crawlability
- **Calibrated True Health Score:** **${health.calibratedTrueHealth || 92}%**
  *(Calibrated to filter out WAF/Cloudflare bot false positives; 100% of tested URLs respond with 200 OK to live users).*
- **Raw Audit Score:** ${health.rawSemrushScore || 78}%
- **Total Crawled URLs:** ${(kpis.totalCrawledUrls || 0).toLocaleString()} (${(kpis.clean200HtmlPages || 0).toLocaleString()} clean indexable 200 OK HTML pages)
- **Filtered 403 WAF Blocks:** ${kpis.wafFalsePositive403 || 0} (whitelisting rule planned in sprint)
- **Internal Links to 301 Redirects:** ${kpis.internal301Redirects || 0} (slated for Phase 2 normalization)
- **Broken 404 Errors:** ${kpis.broken404Pages || 0}

### 2. Current Sprint Scope (Immediate Execution)
- **Total Estimated Effort:** **${sprint.totalEstimatedHours || '0.75 hrs'}** (${sprint.totalEstimatedMinutes || 45} mins billable)
- **Approval Status:** ${sprint.approvalStatus_en || sprint.approvalStatus}
- **Actionable Sprint Tasks:**
${activeTasks.map(t => `  • **[${t.id}] ${t.title_en || t.title}** (${t.estimatedMinutes} min) — *${t.assignedRole}*`).join('\n')}

### 3. Phased Retainer Roadmap
- **Phase 2 (Upcoming Month):** Global Theme Architecture & 301 Redirect cleanup (4.0 hrs).
- **Phase 3 (Q1 2027):** Local SEO Schema expansion, geographical entity alignment & WebP compression (4.5 hrs).

---
*Interactive dashboard and full ticket breakdown available at BPA Technical SEO Audit Hub.*`;

  navigator.clipboard.writeText(summary).then(() => {
    window.showToast('Executive summary copied for ClickUp');
  });
};

// --- 11. TOAST NOTIFICATIONS & SMOOTH SCROLL ---
window.showToast = function(msg) {
  const toast = document.getElementById('toast');
  const toastMsg = document.getElementById('toast-message');
  if (!toast || !toastMsg) return;

  toastMsg.textContent = msg;
  toast.classList.remove('translate-y-20', 'opacity-0');
  setTimeout(() => {
    toast.classList.add('translate-y-20', 'opacity-0');
  }, 3500);
};

window.showUpcomingNotice = function(clientName) {
  window.showToast(`${clientName} profile is currently in progress`);
};

window.scrollToSection = function(id) {
  const el = document.getElementById(id);
  if (el) el.scrollIntoView({ behavior: 'smooth' });
};

// --- 12. DOM READY BOOTSTRAP ---
document.addEventListener('DOMContentLoaded', function() {
  window.initApp();

  // Close modal when clicking outside the modal box
  const modalEl = document.getElementById('task-modal');
  if (modalEl) {
    modalEl.addEventListener('click', function(e) {
      if (e.target === modalEl) {
        window.closeModal();
      }
    });
  }

  // Close modal on Escape key
  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape' && window.currentTask) {
      window.closeModal();
    }
  });
});
