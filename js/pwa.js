/* pwa.js: install experience, connection status, and service worker registration. */
(function () {
  'use strict';
  const isStandalone = () =>
    window.matchMedia('(display-mode: standalone)').matches ||
    window.navigator.standalone === true;

  let installPrompt = null;
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'pwa-install';
  button.textContent = 'Install App';
  button.setAttribute('aria-label', 'Install Rank Up Diary');
  button.hidden = true;

  const status = document.createElement('div');
  status.className = 'pwa-status';
  status.setAttribute('role', 'status');
  status.setAttribute('aria-live', 'polite');

  function updateStatus() {
    status.textContent = navigator.onLine ? 'ONLINE' : 'OFFLINE · DATA TETAP DI PERANGKAT INI';
    status.dataset.offline = String(!navigator.onLine);
  }
  window.addEventListener('online', updateStatus);
  window.addEventListener('offline', updateStatus);
  updateStatus();

  window.addEventListener('beforeinstallprompt', (event) => {
    event.preventDefault();
    installPrompt = event;
    button.hidden = isStandalone();
  });

  window.addEventListener('appinstalled', () => {
    installPrompt = null;
    button.hidden = true;
    status.textContent = 'APP TERPASANG';
  });

  button.addEventListener('click', async () => {
    if (installPrompt) {
      installPrompt.prompt();
      try { await installPrompt.userChoice; } catch (e) {}
      installPrompt = null;
      button.hidden = true;
      return;
    }
    const ua = navigator.userAgent || '';
    if (/iPhone|iPad|iPod/i.test(ua)) {
      window.alert('Untuk memasang Rank Up Diary di iPhone/iPad:\\n1. Buka halaman ini di Safari.\\n2. Tekan tombol Share.\\n3. Pilih “Add to Home Screen”.');
    } else {
      window.alert('Jika tombol instalasi belum muncul, buka menu browser lalu pilih “Install app” atau “Add to Home screen”. Pastikan situs dibuka melalui HTTPS atau localhost.');
    }
  });

  function mount() {
    document.body.appendChild(button);
    document.body.appendChild(status);
    button.hidden = isStandalone();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mount, { once: true });
  else mount();

  if ('serviceWorker' in navigator && (location.protocol === 'https:' || location.hostname === 'localhost' || location.hostname === '127.0.0.1')) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('./sw.js').catch((err) => {
        console.warn('PWA service worker registration failed:', err);
      });
    }, { once: true });
  }
})();
