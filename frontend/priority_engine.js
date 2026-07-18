// ════════════════════════════════════════════════════════════════════════
//  🚨 PRIORITY ENGINE
//  Real-time composite hazard prioritization — 4 dimensions scored:
//  Severity (40pts) + SLA Breach (30pts) + Demand Count (20pts) + Age (10pts)
//  = Priority Score 0–100 → CRITICAL / HIGH / MEDIUM / LOW
// ════════════════════════════════════════════════════════════════════════
const PriorityEngine = {

  API: window.API_BASE || 'http://localhost:5000',
  _data: null,
  _refreshTimer: null,

  // ── Bootstrap ──────────────────────────────────────────────────────
  async init() {
    this.injectStyles();
    this.injectNavBtn();
    await this.loadQueue();
    this.startAutoRefresh();
    this.injectMapBadges();
    console.log('🚨 PriorityEngine ready');
  },

  // ── CSS ────────────────────────────────────────────────────────────
  injectStyles() {
    if (document.getElementById('pr-styles')) return;
    const s = document.createElement('style');
    s.id = 'pr-styles';
    s.textContent = `
      /* ── Nav button ── */
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

      /* ── Panel overlay ── */
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

      /* ── Header ── */
      .pr-header {
        background: linear-gradient(135deg, #7c3aed, #4c1d95);
        color: #fff; padding: 22px 26px; border-radius: 20px 20px 0 0;
        position: sticky; top: 0; z-index: 2;
      }
      .pr-header h2 { margin: 0 0 3px; font-size: 21px; font-weight: 800; }
      .pr-header p  { margin: 0; font-size: 12px; opacity: 0.85; }

      /* ── Summary bar ── */
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

      /* ── Score formula legend ── */
      .pr-formula {
        padding: 10px 18px; font-size: 11px; color: #64748b;
        background: #fafafa; border-bottom: 1px solid #e2e8f0;
        display: flex; gap: 16px; flex-wrap: wrap;
      }
      [data-theme="dark"] .pr-formula { background: #1e293b; }
      .pr-formula span { font-weight: 700; }

      /* ── Hazard row ── */
      .pr-row {
        display: flex; align-items: center; gap: 12px;
        padding: 12px 18px; border-bottom: 1px solid #f1f5f9;
        transition: background 0.15s;
      }
      [data-theme="dark"] .pr-row { border-color: #334155; }
      .pr-row:hover { background: #f8f7ff; }
      [data-theme="dark"] .pr-row:hover { background: #1e2a3a; }

      .pr-rank {
        font-size: 18px; width: 28px; text-align: center; flex-shrink: 0;
      }
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
      .pr-tag  {
        font-size: 10px; font-weight: 700; padding: 2px 7px;
        border-radius: 12px; white-space: nowrap;
      }
      .pr-tag-sev { background: #fef2f2; color: #dc2626; }
      .pr-tag-age { background: #fff7ed; color: #ea580c; }
      .pr-tag-sla { background: #fee2e2; color: #991b1b; }
      .pr-tag-demand { background: #eff6ff; color: #1d4ed8; }

      .pr-actions { display: flex; flex-direction: column; gap: 5px; flex-shrink: 0; }
      .pr-map-btn {
        padding: 5px 10px; background: #f1f5f9; border: none;
        border-radius: 8px; cursor: pointer; font-size: 12px; white-space: nowrap;
      }
      .pr-fix-btn {
        padding: 5px 10px; background: #dc2626; color: #fff; border: none;
        border-radius: 8px; cursor: pointer; font-size: 11px; font-weight: 700; white-space: nowrap;
      }

      /* ── Priority badge on list cards ── */
      .priority-badge {
        display: inline-flex; align-items: center; gap: 4px;
        padding: 2px 8px; border-radius: 12px; font-size: 11px; font-weight: 800;
        margin-left: 6px;
      }
      .priority-badge-critical { background: #fee2e2; color: #dc2626; border: 1px solid #fca5a5; }
      .priority-badge-high     { background: #ffedd5; color: #ea580c; border: 1px solid #fdba74; }
      .priority-badge-medium   { background: #fef9c3; color: #ca8a04; border: 1px solid #fde047; }
      .priority-badge-low      { background: #dcfce7; color: #15803d; border: 1px solid #86efac; }

      /* ── Breakdown tooltip ── */
      .pr-breakdown {
        display: flex; gap: 6px; flex-wrap: wrap; margin-top: 6px;
      }
      .pr-breakdown-bar {
        flex: 1; min-width: 60px;
      }
      .pr-breakdown-lbl { font-size: 9px; color: #94a3b8; margin-bottom: 2px; }
      .pr-breakdown-track { height: 4px; background: #e2e8f0; border-radius: 2px; }
      .pr-breakdown-fill  { height: 100%; border-radius: 2px; transition: width 0.6s ease; }

      /* ── Refresh indicator ── */
      .pr-refresh-dot {
        width: 8px; height: 8px; border-radius: 50%; background: #22c55e;
        display: inline-block; margin-left: 6px;
        animation: pr-blink 2s infinite;
      }
      @keyframes pr-blink { 0%,100%{opacity:1} 50%{opacity:0.3} }
    `;
    document.head.appendChild(s);
  },

  // ── Load queue from API ────────────────────────────────────────────
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

  // ── Auto-refresh every 5 min ──────────────────────────────────────
  startAutoRefresh() {
    if (this._refreshTimer) clearInterval(this._refreshTimer);
    this._refreshTimer = setInterval(() => this.loadQueue(), 5 * 60 * 1000);
  },

  // ── Nav button ────────────────────────────────────────────────────
  injectNavBtn() {
    if (document.getElementById('priority-nav-btn')) return;
    const btn = document.createElement('button');
    btn.id = 'priority-nav-btn';
    btn.className = 'nav-btn';
    btn.innerHTML = '🚨 Priority Queue <span class="pr-count-bubble" id="pr-bubble">…</span>';
    btn.onclick = () => this.openPanel();

    // Insert — try after Shame Board btn, then any nav-btn, then fixed
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

  // ── Open panel ────────────────────────────────────────────────────
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
        <!-- Header -->
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

        <!-- Summary -->
        <div class="pr-summary">
          <div class="pr-stat"><div class="pr-stat-num pr-critical">${d.summary.critical}</div><div class="pr-stat-lbl">🔴 Critical</div></div>
          <div class="pr-stat"><div class="pr-stat-num pr-high">${d.summary.high}</div><div class="pr-stat-lbl">🟠 High</div></div>
          <div class="pr-stat"><div class="pr-stat-num pr-medium">${d.summary.medium}</div><div class="pr-stat-lbl">🟡 Medium</div></div>
          <div class="pr-stat"><div class="pr-stat-num" style="color:#ef4444;">${d.summary.slaBreached}</div><div class="pr-stat-lbl">⏱️ SLA Breached</div></div>
        </div>

        <!-- Formula legend -->
        <div class="pr-formula">
          Score = <span>Severity (max 40)</span> + <span>SLA Breach (max 30)</span> + <span>Demands (max 20)</span> + <span>Age (max 10)</span>
          <em style="margin-left:auto;">${d.queue.length} hazards ranked · Top score: ${d.summary.topScore}/100</em>
        </div>

        <!-- Hazard rows -->
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
    const slaTag = h.slaBreach
      ? `<span class="pr-tag pr-tag-sla">⏱ SLA +${h.slaBreachDays}d</span>`
      : '';
    const demandTag = h.demandCount > 0
      ? `<span class="pr-tag pr-tag-demand">📢 ${h.demandCount} demand${h.demandCount>1?'s':''}</span>`
      : '';

    // Score breakdown bars
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
          <div class="pr-type">${h.emoji} ${h.type} <span style="font-size:10px;font-weight:600;color:${h.color};">[${h.level}]</span></div>
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

  // ── Inject priority badges on hazard list cards ────────────────────
  _patchListCards(queue) {
    // Create a lookup map: hazardId → score info
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

        // Insert after type/title in the card
        const title = el.querySelector('h3, h4, .hazard-type, .card-title, strong:first-child');
        if (title) title.appendChild(badge);
        else el.prepend(badge);
      });
    });
    obs.observe(document.body, { childList: true, subtree: true });
  },

  // ── Inject demand button into Leaflet popups ───────────────────────
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

// ── Auto-init on page load ────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  setTimeout(() => PriorityEngine.init(), 3000); // After PressureEngine is done
});
