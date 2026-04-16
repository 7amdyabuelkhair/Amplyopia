(() => {
  const LOCAL_KEY = 'amplyopiaScoreEvents';

  function readLocalEvents() {
    try {
      const raw = localStorage.getItem(LOCAL_KEY) || '[]';
      const arr = JSON.parse(raw);
      return Array.isArray(arr) ? arr : [];
    } catch (_) {
      return [];
    }
  }

  function writeLocalEvents(events) {
    try {
      localStorage.setItem(LOCAL_KEY, JSON.stringify(events));
    } catch (_) {}
  }

  async function addPoints({ game_id, points, meta }) {
    const event = {
      game_id: String(game_id || 'unknown'),
      points: Number(points) || 0,
      meta: meta || null,
      when: new Date().toISOString()
    };

    const local = readLocalEvents();
    local.push(event);
    writeLocalEvents(local);

    try {
      if (window.SupabaseApp?.addScoreEvent) {
        await window.SupabaseApp.addScoreEvent({
          game_id: event.game_id,
          points: event.points,
          meta: event.meta
        });
      }
    } catch (e) {
      // Keep local fallback silently; Supabase might not be configured or user not signed-in.
      console.warn('Score sync failed:', e?.message || e);
    }

    return event;
  }

  function getLocalTotal() {
    return readLocalEvents().reduce((sum, e) => sum + (Number(e.points) || 0), 0);
  }

  window.Score = {
    addPoints,
    getLocalTotal
  };
})();

