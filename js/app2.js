/**
 * app2.js — Page Controller v2.0
 * SNJB Marks Assistant · Warm Editorial-SaaS Design
 * Wires Dashboard, Calculator, Faculty Panel, AI Assistant
 * Depends: syllabus-data.js, storage.js, calculator.js, charts.js (opt), shell.js
 */

'use strict';

/* ─────────────────────────────────────────────────────────────────
   SHARED HELPERS
───────────────────────────────────────────────────────────────── */

function fmt(n, decimals = 2) {
  return (n == null || isNaN(n)) ? '—' : Number(n).toFixed(decimals);
}

function pct(earned, max) {
  if (!max || max === 0) return null;
  return (earned / max) * 100;
}

function avatarColor(rollNo) {
  const palette = ['#F6D54A', '#B9CDF5', '#F4B8D9', '#BFE5CF', '#F2A59A'];
  return palette[(rollNo || '').charCodeAt((rollNo || '').length - 1) % palette.length];
}

function initials(name) {
  return (name || '??').split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();
}

function statusChip(pct, pendingCount) {
  if (pendingCount > 0) return `<span class="chip chip-pending">${pendingCount} pending</span>`;
  if (pct >= 85) return `<span class="chip chip-mint">Excellent</span>`;
  if (pct >= 60) return `<span class="chip chip-blue">Good</span>`;
  return `<span class="chip chip-coral">Needs Attention</span>`;
}

function getCoursesForStudent(student) {
  if (!student || typeof AppStorage === 'undefined') return [];
  return AppStorage.getActiveCourses(
    student.selectedPec1Id,
    student.selectedMdm3Id,
    student.selectedOe2Id
  );
}

function getSummaryForStudent(student) {
  const courses = getCoursesForStudent(student);
  let entered = 0, enteredMax = 0, pending = 0, total = SEMESTER_MAX_MARKS || 650;
  courses.forEach(course => {
    const studentMarks = (student.marks || {})[course.id] || {};
    ASSESSMENT_COMPONENTS.forEach(comp => {
      const maxVal = course.maxMarks[comp];
      if (maxVal === null || maxVal === undefined) return;
      const v = studentMarks[comp];
      if (v !== null && v !== undefined) {
        entered += Number(v);
        enteredMax += maxVal;
      } else {
        pending++;
      }
    });
  });
  const evalPct = enteredMax > 0 ? (entered / enteredMax) * 100 : null;
  const semPct = (entered / total) * 100;
  return { entered, enteredMax, pending, total, evalPct, semPct };
}

/* ─────────────────────────────────────────────────────────────────
   PAGE DETECTION & DISPATCH
───────────────────────────────────────────────────────────────── */

const PAGE = location.pathname.split('/').pop().replace('.html', '') || 'index';

document.addEventListener('DOMContentLoaded', () => {
  if (PAGE === 'index' || PAGE === '') initDashboard();
  if (PAGE === 'calculator') initCalculator();
  if (PAGE === 'faculty') initFaculty();
  if (PAGE === 'ai-assistant') initAI();
});

/* ═══════════════════════════════════════════════════════════════
   PAGE 1 — DASHBOARD
═══════════════════════════════════════════════════════════════ */

function initDashboard() {
  const student = AppStorage.loadStudentProfile();
  if (!student) return;

  const courses = getCoursesForStudent(student);
  const sum = getSummaryForStudent(student);

  // Greeting
  const firstName = student.name.split(' ')[0];
  const greetEl = document.getElementById('pageGreeting');
  if (greetEl) greetEl.textContent = `Stay up to date, ${firstName}.`;
  const rollEl = document.getElementById('profile-roll');
  if (rollEl) rollEl.textContent = student.rollNo;

  // Elective track chips in header
  const trackHeader = document.getElementById('profile-tracks');
  if (trackHeader) {
    const pec = AppStorage.getPec1Course(student.selectedPec1Id);
    const mdm = AppStorage.getMdm3Course(student.selectedMdm3Id);
    const oe = AppStorage.getOe2Course(student.selectedOe2Id);
    [
      { label: pec?.name || 'PEC-I', color: 'chip-pink' },
      { label: mdm?.name || 'MDM-III', color: 'chip-blue' },
      { label: oe?.name || 'OE-II', color: 'chip-mint' },
    ].forEach(t => {
      const span = document.createElement('span');
      span.className = `chip ${t.color}`;
      span.textContent = t.label;
      trackHeader.appendChild(span);
    });
  }

  // KPI Cards
  document.getElementById('stat-entered-marks').textContent = `${sum.entered} / ${sum.enteredMax}`;
  document.getElementById('stat-entered-subtext').textContent = `Of ${sum.enteredMax} evaluated max marks`;
  document.getElementById('stat-percentage').textContent = sum.evalPct != null ? `${fmt(sum.evalPct, 1)}%` : '—%';
  document.getElementById('stat-progress').textContent = `${21 - sum.pending} of 21`;
  document.getElementById('stat-progress-subtext').textContent = `${sum.pending} components still pending`;
  document.getElementById('stat-projected').textContent = `${fmt(sum.semPct, 1)}%`;
  document.getElementById('stat-projected-subtext').textContent = `${sum.entered} of ${sum.total} total marks`;

  // Radial progress (out of 650)
  const rpFill = document.getElementById('rp-fill-circle');
  const rpValue = document.getElementById('rp-value');
  const rpLabel = document.getElementById('rp-earned-label');
  if (rpFill) {
    const circumference = 2 * Math.PI * 56; // r=56
    const offset = circumference * (1 - (sum.entered / sum.total));
    rpFill.style.strokeDasharray = circumference;
    rpFill.style.strokeDashoffset = Math.max(0, offset);
    rpFill.style.stroke = sum.semPct >= 60 ? 'var(--mint-text)' : sum.semPct >= 40 ? 'var(--yellow)' : 'var(--coral-text)';
  }
  if (rpValue) rpValue.textContent = `${fmt(sum.semPct, 0)}%`;
  if (rpLabel) rpLabel.textContent = `${sum.entered} earned`;

  // Pending notification dot
  const dot = document.getElementById('notifDot');
  if (dot) dot.style.display = sum.pending > 0 ? 'block' : 'none';

  // Pending count chip
  const pendingChip = document.getElementById('pendingCountChip');
  if (pendingChip) {
    pendingChip.textContent = `${sum.pending}`;
    pendingChip.className = sum.pending === 0 ? 'chip chip-mint' : 'chip chip-coral';
  }

  // Pending assessments list
  renderPendingList(student, courses);

  // Elective tracks panel
  renderTracksPanel(student);

  // Course table
  renderDashboardCoursesTable(student, courses);

  // Charts
  renderDashboardCharts(student, courses);
}

function renderPendingList(student, courses) {
  const listEl = document.getElementById('pendingAssessmentsList');
  const emptyEl = document.getElementById('pendingEmptyState');
  if (!listEl) return;

  const icons = { cie: '📝', mse: '📋', see: '📖', tw: '🔬', pr: '⚙️', or: '📊' };
  const compLabels = { cie: 'CIE', mse: 'MSE', see: 'SEE', tw: 'Term Work', pr: 'Practical', or: 'Oral' };
  const iconColors = { cie: 'chip-yellow', mse: 'chip-blue', see: 'chip-pink', tw: 'chip-mint', pr: 'chip-beige', or: 'chip-coral' };

  const items = [];
  courses.forEach(course => {
    const sm = (student.marks || {})[course.id] || {};
    ASSESSMENT_COMPONENTS.forEach(comp => {
      if (course.maxMarks[comp] == null) return;
      if (sm[comp] == null) items.push({ course, comp });
    });
  });

  if (items.length === 0) {
    listEl.style.display = 'none';
    if (emptyEl) emptyEl.style.display = 'flex';
    return;
  }

  if (emptyEl) emptyEl.style.display = 'none';

  listEl.innerHTML = items.slice(0, 8).map(({ course, comp }) => `
    <div class="assess-item">
      <div class="assess-icon ${iconColors[comp]}" style="background:var(--${comp === 'cie' ? 'yellow' : comp === 'mse' ? 'blue-dim' : comp === 'see' ? 'pink-dim' : comp === 'tw' ? 'mint-dim' : 'cream-dark'});">
        ${icons[comp]}
      </div>
      <div class="assess-info">
        <div class="assess-name">${compLabels[comp]} — Max ${course.maxMarks[comp]}</div>
        <div class="assess-course">${course.name}</div>
      </div>
      <a href="calculator.html" class="btn btn-primary btn-sm">Enter →</a>
    </div>
  `).join('');

  if (items.length > 8) {
    listEl.innerHTML += `<div style="text-align:center;padding:var(--sp-3);font-size:var(--text-xs);color:var(--ink-muted);">+${items.length - 8} more — <a href="calculator.html" style="font-weight:700;color:var(--ink);">view all</a></div>`;
  }
}

function renderTracksPanel(student) {
  const el = document.getElementById('profile-tracks-panel');
  if (!el) return;
  const trackDefs = [
    { label: 'PEC-I', id: student.selectedPec1Id, color: 'var(--pink)', textColor: 'var(--pink-text)' },
    { label: 'MDM-III', id: student.selectedMdm3Id, color: 'var(--blue)', textColor: 'var(--blue-text)' },
    { label: 'OE-II', id: student.selectedOe2Id, color: 'var(--mint)', textColor: 'var(--mint-text)' },
  ];
  el.innerHTML = trackDefs.map(t => {
    const name = (t.label === 'PEC-I' ? AppStorage.getPec1Course(t.id)?.name :
      t.label === 'MDM-III' ? AppStorage.getMdm3Course(t.id)?.name :
        AppStorage.getOe2Course(t.id)?.name) || t.id;
    return `
      <div style="padding:var(--sp-3) var(--sp-4);background:${t.color};border-radius:var(--r-md);display:flex;align-items:center;justify-content:space-between;">
        <span style="font-size:var(--text-xs);font-weight:700;color:${t.textColor};opacity:.7;">${t.label}</span>
        <span style="font-size:var(--text-sm);font-weight:700;color:${t.textColor};">${name}</span>
      </div>`;
  }).join('');
}

function renderDashboardCoursesTable(student, courses) {
  const tbody = document.getElementById('dashboard-courses-body');
  if (!tbody) return;
  const catColor = { PCC: 'chip-blue', PEC: 'chip-pink', MDM: 'chip-blue', OE: 'chip-mint', VEC: 'chip-beige' };
  tbody.innerHTML = courses.map((course, i) => {
    const sm = (student.marks || {})[course.id] || {};
    let entered = 0, max = 0, pendCount = 0;
    const compParts = [];
    ASSESSMENT_COMPONENTS.forEach(comp => {
      if (course.maxMarks[comp] == null) return;
      const v = sm[comp];
      if (v != null) { entered += Number(v); max += course.maxMarks[comp]; compParts.push(`${comp.toUpperCase()}:${v}`); }
      else { pendCount++; }
    });
    const p = max > 0 ? (entered / max) * 100 : 0;
    const cat = course.category || 'PCC';
    return `<tr>
      <td style="color:var(--ink-muted);font-size:var(--text-xs);">${i + 1}</td>
      <td>
        <div style="font-weight:600;font-size:var(--text-sm);">${course.name}</div>
        <div style="font-size:10px;color:var(--ink-muted);">${course.code || ''}</div>
      </td>
      <td><span class="chip ${catColor[cat] || 'chip-beige'}">${cat}</span></td>
      <td style="font-size:11px;color:var(--ink-muted);max-width:160px;">${compParts.join(', ') || '<em>none entered</em>'}</td>
      <td style="font-weight:700;">${entered} / ${max || course.maxMarks?.total || '—'}</td>
      <td style="font-weight:600;">${max > 0 ? fmt(p, 1) + '%' : '—'}</td>
      <td>
        <div style="display:flex;align-items:center;gap:8px;">
          <div class="progress-bar" style="width:80px;">
            <div class="progress-fill ${p >= 60 ? 'fill-mint' : p >= 40 ? 'fill-yellow' : 'fill-coral'}" style="width:${Math.min(100, p)}%;"></div>
          </div>
          <span style="font-size:10px;color:var(--ink-muted);">${fmt(p, 0)}%</span>
        </div>
      </td>
    </tr>`;
  }).join('');
}

function renderDashboardCharts(student, courses) {
  const subjectCanvas = document.getElementById('subjectPerformanceChart');
  const breakdownCanvas = document.getElementById('assessmentBreakdownChart');
  const legendEl = document.getElementById('breakdownLegend');

  const COLORS = ['#F6D54A', '#B9CDF5', '#F4B8D9', '#BFE5CF', '#F2A59A', '#C8B8F5', '#F5C8A0', '#A0E8D0', '#E8A0C8'];

  if (subjectCanvas) {
    const labels = [], obtained = [], maxes = [];
    courses.forEach(course => {
      const sm = (student.marks || {})[course.id] || {};
      let e = 0, m = 0;
      ASSESSMENT_COMPONENTS.forEach(comp => {
        if (course.maxMarks[comp] == null) return;
        if (sm[comp] != null) { e += Number(sm[comp]); m += course.maxMarks[comp]; }
      });
      if (m > 0) {
        labels.push(course.name.length > 18 ? course.name.substring(0, 16) + '…' : course.name);
        obtained.push(e);
        maxes.push(m);
      }
    });

    new Chart(subjectCanvas, {
      type: 'bar',
      data: {
        labels,
        datasets: [
          { label: 'Obtained', data: obtained, backgroundColor: '#121212', borderRadius: 6, barThickness: 18 },
          { label: 'Max Evaluated', data: maxes, backgroundColor: 'rgba(18,18,18,.08)', borderRadius: 6, barThickness: 18 },
        ]
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { display: true, labels: { font: { family: "'Plus Jakarta Sans'", size: 11 }, color: '#4A4A4A' } } },
        scales: {
          x: { grid: { display: false }, ticks: { font: { family: "'Plus Jakarta Sans'", size: 11 }, color: '#4A4A4A' } },
          y: { grid: { color: 'rgba(0,0,0,.05)' }, ticks: { font: { family: "'Plus Jakarta Sans'", size: 11 }, color: '#4A4A4A' } }
        }
      }
    });
  }

  if (breakdownCanvas && legendEl) {
    const sm = student.marks || {};
    let theory = 0, lab = 0, pending = 0;
    courses.forEach(course => {
      const cm = sm[course.id] || {};
      ASSESSMENT_COMPONENTS.forEach(comp => {
        if (course.maxMarks[comp] == null) return;
        if (cm[comp] != null) {
          if (['cie', 'mse', 'see'].includes(comp)) theory += course.maxMarks[comp];
          else lab += course.maxMarks[comp];
        } else {
          pending += course.maxMarks[comp];
        }
      });
    });
    const total = theory + lab + pending;
    new Chart(breakdownCanvas, {
      type: 'doughnut',
      data: {
        labels: ['Theory (CIE/MSE/SEE)', 'Lab (TW/PR/OR)', 'Pending'],
        datasets: [{ data: [theory, lab, pending], backgroundColor: ['#121212', '#B9CDF5', '#EDE6D6'], borderWidth: 0, hoverOffset: 6 }]
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        cutout: '70%',
        plugins: { legend: { display: false } }
      }
    });
    legendEl.innerHTML = [
      { label: 'Theory', val: theory, color: '#121212', textColor: '#F7F1E3' },
      { label: 'Lab', val: lab, color: '#B9CDF5', textColor: '#1A3A7A' },
      { label: 'Pending', val: pending, color: '#EDE6D6', textColor: '#4A4A4A' }
    ].map(d => `
      <div style="display:flex;align-items:center;gap:10px;">
        <div style="width:12px;height:12px;border-radius:3px;background:${d.color};border:1.5px solid rgba(0,0,0,.1);flex-shrink:0;"></div>
        <div>
          <div style="font-size:12px;font-weight:600;">${d.label}</div>
          <div style="font-size:11px;color:var(--ink-muted);">${d.val} / ${total} marks</div>
        </div>
      </div>`).join('');
  }
}

/* ═══════════════════════════════════════════════════════════════
   PAGE 2 — MARKS CALCULATOR
═══════════════════════════════════════════════════════════════ */

const COMP_LABELS = { cie: 'CIE', mse: 'MSE', see: 'SEE', tw: 'Term Work', pr: 'Practical', or: 'Oral' };

let _calcStudent = null;
let _calcCourses = [];
let _activeCourseTab = 0;

function initCalculator() {
  _calcStudent = AppStorage.loadStudentProfile();
  if (!_calcStudent) return;

  // Populate elective selectors
  populateElectiveSelects();

  // Build course tabs + cards
  buildCourseUI();

  // Save buttons
  ['btn-save-calculator', 'calc-save-btn-inner'].forEach(id => {
    const btn = document.getElementById(id);
    if (btn) btn.addEventListener('click', saveCalculator);
  });

  // Reset button
  const resetBtn = document.getElementById('btn-reset-calculator');
  if (resetBtn) resetBtn.addEventListener('click', () => openModal('resetModal'));

  document.getElementById('resetModalCancel')?.addEventListener('click', () => closeModal('resetModal'));
  document.getElementById('resetModalClose')?.addEventListener('click', () => closeModal('resetModal'));
  document.getElementById('resetModalConfirm')?.addEventListener('click', () => {
    AppStorage.resetStudentToDefaults(_calcStudent.rollNo);
    _calcStudent = AppStorage.loadStudentProfile();
    buildCourseUI();
    closeModal('resetModal');
    showToast('Student reset to demo defaults.', 'info');
  });

  // Student name in reset modal
  const nameEl = document.getElementById('resetModalStudentName');
  if (nameEl) nameEl.textContent = _calcStudent.name;

  // Topbar search: filter course tabs
  const searchEl = document.getElementById('topbarSearch');
  if (searchEl) searchEl.addEventListener('input', () => {
    const q = searchEl.value.toLowerCase();
    document.querySelectorAll('.pill-tab').forEach(btn => {
      btn.style.display = btn.textContent.toLowerCase().includes(q) ? '' : 'none';
    });
  });

  updateCalcSummary();
}

function populateElectiveSelects() {
  const pec1Sel = document.getElementById('select-pec1');
  const mdm3Sel = document.getElementById('select-mdm3');
  const oe2Sel = document.getElementById('select-oe2');

  if (pec1Sel && typeof SyllabusData !== 'undefined') {
    pec1Sel.innerHTML = SyllabusData.PEC1_COURSES.map(c =>
      `<option value="${c.id}" ${_calcStudent.selectedPec1Id === c.id ? 'selected' : ''}>${c.name}</option>`
    ).join('');
    pec1Sel.addEventListener('change', () => onElectiveChange());
  }
  if (mdm3Sel && typeof SyllabusData !== 'undefined') {
    mdm3Sel.innerHTML = SyllabusData.MDM3_COURSES.map(c =>
      `<option value="${c.id}" ${_calcStudent.selectedMdm3Id === c.id ? 'selected' : ''}>${c.name}</option>`
    ).join('');
    mdm3Sel.addEventListener('change', () => onElectiveChange());
  }
  if (oe2Sel && typeof SyllabusData !== 'undefined') {
    oe2Sel.innerHTML = SyllabusData.OE2_COURSES.map(c =>
      `<option value="${c.id}" ${_calcStudent.selectedOe2Id === c.id ? 'selected' : ''}>${c.name}</option>`
    ).join('');
    oe2Sel.addEventListener('change', () => onElectiveChange());
  }
}

function onElectiveChange() {
  const p = document.getElementById('select-pec1')?.value;
  const m = document.getElementById('select-mdm3')?.value;
  const o = document.getElementById('select-oe2')?.value;
  if (p) _calcStudent.selectedPec1Id = p;
  if (m) _calcStudent.selectedMdm3Id = m;
  if (o) _calcStudent.selectedOe2Id = o;
  AppStorage.saveStudentProfile(_calcStudent);
  buildCourseUI();
  showToast('Elective tracks updated.', 'success');
}

function buildCourseUI() {
  _calcCourses = getCoursesForStudent(_calcStudent);
  const tabsEl = document.getElementById('courseTabs');
  const gridEl = document.getElementById('calcCourseGrid');
  if (!tabsEl || !gridEl) return;

  const catColor = { PCC: 'chip-blue', PEC: 'chip-pink', MDM: 'chip-blue', OE: 'chip-mint', VEC: 'chip-beige' };

  tabsEl.innerHTML = _calcCourses.map((c, i) => `
    <button class="pill-tab ${i === _activeCourseTab ? 'active' : ''}" data-idx="${i}" role="tab">
      ${c.name.split(' ').slice(0, 3).join(' ')}
      <span class="chip ${catColor[c.category] || 'chip-beige'}" style="font-size:9px;padding:2px 6px;margin-left:4px;">${c.category}</span>
    </button>
  `).join('');

  tabsEl.querySelectorAll('.pill-tab').forEach(btn => {
    btn.addEventListener('click', () => {
      _activeCourseTab = +btn.dataset.idx;
      tabsEl.querySelectorAll('.pill-tab').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      gridEl.querySelectorAll('.course-card-section').forEach((s, i) => {
        s.style.display = i === _activeCourseTab ? '' : 'none';
      });
    });
  });

  gridEl.innerHTML = _calcCourses.map((course, ci) => {
    const sm = (_calcStudent.marks || {})[course.id] || {};
    const comps = ASSESSMENT_COMPONENTS.filter(comp => course.maxMarks[comp] != null);
    return `
    <div class="course-card-section" data-course-idx="${ci}" style="${ci !== _activeCourseTab ? 'display:none;' : ''}">
      <div style="margin-bottom:var(--sp-4);">
        <div style="font-size:var(--text-lg);font-weight:700;margin-bottom:4px;">${course.name}</div>
        <div style="font-size:var(--text-xs);color:var(--ink-muted);">${course.code || ''} · ${course.categoryFullName || ''}</div>
      </div>
      <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(180px,1fr));gap:var(--sp-4);">
        ${comps.map(comp => buildComponentCard(course, comp, sm[comp])).join('')}
      </div>
    </div>`;
  }).join('');

  // Wire inputs
  gridEl.querySelectorAll('.comp-input').forEach(input => {
    input.addEventListener('input', onCompInput);
    input.addEventListener('change', onCompInput);
  });

  updateCalcSummary();
}

function buildComponentCard(course, comp, currentValue) {
  const maxVal = course.maxMarks[comp];
  const compName = COMP_LABELS[comp] || comp.toUpperCase();
  const val = currentValue != null ? currentValue : '';
  return `
  <div class="component-card ${currentValue != null ? 'valid-card' : ''}" id="comp-card-${course.id}-${comp}">
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:var(--sp-3);">
      <div>
        <div style="font-weight:700;font-size:var(--text-sm);">${compName}</div>
        <div style="font-size:var(--text-xs);color:var(--ink-muted);">Max: ${maxVal}</div>
      </div>
      <div id="comp-status-${course.id}-${comp}" style="font-size:20px;">${currentValue != null ? '✅' : '⏳'}</div>
    </div>
    <input
      type="number"
      class="mark-input comp-input ${currentValue != null ? 'valid' : ''}"
      data-course="${course.id}"
      data-comp="${comp}"
      data-max="${maxVal}"
      value="${val}"
      min="0" max="${maxVal}"
      placeholder="0–${maxVal}"
      aria-label="${compName} for ${course.name}"
    >
    <div class="field-error" id="comp-err-${course.id}-${comp}" style="display:none;margin-top:var(--sp-1);"></div>
  </div>`;
}

function onCompInput(e) {
  const input = e.target;
  const courseId = input.dataset.course;
  const comp = input.dataset.comp;
  const maxVal = Number(input.dataset.max);
  const raw = input.value.trim();
  const card = document.getElementById(`comp-card-${courseId}-${comp}`);
  const errEl = document.getElementById(`comp-err-${courseId}-${comp}`);
  const statusEl = document.getElementById(`comp-status-${courseId}-${comp}`);

  let valid = true, errMsg = '';

  if (raw === '') {
    // Pending — clear
    input.classList.remove('valid', 'invalid');
    card?.classList.remove('valid-card', 'invalid-card');
    if (statusEl) statusEl.textContent = '⏳';
  } else {
    const num = Number(raw);
    if (isNaN(num) || raw === '') { valid = false; errMsg = 'Must be a number.'; }
    else if (num < 0) { valid = false; errMsg = 'Cannot be negative.'; }
    else if (num > maxVal) { valid = false; errMsg = `Max is ${maxVal}.`; }

    input.classList.toggle('valid', valid);
    input.classList.toggle('invalid', !valid);
    card?.classList.toggle('valid-card', valid);
    card?.classList.toggle('invalid-card', !valid);
    if (statusEl) statusEl.textContent = valid ? '✅' : '❌';
  }

  if (errEl) { errEl.textContent = errMsg; errEl.style.display = errMsg ? 'flex' : 'none'; }

  // Update in-memory model
  if (!_calcStudent.marks[courseId]) _calcStudent.marks[courseId] = {};
  _calcStudent.marks[courseId][comp] = (raw === '' || !valid) ? null : Number(raw);

  updateCalcSummary();
}

function updateCalcSummary() {
  if (!_calcStudent) return;
  const sum = getSummaryForStudent(_calcStudent);

  const set = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
  set('calc-total-entered', sum.entered);
  set('calc-max-entered', sum.enteredMax);
  set('calc-entered-percentage', sum.evalPct != null ? `${fmt(sum.evalPct, 1)}%` : '—%');
  set('calc-semester-standing', `${fmt(sum.semPct, 1)}%`);
  set('calc-pending-count', `${sum.pending} of 21`);

  const bar = document.getElementById('calc-progress-bar');
  if (bar) bar.style.width = `${Math.min(100, sum.semPct)}%`;
}

function saveCalculator() {
  // Re-read all inputs before saving
  document.querySelectorAll('.comp-input').forEach(input => {
    const courseId = input.dataset.course;
    const comp = input.dataset.comp;
    const raw = input.value.trim();
    const num = Number(raw);
    if (!_calcStudent.marks[courseId]) _calcStudent.marks[courseId] = {};
    _calcStudent.marks[courseId][comp] = (raw === '' || isNaN(num)) ? null : num;
  });

  AppStorage.saveStudentProfile(_calcStudent);

  const chip = document.getElementById('calc-save-chip');
  if (chip) { chip.style.display = 'block'; setTimeout(() => { chip.style.display = 'none'; }, 2500); }

  showToast('Marks saved locally.', 'success');
}

/* ═══════════════════════════════════════════════════════════════
   PAGE 3 — FACULTY PANEL
═══════════════════════════════════════════════════════════════ */

let _roster = [];
let _evalStudent = null;
let _evalCopy = null;

function initFaculty() {
  _roster = AppStorage.loadFacultyRoster();

  updateCohortKPIs();
  populateFacultyFilterDropdowns();
  renderRoster();
  populateEvalStudentSelect();
  initFacultyTabs();
  initCsvPanel();
  initExportPanel();
  wireSearchFilter();

  // Nav sidebar: reports tab link
  document.getElementById('navReports')?.addEventListener('click', e => {
    e.preventDefault();
    switchFacultyTab('tab-reports');
    renderFacultyReports();
  });

  // Report tab button click
  document.getElementById('reportTabBtn')?.addEventListener('click', () => {
    setTimeout(renderFacultyReports, 0);
  });

  // Save eval
  document.getElementById('btn-save-evaluation')?.addEventListener('click', saveEvalPanel);

  // Reset demo roster
  document.getElementById('btn-reset-roster')?.addEventListener('click', () => {
    if (confirm('Reset all demo student data to defaults?')) {
      AppStorage.resetAllStudentsToDefaults?.() || AppStorage.resetFacultyRoster?.();
      _roster = AppStorage.loadFacultyRoster();
      updateCohortKPIs();
      renderRoster();
      populateEvalStudentSelect();
      showToast('Demo roster reset.', 'info');
    }
  });

  // Eval nav
  document.getElementById('eval-btn-prev')?.addEventListener('click', () => navigateEval(-1));
  document.getElementById('eval-btn-next')?.addEventListener('click', () => navigateEval(+1));
  document.getElementById('eval-student-select')?.addEventListener('change', onEvalStudentChange);
  document.getElementById('btn-reset-single-student')?.addEventListener('click', resetSingleStudent);

  // Export buttons
  document.getElementById('btn-export-roster-csv')?.addEventListener('click', exportRosterCSV);
  document.getElementById('btn-export-roster')?.addEventListener('click', () => AppStorage.exportRosterJson?.());
  document.getElementById('btn-export-class-summary-csv')?.addEventListener('click', exportClassSummaryCsv);
  document.getElementById('btn-export-subject-csv')?.addEventListener('click', exportSubjectCsv);
  document.getElementById('btn-clear-filters')?.addEventListener('click', clearFilters);

  // Modal close
  document.getElementById('modalCloseBtn')?.addEventListener('click', () => closeModal('studentDetailsModal'));
  document.getElementById('modalBtnClose')?.addEventListener('click', () => closeModal('studentDetailsModal'));
  document.getElementById('modalBtnEvaluate')?.addEventListener('click', () => {
    closeModal('studentDetailsModal');
    switchFacultyTab('tab-evaluation');
  });
  document.getElementById('modalBtnDashboard')?.addEventListener('click', () => {
    const rollNo = document.getElementById('studentDetailsModal').dataset.rollNo;
    if (rollNo) { AppStorage.setActiveStudentRollNo(rollNo); location.href = 'index.html'; }
  });
}

function updateCohortKPIs() {
  const n = _roster.length;
  let totalEvalPct = 0, validCount = 0, topName = '—', topPct = 0, pendingTotal = 0;

  _roster.forEach(s => {
    const sum = getSummaryForStudent(s);
    if (sum.evalPct != null) { totalEvalPct += sum.evalPct; validCount++; }
    if (sum.evalPct != null && sum.evalPct > topPct) { topPct = sum.evalPct; topName = s.name.split(' ')[0]; }
    pendingTotal += sum.pending;
  });

  const avg = validCount > 0 ? totalEvalPct / validCount : null;
  const set = (id, v) => { const el = document.getElementById(id); if (el) el.textContent = v; };
  set('cohort-count', n);
  set('cohort-avg', avg != null ? `${fmt(avg, 1)}%` : '—%');
  set('cohort-top', topName);
  set('cohort-pending', pendingTotal);
}

function populateFacultyFilterDropdowns() {
  const pecSel = document.getElementById('filter-pec');
  const mdmSel = document.getElementById('filter-mdm');
  if (!pecSel || !mdmSel) return;

  const pecs = [...new Set(_roster.map(s => s.selectedPec1Id))];
  const mdms = [...new Set(_roster.map(s => s.selectedMdm3Id))];

  pecs.forEach(id => {
    const name = AppStorage.getPec1Course?.(id)?.name || id;
    pecSel.innerHTML += `<option value="${id}">${name}</option>`;
  });
  mdms.forEach(id => {
    const name = AppStorage.getMdm3Course?.(id)?.name || id;
    mdmSel.innerHTML += `<option value="${id}">${name}</option>`;
  });
}

function wireSearchFilter() {
  const inputs = ['faculty-search-input', 'filter-pec', 'filter-mdm', 'filter-status'];
  inputs.forEach(id => {
    document.getElementById(id)?.addEventListener('input', renderRoster);
    document.getElementById(id)?.addEventListener('change', renderRoster);
  });
}

function clearFilters() {
  ['filter-pec', 'filter-mdm', 'filter-status'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = '';
  });
  const searchEl = document.getElementById('faculty-search-input');
  if (searchEl) searchEl.value = '';
  renderRoster();
}

function getFilteredRoster() {
  const q = document.getElementById('faculty-search-input')?.value.toLowerCase() || '';
  const pec = document.getElementById('filter-pec')?.value || '';
  const mdm = document.getElementById('filter-mdm')?.value || '';
  const status = document.getElementById('filter-status')?.value || '';

  return _roster.filter(s => {
    if (q && !s.name.toLowerCase().includes(q) && !s.rollNo.toLowerCase().includes(q)) return false;
    if (pec && s.selectedPec1Id !== pec) return false;
    if (mdm && s.selectedMdm3Id !== mdm) return false;
    if (status) {
      const sum = getSummaryForStudent(s);
      if (status === 'pending' && sum.pending === 0) return false;
      if (status === 'completed' && sum.pending > 0) return false;
    }
    return true;
  });
}

function renderRoster() {
  const tbody = document.getElementById('faculty-roster-body');
  if (!tbody) return;
  const students = getFilteredRoster();

  if (students.length === 0) {
    tbody.innerHTML = `<tr><td colspan="10"><div class="empty-state" style="padding:var(--sp-8);">
      <div class="empty-icon">🔍</div>
      <div class="empty-title">No students match</div>
      <p class="empty-sub">Try clearing your filters.</p>
    </div></td></tr>`;
    return;
  }

  tbody.innerHTML = students.map((s, i) => {
    const sum = getSummaryForStudent(s);
    const bg = avatarColor(s.rollNo);
    const init = initials(s.name);
    const pec = AppStorage.getPec1Course?.(s.selectedPec1Id)?.name || s.selectedPec1Id;
    const mdm = AppStorage.getMdm3Course?.(s.selectedMdm3Id)?.name || s.selectedMdm3Id;
    const oe = AppStorage.getOe2Course?.(s.selectedOe2Id)?.name || s.selectedOe2Id;
    const evalP = sum.evalPct != null ? sum.evalPct : 0;
    const semP = sum.semPct;

    return `<tr data-roll="${s.rollNo}" onclick="openStudentDetails('${s.rollNo}')">
      <td>
        <div style="display:flex;align-items:center;gap:var(--sp-3);">
          <div class="avatar" style="background:${bg};color:var(--ink);flex-shrink:0;">${init}</div>
          <div>
            <div style="font-weight:700;font-size:var(--text-sm);">${s.name}</div>
            <div style="font-size:var(--text-xs);color:var(--ink-muted);">${s.rollNo} · Fictional Demo</div>
          </div>
        </div>
      </td>
      <td><span class="chip chip-pink" style="font-size:10px;">${pec}</span></td>
      <td><span class="chip chip-blue" style="font-size:10px;">${mdm}</span></td>
      <td><span class="chip chip-mint" style="font-size:10px;">${oe}</span></td>
      <td style="font-weight:700;">${sum.entered} / ${sum.enteredMax}</td>
      <td style="font-weight:700;">${sum.evalPct != null ? fmt(sum.evalPct, 1) + '%' : '—'}</td>
      <td style="font-weight:600;">${fmt(sum.semPct, 1)}%</td>
      <td>
        <div style="display:flex;align-items:center;gap:var(--sp-2);min-width:100px;">
          <div class="progress-bar" style="flex:1;">
            <div class="progress-fill ${evalP >= 60 ? 'fill-mint' : evalP >= 40 ? 'fill-yellow' : 'fill-coral'}" style="width:${Math.min(100, evalP)}%;"></div>
          </div>
          <span style="font-size:10px;color:var(--ink-muted);width:32px;">${fmt(evalP, 0)}%</span>
        </div>
      </td>
      <td>${statusChip(evalP, sum.pending)}</td>
      <td style="text-align:right;" onclick="event.stopPropagation()">
        <div style="display:flex;gap:var(--sp-2);justify-content:flex-end;">
          <button class="btn btn-secondary btn-sm" onclick="openStudentDetails('${s.rollNo}')">Details</button>
          <button class="btn btn-primary btn-sm" onclick="selectEvalStudent('${s.rollNo}')">Evaluate</button>
        </div>
      </td>
    </tr>`;
  }).join('');
}

/* -- Student Details Modal ----------------------------------- */
window.openStudentDetails = function (rollNo) {
  const student = _roster.find(s => s.rollNo === rollNo);
  if (!student) return;

  const modal = document.getElementById('studentDetailsModal');
  if (modal) modal.dataset.rollNo = rollNo;

  document.getElementById('modalStudentTitle').textContent = student.name;
  document.getElementById('modalStudentSub').textContent = `${student.rollNo} · Fictional Demo Record · Semester V`;

  const sum = getSummaryForStudent(student);
  const courses = getCoursesForStudent(student);
  const bg = avatarColor(student.rollNo);
  const pec = AppStorage.getPec1Course?.(student.selectedPec1Id)?.name || student.selectedPec1Id;
  const mdm = AppStorage.getMdm3Course?.(student.selectedMdm3Id)?.name || student.selectedMdm3Id;
  const oe = AppStorage.getOe2Course?.(student.selectedOe2Id)?.name || student.selectedOe2Id;

  document.getElementById('modalStudentBody').innerHTML = `
    <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:var(--sp-4);margin-bottom:var(--sp-5);">
      <div class="kpi-card card-event-yellow">
        <div class="kpi-label">Evaluated Marks</div>
        <div class="kpi-value">${sum.entered} / ${sum.enteredMax}</div>
        <div class="kpi-sub">${sum.evalPct != null ? fmt(sum.evalPct, 1) + '%' : '—'} evaluated</div>
      </div>
      <div class="kpi-card card-event-blue">
        <div class="kpi-label">Semester Standing</div>
        <div class="kpi-value">${fmt(sum.semPct, 1)}%</div>
        <div class="kpi-sub">of 650 total marks</div>
      </div>
      <div class="kpi-card card-event-${sum.pending > 0 ? 'coral' : 'mint'}">
        <div class="kpi-label">Pending</div>
        <div class="kpi-value">${sum.pending}</div>
        <div class="kpi-sub">components unentered</div>
      </div>
    </div>

    <div style="display:flex;gap:var(--sp-2);flex-wrap:wrap;margin-bottom:var(--sp-5);">
      <span class="chip chip-pink">${pec}</span>
      <span class="chip chip-blue">${mdm}</span>
      <span class="chip chip-mint">${oe}</span>
    </div>

    <div class="table-wrap">
      <table class="data-table">
        <thead><tr><th>Course</th><th>CIE</th><th>MSE</th><th>SEE</th><th>TW</th><th>PR</th><th>OR</th><th>Earned/Max</th></tr></thead>
        <tbody>
          ${courses.map(course => {
    const sm = (student.marks || {})[course.id] || {};
    let e = 0, m = 0;
    ASSESSMENT_COMPONENTS.forEach(c => { if (course.maxMarks[c] != null && sm[c] != null) { e += Number(sm[c]); m += course.maxMarks[c]; } });
    const cell = comp => {
      if (course.maxMarks[comp] == null) return '<td style="color:var(--border-med);text-align:center;">—</td>';
      const v = sm[comp];
      if (v == null) return '<td><span class="chip chip-coral" style="font-size:9px;">Pending</span></td>';
      return `<td style="text-align:center;font-weight:600;">${v}<span style="font-size:9px;color:var(--ink-muted);">/${course.maxMarks[comp]}</span></td>`;
    };
    return `<tr>
              <td><div style="font-weight:600;font-size:var(--text-sm);">${course.name}</div></td>
              ${ASSESSMENT_COMPONENTS.map(cell).join('')}
              <td style="font-weight:700;">${e}/${m || '—'}</td>
            </tr>`;
  }).join('')}
        </tbody>
      </table>
    </div>
    <div class="demo-notice" style="margin-top:var(--sp-4);">
      <span>⚠️</span>
      <span>All marks are fictional demo data. Do not use for official academic records.</span>
    </div>`;

  openModal('studentDetailsModal');
};

/* -- Evaluation Panel --------------------------------------- */
function populateEvalStudentSelect() {
  const sel = document.getElementById('eval-student-select');
  if (!sel) return;
  sel.innerHTML = _roster.map(s =>
    `<option value="${s.rollNo}">${s.name} (${s.rollNo})</option>`
  ).join('');
  onEvalStudentChange();
}

function onEvalStudentChange() {
  const rollNo = document.getElementById('eval-student-select')?.value;
  _evalStudent = _roster.find(s => s.rollNo === rollNo) || _roster[0];
  _evalCopy = JSON.parse(JSON.stringify(_evalStudent));
  renderEvalPanel();
}

window.selectEvalStudent = function (rollNo) {
  switchFacultyTab('tab-evaluation');
  const sel = document.getElementById('eval-student-select');
  if (sel) { sel.value = rollNo; onEvalStudentChange(); }
};

function navigateEval(dir) {
  const sel = document.getElementById('eval-student-select');
  if (!sel) return;
  const opts = Array.from(sel.options);
  const idx = opts.findIndex(o => o.selected);
  const next = idx + dir;
  if (next >= 0 && next < opts.length) { sel.selectedIndex = next; onEvalStudentChange(); }
}

function resetSingleStudent() {
  if (!_evalStudent) return;
  if (!confirm(`Reset ${_evalStudent.name} to demo defaults?`)) return;
  AppStorage.resetStudentToDefaults?.(_evalStudent.rollNo);
  _roster = AppStorage.loadFacultyRoster();
  _evalStudent = _roster.find(s => s.rollNo === _evalStudent.rollNo) || _roster[0];
  _evalCopy = JSON.parse(JSON.stringify(_evalStudent));
  renderEvalPanel();
  renderRoster();
  updateCohortKPIs();
  showToast('Student reset to defaults.', 'info');
}

function renderEvalPanel() {
  if (!_evalCopy) return;
  const courses = getCoursesForStudent(_evalCopy);
  const sum = getSummaryForStudent(_evalCopy);
  const bg = avatarColor(_evalCopy.rollNo);
  const pec = AppStorage.getPec1Course?.(_evalCopy.selectedPec1Id)?.name || _evalCopy.selectedPec1Id;
  const mdm = AppStorage.getMdm3Course?.(_evalCopy.selectedMdm3Id)?.name || _evalCopy.selectedMdm3Id;
  const oe = AppStorage.getOe2Course?.(_evalCopy.selectedOe2Id)?.name || _evalCopy.selectedOe2Id;

  // Summary cards
  const cardsEl = document.getElementById('eval-student-summary-cards');
  if (cardsEl) {
    cardsEl.innerHTML = `
      <div class="kpi-card card-event-yellow">
        <div class="kpi-label">Student</div>
        <div class="kpi-value" style="font-size:var(--text-lg);">${_evalCopy.name}</div>
        <div class="kpi-sub">${_evalCopy.rollNo}</div>
      </div>
      <div class="kpi-card card-event-pink">
        <div class="kpi-label">Tracks</div>
        <div class="kpi-value" style="font-size:var(--text-sm);font-weight:600;">${pec}</div>
        <div class="kpi-sub">${mdm} · ${oe}</div>
      </div>
      <div class="kpi-card card-event-blue">
        <div class="kpi-label">Evaluated Marks</div>
        <div class="kpi-value">${sum.entered} / ${sum.enteredMax}</div>
        <div class="kpi-sub">${sum.evalPct != null ? fmt(sum.evalPct, 1) + '%' : '—'} eval.</div>
      </div>
      <div class="kpi-card card-event-${sum.pending > 0 ? 'coral' : 'mint'}">
        <div class="kpi-label">Pending</div>
        <div class="kpi-value">${sum.pending}</div>
        <div class="kpi-sub">of 21 components</div>
      </div>`;
  }

  // Eval table
  const tbody = document.getElementById('eval-table-body');
  if (tbody) {
    tbody.innerHTML = courses.map(course => {
      const sm = (_evalCopy.marks || {})[course.id] || {};
      let e = 0, m = 0, pendCount = 0;
      ASSESSMENT_COMPONENTS.forEach(comp => {
        if (course.maxMarks[comp] == null) return;
        const v = sm[comp];
        if (v != null) { e += Number(v); m += course.maxMarks[comp]; }
        else pendCount++;
      });
      const p = m > 0 ? (e / m) * 100 : 0;
      const catColor = { PCC: 'chip-blue', PEC: 'chip-pink', MDM: 'chip-blue', OE: 'chip-mint', VEC: 'chip-beige' };
      const cells = ASSESSMENT_COMPONENTS.map(comp => {
        const max = course.maxMarks[comp];
        if (max == null) return `<td style="text-align:center;color:var(--border-med);">N/A</td>`;
        const v = sm[comp];
        return `<td style="text-align:center;">
          <input type="number" class="mark-input eval-input"
            data-course="${course.id}" data-comp="${comp}" data-max="${max}"
            value="${v ?? ''}" min="0" max="${max}" placeholder="—"
            style="width:60px;font-size:12px;"
            aria-label="${COMP_LABELS[comp]} for ${course.name}">
        </td>`;
      });
      return `<tr>
        <td>
          <div style="font-weight:600;font-size:var(--text-sm);">${course.name}</div>
          <div style="font-size:10px;color:var(--ink-muted);">${course.code || ''}</div>
        </td>
        <td><span class="chip ${catColor[course.category] || 'chip-beige'}" style="font-size:9px;">${course.category}</span></td>
        ${cells.join('')}
        <td style="text-align:center;font-weight:600;">${course.maxMarks.total}</td>
        <td style="min-width:80px;">
          <div class="progress-bar"><div class="progress-fill ${p >= 60 ? 'fill-mint' : p >= 40 ? 'fill-yellow' : 'fill-coral'}" style="width:${Math.min(100, p)}%;"></div></div>
        </td>
      </tr>`;
    }).join('');

    tbody.querySelectorAll('.eval-input').forEach(input => {
      input.addEventListener('input', () => onEvalInput(input));
    });
  }

  renderPendingCallout(courses);
}

function onEvalInput(input) {
  const courseId = input.dataset.course;
  const comp = input.dataset.comp;
  const maxVal = Number(input.dataset.max);
  const raw = input.value.trim();
  const num = Number(raw);

  if (!_evalCopy.marks[courseId]) _evalCopy.marks[courseId] = {};

  if (raw === '' || isNaN(num)) {
    _evalCopy.marks[courseId][comp] = null;
    input.classList.remove('valid', 'invalid');
  } else if (num < 0 || num > maxVal) {
    _evalCopy.marks[courseId][comp] = null;
    input.classList.add('invalid');
    input.classList.remove('valid');
  } else {
    _evalCopy.marks[courseId][comp] = num;
    input.classList.add('valid');
    input.classList.remove('invalid');
  }

  const courses = getCoursesForStudent(_evalCopy);
  renderPendingCallout(courses);
}

function renderPendingCallout(courses) {
  const listEl = document.getElementById('eval-pending-callout-list');
  const countEl = document.getElementById('eval-pending-callout-count');
  if (!listEl || !_evalCopy) return;

  const pending = [];
  courses.forEach(course => {
    const sm = (_evalCopy.marks || {})[course.id] || {};
    ASSESSMENT_COMPONENTS.forEach(comp => {
      if (course.maxMarks[comp] == null) return;
      if (sm[comp] == null) pending.push(`${COMP_LABELS[comp]} — ${course.name.split(' ').slice(0, 2).join(' ')}`);
    });
  });

  if (countEl) {
    countEl.textContent = `${pending.length} Pending`;
    countEl.className = `chip ${pending.length === 0 ? 'chip-mint' : 'chip-coral'}`;
  }

  listEl.innerHTML = pending.length === 0
    ? `<span class="chip chip-mint">✅ All components entered!</span>`
    : pending.map(p => `<span class="chip chip-coral" style="font-size:11px;">${p}</span>`).join('');
}

function saveEvalPanel() {
  if (!_evalCopy) return;
  // Commit working copy to roster
  const idx = _roster.findIndex(s => s.rollNo === _evalCopy.rollNo);
  if (idx !== -1) {
    _roster[idx] = JSON.parse(JSON.stringify(_evalCopy));
    AppStorage.saveStudentProfile?.(_evalCopy);
    AppStorage.saveFacultyRoster?.(_roster);
  }
  updateCohortKPIs();
  renderRoster();

  const statusEl = document.getElementById('eval-save-status-indicator');
  if (statusEl) { statusEl.innerHTML = '✅ Saved locally'; statusEl.style.display = 'block'; setTimeout(() => statusEl.style.display = 'none', 3000); }
  showToast(`${_evalCopy.name}'s marks saved.`, 'success');
}

/* -- Faculty Tabs ------------------------------------------- */
function initFacultyTabs() {
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      switchFacultyTab(btn.dataset.tab);
    });
  });
}

function switchFacultyTab(tabId) {
  document.querySelectorAll('.tab-btn').forEach(b => {
    b.classList.toggle('active', b.dataset.tab === tabId);
    b.setAttribute('aria-selected', b.dataset.tab === tabId);
  });
  document.querySelectorAll('.tab-pane').forEach(p => {
    p.classList.toggle('active', p.id === tabId);
  });
}

/* -- CSV Panel --------------------------------------------- */
function initCsvPanel() {
  const fileInput = document.getElementById('bulk-csv-file-input');
  const triggerBtn = document.getElementById('btn-trigger-csv-file');
  const dropZone = document.getElementById('csvDropZone');
  const validateBtn = document.getElementById('btn-validate-csv');
  const clearBtn = document.getElementById('btn-clear-csv-text');
  const commitBtn = document.getElementById('btn-apply-csv-entries');

  triggerBtn?.addEventListener('click', () => fileInput?.click());

  fileInput?.addEventListener('change', () => {
    const file = fileInput.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = e => {
      const ta = document.getElementById('csv-paste-textarea');
      if (ta) ta.value = e.target.result;
    };
    reader.readAsText(file);
  });

  // Drag-drop
  if (dropZone) {
    dropZone.addEventListener('dragover', e => { e.preventDefault(); dropZone.classList.add('drag-over'); });
    dropZone.addEventListener('dragleave', () => dropZone.classList.remove('drag-over'));
    dropZone.addEventListener('drop', e => {
      e.preventDefault(); dropZone.classList.remove('drag-over');
      const file = e.dataTransfer.files[0];
      if (file) { const r = new FileReader(); r.onload = ev => { document.getElementById('csv-paste-textarea').value = ev.target.result; }; r.readAsText(file); }
    });
  }

  validateBtn?.addEventListener('click', validateCsvPreview);
  clearBtn?.addEventListener('click', () => {
    const ta = document.getElementById('csv-paste-textarea');
    if (ta) ta.value = '';
    document.getElementById('csv-preview-card').style.display = 'none';
  });
  commitBtn?.addEventListener('click', commitCsvEntries);

  // Direct exports
  document.getElementById('btn-export-csv-direct')?.addEventListener('click', exportRosterCSV);
  document.getElementById('btn-export-json-direct')?.addEventListener('click', () => {
    const data = JSON.stringify({ exportDate: new Date().toISOString(), roster: _roster }, null, 2);
    downloadFile('snjb-roster-backup.json', data, 'application/json');
  });

  const importBtn = document.getElementById('btn-import-roster');
  const importInput = document.getElementById('import-file-input');
  importBtn?.addEventListener('click', () => importInput?.click());
  importInput?.addEventListener('change', () => {
    const f = importInput.files[0];
    if (!f) return;
    const r = new FileReader();
    r.onload = e => {
      try {
        const data = JSON.parse(e.target.result);
        if (data.roster) { AppStorage.saveFacultyRoster?.(data.roster); _roster = data.roster; renderRoster(); updateCohortKPIs(); showToast('Roster imported.', 'success'); }
      } catch { showToast('Invalid JSON file.', 'error'); }
    };
    r.readAsText(f);
  });

  document.getElementById('btn-download-csv-template')?.addEventListener('click', () => {
    const template = 'RollNo,StudentName,CourseId,Component,Marks\nTY-COMP-01,Aarav Patil,pcc-automata,cie,18\nTY-COMP-01,Aarav Patil,pcc-automata,mse,16\n';
    downloadFile('snjb-marks-template.csv', template, 'text/csv');
  });
}

function validateCsvPreview() {
  const ta = document.getElementById('csv-paste-textarea');
  if (!ta || !ta.value.trim()) { showToast('No CSV content to validate.', 'warn'); return; }

  const lines = ta.value.trim().split('\n');
  const header = lines[0].toLowerCase().replace(/\s/g, '');
  const rows = lines.slice(1);
  const errors = [];
  const valid = [];
  const preview = [];

  rows.forEach((line, i) => {
    const rowNum = i + 2;
    const parts = line.split(',').map(s => s.trim());
    if (parts.length < 5) { errors.push(`Row ${rowNum}: Not enough columns.`); preview.push({ rowNum, error: 'Not enough columns.', raw: line }); return; }

    const [rollNo, name, courseId, comp, markRaw] = parts;
    const student = _roster.find(s => s.rollNo === rollNo);
    if (!student) { errors.push(`Row ${rowNum}: Roll "${rollNo}" not found.`); preview.push({ rowNum, rollNo, name, courseId, comp, error: 'Student not found.' }); return; }

    const courses = getCoursesForStudent(student);
    const course = courses.find(c => c.id === courseId);
    if (!course) { errors.push(`Row ${rowNum}: Course "${courseId}" not active for ${rollNo}.`); preview.push({ rowNum, rollNo, name, courseId, comp, error: 'Course not active.' }); return; }

    if (!ASSESSMENT_COMPONENTS.includes(comp.toLowerCase())) { errors.push(`Row ${rowNum}: Unknown component "${comp}".`); preview.push({ rowNum, rollNo, name, courseId, comp, error: 'Unknown component.' }); return; }

    const cKey = comp.toLowerCase();
    const max = course.maxMarks[cKey];
    if (max == null) { errors.push(`Row ${rowNum}: ${comp.toUpperCase()} is N/A for ${courseId}.`); preview.push({ rowNum, rollNo, name, courseId, comp, error: 'N/A component.' }); return; }

    const num = Number(markRaw);
    if (isNaN(num) || num < 0 || num > max) { errors.push(`Row ${rowNum}: Mark ${markRaw} out of range 0–${max}.`); preview.push({ rowNum, rollNo, name, courseId, comp, error: `Value out of range 0–${max}.` }); return; }

    const prev = (student.marks?.[courseId]?.[cKey] ?? null);
    valid.push({ rollNo, courseId, comp: cKey, value: num, student });
    preview.push({ rowNum, rollNo, name, courseId, comp: cKey, newVal: num, prevVal: prev, ok: true });
  });

  // Render error list
  const errDisplay = document.getElementById('csv-error-display');
  const errList = document.getElementById('csv-error-list');
  if (errDisplay && errList) {
    errDisplay.style.display = errors.length > 0 ? 'block' : 'none';
    errList.innerHTML = errors.map(e => `<li>${e}</li>`).join('');
  }

  // Render preview table
  const previewCard = document.getElementById('csv-preview-card');
  const previewBody = document.getElementById('csv-preview-table-body');
  const statusText = document.getElementById('csv-preview-status-text');
  const commitBtn = document.getElementById('btn-apply-csv-entries');

  if (previewCard) previewCard.style.display = 'block';
  if (statusText) statusText.textContent = `${valid.length} valid rows, ${errors.length} errors`;
  if (commitBtn) commitBtn.style.display = valid.length > 0 ? 'inline-flex' : 'none';

  if (previewBody) {
    previewBody.innerHTML = preview.map(p => `
      <tr class="${p.ok ? 'csv-row-valid' : 'csv-row-error'}">
        <td>${p.rowNum}</td>
        <td>${p.rollNo || '—'}</td>
        <td>${p.name || '—'}</td>
        <td style="font-size:11px;">${p.courseId || '—'}</td>
        <td>${(p.comp || '').toUpperCase()}</td>
        <td style="font-weight:700;">${p.newVal ?? '—'}</td>
        <td style="color:var(--ink-muted);">${p.prevVal ?? '—'}</td>
        <td>${p.ok ? '<span class="chip chip-mint">✓ Valid</span>' : `<span class="chip chip-coral">${p.error || 'Error'}</span>`}</td>
      </tr>`).join('');
  }

  // Store valid entries for commit
  previewCard._validEntries = valid;
  showToast(`${valid.length} valid rows ready to commit.`, valid.length > 0 ? 'success' : 'warn');
}

function commitCsvEntries() {
  const previewCard = document.getElementById('csv-preview-card');
  const valid = previewCard?._validEntries;
  if (!valid || valid.length === 0) return;

  valid.forEach(({ rollNo, courseId, comp, value }) => {
    const s = _roster.find(r => r.rollNo === rollNo);
    if (!s) return;
    if (!s.marks[courseId]) s.marks[courseId] = {};
    s.marks[courseId][comp] = value;
  });

  AppStorage.saveFacultyRoster?.(_roster);
  renderRoster();
  updateCohortKPIs();
  document.getElementById('csv-preview-card').style.display = 'none';
  document.getElementById('csv-paste-textarea').value = '';
  showToast(`${valid.length} mark entries committed.`, 'success');
}

/* -- Reports Tab ------------------------------------------- */
let _reportsRendered = false;

function renderFacultyReports() {
  if (_reportsRendered) return;
  _reportsRendered = true;

  const tbody = document.getElementById('reports-course-body');
  if (!tbody) return;

  // Collect all unique courses across all students
  const courseMap = {};
  _roster.forEach(student => {
    const courses = getCoursesForStudent(student);
    courses.forEach(c => {
      if (!courseMap[c.id]) courseMap[c.id] = { course: c, marks: [] };
    });
  });

  // Fill marks
  _roster.forEach(student => {
    const courses = getCoursesForStudent(student);
    courses.forEach(c => {
      if (!courseMap[c.id]) return;
      const sm = (student.marks || {})[c.id] || {};
      let e = 0, m = 0, pend = 0, evalComps = 0;
      ASSESSMENT_COMPONENTS.forEach(comp => {
        if (c.maxMarks[comp] == null) return;
        if (sm[comp] != null) { e += Number(sm[comp]); m += c.maxMarks[comp]; evalComps++; }
        else pend++;
      });
      courseMap[c.id].marks.push({ earned: e, max: m, pending: pend, evalComps });
    });
  });

  const catColor = { PCC: 'chip-blue', PEC: 'chip-pink', MDM: 'chip-blue', OE: 'chip-mint', VEC: 'chip-beige' };
  tbody.innerHTML = Object.values(courseMap).map(({ course, marks }) => {
    if (marks.length === 0) return '';
    const avgs = marks.filter(m => m.max > 0).map(m => (m.earned / m.max) * 100);
    const avgPct = avgs.length > 0 ? avgs.reduce((a, b) => a + b, 0) / avgs.length : null;
    const avgMark = marks.reduce((s, m) => s + m.earned, 0) / marks.length;
    const high = avgs.length > 0 ? Math.max(...avgs) : null;
    const low = avgs.length > 0 ? Math.min(...avgs) : null;
    const evalC = marks.reduce((s, m) => s + m.evalComps, 0);
    const pendC = marks.reduce((s, m) => s + m.pending, 0);
    return `<tr>
      <td><div style="font-weight:600;">${course.name}</div><div style="font-size:10px;color:var(--ink-muted);">${course.code || ''}</div></td>
      <td><span class="chip ${catColor[course.category] || 'chip-beige'}">${course.category}</span></td>
      <td>${marks.length}</td>
      <td style="font-weight:600;">${fmt(avgMark, 1)}</td>
      <td>${avgPct != null ? fmt(avgPct, 1) + '%' : '—'}</td>
      <td>${high != null ? fmt(high, 1) + '%' : '—'}</td>
      <td>${low != null ? fmt(low, 1) + '%' : '—'}</td>
      <td>${evalC}</td>
      <td>${pendC > 0 ? `<span class="chip chip-coral" style="font-size:10px;">${pendC}</span>` : '<span class="chip chip-mint" style="font-size:10px;">0</span>'}</td>
    </tr>`;
  }).join('');

  // Charts
  setTimeout(() => {
    renderCohortChart();
    renderCourseAvgChart();
  }, 50);
}

function renderCohortChart() {
  const canvas = document.getElementById('cohortDistributionChart');
  if (!canvas) return;
  const tiers = { 'Excellent (85%+)': 0, 'Good (60–84%)': 0, 'Below 60%': 0 };
  _roster.forEach(s => {
    const sum = getSummaryForStudent(s);
    if (sum.evalPct == null) return;
    if (sum.evalPct >= 85) tiers['Excellent (85%+)']++;
    else if (sum.evalPct >= 60) tiers['Good (60–84%)']++;
    else tiers['Below 60%']++;
  });
  new Chart(canvas, {
    type: 'doughnut',
    data: {
      labels: Object.keys(tiers),
      datasets: [{ data: Object.values(tiers), backgroundColor: ['#BFE5CF', '#B9CDF5', '#F2A59A'], borderWidth: 0 }]
    },
    options: { responsive: true, maintainAspectRatio: false, cutout: '65%', plugins: { legend: { position: 'bottom', labels: { font: { family: "'Plus Jakarta Sans'", size: 11 } } } } }
  });
}

function renderCourseAvgChart() {
  const canvas = document.getElementById('courseAveragesChart');
  if (!canvas) return;

  const courseAvgs = {};
  _roster.forEach(s => {
    const courses = getCoursesForStudent(s);
    courses.forEach(c => {
      const sm = (s.marks || {})[c.id] || {};
      let e = 0, m = 0;
      ASSESSMENT_COMPONENTS.forEach(comp => { if (c.maxMarks[comp] != null && sm[comp] != null) { e += Number(sm[comp]); m += c.maxMarks[comp]; } });
      if (!courseAvgs[c.name]) courseAvgs[c.name] = [];
      if (m > 0) courseAvgs[c.name].push((e / m) * 100);
    });
  });

  const labels = Object.keys(courseAvgs).map(n => n.length > 15 ? n.substring(0, 13) + '…' : n);
  const data = Object.values(courseAvgs).map(arr => arr.length > 0 ? arr.reduce((a, b) => a + b, 0) / arr.length : 0);

  new Chart(canvas, {
    type: 'bar',
    data: {
      labels,
      datasets: [{ label: 'Avg %', data, backgroundColor: '#121212', borderRadius: 6, barThickness: 16 }]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        x: { grid: { display: false }, ticks: { font: { family: "'Plus Jakarta Sans'", size: 10 }, color: '#4A4A4A' } },
        y: { min: 0, max: 100, grid: { color: 'rgba(0,0,0,.05)' }, ticks: { callback: v => v + '%', font: { size: 10 } } }
      }
    }
  });
}

/* -- Export Helpers ---------------------------------------- */
function initExportPanel() { } // wired inline in initCsvPanel

function exportRosterCSV() {
  const rows = ['Roll No,Student Name,PEC-I,MDM-III,OE-II,Marks Evaluated,Max Evaluated,Eval %,Sem %,Pending'];
  _roster.forEach(s => {
    const sum = getSummaryForStudent(s);
    const pec = AppStorage.getPec1Course?.(s.selectedPec1Id)?.name || s.selectedPec1Id;
    const mdm = AppStorage.getMdm3Course?.(s.selectedMdm3Id)?.name || s.selectedMdm3Id;
    const oe = AppStorage.getOe2Course?.(s.selectedOe2Id)?.name || s.selectedOe2Id;
    rows.push(`${s.rollNo},"${s.name}","${pec}","${mdm}","${oe}",${sum.entered},${sum.enteredMax},${fmt(sum.evalPct ?? 0, 1)},${fmt(sum.semPct, 1)},${sum.pending}`);
  });
  downloadFile('snjb-roster.csv', rows.join('\n'), 'text/csv');
}

function exportClassSummaryCsv() {
  const rows = ['Course,Category,Students,Avg Marks,Avg %'];
  const courseMap = {};
  _roster.forEach(s => {
    getCoursesForStudent(s).forEach(c => {
      if (!courseMap[c.id]) courseMap[c.id] = { course: c, marks: [] };
      const sm = (s.marks || {})[c.id] || {};
      let e = 0, m = 0;
      ASSESSMENT_COMPONENTS.forEach(comp => { if (c.maxMarks[comp] != null && sm[comp] != null) { e += Number(sm[comp]); m += c.maxMarks[comp]; } });
      courseMap[c.id].marks.push({ e, m });
    });
  });
  Object.values(courseMap).forEach(({ course, marks }) => {
    const avgM = marks.reduce((s, m) => s + m.e, 0) / marks.length;
    const avgP = marks.filter(m => m.m > 0).map(m => (m.e / m.m) * 100);
    const ap = avgP.length > 0 ? avgP.reduce((a, b) => a + b, 0) / avgP.length : 0;
    rows.push(`"${course.name}","${course.category}",${marks.length},${fmt(avgM, 1)},${fmt(ap, 1)}`);
  });
  downloadFile('snjb-class-summary.csv', rows.join('\n'), 'text/csv');
}

function exportSubjectCsv() { exportClassSummaryCsv(); }

function downloadFile(filename, content, mimeType) {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([content], { type: mimeType }));
  a.download = filename;
  a.click();
  URL.revokeObjectURL(a.href);
}

/* -- Modal helpers ----------------------------------------- */
function openModal(id) {
  const el = document.getElementById(id);
  if (el) { el.classList.add('active'); document.body.style.overflow = 'hidden'; }
}
function closeModal(id) {
  const el = document.getElementById(id);
  if (el) { el.classList.remove('active'); document.body.style.overflow = ''; }
}

// Close modals on overlay click
document.addEventListener('click', e => {
  if (e.target.classList.contains('modal-overlay')) closeModal(e.target.id);
});

document.addEventListener('keydown', e => {
  if (e.key === 'Escape') {
    document.querySelectorAll('.modal-overlay.active').forEach(m => closeModal(m.id));
  }
});

/* ═══════════════════════════════════════════════════════════════
   PAGE 4 — AI ASSISTANT
═══════════════════════════════════════════════════════════════ */

function initAI() {
  const student = AppStorage.loadStudentProfile();
  if (!student) return;

  // Context panel
  syncAIContext(student);

  // Status check
  checkAIStatus();

  // Chat send
  const sendBtn = document.getElementById('chatSendBtn');
  const chatInput = document.getElementById('chatInput');

  sendBtn?.addEventListener('click', sendChat);
  chatInput?.addEventListener('keydown', e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendChat(); } });

  // Clear chat
  document.getElementById('clearChatBtn')?.addEventListener('click', () => {
    const body = document.getElementById('chatBody');
    if (body) body.innerHTML = '';
    appendAIMessage('Chat cleared. Ask me anything about your semester!', false);
  });

  // Student switcher context
  window.onStudentSwitch = rollNo => {
    const roster = AppStorage.loadFacultyRoster();
    const newStud = roster.find(s => s.rollNo === rollNo) || AppStorage.loadStudentProfile();
    if (newStud) syncAIContext(newStud);
  };
}

function syncAIContext(student) {
  const sum = getSummaryForStudent(student);
  const init = initials(student.name);
  const bg = avatarColor(student.rollNo);
  const pec = AppStorage.getPec1Course?.(student.selectedPec1Id)?.name || student.selectedPec1Id;
  const mdm = AppStorage.getMdm3Course?.(student.selectedMdm3Id)?.name || student.selectedMdm3Id;
  const oe = AppStorage.getOe2Course?.(student.selectedOe2Id)?.name || student.selectedOe2Id;

  const setT = (id, v) => { const el = document.getElementById(id); if (el) el.textContent = v; };
  setT('ctxStudentName', student.name);
  setT('ctxStudentRoll', student.rollNo);
  setT('ctxMarksEntered', `${sum.entered} / ${sum.enteredMax}`);
  setT('ctxPercentage', sum.evalPct != null ? `${fmt(sum.evalPct, 1)}%` : '—');

  const avatarEl = document.getElementById('ctxAvatar');
  if (avatarEl) { avatarEl.textContent = init; avatarEl.style.background = bg; }

  const pendEl = document.getElementById('ctxPending');
  if (pendEl) { pendEl.textContent = `${sum.pending} pending`; pendEl.className = `chip ${sum.pending > 0 ? 'chip-coral' : 'chip-mint'}`; }

  const tracksEl = document.getElementById('ctxTracks');
  if (tracksEl) {
    tracksEl.innerHTML = [
      { label: 'PEC-I', name: pec, color: 'chip-pink' },
      { label: 'MDM-III', name: mdm, color: 'chip-blue' },
      { label: 'OE-II', name: oe, color: 'chip-mint' },
    ].map(t => `
      <div style="display:flex;justify-content:space-between;align-items:center;padding:var(--sp-2) 0;">
        <span style="font-size:var(--text-xs);color:var(--ink-muted);">${t.label}</span>
        <span class="chip ${t.color}" style="font-size:10px;">${t.name}</span>
      </div>`).join('');
  }
}

async function checkAIStatus() {
  const pill = document.getElementById('ai-status-pill');
  try {
    const res = await fetch('/api/status');
    const data = await res.json();
    if (pill) {
      if (data.apiConfigured) {
        pill.className = 'status-pill status-online';
        pill.innerHTML = '<div class="status-pill-dot"></div> Gemini Online';
      } else {
        pill.className = 'status-pill status-offline';
        pill.innerHTML = '<div class="status-pill-dot"></div> API Key Missing';
      }
    }
  } catch {
    if (pill) { pill.className = 'status-pill status-offline'; pill.innerHTML = '<div class="status-pill-dot"></div> Server Offline'; }
  }
}

async function sendChat() {
  const inputEl = document.getElementById('chatInput');
  const sendBtn = document.getElementById('chatSendBtn');
  const msg = inputEl?.value.trim();
  if (!msg) return;

  inputEl.value = '';
  inputEl.disabled = true;
  if (sendBtn) sendBtn.disabled = true;

  appendUserMessage(msg);
  const typingId = appendTypingIndicator();

  try {
    const student = AppStorage.loadStudentProfile();
    const roster = AppStorage.loadFacultyRoster();
    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: msg, student, roster })
    });

    removeTypingIndicator(typingId);

    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
      appendAIMessage(`⚠️ ${err.error || 'Server error.'}`, false, null, true);
    } else {
      const data = await res.json();
      appendAIMessage(data.reply || 'No response.', false, data.toolCalls);
    }
  } catch (e) {
    removeTypingIndicator(typingId);
    appendAIMessage('⚠️ Could not reach the server. Is `node server.js` running?', false, null, true);
  } finally {
    if (inputEl) inputEl.disabled = false;
    if (sendBtn) sendBtn.disabled = false;
    inputEl?.focus();
  }
}

function appendUserMessage(text) {
  const chatBody = document.getElementById('chatBody');
  if (!chatBody) return;
  const student = AppStorage.loadStudentProfile();
  const init = initials(student?.name || 'U');
  const bg = avatarColor(student?.rollNo || 'X');
  const div = document.createElement('div');
  div.className = 'msg-row user animate-fade-up';
  div.innerHTML = `
    <div class="msg-avatar" style="background:var(--ink);color:var(--cream);">${init}</div>
    <div class="msg-bubble user">${escapeHtml(text)}</div>`;
  chatBody.appendChild(div);
  scrollChat();
}

let _typingCounter = 0;
function appendTypingIndicator() {
  const chatBody = document.getElementById('chatBody');
  if (!chatBody) return null;
  const id = `typing-${++_typingCounter}`;
  const div = document.createElement('div');
  div.id = id;
  div.className = 'msg-row animate-fade-up';
  div.innerHTML = `
    <div class="msg-avatar" style="background:var(--yellow);color:var(--ink);font-size:10px;font-weight:800;">AI</div>
    <div class="typing-bubble"><div class="typing-dot"></div><div class="typing-dot"></div><div class="typing-dot"></div></div>`;
  chatBody.appendChild(div);
  scrollChat();
  return id;
}

function removeTypingIndicator(id) {
  document.getElementById(id)?.remove();
}

function appendAIMessage(text, isHtml = false, toolCalls = null, isError = false) {
  const chatBody = document.getElementById('chatBody');
  if (!chatBody) return;
  const div = document.createElement('div');
  div.className = 'msg-row animate-fade-up';

  let toolHtml = '';
  if (toolCalls && toolCalls.length > 0) {
    toolHtml = toolCalls.map((tc, i) => `
      <div class="tool-chip" onclick="this.nextElementSibling.style.display=this.nextElementSibling.style.display==='none'?'block':'none'" style="margin-top:6px;">
        <div class="tool-chip-dot"></div>
        ${tc.name || 'tool'} · executed
        <span style="margin-left:auto;font-size:9px;opacity:.6;">▼</span>
      </div>
      <pre class="tool-result">${escapeHtml(JSON.stringify(tc.result || {}, null, 2))}</pre>
    `).join('');
  }

  const content = isHtml ? text : escapeHtml(text).replace(/\n/g, '<br>');
  const errorStyle = isError ? 'border-left:3px solid var(--coral-text);' : '';

  div.innerHTML = `
    <div class="msg-avatar" style="background:var(--yellow);color:var(--ink);font-size:10px;font-weight:800;">AI</div>
    <div>
      ${toolHtml}
      <div class="msg-bubble assistant" style="${errorStyle}">${content}</div>
      <div style="font-size:10px;color:var(--ink-muted);margin-top:4px;padding-left:4px;">SNJB Advisor · Just now</div>
    </div>`;
  chatBody.appendChild(div);
  scrollChat();
}

function scrollChat() {
  const chatBody = document.getElementById('chatBody');
  if (chatBody) chatBody.scrollTop = chatBody.scrollHeight;
}

function escapeHtml(text) {
  const d = document.createElement('div');
  d.appendChild(document.createTextNode(String(text)));
  return d.innerHTML;
}

/* ─────────────────────────────────────────────────────────────────
   STORAGE API COMPAT SHIMS
   (in case some AppStorage methods have different names)
───────────────────────────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
  if (typeof AppStorage === 'undefined') return;

  // Ensure getActiveStudentRollNo / setActiveStudentRollNo exist
  if (!AppStorage.getActiveStudentRollNo) {
    AppStorage.getActiveStudentRollNo = () => {
      const p = AppStorage.loadStudentProfile?.();
      return p?.rollNo || 'TY-COMP-01';
    };
  }
  if (!AppStorage.setActiveStudentRollNo) {
    AppStorage.setActiveStudentRollNo = (rollNo) => {
      const roster = AppStorage.loadFacultyRoster?.() || [];
      const s = roster.find(r => r.rollNo === rollNo);
      if (s) AppStorage.saveStudentProfile?.(s);
    };
  }

  // Elective lookup shims
  if (!AppStorage.getPec1Course && typeof SyllabusData !== 'undefined') {
    AppStorage.getPec1Course = id => SyllabusData.PEC1_COURSES?.find(c => c.id === id) || SyllabusData.PEC1_BASKETS?.find(c => c.id === id);
    AppStorage.getMdm3Course = id => SyllabusData.MDM3_COURSES?.find(c => c.id === id) || SyllabusData.MDM3_BASKETS?.find(c => c.id === id);
    AppStorage.getOe2Course = id => SyllabusData.OE2_COURSES?.find(c => c.id === id) || SyllabusData.OE2_BASKETS?.find(c => c.id === id);
  }

  // getActiveCourses shim
  if (!AppStorage.getActiveCourses && typeof AppCalculator !== 'undefined') {
    AppStorage.getActiveCourses = (p1, m3, o2) => AppCalculator.getActiveCourses?.(p1, m3, o2) || [];
  }

  // resetStudentToDefaults shim
  if (!AppStorage.resetStudentToDefaults) {
    AppStorage.resetStudentToDefaults = (rollNo) => {
      const roster = AppStorage.loadFacultyRoster?.() || [];
      // just reload from initial state — use resetAllToDefaults if available
      AppStorage.resetFacultyRoster?.();
    };
  }
});
