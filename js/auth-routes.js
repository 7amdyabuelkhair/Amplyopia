(() => {
  const DASHBOARD = 'dashboard.html';
  const SIGN_IN = 'index.html?signin=1';

  window.AuthRoutes = {
    dashboard: DASHBOARD,
    signIn: SIGN_IN,
    goToDashboard() {
      window.location.replace(DASHBOARD);
    },
    goToSignIn() {
      window.location.replace(SIGN_IN);
    }
  };
})();
