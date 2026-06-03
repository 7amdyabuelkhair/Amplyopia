(() => {
  const supabaseGlobal = window.supabase;

  function computeAgeFromBirthdate(birthdateStr) {
    if (!birthdateStr) return null;
    const d = new Date(birthdateStr);
    if (Number.isNaN(d.getTime())) return null;
    const now = new Date();
    let age = now.getFullYear() - d.getFullYear();
    const m = now.getMonth() - d.getMonth();
    if (m < 0 || (m === 0 && now.getDate() < d.getDate())) age--;
    return age >= 0 ? age : null;
  }

  function readConfig() {
    let url = window.SUPABASE_URL || '';
    let anonKey = window.SUPABASE_ANON_KEY || '';
    try {
      if (!url) url = localStorage.getItem('SUPABASE_URL') || '';
      if (!anonKey) anonKey = localStorage.getItem('SUPABASE_ANON_KEY') || '';
    } catch (_) {}
    return { url, anonKey };
  }

  /** Edge Tracking Prevention can block storage; fall back to sessionStorage then memory. */
  function createAuthStorage() {
    const memoryStore = Object.create(null);
    const memory = {
      getItem(key) {
        return Object.prototype.hasOwnProperty.call(memoryStore, key) ? memoryStore[key] : null;
      },
      setItem(key, value) {
        memoryStore[key] = String(value);
      },
      removeItem(key) {
        delete memoryStore[key];
      }
    };

    function wrap(store) {
      return {
        getItem(key) {
          try {
            return store.getItem(key);
          } catch (_) {
            return memory.getItem(key);
          }
        },
        setItem(key, value) {
          try {
            store.setItem(key, String(value));
          } catch (_) {
            memory.setItem(key, value);
          }
        },
        removeItem(key) {
          try {
            store.removeItem(key);
          } catch (_) {
            memory.removeItem(key);
          }
        }
      };
    }

    for (const store of [window.localStorage, window.sessionStorage]) {
      if (!store) continue;
      try {
        const probe = '__amplyopia_storage_probe__';
        store.setItem(probe, '1');
        store.removeItem(probe);
        return wrap(store);
      } catch (_) {}
    }
    return memory;
  }

  function withTimeout(promise, ms, label) {
    return Promise.race([
      promise,
      new Promise((_, reject) => {
        setTimeout(() => reject(new Error(`${label} timed out. Check your connection and reload.`)), ms);
      })
    ]);
  }

  function createClient() {
    try {
      if (!supabaseGlobal?.createClient) return null;
      const { url, anonKey } = readConfig();
      if (!url || !anonKey) return null;
      return supabaseGlobal.createClient(url, anonKey, {
        auth: {
          storage: createAuthStorage(),
          storageKey: 'amplyopia-auth-session',
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: false,
          flowType: 'pkce'
        }
      });
    } catch (e) {
      console.warn('Supabase init failed:', e);
      return null;
    }
  }

  const client = createClient();

  /** Path to index.html (works on amplyopia.com and GitHub Pages /Amplyopia/) */
  function getAppIndexPath() {
    const pathname = window.location.pathname || '/';
    if (/index\.html?$/i.test(pathname)) return pathname;
    const base = pathname.endsWith('/') ? pathname : `${pathname}/`;
    return `${base}index.html`;
  }

  /** Choose Service page — Google OAuth should redirect here */
  function getServicesPath() {
    return getAppIndexPath().replace(/index\.html?$/i, 'services.html');
  }

  /** Child profile setup page */
  function getProfileSetupPath() {
    return getAppIndexPath().replace(/index\.html?$/i, 'profile-setup.html');
  }

  function getAuthRedirectUrl() {
    return `${window.location.origin}${getServicesPath()}`;
  }

  function listAuthRedirectUrls() {
    const primary = getAuthRedirectUrl();
    const origin = window.location.origin;
    const indexPath = getAppIndexPath();
    const servicesPath = getServicesPath();
    const profileSetupPath = getProfileSetupPath();
    const extras = [
      `${origin}/`,
      `${origin}/index.html`,
      `${origin}${indexPath}`,
      `${origin}${servicesPath}`,
      `${origin}${profileSetupPath}`,
      `${origin}/Amplyopia/`,
      `${origin}/Amplyopia/index.html`,
      `${origin}/Amplyopia/services.html`
    ];
    return [...new Set([primary, ...extras])];
  }

  function formatAuthError(error) {
    if (!error) return 'Authentication failed.';
    const msg = String(error.message || error.msg || '').toLowerCase();
    const status = Number(error.status || error.code || 0);

    if (msg.includes('invalid login') || msg.includes('invalid credentials')) {
      return 'Wrong email or password. If you signed up with Google, use Continue with Google instead.';
    }
    if (msg.includes('email not confirmed')) {
      return 'Please confirm your email using the link we sent, then sign in again.';
    }
    if (
      msg.includes('user already registered') ||
      msg.includes('already been registered') ||
      msg.includes('already exists')
    ) {
      return 'This email already has an account. Use Sign in instead of Sign up.';
    }
    if (msg.includes('password') && (msg.includes('short') || msg.includes('least') || msg.includes('weak'))) {
      return 'Password must be at least 6 characters.';
    }
    if (msg.includes('redirect') || msg.includes('email redirect') || msg.includes('invalid url')) {
      return (
        'Sign up failed: redirect URL not allowed in Supabase. Add this URL under Authentication → Redirect URLs: ' +
        getAuthRedirectUrl()
      );
    }
    if (status === 429 || msg.includes('rate limit') || msg.includes('too many')) {
      return 'Too many attempts. Please wait a minute and try again.';
    }
    if (status === 422 || msg.includes('unable to validate')) {
      return 'Please enter a valid email address.';
    }
    return error.message || 'Authentication failed.';
  }

  function cleanAuthParamsFromUrl() {
    const pathname = window.location.pathname || getServicesPath();
    window.history.replaceState({}, document.title, pathname);
  }

  /** Complete Google OAuth (PKCE) when the page loads with ?code=... */
  async function finishAuthRedirect() {
    if (!client) return { session: null, error: null };
    const params = new URLSearchParams(window.location.search);
    const oauthError = params.get('error');
    const code = params.get('code');
    if (!oauthError && !code) return { session: null, error: null };

    if (oauthError) {
      const desc = params.get('error_description') || oauthError;
      cleanAuthParamsFromUrl();
      return { session: null, error: new Error(desc) };
    }

    const { data, error } = await withTimeout(
      client.auth.exchangeCodeForSession(code),
      20000,
      'Google sign-in'
    );
    cleanAuthParamsFromUrl();

    if (error || !data?.session) {
      const detail = error?.message ? ` (${error.message})` : '';
      const storageHint =
        ' If you use Microsoft Edge, turn off Tracking Prevention for amplyopia.com or allow site storage, then sign in again from a fresh page (without ?code= in the URL).';
      return {
        session: null,
        error: new Error(
          'Google sign-in could not be completed' +
            detail +
            storageHint +
            ' In Supabase → Authentication → URL configuration, add ALL of these Redirect URLs: ' +
            listAuthRedirectUrls().join(' , ')
        )
      };
    }
    return { session: data.session, error: null, fromOAuth: true };
  }

  async function getSession() {
    if (!client) return null;
    try {
      const { data, error } = await withTimeout(client.auth.getSession(), 12000, 'Session load');
      if (error) return null;
      if (data?.session) return data.session;

      const refreshed = await withTimeout(client.auth.refreshSession(), 12000, 'Session refresh');
      if (refreshed?.error) return null;
      return refreshed?.data?.session || null;
    } catch (e) {
      console.warn('getSession failed:', e);
      return null;
    }
  }

  function onAuthStateChange(cb) {
    if (!client) return () => {};
    const { data } = client.auth.onAuthStateChange((event, session) => cb(event, session || null));
    return () => data?.subscription?.unsubscribe?.();
  }

async function signInWithGoogle() {
  if (!client) throw new Error('Supabase is not configured.');

  const redirectTo = getAuthRedirectUrl();
  try {
    sessionStorage.setItem('amplyopia_oauth_return', redirectTo);
    sessionStorage.setItem('amplyopia_expect_profile', '1');
  } catch (_) {}

  const { error } = await client.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo,
      queryParams: { prompt: 'select_account' }
    }
  });

  if (error) throw error;
}

  async function signInWithPassword(email, password) {
    if (!client) throw new Error('Supabase is not configured.');
    const { data, error } = await client.auth.signInWithPassword({ email, password });
    if (error) throw new Error(formatAuthError(error));
    return data.session || null;
  }

  async function signUp(email, password) {
    if (!client) throw new Error('Supabase is not configured.');
    if (!email || !password) throw new Error('Please enter email and password.');
    if (password.length < 6) throw new Error('Password must be at least 6 characters.');

    const redirectTo = getAuthRedirectUrl();
    const { data, error } = await client.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: redirectTo }
    });
    if (error) throw new Error(formatAuthError(error));

    // Supabase may return 200 with empty identities when email already exists (anti-enumeration).
    const identities = data?.user?.identities;
    if (Array.isArray(identities) && identities.length === 0) {
      throw new Error('This email already has an account. Use Sign in instead of Sign up.');
    }

    return {
      session: data.session || null,
      user: data.user || null,
      needsEmailConfirmation: !data.session
    };
  }

  async function signOut() {
    if (!client) return;
    await client.auth.signOut();
  }

  async function getProfile(userId) {
    if (!client) return null;
    const { data, error } = await client
      .from('profiles')
      .select('id,name,gender,birthdate,age,updated_at')
      .eq('id', userId)
      .maybeSingle();
    if (error) throw error;
    return data || null;
  }

  async function upsertProfile({ id, name, gender, birthdate }) {
    if (!client) throw new Error('Supabase is not configured.');
    // Backward-compatible: if an older DB schema still has age NOT NULL,
    // include computed age to avoid insert/update failures.
    const computedAge = computeAgeFromBirthdate(birthdate);
    const payload = {
      id,
      name,
      gender,
      birthdate,
      ...(typeof computedAge === 'number' ? { age: computedAge } : {}),
      updated_at: new Date().toISOString()
    };
    const { data, error } = await client
      .from('profiles')
      .upsert(payload, { onConflict: 'id' })
      .select('id,name,gender,birthdate,age')
      .single();
    if (error) throw error;
    return data;
  }

  async function getTermsConsent(userId) {
    if (!client) return null;
    if (!userId) return null;
    const { data, error } = await client
      .from('user_terms_consents')
      .select('user_id,accepted_terms,accepted_at')
      .eq('user_id', userId)
      .maybeSingle();
    if (error) throw error;
    return data || null;
  }

  async function saveTermsConsent({ userId, acceptedAt }) {
    if (!client) throw new Error('Supabase is not configured.');
    if (!userId) throw new Error('User id is required.');
    const timestamp = acceptedAt || new Date().toISOString();

    const payload = {
      user_id: userId,
      accepted_terms: true,
      accepted_at: timestamp
    };

    const { data, error } = await client
      .from('user_terms_consents')
      .upsert(payload, { onConflict: 'user_id' })
      .select('user_id,accepted_terms,accepted_at')
      .single();
    if (error) throw error;
    return data;
  }

  async function addScoreEvent({ game_id, points, meta }) {
    if (!client) return { ok: false, reason: 'supabase_not_configured' };
    const session = await getSession();
    const userId = session?.user?.id;
    if (!userId) return { ok: false, reason: 'not_signed_in' };
    const { error } = await client.from('scores').insert({
      user_id: userId,
      game_id,
      points,
      meta: meta || null
    });
    if (error) throw error;
    return { ok: true };
  }

  async function getTotalScore() {
    if (!client) return null;
    const session = await getSession();
    const userId = session?.user?.id;
    if (!userId) return null;
    const { data, error } = await client
      .from('scores')
      .select('points')
      .eq('user_id', userId);
    if (error) throw error;
    return (data || []).reduce((sum, row) => sum + (Number(row.points) || 0), 0);
  }

  async function listScores() {
    if (!client) return [];
    const session = await getSession();
    const userId = session?.user?.id;
    if (!userId) return [];
    const { data, error } = await client
      .from('scores')
      .select('game_id,points,meta,created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: true });
    if (error) throw error;
    return data || [];
  }

  async function isAdminUser() {
    const session = await getSession();
    const userId = session?.user?.id;
    if (!userId) return false;

    const { data, error } = await client
      .from('profiles')
      .select('is_admin')
      .eq('id', userId)
      .maybeSingle();
    if (error) return false;
    return data?.is_admin === true;
  }

  async function listAllProfilesForAdmin() {
    if (!client) throw new Error('Supabase is not configured.');
    const ok = await isAdminUser();
    if (!ok) throw new Error('Admin access required.');

    const { data, error } = await client
      .from('profiles')
      .select('id,name,gender,birthdate,created_at')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
  }

  async function savePushSubscription({ userId, endpoint, p256dh, auth }) {
    if (!client) throw new Error('Supabase is not configured.');
    const payload = {
      user_id: userId,
      endpoint,
      p256dh,
      auth_key: auth,
      updated_at: new Date().toISOString()
    };
    const { error } = await client
      .from('push_subscriptions')
      .upsert(payload, { onConflict: 'endpoint' });
    if (error) throw error;
    return { ok: true };
  }

  async function listPendingNotifications(userId) {
    if (!client) return [];
    const { data, error } = await client
      .from('notification_targets')
      .select('id,notification_id,title,body,icon,url,delivered_at')
      .eq('user_id', userId)
      .is('delivered_at', null)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
  }

  async function markNotificationDelivered(targetId, userId) {
    if (!client) return;
    await client
      .from('notification_targets')
      .update({ delivered_at: new Date().toISOString() })
      .eq('id', targetId)
      .eq('user_id', userId);
  }

  async function createAdminNotification({ title, body, icon, url, userIds }) {
    if (!client) throw new Error('Supabase is not configured.');
    const ok = await isAdminUser();
    if (!ok) throw new Error('Admin access required.');

    const session = await getSession();
    const createdBy = session?.user?.id;
    const { data: msg, error: msgErr } = await client
      .from('notification_messages')
      .insert({
        title,
        body,
        icon: icon || null,
        url: url || '/index.html',
        created_by: createdBy
      })
      .select('id')
      .single();
    if (msgErr) throw msgErr;

    const targets = (userIds || []).map((uid) => ({
      notification_id: msg.id,
      user_id: uid,
      title,
      body,
      icon: icon || null,
      url: url || '/index.html'
    }));
    if (!targets.length) throw new Error('Select at least one user.');

    const { error: targetErr } = await client.from('notification_targets').insert(targets);
    if (targetErr) throw targetErr;
    return { ok: true, notificationId: msg.id, sentCount: targets.length };
  }

  window.SupabaseApp = {
    client,
    configured: !!client,
    readConfig,
    getAppIndexPath,
    getServicesPath,
    getProfileSetupPath,
    getAuthRedirectUrl,
    listAuthRedirectUrls,
    finishAuthRedirect,
    getSession,
    onAuthStateChange,
    signInWithGoogle,
    signInWithPassword,
    signUp,
    signOut,
    getProfile,
    upsertProfile,
    getTermsConsent,
    saveTermsConsent,
    addScoreEvent,
    getTotalScore,
    listScores,
    isAdminUser,
    listAllProfilesForAdmin,
    savePushSubscription,
    listPendingNotifications,
    markNotificationDelivered,
    createAdminNotification
  };
})();

