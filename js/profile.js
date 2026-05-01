(() => {
  function computeAgeFromBirthdate(birthdateStr) {
    if (!birthdateStr) return null;
    const d = new Date(birthdateStr);
    if (Number.isNaN(d.getTime())) return null;
    const now = new Date();
    let age = now.getFullYear() - d.getFullYear();
    const m = now.getMonth() - d.getMonth();
    if (m < 0 || (m === 0 && now.getDate() < d.getDate())) age--;
    return age >= 0 ? age : null;
  }

  function applyThemeFromGender(gender) {
    const g = String(gender || '').toLowerCase();
    document.body.classList.remove('theme-boy', 'theme-girl');
    if (g === 'boy') document.body.classList.add('theme-boy');
    if (g === 'girl') document.body.classList.add('theme-girl');
  }

  window.Profile = {
    computeAgeFromBirthdate,
    applyThemeFromGender
  };
})();

