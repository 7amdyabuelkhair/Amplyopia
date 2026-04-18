document.addEventListener('DOMContentLoaded', () => {
    const yearEl = document.getElementById('year');
    if (yearEl) yearEl.textContent = String(new Date().getFullYear());

    // Initialize wizard
    let currentStep = 1;
    const totalSteps = 3;
    let profileComplete = false;
    const progressIndicator = document.querySelector('.progress-indicator');

    function applyThemeFromStoredGender() {
        const gender = localStorage.getItem('userGender');
        if (gender === 'boy' || gender === 'girl') {
            document.body.classList.remove('theme-guest');
            window.Profile?.applyThemeFromGender?.(gender);
        } else {
            document.body.classList.remove('theme-boy', 'theme-girl');
            document.body.classList.add('theme-guest');
        }
    }

    function setInstructionImagesByGender() {
        const gender = localStorage.getItem('userGender');
        const img1 = document.getElementById('instruction-img-1');
        const img2 = document.getElementById('instruction-img-2');
        const img3 = document.getElementById('instruction-img-3');
        if (!img1 || !img2 || !img3) return;

        if (gender === 'girl') {
            img1.src = 'images/girl-instruction-1.png';
            img2.src = 'images/girl-instruction-2.png';
            img3.src = 'images/girl-instruction-3.png';
        } else if (gender === 'boy') {
            img1.src = 'images/boy-instruction-1.jpg';
            img2.src = 'images/boy-instruction-2.jpg';
            img3.src = 'images/boy-instruction-3.jpg';
        } else {
            // Guest (yellow) instruction images order (requested)
            img1.src = 'images/boy-instruction-1.jpg';
            img2.src = 'images/girl-instruction-3.png';
            img3.src = 'images/boy-instruction-2.jpg';
        }
    }

    applyThemeFromStoredGender();
    setInstructionImagesByGender();

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
        if (currentStep === 3) {
            currentStep = 1;
            showStep(1);
            return;
        }
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
    const signupConsentGroup = document.getElementById('signup-consent-group');
    const signupTermsCheckbox = document.getElementById('signup-terms-checkbox');
    const signupConsentError = document.getElementById('signup-consent-error');

    const profileForm = document.getElementById('profile-form');
    const profileName = document.getElementById('profile-name');
    const profileGender = document.getElementById('profile-gender');
    const profileBirthdate = document.getElementById('profile-birthdate');
    const signOutBtn = document.getElementById('auth-signout-btn');
    const reconsentModal = document.getElementById('terms-reconsent-modal');
    const reconsentCheckbox = document.getElementById('reconsent-checkbox');
    const reconsentAcceptBtn = document.getElementById('reconsent-accept-btn');
    const reconsentError = document.getElementById('reconsent-error');

    let authMode = 'signin';
    let pendingTermsAcceptedAt = null;
    let hasAcceptedTerms = false;

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
        if (signupConsentGroup) signupConsentGroup.classList.toggle('hidden', authMode !== 'signup');
        if (signupTermsCheckbox) signupTermsCheckbox.required = authMode === 'signup';
        if (signupConsentError) signupConsentError.textContent = '';
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

    function setTermsState({ accepted, acceptedAt }) {
        hasAcceptedTerms = !!accepted;
        if (hasAcceptedTerms) {
            localStorage.setItem('accepted_terms', 'true');
            if (acceptedAt) localStorage.setItem('accepted_terms_at', String(acceptedAt));
        }
    }

    function showReconsentModal(show) {
        if (!reconsentModal) return;
        reconsentModal.classList.toggle('hidden', !show);
    }

    function isEditProfileMode() {
        try {
            const q = new URLSearchParams(window.location.search);
            return q.get('editProfile') === '1';
        } catch (_) {
            return false;
        }
    }

    async function hydrateProfileFromSupabase(session) {
        try {
            if (!session?.user?.id) {
                showAuthUI();
                applyThemeFromStoredGender();
                return;
            }

            showProfileUI();
            if (profileError) profileError.textContent = '';
            if (profileWelcome) profileWelcome.textContent = `Signed in as ${session.user.email || 'user'}.`;

            const profile = await window.SupabaseApp?.getProfile?.(session.user.id);
            setTermsState({
                accepted: profile?.accepted_terms === true || localStorage.getItem('accepted_terms') === 'true',
                acceptedAt: profile?.accepted_terms_at || localStorage.getItem('accepted_terms_at')
            });

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
                document.body.classList.remove('theme-guest');
            }

            if (hasName && hasGender && hasBirthdate && hasAge) {
                localStorage.setItem('userName', String(profile.name));
                localStorage.setItem('userBirthdate', String(profile.birthdate));
                localStorage.setItem('userAge', String(computedAge));
                profileComplete = true;
                setInstructionImagesByGender();
                // Never show sign-in/profile steps after sign-in unless user explicitly edits profile
                if (isEditProfileMode()) {
                    if (progressIndicator) progressIndicator.classList.remove('hidden');
                    currentStep = 2;
                    showStep(2);
                    showProfileUI();
                } else {
                    if (progressIndicator) progressIndicator.classList.add('hidden');
                    currentStep = 3;
                    showStep(3);
                }
            } else {
                profileComplete = false;
            }

            if (!hasAcceptedTerms) showReconsentModal(true);
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

    // Navbar user chip + sign-out
    const userChip = document.getElementById('user-chip');
    const userChipName = document.getElementById('user-chip-name');
    const userChipAvatar = document.getElementById('user-chip-avatar');
    const navSignoutBtn = document.getElementById('nav-signout-btn');
    const navDashboardLink = document.getElementById('nav-dashboard-link');

    function updateNavForSignedIn(isSignedIn) {
        if (navSignoutBtn) navSignoutBtn.classList.toggle('hidden', !isSignedIn);
        if (navDashboardLink) navDashboardLink.classList.toggle('hidden', !isSignedIn);
        if (userChip) userChip.classList.toggle('hidden', !isSignedIn);

        if (isSignedIn) {
            const nm = localStorage.getItem('userName') || 'Dashboard';
            const gender = localStorage.getItem('userGender');
            if (userChipName) userChipName.textContent = nm;
            if (userChipAvatar) {
                userChipAvatar.src = gender === 'boy' ? 'images/boy.png' : gender === 'girl' ? 'images/girl.png' : 'images/user-icon.png';
            }
        }
    }

    navSignoutBtn?.addEventListener('click', async () => {
        await window.SupabaseApp?.signOut?.();
        localStorage.removeItem('userGender');
        localStorage.removeItem('userBirthdate');
        localStorage.removeItem('userAge');
        localStorage.removeItem('userName');
        localStorage.removeItem('accepted_terms');
        localStorage.removeItem('accepted_terms_at');
        document.body.classList.remove('theme-boy', 'theme-girl');
        document.body.classList.add('theme-guest');
        setInstructionImagesByGender();
        if (progressIndicator) progressIndicator.classList.remove('hidden');
        currentStep = 1;
        showStep(1);
        updateNavForSignedIn(false);
    });

    (async () => {
        const s = await window.SupabaseApp?.getSession?.();
        updateNavForSignedIn(!!s?.user?.id);
        window.SupabaseApp?.onAuthStateChange?.((sess) => updateNavForSignedIn(!!sess?.user?.id));
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
            if (signupConsentError) signupConsentError.textContent = '';
            const email = (authEmail?.value || '').trim();
            const pass = authPassword?.value || '';
            if (!email || !pass) throw new Error('Please enter email and password.');
            if (authMode === 'signup') {
                if (!signupTermsCheckbox?.checked) {
                    if (signupConsentError) signupConsentError.textContent = 'You must agree to the Terms & Conditions and Privacy Policy to create an account.';
                    return;
                }
                pendingTermsAcceptedAt = new Date().toISOString();
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
        localStorage.removeItem('accepted_terms');
        localStorage.removeItem('accepted_terms_at');
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
            const gender = String(profileForm?.querySelector('input[name="gender"]:checked')?.value || '').toLowerCase();
            const birthdate = String(profileBirthdate?.value || '').trim();
            if (!name) throw new Error('Please enter your name.');
            if (gender !== 'boy' && gender !== 'girl') throw new Error('Please choose boy or girl.');
            if (!birthdate) throw new Error('Please enter the child birthday.');

            const computedAge = window.Profile?.computeAgeFromBirthdate?.(birthdate);
            if (typeof computedAge !== 'number' || computedAge < 0 || computedAge > 120) {
                throw new Error('Birthday is not valid.');
            }

            const acceptedAt = pendingTermsAcceptedAt || localStorage.getItem('accepted_terms_at') || new Date().toISOString();
            const saved = await window.SupabaseApp?.upsertProfile?.({
                id: uid,
                name,
                gender,
                birthdate,
                acceptedTerms: true,
                acceptedTermsAt: acceptedAt
            });
            localStorage.setItem('userName', saved.name);
            localStorage.setItem('userGender', saved.gender);
            localStorage.setItem('userBirthdate', saved.birthdate);
            localStorage.setItem('userAge', String(window.Profile?.computeAgeFromBirthdate?.(saved.birthdate) ?? computedAge));
            setTermsState({ accepted: true, acceptedAt: saved?.accepted_terms_at || acceptedAt });
            pendingTermsAcceptedAt = null;
            window.Profile?.applyThemeFromGender?.(saved.gender);
            document.body.classList.remove('theme-guest');
            setInstructionImagesByGender();
            profileComplete = true;
            if (progressIndicator) progressIndicator.classList.add('hidden');
            currentStep = 3;
            showStep(3);
        } catch (err) {
            profileComplete = false;
            if (profileError) profileError.textContent = err?.message || 'Failed to save profile.';
        }
    });

    reconsentAcceptBtn?.addEventListener('click', async () => {
        try {
            if (reconsentError) reconsentError.textContent = '';
            if (!reconsentCheckbox?.checked) {
                if (reconsentError) reconsentError.textContent = 'Please confirm agreement before continuing.';
                return;
            }
            const session = await window.SupabaseApp?.getSession?.();
            const uid = session?.user?.id;
            if (!uid) throw new Error('Please sign in first.');
            const acceptedAt = new Date().toISOString();
            await window.SupabaseApp?.saveTermsConsent?.({ userId: uid, acceptedAt });
            setTermsState({ accepted: true, acceptedAt });
            showReconsentModal(false);
        } catch (err) {
            if (reconsentError) reconsentError.textContent = err?.message || 'Failed to save your agreement.';
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
        // red/blue is now inside Lazy Eye Level 6
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
