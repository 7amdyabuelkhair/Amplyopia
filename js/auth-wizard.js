/**
 * Sign-in only (index.html). Profile → profile-setup.html, services → services.html.
 */
(() => {
  const UID_KEY = 'amplyopia_last_user_id';
  const EXPECT_PROFILE_KEY = 'amplyopia_expect_profile';

  let loadingDepth = 0;

  function showLoading(message) {
    const overlay = document.getElementById('auth-loading');
    const text = document.getElementById('auth-loading-text');
    if (text && message) text.textContent = message;
    loadingDepth += 1;
    overlay?.classList.remove('hidden');
    if (overlay) overlay.setAttribute('aria-busy', 'true');
    document.body.classList.add('auth-loading-active');
  }

  function hideLoading() {
    loadingDepth = Math.max(0, loadingDepth - 1);
    if (loadingDepth > 0) return;
    const overlay = document.getElementById('auth-loading');
    overlay?.classList.add('hidden');
    if (overlay) overlay.setAttribute('aria-busy', 'false');
    document.body.classList.remove('auth-loading-active');
  }

  async function withLoading(message, fn) {
    showLoading(message);
    try {
      return await fn();
    } finally {
      hideLoading();
    }
  }

  function profileSetupUrl() {
    return (
      window.SupabaseApp?.getProfileSetupUrl?.() ||
      new URL('profile-setup.html', `${window.location.origin}/`).href
    );
  }

  function servicesUrl() {
    return (
      window.SupabaseApp?.getServicesUrl?.() ||
      new URL('services.html', `${window.location.origin}/`).href
    );
  }

  function syncUserIdentity(session) {
    const uid = session?.user?.id;
    if (!uid) return;
    try {
      const prev = localStorage.getItem(UID_KEY);
      if (prev && prev !== uid) window.AuthProfile?.clearLocalProfileCache?.();
      localStorage.setItem(UID_KEY, uid);
    } catch (_) {}
  }

  window.AuthWizard = {
    profileIsComplete: (p) => window.AuthProfile?.profileIsComplete?.(p) ?? false,
    cacheProfile: (p) => window.AuthProfile?.cacheProfile?.(p),

    init(ctx) {
      const { goSignInStep, showInstructions, updateNav } = ctx;

      const authError = document.getElementById('auth-error');
      const tabSignIn = document.getElementById('auth-tab-signin');
      const tabSignUp = document.getElementById('auth-tab-signup');
      const authEmailForm = document.getElementById('auth-email-form');
      const authEmail = document.getElementById('auth-email');
      const authPassword = document.getElementById('auth-password');
      const authEmailSubmit = document.getElementById('auth-email-submit');
      const googleBtn = document.getElementById('auth-google-btn');
      const signupConsentGroup = document.getElementById('signup-consent-group');
      const signupTermsCheckbox = document.getElementById('signup-terms-checkbox');
      const signupConsentError = document.getElementById('signup-consent-error');

      let authMode = 'signin';
      let routingUser = false;

      function setAuthMode(mode) {
        authMode = mode === 'signup' ? 'signup' : 'signin';
        tabSignIn?.classList.toggle('active', authMode === 'signin');
        tabSignUp?.classList.toggle('active', authMode === 'signup');
        if (authPassword) {
          authPassword.autocomplete = authMode === 'signup' ? 'new-password' : 'current-password';
        }
        if (authEmailSubmit?.firstChild) {
          authEmailSubmit.firstChild.nodeValue = authMode === 'signup' ? 'Create account ' : 'Sign in ';
        }
        signupConsentGroup?.classList.toggle('hidden', authMode !== 'signup');
        if (signupTermsCheckbox) signupTermsCheckbox.required = authMode === 'signup';
        if (signupConsentError) signupConsentError.textContent = '';
        if (authError) authError.textContent = '';
      }

      async function routeSignedInUser(session, options = {}) {
        if (!session?.user?.id) {
          goSignInStep();
          updateNav(false);
          return;
        }
        if (routingUser && !options.force) return;

        await withLoading('Loading your account…', async () => {
          routingUser = true;
          try {
            syncUserIdentity(session);
            updateNav(true);
            if (authError) authError.textContent = '';

            let profile = null;
            try {
              profile = await window.SupabaseApp.getProfile(session.user.id);
            } catch (err) {
              console.warn('getProfile:', err);
            }

            await window.SupabaseApp?.ensureSessionPersisted?.(session);

            if (!window.AuthProfile?.profileIsComplete?.(profile)) {
              try {
                sessionStorage.setItem(EXPECT_PROFILE_KEY, '1');
              } catch (_) {}
              window.location.href = profileSetupUrl();
              return;
            }

            window.AuthProfile?.cacheProfile?.(profile);
            if (profile?.gender) {
              window.Profile?.applyThemeFromGender?.(profile.gender);
              document.body.classList.remove('theme-guest');
            }
            try {
              sessionStorage.removeItem(EXPECT_PROFILE_KEY);
            } catch (_) {}
            window.location.href = servicesUrl();
          } finally {
            routingUser = false;
          }
        });
      }

      tabSignIn?.addEventListener('click', () => setAuthMode('signin'));
      tabSignUp?.addEventListener('click', () => setAuthMode('signup'));
      setAuthMode('signin');

      googleBtn?.addEventListener('click', async () => {
        try {
          if (authError) authError.textContent = '';
          try {
            sessionStorage.setItem(EXPECT_PROFILE_KEY, '1');
          } catch (_) {}
          showLoading('Redirecting to Google…');
          googleBtn.disabled = true;
          await window.SupabaseApp.signInWithGoogle();
        } catch (e) {
          hideLoading();
          googleBtn.disabled = false;
          if (authError) authError.textContent = e?.message || 'Google sign-in failed.';
        }
      });

      authEmailForm?.addEventListener('submit', async (e) => {
        e.preventDefault();
        try {
          if (authError) authError.textContent = '';
          const email = (authEmail?.value || '').trim();
          const pass = authPassword?.value || '';
          if (!email || !pass) throw new Error('Enter email and password.');
          if (pass.length < 6) throw new Error('Password must be at least 6 characters.');

          if (authMode === 'signup') {
            if (!signupTermsCheckbox?.checked) {
              signupConsentError.textContent =
                'Agree to the Terms & Privacy Policy to create an account.';
              return;
            }
            try {
              sessionStorage.setItem(EXPECT_PROFILE_KEY, '1');
            } catch (_) {}
            await withLoading('Creating account…', async () => {
              const signup = await window.SupabaseApp.signUp(email, pass);
              if (signup?.session) {
                await routeSignedInUser(signup.session, { force: true });
              } else {
                setAuthMode('signin');
                authError.textContent =
                  'Account created. Check your email to confirm, then sign in.';
              }
            });
          } else {
            await withLoading('Signing you in…', async () => {
              const session = await window.SupabaseApp.signInWithPassword(email, pass);
              if (!session?.user?.id) throw new Error('Sign in failed. Try again.');
              await routeSignedInUser(session, { force: true });
            });
          }
        } catch (err) {
          goSignInStep();
          if (authError) authError.textContent = err?.message || 'Sign in failed.';
        }
      });

      function listenForAuth() {
        window.SupabaseApp.onAuthStateChange((event, sess) => {
          if (event === 'SIGNED_OUT' || !sess?.user?.id) {
            goSignInStep();
            updateNav(false);
            showInstructions();
            return;
          }
          if (event === 'SIGNED_IN') {
            void routeSignedInUser(sess, { force: true });
          }
        });
      }

      async function bootstrap() {
        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.get('code') || urlParams.get('error')) {
          const target = servicesUrl();
          const q = window.location.search || '';
          window.location.replace(q ? `${target}${q}` : target);
          return;
        }

        if (!window.supabase?.createClient || !window.SupabaseApp?.configured) {
          if (authError) authError.textContent = 'App not configured. Check supabase-config.js';
          goSignInStep();
          return;
        }

        const session = await withLoading('Checking sign-in…', () => window.SupabaseApp.getSession());
        if (session?.user?.id) {
          await routeSignedInUser(session);
        } else {
          goSignInStep();
          showInstructions();
        }

        listenForAuth();
      }

      bootstrap();

      return { routeSignedInUser };
    }
  };
})();
