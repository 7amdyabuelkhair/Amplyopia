document.addEventListener('DOMContentLoaded', () => {
  const errEl = document.getElementById('admin-error');
  const okEl = document.getElementById('admin-success');
  const authPanel = document.getElementById('admin-auth-panel');
  const panel = document.getElementById('admin-panel');
  const loginForm = document.getElementById('admin-login-form');
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
    const isAdmin = await requireAdmin();
    authPanel?.classList.toggle('hidden', isAdmin);
    panel?.classList.toggle('hidden', !isAdmin);
    if (isAdmin) await loadUsers();
    if (!isAdmin && (await window.SupabaseApp?.getSession?.())?.user?.id) {
      setMsg(errEl, 'This account is not an admin.');
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

  loginForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    setMsg(errEl, '');
    setMsg(okEl, '');
    try {
      const email = document.getElementById('admin-email')?.value?.trim();
      const password = document.getElementById('admin-password')?.value || '';
      await window.SupabaseApp?.signInWithPassword?.(email, password);
      await showPanelIfAdmin();
    } catch (error) {
      setMsg(errEl, error?.message || 'Admin sign in failed.');
    }
  });

  document.getElementById('admin-signout-btn')?.addEventListener('click', async () => {
    await window.SupabaseApp?.signOut?.();
    authPanel?.classList.remove('hidden');
    panel?.classList.add('hidden');
    setMsg(okEl, '');
    setMsg(errEl, '');
  });

  document.getElementById('admin-refresh-btn')?.addEventListener('click', () => loadUsers().catch((e) => setMsg(errEl, e?.message || 'Failed to load users.')));

  document.getElementById('admin-select-all')?.addEventListener('click', () => {
    usersList?.querySelectorAll('input[name="recipient"]').forEach((el) => { el.checked = true; });
  });
  document.getElementById('admin-select-none')?.addEventListener('click', () => {
    usersList?.querySelectorAll('input[name="recipient"]').forEach((el) => { el.checked = false; });
  });

  notifyForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    setMsg(errEl, '');
    setMsg(okEl, '');
    try {
      const title = document.getElementById('notify-title')?.value?.trim();
      const body = document.getElementById('notify-body')?.value?.trim();
      const url = document.getElementById('notify-url')?.value?.trim() || '/index.html';
      const userIds = Array.from(usersList?.querySelectorAll('input[name="recipient"]:checked') || []).map((el) => el.value);
      const result = await window.SupabaseApp?.createAdminNotification?.({
        title,
        body,
        icon: window.PWA_CONFIG?.NOTIFICATION_ICON || '/images/boy.png',
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
