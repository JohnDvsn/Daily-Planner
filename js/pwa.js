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

  const notifyButton = document.createElement('button');
  notifyButton.type = 'button';
  notifyButton.className = 'pwa-notify';
  notifyButton.textContent = 'Aktifkan Notifikasi';
  notifyButton.setAttribute('aria-label', 'Aktifkan notifikasi Rank Up Diary');

  const copyTokenButton = document.createElement('button');
  copyTokenButton.type = 'button';
  copyTokenButton.className = 'pwa-copy-token';
  copyTokenButton.textContent = 'Salin Token FCM';
  copyTokenButton.hidden = true;
  copyTokenButton.setAttribute('aria-label', 'Salin token perangkat Firebase Cloud Messaging');

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
    document.body.appendChild(notifyButton);
    document.body.appendChild(copyTokenButton);
    document.body.appendChild(status);
    button.hidden = isStandalone();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mount, { once: true });
  else mount();

  let swRegistration = null;
  let fcmMessaging = null;
  let fcmToken = localStorage.getItem('ru_fcm_token') || '';
  const config = window.RU_FIREBASE_CONFIG || {};
  const firebaseConfigured = Boolean(
    window.firebase && config.apiKey && config.projectId && config.messagingSenderId && config.appId && config.vapidKey &&
    !Object.values(config).some((value) => String(value).includes('PASTE_'))
  );

  function setNotifyLabel(text, disabled) {
    notifyButton.textContent = text;
    notifyButton.disabled = Boolean(disabled);
  }

  if (!('Notification' in window) || !('serviceWorker' in navigator) || !('PushManager' in window)) {
    setNotifyLabel('Notifikasi Tidak Didukung', true);
  } else if (!firebaseConfigured) {
    setNotifyLabel('Atur Firebase Dulu', false);
  } else if (Notification.permission === 'denied') {
    setNotifyLabel('Izin Notifikasi Ditolak', true);
  } else if (Notification.permission === 'granted' && fcmToken) {
    setNotifyLabel('Notifikasi Aktif ✓', false);
    copyTokenButton.hidden = false;
  }

  async function registerPush() {
    if (!firebaseConfigured) {
      window.alert('Firebase belum dikonfigurasi. Isi firebase-config.js sesuai panduan di PWA-README.md, lalu publish ulang.');
      return;
    }
    if (!('Notification' in window) || !('serviceWorker' in navigator) || !('PushManager' in window)) {
      window.alert('Browser ini belum mendukung Web Push untuk Rank Up Diary.');
      return;
    }
    try {
      setNotifyLabel('Menyiapkan…', true);
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        setNotifyLabel(permission === 'denied' ? 'Izin Notifikasi Ditolak' : 'Aktifkan Notifikasi', false);
        return;
      }
      swRegistration = swRegistration || await navigator.serviceWorker.ready;
      if (!firebase.apps.length) firebase.initializeApp(config);
      fcmMessaging = firebase.messaging();
      fcmToken = await fcmMessaging.getToken({ vapidKey: config.vapidKey, serviceWorkerRegistration: swRegistration });
      if (!fcmToken) throw new Error('Firebase belum memberikan token perangkat.');
      localStorage.setItem('ru_fcm_token', fcmToken);
      setNotifyLabel('Notifikasi Aktif ✓', false);
      copyTokenButton.hidden = false;
      window.alert('Notifikasi berhasil diaktifkan di perangkat ini. Token perangkat sudah tersimpan lokal. Untuk menguji push, ikuti bagian “Tes notifikasi” di PWA-README.md.');
      if (fcmMessaging.onMessage) {
        fcmMessaging.onMessage((payload) => {
          const note = payload.notification || {};
          const title = note.title || 'Rank Up Diary';
          const body = note.body || 'Ada kabar baru dari progresmu.';
          // Foreground push is shown in-app to avoid duplicate system notifications.
          const toast = document.createElement('div');
          toast.className = 'pwa-push-toast';
          toast.textContent = title + ' — ' + body;
          document.body.appendChild(toast);
          window.setTimeout(() => toast.remove(), 5000);
        });
      }
    } catch (error) {
      console.error('FCM registration failed:', error);
      setNotifyLabel('Coba Aktifkan Lagi', false);
      window.alert('Notifikasi belum berhasil disiapkan: ' + (error.message || 'periksa konfigurasi Firebase dan koneksi internet.'));
    }
  }
  notifyButton.addEventListener('click', registerPush);
  copyTokenButton.addEventListener('click', async () => {
    if (!fcmToken) return;
    try {
      await navigator.clipboard.writeText(fcmToken);
      window.alert('Token FCM berhasil disalin. Jangan unggah atau bagikan token ini secara publik.');
    } catch (error) {
      window.alert('Clipboard tidak tersedia. Token tersimpan di localStorage dengan nama ru_fcm_token.');
    }
  });

  if ('serviceWorker' in navigator && (location.protocol === 'https:' || location.hostname === 'localhost' || location.hostname === '127.0.0.1')) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('./sw.js').then((registration) => {
        swRegistration = registration;
      }).catch((err) => {
        console.warn('PWA service worker registration failed:', err);
      });
    }, { once: true });
  }
})();
