/**
 * Child profile setup page — required after sign-up or when profile fields are null.
 */
(() => {
  function setLoading(msg, show) {
    const overlay = document.getElementById('auth-loading');
    const text = document.getElementById('auth-loading-text');
    if (text && msg) text.textContent = msg;
    if (show) {
      overlay?.classList.remove('hidden');
      document.body.classList.add('auth-loading-active');
    } else {
      overlay?.classList.add('hidden');
      document.body.classList.remove('auth-loading-active');
    }
  }

  function servicesUrl() {
    return (
      window.SupabaseApp?.getServicesUrl?.() ||
      new URL('services.html', `${window.location.origin}/`).href
    );
  }

  function fillForm(profile) {
    const profileName = document.getElementById('profile-name');
    const profileBirthdate = document.getElementById('profile-birthdate');
    const profileForm = document.getElementById('profile-form');
    if (!profile) return;
    if (profile.name && profileName) profileName.value = profile.name;
    if (profile.birthdate && profileBirthdate) profileBirthdate.value = String(profile.birthdate);
    if (profile.gender) {
      const radio = profileForm?.querySelector(`input[name="gender"][value="${profile.gender}"]`);
      if (radio) radio.checked = true;
    }
  }

  document.getElementById('nav-signout-btn')?.addEventListener('click', async () => {
    await window.SupabaseApp?.signOut?.();
    window.location.href = 'index.html';
  });

  document.getElementById('auth-signout-btn')?.addEventListener('click', async () => {
    await window.SupabaseApp?.signOut?.();
    window.location.href = 'index.html';
  });

  document.getElementById('profile-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const profileError = document.getElementById('profile-error');
    const profileForm = document.getElementById('profile-form');
    const profileName = document.getElementById('profile-name');
    const profileBirthdate = document.getElementById('profile-birthdate');

    try {
      if (profileError) profileError.textContent = '';
      setLoading('Saving profile…', true);

      const session = await window.SupabaseApp.getSession();
      const uid = session?.user?.id;
      if (!uid) {
        window.location.replace('index.html');
        return;
      }

      const name = (profileName?.value || '').trim();
      const gender = String(
        profileForm?.querySelector('input[name="gender"]:checked')?.value || ''
      ).toLowerCase();
      const birthdate = String(profileBirthdate?.value || '').trim();
      if (!name) throw new Error('Enter the child name.');
      if (gender !== 'boy' && gender !== 'girl') throw new Error('Choose boy or girl.');
      if (!birthdate) throw new Error('Enter the child birthday.');

      const saved = await window.SupabaseApp.upsertProfile({ id: uid, name, gender, birthdate });
      try {
        await window.SupabaseApp.saveTermsConsent({
          userId: uid,
          acceptedAt: new Date().toISOString()
        });
      } catch (_) {}

      window.AuthProfile?.cacheProfile?.(saved);
      window.Profile?.applyThemeFromGender?.(saved.gender);
      document.body.classList.remove('theme-guest');

      setLoading('Opening services…', true);
      window.location.href = servicesUrl();
    } catch (err) {
      setLoading('', false);
      if (profileError) profileError.textContent = err?.message || 'Could not save profile.';
    }
  });

  document.addEventListener('DOMContentLoaded', async () => {
    if (!window.SupabaseApp?.configured) {
      window.location.replace('index.html');
      return;
    }

    try {
      setLoading('Checking sign-in…', true);

      const session = await window.SupabaseApp.getSession();
      if (!session?.user?.id) {
        window.location.replace('index.html');
        return;
      }

      setLoading('Loading profile…', true);
      let profile = null;
      try {
        profile = await window.SupabaseApp.getProfile(session.user.id);
      } catch (e) {
        console.warn(e);
      }

      if (window.AuthProfile?.profileIsComplete?.(profile)) {
        window.AuthProfile?.cacheProfile?.(profile);
        window.location.replace(servicesUrl());
        return;
      }

      window.AuthProfile?.clearLocalProfileCache?.();
      const welcome = document.getElementById('profile-welcome');
      if (welcome) {
        welcome.textContent = `Signed in as ${session.user.email || 'user'}. Complete the form below.`;
      }
      fillForm(profile);
      document.getElementById('profile-main')?.removeAttribute('hidden');
      setLoading('', false);
    } catch (e) {
      console.error(e);
      setLoading('', false);
      const err = document.getElementById('profile-error');
      if (err) err.textContent = e?.message || 'Could not load profile setup.';
    }
  });
})();
