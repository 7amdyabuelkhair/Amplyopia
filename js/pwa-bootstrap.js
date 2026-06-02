(() => {
  const cfg = () => window.PWA_CONFIG || {};
  const VERSION_KEY = 'amplyopia_installed_version';

  let deferredInstallPrompt = null;

  function registerServiceWorker() {
    if (!('serviceWorker' in navigator)) return;
    navigator.serviceWorker
      .register('/service-worker.js', { scope: '/' })
      .then((reg) => {
        reg.addEventListener('updatefound', () => {
          const worker = reg.installing;
          if (!worker) return;
          worker.addEventListener('statechange', () => {
            if (worker.state === 'installed' && navigator.serviceWorker.controller) {
              showUpdateBanner(reg);
            }
          });
        });
      })
      .catch((err) => console.warn('SW registration failed:', err));
  }

  function showInstallBanner() {
    if (document.getElementById('pwa-install-banner')) return;
    const banner = document.createElement('div');
    banner.id = 'pwa-install-banner';
    banner.className = 'pwa-install-banner';
    banner.innerHTML = `
      <p>Install Amplyopia on your phone for quick access.</p>
      <div style="display:flex;gap:8px;">
        <button type="button" class="btn-dismiss">Not now</button>
        <button type="button" class="btn-install">Install</button>
      </div>
    `;
    banner.querySelector('.btn-dismiss')?.addEventListener('click', () => banner.remove());
    banner.querySelector('.btn-install')?.addEventListener('click', async () => {
      if (!deferredInstallPrompt) return;
      deferredInstallPrompt.prompt();
      await deferredInstallPrompt.userChoice;
      deferredInstallPrompt = null;
      banner.remove();
    });
    document.body.appendChild(banner);
  }

  function showUpdateBanner(registration) {
    if (document.getElementById('pwa-update-banner')) return;
    const banner = document.createElement('div');
    banner.id = 'pwa-update-banner';
    banner.className = 'pwa-update-banner';
    banner.innerHTML = `
      <p>A new version of Amplyopia is available.</p>
      <div style="display:flex;gap:8px;">
        <button type="button" class="btn-later">Later</button>
        <button type="button" class="btn-update">Update now</button>
      </div>
    `;
    banner.querySelector('.btn-later')?.addEventListener('click', () => banner.remove());
    banner.querySelector('.btn-update')?.addEventListener('click', () => {
      const waiting = registration.waiting;
      if (waiting) waiting.postMessage({ type: 'SKIP_WAITING' });
      navigator.serviceWorker.addEventListener('controllerchange', () => window.location.reload());
      registration.update();
      banner.remove();
    });
    document.body.appendChild(banner);
  }

  async function checkVersionUpdate() {
    const url = cfg().VERSION_URL || '/version.json';
    try {
      const res = await fetch(`${url}?t=${Date.now()}`, { cache: 'no-store' });
      if (!res.ok) return;
      const remote = await res.json();
      const remoteVersion = String(remote.version || '');
      const localVersion = localStorage.getItem(VERSION_KEY) || remoteVersion;
      if (!localVersion) {
        localStorage.setItem(VERSION_KEY, remoteVersion);
        return;
      }
      if (remoteVersion && remoteVersion !== localVersion) {
        if ('serviceWorker' in navigator) {
          const reg = await navigator.serviceWorker.getRegistration();
          if (reg) {
            await reg.update();
            showUpdateBanner(reg);
            return;
          }
        }
      }
      localStorage.setItem(VERSION_KEY, remoteVersion);
    } catch (_) {}
  }

  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredInstallPrompt = e;
    showInstallBanner();
  });

  document.addEventListener('DOMContentLoaded', () => {
    registerServiceWorker();
    checkVersionUpdate();
    // Resume timer display if it was started from Lazy Eye (does not auto-start on sign-in).
    window.SessionTimer?.init?.();

    function subscribePushIfSignedIn(session) {
      if (session?.user?.id) window.PushClient?.subscribePush?.().catch(() => {});
    }

    window.SupabaseApp?.onAuthStateChange?.(subscribePushIfSignedIn);
    window.SupabaseApp?.getSession?.().then(subscribePushIfSignedIn);
  });

  window.PWA = { checkVersionUpdate };
})();
