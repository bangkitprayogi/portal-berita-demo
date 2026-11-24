/*
 * Portal Berita: perilaku kecil di sisi pembaca.
 * 1. Pilihan tema Terang / Gelap / Sistem (disimpan di perangkat pembaca).
 * 2. Tombol "Salin tautan" pada bagian bagikan artikel.
 * Tanpa jQuery, dimuat dengan defer.
 */
(function () {
  'use strict';

  var KEY = 'pb-theme';
  var root = document.documentElement;

  function readPref() {
    try { return localStorage.getItem(KEY) || 'system'; } catch (e) { return 'system'; }
  }
  function savePref(value) {
    try { localStorage.setItem(KEY, value); } catch (e) { /* penyimpanan diblokir: pilihan berlaku sampai halaman ditutup */ }
  }
  function apply(value) {
    if (value === 'light' || value === 'dark') {
      root.setAttribute('data-theme', value);
    } else {
      root.removeAttribute('data-theme');
    }
    document.querySelectorAll('[data-pb-theme]').forEach(function (btn) {
      btn.setAttribute('aria-pressed', String(btn.getAttribute('data-pb-theme') === value));
    });
  }

  function initTheme() {
    apply(readPref());
    document.querySelectorAll('[data-pb-theme]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var value = btn.getAttribute('data-pb-theme');
        savePref(value);
        apply(value);
      });
    });
  }

  function initCopy() {
    document.querySelectorAll('[data-pb-copy]').forEach(function (btn) {
      var label = btn.querySelector('.pb-sr-only');
      var original = label ? label.textContent : '';
      btn.addEventListener('click', function () {
        var url = btn.getAttribute('data-pb-copy') || window.location.href;
        var done = function () {
          btn.setAttribute('aria-label', 'Tautan tersalin');
          var live = document.getElementById('pb-live');
          if (live) { live.textContent = 'Tautan artikel sudah disalin.'; }
          window.setTimeout(function () { btn.setAttribute('aria-label', original || 'Salin tautan'); }, 2500);
        };
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(url).then(done, function () { window.prompt('Salin tautan ini:', url); });
        } else {
          window.prompt('Salin tautan ini:', url);
        }
      });
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () { initTheme(); initCopy(); });
  } else {
    initTheme();
    initCopy();
  }
})();
