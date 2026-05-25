(function () {

  function rewriteLocalLinks(container) {
    var host = window.location.hostname;
    var isLocal = host === 'localhost' || host === '127.0.0.1';
    if (!isLocal) return;

    var mappings = [
      { prod: 'https://brands.digihire.io', local: 'http://localhost:8084' },
      { prod: 'https://talents.digihire.io', local: 'http://localhost:8081' },
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

  function boot(root) {
    var scriptEl = document.currentScript || document.querySelector('script[src*="footer-loader"]');
    var base = (scriptEl && scriptEl.getAttribute('data-base')) || '/';
    var footerUrl = base.replace(/\/$/, '') + '/footer-partial.html';

    fetch(footerUrl)
      .then(function (r) { return r.text(); })
      .then(function (html) {
        root.innerHTML = html;
        var styleBlock = root.querySelector('style');
        if (styleBlock) document.head.appendChild(styleBlock);

        var host = window.location.hostname;
        var port = window.location.port;
        var isBrands    = host === 'brands.digihire.io'    || port === '8084';
        var isVoltsquad = host === 'talents.digihire.io' || port === '8081';
        var isApp       = isBrands || isVoltsquad;

        if (isApp) {
          var appBase = 'https://digihire.io';
          ['/about', '/blog', '/events', '/contact', '/sales-activations'].forEach(function (path) {
            root.querySelectorAll('a[href="' + path + '"]').forEach(function (a) {
              a.href = appBase + path;
            });
          });
          /* Logo link in footer */
          root.querySelectorAll('.footer-logo-wrap a[href="/"]').forEach(function (a) {
            a.href = appBase;
          });
        }

        rewriteLocalLinks(root);

        if (window.lucide && typeof window.lucide.createIcons === 'function') {
          window.lucide.createIcons();
        }
      })
      .catch(function (err) { console.warn('footer-loader failed', err); });
  }

  function ready() {
    var root = document.getElementById('footer-root');
    if (!root) return;
    boot(root);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', ready);
  } else {
    ready();
  }
})();
