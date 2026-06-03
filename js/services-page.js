/**
 * Choose Service page — OAuth lands here; requires sign-in + complete child profile.
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

  function updateNav(session, profile) {
    const nm = profile?.name || localStorage.getItem('userName') || 'Dashboard';
    const gender = profile?.gender || localStorage.getItem('userGender');
    const nameEl = document.getElementById('user-chip-name');
    const avEl = document.getElementById('user-chip-avatar');
    if (nameEl) nameEl.textContent = nm;
    if (avEl) {
      avEl.src = window.Branding?.getAvatarImg?.(gender) || 'images/logo/yellow-favicon-96x96.png';
    }
    if (profile?.gender) {
      window.Profile?.applyThemeFromGender?.(profile.gender);
      document.body.classList.remove('theme-guest');
    }
  }

  function bindOptionCards() {
    const routes = {
      'opt-lazy-eye': () => {
        window.location.href = 'lazytest/index.html?v=20260501-2';
      },
      'opt-vision-test': () => {
        window.location.href = 'vision-test.html';
      },
      'opt-guidelines': () => {
        window.location.href = 'guidelines.html';
      },
      'opt-report': () => {
        window.location.href = 'report.html';
      },
      'opt-dashboard': () => {
        window.location.href = 'dashboard.html';
      }
    };
    Object.keys(routes).forEach((id) => {
      document.getElementById(id)?.addEventListener('click', routes[id]);
    });
  }

  function showServicesPage() {
    document.getElementById('services-main')?.removeAttribute('hidden');
    setLoading('', false);
  }

  function fail(msg) {
    const err = document.getElementById('services-error');
    if (err) err.textContent = msg;
    setLoading('', false);
  }

  document.getElementById('nav-signout-btn')?.addEventListener('click', async () => {
    await window.SupabaseApp?.signOut?.();
    window.location.href = 'index.html';
  });

  document.addEventListener('DOMContentLoaded', async () => {
    bindOptionCards();

    if (!window.SupabaseApp?.configured) {
      fail('App is not configured. Check js/supabase-config.js');
      return;
    }

    try {
      setLoading('Completing sign-in…', true);

      const redirect = await window.SupabaseApp.finishAuthRedirect();
      if (redirect?.error) {
        fail(redirect.error.message);
        setTimeout(() => {
          window.location.href = 'index.html';
        }, 4000);
        return;
      }

      setLoading('Checking your account…', true);
      const session = redirect?.session || (await window.SupabaseApp.getSession());
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

      if (!profileIsComplete(profile)) {
        window.location.replace('index.html?profile=1');
        return;
      }

      cacheProfile(profile);
      updateNav(session, profile);
      showServicesPage();

      window.SupabaseApp?.onAuthStateChange?.((event, sess) => {
        if (event === 'SIGNED_OUT' || !sess?.user?.id) {
          window.location.href = 'index.html';
        }
      });

      window.PushClient?.showInboxNotifications?.().catch(() => {});
    } catch (e) {
      console.error(e);
      fail(e?.message || 'Could not open services. Try again from the home page.');
    }
  });
})();
