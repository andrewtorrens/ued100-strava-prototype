/* ==========================================================================
   nav.js — shared on every page
   1. Mobile hamburger menu (brief: "responsive navigation menus")
   2. Dark-mode toggle (A1: custom properties make theming easy)
   3. Out-of-scope nav links do nothing (see README "Scope")
   Plain script (not a module) so it runs on every page with `defer`.
   ========================================================================== */
(function () {
  'use strict';

  /* ---------- 1. Hamburger menu ---------- */
  const toggle = document.querySelector('.nav-toggle');
  const nav = document.getElementById('primary-nav');

  function setMenu(open) {
    toggle.setAttribute('aria-expanded', String(open));
    nav.classList.toggle('is-open', open);
  }

  if (toggle && nav) {
    toggle.addEventListener('click', () => {
      setMenu(toggle.getAttribute('aria-expanded') !== 'true');
    });

    // Escape closes the menu and returns focus to the button (keyboard users)
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && nav.classList.contains('is-open')) {
        setMenu(false);
        toggle.focus();
      }
    });

    // If the window grows past the mobile breakpoint, reset menu state
    const desktop = window.matchMedia('(min-width: 48rem)');
    desktop.addEventListener('change', (e) => { if (e.matches) setMenu(false); });
  }

  /* ---------- 2. Theme toggle ----------
     Preference saved in localStorage. Wrapped in try/catch because storage
     can be blocked (private browsing, strict settings). No inline script is
     allowed by the CSP, so there may be a brief light flash before dark mode
     applies — acceptable for a prototype; noted in README. */
  const themeBtn = document.querySelector('.theme-toggle');
  const root = document.documentElement;

  function applyTheme(theme) {
    if (theme === 'dark') root.setAttribute('data-theme', 'dark');
    else root.removeAttribute('data-theme');
    if (themeBtn) {
      themeBtn.setAttribute('aria-pressed', String(theme === 'dark'));
      themeBtn.textContent = theme === 'dark' ? 'Light mode' : 'Dark mode';
    }
  }

  let saved = null;
  try { saved = localStorage.getItem('theme'); } catch (_) { /* storage unavailable */ }
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  applyTheme(saved || (prefersDark ? 'dark' : 'light'));

  if (themeBtn) {
    themeBtn.addEventListener('click', () => {
      const next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
      applyTheme(next);
      try { localStorage.setItem('theme', next); } catch (_) { /* ignore */ }
    });
  }

  /* ---------- 3. Out-of-scope links ---------- */
  document.querySelectorAll('a[aria-disabled="true"]').forEach((link) => {
    link.addEventListener('click', (e) => e.preventDefault());
  });
})();
