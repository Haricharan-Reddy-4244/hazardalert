// ════════════════════════════════════════════════════════════════════════
//  🏙️ UNIQUE FEATURES — Three features NO other civic app in the world has:
//
//  1. CITY HEALTH SCORE — Live 0-100 real-time road health of Hyderabad
//  2. QR CODE STICKER GENERATOR — Physical+digital reporting convergence
//  3. LIVE RESOLUTION TIMER — Ticking shame clock on unresolved hazards
// ════════════════════════════════════════════════════════════════════════

const UniqueFeatures = {
  API: window.API_BASE || 'http://localhost:5000',

  async init() {
    this.injectStyles();
    await this.initCityHealthScore();
    this.initQRGenerator();
    this.initLiveTimers();
    console.log('🏙️ UniqueFeatures: City Health, QR Generator, Live Timers — all active');
  },

  // ── STYLES ─────────────────────────────────────────────────────────
  injectStyles() {
    if (document.getElementById('uf-styles')) return;
    const s = document.createElement('style');
    s.id = 'uf-styles';
    s.textContent = `
      /* ═══ CITY HEALTH SCORE WIDGET ═══ */
      #city-health-widget {
        position: fixed; bottom: 20px; left: 20px; z-index: 9990;
        border-radius: 18px; padding: 14px 18px; min-width: 170px;
        box-shadow: 0 8px 32px rgba(0,0,0,0.4);
        cursor: pointer; transition: transform 0.2s;
        backdrop-filter: blur(12px);
        background: rgba(17,24,39,0.85);
        color: #f1f5f9;
        border: 1px solid rgba(255,255,255,0.08);
      }
      #city-health-widget:hover { transform: translateY(-3px) scale(1.02); box-shadow: 0 12px 40px rgba(0,0,0,0.5); }
      .ch-label { font-size: 9px; font-weight: 800; text-transform: uppercase; letter-spacing: 1px; color: #64748b; }
      .ch-score-row { display: flex; align-items: center; gap: 8px; margin: 4px 0 2px; }
      .ch-score { font-size: 34px; font-weight: 900; line-height: 1; }
      .ch-grade { font-size: 22px; font-weight: 900; opacity: 0.7; }
      .ch-status { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; }
      .ch-bar-track { height: 5px; background: rgba(148,163,184,0.15); border-radius: 3px; margin-top: 6px; }
      .ch-bar-fill  { height: 100%; border-radius: 3px; transition: width 1.5s cubic-bezier(.22,1,.36,1); }
      .ch-pulse { width: 8px; height: 8px; border-radius: 50%; background: #22c55e; display: inline-block; margin-left: 4px; animation: uf-blink 2s infinite; }
      @keyframes uf-blink { 0%,100%{opacity:1} 50%{opacity:0.2} }

      /* Health detail modal */
      #city-health-modal {
        position: fixed; inset: 0; z-index: 99993; background: rgba(0,0,0,0.7);
        backdrop-filter: blur(4px);
        display: flex; align-items: center; justify-content: center; padding: 20px;
      }
      .ch-modal-inner {
        background: rgba(17,24,39,0.95); border-radius: 20px; padding: 28px; max-width: 460px; width: 100%;
        box-shadow: 0 30px 80px rgba(0,0,0,0.5); color: #f1f5f9;
        border: 1px solid rgba(255,255,255,0.08);
      }
      .ch-modal-score-big { font-size: 72px; font-weight: 900; text-align: center; line-height: 1; }
      .ch-deduction-row { display: flex; justify-content: space-between; align-items: center; padding: 8px 0; border-bottom: 1px solid rgba(255,255,255,0.06); font-size: 13px; }
      .ch-ded-label { color: #94a3b8; }
      .ch-ded-val { font-weight: 800; color: #f87171; }

      /* ═══ QR CODE GENERATOR ═══ */
      #qr-nav-btn {
        background: linear-gradient(135deg, #1d4ed8, #1e40af);
        color: #fff !important; border: none; border-radius: 8px;
        padding: 7px 14px; font-weight: 700; cursor: pointer;
        box-shadow: 0 0 10px rgba(29,78,216,0.4);
      }
      #qr-panel {
        position: fixed; inset: 0; z-index: 99994; background: rgba(0,0,0,0.75);
        backdrop-filter: blur(4px); display: flex; align-items: center; justify-content: center; padding: 20px;
      }
      .qr-inner {
        background: rgba(17,24,39,0.95); border-radius: 20px; padding: 28px; max-width: 480px; width: 100%;
        box-shadow: 0 30px 80px rgba(0,0,0,0.5); text-align: center;
        color: #f1f5f9; border: 1px solid rgba(255,255,255,0.08);
      }
      .qr-inner h2 { margin: 0 0 4px; font-size: 20px; font-weight: 800; }
      .qr-inner p  { margin: 0 0 16px; font-size: 12px; color: #64748b; }
      #qr-image { border: 3px solid rgba(255,255,255,0.08); border-radius: 12px; margin: 12px auto; display: block; }
      .qr-input {
        width: 100%; padding: 10px 14px; border: 1.5px solid rgba(148,163,184,0.15); border-radius: 10px;
        font-size: 13px; margin-bottom: 10px; box-sizing: border-box;
        background: rgba(15,23,42,0.8); color: #f1f5f9;
      }
      .qr-btn-row { display: flex; gap: 8px; justify-content: center; flex-wrap: wrap; margin-top: 12px; }
      .qr-gen-btn { padding: 10px 20px; background: linear-gradient(135deg,#6366f1,#8b5cf6); color: #fff; border: none; border-radius: 10px; font-weight: 700; cursor: pointer; }
      .qr-print-btn { padding: 10px 20px; background: rgba(30,41,59,0.6); border: 1px solid rgba(148,163,184,0.1); color: #94a3b8; border-radius: 10px; font-weight: 700; cursor: pointer; }
      .qr-sticker-preview {
        border: 2px dashed rgba(148,163,184,0.15); border-radius: 12px; padding: 16px; margin-top: 16px;
        background: rgba(15,23,42,0.5); text-align: center;
      }
      [data-theme="dark"] .qr-sticker-preview { background: #0f172a; border-color: #334155; }
      .qr-sticker-title { font-size: 11px; font-weight: 800; color: #dc2626; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 4px; }
      .qr-sticker-sub { font-size: 10px; color: #64748b; margin-top: 4px; }

      /* ═══ LIVE RESOLUTION TIMER ═══ */
      .live-timer {
        font-size: 11px; font-weight: 800; color: #dc2626;
        font-family: 'Courier New', monospace; letter-spacing: 0.5px;
        background: #fee2e2; padding: 2px 8px; border-radius: 12px;
        display: inline-block; margin-top: 4px;
      }
      .live-timer-critical { animation: timer-pulse 1s infinite; }
      @keyframes timer-pulse { 0%,100%{opacity:1} 50%{opacity:0.6} }
    `;
    document.head.appendChild(s);
  },

  // ══════════════════════════════════════════════════════════════════
  //  1. 🏙️ CITY HEALTH SCORE
  // ══════════════════════════════════════════════════════════════════
  _healthData: null,

  async initCityHealthScore() {
    try {
      const res = await fetch(`${this.API}/api/intelligence/city-health`);
      const data = await res.json();
      if (!data.success) return;
      this._healthData = data.cityHealth;
      this._renderHealthWidget(data.cityHealth);
    } catch (e) { console.warn('City health unavailable:', e.message); }
  },

  _renderHealthWidget(h) {
    const el = document.createElement('div');
    el.id = 'city-health-widget';
    el.style.setProperty('--health-color', h.color);
    el.title = `Click for breakdown — ${h.message}`;
    el.onclick = () => this._openHealthModal(h);
    el.innerHTML = `
      <div class="ch-label">🏙️ City Health Score <span class="ch-pulse"></span></div>
      <div class="ch-score-row">
        <span class="ch-score" style="color:${h.color};">${h.score}</span>
        <span class="ch-grade" style="color:${h.color};">${h.grade}</span>
      </div>
      <div class="ch-status" style="color:${h.color};">${h.status}</div>
      <div class="ch-bar-track">
        <div class="ch-bar-fill" id="ch-bar" style="width:0%;background:${h.color};"></div>
      </div>
    `;
    document.body.appendChild(el);
    setTimeout(() => {
      const bar = document.getElementById('ch-bar');
      if (bar) bar.style.width = h.score + '%';
    }, 500);
    setInterval(() => this.initCityHealthScore(), 5 * 60 * 1000); // refresh every 5 min
  },

  _openHealthModal(h) {
    const ex = document.getElementById('city-health-modal');
    if (ex) { ex.remove(); return; }
    const m = document.createElement('div');
    m.id = 'city-health-modal';
    m.innerHTML = `
      <div class="ch-modal-inner">
        <h2 style="text-align:center;margin:0 0 4px;">🏙️ Hyderabad Road Health</h2>
        <p style="text-align:center;color:#64748b;font-size:12px;margin:0 0 16px;">Live score · Updates every 5 minutes</p>
        <div class="ch-modal-score-big" style="color:${h.color};">${h.score}</div>
        <div style="text-align:center;font-size:22px;font-weight:800;color:${h.color};margin-bottom:20px;">Grade ${h.grade} — ${h.status}</div>

        <div style="font-size:12px;font-weight:700;color:#64748b;margin-bottom:8px;">SCORE DEDUCTIONS (max -100)</div>
        <div class="ch-deduction-row"><span class="ch-ded-label">🚨 Critical hazards unresolved</span><span class="ch-ded-val">-${h.deductions.criticalHazards}</span></div>
        <div class="ch-deduction-row"><span class="ch-ded-label">⏱️ SLA breaches (overdue repairs)</span><span class="ch-ded-val">-${h.deductions.slaBreaches}</span></div>
        <div class="ch-deduction-row"><span class="ch-ded-label">📉 Low resolution rate</span><span class="ch-ded-val">-${h.deductions.lowResolution}</span></div>
        <div class="ch-deduction-row"><span class="ch-ded-label">📅 Oldest unresolved hazard age</span><span class="ch-ded-val">-${h.deductions.oldestHazardAge}</span></div>

        <div style="margin-top:16px;padding:12px;background:#f8fafc;border-radius:10px;font-size:12px;">
          <b>Live Stats:</b>
          Total: ${h.stats.total} · Pending: ${h.stats.pending} · Resolved: ${h.stats.resolved}<br>
          Critical pending: ${h.stats.critical_pending} · SLA breached: ${h.stats.sla_breached}<br>
          Resolution rate: ${h.stats.resolutionRate} · Oldest hazard: ${h.stats.oldestHazardDays} days
        </div>

        <button onclick="document.getElementById('city-health-modal').remove()"
          style="width:100%;margin-top:16px;padding:12px;background:#f1f5f9;border:none;border-radius:12px;font-weight:700;cursor:pointer;">Close</button>
      </div>
    `;
    m.addEventListener('click', e => { if (e.target === m) m.remove(); });
    document.body.appendChild(m);
  },

  // ══════════════════════════════════════════════════════════════════
  //  2. 📱 QR CODE STICKER GENERATOR
  // ══════════════════════════════════════════════════════════════════
  initQRGenerator() {
    if (document.getElementById('qr-nav-btn')) return;
    const btn = document.createElement('button');
    btn.id = 'qr-nav-btn';
    btn.className = 'nav-btn';
    btn.innerHTML = '📱 QR Sticker';
    btn.title = 'Generate a QR code sticker to stick near any hazard for instant reporting';
    btn.onclick = () => this.openQRPanel();

    const anchor = document.getElementById('rti-nav-btn') || document.getElementById('priority-nav-btn') || document.querySelector('.nav-btn:last-of-type');
    if (anchor) anchor.parentNode.insertBefore(btn, anchor.nextSibling);
    else {
      const nav = document.querySelector('nav, .desktop-nav, header');
      if (nav) nav.appendChild(btn);
      else { btn.style.cssText += ';position:fixed;top:14px;right:170px;z-index:9999;'; document.body.appendChild(btn); }
    }
  },

  _currentQRData: null,

  openQRPanel(prefill = {}) {
    const ex = document.getElementById('qr-panel');
    if (ex) { ex.remove(); return; }
    const p = document.createElement('div');
    p.id = 'qr-panel';
    p.innerHTML = `
      <div class="qr-inner">
        <h2>📱 QR Code Sticker Generator</h2>
        <p>Print this QR sticker and place it near the hazard. Anyone who scans it can report instantly with location pre-filled.</p>

        <input class="qr-input" id="qr-hazard-type" placeholder="Hazard type (e.g. Pothole, Open Manhole)" value="${prefill.type || ''}">
        <input class="qr-input" id="qr-location-name" placeholder="Location name (e.g. Ameerpet Junction)" value="${prefill.location || ''}">
        <input class="qr-input" id="qr-lat" placeholder="Latitude (e.g. 17.4375)" type="number" step="0.0001" value="${prefill.lat || ''}">
        <input class="qr-input" id="qr-lng" placeholder="Longitude (e.g. 78.4483)" type="number" step="0.0001" value="${prefill.lng || ''}">

        <div class="qr-btn-row">
          <button class="qr-gen-btn" onclick="UniqueFeatures.generateQR()">📱 Generate QR Code</button>
          <button class="qr-print-btn" onclick="document.getElementById('qr-panel').remove()">✕ Close</button>
        </div>

        <div id="qr-result" style="display:none;">
          <div class="qr-sticker-preview" id="qr-sticker-preview">
            <div class="qr-sticker-title" id="qr-sticker-title">⚠️ HAZARD REPORTED HERE</div>
            <img id="qr-image" width="180" height="180" alt="QR Code">
            <div class="qr-sticker-sub" id="qr-sticker-sub"></div>
            <div style="font-size:9px;color:#94a3b8;margin-top:6px;">Scan to view / verify this hazard report</div>
          </div>
          <div class="qr-btn-row">
            <button class="qr-gen-btn" onclick="UniqueFeatures.printQR()">🖨️ Print Sticker</button>
          </div>
        </div>
      </div>
    `;
    p.addEventListener('click', e => { if (e.target === p) p.remove(); });
    document.body.appendChild(p);
  },

  generateQR() {
    const type = document.getElementById('qr-hazard-type')?.value?.trim() || 'Hazard';
    const loc  = document.getElementById('qr-location-name')?.value?.trim() || 'Location';
    const lat  = document.getElementById('qr-lat')?.value?.trim();
    const lng  = document.getElementById('qr-lng')?.value?.trim();

    const appUrl = `${location.protocol}//${location.host || 'localhost:3001'}`;
    const params = new URLSearchParams({ type, location: loc, ...(lat && { lat }), ...(lng && { lng }) });
    const reportUrl = `${appUrl}/?${params.toString()}`;

    // Free QR API (no library needed)
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(reportUrl)}&bgcolor=ffffff&color=000000&margin=10`;

    const img = document.getElementById('qr-image');
    const titleEl = document.getElementById('qr-sticker-title');
    const subEl = document.getElementById('qr-sticker-sub');
    const resultDiv = document.getElementById('qr-result');

    if (img) img.src = qrUrl;
    if (titleEl) titleEl.textContent = `⚠️ ${type.toUpperCase()} HERE`;
    if (subEl) subEl.textContent = `📍 ${loc}`;
    if (resultDiv) resultDiv.style.display = 'block';

    this._currentQRData = { type, loc, qrUrl, reportUrl };
  },

  printQR() {
    if (!this._currentQRData) return;
    const { type, loc, qrUrl } = this._currentQRData;
    const win = window.open('', '_blank');
    win.document.write(`
      <html><head><title>HazardAlert QR Sticker</title>
      <style>
        body{font-family:Arial,sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;background:#fff;}
        .sticker{border:3px dashed #dc2626;border-radius:16px;padding:24px;text-align:center;max-width:280px;}
        .warn{font-size:28px;font-weight:900;color:#dc2626;letter-spacing:1px;margin-bottom:8px;}
        .type{font-size:15px;font-weight:800;color:#1e293b;margin-bottom:4px;}
        .loc{font-size:12px;color:#64748b;margin-bottom:12px;}
        img{border:2px solid #e2e8f0;border-radius:8px;display:block;margin:0 auto;}
        .tagline{font-size:10px;color:#94a3b8;margin-top:10px;}
        .brand{font-size:12px;font-weight:800;color:#dc2626;margin-top:8px;}
      </style></head>
      <body>
        <div class="sticker">
          <div class="warn">⚠️ HAZARD ALERT</div>
          <div class="type">${type}</div>
          <div class="loc">📍 ${loc}</div>
          <img src="${qrUrl}" width="200" height="200" alt="QR Code">
          <div class="tagline">Scan to view this hazard report & demand a fix</div>
          <div class="brand">🚨 HazardAlert — Civic Accountability Engine</div>
        </div>
      </body></html>
    `);
    win.document.close();
    setTimeout(() => win.print(), 500);
  },

  // ══════════════════════════════════════════════════════════════════
  //  3. ⏱️ LIVE RESOLUTION TIMER
  // ══════════════════════════════════════════════════════════════════
  initLiveTimers() {
    // Debounced MutationObserver — fires at most once per 300ms to avoid DOM thrash
    let _timerObsTimeout = null;
    const _injectTimers = () => {
      document.querySelectorAll('[data-created-at], .shame-card').forEach(card => {
        if (card.dataset.timerInjected) return;
        card.dataset.timerInjected = '1';
        const createdAt = card.dataset.createdAt ||
          card.querySelector('[data-created-at]')?.dataset.createdAt;
        if (!createdAt) return;
        const timerEl = document.createElement('div');
        timerEl.className = 'live-timer live-timer-critical';
        timerEl.dataset.since = createdAt;
        card.appendChild(timerEl);
      });
      document.querySelectorAll('.shame-days').forEach(el => {
        if (el.dataset.timerLive) return;
        el.dataset.timerLive = '1';
        const daysMatch = el.textContent.match(/(\d+)/);
        if (!daysMatch) return;
        const days = parseInt(daysMatch[1]);
        const fakeDate = new Date(Date.now() - days * 86400000);
        const timerEl = document.createElement('div');
        timerEl.className = 'live-timer' + (days > 30 ? ' live-timer-critical' : '');
        timerEl.dataset.since = fakeDate.toISOString();
        el.parentNode.insertBefore(timerEl, el.nextSibling);
      });
    };
    const obs = new MutationObserver(() => {
      clearTimeout(_timerObsTimeout);
      _timerObsTimeout = setTimeout(_injectTimers, 300);
    });
    obs.observe(document.body, { childList: true, subtree: true });

    // Update all timers using rAF — only repaints once per second max
    let _lastTick = 0;
    const _tick = (ts) => {
      if (ts - _lastTick >= 1000) {
        _lastTick = ts;
        document.querySelectorAll('.live-timer[data-since]').forEach(el => this._tickTimer(el));
      }
      requestAnimationFrame(_tick);
    };
    requestAnimationFrame(_tick);
  },

  _tickTimer(el) {
    const since = new Date(el.dataset.since);
    if (isNaN(since)) return;
    const ms = Date.now() - since;
    const days  = Math.floor(ms / 86400000);
    const hours = Math.floor((ms % 86400000) / 3600000);
    const mins  = Math.floor((ms % 3600000) / 60000);
    const secs  = Math.floor((ms % 60000) / 1000);
    el.textContent = `⏱ ${days}d ${hours}h ${mins}m ${secs}s UNRESOLVED`;
  },

  // ══════════════════════════════════════════════════════════════════
  //  4. ✅ CITIZEN VERIFY-FIXED BUTTON
  //  Crowd-sourced confirmation that a hazard has been resolved.
  //  Injected on every hazard card automatically.
  // ══════════════════════════════════════════════════════════════════
  initVerifyFixed() {
    // Debounced — fires at most once per 300ms
    let _vfObsTimeout = null;
    const _injectButtons = () => {
      document.querySelectorAll('.hazard-card, .shame-card, [data-hazard-id]').forEach(card => {
        if (card.dataset.verifyInjected) return;
        card.dataset.verifyInjected = '1';
        const hid = card.dataset.hazardId || card.querySelector('[data-hazard-id]')?.dataset.hazardId;
        if (!hid) return;
        const btn = document.createElement('button');
        btn.className = 'verify-fixed-btn';
        btn.innerHTML = '✅ I Confirm It\'s Fixed';
        btn.title = 'Report this hazard as resolved to help GHMC accountability tracking';
        btn.onclick = () => this._handleVerifyFixed(hid, btn, card);
        card.appendChild(btn);
      });
    };
    const obs = new MutationObserver(() => {
      clearTimeout(_vfObsTimeout);
      _vfObsTimeout = setTimeout(_injectButtons, 300);
    });
    obs.observe(document.body, { childList: true, subtree: true });
  },

  async _handleVerifyFixed(hazardId, btn, card) {
    btn.disabled = true;
    btn.innerHTML = '⏳ Submitting...';
    try {
      const r = await fetch(`${this.API}/api/intelligence/repair-verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hazardId, response: 'confirm', photoProof: null })
      });
      const data = await r.json();
      if (data.success || r.ok) {
        btn.innerHTML = '✅ Fixed! Thank you';
        btn.style.background = '#22c55e';
        btn.style.color = '#fff';
        setTimeout(() => {
          card.style.opacity = '0.4';
          card.style.transition = 'opacity 0.5s';
          card.title = 'Citizens confirmed this is fixed';
        }, 1000);
      } else {
        btn.innerHTML = '✅ I Confirm It\'s Fixed';
        btn.disabled = false;
      }
    } catch {
      btn.innerHTML = '✅ I Confirm It\'s Fixed';
      btn.disabled = false;
    }
  },

  // ══════════════════════════════════════════════════════════════════
  //  5. 📧 GHMC FORMAL EMAIL GENERATOR
  //  Creates a ready-to-copy complaint email to GHMC Commissioner
  //  with full legal notice and hazard details pre-filled.
  // ══════════════════════════════════════════════════════════════════
  initGHMCEmail() {
    if (document.getElementById('ghmc-email-btn')) return;
    const btn = document.createElement('button');
    btn.id = 'ghmc-email-btn';
    btn.className = 'nav-btn';
    btn.style.cssText = 'background:linear-gradient(135deg,#7c3aed,#6d28d9);color:#fff!important;border:none;border-radius:8px;padding:7px 14px;font-weight:700;cursor:pointer;box-shadow:0 0 10px rgba(124,58,237,0.4);';
    btn.innerHTML = '📧 Email GHMC';
    btn.title = 'Generate formal complaint email to GHMC Commissioner';
    btn.onclick = () => this._openGHMCEmailPanel();

    const anchor = document.getElementById('qr-nav-btn') || document.querySelector('.nav-btn:last-of-type');
    if (anchor) anchor.parentNode.insertBefore(btn, anchor.nextSibling);
    else {
      const nav = document.querySelector('nav, .desktop-nav, header');
      if (nav) nav.appendChild(btn);
      else { btn.style.position = 'fixed'; btn.style.top = '14px'; btn.style.right = '10px'; btn.style.zIndex = '9999'; document.body.appendChild(btn); }
    }
  },

  _openGHMCEmailPanel(prefill = {}) {
    const ex = document.getElementById('ghmc-email-panel');
    if (ex) { ex.remove(); return; }
    const p = document.createElement('div');
    p.id = 'ghmc-email-panel';
    p.style.cssText = 'position:fixed;inset:0;z-index:99995;background:rgba(0,0,0,0.75);backdrop-filter:blur(4px);display:flex;align-items:center;justify-content:center;padding:20px;';
    p.innerHTML = `
      <div style="background:#fff;border-radius:20px;padding:28px;max-width:540px;width:100%;box-shadow:0 30px 80px rgba(0,0,0,0.4);">
        <h2 style="margin:0 0 4px;font-size:20px;font-weight:800;">📧 GHMC Formal Complaint Email</h2>
        <p style="margin:0 0 16px;font-size:12px;color:#64748b;">Pre-filled official complaint email. Copy and send to GHMC Commissioner.</p>

        <input id="ge-name" placeholder="Your Name" style="width:100%;padding:10px;border:1.5px solid #e2e8f0;border-radius:10px;font-size:13px;margin-bottom:10px;box-sizing:border-box;" value="${prefill.name || ''}">
        <input id="ge-hazard" placeholder="Hazard type (e.g. Open Manhole at Ameerpet)" style="width:100%;padding:10px;border:1.5px solid #e2e8f0;border-radius:10px;font-size:13px;margin-bottom:10px;box-sizing:border-box;" value="${prefill.hazard || ''}">
        <input id="ge-days" placeholder="Days unresolved (e.g. 45)" type="number" style="width:100%;padding:10px;border:1.5px solid #e2e8f0;border-radius:10px;font-size:13px;margin-bottom:10px;box-sizing:border-box;" value="${prefill.days || ''}">
        <input id="ge-refno" placeholder="HazardAlert Report # (optional)" style="width:100%;padding:10px;border:1.5px solid #e2e8f0;border-radius:10px;font-size:13px;margin-bottom:10px;box-sizing:border-box;">

        <div style="display:flex;gap:8px;justify-content:center;margin-bottom:12px;">
          <button onclick="UniqueFeatures._generateGHMCEmail()" style="padding:10px 20px;background:#7c3aed;color:#fff;border:none;border-radius:10px;font-weight:700;cursor:pointer;">✉️ Generate Email</button>
          <button onclick="document.getElementById('ghmc-email-panel').remove()" style="padding:10px 20px;background:#f1f5f9;border:none;border-radius:10px;font-weight:700;cursor:pointer;">✕ Close</button>
        </div>

        <div id="ge-result" style="display:none;">
          <div style="font-size:11px;font-weight:700;color:#64748b;margin-bottom:6px;">GENERATED EMAIL (click to copy):</div>
          <textarea id="ge-text" readonly onclick="this.select();document.execCommand('copy');this.parentNode.querySelector('.ge-copied').style.display='block';" style="width:100%;height:220px;font-family:monospace;font-size:11px;border:1.5px solid #e2e8f0;border-radius:10px;padding:12px;box-sizing:border-box;resize:none;background:#f8fafc;cursor:pointer;"></textarea>
          <div class="ge-copied" style="display:none;color:#22c55e;font-weight:700;font-size:12px;margin-top:4px;">✅ Copied to clipboard!</div>
          <div style="display:flex;gap:8px;margin-top:8px;flex-wrap:wrap;">
            <button onclick="UniqueFeatures._mailtoGHMC()" style="padding:8px 16px;background:#dc2626;color:#fff;border:none;border-radius:8px;font-weight:700;cursor:pointer;font-size:12px;">📨 Open in Mail App</button>
            <div style="font-size:11px;color:#64748b;padding:8px;">TO: commissionerghmc@ghmc.gov.in</div>
          </div>
        </div>
      </div>
    `;
    p.addEventListener('click', e => { if (e.target === p) p.remove(); });
    document.body.appendChild(p);
  },

  _generateGHMCEmail() {
    const name    = document.getElementById('ge-name')?.value || 'Citizen';
    const hazard  = document.getElementById('ge-hazard')?.value || 'Road hazard';
    const days    = document.getElementById('ge-days')?.value || '30+';
    const refno   = document.getElementById('ge-refno')?.value;
    const date    = new Date().toLocaleDateString('en-IN', { day:'2-digit', month:'long', year:'numeric' });
    const ref     = refno ? `HazardAlert Report #${refno}` : 'HazardAlert Civic Platform';

    const email = `To: commissionerghmc@ghmc.gov.in
Subject: URGENT: Unresolved Road Hazard — ${hazard} — ${days} Days Pending — Immediate Action Required

Date: ${date}

Respected Commissioner,
Greater Hyderabad Municipal Corporation

Subject: Formal Complaint Regarding Unresolved Road Hazard Causing Public Safety Risk

I, ${name}, hereby lodge a formal complaint under Section 166 of the Motor Vehicles Act, 1988 and the Municipal Administration and Urban Development guidelines regarding an unresolved road hazard that poses immediate danger to citizens.

HAZARD DETAILS:
- Nature: ${hazard}
- Duration Unresolved: ${days} days
- Reference: ${ref}
- Reported via: HazardAlert Civic Accountability Platform

This hazard has been pending resolution for ${days} days, directly violating GHMC's own SLA commitments for road maintenance and public safety obligations under the GHMC Act, 1955.

LEGAL NOTICE:
Kindly note that continued negligence constitutes a violation of:
1. Section 12 of the GHMC Act, 1955 (Duty of Corporation)
2. RTI Act, 2005 — I reserve the right to file an RTI application demanding details of road maintenance budget utilization if this is not resolved within 7 working days.
3. Consumer Protection Act — public infrastructure endangering life and property

I request:
1. Immediate inspection and repair of the hazard within 7 working days
2. Written acknowledgement of this complaint with an action timeline
3. Name of the officer responsible for this ward's road maintenance

Failure to act within the stipulated time will compel me to escalate to:
- Telangana Lokayukta
- High Court of Telangana (Public Interest Litigation)
- District Collector, Hyderabad

Yours faithfully,
${name}
HazardAlert Citizen Reporter
Date: ${date}`;

    const ta = document.getElementById('ge-text');
    const res = document.getElementById('ge-result');
    if (ta) ta.value = email;
    if (res) res.style.display = 'block';
    this._lastEmail = email;
  },

  _mailtoGHMC() {
    if (!this._lastEmail) return;
    const subject = encodeURIComponent('URGENT: Unresolved Road Hazard — Immediate Action Required');
    const body = encodeURIComponent(this._lastEmail);
    window.open(`mailto:commissionerghmc@ghmc.gov.in?subject=${subject}&body=${body}`);
  }
};

// ── Auto-init ─────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  setTimeout(() => {
    UniqueFeatures.init = (function(origInit) {
      return async function() {
        await origInit.call(this);
        this.initVerifyFixed();
        this.initGHMCEmail();
        console.log('📧 UniqueFeatures: Verify-Fixed + GHMC Email active');
      };
    })(UniqueFeatures.init);
    UniqueFeatures.init();
    // Also add verify-fixed CSS
    const s = document.createElement('style');
    s.textContent = `.verify-fixed-btn{margin-top:8px;padding:6px 14px;background:#f0fdf4;border:1.5px solid #22c55e;color:#15803d;border-radius:20px;font-size:11px;font-weight:700;cursor:pointer;transition:all 0.2s;display:inline-block;}.verify-fixed-btn:hover{background:#22c55e;color:#fff;}`;
    document.head.appendChild(s);
  }, 4000);
});
