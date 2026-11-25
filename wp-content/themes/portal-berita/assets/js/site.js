/*
 * Portal Berita: perilaku kecil di sisi pembaca.
 * 1. Pilihan tema Terang / Gelap / Sistem (disimpan di perangkat pembaca).
 * 2. Tombol "Salin tautan" pada bagian bagikan artikel.
 * 3. Pemutar video: iframe dari YouTube/TikTok/dll. baru dimuat setelah tombol putar ditekan.
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

  function initPlayers() {
    document.addEventListener('click', function (e) {
      var btn = e.target.closest ? e.target.closest('.pb-player__play') : null;
      if (!btn) { return; }
      var player = btn.closest('[data-pb-player]');
      var frame = player && player.querySelector('.pb-player__frame');
      if (!frame) { return; }
      var media;
      if (player.hasAttribute('data-file')) {
        // Berkas video dari Media: pemutar bawaan browser.
        media = document.createElement('video');
        media.src = player.getAttribute('data-src');
        media.controls = true;
        media.playsInline = true;
        media.autoplay = true;
        media.className = 'pb-player__video';
        media.setAttribute('aria-label', player.getAttribute('data-title') || 'Video');
      } else {
        media = document.createElement('iframe');
        media.src = player.getAttribute('data-src');
        media.title = player.getAttribute('data-title') || 'Video';
        media.allow = 'autoplay; encrypted-media; picture-in-picture; fullscreen; clipboard-write';
        media.setAttribute('allowfullscreen', '');
        media.setAttribute('referrerpolicy', 'strict-origin-when-cross-origin');
        media.className = 'pb-player__iframe';
      }
      frame.querySelectorAll('.pb-player__poster, .pb-player__play').forEach(function (n) { n.remove(); });
      frame.appendChild(media);
      player.classList.add('is-playing');
      media.focus();
    });
  }

  function init() { initTheme(); initCopy(); initPlayers(); }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
