/**
 * Sign-in + child profile + routing (step 2 → services).
 * Loaded after supabase.js; initialized from app.js.
 */
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
    if (!profile) return;
    try {
      if (profile.name) localStorage.setItem('userName', String(profile.name));
      if (profile.gender) localStorage.setItem('userGender', String(profile.gender));
      if (profile.birthdate) localStorage.setItem('userBirthdate', String(profile.birthdate));
      const age = window.Profile?.computeAgeFromBirthdate?.(profile.birthdate);
      if (typeof age === 'number') localStorage.setItem('userAge', String(age));
    } catch (_) {}
  }

  window.AuthWizard = {
    profileIsComplete,
    cacheProfile,

    /**
     * @param {object} ctx - DOM refs and callbacks from app.js
     */
    init(ctx) {
      const {
        showStep,
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

      function setStep2Copy(mode) {
        if (mode === 'profile') {
          if (step2Title) step2Title.textContent = 'Child profile';
          if (step2Subtitle) step2Subtitle.textContent = 'Enter name, gender, and birthday to continue.';
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
        if (profileWelcome) {
          profileWelcome.textContent = email
            ? `Signed in as ${email}. Complete the child profile below.`
            : 'Complete the child profile below.';
        }
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

      async function routeSignedInUser(session) {
        if (!session?.user?.id) {
          showLoginForm();
          goSignInStep();
          updateNav(false);
          return;
        }

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
              err?.message || 'Could not load profile. You can still save the form below.';
          }
        }

        fillProfileForm(profile);

        if (profile?.gender) {
          window.Profile?.applyThemeFromGender?.(profile.gender);
          try {
            localStorage.setItem('userGender', String(profile.gender));
          } catch (_) {}
          document.body.classList.remove('theme-guest');
        }

        if (profileIsComplete(profile)) {
          cacheProfile(profile);
          setProfileComplete(true);
          goServices();
          return;
        }

        setProfileComplete(false);
        showProfileForm(session.user.email);
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
            const signup = await window.SupabaseApp.signUp(email, pass);
            if (signup?.session) {
              await routeSignedInUser(signup.session);
            } else {
              setAuthMode('signin');
              authError.textContent =
                'Account created. Check your email to confirm, then sign in.';
            }
          } else {
            const session = await window.SupabaseApp.signInWithPassword(email, pass);
            if (!session?.user?.id) throw new Error('Sign in failed. Try again.');
            await routeSignedInUser(session);
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

      async function bootstrap() {
        if (!window.supabase?.createClient) {
          authError.textContent = 'Auth library failed to load. Clear cache and reload.';
          goSignInStep();
          return;
        }
        if (!window.SupabaseApp?.configured) {
          authError.textContent = 'Add SUPABASE_URL and SUPABASE_ANON_KEY in js/supabase-config.js';
          showInstructions();
          return;
        }

        goSignInStep();
        const redirect = await window.SupabaseApp.finishAuthRedirect();
        if (redirect?.error && authError) {
          authError.textContent = redirect.error.message;
        }

        const session = redirect?.session || (await window.SupabaseApp.getSession());
        if (session?.user?.id) {
          await routeSignedInUser(session);
        } else {
          showLoginForm();
          if (window.location.hash === '#services') {
            goSignInStep();
          } else {
            showInstructions();
          }
        }

        window.SupabaseApp.onAuthStateChange((event, sess) => {
          if (event === 'SIGNED_OUT' || !sess?.user?.id) {
            showLoginForm();
            updateNav(false);
            if (window.location.hash !== '#services') showInstructions();
            return;
          }
          if (event === 'SIGNED_IN' || event === 'INITIAL_SESSION') {
            void routeSignedInUser(sess);
          }
        });
      }

      bootstrap();

      return {
        routeSignedInUser,
        showLoginForm,
        showProfileForm,
        tryGoServices: async () => {
          const session = await window.SupabaseApp.getSession();
          if (!session?.user?.id) return false;
          if (getProfileComplete()) {
            goServices();
            return true;
          }
          await routeSignedInUser(session);
          return getProfileComplete();
        }
      };
    }
  };
})();
