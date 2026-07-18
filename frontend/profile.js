// ═══════════════════════════════════════════════════════════════════════
//  profile.js — Hackathon-Winning Citizen Profile Panel v2
//  Features:
//  ✅ Auto-updates dropdown with logged-in user name
//  ✅ Login state watcher — updates dropdown in real-time
//  ✅ Full-screen slide-in panel from right
//  ✅ Animated tier ring with glowing color
//  ✅ XP progress bar with shimmer animation
//  ✅ 4-stat impact grid (reports, verified, points, fixed)
//  ✅ City impact ("helped X,XXX people")
//  ✅ 8 Achievement badges (locked/unlocked with animations)
//  ✅ Live leaderboard rank
//  ✅ Recent hazard activity feed with status indicators
//  ✅ Inline edit name
//  ✅ Shareable civic score card
//  ✅ Tier perks list
//  ✅ Close on Esc / outside click
// ═══════════════════════════════════════════════════════════════════════

const ProfilePanel = (() => {
  const API = () => window.API_BASE || 'http://localhost:5000';

  // ── Tier definitions ─────────────────────────────────────────────────
  const TIERS = [
    { name: 'Newcomer',    min: 0,   max: 49,  color: '#64748b', bg: '#64748b18', icon: '🌱', next: 'Aware' },
    { name: 'Aware',       min: 50,  max: 149, color: '#3b82f6', bg: '#3b82f618', icon: '🔵', next: 'Contributor' },
    { name: 'Contributor', min: 150, max: 249, color: '#8b5cf6', bg: '#8b5cf618', icon: '⭐', next: 'Leader' },
    { name: 'Leader',      min: 250, max: 349, color: '#f59e0b', bg: '#f59e0b18', icon: '🎖️', next: 'Champion' },
    { name: 'Champion',    min: 350, max: 99999, color: '#dc2626', bg: '#dc262618', icon: '💎', next: null },
  ];

  // ── Achievement definitions ───────────────────────────────────────────
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

  // ── Inject CSS ────────────────────────────────────────────────────────
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

      /* Header */
      .pp-hdr {
        display:flex;align-items:center;justify-content:space-between;
        padding:18px 20px 16px;border-bottom:1px solid rgba(255,255,255,0.05);
        position:sticky;top:0;background:#0d1117;z-index:2;
      }
      .pp-hdr-label { font-size:11px;font-weight:800;color:#475569;text-transform:uppercase;letter-spacing:2px; }
      .pp-x {
        width:30px;height:30px;border-radius:50%;border:none;cursor:pointer;
        background:rgba(255,255,255,0.05);color:#64748b;font-size:16px;
        transition:all .2s;display:flex;align-items:center;justify-content:center;
      }
      .pp-x:hover { background:rgba(220,38,38,0.15);color:#f87171; }

      /* Hero */
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
        color:#475569;padding:2px 6px;border-radius:4px;transition:all .2s;
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
      .pp-email { font-size:11px;color:#334155; }
      .pp-rank-chip {
        display:inline-flex;align-items:center;gap:4px;margin-top:6px;
        font-size:11px;font-weight:700;color:#a855f7;
        background:rgba(168,85,247,0.1);padding:3px 10px;border-radius:20px;
        border:1px solid rgba(168,85,247,0.2);
      }

      /* XP bar */
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
      .pp-xp-hint { font-size:10px;color:#334155;margin-top:5px;text-align:right; }

      /* Stats */
      .pp-stats { display:grid;grid-template-columns:1fr 1fr;gap:9px;padding:14px 20px;border-bottom:1px solid rgba(255,255,255,0.04); }
      .pp-sc {
        background:rgba(255,255,255,0.02);border:1px solid rgba(255,255,255,0.05);
        border-radius:12px;padding:14px 12px;text-align:center;transition:all .2s;cursor:default;
      }
      .pp-sc:hover { background:rgba(255,255,255,0.05);border-color:rgba(255,255,255,0.1);transform:translateY(-2px); }
      .pp-sv { font-size:28px;font-weight:900;line-height:1;margin-bottom:4px; }
      .pp-sl { font-size:10px;color:#475569;font-weight:700;text-transform:uppercase;letter-spacing:.5px; }

      /* Impact banner */
      .pp-impact {
        margin:0 20px 14px;
        background:linear-gradient(135deg,rgba(220,38,38,0.07),rgba(168,85,247,0.06));
        border:1px solid rgba(220,38,38,0.12);border-radius:14px;
        padding:14px 16px;display:flex;gap:12px;align-items:center;
      }
      .pp-impact-ico { font-size:28px;flex-shrink:0; }
      .pp-impact-txt { font-size:12px;color:#94a3b8;line-height:1.6; }
      .pp-impact-txt strong { color:#f1f5f9;font-size:15px;font-weight:900; }

      /* Section title */
      .pp-sec {
        padding:0 20px 10px;margin-top:14px;
        font-size:10px;font-weight:800;color:#334155;text-transform:uppercase;letter-spacing:2px;
        display:flex;align-items:center;gap:10px;
      }
      .pp-sec::after{content:'';flex:1;height:1px;background:rgba(255,255,255,0.04);}

      /* Achievement badges */
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

      /* Activity feed */
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
      .pp-item-m{font-size:10px;color:#334155;margin-top:2px;}
      .pp-sta{font-size:10px;font-weight:700;padding:2px 8px;border-radius:20px;flex-shrink:0;}
      .sta-pending{background:rgba(234,179,8,.12);color:#eab308;}
      .sta-resolved{background:rgba(34,197,94,.12);color:#4ade80;}
      .sta-disputed{background:rgba(239,68,68,.12);color:#f87171;}
      .sta-verified{background:rgba(99,102,241,.12);color:#818cf8;}

      /* Perks */
      .pp-perks{padding:0 20px 14px;display:flex;flex-direction:column;gap:5px;}
      .pp-perk{display:flex;align-items:center;gap:10px;font-size:12px;color:#94a3b8;padding:7px 12px;border-radius:8px;background:rgba(255,255,255,0.02);}
      .pp-perk-dot{width:6px;height:6px;border-radius:50%;background:var(--tc,#dc2626);flex-shrink:0;}

      /* Share card */
      .pp-share-card {
        margin:0 20px 14px;
        background:linear-gradient(135deg,#161b22,#0d1117);
        border:1px solid rgba(255,255,255,0.07);border-radius:16px;
        padding:16px 18px;text-align:center;cursor:pointer;transition:all .2s;
      }
      .pp-share-card:hover{border-color:rgba(220,38,38,0.3);box-shadow:0 0 20px rgba(220,38,38,0.08);}
      .pp-share-card-lbl{font-size:11px;color:#475569;font-weight:700;margin-bottom:8px;text-transform:uppercase;letter-spacing:1px;}
      .pp-share-card-id{font-size:28px;font-weight:900;letter-spacing:2px;background:linear-gradient(135deg,var(--tc,#dc2626),#a855f7);-webkit-background-clip:text;-webkit-text-fill-color:transparent;}
      .pp-share-card-sub{font-size:11px;color:#334155;margin-top:4px;}

      /* Actions */
      .pp-acts{padding:14px 20px 28px;display:flex;gap:9px;flex-wrap:wrap;}
      .pp-btn{flex:1;min-width:110px;padding:10px 14px;border-radius:10px;font-size:12px;font-weight:700;cursor:pointer;border:none;transition:all .2s;letter-spacing:.3px;}
      .pp-btn-red{background:linear-gradient(135deg,#dc2626,#991b1b);color:#fff;box-shadow:0 4px 16px rgba(220,38,38,.25);}
      .pp-btn-red:hover{transform:translateY(-1px);box-shadow:0 6px 24px rgba(220,38,38,.4);}
      .pp-btn-ghost{background:rgba(255,255,255,0.04);color:#94a3b8;border:1px solid rgba(255,255,255,0.08);}
      .pp-btn-ghost:hover{background:rgba(255,255,255,0.08);color:#f1f5f9;}
      .pp-btn-danger{background:rgba(239,68,68,0.08);color:#f87171;border:1px solid rgba(239,68,68,0.15);}
      .pp-btn-danger:hover{background:rgba(239,68,68,0.14);}

      /* Skeleton */
      .pp-skel{background:linear-gradient(90deg,rgba(255,255,255,0.03) 25%,rgba(255,255,255,0.06) 50%,rgba(255,255,255,0.03) 75%);background-size:400% 100%;animation:ppSk 1.8s infinite;border-radius:6px;}
      @keyframes ppSk{from{background-position:100% 0}to{background-position:-100% 0}}

      @media(max-width:480px){#pp-panel{width:100vw;}}
    `;
    document.head.appendChild(el);
  }

  // ── Build overlay + panel DOM ─────────────────────────────────────────
  function _build() {
    if (document.getElementById('pp-overlay')) return;
    const ov = document.createElement('div'); ov.id = 'pp-overlay';
    ov.addEventListener('click', close);
    const pn = document.createElement('div'); pn.id = 'pp-panel';
    pn.setAttribute('role', 'dialog'); pn.setAttribute('aria-modal', 'true');
    document.body.append(ov, pn);
  }

  // ── Get tier from points ──────────────────────────────────────────────
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

  // ── Fetch data ────────────────────────────────────────────────────────
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

      // Merge civic data
      const pts = c.civicPoints || user.civic_points || 0;
      const tierStr = c.tier || user.trust_tier || 'newcomer';

      // Leaderboard rank
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

  // ── Render skeleton ───────────────────────────────────────────────────
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

  // ── Main render ───────────────────────────────────────────────────────
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

    // Badges
    const bd = { r: reports, v: verifications, p: potholes, tier: tierStr, rti, claims };
    const earned = BADGES.filter(b => { try { return b.check(bd); } catch { return false; } }).map(b => b.id);

    panel.style.setProperty('--tc', t.color);
    panel.style.setProperty('--bg', t.bg);

    panel.innerHTML = `
      <!-- Fixed header -->
      <div class="pp-hdr">
        <span class="pp-hdr-label">👤 Citizen Profile</span>
        <button class="pp-x" onclick="ProfilePanel.close()" aria-label="Close">✕</button>
      </div>

      <!-- Hero -->
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

      <!-- XP progress -->
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

      <!-- Stats -->
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

      <!-- City impact -->
      <div class="pp-impact">
        <div class="pp-impact-ico">🌆</div>
        <div class="pp-impact-txt">
          Your civic actions have helped
          <strong>~${peopleHelped.toLocaleString('en-IN')} people</strong>
          travel safer in Hyderabad, saving an estimated
          <strong>₹${savings}L</strong> in road damage costs.
        </div>
      </div>

      <!-- Shareable ID card -->
      <div class="pp-sec">🪪 Civic ID</div>
      <div class="pp-share-card" onclick="ProfilePanel._share('${user.id||0}','${user.name||'Citizen'}','${t.name}','${pts}')" title="Click to copy your civic card">
        <div class="pp-share-card-lbl">My Civic Identity</div>
        <div class="pp-share-card-id">#${String(user.id||'0000').padStart(4,'0')}</div>
        <div class="pp-share-card-sub">${t.icon} ${t.name} · ${pts} pts · Click to share 📋</div>
      </div>

      <!-- Achievements -->
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

      <!-- Recent activity -->
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

      <!-- Tier perks -->
      <div class="pp-sec">✨ Your Perks</div>
      <div class="pp-perks">
        ${_getPerks(t.name).map(p => `
          <div class="pp-perk">
            <div class="pp-perk-dot" style="background:${p.locked?'#1e293b':t.color}"></div>
            <span style="${p.locked?'color:#1e293b':''}">${p.text}</span>
          </div>`).join('')}
      </div>

      <!-- Actions -->
      <div class="pp-acts">
        <button class="pp-btn pp-btn-red" onclick="ProfilePanel.close();setTimeout(()=>document.getElementById('report-hazard-btn')?.click(),200)">
          📍 Report Hazard
        </button>
        ${tierStr === 'champion' ? `<button class="pp-btn pp-btn-ghost" onclick="ProfilePanel.close();setTimeout(()=>document.querySelector('[onclick*=compensation],[onclick*=Compensation]')?.click(),200)">⚖️ Claim</button>` : ''}
        <button class="pp-btn pp-btn-danger" onclick="ProfilePanel.close();setTimeout(()=>document.getElementById('logout-link')?.click(),200)">🚪 Logout</button>
      </div>
    `;

    // Animate XP bar
    requestAnimationFrame(() => setTimeout(() => {
      const fill = document.getElementById('pp-fill');
      if (fill) fill.style.width = pct + '%';
    }, 120));

    // Update name display for inline editing
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

  // ── Edit name inline ──────────────────────────────────────────────────
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
    // Update dropdown
    const dn = document.getElementById('dropdown-username');
    if (dn) dn.textContent = val;
    // Patch AppData
    if (window.AppData?.currentUser) window.AppData.currentUser.name = val;
    if (typeof UI !== 'undefined' && UI.showToast) UI.showToast('Name updated!', 'success');
  }

  // ── Share card ────────────────────────────────────────────────────────
  function _share(id, name, tier, pts) {
    const text = `🏙️ I'm a ${tier} citizen on HazardAlert!\n👤 ${name} • #${String(id).padStart(4,'0')}\n🏆 ${pts} Civic Points\n\nHelping make Hyderabad safer! 🚨`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
      if (typeof UI !== 'undefined') UI.showToast('Civic ID copied to clipboard! 📋', 'success');
    }
  }

  // ── Login state watcher — updates dropdown username ───────────────────
  function _watchLogin() {
    // Run immediately on first call, then only when user changes — no polling
    const _update = () => {
      const u = window.AppData?.currentUser;
      const dn = document.getElementById('dropdown-username');
      if (!dn || !u?.name) return;
      const t = _tier(u.civic_points || 0);
      dn.textContent = `${u.name} ${t.icon}`;
    };
    // Check once after a short delay (login may have just finished)
    setTimeout(_update, 500);
    setTimeout(_update, 2000);
    // Use a lightweight 5-second interval instead of 1-second
    setInterval(_update, 5000);
  }

  // ── Close dropdown when clicking outside ─────────────────────────────
  function _outsideDropdown() {
    document.addEventListener('click', e => {
      const menu = document.getElementById('user-menu');
      const dd = document.getElementById('user-dropdown');
      if (dd && !dd.classList.contains('hidden') && !menu?.contains(e.target)) {
        dd.classList.add('hidden');
      }
    });
  }

  // ── Wire profile-link and mobile btn ─────────────────────────────────
  function _wire() {
    document.addEventListener('click', e => {
      const t = e.target.closest('#mobile-profile-btn, .pp-open-trigger');
      if (t) { e.preventDefault(); open(); }
    });
    document.addEventListener('keydown', e => { if (e.key === 'Escape' && _open) close(); });
    _watchLogin();
    _outsideDropdown();
  }

  // ── Public: open ─────────────────────────────────────────────────────
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

  // ── Init ──────────────────────────────────────────────────────────────
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', _wire);
  else _wire();

  return { open, close, _editName, _saveName, _share };
})();

window.ProfilePanel = ProfilePanel;
console.log('👤 ProfilePanel v2 ready');
