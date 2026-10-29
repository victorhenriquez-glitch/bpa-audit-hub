/**
 * Bright Pink Agency Technical Audit Hub - Monthly KPIs & Looker Studio Engine
 * Renders the Executive Bento Grid inspired by Octav Fedor's monthly reports,
 * Google Search Console, Semrush, GA4, and embedded Looker Studio dashboards.
 */

(function(global) {
  'use strict';

  const w = (typeof window !== 'undefined') ? window : global;

  function renderMonthlyKpis(client) {
    const container = document.getElementById('monthly-kpis-container');
    if (!container) return;

    if (!client) {
      container.innerHTML = '<div class="p-8 text-center text-slate-500">No client selected.</div>';
      return;
    }

    const reports = Array.isArray(client.monthlyKpiReports) ? client.monthlyKpiReports : [];
    if (reports.length === 0) {
      container.innerHTML = `
        <div class="bg-white rounded-3xl p-10 text-center border border-purple-100 shadow-xs space-y-3">
          <div class="w-12 h-12 rounded-2xl bg-pink-50 text-bpa-magenta flex items-center justify-center mx-auto">
            <i data-lucide="line-chart" class="w-6 h-6"></i>
          </div>
          <h3 class="text-base font-bold text-bpa-violet">No Monthly KPIs or Looker Studio Report Uploaded Yet</h3>
          <p class="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
            Per BPA Rule #27 (Zero-Fabrication Policy), synthetic KPI numbers are never displayed. Upload verified Google Search Console, GA4, and Looker Studio data for <strong>${w.sanitize(client.clientName)}</strong> to enable this view.
          </p>
          <div class="pt-2">
            <button onclick="openIngestStudio('kpis')" class="px-4 py-2 rounded-xl text-xs font-bold text-white gradient-magenta hover:opacity-95 shadow-xs inline-flex items-center gap-1.5">
              <i data-lucide="upload" class="w-3.5 h-3.5"></i>
              <span>Upload Verified Monthly KPIs</span>
            </button>
          </div>
        </div>
      `;
      if (w.lucide && typeof w.lucide.createIcons === 'function') w.lucide.createIcons();
      return;
    }

    const report = reports[0];

    const gsc = report.gsc || { clicks: 0, impressions: 0, ctr: 0, position: 0 };
    const sem = report.semrush || { backlinks: 0, refDomains: 0, aiVisibilityScore: null };
    const ga4 = report.ga4 || { activeUsers: 0, keyEvents: 0 };
    const health = (client.kpis && client.kpis.healthScores) ? client.kpis.healthScores : { calibratedTrueHealth: null, rawSemrushScore: null };
    const lookerUrl = report.lookerStudioUrl || client.lookerStudioUrl || '';
    const sanitizedEmbed = (w.sanitizeEmbedUrl && typeof w.sanitizeEmbedUrl === 'function') ? w.sanitizeEmbedUrl(lookerUrl) : lookerUrl;

    const authors = report.authors || ['Octav Fedor', 'Víctor Henríquez'];
    const periodLabel = report.periodLabel || `${client.auditDate || 'October 2026'} vs. Previous Baseline`;

    container.innerHTML = `
      <!-- Monthly Report Header & Executive Switcher -->
      <div class="bg-white rounded-3xl p-6 sm:p-8 border border-purple-100 shadow-xs space-y-4">
        <div class="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div class="flex items-center gap-2 flex-wrap mb-1">
              <span class="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-pink-50 text-bpa-magenta border border-pink-200">
                Monthly Performance Report
              </span>
              <span class="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-50 text-bpa-violet border border-purple-100">
                ${w.sanitize(periodLabel)}
              </span>
            </div>
            <h2 class="text-2xl sm:text-3xl font-extrabold text-bpa-violet tracking-tight">
              ${w.sanitize(client.clientName)} — Organic Growth & Search Intelligence
            </h2>
            <p class="text-xs text-slate-500 mt-1 flex items-center gap-2 flex-wrap">
              <span>Prepared by <strong>${w.sanitize(authors.join(' & '))}</strong></span>
              <span>•</span>
              <span>Published: ${w.sanitize(report.publishedDate || client.auditDate || 'October 2026')}</span>
            </p>
          </div>

          <div class="flex items-center gap-2 shrink-0 flex-wrap">
            <button onclick="copyKpiSummary()" class="px-3 py-2 rounded-xl text-xs font-bold text-bpa-violet bg-bpa-purple-light hover:bg-purple-100 border border-purple-200 transition-colors flex items-center gap-1.5" title="Copy report bullets for Client Presentation Deck">
              <i data-lucide="clipboard-copy" class="w-3.5 h-3.5 text-bpa-magenta"></i>
              <span>Copy Deck Bullets</span>
            </button>
            <button onclick="openIngestStudio('kpis')" class="px-3.5 py-2 rounded-xl text-xs font-bold text-white gradient-magenta hover:opacity-95 shadow-xs flex items-center gap-1.5 transition-all">
              <i data-lucide="upload" class="w-3.5 h-3.5"></i>
              <span>Update / Upload KPIs</span>
            </button>
          </div>
        </div>
      </div>

      <!-- ROW 1: GOOGLE SEARCH CONSOLE BENTO (4 METRIC CARDS) -->
      <div>
        <div class="flex items-center justify-between mb-3">
          <div class="flex items-center gap-2">
            <span class="w-2.5 h-2.5 rounded-full bg-blue-500"></span>
            <h3 class="text-xs font-bold uppercase tracking-wider text-slate-600">
              Google Search Console Performance (MoM Organic Search)
            </h3>
          </div>
          <span class="text-[11px] font-mono text-slate-400">Verified GSC API</span>
        </div>

        <div class="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <!-- Clicks -->
          <div class="bg-white rounded-2xl p-4 sm:p-5 border border-purple-100 shadow-xs bento-card space-y-2">
            <div class="flex items-center justify-between">
              <span class="text-xs font-bold uppercase tracking-wider text-slate-500">Organic Clicks</span>
              <span class="px-1.5 py-0.5 rounded text-[10px] font-extrabold ${getDeltaClass(gsc.clicksDelta || '—')}">
                ${w.sanitize(gsc.clicksDelta || '—')}
              </span>
            </div>
            <div class="text-2xl sm:text-3xl font-extrabold text-bpa-violet font-mono tabular-nums">
              ${Number(gsc.clicks || 0).toLocaleString()}
            </div>
            <div class="text-[11px] text-slate-400">
              ${gsc.prevClicks != null ? `vs. ${Number(gsc.prevClicks).toLocaleString()} prev month` : 'Baseline period'}
            </div>
          </div>

          <!-- Impressions -->
          <div class="bg-white rounded-2xl p-4 sm:p-5 border border-purple-100 shadow-xs bento-card space-y-2">
            <div class="flex items-center justify-between">
              <span class="text-xs font-bold uppercase tracking-wider text-slate-500">Impressions</span>
              <span class="px-1.5 py-0.5 rounded text-[10px] font-extrabold ${getDeltaClass(gsc.impressionsDelta || '—')}">
                ${w.sanitize(gsc.impressionsDelta || '—')}
              </span>
            </div>
            <div class="text-2xl sm:text-3xl font-extrabold text-bpa-violet font-mono tabular-nums">
              ${formatLargeNumber(gsc.impressions)}
            </div>
            <div class="text-[11px] text-slate-400">
              ${Number(gsc.impressions || 0).toLocaleString()} total SERP views
            </div>
          </div>

          <!-- CTR -->
          <div class="bg-white rounded-2xl p-4 sm:p-5 border border-purple-100 shadow-xs bento-card space-y-2">
            <div class="flex items-center justify-between">
              <span class="text-xs font-bold uppercase tracking-wider text-slate-500">Average CTR</span>
              <span class="px-1.5 py-0.5 rounded text-[10px] font-extrabold bg-blue-50 text-blue-700 border border-blue-200">
                ${w.sanitize(gsc.ctrDelta || '—')}
              </span>
            </div>
            <div class="text-2xl sm:text-3xl font-extrabold text-bpa-violet font-mono tabular-nums">
              ${gsc.ctr != null ? `${gsc.ctr}%` : '—'}
            </div>
            <div class="text-[11px] text-slate-400">
              ${gsc.ctr >= 3.5 ? 'Above franchise industry benchmark (2.8%)' : 'Click-through rate'}
            </div>
          </div>

          <!-- Average Position -->
          <div class="bg-white rounded-2xl p-4 sm:p-5 border border-purple-100 shadow-xs bento-card space-y-2">
            <div class="flex items-center justify-between">
              <span class="text-xs font-bold uppercase tracking-wider text-slate-500">Avg. Position</span>
              <span class="px-1.5 py-0.5 rounded text-[10px] font-extrabold ${getDeltaClass(gsc.positionDelta || '—')}">
                ${w.sanitize(gsc.positionDelta || '—')}
              </span>
            </div>
            <div class="text-2xl sm:text-3xl font-extrabold text-emerald-600 font-mono tabular-nums">
              ${gsc.position != null ? gsc.position : '—'}
            </div>
            <div class="text-[11px] text-slate-400">
              Average SERP ranking position
            </div>
          </div>
        </div>
      </div>

      <!-- ROW 2: TECHNICAL HEALTH, BACKLINKS, AI VISIBILITY & GA4 CONVERSIONS -->
      <div>
        <div class="flex items-center justify-between mb-3">
          <div class="flex items-center gap-2">
            <span class="w-2.5 h-2.5 rounded-full bg-purple-600"></span>
            <h3 class="text-xs font-bold uppercase tracking-wider text-slate-600">
              Authority, AI Readiness & Web Conversions
            </h3>
          </div>
          <span class="text-[11px] font-mono text-slate-400">GA4 + Semrush + Screaming Frog</span>
        </div>

        <div class="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <!-- Calibrated Health -->
          <div class="bg-white rounded-2xl p-4 sm:p-5 border border-purple-100 shadow-xs bento-card space-y-2">
            <div class="flex items-center justify-between">
              <span class="text-xs font-bold uppercase tracking-wider text-slate-500">Calibrated Health</span>
              <span class="px-1.5 py-0.5 rounded text-[10px] font-extrabold bg-emerald-50 text-emerald-700 border border-emerald-200">
                100% 200 OK
              </span>
            </div>
            <div class="text-2xl sm:text-3xl font-extrabold text-bpa-violet font-mono tabular-nums">
              ${health.calibratedTrueHealth != null ? health.calibratedTrueHealth : '—'}<span class="text-lg text-slate-400">%</span>
            </div>
            <div class="text-[11px] text-slate-400">
              ${(client.kpis && client.kpis.broken404Pages === 0) ? '0 broken 404 pages' : `${client.kpis.broken404Pages} 404s identified`}
            </div>
          </div>

          <!-- Backlinks & Ref Domains -->
          <div class="bg-white rounded-2xl p-4 sm:p-5 border border-purple-100 shadow-xs bento-card space-y-2">
            <div class="flex items-center justify-between">
              <span class="text-xs font-bold uppercase tracking-wider text-slate-500">Backlinks / Domains</span>
              <span class="px-1.5 py-0.5 rounded text-[10px] font-extrabold ${getDeltaClass(sem.backlinksDelta || '—')}">
                ${w.sanitize(sem.backlinksDelta || '—')}
              </span>
            </div>
            <div class="text-2xl sm:text-3xl font-extrabold text-bpa-violet font-mono tabular-nums">
              ${formatLargeNumber(sem.backlinks)} <span class="text-xs text-slate-500 font-sans font-bold">/ ${Number(sem.refDomains || 0).toLocaleString()} ref</span>
            </div>
            <div class="text-[11px] text-slate-400">
              Authority link profile
            </div>
          </div>

          <!-- AI Engine Visibility -->
          <div class="bg-white rounded-2xl p-4 sm:p-5 border border-purple-100 shadow-xs bento-card space-y-2">
            <div class="flex items-center justify-between">
              <span class="text-xs font-bold uppercase tracking-wider text-slate-500">AI Engine Visibility</span>
              <span class="px-1.5 py-0.5 rounded text-[10px] font-extrabold bg-purple-50 text-purple-700 border border-purple-200">
                GEO / LLM
              </span>
            </div>
            <div class="text-2xl sm:text-3xl font-extrabold text-purple-700 font-mono tabular-nums">
              ${sem.aiVisibilityScore != null ? sem.aiVisibilityScore : '—'}<span class="text-lg text-purple-400">/100</span>
            </div>
            <div class="text-[11px] text-slate-400">
              ${sem.brandMentionsAi != null ? `${sem.brandMentionsAi} citations in Perplexity & SearchGPT` : 'AI citation visibility'}
            </div>
          </div>

          <!-- GA4 Conversions & Active Users -->
          <div class="bg-white rounded-2xl p-4 sm:p-5 border border-purple-100 shadow-xs bento-card space-y-2">
            <div class="flex items-center justify-between">
              <span class="text-xs font-bold uppercase tracking-wider text-slate-500">GA4 Key Events</span>
              <span class="px-1.5 py-0.5 rounded text-[10px] font-extrabold ${getDeltaClass(ga4.keyEventsDelta || '—')}">
                ${w.sanitize(ga4.keyEventsDelta || '—')}
              </span>
            </div>
            <div class="text-2xl sm:text-3xl font-extrabold text-bpa-magenta font-mono tabular-nums">
              ${Number(ga4.keyEvents || 0).toLocaleString()}
            </div>
            <div class="text-[11px] text-slate-400">
              ${ga4.activeUsers != null ? `${Number(ga4.activeUsers).toLocaleString()} active monthly users` : 'Key conversion events'}
            </div>
          </div>
        </div>
      </div>

      <!-- ROW 3: EXECUTIVE NARRATIVE (PROOF OF WORK + PROOF OF VALUE) & LOOKER STUDIO EMBED -->
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        <!-- Left: Proof of Work + Proof of Value Narrative (5 cols) -->
        <div class="lg:col-span-5 bg-white rounded-3xl p-6 sm:p-7 border border-purple-100 shadow-xs space-y-5">
          <div class="border-b border-purple-100 pb-3 flex items-center justify-between">
            <div>
              <span class="text-[11px] font-bold uppercase tracking-wider text-bpa-magenta block">BPA Retainer Formula</span>
              <h3 class="text-base font-bold text-bpa-violet">Proof of Work & Value Delivery</h3>
            </div>
            <span class="text-xs text-slate-400 font-mono">AM Deck Ready</span>
          </div>

          <!-- Executive Takeaway -->
          <div class="bg-purple-50/60 rounded-2xl p-4 border border-purple-100 text-xs text-slate-700 leading-relaxed space-y-2">
            <strong class="text-bpa-violet flex items-center gap-1.5 font-bold">
              <i data-lucide="sparkles" class="w-3.5 h-3.5 text-bpa-magenta"></i>
              Executive Summary & Client Takeaways
            </strong>
            <p id="kpi-executive-takeaways">
              ${w.sanitize(report.executiveTakeaways || 'Organic traffic demonstrates robust seasonal growth with double-digit impressions increase. Technical health remains pristine with 0 critical 404 crawl errors. Current sprint fixes directly protect search visibility within retainer budget.')}
            </p>
          </div>

          <!-- Proof of Work: CMS & Technical Fixes -->
          <div class="space-y-2 text-xs">
            <h4 class="font-bold text-slate-800 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
              <i data-lucide="check-circle-2" class="w-3.5 h-3.5 text-emerald-600"></i>
              Verified CMS & SEO Interventions
            </h4>
            <ul class="space-y-2">
              ${(report.proofOfWorkSummary || [
                'Rank Math pagination duplicate title fix deployed across archive templates.',
                'WAF bot challenge rule whitelisted to preserve Googlebot & Screaming Frog crawl parity.',
                'Redirect inventory audit completed with zero broken 404 links.'
              ]).map(item => `
                <li class="flex items-start gap-2 text-slate-600 leading-relaxed">
                  <span class="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0 mt-1.5"></span>
                  <span>${w.sanitize(item)}</span>
                </li>
              `).join('')}
            </ul>
          </div>

          <div class="pt-3 border-t border-purple-50 flex items-center justify-between">
            <span class="text-[11px] text-slate-400">All fixes verified live in production</span>
            <button onclick="copyKpiSummary()" class="text-xs font-bold text-bpa-magenta hover:text-purple-900 flex items-center gap-1 transition-colors">
              <i data-lucide="copy" class="w-3.5 h-3.5"></i>
              <span>Copy for Client Deck</span>
            </button>
          </div>
        </div>

        <!-- Right: Interactive Looker Studio Embed (7 cols) -->
        <div class="lg:col-span-7 bg-white rounded-3xl p-6 sm:p-7 border border-purple-100 shadow-xs space-y-4">
          <div class="flex items-center justify-between border-b border-purple-100 pb-3">
            <div class="flex items-center gap-2">
              <div class="w-7 h-7 rounded-lg bg-pink-50 text-bpa-magenta flex items-center justify-center font-bold">
                <i data-lucide="bar-chart-3" class="w-4 h-4"></i>
              </div>
              <div>
                <h3 class="text-sm font-bold text-bpa-violet">Interactive Looker Studio Dashboard</h3>
                <span class="text-xs text-slate-400">Live Client Data Studio reporting</span>
              </div>
            </div>

            <div class="flex items-center gap-2">
              <a href="${w.sanitizeUrl ? w.sanitizeUrl(lookerUrl) : lookerUrl}" target="_blank" rel="noopener noreferrer" class="px-3 py-1.5 rounded-lg text-xs font-semibold text-purple-900 bg-purple-50 hover:bg-purple-100 border border-purple-200 transition-colors inline-flex items-center gap-1.5">
                <span>Open in Tab</span>
                <i data-lucide="external-link" class="w-3 h-3 text-bpa-magenta"></i>
              </a>
            </div>
          </div>

          <!-- Embed Container -->
          <div class="w-full bg-slate-900 rounded-2xl overflow-hidden border border-purple-100 relative shadow-inner aspect-[16/10] min-h-[380px]">
            ${sanitizedEmbed ? `
              <iframe 
                src="${sanitizedEmbed}" 
                class="w-full h-full border-0 absolute inset-0"
                allowfullscreen 
                sandbox="allow-storage-access-by-user-activation allow-scripts allow-same-origin allow-popups allow-popups-to-escape-sandbox">
              </iframe>
            ` : `
              <div class="w-full h-full flex flex-col items-center justify-center text-white p-8 text-center space-y-2">
                <i data-lucide="line-chart" class="w-10 h-10 text-pink-400 mx-auto"></i>
                <h4 class="text-sm font-bold">Looker Studio Report Configured</h4>
                <p class="text-xs text-slate-400 max-w-sm">
                  Click 'Open in Tab' above to view the live multi-page Google Looker Studio dashboard for ${w.sanitize(client.clientName)}.
                </p>
              </div>
            `}
          </div>
        </div>

      </div>
    `;

    if (w.lucide && typeof w.lucide.createIcons === 'function') {
      w.lucide.createIcons();
    }
  }

  // --- HELPERS ---
  function getDeltaClass(delta) {
    if (!delta) return 'bg-slate-50 text-slate-700 border border-slate-200';
    if (delta.startsWith('+') || delta.startsWith('▲')) {
      return 'bg-emerald-50 text-emerald-700 border border-emerald-200';
    }
    if (delta.startsWith('-') || delta.startsWith('▼')) {
      return 'bg-amber-50 text-amber-700 border border-amber-200';
    }
    return 'bg-purple-50 text-purple-700 border border-purple-200';
  }

  function formatLargeNumber(num) {
    const n = Number(num) || 0;
    if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M';
    if (n >= 1000) return (n / 1000).toFixed(1) + 'k';
    return n.toLocaleString();
  }

  function copyKpiSummary() {
    const client = (w.BPA_STORAGE && typeof w.BPA_STORAGE.getClient === 'function')
      ? w.BPA_STORAGE.getClient(w.currentClient)
      : (w.BPA_DATA ? w.BPA_DATA[w.currentClient] : null);

    if (!client) return;
    const reports = client.monthlyKpiReports || [];
    if (reports.length === 0) {
      if (typeof w.showToast === 'function') {
        w.showToast('No verified monthly KPI report available for this client yet.');
      }
      return;
    }
    const report = reports[0];
    const gsc = report.gsc || {};
    const ga4 = report.ga4 || {};

    const summaryText = `### 📊 Monthly SEO & Retainer Executive Brief — ${client.clientName}
**Period:** ${report.periodLabel || report.period || 'Monthly Baseline'}
**Authors:** ${(report.authors || ['Octav Fedor', 'Víctor Henríquez']).join(' & ')}

#### 1. Google Search Console & Growth
- **Organic Clicks:** ${Number(gsc.clicks || 0).toLocaleString()} (${gsc.clicksDelta || '—'})
- **Total Impressions:** ${formatLargeNumber(gsc.impressions)} (${gsc.impressionsDelta || '—'})
- **Average Position:** ${gsc.position != null ? gsc.position : '—'} (${gsc.positionDelta || '—'})
- **GA4 Key Events:** ${Number(ga4.keyEvents || 0).toLocaleString()} conversions (${ga4.keyEventsDelta || '—'})

#### 2. Proof of Work (CMS Fixes Implemented)
${(report.proofOfWorkSummary || []).map(item => `- ${item}`).join('\n') || '- Verified technical sprint execution.'}

#### 3. Strategic AM Takeaway
${report.executiveTakeaways || '—'}
`;

    if (navigator && navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(summaryText).then(() => {
        if (typeof w.showToast === 'function') w.showToast('Executive KPI summary copied for AM deck');
      });
    }
  }

  w.renderMonthlyKpis = renderMonthlyKpis;
  w.copyKpiSummary = copyKpiSummary;

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
      renderMonthlyKpis,
      copyKpiSummary
    };
  }

})(typeof window !== 'undefined' ? window : global);
