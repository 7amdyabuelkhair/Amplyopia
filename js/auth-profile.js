/** Shared child-profile checks and cache (used by sign-in, profile-setup, services pages). */
(() => {
  function profileIsComplete(profile) {
    const name = profile?.name && String(profile.name).trim();
    const gender = profile?.gender;
    const birthdate = profile?.birthdate && String(profile.birthdate).trim();
    const validGender = gender === 'boy' || gender === 'girl';
    const age = window.Profile?.computeAgeFromBirthdate?.(birthdate);
    const validAge = typeof age === 'number' && age >= 0 && age <= 120;
    return !!(name && validGender && birthdate && validAge);
  }

  function cacheProfile(profile) {
    if (!profile || !profileIsComplete(profile)) return;
    try {
      if (profile.name) localStorage.setItem('userName', String(profile.name));
      if (profile.gender) localStorage.setItem('userGender', String(profile.gender));
      if (profile.birthdate) localStorage.setItem('userBirthdate', String(profile.birthdate));
      const age = window.Profile?.computeAgeFromBirthdate?.(profile.birthdate);
      if (typeof age === 'number') localStorage.setItem('userAge', String(age));
    } catch (_) {}
  }

  function clearLocalProfileCache() {
    try {
      localStorage.removeItem('userName');
      localStorage.removeItem('userGender');
      localStorage.removeItem('userBirthdate');
      localStorage.removeItem('userAge');
    } catch (_) {}
  }

  window.AuthProfile = { profileIsComplete, cacheProfile, clearLocalProfileCache };
})();
