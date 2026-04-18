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
    const url = window.SUPABASE_URL || localStorage.getItem('SUPABASE_URL') || '';
    const anonKey = window.SUPABASE_ANON_KEY || localStorage.getItem('SUPABASE_ANON_KEY') || '';
    return { url, anonKey };
  }

  function createClient() {
    try {
      if (!supabaseGlobal?.createClient) return null;
      const { url, anonKey } = readConfig();
      if (!url || !anonKey) return null;
      return supabaseGlobal.createClient(url, anonKey, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true
        }
      });
    } catch (e) {
      console.warn('Supabase init failed:', e);
      return null;
    }
  }

  const client = createClient();

  async function getSession() {
    if (!client) return null;
    const { data } = await client.auth.getSession();
    return data?.session || null;
  }

  function onAuthStateChange(cb) {
    if (!client) return () => {};
    const { data } = client.auth.onAuthStateChange((_event, session) => cb(session || null));
    return () => data?.subscription?.unsubscribe?.();
  }

async function signInWithGoogle() {
  if (!client) throw new Error('Supabase is not configured.');

  // Must point to an existing static page on GitHub Pages.
  const redirectTo = `${window.location.origin}/index.html`;

  const { error } = await client.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo,
    },
  });

  if (error) throw error;
}

  async function signInWithPassword(email, password) {
    if (!client) throw new Error('Supabase is not configured.');
    const { error } = await client.auth.signInWithPassword({ email, password });
    if (error) throw error;
  }

  async function signUp(email, password) {
    if (!client) throw new Error('Supabase is not configured.');
    const redirectTo = `${window.location.origin}${window.location.pathname}`;
    const { error } = await client.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: redirectTo }
    });
    if (error) throw error;
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

  window.SupabaseApp = {
    client,
    configured: !!client,
    readConfig,
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
    listScores
  };
})();

