/**
 * Bright Pink Agency Technical Audit Hub - Chart Visualizations
 * Manages Chart.js rendering for HTTP distribution, click depth, and retainer workload.
 */

window.BPA_CHARTS = {
  chartStatusInstance: null,
  chartDepthInstance: null,
  chartWorkloadInstance: null,

  /**
   * Renders or updates all interactive charts for the specified client dataset
   * @param {Object} data Client data object
   */
  renderCharts: function(data) {
    if (typeof Chart === 'undefined') return;

    try {
      // 1. Doughnut: HTTP Status Code Distribution
      const canvasStatus = document.getElementById('chart-status');
      if (canvasStatus) {
        const ctxStatus = canvasStatus.getContext('2d');
        if (this.chartStatusInstance) this.chartStatusInstance.destroy();

        const clean200 = (data.kpis && data.kpis.clean200HtmlPages) || 916;
        const red301 = (data.kpis && data.kpis.internal301Redirects) || 245;
        const waf403 = (data.kpis && data.kpis.wafFalsePositive403) || 818;
        const err404 = (data.kpis && data.kpis.broken404Pages) || 2;

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

        const depths = (data.kpis && data.kpis.crawlDepthBreakdown) || { level1: 1, level2: 138, level3: 724, level4Plus: 84 };

        let depthLabels = ['Level 1 (Home)', 'Level 2', 'Level 3', 'Level 4+'];
        let depthValues = [depths.level1 || 0, depths.level2 || 0, depths.level3 || 0, depths.level4Plus || 0];
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
              legend: { display: false }
            },
            scales: {
              y: { beginAtZero: true, grid: { color: '#F3E8F9' }, ticks: { font: { size: 10 } } },
              x: { grid: { display: false }, ticks: { font: { size: 10 } } }
            }
          }
        });
      }

      // 3. Pie Chart: Workload & Hours Distribution
      const canvasWorkload = document.getElementById('chart-workload');
      if (canvasWorkload) {
        const ctxWorkload = canvasWorkload.getContext('2d');
        if (this.chartWorkloadInstance) this.chartWorkloadInstance.destroy();

        const sprintMins = (data.sprintSummary && data.sprintSummary.totalEstimatedMinutes) || 45;

        this.chartWorkloadInstance = new Chart(ctxWorkload, {
          type: 'pie',
          data: {
            labels: [
              'Current Sprint (45m)',
              'Backlog Phase 2 (4.0h)',
              'Backlog Phase 3 (4.5h)'
            ],
            datasets: [{
              data: [sprintMins, 240, 270],
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
