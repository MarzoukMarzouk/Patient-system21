if ('serviceWorker' in navigator) {
  window.addEventListener('load', function() {
    navigator.serviceWorker.register('/sw.js').then(function(reg) {
      console.log('Service worker registered.', reg);
    }).catch(function(err) {
      console.warn('Service worker registration failed:', err);
    });
  });
}
