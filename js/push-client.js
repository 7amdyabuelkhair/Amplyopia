(() => {
  const cfg = () => window.PWA_CONFIG || {};
  const icon = () => cfg().NOTIFICATION_ICON || '/images/boy.png';

  function urlBase64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
    const raw = atob(base64);
    const arr = new Uint8Array(raw.length);
    for (let i = 0; i < raw.length; ++i) arr[i] = raw.charCodeAt(i);
    return arr;
  }

  async function ensurePermission() {
    if (!('Notification' in window)) return false;
    if (Notification.permission === 'granted') return true;
    if (Notification.permission === 'denied') return false;
    const res = await Notification.requestPermission();
    return res === 'granted';
  }

  async function subscribePush() {
    const vapid = cfg().VAPID_PUBLIC_KEY;
    if (!vapid) return { ok: false, reason: 'missing_vapid_key' };
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      return { ok: false, reason: 'unsupported' };
    }

    const allowed = await ensurePermission();
    if (!allowed) return { ok: false, reason: 'permission_denied' };

    const reg = await navigator.serviceWorker.ready;
    let sub = await reg.pushManager.getSubscription();
    if (!sub) {
      sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapid)
      });
    }

    const json = sub.toJSON();
    const session = await window.SupabaseApp?.getSession?.();
    const userId = session?.user?.id;
    if (!userId) return { ok: false, reason: 'not_signed_in' };

    await window.SupabaseApp?.savePushSubscription?.({
      userId,
      endpoint: json.endpoint,
      p256dh: json.keys?.p256dh,
      auth: json.keys?.auth
    });

    return { ok: true };
  }

  async function showInboxNotifications() {
    const session = await window.SupabaseApp?.getSession?.();
    const userId = session?.user?.id;
    if (!userId) return;

    const rows = await window.SupabaseApp?.listPendingNotifications?.(userId);
    if (!rows?.length) return;

    const reg = await navigator.serviceWorker.ready;
    for (const row of rows) {
      const title = row.title || 'Amplyopia';
      const body = row.body || '';
      await reg.showNotification(title, {
        body,
        icon: row.icon || icon(),
        badge: icon(),
        tag: `inbox-${row.id}`,
        data: { url: row.url || '/index.html', notificationId: row.id }
      });
      await window.SupabaseApp?.markNotificationDelivered?.(row.id, userId);
    }
  }

  async function init() {
    try {
      const session = await window.SupabaseApp?.getSession?.();
      if (!session?.user?.id) return;
      await subscribePush().catch(() => {});
      await showInboxNotifications().catch(() => {});
    } catch (_) {}
  }

  document.addEventListener('DOMContentLoaded', () => {
    setTimeout(init, 1200);
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') showInboxNotifications().catch(() => {});
    });
    window.SupabaseApp?.onAuthStateChange?.(() => init());
  });

  window.PushClient = { subscribePush, showInboxNotifications, ensurePermission };
})();
