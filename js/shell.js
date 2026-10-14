/**
 * shell.js — Shared App Shell Controller
 * Handles: sidebar toggle, theme toggle, global student switcher,
 *          toast notifications, active nav highlighting
 * SNJB Marks Assistant v2.0 · AY 2026-27
 */

(function () {
  'use strict';

  /* ── Sidebar ───────────────────────────────────────────────── */
  const sidebar = document.getElementById('appSidebar');
  const overlay = document.getElementById('sidebarOverlay');
  const openBtn = document.getElementById('openSidebar');
  const closeBtn = document.getElementById('closeSidebar');

  function openSidebar() {
    sidebar.classList.add('open');
    overlay.classList.add('active');
    document.body.style.overflow = 'hidden';
  }

  function closeSidebar() {
    sidebar.classList.remove('open');
    overlay.classList.remove('active');
    document.body.style.overflow = '';
  }

  if (openBtn) openBtn.addEventListener('click', openSidebar);
  if (closeBtn) closeBtn.addEventListener('click', closeSidebar);
  if (overlay) overlay.addEventListener('click', closeSidebar);

  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && sidebar.classList.contains('open')) closeSidebar();
  });

  /* ── Theme Toggle ───────────────────────────────────────────── */
  const themeBtn = document.getElementById('themeToggle');
  const root = document.documentElement;

  function applyTheme(theme) {
    root.setAttribute('data-theme', theme);
    localStorage.setItem('snjb_theme', theme);
    if (themeBtn) themeBtn.textContent = theme === 'dark' ? '☀️' : '🌙';
  }

  const savedTheme = localStorage.getItem('snjb_theme') || 'light';
  applyTheme(savedTheme);

  if (themeBtn) {
    themeBtn.addEventListener('click', () => {
      applyTheme(root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark');
    });
  }

  /* ── Toast Notifications ─────────────────────────────────────── */
  window.showToast = function (message, type = 'info', duration = 3500) {
    const stack = document.getElementById('toastStack');
    if (!stack) return;

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;

    const icons = { success: '✅', error: '❌', warn: '⚠️', info: 'ℹ️' };
    toast.innerHTML = `<span class="toast-icon">${icons[type] || icons.info}</span> ${message}`;
    stack.appendChild(toast);

    setTimeout(() => {
      toast.style.transition = 'opacity .25s ease, transform .25s ease';
      toast.style.opacity = '0';
      toast.style.transform = 'translateX(120%)';
      setTimeout(() => toast.remove(), 280);
    }, duration);
  };

  /* ── Sidebar Student Sync ────────────────────────────────────── */
  window.syncSidebarStudent = function (student) {
    if (!student) return;
    const initials = student.name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();
    const avatarColors = ['#F6D54A', '#B9CDF5', '#F4B8D9', '#BFE5CF', '#F2A59A'];
    const colorIdx = (student.rollNo || '').charCodeAt(student.rollNo.length - 1) % avatarColors.length;
    const bg = avatarColors[colorIdx];

    const avatarEls = [
      document.getElementById('sidebarAvatar'),
      document.getElementById('topbarAvatar'),
    ];

    avatarEls.forEach(el => {
      if (el) { el.textContent = initials; el.style.background = bg; }
    });

    const nameEl = document.getElementById('sidebarUserName');
    const rollEl = document.getElementById('sidebarUserRoll');
    if (nameEl) nameEl.textContent = student.name;
    if (rollEl) rollEl.textContent = `${student.rollNo} · Demo`;
  };

  /* ── Global Student Switcher ─────────────────────────────────── */
  const switcherEl = document.getElementById('globalStudentSelect');

  function populateSwitcher() {
    if (!switcherEl) return;
    if (typeof AppStorage === 'undefined') return;

    const roster = AppStorage.loadFacultyRoster();
    const current = AppStorage.getActiveStudentRollNo();

    switcherEl.innerHTML = '';
    roster.forEach(s => {
      const opt = document.createElement('option');
      opt.value = s.rollNo;
      opt.textContent = `${s.name} (${s.rollNo})`;
      if (s.rollNo === current) opt.selected = true;
      switcherEl.appendChild(opt);
    });

    const active = roster.find(s => s.rollNo === current) || roster[0];
    if (active) window.syncSidebarStudent(active);
  }

  if (switcherEl) {
    switcherEl.addEventListener('change', () => {
      const rollNo = switcherEl.value;
      AppStorage.setActiveStudentRollNo(rollNo);

      const roster = AppStorage.loadFacultyRoster();
      const student = roster.find(s => s.rollNo === rollNo);
      if (student) window.syncSidebarStudent(student);

      // Pages that need a reload to reflect new student
      const page = location.pathname.split('/').pop();
      if (!page.includes('faculty') && !page.includes('ai-assistant')) {
        location.reload();
      } else if (typeof window.onStudentSwitch === 'function') {
        window.onStudentSwitch(rollNo);
      }
    });
  }

  /* ── Active Nav Highlight ────────────────────────────────────── */
  const currentPage = location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav-item').forEach(link => {
    const href = link.getAttribute('href');
    if (href && href !== '#' && currentPage.includes(href.split('#')[0].replace('./', ''))) {
      // Already set in HTML via `.active` class — but ensure switcher populates
    }
  });

  /* ── Init on DOM ready ───────────────────────────────────────── */
  document.addEventListener('DOMContentLoaded', () => {
    populateSwitcher();
  });

  // Also run if storage is ready synchronously
  if (document.readyState === 'complete' || document.readyState === 'interactive') {
    setTimeout(populateSwitcher, 0);
  }

})();
