(function () {
  function boot(root) {
    fetch('/footer-partial.html')
      .then(function (r) { return r.text(); })
      .then(function (html) {
        root.innerHTML = html;
        var styleBlock = root.querySelector('style');
        if (styleBlock) document.head.appendChild(styleBlock);
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
