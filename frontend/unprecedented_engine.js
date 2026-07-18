// ══════════════════════════════════════════════════════════════════════════════
// UNPRECEDENTED ENGINE — 6 World-First Features
// Appended to frontend/app.js
// ══════════════════════════════════════════════════════════════════════════════
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

  // ─── STYLES ─────────────────────────────────────────────────────────────
  injectStyles() {
    if (document.getElementById('ue-styles')) return;
    const s = document.createElement('style');
    s.id = 'ue-styles';
    s.textContent = `
      .ue-card { background:#fff; border-radius:16px; padding:16px 20px; margin:8px 0; box-shadow:0 2px 12px rgba(0,0,0,0.08); border:1px solid #e2e8f0; }
      [data-theme="dark"] .ue-card { background:#1e293b; border-color:#334155; color:#e2e8f0; }
      .ue-card-title { font-size:12px; font-weight:700; text-transform:uppercase; letter-spacing:0.5px; color:#64748b; margin-bottom:6px; }
      .ue-big-number { font-size:28px; font-weight:900; line-height:1.1; }
      .ue-sub { font-size:12px; color:#64748b; margin-top:3px; }
      .accountability-ring { width:80px; height:80px; border-radius:50%; display:flex; align-items:center; justify-content:center; font-size:28px; font-weight:900; color:#fff; flex-shrink:0; }
      .pledge-btn { padding:8px 12px; border-radius:10px; border:1px solid #e2e8f0; background:#f8fafc; cursor:pointer; font-size:12px; font-weight:600; transition:all 0.2s; text-align:left; }
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

  // ══════════════════════════════════════════════════════════════════════
  //  💰 FEATURE 1: Economic Impact Card
  // ══════════════════════════════════════════════════════════════════════
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

      // Inject into best available container
      this._injectCard(card);
    } catch (e) { console.warn('Economic impact card skipped:', e.message); }
  },

  // ══════════════════════════════════════════════════════════════════════
  //  📊 FEATURE 6: Government Accountability Score Card
  // ══════════════════════════════════════════════════════════════════════
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
        <div style="flex:1;">
          <div class="ue-card-title">🏛️ Govt. Accountability Score</div>
          <div style="font-weight:700;font-size:15px;">${data.accountabilityScore}/100 — ${data.verdict}</div>
          <div class="ue-sub">${data.metrics.resolved}/${data.metrics.totalHazards} resolved · Avg ${data.metrics.avgDaysToFix || '?'} days to fix</div>
          <div class="ue-sub" style="color:#ef4444;">${data.metrics.criticalOverdue || 0} critical hazards OVERDUE</div>
        </div>
      `;
      card.onclick = () => this.showAccountabilityModal(data);

      this._injectCard(card);
    } catch (e) { console.warn('Accountability card skipped:', e.message); }
  },

  // Smart card injector — tries multiple containers with fallback to fixed overlay
  _injectCard(card) {
    // Priority list of containers to try
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
    // Ultimate fallback: fixed position overlay bottom-left
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
      <div style="background:#fff;border-radius:20px;padding:28px;max-width:480px;width:92%;max-height:80vh;overflow-y:auto;box-shadow:0 20px 60px rgba(0,0,0,0.3);">
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
        <button onclick="document.getElementById('accountability-modal').remove()" style="width:100%;margin-top:16px;padding:12px;background:#f1f5f9;border:none;border-radius:12px;cursor:pointer;font-weight:600;">✕ Close</button>
      </div>
    `;
    document.body.appendChild(modal);
    modal.addEventListener('click', e => { if (e.target === modal) modal.remove(); });
  },

  // ══════════════════════════════════════════════════════════════════════
  //  🔮 FEATURE 3: Predictive Hotspot Map Overlay Button
  // ══════════════════════════════════════════════════════════════════════
  renderPredictiveHotspotsBtn() {
    const btn = document.createElement('button');
    btn.id = 'predict-btn';
    btn.textContent = '🔮 Predict Hotspots';
    btn.style.cssText = 'background:linear-gradient(135deg,#7c3aed,#5b21b6);color:#fff;border:none;border-radius:10px;padding:8px 16px;font-weight:700;font-size:13px;cursor:pointer;box-shadow:0 2px 10px rgba(124,58,237,0.4);';
    btn.onclick = () => this.loadPredictiveHotspots();

    // Add to map controls area
    const routeBtn = document.getElementById('route-safety-btn') || document.querySelector('.map-btn-group');
    if (routeBtn) routeBtn.parentNode.insertBefore(btn, routeBtn.nextSibling);
  },

  _hotspotLayers: [],
  async loadPredictiveHotspots() {
    const btn = document.getElementById('predict-btn');
    if (btn) btn.textContent = '⏳ Predicting...';

    // Clear existing hotspot layers
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

  // ══════════════════════════════════════════════════════════════════════
  //  Modal Enhancement: Vulnerable Zones + Transport + Pledge + Lifespan
  // ══════════════════════════════════════════════════════════════════════
  observeHazardModals() {
    document.addEventListener('click', async e => {
      // Detect when a hazard detail modal opens
      const hazardCard = e.target.closest('[data-hazard-id]');
      if (!hazardCard) return;
      const hazardId = hazardCard.dataset.hazardId;
      if (!hazardId || hazardCard.dataset.ueLoaded) return;
      hazardCard.dataset.ueLoaded = '1';

      await new Promise(r => setTimeout(r, 600)); // Wait for modal to open
      const modal = document.getElementById('hazard-detail-modal') ||
                    document.querySelector('.hazard-modal') ||
                    document.querySelector('.modal-content');
      if (!modal) return;

      this.injectModalEnhancements(modal, hazardId);
    });
  },

  async injectModalEnhancements(modal, hazardId) {
    const container = document.createElement('div');
    container.id = `ue-enhancements-${hazardId}`;
    container.style.cssText = 'padding:12px 0;border-top:1px solid #e2e8f0;margin-top:10px;';



    // Parallel fetch vulnerable zones + transport impact + pledges
    const [vulnRes, transportRes, pledgeRes] = await Promise.allSettled([
      fetch(`${this.API}/api/intelligence/vulnerable-zones?lat=${hazardData?.latitude || 17.38}&lng=${hazardData?.longitude || 78.48}&radius=300`).then(r => r.json()),
      fetch(`${this.API}/api/intelligence/transport-impact/${hazardId}`).then(r => r.json()),
      fetch(`${this.API}/api/intelligence/pledge/${hazardId}`).then(r => r.json())
    ]);

    // Vulnerable Zone Badge
    const vuln = vulnRes.status === 'fulfilled' ? vulnRes.value : null;
    if (vuln?.isVulnerableZone && vuln.badge) {
      container.innerHTML += `<div class="vuln-badge">⚠️ ${vuln.badge}</div><div style="font-size:11px;color:#64748b;margin-bottom:8px;">${vuln.vulnerableZones.map(z => z.name).join(', ')}</div>`;
    }

    // Transport Impact Badge
    const transport = transportRes.status === 'fulfilled' ? transportRes.value : null;
    if (transport?.success) {
      container.innerHTML += `<div class="transport-badge">${transport.badge}</div>`;
    }

    // Community Pledge Section
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
        <div style="font-weight:700;font-size:13px;margin-bottom:6px;">🤝 Community Action (${pledgeCount} pledges)</div>
        <div style="display:flex;flex-wrap:wrap;gap:6px;">
          ${pledgeOptions.map(p => `<button class="pledge-btn" data-pledge-type="${p.type}" data-hazard-id="${hazardId}" onclick="UnprecedentedEngine.submitPledge(this, ${hazardId}, '${p.type}')">${p.label}</button>`).join('')}
        </div>
      </div>
    `;
    container.innerHTML += pledgeSectionHTML;

    // Insert into modal
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

// Auto-start UnprecedentedEngine immediately — no login required for cards
document.addEventListener('DOMContentLoaded', () => {
  // Fire immediately so Economic Impact + Accountability cards show for everyone
  setTimeout(() => UnprecedentedEngine.init(), 2500);
});

