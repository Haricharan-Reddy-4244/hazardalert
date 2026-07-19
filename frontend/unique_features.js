// ════════════════════════════════════════════════════════════════════════
//  🏙️ CONSOLIDATED CIVIC & ACCOUNTABILITY ENGINES
//  Optimized Hackathon Engine Bundle containing:
//  1. UniqueFeatures (City Health, QR Sticker, Live Timer, Verify-Fixed, GHMC Email)
//  2. PriorityEngine (Composite Hazard Prioritization)
//  3. RTIEngine (Right to Information Generator)
//  4. PressureEngine (Public Pressure & Citizen Demands)
//  5. UnprecedentedEngine (Economic Damage, AI Hotspots, Accountability Grade, Pledges)
//  6. HazardNotifications (Web Push Notifications & Dynamic Translation)
//  7. CivicTrust (Civic Trust Scores & Legal Compensation Notice Generator)
//  8. ProfilePanel (Interactive Citizen Profile Dashboard)
// ════════════════════════════════════════════════════════════════════════

// ════════════════════════════════════════════════════════════════════════
//  1. UNIQUE FEATURES MODULE
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
    const el = document.getElementById('city-health-widget');
    if (el) el.remove(); // Replace old if exists

    const newEl = document.createElement('div');
    newEl.id = 'city-health-widget';
    newEl.style.setProperty('--health-color', h.color);
    newEl.title = `Click for breakdown — ${h.message}`;
    newEl.onclick = () => this._openHealthModal(h);
    newEl.innerHTML = `
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
    document.body.appendChild(newEl);
    setTimeout(() => {
      const bar = document.getElementById('ch-bar');
      if (bar) bar.style.width = h.score + '%';
    }, 500);
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

        <div style="margin-top:16px;padding:12px;background:#f8fafc;border-radius:10px;font-size:12px;color:#1e293b;">
          <b>Live Stats:</b><br>
          Total: ${h.stats.total} · Pending: ${h.stats.pending} · Resolved: ${h.stats.resolved}<br>
          Critical pending: ${h.stats.critical_pending} · SLA breached: ${h.stats.sla_breached}<br>
          Resolution rate: ${h.stats.resolutionRate}% · Oldest hazard: ${h.stats.oldestHazardDays} days
        </div>

        <button onclick="document.getElementById('city-health-modal').remove()"
          style="width:100%;margin-top:16px;padding:12px;background:#f1f5f9;border:none;border-radius:12px;font-weight:700;cursor:pointer;color:#1e293b;">Close</button>
      </div>
    `;
    m.addEventListener('click', e => { if (e.target === m) m.remove(); });
    document.body.appendChild(m);
  },

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

  initLiveTimers() {
    let _timerObsTimeout = null;
    const _injectTimers = () => {
      document.querySelectorAll('[data-created-at], .shame-card').forEach(card => {
        if (card.dataset.timerInjected) return;
        card.dataset.timerInjected = '1';
        const createdAt = card.dataset.createdAt || card.querySelector('[data-created-at]')?.dataset.createdAt;
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

  initVerifyFixed() {
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
      <div style="background:#fff;border-radius:20px;padding:28px;max-width:540px;width:100%;box-shadow:0 30px 80px rgba(0,0,0,0.4);color:#1e293b;">
        <h2 style="margin:0 0 4px;font-size:20px;font-weight:800;">📧 GHMC Formal Complaint Email</h2>
        <p style="margin:0 0 16px;font-size:12px;color:#64748b;">Pre-filled official complaint email. Copy and send to GHMC Commissioner.</p>

        <input id="ge-name" placeholder="Your Name" style="width:100%;padding:10px;border:1.5px solid #e2e8f0;border-radius:10px;font-size:13px;margin-bottom:10px;box-sizing:border-box;" value="${prefill.name || ''}">
        <input id="ge-hazard" placeholder="Hazard type (e.g. Open Manhole at Ameerpet)" style="width:100%;padding:10px;border:1.5px solid #e2e8f0;border-radius:10px;font-size:13px;margin-bottom:10px;box-sizing:border-box;" value="${prefill.hazard || ''}">
        <input id="ge-days" placeholder="Days unresolved (e.g. 45)" type="number" style="width:100%;padding:10px;border:1.5px solid #e2e8f0;border-radius:10px;font-size:13px;margin-bottom:10px;box-sizing:border-box;" value="${prefill.days || ''}">
        <input id="ge-refno" placeholder="HazardAlert Report # (optional)" style="width:100%;padding:10px;border:1.5px solid #e2e8f0;border-radius:10px;font-size:13px;margin-bottom:10px;box-sizing:border-box;">

        <div style="display:flex;gap:8px;justify-content:center;margin-bottom:12px;">
          <button onclick="UniqueFeatures._generateGHMCEmail()" style="padding:10px 20px;background:#7c3aed;color:#fff;border:none;border-radius:10px;font-weight:700;cursor:pointer;">✉️ Generate Email</button>
          <button onclick="document.getElementById('ghmc-email-panel').remove()" style="padding:10px 20px;background:#f1f5f9;border:none;border-radius:10px;font-weight:700;cursor:pointer;color:#1e293b;">✕ Close</button>
        </div>

        <div id="ge-result" style="display:none;">
          <div style="font-size:11px;font-weight:700;color:#64748b;margin-bottom:6px;">GENERATED EMAIL (click to copy):</div>
          <textarea id="ge-text" readonly onclick="this.select();document.execCommand('copy');this.parentNode.querySelector('.ge-copied').style.display='block';" style="width:100%;height:220px;font-family:monospace;font-size:11px;border:1.5px solid #e2e8f0;border-radius:10px;padding:12px;box-sizing:border-box;resize:none;background:#f8fafc;cursor:pointer;color:#1e293b;"></textarea>
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

// ── Auto-init for UniqueFeatures ──
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


// ════════════════════════════════════════════════════════════════════════
//  2. PRIORITY ENGINE MODULE
// ════════════════════════════════════════════════════════════════════════
const PriorityEngine = {
  API: window.API_BASE || 'http://localhost:5000',
  _data: null,
  _refreshTimer: null,

  async init() {
    this.injectStyles();
    this.injectNavBtn();
    await this.loadQueue();
    this.startAutoRefresh();
    this.injectMapBadges();
    console.log('🚨 PriorityEngine ready');
  },

  injectStyles() {
    if (document.getElementById('pr-styles')) return;
    const s = document.createElement('style');
    s.id = 'pr-styles';
    s.textContent = `
      #priority-nav-btn {
        background: linear-gradient(135deg, #7c3aed, #4c1d95);
        color: #fff !important; border: none; border-radius: 8px;
        padding: 7px 14px; font-weight: 700; cursor: pointer;
        box-shadow: 0 0 12px rgba(124,58,237,0.45);
        position: relative;
      }
      #priority-nav-btn .pr-count-bubble {
        position: absolute; top: -6px; right: -8px;
        background: #dc2626; color: #fff; border-radius: 50%;
        width: 18px; height: 18px; font-size: 10px; font-weight: 900;
        display: flex; align-items: center; justify-content: center;
        border: 2px solid #fff;
      }

      #priority-panel {
        position: fixed; inset: 0; z-index: 99997;
        background: rgba(0,0,0,0.75); backdrop-filter: blur(4px);
        display: flex; align-items: center; justify-content: center;
        padding: 20px;
      }
      .pr-inner {
        background: #fff; border-radius: 20px;
        width: 100%; max-width: 720px; max-height: 90vh;
        overflow-y: auto; box-shadow: 0 30px 80px rgba(0,0,0,0.4);
      }
      [data-theme="dark"] .pr-inner { background: #1e293b; color: #f1f5f9; }

      .pr-header {
        background: linear-gradient(135deg, #7c3aed, #4c1d95);
        color: #fff; padding: 22px 26px; border-radius: 20px 20px 0 0;
        position: sticky; top: 0; z-index: 2;
      }
      .pr-header h2 { margin: 0 0 3px; font-size: 21px; font-weight: 800; }
      .pr-header p  { margin: 0; font-size: 12px; opacity: 0.85; }

      .pr-summary {
        display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px;
        padding: 12px 18px; background: #f5f3ff;
        border-bottom: 1px solid #ede9fe;
      }
      [data-theme="dark"] .pr-summary { background: #2e1065; border-color: #4c1d95; }
      .pr-stat { text-align: center; }
      .pr-stat-num { font-size: 22px; font-weight: 900; }
      .pr-stat-lbl { font-size: 10px; text-transform: uppercase; letter-spacing: 0.5px; color: #64748b; }
      .pr-critical { color: #dc2626; }
      .pr-high     { color: #ea580c; }
      .pr-medium   { color: #f59e0b; }
      .pr-low      { color: #22c55e; }

      .pr-formula {
        padding: 10px 18px; font-size: 11px; color: #64748b;
        background: #fafafa; border-bottom: 1px solid #e2e8f0;
        display: flex; gap: 16px; flex-wrap: wrap;
      }
      [data-theme="dark"] .pr-formula { background: #1e293b; }
      .pr-formula span { font-weight: 700; }

      .pr-row {
        display: flex; align-items: center; gap: 12px;
        padding: 12px 18px; border-bottom: 1px solid #f1f5f9;
        transition: background 0.15s;
      }
      [data-theme="dark"] .pr-row { border-color: #334155; }
      .pr-row:hover { background: #f8f7ff; }
      [data-theme="dark"] .pr-row:hover { background: #1e2a3a; }

      .pr-rank { font-size: 18px; width: 28px; text-align: center; flex-shrink: 0; }
      .pr-score-ring {
        width: 52px; height: 52px; border-radius: 50%;
        display: flex; align-items: center; justify-content: center;
        flex-direction: column; flex-shrink: 0;
        font-weight: 900; font-size: 14px; color: #fff;
        box-shadow: 0 2px 8px rgba(0,0,0,0.2);
      }
      .pr-score-label { font-size: 8px; opacity: 0.85; }
      .pr-info { flex: 1; min-width: 0; }
      .pr-type { font-weight: 700; font-size: 14px; }
      .pr-loc  { font-size: 12px; color: #64748b; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
      .pr-tags { display: flex; flex-wrap: wrap; gap: 4px; margin-top: 4px; }
      .pr-tag  { font-size: 10px; font-weight: 700; padding: 2px 7px; border-radius: 12px; white-space: nowrap; }
      .pr-tag-sev { background: #fef2f2; color: #dc2626; }
      .pr-tag-age { background: #fff7ed; color: #ea580c; }
      .pr-tag-sla { background: #fee2e2; color: #991b1b; }
      .pr-tag-demand { background: #eff6ff; color: #1d4ed8; }

      .pr-actions { display: flex; flex-direction: column; gap: 5px; flex-shrink: 0; }
      .pr-map-btn { padding: 5px 10px; background: #f1f5f9; border: none; border-radius: 8px; cursor: pointer; font-size: 12px; white-space: nowrap; color: #1e293b; }
      .pr-fix-btn { padding: 5px 10px; background: #dc2626; color: #fff; border: none; border-radius: 8px; cursor: pointer; font-size: 11px; font-weight: 700; white-space: nowrap; }

      .priority-badge {
        display: inline-flex; align-items: center; gap: 4px;
        padding: 2px 8px; border-radius: 12px; font-size: 11px; font-weight: 800;
        margin-left: 6px;
      }
      .priority-badge-critical { background: #fee2e2; color: #dc2626; border: 1px solid #fca5a5; }
      .priority-badge-high     { background: #ffedd5; color: #ea580c; border: 1px solid #fdba74; }
      .priority-badge-medium   { background: #fef9c3; color: #ca8a04; border: 1px solid #fde047; }
      .priority-badge-low      { background: #dcfce7; color: #15803d; border: 1px solid #86efac; }

      .pr-breakdown { display: flex; gap: 6px; flex-wrap: wrap; margin-top: 6px; }
      .pr-breakdown-bar { flex: 1; min-width: 60px; }
      .pr-breakdown-lbl { font-size: 9px; color: #94a3b8; margin-bottom: 2px; }
      .pr-breakdown-track { height: 4px; background: #e2e8f0; border-radius: 2px; }
      .pr-breakdown-fill  { height: 100%; border-radius: 2px; transition: width 0.6s ease; }

      .pr-refresh-dot {
        width: 8px; height: 8px; border-radius: 50%; background: #22c55e;
        display: inline-dot; margin-left: 6px;
        animation: pr-blink 2s infinite;
      }
      @keyframes pr-blink { 0%,100%{opacity:1} 50%{opacity:0.3} }
    `;
    document.head.appendChild(s);
  },

  async loadQueue() {
    try {
      const res = await fetch(`${this.API}/api/intelligence/priority-queue`);
      const data = await res.json();
      if (data.success) {
        this._data = data;
        this._updateNavBubble(data.summary);
        this._patchListCards(data.queue);
      }
    } catch (e) { console.warn('Priority queue load failed:', e.message); }
  },

  startAutoRefresh() {
    if (this._refreshTimer) clearInterval(this._refreshTimer);
    this._refreshTimer = setInterval(() => this.loadQueue(), 5 * 60 * 1000);
  },

  injectNavBtn() {
    if (document.getElementById('priority-nav-btn')) return;
    const btn = document.createElement('button');
    btn.id = 'priority-nav-btn';
    btn.className = 'nav-btn';
    btn.innerHTML = '🚨 Priority Queue <span class="pr-count-bubble" id="pr-bubble">…</span>';
    btn.onclick = () => this.openPanel();

    const anchor =
      document.getElementById('shame-nav-btn') ||
      document.getElementById('leaderboard-nav-btn') ||
      document.querySelector('.nav-btn:last-of-type');

    if (anchor) anchor.parentNode.insertBefore(btn, anchor.nextSibling);
    else {
      const nav = document.querySelector('nav, .desktop-nav, header');
      if (nav) nav.appendChild(btn);
      else {
        btn.style.cssText += ';position:fixed;top:14px;right:80px;z-index:9999;';
        document.body.appendChild(btn);
      }
    }
  },

  _updateNavBubble(summary) {
    const b = document.getElementById('pr-bubble');
    const criticalCount = (summary.critical || 0) + (summary.slaBreached || 0);
    if (b) b.textContent = criticalCount || summary.total;
    if (b && criticalCount > 0) b.style.background = '#dc2626';
    else if (b) b.style.background = '#7c3aed';
  },

  async openPanel() {
    if (!this._data) await this.loadQueue();
    const existing = document.getElementById('priority-panel');
    if (existing) { existing.remove(); return; }
    if (!this._data) { alert('Priority queue failed to load — check backend'); return; }

    const d = this._data;
    const panel = document.createElement('div');
    panel.id = 'priority-panel';
    panel.innerHTML = `
      <div class="pr-inner">
        <div class="pr-header">
          <div style="display:flex;align-items:flex-start;">
            <div>
              <h2>🚨 Priority Queue <span class="pr-refresh-dot"></span></h2>
              <p>Composite scoring: Severity + SLA Breach + Citizen Demands + Age · Auto-refreshes every 5 min</p>
            </div>
            <button onclick="document.getElementById('priority-panel').remove()"
              style="margin-left:auto;background:rgba(255,255,255,0.2);border:none;color:#fff;font-size:20px;width:36px;height:36px;border-radius:50%;cursor:pointer;flex-shrink:0;">✕</button>
          </div>
        </div>

        <div class="pr-summary">
          <div class="pr-stat"><div class="pr-stat-num pr-critical">${d.summary.critical}</div><div class="pr-stat-lbl">🔴 Critical</div></div>
          <div class="pr-stat"><div class="pr-stat-num pr-high">${d.summary.high}</div><div class="pr-stat-lbl">🟠 High</div></div>
          <div class="pr-stat"><div class="pr-stat-num pr-medium">${d.summary.medium}</div><div class="pr-stat-lbl">🟡 Medium</div></div>
          <div class="pr-stat"><div class="pr-stat-num" style="color:#ef4444;">${d.summary.slaBreached}</div><div class="pr-stat-lbl">⏱️ SLA Breached</div></div>
        </div>

        <div class="pr-formula">
          Score = <span>Severity (max 40)</span> + <span>SLA Breach (max 30)</span> + <span>Demands (max 20)</span> + <span>Age (max 10)</span>
          <em style="margin-left:auto;">${d.queue.length} hazards ranked · Top score: ${d.summary.topScore}/100</em>
        </div>

        ${d.queue.slice(0, 30).map((h, i) => this._renderRow(h, i + 1)).join('')}

        <div style="padding:14px 18px;text-align:center;font-size:11px;color:#94a3b8;">
          Showing top 30 of ${d.queue.length} · ${new Date(d.generatedAt).toLocaleString('en-IN')}
        </div>
      </div>
    `;

    panel.addEventListener('click', e => { if (e.target === panel) panel.remove(); });
    document.body.appendChild(panel);
  },

  _renderRow(h, rank) {
    const rankEmoji = rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : `#${rank}`;
    const sevLabel = h.severity.charAt(0).toUpperCase() + h.severity.slice(1);
    const slaTag = h.slaBreach ? `<span class="pr-tag pr-tag-sla">⏱ SLA +${h.slaBreachDays}d</span>` : '';
    const demandTag = h.demandCount > 0 ? `<span class="pr-tag pr-tag-demand">📢 ${h.demandCount} demand${h.demandCount>1?'s':''}</span>` : '';

    const bars = [
      { lbl: 'Severity', val: h.breakdown.severity, max: 40, color: '#7c3aed' },
      { lbl: 'SLA', val: h.breakdown.sla, max: 30, color: '#dc2626' },
      { lbl: 'Demand', val: h.breakdown.demand, max: 20, color: '#3b82f6' },
      { lbl: 'Age', val: h.breakdown.age, max: 10, color: '#f59e0b' },
    ].map(b => `
      <div class="pr-breakdown-bar">
        <div class="pr-breakdown-lbl">${b.lbl} ${b.val}</div>
        <div class="pr-breakdown-track">
          <div class="pr-breakdown-fill" style="width:${(b.val/b.max)*100}%;background:${b.color};"></div>
        </div>
      </div>
    `).join('');

    return `
      <div class="pr-row">
        <div class="pr-rank">${rankEmoji}</div>
        <div class="pr-score-ring" style="background:${h.color};">
          ${h.score}
          <span class="pr-score-label">/100</span>
        </div>
        <div class="pr-info">
          <div class="pr-type" style="color:#1e293b;">${h.emoji} ${h.type} <span style="font-size:10px;font-weight:600;color:${h.color};">[${h.level}]</span></div>
          <div class="pr-loc">📍 ${h.location} · ${h.daysPending} days old</div>
          <div class="pr-tags">
            <span class="pr-tag pr-tag-sev">${sevLabel}</span>
            <span class="pr-tag pr-tag-age">📅 ${h.daysPending}d</span>
            ${slaTag}
            ${demandTag}
          </div>
          <div class="pr-breakdown">${bars}</div>
        </div>
        <div class="pr-actions">
          <button class="pr-map-btn" onclick="window.open('${h.mapsUrl}','_blank')">🗺️ Map</button>
          <button class="pr-fix-btn" onclick="PressureEngine?.submitDemand(${h.id}, this)">📢 Demand</button>
        </div>
      </div>
    `;
  },

  _patchListCards(queue) {
    const scoreMap = {};
    queue.forEach(h => { scoreMap[h.id] = h; });

    const obs = new MutationObserver(() => {
      document.querySelectorAll('[data-hazard-id]').forEach(el => {
        if (el.dataset.priorityBadged) return;
        const id = parseInt(el.dataset.hazardId);
        const h = scoreMap[id];
        if (!h) return;
        el.dataset.priorityBadged = '1';

        const badge = document.createElement('span');
        badge.className = `priority-badge priority-badge-${h.level.toLowerCase()}`;
        badge.textContent = `${h.emoji} ${h.score}`;
        badge.title = `Priority Score: ${h.score}/100 · ${h.level}`;

        const title = el.querySelector('h3, h4, .hazard-type, .card-title, strong:first-child');
        if (title) title.appendChild(badge);
        else el.prepend(badge);
      });
    });
    obs.observe(document.body, { childList: true, subtree: true });
  },

  injectMapBadges() {
    if (!window.L) { setTimeout(() => this.injectMapBadges(), 2000); return; }
    const obs = new MutationObserver(mutations => {
      mutations.forEach(m => {
        m.addedNodes.forEach(node => {
          if (!node.querySelector) return;
          const popup = node.classList?.contains('leaflet-popup-content')
            ? node
            : node.querySelector('.leaflet-popup-content');
          if (!popup || popup.dataset.prBadged) return;
          popup.dataset.prBadged = '1';

          if (!this._data?.queue?.length) return;
          const idMatch = popup.innerHTML.match(/#(\d+)|hazard[_\-]?id['":\s]+(\d+)/i);
          const hazardId = idMatch ? parseInt(idMatch[1] || idMatch[2]) : null;
          if (!hazardId) return;

          const h = this._data.queue.find(x => x.id === hazardId);
          if (!h) return;

          const badgeDiv = document.createElement('div');
          badgeDiv.style.cssText = 'margin-top:8px;padding:6px 10px;border-radius:8px;font-size:12px;font-weight:700;' +
            `background:${h.color}22;border:1px solid ${h.color};color:${h.color};`;
          badgeDiv.textContent = `${h.emoji} Priority: ${h.score}/100 · ${h.level}`;
          popup.appendChild(badgeDiv);
        });
      });
    });
    obs.observe(document.body, { childList: true, subtree: true });
  }
};

// ── Auto-init for PriorityEngine ──
document.addEventListener('DOMContentLoaded', () => {
  setTimeout(() => PriorityEngine.init(), 3000);
});


// ════════════════════════════════════════════════════════════════════════
//  3. RTI ENGINE MODULE
// ════════════════════════════════════════════════════════════════════════
const RTIEngine = {
  API: window.API_BASE || 'http://localhost:5000',

  PIOs: [
    {
      dept: 'GHMC (Greater Hyderabad Municipal Corporation)',
      name: 'Public Information Officer',
      address: 'GHMC Head Office, Tank Bund Road, Hyderabad — 500 080',
      phone: '040-23225590',
      email: 'pio.ghmc@ghmc.gov.in',
      type: 'road_hazard'
    },
    {
      dept: 'Telangana Roads & Buildings Dept.',
      name: 'Public Information Officer',
      address: 'R&B Department, M.G. Road, Secunderabad — 500 003',
      phone: '040-27852374',
      email: 'pio.rb@telangana.gov.in',
      type: 'state_road'
    },
    {
      dept: 'Hyderabad Metropolitan Water Supply & Sewerage Board',
      name: 'Public Information Officer',
      address: 'HMWSSB, Khairatabad, Hyderabad — 500 004',
      phone: '040-23298280',
      email: 'pio.hmwssb@gov.in',
      type: 'drain'
    }
  ],

  init() {
    this.injectStyles();
    this.injectNavBtn();
    console.log('📋 RTI Engine ready — RTI applications can now be generated');
  },

  injectStyles() {
    if (document.getElementById('rti-styles')) return;
    const s = document.createElement('style');
    s.id = 'rti-styles';
    s.textContent = `
      #rti-nav-btn {
        background: linear-gradient(135deg, #0f766e, #065f46);
        color: #fff !important; border: none; border-radius: 8px;
        padding: 7px 14px; font-weight: 700; cursor: pointer;
        box-shadow: 0 0 10px rgba(15,118,110,0.4);
      }

      #rti-panel {
        position: fixed; inset: 0; z-index: 99996;
        background: rgba(0,0,0,0.75); backdrop-filter: blur(4px);
        display: flex; align-items: center; justify-content: center;
        padding: 20px;
      }
      .rti-inner {
        background: #fff; border-radius: 20px; width: 100%; max-width: 680px;
        max-height: 92vh; overflow-y: auto;
        box-shadow: 0 30px 80px rgba(0,0,0,0.4);
      }
      [data-theme="dark"] .rti-inner { background: #1e293b; color: #f1f5f9; }

      .rti-header {
        background: linear-gradient(135deg, #0f766e, #065f46);
        color: #fff; padding: 22px 26px; border-radius: 20px 20px 0 0;
        position: sticky; top: 0; z-index: 2;
      }
      .rti-header h2 { margin: 0 0 3px; font-size: 19px; font-weight: 800; }
      .rti-header p { margin: 0; font-size: 12px; opacity: 0.85; }

      .rti-form { padding: 20px 24px; }
      .rti-field { margin-bottom: 16px; }
      .rti-label { display: block; font-size: 12px; font-weight: 700; color: #64748b; margin-bottom: 5px; text-transform: uppercase; letter-spacing: 0.4px; }
      .rti-input {
        width: 100%; padding: 10px 14px; border: 1.5px solid #e2e8f0;
        border-radius: 10px; font-size: 14px; box-sizing: border-box;
        transition: border-color 0.2s;
      }
      [data-theme="dark"] .rti-input { background: #0f172a; border-color: #334155; color: #f1f5f9; }
      .rti-input:focus { outline: none; border-color: #0f766e; }
      .rti-select { width: 100%; padding: 10px 14px; border: 1.5px solid #e2e8f0; border-radius: 10px; font-size: 14px; background: #fff; box-sizing: border-box; }
      [data-theme="dark"] .rti-select { background: #0f172a; border-color: #334155; color: #f1f5f9; }

      .rti-btn-row { display: flex; gap: 10px; flex-wrap: wrap; margin-top: 8px; }
      .rti-gen-btn {
        flex: 1; padding: 12px 16px; background: linear-gradient(135deg,#0f766e,#065f46);
        color: #fff; border: none; border-radius: 12px; font-weight: 700;
        font-size: 14px; cursor: pointer;
      }
      .rti-print-btn {
        padding: 12px 16px; background: #f1f5f9; border: none; border-radius: 12px;
        font-weight: 700; font-size: 14px; cursor: pointer; color:#1e293b;
      }
      .rti-wa-btn {
        padding: 12px 16px; background: #25d366; color: #fff; border: none;
        border-radius: 12px; font-weight: 700; font-size: 13px; cursor: pointer;
      }

      #rti-document {
        margin: 0 24px 24px;
        border: 1px solid #e2e8f0; border-radius: 12px;
        background: #f8fafc; padding: 24px;
        font-size: 13px; line-height: 1.7; display: none;
        white-space: pre-wrap; font-family: 'Courier New', monospace;
        color: #1e293b;
      }
      [data-theme="dark"] #rti-document { background: #0f172a; border-color: #334155; color: #e2e8f0; }

      .rti-info-box {
        margin: 12px 24px; padding: 12px 16px; background: #ecfdf5;
        border: 1px solid #6ee7b7; border-radius: 10px; font-size: 12px; color: #065f46;
      }
      [data-theme="dark"] .rti-info-box { background: #022c22; border-color: #065f46; color: #6ee7b7; }

      .shame-rti-btn {
        padding: 9px 12px; background: #0f766e; color: #fff; border: none;
        border-radius: 10px; cursor: pointer; font-weight: 700; font-size: 12px;
        white-space: nowrap;
      }

      @media print {
        body > *:not(#rti-print-wrapper) { display: none !important; }
        #rti-print-wrapper { display: block !important; font-size: 14px; line-height: 1.8; }
      }
    `;
    document.head.appendChild(s);
  },

  injectNavBtn() {
    if (document.getElementById('rti-nav-btn')) return;
    const btn = document.createElement('button');
    btn.id = 'rti-nav-btn';
    btn.className = 'nav-btn';
    btn.innerHTML = '📋 File RTI';
    btn.title = 'Generate a legally valid RTI application for any hazard';
    btn.onclick = () => this.openPanel();

    const anchor =
      document.getElementById('priority-nav-btn') ||
      document.getElementById('shame-nav-btn') ||
      document.querySelector('.nav-btn:last-of-type');
    if (anchor) anchor.parentNode.insertBefore(btn, anchor.nextSibling);
    else {
      const nav = document.querySelector('nav, .desktop-nav, header');
      if (nav) nav.appendChild(btn);
      else { btn.style.cssText += ';position:fixed;top:14px;right:20px;z-index:9999;'; document.body.appendChild(btn); }
    }
  },

  openPanel(prefill = {}) {
    const existing = document.getElementById('rti-panel');
    if (existing) { existing.remove(); return; }

    const panel = document.createElement('div');
    panel.id = 'rti-panel';
    panel.innerHTML = `
      <div class="rti-inner">
        <div class="rti-header">
          <div style="display:flex;align-items:flex-start;">
            <div>
              <h2>📋 RTI Application Generator</h2>
              <p>Generate a legally valid Right to Information application under RTI Act 2005 · Forces govt response within 30 days</p>
            </div>
            <button onclick="document.getElementById('rti-panel').remove()"
              style="margin-left:auto;background:rgba(255,255,255,0.2);border:none;color:#fff;font-size:20px;width:36px;height:36px;border-radius:50%;cursor:pointer;flex-shrink:0;">✕</button>
          </div>
        </div>

        <div class="rti-info-box">
          ⚖️ Under the <strong>Right to Information Act, 2005</strong>, the government MUST respond within <strong>30 days</strong>. 
          Failure to respond is an offence with penalties up to ₹25,000. This is your legal right as a citizen.
        </div>

        <div class="rti-form">
          <div style="font-weight:800;font-size:14px;margin-bottom:12px;color:#0f766e;">👤 Your Details</div>
          <div class="rti-field">
            <label class="rti-label">Full Name *</label>
            <input class="rti-input" id="rti-name" placeholder="Your full legal name" value="${prefill.name || ''}">
          </div>
          <div class="rti-field">
            <label class="rti-label">Complete Address *</label>
            <input class="rti-input" id="rti-address" placeholder="House no., Street, Area, City, PIN">
          </div>
          <div class="rti-field">
            <label class="rti-label">Mobile Number</label>
            <input class="rti-input" id="rti-phone" placeholder="10-digit mobile number" type="tel">
          </div>
          <div class="rti-field">
            <label class="rti-label">Email Address</label>
            <input class="rti-input" id="rti-email" placeholder="Your email address" type="email">
          </div>

          <div style="font-weight:800;font-size:14px;margin:20px 0 12px;color:#0f766e;">🚧 Hazard Details</div>
          <div class="rti-field">
            <label class="rti-label">Hazard Type *</label>
            <select class="rti-select" id="rti-hazard-type">
              <option>Pothole</option>
              <option>Broken Road</option>
              <option>Open Manhole</option>
              <option>Waterlogging</option>
              <option>Open Drain</option>
              <option>Road Cave-in</option>
              <option>Fallen Tree</option>
              <option>Street Light Out</option>
              <option>Garbage Dump</option>
              <option>Damaged Footpath</option>
            </select>
          </div>
          <div class="rti-field">
            <label class="rti-label">Location of Hazard *</label>
            <input class="rti-input" id="rti-location" placeholder="e.g. Near Ameerpet Metro Station, beside SBI ATM" value="${prefill.location || ''}">
          </div>
          <div class="rti-field">
            <label class="rti-label">Days Reported/Existing (approx.)</label>
            <input class="rti-input" id="rti-days" placeholder="e.g. 45" type="number" value="${prefill.days || ''}">
          </div>
          <div class="rti-field">
            <label class="rti-label">Additional Details (optional)</label>
            <input class="rti-input" id="rti-extra" placeholder="e.g. Three accidents already occurred, child injured last week">
          </div>

          <div style="font-weight:800;font-size:14px;margin:20px 0 12px;color:#0f766e;">🏛️ Address To</div>
          <div class="rti-field">
            <label class="rti-label">Department *</label>
            <select class="rti-select" id="rti-dept">
              ${this.PIOs.map((p, i) => `<option value="${i}">${p.dept}</option>`).join('')}
            </select>
          </div>

          <div class="rti-btn-row">
            <button class="rti-gen-btn" onclick="RTIEngine.generateDocument()">📄 Generate RTI Application</button>
          </div>
        </div>

        <div id="rti-document"></div>

        <div id="rti-action-row" style="display:none;padding:0 24px 24px;">
          <div class="rti-btn-row" id="rti-share-btns" style="margin-top:12px;display:none;"></div>
        </div>
      </div>
    `;

    if (prefill.type) document.getElementById('rti-hazard-type').value = prefill.type;

    panel.addEventListener('click', e => { if (e.target === panel) panel.remove(); });
    document.body.appendChild(panel);
  },

  generateDocument() {
    const name    = document.getElementById('rti-name')?.value?.trim();
    const address = document.getElementById('rti-address')?.value?.trim();
    const phone   = document.getElementById('rti-phone')?.value?.trim();
    const email   = document.getElementById('rti-email')?.value?.trim();
    const type    = document.getElementById('rti-hazard-type')?.value;
    const location = document.getElementById('rti-location')?.value?.trim();
    const days    = document.getElementById('rti-days')?.value?.trim() || 'several';
    const extra   = document.getElementById('rti-extra')?.value?.trim();
    const deptIdx = parseInt(document.getElementById('rti-dept')?.value || '0');
    const pio     = this.PIOs[deptIdx] || this.PIOs[0];

    if (!name || !address || !location) {
      alert('Please fill in: Full Name, Address, and Hazard Location');
      return;
    }

    const today = new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
    const refNo = 'HA-RTI-' + Date.now().toString().slice(-6);

    const doc = `
                                                     Ref: ${refNo}
                                                     Date: ${today}

To,
The Public Information Officer,
${pio.dept},
${pio.address}

Subject: Application under Right to Information Act, 2005 — 
         Seeking information regarding unrepaired ${type} at ${location}

Sir/Madam,

I, ${name}, residing at ${address}${phone ? `, Mobile: ${phone}` : ''}${email ? `, Email: ${email}` : ''}, do hereby submit this application under Section 6(1) of the Right to Information Act, 2005 seeking the following information:

━━━━━━ INFORMATION SOUGHT ━━━━━━

The following public road/infrastructure hazard has been existing for approximately ${days} days without repair:

  • Hazard Type: ${type}
  • Location: ${location}
  ${extra ? `• Additional Details: ${extra}\n` : ''}

I request the following information:

  1. Whether a complaint/grievance regarding the above hazard was received 
     by your department, and if so, on what date.

  2. The current status of the repair work for the said hazard — if repaired, 
     on what date was it repaired; if not, the reasons for delay.

  3. The name and designation of the officer responsible for road maintenance 
     in the above-mentioned area.

  4. Copies of any complaint letters, estimates, work orders, or inspection 
     reports issued in relation to the above hazard.

  5. The budget allocated for road repair/maintenance in the said ward/area 
     for the current financial year and expenditure so far.

  6. The standard procedure and prescribed timeline (SLA) for repair of 
     ${type}s under your department's guidelines.

  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

I am enclosing the prescribed RTI fee of ₹10/- (Ten Rupees) as required 
under the RTI Act 2005. Citizens below poverty line are exempt (attach BPL certificate if applicable).

As per Section 7(1) of the RTI Act, 2005, I request you to provide the 
above information within 30 days of receipt of this application.

If the information is not supplied within the stipulated time, I reserve 
the right to file an Appeal under Section 19 of the RTI Act, 2005 before 
the First Appellate Authority, and subsequently before the Telangana State 
Information Commission.

Yours faithfully,

_________________________
${name}
${address}${phone ? '\nMobile: ' + phone : ''}${email ? '\nEmail: ' + email : ''}

Date: ${today}
Reference: ${refNo}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
IMPORTANT: Attach ₹10 postal order / online payment receipt
Address to PIO, ${pio.dept}
PIO Contact: ${pio.phone} | ${pio.email}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`;

    const docEl = document.getElementById('rti-document');
    if (docEl) {
      docEl.textContent = doc;
      docEl.style.display = 'block';
      docEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    const btnRow = document.getElementById('rti-share-btns');
    if (btnRow) {
      const waMsg = encodeURIComponent(
        `📋 RTI Application Filed!\n\n` +
        `${type} at ${location} — ${days} days unresolved.\n\n` +
        `RTI under RTI Act 2005 sent to: ${pio.dept}\n` +
        `Govt. MUST reply within 30 days or face penalty.\n\n` +
        `Ref: ${refNo}`
      );
      btnRow.innerHTML = `
        <button class="rti-print-btn" onclick="RTIEngine.printDoc()">🖨️ Print Application</button>
        <button class="rti-wa-btn" onclick="window.open('https://wa.me/?text=${waMsg}','_blank')">📱 Share on WhatsApp</button>
      `;
      btnRow.style.display = 'flex';
      const actionRow = document.getElementById('rti-action-row');
      if (actionRow) actionRow.style.display = 'block';
    }
  },

  printDoc() {
    const content = document.getElementById('rti-document')?.textContent;
    if (!content) return;
    const win = window.open('', '_blank');
    win.document.write(`
      <html><head><title>RTI Application — HazardAlert</title>
      <style>body{font-family:'Courier New',monospace;font-size:13px;line-height:1.8;padding:40px;max-width:700px;margin:auto;white-space:pre-wrap;}</style>
      </head><body>${content.replace(/</g,'&lt;').replace(/>/g,'&gt;')}</body></html>
    `);
    win.document.close();
    win.print();
  },

  openFromHazard(hazardType, location, days) {
    this.openPanel({ type: hazardType, location, days });
  }
};

// ── Auto-init + inject RTI buttons ──
document.addEventListener('DOMContentLoaded', () => {
  setTimeout(() => {
    RTIEngine.init();

    const obs = new MutationObserver(() => {
      document.querySelectorAll('.shame-card').forEach(card => {
        if (card.dataset.rtiInjected) return;
        card.dataset.rtiInjected = '1';
        const actions = card.querySelector('.shame-actions');
        if (!actions) return;
        const type = card.querySelector('.shame-type')?.textContent?.replace('🔥 ', '') || 'Pothole';
        const loc  = card.querySelector('.shame-loc')?.textContent?.replace('📍 ', '') || '';
        const days = card.querySelector('.shame-days')?.textContent?.replace(' days old', '') || '';
        const rtiBtn = document.createElement('button');
        rtiBtn.className = 'shame-rti-btn';
        rtiBtn.innerHTML = '📋 RTI';
        rtiBtn.title = 'File RTI application for this hazard';
        rtiBtn.onclick = () => RTIEngine.openFromHazard(type, loc, days);
        actions.appendChild(rtiBtn);
      });

      document.querySelectorAll('.pr-row').forEach(row => {
        if (row.dataset.rtiInjected) return;
        row.dataset.rtiInjected = '1';
        const type = row.querySelector('.pr-type')?.textContent?.split('[')[0].replace(/[🔴🟠🟡🟢]/g,'').trim() || 'Pothole';
        const loc  = row.querySelector('.pr-loc')?.textContent?.replace('📍 ','').split('·')[0].trim() || '';
        const daysMatch = row.querySelector('.pr-loc')?.textContent?.match(/(\d+) days/);
        const days = daysMatch?.[1] || '';
        const actions = row.querySelector('.pr-actions');
        if (!actions) return;
        const rtiBtn = document.createElement('button');
        rtiBtn.style.cssText = 'padding:5px 10px;background:#0f766e;color:#fff;border:none;border-radius:8px;cursor:pointer;font-size:11px;font-weight:700;white-space:nowrap;';
        rtiBtn.innerHTML = '📋 RTI';
        rtiBtn.onclick = () => RTIEngine.openFromHazard(type, loc, days);
        actions.appendChild(rtiBtn);
      });
    });
    obs.observe(document.body, { childList: true, subtree: true });
  }, 3500);
});


// ════════════════════════════════════════════════════════════════════════
//  4. PUBLIC PRESSURE ENGINE MODULE
// ════════════════════════════════════════════════════════════════════════
const PressureEngine = {
  API: window.API_BASE || 'http://localhost:5000',
  _data: null,

  async init() {
    this.injectStyles();
    this.injectShameTab();
    await this.loadShameBoard();
    this.injectDemandBtnsOnMap();
    console.log('🔥 PressureEngine ready — shame board active');
  },

  injectStyles() {
    if (document.getElementById('pe-styles')) return;
    const s = document.createElement('style');
    s.id = 'pe-styles';
    s.textContent = `
      #shame-nav-btn {
        background: linear-gradient(135deg, #dc2626, #991b1b);
        color: #fff !important; border: none; border-radius: 8px;
        padding: 7px 14px; font-weight: 700; cursor: pointer;
        animation: shame-pulse 2.5s infinite;
        box-shadow: 0 0 12px rgba(220,38,38,0.5);
      }
      @keyframes shame-pulse { 0%,100% { box-shadow:0 0 8px rgba(220,38,38,0.5); } 50% { box-shadow:0 0 22px rgba(220,38,38,0.85); } }

      #shame-board-panel {
        position: fixed; inset: 0; z-index: 99998;
        background: rgba(0,0,0,0.75); backdrop-filter: blur(4px);
        display: flex; align-items: center; justify-content: center;
        padding: 20px;
      }
      .shame-board-inner {
        background: #fff; border-radius: 20px; width: 100%; max-width: 700px;
        max-height: 88vh; overflow-y: auto; box-shadow: 0 30px 80px rgba(0,0,0,0.4);
      }
      [data-theme="dark"] .shame-board-inner { background: #1e293b; color: #f1f5f9; }

      .shame-header {
        background: linear-gradient(135deg, #dc2626, #7f1d1d);
        color: #fff; padding: 24px 28px; border-radius: 20px 20px 0 0;
        position: sticky; top: 0; z-index: 2;
      }
      .shame-header h2 { margin: 0 0 4px; font-size: 22px; font-weight: 800; }
      .shame-header p  { margin: 0; font-size: 13px; opacity: 0.85; }
      .shame-grade-pill {
        display: inline-block; background: rgba(255,255,255,0.2);
        border-radius: 30px; padding: 4px 14px; font-weight: 800;
        font-size: 18px; margin-top: 10px;
      }

      .shame-summary {
        display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px;
        padding: 14px 20px; background: #fef2f2; border-bottom: 1px solid #fecaca;
      }
      [data-theme="dark"] .shame-summary { background: #450a0a; border-color: #7f1d1d; }
      .shame-stat { text-align: center; }
      .shame-stat-num { font-size: 26px; font-weight: 900; color: #dc2626; }
      .shame-stat-lbl { font-size: 10px; text-transform: uppercase; letter-spacing: 0.5px; color: #64748b; }

      .shame-card {
        margin: 12px 16px; border-radius: 14px; overflow: hidden;
        border: 1px solid #e2e8f0; transition: box-shadow 0.2s;
        color: #1e293b;
      }
      [data-theme="dark"] .shame-card { border-color: #334155; color: #e2e8f0; }
      .shame-card:hover { box-shadow: 0 4px 20px rgba(0,0,0,0.12); }

      .shame-card-header {
        display: flex; align-items: center; gap: 10px;
        padding: 12px 16px;
      }
      .shame-rank {
        width: 32px; height: 32px; border-radius: 50%; background: #dc2626;
        color: #fff; font-weight: 900; font-size: 14px;
        display: flex; align-items: center; justify-content: center; flex-shrink: 0;
      }
      .shame-type { font-weight: 700; font-size: 15px; }
      .shame-loc  { font-size: 12px; color: #64748b; }
      .shame-days {
        margin-left: auto; font-size: 12px; font-weight: 700;
        padding: 3px 10px; border-radius: 20px; white-space: nowrap;
      }
      .sev-critical .shame-days { background: #fee2e2; color: #dc2626; }
      .sev-high     .shame-days { background: #ffedd5; color: #ea580c; }
      .sev-medium   .shame-days { background: #fef9c3; color: #ca8a04; }
      .sev-low      .shame-days { background: #dcfce7; color: #16a34a; }

      .sev-critical .shame-card-header { background: #fff1f1; }
      .sev-high     .shame-card-header { background: #fff8f3; }
      .sev-medium   .shame-card-header { background: #fefce8; }
      [data-theme="dark"] .shame-card-header { background: #1e2a3a !important; }

      .shame-actions {
        padding: 10px 14px 14px;
        display: flex; flex-wrap: wrap; gap: 8px; align-items: center;
      }
      .demand-btn {
        flex: 1; min-width: 120px; padding: 9px 14px;
        background: linear-gradient(135deg, #dc2626, #b91c1c);
        color: #fff; border: none; border-radius: 10px; cursor: pointer;
        font-weight: 700; font-size: 13px; transition: transform 0.1s;
        display: flex; align-items: center; justify-content: center; gap: 6px;
      }
      .demand-btn:hover     { transform: scale(1.03); }
      .demand-btn.demanded  { background: linear-gradient(135deg, #16a34a, #15803d); }
      .demand-count-badge   { font-size: 11px; opacity: 0.85; }

      .share-wa  { padding: 9px 14px; background: #25d366; color: #fff; border: none; border-radius: 10px; cursor: pointer; font-weight: 700; font-size: 13px; white-space: nowrap; }
      .share-tw  { padding: 9px 14px; background: #1da1f2; color: #fff; border: none; border-radius: 10px; cursor: pointer; font-weight: 700; font-size: 13px; white-space: nowrap; }
      .share-mla { padding: 9px 14px; background: #7c3aed; color: #fff; border: none; border-radius: 10px; cursor: pointer; font-weight: 700; font-size: 13px; white-space: nowrap; }

      .damage-badge {
        font-size: 11px; color: #ea580c; font-weight: 700;
        padding: 2px 8px; background: #fff7ed; border-radius: 6px;
      }

      .map-demand-btn {
        display: inline-block; margin-top: 8px; padding: 6px 14px;
        background: linear-gradient(135deg,#dc2626,#b91c1c);
        color:#fff; border:none; border-radius:8px; cursor:pointer;
        font-weight:700; font-size:12px; width:100%;
      }

      .pe-toast {
        position: fixed; bottom: 100px; left: 50%; transform: translateX(-50%);
        background: #dc2626; color: #fff; border-radius: 12px;
        padding: 12px 20px; font-weight: 700; font-size: 14px;
        z-index: 999999; box-shadow: 0 4px 20px rgba(0,0,0,0.3);
        animation: pe-toast-in 0.3s ease;
      }
      @keyframes pe-toast-in { from { opacity:0; transform:translateX(-50%) translateY(20px); } }
    `;
    document.head.appendChild(s);
  },

  injectShameTab() {
    if (document.getElementById('shame-nav-btn')) return;
    const btn = document.createElement('button');
    btn.id = 'shame-nav-btn';
    btn.className = 'nav-btn';
    btn.innerHTML = '🔥 Shame Board';
    btn.title = 'Public accountability — worst unresolved hazards';
    btn.onclick = () => this.openShameBoard();

    const anchor =
      document.getElementById('leaderboard-nav-btn') ||
      document.getElementById('nav-leaderboard') ||
      document.querySelector('[onclick*="leaderboard"]') ||
      document.querySelector('.nav-btn:last-of-type') ||
      document.querySelector('.desktop-nav .nav-btn');

    if (anchor) {
      anchor.parentNode.insertBefore(btn, anchor.nextSibling);
    } else {
      const nav = document.querySelector('nav, .desktop-nav, .nav-bar, header');
      if (nav) nav.appendChild(btn);
      else {
        btn.style.cssText += ';position:fixed;top:14px;right:200px;z-index:9999;';
        document.body.appendChild(btn);
      }
    }
  },

  async loadShameBoard() {
    try {
      const res = await fetch(`${this.API}/api/intelligence/shame-board`);
      const data = await res.json();
      if (data.success) this._data = data;
    } catch (e) { console.warn('Shame board load failed:', e.message); }
  },

  async openShameBoard() {
    if (!this._data) await this.loadShameBoard();
    const existing = document.getElementById('shame-board-panel');
    if (existing) { existing.remove(); return; }

    const d = this._data;
    if (!d) { this.toast('Could not load shame board — is backend running?'); return; }

    const gradeColor = { A:'#22c55e', B:'#84cc16', C:'#f59e0b', D:'#f97316', F:'#dc2626' };
    const col = gradeColor[d.summary.grade] || '#dc2626';

    const panel = document.createElement('div');
    panel.id = 'shame-board-panel';
    panel.innerHTML = `
      <div class="shame-board-inner">
        <div class="shame-header">
          <div style="display:flex;align-items:flex-start;gap:14px;">
            <div>
              <h2>🔥 Public Accountability Wall</h2>
              <p>Worst unresolved hazards · Sorted by severity × days pending</p>
              <span class="shame-grade-pill" style="background:${col}33;color:${col};border:1.5px solid ${col};">
                Grade ${d.summary.grade} — ${d.summary.resolutionRate}% resolved
              </span>
            </div>
            <button onclick="document.getElementById('shame-board-panel').remove()" style="margin-left:auto;background:rgba(255,255,255,0.2);border:none;color:#fff;font-size:20px;width:36px;height:36px;border-radius:50%;cursor:pointer;flex-shrink:0;">✕</button>
          </div>
        </div>

        <div class="shame-summary">
          <div class="shame-stat"><div class="shame-stat-num">${d.summary.totalPending || 0}</div><div class="shame-stat-lbl">Pending Hazards</div></div>
          <div class="shame-stat"><div class="shame-stat-num">${d.summary.criticalOverdue || 0}</div><div class="shame-stat-lbl">Critical Overdue</div></div>
          <div class="shame-stat"><div class="shame-stat-num">${d.summary.resolutionRate || 0}%</div><div class="shame-stat-lbl">Resolution Rate</div></div>
        </div>

        <div style="padding:14px 20px;background:#fffbeb;border-bottom:1px solid #fde68a;font-size:13px;color:#92400e;">
          <strong>📢 Take Action:</strong> Click "Demand Fix" on any hazard to add your voice.
          Share on WhatsApp to pressure authorities. Alert your MLA directly.
        </div>

        ${d.shameboard.map((h, i) => this.renderShameCard(h, i + 1)).join('')}

        <div style="padding:16px 20px;text-align:center;font-size:12px;color:#94a3b8;">
          📊 Data updated in real-time · Generated ${new Date(d.generatedAt).toLocaleString('en-IN')}
        </div>
      </div>
    `;

    panel.addEventListener('click', e => { if (e.target === panel) panel.remove(); });
    document.body.appendChild(panel);
  },

  renderShameCard(h, rank) {
    const isHot = h.shameScore > 100;
    const rankEmoji = rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : `#${rank}`;
    return `
      <div class="shame-card sev-${h.severity}" id="shame-card-${h.id}">
        <div class="shame-card-header">
          <div class="shame-rank">${rankEmoji}</div>
          <div>
            <div class="shame-type">${isHot ? '🔥 ' : ''}${h.type}</div>
            <div class="shame-loc">📍 ${h.location}</div>
          </div>
          <span class="shame-days">${h.daysPending} days old</span>
        </div>
        <div class="shame-actions">
          <button class="demand-btn" id="demandBtn-${h.id}" onclick="PressureEngine.submitDemand(${h.id}, this)">
            📢 Demand Fix
            <span class="demand-count-badge" id="demandCount-${h.id}">${h.demandCount > 0 ? `(${h.demandCount})` : ''}</span>
          </button>

          <span class="damage-badge">₹${(h.estimatedDamageINR / 1000).toFixed(0)}K damage</span>

          <button class="share-wa" onclick="window.open('${h.shareLinks.whatsapp}','_blank')" title="Share on WhatsApp">
            📱 WhatsApp
          </button>

          <button class="share-tw" onclick="window.open('${h.shareLinks.twitter}','_blank')" title="Tweet this">
            🐦 Tweet
          </button>

          <button class="share-mla" onclick="window.open('${h.shareLinks.mla}','_blank')" title="Send complaint to MLA via WhatsApp">
            🏛️ Alert MLA
          </button>

          <button onclick="window.open('${h.mapsUrl}','_blank')" style="padding:9px 12px;background:#f1f5f9;border:none;border-radius:10px;cursor:pointer;font-size:13px;color:#1e293b;" title="View on map">
            🗺️ Map
          </button>
        </div>
      </div>
    `;
  },

  async submitDemand(hazardId, btn) {
    if (btn.classList.contains('demanded')) {
      this.toast('You already demanded a fix for this hazard!'); return;
    }
    try {
      const res = await fetch(`${this.API}/api/intelligence/demand/${hazardId}`, { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        btn.classList.add('demanded');
        btn.innerHTML = `✅ Demanded! <span class="demand-count-badge">(${data.totalDemands})</span>`;
        const countEl = document.getElementById(`demandCount-${hazardId}`);
        if (countEl) countEl.textContent = `(${data.totalDemands})`;
        this.toast(data.message);

        if (data.isPressureZone) {
          setTimeout(() => {
            this.toast(`⚡ PRESSURE ZONE! ${data.totalDemands} citizens demanding action on hazard #${hazardId}!`);
          }, 1200);
        }
      }
    } catch (e) { this.toast('Network error — try again'); }
  },

  injectDemandBtnsOnMap() {
    if (!window.L) return;
    const obs = new MutationObserver(mutations => {
      mutations.forEach(m => {
        m.addedNodes.forEach(node => {
          if (!node.classList) return;
          if (node.classList.contains('leaflet-popup') || node.querySelector?.('.leaflet-popup-content')) {
            const content = node.querySelector?.('.leaflet-popup-content');
            if (!content || content.querySelector('.map-demand-btn')) return;
            const btn = content.querySelector('[data-hazard-id]') || content.querySelector('[onclick*="hazardId"]');
            const idMatch = content.innerHTML.match(/hazard[_-]?id['":\s]+(\d+)/i) || content.innerHTML.match(/#(\d+)/);
            const hazardId = btn?.dataset?.hazardId || idMatch?.[1];
            if (!hazardId) return;

            const demandBtn = document.createElement('button');
            demandBtn.className = 'map-demand-btn';
            demandBtn.innerHTML = '📢 Demand Fix';
            demandBtn.onclick = () => PressureEngine.submitDemand(hazardId, demandBtn);
            content.appendChild(demandBtn);
          }
        });
      });
    });
    obs.observe(document.body, { childList: true, subtree: true });
  },

  toast(msg, duration = 3500) {
    const t = document.createElement('div');
    t.className = 'pe-toast';
    t.textContent = msg;
    document.body.appendChild(t);
    setTimeout(() => t.remove(), duration);
  }
};

// ── Auto-init for PressureEngine ──
document.addEventListener('DOMContentLoaded', () => {
  setTimeout(() => PressureEngine.init(), 1500);
});


// ════════════════════════════════════════════════════════════════════════
//  5. UNPRECEDENTED ENGINE MODULE
// ════════════════════════════════════════════════════════════════════════
const UnprecedentedEngine = {
  API: window.API_BASE || 'http://localhost:5000',

  async init() {
    this.injectStyles();
    await Promise.all([
      this.renderEconomicImpactCard(),
      this.renderAccountabilityScore(),
      this.renderPredictiveHotspotsBtn(),
    ]);
    this.observeHazardModals();
    console.log('✅ UnprecedentedEngine ready — 6 world-first features active');
  },

  injectStyles() {
    if (document.getElementById('ue-styles')) return;
    const s = document.createElement('style');
    s.id = 'ue-styles';
    s.textContent = `
      .ue-card { background:#fff; border-radius:16px; padding:16px 20px; margin:8px 0; box-shadow:0 2px 12px rgba(0,0,0,0.08); border:1px solid #e2e8f0; color:#1e293b; }
      [data-theme="dark"] .ue-card { background:#1e293b; border-color:#334155; color:#e2e8f0; }
      .ue-card-title { font-size:12px; font-weight:700; text-transform:uppercase; letter-spacing:0.5px; color:#64748b; margin-bottom:6px; }
      .ue-big-number { font-size:28px; font-weight:900; line-height:1.1; }
      .ue-sub { font-size:12px; color:#64748b; margin-top:3px; }
      .accountability-ring { width:80px; height:80px; border-radius:50%; display:flex; align-items:center; justify-content:center; font-size:28px; font-weight:900; color:#fff; flex-shrink:0; }
      .pledge-btn { padding:8px 12px; border-radius:10px; border:1px solid #e2e8f0; background:#f8fafc; cursor:pointer; font-size:12px; font-weight:600; transition:all 0.2s; text-align:left; color:#1e293b; }
      .pledge-btn:hover { background:#dbeafe; border-color:#3b82f6; }
      .pledge-btn.pledged { background:#dcfce7; border-color:#16a34a; color:#15803d; }
      .vuln-badge { display:inline-flex; align-items:center; gap:6px; background:#fef2f2; color:#dc2626; border:1px solid #fca5a5; border-radius:8px; padding:5px 12px; font-size:12px; font-weight:700; margin:6px 0; }
      .transport-badge { display:inline-flex; align-items:center; gap:6px; background:#eff6ff; color:#1d4ed8; border:1px solid #93c5fd; border-radius:8px; padding:5px 12px; font-size:12px; font-weight:700; margin:4px 0; }
      .hotspot-marker { background:transparent; border:none; }
      .hotspot-pulse { width:20px; height:20px; border-radius:50%; background:rgba(139,92,246,0.3); border:2px solid #7c3aed; animation:hotspot-pulse 2s infinite; }
      @keyframes hotspot-pulse { 0%,100%{transform:scale(1);opacity:1} 50%{transform:scale(1.5);opacity:0.5} }
      .economic-bar { height:6px; border-radius:3px; background:#e2e8f0; margin:4px 0; }
      .economic-bar-fill { height:100%; border-radius:3px; background:linear-gradient(90deg,#f59e0b,#ef4444); transition:width 0.8s ease; }
      .lifespan-badge { display:inline-block; padding:3px 10px; border-radius:20px; font-size:11px; font-weight:700; }
      .lifespan-fresh { background:#dcfce7; color:#15803d; }
      .lifespan-aging { background:#fef3c7; color:#92400e; }
      .lifespan-critical { background:#fee2e2; color:#dc2626; }
    `;
    document.head.appendChild(s);
  },

  async renderEconomicImpactCard() {
    try {
      const lat = (typeof AppState !== 'undefined' && AppState?.userLocation?.lat) || 17.38;
      const lng = (typeof AppState !== 'undefined' && AppState?.userLocation?.lng) || 78.48;
      const res = await fetch(`${this.API}/api/intelligence/economic-impact?lat=${lat}&lng=${lng}&radius=3000`);
      const data = await res.json();
      if (!data.success) return;

      const card = document.createElement('div');
      card.id = 'economic-impact-card';
      card.className = 'ue-card';
      const lakhs = parseFloat(data.economics.grandTotalLakhs);
      const barWidth = Math.min(100, (lakhs / 10) * 100);
      card.innerHTML = `
        <div class="ue-card-title">💰 Economic Damage Estimate</div>
        <div class="ue-big-number" style="color:#ef4444;">₹${data.economics.grandTotalLakhs} Lakhs</div>
        <div class="economic-bar"><div class="economic-bar-fill" style="width:${barWidth}%"></div></div>
        <div class="ue-sub">From ${data.totalHazards} unrepaired hazards | ${data.economics.totalVehiclesAffected.toLocaleString('en-IN')} vehicle encounters</div>
        <div class="ue-sub" style="color:#dc2626;margin-top:4px;">🤕 ~${data.economics.estimatedInjuries} estimated injuries</div>
      `;
      card.title = data.message;

      this._injectCard(card);
    } catch (e) { console.warn('Economic impact card skipped:', e.message); }
  },

  async renderAccountabilityScore() {
    try {
      const res = await fetch(`${this.API}/api/intelligence/accountability`);
      const data = await res.json();
      if (!data.success) return;

      const card = document.createElement('div');
      card.id = 'accountability-card';
      card.className = 'ue-card';
      card.style.cssText = 'display:flex;align-items:center;gap:16px;cursor:pointer;';
      card.innerHTML = `
        <div class="accountability-ring" style="background:${data.color};">${data.grade}</div>
        <div style="flex:1;min-width:0;">
          <div class="ue-card-title">🏛️ Govt. Accountability Score</div>
          <div style="font-weight:700;font-size:14px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${data.accountabilityScore}/100 — ${data.verdict}</div>
          <div class="ue-sub">${data.metrics.resolved}/${data.metrics.totalHazards} resolved · Avg ${data.metrics.avgDaysToFix || '?'} days to fix</div>
          <div class="ue-sub" style="color:#ef4444;">${data.metrics.criticalOverdue || 0} critical hazards OVERDUE</div>
        </div>
      `;
      card.onclick = () => this.showAccountabilityModal(data);

      this._injectCard(card);
    } catch (e) { console.warn('Accountability card skipped:', e.message); }
  },

  _injectCard(card) {
    const targets = [
      document.getElementById('weather-widget'),
      document.getElementById('map-stats'),
      document.querySelector('.map-controls'),
      document.querySelector('.sidebar-content'),
      document.querySelector('.main-content'),
      document.querySelector('#map-view'),
      document.querySelector('.stats-grid'),
      document.querySelector('.map-overlay-cards'),
    ];
    for (const t of targets) {
      if (t) { t.parentNode?.insertBefore(card, t.nextSibling) || t.appendChild(card); return; }
    }
    card.style.cssText += ';position:fixed;bottom:180px;left:16px;z-index:9000;min-width:220px;max-width:280px;';
    document.body.appendChild(card);
  },

  showAccountabilityModal(data) {
    const existing = document.getElementById('accountability-modal');
    if (existing) { existing.remove(); return; }
    const modal = document.createElement('div');
    modal.id = 'accountability-modal';
    modal.style.cssText = 'position:fixed;inset:0;z-index:99999;background:rgba(0,0,0,0.6);display:flex;align-items:center;justify-content:center;';
    const worstRows = (data.worstTypes || []).map(t =>
      `<tr><td style="padding:6px 10px;">${t.hazard_type}</td><td style="padding:6px 10px;text-align:center;">${t.total}</td><td style="padding:6px 10px;text-align:center;color:#ef4444;">${t.resolution_pct || 0}%</td></tr>`
    ).join('');
    modal.innerHTML = `
      <div style="background:#fff;border-radius:20px;padding:28px;max-width:480px;width:92%;max-height:80vh;overflow-y:auto;box-shadow:0 20px 60px rgba(0,0,0,0.3);color:#1e293b;">
        <div style="text-align:center;margin-bottom:20px;">
          <div style="width:100px;height:100px;border-radius:50%;background:${data.color};display:flex;align-items:center;justify-content:center;font-size:48px;font-weight:900;color:#fff;margin:0 auto 12px;">${data.grade}</div>
          <h2 style="font-size:20px;font-weight:800;margin:0 0 4px;">Government Accountability: ${data.accountabilityScore}/100</h2>
          <p style="color:#64748b;font-size:13px;">${data.verdict}</p>
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:16px;">
          <div style="background:#f8fafc;border-radius:10px;padding:12px;text-align:center;"><div style="font-size:24px;font-weight:800;">${data.metrics.resolutionRate}%</div><div style="font-size:11px;color:#64748b;">Resolution Rate</div></div>
          <div style="background:#f8fafc;border-radius:10px;padding:12px;text-align:center;"><div style="font-size:24px;font-weight:800;">${data.metrics.avgDaysToFix || '?'}</div><div style="font-size:11px;color:#64748b;">Avg Days to Fix</div></div>
          <div style="background:#fee2e2;border-radius:10px;padding:12px;text-align:center;"><div style="font-size:24px;font-weight:800;color:#dc2626;">${data.metrics.criticalOverdue || 0}</div><div style="font-size:11px;color:#64748b;">Critical Overdue</div></div>
          <div style="background:#fff7ed;border-radius:10px;padding:12px;text-align:center;"><div style="font-size:24px;font-weight:800;color:#ea580c;">${data.metrics.highOverdue || 0}</div><div style="font-size:11px;color:#64748b;">High Overdue</div></div>
        </div>
        ${worstRows ? `
        <div style="font-weight:700;font-size:13px;margin-bottom:8px;">⚠️ Worst Performing Hazard Types</div>
        <table style="width:100%;border-collapse:collapse;font-size:13px;">
          <thead><tr><th style="text-align:left;padding:6px 10px;background:#f8fafc;">Type</th><th style="padding:6px 10px;background:#f8fafc;">Total</th><th style="padding:6px 10px;background:#f8fafc;">Resolution</th></tr></thead>
          <tbody>${worstRows}</tbody>
        </table>` : ''}
        <div style="margin-top:12px;font-size:11px;color:#94a3b8;text-align:center;">📊 ${data.transparency}</div>
        <button onclick="document.getElementById('accountability-modal').remove()" style="width:100%;margin-top:16px;padding:12px;background:#f1f5f9;border:none;border-radius:12px;cursor:pointer;font-weight:600;color:#1e293b;">✕ Close</button>
      </div>
    `;
    document.body.appendChild(modal);
    modal.addEventListener('click', e => { if (e.target === modal) modal.remove(); });
  },

  renderPredictiveHotspotsBtn() {
    const btn = document.createElement('button');
    btn.id = 'predict-btn';
    btn.textContent = '🔮 Predict Hotspots';
    btn.style.cssText = 'background:linear-gradient(135deg,#7c3aed,#5b21b6);color:#fff;border:none;border-radius:10px;padding:8px 16px;font-weight:700;font-size:13px;cursor:pointer;box-shadow:0 2px 10px rgba(124,58,237,0.4);';
    btn.onclick = () => this.loadPredictiveHotspots();

    const routeBtn = document.getElementById('route-safety-btn') || document.querySelector('.map-btn-group');
    if (routeBtn) routeBtn.parentNode.insertBefore(btn, routeBtn.nextSibling);
  },

  _hotspotLayers: [],
  async loadPredictiveHotspots() {
    const btn = document.getElementById('predict-btn');
    if (btn) btn.textContent = '⏳ Predicting...';

    this._hotspotLayers.forEach(l => { try { (AppState.leafletMap || AppState.map)?.removeLayer(l); } catch {} });
    this._hotspotLayers = [];

    try {
      const lat = AppState?.userLocation?.lat || 17.38;
      const lng = AppState?.userLocation?.lng || 78.48;
      const res = await fetch(`${this.API}/api/intelligence/predict-hotspots?lat=${lat}&lng=${lng}&radius=8000`);
      const data = await res.json();
      if (!data.success) return;

      if (window.L && (AppState.leafletMap || AppState.map)) {
        const theMap = AppState.leafletMap || AppState.map;
        data.predictions.forEach(p => {
          const color = p.likelihood === 'HIGH' ? '#ef4444' : p.likelihood === 'MEDIUM' ? '#f59e0b' : '#84cc16';
          const radius = p.likelihood === 'HIGH' ? 300 : p.likelihood === 'MEDIUM' ? 200 : 150;
          const circle = L.circle([p.lat, p.lng], {
            radius,
            color,
            fillColor: color,
            fillOpacity: 0.15,
            weight: 2,
            dashArray: '5,5'
          }).addTo(theMap);
          circle.bindPopup(`
            <b>🔮 Predicted Hotspot</b><br>
            <b>Likelihood: ${p.likelihood}</b> (${p.predictionScore}% score)<br>
            Most likely: ${p.mostLikelyType}<br>
            History: ${p.historicalCount} past hazards<br>
            Active now: ${p.activeNow} | Recurrence: ${p.recurrenceRate}%
          `);
          this._hotspotLayers.push(circle);
        });
        UI.showToast(`🔮 ${data.predictions.length} predicted hotspots shown (${data.highRisk} HIGH risk)`, 'info', 'Predictive AI');
      }

      if (btn) btn.textContent = `🔮 Hotspots (${data.predictions.length})`;
    } catch (e) {
      if (btn) btn.textContent = '🔮 Predict Hotspots';
      console.warn('Hotspot prediction failed:', e.message);
    }
  },

  observeHazardModals() {
    document.addEventListener('click', async e => {
      const hazardCard = e.target.closest('[data-hazard-id]');
      if (!hazardCard) return;
      const hazardId = hazardCard.dataset.hazardId;
      if (!hazardId || hazardCard.dataset.ueLoaded) return;
      hazardCard.dataset.ueLoaded = '1';

      await new Promise(r => setTimeout(r, 600));
      const modal = document.getElementById('hazard-detail-modal') ||
                    document.getElementById('hazard-modal') ||
                    document.querySelector('.hazard-modal') ||
                    document.querySelector('.modal-content');
      if (!modal) return;

      this.injectModalEnhancements(modal, hazardId);
    });
  },

  async injectModalEnhancements(modal, hazardId) {
    const hazardData = (window.AppData?.hazards || []).find(h => String(h.id) === String(hazardId)) || window.UI?._lastSelectedHazard || {};
    const container = document.createElement('div');
    container.id = `ue-enhancements-${hazardId}`;
    container.style.cssText = 'padding:12px 0;border-top:1px solid rgba(255,255,255,0.08);margin-top:10px;';

    const [vulnRes, transportRes, pledgeRes] = await Promise.allSettled([
      fetch(`${this.API}/api/intelligence/vulnerable-zones?lat=${hazardData?.latitude || 17.38}&lng=${hazardData?.longitude || 78.48}&radius=300`).then(r => r.json()),
      fetch(`${this.API}/api/intelligence/transport-impact/${hazardId}`).then(r => r.json()),
      fetch(`${this.API}/api/intelligence/pledge/${hazardId}`).then(r => r.json())
    ]);

    const vuln = vulnRes.status === 'fulfilled' ? vulnRes.value : null;
    if (vuln?.isVulnerableZone && vuln.badge) {
      container.innerHTML += `<div class="vuln-badge">⚠️ ${vuln.badge}</div><div style="font-size:11px;color:#64748b;margin-bottom:8px;">${vuln.vulnerableZones.map(z => z.name).join(', ')}</div>`;
    }

    const transport = transportRes.status === 'fulfilled' ? transportRes.value : null;
    if (transport?.success && transport.badge) {
      container.innerHTML += `<div class="transport-badge">${transport.badge}</div>`;
    }

    const pledge = pledgeRes.status === 'fulfilled' ? pledgeRes.value : null;
    const pledgeOptions = [
      { type: 'place_warning', label: '⚠️ Place warning sign' },
      { type: 'notify_neighbours', label: '📢 Notify neighbours' },
      { type: 'monitor_daily', label: '👁️ Monitor daily' },
      { type: 'report_to_press', label: '📰 Report to media' },
      { type: 'contact_mla', label: '🏛️ Contact MLA' }
    ];
    const pledgeCount = pledge?.totalPledges || 0;
    const pledgeSectionHTML = `
      <div style="margin-top:10px;">
        <div style="font-weight:700;font-size:13px;margin-bottom:6px;color:#f1f5f9;">🤝 Community Action (${pledgeCount} pledges)</div>
        <div style="display:flex;flex-wrap:wrap;gap:6px;">
          ${pledgeOptions.map(p => `<button class="pledge-btn" data-pledge-type="${p.type}" data-hazard-id="${hazardId}" onclick="UnprecedentedEngine.submitPledge(this, ${hazardId}, '${p.type}')">${p.label}</button>`).join('')}
        </div>
      </div>
    `;
    container.innerHTML += pledgeSectionHTML;

    const modalBody = modal.querySelector('.modal-body') || modal.querySelector('.detail-content') || modal;
    modalBody.appendChild(container);
  },

  async submitPledge(btn, hazardId, pledgeType) {
    if (!AppData.currentUser?.id) {
      UI.showToast('Please login to pledge', 'warning');
      return;
    }
    btn.classList.add('pledged');
    btn.textContent = '✅ ' + btn.textContent.replace('✅ ', '');
    try {
      const res = await fetch(`${this.API}/api/intelligence/pledge`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hazardId, userId: AppData.currentUser.id, pledgeType })
      });
      const data = await res.json();
      UI.showToast(data.message || 'Pledge recorded!', 'success', '🤝 Community Action');
    } catch { btn.classList.remove('pledged'); }
  }
};

// ── Auto-init for UnprecedentedEngine ──
document.addEventListener('DOMContentLoaded', () => {
  setTimeout(() => UnprecedentedEngine.init(), 2500);
});


// ════════════════════════════════════════════════════════════════════════
//  6. HAZARD NOTIFICATIONS & TRANSLATION MODULE
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

  async _registerServiceWorker() {
    if (!('serviceWorker' in navigator)) return;
    try {
      this._swReg = await navigator.serviceWorker.register('/service-worker.js', { scope: '/' });
      console.log('✅ Service Worker registered');

      navigator.serviceWorker.addEventListener('message', e => {
        if (e.data?.type === 'HAZARD_FIXED') {
          this._showToast(`✅ Hazard #${e.data.hazardId} in your area was fixed!`, 'success');
        }
      });
    } catch (e) { console.warn('Service Worker registration failed:', e.message); }
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

    setTimeout(() => document.body.appendChild(btn), 3000);
  },

  _showActiveNotifBadge() {
    const oldBadge = document.getElementById('notif-active-badge');
    if (oldBadge) return;

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

  _scheduleProximityAlerts() {
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
      return text;
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
    let _t = null;
    const obs = new MutationObserver(() => { clearTimeout(_t); _t = setTimeout(_run, 500); });
    obs.observe(document.body, { childList: true, subtree: true });
  },

  _watchLanguageSwitch() {
    const langBtns = document.querySelectorAll('[data-lang], .lang-btn, #lang-en, #lang-te, #lang-hi');
    langBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const lang = btn.dataset.lang || btn.id?.replace('lang-', '') || 'en';
        this._currentLang = lang;
        if (lang !== 'en') this._autoTranslateVisible(lang);
      });
    });

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
      if (!el.checkVisibility?.() && el.offsetParent === null) continue;
      const btn = el.querySelector('.translate-btn');
      if (btn) { btn.innerHTML = '⏳'; }
      const translated = await this.translateText(el.dataset.originalText, lang);
      el.textContent = translated;
      if (btn) { el.appendChild(btn); btn.innerHTML = '🔄 Original'; }
    }
  }
};

// ── Auto-init for HazardNotifications ──
document.addEventListener('DOMContentLoaded', () => {
  setTimeout(() => HazardNotifications.init(), 2000);
});
window.HazardNotifications = HazardNotifications;


// ════════════════════════════════════════════════════════════════════════
//  7. CIVIC TRUST MODULE
// ════════════════════════════════════════════════════════════════════════
const CivicTrust = {
  API: window.API_BASE || 'http://localhost:5000',
  _userId: null,
  _userData: null,

  TIERS: {
    newcomer:  { label: 'Newcomer',  emoji: '🌱', color: '#94a3b8', min: 0,   max: 49,  next: 50  },
    verified:  { label: 'Verified',  emoji: '🥈', color: '#f59e0b', min: 50,  max: 149, next: 150 },
    trusted:   { label: 'Trusted',   emoji: '🥇', color: '#3b82f6', min: 150, max: 299, next: 300 },
    champion:  { label: 'Champion',  emoji: '💎', color: '#dc2626', min: 300, max: 9999, next: null }
  },

  POINT_LABELS: {
    report:  { pts: 10,  label: 'Hazard Reported' },
    demand:  { pts: 2,   label: 'Fix Demanded' },
    pledge:  { pts: 5,   label: 'Pledge Taken' },
    rti:     { pts: 30,  label: 'RTI Filed' },
    verify:  { pts: 20,  label: 'Hazard Verified' },
    resolve: { pts: 50,  label: 'Hazard Fixed!' }
  },

  async init() {
    this._injectStyles();
    this._addNavButton();

    const stored = localStorage.getItem('hazardUser');
    if (stored) {
      try {
        const user = JSON.parse(stored);
        this._userId = user.id;
        await this._loadScore();
      } catch {}
    }

    window.addEventListener('userLoggedIn', async (e) => {
      this._userId = e.detail?.userId;
      await this._loadScore();
    });

    this._hookPointAwards();
  },

  _injectStyles() {
    if (document.getElementById('ct-styles')) return;
    const s = document.createElement('style');
    s.id = 'ct-styles';
    s.textContent = `
      #ct-nav-btn {
        background: linear-gradient(135deg, #dc2626, #991b1b);
        color: #fff !important; border: none; border-radius: 8px;
        padding: 7px 14px; font-weight: 700; cursor: pointer;
        box-shadow: 0 0 12px rgba(220,38,38,0.4);
        position: relative;
      }
      #ct-tier-badge {
        position: absolute; top: -6px; right: -6px; font-size: 14px;
        line-height: 1;
      }

      #ct-panel-overlay {
        position: fixed; inset: 0; z-index: 99996;
        background: rgba(0,0,0,0.6); backdrop-filter: blur(4px);
        display: flex; align-items: center; justify-content: flex-end;
      }
      #ct-panel {
        width: 380px; max-width: 95vw; height: 100vh;
        background: #fff; overflow-y: auto;
        box-shadow: -10px 0 40px rgba(0,0,0,0.3);
        padding: 28px 24px;
        animation: ct-slide-in 0.3s cubic-bezier(.22,1,.36,1);
      }
      @keyframes ct-slide-in { from{transform:translateX(100%)} to{transform:translateX(0)} }
      [data-theme="dark"] #ct-panel { background: #1e293b; color: #f1f5f9; }

      .ct-tier-hero {
        text-align: center; padding: 20px 0 16px;
        border-bottom: 1px solid #f1f5f9; margin-bottom: 20px;
      }
      .ct-tier-emoji { font-size: 52px; line-height: 1; margin-bottom: 8px; }
      .ct-tier-name { font-size: 22px; font-weight: 900; margin-bottom: 4px; }
      .ct-points-big { font-size: 42px; font-weight: 900; line-height: 1; }
      .ct-points-label { font-size: 11px; color: #64748b; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; }

      .ct-progress-wrap { margin: 16px 0; }
      .ct-progress-label { display: flex; justify-content: space-between; font-size: 12px; font-weight: 700; color: #64748b; margin-bottom: 6px; }
      .ct-progress-track { height: 10px; background: #e2e8f0; border-radius: 6px; overflow: hidden; }
      .ct-progress-fill { height: 100%; border-radius: 6px; transition: width 1.5s cubic-bezier(.22,1,.36,1); }

      .ct-stats-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin: 16px 0; }
      .ct-stat-card {
        background: #f8fafc; border-radius: 12px; padding: 14px; text-align: center;
        border: 1px solid #e2e8f0; color: #1e293b;
      }
      [data-theme="dark"] .ct-stat-card { background: #0f172a; border-color: #334155; color: #f1f5f9; }
      .ct-stat-num { font-size: 26px; font-weight: 900; }
      .ct-stat-lbl { font-size: 11px; color: #64748b; font-weight: 600; margin-top: 2px; }

      .ct-tier-row { display: flex; align-items: center; gap: 10px; padding: 10px 0; border-bottom: 1px solid #f1f5f9; }
      [data-theme="dark"] .ct-tier-row { border-color: #334155; }
      .ct-tier-row-emoji { font-size: 22px; }
      .ct-tier-row-info { flex: 1; }
      .ct-tier-row-name { font-weight: 800; font-size: 13px; }
      .ct-tier-row-pts { font-size: 11px; color: #64748b; }
      .ct-tier-row-badge { font-size: 11px; font-weight: 700; padding: 3px 10px; border-radius: 10px; }
      .ct-tier-current { background: #dcfce7; color: #15803d; }
      .ct-tier-locked { background: #f1f5f9; color: #94a3b8; }
      .ct-tier-done { background: #eff6ff; color: #1d4ed8; }

      .ct-comp-section { margin-top: 20px; border-top: 2px solid #f1f5f9; padding-top: 16px; }
      [data-theme="dark"] .ct-comp-section { border-color: #334155; }
      .ct-comp-locked {
        background: #f8fafc; border: 2px dashed #cbd5e1; border-radius: 14px;
        padding: 20px; text-align: center; margin-top: 8px; color: #1e293b;
      }
      .ct-comp-locked-icon { font-size: 36px; margin-bottom: 8px; }
      .ct-comp-locked-title { font-weight: 800; font-size: 15px; margin-bottom: 4px; }
      .ct-comp-locked-sub { font-size: 12px; color: #64748b; }
      .ct-comp-pts-needed { font-size: 18px; font-weight: 900; color: #dc2626; margin: 8px 0; }

      .ct-comp-unlocked { margin-top: 8px; }
      .ct-comp-form-label { font-size: 12px; font-weight: 700; color: #64748b; margin-bottom: 4px; display: block; margin-top: 10px; }
      .ct-comp-select, .ct-comp-input {
        width: 100%; padding: 10px 12px; border: 1.5px solid #e2e8f0; border-radius: 10px;
        font-size: 13px; box-sizing: border-box; background: #fff; color: #1e293b;
      }
      [data-theme="dark"] .ct-comp-select, [data-theme="dark"] .ct-comp-input {
        background: #0f172a; border-color: #334155; color: #f1f5f9;
      }
      .ct-comp-btn {
        width: 100%; margin-top: 12px; padding: 12px;
        background: linear-gradient(135deg, #dc2626, #991b1b);
        color: #fff; border: none; border-radius: 12px;
        font-weight: 800; font-size: 14px; cursor: pointer;
        box-shadow: 0 4px 15px rgba(220,38,38,0.3);
      }
      .ct-comp-btn:hover { transform: translateY(-1px); }

      .ct-notice-box {
        background: #fefce8; border: 1.5px solid #fbbf24; border-radius: 12px;
        padding: 14px; margin-top: 12px; font-size: 11px;
        font-family: 'Courier New', monospace; line-height: 1.6;
        max-height: 200px; overflow-y: auto; cursor: pointer;
        white-space: pre-wrap; color: #1e293b;
      }
      .ct-notice-actions { display: flex; gap: 8px; margin-top: 8px; flex-wrap: wrap; }
      .ct-notice-copy, .ct-notice-email, .ct-notice-print {
        padding: 8px 14px; border-radius: 8px; font-weight: 700; font-size: 11px;
        cursor: pointer; border: none;
      }
      .ct-notice-copy { background: #f1f5f9; color: #374151; }
      .ct-notice-email { background: #dc2626; color: #fff; }
      .ct-notice-print { background: #1d4ed8; color: #fff; }

      .ct-points-toast {
        position: fixed; bottom: 90px; right: 20px; z-index: 99999;
        background: linear-gradient(135deg, #22c55e, #15803d);
        color: #fff; border-radius: 20px; padding: 10px 18px;
        font-weight: 800; font-size: 14px;
        box-shadow: 0 4px 20px rgba(34,197,94,0.4);
        animation: ct-toast-in 0.4s cubic-bezier(.22,1,.36,1);
      }
      @keyframes ct-toast-in { from{opacity:0;transform:translateY(20px) scale(0.8)} to{opacity:1;transform:translateY(0) scale(1)} }
    `;
    document.head.appendChild(s);
  },

  _addNavButton() {
    if (document.getElementById('ct-nav-btn')) return;
    const btn = document.createElement('button');
    btn.id = 'ct-nav-btn';
    btn.className = 'nav-btn';
    btn.innerHTML = '🏆 My Score <span id="ct-tier-badge"></span>';
    btn.onclick = () => this._openPanel();

    const nav = document.querySelector('.desktop-nav, nav, header');
    const firstBtn = nav?.querySelector('.nav-btn, button');
    if (firstBtn) firstBtn.parentNode.insertBefore(btn, firstBtn);
    else if (nav) nav.prepend(btn);
    else { btn.style.cssText='position:fixed;top:14px;left:20px;z-index:9998;'; document.body.appendChild(btn); }
  },

  async _loadScore(userId = this._userId) {
    if (!userId) return;
    try {
      const r = await fetch(`${this.API}/api/intelligence/civic-score/${userId}`);
      if (!r.ok) return;
      this._userData = await r.json();
      this._updateNavBadge();
    } catch {}
  },

  _updateNavBadge() {
    const badge = document.getElementById('ct-tier-badge');
    if (!badge || !this._userData) return;
    const tier = this.TIERS[this._userData.tier] || this.TIERS.newcomer;
    badge.textContent = tier.emoji;
  },

  async _openPanel() {
    const ex = document.getElementById('ct-panel-overlay');
    if (ex) { ex.remove(); return; }

    if (this._userId) await this._loadScore();
    const data = this._userData;
    const tier = this.TIERS[data?.tier || 'newcomer'];
    const pts = data?.civicPoints || 0;
    const progress = tier.next ? Math.min(100, ((pts - tier.min) / (tier.next - tier.min)) * 100) : 100;

    const overlay = document.createElement('div');
    overlay.id = 'ct-panel-overlay';
    overlay.addEventListener('click', e => { if (e.target === overlay) overlay.remove(); });

    overlay.innerHTML = `
      <div id="ct-panel">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px;">
          <div style="font-size:18px;font-weight:900;">🏆 Civic Trust Score</div>
          <button onclick="document.getElementById('ct-panel-overlay').remove()" style="background:none;border:none;font-size:20px;cursor:pointer;color:#64748b;">✕</button>
        </div>
        ${!this._userId ? `
          <div style="text-align:center;padding:40px 20px;color:#64748b;">
            <div style="font-size:40px;margin-bottom:12px;">🔒</div>
            <div style="font-weight:800;font-size:16px;margin-bottom:8px;">Login to See Your Score</div>
            <div style="font-size:13px;">Your civic points are saved per account</div>
          </div>
        ` : `
          <div class="ct-tier-hero">
            <div class="ct-tier-emoji">${tier.emoji}</div>
            <div class="ct-tier-name" style="color:${tier.color};">${tier.label} Reporter</div>
            <div class="ct-points-big" style="color:${tier.color};">${pts}</div>
            <div class="ct-points-label">Civic Points</div>
          </div>

          <div class="ct-progress-wrap">
            <div class="ct-progress-label">
              <span>${tier.label}</span>
              <span>${tier.next ? `${tier.next - pts} pts to ${Object.values(this.TIERS).find(t=>t.min===tier.next)?.label || 'Champion'}` : '🎉 Max Tier!'}</span>
            </div>
            <div class="ct-progress-track">
              <div class="ct-progress-fill" id="ct-pfill" style="width:0%;background:${tier.color};"></div>
            </div>
          </div>

          <div class="ct-stats-grid">
            <div class="ct-stat-card">
              <div class="ct-stat-num">📍 ${data?.stats?.reportsCount || 0}</div>
              <div class="ct-stat-lbl">Hazards Reported</div>
            </div>
            <div class="ct-stat-card">
              <div class="ct-stat-num">🔧 ${data?.stats?.resolvedCount || 0}</div>
              <div class="ct-stat-lbl">Hazards Fixed</div>
            </div>
            <div class="ct-stat-card">
              <div class="ct-stat-num">📋 ${data?.stats?.claimsCount || 0}</div>
              <div class="ct-stat-lbl">Claims Filed</div>
            </div>
            <div class="ct-stat-card">
              <div class="ct-stat-num">🏛️ ${data?.stats?.rtiCount || 0}</div>
              <div class="ct-stat-lbl">RTIs Generated</div>
            </div>
          </div>

          <div style="font-size:12px;font-weight:700;color:#64748b;margin:16px 0 8px;text-transform:uppercase;letter-spacing:1px;">How to Earn Points</div>
          ${Object.entries(this.POINT_LABELS).map(([k,v])=>`
            <div style="display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px solid #f1f5f9;font-size:12px;color:#1e293b;">
              <span>${v.label}</span>
              <span style="font-weight:800;color:#22c55e;">+${v.pts} pts</span>
            </div>
          `).join('')}

          <div style="font-size:12px;font-weight:700;color:#64748b;margin:16px 0 8px;text-transform:uppercase;letter-spacing:1px;">Tier Roadmap</div>
          ${Object.entries(this.TIERS).map(([key, t]) => {
            const isCurrentTier = key === (data?.tier || 'newcomer');
            const isDone = t.max < pts && !isCurrentTier;
            return `
              <div class="ct-tier-row">
                <span class="ct-tier-row-emoji">${t.emoji}</span>
                <div class="ct-tier-row-info">
                  <div class="ct-tier-row-name">${t.label}</div>
                  <div class="ct-tier-row-pts">${t.min}${t.next ? `–${t.max}` : '+'} points</div>
                </div>
                <span class="ct-tier-row-badge ${isCurrentTier ? 'ct-tier-current' : isDone ? 'ct-tier-done' : 'ct-tier-locked'}">
                  ${isCurrentTier ? 'CURRENT' : isDone ? '✓ Done' : '🔒 Locked'}
                </span>
              </div>
            `;
          }).join('')}

          <div class="ct-comp-section">
            <div style="font-size:16px;font-weight:900;margin-bottom:4px;">💰 Compensation Claim</div>
            <div style="font-size:12px;color:#64748b;margin-bottom:8px;">Generate a free legal notice under MV Act 1988 Section 168 to claim vehicle damage compensation from GHMC.</div>

            ${data?.tier === 'champion' ? `
              <div class="ct-comp-unlocked" id="ct-comp-form">
                <div style="background:#dcfce7;border-radius:10px;padding:10px;font-size:12px;font-weight:700;color:#15803d;margin-bottom:12px;">
                  💎 Champion Access Unlocked — You can generate legal notices!
                </div>
                <label class="ct-comp-form-label">Vehicle Type</label>
                <select class="ct-comp-select" id="ct-vehicle">
                  <option value="Two-wheeler (Motorcycle/Scooter)">🏍️ Two-Wheeler (Bike/Scooter)</option>
                  <option value="Four-wheeler (Car/SUV)">🚗 Four-Wheeler (Car/SUV)</option>
                  <option value="Three-wheeler (Auto-rickshaw)">🛺 Three-Wheeler (Auto)</option>
                  <option value="Heavy Vehicle (Truck/Bus)">🚛 Heavy Vehicle</option>
                </select>
                <label class="ct-comp-form-label">Nature of Damage</label>
                <select class="ct-comp-select" id="ct-damage">
                  <option value="Tyre puncture/burst due to pothole">Tyre Burst/Puncture</option>
                  <option value="Suspension/shock absorber damage">Suspension Damage</option>
                  <option value="Wheel rim damage">Rim Damage</option>
                  <option value="Underbody/chassis damage">Underbody Damage</option>
                  <option value="Road accident caused by hazard">Accident Injury</option>
                  <option value="Vehicle fell into open drain/manhole">Open Drain Fall</option>
                </select>
                <label class="ct-comp-form-label">Repair/Medical Cost (₹)</label>
                <input class="ct-comp-input" id="ct-cost" type="number" placeholder="e.g. 8500" min="100">
                <label class="ct-comp-form-label">Your Name (for legal notice)</label>
                <input class="ct-comp-input" id="ct-claimant" type="text" placeholder="Full name as in Aadhaar">
                <label class="ct-comp-form-label">Hazard Location (for notice)</label>
                <input class="ct-comp-input" id="ct-hazard-loc" type="text" placeholder="e.g. Ameerpet Junction, Hyderabad">
                <button class="ct-comp-btn" onclick="CivicTrust._generateClaim()">
                  ⚖️ Generate Legal Notice — FREE
                </button>
                <div id="ct-notice-result" style="display:none;"></div>
              </div>
            ` : `
              <div class="ct-comp-locked">
                <div class="ct-comp-locked-icon">🔒</div>
                <div class="ct-comp-locked-title">Champion Access Required</div>
                <div class="ct-comp-pts-needed">${Math.max(0, 300 - pts)} more points needed</div>
                <div class="ct-comp-locked-sub">
                  Report ${Math.ceil(Math.max(0, 300-pts)/10)} more genuine hazards to unlock.<br>
                  Champions generate free legal notices worth ₹5,000 in lawyer fees.
                </div>
              </div>
            `}
          </div>
        `}
      </div>
    `;
    document.body.appendChild(overlay);
    setTimeout(() => {
      const fill = document.getElementById('ct-pfill');
      if (fill) fill.style.width = progress + '%';
    }, 300);
  },

  _generateClaim() {
    const vehicle  = document.getElementById('ct-vehicle')?.value || 'Vehicle';
    const damage   = document.getElementById('ct-damage')?.value  || 'damage';
    const cost     = parseFloat(document.getElementById('ct-cost')?.value) || 0;
    const name     = document.getElementById('ct-claimant')?.value || 'Citizen';
    const loc      = document.getElementById('ct-hazard-loc')?.value || 'Hyderabad';

    if (!cost || cost < 100) { alert('Please enter a valid repair cost (minimum ₹100)'); return; }
    if (!name.trim()) { alert('Please enter your full name'); return; }

    const demanded = Math.round(cost * 3);
    const date = new Date().toLocaleDateString('en-IN', { day:'2-digit', month:'long', year:'numeric' });

    const notice = `LEGAL NOTICE — DEMAND FOR COMPENSATION
Under Motor Vehicles Act 1988, Section 168
And GHMC Act 1955, Section 12

Date: ${date}
From: ${name}

To:
The Commissioner,
Greater Hyderabad Municipal Corporation (GHMC),
Tank Bund Road, Hyderabad — 500 080.
Email: commissionerghmc@ghmc.gov.in

CC:
1. The District Collector, Hyderabad
2. Commissioner, Road Transport Authority, Telangana

SUBJECT: Legal Demand for Compensation for Vehicle Damage Due to
         Unrepaired Road Hazard at ${loc}

Respected Sir/Madam,

I, ${name}, hereby serve this legal notice under Motor Vehicles Act 1988,
Section 168 and the Supreme Court's directions in Ajay Baweja v. Union of
India (2019), demanding compensation for damage to my ${vehicle} caused by
an unrepaired ${damage} at ${loc}, Hyderabad.

FACTS:
1. The road hazard at ${loc} has been documented and reported on
   HazardAlert Civic Platform with GPS-verified timestamp evidence.
2. Due to GHMC's negligence in not repairing the said hazard within
   stipulated SLA timelines, my vehicle suffered ${damage}.
3. Actual repair/medical cost incurred: Rs. ${cost.toLocaleString('en-IN')}

LEGAL BASIS:
- Section 12, GHMC Act 1955: GHMC has statutory duty to maintain roads
- Section 168, MV Act 1988: Compensation for road accident victims
- Supreme Court: Municipal bodies are strictly liable for hazard negligence
- RTI Act 2005: I reserve right to demand maintenance expenditure records

DEMAND:
I hereby demand compensation of Rs. ${demanded.toLocaleString('en-IN')} (Rupees
${this._numberToWords(demanded)} Only) within 30 days of receipt of this notice.

Failure to respond will compel me to:
1. File a claim before Motor Accident Claims Tribunal (MACT), Hyderabad
2. File an RTI application demanding road maintenance budget records
3. Approach Telangana State Human Rights Commission
4. File a Consumer Complaint before District Consumer Forum

Evidence attached: HazardAlert GPS-verified report, photographs, repair bills.

Yours faithfully,
${name}
Date: ${date}

────────────────────────────────────────
Generated by HazardAlert — Civic Accountability Engine
This notice is legally valid. Keep a copy for your records.`;

    this._lastNotice = notice;
    const resultDiv = document.getElementById('ct-notice-result');
    if (resultDiv) {
      resultDiv.style.display = 'block';
      resultDiv.innerHTML = `
        <div style="font-size:12px;font-weight:700;color:#92400e;background:#fef3c7;padding:8px 12px;border-radius:8px;margin-bottom:8px;">
          ⚠️ Demanded: <strong>Rs. ${demanded.toLocaleString('en-IN')}</strong> (3× actual damage + suffering)
        </div>
        <div class="ct-notice-box" onclick="CivicTrust._copyNotice(this)">${notice}</div>
        <div style="font-size:10px;color:#64748b;margin-top:4px;">Click notice to copy to clipboard</div>
        <div class="ct-notice-actions">
          <button class="ct-notice-copy" onclick="CivicTrust._copyNotice()">📋 Copy</button>
          <button class="ct-notice-email" onclick="CivicTrust._emailNotice('${name}', '${loc}')">📨 Email GHMC</button>
          <button class="ct-notice-print" onclick="CivicTrust._printNotice()">🖨️ Print</button>
        </div>
      `;
      if (this._userId) this._saveClaim(vehicle, damage, cost, demanded, notice);
    }
  },

  _copyNotice(el) {
    if (this._lastNotice) {
      navigator.clipboard.writeText(this._lastNotice).then(() => {
        this._showToast('✅ Legal notice copied to clipboard!');
      }).catch(() => {
        if (el) { const r = document.createRange(); r.selectNode(el); window.getSelection().removeAllRanges(); window.getSelection().addRange(r); document.execCommand('copy'); }
      });
    }
  },

  _emailNotice(name, loc) {
    if (!this._lastNotice) return;
    const sub = encodeURIComponent(`Legal Notice — Compensation Demand — ${loc}`);
    const body = encodeURIComponent(this._lastNotice);
    window.open(`mailto:commissionerghmc@ghmc.gov.in?subject=${sub}&body=${body}`);
  },

  _printNotice() {
    if (!this._lastNotice) return;
    const w = window.open('', '_blank');
    w.document.write(`<html><head><title>Legal Notice</title><style>body{font-family:monospace;font-size:12px;line-height:1.8;margin:40px;white-space:pre-wrap;}</style></head><body>${this._lastNotice}</body></html>`);
    w.document.close();
    setTimeout(() => w.print(), 500);
  },

  async _saveClaim(vehicle, damage, cost, demanded, notice) {
    try {
      await fetch(`${this.API}/api/intelligence/compensation-claim`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: this._userId, vehicleType: vehicle, damageType: damage, repairCost: cost, compensationDemanded: demanded, noticeText: notice })
      });
    } catch {}
  },

  showPointsToast(action) {
    const info = this.POINT_LABELS[action];
    if (!info) return;
    const t = document.createElement('div');
    t.className = 'ct-points-toast';
    t.innerHTML = `+${info.pts} pts 🏆 ${info.label}`;
    document.body.appendChild(t);
    setTimeout(() => t.style.opacity = '0', 3000);
    setTimeout(() => t.remove(), 3500);

    if (this._userData) {
      this._userData.civicPoints = (this._userData.civicPoints || 0) + info.pts;
      this._updateNavBadge();
    }
  },

  _hookPointAwards() {
    const origFetch = window.fetch;
    window.fetch = async (url, opts) => {
      const result = await origFetch(url, opts);
      try {
        const urlStr = typeof url === 'string' ? url : url.url || '';
        const method = opts?.method?.toUpperCase() || 'GET';
        if (method === 'POST') {
          if (urlStr.includes('/api/hazards') && !urlStr.includes('intelligence')) {
            const clone = result.clone();
            clone.json().then(d => { if (d.success) this.showPointsToast('report'); }).catch(()=>{});
          } else if (urlStr.includes('/api/intelligence/demand/')) {
            this.showPointsToast('demand');
          } else if (urlStr.includes('/api/intelligence/pledge')) {
            this.showPointsToast('pledge');
          }
        }
      } catch {}
      return result;
    };
  },

  _numberToWords(n) {
    if (n < 1000) return n + '';
    if (n < 100000) return Math.floor(n/1000) + ' Thousand';
    if (n < 10000000) return (n/100000).toFixed(1) + ' Lakh';
    return (n/10000000).toFixed(1) + ' Crore';
  },

  _showToast(msg) {
    const t = document.createElement('div');
    t.className = 'ct-points-toast';
    t.textContent = msg;
    document.body.appendChild(t);
    setTimeout(() => t.remove(), 3500);
  }
};

// ── Auto-init for CivicTrust ──
document.addEventListener('DOMContentLoaded', () => {
  setTimeout(() => CivicTrust.init(), 1500);
});
window.CivicTrust = CivicTrust;


// ════════════════════════════════════════════════════════════════════════
//  8. INTERACTIVE CITIZEN PROFILE PANEL MODULE
// ════════════════════════════════════════════════════════════════════════
const ProfilePanel = (() => {
  const API = () => window.API_BASE || 'http://localhost:5000';

  const TIERS = [
    { name: 'Newcomer',    min: 0,   max: 49,  color: '#64748b', bg: '#64748b18', icon: '🌱', next: 'Aware' },
    { name: 'Aware',       min: 50,  max: 149, color: '#3b82f6', bg: '#3b82f618', icon: '🥈', next: 'Contributor' },
    { name: 'Contributor', min: 150, max: 249, color: '#8b5cf6', bg: '#8b5cf618', icon: '⭐', next: 'Leader' },
    { name: 'Leader',      min: 250, max: 349, color: '#f59e0b', bg: '#f59e0b18', icon: '🎖️', next: 'Champion' },
    { name: 'Champion',    min: 350, max: 99999, color: '#dc2626', bg: '#dc262618', icon: '💎', next: null },
  ];

  const BADGES = [
    { id: 'first_report',   icon: '📍', name: 'First Report',     desc: 'Filed first hazard',          check: d => d.r >= 1 },
    { id: 'reporter_5',     icon: '🗂️', name: '5 Reports',        desc: 'Filed 5+ hazards',            check: d => d.r >= 5 },
    { id: 'reporter_10',    icon: '🏅', name: 'Active Reporter',  desc: 'Filed 10+ hazards',           check: d => d.r >= 10 },
    { id: 'verifier_5',     icon: '✅', name: 'Verifier',         desc: 'Verified 5 hazards',          check: d => d.v >= 5 },
    { id: 'pothole_hunter', icon: '🕳️', name: 'Pothole Hunter',   desc: 'Reported 3+ potholes',       check: d => d.p >= 3 },
    { id: 'champion_tier',  icon: '💎', name: 'Champion',         desc: 'Reached Champion tier',       check: d => d.tier === 'champion' },
    { id: 'rti_warrior',    icon: '📋', name: 'RTI Warrior',      desc: 'Filed an RTI notice',         check: d => d.rti >= 1 },
    { id: 'claim_holder',   icon: '⚖️', name: 'Claim Holder',     desc: 'Filed compensation claim',    check: d => d.claims >= 1 },
  ];

  let _open = false;

  function _css() {
    if (document.getElementById('pp-css')) return;
    const el = document.createElement('style');
    el.id = 'pp-css';
    el.textContent = `
      #pp-overlay {
        position:fixed;inset:0;z-index:29998;background:rgba(0,0,0,0.6);
        backdrop-filter:blur(5px);opacity:0;pointer-events:none;
        transition:opacity .35s;
      }
      #pp-overlay.pp-on { opacity:1;pointer-events:all; }

      #pp-panel {
        position:fixed;top:0;right:0;bottom:0;z-index:29999;
        width:440px;max-width:100vw;overflow-y:auto;
        background:linear-gradient(170deg,#0d1117 0%,#161b22 40%,#0d1117 100%);
        border-left:1px solid rgba(255,255,255,0.06);
        box-shadow:-24px 0 80px rgba(0,0,0,0.6);
        transform:translateX(110%);transition:transform .4s cubic-bezier(.22,1,.36,1);
        display:flex;flex-direction:column;
        scrollbar-width:thin;scrollbar-color:rgba(255,255,255,0.08) transparent;
      }
      #pp-panel.pp-on { transform:translateX(0); }

      .pp-hdr {
        display:flex;align-items:center;justify-content:space-between;
        padding:18px 20px 16px;border-bottom:1px solid rgba(255,255,255,0.05);
        position:sticky;top:0;background:#0d1117;z-index:2;
      }
      .pp-hdr-label { font-size:11px;font-weight:800;color:#475569;text-transform:uppercase;letter-spacing:2px; }
      .pp-x {
        width:30px;height:30px;border-radius:50%;border:none;cursor:pointer;
        background:rgba(255,255,255,0.05);color:#64748b;font-size:16px;
        display:flex;align-items:center;justify-content:center;
      }
      .pp-x:hover { background:rgba(220,38,38,0.15);color:#f87171; }

      .pp-hero {
        padding:22px 20px 18px;display:flex;gap:18px;align-items:flex-start;
        background:linear-gradient(135deg,rgba(220,38,38,0.06),rgba(124,58,237,0.04));
        border-bottom:1px solid rgba(255,255,255,0.05);
      }
      .pp-ring {
        width:76px;height:76px;border-radius:50%;flex-shrink:0;
        display:flex;align-items:center;justify-content:center;
        font-size:32px;font-weight:900;
        border:3px solid var(--tc,#dc2626);
        background:linear-gradient(135deg,#161b22,#0d1117);
        box-shadow:0 0 22px var(--tc,#dc2626);
        animation:ppGlow 3s ease-in-out infinite;cursor:pointer;
        position:relative;
        color: #fff;
      }
      @keyframes ppGlow {
        0%,100%{box-shadow:0 0 14px var(--tc,#dc2626);}
        50%{box-shadow:0 0 28px var(--tc,#dc2626);}
      }
      .pp-ring-badge {
        position:absolute;bottom:-3px;right:-3px;width:22px;height:22px;
        border-radius:50%;background:var(--tc,#dc2626);
        display:flex;align-items:center;justify-content:center;
        font-size:11px;border:2px solid #0d1117;
      }
      .pp-hero-info { flex:1;min-width:0; }
      .pp-name-wrap { display:flex;align-items:center;gap:8px;margin-bottom:6px; }
      .pp-name { font-size:19px;font-weight:900;color:#f1f5f9;white-space:nowrap;overflow:hidden;text-overflow:ellipsis; }
      .pp-edit-btn {
        font-size:12px;background:none;border:none;cursor:pointer;
        color:#475569;padding:2px 6px;border-radius:4px;
      }
      .pp-edit-btn:hover{background:rgba(255,255,255,0.06);color:#94a3b8;}
      .pp-edit-input {
        font-size:16px;font-weight:700;background:rgba(255,255,255,0.05);
        border:1px solid rgba(255,255,255,0.15);border-radius:6px;
        color:#f1f5f9;padding:4px 10px;width:100%;outline:none;
      }
      .pp-tier-chip {
        display:inline-flex;align-items:center;gap:6px;
        font-size:11px;font-weight:800;padding:3px 10px;border-radius:20px;
        border:1px solid var(--tc,#dc2626);
        color:var(--tc,#dc2626);background:var(--bg,#dc262618);
        margin-bottom:6px;
      }
      .pp-email { font-size:11px;color:#475569; }
      .pp-rank-chip {
        display:inline-flex;align-items:center;gap:4px;margin-top:6px;
        font-size:11px;font-weight:700;color:#a855f7;
        background:rgba(168,85,247,0.1);padding:3px 10px;border-radius:20px;
        border:1px solid rgba(168,85,247,0.2);
      }

      .pp-xp { padding:16px 20px;border-bottom:1px solid rgba(255,255,255,0.04); }
      .pp-xp-row { display:flex;justify-content:space-between;margin-bottom:8px;align-items:center; }
      .pp-xp-row span { font-size:11px;color:#475569;font-weight:600; }
      .pp-xp-row strong { font-size:14px;color:#f1f5f9;font-weight:900; }
      .pp-bar-bg { height:9px;border-radius:5px;background:rgba(255,255,255,0.05);overflow:hidden;position:relative; }
      .pp-bar-fill {
        height:100%;border-radius:5px;width:0;
        background:linear-gradient(90deg,var(--tc,#dc2626),var(--tc,#dc2626)99);
        transition:width 1.4s cubic-bezier(.22,1,.36,1);
        position:relative;overflow:hidden;
      }
      .pp-bar-fill::after {
        content:'';position:absolute;inset:0;
        background:linear-gradient(90deg,transparent,rgba(255,255,255,0.25),transparent);
        animation:ppShimmer 2.2s infinite;
      }
      @keyframes ppShimmer{from{transform:translateX(-150%)}to{transform:translateX(250%)}}
      .pp-xp-hint { font-size:10px;color:#475569;margin-top:5px;text-align:right; }

      .pp-stats { display:grid;grid-template-columns:1fr 1fr;gap:9px;padding:14px 20px;border-bottom:1px solid rgba(255,255,255,0.04); }
      .pp-sc {
        background:rgba(255,255,255,0.02);border:1px solid rgba(255,255,255,0.05);
        border-radius:12px;padding:14px 12px;text-align:center;transition:all .2s;cursor:default;
      }
      .pp-sc:hover { background:rgba(255,255,255,0.05);border-color:rgba(255,255,255,0.1);transform:translateY(-2px); }
      .pp-sv { font-size:28px;font-weight:900;line-height:1;margin-bottom:4px; }
      .pp-sl { font-size:10px;color:#475569;font-weight:700;text-transform:uppercase;letter-spacing:.5px; }

      .pp-impact {
        margin:0 20px 14px;
        background:linear-gradient(135deg,rgba(220,38,38,0.07),rgba(168,85,247,0.06));
        border:1px solid rgba(220,38,38,0.12);border-radius:14px;
        padding:14px 16px;display:flex;gap:12px;align-items:center;
      }
      .pp-impact-ico { font-size:28px;flex-shrink:0; }
      .pp-impact-txt { font-size:12px;color:#94a3b8;line-height:1.6; }
      .pp-impact-txt strong { color:#f1f5f9;font-size:15px;font-weight:900; }

      .pp-sec {
        padding:0 20px 10px;margin-top:14px;
        font-size:10px;font-weight:800;color:#475569;text-transform:uppercase;letter-spacing:2px;
        display:flex;align-items:center;gap:10px;
      }
      .pp-sec::after{content:'';flex:1;height:1px;background:rgba(255,255,255,0.04);}

      .pp-badges { display:grid;grid-template-columns:1fr 1fr;gap:8px;padding:0 20px 14px; }
      .pp-badge {
        display:flex;align-items:center;gap:10px;
        background:rgba(255,255,255,0.02);border:1px solid rgba(255,255,255,0.05);
        border-radius:10px;padding:10px 12px;transition:all .2s;position:relative;overflow:hidden;
      }
      .pp-badge.earned {
        background:rgba(34,197,94,0.06);border-color:rgba(34,197,94,0.18);
      }
      .pp-badge.earned::before {
        content:'✓';position:absolute;top:5px;right:7px;
        font-size:9px;color:#4ade80;font-weight:900;
      }
      .pp-badge.locked { opacity:.28;filter:grayscale(1); }
      .pp-badge-ico { font-size:20px;flex-shrink:0; }
      .pp-badge-n { font-size:11px;font-weight:700;color:#cbd5e1; }
      .pp-badge.earned .pp-badge-n { color:#4ade80; }
      .pp-badge-d { font-size:10px;color:#475569; }

      .pp-feed { padding:0 20px 14px;display:flex;flex-direction:column;gap:7px; }
      .pp-item {
        display:flex;gap:12px;align-items:flex-start;
        background:rgba(255,255,255,0.02);border:1px solid rgba(255,255,255,0.04);
        border-radius:10px;padding:10px 12px;transition:all .2s;
      }
      .pp-item:hover{background:rgba(255,255,255,0.04);}
      .pp-dot { width:8px;height:8px;border-radius:50%;flex-shrink:0;margin-top:5px; }
      .sev-critical{background:#dc2626;box-shadow:0 0 6px #dc2626;}
      .sev-high{background:#f97316;}
      .sev-medium{background:#eab308;}
      .sev-low{background:#22c55e;}
      .pp-item-inf{flex:1;min-width:0;}
      .pp-item-t{font-size:12px;font-weight:700;color:#e2e8f0;}
      .pp-item-m{font-size:10px;color:#475569;margin-top:2px;}
      .pp-sta{font-size:10px;font-weight:700;padding:2px 8px;border-radius:20px;flex-shrink:0;}
      .sta-pending{background:rgba(234,179,8,.12);color:#eab308;}
      .sta-resolved{background:rgba(34,197,94,.12);color:#4ade80;}
      .sta-disputed{background:rgba(239,68,68,.12);color:#f87171;}
      .sta-verified{background:rgba(99,102,241,.12);color:#818cf8;}

      .pp-perks{padding:0 20px 14px;display:flex;flex-direction:column;gap:5px;}
      .pp-perk{display:flex;align-items:center;gap:10px;font-size:12px;color:#94a3b8;padding:7px 12px;border-radius:8px;background:rgba(255,255,255,0.02);}
      .pp-perk-dot{width:6px;height:6px;border-radius:50%;background:var(--tc,#dc2626);flex-shrink:0;}

      .pp-share-card {
        margin:0 20px 14px;
        background:linear-gradient(135deg,#161b22,#0d1117);
        border:1px solid rgba(255,255,255,0.07);border-radius:16px;
        padding:16px 18px;text-align:center;cursor:pointer;transition:all .2s;
      }
      .pp-share-card:hover{border-color:rgba(220,38,38,0.3);box-shadow:0 0 20px rgba(220,38,38,0.08);}
      .pp-share-card-lbl{font-size:11px;color:#475569;font-weight:700;margin-bottom:8px;text-transform:uppercase;letter-spacing:1px;}
      .pp-share-card-id{font-size:28px;font-weight:900;letter-spacing:2px;background:linear-gradient(135deg,var(--tc,#dc2626),#a855f7);-webkit-background-clip:text;-webkit-text-fill-color:transparent;}
      .pp-share-card-sub{font-size:11px;color:#475569;margin-top:4px;}

      .pp-acts{padding:14px 20px 28px;display:flex;gap:9px;flex-wrap:wrap;}
      .pp-btn{flex:1;min-width:110px;padding:10px 14px;border-radius:10px;font-size:12px;font-weight:700;cursor:pointer;border:none;transition:all .2s;letter-spacing:.3px;}
      .pp-btn-red{background:linear-gradient(135deg,#dc2626,#991b1b);color:#fff;box-shadow:0 4px 16px rgba(220,38,38,.25);}
      .pp-btn-red:hover{transform:translateY(-1px);box-shadow:0 6px 24px rgba(220,38,38,.4);}
      .pp-btn-ghost{background:rgba(255,255,255,0.04);color:#94a3b8;border:1px solid rgba(255,255,255,0.08);}
      .pp-btn-ghost:hover{background:rgba(255,255,255,0.08);color:#f1f5f9;}
      .pp-btn-danger{background:rgba(239,68,68,0.08);color:#f87171;border:1px solid rgba(239,68,68,0.15);}
      .pp-btn-danger:hover{background:rgba(239,68,68,0.14);}

      .pp-skel{background:linear-gradient(90deg,rgba(255,255,255,0.03) 25%,rgba(255,255,255,0.06) 50%,rgba(255,255,255,0.03) 75%);background-size:400% 100%;animation:ppSk 1.8s infinite;border-radius:6px;}
      @keyframes ppSk{from{background-position:100% 0}to{background-position:-100% 0}}

      @media(max-width:480px){#pp-panel{width:100vw;}}
    `;
    document.head.appendChild(el);
  }

  function _build() {
    if (document.getElementById('pp-overlay')) return;
    const ov = document.createElement('div'); ov.id = 'pp-overlay';
    ov.addEventListener('click', close);
    const pn = document.createElement('div'); pn.id = 'pp-panel';
    pn.setAttribute('role', 'dialog'); pn.setAttribute('aria-modal', 'true');
    document.body.append(ov, pn);
  }

  function _tier(pts) { return TIERS.find(t => pts >= t.min && pts <= t.max) || TIERS[0]; }
  function _xpPct(pts) {
    const t = _tier(pts);
    return t.max === 99999 ? 100 : Math.round(((pts - t.min) / (t.max - t.min)) * 100);
  }
  function _timeAgo(ts) {
    if (!ts) return '';
    const d = Math.floor((Date.now() - new Date(ts)) / 60000);
    if (d < 60) return d + 'm ago';
    if (d < 1440) return Math.floor(d/60) + 'h ago';
    return Math.floor(d/1440) + 'd ago';
  }

  async function _fetch(uid) {
    try {
      const [uRes, hRes, cRes, lRes] = await Promise.allSettled([
        fetch(`${API()}/api/users/${uid}`),
        fetch(`${API()}/api/hazards?limit=30`),
        fetch(`${API()}/api/intelligence/civic-score/${uid}`),
        fetch(`${API()}/api/intelligence/leaderboard`),
      ]);

      const u = uRes.status === 'fulfilled' && uRes.value.ok ? await uRes.value.json() : {};
      const h = hRes.status === 'fulfilled' && hRes.value.ok ? await hRes.value.json() : {};
      const c = cRes.status === 'fulfilled' && cRes.value.ok ? await cRes.value.json() : {};
      const l = lRes.status === 'fulfilled' && lRes.value.ok ? await lRes.value.json() : {};

      const user = u.user || u || {};
      const allH = h.hazards || (Array.isArray(h) ? h : []);
      const myH = allH.filter(x => String(x.user_id||x.userId) === String(uid));
      const recent = myH.slice(0, 5);

      const pts = c.civicPoints || user.civic_points || 0;
      const tierStr = c.tier || user.trust_tier || 'newcomer';

      let rank = null;
      const lb = l.leaderboard || l.leaders || [];
      const myRank = lb.findIndex(x => String(x.userId||x.id) === String(uid));
      if (myRank !== -1) rank = myRank + 1;

      const base = window.AppData?.currentUser || {};

      return {
        user: { ...base, ...user, civic_points: pts, trust_tier: tierStr },
        reports: myH.length,
        verifications: c.verifyCount || 0,
        resolved: myH.filter(x => x.status === 'resolved').length,
        potholes: myH.filter(x => (x.hazard_type||x.hazardType||'').toLowerCase().includes('pothole')).length,
        rti: c.rtiCount || 0,
        claims: c.claimsCount || (tierStr === 'champion' ? 1 : 0),
        rank,
        recent,
        pts,
        tierStr
      };
    } catch (e) {
      const u = window.AppData?.currentUser || {};
      return { user: u, reports: 0, verifications: 0, resolved: 0, potholes: 0, rti: 0, claims: 0, rank: null, recent: [], pts: u.civic_points||0, tierStr: u.trust_tier||'newcomer' };
    }
  }

  function _skeleton() {
    document.getElementById('pp-panel').innerHTML = `
      <div class="pp-hdr">
        <span class="pp-hdr-label">Citizen Profile</span>
        <button class="pp-x" onclick="ProfilePanel.close()">✕</button>
      </div>
      <div class="pp-hero">
        <div class="pp-ring pp-skel" style="width:76px;height:76px;border:none;box-shadow:none;animation:ppSk 1.8s infinite,ppGlow 99s"></div>
        <div style="flex:1;display:flex;flex-direction:column;gap:10px;padding-top:4px">
          <div class="pp-skel" style="height:20px;width:65%"></div>
          <div class="pp-skel" style="height:14px;width:45%"></div>
          <div class="pp-skel" style="height:12px;width:55%"></div>
        </div>
      </div>
      <div style="padding:20px;display:flex;flex-direction:column;gap:12px">
        ${[90,75,60,80,50].map(w=>`<div class="pp-skel" style="height:11px;width:${w}%"></div>`).join('')}
      </div>`;
  }

  function _render(data) {
    const panel = document.getElementById('pp-panel');
    if (!panel) return;

    const { user, reports, verifications, resolved, potholes, rti, claims, rank, recent, pts, tierStr } = data;
    const t = _tier(pts);
    const pct = _xpPct(pts);
    const nextT = TIERS.find(x => x.name.toLowerCase() === (t.next || '').toLowerCase());
    const peopleHelped = reports * 47 + verifications * 12;
    const savings = (reports * 9.3).toFixed(1);
    const initials = (user.name || user.username || 'C').charAt(0).toUpperCase();

    const bd = { r: reports, v: verifications, p: potholes, tier: tierStr, rti, claims };
    const earned = BADGES.filter(b => { try { return b.check(bd); } catch { return false; } }).map(b => b.id);

    panel.style.setProperty('--tc', t.color);
    panel.style.setProperty('--bg', t.bg);

    panel.innerHTML = `
      <div class="pp-hdr">
        <span class="pp-hdr-label">👤 Citizen Profile</span>
        <button class="pp-x" onclick="ProfilePanel.close()" aria-label="Close">✕</button>
      </div>

      <div class="pp-hero">
        <div class="pp-ring" title="Click to change avatar" style="--tc:${t.color}">
          ${initials}
          <div class="pp-ring-badge">${t.icon}</div>
        </div>
        <div class="pp-hero-info">
          <div class="pp-name-wrap">
            <div class="pp-name" id="pp-name-display">${user.name || user.username || 'Citizen'}</div>
            <button class="pp-edit-btn" onclick="ProfilePanel._editName()" title="Edit name">✏️</button>
          </div>
          <div class="pp-tier-chip" style="--tc:${t.color};--bg:${t.bg};color:${t.color};background:${t.bg};border-color:${t.color}44">
            ${t.icon} ${t.name.toUpperCase()}
          </div>
          <div class="pp-email">${user.email || ''}</div>
          ${rank ? `<div class="pp-rank-chip">🏆 City Rank #${rank}</div>` : ''}
        </div>
      </div>

      <div class="pp-xp">
        <div class="pp-xp-row">
          <span>${t.icon} ${t.name}</span>
          <strong style="color:${t.color}">${pts.toLocaleString('en-IN')} pts</strong>
        </div>
        <div class="pp-bar-bg">
          <div class="pp-bar-fill" id="pp-fill" style="width:0%;background:linear-gradient(90deg,${t.color},${t.color}bb)"></div>
        </div>
        <div class="pp-xp-hint">
          ${nextT
            ? `${pct}% · Need ${(nextT.min - pts).toLocaleString('en-IN')} more pts for ${nextT.icon} ${nextT.name}`
            : `<span style="color:${t.color}">🏆 Maximum tier — fully unlocked!</span>`}
        </div>
      </div>

      <div class="pp-stats">
        <div class="pp-sc">
          <div class="pp-sv" style="color:#ef4444">${reports}</div>
          <div class="pp-sl">Hazards Reported</div>
        </div>
        <div class="pp-sc">
          <div class="pp-sv" style="color:#22c55e">${verifications}</div>
          <div class="pp-sl">Hazards Verified</div>
        </div>
        <div class="pp-sc">
          <div class="pp-sv" style="color:${t.color}">${pts}</div>
          <div class="pp-sl">Civic Points</div>
        </div>
        <div class="pp-sc">
          <div class="pp-sv" style="color:#a855f7">${resolved}</div>
          <div class="pp-sl">Got Fixed</div>
        </div>
      </div>

      <div class="pp-impact">
        <div class="pp-impact-ico">🌆</div>
        <div class="pp-impact-txt">
          Your civic actions have helped
          <strong>~${peopleHelped.toLocaleString('en-IN')} people</strong>
          travel safer in Hyderabad, saving an estimated
          <strong>₹${savings}L</strong> in road damage costs.
        </div>
      </div>

      <div class="pp-sec">🪪 Civic ID</div>
      <div class="pp-share-card" onclick="ProfilePanel._share('${user.id||0}','${user.name||'Citizen'}','${t.name}','${pts}')" title="Click to copy your civic card">
        <div class="pp-share-card-lbl">My Civic Identity</div>
        <div class="pp-share-card-id">#${String(user.id||'0000').padStart(4,'0')}</div>
        <div class="pp-share-card-sub">${t.icon} ${t.name} · ${pts} pts · Click to share 📋</div>
      </div>

      <div class="pp-sec">🏅 Achievements (${earned.length}/${BADGES.length})</div>
      <div class="pp-badges">
        ${BADGES.map(b => `
          <div class="pp-badge ${earned.includes(b.id) ? 'earned' : 'locked'}" title="${b.desc}">
            <span class="pp-badge-ico">${b.icon}</span>
            <div>
              <div class="pp-badge-n">${b.name}</div>
              <div class="pp-badge-d">${b.desc}</div>
            </div>
          </div>`).join('')}
      </div>

      ${recent.length > 0 ? `
        <div class="pp-sec">📍 Recent Reports</div>
        <div class="pp-feed">
          ${recent.map(h => `
            <div class="pp-item">
              <div class="pp-dot sev-${h.severity||'medium'}"></div>
              <div class="pp-item-inf">
                <div class="pp-item-t">${h.hazard_type||h.hazardType||'Hazard'}</div>
                <div class="pp-item-m">${h.address||'Hyderabad'} · ${_timeAgo(h.created_at||h.createdAt)}</div>
              </div>
              <span class="pp-sta sta-${h.status||'pending'}">${(h.status||'PENDING').toUpperCase()}</span>
            </div>`).join('')}
        </div>
      ` : ''}

      <div class="pp-sec">✨ Your Perks</div>
      <div class="pp-perks">
        ${_getPerks(t.name).map(p => `
          <div class="pp-perk">
            <div class="pp-perk-dot" style="background:${p.locked?'#1e293b':t.color}"></div>
            <span style="${p.locked?'color:#475569':''}">${p.text}</span>
          </div>`).join('')}
      </div>

      <div class="pp-acts">
        <button class="pp-btn pp-btn-red" onclick="ProfilePanel.close();setTimeout(()=>document.getElementById('report-hazard-btn')?.click(),200)">
          📍 Report Hazard
        </button>
        ${tierStr === 'champion' ? `<button class="pp-btn pp-btn-ghost" onclick="ProfilePanel.close();setTimeout(()=>document.querySelector('[onclick*=compensation],[onclick*=Compensation]')?.click(),200)">⚖️ Claim</button>` : ''}
        <button class="pp-btn pp-btn-danger" onclick="ProfilePanel.close();setTimeout(()=>document.getElementById('logout-link')?.click(),200)">🚪 Logout</button>
      </div>
    `;

    requestAnimationFrame(() => setTimeout(() => {
      const fill = document.getElementById('pp-fill');
      if (fill) fill.style.width = pct + '%';
    }, 120));

    window._ppUserId = user.id;
    window._ppUserName = user.name || user.username || 'Citizen';
  }

  function _getPerks(tierName) {
    const all = [
      { text: 'Report road hazards to the map', tiers: ['Newcomer','Aware','Contributor','Leader','Champion'] },
      { text: 'Receive real-time nearby alerts', tiers: ['Aware','Contributor','Leader','Champion'] },
      { text: 'Verify hazard reports', tiers: ['Aware','Contributor','Leader','Champion'] },
      { text: 'Generate RTI legal notices', tiers: ['Contributor','Leader','Champion'] },
      { text: 'Demand auto-escalation to officials', tiers: ['Leader','Champion'] },
      { text: '⚖️ File legal compensation claims', tiers: ['Champion'] },
    ];
    return all.map(p => ({ text: p.text, locked: !p.tiers.includes(tierName) }));
  }

  function _editName() {
    const nameEl = document.getElementById('pp-name-display');
    if (!nameEl) return;
    const current = nameEl.textContent.trim();
    nameEl.outerHTML = `<input class="pp-edit-input" id="pp-name-input" value="${current}" maxlength="40" placeholder="Your name" onblur="ProfilePanel._saveName()" onkeydown="if(event.key==='Enter')this.blur();if(event.key==='Escape'){this.value='${current}';this.blur();}">`;
    document.getElementById('pp-name-input')?.focus();
  }

  function _saveName() {
    const input = document.getElementById('pp-name-input');
    if (!input) return;
    const val = input.value.trim() || window._ppUserName;
    input.outerHTML = `<div class="pp-name" id="pp-name-display">${val}</div>`;
    const dn = document.getElementById('dropdown-username');
    if (dn) dn.textContent = val;
    if (window.AppData?.currentUser) window.AppData.currentUser.name = val;
    if (typeof UI !== 'undefined' && UI.showToast) UI.showToast('Name updated!', 'success');
  }

  function _share(id, name, tier, pts) {
    const text = `🏙️ I'm a ${tier} citizen on HazardAlert!\n👤 ${name} • #${String(id).padStart(4,'0')}\n🏆 ${pts} Civic Points\n\nHelping make Hyderabad safer! 🚨`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
      if (typeof UI !== 'undefined') UI.showToast('Civic ID copied to clipboard! 📋', 'success');
    }
  }

  function _watchLogin() {
    const _update = () => {
      const u = window.AppData?.currentUser;
      const dn = document.getElementById('dropdown-username');
      if (!dn || !u?.name) return;
      const t = _tier(u.civic_points || 0);
      dn.textContent = `${u.name} ${t.icon}`;
    };
    setTimeout(_update, 500);
    setTimeout(_update, 2000);
    setInterval(_update, 5000);
  }

  function _outsideDropdown() {
    document.addEventListener('click', e => {
      const menu = document.getElementById('user-menu');
      const dd = document.getElementById('user-dropdown');
      if (dd && !dd.classList.contains('hidden') && !menu?.contains(e.target)) {
        dd.classList.add('hidden');
      }
    });
  }

  function _wire() {
    document.addEventListener('click', e => {
      const t = e.target.closest('#mobile-profile-btn, .pp-open-trigger');
      if (t) { e.preventDefault(); open(); }
    });
    document.addEventListener('keydown', e => { if (e.key === 'Escape' && _open) close(); });
    _watchLogin();
    _outsideDropdown();
  }

  async function open(uid) {
    const userId = uid || window.AppData?.currentUser?.id;
    if (!userId) {
      if (typeof UI !== 'undefined') UI.showToast('Please login to view your profile', 'error');
      return;
    }
    _css(); _build();
    const ov = document.getElementById('pp-overlay');
    const pn = document.getElementById('pp-panel');
    _skeleton();
    ov.classList.add('pp-on');
    pn.classList.add('pp-on');
    document.body.style.overflow = 'hidden';
    _open = true;

    const data = await _fetch(userId);
    _render(data);
  }

  function close() {
    const ov = document.getElementById('pp-overlay');
    const pn = document.getElementById('pp-panel');
    ov?.classList.remove('pp-on');
    pn?.classList.remove('pp-on');
    document.body.style.overflow = '';
    _open = false;
    setTimeout(() => { ov?.remove(); pn?.remove(); }, 420);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', _wire);
  else _wire();

  return { open, close, _editName, _saveName, _share };
})();

window.ProfilePanel = ProfilePanel;
console.log('👤 ProfilePanel v2 ready');
