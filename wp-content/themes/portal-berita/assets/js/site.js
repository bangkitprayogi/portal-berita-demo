/*
 * Portal Berita: perilaku kecil di sisi pembaca.
 * 1. Pilihan tema Terang / Gelap / Sistem (disimpan di perangkat pembaca).
 * 2. Tombol "Salin tautan" pada bagian bagikan artikel.
 * 3. Pemutar video: iframe dari YouTube/TikTok/dll. baru dimuat setelah tombol putar ditekan.
 * 4. Pemutar siaran melayang: muncul setelah halaman selesai dimuat, bisa ditutup,
 *    dan pilihan tutup diingat selama tab browser masih terbuka.
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

  function initFloat() {
    var box = document.getElementById('pb-float');
    if (!box) { return; }
    var launch = document.getElementById('pb-float-launch');
    var frame = box.querySelector('.pb-float__frame');
    var playBtn = box.querySelector('.pb-float__play');
    var muteBtn = box.querySelector('.pb-float__mute');
    var key = 'pb-float:' + box.getAttribute('data-key');
    var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var auto = box.getAttribute('data-autoplay') === '1' && !reduce;
    var media = null;
    var muted = true;

    function store(k, v) {
      try { if (v) { sessionStorage.setItem(k, v); } else { sessionStorage.removeItem(k); } } catch (e) { /* diblokir: berlaku sampai pindah halaman */ }
    }
    function read(k) { try { return sessionStorage.getItem(k); } catch (e) { return null; } }

    function load(byUser) {
      if (media) { return; }
      var src = box.getAttribute('data-src');
      if (byUser) {
        // Pembaca menekan putar sendiri: putar dengan suara.
        src = src.replace('autoplay=0', 'autoplay=1').replace('autoplay=false', 'autoplay=true').replace('mute=1', 'mute=0').replace('muted=1', 'muted=0');
        muted = false;
      }
      if (box.getAttribute('data-provider') === 'file') {
        media = document.createElement('video');
        media.src = src;
        media.muted = muted;
        media.autoplay = true;
        media.loop = true;
        media.playsInline = true;
        media.setAttribute('aria-label', box.getAttribute('data-title'));
      } else {
        media = document.createElement('iframe');
        media.src = src;
        media.title = box.getAttribute('data-title');
        media.allow = 'autoplay; encrypted-media; picture-in-picture; fullscreen';
        media.setAttribute('allowfullscreen', '');
        media.setAttribute('referrerpolicy', 'strict-origin-when-cross-origin');
      }
      media.className = 'pb-float__media';
      frame.insertBefore(media, frame.firstChild);
      if (playBtn) { playBtn.hidden = true; }
      if (muteBtn) { muteBtn.hidden = false; muteBtn.setAttribute('aria-pressed', String(!muted)); }
    }
    function unload() {
      if (media) { media.remove(); media = null; }
      muted = true;
      if (playBtn) { playBtn.hidden = false; }
      if (muteBtn) { muteBtn.hidden = true; }
    }
    function show() {
      box.hidden = false;
      if (launch) { launch.hidden = true; }
      if (auto) { load(false); }
    }
    function showLaunch() {
      if (launch && read(key + ':launch') !== 'tutup') { launch.hidden = false; }
    }

    if (playBtn) { playBtn.addEventListener('click', function () { load(true); }); }
    if (muteBtn) {
      muteBtn.addEventListener('click', function () {
        muted = !muted;
        if (media && media.tagName === 'VIDEO') {
          media.muted = muted;
        } else if (media && media.contentWindow) {
          media.contentWindow.postMessage(JSON.stringify({ event: 'command', func: muted ? 'mute' : 'unMute', args: [] }), '*');
          if (!muted) { media.contentWindow.postMessage(JSON.stringify({ event: 'command', func: 'playVideo', args: [] }), '*'); }
        }
        muteBtn.setAttribute('aria-pressed', String(!muted));
      });
    }
    box.querySelector('[data-pb-float-close]').addEventListener('click', function () {
      box.hidden = true;
      unload();
      store(key, 'tutup');
      showLaunch();
      if (launch && !launch.hidden) { launch.querySelector('.pb-float-launch__open').focus(); }
    });
    if (launch) {
      launch.querySelector('.pb-float-launch__open').addEventListener('click', function () {
        store(key, null);
        auto = true;
        show();
        box.querySelector('.pb-float__close').focus();
      });
      launch.querySelector('.pb-float-launch__close').addEventListener('click', function () {
        launch.hidden = true;
        store(key + ':launch', 'tutup');
      });
    }

    function start() {
      if (read(key) === 'tutup') { showLaunch(); return; }
      var section = document.getElementById('siaran-langsung');
      if (section && 'IntersectionObserver' in window) {
        // Di beranda, pemutar melayang baru muncul saat siaran utama sudah tergulir lewat.
        new IntersectionObserver(function (entries) {
          var mainPlaying = !!section.querySelector('.is-playing');
          if (read(key) === 'tutup') { return; }
          if (entries[0].isIntersecting || mainPlaying) {
            box.hidden = true;
            if (mainPlaying) { unload(); }
          } else {
            show();
          }
        }).observe(section);
        return;
      }
      show();
    }
    // Ditunda sampai halaman selesai dimuat agar tidak memperlambat tampilan berita.
    if (document.readyState === 'complete') {
      window.setTimeout(start, 1500);
    } else {
      window.addEventListener('load', function () { window.setTimeout(start, 1500); });
    }
  }

  function init() { initTheme(); initCopy(); initPlayers(); initFloat(); }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
