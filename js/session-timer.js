(() => {
  const STORAGE_KEY = 'amplyopia_session_end_at';
  const cfg = () => window.PWA_CONFIG || {};
  const durationMs = () => Number(cfg().SESSION_DURATION_MS) || 40 * 60 * 1000;

  function getGenderTheme() {
    const g = String(localStorage.getItem('userGender') || '').toLowerCase();
    if (g === 'boy') return 'theme-boy';
    if (g === 'girl') return 'theme-girl';
    return 'theme-guest';
  }

  function getEndAt() {
    return Number(localStorage.getItem(STORAGE_KEY) || 0);
  }

  function getRemainingMs() {
    return Math.max(0, getEndAt() - Date.now());
  }

  function formatTime(ms) {
    const total = Math.ceil(ms / 1000);
    const m = Math.floor(total / 60);
    const s = total % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  }

  function showLocalNotification(title, body) {
    const icon =
      window.Branding?.getAssets?.(localStorage.getItem('userGender'))?.logoImg ||
      cfg().NOTIFICATION_ICON ||
      cfg().APP_LOGO ||
      '/images/logo/yellow-favicon-96x96.png';
    if (Notification.permission === 'granted') {
      if (navigator.serviceWorker?.ready) {
        navigator.serviceWorker.ready.then((reg) =>
          reg.showNotification(title, { body, icon, badge: icon, tag: 'session-timer-done' })
        );
        return;
      }
      new Notification(title, { body, icon });
    }
  }

  function ensureWidget() {
    let el = document.getElementById('pwa-session-timer');
    if (el) return el;

    el = document.createElement('div');
    el.id = 'pwa-session-timer';
    el.className = `pwa-session-timer ${getGenderTheme()}`;
    el.innerHTML = `
      <div class="pwa-session-timer__title">Session time left</div>
      <div class="pwa-session-timer__time" id="pwa-session-timer-time">40:00</div>
      <div class="pwa-session-timer__bar"><span id="pwa-session-timer-bar"></span></div>
    `;
    document.body.appendChild(el);
    return el;
  }

  function hideWidget() {
    document.getElementById('pwa-session-timer')?.remove();
  }

  let tickTimer = null;

  function tick() {
    const remaining = getRemainingMs();
    const total = durationMs();
    const widget = document.getElementById('pwa-session-timer');
    const timeEl = document.getElementById('pwa-session-timer-time');
    const barEl = document.getElementById('pwa-session-timer-bar');

    if (!remaining) {
      hideWidget();
      if (tickTimer) clearInterval(tickTimer);
      tickTimer = null;
      showLocalNotification('Session complete', 'Great job! Your 40-minute session has finished.');
      localStorage.removeItem(STORAGE_KEY);
      return;
    }

    if (!widget) ensureWidget();
    if (widget) widget.className = `pwa-session-timer ${getGenderTheme()}`;
    if (timeEl) timeEl.textContent = formatTime(remaining);
    if (barEl) barEl.style.width = `${Math.max(0, Math.min(100, (remaining / total) * 100))}%`;
  }

  function startSession() {
    localStorage.setItem(STORAGE_KEY, String(Date.now() + durationMs()));
    ensureWidget();
    tick();
    if (!tickTimer) tickTimer = setInterval(tick, 1000);
  }

  function init() {
    const remaining = getRemainingMs();
    if (!remaining) {
      hideWidget();
      return;
    }
    ensureWidget();
    tick();
    if (!tickTimer) tickTimer = setInterval(tick, 1000);
  }

  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') tick();
  });

  window.SessionTimer = {
    startSession,
    getRemainingMs,
    isActive: () => getRemainingMs() > 0,
    init
  };

  document.addEventListener('DOMContentLoaded', () => {
    init();
    window.SupabaseApp?.onAuthStateChange?.(() => {
      const widget = document.getElementById('pwa-session-timer');
      if (widget) widget.className = `pwa-session-timer ${getGenderTheme()}`;
    });
  });
})();
