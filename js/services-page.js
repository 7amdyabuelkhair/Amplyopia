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

  function profileSetupUrl() {
    return (
      window.SupabaseApp?.getProfileSetupUrl?.() ||
      new URL('profile-setup.html', `${window.location.origin}/`).href
    );
  }

  function indexUrl() {
    return (
      window.SupabaseApp?.getIndexUrl?.() ||
      new URL('index.html', `${window.location.origin}/`).href
    );
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
    window.location.href = indexUrl();
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
          window.location.href = indexUrl();
        }, 4000);
        return;
      }

      setLoading('Checking your account…', true);
      let session = redirect?.session || null;
      if (session?.user?.id) {
        await window.SupabaseApp?.ensureSessionPersisted?.(session);
      }
      session = session || (await window.SupabaseApp.waitForSession?.(12, 350));
      if (!session?.user?.id) {
        fail('Sign-in session was lost. Allow storage for amplyopia.com and sign in again.');
        setTimeout(() => window.location.replace(indexUrl()), 4000);
        return;
      }

      setLoading('Loading profile…', true);
      let profile = null;
      try {
        profile = await window.SupabaseApp.getProfile(session.user.id);
      } catch (e) {
        console.warn(e);
      }

      if (!window.AuthProfile?.profileIsComplete?.(profile)) {
        window.location.replace(profileSetupUrl());
        return;
      }

      window.AuthProfile?.cacheProfile?.(profile);
      updateNav(session, profile);
      showServicesPage();

      window.SupabaseApp?.onAuthStateChange?.((event) => {
        if (event === 'SIGNED_OUT') {
          window.location.href = indexUrl();
        }
      });

      window.PushClient?.showInboxNotifications?.().catch(() => {});
    } catch (e) {
      console.error(e);
      fail(e?.message || 'Could not open services. Try again from the home page.');
    }
  });
})();
