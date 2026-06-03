document.addEventListener('DOMContentLoaded', () => {
    const yearEl = document.getElementById('year');
    if (yearEl) yearEl.textContent = String(new Date().getFullYear());

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
            img1.src = 'images/boy-instruction-1.jpg';
            img2.src = 'images/girl-instruction-3.png';
            img3.src = 'images/boy-instruction-2.jpg';
        }
    }

    applyThemeFromStoredGender();
    setInstructionImagesByGender();

    function updateProgress(step) {
        document.querySelectorAll('.progress-step').forEach((el, index) => {
            el.classList.toggle('active', index + 1 <= step);
        });
    }

    function showStep(step) {
        document.querySelectorAll('.wizard-step').forEach((el) => el.classList.remove('active'));
        const stepEl = document.getElementById(`step-${step}`);
        if (stepEl) {
            stepEl.classList.add('active');
            updateProgress(step);
        }
        currentStep = step;
    }

    function goSignInStep() {
        showStep(2);
        progressIndicator?.classList.remove('hidden');
    }

    function goServices() {
        profileComplete = true;
        showStep(3);
        progressIndicator?.classList.add('hidden');
        const prevOnServices = document.querySelector('#step-3 .btn-prev');
        if (prevOnServices) prevOnServices.classList.add('hidden');
        const indexPath = window.SupabaseApp?.getAppIndexPath?.() || 'index.html';
        try {
            window.history.replaceState(null, '', `${indexPath}#services`);
        } catch (_) {}
    }

    function showInstructions() {
        showStep(1);
        progressIndicator?.classList.remove('hidden');
    }

    const userChip = document.getElementById('user-chip');
    const userChipName = document.getElementById('user-chip-name');
    const userChipAvatar = document.getElementById('user-chip-avatar');
    const navSignoutBtn = document.getElementById('nav-signout-btn');
    const navDashboardLink = document.getElementById('nav-dashboard-link');

    function updateNav(isSignedIn) {
        navSignoutBtn?.classList.toggle('hidden', !isSignedIn);
        navDashboardLink?.classList.toggle('hidden', !isSignedIn);
        userChip?.classList.toggle('hidden', !isSignedIn);
        if (isSignedIn) {
            const nm = localStorage.getItem('userName') || 'Dashboard';
            const gender = localStorage.getItem('userGender');
            if (userChipName) userChipName.textContent = nm;
            if (userChipAvatar) {
                userChipAvatar.src =
                    window.Branding?.getAvatarImg?.(gender) || 'images/logo/yellow-favicon-96x96.png';
            }
        }
    }

    function clearLocalUser() {
        localStorage.removeItem('userGender');
        localStorage.removeItem('userBirthdate');
        localStorage.removeItem('userAge');
        localStorage.removeItem('userName');
    }

    let authApi = null;

    window.nextStep = async function () {
        if (currentStep === 1) {
            const session = await window.SupabaseApp?.getSession?.();
            if (session?.user?.id) {
                await authApi?.routeSignedInUser?.(session);
                return;
            }
            goSignInStep();
            return;
        }
        if (currentStep === 2) {
            const session = await window.SupabaseApp?.getSession?.();
            if (session?.user?.id) {
                await authApi?.routeSignedInUser?.(session);
                return;
            }
        }
        if (currentStep < totalSteps) showStep(currentStep + 1);
    };

    window.prevStep = function () {
        if (currentStep === 3 && profileComplete) return;
        if (currentStep > 1) showStep(currentStep - 1);
    };

    authApi = window.AuthWizard.init({
        showStep,
        goServices,
        goSignInStep,
        showInstructions,
        updateNav,
        setProfileComplete: (v) => {
            profileComplete = !!v;
        },
        getProfileComplete: () => profileComplete,
        onProfileSaved: () => setInstructionImagesByGender(),
        onSignOut: () => {
            clearLocalUser();
            window.Branding?.applyFromGender?.(null);
            document.body.classList.remove('theme-boy', 'theme-girl');
            document.body.classList.add('theme-guest');
            setInstructionImagesByGender();
            showInstructions();
        }
    });

    navSignoutBtn?.addEventListener('click', async () => {
        await window.SupabaseApp?.signOut?.();
        clearLocalUser();
        window.Branding?.applyFromGender?.(null);
        document.body.classList.remove('theme-boy', 'theme-girl');
        document.body.classList.add('theme-guest');
        setInstructionImagesByGender();
        authApi?.showLoginForm?.();
        updateNav(false);
        showInstructions();
    });

    document.querySelector('.menu-toggle')?.addEventListener('click', (e) => {
        const btn = e.currentTarget;
        const nav = document.getElementById('site-nav');
        const open = btn.getAttribute('aria-expanded') === 'true';
        btn.setAttribute('aria-expanded', String(!open));
        nav?.classList.toggle('active');
    });

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

    document.getElementById('back-btn')?.addEventListener('click', () => {
        if (profileComplete) window.location.href = 'index.html#services';
        else if (window.history.length > 1) window.history.back();
        else window.location.href = 'index.html';
    });

    window.addEventListener('hashchange', () => {
        if (window.location.hash === '#services') void authApi?.tryGoServices?.();
    });
});
