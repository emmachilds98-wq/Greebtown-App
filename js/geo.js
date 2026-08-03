// Minimal geolocation shim for Greebtown
// Ensures a safe, non-throwing API exposed to the app and wired to the GPS toggle.
// Loaded before js/app.js so load-time callers won't hit TDZ or ReferenceError.
(function(window){
  const geo = {
    _watchId: null,
    _lastPosition: null,
    getLastKnownPosition() { return geo._lastPosition; },
    async getCurrentPosition(options){
      if (!navigator || !navigator.geolocation) return Promise.reject(new Error('Geolocation unavailable'));
      return new Promise((resolve, reject)=>{
        try{
          navigator.geolocation.getCurrentPosition((pos)=>{
            geo._lastPosition = pos;
            resolve(pos);
          }, (err)=>{
            reject(err);
          }, options);
        }catch(e){ reject(e); }
      });
    },
    startAutoUpdate(intervalMs, onUpdate){
      // If watchPosition is available, use it (better battery/accuracy), else poll with getCurrentPosition.
      geo.stopAutoUpdate();
      if (!navigator || !navigator.geolocation) return false;
      try{
        if (navigator.geolocation.watchPosition){
          geo._watchId = navigator.geolocation.watchPosition((pos)=>{ geo._lastPosition = pos; if(typeof onUpdate==='function') onUpdate(pos); }, (err)=>{ console.warn('geo.watchPosition error', err); });
        }else{
          // fallback polling
          geo._watchId = setInterval(()=>{ geo.getCurrentPosition().then(p=>{ if(typeof onUpdate==='function') onUpdate(p); }).catch(()=>{}); }, intervalMs || 120000);
        }
        return true;
      }catch(e){
        console.warn('geo.startAutoUpdate failed', e);
        return false;
      }
    },
    stopAutoUpdate(){
      if (geo._watchId == null) return;
      try{
        if (typeof geo._watchId === 'number' && navigator && navigator.geolocation && navigator.geolocation.clearWatch){
          navigator.geolocation.clearWatch(geo._watchId);
        }else if (typeof geo._watchId === 'object' || typeof geo._watchId === 'number'){
          clearInterval(geo._watchId);
        }
      }catch(e){}
      geo._watchId = null;
    }
  };

  // Expose on window in an unobtrusive name — app.js will call these via the gps toggle wiring.
  window._GreebtownGeo = geo;
})(window);
