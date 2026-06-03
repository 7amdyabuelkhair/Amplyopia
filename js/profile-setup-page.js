/**
 * Child profile setup — Google OAuth completes HERE (not on another page).
 * URL includes ?account=<user-id>&email=... so the page knows who signed in.
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

  function indexUrl() {
    return (
      window.SupabaseApp?.getIndexUrl?.() ||
      new URL('index.html', `${window.location.origin}/`).href
    );
  }

  function accountFromUrl() {
    try {
      return new URLSearchParams(window.location.search).get('account') || '';
    } catch (_) {
      return '';
    }
  }

  function emailFromUrl() {
    try {
      return new URLSearchParams(window.location.search).get('email') || '';
    } catch (_) {
      return '';
    }
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

  function showWelcome(session) {
    const welcome = document.getElementById('profile-welcome');
    if (!welcome) return;
    const email =
      session?.user?.email || emailFromUrl() || sessionStorage.getItem('amplyopia_setup_email') || '';
    const accountId = session?.user?.id || accountFromUrl();
    welcome.textContent = email
      ? `Signed in as ${email}. Complete the child profile below.`
      : 'Complete the child profile below.';
    if (accountId) {
      welcome.textContent += ` (Account: ${accountId.slice(0, 8)}…)`;
    }
  }

  document.getElementById('nav-signout-btn')?.addEventListener('click', async () => {
    await window.SupabaseApp?.signOut?.();
    window.location.href = indexUrl();
  });

  document.getElementById('auth-signout-btn')?.addEventListener('click', async () => {
    await window.SupabaseApp?.signOut?.();
    window.location.href = indexUrl();
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

      let session = await window.SupabaseApp.waitForSession?.(8, 200);
      const uid = session?.user?.id;
      if (!uid) {
        throw new Error('Sign-in expired. Go to the home page and sign in with Google again.');
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
      try {
        sessionStorage.removeItem('amplyopia_expect_profile');
      } catch (_) {}

      setLoading('Opening services…', true);
      window.location.href = servicesUrl();
    } catch (err) {
      setLoading('', false);
      if (profileError) profileError.textContent = err?.message || 'Could not save profile.';
    }
  });

  document.addEventListener('DOMContentLoaded', async () => {
    if (!window.SupabaseApp?.configured) {
      window.location.replace(indexUrl());
      return;
    }

    const profileError = document.getElementById('profile-error');

    try {
      const params = new URLSearchParams(window.location.search);
      if (params.get('code') || params.get('error')) {
        setLoading('Completing Google sign-in…', true);
      } else {
        setLoading('Checking sign-in…', true);
      }

      const redirect = await window.SupabaseApp.finishAuthRedirect();
      if (redirect?.error) {
        setLoading('', false);
        if (profileError) profileError.textContent = redirect.error.message;
        setTimeout(() => window.location.replace(indexUrl()), 6000);
        return;
      }

      let session = redirect?.session || null;
      if (session?.user?.id) {
        await window.SupabaseApp.ensureSessionPersisted?.(session);
        window.SupabaseApp.stampSetupAccountInUrl?.(session);
      }

      session = session || (await window.SupabaseApp.waitForSession?.(15, 400));

      const urlAccount = accountFromUrl();
      if (session?.user?.id && urlAccount && urlAccount !== session.user.id) {
        window.SupabaseApp.stampSetupAccountInUrl?.(session);
      }

      if (!session?.user?.id) {
        setLoading('', false);
        const hintEmail = emailFromUrl() || sessionStorage.getItem('amplyopia_setup_email');
        if (profileError) {
          profileError.textContent = hintEmail
            ? `Could not restore sign-in for ${hintEmail}. Allow cookies/storage for amplyopia.com, then sign in with Google again from the home page.`
            : 'Please sign in from the home page first (Google or email).';
        }
        setTimeout(() => window.location.replace(indexUrl()), 6000);
        return;
      }

      if (!urlAccount) {
        window.SupabaseApp.stampSetupAccountInUrl?.(session);
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
      showWelcome(session);
      fillForm(profile);
      document.getElementById('profile-main')?.removeAttribute('hidden');
      setLoading('', false);
    } catch (e) {
      console.error(e);
      setLoading('', false);
      if (profileError) profileError.textContent = e?.message || 'Could not load profile setup.';
    }
  });
})();
