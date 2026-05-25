(function () {

  /* ── Auth: read Supabase session from localStorage ───────── */
  function getAuthSession() {
    try {
      for (var i = 0; i < localStorage.length; i++) {
        var key = localStorage.key(i);
        if (key && key.startsWith('sb-') && key.endsWith('-auth-token')) {
          var data = JSON.parse(localStorage.getItem(key));
          if (data && data.access_token) {
            var exp = data.expires_at; /* unix seconds */
            if (exp && exp > 0 && (Date.now() / 1000) < exp) return data;
          }
        }
      }
    } catch (e) {}
    return null;
  }

  /* ── Button helper: update text while preserving SVG icon ─── */
  function setBtn(el, text, href) {
    if (!el) return;
    if (href) el.href = href;
    var svg = el.querySelector('svg');
    el.textContent = text;
    if (svg) el.appendChild(svg);
  }

  function rewriteLocalLinks(container) {
    var host = window.location.hostname;
    var isLocal = host === 'localhost' || host === '127.0.0.1';
    if (!isLocal) return;

    var mappings = [
      { prod: 'https://brands.digihire.io', local: 'http://localhost:8084' },
      { prod: 'https://voltsquad.digihire.io', local: 'http://localhost:8081' },
      { prod: 'https://talents.digihire.io', local: 'http://localhost:8083' },
      { prod: 'https://digihire.io', local: 'http://localhost:8080' }
    ];

    container.querySelectorAll('a').forEach(function (a) {
      var href = a.getAttribute('href') || '';
      for (var i = 0; i < mappings.length; i++) {
        var m = mappings[i];
        if (href.indexOf(m.prod) === 0) {
          a.href = href.replace(m.prod, m.local);
          break;
        }
      }
    });
  }

  /* ── Apply context: auth state + app-specific CTA ────────── */
  function applyContext(root) {
    var host = window.location.hostname;
    var port = window.location.port;

    var isBrands    = host === 'brands.digihire.io'    || port === '8084';
    var isVoltsquad = host === 'voltsquad.digihire.io' || port === '8081';
    var isApp       = isBrands || isVoltsquad;

    var session   = getAuthSession();
    var loggedIn  = !!session;

    var btnLaunch     = root.querySelector('.btn-launch');
    var dropWrap      = root.querySelector('.nav-dropdown-wrap');
    var mobileCyan    = root.querySelector('.nm-btn-cyan');
    var mobileOutline = root.querySelector('.nm-btn-outline');

    /* Fix relative landing links to absolute when inside an app context
       so /about doesn't 404 on brands.digihire.io                       */
    if (isApp) {
      var base = 'https://digihire.io';
      ['/about', '/blog', '/events', '/contact', '/sales-activations'].forEach(function (path) {
        root.querySelectorAll('a[href="' + path + '"]').forEach(function (a) {
          a.href = base + path;
        });
      });
      /* Logo home link → digihire.io */
      root.querySelectorAll('a.nav-logo').forEach(function (a) { a.href = base; });
    }

    if (isBrands) {
      if (loggedIn) {
        /* ── Brands app, logged in ────────────────────────── */
        setBtn(btnLaunch, 'Dashboard', '/dashboard');
        if (dropWrap) dropWrap.style.display = 'none';
        setBtn(mobileCyan, 'Dashboard', '/dashboard');
        if (mobileOutline) mobileOutline.style.display = 'none';
      } else {
        /* ── Brands app, not logged in ───────────────────── */
        setBtn(btnLaunch, 'Login as a Brand', '/login');
        if (dropWrap) dropWrap.style.display = 'none';
        setBtn(mobileCyan, 'Login as a Brand', '/login');
        if (mobileOutline) mobileOutline.style.display = 'none';
      }

    } else if (isVoltsquad) {
      if (loggedIn) {
        /* ── VoltSquad app, logged in ─────────────────────── */
        setBtn(btnLaunch, 'Dashboard', '/dashboard');
        if (dropWrap) dropWrap.style.display = 'none';
        setBtn(mobileCyan, 'Dashboard', '/dashboard');
        if (mobileOutline) mobileOutline.style.display = 'none';
      } else {
        /* ── VoltSquad app, not logged in ────────────────── */
        setBtn(btnLaunch, 'Login to VoltSquad', '/login');
        if (dropWrap) dropWrap.style.display = 'none';
        setBtn(mobileCyan, 'Login to VoltSquad', '/login');
        if (mobileOutline) mobileOutline.style.display = 'none';
      }

    }
    /* else: main landing — keep all defaults regardless of auth */

    rewriteLocalLinks(root);
  }

  /* ── Mobile menu accordion ────────────────────────────────── */
  function initMobileMenu() {
    var overlay  = document.getElementById('nav-mobile-overlay');
    var openBtn  = document.getElementById('nav-hamburger-btn');
    var closeBtn = document.getElementById('nm-close-btn');
    if (!overlay || !openBtn) return;

    function openMenu() {
      overlay.classList.add('nm-open');
      overlay.setAttribute('aria-hidden', 'false');
      document.body.style.overflow = 'hidden';
    }
    function closeMenu() {
      overlay.classList.remove('nm-open');
      overlay.setAttribute('aria-hidden', 'true');
      document.body.style.overflow = '';
    }

    openBtn.addEventListener('click', openMenu);
    if (closeBtn) closeBtn.addEventListener('click', closeMenu);

    overlay.querySelectorAll('a').forEach(function (a) {
      a.addEventListener('click', closeMenu);
    });

    overlay.querySelectorAll('.nm-trigger[data-nm-target]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var targetId = btn.getAttribute('data-nm-target');
        var submenu  = document.getElementById(targetId);
        var isOpen   = submenu && submenu.classList.contains('nm-open');

        overlay.querySelectorAll('.nm-submenu.nm-open').forEach(function (el) { el.classList.remove('nm-open'); });
        overlay.querySelectorAll('.nm-trigger.nm-active').forEach(function (el) { el.classList.remove('nm-active'); });

        if (!isOpen && submenu) {
          submenu.classList.add('nm-open');
          btn.classList.add('nm-active');
        }
      });
    });
  }

  /* ── Boot: fetch nav-partial, inject, then wire up ───────── */
  function boot(root) {
    var scriptEl = document.currentScript || document.querySelector('script[src*="nav-loader"]');
    var base = (scriptEl && scriptEl.getAttribute('data-base')) || '/';
    var navUrl = base.replace(/\/$/, '') + '/nav-partial.html';
    fetch(navUrl)
      .then(function (r) { return r.text(); })
      .then(function (html) {
        root.innerHTML = html;

        /* Move <style> block to <head> so it is not scoped to the div */
        var styleBlock = root.querySelector('style');
        if (styleBlock) document.head.appendChild(styleBlock);

        if (window.lucide && typeof window.lucide.createIcons === 'function') {
          window.lucide.createIcons();
        }

        applyContext(root);
        rewriteLocalLinks(document);

        /* Scroll-shrink behaviour */
        var nav = document.getElementById('navbar');
        if (nav) {
          var onScroll = function () { nav.classList.toggle('scrolled', window.scrollY > 60); };
          window.addEventListener('scroll', onScroll, { passive: true });
          onScroll();
        }

        initMobileMenu();
      })
      .catch(function (err) { console.warn('nav-loader failed', err); });
  }

  function ready() {
    var root = document.getElementById('nav-root');
    if (!root) return;
    boot(root);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', ready);
  } else {
    ready();
  }

})();
