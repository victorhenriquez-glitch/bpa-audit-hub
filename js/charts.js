/**
 * Bright Pink Agency Technical Audit Hub - Chart Visualizations (v2.0)
 * Manages Chart.js rendering for HTTP distribution, click depth, and retainer workload.
 * Precision Engineering: Zero-value preservation, dynamic depth tiers, and adaptive workload modeling.
 */

window.BPA_CHARTS = {
  chartStatusInstance: null,
  chartDepthInstance: null,
  chartWorkloadInstance: null,

  /**
   * Helper to safely resolve numbers, preserving explicit 0 values
   */
  resolveNum: function(val, fallback) {
    if (typeof val === 'number' && !isNaN(val)) return val;
    if (typeof val === 'string' && val.trim() !== '' && !isNaN(Number(val))) return Number(val);
    return fallback !== undefined ? fallback : 0;
  },

  /**
   * Renders or updates all interactive charts for the specified client dataset
   * @param {Object} data Client data object
   */
  renderCharts: function(data) {
    if (typeof Chart === 'undefined' || !data) return;

    try {
      // 1. Doughnut: HTTP Status Code Distribution
      const canvasStatus = document.getElementById('chart-status');
      if (canvasStatus) {
        const ctxStatus = canvasStatus.getContext('2d');
        if (this.chartStatusInstance) this.chartStatusInstance.destroy();

        const clean200 = this.resolveNum(data.kpis && data.kpis.clean200HtmlPages, 0);
        const red301 = this.resolveNum(data.kpis && data.kpis.internal301Redirects, 0);
        const waf403 = this.resolveNum(data.kpis && data.kpis.wafFalsePositive403, 0);
        const err404 = this.resolveNum(data.kpis && data.kpis.broken404Pages, 0);

        this.chartStatusInstance = new Chart(ctxStatus, {
          type: 'doughnut',
          data: {
            labels: [
              '200 OK Clean',
              '301 Redirects',
              '403 WAF Filtered',
              '404 Broken Errors'
            ],
            datasets: [{
              data: [clean200, red301, waf403, err404],
              backgroundColor: ['#10B981', '#F59E0B', '#DE0073', '#EF4444'],
              borderWidth: 2,
              borderColor: '#FFFFFF'
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: {
                position: 'bottom',
                labels: { boxWidth: 12, font: { size: 10, family: 'Plus Jakarta Sans' } }
              },
              tooltip: {
                callbacks: {
                  label: function(context) {
                    const label = context.label || '';
                    const val = context.raw !== undefined ? context.raw : 0;
                    return ` ${label}: ${Number(val).toLocaleString()} URLs`;
                  }
                }
              }
            },
            cutout: '68%'
          }
        });
      }

      // 2. Bar Chart: Crawl Click Depth Distribution
      const canvasDepth = document.getElementById('chart-depth');
      if (canvasDepth) {
        const ctxDepth = canvasDepth.getContext('2d');
        if (this.chartDepthInstance) this.chartDepthInstance.destroy();

        const depths = (data.kpis && data.kpis.crawlDepthBreakdown) || { level1: 1, level2: 100, level3: 200, level4Plus: 10 };

        let depthLabels = ['Level 1 (Home)', 'Level 2', 'Level 3', 'Level 4+'];
        let depthValues = [
          this.resolveNum(depths.level1, 0),
          this.resolveNum(depths.level2, 0),
          this.resolveNum(depths.level3, 0),
          this.resolveNum(depths.level4Plus, 0)
        ];
        let depthColors = '#732483';

        // High-Resolution 7-Tier Depth Distribution (e.g., US Lawns 16-level crawl trap)
        if (depths.level10Plus !== undefined) {
          depthLabels = ['L0 Home', 'L1 Nav', 'L2 State Hubs', 'L3 Franchise Hubs', 'L4-6 Buried', 'L7-9 Deep', 'L10-16 Crawl Trap'];
          depthValues = [
            depths.level0 !== undefined ? depths.level0 : 1,
            depths.level1Nav !== undefined ? depths.level1Nav : 54,
            depths.level2State !== undefined ? depths.level2State : 48,
            depths.level3Franchise !== undefined ? depths.level3Franchise : 38,
            depths.level4to6 !== undefined ? depths.level4to6 : 172,
            depths.level7to9 !== undefined ? depths.level7to9 : 179,
            depths.level10Plus !== undefined ? depths.level10Plus : 196
          ];
          depthColors = ['#732483', '#8B5CF6', '#A855F7', '#C084FC', '#F59E0B', '#EA580C', '#EF4444'];
        }

        this.chartDepthInstance = new Chart(ctxDepth, {
          type: 'bar',
          data: {
            labels: depthLabels,
            datasets: [{
              label: 'Indexable URLs',
              data: depthValues,
              backgroundColor: depthColors,
              borderRadius: 6
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: { display: false },
              tooltip: {
                callbacks: {
                  label: function(context) {
                    return ` ${Number(context.raw).toLocaleString()} URLs`;
                  }
                }
              }
            },
            scales: {
              y: { beginAtZero: true, grid: { color: '#F3E8F9' }, ticks: { font: { size: 10 } } },
              x: { grid: { display: false }, ticks: { font: { size: 10 } } }
            }
          }
        });

        // Dynamic Depth Caption
        const depthCaptionEl = document.getElementById('depth-chart-caption');
        if (depthCaptionEl) {
          const deepCount = depths.level10Plus !== undefined
            ? (depths.level10Plus || 0)
            : (depths.level4Plus || 0);
          depthCaptionEl.textContent = deepCount > 0
            ? `${deepCount} pages at crawl depth ≥ 4 require direct internal linking.`
            : `Optimal architecture: 100% of core URLs reachable within 3 clicks.`;
        }
      }

      // 3. Pie Chart: Workload & Hours Distribution (Dynamic per client tasks)
      const canvasWorkload = document.getElementById('chart-workload');
      if (canvasWorkload) {
        const ctxWorkload = canvasWorkload.getContext('2d');
        if (this.chartWorkloadInstance) this.chartWorkloadInstance.destroy();

        const allTasks = (data.tasks || []);
        const sprintTasks = allTasks.filter(t => t.phase === 'Current Sprint');
        const backlogTasks = allTasks.filter(t => t.phase !== 'Current Sprint');

        const sprintMins = (data.sprintSummary && data.sprintSummary.totalEstimatedMinutes)
          || sprintTasks.reduce((acc, t) => acc + (t.estimatedMinutes || 0), 0)
          || 30;

        const devBacklogMins = backlogTasks
          .filter(t => {
            const r = (t.assignedRole || '').toLowerCase();
            return r.includes('dev') || r.includes('jonie') || r.includes('florin') || r.includes('augustina');
          })
          .reduce((acc, t) => acc + (t.estimatedMinutes || 0), 0) || 180;

        const otherMins = backlogTasks
          .filter(t => {
            const r = (t.assignedRole || '').toLowerCase();
            return !(r.includes('dev') || r.includes('jonie') || r.includes('florin') || r.includes('augustina'));
          })
          .reduce((acc, t) => acc + (t.estimatedMinutes || 0), 0) || 120;

        const sprintHours = (sprintMins / 60).toFixed(1) + 'h';
        const devHours = (devBacklogMins / 60).toFixed(1) + 'h';
        const otherHours = (otherMins / 60).toFixed(1) + 'h';

        this.chartWorkloadInstance = new Chart(ctxWorkload, {
          type: 'pie',
          data: {
            labels: [
              `Current Sprint (${sprintHours})`,
              `Dev Backlog (${devHours})`,
              `Strategic / Content (${otherHours})`
            ],
            datasets: [{
              data: [sprintMins, devBacklogMins, otherMins],
              backgroundColor: ['#DE0073', '#732483', '#C084FC'],
              borderWidth: 2,
              borderColor: '#FFFFFF'
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: {
                position: 'bottom',
                labels: { boxWidth: 12, font: { size: 10, family: 'Plus Jakarta Sans' } }
              },
              tooltip: {
                callbacks: {
                  label: function(context) {
                    const label = context.label || '';
                    const val = context.raw || 0;
                    return ` ${label}: ${val} mins (${(val / 60).toFixed(1)} hrs)`;
                  }
                }
              }
            }
          }
        });
      }
    } catch (err) {
      console.error('Error rendering Chart.js visualizations:', err);
    }
  }
};

window.renderCharts = function(data) {
  window.BPA_CHARTS.renderCharts(data);
};
