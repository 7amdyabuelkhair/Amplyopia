document.addEventListener('DOMContentLoaded', () => {
    const yearEl = document.getElementById('year');
    if (yearEl) yearEl.textContent = String(new Date().getFullYear());

    // Initialize wizard
    let currentStep = 1;
    const totalSteps = 3;
    let profileComplete = false;

    // Update progress indicator
    function updateProgress(step) {
        document.querySelectorAll('.progress-step').forEach((el, index) => {
            if (index + 1 <= step) {
                el.classList.add('active');
            } else {
                el.classList.remove('active');
            }
        });
    }

    // Show step function
    function showStep(step) {
        // Hide all steps
        document.querySelectorAll('.wizard-step').forEach(el => {
            el.classList.remove('active');
        });
        
        // Show current step
        const stepEl = document.getElementById(`step-${step}`);
        if (stepEl) {
            stepEl.classList.add('active');
            updateProgress(step);
        }
    }

    // Make functions global
    window.nextStep = function() {
        if (currentStep === 2 && !profileComplete) return;
        if (currentStep < totalSteps) {
            currentStep++;
            showStep(currentStep);
        }
    };

    window.prevStep = function() {
        if (currentStep > 1) {
            currentStep--;
            showStep(currentStep);
        }
    };

    // --- Step 2: Supabase auth + child profile (name + gender + birthdate) ---
    const authCard = document.getElementById('auth-card');
    const profileCard = document.getElementById('profile-card');
    const authError = document.getElementById('auth-error');
    const profileError = document.getElementById('profile-error');
    const profileWelcome = document.getElementById('profile-welcome');

    const tabSignIn = document.getElementById('auth-tab-signin');
    const tabSignUp = document.getElementById('auth-tab-signup');
    const authEmailForm = document.getElementById('auth-email-form');
    const authEmail = document.getElementById('auth-email');
    const authPassword = document.getElementById('auth-password');
    const authEmailSubmit = document.getElementById('auth-email-submit');
    const googleBtn = document.getElementById('auth-google-btn');

    const profileForm = document.getElementById('profile-form');
    const profileName = document.getElementById('profile-name');
    const profileGender = document.getElementById('profile-gender');
    const profileBirthdate = document.getElementById('profile-birthdate');
    const signOutBtn = document.getElementById('auth-signout-btn');

    let authMode = 'signin';

    function setAuthMode(mode) {
        authMode = mode === 'signup' ? 'signup' : 'signin';
        if (tabSignIn && tabSignUp) {
            tabSignIn.classList.toggle('active', authMode === 'signin');
            tabSignUp.classList.toggle('active', authMode === 'signup');
            tabSignIn.setAttribute('aria-selected', String(authMode === 'signin'));
            tabSignUp.setAttribute('aria-selected', String(authMode === 'signup'));
        }
        if (authPassword) {
            authPassword.autocomplete = authMode === 'signup' ? 'new-password' : 'current-password';
        }
        if (authEmailSubmit) {
            authEmailSubmit.firstChild && (authEmailSubmit.firstChild.nodeValue = authMode === 'signup' ? 'Create account ' : 'Continue ');
        }
        if (authError) authError.textContent = '';
    }

    tabSignIn?.addEventListener('click', () => setAuthMode('signin'));
    tabSignUp?.addEventListener('click', () => setAuthMode('signup'));
    setAuthMode('signin');

    function showAuthUI() {
        authCard?.classList.remove('hidden');
        profileCard?.classList.add('hidden');
        profileComplete = false;
    }

    function showProfileUI() {
        authCard?.classList.add('hidden');
        profileCard?.classList.remove('hidden');
    }

    async function hydrateProfileFromSupabase(session) {
        try {
            if (!session?.user?.id) {
                showAuthUI();
                return;
            }

            showProfileUI();
            if (profileError) profileError.textContent = '';
            if (profileWelcome) profileWelcome.textContent = `Signed in as ${session.user.email || 'user'}.`;

            const profile = await window.SupabaseApp?.getProfile?.(session.user.id);
            if (profile?.name) profileName.value = profile.name;
            if (profile?.gender && profileGender) profileGender.value = String(profile.gender);
            if (profile?.birthdate && profileBirthdate) profileBirthdate.value = String(profile.birthdate);

            const hasName = !!(profile?.name && String(profile.name).trim());
            const hasGender = !!(profile?.gender && (profile.gender === 'boy' || profile.gender === 'girl'));
            const hasBirthdate = !!(profile?.birthdate && String(profile.birthdate).trim());
            const computedAge = window.Profile?.computeAgeFromBirthdate?.(profile?.birthdate) ?? null;
            const hasAge = typeof computedAge === 'number' && computedAge >= 0 && computedAge <= 120;

            if (hasGender) {
                window.Profile?.applyThemeFromGender?.(profile.gender);
                localStorage.setItem('userGender', String(profile.gender));
            }

            if (hasName && hasGender && hasBirthdate && hasAge) {
                localStorage.setItem('userName', String(profile.name));
                localStorage.setItem('userBirthdate', String(profile.birthdate));
                localStorage.setItem('userAge', String(computedAge));
                profileComplete = true;
                // Auto-advance to step 3 if user lands here after OAuth redirect.
                if (currentStep === 2) window.nextStep();
            } else {
                profileComplete = false;
            }
        } catch (e) {
            showProfileUI();
            profileComplete = false;
            if (profileError) profileError.textContent = e?.message || 'Failed to load your profile.';
        }
    }

    // Initial session check + listen to changes (OAuth redirect returns here)
    (async () => {
        if (!window.SupabaseApp?.configured && authError) {
            authError.textContent = 'Supabase is not configured yet. Add SUPABASE_URL and SUPABASE_ANON_KEY in your project.';
        }
        const session = await window.SupabaseApp?.getSession?.();
        await hydrateProfileFromSupabase(session);
        window.SupabaseApp?.onAuthStateChange?.((s) => hydrateProfileFromSupabase(s));
    })();

    googleBtn?.addEventListener('click', async () => {
        try {
            if (authError) authError.textContent = '';
            await window.SupabaseApp?.signInWithGoogle?.();
        } catch (e) {
            if (authError) authError.textContent = e?.message || 'Google sign-in failed.';
        }
    });

    authEmailForm?.addEventListener('submit', async (e) => {
        e.preventDefault();
        try {
            if (authError) authError.textContent = '';
            const email = (authEmail?.value || '').trim();
            const pass = authPassword?.value || '';
            if (!email || !pass) throw new Error('Please enter email and password.');
            if (authMode === 'signup') {
                await window.SupabaseApp?.signUp?.(email, pass);
                if (authError) authError.textContent = 'Check your email to confirm your account (if enabled). You can also sign in now.';
            } else {
                await window.SupabaseApp?.signInWithPassword?.(email, pass);
            }
        } catch (err) {
            if (authError) authError.textContent = err?.message || 'Email sign-in failed.';
        }
    });

    signOutBtn?.addEventListener('click', async () => {
        await window.SupabaseApp?.signOut?.();
        showAuthUI();
    });

    profileForm?.addEventListener('submit', async (e) => {
        e.preventDefault();
        try {
            if (profileError) profileError.textContent = '';
            const session = await window.SupabaseApp?.getSession?.();
            const uid = session?.user?.id;
            if (!uid) throw new Error('Please sign in first.');

            const name = (profileName?.value || '').trim();
            const gender = String(profileGender?.value || '').toLowerCase();
            const birthdate = String(profileBirthdate?.value || '').trim();
            if (!name) throw new Error('Please enter your name.');
            if (gender !== 'boy' && gender !== 'girl') throw new Error('Please choose boy or girl.');
            if (!birthdate) throw new Error('Please enter the child birthday.');

            const computedAge = window.Profile?.computeAgeFromBirthdate?.(birthdate);
            if (typeof computedAge !== 'number' || computedAge < 0 || computedAge > 120) {
                throw new Error('Birthday is not valid.');
            }

            const saved = await window.SupabaseApp?.upsertProfile?.({ id: uid, name, gender, birthdate });
            localStorage.setItem('userName', saved.name);
            localStorage.setItem('userGender', saved.gender);
            localStorage.setItem('userBirthdate', saved.birthdate);
            localStorage.setItem('userAge', String(window.Profile?.computeAgeFromBirthdate?.(saved.birthdate) ?? computedAge));
            window.Profile?.applyThemeFromGender?.(saved.gender);
            profileComplete = true;
            window.nextStep();
        } catch (err) {
            profileComplete = false;
            if (profileError) profileError.textContent = err?.message || 'Failed to save profile.';
        }
    });

    // Mobile menu toggle
    const menuToggle = document.querySelector('.menu-toggle');
    const siteNav = document.getElementById('site-nav');
    
    if (menuToggle && siteNav) {
        menuToggle.addEventListener('click', () => {
            const isExpanded = menuToggle.getAttribute('aria-expanded') === 'true';
            menuToggle.setAttribute('aria-expanded', !isExpanded);
            siteNav.classList.toggle('active');
        });
    }

    // Option card handlers
    const routes = {
        'opt-lazy-eye': () => { window.location.href = 'lazytest/index.html'; },
        'opt-vision-test': () => { window.location.href = 'vision-test.html'; },
        'opt-guidelines': () => { window.location.href = 'guidelines.html'; },
        'opt-report': () => { window.location.href = 'report.html'; },
        'opt-dashboard': () => { window.location.href = 'dashboard.html'; },
        'opt-red-blue': () => {
            const ok = window.confirm('You must wear red-blue glasses before starting these exercises. Continue?');
            if (ok) window.location.href = 'lazytest/index.html?level=6';
        }
    };
    
    Object.keys(routes).forEach((id) => {
        const el = document.getElementById(id);
        if (el) {
            el.addEventListener('click', routes[id]);
        }
    });

    // Back button on secondary pages
    const backBtn = document.getElementById('back-btn');
    if (backBtn) {
        backBtn.addEventListener('click', () => {
            if (window.history.length > 1) {
                window.history.back();
            } else {
                window.location.href = 'index.html';
            }
        });
    }

    // Initialize first step
    showStep(1);
});
