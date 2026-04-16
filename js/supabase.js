(() => {
  const supabaseGlobal = window.supabase;

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
    const redirectTo = `${window.location.origin}${window.location.pathname}`;
    const { error } = await client.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo }
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
      .select('id,name,gender,birthdate,updated_at')
      .eq('id', userId)
      .maybeSingle();
    if (error) throw error;
    return data || null;
  }

  async function upsertProfile({ id, name, gender, birthdate }) {
    if (!client) throw new Error('Supabase is not configured.');
    const payload = { id, name, gender, birthdate, updated_at: new Date().toISOString() };
    const { data, error } = await client
      .from('profiles')
      .upsert(payload, { onConflict: 'id' })
      .select('id,name,gender,birthdate')
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
    addScoreEvent,
    getTotalScore
  };
})();

