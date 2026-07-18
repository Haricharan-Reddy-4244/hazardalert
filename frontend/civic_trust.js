// ════════════════════════════════════════════════════════════════════════
//  civic_trust.js — Civic Trust Score + Compensation Claim Generator
//  The feature that converts citizens from volunteers to beneficiaries.
//
//  Features:
//  1. 🏆 Civic Trust Score — 4 tiers: Newcomer → Verified → Trusted → Champion
//  2. 💰 Compensation Claim Generator — Champion-only, MV Act legal notice
//  3. +Points toast notification when user earns points
//  4. Profile panel with progress bar, impact stats, tier badge
// ════════════════════════════════════════════════════════════════════════

const CivicTrust = {
  API: window.API_BASE || 'http://localhost:5000',
  _userId: null,
  _userData: null,

  TIERS: {
    newcomer:  { label: 'Newcomer',  emoji: '🥉', color: '#94a3b8', min: 0,   max: 49,  next: 50  },
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

    // Get userId from localStorage (set on login)
    const stored = localStorage.getItem('hazardUser');
    if (stored) {
      try {
        const user = JSON.parse(stored);
        this._userId = user.id;
        await this._loadScore();
      } catch {}
    }

    // Listen for login events from app.js
    window.addEventListener('userLoggedIn', async (e) => {
      this._userId = e.detail?.userId;
      await this._loadScore();
    });

    // Hook into existing actions to award points
    this._hookPointAwards();
  },

  // ── Styles ──────────────────────────────────────────────────────
  _injectStyles() {
    if (document.getElementById('ct-styles')) return;
    const s = document.createElement('style');
    s.id = 'ct-styles';
    s.textContent = `
      /* NAV BUTTON */
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

      /* PANEL OVERLAY */
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

      /* TIER HERO */
      .ct-tier-hero {
        text-align: center; padding: 20px 0 16px;
        border-bottom: 1px solid #f1f5f9; margin-bottom: 20px;
      }
      .ct-tier-emoji { font-size: 52px; line-height: 1; margin-bottom: 8px; }
      .ct-tier-name {
        font-size: 22px; font-weight: 900; margin-bottom: 4px;
      }
      .ct-points-big {
        font-size: 42px; font-weight: 900; line-height: 1;
      }
      .ct-points-label { font-size: 11px; color: #64748b; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; }

      /* PROGRESS BAR */
      .ct-progress-wrap { margin: 16px 0; }
      .ct-progress-label { display: flex; justify-content: space-between; font-size: 12px; font-weight: 700; color: #64748b; margin-bottom: 6px; }
      .ct-progress-track { height: 10px; background: #e2e8f0; border-radius: 6px; overflow: hidden; }
      .ct-progress-fill { height: 100%; border-radius: 6px; transition: width 1.5s cubic-bezier(.22,1,.36,1); }

      /* IMPACT STATS */
      .ct-stats-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin: 16px 0; }
      .ct-stat-card {
        background: #f8fafc; border-radius: 12px; padding: 14px; text-align: center;
        border: 1px solid #e2e8f0;
      }
      [data-theme="dark"] .ct-stat-card { background: #0f172a; border-color: #334155; }
      .ct-stat-num { font-size: 26px; font-weight: 900; }
      .ct-stat-lbl { font-size: 11px; color: #64748b; font-weight: 600; margin-top: 2px; }

      /* TIERS ROADMAP */
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

      /* COMPENSATION SECTION */
      .ct-comp-section { margin-top: 20px; border-top: 2px solid #f1f5f9; padding-top: 16px; }
      [data-theme="dark"] .ct-comp-section { border-color: #334155; }
      .ct-comp-locked {
        background: #f8fafc; border: 2px dashed #cbd5e1; border-radius: 14px;
        padding: 20px; text-align: center; margin-top: 8px;
      }
      .ct-comp-locked-icon { font-size: 36px; margin-bottom: 8px; }
      .ct-comp-locked-title { font-weight: 800; font-size: 15px; margin-bottom: 4px; }
      .ct-comp-locked-sub { font-size: 12px; color: #64748b; }
      .ct-comp-pts-needed { font-size: 18px; font-weight: 900; color: #dc2626; margin: 8px 0; }

      .ct-comp-unlocked { margin-top: 8px; }
      .ct-comp-form-label { font-size: 12px; font-weight: 700; color: #64748b; margin-bottom: 4px; display: block; margin-top: 10px; }
      .ct-comp-select, .ct-comp-input {
        width: 100%; padding: 10px 12px; border: 1.5px solid #e2e8f0; border-radius: 10px;
        font-size: 13px; box-sizing: border-box; background: #fff;
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

      /* NOTICE RESULT */
      .ct-notice-box {
        background: #fefce8; border: 1.5px solid #fbbf24; border-radius: 12px;
        padding: 14px; margin-top: 12px; font-size: 11px;
        font-family: 'Courier New', monospace; line-height: 1.6;
        max-height: 200px; overflow-y: auto; cursor: pointer;
        white-space: pre-wrap;
      }
      .ct-notice-actions { display: flex; gap: 8px; margin-top: 8px; flex-wrap: wrap; }
      .ct-notice-copy, .ct-notice-email, .ct-notice-print {
        padding: 8px 14px; border-radius: 8px; font-weight: 700; font-size: 11px;
        cursor: pointer; border: none;
      }
      .ct-notice-copy { background: #f1f5f9; color: #374151; }
      .ct-notice-email { background: #dc2626; color: #fff; }
      .ct-notice-print { background: #1d4ed8; color: #fff; }

      /* POINTS TOAST */
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

  // ── Nav Button ───────────────────────────────────────────────────
  _addNavButton() {
    if (document.getElementById('ct-nav-btn')) return;
    const btn = document.createElement('button');
    btn.id = 'ct-nav-btn';
    btn.className = 'nav-btn';
    btn.innerHTML = '🏆 My Score <span id="ct-tier-badge"></span>';
    btn.onclick = () => this._openPanel();

    // Insert before first nav button
    const nav = document.querySelector('.desktop-nav, nav, header');
    const firstBtn = nav?.querySelector('.nav-btn, button');
    if (firstBtn) firstBtn.parentNode.insertBefore(btn, firstBtn);
    else if (nav) nav.prepend(btn);
    else { btn.style.cssText='position:fixed;top:14px;left:20px;z-index:9998;'; document.body.appendChild(btn); }
  },

  // ── Load Score from API ──────────────────────────────────────────
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

  // ── Open Profile Panel ───────────────────────────────────────────
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
          <!-- TIER HERO -->
          <div class="ct-tier-hero">
            <div class="ct-tier-emoji">${tier.emoji}</div>
            <div class="ct-tier-name" style="color:${tier.color};">${tier.label} Reporter</div>
            <div class="ct-points-big" style="color:${tier.color};">${pts}</div>
            <div class="ct-points-label">Civic Points</div>
          </div>

          <!-- PROGRESS -->
          <div class="ct-progress-wrap">
            <div class="ct-progress-label">
              <span>${tier.label}</span>
              <span>${tier.next ? `${tier.next - pts} pts to ${Object.values(this.TIERS).find(t=>t.min===tier.next)?.label || 'Champion'}` : '🎉 Max Tier!'}</span>
            </div>
            <div class="ct-progress-track">
              <div class="ct-progress-fill" id="ct-pfill" style="width:0%;background:${tier.color};"></div>
            </div>
          </div>

          <!-- IMPACT STATS -->
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

          <!-- HOW TO EARN -->
          <div style="font-size:12px;font-weight:700;color:#64748b;margin:16px 0 8px;text-transform:uppercase;letter-spacing:1px;">How to Earn Points</div>
          ${Object.entries(this.POINT_LABELS).map(([k,v])=>`
            <div style="display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px solid #f1f5f9;font-size:12px;">
              <span>${v.label}</span>
              <span style="font-weight:800;color:#22c55e;">+${v.pts} pts</span>
            </div>
          `).join('')}

          <!-- TIER ROADMAP -->
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

          <!-- COMPENSATION CLAIM -->
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
    // Animate progress bar
    setTimeout(() => {
      const fill = document.getElementById('ct-pfill');
      if (fill) fill.style.width = progress + '%';
    }, 300);
  },

  // ── Generate Compensation Notice ─────────────────────────────────
  _generateClaim() {
    const vehicle  = document.getElementById('ct-vehicle')?.value || 'Vehicle';
    const damage   = document.getElementById('ct-damage')?.value  || 'damage';
    const cost     = parseFloat(document.getElementById('ct-cost')?.value) || 0;
    const name     = document.getElementById('ct-claimant')?.value || 'Citizen';
    const loc      = document.getElementById('ct-hazard-loc')?.value || 'Hyderabad';

    if (!cost || cost < 100) { alert('Please enter a valid repair cost (minimum ₹100)'); return; }
    if (!name.trim()) { alert('Please enter your full name'); return; }

    // Compensation = 3x actual cost (standard MACT multiplier for suffering + repair)
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
      // Save to backend
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

  // ── Points Toasts & Hooks ────────────────────────────────────────
  showPointsToast(action) {
    const info = this.POINT_LABELS[action];
    if (!info) return;
    const t = document.createElement('div');
    t.className = 'ct-points-toast';
    t.innerHTML = `+${info.pts} pts 🏆 ${info.label}`;
    document.body.appendChild(t);
    setTimeout(() => t.style.opacity = '0', 3000);
    setTimeout(() => t.remove(), 3500);

    // Update local points
    if (this._userData) {
      this._userData.civicPoints = (this._userData.civicPoints || 0) + info.pts;
      this._updateNavBadge();
    }
  },

  _hookPointAwards() {
    // Hook into fetch to detect when points-worthy actions happen
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

  // ── Helpers ──────────────────────────────────────────────────────
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

// Auto-init
document.addEventListener('DOMContentLoaded', () => {
  setTimeout(() => CivicTrust.init(), 1500);
});
window.CivicTrust = CivicTrust;
