(() => {
  const ASSETS = {
    boy: {
      themeColor: '#b9dcff',
      backgroundColor: '#f4f9ff',
      faviconIco: '/images/logo/blue-favicon.ico',
      faviconSvg: '/images/logo/blue-favicon.svg',
      faviconPng: '/images/logo/blue-favicon-96x96.png',
      appleTouch: '/images/logo/blue-apple-touch-icon.png',
      logoImg: '/images/logo/blue-favicon-96x96.png',
      avatarImg: '/images/boy.png',
      manifest: '/manifest-boy.json',
      icon192: '/images/logo/blue-web-app-manifest-192x192.png',
      icon512: '/images/logo/blue-web-app-manifest-512x512.png'
    },
    girl: {
      themeColor: '#ffc4c4',
      backgroundColor: '#fbfaef',
      faviconIco: '/images/logo/pink-favicon.ico',
      faviconSvg: '/images/logo/pink-favicon.svg',
      faviconPng: '/images/logo/pink-favicon-96x96.png',
      appleTouch: '/images/logo/pink-apple-touch-icon.png',
      logoImg: '/images/logo/pink-favicon-96x96.png',
      avatarImg: '/images/girl.png',
      manifest: '/manifest-girl.json',
      icon192: '/images/logo/pink-web-app-manifest-192x192.png',
      icon512: '/images/logo/pink-web-app-manifest-512x512.png'
    },
    guest: {
      themeColor: '#ffe066',
      backgroundColor: '#fff9d6',
      faviconIco: '/images/logo/yellow-favicon.ico',
      faviconSvg: '/images/logo/yellow-favicon.svg',
      faviconPng: '/images/logo/yellow-favicon-96x96.png',
      appleTouch: '/images/logo/yellow-apple-touch-icon.png',
      logoImg: '/images/logo/yellow-favicon-96x96.png',
      avatarImg: '/images/logo/yellow-favicon-96x96.png',
      manifest: '/manifest-guest.json',
      icon192: '/images/logo/yellow-web-app-manifest-192x192.png',
      icon512: '/images/logo/yellow-web-app-manifest-512x512.png'
    }
  };

  function themeFromGender(gender) {
    const g = String(gender || '').trim().toLowerCase();
    if (g === 'boy') return 'boy';
    if (g === 'girl') return 'girl';
    return 'guest';
  }

  function getAssets(theme) {
    const key = themeFromGender(theme);
    const pack = ASSETS[key];
    return { key, ...pack, avatarImg: pack.avatarImg || pack.logoImg };
  }

  function getAvatarImg(themeOrGender) {
    return getAssets(themeOrGender).avatarImg;
  }

  function setLink(id, rel, href, extra = {}) {
    let el = document.getElementById(id);
    if (!el) {
      el = document.createElement('link');
      el.id = id;
      el.rel = rel;
      document.head.appendChild(el);
    }
    el.href = href;
    Object.entries(extra).forEach(([k, v]) => {
      if (v == null) el.removeAttribute(k);
      else el.setAttribute(k, v);
    });
  }

  function applyBranding(themeOrGender) {
    const { key, faviconIco, faviconSvg, faviconPng, appleTouch, logoImg, manifest, themeColor } =
      getAssets(themeOrGender);

    setLink('app-favicon-ico', 'icon', faviconIco, { sizes: 'any' });
    setLink('app-favicon-svg', 'icon', faviconSvg, { type: 'image/svg+xml' });
    setLink('app-favicon-png', 'icon', faviconPng, { type: 'image/png', sizes: '96x96' });
    setLink('app-apple-touch', 'apple-touch-icon', appleTouch);
    setLink('app-manifest', 'manifest', manifest);

    let themeMeta = document.querySelector('meta[name="theme-color"]');
    if (!themeMeta) {
      themeMeta = document.createElement('meta');
      themeMeta.name = 'theme-color';
      document.head.appendChild(themeMeta);
    }
    themeMeta.content = themeColor;

    document.querySelectorAll('.logo-img, #site-logo-img').forEach((img) => {
      const useAvatar = img.dataset.branding === 'avatar';
      img.src = useAvatar ? getAvatarImg(themeOrGender) : logoImg;
      img.style.display = '';
    });

    document.querySelectorAll('[data-branding="avatar"]').forEach((img) => {
      if (!img.classList.contains('logo-img') && img.id !== 'site-logo-img') {
        img.src = getAvatarImg(themeOrGender);
      }
    });

    if (window.PWA_CONFIG) {
      window.PWA_CONFIG.NOTIFICATION_ICON = logoImg;
      window.PWA_CONFIG.APP_LOGO = logoImg;
    }

    document.body.classList.remove('theme-boy', 'theme-girl', 'theme-guest');
    if (key === 'boy') document.body.classList.add('theme-boy');
    else if (key === 'girl') document.body.classList.add('theme-girl');
    else document.body.classList.add('theme-guest');

    return key;
  }

  function applyFromGender(gender) {
    return applyBranding(themeFromGender(gender));
  }

  async function applyFromAuthState() {
    let gender = localStorage.getItem('userGender');
    try {
      if (window.SupabaseApp?.getSession) {
        const session = await window.SupabaseApp.getSession();
        if (session?.user?.id && window.SupabaseApp?.getProfile) {
          const profile = await window.SupabaseApp.getProfile(session.user.id);
          if (profile?.gender) gender = profile.gender;
        } else if (!session?.user?.id) {
          gender = null;
        }
      }
    } catch (_) {
      // keep localStorage gender
    }
    return applyFromGender(gender);
  }

  window.Branding = {
    ASSETS,
    themeFromGender,
    getAssets,
    getAvatarImg,
    applyBranding,
    applyFromGender,
    applyFromAuthState
  };

  document.addEventListener('DOMContentLoaded', () => {
    applyFromGender(localStorage.getItem('userGender'));
    setTimeout(() => applyFromAuthState(), 0);
    window.SupabaseApp?.onAuthStateChange?.(() => applyFromAuthState());
  });
})();
