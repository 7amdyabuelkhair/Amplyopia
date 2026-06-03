(() => {
  const cfg = () => window.LOCAL_NOTIFY_CONFIG || {};
  const statusEl = document.getElementById('status');
  const setupBox = document.getElementById('setup-box');
  const usersEl = document.getElementById('users');
  const form = document.getElementById('notify-form');

  let users = [];

  function setStatus(text, type) {
    if (!statusEl) return;
    statusEl.textContent = text || '';
    statusEl.className = 'msg' + (type ? ` ${type}` : '');
  }

  function getClient() {
    const url = cfg().SUPABASE_URL || '';
    const key = cfg().SUPABASE_SERVICE_ROLE_KEY || '';
    if (!url || !key || key.includes('YOUR_')) return null;
    return window.supabase.createClient(url, key, {
      auth: { persistSession: false, autoRefreshToken: false }
    });
  }

  function showSetup() {
    setupBox?.classList.remove('hidden');
    form?.classList.add('hidden');
  }

  async function loadUsers() {
    const client = getClient();
    if (!client) {
      showSetup();
      setStatus('Missing local-config.js', 'error');
      return;
    }

    setupBox?.classList.add('hidden');
    form?.classList.remove('hidden');
    setStatus('Loading users…');

    try {
      const profileMap = new Map();
      const { data: profiles, error: profileErr } = await client
        .from('profiles')
        .select('id,name,gender,birthdate,created_at')
        .order('created_at', { ascending: false });
      if (profileErr) throw profileErr;
      (profiles || []).forEach((p) => profileMap.set(p.id, p));

      const merged = [];
      let page = 1;
      const perPage = 200;
      while (true) {
        const { data, error } = await client.auth.admin.listUsers({ page, perPage });
        if (error) throw error;
        const batch = data?.users || [];
        batch.forEach((u) => {
          const p = profileMap.get(u.id);
          merged.push({
            id: u.id,
            email: u.email || '',
            name: p?.name || 'No profile',
            gender: p?.gender || '-'
          });
        });
        if (batch.length < perPage) break;
        page += 1;
      }

      users = merged.sort((a, b) => a.name.localeCompare(b.name));
      renderUsers();
      setStatus(`${users.length} user(s) loaded.`, 'ok');
    } catch (e) {
      setStatus(e?.message || 'Failed to load users.', 'error');
      if (usersEl) {
        usersEl.innerHTML = '<p class="sub">Check service role key and that pwa-schema.sql was run.</p>';
      }
    }
  }

  function renderUsers() {
    if (!usersEl) return;
    if (!users.length) {
      usersEl.innerHTML = '<p class="sub">No users found in Supabase Auth.</p>';
      return;
    }
    usersEl.innerHTML = users
      .map(
        (u) => `
      <label class="user-row">
        <input type="checkbox" name="uid" value="${u.id}">
        <span class="user-meta">
          <b>${escapeHtml(u.name)} (${escapeHtml(u.gender)})</b>
          <span>${escapeHtml(u.email)}</span>
        </span>
      </label>
    `
      )
      .join('');
  }

  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  async function sendNotification(e) {
    e.preventDefault();
    const client = getClient();
    if (!client) {
      showSetup();
      return;
    }

    const title = document.getElementById('title')?.value?.trim();
    const body = document.getElementById('body')?.value?.trim();
    const url = document.getElementById('url')?.value?.trim() || '/index.html';
    const icon = '/images/logo/yellow-favicon-96x96.png';
    const userIds = Array.from(usersEl?.querySelectorAll('input[name="uid"]:checked') || []).map(
      (el) => el.value
    );

    if (!title || !body) {
      setStatus('Enter title and message.', 'error');
      return;
    }
    if (!userIds.length) {
      setStatus('Select at least one user.', 'error');
      return;
    }

    const btn = document.getElementById('btn-send');
    if (btn) btn.disabled = true;
    setStatus('Sending…');

    try {
      const { data: msg, error: msgErr } = await client
        .from('notification_messages')
        .insert({ title, body, icon, url, created_by: null })
        .select('id')
        .single();
      if (msgErr) throw msgErr;

      const targets = userIds.map((uid) => ({
        notification_id: msg.id,
        user_id: uid,
        title,
        body,
        icon,
        url
      }));

      const { error: targetErr } = await client.from('notification_targets').insert(targets);
      if (targetErr) throw targetErr;

      setStatus(`Sent to ${userIds.length} user(s). They will see it in the app when opened.`, 'ok');
      usersEl?.querySelectorAll('input[name="uid"]').forEach((el) => {
        el.checked = false;
      });
    } catch (err) {
      setStatus(err?.message || 'Send failed.', 'error');
    } finally {
      if (btn) btn.disabled = false;
    }
  }

  document.getElementById('btn-all')?.addEventListener('click', () => {
    usersEl?.querySelectorAll('input[name="uid"]').forEach((el) => {
      el.checked = true;
    });
  });
  document.getElementById('btn-none')?.addEventListener('click', () => {
    usersEl?.querySelectorAll('input[name="uid"]').forEach((el) => {
      el.checked = false;
    });
  });
  document.getElementById('btn-reload')?.addEventListener('click', () => loadUsers());
  form?.addEventListener('submit', sendNotification);

  if (!getClient()) showSetup();
  else loadUsers();
})();
