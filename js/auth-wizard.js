/**
 * Sign-in + child profile + routing (step 2 → services).
 */
(() => {
  const UID_KEY = 'amplyopia_last_user_id';
  const EXPECT_PROFILE_KEY = 'amplyopia_expect_profile';

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

  function syncUserIdentity(session) {
    const uid = session?.user?.id;
    if (!uid) return;
    try {
      const prev = localStorage.getItem(UID_KEY);
      if (prev && prev !== uid) clearLocalProfileCache();
      localStorage.setItem(UID_KEY, uid);
    } catch (_) {}
  }

  window.AuthWizard = {
    profileIsComplete,
    cacheProfile,

    init(ctx) {
      const {
        goServices,
        goSignInStep,
        showInstructions,
        updateNav,
        setProfileComplete,
        getProfileComplete
      } = ctx;

      const authCard = document.getElementById('auth-card');
      const profileCard = document.getElementById('profile-card');
      const authError = document.getElementById('auth-error');
      const profileError = document.getElementById('profile-error');
      const profileWelcome = document.getElementById('profile-welcome');
      const step2Title = document.getElementById('step-2-title');
      const step2Subtitle = document.getElementById('step-2-subtitle');

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

      const profileForm = document.getElementById('profile-form');
      const profileName = document.getElementById('profile-name');
      const profileBirthdate = document.getElementById('profile-birthdate');
      const signOutBtn = document.getElementById('auth-signout-btn');

      let authMode = 'signin';
      let pendingTermsAcceptedAt = null;
      let routingUser = false;
      let lastRoutedUserId = null;

      function setStep2Copy(mode) {
        if (mode === 'profile') {
          if (step2Title) step2Title.textContent = 'Set up child profile';
          if (step2Subtitle) {
            step2Subtitle.textContent = 'Choose boy or girl, enter the child name and birthday.';
          }
        } else {
          if (step2Title) step2Title.textContent = 'Sign in';
          if (step2Subtitle) step2Subtitle.textContent = 'Sign in with Google or email to continue.';
        }
      }

      function showLoginForm() {
        authCard?.classList.remove('hidden');
        profileCard?.classList.add('hidden');
        setStep2Copy('signin');
        setProfileComplete(false);
      }

      function showProfileForm(email) {
        authCard?.classList.add('hidden');
        profileCard?.classList.remove('hidden');
        setStep2Copy('profile');
        goSignInStep();
        setProfileComplete(false);
        try {
          sessionStorage.removeItem(EXPECT_PROFILE_KEY);
        } catch (_) {}
        if (profileWelcome) {
          profileWelcome.textContent = email
            ? `Signed in as ${email}. Set up the child profile to continue.`
            : 'Set up the child profile to continue.';
        }
        profileCard?.scrollIntoView?.({ behavior: 'smooth', block: 'start' });
      }

      function fillProfileForm(profile) {
        if (!profile) return;
        if (profile.name && profileName) profileName.value = profile.name;
        if (profile.birthdate && profileBirthdate) profileBirthdate.value = String(profile.birthdate);
        if (profile.gender) {
          const radio = profileForm?.querySelector(`input[name="gender"][value="${profile.gender}"]`);
          if (radio) radio.checked = true;
        }
      }

      function resetProfileForm() {
        if (profileName) profileName.value = '';
        if (profileBirthdate) profileBirthdate.value = '';
        profileForm?.querySelectorAll('input[name="gender"]').forEach((el) => {
          el.checked = false;
        });
      }

      async function routeSignedInUser(session, options = {}) {
        if (!session?.user?.id) {
          showLoginForm();
          goSignInStep();
          updateNav(false);
          return;
        }

        if (routingUser && lastRoutedUserId === session.user.id && !options.force) return;
        routingUser = true;
        lastRoutedUserId = session.user.id;

        try {
          syncUserIdentity(session);
          updateNav(true);
          if (authError) authError.textContent = '';
          if (profileError) profileError.textContent = '';

          let profile = null;
          try {
            profile = await window.SupabaseApp.getProfile(session.user.id);
          } catch (err) {
            console.warn('getProfile:', err);
            if (profileError) {
              profileError.textContent =
                err?.message || 'Could not load profile. Fill the form below and save.';
            }
          }

          const complete = profileIsComplete(profile);

          if (!complete) {
            clearLocalProfileCache();
            resetProfileForm();
            fillProfileForm(profile);
            showProfileForm(session.user.email);
            return;
          }

          fillProfileForm(profile);
          if (profile?.gender) {
            window.Profile?.applyThemeFromGender?.(profile.gender);
            try {
              localStorage.setItem('userGender', String(profile.gender));
            } catch (_) {}
            document.body.classList.remove('theme-guest');
          }
          cacheProfile(profile);
          setProfileComplete(true);
          try {
            sessionStorage.removeItem(EXPECT_PROFILE_KEY);
          } catch (_) {}
          goServices();
        } finally {
          routingUser = false;
        }
      }

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

      tabSignIn?.addEventListener('click', () => setAuthMode('signin'));
      tabSignUp?.addEventListener('click', () => setAuthMode('signup'));
      setAuthMode('signin');

      googleBtn?.addEventListener('click', async () => {
        try {
          if (authError) authError.textContent = '';
          try {
            sessionStorage.setItem(EXPECT_PROFILE_KEY, '1');
          } catch (_) {}
          await window.SupabaseApp.signInWithGoogle();
        } catch (e) {
          if (authError) authError.textContent = e?.message || 'Google sign-in failed.';
        }
      });

      authEmailForm?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const btn = authEmailSubmit;
        try {
          if (authError) authError.textContent = '';
          const email = (authEmail?.value || '').trim();
          const pass = authPassword?.value || '';
          if (!email || !pass) throw new Error('Enter email and password.');
          if (pass.length < 6) throw new Error('Password must be at least 6 characters.');
          if (btn) btn.disabled = true;

          if (authMode === 'signup') {
            if (!signupTermsCheckbox?.checked) {
              signupConsentError.textContent =
                'Agree to the Terms & Privacy Policy to create an account.';
              return;
            }
            pendingTermsAcceptedAt = new Date().toISOString();
            try {
              sessionStorage.setItem(EXPECT_PROFILE_KEY, '1');
            } catch (_) {}
            const signup = await window.SupabaseApp.signUp(email, pass);
            if (signup?.session) {
              await routeSignedInUser(signup.session, { force: true });
            } else {
              setAuthMode('signin');
              authError.textContent =
                'Account created. Check your email to confirm, then sign in.';
            }
          } else {
            const session = await window.SupabaseApp.signInWithPassword(email, pass);
            if (!session?.user?.id) throw new Error('Sign in failed. Try again.');
            await routeSignedInUser(session, { force: true });
          }
        } catch (err) {
          showLoginForm();
          goSignInStep();
          if (authError) authError.textContent = err?.message || 'Sign in failed.';
        } finally {
          if (btn) btn.disabled = false;
        }
      });

      profileForm?.addEventListener('submit', async (e) => {
        e.preventDefault();
        try {
          if (profileError) profileError.textContent = '';
          const session = await window.SupabaseApp.getSession();
          const uid = session?.user?.id;
          if (!uid) throw new Error('Please sign in first.');

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
              acceptedAt: pendingTermsAcceptedAt || new Date().toISOString()
            });
          } catch (_) {}

          cacheProfile(saved);
          window.Profile?.applyThemeFromGender?.(saved.gender);
          document.body.classList.remove('theme-guest');
          ctx.onProfileSaved?.();
          setProfileComplete(true);
          try {
            sessionStorage.removeItem(EXPECT_PROFILE_KEY);
          } catch (_) {}
          goServices();
        } catch (err) {
          if (profileError) profileError.textContent = err?.message || 'Could not save profile.';
        }
      });

      signOutBtn?.addEventListener('click', async () => {
        await window.SupabaseApp.signOut();
        ctx.onSignOut?.();
        showLoginForm();
        goSignInStep();
        updateNav(false);
      });

      function listenForAuth() {
        window.SupabaseApp.onAuthStateChange((event, sess) => {
          if (event === 'SIGNED_OUT' || !sess?.user?.id) {
            lastRoutedUserId = null;
            showLoginForm();
            updateNav(false);
            if (window.location.hash !== '#services') showInstructions();
            return;
          }
          if (event === 'SIGNED_IN') {
            void routeSignedInUser(sess, { force: true });
          }
        });
      }

      async function bootstrap() {
        if (!window.supabase?.createClient) {
          if (authError) authError.textContent = 'Auth library failed to load. Clear cache and reload.';
          goSignInStep();
          return;
        }
        if (!window.SupabaseApp?.configured) {
          if (authError) {
            authError.textContent = 'Add SUPABASE_URL and SUPABASE_ANON_KEY in js/supabase-config.js';
          }
          showInstructions();
          return;
        }

        const urlParams = new URLSearchParams(window.location.search);
        const hasOAuthCode = urlParams.get('code');
        const hasOAuthError = urlParams.get('error');

        if (hasOAuthCode || hasOAuthError) {
          goSignInStep();
          const redirect = await window.SupabaseApp.finishAuthRedirect();
          if (redirect?.error && authError) {
            authError.textContent = redirect.error.message;
            showLoginForm();
            listenForAuth();
            return;
          }
          const session = redirect?.session || (await window.SupabaseApp.getSession());
          if (session?.user?.id) {
            try {
              sessionStorage.setItem(EXPECT_PROFILE_KEY, '1');
            } catch (_) {}
            await routeSignedInUser(session, { force: true });
            listenForAuth();
            return;
          }
        }

        const session = await window.SupabaseApp.getSession();
        if (session?.user?.id) {
          await routeSignedInUser(session);
        } else {
          showLoginForm();
          if (window.location.hash === '#services') goSignInStep();
          else showInstructions();
        }

        listenForAuth();
      }

      bootstrap();

      return {
        routeSignedInUser,
        showLoginForm,
        showProfileForm,
        tryGoServices: async () => {
          const session = await window.SupabaseApp.getSession();
          if (!session?.user?.id) return false;
          await routeSignedInUser(session, { force: true });
          return getProfileComplete();
        }
      };
    }
  };
})();
