/**
 * Bright Pink Agency Technical Audit Hub - Task Workflow & Workspace Module
 * Handles workspace tab switching, task completion lifecycle, sprint progress tracking,
 * auditable history rendering, and reversible status updates.
 */

(function(global) {
  'use strict';

  const w = (typeof window !== 'undefined') ? window : global;
  w.currentWorkspaceTab = 'audit';
  let lastCompletedTaskId = null;

  // --- 1. WORKSPACE TAB SWITCHER ---
  function switchWorkspaceTab(tabId) {
    if (!tabId) tabId = 'audit';
    w.currentWorkspaceTab = tabId;

    const tabs = ['audit', 'kpis', 'history', 'ai-bridge'];
    tabs.forEach(id => {
      const btn = document.getElementById(`tab-btn-${id}`);
      const view = document.getElementById(`workspace-view-${id}`);

      if (btn) {
        if (id === tabId) {
          btn.className = 'flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all bg-bpa-purple-light text-bpa-violet border border-purple-200 shadow-xs';
          btn.setAttribute('aria-selected', 'true');
        } else {
          btn.className = 'flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:text-bpa-violet transition-all';
          btn.setAttribute('aria-selected', 'false');
        }
      }

      if (view) {
        if (id === tabId) {
          view.classList.remove('hidden');
        } else {
          view.classList.add('hidden');
        }
      }
    });

    const client = (w.BPA_STORAGE && typeof w.BPA_STORAGE.getClient === 'function')
      ? w.BPA_STORAGE.getClient(w.currentClient)
      : (w.BPA_DATA ? w.BPA_DATA[w.currentClient] : null);

    if (client) {
      if (tabId === 'history') {
        renderCompletedHistory(client);
      } else if (tabId === 'kpis' && typeof w.renderMonthlyKpis === 'function') {
        w.renderMonthlyKpis(client);
      } else if (tabId === 'ai-bridge' && typeof w.renderAiInspectorBridge === 'function') {
        w.renderAiInspectorBridge(client);
      }
    }

    if (w.lucide && typeof w.lucide.createIcons === 'function') {
      w.lucide.createIcons();
    }
  }

  // --- 2. SPRINT PROGRESS TRACKER ---
  function updateSprintProgressBar(client) {
    if (!client) return;

    const activeTasks = client.tasks || [];
    const completedTasks = client.completedTasks || [];

    // Active sprint tasks
    const activeSprint = activeTasks.filter(t => t.phase === 'Current Sprint');
    // Completed sprint tasks (either originally phase === 'Current Sprint' or has sprintOrder / sprint tag)
    const completedSprint = completedTasks.filter(t => t.phase === 'Current Sprint' || t.sprintOrder || (t.id && t.id.includes('SPRINT')));

    const totalSprintTasks = activeSprint.length + completedSprint.length;
    const completedCount = completedSprint.length;
    const percent = totalSprintTasks > 0 ? Math.round((completedCount / totalSprintTasks) * 100) : 0;

    let remainingMinutes = 0;
    activeSprint.forEach(t => {
      remainingMinutes += (Number(t.estimatedMinutes) || 0);
    });

    const elLabel = document.getElementById('sprint-progress-label');
    const elRemaining = document.getElementById('sprint-progress-remaining');
    const elBar = document.getElementById('sprint-progress-bar');
    const elBadge = document.getElementById('tab-count-completed-badge');

    if (elLabel) {
      elLabel.textContent = `Sprint Progress: ${completedCount} of ${totalSprintTasks} Tasks Completed (${percent}%)`;
    }

    if (elRemaining) {
      if (remainingMinutes > 0) {
        const hrs = (remainingMinutes / 60).toFixed(remainingMinutes % 60 === 0 ? 0 : 1);
        elRemaining.textContent = `${remainingMinutes} min (${hrs} hrs) remaining`;
      } else if (totalSprintTasks > 0 && completedCount === totalSprintTasks) {
        elRemaining.textContent = `🎉 100% Sprint Completed!`;
      } else {
        elRemaining.textContent = `0 min remaining`;
      }
    }

    if (elBar) {
      if (!elBar.style) elBar.style = {};
      elBar.style.width = `${percent}%`;
      if (percent === 100) {
        elBar.className = 'bg-gradient-to-r from-emerald-400 to-teal-400 h-full rounded-full transition-all duration-500';
      } else {
        elBar.className = 'bg-gradient-to-r from-pink-500 via-purple-400 to-emerald-400 h-full rounded-full transition-all duration-500';
      }
    }

    if (elBadge) {
      elBadge.textContent = completedTasks.length;
    }
  }

  // --- 3. TASK COMPLETION MODAL & CONFIRMATION ---
  function promptCompleteTask(taskId) {
    const client = (w.BPA_STORAGE && typeof w.BPA_STORAGE.getClient === 'function')
      ? w.BPA_STORAGE.getClient(w.currentClient)
      : (w.BPA_DATA ? w.BPA_DATA[w.currentClient] : null);

    if (!client || !client.tasks) return;
    const task = client.tasks.find(t => t.id === taskId);
    if (!task) return;

    const modal = document.getElementById('task-completion-modal');
    if (!modal) {
      // Direct execution fallback if modal element is not in DOM
      executeCompleteTask(taskId, {
        author: task.assignedRole || 'Víctor Henríquez',
        investedMinutes: task.estimatedMinutes || 15,
        summary: `Verified completed by ${task.assignedRole || 'Víctor Henríquez'}.`
      });
      return;
    }

    const elId = document.getElementById('complete-modal-task-id');
    const elTitle = document.getElementById('complete-modal-task-title');
    const elMins = document.getElementById('complete-modal-minutes');
    const elAuthor = document.getElementById('complete-modal-author');
    const elSummary = document.getElementById('complete-modal-summary');
    const btnConfirm = document.getElementById('complete-modal-confirm-btn');

    if (elId) elId.textContent = task.id;
    if (elTitle) elTitle.textContent = task.title_en || task.title;
    if (elMins) elMins.value = task.estimatedMinutes || 15;
    if (elAuthor) elAuthor.value = task.assignedRole || 'Víctor Henríquez';
    if (elSummary) elSummary.value = `Verified completed according to acceptance criteria.`;

    if (btnConfirm) {
      btnConfirm.onclick = function() {
        const investedMins = elMins ? Number(elMins.value) || task.estimatedMinutes || 15 : 15;
        const author = elAuthor ? elAuthor.value : task.assignedRole;
        const summary = elSummary && elSummary.value.trim() ? elSummary.value.trim() : `Completed by ${author}.`;

        executeCompleteTask(taskId, {
          author: author,
          investedMinutes: investedMins,
          summary: summary
        });

        closeTaskCompletionModal();
      };
    }

    modal.classList.remove('hidden');
    modal.classList.add('flex');
    if (document.body && document.body.classList) {
      document.body.classList.add('overflow-hidden');
    }
  }

  function closeTaskCompletionModal() {
    const modal = document.getElementById('task-completion-modal');
    if (modal) {
      modal.classList.add('hidden');
      modal.classList.remove('flex');
    }
    if (document.body && document.body.classList) {
      document.body.classList.remove('overflow-hidden');
    }
  }

  // --- 4. EXECUTE TASK COMPLETION ---
  function executeCompleteTask(taskId, options, clientSlug) {
    if (!w.BPA_STORAGE || typeof w.BPA_STORAGE.updateTaskStatus !== 'function') {
      console.error('BPA_STORAGE.updateTaskStatus is unavailable');
      return false;
    }

    let targetClient = clientSlug || w.currentClient;
    const currentClientObj = w.BPA_STORAGE.getClient(targetClient);
    if (!currentClientObj || !(currentClientObj.tasks || []).some(t => t.id === taskId)) {
      const allSlugs = typeof w.BPA_STORAGE.getAllClientSlugs === 'function' ? w.BPA_STORAGE.getAllClientSlugs() : Object.keys(w.BPA_DATA || {});
      const foundSlug = allSlugs.find(slug => {
        const c = w.BPA_STORAGE.getClient(slug);
        return c && (c.tasks || []).some(t => t.id === taskId);
      });
      if (foundSlug) targetClient = foundSlug;
    }

    const opts = options || {};
    const success = w.BPA_STORAGE.updateTaskStatus(targetClient, taskId, 'completed', opts);
    if (!success) {
      if (typeof w.showToast === 'function') w.showToast('Unable to complete task.');
      return false;
    }

    lastCompletedTaskId = taskId;

    // Trigger visual refresh
    if (typeof w.renderClient === 'function') {
      w.renderClient(targetClient);
    }

    // Close detail modal if open
    if (typeof w.closeModal === 'function') {
      w.closeModal();
    }

    const mins = opts.investedMinutes || 15;
    if (typeof w.showToast === 'function') {
      w.showToast(`✅ Task ${taskId} marked as completed! ⏱️ ${mins} min logged.`);
    }
    return true;
  }

  // --- 5. REOPEN TASK ---
  function reopenTask(taskId, clientSlug) {
    if (!w.BPA_STORAGE || typeof w.BPA_STORAGE.updateTaskStatus !== 'function') {
      console.error('BPA_STORAGE.updateTaskStatus is unavailable');
      return false;
    }

    let targetClient = clientSlug || w.currentClient;
    const currentClientObj = w.BPA_STORAGE.getClient(targetClient);
    if (!currentClientObj || !(currentClientObj.completedTasks || []).some(t => t.id === taskId)) {
      const allSlugs = typeof w.BPA_STORAGE.getAllClientSlugs === 'function' ? w.BPA_STORAGE.getAllClientSlugs() : Object.keys(w.BPA_DATA || {});
      const foundSlug = allSlugs.find(slug => {
        const c = w.BPA_STORAGE.getClient(slug);
        return c && (c.completedTasks || []).some(t => t.id === taskId);
      });
      if (foundSlug) targetClient = foundSlug;
    }

    const success = w.BPA_STORAGE.updateTaskStatus(targetClient, taskId, 'active');
    if (!success) {
      if (typeof w.showToast === 'function') w.showToast('Unable to reopen task.');
      return false;
    }

    // Refresh UI
    if (typeof w.renderClient === 'function') {
      w.renderClient(targetClient);
    }

    const client = w.BPA_STORAGE.getClient(targetClient);
    if (client && w.currentWorkspaceTab === 'history') {
      renderCompletedHistory(client);
    }

    if (typeof w.showToast === 'function') {
      w.showToast(`↩️ Task ${taskId} reopened and returned to active backlog.`);
    }
    return true;
  }

  // --- 6. RENDER AUDITABLE COMPLETED HISTORY TIMELINE ---
  function renderCompletedHistory(client) {
    const container = document.getElementById('history-timeline-container');
    if (!container) return;
    container.innerHTML = '';

    const completed = client.completedTasks || [];

    // Aggregate summary stats
    let totalInvestedMinutes = 0;
    const authorSet = new Set();
    completed.forEach(t => {
      totalInvestedMinutes += (Number(t.investedMinutes) || 15);
      if (t.verifiedBy || t.assignedRole) authorSet.add(t.verifiedBy || t.assignedRole);
    });

    const totalHours = (totalInvestedMinutes / 60).toFixed(1);

    // Header stats cards
    const statsContainer = document.getElementById('history-stats-container');
    if (statsContainer) {
      statsContainer.innerHTML = `
        <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-6">
          <div class="bg-white rounded-2xl p-4 border border-purple-100 shadow-xs">
            <span class="text-xs font-bold uppercase tracking-wider text-slate-500">Completed Deliverables</span>
            <div class="text-2xl font-extrabold text-emerald-600 font-mono mt-1">${completed.length}</div>
            <div class="text-[11px] text-slate-400">Total historical tasks</div>
          </div>
          <div class="bg-white rounded-2xl p-4 border border-purple-100 shadow-xs">
            <span class="text-xs font-bold uppercase tracking-wider text-slate-500">Invested Retainer Time</span>
            <div class="text-2xl font-extrabold text-bpa-violet font-mono mt-1">${totalHours} <span class="text-sm font-semibold">hrs</span></div>
            <div class="text-[11px] text-slate-400">${totalInvestedMinutes} minutes logged</div>
          </div>
          <div class="bg-white rounded-2xl p-4 border border-purple-100 shadow-xs">
            <span class="text-xs font-bold uppercase tracking-wider text-slate-500">Key Contributors</span>
            <div class="text-2xl font-extrabold text-purple-700 font-mono mt-1">${authorSet.size || 1}</div>
            <div class="text-[11px] text-slate-400">SEO & Dev team</div>
          </div>
          <div class="bg-white rounded-2xl p-4 border border-purple-100 shadow-xs">
            <span class="text-xs font-bold uppercase tracking-wider text-slate-500">Live Health Impact</span>
            <div class="text-2xl font-extrabold text-bpa-magenta font-mono mt-1">${(client.kpis && client.kpis.healthScores) ? client.kpis.healthScores.calibratedTrueHealth : 92}%</div>
            <div class="text-[11px] text-slate-400">Calibrated stability</div>
          </div>
        </div>
      `;
    }

    if (completed.length === 0) {
      container.innerHTML = `
        <div class="bg-white rounded-3xl p-12 text-center border border-purple-100 shadow-xs">
          <i data-lucide="check-circle-2" class="w-12 h-12 text-emerald-300 mx-auto mb-3"></i>
          <h3 class="text-base font-bold text-bpa-violet">No Completed Deliverables Archived Yet</h3>
          <p class="text-xs text-slate-500 max-w-md mx-auto mt-1">
            As tasks in the active sprint are verified and completed, they will be archived here with timestamped audit logs and time allocation.
          </p>
        </div>
      `;
      if (w.lucide && typeof w.lucide.createIcons === 'function') w.lucide.createIcons();
      return;
    }

    // Render Timeline Items
    completed.forEach((task, index) => {
      const card = document.createElement('div');
      card.className = 'relative pl-6 pb-6 border-l-2 border-purple-200 last:border-l-0';

      const title = task.title_en || task.title || 'Untitled Deliverable';
      const summary = task.summary || task.impactSummary_en || task.impactSummary || 'Verified completed in maintenance cycle.';
      const mins = task.investedMinutes !== undefined ? task.investedMinutes : 15;
      const role = task.assignedRole || task.verifiedBy || 'Víctor Henríquez';
      const date = task.completedDate || task.verifiedDate || 'October 2026';
      const proofUrls = task.sampleUrls || [];
      const clickupUrl = task.clickupUrl || '';
      const sheetUrl = task.workbookUrl || client.workbookUrl || '';

      card.innerHTML = `
        <!-- Timeline Dot -->
        <div class="absolute -left-2.5 top-0 w-5 h-5 rounded-full bg-emerald-500 border-4 border-[#FAF7FC] flex items-center justify-center text-white shadow-xs">
          <i data-lucide="check" class="w-2.5 h-2.5"></i>
        </div>

        <!-- Task Card -->
        <div class="bg-white rounded-2xl p-5 border border-purple-100 shadow-xs hover:border-emerald-200 transition-colors space-y-3">
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div class="flex items-center gap-2 flex-wrap">
              <span class="px-2 py-0.5 rounded text-[10px] font-extrabold uppercase bg-emerald-100 text-emerald-800 border border-emerald-200">
                VERIFIED & COMPLETED
              </span>
              ${task.category ? `
                <span class="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-100">
                  ${w.sanitize(task.category)}
                </span>
              ` : ''}
              <span class="text-xs font-mono font-bold text-slate-400">${w.sanitize(task.id)}</span>
              <span class="text-xs text-slate-500 font-semibold">• ${w.sanitize(date)}</span>
            </div>

            <div class="flex flex-wrap items-center gap-2">
              <button onclick="promptEditTaskMinutes('${task.id}', true)" class="text-xs font-mono font-bold text-slate-700 bg-slate-50 hover:bg-purple-50 hover:text-bpa-magenta px-2.5 py-1 rounded-lg border border-slate-200 hover:border-purple-200 transition-colors flex items-center gap-1 cursor-pointer" title="Click to adjust logged minutes">
                <span>⏱️ ${mins} min</span>
                <i data-lucide="pencil" class="w-3 h-3 text-slate-400"></i>
              </button>
              <span class="text-xs font-semibold text-purple-900 bg-purple-50 px-2.5 py-1 rounded-lg border border-purple-100">
                ${w.sanitize(role)}
              </span>
              ${clickupUrl ? `
                <a href="${w.sanitizeUrl ? w.sanitizeUrl(clickupUrl) : w.sanitize(clickupUrl)}" target="_blank" rel="noopener noreferrer" class="px-2.5 py-1 rounded-lg text-xs font-semibold text-pink-900 bg-pink-50 hover:bg-pink-100 border border-pink-200 transition-colors flex items-center gap-1" title="Open verified ClickUp subtask">
                  <i data-lucide="check-square" class="w-3 h-3 text-bpa-magenta"></i>
                  <span>ClickUp</span>
                  <i data-lucide="external-link" class="w-3 h-3 text-bpa-magenta"></i>
                </a>
              ` : ''}
              ${sheetUrl ? `
                <a href="${w.sanitizeUrl ? w.sanitizeUrl(sheetUrl) : w.sanitize(sheetUrl)}" target="_blank" rel="noopener noreferrer" class="px-2.5 py-1 rounded-lg text-xs font-semibold text-emerald-900 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 transition-colors flex items-center gap-1" title="Open in Master Google Sheet">
                  <i data-lucide="sheet" class="w-3 h-3 text-emerald-600"></i>
                  <span>Sheet</span>
                </a>
              ` : ''}
              <button onclick="reopenTask('${task.id}')" class="px-2.5 py-1 rounded-lg text-xs font-semibold text-slate-600 bg-white hover:bg-purple-50 border border-slate-200 hover:border-purple-200 transition-colors flex items-center gap-1" title="Return task to active sprint">
                <i data-lucide="rotate-ccw" class="w-3 h-3 text-purple-600"></i>
                <span>Reopen</span>
              </button>
            </div>
          </div>

          <div>
            <h3 class="text-base font-bold text-slate-900">${w.sanitize(title)}</h3>
            <p class="text-xs text-slate-600 mt-1 leading-relaxed">
              <strong>What Was Verified & Solved:</strong> ${w.sanitize(summary)}
            </p>
          </div>

          ${proofUrls.length > 0 ? `
            <div class="bg-emerald-50/40 rounded-xl border border-emerald-100 p-2.5 text-xs space-y-1.5">
              <div class="font-bold text-emerald-900 flex items-center gap-1.5">
                <i data-lucide="shield-check" class="w-3.5 h-3.5 text-emerald-600"></i>
                <span>Verified Live Proof URLs (${proofUrls.length})</span>
              </div>
              <div class="grid grid-cols-1 gap-1.5">
                ${proofUrls.map(u => {
                  const parsed = (typeof w.parseUrlItem === 'function') ? w.parseUrlItem(u) : { url: String(u) };
                  const cleanUrl = parsed && parsed.url ? parsed.url : String(u);
                  return `
                    <div class="flex items-center justify-between bg-white px-3 py-1.5 rounded-lg border border-emerald-100 font-mono text-[11px] hover:border-emerald-300 transition-colors">
                      <a href="${w.sanitizeUrl ? w.sanitizeUrl(cleanUrl) : w.sanitize(cleanUrl)}" target="_blank" rel="noopener noreferrer" class="text-emerald-800 hover:text-bpa-magenta underline truncate mr-2">${w.sanitize(String(u))}</a>
                      <a href="${w.sanitizeUrl ? w.sanitizeUrl(cleanUrl) : w.sanitize(cleanUrl)}" target="_blank" rel="noopener noreferrer" class="text-emerald-700 hover:text-bpa-magenta shrink-0 flex items-center gap-1 text-[10px] font-sans font-semibold">
                        <span>Open Live Proof</span>
                        <i data-lucide="external-link" class="w-3 h-3"></i>
                      </a>
                    </div>
                  `;
                }).join('')}
              </div>
            </div>
          ` : ''}
        </div>
      `;

      container.appendChild(card);
    });

    if (w.lucide && typeof w.lucide.createIcons === 'function') {
      w.lucide.createIcons();
    }
  }

  // --- 7. EXPORT TO GLOBAL SCOPE ---
  w.switchWorkspaceTab = switchWorkspaceTab;
  w.updateSprintProgressBar = updateSprintProgressBar;
  w.promptCompleteTask = promptCompleteTask;
  w.closeTaskCompletionModal = closeTaskCompletionModal;
  w.executeCompleteTask = executeCompleteTask;
  w.reopenTask = reopenTask;
  w.renderCompletedHistory = renderCompletedHistory;

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
      switchWorkspaceTab,
      updateSprintProgressBar,
      promptCompleteTask,
      closeTaskCompletionModal,
      executeCompleteTask,
      reopenTask,
      renderCompletedHistory
    };
  }

})(typeof window !== 'undefined' ? window : global);
