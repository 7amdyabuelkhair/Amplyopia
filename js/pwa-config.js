// PWA + push configuration (safe to edit)
window.PWA_CONFIG = {
  VERSION_URL: '/version.json',
  SESSION_DURATION_MS: 40 * 60 * 1000,
  NOTIFICATION_ICON: '/images/boy.png',
  APP_LOGO: '/images/boy.png',
  // Web Push VAPID public key (generate with web-push / Supabase docs)
  VAPID_PUBLIC_KEY: '',
  // Emails allowed to open admin dashboard (also set is_admin in Supabase profiles)
  ADMIN_EMAILS: []
};
