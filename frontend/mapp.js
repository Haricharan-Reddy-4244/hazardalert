// ════════════════════════════════════════════════════════════════════════════
//  HazardAlert — Production Map Engine v2.0
//  Inspired by: Google Maps, Waze, Uber, Apple Maps, Ola, Rapido, Zomato
//
//  FEATURES:
//  1.  ⚡ Performance-first — viewport culling, canvas renderer, no re-renders
//  2.  📍 Live GPS dot — smooth movement, heading arrow like Google Maps
//  3.  🗺️  3 tile styles — Dark / Street / Satellite
//  4.  🔴 Heatmap danger zones — like Uber surge pricing overlay
//  5.  🛣️  Safe Route Planner — draw route, score it 0-100 like Waze
//  6.  🔊 Voice proximity alerts — "Caution: pothole 150m ahead" like Waze
//  7.  ⏱️  Time-lapse shame replay — scrub slider shows hazard age like a DVR
//  8.  🏙️  Ward accountability layer — GHMC ward zones coloured by grade
//  9.  🚗  Auto driving mode — detects speed > 20 km/h, switches UI
//  10. 📌 Tap-to-report with reverse geocode address lookup
//  11. 📊 Bottom sheet with full hazard details + actions
//  12. 🔍 Search box — find location on map (Nominatim, free, no key)
//  13. 🧲 Marker clustering — smooth at any zoom level
//  14. 🔄 Smart refresh — only re-fetch if viewport changes significantly
//  15. 🌓 Dark mode sync — map style follows OS preference
// ════════════════════════════════════════════════════════════════════════════

const HazardMap = (function () {

  // ── Private state ────────────────────────────────────────────────────────
  let _map = null;
  let _tileLayer = null;
  let _clusterGroup = null;
  let _canvasRenderer = null;
  let _currentStyle = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'street';

  // GPS state
  let _userMarker = null;
  let _userAccuracyCircle = null;
  let _userHeadingArrow = null;
  let _watchId = null;
  let _userLat = null;
  let _userLng = null;
  let _userSpeed = 0;          // m/s from GPS
  let _userHeading = null;
  let _isDriving = false;
  let _lastFocused = false;

  // Hazard data
  let _allHazards = [];
  let _activeHazard = null;
  let _renderedIds = new Set();

  // Layers
  let _heatmapLayer = null;
  let _wardLayers = [];
  let _safetyZoneLayers = [];
  let _routeLayer = null;
  let _routeMarkers = [];
  let _routeHazardMarkers = [];

  // Proximity alerting
  let _proximityAlerted = new Set();
  let _voiceEnabled = false;
  let _speechSynth = window.speechSynthesis || null;

  // Tap-to-report
  let _tapMode = false;
  let _tapMarker = null;

  // Shame replay
  let _replayActive = false;
  let _replayDayFilter = 999;

  // Route planning
  let _routeMode = false;
  let _routePoints = [];

  // Search
  let _searchTimeout = null;

  // Last viewport for smart refresh
  let _lastBounds = null;
  let _refreshTimer = null;

  // ── Constants ────────────────────────────────────────────────────────────
  const TILES = {
    dark: { url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', name: '🌙 Dark', attr: '© CartoDB © OSM', subdomains: 'abcd' },
    street: { url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', name: '🗺️ Street', attr: '© OpenStreetMap', subdomains: 'abc' },
    satellite: { url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', name: '🛰️ Satellite', attr: '© Esri', subdomains: '' }
  };

  const SEV_COLOR = { critical: '#ef4444', high: '#f97316', medium: '#eab308', low: '#10b981' };
  const SEV_WEIGHT = { critical: 4, high: 3, medium: 2, low: 1 };

  const TYPE_ICON = {
    pothole: '🕳️', waterlogging: '🌊', fire: '🔥', accident: '💥',
    'road closure': '🚧', 'fallen tree': '🌳', 'open manhole': '🔓',
    'broken road': '🛣️', 'street light out': '💡', 'garbage dump': '🗑️',
    'damaged footpath': '🚶', debris: '⚠️', other: '⚠️'
  };

  const TYPE_VOICE = {
    pothole: 'pothole on road',
    waterlogging: 'waterlogging ahead',
    'open manhole': 'open manhole — extreme danger',
    accident: 'accident reported ahead',
    'fallen tree': 'fallen tree blocking road',
    'road closure': 'road closure ahead',
    'broken road': 'broken road surface',
    other: 'road hazard'
  };

  // Hyderabad GHMC ward boundaries (simplified representative polygons)
  // In production, load from /api/intelligence/ward-boundaries
  const SAMPLE_WARDS = [
    { name: 'Ameerpet', bounds: [[17.425, 78.435], [17.455, 78.470]], grade: 'F' },
    { name: 'Hitech City', bounds: [[17.435, 78.365], [17.465, 78.400]], grade: 'D' },
    { name: 'Kukatpally', bounds: [[17.470, 78.390], [17.500, 78.425]], grade: 'C' },
    { name: 'Banjara Hills', bounds: [[17.400, 78.425], [17.425, 78.455]], grade: 'B' },
    { name: 'LB Nagar', bounds: [[17.330, 78.530], [17.365, 78.565]], grade: 'F' },
    { name: 'Gachibowli', bounds: [[17.425, 78.335], [17.455, 78.365]], grade: 'C' },
    { name: 'Mehdipatnam', bounds: [[17.385, 78.425], [17.410, 78.455]], grade: 'D' },
    { name: 'Kondapur', bounds: [[17.450, 78.345], [17.475, 78.375]], grade: 'B' },
  ];

  const GRADE_COLOR = { A: '#10b981', B: '#84cc16', C: '#eab308', D: '#f97316', F: '#ef4444' };

  // ════════════════════════════════════════════════════════════════════════
  //  STYLES — injected once
  // ════════════════════════════════════════════════════════════════════════
  function _injectStyles() {
    if (document.getElementById('hm-styles')) return;
    const s = document.createElement('style');
    s.id = 'hm-styles';
    s.textContent = `
      /* ── Remove Leaflet divIcon box ── */
      .leaflet-div-icon { background: transparent !important; border: none !important; box-shadow: none !important; }

      /* ── GPS dot ── */
      .hm-gps-dot {
        width: 20px; height: 20px;
        background: #2563eb; border: 3px solid #fff;
        border-radius: 50%;
        box-shadow: 0 0 0 0 rgba(37,99,235,.5);
        animation: hm-gps-pulse 2.2s ease-in-out infinite;
        position: relative;
      }
      .hm-gps-heading {
        position: absolute; top: -10px; left: 50%;
        transform: translateX(-50%);
        width: 0; height: 0;
        border-left: 5px solid transparent;
        border-right: 5px solid transparent;
        border-bottom: 10px solid #2563eb;
        opacity: 0; transition: opacity .4s;
      }
      .hm-gps-heading.visible { opacity: 1; }
      @keyframes hm-gps-pulse {
        0%, 100% { box-shadow: 0 0 0 0 rgba(37,99,235,.5); }
        60%       { box-shadow: 0 0 0 14px rgba(37,99,235,0); }
      }

      /* ── Critical pin pulse ring ── */
      @keyframes hm-pin-pulse {
        0%   { transform: scale(1); opacity: .7; }
        100% { transform: scale(2.4); opacity: 0; }
      }

      /* ── Map controls ── */
      .hm-ctrl-row {
        position: absolute; top: 12px; right: 12px; z-index: 900;
        display: flex; flex-direction: column; gap: 6px; align-items: flex-end;
      }
      .hm-ctrl-pill {
        display: flex; align-items: center; gap: 4px;
        background: rgba(15,23,42,.92); backdrop-filter: blur(10px);
        border: 1px solid rgba(255,255,255,.1);
        border-radius: 22px; padding: 5px 10px;
        box-shadow: 0 4px 18px rgba(0,0,0,.3);
      }
      .hm-ctrl-pill button {
        border: none; background: transparent; color: rgba(255,255,255,.6);
        font-size: 11px; font-weight: 700; padding: 4px 9px; border-radius: 14px;
        cursor: pointer; letter-spacing: .3px; transition: all .15s; white-space: nowrap;
      }
      .hm-ctrl-pill button.active { background: #2563eb; color: #fff; }
      .hm-ctrl-pill button:hover:not(.active) { color: #fff; background: rgba(255,255,255,.1); }

      /* ── Left control bar ── */
      .hm-ctrl-left {
        position: absolute; top: 12px; left: 12px; z-index: 900;
        display: flex; flex-direction: column; gap: 6px;
      }
      .hm-fab {
        background: rgba(15,23,42,.92); backdrop-filter: blur(10px);
        border: 1px solid rgba(255,255,255,.1);
        color: #fff; border: none; border-radius: 12px;
        padding: 9px 14px; font-size: 12px; font-weight: 700;
        cursor: pointer; box-shadow: 0 4px 18px rgba(0,0,0,.3);
        transition: all .2s; white-space: nowrap;
        display: flex; align-items: center; gap: 6px;
      }
      .hm-fab:hover { transform: translateY(-1px); box-shadow: 0 6px 24px rgba(0,0,0,.4); }
      .hm-fab.active { background: #dc2626; border-color: #ef4444; }
      .hm-fab.route-active { background: #7c3aed; }
      .hm-fab.voice-active { background: #059669; }

      /* ── Search box ── */
      #hm-search-wrap {
        position: absolute; top: 12px; left: 50%; transform: translateX(-50%);
        z-index: 901; width: 260px;
      }
      #hm-search-input {
        width: 100%; padding: 9px 14px; font-size: 13px; font-weight: 500;
        background: rgba(15,23,42,.95); backdrop-filter: blur(12px);
        border: 1px solid rgba(255,255,255,.15); border-radius: 22px;
        color: #f1f5f9; outline: none; box-shadow: 0 4px 18px rgba(0,0,0,.35);
        transition: border-color .2s;
      }
      #hm-search-input::placeholder { color: rgba(255,255,255,.35); }
      #hm-search-input:focus { border-color: rgba(37,99,235,.7); }
      #hm-search-results {
        margin-top: 4px; background: rgba(15,23,42,.97); backdrop-filter: blur(12px);
        border: 1px solid rgba(255,255,255,.1); border-radius: 12px;
        overflow: hidden; display: none; box-shadow: 0 8px 30px rgba(0,0,0,.4);
      }
      .hm-search-item {
        padding: 10px 14px; font-size: 12px; color: #cbd5e1; cursor: pointer;
        border-bottom: 1px solid rgba(255,255,255,.05); transition: background .12s;
      }
      .hm-search-item:hover { background: rgba(37,99,235,.2); color: #fff; }
      .hm-search-item:last-child { border-bottom: none; }

      /* ── Bottom sheet ── */
      .hm-sheet {
        position: absolute; bottom: 0; left: 0; right: 0; z-index: 800;
        background: #0f172a; border-radius: 20px 20px 0 0;
        box-shadow: 0 -6px 40px rgba(0,0,0,.5);
        padding: 0 0 20px; max-height: 60%;
        transform: translateY(100%);
        transition: transform .35s cubic-bezier(.34,1.56,.64,1);
        overflow-y: auto;
      }
      .hm-sheet.open { transform: translateY(0); }
      .hm-sheet-handle {
        width: 36px; height: 4px; background: rgba(255,255,255,.2);
        border-radius: 2px; margin: 10px auto 14px;
      }
      .hm-sheet-body { padding: 0 16px; }
      .hm-sheet-actions { display: flex; gap: 8px; flex-wrap: wrap; margin-top: 14px; }
      .hm-action-btn {
        flex: 1; min-width: 90px; padding: 11px 10px;
        border: none; border-radius: 12px; font-weight: 700;
        font-size: 12px; cursor: pointer; transition: opacity .15s;
      }
      .hm-action-btn:hover { opacity: .85; }

      /* ── Proximity / voice toast ── */
      .hm-prox-toast {
        position: fixed; top: 70px; left: 50%; z-index: 9999;
        transform: translateX(-50%) translateY(-20px); opacity: 0;
        background: linear-gradient(135deg, #b91c1c, #7f1d1d);
        color: #fff; border-radius: 16px; padding: 12px 20px;
        font-size: 13px; font-weight: 700;
        box-shadow: 0 8px 32px rgba(185,28,28,.5);
        display: flex; align-items: center; gap: 10px;
        animation: hm-toast-in .4s forwards, hm-toast-out .4s 4.6s forwards;
        min-width: 240px; max-width: 340px; text-align: center; justify-content: center;
      }
      @keyframes hm-toast-in  { to { transform: translateX(-50%) translateY(0); opacity: 1; } }
      @keyframes hm-toast-out { to { transform: translateX(-50%) translateY(-20px); opacity: 0; } }

      /* ── Shame replay panel ── */
      #hm-replay-panel {
        position: absolute; bottom: 16px; left: 50%; transform: translateX(-50%);
        z-index: 850; background: rgba(15,23,42,.95); backdrop-filter: blur(12px);
        border: 1px solid rgba(255,255,255,.1); border-radius: 16px;
        padding: 12px 20px; min-width: 280px;
        box-shadow: 0 8px 32px rgba(0,0,0,.4); display: none;
      }
      #hm-replay-panel.open { display: block; }
      .hm-replay-label { font-size: 11px; color: rgba(255,255,255,.5); margin-bottom: 6px; font-weight: 700; letter-spacing: .5px; }
      #hm-replay-slider { width: 100%; }
      #hm-replay-day { font-size: 13px; color: #f87171; font-weight: 800; margin-top: 4px; text-align: center; }

      /* ── Driving mode overlay ── */
      #hm-driving-banner {
        position: absolute; top: 0; left: 0; right: 0; z-index: 950;
        background: linear-gradient(135deg, #7c3aed, #4f46e5);
        color: #fff; font-size: 12px; font-weight: 800;
        padding: 6px 16px; text-align: center; letter-spacing: .4px;
        display: none;
      }
      #hm-driving-banner.active { display: block; }

      /* ── Route planning ── */
      .hm-route-score {
        position: absolute; top: 60px; right: 12px; z-index: 900;
        background: rgba(15,23,42,.95); backdrop-filter: blur(10px);
        border: 1px solid rgba(255,255,255,.1); border-radius: 14px;
        padding: 12px 16px; min-width: 140px; display: none;
        box-shadow: 0 6px 24px rgba(0,0,0,.4);
      }
      .hm-route-score.visible { display: block; }
      .hm-score-num { font-size: 32px; font-weight: 900; }
      .hm-score-label { font-size: 10px; color: rgba(255,255,255,.5); font-weight: 700; text-transform: uppercase; letter-spacing: .8px; }

      /* ── Cursor crosshair in tap mode ── */
      .hm-tap-cursor { cursor: crosshair !important; }

      /* ── Ward tooltip ── */
      .hm-ward-tooltip {
        background: rgba(15,23,42,.95) !important; color: #f1f5f9 !important;
        border: 1px solid rgba(255,255,255,.15) !important; border-radius: 8px !important;
        font-size: 12px !important; font-weight: 700 !important; padding: 6px 10px !important;
        box-shadow: 0 4px 16px rgba(0,0,0,.4) !important;
      }

      /* ── Popup ── */
      .hm-popup .leaflet-popup-content-wrapper {
        background: #0f172a; border-radius: 14px; border: 1px solid rgba(255,255,255,.1);
        box-shadow: 0 12px 40px rgba(0,0,0,.5); padding: 0; overflow: hidden;
      }
      .hm-popup .leaflet-popup-content { margin: 0; width: 230px !important; color: #f1f5f9; }
      .hm-popup .leaflet-popup-tip { background: #0f172a; }
      .hm-popup .leaflet-popup-close-button { color: rgba(255,255,255,.4) !important; top: 6px; right: 8px; }

      /* ── Locate me button ── */
      #hm-locate-btn {
        position: absolute; bottom: 100px; right: 12px; z-index: 900;
        width: 40px; height: 40px; border-radius: 50%;
        background: rgba(15,23,42,.92); backdrop-filter: blur(10px);
        border: 1px solid rgba(255,255,255,.1); color: #60a5fa;
        font-size: 18px; display: flex; align-items: center; justify-content: center;
        cursor: pointer; box-shadow: 0 4px 18px rgba(0,0,0,.3); transition: all .2s;
      }
      #hm-locate-btn:hover { background: #1e40af; color: #fff; }

      /* ── Stats strip ── */
      #hm-stats-strip {
        position: absolute; bottom: 0; left: 0; right: 0; z-index: 799;
        background: rgba(15,23,42,.9); backdrop-filter: blur(8px);
        border-top: 1px solid rgba(255,255,255,.08);
        display: flex; align-items: center; justify-content: space-around;
        padding: 6px 16px; font-size: 11px; color: rgba(255,255,255,.5);
      }
      .hm-stat-item { display: flex; flex-direction: column; align-items: center; gap: 1px; }
      .hm-stat-val { font-size: 15px; font-weight: 800; color: #fff; }
      .hm-stat-val.red { color: #f87171; }
      .hm-stat-val.green { color: #34d399; }
      .hm-stat-val.yellow { color: #fbbf24; }
    `;
    document.head.appendChild(s);
  }

  // ════════════════════════════════════════════════════════════════════════
  //  TILE LAYER — fast CartoDB / OSM / Esri
  // ════════════════════════════════════════════════════════════════════════
  function _applyTileStyle(style) {
    if (_tileLayer) _map.removeLayer(_tileLayer);
    const t = TILES[style];
    _tileLayer = L.tileLayer(t.url, {
      attribution: t.attr,
      maxZoom: 19,
      subdomains: t.subdomains || 'abc',
      keepBuffer: 4,           // pre-render extra tiles to prevent blank flicker
      updateWhenIdle: false,   // render while panning (smoother feel)
      updateWhenZooming: false
    }).addTo(_map);
    _currentStyle = style;
  }

  // ════════════════════════════════════════════════════════════════════════
  //  GPS — live dot with heading arrow + driving detection
  //  Inspired by: Google Maps (smooth dot), Rapido (driver arrow)
  // ════════════════════════════════════════════════════════════════════════
  function _setupGPS() {
    if (!navigator.geolocation) return;

    const dotIcon = () => L.divIcon({
      html: `<div class="hm-gps-dot"><div class="hm-gps-heading${_userHeading !== null ? ' visible' : ''}" style="transform:translateX(-50%) rotate(${(_userHeading || 0)}deg)"></div></div>`,
      className: '', iconSize: [20, 20], iconAnchor: [10, 10]
    });

    _watchId = navigator.geolocation.watchPosition(pos => {
      const { latitude: lat, longitude: lng, accuracy, speed, heading } = pos.coords;
      _userLat = lat; _userLng = lng;
      _userSpeed = speed || 0;
      if (heading !== null && heading !== undefined) _userHeading = heading;

      // Driving mode: speed > ~20 km/h (5.5 m/s)
      const wasDriving = _isDriving;
      _isDriving = _userSpeed > 5.5;
      if (_isDriving !== wasDriving) _toggleDrivingMode(_isDriving);

      // Create or update GPS marker
      if (!_userMarker) {
        _userMarker = L.marker([lat, lng], { icon: dotIcon(), zIndexOffset: 3000 }).addTo(_map);
        _userAccuracyCircle = L.circle([lat, lng], {
          radius: Math.min(accuracy || 30, 150),
          color: '#3b82f6', fillColor: '#93c5fd',
          fillOpacity: 0.12, weight: 1
        }).addTo(_map);
        // First location — fly to user
        if (!_lastFocused) {
          _map.flyTo([lat, lng], 15, { animate: true, duration: 1.5 });
          _lastFocused = true;
        }
      } else {
        _userMarker.setLatLng([lat, lng]);
        _userMarker.setIcon(dotIcon());
        _userAccuracyCircle.setLatLng([lat, lng]);
        if (accuracy) _userAccuracyCircle.setRadius(Math.min(accuracy, 150));
      }

      // Update user location in DB (throttled — once per 30s)
      if (!_setupGPS._lastUpload || Date.now() - _setupGPS._lastUpload > 30000) {
        _setupGPS._lastUpload = Date.now();
        const uid = window.AppData?.currentUser?.id;
        if (uid) {
          fetch(`${window.API_BASE || 'http://localhost:5000'}/api/hazards/user-location`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId: uid, latitude: lat, longitude: lng })
          }).catch(() => { });
        }
      }

      // Proximity voice alerts
      if (_allHazards.length) _checkProximity(lat, lng);

    }, () => {
      // GPS denied — default to Hyderabad center
      _userLat = 17.3850; _userLng = 78.4867;
    }, {
      enableHighAccuracy: true,
      maximumAge: _isDriving ? 1000 : 5000,
      timeout: 10000
    });
  }

  // ════════════════════════════════════════════════════════════════════════
  //  DRIVING MODE — like Rapido trip view
  // ════════════════════════════════════════════════════════════════════════
  function _toggleDrivingMode(on) {
    const banner = document.getElementById('hm-driving-banner');
    if (banner) banner.classList.toggle('active', on);
    if (on) {
      // Zoom out a bit for road context
      if (_map.getZoom() > 16) _map.setZoom(15, { animate: true });
      _showToast('🚗 Driving mode activated — voice alerts enabled');
      _voiceEnabled = true;
      const vBtn = document.getElementById('hm-voice-btn');
      if (vBtn) { vBtn.classList.add('voice-active'); vBtn.textContent = '🔊 Voice ON'; }
    }
  }

  // ════════════════════════════════════════════════════════════════════════
  //  MARKER RENDERING — viewport-culled, canvas-backed, clustered
  //  Inspired by: Google Maps (smooth markers), Waze (type icons)
  // ════════════════════════════════════════════════════════════════════════
  function _buildPin(color, emoji, isCritical, opacity) {
    const pulse = isCritical ? `<div style="position:absolute;top:-8px;left:-8px;width:54px;height:54px;border-radius:50%;border:2px solid ${color};animation:hm-pin-pulse 1.8s ease-out infinite;pointer-events:none;opacity:.6;"></div>` : '';
    return `
      <div style="position:relative;width:38px;height:52px;opacity:${opacity};">
        ${pulse}
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 38 52" width="38" height="52" style="position:absolute;top:0;left:0;filter:drop-shadow(0 4px 10px rgba(0,0,0,.45));">
          <circle cx="19" cy="19" r="18" fill="${color}"/>
          <circle cx="19" cy="19" r="18" fill="none" stroke="white" stroke-width="2.5"/>
          <circle cx="19" cy="19" r="10" fill="rgba(255,255,255,.18)"/>
          <polygon points="10,30 28,30 19,52" fill="${color}"/>
          <polygon points="12,31 26,31 19,50" fill="${color}" opacity=".85"/>
        </svg>
        <div style="position:absolute;top:7px;left:0;width:38px;text-align:center;font-size:15px;pointer-events:none;">${emoji}</div>
      </div>`;
  }

  function _renderHazards(hazards) {
    if (!_clusterGroup) return;
    _clusterGroup.clearLayers();
    _renderedIds.clear();

    // Only render hazards visible in current viewport + 20% buffer
    const bounds = _map.getBounds().pad(0.2);
    const now = Date.now();

    // Apply shame-replay day filter
    const visibleHazards = hazards.filter(h => {
      const lat = parseFloat(h.latitude || h.location?.lat);
      const lng = parseFloat(h.longitude || h.location?.lng);
      if (!lat || !lng || isNaN(lat) || isNaN(lng)) return false;
      if (!bounds.contains([lat, lng])) return false;

      // Replay filter
      if (_replayActive) {
        const ageDays = (now - new Date(h.createdAt || h.timestamp || now).getTime()) / 86400000;
        if (ageDays > _replayDayFilter) return false;
      }
      return true;
    });

    visibleHazards.forEach(hazard => {
      const lat = parseFloat(hazard.latitude || hazard.location?.lat);
      const lng = parseFloat(hazard.longitude || hazard.location?.lng);
      const sev = (hazard.severity || 'medium').toLowerCase();
      const color = SEV_COLOR[sev] || '#6b7280';
      const typeKey = (hazard.hazardType || hazard.type || '').toLowerCase();
      const emoji = TYPE_ICON[typeKey] || '⚠️';
      const isCritical = sev === 'critical';
      const ageDays = (now - new Date(hazard.createdAt || hazard.timestamp || now).getTime()) / 86400000;
      const opacity = ageDays > 14 ? 0.45 : ageDays > 7 ? 0.7 : 1;
      const ageDaysStr = ageDays < 1 ? 'Today' : ageDays < 2 ? '1 day ago' : `${Math.floor(ageDays)}d ago`;

      const icon = L.divIcon({
        html: _buildPin(color, emoji, isCritical, opacity),
        className: '', iconSize: [38, 52], iconAnchor: [19, 52], popupAnchor: [0, -56]
      });

      const marker = L.marker([lat, lng], { icon });
      marker._hazardData = hazard;

      // Popup HTML
      const popupHtml = `
        <div style="font-family:system-ui;background:#0f172a;color:#f1f5f9;">
          <div style="padding:10px 12px 8px;border-bottom:1px solid rgba(255,255,255,.08);background:${color}18;">
            <span style="font-size:18px;">${emoji}</span>
            <span style="font-weight:800;font-size:13px;color:${color};margin-left:6px;">${hazard.hazardType || hazard.type || 'Hazard'}</span>
            <span style="float:right;background:${color}30;color:${color};padding:2px 8px;border-radius:10px;font-size:10px;font-weight:800;">${sev.toUpperCase()}</span>
          </div>
          <div style="padding:8px 12px 10px;">
            <div style="font-size:11px;color:#94a3b8;margin-bottom:3px;">⏱ ${ageDaysStr} · 👤 ${hazard.reporter || 'Anonymous'}</div>
            <div style="font-size:12px;color:#cbd5e1;margin-bottom:8px;line-height:1.4;">${(hazard.description || '').slice(0, 80)}${(hazard.description || '').length > 80 ? '…' : ''}</div>
            <button onclick="HazardMap._openSheetById(${hazard.id})" style="width:100%;padding:8px;background:${color};color:#fff;border:none;border-radius:9px;font-weight:700;font-size:11px;cursor:pointer;">View Full Details →</button>
          </div>
        </div>`;

      marker.bindPopup(popupHtml, { className: 'hm-popup', maxWidth: 250, closeButton: true });

      marker.on('click', () => {
        _map.flyTo([lat, lng], Math.max(_map.getZoom(), 15), { animate: true, duration: 0.6 });
        _openSheet(hazard);
      });

      _clusterGroup.addLayer(marker);
      _renderedIds.add(hazard.id);
    });

    _updateStatsStrip(hazards);
  }

  // Smart re-render only when viewport changes significantly
  function _setupSmartRefresh() {
    _map.on('moveend zoomend', () => {
      const b = _map.getBounds();
      if (!_lastBounds || !_lastBounds.intersects(b) ||
        Math.abs(b.getNorth() - _lastBounds.getNorth()) > 0.05) {
        _lastBounds = b;
        _renderHazards(_allHazards);
      }
    });
  }

  // ════════════════════════════════════════════════════════════════════════
  //  CLUSTERING — smooth Leaflet.MarkerCluster
  // ════════════════════════════════════════════════════════════════════════
  function _setupCluster(cb) {
    if (typeof L.markerClusterGroup === 'function') { _initCluster(); cb && cb(); return; }

    const css1 = document.createElement('link');
    css1.rel = 'stylesheet';
    css1.href = 'https://unpkg.com/leaflet.markercluster@1.5.3/dist/MarkerCluster.css';
    const css2 = document.createElement('link');
    css2.rel = 'stylesheet';
    css2.href = 'https://unpkg.com/leaflet.markercluster@1.5.3/dist/MarkerCluster.Default.css';
    document.head.appendChild(css1);
    document.head.appendChild(css2);

    const sc = document.createElement('script');
    sc.src = 'https://unpkg.com/leaflet.markercluster@1.5.3/dist/leaflet.markercluster.js';
    sc.onload = () => { _initCluster(); cb && cb(); };
    document.head.appendChild(sc);
  }

  function _initCluster() {
    _clusterGroup = L.markerClusterGroup({
      maxClusterRadius: 55,
      disableClusteringAtZoom: 16,
      showCoverageOnHover: false,
      animate: true,
      chunkedLoading: true,          // add markers in chunks — never blocks UI
      chunkInterval: 200,
      iconCreateFunction(cluster) {
        const n = cluster.getChildCount();
        const col = n < 5 ? '#2563eb' : n < 15 ? '#f59e0b' : '#ef4444';
        return L.divIcon({
          html: `<div style="width:42px;height:42px;border-radius:50%;background:${col}22;border:2.5px solid ${col};display:flex;align-items:center;justify-content:center;font-weight:900;font-size:14px;color:${col};box-shadow:0 2px 12px ${col}55;">${n}</div>`,
          className: '', iconSize: [42, 42]
        });
      }
    });
    _map.addLayer(_clusterGroup);
  }

  // ════════════════════════════════════════════════════════════════════════
  //  HEATMAP DANGER ZONES — like Uber surge pricing overlay
  //  Uses Leaflet.heat (canvas-based, never freezes the map)
  // ════════════════════════════════════════════════════════════════════════
  function _setupHeatmap(hazards) {
    if (_heatmapLayer) { _map.removeLayer(_heatmapLayer); _heatmapLayer = null; }

    const loadHeat = (cb) => {
      if (typeof L.heatLayer === 'function') { cb(); return; }
      const sc = document.createElement('script');
      sc.src = 'https://unpkg.com/leaflet.heat@0.2.0/dist/leaflet-heat.js';
      sc.onload = cb;
      document.head.appendChild(sc);
    };

    loadHeat(() => {
      const points = hazards
        .filter(h => h.latitude && h.longitude)
        .map(h => {
          const w = SEV_WEIGHT[(h.severity || 'low').toLowerCase()] || 1;
          return [parseFloat(h.latitude), parseFloat(h.longitude), w * 0.4];
        });

      _heatmapLayer = L.heatLayer(points, {
        radius: 35,
        blur: 25,
        maxZoom: 14,
        gradient: { 0.3: '#3b82f6', 0.55: '#eab308', 0.8: '#f97316', 1.0: '#ef4444' }
      }).addTo(_map);
    });
  }

  // ════════════════════════════════════════════════════════════════════════
  //  WARD ACCOUNTABILITY LAYER — unique to India, like Swiggy zone view
  // ════════════════════════════════════════════════════════════════════════
  function _renderWardLayer(hazards) {
    _wardLayers.forEach(l => _map.removeLayer(l));
    _wardLayers = [];

    SAMPLE_WARDS.forEach(ward => {
      // Count hazards in this ward
      const count = hazards.filter(h => {
        const lat = parseFloat(h.latitude);
        const lng = parseFloat(h.longitude);
        return lat >= ward.bounds[0][0] && lat <= ward.bounds[1][0] &&
          lng >= ward.bounds[0][1] && lng <= ward.bounds[1][1];
      }).length;

      const grade = count >= 10 ? 'F' : count >= 7 ? 'D' : count >= 4 ? 'C' : count >= 2 ? 'B' : 'A';
      const col = GRADE_COLOR[grade];

      const rect = L.rectangle(ward.bounds, {
        color: col, fillColor: col, fillOpacity: 0.18, weight: 2, opacity: 0.7,
        dashArray: '6 4'
      }).addTo(_map);

      rect.bindTooltip(
        `<b>${ward.name}</b><br>Grade <b style="color:${col}">${grade}</b> · ${count} hazard${count !== 1 ? 's' : ''}`,
        { className: 'hm-ward-tooltip', sticky: true }
      );

      rect.on('click', () => {
        const worst = hazards
          .filter(h => {
            const lat = parseFloat(h.latitude);
            const lng = parseFloat(h.longitude);
            return lat >= ward.bounds[0][0] && lat <= ward.bounds[1][0] &&
              lng >= ward.bounds[0][1] && lng <= ward.bounds[1][1];
          })
          .sort((a, b) => (SEV_WEIGHT[b.severity] || 1) - (SEV_WEIGHT[a.severity] || 1))[0];

        if (worst) _openSheet(worst);
        else _showToast(`${ward.name}: No active hazards — Grade ${grade} ✅`);
      });

      // Grade label in center of ward
      const centerLat = (ward.bounds[0][0] + ward.bounds[1][0]) / 2;
      const centerLng = (ward.bounds[0][1] + ward.bounds[1][1]) / 2;
      const label = L.marker([centerLat, centerLng], {
        icon: L.divIcon({
          html: `<div style="font-size:14px;font-weight:900;color:${col};text-shadow:0 1px 4px rgba(0,0,0,.8);white-space:nowrap;pointer-events:none;">${ward.name}<br><span style="font-size:18px;">${grade}</span></div>`,
          className: '', iconAnchor: [40, 20]
        }),
        interactive: false
      }).addTo(_map);

      _wardLayers.push(rect);
      _wardLayers.push(label);
    });
  }

  // ════════════════════════════════════════════════════════════════════════
  //  SAFE ROUTE PLANNER — like Waze route safety score
  //  Click two points, get a route scored 0-100 for hazard density
  // ════════════════════════════════════════════════════════════════════════
  function _setupRoutePlanner() {
    _map.on('click', e => {
      if (!_routeMode) return;

      _routePoints.push([e.latlng.lat, e.latlng.lng]);

      const dot = L.circleMarker([e.latlng.lat, e.latlng.lng], {
        radius: 8, color: '#7c3aed', fillColor: '#7c3aed', fillOpacity: 1, weight: 3
      }).addTo(_map);
      _routeMarkers.push(dot);

      if (_routePoints.length === 1) {
        _showToast('📍 Start set — now tap your destination');
      }

      if (_routePoints.length === 2) {
        _drawRoute(_routePoints[0], _routePoints[1]);
      }
    });
  }

  function _drawRoute(from, to) {
    // Draw straight polyline (production: call OSRM/GraphHopper routing API)
    if (_routeLayer) _map.removeLayer(_routeLayer);
    _routeHazardMarkers.forEach(m => _map.removeLayer(m));
    _routeHazardMarkers = [];

    _routeLayer = L.polyline([from, to], {
      color: '#7c3aed', weight: 5, opacity: 0.8,
      dashArray: '10 6'
    }).addTo(_map);

    _map.fitBounds(_routeLayer.getBounds(), { padding: [40, 40] });

    // Score route: find hazards within 200m of the straight line
    let hazardCount = 0;
    let criticalCount = 0;

    _allHazards.forEach(h => {
      const hLat = parseFloat(h.latitude);
      const hLng = parseFloat(h.longitude);
      const dist = _pointToLineDist(hLat, hLng, from, to);
      if (dist < 0.2) { // 200m
        hazardCount++;
        if ((h.severity || '').toLowerCase() === 'critical') criticalCount++;
        // Mark hazard on route
        const sev = (h.severity || 'medium').toLowerCase();
        const warn = L.circleMarker([hLat, hLng], {
          radius: 6, color: SEV_COLOR[sev], fillColor: SEV_COLOR[sev],
          fillOpacity: 0.9, weight: 2
        }).addTo(_map);
        warn.bindTooltip(`⚠️ ${h.hazardType || 'Hazard'} on your route`, { className: 'hm-ward-tooltip' });
        _routeHazardMarkers.push(warn);
      }
    });

    const score = Math.max(0, 100 - hazardCount * 8 - criticalCount * 15);
    const scoreEl = document.getElementById('hm-route-score');
    const scoreNum = document.getElementById('hm-route-score-num');
    const scoreLabel = document.getElementById('hm-route-score-label');
    if (scoreEl && scoreNum && scoreLabel) {
      scoreEl.classList.add('visible');
      scoreNum.textContent = score;
      scoreNum.style.color = score >= 70 ? '#34d399' : score >= 40 ? '#fbbf24' : '#f87171';
      scoreLabel.textContent = score >= 70 ? '✅ Route is safe' : score >= 40 ? '⚠️ Moderate risk' : '🚨 Avoid this route';
    }
    _showToast(`Route scored ${score}/100 — ${hazardCount} hazard${hazardCount !== 1 ? 's' : ''} on path`);
  }

  // Point-to-line-segment distance (km) — Haversine approximation
  function _pointToLineDist(pLat, pLng, a, b) {
    // Simplified: use perpendicular distance in degrees, convert approx to km
    const [aLat, aLng] = a;
    const [bLat, bLng] = b;
    const dx = bLat - aLat, dy = bLng - aLng;
    if (dx === 0 && dy === 0) return _haversineKm(pLat, pLng, aLat, aLng);
    const t = Math.max(0, Math.min(1, ((pLat - aLat) * dx + (pLng - aLng) * dy) / (dx * dx + dy * dy)));
    const nearLat = aLat + t * dx;
    const nearLng = aLng + t * dy;
    return _haversineKm(pLat, pLng, nearLat, nearLng);
  }

  function _clearRoute() {
    if (_routeLayer) { _map.removeLayer(_routeLayer); _routeLayer = null; }
    _routeMarkers.forEach(m => _map.removeLayer(m)); _routeMarkers = [];
    _routeHazardMarkers.forEach(m => _map.removeLayer(m)); _routeHazardMarkers = [];
    _routePoints = [];
    document.getElementById('hm-route-score')?.classList.remove('visible');
  }

  // ════════════════════════════════════════════════════════════════════════
  //  PROXIMITY VOICE ALERTS — like Waze audio warnings
  // ════════════════════════════════════════════════════════════════════════
  function _checkProximity(lat, lng) {
    if (_proximityAlerted.size > 1000) _proximityAlerted.clear(); // memory guard

    _allHazards.forEach(h => {
      if ((h.status || '').toLowerCase() === 'resolved') return;
      const hLat = parseFloat(h.latitude || h.location?.lat);
      const hLng = parseFloat(h.longitude || h.location?.lng);
      if (!hLat || isNaN(hLat)) return;

      const dist = _haversineKm(lat, lng, hLat, hLng) * 1000; // metres
      const sev = (h.severity || '').toLowerCase();

      // Alert threshold: 300m for critical, 150m for others
      const threshold = sev === 'critical' ? 300 : 150;
      const alertKey = `${h.id}_${Math.floor(dist / 50)}`;

      if (dist <= threshold && !_proximityAlerted.has(alertKey)) {
        _proximityAlerted.add(alertKey);
        const typeKey = (h.hazardType || h.type || '').toLowerCase();
        const msg = `Caution: ${TYPE_VOICE[typeKey] || 'road hazard'}, ${Math.round(dist)} metres ahead`;
        _showProxToast(`🚨 ${msg}`);
        if (navigator.vibrate) navigator.vibrate([200, 80, 200]);
        if (_voiceEnabled) _speak(msg);
      }
    });
  }

  function _speak(text) {
    if (!_speechSynth) return;
    _speechSynth.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = 'en-IN';
    u.rate = 0.95;
    u.pitch = 1;
    u.volume = 1;
    _speechSynth.speak(u);
  }

  // ════════════════════════════════════════════════════════════════════════
  //  SHAME REPLAY — scrub timeline to see how long hazards are ignored
  //  Inspired by: Zomato order tracker, Google Maps traffic replay
  // ════════════════════════════════════════════════════════════════════════
  function _setupShameReplay() {
    const panel = document.getElementById('hm-replay-panel');
    const slider = document.getElementById('hm-replay-slider');
    const label = document.getElementById('hm-replay-day');
    if (!panel || !slider || !label) return;

    slider.addEventListener('input', () => {
      const days = parseInt(slider.value);
      _replayDayFilter = days;
      _replayActive = true;
      label.textContent = days >= 90 ? 'All time' : `Reported within last ${days} days`;
      _renderHazards(_allHazards);
    });
  }

  // ════════════════════════════════════════════════════════════════════════
  //  SEARCH — Nominatim reverse geocode, free, no API key
  //  Inspired by: Google Maps search bar
  // ════════════════════════════════════════════════════════════════════════
  function _setupSearch() {
    const input = document.getElementById('hm-search-input');
    const results = document.getElementById('hm-search-results');
    if (!input || !results) return;

    input.addEventListener('input', () => {
      clearTimeout(_searchTimeout);
      const q = input.value.trim();
      if (q.length < 3) { results.style.display = 'none'; return; }

      _searchTimeout = setTimeout(async () => {
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q + ', Hyderabad')}&format=json&limit=5&addressdetails=1`,
            { headers: { 'Accept-Language': 'en', 'User-Agent': 'HazardAlert-Civic-App' } }
          );
          const data = await res.json();
          if (!data.length) { results.style.display = 'none'; return; }

          results.innerHTML = data.map(r =>
            `<div class="hm-search-item" data-lat="${r.lat}" data-lng="${r.lon}">${r.display_name.split(',').slice(0, 3).join(', ')}</div>`
          ).join('');
          results.style.display = 'block';

          results.querySelectorAll('.hm-search-item').forEach(el => {
            el.addEventListener('click', () => {
              const lat = parseFloat(el.dataset.lat);
              const lng = parseFloat(el.dataset.lng);
              _map.flyTo([lat, lng], 16, { animate: true, duration: 1.2 });
              input.value = el.textContent;
              results.style.display = 'none';
            });
          });
        } catch { results.style.display = 'none'; }
      }, 500);
    });

    document.addEventListener('click', e => {
      if (!e.target.closest('#hm-search-wrap')) results.style.display = 'none';
    });
  }

  // ════════════════════════════════════════════════════════════════════════
  //  TAP-TO-REPORT — with reverse geocode address
  //  Inspired by: Google Maps place picker
  // ════════════════════════════════════════════════════════════════════════
  function _setupTapToReport() {
    _map.on('click', async e => {
      if (!_tapMode || _routeMode) return;
      const { lat, lng } = e.latlng;

      if (_tapMarker) _map.removeLayer(_tapMarker);
      _tapMarker = L.marker([lat, lng], {
        icon: L.divIcon({
          html: '<div style="width:28px;height:28px;background:#7c3aed;border:3px solid #fff;border-radius:50%;box-shadow:0 2px 12px rgba(124,58,237,.6);"></div>',
          className: '', iconSize: [28, 28], iconAnchor: [14, 14]
        }),
        zIndexOffset: 4000
      }).addTo(_map);

      // Reverse geocode
      let address = `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
      try {
        const r = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`, {
          headers: { 'User-Agent': 'HazardAlert-Civic-App' }
        });
        const d = await r.json();
        if (d.display_name) address = d.display_name.split(',').slice(0, 3).join(', ');
      } catch { }

      L.popup({ closeButton: true, className: 'hm-popup' })
        .setLatLng([lat, lng])
        .setContent(`
          <div style="font-family:system-ui;background:#0f172a;color:#f1f5f9;padding:14px;">
            <div style="font-weight:800;font-size:13px;margin-bottom:6px;">📍 Report hazard here?</div>
            <div style="font-size:11px;color:#94a3b8;margin-bottom:10px;line-height:1.4;">${address}</div>
            <button onclick="HazardMap.confirmTapReport(${lat},${lng},'${address.replace(/'/g, "\\'")}')" style="width:100%;padding:9px;background:#7c3aed;color:#fff;border:none;border-radius:9px;font-weight:700;cursor:pointer;font-size:12px;margin-bottom:6px;">✅ Yes, Report Here</button>
            <button onclick="HazardMap.cancelTap()" style="width:100%;padding:8px;background:rgba(255,255,255,.08);color:#cbd5e1;border:none;border-radius:9px;cursor:pointer;font-size:12px;">Cancel</button>
          </div>`)
        .openOn(_map);
    });
  }

  // ════════════════════════════════════════════════════════════════════════
  //  BOTTOM SHEET — full hazard details, like Ola booking sheet
  // ════════════════════════════════════════════════════════════════════════
  function _openSheet(hazard) {
    _activeHazard = hazard;
    const sev = (hazard.severity || 'medium').toLowerCase();
    const color = SEV_COLOR[sev] || '#6b7280';
    const typeKey = (hazard.hazardType || hazard.type || '').toLowerCase();
    const emoji = TYPE_ICON[typeKey] || '⚠️';
    const status = (hazard.status || 'pending');
    const statusColor = { verified: '#10b981', resolved: '#2563eb', pending: '#f59e0b', disputed: '#8b5cf6' }[status.toLowerCase()] || '#6b7280';
    const ageDays = Math.floor((Date.now() - new Date(hazard.createdAt || hazard.timestamp || Date.now()).getTime()) / 86400000);
    const timeStr = ageDays === 0 ? 'Reported today' : ageDays === 1 ? 'Reported yesterday' : `Reported ${ageDays} days ago`;

    const sheet = document.getElementById('hm-bottom-sheet');
    const body = document.getElementById('hm-sheet-body');
    if (!sheet || !body) return;

    body.innerHTML = `
      <div style="display:flex;align-items:flex-start;gap:12px;margin-bottom:12px;">
        <span style="font-size:34px;line-height:1;">${emoji}</span>
        <div style="flex:1;min-width:0;">
          <div style="font-weight:900;font-size:17px;color:${color};margin-bottom:5px;">${hazard.hazardType || hazard.type || 'Hazard'}</div>
          <div style="display:flex;gap:6px;flex-wrap:wrap;">
            <span style="background:${color}25;color:${color};padding:3px 10px;border-radius:20px;font-size:11px;font-weight:800;">${sev.toUpperCase()}</span>
            <span style="background:${statusColor}25;color:${statusColor};padding:3px 10px;border-radius:20px;font-size:11px;font-weight:700;">● ${status}</span>
            ${ageDays > 7 ? `<span style="background:#ef444425;color:#ef4444;padding:3px 10px;border-radius:20px;font-size:11px;font-weight:800;">⏰ ${ageDays}d UNRESOLVED</span>` : ''}
          </div>
        </div>
      </div>
      <div style="font-size:12px;color:#64748b;margin-bottom:3px;">👤 Reporter: <span style="color:#94a3b8;">${hazard.reporter || 'Anonymous'}</span></div>
      <div style="font-size:12px;color:#64748b;margin-bottom:8px;">📅 ${timeStr}</div>
      ${hazard.description ? `<div style="font-size:13px;color:#cbd5e1;margin-bottom:14px;line-height:1.55;padding:10px 12px;background:rgba(255,255,255,.04);border-radius:10px;border-left:3px solid ${color};">${hazard.description}</div>` : ''}
      <div style="display:flex;gap:8px;flex-wrap:wrap;">
        <button onclick="HazardMap._navigateTo()" style="flex:2;padding:11px;background:${color};color:#fff;border:none;border-radius:11px;font-weight:800;font-size:12px;cursor:pointer;">🧭 Navigate There</button>
        <button onclick="HazardMap._shareHazard()" style="flex:1;padding:11px;background:rgba(255,255,255,.08);color:#cbd5e1;border:none;border-radius:11px;font-size:12px;cursor:pointer;font-weight:700;">🔗 Share</button>
        <button onclick="HazardMap.closeSheet()" style="flex:0;padding:11px 14px;background:rgba(255,255,255,.06);border:none;border-radius:11px;font-size:13px;cursor:pointer;color:#64748b;">✕</button>
      </div>
      ${hazard.id ? `
      <div style="margin-top:10px;display:flex;gap:6px;">
        <button onclick="HazardMap._verifyHazard(${hazard.id},'confirm')" style="flex:1;padding:9px;background:rgba(16,185,129,.15);color:#34d399;border:1px solid rgba(16,185,129,.3);border-radius:10px;font-size:11px;font-weight:700;cursor:pointer;">👍 Confirm Hazard</button>
        <button onclick="HazardMap._verifyHazard(${hazard.id},'reject')" style="flex:1;padding:9px;background:rgba(239,68,68,.12);color:#f87171;border:1px solid rgba(239,68,68,.3);border-radius:10px;font-size:11px;font-weight:700;cursor:pointer;">👎 Dispute Report</button>
      </div>` : ''}`;

    sheet.classList.add('open');
  }

  // ════════════════════════════════════════════════════════════════════════
  //  STATS STRIP — live numbers at bottom like Uber trip stats
  // ════════════════════════════════════════════════════════════════════════
  function _updateStatsStrip(hazards) {
    const total = hazards.length;
    const critical = hazards.filter(h => (h.severity || '').toLowerCase() === 'critical').length;
    const resolved = hazards.filter(h => (h.status || '').toLowerCase() === 'resolved').length;
    const pct = total > 0 ? Math.round((resolved / total) * 100) : 0;

    const el = id => document.getElementById(id);
    if (el('hm-stat-total')) el('hm-stat-total').textContent = total;
    if (el('hm-stat-critical')) el('hm-stat-critical').textContent = critical;
    if (el('hm-stat-resolved')) el('hm-stat-resolved').textContent = `${pct}%`;
  }

  // ════════════════════════════════════════════════════════════════════════
  //  CONTROLS INJECTION — all UI panels appended to map container
  // ════════════════════════════════════════════════════════════════════════
  function _buildControls() {
    const c = _map.getContainer();
    c.style.position = 'relative';

    // Driving banner
    const drivingBanner = document.createElement('div');
    drivingBanner.id = 'hm-driving-banner';
    drivingBanner.innerHTML = '🚗 Driving Mode Active — Voice alerts enabled — Stay safe';
    c.appendChild(drivingBanner);

    // Search bar (centered top)
    const searchWrap = document.createElement('div');
    searchWrap.id = 'hm-search-wrap';
    searchWrap.innerHTML = `
      <input id="hm-search-input" type="text" placeholder="🔍 Search location in Hyderabad…" autocomplete="off" />
      <div id="hm-search-results"></div>`;
    c.appendChild(searchWrap);

    // Right control panel (tile style + toggles)
    const rightCtrl = document.createElement('div');
    rightCtrl.className = 'hm-ctrl-row';
    rightCtrl.innerHTML = `
      <div class="hm-ctrl-pill" id="hm-tile-switcher">
        ${Object.entries(TILES).map(([k, t]) =>
      `<button data-style="${k}" class="${k === _currentStyle ? 'active' : ''}">${t.name}</button>`
    ).join('')}
      </div>
      <div class="hm-ctrl-pill">
        <button id="hm-heatmap-btn" title="Toggle danger heatmap">🔴 Heatmap</button>
        <button id="hm-ward-btn" title="Toggle ward accountability zones">🏙️ Wards</button>
        <button id="hm-replay-btn" title="Shame replay — see how long hazards stay unresolved">⏱️ Replay</button>
      </div>`;
    c.appendChild(rightCtrl);

    // Left control panel (actions)
    const leftCtrl = document.createElement('div');
    leftCtrl.className = 'hm-ctrl-left';
    leftCtrl.innerHTML = `
      <button class="hm-fab" id="hm-tap-btn">📍 Tap to Report</button>
      <button class="hm-fab" id="hm-route-btn">🛣️ Safe Route</button>
      <button class="hm-fab" id="hm-voice-btn">🔕 Voice Alerts</button>`;
    c.appendChild(leftCtrl);

    // Locate-me button
    const locateBtn = document.createElement('div');
    locateBtn.id = 'hm-locate-btn';
    locateBtn.innerHTML = '◎';
    locateBtn.title = 'Go to my location';
    locateBtn.onclick = () => HazardMap.locateMe();
    c.appendChild(locateBtn);

    // Route safety score card
    const routeScore = document.createElement('div');
    routeScore.id = 'hm-route-score';
    routeScore.className = 'hm-route-score';
    routeScore.innerHTML = `
      <div class="hm-score-label">Route Safety</div>
      <div class="hm-score-num" id="hm-route-score-num">—</div>
      <div id="hm-route-score-label" style="font-size:11px;color:rgba(255,255,255,.5);margin-top:2px;"></div>
      <button onclick="HazardMap._clearRoute()" style="margin-top:8px;width:100%;padding:6px;background:rgba(255,255,255,.08);color:#94a3b8;border:none;border-radius:8px;font-size:11px;cursor:pointer;">Clear Route</button>`;
    c.appendChild(routeScore);

    // Shame replay panel
    const replayPanel = document.createElement('div');
    replayPanel.id = 'hm-replay-panel';
    replayPanel.innerHTML = `
      <div class="hm-replay-label">⏱️ SHAME REPLAY — Drag to see how long hazards are ignored</div>
      <input type="range" id="hm-replay-slider" min="1" max="90" value="90" style="width:100%;">
      <div id="hm-replay-day">All time</div>
      <button onclick="HazardMap._stopReplay()" style="margin-top:8px;width:100%;padding:6px;background:rgba(255,255,255,.08);color:#94a3b8;border:none;border-radius:8px;font-size:11px;cursor:pointer;">✕ Close Replay</button>`;
    c.appendChild(replayPanel);

    // Bottom sheet
    const sheet = document.createElement('div');
    sheet.id = 'hm-bottom-sheet';
    sheet.className = 'hm-sheet';
    sheet.innerHTML = `
      <div class="hm-sheet-handle"></div>
      <div class="hm-sheet-body" id="hm-sheet-body"></div>`;
    c.appendChild(sheet);

    // Stats strip
    const stats = document.createElement('div');
    stats.id = 'hm-stats-strip';
    stats.innerHTML = `
      <div class="hm-stat-item"><div class="hm-stat-val" id="hm-stat-total">—</div><div>Total</div></div>
      <div class="hm-stat-item"><div class="hm-stat-val red" id="hm-stat-critical">—</div><div>Critical</div></div>
      <div class="hm-stat-item"><div class="hm-stat-val green" id="hm-stat-resolved">—</div><div>Resolved</div></div>`;
    c.appendChild(stats);

    // ── Wire up events ────────────────────────────────────────────────
    // Tile switcher
    document.getElementById('hm-tile-switcher').addEventListener('click', e => {
      const btn = e.target.closest('button'); if (!btn) return;
      const style = btn.dataset.style;
      _applyTileStyle(style);
      document.querySelectorAll('#hm-tile-switcher button').forEach(b =>
        b.classList.toggle('active', b.dataset.style === style));
    });

    // Heatmap toggle
    let _heatmapVisible = false;
    document.getElementById('hm-heatmap-btn').addEventListener('click', function () {
      _heatmapVisible = !_heatmapVisible;
      this.classList.toggle('active', _heatmapVisible);
      if (_heatmapVisible) {
        _setupHeatmap(_allHazards);
        _showToast('🔴 Danger heatmap enabled — red = most dangerous zones');
      } else {
        if (_heatmapLayer) { _map.removeLayer(_heatmapLayer); _heatmapLayer = null; }
      }
    });

    // Ward layer toggle
    let _wardVisible = false;
    document.getElementById('hm-ward-btn').addEventListener('click', function () {
      _wardVisible = !_wardVisible;
      this.classList.toggle('active', _wardVisible);
      if (_wardVisible) {
        _renderWardLayer(_allHazards);
        _showToast('🏙️ Ward accountability zones — click any zone to see its worst hazard');
      } else {
        _wardLayers.forEach(l => _map.removeLayer(l)); _wardLayers = [];
      }
    });

    // Shame replay toggle
    document.getElementById('hm-replay-btn').addEventListener('click', function () {
      const panel = document.getElementById('hm-replay-panel');
      const open = panel.classList.toggle('open');
      this.classList.toggle('active', open);
      _replayActive = open;
      if (!open) { _replayDayFilter = 999; _renderHazards(_allHazards); }
    });

    // Tap-to-report toggle
    document.getElementById('hm-tap-btn').addEventListener('click', function () {
      _tapMode = !_tapMode;
      this.textContent = _tapMode ? '🔴 Cancel Report' : '📍 Tap to Report';
      this.classList.toggle('active', _tapMode);
      _map.getContainer().classList.toggle('hm-tap-cursor', _tapMode);
      if (_tapMode) _showToast('📍 Tap anywhere on the map to place a hazard report');
    });

    // Route planner toggle
    document.getElementById('hm-route-btn').addEventListener('click', function () {
      _routeMode = !_routeMode;
      _routePoints = [];
      _clearRoute();
      this.textContent = _routeMode ? '❌ Cancel Route' : '🛣️ Safe Route';
      this.classList.toggle('route-active', _routeMode);
      if (_routeMode) _showToast('🛣️ Tap your start point, then tap your destination');
    });

    // Voice toggle
    document.getElementById('hm-voice-btn').addEventListener('click', function () {
      _voiceEnabled = !_voiceEnabled;
      this.textContent = _voiceEnabled ? '🔊 Voice ON' : '🔕 Voice Alerts';
      this.classList.toggle('voice-active', _voiceEnabled);
      if (_voiceEnabled) {
        _speak('Voice alerts activated. Drive safe.');
        _showToast('🔊 Voice alerts enabled — you will hear hazard warnings');
      }
    });
  }

  // ════════════════════════════════════════════════════════════════════════
  //  HELPERS
  // ════════════════════════════════════════════════════════════════════════
  function _haversineKm(lat1, lng1, lat2, lng2) {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) ** 2 +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }

  function _showToast(msg) {
    document.querySelector('.hm-prox-toast')?.remove();
    const d = document.createElement('div');
    d.className = 'hm-prox-toast';
    d.textContent = msg;
    document.body.appendChild(d);
    setTimeout(() => d.remove(), 5100);
  }

  function _showProxToast(msg) { _showToast(msg); }

  // ════════════════════════════════════════════════════════════════════════
  //  PUBLIC API
  // ════════════════════════════════════════════════════════════════════════
  return {

    // ── init(leafletMapInstance) ── call once after L.map() ──────────────
    init(map) {
      _map = map;
      window.HazardMap = this;
      _injectStyles();

      // Apply tile (dark if OS dark mode)
      _applyTileStyle(_currentStyle);

      // Canvas renderer for performance at high hazard counts
      _canvasRenderer = L.canvas({ padding: 0.3 });

      // Setup cluster, then wire up everything
      _setupCluster(() => {
        _buildControls();
        _setupGPS();
        _setupTapToReport();
        _setupRoutePlanner();
        _setupSearch();
        _setupShameReplay();
        _setupSmartRefresh();
        console.log('[HazardMap] ✅ v2.0 initialized — all features active');
      });
    },

    // ── renderHazards(hazardsArray) ── call after API load ───────────────
    renderHazards(hazards) {
      _allHazards = hazards || [];
      _renderHazards(_allHazards);
    },

    // ── addHazardLive(hazard) ── call on Socket.io new_hazard event ──────
    addHazardLive(hazard) {
      _allHazards.unshift(hazard);
      _renderHazards(_allHazards);
      const lat = parseFloat(hazard.latitude);
      const lng = parseFloat(hazard.longitude);
      const sev = (hazard.severity || '').toLowerCase();
      if (lat && lng && (sev === 'critical' || sev === 'high')) {
        _showToast(`🚨 New ${sev} hazard reported nearby — ${hazard.hazardType || 'Hazard'}`);
        if (navigator.vibrate) navigator.vibrate([100, 50, 100, 50, 200]);
      }
    },

    // ── locateMe() ── fly to user's GPS position ─────────────────────────
    locateMe() {
      if (!_map) return;
      if (_userLat && _userLng) {
        _map.flyTo([_userLat, _userLng], 16, { animate: true, duration: 1.2 });
      } else {
        navigator.geolocation?.getCurrentPosition(pos => {
          _map.flyTo([pos.coords.latitude, pos.coords.longitude], 16, { animate: true, duration: 1.2 });
        }, () => _showToast('📍 Could not get your location'));
      }
    },

    // ── closeSheet() ── called from close button ──────────────────────────
    closeSheet() {
      document.getElementById('hm-bottom-sheet')?.classList.remove('open');
      _activeHazard = null;
    },

    // ── _openSheetById(id) ── called from popup button ───────────────────
    _openSheetById(id) {
      const h = _allHazards.find(x => x.id === id || x.id === String(id));
      if (h) _openSheet(h);
      _map.closePopup();
    },

    // ── _navigateTo() ── open Google Maps directions ─────────────────────
    _navigateTo() {
      if (!_activeHazard) return;
      const lat = parseFloat(_activeHazard.latitude || _activeHazard.location?.lat);
      const lng = parseFloat(_activeHazard.longitude || _activeHazard.location?.lng);
      if (!lat || isNaN(lat)) { _showToast('No location data'); return; }
      const origin = _userLat ? `${_userLat},${_userLng}` : '';
      window.open(
        `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${lat},${lng}&travelmode=driving`,
        '_blank'
      );
    },

    // ── _shareHazard() ── Web Share API ──────────────────────────────────
    _shareHazard() {
      if (!_activeHazard) return;
      const text = `⚠️ ${_activeHazard.hazardType || 'Hazard'} (${_activeHazard.severity}) reported in Hyderabad. GHMC action pending ${Math.floor((Date.now() - new Date(_activeHazard.createdAt || Date.now())) / 86400000)} days. — HazardAlert`;
      if (navigator.share) {
        navigator.share({ title: 'HazardAlert', text, url: window.location.href }).catch(() => { });
      } else {
        navigator.clipboard?.writeText(text);
        _showToast('📋 Hazard details copied to clipboard');
      }
    },

    // ── _verifyHazard(id, type) ── confirm/dispute from sheet ────────────
    async _verifyHazard(id, responseType) {
      const uid = window.AppData?.currentUser?.id;
      if (!uid) { _showToast('Please log in to verify hazards'); return; }
      try {
        await fetch(`${window.API_BASE || 'http://localhost:5000'}/api/hazards/${id}/verify`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: uid, responseType })
        });
        _showToast(responseType === 'confirm' ? '👍 Hazard confirmed — your report helps the community' : '👎 Dispute recorded — thank you for keeping data accurate');
      } catch { _showToast('Network error — try again'); }
    },

    // ── confirmTapReport(lat, lng, address) ── from tap popup ────────────
    confirmTapReport(lat, lng, address) {
      _map.closePopup();
      _tapMode = false;
      const btn = document.getElementById('hm-tap-btn');
      if (btn) { btn.textContent = '📍 Tap to Report'; btn.classList.remove('active'); }
      _map.getContainer().classList.remove('hm-tap-cursor');
      if (_tapMarker) { _map.removeLayer(_tapMarker); _tapMarker = null; }
      // Pass location to report form
      if (window.AppState) AppState.reportForm.data.location = { lat, lng, address };
      const locEl = document.getElementById('report-location');
      if (locEl) locEl.value = address;
      if (window.UI) UI.openReportModal?.();
    },

    // ── cancelTap() ── from tap popup cancel ─────────────────────────────
    cancelTap() {
      _map.closePopup();
      if (_tapMarker) { _map.removeLayer(_tapMarker); _tapMarker = null; }
    },

    // ── _clearRoute() ── clear route planner ─────────────────────────────
    _clearRoute() { _clearRoute(); },

    // ── _stopReplay() ── close shame replay ───────────────────────────────
    _stopReplay() {
      _replayActive = false;
      _replayDayFilter = 999;
      document.getElementById('hm-replay-panel')?.classList.remove('open');
      document.getElementById('hm-replay-btn')?.classList.remove('active');
      _renderHazards(_allHazards);
    },

    // ── destroy() ── clean up on SPA route change ─────────────────────────
    destroy() {
      if (_watchId) navigator.geolocation.clearWatch(_watchId);
      if (_speechSynth) _speechSynth.cancel();
      clearTimeout(_searchTimeout);
      clearTimeout(_refreshTimer);
    }
  };

})();

window.HazardMap = HazardMap;