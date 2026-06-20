(() => {
  const REMINDER_MS = 30 * 60 * 1000;
  const STORAGE_LEVEL = 'amplyopia_level_reminder_level';
  const STORAGE_STARTED = 'amplyopia_level_reminder_started_at';
  const STORAGE_FIRED = 'amplyopia_level_reminder_fired';

  const LEVEL_NAMES = [
    'Level 1',
    'Level 2',
    'Level 3',
    'Level 4',
    'Level 5',
    'Level 6 (Red–Blue)'
  ];

  let timeoutId = null;
  let getCurrentLevel = () => -1;
  let onGoToNextLevel = null;

  function readLevel() {
    const n = Number(localStorage.getItem(STORAGE_LEVEL));
    return Number.isFinite(n) ? n : -1;
  }

  function readStartedAt() {
    const n = Number(localStorage.getItem(STORAGE_STARTED));
    return Number.isFinite(n) ? n : 0;
  }

  function isFired() {
    return localStorage.getItem(STORAGE_FIRED) === '1';
  }

  function remainingMs() {
    const started = readStartedAt();
    if (!started) return 0;
    return Math.max(0, started + REMINDER_MS - Date.now());
  }

  function clearTimer() {
    if (timeoutId) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }
  }

  function clearStorage() {
    localStorage.removeItem(STORAGE_LEVEL);
    localStorage.removeItem(STORAGE_STARTED);
    localStorage.removeItem(STORAGE_FIRED);
  }

  function hideModal() {
    const modal = document.getElementById('level-reminder-modal');
    if (!modal) return;
    modal.classList.remove('is-open');
    setTimeout(() => modal.classList.add('hidden'), 380);
  }

  function showModal(levelIndex) {
    const modal = document.getElementById('level-reminder-modal');
    const titleEl = document.getElementById('level-reminder-title');
    const msgEl = document.getElementById('level-reminder-msg');
    const nextBtn = document.getElementById('level-reminder-next');
    const dismissBtn = document.getElementById('level-reminder-dismiss');
    if (!modal || !titleEl || !msgEl || !dismissBtn) return;

    const levelName = LEVEL_NAMES[levelIndex] || `Level ${levelIndex + 1}`;
    const isLastLevel = levelIndex >= LEVEL_NAMES.length - 1;

    titleEl.textContent = isLastLevel
      ? 'Keep up the great work!'
      : 'Ready for your next step?';

    msgEl.textContent = isLastLevel
      ? `You've been training on ${levelName} for a while — that's dedication! Put on your red/blue glasses and keep going, or take a short break and jump back in when you're ready.`
      : `You've been working on ${levelName} for 30 minutes — nice focus! When you're ready, continue to the next level to keep your therapy session moving forward.`;

    if (nextBtn) {
      nextBtn.classList.toggle('hidden', isLastLevel);
      nextBtn.textContent = isLastLevel ? '' : 'Go to next level';
      nextBtn.onclick = () => {
        hideModal();
        if (typeof onGoToNextLevel === 'function') onGoToNextLevel(levelIndex);
      };
    }

    dismissBtn.onclick = () => hideModal();

    modal.classList.remove('hidden');
    requestAnimationFrame(() => {
      requestAnimationFrame(() => modal.classList.add('is-open'));
    });
  }

  function fireIfDue() {
    const level = readLevel();
    const started = readStartedAt();
    if (level < 0 || !started || isFired()) return;

    if (remainingMs() > 0) {
      scheduleTimeout(remainingMs());
      return;
    }

    const current = getCurrentLevel();
    if (current > level) {
      clear();
      return;
    }

    localStorage.setItem(STORAGE_FIRED, '1');
    clearTimer();
    showModal(level);
  }

  function scheduleTimeout(ms) {
    clearTimer();
    if (ms <= 0) {
      fireIfDue();
      return;
    }
    timeoutId = setTimeout(fireIfDue, ms);
  }

  function schedule(levelIndex) {
    if (levelIndex < 0 || levelIndex >= LEVEL_NAMES.length) return;

    clearTimer();
    localStorage.setItem(STORAGE_LEVEL, String(levelIndex));
    localStorage.setItem(STORAGE_STARTED, String(Date.now()));
    localStorage.removeItem(STORAGE_FIRED);
    scheduleTimeout(REMINDER_MS);
  }

  function clear() {
    clearTimer();
    clearStorage();
    hideModal();
  }

  function onLevelStarted(levelIndex) {
    schedule(levelIndex);
  }

  function onLevelAdvanced(fromLevel, toLevel) {
    if (toLevel > fromLevel) clear();
    else if (toLevel !== fromLevel) schedule(toLevel);
  }

  function init(options = {}) {
    if (typeof options.getCurrentLevel === 'function') getCurrentLevel = options.getCurrentLevel;
    if (typeof options.onGoToNextLevel === 'function') onGoToNextLevel = options.onGoToNextLevel;

    const modal = document.getElementById('level-reminder-modal');
    modal?.addEventListener('click', (e) => {
      if (e.target === modal) hideModal();
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && modal && !modal.classList.contains('hidden')) hideModal();
    });

    const pending = readLevel();
    if (pending >= 0 && readStartedAt()) fireIfDue();
  }

  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') fireIfDue();
  });

  window.LevelReminder = {
    onLevelStarted,
    onLevelAdvanced,
    clear,
    init,
    schedule,
    fireIfDue
  };
})();
