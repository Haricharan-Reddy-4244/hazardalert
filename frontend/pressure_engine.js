// ════════════════════════════════════════════════════════════════════════
//  🔥 PUBLIC PRESSURE ENGINE
//  The ONE feature that creates maximum real-world political pressure.
//  - Shame Board: top hazards sorted by severity × days pending
//  - Demand Fix counter: 1-click citizen pressure per hazard
//  - WhatsApp share: auto-message to broadcast shame
//  - MLA Alert: pre-filled complaint letter via WhatsApp
//  - Twitter share: tags GHMC + CM office
//  NO LOGIN REQUIRED — purely public-facing
// ════════════════════════════════════════════════════════════════════════
const PressureEngine = {

  API: window.API_BASE || 'http://localhost:5000',
  _data: null,

  // ── Bootstrap ──────────────────────────────────────────────────────
  async init() {
    this.injectStyles();
    this.injectShameTab();
    await this.loadShameBoard();
    this.injectDemandBtnsOnMap();
    console.log('🔥 PressureEngine ready — shame board active');
  },

  // ── CSS ────────────────────────────────────────────────────────────
  injectStyles() {
    if (document.getElementById('pe-styles')) return;
    const s = document.createElement('style');
    s.id = 'pe-styles';
    s.textContent = `
      /* === Shame Tab Nav Btn === */
      #shame-nav-btn {
        background: linear-gradient(135deg, #dc2626, #991b1b);
        color: #fff !important; border: none; border-radius: 8px;
        padding: 7px 14px; font-weight: 700; cursor: pointer;
        animation: shame-pulse 2.5s infinite;
        box-shadow: 0 0 12px rgba(220,38,38,0.5);
      }
      @keyframes shame-pulse { 0%,100% { box-shadow:0 0 8px rgba(220,38,38,0.5); } 50% { box-shadow:0 0 22px rgba(220,38,38,0.85); } }

      /* === Shame Board Panel === */
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

      /* === Header === */
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

      /* === Summary Row === */
      .shame-summary {
        display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px;
        padding: 14px 20px; background: #fef2f2; border-bottom: 1px solid #fecaca;
      }
      [data-theme="dark"] .shame-summary { background: #450a0a; border-color: #7f1d1d; }
      .shame-stat { text-align: center; }
      .shame-stat-num { font-size: 26px; font-weight: 900; color: #dc2626; }
      .shame-stat-lbl { font-size: 10px; text-transform: uppercase; letter-spacing: 0.5px; color: #64748b; }

      /* === Hazard Cards === */
      .shame-card {
        margin: 12px 16px; border-radius: 14px; overflow: hidden;
        border: 1px solid #e2e8f0; transition: box-shadow 0.2s;
      }
      [data-theme="dark"] .shame-card { border-color: #334155; }
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

      /* === Action Row === */
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

      /* === Demand btn on map hazard cards === */
      .map-demand-btn {
        display: inline-block; margin-top: 8px; padding: 6px 14px;
        background: linear-gradient(135deg,#dc2626,#b91c1c);
        color:#fff; border:none; border-radius:8px; cursor:pointer;
        font-weight:700; font-size:12px; width:100%;
      }

      /* === Toast override === */
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

  // ── Inject "🔥 Shame Board" nav button ───────────────────────────
  injectShameTab() {
    if (document.getElementById('shame-nav-btn')) return;
    const btn = document.createElement('button');
    btn.id = 'shame-nav-btn';
    btn.className = 'nav-btn';
    btn.innerHTML = '🔥 Shame Board';
    btn.title = 'Public accountability — worst unresolved hazards';
    btn.onclick = () => this.openShameBoard();

    // Try multiple injection points
    const anchor =
      document.getElementById('leaderboard-nav-btn') ||
      document.getElementById('nav-leaderboard') ||
      document.querySelector('[onclick*="leaderboard"]') ||
      document.querySelector('.nav-btn:last-of-type') ||
      document.querySelector('.desktop-nav .nav-btn');

    if (anchor) {
      anchor.parentNode.insertBefore(btn, anchor.nextSibling);
    } else {
      // Fallback: append to first nav found
      const nav = document.querySelector('nav, .desktop-nav, .nav-bar, header');
      if (nav) nav.appendChild(btn);
      else {
        // Final fallback: fixed floating button
        btn.style.cssText += ';position:fixed;top:14px;right:200px;z-index:9999;';
        document.body.appendChild(btn);
      }
    }
  },


  // ── Load data from backend ────────────────────────────────────────
  async loadShameBoard() {
    try {
      const res = await fetch(`${this.API}/api/intelligence/shame-board`);
      const data = await res.json();
      if (data.success) this._data = data;
    } catch (e) { console.warn('Shame board load failed:', e.message); }
  },

  // ── Open Shame Board Panel ────────────────────────────────────────
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
        <!-- HEADER -->
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

        <!-- SUMMARY -->
        <div class="shame-summary">
          <div class="shame-stat"><div class="shame-stat-num">${d.summary.totalPending || 0}</div><div class="shame-stat-lbl">Pending Hazards</div></div>
          <div class="shame-stat"><div class="shame-stat-num">${d.summary.criticalOverdue || 0}</div><div class="shame-stat-lbl">Critical Overdue</div></div>
          <div class="shame-stat"><div class="shame-stat-num">${d.summary.resolutionRate || 0}%</div><div class="shame-stat-lbl">Resolution Rate</div></div>
        </div>

        <!-- CALL TO ACTION -->
        <div style="padding:14px 20px;background:#fffbeb;border-bottom:1px solid #fde68a;font-size:13px;color:#92400e;">
          <strong>📢 Take Action:</strong> Click "Demand Fix" on any hazard to add your voice.
          Share on WhatsApp to pressure authorities. Alert your MLA directly.
        </div>

        <!-- HAZARD CARDS -->
        ${d.shameboard.map((h, i) => this.renderShameCard(h, i + 1)).join('')}

        <div style="padding:16px 20px;text-align:center;font-size:12px;color:#94a3b8;">
          📊 Data updated in real-time · Generated ${new Date(d.generatedAt).toLocaleString('en-IN')}
        </div>
      </div>
    `;

    panel.addEventListener('click', e => { if (e.target === panel) panel.remove(); });
    document.body.appendChild(panel);
  },

  // ── Render individual shame card ──────────────────────────────────
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
          <!-- Demand Fix -->
          <button class="demand-btn" id="demandBtn-${h.id}" onclick="PressureEngine.submitDemand(${h.id}, this)">
            📢 Demand Fix
            <span class="demand-count-badge" id="demandCount-${h.id}">${h.demandCount > 0 ? `(${h.demandCount})` : ''}</span>
          </button>

          <!-- Damage badge -->
          <span class="damage-badge">₹${(h.estimatedDamageINR / 1000).toFixed(0)}K damage</span>

          <!-- Share WhatsApp -->
          <button class="share-wa" onclick="window.open('${h.shareLinks.whatsapp}','_blank')" title="Share on WhatsApp">
            📱 WhatsApp
          </button>

          <!-- Share Twitter -->
          <button class="share-tw" onclick="window.open('${h.shareLinks.twitter}','_blank')" title="Tweet this">
            🐦 Tweet
          </button>

          <!-- Alert MLA -->
          <button class="share-mla" onclick="window.open('${h.shareLinks.mla}','_blank')" title="Send complaint to MLA via WhatsApp">
            🏛️ Alert MLA
          </button>

          <!-- Maps link -->
          <button onclick="window.open('${h.mapsUrl}','_blank')" style="padding:9px 12px;background:#f1f5f9;border:none;border-radius:10px;cursor:pointer;font-size:13px;" title="View on map">
            🗺️ Map
          </button>
        </div>
      </div>
    `;
  },

  // ── Submit demand via API ─────────────────────────────────────────
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

  // ── Inject "📢 Demand Fix" into map popup hazard cards ───────────
  injectDemandBtnsOnMap() {
    // Intercept Leaflet popup opens to insert demand button
    if (!window.L) return;
    const origBindPopup = L.Layer.prototype.bindPopup;
    L.Layer.prototype.bindPopup = function(content, options) {
      if (typeof content === 'string' && content.includes('hazard-id')) {
        // Already has hazard data — add demand button at end
      }
      return origBindPopup.call(this, content, options);
    };

    // MutationObserver: watch for Leaflet popup DOM nodes and inject button
    const obs = new MutationObserver(mutations => {
      mutations.forEach(m => {
        m.addedNodes.forEach(node => {
          if (!node.classList) return;
          if (node.classList.contains('leaflet-popup') || node.querySelector?.('.leaflet-popup-content')) {
            const content = node.querySelector?.('.leaflet-popup-content');
            if (!content || content.querySelector('.map-demand-btn')) return;
            // Try to extract hazard id from button or link
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

  // ── Simple toast notification ──────────────────────────────────────
  toast(msg, duration = 3500) {
    const t = document.createElement('div');
    t.className = 'pe-toast';
    t.textContent = msg;
    document.body.appendChild(t);
    setTimeout(() => t.remove(), duration);
  }
};

// ── Auto-init immediately (no login required) ─────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  setTimeout(() => PressureEngine.init(), 1500);
});
