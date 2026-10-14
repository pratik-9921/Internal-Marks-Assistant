/**
 * app.js
 * Main UI Coordination & Page Controller
 * Handles Dashboard, Calculator, Faculty Panel, and AI Assistant interactions.
 *
 * Faculty Panel responsibilities:
 *  - Global sidebar / mobile hamburger controls
 *  - Global student switcher (topbar select)
 *  - Tab 1: Searchable, filterable Student Records table
 *  - Tab 2: Component-wise Evaluation Panel with live validation and save
 *  - Tab 3: Bulk CSV import/export with preview and line-by-line errors
 *  - Tab 4: Faculty Reports & Analytics with Chart.js visualizations
 *  - Student Details drill-down modal
 */

// ---------------------------------------------------------------------------
// Module-level state
// ---------------------------------------------------------------------------
let chatHistory = [];
let _currentEvalRollNo = null;   // Selected student roll no. in evaluation panel
let _evalStudentProfile = null;  // Working copy of student being evaluated (unsaved edits)
let _csvPreviewRows = null;      // Validated CSV preview rows pending commit
let _modalTargetRollNo = null;   // Student shown in the details modal

// ---------------------------------------------------------------------------
// DOMContentLoaded – route to the correct page initialiser
// ---------------------------------------------------------------------------
document.addEventListener("DOMContentLoaded", () => {
  initSidebarControls();
  initGlobalStudentSwitcher();
  highlightActiveNav();

  const path = window.location.pathname.toLowerCase();

  if (path.endsWith("index.html") || path.endsWith("/") || path === "") {
    initDashboardPage();
  } else if (path.endsWith("calculator.html")) {
    initCalculatorPage();
  } else if (path.endsWith("faculty.html")) {
    initFacultyPage();
  } else if (path.endsWith("ai-assistant.html")) {
    initAiAssistantPage();
  }
});

// ===========================================================================
// SHARED SHELL CONTROLS
// ===========================================================================

/**
 * Wire mobile hamburger, sidebar close button, and backdrop click.
 */
function initSidebarControls() {
  const sidebar = document.getElementById("appSidebar");
  const closeBtn = document.getElementById("sidebarCloseBtn");
  const menuToggle = document.getElementById("mobileMenuToggle");
  const backdrop = document.getElementById("sidebarBackdrop");

  if (!sidebar) return;

  function openSidebar() { sidebar.classList.add("sidebar-open"); if (backdrop) backdrop.classList.add("active"); }
  function closeSidebar() { sidebar.classList.remove("sidebar-open"); if (backdrop) backdrop.classList.remove("active"); }

  if (menuToggle) menuToggle.addEventListener("click", openSidebar);
  if (closeBtn) closeBtn.addEventListener("click", closeSidebar);
  if (backdrop) backdrop.addEventListener("click", closeSidebar);

  // Close sidebar on Escape key
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") closeSidebar(); });
}

/**
 * Populate the topbar global student switcher and sync sidebar avatar.
 * On change, saves the selected student as the active profile across pages.
 */
function initGlobalStudentSwitcher() {
  const select = document.getElementById("globalStudentSelect");
  if (!select) return;

  const roster = window.AppStorage.loadFacultyRoster();
  const current = window.AppStorage.loadCurrentStudentProfile();

  select.innerHTML = "";
  roster.forEach(s => {
    const opt = document.createElement("option");
    opt.value = s.rollNo;
    opt.textContent = `${s.rollNo} — ${s.name}`;
    if (s.rollNo === current.rollNo) opt.selected = true;
    select.appendChild(opt);
  });

  syncSidebarStudent(current);

  select.addEventListener("change", () => {
    const chosen = roster.find(s => s.rollNo === select.value);
    if (chosen) {
      window.AppStorage.saveCurrentStudentProfile(chosen);
      syncSidebarStudent(chosen);
      // Reload current page to reflect student change
      const path = window.location.pathname.toLowerCase();
      if (path.endsWith("index.html") || path.endsWith("/") || path === "") {
        initDashboardPage();
      } else if (path.endsWith("calculator.html")) {
        initCalculatorPage();
      }
    }
  });
}

/** Update sidebar avatar, name, and roll number. */
function syncSidebarStudent(profile) {
  const avatarEl = document.getElementById("sidebarAvatar");
  const nameEl = document.getElementById("sidebarStudentName");
  const rollEl = document.getElementById("sidebarStudentRoll");

  if (!profile) return;
  const initials = (profile.name || "??")
    .split(" ")
    .map(w => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  if (avatarEl) avatarEl.textContent = initials;
  if (nameEl) nameEl.textContent = profile.name || "—";
  if (rollEl) rollEl.textContent = profile.rollNo || "—";
}

/**
 * Highlights current navigation link
 */
function highlightActiveNav() {
  const currentPath = window.location.pathname.split("/").pop() || "index.html";
  // Support both .main-nav links (old header) and .sidebar-nav links (new SaaS layout)
  const links = document.querySelectorAll(".main-nav .nav-link, .sidebar-nav .nav-item");
  links.forEach(link => {
    const href = link.getAttribute("href");
    if (href === currentPath || (currentPath === "" && href === "index.html")) {
      link.classList.add("active");
    } else {
      link.classList.remove("active");
    }
  });
}

// ===========================================================================
// UTILITIES
// ===========================================================================

/** Simple toast notification */
function showToast(message, type = "info") {
  let container = document.querySelector(".toast-container");
  if (!container) {
    container = document.createElement("div");
    container.className = "toast-container";
    document.body.appendChild(container);
  }
  const toast = document.createElement("div");
  toast.className = `toast toast-${type}`;
  toast.textContent = message;
  container.appendChild(toast);
  setTimeout(() => toast.remove(), 3500);
}

/** HTML escape */
function escapeHtml(str) {
  if (!str) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

/** Minimal markdown renderer for chatbot replies */
function renderMarkdown(text) {
  if (!text) return "";
  let html = escapeHtml(text);
  html = html.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");
  html = html.replace(/^\s*[\*\-]\s+(.*)$/gm, "<li>$1</li>");
  html = html.replace(/(<li>.*<\/li>)/gs, "<ul>$1</ul>");
  html = html.replace(/\n\n/g, "<br><br>");
  html = html.replace(/\n(?![<])/g, "<br>");
  return html;
}

/** Download a string as a file */
function downloadFile(filename, content, mimeType) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

// ===========================================================================
// 1. DASHBOARD PAGE (index.html)
// ===========================================================================
function initDashboardPage() {
  const profile = window.AppStorage.loadCurrentStudentProfile();
  const summary = window.AppCalculator.calculateStudentSummary(profile);

  // Populate student profile bar
  const nameEl = document.getElementById("profile-name");
  const rollEl = document.getElementById("profile-roll");
  const tracksEl = document.getElementById("profile-tracks");

  if (nameEl) nameEl.textContent = profile.name || "Student Demo";
  if (rollEl) rollEl.textContent = profile.rollNo || "TY-COMP-01";
  if (tracksEl) {
    const pecTrack = window.SyllabusData.PEC_1_BASKET.find(p => p.id === profile.selectedPec1Id);
    const mdmTrack = window.SyllabusData.MDM_3_BASKET.find(m => m.id === profile.selectedMdm3Id);
    const oeTrack = window.SyllabusData.OE_2_BASKET.find(o => o.id === profile.selectedOe2Id);
    tracksEl.innerHTML = `
      <span class="badge badge-pec">PEC-I: ${pecTrack ? pecTrack.theory.name : profile.selectedPec1Id}</span>
      <span class="badge badge-mdm">MDM-III: ${mdmTrack ? mdmTrack.theory.name : profile.selectedMdm3Id}</span>
      <span class="badge badge-oe">OE-II: ${oeTrack ? oeTrack.name : profile.selectedOe2Id}</span>
    `;
  }

  // KPI Stats
  const statEntered = document.getElementById("stat-entered-marks");
  const statEnteredSub = document.getElementById("stat-entered-subtext");
  if (statEntered) statEntered.textContent = `${summary.totalMarksEntered} / ${summary.maxMarksOfEnteredComponents}`;
  if (statEnteredSub) statEnteredSub.textContent = `${summary.totalMarksEntered} marks earned out of ${summary.maxMarksOfEnteredComponents} evaluated max`;

  const statPercentage = document.getElementById("stat-percentage");
  if (statPercentage) statPercentage.textContent = `${summary.enteredPercentage}%`;

  const statProgress = document.getElementById("stat-progress");
  const statProgressSub = document.getElementById("stat-progress-subtext");
  if (statProgress) statProgress.textContent = `${summary.completedComponentsCount} of ${summary.totalApplicableComponentsCount} Evaluated`;
  if (statProgressSub) statProgressSub.textContent = `${summary.pendingComponentsCount} final examinations pending (270 marks)`;

  const statProjected = document.getElementById("stat-projected");
  const statProjectedSub = document.getElementById("stat-projected-subtext");
  if (statProjected) statProjected.textContent = `${summary.projectedSemesterPercentage}%`;
  if (statProjectedSub) statProjectedSub.textContent = `${summary.totalMarksEntered} earned out of 650 total semester marks`;

  // Dashboard Table
  const tableBody = document.getElementById("dashboard-courses-body");
  if (tableBody) {
    tableBody.innerHTML = "";
    summary.courseBreakdown.forEach((course, idx) => {
      const tr = document.createElement("tr");
      const compSummary = [];
      window.AppCalculator.ASSESSMENT_COMPONENTS.forEach(k => {
        const c = course.components[k];
        if (c.status === "entered") {
          compSummary.push(`<span class="badge badge-entered">${k.toUpperCase()}: ${c.value}/${c.max}</span>`);
        } else if (c.status === "pending") {
          compSummary.push(`<span class="badge badge-pending">${k.toUpperCase()}: Pending</span>`);
        }
      });

      const isDiscrepant = course.courseId === "pcc-network-lab"
        ? `<br><small style="color: var(--color-warning); font-size: 0.72rem;">*Code discrepancy: 24-PCC-CS-3-03 (p. 24) / 24-PCC-CS-3-04 (p. 52)</small>`
        : "";

      tr.innerHTML = `
        <td>${idx + 1}</td>
        <td><strong>${course.name}</strong><br><small class="text-muted">${course.code}</small>${isDiscrepant}</td>
        <td><span class="badge badge-${course.category.toLowerCase().replace(/[^a-z]/g, '')}">${course.category}</span></td>
        <td>${compSummary.join(" ") || "—"}</td>
        <td><strong>${course.enteredMarks}</strong> / ${course.maxOfEntered}</td>
        <td>${course.pendingCount === 0
          ? '<span class="badge badge-entered">All Evaluated</span>'
          : `<span class="badge badge-pending">${course.pendingCount} Pending</span>`}</td>
      `;
      tableBody.appendChild(tr);
    });
  }

  // Charts
  window.AppCharts.renderSubjectPerformanceChart("subjectPerformanceChart", summary.courseBreakdown);
  window.AppCharts.renderAssessmentBreakdownChart("assessmentBreakdownChart", summary);
}

// ===========================================================================
// 2. CALCULATOR PAGE (calculator.html)
// ===========================================================================
function initCalculatorPage() {
  const profile = window.AppStorage.loadCurrentStudentProfile();

  const pecSelect = document.getElementById("select-pec1");
  const mdmSelect = document.getElementById("select-mdm3");
  const oeSelect = document.getElementById("select-oe2");

  if (pecSelect) {
    pecSelect.innerHTML = "";
    window.SyllabusData.PEC_1_BASKET.forEach(p => {
      const opt = document.createElement("option");
      opt.value = p.id;
      opt.textContent = `Track ${p.track}: ${p.theory.name} (${p.theory.code})`;
      if (p.id === profile.selectedPec1Id) opt.selected = true;
      pecSelect.appendChild(opt);
    });
    pecSelect.addEventListener("change", (e) => {
      profile.selectedPec1Id = e.target.value;
      window.AppStorage.saveCurrentStudentProfile(profile);
      renderCalculatorInputs(profile);
    });
  }

  if (mdmSelect) {
    mdmSelect.innerHTML = "";
    window.SyllabusData.MDM_3_BASKET.forEach(m => {
      const opt = document.createElement("option");
      opt.value = m.id;
      opt.textContent = `${m.department}: ${m.theory.name} (${m.theory.code})`;
      if (m.id === profile.selectedMdm3Id) opt.selected = true;
      mdmSelect.appendChild(opt);
    });
    mdmSelect.addEventListener("change", (e) => {
      profile.selectedMdm3Id = e.target.value;
      window.AppStorage.saveCurrentStudentProfile(profile);
      renderCalculatorInputs(profile);
    });
  }

  if (oeSelect) {
    oeSelect.innerHTML = "";
    window.SyllabusData.OE_2_BASKET.forEach(o => {
      const opt = document.createElement("option");
      opt.value = o.id;
      opt.textContent = `${o.name} (${o.code})`;
      if (o.id === profile.selectedOe2Id) opt.selected = true;
      oeSelect.appendChild(opt);
    });
    oeSelect.addEventListener("change", (e) => {
      profile.selectedOe2Id = e.target.value;
      window.AppStorage.saveCurrentStudentProfile(profile);
      renderCalculatorInputs(profile);
    });
  }

  const saveBtn = document.getElementById("btn-save-calculator");
  if (saveBtn) {
    saveBtn.addEventListener("click", () => {
      window.AppStorage.saveCurrentStudentProfile(profile);
      showToast("Marks and elective tracks saved successfully!", "success");
    });
  }

  const resetBtn = document.getElementById("btn-reset-calculator");
  if (resetBtn) {
    resetBtn.addEventListener("click", () => {
      if (confirm("Reset current student marks to demo default values?")) {
        const def = window.AppStorage.createDefaultStudentProfile(profile.name, profile.rollNo);
        window.AppStorage.saveCurrentStudentProfile(def);
        location.reload();
      }
    });
  }

  renderCalculatorInputs(profile);
}

function renderCalculatorInputs(profile) {
  const container = document.getElementById("calculator-table-body");
  if (!container) return;

  const activeCourses = window.AppStorage.resolveStudentCourses(profile);
  container.innerHTML = "";

  activeCourses.forEach(course => {
    const tr = document.createElement("tr");
    const courseMarks = profile.marks[course.id] || {};
    let inputsHtml = "";

    window.AppCalculator.ASSESSMENT_COMPONENTS.forEach(comp => {
      const max = course.maxMarks[comp];
      if (max !== null && max !== undefined) {
        const currentVal = (courseMarks[comp] !== null && courseMarks[comp] !== undefined) ? courseMarks[comp] : "";
        inputsHtml += `
          <td style="min-width: 100px;">
            <label style="font-size: 0.72rem; color: var(--color-text-muted); display: block;">${comp.toUpperCase()} (Max ${max})</label>
            <input type="number"
                   min="0"
                   max="${max}"
                   class="form-input mark-input"
                   data-course-id="${course.id}"
                   data-comp="${comp}"
                   data-max="${max}"
                   value="${currentVal}"
                   placeholder="Pending"
                   style="padding: 0.35rem 0.5rem; font-size: 0.85rem;" />
            <span class="field-error-msg" id="err-${course.id}-${comp}"></span>
          </td>
        `;
      } else {
        inputsHtml += `<td style="color: var(--color-text-light); text-align: center; font-size: 0.85rem;">—</td>`;
      }
    });

    const isDiscrepant = course.codeDiscrepancyNote
      ? `<br><small style="color: var(--color-warning); font-size: 0.72rem;">*Discrepancy: ${course.codeDiscrepancyNote}</small>`
      : "";

    tr.innerHTML = `
      <td><strong>${course.name}</strong><br><small class="text-muted">${course.code}</small>${isDiscrepant}</td>
      <td><span class="badge badge-${course.category.toLowerCase().replace(/[^a-z]/g, '')}">${course.category}</span></td>
      ${inputsHtml}
      <td style="font-weight: 700; text-align: center;">${course.maxMarks.total}</td>
    `;
    container.appendChild(tr);
  });

  container.querySelectorAll(".mark-input").forEach(input => {
    input.addEventListener("input", (e) => {
      const courseId = e.target.dataset.courseId;
      const comp = e.target.dataset.comp;
      const max = Number(e.target.dataset.max);
      const val = e.target.value.trim();
      const errEl = document.getElementById(`err-${courseId}-${comp}`);

      if (!profile.marks[courseId]) profile.marks[courseId] = {};

      const courseObj = activeCourses.find(c => c.id === courseId);
      const validation = window.AppCalculator.validateMark(courseObj, comp, val);

      if (!validation.valid) {
        e.target.classList.add("is-invalid");
        if (errEl) errEl.textContent = validation.error;
      } else {
        e.target.classList.remove("is-invalid");
        if (errEl) errEl.textContent = "";
        profile.marks[courseId][comp] = validation.isPending ? null : validation.numericValue;
      }

      window.AppStorage.saveCurrentStudentProfile(profile);
      updateCalculatorSummary(profile);
    });
  });

  updateCalculatorSummary(profile);
}

function updateCalculatorSummary(profile) {
  const summary = window.AppCalculator.calculateStudentSummary(profile);
  const elMap = {
    "calc-total-entered": summary.totalMarksEntered,
    "calc-max-entered": summary.maxMarksOfEnteredComponents,
    "calc-entered-percentage": `${summary.enteredPercentage}%`,
    "calc-semester-standing": `${summary.projectedSemesterPercentage}% (${summary.totalMarksEntered} / 650)`,
    "calc-pending-count": `${summary.pendingComponentsCount} of 21`
  };
  Object.entries(elMap).forEach(([id, val]) => {
    const el = document.getElementById(id);
    if (el) el.textContent = val;
  });
}

// ===========================================================================
// 3. FACULTY PAGE (faculty.html) — ALL FOUR TABS
// ===========================================================================

function initFacultyPage() {
  // Wire faculty tab buttons
  const tabBtns = document.querySelectorAll(".faculty-tab-btn");
  const tabPanes = document.querySelectorAll(".tab-pane");

  tabBtns.forEach(btn => {
    btn.addEventListener("click", () => {
      const targetId = btn.dataset.tab;
      tabBtns.forEach(b => b.classList.remove("active"));
      tabPanes.forEach(p => p.classList.remove("active"));
      btn.classList.add("active");
      const target = document.getElementById(targetId);
      if (target) target.classList.add("active");

      // Lazy-load reports tab when first opened
      if (targetId === "tab-reports") renderFacultyReports();
    });
  });

  // Populate filter dropdowns
  populateFilterDropdowns();

  // Load and render roster (Tab 1)
  refreshRosterTab();

  // Wire search/filter inputs
  const searchInput = document.getElementById("faculty-search-input");
  const filterPec = document.getElementById("filter-pec");
  const filterMdm = document.getElementById("filter-mdm");
  const filterStatus = document.getElementById("filter-status");
  const clearBtn = document.getElementById("btn-clear-filters");

  [searchInput, filterPec, filterMdm, filterStatus].forEach(el => {
    if (el) el.addEventListener("input", filterAndRenderRoster);
    if (el) el.addEventListener("change", filterAndRenderRoster);
  });

  if (clearBtn) {
    clearBtn.addEventListener("click", () => {
      if (searchInput) searchInput.value = "";
      if (filterPec) filterPec.value = "";
      if (filterMdm) filterMdm.value = "";
      if (filterStatus) filterStatus.value = "";
      filterAndRenderRoster();
    });
  }

  // Tab 1 action buttons
  const exportCsvBtn = document.getElementById("btn-export-roster-csv");
  const exportJsonBtn = document.getElementById("btn-export-roster");
  const resetRosterBtn = document.getElementById("btn-reset-roster");

  if (exportCsvBtn) {
    exportCsvBtn.addEventListener("click", () => {
      const csv = window.AppStorage.exportRosterToCsv(window.AppStorage.loadFacultyRoster());
      downloadFile(`SNJB-Sem5-Marksheet-${isoDate()}.csv`, csv, "text/csv");
      showToast("Marksheet CSV exported.", "success");
    });
  }

  if (exportJsonBtn) {
    exportJsonBtn.addEventListener("click", () => {
      const json = window.AppStorage.exportDemoDataAsJson();
      downloadFile(`SNJB-Sem5-Demo-Data-${isoDate()}.json`, json, "application/json");
      showToast("Demo cohort exported as JSON.", "success");
    });
  }

  if (resetRosterBtn) {
    resetRosterBtn.addEventListener("click", () => {
      if (confirm("Reset the demo roster back to the initial fictional student cohort?")) {
        window.AppStorage.resetFacultyRoster();
        refreshRosterTab();
        updateCohortKPIs(window.AppStorage.loadFacultyRoster());
        showToast("Demo student records reset to defaults.", "info");
      }
    });
  }

  // Tab 2: Evaluation panel wiring
  initEvaluationPanel();

  // Tab 3: Bulk CSV / JSON wiring
  initBulkTab();

  // Tab 4 export buttons
  const exportSubjectCsvBtn = document.getElementById("btn-export-subject-csv");
  const exportClassCsvBtn = document.getElementById("btn-export-class-summary-csv");

  if (exportSubjectCsvBtn) {
    exportSubjectCsvBtn.addEventListener("click", () => {
      const csv = window.AppStorage.exportSubjectSummariesToCsv(window.AppStorage.loadFacultyRoster());
      downloadFile(`SNJB-Subject-Summaries-${isoDate()}.csv`, csv, "text/csv");
      showToast("Subject summaries CSV exported.", "success");
    });
  }

  if (exportClassCsvBtn) {
    exportClassCsvBtn.addEventListener("click", () => {
      exportClassSummaryCsv();
    });
  }

  // Init modal dialog
  initStudentDetailsModal();

  // Update cohort KPI stats
  updateCohortKPIs(window.AppStorage.loadFacultyRoster());
}

// ---------------------------------------------------------------------------
// Tab 1: Roster table — populate/filter
// ---------------------------------------------------------------------------

function populateFilterDropdowns() {
  const filterPec = document.getElementById("filter-pec");
  const filterMdm = document.getElementById("filter-mdm");

  if (filterPec) {
    window.SyllabusData.PEC_1_BASKET.forEach(p => {
      const opt = document.createElement("option");
      opt.value = p.id;
      opt.textContent = `Track ${p.track}: ${p.theory.name}`;
      filterPec.appendChild(opt);
    });
  }

  if (filterMdm) {
    window.SyllabusData.MDM_3_BASKET.forEach(m => {
      const opt = document.createElement("option");
      opt.value = m.id;
      opt.textContent = `${m.department}: ${m.theory.name}`;
      filterMdm.appendChild(opt);
    });
  }
}

function refreshRosterTab() {
  filterAndRenderRoster();
  const roster = window.AppStorage.loadFacultyRoster();
  const badge = document.getElementById("badge-roster-count");
  if (badge) badge.textContent = roster.length;
}

function filterAndRenderRoster() {
  const searchVal = (document.getElementById("faculty-search-input")?.value || "").toLowerCase().trim();
  const pecVal = document.getElementById("filter-pec")?.value || "";
  const mdmVal = document.getElementById("filter-mdm")?.value || "";
  const statusVal = document.getElementById("filter-status")?.value || "";

  const roster = window.AppStorage.loadFacultyRoster();

  const filtered = roster.filter(s => {
    const summary = window.AppCalculator.calculateStudentSummary(s);

    // Search filter
    if (searchVal && !s.name.toLowerCase().includes(searchVal) && !s.rollNo.toLowerCase().includes(searchVal)) return false;

    // PEC filter
    if (pecVal && s.selectedPec1Id !== pecVal) return false;

    // MDM filter
    if (mdmVal && s.selectedMdm3Id !== mdmVal) return false;

    // Status filter
    if (statusVal === "pending" && summary.pendingComponentsCount === 0) return false;
    if (statusVal === "completed" && summary.pendingComponentsCount !== 0) return false;

    return true;
  });

  renderRosterTable(filtered);
}

function renderRosterTable(students) {
  const tableBody = document.getElementById("faculty-roster-body");
  if (!tableBody) return;

  tableBody.innerHTML = "";

  if (students.length === 0) {
    tableBody.innerHTML = `<tr><td colspan="11" style="text-align:center; color: var(--color-text-muted); padding: 2rem;">No students match the current filters.</td></tr>`;
    return;
  }

  students.forEach(student => {
    const summary = window.AppCalculator.calculateStudentSummary(student);
    const pecTrack = window.SyllabusData.PEC_1_BASKET.find(p => p.id === student.selectedPec1Id);
    const mdmTrack = window.SyllabusData.MDM_3_BASKET.find(m => m.id === student.selectedMdm3Id);
    const oeTrack = window.SyllabusData.OE_2_BASKET.find(o => o.id === student.selectedOe2Id);

    const completedRatio = summary.totalApplicableComponentsCount > 0
      ? Math.round((summary.completedComponentsCount / summary.totalApplicableComponentsCount) * 100)
      : 0;

    const progressBarColor =
      completedRatio === 100 ? "var(--color-success)" :
        completedRatio >= 50 ? "var(--color-primary)" :
          "var(--color-warning)";

    const statusBadge = summary.pendingComponentsCount === 0
      ? `<span class="badge badge-entered">All Evaluated</span>`
      : `<span class="badge badge-pending">${summary.pendingComponentsCount} Pending</span>`;

    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td><strong>${escapeHtml(student.rollNo)}</strong></td>
      <td><strong>${escapeHtml(student.name)}</strong><br>
        <small class="text-muted" style="font-size:0.72rem;">[Fictional Demo Record]</small></td>
      <td><span class="badge badge-pec">${escapeHtml(pecTrack ? pecTrack.theory.name : student.selectedPec1Id)}</span></td>
      <td><span class="badge badge-mdm">${escapeHtml(mdmTrack ? mdmTrack.theory.name : student.selectedMdm3Id)}</span></td>
      <td><span class="badge badge-oe">${escapeHtml(oeTrack ? oeTrack.name : student.selectedOe2Id)}</span></td>
      <td><strong>${summary.totalMarksEntered}</strong> / ${summary.maxMarksOfEnteredComponents}</td>
      <td><strong style="color: var(--color-primary);">${summary.enteredPercentage}%</strong></td>
      <td><span>${summary.projectedSemesterPercentage}% (${summary.totalMarksEntered}/650)</span></td>
      <td>${statusBadge}</td>
      <td style="min-width: 130px;">
        <div style="display: flex; align-items: center; gap: 0.4rem;">
          <div style="flex: 1; background: var(--color-border); border-radius: 999px; height: 6px; overflow: hidden;">
            <div style="width: ${completedRatio}%; background: ${progressBarColor}; height: 100%; transition: width 0.4s ease;"></div>
          </div>
          <span style="font-size: 0.78rem; font-weight: 600; color: var(--color-text-muted); min-width: 32px;">${completedRatio}%</span>
        </div>
      </td>
      <td style="text-align: right;">
        <div style="display: flex; gap: 0.35rem; justify-content: flex-end; flex-wrap: wrap;">
          <button class="btn btn-secondary btn-sm" onclick="openStudentDetailsModal('${escapeHtml(student.rollNo)}')">View Details</button>
          <button class="btn btn-primary btn-sm" onclick="switchToEvalPanel('${escapeHtml(student.rollNo)}')">Evaluate Marks</button>
          <button class="btn btn-secondary btn-sm" onclick="setActiveDemoStudent('${escapeHtml(student.rollNo)}')">Dashboard</button>
        </div>
      </td>
    `;
    tableBody.appendChild(tr);
  });
}

function updateCohortKPIs(roster) {
  let totalEvaluatedPct = 0;
  let topStudent = null;
  let topPct = -1;
  let totalPendingAcrossClass = 0;

  roster.forEach(student => {
    const summary = window.AppCalculator.calculateStudentSummary(student);
    const pctNum = Number(summary.enteredPercentage);
    totalEvaluatedPct += pctNum;
    totalPendingAcrossClass += summary.pendingComponentsCount;
    if (pctNum > topPct) { topPct = pctNum; topStudent = student; }
  });

  const countEl = document.getElementById("cohort-count");
  const avgEl = document.getElementById("cohort-avg");
  const topEl = document.getElementById("cohort-top");
  const pendingEl = document.getElementById("cohort-pending");

  if (countEl) countEl.textContent = roster.length;
  if (avgEl) avgEl.textContent = roster.length > 0 ? (totalEvaluatedPct / roster.length).toFixed(1) + "%" : "0%";
  if (topEl) topEl.textContent = topStudent ? `${topStudent.name} (${topPct}%)` : "—";
  if (pendingEl) pendingEl.textContent = totalPendingAcrossClass;
}

// ---------------------------------------------------------------------------
// Tab 2: Component-wise Evaluation Panel
// ---------------------------------------------------------------------------

function initEvaluationPanel() {
  const roster = window.AppStorage.loadFacultyRoster();
  const evalSelect = document.getElementById("eval-student-select");
  const prevBtn = document.getElementById("eval-btn-prev");
  const nextBtn = document.getElementById("eval-btn-next");

  // Populate student selector
  if (evalSelect) {
    evalSelect.innerHTML = "";
    roster.forEach(s => {
      const opt = document.createElement("option");
      opt.value = s.rollNo;
      opt.textContent = `${s.rollNo} — ${s.name}`;
      evalSelect.appendChild(opt);
    });

    _currentEvalRollNo = roster[0]?.rollNo || null;
    if (_currentEvalRollNo) renderEvalPanel(_currentEvalRollNo);

    evalSelect.addEventListener("change", () => {
      _currentEvalRollNo = evalSelect.value;
      renderEvalPanel(_currentEvalRollNo);
    });
  }

  if (prevBtn) {
    prevBtn.addEventListener("click", () => navigateEvalStudent(-1));
  }
  if (nextBtn) {
    nextBtn.addEventListener("click", () => navigateEvalStudent(+1));
  }

  // Save button
  const saveBtn = document.getElementById("btn-save-evaluation");
  if (saveBtn) {
    saveBtn.addEventListener("click", () => saveEvalPanel());
  }

  // Reset single student button
  const resetSingleBtn = document.getElementById("btn-reset-single-student");
  if (resetSingleBtn) {
    resetSingleBtn.addEventListener("click", () => {
      if (!_currentEvalRollNo) return;
      const student = window.AppStorage.getStudentByRollNo(_currentEvalRollNo);
      if (!student) return;
      if (confirm(`Reset all marks for ${student.name} (${_currentEvalRollNo}) to defaults? This cannot be undone.`)) {
        const def = window.AppStorage.createDefaultStudentProfile(student.name, student.rollNo);
        def.selectedPec1Id = student.selectedPec1Id;
        def.selectedMdm3Id = student.selectedMdm3Id;
        def.selectedOe2Id = student.selectedOe2Id;
        window.AppStorage.saveStudentProfile(def);
        _evalStudentProfile = JSON.parse(JSON.stringify(def));
        renderEvalPanel(_currentEvalRollNo);
        showToast(`Marks for ${student.name} reset to defaults.`, "info");
      }
    });
  }
}

function navigateEvalStudent(direction) {
  const evalSelect = document.getElementById("eval-student-select");
  if (!evalSelect) return;
  const opts = Array.from(evalSelect.options);
  const cur = opts.findIndex(o => o.value === _currentEvalRollNo);
  const next = Math.max(0, Math.min(opts.length - 1, cur + direction));
  evalSelect.selectedIndex = next;
  _currentEvalRollNo = evalSelect.value;
  renderEvalPanel(_currentEvalRollNo);
}

function renderEvalPanel(rollNo) {
  const student = window.AppStorage.getStudentByRollNo(rollNo);
  if (!student) return;

  _evalStudentProfile = JSON.parse(JSON.stringify(student)); // working copy
  _currentEvalRollNo = rollNo;

  // Sync select dropdown
  const evalSelect = document.getElementById("eval-student-select");
  if (evalSelect) evalSelect.value = rollNo;

  // Render summary KPI cards
  renderEvalStudentSummary(_evalStudentProfile);

  // Render evaluation grid table
  renderEvalTable(_evalStudentProfile);

  // Render pending callout list
  renderPendingCallout(_evalStudentProfile);

  // Hide saved indicator
  const saveStatus = document.getElementById("eval-save-status-indicator");
  if (saveStatus) saveStatus.style.display = "none";
}

function renderEvalStudentSummary(profile) {
  const container = document.getElementById("eval-student-summary-cards");
  if (!container) return;

  const summary = window.AppCalculator.calculateStudentSummary(profile);
  const pecTrack = window.SyllabusData.PEC_1_BASKET.find(p => p.id === profile.selectedPec1Id);
  const mdmTrack = window.SyllabusData.MDM_3_BASKET.find(m => m.id === profile.selectedMdm3Id);
  const oeTrack = window.SyllabusData.OE_2_BASKET.find(o => o.id === profile.selectedOe2Id);

  container.innerHTML = `
    <div class="card stat-card" style="border-left: 3px solid var(--color-primary);">
      <span class="stat-label">Student</span>
      <span class="stat-value" style="font-size: 1.1rem;">${escapeHtml(profile.name)}</span>
      <span class="stat-subtext">${escapeHtml(profile.rollNo)} &bull; [Fictional Demo Record]</span>
    </div>
    <div class="card stat-card">
      <span class="stat-label">Elective Tracks</span>
      <div style="display:flex; flex-direction: column; gap: 0.2rem; margin-top: 0.35rem;">
        <span class="badge badge-pec" style="font-size: 0.72rem;">${escapeHtml(pecTrack ? pecTrack.theory.name : profile.selectedPec1Id)}</span>
        <span class="badge badge-mdm" style="font-size: 0.72rem;">${escapeHtml(mdmTrack ? mdmTrack.theory.name : profile.selectedMdm3Id)}</span>
        <span class="badge badge-oe"  style="font-size: 0.72rem;">${escapeHtml(oeTrack ? oeTrack.name : profile.selectedOe2Id)}</span>
      </div>
    </div>
    <div class="card stat-card">
      <span class="stat-label">Evaluated Marks</span>
      <span class="stat-value" style="color: var(--color-primary);">${summary.totalMarksEntered} / ${summary.maxMarksOfEnteredComponents}</span>
      <span class="stat-subtext">${summary.enteredPercentage}% of evaluated components</span>
    </div>
    <div class="card stat-card">
      <span class="stat-label">Pending Components</span>
      <span class="stat-value" style="color: var(--color-warning);">${summary.pendingComponentsCount}</span>
      <span class="stat-subtext">of ${summary.totalApplicableComponentsCount} total applicable</span>
    </div>
  `;
}

function renderEvalTable(profile) {
  const tbody = document.getElementById("eval-table-body");
  if (!tbody) return;

  tbody.innerHTML = "";
  const courses = window.AppStorage.resolveStudentCourses(profile);

  courses.forEach(course => {
    const marks = profile.marks[course.id] || {};
    const tr = document.createElement("tr");

    // Build component cells
    let compCells = "";
    let enteredCount = 0;
    let applicableCount = 0;

    window.AppCalculator.ASSESSMENT_COMPONENTS.forEach(comp => {
      const max = course.maxMarks[comp];
      if (max === null || max === undefined) {
        compCells += `<td style="text-align:center; color: var(--color-text-light);"><span class="badge badge-na">N/A</span></td>`;
        return;
      }

      applicableCount++;
      const storedVal = marks[comp];
      const inputVal = (storedVal !== null && storedVal !== undefined) ? storedVal : "";
      if (storedVal !== null && storedVal !== undefined) enteredCount++;

      const isPending = (storedVal === null || storedVal === undefined);
      const borderColor = isPending ? "var(--color-border)" : "var(--color-primary)";

      compCells += `
        <td style="text-align:center; padding: 0.5rem 0.35rem;">
          <input type="number"
                 min="0"
                 max="${max}"
                 class="form-input eval-mark-input"
                 data-course-id="${course.id}"
                 data-comp="${comp}"
                 data-max="${max}"
                 value="${inputVal}"
                 placeholder="—"
                 title="${comp.toUpperCase()} (max ${max})"
                 style="width: 72px; text-align: center; padding: 0.3rem 0.4rem; font-size: 0.82rem;
                        border-color: ${borderColor};" />
          <div style="font-size: 0.68rem; color: var(--color-text-muted); margin-top: 2px;">/${max}</div>
          <div class="field-error-msg eval-err" id="eval-err-${course.id}-${comp}" style="font-size: 0.68rem; color: var(--color-danger);"></div>
        </td>
      `;
    });

    const progPct = applicableCount > 0 ? Math.round((enteredCount / applicableCount) * 100) : 0;
    const isDiscrepant = course.codeDiscrepancyNote
      ? `<small style="display:block; color: var(--color-warning); font-size: 0.68rem;">*${course.codeDiscrepancyNote}</small>`
      : "";

    tr.innerHTML = `
      <td>
        <strong style="font-size: 0.9rem;">${escapeHtml(course.name)}</strong>
        <small style="display:block; color: var(--color-text-muted); font-size: 0.72rem;">${escapeHtml(course.code)}</small>
        ${isDiscrepant}
      </td>
      <td><span class="badge badge-${course.category.toLowerCase().replace(/[^a-z]/g, '')}">${course.category}</span></td>
      ${compCells}
      <td style="text-align:center; font-weight:700;">${course.maxMarks.total}</td>
      <td style="min-width: 100px;">
        <div style="display:flex; align-items:center; gap: 0.4rem;">
          <div style="flex:1; background: var(--color-border); border-radius: 999px; height: 5px; overflow:hidden;">
            <div style="width:${progPct}%; background: ${progPct === 100 ? 'var(--color-success)' : 'var(--color-primary)'}; height:100%;"></div>
          </div>
          <span style="font-size:0.72rem; font-weight:600; color:var(--color-text-muted);">${progPct}%</span>
        </div>
      </td>
    `;
    tbody.appendChild(tr);
  });

  // Attach live validation to evaluation inputs
  tbody.querySelectorAll(".eval-mark-input").forEach(input => {
    input.addEventListener("input", (e) => {
      const courseId = e.target.dataset.courseId;
      const comp = e.target.dataset.comp;
      const max = Number(e.target.dataset.max);
      const val = e.target.value.trim();
      const errEl = document.getElementById(`eval-err-${courseId}-${comp}`);

      const courses = window.AppStorage.resolveStudentCourses(_evalStudentProfile);
      const courseObj = courses.find(c => c.id === courseId);
      const validation = window.AppCalculator.validateMark(courseObj, comp, val);

      if (!validation.valid) {
        e.target.style.borderColor = "var(--color-danger)";
        if (errEl) errEl.textContent = validation.error;
        return;
      }

      e.target.style.borderColor = validation.isPending ? "var(--color-border)" : "var(--color-success)";
      if (errEl) errEl.textContent = "";

      // Update working copy (NOT saved yet — user must click Save)
      if (!_evalStudentProfile.marks[courseId]) _evalStudentProfile.marks[courseId] = {};
      _evalStudentProfile.marks[courseId][comp] = validation.isPending ? null : validation.numericValue;

      // Update the pending callout live
      renderPendingCallout(_evalStudentProfile);

      // Mark as unsaved
      const saveStatus = document.getElementById("eval-save-status-indicator");
      if (saveStatus) {
        saveStatus.style.display = "block";
        saveStatus.style.color = "var(--color-warning)";
        saveStatus.textContent = "⚠ Unsaved changes";
      }
    });
  });
}

function renderPendingCallout(profile) {
  const calloutList = document.getElementById("eval-pending-callout-list");
  const calloutCount = document.getElementById("eval-pending-callout-count");
  if (!calloutList) return;

  const summary = window.AppCalculator.calculateStudentSummary(profile);
  calloutList.innerHTML = "";

  const pendingItems = [];
  summary.courseBreakdown.forEach(course => {
    window.AppCalculator.ASSESSMENT_COMPONENTS.forEach(comp => {
      const c = course.components[comp];
      if (c && c.status === "pending") {
        pendingItems.push({ courseName: course.name, comp, max: c.max });
      }
    });
  });

  if (calloutCount) {
    calloutCount.textContent = `${pendingItems.length} Pending`;
    calloutCount.className = pendingItems.length === 0 ? "badge badge-entered" : "badge badge-pending";
  }

  if (pendingItems.length === 0) {
    calloutList.innerHTML = `<span style="color: var(--color-success); font-weight: 600;">✔ All applicable assessments have been entered.</span>`;
    return;
  }

  pendingItems.forEach(item => {
    const chip = document.createElement("span");
    chip.className = "badge badge-pending";
    chip.style.cssText = "padding: 0.35rem 0.65rem; font-size: 0.82rem;";
    chip.textContent = `${item.courseName} → ${item.comp.toUpperCase()} (Max ${item.max})`;
    calloutList.appendChild(chip);
  });
}

function saveEvalPanel() {
  if (!_evalStudentProfile || !_currentEvalRollNo) return;

  // Re-validate every input before saving
  const tbody = document.getElementById("eval-table-body");
  let hasErrors = false;
  if (tbody) {
    tbody.querySelectorAll(".eval-mark-input").forEach(input => {
      const courseId = input.dataset.courseId;
      const comp = input.dataset.comp;
      const val = input.value.trim();
      const errEl = document.getElementById(`eval-err-${courseId}-${comp}`);
      const courses = window.AppStorage.resolveStudentCourses(_evalStudentProfile);
      const courseObj = courses.find(c => c.id === courseId);
      const v = window.AppCalculator.validateMark(courseObj, comp, val);
      if (!v.valid) {
        hasErrors = true;
        input.style.borderColor = "var(--color-danger)";
        if (errEl) errEl.textContent = v.error;
      }
    });
  }

  if (hasErrors) {
    showToast("Fix validation errors before saving.", "error");
    return;
  }

  // Commit working copy to roster
  const ok = window.AppStorage.saveStudentProfile(_evalStudentProfile);
  if (ok) {
    const saveStatus = document.getElementById("eval-save-status-indicator");
    if (saveStatus) {
      saveStatus.style.display = "block";
      saveStatus.style.color = "var(--color-success)";
      saveStatus.textContent = "✔ All changes saved locally";
    }
    showToast(`Marks for ${_evalStudentProfile.name} saved successfully.`, "success");
    // Refresh roster KPIs
    updateCohortKPIs(window.AppStorage.loadFacultyRoster());
  } else {
    showToast("Failed to save marks. Check console for details.", "error");
  }
}

// ---------------------------------------------------------------------------
// Tab 3: Bulk CSV / JSON
// ---------------------------------------------------------------------------

function initBulkTab() {
  const dlTemplateBtn = document.getElementById("btn-download-csv-template");
  const triggerCsvBtn = document.getElementById("btn-trigger-csv-file");
  const csvFileInput = document.getElementById("bulk-csv-file-input");
  const validateCsvBtn = document.getElementById("btn-validate-csv");
  const clearCsvBtn = document.getElementById("btn-clear-csv-text");
  const exportCsvBtn = document.getElementById("btn-export-csv-direct");
  const exportJsonBtn = document.getElementById("btn-export-json-direct");
  const importJsonBtn = document.getElementById("btn-import-roster");
  const importFileInput = document.getElementById("import-file-input");
  const applyBtn = document.getElementById("btn-apply-csv-entries");

  if (dlTemplateBtn) {
    dlTemplateBtn.addEventListener("click", () => {
      const csv = window.AppStorage.generateSampleCsvTemplate();
      downloadFile("SNJB-Marks-Import-Template.csv", csv, "text/csv");
      showToast("Sample CSV template downloaded.", "success");
    });
  }

  if (triggerCsvBtn && csvFileInput) {
    triggerCsvBtn.addEventListener("click", () => csvFileInput.click());
    csvFileInput.addEventListener("change", (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (evt) => {
        const ta = document.getElementById("csv-paste-textarea");
        if (ta) ta.value = evt.target.result;
      };
      reader.readAsText(file);
      csvFileInput.value = "";
    });
  }

  if (validateCsvBtn) {
    validateCsvBtn.addEventListener("click", () => {
      const ta = document.getElementById("csv-paste-textarea");
      if (!ta || !ta.value.trim()) {
        showToast("Please paste or upload CSV content first.", "error");
        return;
      }
      const roster = window.AppStorage.loadFacultyRoster();
      const result = window.AppStorage.parseAndValidateCsv(ta.value, roster);
      _csvPreviewRows = result.validRows;
      renderCsvPreview(result);
    });
  }

  if (clearCsvBtn) {
    clearCsvBtn.addEventListener("click", () => {
      const ta = document.getElementById("csv-paste-textarea");
      if (ta) ta.value = "";
      const previewCard = document.getElementById("csv-preview-card");
      if (previewCard) previewCard.style.display = "none";
      _csvPreviewRows = null;
    });
  }

  if (applyBtn) {
    applyBtn.addEventListener("click", () => {
      if (!_csvPreviewRows || _csvPreviewRows.length === 0) {
        showToast("No valid rows to commit.", "error");
        return;
      }
      const roster = window.AppStorage.loadFacultyRoster();
      const res = window.AppStorage.applyCsvImport(_csvPreviewRows, roster);
      if (res.success) {
        showToast(`${res.appliedCount} mark(s) committed to the roster.`, "success");
        _csvPreviewRows = null;
        const previewCard = document.getElementById("csv-preview-card");
        if (previewCard) previewCard.style.display = "none";
        const ta = document.getElementById("csv-paste-textarea");
        if (ta) ta.value = "";
        updateCohortKPIs(window.AppStorage.loadFacultyRoster());
        refreshRosterTab();
        // Refresh eval panel if open
        if (_currentEvalRollNo) renderEvalPanel(_currentEvalRollNo);
      } else {
        showToast("Import failed. See console for details.", "error");
      }
    });
  }

  if (exportCsvBtn) {
    exportCsvBtn.addEventListener("click", () => {
      const csv = window.AppStorage.exportRosterToCsv(window.AppStorage.loadFacultyRoster());
      downloadFile(`SNJB-Full-Marksheet-${isoDate()}.csv`, csv, "text/csv");
      showToast("Full marksheet CSV exported.", "success");
    });
  }

  if (exportJsonBtn) {
    exportJsonBtn.addEventListener("click", () => {
      const json = window.AppStorage.exportDemoDataAsJson();
      downloadFile(`SNJB-Cohort-Backup-${isoDate()}.json`, json, "application/json");
      showToast("Cohort JSON backup exported.", "success");
    });
  }

  if (importJsonBtn && importFileInput) {
    importJsonBtn.addEventListener("click", () => importFileInput.click());
    importFileInput.addEventListener("change", (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (evt) => {
        const result = window.AppStorage.importDemoDataFromJson(evt.target.result);
        if (result.success) {
          showToast("Cohort imported successfully!", "success");
          refreshRosterTab();
          updateCohortKPIs(window.AppStorage.loadFacultyRoster());
          initEvaluationPanel();
        } else {
          showToast("Failed to import JSON: " + result.error, "error");
        }
      };
      reader.readAsText(file);
      importFileInput.value = "";
    });
  }
}

function renderCsvPreview(result) {
  const previewCard = document.getElementById("csv-preview-card");
  const statusPill = document.getElementById("csv-preview-status-pill");
  const errorDisplay = document.getElementById("csv-error-display");
  const errorList = document.getElementById("csv-error-list");
  const previewTableBody = document.getElementById("csv-preview-table-body");
  const applyBtn = document.getElementById("btn-apply-csv-entries");

  if (!previewCard) return;
  previewCard.style.display = "block";

  // Errors
  if (result.errors && result.errors.length > 0) {
    errorDisplay.style.display = "block";
    errorList.innerHTML = result.errors.map(e => `<li>${escapeHtml(e)}</li>`).join("");
  } else {
    errorDisplay.style.display = "none";
    if (errorList) errorList.innerHTML = "";
  }

  // Status pill
  const validCount = result.validRows ? result.validRows.length : 0;
  const errCount = result.errors ? result.errors.length : 0;
  if (statusPill) {
    statusPill.textContent = `${validCount} valid entries, ${errCount} errors`;
    statusPill.className = errCount > 0 ? "badge badge-pending" : "badge badge-entered";
  }

  // Show/hide apply button
  if (applyBtn) {
    applyBtn.style.display = validCount > 0 ? "inline-flex" : "none";
  }

  // Render preview table
  if (previewTableBody) {
    previewTableBody.innerHTML = "";
    const roster = window.AppStorage.loadFacultyRoster();

    if (validCount === 0) {
      previewTableBody.innerHTML = `<tr><td colspan="8" style="text-align:center; color: var(--color-text-muted); padding: 1rem;">No valid entries found.</td></tr>`;
      return;
    }

    result.validRows.forEach((row, i) => {
      const student = roster.find(s => s.rollNo === row.rollNo);
      const prevVal = student?.marks?.[row.courseId]?.[row.component];
      const prevDisplay = (prevVal !== null && prevVal !== undefined) ? prevVal : `<span class="badge badge-pending">Pending</span>`;
      const newDisplay = row.isPending ? `<span class="badge badge-pending">Pending (clear)</span>` : `<strong>${row.numericValue}</strong>`;

      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td style="text-align:center;">${i + 1}</td>
        <td>${escapeHtml(row.rollNo)}</td>
        <td>${escapeHtml(row.studentName || "")}</td>
        <td><small style="color:var(--color-text-muted);">${escapeHtml(row.courseId)}</small></td>
        <td><span class="badge badge-info" style="background:#eff6ff;color:#1d4ed8;border:1px solid #bfdbfe;">${escapeHtml(row.component?.toUpperCase())}</span></td>
        <td>${newDisplay}</td>
        <td>${prevDisplay}</td>
        <td><span class="badge badge-entered">✔ Valid</span></td>
      `;
      previewTableBody.appendChild(tr);
    });
  }
}

// ---------------------------------------------------------------------------
// Tab 4: Faculty Reports & Analytics
// ---------------------------------------------------------------------------

function renderFacultyReports() {
  const roster = window.AppStorage.loadFacultyRoster();
  if (roster.length === 0) return;

  const classSummary = window.AppCalculator.calculateClassSummary(roster, window.SyllabusData);

  // Render subject breakdown table
  const tbody = document.getElementById("reports-course-body");
  if (tbody) {
    tbody.innerHTML = "";
    classSummary.courseSummaries.forEach(c => {
      const evalComps = c.completedCount;
      const pendComps = c.pendingCount;
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>
          <strong>${escapeHtml(c.name)}</strong>
          <small style="display:block; color:var(--color-text-muted); font-size:0.72rem;">${escapeHtml(c.code)}</small>
        </td>
        <td><span class="badge badge-${c.category.toLowerCase().replace(/[^a-z]/g, '')}">${c.category}</span></td>
        <td style="text-align:center;">${c.enrolledCount}</td>
        <td style="text-align:center; font-weight:600;">${c.averageMarks}</td>
        <td style="text-align:center;">
          <strong style="color:var(--color-primary);">${c.averagePercentage}%</strong>
        </td>
        <td style="text-align:center;">${c.highestEarned}</td>
        <td style="text-align:center;">${c.lowestEarned}</td>
        <td style="text-align:center;"><span class="badge badge-entered">${evalComps}</span></td>
        <td style="text-align:center;"><span class="badge ${pendComps > 0 ? 'badge-pending' : 'badge-entered'}">${pendComps}</span></td>
      `;
      tbody.appendChild(tr);
    });
  }

  // Render charts
  window.AppCharts.renderCohortDistributionChart("cohortDistributionChart", roster);
  window.AppCharts.renderCourseAveragesChart("courseAveragesChart", classSummary.courseSummaries);
}

function exportClassSummaryCsv() {
  const roster = window.AppStorage.loadFacultyRoster();
  const cs = window.AppCalculator.calculateClassSummary(roster, window.SyllabusData);
  const lines = [
    "SNJB COE - Semester V Class Summary Report",
    `Generated: ${new Date().toLocaleString()}`,
    `Total Students: ${cs.totalStudents}`,
    `Class Average (Evaluated %): ${cs.classAveragePercentage}%`,
    `Class Average Semester Standing (/650): ${cs.classAverageSemesterStanding}%`,
    `Top Performer: ${cs.topPerformer ? cs.topPerformer.name + " (" + cs.topPerformer.rollNo + ")" : "N/A"}`,
    `Total Pending Assessments (Cohort): ${cs.totalPendingAcrossCohort}`,
    "",
    "Course Breakdown",
    "Course Name,Code,Category,Enrolled,Avg Marks,Avg %,Highest,Lowest,Evaluated Components,Pending Components"
  ];
  cs.courseSummaries.forEach(c => {
    lines.push([
      `"${c.name}"`, c.code, c.category, c.enrolledCount,
      c.averageMarks, c.averagePercentage + "%",
      c.highestEarned, c.lowestEarned, c.completedCount, c.pendingCount
    ].join(","));
  });

  downloadFile(`SNJB-Class-Summary-${isoDate()}.csv`, lines.join("\n"), "text/csv");
  showToast("Class summary CSV exported.", "success");
}

// ---------------------------------------------------------------------------
// Student Details Modal
// ---------------------------------------------------------------------------

function initStudentDetailsModal() {
  const modal = document.getElementById("studentDetailsModal");
  const closeBtn = document.getElementById("modalCloseBtn");
  const closeBtnF = document.getElementById("modalBtnClose");
  const dashBtn = document.getElementById("modalBtnDashboard");
  const evalBtn = document.getElementById("modalBtnEvaluate");

  function closeModal() {
    if (modal) modal.classList.remove("active");
    _modalTargetRollNo = null;
  }

  if (closeBtn) closeBtn.addEventListener("click", closeModal);
  if (closeBtnF) closeBtnF.addEventListener("click", closeModal);

  if (modal) {
    modal.addEventListener("click", (e) => {
      if (e.target === modal) closeModal();
    });
  }

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && modal && modal.classList.contains("active")) closeModal();
  });

  if (dashBtn) {
    dashBtn.addEventListener("click", () => {
      if (_modalTargetRollNo) setActiveDemoStudent(_modalTargetRollNo);
      closeModal();
    });
  }

  if (evalBtn) {
    evalBtn.addEventListener("click", () => {
      if (_modalTargetRollNo) switchToEvalPanel(_modalTargetRollNo);
      closeModal();
    });
  }
}

window.openStudentDetailsModal = function (rollNo) {
  const student = window.AppStorage.getStudentByRollNo(rollNo);
  if (!student) return;

  _modalTargetRollNo = rollNo;

  const modal = document.getElementById("studentDetailsModal");
  const titleEl = document.getElementById("modalStudentTitle");
  const subEl = document.getElementById("modalStudentSub");
  const bodyEl = document.getElementById("modalStudentBody");

  if (titleEl) titleEl.textContent = `${student.name} — Student Record Details`;
  if (subEl) subEl.textContent = `${student.rollNo} &bull; Semester V (2026-27) &bull; [Fictional Demo Record]`;

  if (bodyEl) {
    const summary = window.AppCalculator.calculateStudentSummary(student);
    const pecTrack = window.SyllabusData.PEC_1_BASKET.find(p => p.id === student.selectedPec1Id);
    const mdmTrack = window.SyllabusData.MDM_3_BASKET.find(m => m.id === student.selectedMdm3Id);
    const oeTrack = window.SyllabusData.OE_2_BASKET.find(o => o.id === student.selectedOe2Id);

    // Build course breakdown rows
    let courseRows = "";
    summary.courseBreakdown.forEach(c => {
      const comps = window.AppCalculator.ASSESSMENT_COMPONENTS.map(k => {
        const comp = c.components[k];
        if (!comp || comp.status === "na") return `<span style="color:var(--color-text-light);">N/A</span>`;
        if (comp.status === "entered") return `<span class="badge badge-entered" style="font-size:0.72rem;">${k.toUpperCase()}: ${comp.value}/${comp.max}</span>`;
        return `<span class="badge badge-pending" style="font-size:0.72rem;">${k.toUpperCase()}: Pending</span>`;
      }).join(" ");

      const pendingStyle = c.pendingCount > 0 ? "color: var(--color-warning);" : "color: var(--color-success);";
      courseRows += `
        <tr>
          <td><strong style="font-size:0.88rem;">${escapeHtml(c.name)}</strong><br>
              <small style="color:var(--color-text-muted);">${escapeHtml(c.code)}</small></td>
          <td><span class="badge badge-${c.category.toLowerCase().replace(/[^a-z]/g, '')}">${c.category}</span></td>
          <td style="font-size:0.82rem;">${comps}</td>
          <td style="text-align:center; font-weight:600;">${c.enteredMarks} / ${c.maxOfEntered}</td>
          <td style="text-align:center;"><span style="${pendingStyle} font-weight:600;">${c.pendingCount === 0 ? "✔ Done" : c.pendingCount + " pending"}</span></td>
        </tr>
      `;
    });

    bodyEl.innerHTML = `
      <!-- Summary Cards -->
      <div style="display:grid; grid-template-columns: repeat(3, 1fr); gap: 0.75rem; margin-bottom: 1.5rem;">
        <div style="background:var(--color-surface-subtle); border-radius: var(--radius-sm); padding: 0.85rem; border: 1px solid var(--color-border);">
          <div style="font-size:0.75rem; color:var(--color-text-muted); font-weight:600; margin-bottom:0.3rem;">EVALUATED MARKS</div>
          <div style="font-size:1.4rem; font-weight:700; color:var(--color-primary);">${summary.totalMarksEntered} / ${summary.maxMarksOfEnteredComponents}</div>
          <div style="font-size:0.78rem; color:var(--color-text-muted);">${summary.enteredPercentage}%</div>
        </div>
        <div style="background:var(--color-surface-subtle); border-radius: var(--radius-sm); padding: 0.85rem; border: 1px solid var(--color-border);">
          <div style="font-size:0.75rem; color:var(--color-text-muted); font-weight:600; margin-bottom:0.3rem;">SEMESTER STANDING</div>
          <div style="font-size:1.4rem; font-weight:700; color:var(--color-text-main);">${summary.projectedSemesterPercentage}%</div>
          <div style="font-size:0.78rem; color:var(--color-text-muted);">${summary.totalMarksEntered} / 650</div>
        </div>
        <div style="background:var(--color-surface-subtle); border-radius: var(--radius-sm); padding: 0.85rem; border: 1px solid var(--color-border);">
          <div style="font-size:0.75rem; color:var(--color-text-muted); font-weight:600; margin-bottom:0.3rem;">PENDING COMPONENTS</div>
          <div style="font-size:1.4rem; font-weight:700; color:var(--color-warning);">${summary.pendingComponentsCount}</div>
          <div style="font-size:0.78rem; color:var(--color-text-muted);">of ${summary.totalApplicableComponentsCount} total</div>
        </div>
      </div>

      <!-- Elective Tracks -->
      <div style="margin-bottom:1.25rem; display:flex; gap:0.5rem; flex-wrap:wrap;">
        <span class="badge badge-pec">PEC-I: ${escapeHtml(pecTrack ? pecTrack.theory.name : student.selectedPec1Id)}</span>
        <span class="badge badge-mdm">MDM-III: ${escapeHtml(mdmTrack ? mdmTrack.theory.name : student.selectedMdm3Id)}</span>
        <span class="badge badge-oe">OE-II: ${escapeHtml(oeTrack ? oeTrack.name : student.selectedOe2Id)}</span>
      </div>

      <!-- Course Breakdown Table -->
      <div style="font-weight:700; font-size:0.85rem; margin-bottom:0.5rem; color:var(--color-text-main);">Course-wise Evaluation Status</div>
      <div class="table-responsive" style="max-height: 320px; overflow-y: auto;">
        <table class="data-table" style="font-size: 0.82rem;">
          <thead>
            <tr>
              <th>Course</th>
              <th>Category</th>
              <th>Component Status</th>
              <th style="text-align:center;">Earned / Max (Eval.)</th>
              <th style="text-align:center;">Progress</th>
            </tr>
          </thead>
          <tbody>${courseRows}</tbody>
        </table>
      </div>

      <!-- Demo Disclaimer -->
      <div style="margin-top:1rem; padding: 0.65rem 0.9rem; background: #fffbeb; border: 1px solid #fde68a; border-radius: var(--radius-sm); font-size: 0.78rem; color: #92400e;">
        ⚠️ <strong>Fictional Record:</strong> All student names, roll numbers, and marks above are synthetic demo data stored in browser localStorage only. Real production deployment requires server-side storage, authentication, and audit logging.
      </div>
    `;
  }

  if (modal) modal.classList.add("active");
};

// ---------------------------------------------------------------------------
// Global helpers for roster row action buttons
// ---------------------------------------------------------------------------

window.setActiveDemoStudent = function (rollNo) {
  const roster = window.AppStorage.loadFacultyRoster();
  const found = roster.find(s => s.rollNo === rollNo);
  if (found) {
    window.AppStorage.saveCurrentStudentProfile(found);
    window.location.href = "index.html";
  }
};

window.switchToEvalPanel = function (rollNo) {
  // Switch to Tab 2 and select the student
  const tabBtns = document.querySelectorAll(".faculty-tab-btn");
  const tabPanes = document.querySelectorAll(".tab-pane");
  tabBtns.forEach(b => b.classList.remove("active"));
  tabPanes.forEach(p => p.classList.remove("active"));

  const evalTabBtn = document.querySelector('.faculty-tab-btn[data-tab="tab-evaluation"]');
  const evalPane = document.getElementById("tab-evaluation");
  if (evalTabBtn) evalTabBtn.classList.add("active");
  if (evalPane) evalPane.classList.add("active");

  // Select the student in the eval dropdown
  const evalSelect = document.getElementById("eval-student-select");
  if (evalSelect) evalSelect.value = rollNo;
  _currentEvalRollNo = rollNo;
  renderEvalPanel(rollNo);

  // Scroll to eval panel
  evalPane?.scrollIntoView({ behavior: "smooth", block: "start" });
};

// Legacy alias kept for compatibility with old HTML onclick attributes
window.editDemoStudent = function (rollNo) {
  window.switchToEvalPanel(rollNo);
};

// ===========================================================================
// 4. AI ASSISTANT PAGE (ai-assistant.html)
// ===========================================================================

function initAiAssistantPage() {
  const profile = window.AppStorage.loadCurrentStudentProfile();

  const nameEl = document.getElementById("chat-student-name");
  const rollEl = document.getElementById("chat-student-roll");
  const tracksEl = document.getElementById("chat-student-tracks");

  if (nameEl) nameEl.textContent = profile.name || "Student Demo";
  if (rollEl) rollEl.textContent = profile.rollNo || "TY-COMP-01";

  if (tracksEl) {
    const pecTrack = window.SyllabusData.PEC_1_BASKET.find(p => p.id === profile.selectedPec1Id);
    const mdmTrack = window.SyllabusData.MDM_3_BASKET.find(m => m.id === profile.selectedMdm3Id);
    const oeTrack = window.SyllabusData.OE_2_BASKET.find(o => o.id === profile.selectedOe2Id);
    tracksEl.innerHTML = `
      <span class="badge badge-pec">PEC-I: ${pecTrack ? pecTrack.theory.name : profile.selectedPec1Id}</span>
      <span class="badge badge-mdm">MDM-III: ${mdmTrack ? mdmTrack.theory.name : profile.selectedMdm3Id}</span>
      <span class="badge badge-oe">OE-II: ${oeTrack ? oeTrack.name : profile.selectedOe2Id}</span>
    `;
  }

  checkAiServerStatus();

  const chatForm = document.getElementById("chat-form");
  const chatInput = document.getElementById("chat-input-field");
  const chatBody = document.getElementById("chat-body");

  if (chatForm && chatInput && chatBody) {
    chatForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const message = chatInput.value.trim();
      if (!message) return;

      chatInput.value = "";
      chatInput.disabled = true;
      appendChatMessage("user", message);
      const loadingBubble = appendLoadingBubble();

      try {
        const roster = window.AppStorage.loadFacultyRoster();
        const response = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message,
            profile,
            roster,
            history: chatHistory
          })
        });

        loadingBubble.remove();

        const data = await response.json();

        if (!response.ok) {
          appendChatMessage("assistant", `⚠️ **Error:** ${data.error || "Failed to communicate with AI Assistant."}`);
          return;
        }

        if (data.toolsExecuted && data.toolsExecuted.length > 0) {
          appendToolExecutionBadges(data.toolsExecuted);
        }

        appendChatMessage("assistant", data.reply);

        chatHistory.push({ role: "user", text: message });
        chatHistory.push({ role: "model", text: data.reply });

      } catch (err) {
        loadingBubble.remove();
        appendChatMessage("assistant",
          `⚠️ **Connection Error:** Could not reach the Node backend server. Start \`node server.js\` in PowerShell.<br><small>${escapeHtml(err.message)}</small>`
        );
      } finally {
        chatInput.disabled = false;
        chatInput.focus();
      }
    });
  }

  // Prompt pills
  const pills = document.querySelectorAll(".prompt-pill");
  pills.forEach(pill => {
    pill.addEventListener("click", () => {
      const promptText = pill.getAttribute("data-prompt");
      if (promptText && chatInput && chatForm) {
        chatInput.value = promptText;
        chatForm.dispatchEvent(new Event("submit"));
      }
    });
  });

  // Syllabus FAQ search + accordions
  const searchInput = document.getElementById("syllabus-search-input");
  const faqItems = document.querySelectorAll(".faq-card");

  faqItems.forEach(card => {
    const q = card.querySelector(".faq-question");
    const a = card.querySelector(".faq-answer");
    if (q && a) {
      q.addEventListener("click", () => {
        const isOpen = a.style.display === "block";
        a.style.display = isOpen ? "none" : "block";
        q.querySelector("span:last-child") && (q.querySelector("span:last-child").textContent = isOpen ? "▸" : "▾");
      });
    }
  });

  if (searchInput) {
    searchInput.addEventListener("input", (e) => {
      const term = e.target.value.toLowerCase().trim();
      faqItems.forEach(card => {
        card.style.display = card.textContent.toLowerCase().includes(term) ? "" : "none";
      });
    });
  }
}

async function checkAiServerStatus() {
  const statusIndicator = document.getElementById("chat-status-indicator");
  const statusDot = statusIndicator ? statusIndicator.querySelector(".status-dot") : null;
  const statusText = document.getElementById("chat-status-text");
  const statusBanner = document.getElementById("api-status-banner");
  const statusMsg = document.getElementById("api-status-msg");

  try {
    const res = await fetch("/api/status");
    if (!res.ok) throw new Error("Status endpoint returned " + res.status);
    const data = await res.json();

    if (data.configured) {
      if (statusIndicator) statusIndicator.className = "chat-status-pill online";
      if (statusDot) statusDot.className = "status-dot online";
      if (statusText) statusText.textContent = "Gemini 2.5 Flash Online";
      if (statusBanner) statusBanner.style.display = "none";
    } else {
      if (statusIndicator) statusIndicator.className = "chat-status-pill offline";
      if (statusDot) statusDot.className = "status-dot offline";
      if (statusText) statusText.textContent = "API Key Required";
      if (statusBanner) {
        statusBanner.style.display = "flex";
        statusBanner.className = "alert-banner warning";
        if (statusMsg) statusMsg.innerHTML = `<code>GEMINI_API_KEY</code> is not set. Add it to <code>.env</code> and restart <code>node server.js</code>.`;
      }
    }
  } catch (e) {
    if (statusIndicator) statusIndicator.className = "chat-status-pill offline";
    if (statusDot) statusDot.className = "status-dot offline";
    if (statusText) statusText.textContent = "Server Offline";
    if (statusBanner) {
      statusBanner.style.display = "flex";
      statusBanner.className = "alert-banner danger";
      if (statusMsg) statusMsg.innerHTML = "Node.js server is not running. Launch with <code>node server.js</code> to activate AI.";
    }
  }
}

function appendChatMessage(role, content) {
  const chatBody = document.getElementById("chat-body");
  if (!chatBody) return;

  const msgDiv = document.createElement("div");
  msgDiv.className = `chat-message ${role}`;

  const bubbleDiv = document.createElement("div");
  bubbleDiv.className = "chat-bubble";
  bubbleDiv.innerHTML = role === "user" ? escapeHtml(content) : renderMarkdown(content);

  msgDiv.appendChild(bubbleDiv);
  chatBody.appendChild(msgDiv);
  chatBody.scrollTop = chatBody.scrollHeight;
  return msgDiv;
}

function appendLoadingBubble() {
  const chatBody = document.getElementById("chat-body");
  const msgDiv = document.createElement("div");
  msgDiv.className = "chat-message assistant";
  msgDiv.innerHTML = `
    <div class="chat-bubble" style="color: var(--color-text-muted); font-style: italic; display: flex; align-items: center; gap: 0.5rem;">
      <span style="display:inline-block; width:8px; height:8px; border-radius:50%; background:var(--color-primary); animation: pulse 1s ease-in-out infinite;"></span>
      Thinking &amp; executing academic tools…
    </div>
  `;
  chatBody.appendChild(msgDiv);
  chatBody.scrollTop = chatBody.scrollHeight;
  return msgDiv;
}

function appendToolExecutionBadges(tools) {
  const chatBody = document.getElementById("chat-body");
  if (!chatBody) return;

  const wrapper = document.createElement("div");
  wrapper.className = "chat-message assistant";
  wrapper.style.cssText = "gap: 0.4rem; display: flex; flex-direction: column;";

  tools.forEach(t => {
    const badge = document.createElement("div");
    badge.className = "tool-run-badge";
    badge.title = "Click to inspect tool output";
    badge.innerHTML = `⚙️ Tool Executed: <strong>${escapeHtml(t.name)}</strong> <small style="color: #3b82f6;">(Click to expand data)</small>`;

    const details = document.createElement("div");
    details.className = "tool-details";
    details.style.display = "none";
    details.innerHTML = `<pre style="white-space: pre-wrap; overflow-x: auto;">${escapeHtml(JSON.stringify(t.result, null, 2))}</pre>`;

    badge.addEventListener("click", () => {
      details.style.display = details.style.display === "none" ? "block" : "none";
    });

    wrapper.appendChild(badge);
    wrapper.appendChild(details);
  });

  chatBody.appendChild(wrapper);
  chatBody.scrollTop = chatBody.scrollHeight;
}

// ===========================================================================
// HELPERS
// ===========================================================================

function isoDate() {
  return new Date().toISOString().slice(0, 10);
}

// ===========================================================================
// PUBLIC API EXPOSURE
// ===========================================================================

window.App = {
  initDashboardPage,
  initCalculatorPage,
  initFacultyPage,
  initAiAssistantPage
};
