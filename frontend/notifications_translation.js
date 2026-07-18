// ════════════════════════════════════════════════════════════════════════
//  notifications_translation.js
//  Two features that make HazardAlert accessible and pro-active:
//  1. Push Notifications (Web Push API — no Firebase key needed)
//  2. Dynamic Translation (MyMemory free API — no key needed)
// ════════════════════════════════════════════════════════════════════════

const HazardNotifications = {
  _swReg: null,
  _translCache: new Map(),
  API: window.API_BASE || 'http://localhost:5000',

  async init() {
    this._registerServiceWorker();
    this._addNotificationButton();
    this._injectTranslateButtons();
    this._watchLanguageSwitch();
    console.log('🔔 Notifications + 🌐 Translation — initialized');
  },

  // ══════════════════════════════════════════════════════════════════
  //  1. 🔔 BROWSER PUSH NOTIFICATIONS
  // ══════════════════════════════════════════════════════════════════

  async _registerServiceWorker() {
    if (!('serviceWorker' in navigator)) return;
    try {
      this._swReg = await navigator.serviceWorker.register('/service-worker.js', { scope: '/' });
      console.log('✅ Service Worker registered');

      // Listen for messages from SW
      navigator.serviceWorker.addEventListener('message', e => {
        if (e.data?.type === 'HAZARD_FIXED') {
          this._showToast(`✅ Hazard #${e.data.hazardId} in your area was fixed!`, 'success');
        }
      });
    } catch (e) { console.warn('SW registration failed:', e.message); }
  },

  async _requestNotificationPermission() {
    if (!('Notification' in window)) {
      alert('Push notifications are not supported in this browser.');
      return false;
    }
    if (Notification.permission === 'granted') return true;
    if (Notification.permission === 'denied') {
      alert('Notifications are blocked. Please enable them in browser settings.');
      return false;
    }
    const perm = await Notification.requestPermission();
    return perm === 'granted';
  },

  _addNotificationButton() {
    const existing = document.getElementById('notif-enable-btn');
    if (existing) return;

    // Only show if notifications not yet granted
    if (Notification.permission === 'granted') {
      this._showActiveNotifBadge();
      return;
    }

    const btn = document.createElement('button');
    btn.id = 'notif-enable-btn';
    btn.innerHTML = '🔔 Enable Alerts';
    btn.title = 'Get phone notifications when hazards near you are fixed or new ones appear';
    btn.style.cssText = `
      position: fixed; bottom: 20px; right: 20px; z-index: 9993;
      background: linear-gradient(135deg, #f59e0b, #d97706);
      color: #fff; border: none; border-radius: 24px;
      padding: 12px 20px; font-weight: 800; font-size: 13px;
      cursor: pointer; box-shadow: 0 4px 20px rgba(245,158,11,0.4);
      animation: notif-bounce 2s infinite;
    `;

    const style = document.createElement('style');
    style.textContent = `
      @keyframes notif-bounce { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-6px)} }
      #notif-enable-btn:hover { transform: scale(1.05) !important; animation: none !important; }
    `;
    document.head.appendChild(style);

    btn.onclick = async () => {
      const granted = await this._requestNotificationPermission();
      if (granted) {
        btn.remove();
        this._showActiveNotifBadge();
        this._sendTestNotification();
        this._scheduleProximityAlerts();
      }
    };

    // Show after 3 seconds so it doesn't appear immediately
    setTimeout(() => document.body.appendChild(btn), 3000);
  },

  _showActiveNotifBadge() {
    const badge = document.createElement('div');
    badge.id = 'notif-active-badge';
    badge.title = 'Push notifications active';
    badge.style.cssText = `
      position: fixed; bottom: 20px; right: 20px; z-index: 9993;
      background: #22c55e; color: #fff; border-radius: 20px;
      padding: 8px 14px; font-size: 11px; font-weight: 700;
      box-shadow: 0 2px 12px rgba(34,197,94,0.4);
    `;
    badge.innerHTML = '🔔 Alerts Active';
    document.body.appendChild(badge);
    this._scheduleProximityAlerts();
  },

  _sendTestNotification() {
    if (Notification.permission !== 'granted') return;
    new Notification('🚨 HazardAlert — Notifications Active!', {
      body: 'You will now receive alerts when hazards near you are fixed or new critical hazards appear.',
      icon: '/favicon.ico',
      tag: 'welcome'
    });
  },

  // Send browser notifications for new hazards found via Socket.io or polling
  _scheduleProximityAlerts() {
    // Poll for new critical hazards every 10 minutes
    setInterval(async () => {
      try {
        const pos = await new Promise(r => navigator.geolocation.getCurrentPosition(r, () => r(null)));
        if (!pos) return;
        const { latitude: lat, longitude: lng } = pos.coords;
        const r = await fetch(`${this.API}/api/hazards?lat=${lat}&lng=${lng}&radius=1000&severity=critical&limit=3`);
        const data = await r.json();
        const hazards = data.hazards || [];
        if (hazards.length > 0 && Notification.permission === 'granted') {
          new Notification(`🚨 ${hazards.length} Critical Hazard${hazards.length > 1 ? 's' : ''} Near You!`, {
            body: `${hazards[0].hazard_type || hazards[0].type} reported ${Math.round(hazards[0].distance || 0)}m away. Tap to view.`,
            icon: '/favicon.ico',
            tag: 'nearby-hazard',
            requireInteraction: true
          });
        }
      } catch {}
    }, 10 * 60 * 1000);
  },

  // Called from app.js when a hazard is marked resolved
  notifyHazardFixed(hazardId, type, location) {
    if (Notification.permission !== 'granted') return;
    new Notification('✅ Hazard Fixed!', {
      body: `${type} at ${location} has been resolved by GHMC. Thank you for reporting!`,
      icon: '/favicon.ico',
      tag: `fixed-${hazardId}`
    });
  },

  _showToast(msg, type = 'info') {
    if (window.UI?.showToast) { window.UI.showToast(msg, type); return; }
    const t = document.createElement('div');
    t.style.cssText = `position:fixed;bottom:80px;right:20px;z-index:99999;background:${type==='success'?'#22c55e':'#3b82f6'};color:#fff;padding:12px 20px;border-radius:12px;font-weight:700;font-size:13px;box-shadow:0 4px 20px rgba(0,0,0,0.2);`;
    t.textContent = msg;
    document.body.appendChild(t);
    setTimeout(() => t.remove(), 4000);
  },

  // ══════════════════════════════════════════════════════════════════
  //  2. 🌐 DYNAMIC TRANSLATION (MyMemory free API — no key needed)
  // ══════════════════════════════════════════════════════════════════

  _currentLang: 'en',
  _langMap: { 'en': 'en', 'te': 'te', 'hi': 'hi' },

  async translateText(text, targetLang) {
    if (!text || targetLang === 'en') return text;
    const key = `${targetLang}::${text.slice(0, 50)}`;
    if (this._translCache.has(key)) return this._translCache.get(key);

    try {
      const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=en|${targetLang}`;
      const r = await fetch(url);
      const data = await r.json();
      const translated = data?.responseData?.translatedText || text;
      this._translCache.set(key, translated);
      return translated;
    } catch {
      return text; // Fallback to original on error
    }
  },

  _injectTranslateButtons() {
    const _run = () => {
      document.querySelectorAll('.hazard-description, .hazard-desc, [class*="description"]').forEach(el => {
        if (el.dataset.translateInjected || !el.textContent.trim()) return;
        el.dataset.translateInjected = '1';
        el.dataset.originalText = el.textContent.trim();
        const btn = document.createElement('button');
        btn.className = 'translate-btn';
        btn.style.cssText = 'margin-left:8px;padding:2px 8px;font-size:10px;border:1px solid #cbd5e1;border-radius:10px;background:#f8fafc;color:#64748b;cursor:pointer;vertical-align:middle;';
        btn.innerHTML = '🌐 Translate';
        btn.onclick = async () => {
          if (this._currentLang === 'en') return;
          btn.innerHTML = '⏳';
          const translated = await this.translateText(el.dataset.originalText, this._currentLang);
          el.textContent = translated;
          el.appendChild(btn);
          btn.innerHTML = '🔄 Original';
          btn.onclick = () => {
            el.textContent = el.dataset.originalText;
            el.appendChild(btn);
            btn.innerHTML = '🌐 Translate';
            btn.onclick = async () => {
              btn.innerHTML = '⏳';
              const t2 = await this.translateText(el.dataset.originalText, this._currentLang);
              el.textContent = t2;
              el.appendChild(btn);
              btn.innerHTML = '🔄 Original';
            };
          };
        };
        el.appendChild(btn);
      });
    };
    // Debounced — fires at most once per 500ms to avoid constant DOM scanning
    let _t = null;
    const obs = new MutationObserver(() => { clearTimeout(_t); _t = setTimeout(_run, 500); });
    obs.observe(document.body, { childList: true, subtree: true });
  },

  _watchLanguageSwitch() {
    // Hook into the existing language switcher in app.js
    const langBtns = document.querySelectorAll('[data-lang], .lang-btn, #lang-en, #lang-te, #lang-hi');
    langBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const lang = btn.dataset.lang || btn.id?.replace('lang-', '') || 'en';
        this._currentLang = lang;
        // Auto-translate all visible descriptions when language switches
        if (lang !== 'en') this._autoTranslateVisible(lang);
      });
    });

    // Debounced — fires at most once per 500ms
    let _t2 = null;
    const obs = new MutationObserver(() => {
      clearTimeout(_t2);
      _t2 = setTimeout(() => {
        document.querySelectorAll('[data-lang]:not([data-langWatched])').forEach(btn => {
          btn.dataset.langWatched = '1';
          btn.addEventListener('click', () => {
            const lang = btn.dataset.lang || 'en';
            this._currentLang = lang;
            if (lang !== 'en') this._autoTranslateVisible(lang);
          });
        });
      }, 500);
    });
    obs.observe(document.body, { childList: true, subtree: true });
  },

  async _autoTranslateVisible(lang) {
    const elements = document.querySelectorAll('[data-original-text]');
    for (const el of elements) {
      if (!el.checkVisibility?.() && el.offsetParent === null) continue; // Skip hidden
      const btn = el.querySelector('.translate-btn');
      if (btn) { btn.innerHTML = '⏳'; }
      const translated = await this.translateText(el.dataset.originalText, lang);
      el.textContent = translated;
      if (btn) { el.appendChild(btn); btn.innerHTML = '🔄 Original'; }
    }
  }
};

// ── Auto-init ─────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  setTimeout(() => HazardNotifications.init(), 2000);
});

// ── Export for use by app.js ───────────────────────────────────────
window.HazardNotifications = HazardNotifications;
