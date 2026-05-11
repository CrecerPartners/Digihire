(function () {
  function initMobileMenu() {
    var overlay   = document.getElementById('nav-mobile-overlay');
    var openBtn   = document.getElementById('nav-hamburger-btn');
    var closeBtn  = document.getElementById('nm-close-btn');
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

    /* Close when a link inside the overlay is followed */
    overlay.querySelectorAll('a').forEach(function (a) {
      a.addEventListener('click', closeMenu);
    });

    /* Accordion sub-menus */
    overlay.querySelectorAll('.nm-trigger[data-nm-target]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var targetId  = btn.getAttribute('data-nm-target');
        var submenu   = document.getElementById(targetId);
        var isOpen    = submenu && submenu.classList.contains('nm-open');

        /* Collapse all */
        overlay.querySelectorAll('.nm-submenu.nm-open').forEach(function (el) {
          el.classList.remove('nm-open');
        });
        overlay.querySelectorAll('.nm-trigger.nm-active').forEach(function (el) {
          el.classList.remove('nm-active');
        });

        /* Expand clicked (unless it was already open) */
        if (!isOpen && submenu) {
          submenu.classList.add('nm-open');
          btn.classList.add('nm-active');
        }
      });
    });
  }

  function boot(root) {
    fetch('/nav-partial.html')
      .then(function (r) { return r.text(); })
      .then(function (html) {
        root.innerHTML = html;
        var styleBlock = root.querySelector('style');
        if (styleBlock) document.head.appendChild(styleBlock);
        if (window.lucide && typeof window.lucide.createIcons === 'function') {
          window.lucide.createIcons();
        }
        var nav = document.getElementById('navbar');
        if (nav) {
          var onScroll = function () {
            nav.classList.toggle('scrolled', window.scrollY > 60);
          };
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
