// name=js/map-resize-observer.js
(function(){
  const el = document.getElementById('map');
  if (!el || !window.ResizeObserver) return;

  const tryResize = () => {
    try {
      if (window.mapGL && typeof window.mapGL.resize === 'function') {
        window.mapGL.resize();
      }
    } catch (e) {
      // map may not be initialized yet
    }
  };

  const ro = new ResizeObserver(tryResize);
  ro.observe(el);

  window.addEventListener('load', tryResize);
  window.addEventListener('orientationchange', tryResize);

  if (typeof window.setMapAvailableHeight === 'function') {
    const original = window.setMapAvailableHeight;
    window.setMapAvailableHeight = function(){
      const res = original();
      tryResize();
      return res;
    };
  }
})();
