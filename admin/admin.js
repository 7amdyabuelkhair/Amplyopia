document.addEventListener('DOMContentLoaded', () => {
  const errEl = document.getElementById('admin-error');
  const okEl = document.getElementById('admin-success');
  const authPanel = document.getElementById('admin-auth-panel');
  const panel = document.getElementById('admin-panel');
  const notifyForm = document.getElementById('admin-notify-form');
  const usersList = document.getElementById('admin-users-list');

  let profiles = [];

  function setMsg(el, text) {
    if (el) el.textContent = text || '';
  }

  async function requireAdmin() {
    const session = await window.SupabaseApp?.getSession?.();
    if (!session?.user?.id) return false;
    return window.SupabaseApp?.isAdminUser?.();
  }

  async function showPanelIfAdmin() {
    setMsg(okEl, '');
    const session = await window.SupabaseApp?.getSession?.();
    const isAdmin = await requireAdmin();

    if (isAdmin) {
      authPanel?.classList.add('hidden');
      panel?.classList.remove('hidden');
      setMsg(errEl, '');
      await loadUsers();
      return;
    }

    panel?.classList.add('hidden');
    authPanel?.classList.remove('hidden');

    if (session?.user?.id) {
      setMsg(
        errEl,
        'This account cannot use Admin. Sign in with an authorized admin email from Choose Service on the home page.'
      );
    } else {
      setMsg(errEl, 'Please sign in on the home page first, then open Admin from Choose Service.');
    }
  }

  function renderUsers() {
    if (!usersList) return;
    usersList.innerHTML = profiles
      .map((p) => {
        const label = `${p.name || 'Unknown'} (${p.gender || '-'})`;
        return `
          <label class="admin-user-row">
            <input type="checkbox" name="recipient" value="${p.id}">
            <span class="admin-user-meta">
              <b>${label}</b>
              <span>${p.id}</span>
            </span>
          </label>
        `;
      })
      .join('');
  }

  async function loadUsers() {
    setMsg(errEl, '');
    profiles = await window.SupabaseApp?.listAllProfilesForAdmin?.();
    renderUsers();
  }

  document.getElementById('admin-back-btn')?.addEventListener('click', () => {
    window.location.href = '../index.html#services';
  });

  document.getElementById('admin-refresh-btn')?.addEventListener('click', () =>
    loadUsers().catch((e) => setMsg(errEl, e?.message || 'Failed to load users.'))
  );

  document.getElementById('admin-select-all')?.addEventListener('click', () => {
    usersList?.querySelectorAll('input[name="recipient"]').forEach((el) => {
      el.checked = true;
    });
  });
  document.getElementById('admin-select-none')?.addEventListener('click', () => {
    usersList?.querySelectorAll('input[name="recipient"]').forEach((el) => {
      el.checked = false;
    });
  });

  notifyForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    setMsg(errEl, '');
    setMsg(okEl, '');
    try {
      const title = document.getElementById('notify-title')?.value?.trim();
      const body = document.getElementById('notify-body')?.value?.trim();
      const url = document.getElementById('notify-url')?.value?.trim() || '/index.html';
      const userIds = Array.from(usersList?.querySelectorAll('input[name="recipient"]:checked') || []).map(
        (el) => el.value
      );
      const result = await window.SupabaseApp?.createAdminNotification?.({
        title,
        body,
        icon: window.PWA_CONFIG?.NOTIFICATION_ICON || '/images/logo/yellow-favicon-96x96.png',
        url,
        userIds
      });
      setMsg(okEl, `Notification queued for ${result.sentCount} user(s).`);
    } catch (error) {
      setMsg(errEl, error?.message || 'Failed to send notification.');
    }
  });

  showPanelIfAdmin();
  window.SupabaseApp?.onAuthStateChange?.(() => showPanelIfAdmin());
});
