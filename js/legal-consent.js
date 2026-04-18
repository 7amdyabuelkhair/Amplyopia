(() => {
  const COOKIE_KEY = 'amplyopia_cookie_consent_v1';
  const COOKIE_AT_KEY = 'amplyopia_cookie_consent_at';

  function ensureLegalStyles() {
    if (document.getElementById('legal-consent-style')) return;
    const style = document.createElement('style');
    style.id = 'legal-consent-style';
    style.textContent = `
      .legal-consent-banner{position:fixed;left:16px;right:16px;bottom:16px;z-index:1300;background:#161a2be6;color:#fff;border-radius:14px;padding:14px;display:flex;gap:12px;align-items:center;justify-content:space-between;flex-wrap:wrap;box-shadow:0 10px 28px rgba(0,0,0,.35)}
      .legal-consent-banner p{margin:0;font-size:14px;line-height:1.45}
      .legal-consent-banner .btn-accept{border:none;border-radius:10px;padding:10px 16px;font-weight:700;cursor:pointer;background:#ffd65e;color:#1f1f2e}
      .legal-consent-links{margin-left:8px;white-space:nowrap}
      .legal-consent-links a{color:inherit;font-weight:700;text-decoration:underline}
      .legal-modal{position:fixed;inset:0;background:rgba(20,20,30,.58);display:flex;align-items:center;justify-content:center;z-index:1400;padding:20px}
      .legal-modal-card{width:min(520px,100%);background:#fff;border-radius:16px;padding:20px;border:1px solid #e8e7f3;box-shadow:0 15px 45px rgba(0,0,0,.25);display:grid;gap:10px}
      .legal-modal-card h2{margin:0;color:#202244;font-size:22px}
      .legal-modal-card p{margin:0;color:#404360}
      .legal-modal-card label{display:flex;gap:8px;align-items:flex-start}
      .legal-modal-card input[type=checkbox]{margin-top:3px}
      .legal-modal-card .btn-primary{border:none;border-radius:10px;background:#4f46e5;color:#fff;padding:10px 14px;font-weight:700;cursor:pointer}
      .legal-modal-card .error{min-height:18px;color:#cf2836;font-size:13px;font-weight:600}
    `;
    document.head.appendChild(style);
  }

  function ensureFooterLegalLinks() {
    const footer = document.querySelector('footer.site-footer');
    if (!footer) return;
    if (footer.querySelector('[data-legal-footer-links]')) return;
    const container = footer.querySelector('.container') || footer;
    const block = document.createElement('p');
    block.setAttribute('data-legal-footer-links', '1');
    block.innerHTML = '<a href="terms.html">Terms &amp; Conditions</a> | <a href="privacy.html">Privacy Policy</a>';
    container.appendChild(block);
  }

  function showCookieBannerIfNeeded() {
    if (localStorage.getItem(COOKIE_KEY) === 'true') return;
    const banner = document.createElement('div');
    banner.className = 'legal-consent-banner';
    banner.innerHTML = `
      <p>
        We collect limited data (email, age, and game scores) to run and improve your Amplyopia experience.
        <span class="legal-consent-links"><a href="privacy.html">Privacy Policy</a> • <a href="terms.html">Terms</a></span>
      </p>
      <button class="btn-accept" type="button">Accept</button>
    `;
    banner.querySelector('.btn-accept')?.addEventListener('click', () => {
      localStorage.setItem(COOKIE_KEY, 'true');
      localStorage.setItem(COOKIE_AT_KEY, new Date().toISOString());
      banner.remove();
    });
    document.body.appendChild(banner);
  }

  async function showReconsentForExistingSignedInUsers() {
    const hasSupabase = !!window.SupabaseApp?.getSession;
    if (!hasSupabase) return;
    if (document.getElementById('terms-reconsent-modal')) return;

    try {
      const session = await window.SupabaseApp.getSession();
      const uid = session?.user?.id;
      if (!uid) return;

      const profile = await window.SupabaseApp?.getProfile?.(uid);
      if (profile?.accepted_terms === true) return;

      const modal = document.createElement('div');
      modal.className = 'legal-modal';
      modal.innerHTML = `
        <div class="legal-modal-card" role="dialog" aria-modal="true" aria-label="Terms agreement">
          <h2>Agreement required</h2>
          <p>Please agree to the latest Terms &amp; Conditions and Privacy Policy to continue.</p>
          <label>
            <input id="legal-reconsent-checkbox" type="checkbox">
            <span>I agree to the <a href="terms.html" target="_blank" rel="noopener">Terms &amp; Conditions</a> and <a href="privacy.html" target="_blank" rel="noopener">Privacy Policy</a>.</span>
          </label>
          <p class="error" id="legal-reconsent-error"></p>
          <button type="button" class="btn-primary" id="legal-reconsent-accept">Accept and Continue</button>
        </div>
      `;

      const errEl = modal.querySelector('#legal-reconsent-error');
      modal.querySelector('#legal-reconsent-accept')?.addEventListener('click', async () => {
        const checked = modal.querySelector('#legal-reconsent-checkbox')?.checked;
        if (!checked) {
          if (errEl) errEl.textContent = 'Please check the agreement box first.';
          return;
        }
        try {
          const acceptedAt = new Date().toISOString();
          await window.SupabaseApp?.saveTermsConsent?.({ userId: uid, acceptedAt });
          localStorage.setItem('accepted_terms', 'true');
          localStorage.setItem('accepted_terms_at', acceptedAt);
          modal.remove();
        } catch (error) {
          if (errEl) errEl.textContent = error?.message || 'Could not save your agreement.';
        }
      });

      document.body.appendChild(modal);
    } catch (_) {
      // Silent fallback: avoid blocking the page if profile lookup is unavailable.
    }
  }

  document.addEventListener('DOMContentLoaded', () => {
    ensureLegalStyles();
    ensureFooterLegalLinks();
    showCookieBannerIfNeeded();
    showReconsentForExistingSignedInUsers();
  });
})();
