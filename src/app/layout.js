import './globals.css';

function ToastListener() {
  if (typeof window !== 'undefined') {
    if (!window.__toastListenerInstalled) {
      window.__toastListenerInstalled = true;
      window.addEventListener('show-toast', (e) => {
        const { msg, type = 'info' } = e.detail || {};
        const c = document.getElementById('toastContainer');
        if (!c) return;
        const w = document.createElement('div');
        w.className = `toast align-items-center text-bg-${type} border-0 show`;
        w.setAttribute('role', 'alert');
        w.setAttribute('aria-live', 'assertive');
        w.setAttribute('aria-atomic', 'true');
        w.innerHTML = `<div class="d-flex"><div class="toast-body">${msg}</div><button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button></div>`;
        c.appendChild(w);
        setTimeout(() => { w.classList.remove('show'); setTimeout(() => w.remove(), 300); }, 2500);
      });
    }
  }
  return null;
}

function ToastContainer() {
  return (
    <>
      <div id="toastContainer" className="position-fixed bottom-0 end-0 p-3" style={{ zIndex: 1080 }}></div>
      <ToastListener />
    </>
  );
}

export default function RootLayout({ children }) {
  return (
    <html lang="ar" dir="rtl">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
          <title>نظام إدارة المرضى</title>
          <link rel="manifest" href="/manifest.json" />
          <meta name="theme-color" content="#0d6efd" />
          <meta name="apple-mobile-web-app-capable" content="yes" />
          <meta name="apple-mobile-web-app-status-bar-style" content="default" />
          <link rel="preconnect" href="https://cdn.jsdelivr.net" />
        <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet" crossOrigin="anonymous" />
        <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.min.css" crossOrigin="anonymous" />
      </head>
      <body>
        <ToastContainer />
        {children}
          <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js" async></script>
          <script src="/register-sw.js" async></script>
      </body>
    </html>
  );
}
