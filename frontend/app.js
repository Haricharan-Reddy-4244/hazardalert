// HazardAlert - Full-Stack Road Safety Reporting Application
// Connected to Localhost Express API

// ===============================
// APPLICATION DATA & STATE
// ===============================

const AppData = {
  // User authentication state
  currentUser: null,
  isAuthenticated: false,

  // Local caching arrays
  hazards: [],
  users: [],
  notifications: [
    {
      id: 1,
      userId: 1,
      type: "system_welcome",
      title: "Welcome to HazardAlert!",
      message: "Help us keep the community safe by reporting hazards.",
      timestamp: new Date(),
      read: false,
      data: {}
    }
  ]
};

// Application State
const AppState = {
  currentView: 'map',
  filteredHazards: [],
  userVotes: {},
  reportForm: { currentStep: 1, data: {} },
  connectionStatus: 'connecting',
  notifications: { unreadCount: 1, panelOpen: false },
  websocket: null,
  charts: {},
  pagination: { currentPage: 1, itemsPerPage: 10, totalPages: 1 },
  isOnline: navigator.onLine,

  // LEAFLET CONFIG
  leafletMap: null,
  leafletMarkers: [],
  mapCentered: false // Tracks if we've focused on user location yet
};

// ===============================
// BACKEND API SERVICE
// ===============================

// Auto-detect backend URL: production uses same origin, local dev uses localhost:5000
const API_BASE_URL = (
  window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? 'http://localhost:5000/api'
    : `${window.location.origin}/api`
);
window.API_BASE = API_BASE_URL.replace('/api', ''); // expose for other scripts
window.AppData = AppData; // expose for ProfilePanel


class HazardAPI {
  // Authentication endpoints
  static async authenticate(credentials) {
    try {
      const res = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials)
      });
      const data = await res.json();

      if (res.ok && data.success) {
        // Map backend user to frontend expectations
        AppData.currentUser = {
          id: data.user.id,
          username: data.user.name,
          email: data.user.email,
          role: data.user.role,
          trustScore: 85, // Defaults (can be added to backend later)
          reportsSubmitted: 0,
          upvotesGiven: 0,
          upvotesReceived: 0,
          accuracyRate: 100,
          responseTime: 5,
          badges: ['Active Reporter'],
          isOnline: true
        };
        AppData.isAuthenticated = true;

        const token = btoa(JSON.stringify({ userId: data.user.id, exp: Date.now() + 86400000 }));
        localStorage.setItem('hazard_token', token);
        return { success: true, user: AppData.currentUser };
      }
      return { success: false, error: data.message || 'Login failed' };
    } catch (err) {
      console.error('Login error:', err);
      return { success: false, error: 'Network error during login' };
    }
  }

  static async register(userData) {
    try {
      const res = await fetch(`${API_BASE_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: userData.username,
          email: userData.email,
          password: userData.password,
          phone: null
        })
      });
      const data = await res.json();

      if (res.ok && data.success) {
        AppData.currentUser = {
          id: data.user.id,
          username: data.user.name,
          email: data.user.email,
          role: data.user.role,
          trustScore: 75,
          reportsSubmitted: 0,
          upvotesGiven: 0,
          upvotesReceived: 0,
          accuracyRate: 0,
          responseTime: 0,
          badges: ['Newcomer'],
          isOnline: true
        };
        AppData.isAuthenticated = true;

        const token = btoa(JSON.stringify({ userId: data.user.id, exp: Date.now() + 86400000 }));
        localStorage.setItem('hazard_token', token);
        return { success: true, user: AppData.currentUser };
      }
      return { success: false, error: data.message || 'Registration failed' };
    } catch (err) {
      console.error('Registration error:', err);
      return { success: false, error: 'Network error during registration' };
    }
  }

  static async logout() {
    AppData.currentUser = null;
    AppData.isAuthenticated = false;
    localStorage.removeItem('hazard_token');
    return { success: true };
  }

  // Hazard endpoints
  static async getHazards(filters = {}) {
    try {
      const params = new URLSearchParams();
      if (filters.type) params.append('type', filters.type);
      if (filters.severity) params.append('severity', filters.severity.toLowerCase());
      if (filters.status) params.append('status', filters.status.toLowerCase());
      if (filters.search) params.append('search', filters.search);
      if (filters.sort) params.append('sort', filters.sort);
      // Always limit to 50 on initial load to avoid blocking the UI thread
      params.append('limit', filters.limit || 50);
      if (filters.page) params.append('page', filters.page);

      const res = await fetch(`${API_BASE_URL}/hazards?${params.toString()}`);
      if (!res.ok) throw new Error('Failed to fetch from backend');

      const data = await res.json();
      return { success: true, hazards: data.hazards || [], total: data.count || 0 };
    } catch (err) {
      console.error('Fetch hazards error:', err);
      return { success: false, error: 'Failed to fetch hazards' };
    }
  }

  static async createHazard(hazardData) {
    if (!AppData.isAuthenticated) return { success: false, error: 'Authentication required' };

    try {
      const res = await fetch(`${API_BASE_URL}/hazards`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: AppData.currentUser.id,
          hazardType: hazardData.type,
          severity: hazardData.severity.toLowerCase(), // Backend expects lowercase
          latitude: hazardData.location.lat,
          longitude: hazardData.location.lng,
          description: hazardData.description,
          imageUrl: null
        })
      });
      const data = await res.json();

      if (res.ok && data.success) {
        // Mock the user data onto the response so UI updates instantly
        data.report.reporter = AppData.currentUser.name || AppData.currentUser.username || 'Anonymous';
        data.report.createdAt = new Date().toISOString();
        return { success: true, hazard: data.report };
      }
      return { success: false, error: data.message || 'Failed to submit' };
    } catch (err) {
      console.error('Submit hazard error:', err);
      return { success: false, error: 'Network error submitting hazard' };
    }
  }

  static async updateHazardStatus(hazardId, status) {
    if (!AppData.isAuthenticated || AppData.currentUser.role !== 'admin') {
      return { success: false, error: 'Admin access required' };
    }
    try {
      const res = await fetch(`${API_BASE_URL}/hazards/${hazardId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: status.toLowerCase() }) // admin actions
      });
      const data = await res.json();
      if (res.ok && data.success) {
        return { success: true, status: data.status };
      }
      return { success: false, error: data.message };
    } catch (err) {
      return { success: false, error: 'Network error updating status' };
    }
  }

  // Kept locally tracked because backend doesn't have an upvotes table yet
  static async voteHazard(hazardId, voteType) {
    if (!AppData.isAuthenticated) return { success: false, error: 'Authentication required' };

    const hazard = AppData.hazards.find(h => h.id === hazardId);
    if (!hazard) return { success: false, error: 'Hazard not found' };

    const userId = AppData.currentUser.id;
    const existingVote = hazard.votes.find(v => v.userId === userId);

    if (existingVote) {
      if (existingVote.type === 'up') hazard.upvotes--;
      else hazard.downvotes--;
      hazard.votes = hazard.votes.filter(v => v.userId !== userId);
    }

    if (!existingVote || existingVote.type !== voteType) {
      if (voteType === 'up') hazard.upvotes++;
      else hazard.downvotes++;
      hazard.votes.push({ userId, type: voteType });
    }

    hazard.trustScore = Math.min(1, Math.max(0, hazard.upvotes / (hazard.upvotes + hazard.downvotes + 1)));
    return { success: true, hazard };
  }

  // Statistics mock generated from fetched data
  static async getStatistics() {
    const stats = {
      totalReports: AppData.hazards.length,
      reportsByType: {},
      reportsBySeverity: {},
      reportsByStatus: {}
    };

    AppData.hazards.forEach(hazard => {
      stats.reportsByType[hazard.type] = (stats.reportsByType[hazard.type] || 0) + 1;
      stats.reportsBySeverity[hazard.severity] = (stats.reportsBySeverity[hazard.severity] || 0) + 1;
      stats.reportsByStatus[hazard.status] = (stats.reportsByStatus[hazard.status] || 0) + 1;
    });
    return { success: true, stats };
  }

  static async getNotifications(userId) {
    const notifications = AppData.notifications.filter(n => n.userId === userId);
    return { success: true, notifications, unreadCount: notifications.filter(n => !n.read).length };
  }
  static async markNotificationRead(notificationId) {
    const notification = AppData.notifications.find(n => n.id === notificationId);
    if (notification) notification.read = true;
    return { success: true };
  }
}

// ===============================
// USER INTERFACE MANAGER
// ===============================

class UI {
  static async initialize() {
    console.log('🚀 Initializing HazardAlert application...');

    await this.waitForDOM();
    await this.checkAuthState();
    await this.loadInitialData();
    this.setupEventListeners();
    this.setupPWA();

    AppState.connectionStatus = 'online';
    this.updateConnectionStatus();

    this.switchView('map');
    
    // STRICT LOGIN GATE
    if (!AppData.isAuthenticated) {
      this.showAuthModal();
      document.body.style.overflow = 'hidden'; // Stop scrolling behind the modal
    }
    
    console.log('✅ Application initialized successfully');
  }

  static waitForDOM() {
    return new Promise(resolve => {
      if (document.readyState === 'complete') {
        resolve();
      } else {
        window.addEventListener('load', resolve);
      }
    });
  }

  static async checkAuthState() {
    const token = localStorage.getItem('hazard_token');
    if (token) {
      try {
        const tokenData = JSON.parse(atob(token));
        if (tokenData.exp > Date.now()) {
          // If a token exists, we just mock the currentUser for the session
          // In a production app, you'd hit a '/api/auth/me' endpoint here to verify
          AppData.currentUser = {
            id: tokenData.userId,
            username: 'User_' + tokenData.userId,
            email: 'user@example.com',
            role: 'citizen',
            trustScore: 85,
            badges: [],
            isOnline: true
          };
          AppData.isAuthenticated = true;
          this.updateUserInterface();
          // Start proximity engine for authenticated user
          setTimeout(() => ProximityAlertEngine.init(), 1500);
        } else {
          localStorage.removeItem('hazard_token');
        }
      } catch (error) {
        localStorage.removeItem('hazard_token');
      }
    }
  }

  static mapBackendHazardToFrontend(h) {
    // Explicitly parse floats to ensure Leaflet reads valid exact coordinates
    const lat = parseFloat(h.latitude);
    const lng = parseFloat(h.longitude);

    return {
      id: h.id,
      type: h.hazardType || h.type || 'Other',
      latitude: parseFloat(h.latitude || h.location?.lat || 0),
      longitude: parseFloat(h.longitude || h.location?.lng || 0),
      severity: (h.severity || 'Medium').charAt(0).toUpperCase() + (h.severity || 'medium').slice(1),
      location: {
        lat: isNaN(lat) ? 0 : lat,
        lng: isNaN(lng) ? 0 : lng,
        address: h.address || `Lat: ${(isNaN(lat) ? 0 : lat).toFixed(6)}, Lng: ${(isNaN(lng) ? 0 : lng).toFixed(6)}`
      },
      description: h.description || '',
      reporter: h.reporter || 'Anonymous',
      reporterId: h.userId || h.user_id,
      timestamp: h.createdAt || new Date().toISOString(),
      upvotes: h.upvotes || 0, // DB lacks votes, mock them to 0
      downvotes: h.downvotes || 0,
      status: (h.status || 'Pending').charAt(0).toUpperCase() + (h.status || 'pending').slice(1),
      trustScore: h.trustScore || 0.85,
      votes: h.votes || [],
      urgent: (h.severity || '').toLowerCase() === 'critical',
      anonymous: false
    };
  }

  static async loadInitialData() {
    try {
      const result = await HazardAPI.getHazards();

      if (result.success) {
        // Map backend fields to UI shape exactly
        const mappedHazards = result.hazards.map(this.mapBackendHazardToFrontend);

        AppState.filteredHazards = mappedHazards;
        AppData.hazards = [...mappedHazards]; // Sync local memory

        AppState.pagination.currentPage = 1;
        AppState.pagination.itemsPerPage = 10;
        AppState.pagination.totalPages = Math.max(
          1,
          Math.ceil(AppState.filteredHazards.length / AppState.pagination.itemsPerPage)
        );
      } else {
        this.showToast('Failed to connect to backend DB.', 'error');
      }

      if (AppData.isAuthenticated) {
        const notificationResult = await HazardAPI.getNotifications(AppData.currentUser.id);
        if (notificationResult.success) {
          AppData.notifications = notificationResult.notifications;
          AppState.notifications.unreadCount = notificationResult.unreadCount;
          this.updateNotificationBadge();
        }
      }

      const statsResult = await HazardAPI.getStatistics();
      if (statsResult.success) {
        this.updateStatistics(statsResult.stats);
      }
    } catch (error) {
      console.error('Error loading data:', error);
      this.showToast('Error loading data', 'error');
    }
  }

  static setupEventListeners() {
    console.log('Setting up event listeners...');
    this.setupNavigationListeners();
    this.setupAuthListeners();
    this.setupReportModalListeners();
    this.setupFilterListeners();
    this.setupAdminListeners();
    this.setupNotificationListeners();
    this.setupGlobalListeners();
    this.setupLayerToggles();
    // Wire AI scan buttons (modal internals wired in AIDetectionModule._wireEvents())
    document.getElementById('fab-ai-scan')?.addEventListener('click', () => AIDetectionModule.open());
    document.getElementById('ai-scan-btn')?.addEventListener('click', () => AIDetectionModule.open());
    document.getElementById('ai-camera-close')?.addEventListener('click', () => AIDetectionModule.close());

    console.log('Event listeners setup complete');
  }

  static setupNavigationListeners() {
    const navButtons = [
      ...document.querySelectorAll('.nav-btn[data-view]'),
      ...document.querySelectorAll('.bottom-nav-btn[data-view]'),
      ...document.querySelectorAll('.mobile-nav-btn[data-view]')
    ];

    navButtons.forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        const view = btn.getAttribute('data-view');
        this.switchView(view);
      });
    });

    const profileNavBtn = document.getElementById('profile-nav-btn');
    if (profileNavBtn) {
      profileNavBtn.addEventListener('click', (e) => {
        e.preventDefault();
        if(window.ProfileSettings){const uid2 = AppData.currentUser?.id; if(uid2 && window.ProfilePanel){ProfilePanel.open(uid2);}}
      });
    }

    const hamburger = document.getElementById('hamburger-btn');
    const mobileMenu = document.getElementById('mobile-menu');

    if (hamburger && mobileMenu) {
      hamburger.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        hamburger.classList.toggle('active');
        mobileMenu.classList.toggle('hidden');
      });
    }

    const userAvatar = document.getElementById('user-avatar');
    const userDropdown = document.getElementById('user-dropdown');

    if (userAvatar && userDropdown) {
      userAvatar.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        userDropdown.classList.toggle('hidden');
      });

      document.getElementById('profile-link')?.addEventListener('click', (e) => {
        e.preventDefault();
        if(window.ProfilePanel) { window.ProfilePanel.open(); } else { this.switchView('profile'); }
        userDropdown.classList.add('hidden');
      });

      document.getElementById('logout-link')?.addEventListener('click', (e) => {
        e.preventDefault();
        this.handleLogout();
        userDropdown.classList.add('hidden');
      });

      // Open settings modal
      document.getElementById('settings-link')?.addEventListener('click', (e) => {
        e.preventDefault();
        userDropdown.classList.add('hidden');
        document.getElementById('settings-modal')?.classList.remove('hidden');
      });
      document.getElementById('settings-modal-close')?.addEventListener('click', () => {
        document.getElementById('settings-modal')?.classList.add('hidden');
      });
    }

    // Grid / List toggle in List View
    document.getElementById('grid-toggle')?.addEventListener('click', () => {
      const list = document.getElementById('hazard-list');
      if (list) {
        list.classList.add('grid-view');
        list.classList.remove('list-view');
      }
      document.getElementById('grid-toggle')?.classList.add('active');
      document.getElementById('list-toggle')?.classList.remove('active');
    });
    document.getElementById('list-toggle')?.addEventListener('click', () => {
      const list = document.getElementById('hazard-list');
      if (list) {
        list.classList.remove('grid-view');
        list.classList.add('list-view');
      }
      document.getElementById('list-toggle')?.classList.add('active');
      document.getElementById('grid-toggle')?.classList.remove('active');
    });

    // Mobile menu buttons
    document.getElementById('mobile-logout-btn')?.addEventListener('click', () => {
      this.handleLogout();
      document.getElementById('mobile-menu')?.classList.add('hidden');
    });
    document.getElementById('mobile-profile-btn')?.addEventListener('click', () => {
      document.getElementById('mobile-menu')?.classList.add('hidden');
      if (window.ProfilePanel) ProfilePanel.open();
    });
    document.getElementById('mobile-settings-btn')?.addEventListener('click', () => {
      document.getElementById('mobile-menu')?.classList.add('hidden');
      UI.showToast('⚙️ Settings — coming soon!', 'info');
    });

    document.addEventListener('click', (e) => {
      if (userDropdown && !userAvatar.contains(e.target) && !userDropdown.contains(e.target)) {
        userDropdown.classList.add('hidden');
      }
      if (mobileMenu && !hamburger.contains(e.target) && !mobileMenu.contains(e.target)) {
        hamburger.classList.remove('active');
        mobileMenu.classList.add('hidden');
      }
    });
  }

  static setupAuthListeners() {
    const authModal = document.getElementById('auth-modal');
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');

    document.getElementById('show-register')?.addEventListener('click', (e) => {
      e.preventDefault();
      loginForm?.classList.add('hidden');
      registerForm?.classList.remove('hidden');
      document.getElementById('auth-modal-title').textContent = 'Sign Up';
    });

    document.getElementById('show-login')?.addEventListener('click', (e) => {
      e.preventDefault();
      registerForm?.classList.add('hidden');
      loginForm?.classList.remove('hidden');
      document.getElementById('auth-modal-title').textContent = 'Sign In';
    });

    document.getElementById('login-submit')?.addEventListener('click', this.handleLogin.bind(this));
    document.getElementById('register-submit')?.addEventListener('click', this.handleRegister.bind(this));

    document.getElementById('auth-modal-close')?.addEventListener('click', () => {
      authModal?.classList.add('hidden');
    });

    if (authModal) {
      authModal.addEventListener('click', (e) => {
        if (e.target === authModal) authModal.classList.add('hidden');
      });
    }
  }

  static setupReportModalListeners() {
    const fab = document.getElementById('fab-report');
    const modal = document.getElementById('report-modal');
    const form = document.getElementById('report-form');

    if (fab) {
      fab.addEventListener('click', (e) => {
        e.preventDefault();
        if (!AppData.isAuthenticated) {
          this.showAuthModal();
          return;
        }
        this.openReportModal();
      });
    }

    const closeElements = [
      document.getElementById('report-modal-close'),
      document.getElementById('cancel-report')
    ];

    closeElements.forEach(element => {
      element?.addEventListener('click', (e) => {
        e.preventDefault();
        this.closeReportModal();
      });
    });

    if (modal) {
      modal.addEventListener('click', (e) => {
        if (e.target === modal) this.closeReportModal();
      });
    }

    document.getElementById('next-step')?.addEventListener('click', () => this.nextReportStep());
    document.getElementById('prev-step')?.addEventListener('click', () => this.prevReportStep());
    form?.addEventListener('submit', this.handleReportSubmission.bind(this));

    // ATTACH THE EVENT LISTENER HERE - User must manually trigger it
    document.getElementById('use-current-location')?.addEventListener('click', () => {
      this.getCurrentLocation();
    });

    // FETCH COORDINATES AUTOMATICALLY WHEN TYPING MANUAL ADDRESS
    document.getElementById('manual-location')?.addEventListener('change', async (e) => {
      const address = e.target.value.trim();
      const mapIframe = document.getElementById('map-preview-iframe');
      const mapPlaceholder = document.getElementById('map-preview-placeholder');

      if (address && mapIframe && mapPlaceholder) {
        // Geocode the address to real coordinates instantly so it saves correctly
        try {
          const url = `https://us1.locationiq.com/v1/search.php?key=pk.a9cb83a96ca56697515f106c4a77e823&q=${encodeURIComponent(address)}&format=json&limit=1`;
          const res = await fetch(url);
          if (res.ok) {
            const data = await res.json();
            if (data && data.length > 0) {
              const lat = parseFloat(data[0].lat);
              const lng = parseFloat(data[0].lon);

              AppState.reportForm.data.location = {
                lat: lat,
                lng: lng,
                address: address
              };

              // Update iframe with the exact mapped coordinates
              mapIframe.src = `https://maps.google.com/maps?q=${lat},${lng}&t=&z=16&ie=UTF8&iwloc=&output=embed`;
              mapIframe.style.display = 'block';
              mapPlaceholder.style.display = 'none';
            }
          }
        } catch (err) {
          console.error('Failed to geocode manual address');
        }
      } else if (!address && mapIframe && mapPlaceholder) {
        mapIframe.style.display = 'none';
        mapPlaceholder.style.display = 'flex';
      }
    });

    document.querySelectorAll('.hazard-type-option').forEach(option => {
      option.addEventListener('click', () => {
        document.querySelectorAll('.hazard-type-option').forEach(o => o.classList.remove('selected'));
        option.classList.add('selected');
        document.getElementById('report-type').value = option.getAttribute('data-type');
      });
    });

    document.querySelectorAll('.severity-option').forEach(option => {
      option.addEventListener('click', () => {
        document.querySelectorAll('.severity-option').forEach(o => o.classList.remove('selected'));
        option.classList.add('selected');
        document.getElementById('report-severity').value = option.getAttribute('data-severity');
      });
    });
  }

  static setupFilterListeners() {
    const typeFilter = document.getElementById('type-filter');
    const severityFilter = document.getElementById('severity-filter');
    const statusFilter = document.getElementById('status-filter');
    const locationSearch = document.getElementById('location-search');
    const sortSelect = document.getElementById('sort-select');

    if (typeFilter) typeFilter.addEventListener('change', this.applyFilters.bind(this));
    if (severityFilter) severityFilter.addEventListener('change', this.applyFilters.bind(this));
    if (statusFilter) statusFilter.addEventListener('change', this.applyFilters.bind(this));
    if (sortSelect) sortSelect.addEventListener('change', this.applyFilters.bind(this));
    if (locationSearch) locationSearch.addEventListener('input', this.debounce(this.applyFilters.bind(this), 300));

    const globalSearch = document.getElementById('global-search');
    if (globalSearch) globalSearch.addEventListener('input', this.debounce(this.handleGlobalSearch.bind(this), 500));

    document.getElementById('clear-filters')?.addEventListener('click', this.clearFilters.bind(this));
    document.getElementById('refresh-map')?.addEventListener('click', this.refreshData.bind(this));
    document.getElementById('refresh-stats')?.addEventListener('click', this.refreshStats.bind(this));
  }

  static setupAdminListeners() {
    document.getElementById('export-csv')?.addEventListener('click', this.exportToCSV.bind(this));
    document.getElementById('bulk-approve')?.addEventListener('click', this.bulkApprove.bind(this));
    document.getElementById('auto-verify')?.addEventListener('click', this.autoVerify.bind(this));

    // Select-all toggle for admin table
    document.getElementById('select-all-reports')?.addEventListener('change', (e) => {
      document.querySelectorAll('#admin-reports-tbody .admin-row-cb').forEach(cb => {
        cb.checked = e.target.checked;
        const row = cb.closest('tr');
        if (row) row.classList.toggle('row-selected', cb.checked);
      });
    });

    // Admin table filters
    ['admin-type-filter', 'admin-status-filter', 'admin-severity-filter'].forEach(id => {
      document.getElementById(id)?.addEventListener('change', (e) => {
        const key = id.replace('admin-', '').replace('-filter', '');
        UI._adminFilters[key] = e.target.value;
        UI.renderAdminTable();
      });
    });

    // User search (debounced)
    document.getElementById('user-search')?.addEventListener('input',
      this.debounce(() => UI.renderUserManagement(), 300)
    );
  }


  static setupNotificationListeners() {
    const bell = document.getElementById('notification-bell');
    const panel = document.getElementById('notification-panel');

    if (bell && panel) {
      bell.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        panel.classList.toggle('hidden');
        AppState.notifications.panelOpen = !panel.classList.contains('hidden');
        if (AppState.notifications.panelOpen) this.renderNotifications();
      });
    }

    document.getElementById('mark-all-read')?.addEventListener('click', () => this.markAllNotificationsRead());

    document.addEventListener('click', (e) => {
      if (panel && AppState.notifications.panelOpen && !bell.contains(e.target) && !panel.contains(e.target)) {
        panel.classList.add('hidden');
        AppState.notifications.panelOpen = false;
      }
    });
  }

  static setupGlobalListeners() {
    window.addEventListener('online', () => {
      AppState.isOnline = true;
      AppState.connectionStatus = 'online';
      this.updateConnectionStatus();
      this.showToast('Back online', 'success');
    });

    window.addEventListener('offline', () => {
      AppState.isOnline = false;
      AppState.connectionStatus = 'offline';
      this.updateConnectionStatus();
      this.showToast('You are offline', 'warning');
    });

    document.addEventListener('keydown', (e) => {
      if (e.ctrlKey || e.metaKey) {
        switch (e.key) {
          case 'n': e.preventDefault(); if (AppData.isAuthenticated) this.openReportModal(); break;
          case 'f': e.preventDefault(); document.getElementById('global-search')?.focus(); break;
        }
      }
      if (e.key === 'Escape') {
        this.closeAllModals();
        const hazardModal = document.getElementById('hazard-modal');
        if (hazardModal) hazardModal.classList.add('hidden');
      }
    });

    const hazardModal = document.getElementById('hazard-modal');
    const closeIcon = document.getElementById('hazard-modal-close');
    const closeFooterBtn = document.getElementById('hazard-modal-close-btn');

    const closeHazardModal = () => { if (hazardModal) hazardModal.classList.add('hidden'); };

    if (closeIcon) closeIcon.addEventListener('click', e => { e.preventDefault(); closeHazardModal(); });
    if (closeFooterBtn) closeFooterBtn.addEventListener('click', e => { e.preventDefault(); closeHazardModal(); });
    if (hazardModal) hazardModal.addEventListener('click', e => { if (e.target === hazardModal) closeHazardModal(); });

    const shareBtn = document.getElementById('share-hazard');
    const directionsBtn = document.getElementById('get-directions');

    if (shareBtn) {
      shareBtn.addEventListener('click', async e => {
        e.preventDefault();
        const url = window.location.href;
        if (navigator.share) {
          try { await navigator.share({ title: 'HazardAlert', url }); } catch (err) { }
        } else if (navigator.clipboard) {
          await navigator.clipboard.writeText(url);
          UI.showToast('Link copied to clipboard', 'info');
        } else {
          alert('Share is not supported in this browser');
        }
      });
    }

    if (directionsBtn) {
      directionsBtn.addEventListener('click', e => {
        e.preventDefault();
        const h = UI._lastSelectedHazard;
        // Verify we have valid coordinates before opening maps
        if (!h || !h.location || h.location.lat == null || h.location.lng == null || (h.location.lat === 0 && h.location.lng === 0)) {
          UI.showToast('No exact location available for directions', 'warning');
          return;
        }
        // This URL format guarantees an exact pin drop on Google Maps
        const gmapsUrl = `https://www.google.com/maps/search/?api=1&query=${h.location.lat},${h.location.lng}`;
        window.open(gmapsUrl, '_blank');
      });
    }
  }

  static switchView(viewName) {
    document.querySelectorAll('.view').forEach(view => view.classList.remove('active'));
    const targetView = document.getElementById(`${viewName}-view`);
    if (targetView) {
      targetView.classList.add('active');
      AppState.currentView = viewName;
    } else {
      console.error('View not found:', `${viewName}-view`);
      return;
    }

    document.querySelectorAll('[data-view]').forEach(btn => {
      btn.classList.remove('active');
      if (btn.getAttribute('data-view') === viewName) btn.classList.add('active');
    });

    const mobileMenu = document.getElementById('mobile-menu');
    const hamburger = document.getElementById('hamburger-btn');
    if (mobileMenu && hamburger) {
      mobileMenu.classList.add('hidden');
      hamburger.classList.remove('active');
    }
    this.loadViewData(viewName);
  }

  static async loadViewData(viewName) {
    switch (viewName) {
      case 'map': this.renderMapView(); break;
      case 'list': this.renderListView(); break;
      case 'admin':
        if (AppData.isAuthenticated && AppData.currentUser.role === 'admin') {
          this.renderAdminView();
          this.renderCharts();
        } else if (AppData.isAuthenticated) {
          this.showToast('Admin access required', 'error');
          this.switchView('map');
        } else {
          this.showAuthModal();
        }
        break;
      case 'profile':
        if (AppData.isAuthenticated) this.renderProfileView();
        else this.showAuthModal();
        break;
    }
  }

  static renderMapView() {
    const mapEl = document.getElementById('map');
    if (!mapEl) return;
    if (typeof L === 'undefined') {
      setTimeout(() => this.renderMapView(), 1000);
      return;
    }

    if (!AppState.leafletMap) {
      AppState.leafletMap = L.map('map').setView([17.3850, 78.4867], 12);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
      }).addTo(AppState.leafletMap);

      // ── Activate HazardMap v2.0 (mapp.js) ──────────────────────────────
      // HazardMap.init() takes over tile management, GPS, clustering, heatmap,
      // voice alerts, ward layers, safe-route planner, tap-to-report, etc.
      if (window.HazardMap) {
        HazardMap.init(AppState.leafletMap);
        // Render hazards through HazardMap engine (clustering + popups)
        HazardMap.renderHazards(AppState.filteredHazards);
      }
    } else if (window.HazardMap) {
      // Re-render when hazards update (e.g. after filter change)
      HazardMap.renderHazards(AppState.filteredHazards);
    }

    const map = AppState.leafletMap;

    // Clear previous layers
    AppState.leafletMarkers?.forEach(m => map.removeLayer(m));
    AppState.leafletMarkers = [];
    AppState.dangerZoneLayers?.forEach(l => map.removeLayer(l));
    AppState.dangerZoneLayers = [];
    AppState.heatmapLayers?.forEach(l => map.removeLayer(l));
    AppState.heatmapLayers = [];

    const showMarkers = document.getElementById('toggle-markers')?.checked !== false;
    const showDangerZones = document.getElementById('toggle-danger-zones')?.checked;
    const showHeatmap = document.getElementById('toggle-heatmap')?.checked;

    const severityColors = { 'critical': '#ef4444', 'high': '#f97316', 'medium': '#eab308', 'low': '#10b981' };
    const bounds = [];

    AppState.filteredHazards.forEach(hazard => {
      const lat = parseFloat(hazard.latitude || hazard.location?.lat);
      const lng = parseFloat(hazard.longitude || hazard.location?.lng);
      if (!lat || !lng || (lat === 0 && lng === 0) || isNaN(lat) || isNaN(lng)) return;

      const sev = (hazard.severity || 'medium').toLowerCase();
      const color = severityColors[sev] || '#6b7280';

      if (showMarkers) {
        const iconHtml = `
          <div style="position:relative;width:36px;height:36px;display:flex;align-items:center;justify-content:center;">
            <svg viewBox="0 0 24 24" width="36" height="36" style="position:absolute;top:0;left:0;filter:drop-shadow(0px 4px 4px rgba(0,0,0,0.4));">
              <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" fill="${color}" stroke="white" stroke-width="2"/>
            </svg>
            <span style="position:relative;z-index:1;font-size:14px;margin-bottom:8px;">${this.getHazardIcon(hazard.type)}</span>
          </div>`;
        const icon = L.divIcon({ html: iconHtml, className: '', iconSize: [36, 36], iconAnchor: [18, 36], popupAnchor: [0, -36] });
        const marker = L.marker([lat, lng], { icon }).addTo(map);
        bounds.push([lat, lng]);
        marker.on('click', () => { this.showHazardDetails(hazard); this.highlightListCard(hazard.id); });
        marker.bindPopup(`<div style="min-width:200px;"><strong style="color:${color};">${hazard.type}</strong><br><span style="color:#ef4444;font-weight:bold;">${hazard.severity}</span><br><em>${this.getTimeAgo(new Date(hazard.timestamp))}</em></div>`);
        AppState.leafletMarkers.push(marker);
      }

      // Danger Zone circles
      if (showDangerZones) {
        const radiusM = HazardRadiusLayer.getRadius(hazard.type);
        const circle = L.circle([lat, lng], {
          radius: radiusM,
          color: color,
          fillColor: color,
          fillOpacity: 0.13,
          weight: 2,
          dashArray: '6 4'
        }).addTo(map);
        circle.bindTooltip(`⚠️ ${hazard.type} danger zone: ${radiusM}m radius`, { sticky: true });
        AppState.dangerZoneLayers = AppState.dangerZoneLayers || [];
        AppState.dangerZoneLayers.push(circle);
      }
    });

    // Risk heatmap
    if (showHeatmap) {
      RiskZoneEngine.renderHeatmap(map, AppState.filteredHazards);
    }

    // Update stats
    const totalEl = document.getElementById('map-total-hazards');
    const criticalEl = document.getElementById('map-critical-count');
    const highRiskEl = document.getElementById('map-high-risk-count');
    const verifiedEl = document.getElementById('map-verified-count');
    if (totalEl) totalEl.textContent = AppState.filteredHazards.length;
    if (criticalEl) criticalEl.textContent = AppState.filteredHazards.filter(h => (h.severity || '').toLowerCase() === 'critical').length;
    if (highRiskEl) highRiskEl.textContent = AppState.filteredHazards.filter(h => ['accident'].includes((h.type || '').toLowerCase())).length;
    if (verifiedEl) verifiedEl.textContent = AppState.filteredHazards.filter(h => (h.status || '').toLowerCase() === 'verified').length;

    // Auto-center: ALWAYS stay in Hyderabad — only fitBounds if markers are near Hyderabad
    const HYD_LAT = 17.3850, HYD_LNG = 78.4867;
    if (!AppState.mapCentered) {
      // Filter bounds to only Hyderabad-area markers (within ~100km)
      const hydBounds = bounds.filter(([lat, lng]) => {
        const dLat = Math.abs(lat - HYD_LAT);
        const dLng = Math.abs(lng - HYD_LNG);
        return dLat < 1.0 && dLng < 1.0; // ~100km box around Hyderabad
      });

      if (hydBounds.length > 0) {
        map.fitBounds(hydBounds, { padding: [60, 60], maxZoom: 14 });
      } else {
        // No Hyderabad markers yet — show full Hyderabad city view
        map.setView([HYD_LAT, HYD_LNG], 13);
      }
      AppState.mapCentered = true;
    }
  }


  static highlightListCard(hazardId) {
    document.querySelectorAll('.hazard-card').forEach(card => card.classList.remove('highlighted'));
    const card = document.querySelector(`[data-hazard-id="${hazardId}"]`);
    if (card) {
      card.classList.add('highlighted');
      card.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }

  static renderListView() {
    const hazardList = document.getElementById('hazard-list');
    if (!hazardList) return;

    hazardList.innerHTML = '';
    const { currentPage, itemsPerPage } = AppState.pagination;
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginatedHazards = AppState.filteredHazards.slice(startIndex, endIndex);

    AppState.pagination.totalPages = Math.max(1, Math.ceil(AppState.filteredHazards.length / AppState.pagination.itemsPerPage));

    paginatedHazards.forEach(hazard => {
      const card = this.createHazardCard(hazard);
      hazardList.appendChild(card);
    });

    this.updatePagination();

    const resultsElement = document.getElementById('results-count');
    if (resultsElement) resultsElement.textContent = AppState.filteredHazards.length;
  }

  static createHazardCard(hazard) {
    const card = document.createElement('div');
    const severity = (hazard.severity || 'Unknown').toLowerCase();
    const type = hazard.type || 'Other';

    card.className = `hazard-card severity-${severity}`;
    card.setAttribute('data-hazard-id', hazard.id);

    const timeAgo = this.getTimeAgo(new Date(hazard.timestamp));
    const userVote = this.getUserVote(hazard.id);
    const address = hazard.location?.address || 'Address not available';

    card.innerHTML = `
      <div class="hazard-header">
        <div class="hazard-type">${this.getHazardIcon(type)} ${type}</div>
        <span class="hazard-severity severity-${severity}">${hazard.severity || 'Unknown'}</span>
      </div>
      
      <div class="hazard-location">📍 ${address}</div>
      <div class="hazard-description">${hazard.description}</div>
      
      <div class="hazard-meta">
        <div>
          <div class="hazard-reporter">Reported by ${hazard.reporter}</div>
          <div class="hazard-timestamp">${timeAgo}</div>
        </div>
        
        <div class="hazard-actions">
          <button class="vote-btn upvote-btn ${userVote === 'up' ? 'upvoted' : ''}" 
                  data-id="${hazard.id}" data-type="up">
            👍 <span>${hazard.upvotes}</span>
          </button>
          <button class="vote-btn downvote-btn ${userVote === 'down' ? 'downvoted' : ''}" 
                  data-id="${hazard.id}" data-type="down">
            👎 <span>${hazard.downvotes}</span>
          </button>
          <span class="status status--${hazard.status.toLowerCase()}">${hazard.status}</span>
        </div>
      </div>

      <!-- Witness Verification Row -->
      <div class="witness-vote-row">
        <span class="witness-label">🔍 Witness:</span>
        <button class="witness-vote-btn btn-w-confirm" data-hid="${hazard.id}" data-rtype="confirm"
                title="Confirm this hazard is real">✅ Confirm</button>
        <button class="witness-vote-btn btn-w-dispute" data-hid="${hazard.id}" data-rtype="reject"
                title="Dispute — this hazard looks false">❌ Dispute</button>
        <div class="card-trust-bar-track" title="Community trust score">
          <div class="card-trust-bar-fill" style="width:0%"></div>
        </div>
        <span class="card-trust-pct">–</span>
      </div>
    `;

    card.addEventListener('click', (e) => {
      if (!e.target.closest('.vote-btn') && !e.target.closest('.witness-vote-btn')) this.showHazardDetails(hazard);
    });

    card.querySelectorAll('.vote-btn').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        e.stopPropagation();
        if (!AppData.isAuthenticated) {
          this.showAuthModal();
          return;
        }

        const hazardId = parseInt(btn.getAttribute('data-id'));
        const voteType = btn.getAttribute('data-type');

        btn.disabled = true;
        const result = await HazardAPI.voteHazard(hazardId, voteType);
        btn.disabled = false;

        if (result.success) {
          const hazardIndex = AppData.hazards.findIndex(h => h.id === hazardId);
          if (hazardIndex !== -1) AppData.hazards[hazardIndex] = result.hazard;

          const filteredIndex = AppState.filteredHazards.findIndex(h => h.id === hazardId);
          if (filteredIndex !== -1) AppState.filteredHazards[filteredIndex] = result.hazard;

          this.renderListView();
          this.showToast('Vote recorded!', 'success');
        } else {
          this.showToast(result.error, 'error');
        }
      });
    });
    // Witness verification buttons (confirm/dispute) on each card
    card.querySelectorAll('.witness-vote-btn').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        e.stopPropagation();
        if (!AppData.isAuthenticated) { this.showAuthModal(); return; }
        const hId = parseInt(btn.dataset.hid);
        const rType = btn.dataset.rtype;
        btn.disabled = true;
        try {
          const res = await fetch(`${API_BASE_URL}/hazards/${hId}/verify`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId: AppData.currentUser.id, responseType: rType })
          });
          const data = await res.json();
          if (data.success) {
            const pct = Math.round((data.trustScore || 0) * 100);
            this.showToast(rType === 'confirm' ? `✅ Confirmed! Trust: ${pct}%` : `❌ Disputed. Thank you!`, 'success');
            // Update mini trust bar in this card
            const fill = card.querySelector('.card-trust-bar-fill');
            if (fill) fill.style.width = pct + '%';
            const lbl = card.querySelector('.card-trust-pct');
            if (lbl) lbl.textContent = pct + '%';
          } else {
            this.showToast(data.message || 'Vote failed', 'error');
          }
        } catch (_) {
          this.showToast('Offline — vote saved locally.', 'info');
        } finally {
          btn.disabled = false;
        }
      });
    });
    return card;
  }

  static renderAdminView() {
    this.renderAdminStats();
    this.renderAdminTable();
    this.renderUserManagement();
  }

  static async renderAdminStats() {
    const result = await HazardAPI.getStatistics();
    if (result.success) this.updateStatistics(result.stats);
    // Also update user stats
    try {
      const res = await fetch(`${API_BASE_URL}/users`);
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          const total = data.total;
          const active = data.users.filter(u => u.reportsSubmitted > 0).length;
          ['total-users', 'total-users-badge'].forEach(id => {
            const el = document.getElementById(id);
            if (el) el.textContent = total;
          });
          ['active-users', 'active-users-badge'].forEach(id => {
            const el = document.getElementById(id);
            if (el) el.textContent = active;
          });
        }
      }
    } catch (e) {
      // Silently fail user count — not critical
    }
  }

  // Admin table state
  static _adminFilters = { type: '', status: '', severity: '' };
  static _allAdminHazards = [];

  static getFilteredAdminHazards() {
    const { type, status, severity } = this._adminFilters;
    return this._allAdminHazards.filter(h => {
      if (type && h.type !== type) return false;
      if (status && h.status.toLowerCase() !== status.toLowerCase()) return false;
      if (severity && h.severity.toLowerCase() !== severity.toLowerCase()) return false;
      return true;
    });
  }

  static renderAdminTable() {
    const tbody = document.getElementById('admin-reports-tbody');
    const countBadge = document.getElementById('admin-table-count');
    if (!tbody) return;

    // Sync from AppData every render
    this._allAdminHazards = [...AppData.hazards].sort(
      (a, b) => new Date(b.timestamp) - new Date(a.timestamp)
    );

    const hazards = this.getFilteredAdminHazards();
    if (countBadge) countBadge.textContent = `${hazards.length} report${hazards.length !== 1 ? 's' : ''}`;

    tbody.innerHTML = '';

    if (hazards.length === 0) {
      tbody.innerHTML = '<tr><td colspan="8" class="table-empty">No matching reports found</td></tr>';
      return;
    }

    hazards.forEach(hazard => {
      const sev = (hazard.severity || 'medium').toLowerCase();
      const stat = (hazard.status || 'pending').toLowerCase();
      const timeAgo = this.getTimeAgo(new Date(hazard.timestamp));
      const reporterInitial = (hazard.reporter || '?').charAt(0).toUpperCase();

      const row = document.createElement('tr');
      row.setAttribute('data-id', hazard.id);

      row.innerHTML = `
        <td><input type="checkbox" data-id="${hazard.id}" class="admin-row-cb"></td>
        <td>
          <div class="hazard-cell">
            <div class="hazard-cell-type">${this.getHazardIcon(hazard.type)} ${hazard.type}</div>
            <span class="severity-pill ${sev}">${hazard.severity}</span>
          </div>
        </td>
        <td style="max-width:180px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;" title="${hazard.location.address}">
          ${hazard.location.address}
        </td>
        <td>
          <div class="reporter-cell">
            <div class="reporter-avatar-sm">${reporterInitial}</div>
            <span class="reporter-name">${hazard.reporter}</span>
          </div>
        </td>
        <td><span class="status-pill ${stat}">${hazard.status}</span></td>
        <td style="white-space:nowrap;color:var(--color-text-secondary);font-size:12px;">${timeAgo}</td>
        <td>
          <div class="votes-cell">
            <span class="vote-up">👍 ${hazard.upvotes}</span>
            <span class="vote-down">👎 ${hazard.downvotes}</span>
          </div>
        </td>
        <td>
          <div class="row-actions">
            <button class="row-action-btn verify verify-btn" data-id="${hazard.id}" title="Mark Verified">✅ Verify</button>
            <button class="row-action-btn resolve resolve-btn" data-id="${hazard.id}" title="Mark Resolved">🏁 Resolve</button>
            <button class="row-action-btn flag flag-btn" data-id="${hazard.id}" title="Flag as Disputed">🚩 Flag</button>
          </div>
        </td>
      `;

      tbody.appendChild(row);
    });

    // Wire action buttons
    this._wireAdminTableActions(tbody);

    // Row checkbox → highlight
    tbody.querySelectorAll('.admin-row-cb').forEach(cb => {
      cb.addEventListener('change', () => {
        const row = cb.closest('tr');
        if (row) row.classList.toggle('row-selected', cb.checked);
      });
    });
  }

  static _wireAdminTableActions(tbody) {
    const applyStatus = async (btn, newStatus, label) => {
      const hazardId = parseInt(btn.getAttribute('data-id'));
      btn.disabled = true;
      const result = await HazardAPI.updateHazardStatus(hazardId, newStatus);
      btn.disabled = false;
      if (result.success) {
        const hIdx = AppData.hazards.findIndex(h => h.id === hazardId);
        if (hIdx !== -1) AppData.hazards[hIdx].status = newStatus.charAt(0).toUpperCase() + newStatus.slice(1);
        this.renderAdminTable();
        this.renderAdminStats();
        this.showToast(`Hazard marked as ${label}`, 'success');
      } else {
        this.showToast(result.error || 'Update failed', 'error');
      }
    };

    tbody.querySelectorAll('.verify-btn').forEach(btn =>
      btn.addEventListener('click', () => applyStatus(btn, 'verified', 'Verified'))
    );
    tbody.querySelectorAll('.resolve-btn').forEach(btn =>
      btn.addEventListener('click', () => applyStatus(btn, 'resolved', 'Resolved'))
    );
    tbody.querySelectorAll('.flag-btn').forEach(btn =>
      btn.addEventListener('click', () => applyStatus(btn, 'disputed', 'Disputed'))
    );
  }

  static async renderUserManagement() {
    const userGrid = document.getElementById('user-management');
    if (!userGrid) return;
    userGrid.innerHTML = '<div class="user-grid-loading">Loading users...</div>';

    let users = [];
    try {
      const res = await fetch(`${API_BASE_URL}/users`);
      if (res.ok) {
        const data = await res.json();
        if (data.success) users = data.users;
      }
    } catch (e) {
      // Fallback to empty
    }

    // Apply search filter
    const searchInput = document.getElementById('user-search');
    const q = (searchInput && searchInput.value || '').toLowerCase();
    if (q) users = users.filter(u => u.name.toLowerCase().includes(q) || (u.email || '').toLowerCase().includes(q));

    userGrid.innerHTML = '';
    if (users.length === 0) {
      userGrid.innerHTML = '<div class="user-grid-loading">No users found</div>';
      return;
    }

    users.forEach(user => {
      const isAdmin = user.role === 'admin';
      const isMod = user.role === 'moderator';
      const trustPct = Math.min(100, Math.round((user.reportsSubmitted || 0) * 5));
      const initial = (user.name || '?').charAt(0).toUpperCase();

      const card = document.createElement('div');
      card.className = 'admin-user-card';
      card.innerHTML = `
        <div class="user-card-top">
          <div class="user-avatar-lg ${isAdmin ? 'admin-user' : ''}">
            ${initial}
            <span class="online-dot ${Math.random() > 0.5 ? 'online' : 'offline'}"></span>
          </div>
          <div class="user-card-info">
            <div class="user-card-name">${user.name}</div>
            <div class="user-card-email">${user.email || '—'}</div>
            <span class="role-badge ${user.role}">${isAdmin ? '👑 Admin' : isMod ? '🔧 Mod' : '👤 User'}</span>
          </div>
        </div>
        <div class="trust-bar-container">
          <div class="trust-bar-header">
            <span>Trust Score</span>
            <strong>${trustPct}%</strong>
          </div>
          <div class="trust-bar-track">
            <div class="trust-bar-fill" style="width:${trustPct}%"></div>
          </div>
        </div>
        <div class="user-card-stats">
          <div class="user-card-stat">
            <strong>${user.reportsSubmitted || 0}</strong>
            Reports
          </div>
          <div class="user-card-stat">
            <strong>${new Date(user.createdAt).getFullYear()}</strong>
            Joined
          </div>
          <div class="user-card-stat">
            <strong>${user.role.charAt(0).toUpperCase() + user.role.slice(1)}</strong>
            Role
          </div>
        </div>
      `;
      userGrid.appendChild(card);
    });
  }

  static renderProfileView() {
    if (!AppData.isAuthenticated) return;
    const user = AppData.currentUser;

    const elements = {
      'profile-name': user.name || user.username || 'Citizen',
      'trust-score': user.trustScore,
      'reports-submitted': user.reportsSubmitted,
      'upvotes-received': user.upvotesReceived || 0,
      'accuracy-rate': (user.accuracyRate != null ? user.accuracyRate + '%' : '95%'),
      'response-time': (user.responseTime != null ? user.responseTime + 'm' : '< 5m')
    };

    Object.entries(elements).forEach(([id, value]) => {
      const element = document.getElementById(id);
      if (element) element.textContent = value;
    });

    const trustFill = document.getElementById('trust-score-fill');
    if (trustFill) trustFill.style.width = user.trustScore + '%';

    const mobileUsername = document.getElementById('mobile-username');
    const mobileTrustScore = document.getElementById('mobile-trust-score');
    if (mobileUsername) mobileUsername.textContent = user.username;
    if (mobileTrustScore) mobileTrustScore.textContent = user.trustScore;

    this.renderBadges(user.badges || ['Active Reporter']);
    this.renderActivityTimeline();
  }

  static renderBadges(badges) {
    const badgesList = document.getElementById('badges-list');
    if (!badgesList) return;
    badgesList.innerHTML = '';
    badges.forEach(badge => {
      const badgeElement = document.createElement('div');
      badgeElement.className = 'badge';
      badgeElement.innerHTML = `🏆 ${badge}`;
      badgesList.appendChild(badgeElement);
    });
  }

  static renderActivityTimeline() {
    const timeline = document.getElementById('activity-timeline');
    if (!timeline) return;
    const activities = [
      { icon: '📍', title: 'Joined HazardAlert', time: 'Recently' }
    ];
    timeline.innerHTML = '';
    activities.forEach(activity => {
      const item = document.createElement('div');
      item.className = 'activity-item';
      item.innerHTML = `
        <div class="activity-icon">${activity.icon}</div>
        <div class="activity-content">
          <div class="activity-title">${activity.title}</div>
          <div class="activity-time">${activity.time}</div>
        </div>
      `;
      timeline.appendChild(item);
    });
  }

  static renderCharts() {
    // Always destroy and redraw so data stays fresh
    this.renderTypeChart();
    this.renderActivityChart();
  }

  static renderTypeChart() {
    const canvas = document.getElementById('type-chart');
    if (!canvas || typeof Chart === 'undefined') return;

    // Destroy existing chart if present to avoid 'canvas already in use' error
    if (AppState.charts.typeChart) {
      AppState.charts.typeChart.destroy();
      AppState.charts.typeChart = null;
    }

    // Build counts from real hazard data
    const typeData = {};
    AppData.hazards.forEach(h => {
      const t = h.type || 'Unknown';
      typeData[t] = (typeData[t] || 0) + 1;
    });

    const labels = Object.keys(typeData);
    const values = Object.values(typeData);

    if (labels.length === 0) {
      // No data — show placeholder text instead of empty chart
      const ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = 'var(--color-text-secondary, #888)';
      ctx.font = '14px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('No hazard data yet', canvas.width / 2, canvas.height / 2);
      return;
    }

    const ctx = canvas.getContext('2d');
    AppState.charts.typeChart = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels,
        datasets: [{
          data: values,
          backgroundColor: [
            '#1FB8CD', '#FFC185', '#B4413C', '#ECEBD5',
            '#5D878F', '#DB4545', '#D2BA4C', '#964325'
          ],
          borderWidth: 2,
          borderColor: 'var(--color-surface, #fff)'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        plugins: {
          legend: { position: 'bottom', labels: { boxWidth: 12, padding: 10 } }
        }
      }
    });
  }

  static renderActivityChart() {
    const canvas = document.getElementById('activity-chart');
    if (!canvas || typeof Chart === 'undefined') return;

    // Destroy existing chart to avoid canvas conflict
    if (AppState.charts.activityChart) {
      AppState.charts.activityChart.destroy();
      AppState.charts.activityChart = null;
    }

    // Build last-7-days data from real hazard timestamps
    const days = [];
    const counts = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      days.push(d.toLocaleDateString('en-US', { weekday: 'short' }));
      const dayStr = d.toDateString();
      counts.push(
        AppData.hazards.filter(h => new Date(h.timestamp).toDateString() === dayStr).length
      );
    }

    const ctx = canvas.getContext('2d');
    AppState.charts.activityChart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: days,
        datasets: [{
          label: 'Reports',
          data: counts,
          borderColor: '#1FB8CD',
          backgroundColor: 'rgba(31, 184, 205, 0.12)',
          pointBackgroundColor: '#1FB8CD',
          pointRadius: 4,
          tension: 0.4,
          fill: true
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        plugins: { legend: { display: false } },
        scales: {
          y: {
            beginAtZero: true,
            ticks: { stepSize: 1, precision: 0 }
          }
        }
      }
    });
  }


  static async handleLogin(e) {
    e.preventDefault();
    const emailInput = document.getElementById('login-email');
    const passwordInput = document.getElementById('login-password');
    const email = emailInput?.value.trim();
    const password = passwordInput?.value.trim();

    if (!email || !password) return this.showToast('Email and password are required', 'error');

    this.showLoading('Signing you in...');
    const result = await HazardAPI.authenticate({ email, password });

    if (!result.success) {
      this.hideLoading();
      return this.showToast(result.error, 'error');
    }

    this.updateUserInterface();
    document.getElementById('auth-modal')?.classList.add('hidden');
    this.hideLoading();
    this.showToast(`Welcome back, ${AppData.currentUser.name || AppData.currentUser.username}!`, 'success');
  }

  static async handleRegister(e) {
    e.preventDefault();
    const nameInput = document.getElementById('register-username');
    const emailInput = document.getElementById('register-email');
    const passwordInput = document.getElementById('register-password');
    const name = nameInput?.value.trim();
    const email = emailInput?.value.trim();
    const password = passwordInput?.value.trim();

    if (!name || !email || !password) return this.showToast('Name, email and password are required', 'error');

    this.showLoading('Creating your account...');
    const result = await HazardAPI.register({ username: name, email, password });

    if (!result.success) {
      this.hideLoading();
      return this.showToast(result.error, 'error');
    }

    this.updateUserInterface();
    document.getElementById('auth-modal')?.classList.add('hidden');
    this.hideLoading();
    this.showToast(`Welcome, ${AppData.currentUser.name || AppData.currentUser.username}!`, 'success');
  }

  static async handleLogout() {
    this.showLoading('Signing you out...');
    await HazardAPI.logout();
    this.hideLoading();
    this.updateUserInterface();
    this.showToast('Signed out successfully', 'success');
    this.switchView('map');
    setTimeout(() => this.showAuthModal(), 1000);
  }

  static openReportModal() {
    const modal = document.getElementById('report-modal');
    if (!modal) return;

    // Explicitly wipe clean previous inputs before showing the modal
    const autoLoc = document.getElementById('report-location');
    const manLoc = document.getElementById('manual-location');
    if (autoLoc) autoLoc.value = '';
    if (manLoc) manLoc.value = '';

    modal.classList.remove('hidden');
    AppState.reportForm.currentStep = 1;
    AppState.reportForm.data = {};
    this.updateReportFormStep();

    // The getCurrentLocation() call is removed from here.
    // The user MUST click the "Use Current Location" button now!
  }

  static closeReportModal() {
    const modal = document.getElementById('report-modal');
    if (!modal) return;
    modal.classList.add('hidden');
    const form = document.getElementById('report-form');
    if (form) form.reset();
    document.querySelectorAll('.hazard-type-option, .severity-option').forEach(el => el.classList.remove('selected'));
    AppState.reportForm.currentStep = 1;
    AppState.reportForm.data = {};

    // Reset Map Preview on close
    const mapIframe = document.getElementById('map-preview-iframe');
    const mapPlaceholder = document.getElementById('map-preview-placeholder');
    if (mapIframe && mapPlaceholder) {
      mapIframe.src = '';
      mapIframe.style.display = 'none';
      mapPlaceholder.style.display = 'flex';
    }
  }

  static nextReportStep() {
    if (AppState.reportForm.currentStep < 3 && this.validateCurrentStep()) {
      AppState.reportForm.currentStep++;
      this.updateReportFormStep();
      if (AppState.reportForm.currentStep === 3) this.updateReportSummary();
    }
  }

  static prevReportStep() {
    if (AppState.reportForm.currentStep > 1) {
      AppState.reportForm.currentStep--;
      this.updateReportFormStep();
    }
  }

  static updateReportFormStep() {
    const steps = document.querySelectorAll('.step');
    const formSteps = document.querySelectorAll('.form-step');
    const prevBtn = document.getElementById('prev-step');
    const nextBtn = document.getElementById('next-step');
    const submitBtn = document.getElementById('submit-report');

    steps.forEach((step, index) => step.classList.toggle('active', index + 1 === AppState.reportForm.currentStep));
    formSteps.forEach((step, index) => step.classList.toggle('active', index + 1 === AppState.reportForm.currentStep));

    if (prevBtn) prevBtn.disabled = AppState.reportForm.currentStep === 1;
    if (AppState.reportForm.currentStep === 3) {
      if (nextBtn) nextBtn.classList.add('hidden');
      if (submitBtn) submitBtn.classList.remove('hidden');
    } else {
      if (nextBtn) nextBtn.classList.remove('hidden');
      if (submitBtn) submitBtn.classList.add('hidden');
    }
  }

  static validateCurrentStep() {
    switch (AppState.reportForm.currentStep) {
      case 1:
        const manualVal = document.getElementById('manual-location')?.value;
        const autoVal = document.getElementById('report-location')?.value;
        const locationVal = manualVal || autoVal;

        if (!locationVal) { this.showToast('Please provide a location', 'error'); return false; }

        // Ensure exact GPS coordinates aren't wiped out when going to Step 2
        // Only initialize if it doesn't exist, preserving lat/lng if we already have them
        if (!AppState.reportForm.data.location || typeof AppState.reportForm.data.location.lat !== 'number') {
          AppState.reportForm.data.location = { lat: 0, lng: 0, address: locationVal };
        } else {
          // We have coords, just ensure the text matches the input
          AppState.reportForm.data.location.address = locationVal;
        }
        return true;
      case 2:
        const type = document.getElementById('report-type')?.value;
        const severity = document.getElementById('report-severity')?.value;
        const description = document.getElementById('report-description')?.value;
        if (!type || !severity || !description) { this.showToast('Please fill in all required fields', 'error'); return false; }
        AppState.reportForm.data = { ...AppState.reportForm.data, type, severity, description };
        return true;
      default: return true;
    }
  }

  static updateReportSummary() {
    const summary = document.getElementById('report-summary');
    if (!summary) return;
    const { type, severity, description, location } = AppState.reportForm.data;

    // Safely parse the address text just in case the object structure changed
    const addressText = typeof location === 'object' ? location.address : location;

    summary.innerHTML = `
      <div><strong>Type:</strong> ${this.getHazardIcon(type)} ${type}</div>
      <div><strong>Severity:</strong> <span class="severity-${severity.toLowerCase()}">${severity}</span></div>
      <div><strong>Location:</strong> ${addressText}</div>
      <div><strong>Description:</strong> ${description}</div>
    `;
  }

  static async handleReportSubmission(e) {
    e.preventDefault();

    if (!AppData.isAuthenticated || !AppData.currentUser) return this.showAuthModal();

    const type = document.getElementById('report-type')?.value;
    const severity = document.getElementById('report-severity')?.value;
    const description = document.getElementById('report-description')?.value?.trim() || '';

    const manualAddress = document.getElementById('manual-location')?.value?.trim();
    const autoAddress = document.getElementById('report-location')?.value?.trim();
    const stateLocation = AppState.reportForm?.data?.location || {};
    const address = manualAddress || autoAddress || stateLocation.address?.trim() || '';

    if (!type || !severity || !address) return this.showToast('Type, severity and location are required', 'error');

    let lat = typeof stateLocation.lat === 'number' ? stateLocation.lat : 0;
    let lng = typeof stateLocation.lng === 'number' ? stateLocation.lng : 0;

    // BLOCK OCEAN MARKERS: Final safety check for missing coordinates
    if (lat === 0 && lng === 0) {
      return this.showToast('Could not determine exact map coordinates. Please use "Current Location".', 'error');
    }

    const payload = {
      type: type,
      severity,
      location: { lat, lng, address },
      description,
      anonymous: false
    };

    this.showLoading('Submitting hazard...');
    const result = await HazardAPI.createHazard(payload);

    if (!result.success) {
      this.hideLoading();
      return this.showToast(result.error, 'error');
    }

    // Refresh everything from backend to keep it perfectly synced
    await this.loadInitialData();

    this.closeReportModal();
    this.switchView('map');
    this.hideLoading();
    this.showToast('Hazard reported successfully', 'success');

    // Zoom exactly to the newly reported location on the map
    if (lat !== 0 && lng !== 0 && AppState.leafletMap) {
      setTimeout(() => {
        AppState.leafletMap.setView([lat, lng], 17); // Level 17 is a very close zoom
      }, 500);
    }
  }

  static getCurrentLocation() {
    if (!navigator.geolocation) return this.showToast('Geolocation not supported in this browser', 'error');

    const locationInput = document.getElementById('report-location');
    if (locationInput) locationInput.value = 'Detecting exact location...';

    // Clear any manual input if they click the button
    const manualInput = document.getElementById('manual-location');
    if (manualInput) manualInput.value = '';

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;

        // Instantly save exact coordinates so they aren't lost while waiting for address
        AppState.reportForm.data.location = {
          lat: latitude,
          lng: longitude,
          address: `Lat: ${latitude.toFixed(6)}, Lng: ${longitude.toFixed(6)}`
        };

        // Update Map Preview instantly if available
        const mapIframe = document.getElementById('map-preview-iframe');
        const mapPlaceholder = document.getElementById('map-preview-placeholder');
        if (mapIframe && mapPlaceholder) {
          mapIframe.src = `https://maps.google.com/maps?q=${latitude},${longitude}&t=&z=16&ie=UTF8&iwloc=&output=embed`;
          mapIframe.style.display = 'block';
          mapPlaceholder.style.display = 'none';
        }

        try {
          const url = `https://us1.locationiq.com/v1/reverse?key=pk.a9cb83a96ca56697515f106c4a77e823&lat=${latitude}&lon=${longitude}&format=json`;
          const res = await fetch(url);
          if (!res.ok) throw new Error('Reverse geocoding failed');
          const data = await res.json();
          const address = data.display_name || AppState.reportForm.data.location.address;

          AppState.reportForm.data.location.address = address; // Update just the text, keeping exact coords
          if (locationInput) locationInput.value = address;
          this.showToast('Exact location detected', 'success');
        } catch (err) {
          if (locationInput) locationInput.value = AppState.reportForm.data.location.address;
          this.showToast('Saved exact coordinates (Could not load street name)', 'warning');
        }
      },
      (error) => {
        if (locationInput) { locationInput.value = ''; locationInput.placeholder = 'Unable to get location - please enter manually'; }
        this.showToast('Location access denied or unavailable', 'warning');

        // Hide preview on error
        const mapIframe = document.getElementById('map-preview-iframe');
        const mapPlaceholder = document.getElementById('map-preview-placeholder');
        if (mapIframe && mapPlaceholder) {
          mapIframe.style.display = 'none';
          mapPlaceholder.style.display = 'flex';
        }
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 } // Increased timeout to ensure GPS locks
    );
  }

  static async applyFilters() {
    const filters = {
      type: document.getElementById('type-filter')?.value || '',
      severity: document.getElementById('severity-filter')?.value || '',
      status: document.getElementById('status-filter')?.value || '',
      search: document.getElementById('location-search')?.value || '',
      sort: document.getElementById('sort-select')?.value || 'newest'
    };

    const result = await HazardAPI.getHazards(filters);

    if (result.success) {
      AppState.filteredHazards = result.hazards.map(this.mapBackendHazardToFrontend);

      AppState.pagination.currentPage = 1;
      AppState.pagination.totalPages = Math.max(1, Math.ceil(AppState.filteredHazards.length / AppState.pagination.itemsPerPage));

      this.loadViewData(AppState.currentView);
    }
  }

  static clearFilters() {
    ['type-filter', 'severity-filter', 'status-filter', 'location-search', 'sort-select'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.value = '';
    });
    const sortSelect = document.getElementById('sort-select');
    if (sortSelect) sortSelect.value = 'newest';
    this.applyFilters();
  }

  static handleGlobalSearch(e) { console.log('Global search:', e.target.value); }

  static async bulkApprove() {
    const checkedBoxes = document.querySelectorAll('#admin-reports-tbody .admin-row-cb:checked');
    const hazardIds = Array.from(checkedBoxes)
      .map(cb => parseInt(cb.getAttribute('data-id')))
      .filter(id => !isNaN(id));

    if (hazardIds.length === 0) return this.showToast('Please select reports to verify', 'warning');

    this.showLoading(`Verifying ${hazardIds.length} selected reports...`);
    let successCount = 0;
    for (const id of hazardIds) {
      const result = await HazardAPI.updateHazardStatus(id, 'verified');
      if (result.success) {
        successCount++;
        const hIdx = AppData.hazards.findIndex(h => h.id === id);
        if (hIdx !== -1) AppData.hazards[hIdx].status = 'Verified';
      }
    }
    this.hideLoading();
    this.renderAdminTable();
    this.renderAdminStats();
    this.showToast(`${successCount} of ${hazardIds.length} reports verified`, 'success');
    // Uncheck select-all
    const selectAll = document.getElementById('select-all-reports');
    if (selectAll) selectAll.checked = false;
  }

  static async autoVerify() {
    // Rule: upvotes >= 5 AND trustScore >= 0.8
    const pendingHazards = AppData.hazards.filter(h =>
      h.status.toLowerCase() === 'pending' &&
      h.upvotes >= 5 &&
      (h.trustScore || 0) >= 0.8
    );

    if (pendingHazards.length === 0) {
      return this.showToast(
        'No pending reports meet auto-verify criteria (upvotes ≥ 5 & trust ≥ 0.8)',
        'info'
      );
    }

    this.showLoading(`Auto-verifying ${pendingHazards.length} qualified reports...`);
    let count = 0;
    for (const hazard of pendingHazards) {
      const result = await HazardAPI.updateHazardStatus(hazard.id, 'verified');
      if (result.success) {
        count++;
        const hIdx = AppData.hazards.findIndex(h => h.id === hazard.id);
        if (hIdx !== -1) AppData.hazards[hIdx].status = 'Verified';
      }
    }
    this.hideLoading();
    this.renderAdminTable();
    this.renderAdminStats();
    this.showToast(`${count} reports auto-verified`, 'success');
  }

  static exportToCSV() {
    const headers = ['ID', 'Type', 'Severity', 'Location', 'Description', 'Reporter', 'Timestamp', 'Status', 'Upvotes', 'Downvotes', 'Trust Score'];
    const csvContent = [
      headers.join(','),
      ...AppData.hazards.map(h => [h.id, h.type, h.severity, `"${h.location.address}"`, `"${h.description.replace(/"/g, '""')}"`, h.reporter, h.timestamp, h.status, h.upvotes, h.downvotes, (h.trustScore || 0).toFixed(2)].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `hazard-reports-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    this.showToast('Report exported successfully', 'success');
  }

  static async markAllNotificationsRead() {
    for (const notification of AppData.notifications) {
      if (!notification.read) await HazardAPI.markNotificationRead(notification.id);
    }
    AppState.notifications.unreadCount = 0;
    this.updateNotificationBadge();
    this.renderNotifications();
    this.showToast('All notifications marked as read', 'success');
  }

  static renderNotifications() {
    const list = document.getElementById('notification-list');
    if (!list) return;
    list.innerHTML = '';
    const notifications = AppData.notifications.sort((a, b) => b.timestamp - a.timestamp).slice(0, 10);

    if (notifications.length === 0) {
      list.innerHTML = '<div style="text-align: center; padding: 20px; color: var(--color-text-secondary);">No notifications</div>';
      return;
    }

    notifications.forEach(notification => {
      const item = document.createElement('div');
      item.className = `notification-item ${notification.read ? '' : 'unread'}`;
      item.innerHTML = `
        <div class="notification-title">${notification.title}</div>
        <div class="notification-message">${notification.message}</div>
        <div class="notification-time">${this.getTimeAgo(notification.timestamp)}</div>
      `;
      item.addEventListener('click', () => {
        if (!notification.read) {
          HazardAPI.markNotificationRead(notification.id);
          notification.read = true;
          item.classList.remove('unread');
          AppState.notifications.unreadCount--;
          this.updateNotificationBadge();
        }
      });
      list.appendChild(item);
    });
  }

  static updateNotificationBadge() {
    const badge = document.getElementById('notification-count');
    if (badge) {
      badge.textContent = AppState.notifications.unreadCount;
      badge.style.display = AppState.notifications.unreadCount > 0 ? 'flex' : 'none';
    }
  }

  static showAuthModal() {
    const modal = document.getElementById('auth-modal');
    if (modal) {
      modal.classList.remove('hidden');
      const loginForm = document.getElementById('login-form');
      const registerForm = document.getElementById('register-form');
      if (loginForm) loginForm.classList.remove('hidden');
      if (registerForm) registerForm.classList.add('hidden');
      const title = document.getElementById('auth-modal-title');
      if (title) title.textContent = 'Sign In';

      const closeBtn = document.getElementById('auth-modal-close');
      if (closeBtn) closeBtn.style.display = AppData.isAuthenticated ? 'block' : 'none';
    }
  }

  static hideAuthModal() {
    if (!AppData.isAuthenticated) return; // Prevent closing if not logged in
    const modal = document.getElementById('auth-modal');
    if (modal) modal.classList.add('hidden');
  }

  static showHazardDetails(hazard) {
    UI._lastSelectedHazard = hazard;
    const modal = document.getElementById('hazard-modal');
    const title = document.getElementById('hazard-modal-title');
    const body = document.getElementById('hazard-modal-body');

    if (!modal || !title || !body) return;
    title.textContent = `${hazard.type} - ${hazard.severity}`;
    const timeAgo = this.getTimeAgo(new Date(hazard.timestamp));
    const userVote = this.getUserVote(hazard.id);

    body.innerHTML = `
      <div class="hazard-detail">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
          <h4 style="margin: 0;">${this.getHazardIcon(hazard.type)} ${hazard.type}</h4>
          <span class="hazard-severity severity-${hazard.severity.toLowerCase()}">${hazard.severity}</span>
        </div>
        <div style="margin-bottom: 12px;"><strong>📍 Location:</strong> ${hazard.location.address}</div>
        <div style="margin-bottom: 12px;"><strong>Description:</strong> ${hazard.description}</div>
        <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; margin-bottom: 16px;">
          <div><strong>Reported by:</strong> ${hazard.reporter}</div>
          <div><strong>Time:</strong> ${timeAgo}</div>
          <div><strong>Status:</strong> <span class="status status--${hazard.status.toLowerCase()}">${hazard.status}</span></div>
          <div><strong>Trust Score:</strong> ${Math.round((hazard.trustScore || 0) * 100)}%</div>
        </div>
        ${AppData.isAuthenticated ? `
          <div style="display: flex; gap: 12px; margin-top: 20px;">
            <button class="vote-btn upvote-btn ${userVote === 'up' ? 'upvoted' : ''}" data-id="${hazard.id}" data-type="up">👍 Upvote <span>(${hazard.upvotes})</span></button>
            <button class="vote-btn downvote-btn ${userVote === 'down' ? 'downvoted' : ''}" data-id="${hazard.id}" data-type="down">👎 Downvote <span>(${hazard.downvotes})</span></button>
          </div>
        ` : '<div style="text-align: center; color: var(--color-text-secondary); margin-top: 16px;">Sign in to vote on this report</div>'}
      </div>
    `;

    if (AppData.isAuthenticated) {
      body.querySelectorAll('.vote-btn').forEach(btn => {
        btn.addEventListener('click', async (e) => {
          e.preventDefault();
          const hazardId = parseInt(btn.getAttribute('data-id'));
          const voteType = btn.getAttribute('data-type');

          btn.disabled = true;
          const result = await HazardAPI.voteHazard(hazardId, voteType);
          btn.disabled = false;

          if (result.success) {
            const hIdx = AppData.hazards.findIndex(h => h.id === hazardId);
            if (hIdx !== -1) AppData.hazards[hIdx] = result.hazard;
            const fIdx = AppState.filteredHazards.findIndex(h => h.id === hazardId);
            if (fIdx !== -1) AppState.filteredHazards[fIdx] = result.hazard;
            this.showHazardDetails(result.hazard);
            this.loadViewData(AppState.currentView);
            this.showToast('Vote recorded!', 'success');
          } else {
            this.showToast(result.error, 'error');
          }
        });
      });
    }
    modal.classList.remove('hidden');
    // Show verification panel if authenticated
    ProximityVerification.showVerificationPanel(hazard);
  }

  static closeAllModals() {
    document.querySelectorAll('.modal').forEach(modal => {
      if (modal.id === 'auth-modal' && !AppData.isAuthenticated) return;
      modal.classList.add('hidden');
    });
    const dropdown = document.getElementById('user-dropdown');
    const notificationPanel = document.getElementById('notification-panel');
    if (dropdown) dropdown.classList.add('hidden');
    if (notificationPanel) notificationPanel.classList.add('hidden');
  }

  static showLoading(message = 'Loading...') {
    const loading = document.getElementById('loading');
    const loadingText = document.getElementById('loading-subtext');
    if (loading) loading.classList.remove('hidden');
    if (loadingText) loadingText.textContent = message;
  }

  static hideLoading() {
    const loading = document.getElementById('loading');
    if (loading) loading.classList.add('hidden');
  }

  static updateUserInterface() {
    const userAvatar = document.getElementById('user-avatar');
    const notificationBell = document.getElementById('notification-bell');

    if (AppData.isAuthenticated) {
      document.body.style.overflow = ''; // Restore scrolling after forced login

      const userName = AppData.currentUser.name || AppData.currentUser.username || 'User';

      if (userAvatar) {
        userAvatar.style.display = 'flex';
        userAvatar.textContent = userName.charAt(0).toUpperCase();
        userAvatar.style.background = '#432c7a';
        userAvatar.style.color = '#fff';
        userAvatar.title = userName;
      }
      if (notificationBell) notificationBell.style.display = 'block';

      const mobileUsername = document.getElementById('mobile-username');
      const mobileTrustScore = document.getElementById('mobile-trust-score');
      const dropdownUsername = document.getElementById('dropdown-username');
      const profileName = document.getElementById('profile-name');

      if (mobileUsername) mobileUsername.textContent = userName;
      if (dropdownUsername) dropdownUsername.textContent = userName.toUpperCase();
      if (profileName) profileName.textContent = userName;
      if (mobileTrustScore) mobileTrustScore.textContent = AppData.currentUser.trustScore;

      this.renderNotifications();
      this.updateNotificationBadge();
    } else {
      if (userAvatar) userAvatar.style.display = 'none';
      if (notificationBell) notificationBell.style.display = 'none';
      
      const mobileUsername = document.getElementById('mobile-username');
      const mobileTrustScore = document.getElementById('mobile-trust-score');
      if (mobileUsername) mobileUsername.textContent = 'Guest User';
      if (mobileTrustScore) mobileTrustScore.textContent = '0';
    }

    const headerLoginBtn = document.getElementById('header-login-btn');
    if (headerLoginBtn) {
      headerLoginBtn.style.display = AppData.isAuthenticated ? 'none' : 'flex';
      headerLoginBtn.style.alignItems = 'center';
    }
  }

  static updateConnectionStatus() {
    const statusDot = document.getElementById('connection-status');
    const statusText = document.getElementById('connection-text');

    if (statusDot && statusText) {
      statusDot.className = 'status-dot';
      switch (AppState.connectionStatus) {
        case 'online': statusDot.classList.add('online'); statusText.textContent = 'Online'; break;
        case 'offline': statusDot.classList.add('offline'); statusText.textContent = 'Offline'; break;
        case 'connecting': statusDot.classList.add('connecting'); statusText.textContent = 'Connecting...'; break;
      }
    }
  }

  static updateStatistics(stats) {
    const elements = {
      'total-reports': stats.totalReports,
      'verified-reports': stats.reportsByStatus.Verified || stats.reportsByStatus.verified || 0,
      'pending-reports': stats.reportsByStatus.Pending || stats.reportsByStatus.pending || 0,
      // 4th card = Disputed count
      'critical-reports': (stats.reportsByStatus.Disputed || stats.reportsByStatus.disputed || 0)
    };
    Object.entries(elements).forEach(([id, value]) => {
      const element = document.getElementById(id);
      if (element) element.textContent = value;
    });
    const dashboardUpdated = document.getElementById('dashboard-updated');
    if (dashboardUpdated) {
      const now = new Date();
      dashboardUpdated.textContent = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
  }

  static updatePagination() {
    const pageInfo = document.getElementById('page-info');
    const prevButton = document.getElementById('prev-page');
    const nextButton = document.getElementById('next-page');

    AppState.pagination.totalPages = Math.max(1, Math.ceil(AppState.filteredHazards.length / AppState.pagination.itemsPerPage));

    if (pageInfo) pageInfo.textContent = `Page ${AppState.pagination.currentPage} of ${AppState.pagination.totalPages}`;
    if (prevButton) prevButton.disabled = AppState.pagination.currentPage <= 1;
    if (nextButton) nextButton.disabled = AppState.pagination.currentPage >= AppState.pagination.totalPages;

    if (prevButton && !prevButton._listenerAdded) {
      prevButton._listenerAdded = true;
      prevButton.addEventListener('click', () => {
        if (AppState.pagination.currentPage > 1) {
          AppState.pagination.currentPage--;
          UI.renderListView();
        }
      });
    }

    if (nextButton && !nextButton._listenerAdded) {
      nextButton._listenerAdded = true;
      nextButton.addEventListener('click', () => {
        if (AppState.pagination.currentPage < AppState.pagination.totalPages) {
          AppState.pagination.currentPage++;
          UI.renderListView();
        }
      });
    }
  }

  static setupPWA() {
    setTimeout(() => {
      if (Math.random() > 0.3) {
        const banner = document.getElementById('pwa-install-banner');
        if (banner) {
          banner.classList.remove('hidden');
          // Auto-dismiss after 4s so it never blocks the navbar
          setTimeout(() => banner.classList.add('hidden'), 4000);
        }
      }
    }, 5000);

    document.getElementById('pwa-install-btn')?.addEventListener('click', () => {
      this.showToast('App installed successfully!', 'success');
      const banner = document.getElementById('pwa-install-banner');
      if (banner) banner.classList.add('hidden');
    });

    document.getElementById('pwa-dismiss-btn')?.addEventListener('click', () => {
      const banner = document.getElementById('pwa-install-banner');
      if (banner) banner.classList.add('hidden');
    });
  }

  static getHazardIcon(type) {
    const icons = {
      'Fallen Tree': '🌳', 'Waterlogging': '🌊',
      'Road Closure': '🚧', 'Stalled Vehicle': '🚙', 'Broken Guardrail': '🛡️',
      'Other': '⚠️'
    };
    return icons[type] || '⚠️';
  }

  static getUserVote(hazardId) {
    if (!AppData.isAuthenticated) return null;
    const hazard = AppData.hazards.find(h => h.id === hazardId);
    const vote = hazard?.votes?.find(v => v.userId === AppData.currentUser.id);
    return vote?.type || null;
  }

  static getTimeAgo(date) {
    if (!date || isNaN(new Date(date).getTime())) return 'Recently';
    const now = new Date();
    const diff = now - new Date(date);
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return new Date(date).toLocaleDateString();
  }

  static debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => { clearTimeout(timeout); func(...args); };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }

  static showToast(message, type = 'info', title = '') {
    const container = document.getElementById('toast-container');
    if (!container) return;
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    const icons = { success: '✅', error: '❌', warning: '⚠️', info: 'ℹ️' };

    toast.innerHTML = `
      <span class="toast-icon">${icons[type] || icons.info}</span>
      <div class="toast-content">
        ${title ? `<div class="toast-title">${title}</div>` : ''}
        <div class="toast-message">${message}</div>
      </div>
      <button class="toast-close">&times;</button>
    `;
    container.appendChild(toast);

    const autoRemove = setTimeout(() => { if (container.contains(toast)) container.removeChild(toast); }, 5000);
    toast.querySelector('.toast-close')?.addEventListener('click', () => {
      clearTimeout(autoRemove);
      if (container.contains(toast)) container.removeChild(toast);
    });
    return toast;
  }

  static setupLayerToggles() {
    ['toggle-markers', 'toggle-danger-zones', 'toggle-heatmap'].forEach(id => {
      document.getElementById(id)?.addEventListener('change', () => {
        if (AppState.currentView === 'map') this.renderMapView();
      });
    });
  }

  static async refreshData() {
    this.showLoading('Refreshing data...');
    await this.loadInitialData();
    this.loadViewData(AppState.currentView);
    this.hideLoading();
    this.showToast('Data refreshed', 'success');
  }

  static async refreshStats() {
    const result = await HazardAPI.getStatistics();
    if (result.success) {
      this.updateStatistics(result.stats);
      this.showToast('Statistics updated', 'success');
    }
  }
}

// ===============================
// APPLICATION INITIALIZATION
// ===============================

document.addEventListener('DOMContentLoaded', async function () {
  try {
    console.log('🚀 Starting HazardAlert application...');
    await UI.initialize();
    console.log('✅ HazardAlert application ready!');

    setTimeout(() => {
      if (!AppData.isAuthenticated) {
        UI.showToast(
          'Welcome to HazardAlert! Sign in to report hazards and help keep roads safe.',
          'info',
          'Welcome!'
        );
      }
    }, 3000);
  } catch (error) {
    console.error('❌ Failed to initialize application:', error);
    UI.showToast('Failed to load application', 'error');
  }
});

// Export for debugging
window.HazardAlert = { AppData, AppState, API: HazardAPI, UI };

// ===============================
// AI DETECTION MODULE — Gemini Vision Photo Scanner
// ===============================

const AIDetectionModule = {
  _lastDetection: null,
  _currentImageBase64: null,

  async open() {
    const modal = document.getElementById('ai-camera-modal');
    if (!modal) return;
    modal.classList.remove('hidden');
    this._wireEvents();
    // Always open on Photo Upload tab — this also clears all stale state
    this._switchTab('upload');
  },

  _switchTab(mode) {
    this._activeTab = mode;

    // ── Synchronously clear ALL shared/stale state first ──────────────────
    this._lastDetection = null;
    this._triggered     = false;
    // Hide every shared UI element
    ['ai-hazard-prompt','ai-detection-badge','ai-camera-badge',
     'ai-confidence-display','ai-camera-confidence',
     'ai-result-card','ai-rejected-card','ai-no-camera-tip'].forEach(id => {
      document.getElementById(id)?.classList.add('hidden');
    });

    // Tab button styling
    document.querySelectorAll('.ai-mode-tab').forEach(t => {
      t.classList.toggle('active', t.dataset.mode === mode);
    });
    // Show/hide panels
    document.getElementById('ai-mode-upload')?.classList.toggle('hidden', mode !== 'upload');
    document.getElementById('ai-mode-camera')?.classList.toggle('hidden', mode !== 'camera');

    if (mode === 'camera') {
      this._startCameraMode();
    } else {
      this._stopCameraMode();
      this._reset();
    }
  },

  _wireEvents() {
    // Only wire once
    if (this._wired) return;
    this._wired = true;

    // Tab switching
    document.querySelectorAll('.ai-mode-tab').forEach(tab => {
      tab.addEventListener('click', () => this._switchTab(tab.dataset.mode));
    });

    const browseBtn  = document.getElementById('ai-browse-btn');
    const photoInput = document.getElementById('ai-photo-input');
    const uploadZone = document.getElementById('ai-upload-zone');
    const retryBtn   = document.getElementById('ai-retry-btn');
    const reportNo   = document.getElementById('ai-report-no');
    const reportYes  = document.getElementById('ai-report-yes');

    browseBtn?.addEventListener('click', () => photoInput?.click());

    photoInput?.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) this._loadAndScan(file);
      photoInput.value = ''; // reset so same file can be re-picked
    });

    // Drag-and-drop
    uploadZone?.addEventListener('dragover', (e) => { e.preventDefault(); uploadZone.classList.add('drag-over'); });
    uploadZone?.addEventListener('dragleave', () => uploadZone.classList.remove('drag-over'));
    uploadZone?.addEventListener('drop', (e) => {
      e.preventDefault();
      uploadZone.classList.remove('drag-over');
      const file = e.dataTransfer.files[0];
      if (file && file.type.startsWith('image/')) this._loadAndScan(file);
    });

    retryBtn?.addEventListener('click',  () => this._reset());
    reportNo?.addEventListener('click',  () => {
      if (this._activeTab === 'camera') {
        this._startCameraMode();
      } else {
        this._reset();
      }
    });
    reportYes?.addEventListener('click', () => this._confirmReport());

    // Capture button (camera mode → Gemini analysis)
    document.getElementById('ai-capture-btn')?.addEventListener('click', () => this._captureAndAnalyze());
  },

  // ── Camera Mode (COCO-SSD live detection) ─────────────────────────────────
  _stream: null,
  _model: null,
  _animFrame: null,
  _triggered: false,

  HAZARD_MAP: {
    'car': 'Accident', 'truck': 'Accident', 'bus': 'Accident', 'motorcycle': 'Accident',
    'bicycle': 'Accident', 'stop sign': 'Road Closure', 'traffic light': 'Road Closure',
    'tree': 'Fallen Tree', 'person': null, 'dog': null, 'cat': null,
    'bird': null, 'bench': null, 'umbrella': null, 'chair': null
  },

  async _startCameraMode() {
    this._stopCameraMode();
    this._triggered = false;
    document.getElementById('ai-no-camera-tip')?.classList.add('hidden');
    document.getElementById('ai-camera-confidence')?.classList.add('hidden');
    document.getElementById('ai-camera-badge')?.classList.add('hidden');
    document.getElementById('ai-hazard-prompt')?.classList.add('hidden');
    const captureBtn = document.getElementById('ai-capture-btn');
    if (captureBtn) captureBtn.style.display = 'none';
    this._setCamStatus('📹 Starting camera...');

    try {
      let stream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment', width: { ideal: 1280 } }, audio: false });
      } catch {
        stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
      }
      this._stream = stream;
      const video = document.getElementById('ai-camera-feed');
      if (video) { video.srcObject = stream; await video.play(); }

      // Show capture button now that camera is live
      if (captureBtn) captureBtn.style.display = 'block';

      this._setCamStatus('🤖 Loading AI model...');
      if (!this._model) {
        if (typeof cocoSsd !== 'undefined') {
          this._model = await cocoSsd.load();
        }
      }
      this._setCamStatus('🔍 Scanning live — or click 📸 to analyze with Gemini AI');
      this._runCameraDetection();
    } catch (err) {
      console.warn('Camera error:', err.message);
      this._setCamStatus('❌ Camera not found');
      if (captureBtn) captureBtn.style.display = 'none';
      document.getElementById('ai-no-camera-tip')?.classList.remove('hidden');
    }
  },

  // Capture current camera frame → send to Gemini Vision
  async _captureAndAnalyze() {
    const video = document.getElementById('ai-camera-feed');
    if (!video || !this._stream) {
      this._setCamStatus('⚠️ Camera not ready');
      return;
    }
    // Pause COCO-SSD while Gemini analyses
    cancelAnimationFrame(this._animFrame);
    this._setCamStatus('📸 Capturing frame...');

    const c = document.createElement('canvas');
    c.width  = video.videoWidth  || 640;
    c.height = video.videoHeight || 480;
    c.getContext('2d').drawImage(video, 0, 0);
    const base64 = c.toDataURL('image/jpeg', 0.85);

    // Store so _confirmReport can use it
    this._currentImageBase64 = base64;

    this._setCamStatus('🤖 Gemini AI is analyzing the frame...');
    try {
      const API = window.API_BASE || 'http://localhost:5000';
      const res = await fetch(`${API}/api/intelligence/analyze-photo`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageBase64: base64, description: 'live camera capture' })
      });
      const data = await res.json();
      if (data.success) {
        this._showResult(data.analysis, data._fallback);
      } else if (data.rejected) {
        this._setCamStatus('🚫 No hazard detected in frame — keep scanning');
        // Resume COCO-SSD
        this._runCameraDetection();
      } else {
        this._setCamStatus('⚠️ Analysis failed — resuming COCO-SSD scan');
        this._runCameraDetection();
      }
    } catch (e) {
      console.error('Capture analyze error:', e);
      this._setCamStatus('❌ Server error — resuming scan');
      this._runCameraDetection();
    }
  },

  // Show Gemini result (reused from upload mode)
  _showResult(analysis, isFallback) {
    this._lastDetection = analysis;
    const sevColors = { critical: '#dc2626', high: '#f97316', medium: '#eab308', low: '#22c55e' };
    const sevEmojis = { critical: '🔴', high: '🟠', medium: '🟡', low: '🟢' };
    const sev  = analysis.severity   || 'medium';
    const conf = analysis.confidence || 75;

    const line = document.getElementById('ai-scan-line');
    if (line) line.style.animation = 'none';
    this._updateStatus(`✅ ${isFallback ? 'Keyword AI' : 'Gemini AI'} analysis complete`);

    const display = document.getElementById('ai-confidence-display');
    const labelEl = document.getElementById('ai-detected-label');
    const bar     = document.getElementById('ai-confidence-bar');
    const pct     = document.getElementById('ai-confidence-pct');
    if (display) display.classList.remove('hidden');
    if (labelEl) labelEl.textContent = `${sevEmojis[sev] || '⚠️'} ${analysis.hazardType}`;
    if (bar)     { bar.style.width = conf + '%'; bar.style.background = sevColors[sev] || '#f97316'; }
    if (pct)     pct.textContent = conf + '%';

    const badge = document.getElementById('ai-detection-badge');
    if (badge) {
      badge.textContent = `${sevEmojis[sev]} [${sev.toUpperCase()}] ${analysis.hazardType} — ${conf}% confidence`;
      badge.style.background = (sevColors[sev] || '#f97316') + 'dd';
      badge.classList.remove('hidden');
    }

    const typeEl  = document.getElementById('ai-result-type');
    const sevEl   = document.getElementById('ai-result-severity');
    const actEl   = document.getElementById('ai-result-action');
    const areaEl  = document.getElementById('ai-result-area');
    const areaRow = document.getElementById('ai-result-area-row');
    const descEl  = document.getElementById('ai-result-desc');
    if (typeEl)  { typeEl.textContent = analysis.hazardType; typeEl.style.color = sevColors[sev]; }
    if (sevEl)   { sevEl.textContent = `${sevEmojis[sev]} ${sev.toUpperCase()}`; sevEl.style.color = sevColors[sev]; }
    if (actEl)   actEl.textContent = analysis.suggestedAction || '—';
    if (areaEl && analysis.affectedArea) { areaEl.textContent = analysis.affectedArea; areaRow?.classList.remove('hidden'); } else { areaRow?.classList.add('hidden'); }
    if (descEl)  descEl.textContent = analysis.description || '';

    document.getElementById('ai-result-card')?.classList.remove('hidden');
    document.getElementById('ai-rejected-card')?.classList.add('hidden');

    const detail = document.getElementById('prompt-detail-text');
    if (detail) detail.textContent = `Gemini AI detected "${analysis.hazardType}" with ${conf}% confidence — Severity: ${sev.toUpperCase()}.`;
    document.getElementById('ai-hazard-prompt')?.classList.remove('hidden');
  },


  _runCameraDetection() {
    const video  = document.getElementById('ai-camera-feed');
    const canvas = document.getElementById('ai-camera-canvas');
    if (!video || !canvas || !this._model) return;
    const ctx = canvas.getContext('2d');

    const detect = async () => {
      if (!this._stream) return;
      canvas.width  = video.videoWidth  || 640;
      canvas.height = video.videoHeight || 480;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      try {
        const preds = await this._model.detect(video);
        preds.forEach(pred => {
          const hazardType = this.HAZARD_MAP[pred.class];
          const conf = pred.score;
          const [x, y, w, h] = pred.bbox;
          ctx.strokeStyle = conf > 0.7 ? '#ef4444' : '#f97316';
          ctx.lineWidth = 3;
          ctx.strokeRect(x, y, w, h);
          ctx.fillStyle = conf > 0.7 ? 'rgba(239,68,68,0.18)' : 'rgba(249,115,22,0.18)';
          ctx.fillRect(x, y, w, h);
          ctx.fillStyle = '#fff';
          ctx.font = 'bold 13px sans-serif';
          ctx.fillText(`${pred.class} ${(conf * 100).toFixed(0)}%`, x + 4, y + 17);

          // Update confidence bar
          const bar = document.getElementById('ai-camera-bar');
          const lbl = document.getElementById('ai-camera-label');
          const pct = document.getElementById('ai-camera-pct');
          const disp = document.getElementById('ai-camera-confidence');
          if (disp) disp.classList.remove('hidden');
          if (lbl) lbl.textContent = hazardType ? `⚠️ ${hazardType} (${pred.class})` : pred.class;
          if (bar) { bar.style.width = (conf * 100) + '%'; bar.style.background = conf > 0.7 ? '#ef4444' : '#f97316'; }
          if (pct) pct.textContent = (conf * 100).toFixed(0) + '%';

          // Trigger report prompt
          if (conf > 0.72 && hazardType && !this._triggered) {
            this._triggered = true;
            cancelAnimationFrame(this._animFrame);
            const sev = (hazardType === 'Accident' || hazardType === 'Fallen Tree')
              ? (conf > 0.85 ? 'critical' : 'high') : (conf > 0.80 ? 'high' : 'medium');
            this._lastDetection = { hazardType, severity: sev, confidence: Math.round(conf * 100) };
            const badge = document.getElementById('ai-camera-badge');
            if (badge) { badge.textContent = `⚠️ [${sev.toUpperCase()}] ${hazardType} — ${Math.round(conf*100)}%`; badge.classList.remove('hidden'); }
            this._setCamStatus(`🚨 Hazard detected: ${hazardType} (${sev})`);
            const detail = document.getElementById('prompt-detail-text');
            if (detail) detail.textContent = `AI camera detected "${pred.class}" → ${hazardType} with ${Math.round(conf*100)}% confidence. Severity: ${sev.toUpperCase()}.`;
            document.getElementById('ai-hazard-prompt')?.classList.remove('hidden');
            return;
          }
        });
        if (preds.length === 0) this._setCamStatus('🔍 Scanning... no hazards yet');
      } catch (e) { /* continue frames */ }

      this._animFrame = requestAnimationFrame(detect);
    };
    detect();
  },

  _stopCameraMode() {
    cancelAnimationFrame(this._animFrame);
    this._animFrame = null;
    this._triggered = false;
    if (this._stream) { this._stream.getTracks().forEach(t => t.stop()); this._stream = null; }
    const video = document.getElementById('ai-camera-feed');
    if (video) video.srcObject = null;
  },

  _setCamStatus(msg) {
    const el = document.getElementById('ai-camera-status');
    if (el) el.textContent = msg;
  },

  _reset() {
    this._lastDetection  = null;
    this._currentImageBase64 = null;

    // Show upload zone, hide everything else
    document.getElementById('ai-upload-zone')?.classList.remove('hidden');
    document.getElementById('ai-scan-area')?.classList.add('hidden');
    document.getElementById('ai-hazard-prompt')?.classList.add('hidden');
    document.getElementById('ai-result-card')?.classList.add('hidden');
    document.getElementById('ai-rejected-card')?.classList.add('hidden');
    document.getElementById('ai-confidence-display')?.classList.add('hidden');
    document.getElementById('ai-detection-badge')?.classList.add('hidden');

    // Reset scan line animation
    const line = document.getElementById('ai-scan-line');
    if (line) { line.style.animation = 'none'; line.offsetHeight; line.style.animation = ''; }
  },

  _loadAndScan(file) {
    // Validate file
    if (!file.type.startsWith('image/')) {
      UI?.showToast('Please select an image file (JPG, PNG, WEBP)', 'error');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      UI?.showToast('Image too large — please use a photo under 10MB', 'error');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const base64 = e.target.result;
      this._currentImageBase64 = base64;

      // Show preview immediately
      const previewImg = document.getElementById('ai-preview-img');
      if (previewImg) previewImg.src = base64;

      // Switch to scan area
      document.getElementById('ai-upload-zone')?.classList.add('hidden');
      document.getElementById('ai-scan-area')?.classList.remove('hidden');
      document.getElementById('ai-result-card')?.classList.add('hidden');
      document.getElementById('ai-rejected-card')?.classList.add('hidden');
      document.getElementById('ai-hazard-prompt')?.classList.add('hidden');

      this._updateStatus('🤖 Gemini AI is analyzing your photo...');

      // Call Gemini backend
      this._analyzeWithGemini(base64, file.name);
    };
    reader.readAsDataURL(file);
  },

  async _analyzeWithGemini(base64, filename = '') {
    try {
      const API = window.API_BASE || 'http://localhost:5000';

      // Extract description hint from filename
      const hint = filename.replace(/\.\w+$/, '').replace(/[-_]/g, ' ');

      const res = await fetch(`${API}/api/intelligence/analyze-photo`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageBase64: base64, description: hint })
      });

      const data = await res.json();

      if (!data.success && data.rejected) {
        // Gemini saw the image but found no hazard
        this._showRejected(data.message || 'No road hazard detected in this photo.');
        return;
      }

      if (!data.success) {
        this._showRejected('Analysis failed. Please try a clearer photo.');
        return;
      }

      // Show results
      this._showResult(data.analysis, data._fallback);

    } catch (err) {
      console.error('AI scan error:', err);
      this._showRejected('Could not reach AI server. Please make sure the backend is running.');
    }
  },

  _showResult(analysis, isFallback) {
    this._lastDetection = analysis;

    const sevColors = { critical: '#dc2626', high: '#f97316', medium: '#eab308', low: '#22c55e' };
    const sevEmojis = { critical: '🔴', high: '🟠', medium: '🟡', low: '🟢' };
    const sev = analysis.severity || 'medium';
    const conf = analysis.confidence || 75;

    // Stop scan line animation
    const line = document.getElementById('ai-scan-line');
    if (line) line.style.animation = 'none';

    // Update status bar
    this._updateStatus(`✅ ${isFallback ? 'Keyword AI' : 'Gemini AI'} analysis complete`);

    // Show confidence bar
    const display = document.getElementById('ai-confidence-display');
    const labelEl = document.getElementById('ai-detected-label');
    const bar     = document.getElementById('ai-confidence-bar');
    const pct     = document.getElementById('ai-confidence-pct');
    if (display) display.classList.remove('hidden');
    if (labelEl) labelEl.textContent = `${sevEmojis[sev] || '⚠️'} ${analysis.hazardType}`;
    if (bar)     { bar.style.width = conf + '%'; bar.style.background = sevColors[sev] || '#f97316'; }
    if (pct)     pct.textContent = conf + '%';

    // Show detection badge
    const badge = document.getElementById('ai-detection-badge');
    if (badge) {
      badge.textContent = `${sevEmojis[sev]} [${sev.toUpperCase()}] ${analysis.hazardType} — ${conf}% confidence`;
      badge.style.background = (sevColors[sev] || '#f97316') + 'dd';
      badge.classList.remove('hidden');
    }

    // Populate result card
    const typeEl   = document.getElementById('ai-result-type');
    const sevEl    = document.getElementById('ai-result-severity');
    const actEl    = document.getElementById('ai-result-action');
    const areaEl   = document.getElementById('ai-result-area');
    const areaRow  = document.getElementById('ai-result-area-row');
    const descEl   = document.getElementById('ai-result-desc');

    if (typeEl)  { typeEl.textContent = analysis.hazardType; typeEl.style.color = sevColors[sev]; }
    if (sevEl)   { sevEl.textContent = `${sevEmojis[sev]} ${sev.toUpperCase()}`; sevEl.style.color = sevColors[sev]; }
    if (actEl)   actEl.textContent = analysis.suggestedAction || '—';
    if (areaEl && analysis.affectedArea) {
      areaEl.textContent = analysis.affectedArea;
      areaRow?.classList.remove('hidden');
    } else { areaRow?.classList.add('hidden'); }
    if (descEl)  descEl.textContent = analysis.description || '';

    document.getElementById('ai-result-card')?.classList.remove('hidden');
    document.getElementById('ai-rejected-card')?.classList.add('hidden');

    // Show confirm prompt
    const detail = document.getElementById('prompt-detail-text');
    if (detail) detail.textContent = `Gemini AI detected a "${analysis.hazardType}" with ${conf}% confidence — Severity: ${sev.toUpperCase()}.`;
    document.getElementById('ai-hazard-prompt')?.classList.remove('hidden');
  },

  _showRejected(message) {
    const line = document.getElementById('ai-scan-line');
    if (line) line.style.animation = 'none';

    this._updateStatus('🚫 No hazard detected');
    document.getElementById('ai-result-card')?.classList.add('hidden');
    document.getElementById('ai-confidence-display')?.classList.add('hidden');
    document.getElementById('ai-hazard-prompt')?.classList.add('hidden');

    const msgEl = document.getElementById('ai-rejected-msg');
    if (msgEl) msgEl.textContent = message;
    document.getElementById('ai-rejected-card')?.classList.remove('hidden');
  },

  _confirmReport() {
    const analysis = this._lastDetection;
    if (!analysis) return;

    const capturedImage = this._currentImageBase64;
    this.close();

    if (!AppData.isAuthenticated) { UI.showAuthModal(); return; }
    UI.openReportModal();

    setTimeout(() => {
      // Pre-fill hazard type
      AppState.reportForm.currentStep = 2;
      UI.updateReportFormStep();

      const option = document.querySelector(`.hazard-type-option[data-type="${analysis.hazardType}"]`);
      if (option) {
        document.querySelectorAll('.hazard-type-option').forEach(o => o.classList.remove('selected'));
        option.classList.add('selected');
        const typeInput = document.getElementById('report-type');
        if (typeInput) typeInput.value = analysis.hazardType;
      }

      // Pre-fill severity
      const sev = analysis.severity || 'medium';
      const sevOption = document.querySelector(`.severity-option[data-severity="${sev}"]`);
      if (sevOption) {
        document.querySelectorAll('.severity-option').forEach(o => o.classList.remove('selected'));
        sevOption.classList.add('selected');
        const sevInput = document.getElementById('report-severity');
        if (sevInput) sevInput.value = sev;
      }

      // Pre-fill description
      const descInput = document.getElementById('report-description');
      if (descInput && analysis.description) descInput.value = analysis.description;

      // Store captured image
      if (capturedImage) AppState.reportForm.data.capturedImage = capturedImage;

      UI.showToast(`🤖 AI pre-filled: ${analysis.hazardType} (${sev})`, 'success');
    }, 300);
  },

  _updateStatus(msg) {
    const el = document.getElementById('ai-status-text');
    if (el) el.textContent = msg;
  },

  close() {
    this._stopCameraMode();
    document.getElementById('ai-camera-modal')?.classList.add('hidden');
    this._reset();
  }
};


// ===============================
// TRUST SCORE ENGINE
// ===============================

const TrustScoreEngine = {
  calculate(verifications) {
    if (!verifications || verifications.length === 0) return { score: null, status: 'pending', label: '— No responses' };
    const photoProofs = verifications.filter(v => v.photo_proof || v.photoProof).length;
    const videoProofs = verifications.filter(v => v.video_proof || v.videoProof).length;
    const confirms = verifications.filter(v => v.response_type === 'confirm' || v.responseType === 'confirm').length;
    const rejects = verifications.filter(v => v.response_type === 'reject' || v.responseType === 'reject').length;
    const total = verifications.length;

    const raw = (photoProofs * 4 + videoProofs * 5 + confirms * 2 - rejects * 3) / total;
    const score = Math.max(0, Math.min(raw, 10)) / 10;

    let status = 'pending', label = '⏳ Pending';
    if (score > 0.75) { status = 'verified'; label = '✅ Verified'; }
    else if (score < 0.3) { status = 'false_report'; label = '❌ False Report'; }

    return { score, status, label, photoProofs, videoProofs, confirms, rejects, total };
  },

  formatBadge(score) {
    if (score === null) return '<span class="trust-badge trust-neutral">No votes</span>';
    const pct = Math.round(score * 100);
    const cls = score > 0.75 ? 'trust-high' : score < 0.3 ? 'trust-low' : 'trust-mid';
    return `<span class="trust-badge ${cls}">🔒 Trust: ${pct}%</span>`;
  }
};

// ===============================
// PROXIMITY VERIFICATION MODULE
// ===============================

const ProximityVerification = {
  _currentHazardId: null,

  async showVerificationPanel(hazard) {
    const panel = document.getElementById('verification-panel');
    if (!panel || !AppData.isAuthenticated) { if (panel) panel.classList.add('hidden'); return; }

    this._currentHazardId = hazard.id;
    panel.classList.remove('hidden');
    panel.dataset.hazardId = hazard.id;

    // Fetch existing trust score
    this._refreshTrustDisplay(hazard.id);

    // Wire buttons
    const confirmBtn = document.getElementById('verify-confirm-btn');
    const rejectBtn = document.getElementById('verify-reject-btn');
    confirmBtn?.replaceWith(confirmBtn.cloneNode(true));
    rejectBtn?.replaceWith(rejectBtn.cloneNode(true));
    document.getElementById('verify-confirm-btn')?.addEventListener('click', () => this._submitVerification('confirm'));
    document.getElementById('verify-reject-btn')?.addEventListener('click', () => this._submitVerification('reject'));
  },

  async _refreshTrustDisplay(hazardId) {
    try {
      const res = await fetch(`${API_BASE_URL}/hazards/${hazardId}/trust-score`);
      if (!res.ok) return;
      const data = await res.json();
      const fill = document.getElementById('modal-trust-fill');
      const value = document.getElementById('modal-trust-value');
      const statsDiv = document.getElementById('verification-stats');

      if (data.score !== null && data.score !== undefined) {
        if (fill) fill.style.width = (data.score * 100) + '%';
        if (value) value.textContent = Math.round(data.score * 100) + '%';
        if (statsDiv) statsDiv.innerHTML = `
          <div class="vstat-row">
            <span>✅ Confirms: <b>${data.confirms}</b></span>
            <span>❌ Rejects: <b>${data.rejects}</b></span>
            <span>📷 Photos: <b>${data.photoProofs}</b></span>
            <span>🎥 Videos: <b>${data.videoProofs}</b></span>
          </div>
          <div class="vstat-status ${data.status}">${TrustScoreEngine.calculate(data.verifications || []).label}</div>
        `;
      } else {
        if (value) value.textContent = '–';
        if (statsDiv) statsDiv.innerHTML = '<div class="vstat-status pending">No verifications yet. Be the first!</div>';
      }
    } catch (e) { /* silent */ }
  },

  async _submitVerification(responseType) {
    if (!AppData.isAuthenticated) { UI.showAuthModal(); return; }
    const hazardId = this._currentHazardId;
    if (!hazardId) return;

    const photoInput = document.getElementById('verify-photo');
    const videoInput = document.getElementById('verify-video');
    let photoProof = null, videoProof = null;

    // Encode files as base64 data URLs (small images only — production would use file upload)
    if (photoInput?.files[0]) {
      photoProof = await this._fileToDataUrl(photoInput.files[0]);
    }
    if (videoInput?.files[0]) {
      videoProof = `video:${videoInput.files[0].name}`; // Just flag we have it
    }

    const confirmBtn = document.getElementById('verify-confirm-btn');
    const rejectBtn = document.getElementById('verify-reject-btn');
    if (confirmBtn) confirmBtn.disabled = true;
    if (rejectBtn) rejectBtn.disabled = true;

    try {
      const res = await fetch(`${API_BASE_URL}/hazards/${hazardId}/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: AppData.currentUser.id,
          responseType,
          photoProof,
          videoProof
        })
      });
      const data = await res.json();
      if (data.success) {
        UI.showToast(`Verification recorded! Trust score: ${Math.round((data.trustScore || 0) * 100)}%`, 'success');
        // Push new notification
        AppData.notifications.unshift({
          id: Date.now(), userId: AppData.currentUser.id, type: 'verification',
          title: '🔒 Verification Submitted',
          message: `You ${responseType}ed a hazard. Trust score updated.`,
          timestamp: new Date(), read: false, data: {}
        });
        AppState.notifications.unreadCount++;
        UI.updateNotificationBadge();
        this._refreshTrustDisplay(hazardId);
        // Refresh list if status changed
        if (data.newStatus !== 'pending') {
          const idx = AppData.hazards.findIndex(h => h.id === hazardId);
          if (idx !== -1) { AppData.hazards[idx].status = data.newStatus.charAt(0).toUpperCase() + data.newStatus.slice(1); }
          const fi = AppState.filteredHazards.findIndex(h => h.id === hazardId);
          if (fi !== -1) { AppState.filteredHazards[fi].status = AppData.hazards[idx]?.status || data.newStatus; }
        }
      } else {
        UI.showToast(data.message || 'Verification failed', 'error');
      }
    } catch (e) {
      // Offline fallback — update local trust score
      UI.showToast('Offline: verification recorded locally.', 'warning');
    } finally {
      if (confirmBtn) confirmBtn.disabled = false;
      if (rejectBtn) rejectBtn.disabled = false;
    }
  },

  _fileToDataUrl(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = e => resolve(e.target.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }
};

// ===============================
// HAZARD RADIUS LAYER
// ===============================

const HazardRadiusLayer = {
  RADIUS_MAP: {
    'Pothole': 10, 'Accident': 200,
    'Waterlogging': 50, 'Fallen Tree': 30,
    'Road Closure': 150, 'Stalled Vehicle': 50, 'Broken Guardrail': 75, 'Other': 25
  },
  getRadius(type) { return this.RADIUS_MAP[type] || 50; }
};

// ===============================
// RISK ZONE ENGINE (HEATMAP)
// ===============================

const RiskZoneEngine = {
  GRID: 0.01, // ~1.1 km cell
  HIGH_THRESHOLD: 10,
  MED_THRESHOLD: 5,

  computeZones(hazards) {
    const cells = {};
    const now = new Date();
    const since24h = new Date(now - 24 * 3600 * 1000);
    const since7d = new Date(now - 7 * 24 * 3600 * 1000);

    hazards.forEach(h => {
      const lat = h.location?.lat;
      const lng = h.location?.lng;
      if (!lat || !lng || (lat === 0 && lng === 0)) return;

      const cellLat = Math.floor(lat / this.GRID) * this.GRID;
      const cellLng = Math.floor(lng / this.GRID) * this.GRID;
      const key = `${cellLat.toFixed(3)}_${cellLng.toFixed(3)}`;

      if (!cells[key]) cells[key] = { cellLat, cellLng, h24: 0, acc7d: 0, unresolved: 0 };
      const c = cells[key];
      const ts = new Date(h.timestamp);
      if (ts >= since24h) c.h24++;
      if (h.type === 'Accident' && ts >= since7d) c.acc7d++;
      if (!['resolved', 'false_report', 'False_report'].includes((h.status || '').toLowerCase())) c.unresolved++;
    });

    return Object.values(cells).map(c => {
      const score = c.h24 * 2 + c.acc7d * 3 + c.unresolved;
      const level = score >= this.HIGH_THRESHOLD ? 'high' : score >= this.MED_THRESHOLD ? 'medium' : 'safe';
      return { ...c, score, level };
    }).filter(z => z.score > 0);
  },

  renderHeatmap(map, hazards) {
    // Clear previous heatmap layers
    AppState.heatmapLayers = AppState.heatmapLayers || [];

    const zones = this.computeZones(hazards);
    const COLORS = { high: 'rgba(239,68,68,0.35)', medium: 'rgba(234,179,8,0.3)', safe: 'rgba(16,185,129,0.25)' };
    const STROKES = { high: '#ef4444', medium: '#eab308', safe: '#10b981' };
    let highCount = 0;

    zones.forEach(zone => {
      const bounds = [
        [zone.cellLat, zone.cellLng],
        [zone.cellLat + this.GRID, zone.cellLng + this.GRID]
      ];
      const rect = L.rectangle(bounds, {
        color: STROKES[zone.level],
        fillColor: COLORS[zone.level],
        fillOpacity: 1,
        weight: 1,
        opacity: 0.7
      }).addTo(map);

      const label = zone.level === 'high' ? '🔴 HIGH RISK ZONE' : zone.level === 'medium' ? '🟡 Medium Risk' : '🟢 Safe';
      rect.bindTooltip(`${label}\nRisk Score: ${zone.score}\n(${zone.h24} recent · ${zone.acc7d} accidents · ${zone.unresolved} unresolved)`, { sticky: true });

      if (zone.level === 'high') {
        highCount++;
        const marker = L.marker([zone.cellLat + this.GRID / 2, zone.cellLng + this.GRID / 2], {
          icon: L.divIcon({ html: '<div class="high-risk-zone-label">🔴 HIGH RISK</div>', className: '', iconSize: [90, 24], iconAnchor: [45, 12] })
        }).addTo(map);
        AppState.heatmapLayers.push(marker);
      }

      AppState.heatmapLayers.push(rect);
    });

    const highRiskEl = document.getElementById('map-high-risk-count');
    if (highRiskEl) highRiskEl.textContent = highCount;
  }
};

// ===============================
// PROXIMITY ALERT ENGINE
// ===============================

const ProximityAlertEngine = {
  _lat: null,
  _lng: null,
  _seenHazardIds: new Set(),
  _alertQueue: [],
  _alertActive: false,
  _socket: null,           // Socket.io connection
  _locationInterval: null, // GPS refresh every 5 min
  _currentAlertHazard: null,
  _dismissTimeout: null,
  _progressInterval: null,
  LOCATION_MS: 300000,     // update location every 5 min
  BANNER_DURATION: 18000,  // 18 s before auto-dismiss
  SOCKET_URL: 'http://localhost:5000', // backend Socket.io server

  // ── Initialise after auth ──────────────────────────────────
  init() {
    if (!AppData.isAuthenticated) return;
    if (!navigator.geolocation) {
      console.warn('ProximityAlertEngine: geolocation not supported');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      pos => {
        this._lat = pos.coords.latitude;
        this._lng = pos.coords.longitude;
        this._connectSocket(); // ⚡ connect & register with socket.io
        this._pushLocation();  // sync DB location for bell notifications
        this._startLocationRefresh();
      },
      err => console.warn('Geolocation denied:', err.message),
      { enableHighAccuracy: true, timeout: 8000 }
    );
    this._wireBannerButtons();
  },

  // ── Sync GPS to DB (keeps notification bell working) ───────
  async _pushLocation() {
    if (!this._lat || !this._lng || !AppData.isAuthenticated) return;
    try {
      await fetch(`${API_BASE_URL}/hazards/user-location`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: AppData.currentUser.id,
          latitude: this._lat,
          longitude: this._lng
        })
      });
    } catch (_) { /* silent */ }
  },

  // ── Open Socket.io connection and listen for events ────────
  _connectSocket() {
    if (!window.io) {
      console.warn('Socket.io client not loaded — falling back to one-shot poll');
      this._fallbackPoll();
      return;
    }
    if (this._socket?.connected) return; // already connected

    this._socket = window.io(this.SOCKET_URL, {
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 10,
      reconnectionDelay: 2000
    });

    this._socket.on('connect', () => {
      console.log('⚡ Socket.io connected:', this._socket.id);
      // Register our GPS position so server puts us in the right zone rooms
      this._socket.emit('register_location', {
        lat: this._lat,
        lng: this._lng,
        userId: AppData.currentUser?.id
      });
    });

    // 🔔 THIS IS THE KEY EVENT — server pushes instantly when a hazard is created
    this._socket.on('new_hazard', hazard => {
      // Ignore hazards we reported ourselves
      if (hazard.reported_by === AppData.currentUser?.id) return;
      // Ignore duplicates
      if (this._seenHazardIds.has(hazard.id)) return;
      this._seenHazardIds.add(hazard.id);

      console.log('🚨 Real-time hazard received:', hazard.hazard_type, hazard.id);
      this._alertQueue.push(hazard);
      this._addToBell(hazard);
      if (!this._alertActive) this._showNextAlert();
    });

    this._socket.on('disconnect', reason => {
      console.log('Socket.io disconnected:', reason);
    });

    this._socket.on('connect_error', err => {
      console.warn('Socket.io error — falling back to one-shot poll:', err.message);
      this._fallbackPoll();
    });
  },

  // ── Fallback: single HTTP poll if socket unavailable ───────
  async _fallbackPoll() {
    if (!this._lat || !this._lng) return;
    try {
      const res = await fetch(
        `${API_BASE_URL}/hazards/nearby?lat=${this._lat}&lng=${this._lng}&radius=0.5`
      );
      const data = await res.json();
      if (!data.success) return;
      const candidates = data.hazards.filter(h =>
        h.user_id !== AppData.currentUser?.id &&
        (h.status === 'pending' || h.status === 'Pending') &&
        !this._seenHazardIds.has(h.id)
      );
      for (const hazard of candidates) {
        this._seenHazardIds.add(hazard.id);
        this._alertQueue.push(hazard);
        this._addToBell(hazard);
      }
      if (!this._alertActive && this._alertQueue.length > 0) this._showNextAlert();
    } catch (_) { /* silent */ }
  },

  // ── Refresh GPS every 5 min, update socket room ────────────
  _startLocationRefresh() {
    this._locationInterval = setInterval(() => {
      navigator.geolocation.getCurrentPosition(pos => {
        this._lat = pos.coords.latitude;
        this._lng = pos.coords.longitude;
        this._pushLocation();
        // Tell socket server our new position so we join updated rooms
        if (this._socket?.connected) {
          this._socket.emit('update_location', { lat: this._lat, lng: this._lng });
        }
      }, () => { }, { enableHighAccuracy: false, timeout: 5000 });
    }, this.LOCATION_MS);
  },

  // ── Add proximity notification to the bell --
  _addToBell(hazard) {
    const icon = UI.getHazardIcon ? UI.getHazardIcon(hazard.hazard_type || hazard.type || 'Other') : '⚠️';
    const distText = hazard.distanceKm != null ? `${Math.round(hazard.distanceKm * 1000)}m away` : 'Nearby';
    AppData.notifications.unshift({
      id: Date.now() + hazard.id,
      userId: AppData.currentUser?.id,
      type: 'proximity_verify',
      title: `${icon} New ${hazard.hazard_type || hazard.type} nearby`,
      message: `${distText} — tap to confirm or dispute`,
      timestamp: new Date(),
      read: false,
      data: { hazardId: hazard.id }
    });
    AppState.notifications.unreadCount = (AppState.notifications.unreadCount || 0) + 1;
    UI.updateNotificationBadge();
    UI.showToast(`📍 New ${hazard.hazard_type || 'hazard'} reported ${hazard.distanceKm ? Math.round(hazard.distanceKm * 1000) + 'm' : 'nearby'} — verify it!`, 'warning', '🚨 Nearby Hazard');
  },

  // ── Show the floating alert banner --
  _showNextAlert() {
    if (this._alertQueue.length === 0) { this._alertActive = false; return; }
    this._alertActive = true;
    this._currentAlertHazard = this._alertQueue.shift();

    const h = this._currentAlertHazard;
    const icon = UI.getHazardIcon ? UI.getHazardIcon(h.hazard_type || h.type || 'Other') : '⚠️';
    const distText = h.distanceKm != null ? `${Math.round(h.distanceKm * 1000)} m away` : 'Nearby';
    const sev = (h.severity || 'medium').toLowerCase();

    const banner = document.getElementById('proximity-alert-banner');
    if (!banner) { this._alertActive = false; return; }

    document.getElementById('proximity-alert-title').textContent =
      `${icon} New ${h.hazard_type || h.type || 'Hazard'} nearby!`;
    document.getElementById('proximity-alert-desc').textContent =
      h.description || 'Help the community verify this hazard.';
    document.getElementById('proximity-alert-meta').innerHTML =
      `<span class="pal-distance">📍 ${distText}</span>
       <span class="pal-severity sev-${sev}">${(h.severity || 'Medium').toUpperCase()}</span>
       <span class="pal-reporter">by ${h.reporter || 'Anonymous'}</span>`;

    banner.classList.remove('hidden', 'pal-exit');
    banner.classList.add('pal-enter');

    // Auto-dismiss with progress bar
    clearTimeout(this._dismissTimeout);
    clearInterval(this._progressInterval);
    const progressEl = document.getElementById('proximity-alert-progress');
    if (progressEl) { progressEl.style.width = '100%'; progressEl.style.transition = 'none'; }
    setTimeout(() => {
      if (progressEl) { progressEl.style.transition = `width ${this.BANNER_DURATION}ms linear`; progressEl.style.width = '0%'; }
    }, 50);

    this._dismissTimeout = setTimeout(() => this._dismissBanner(), this.BANNER_DURATION);
  },

  // ── Dismiss banner and show next if queued --
  _dismissBanner() {
    clearTimeout(this._dismissTimeout);
    clearInterval(this._progressInterval);
    const banner = document.getElementById('proximity-alert-banner');
    if (banner) {
      banner.classList.add('pal-exit');
      setTimeout(() => {
        banner.classList.add('hidden');
        banner.classList.remove('pal-enter', 'pal-exit');
        this._alertActive = false;
        if (this._alertQueue.length > 0) setTimeout(() => this._showNextAlert(), 900);
      }, 400);
    } else {
      this._alertActive = false;
    }
    this._currentAlertHazard = null;
  },

  // ── Submit witness vote from the banner --
  async _submitBannerVote(responseType) {
    if (!AppData.isAuthenticated) { UI.showAuthModal(); return; }
    const hazard = this._currentAlertHazard;
    if (!hazard) return;

    const confirmBtn = document.getElementById('proximity-confirm-btn');
    const disputeBtn = document.getElementById('proximity-dispute-btn');
    if (confirmBtn) confirmBtn.disabled = true;
    if (disputeBtn) disputeBtn.disabled = true;

    try {
      const res = await fetch(`${API_BASE_URL}/hazards/${hazard.id}/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: AppData.currentUser.id,
          responseType
        })
      });
      const data = await res.json();
      if (data.success) {
        UI.showToast(
          responseType === 'confirm'
            ? `✅ Confirmed! Trust score: ${Math.round((data.trustScore || 0) * 100)}%`
            : `❌ Dispute submitted. Thank you!`,
          'success'
        );
        // Mark the notification row read
        await this._markNotificationRead(hazard.id);
      }
    } catch (_) {
      UI.showToast('Vote recorded offline. Will sync when online.', 'info');
    } finally {
      if (confirmBtn) confirmBtn.disabled = false;
      if (disputeBtn) disputeBtn.disabled = false;
      this._dismissBanner();
    }
  },

  async _markNotificationRead(hazardId) {
    try {
      // Find notification id for this hazard
      const res = await fetch(`${API_BASE_URL}/hazards/notifications?userId=${AppData.currentUser.id}`);
      const data = await res.json();
      if (data.success) {
        const notif = data.notifications.find(n => n.hazard_id === hazardId && !n.read_at);
        if (notif) {
          await fetch(`${API_BASE_URL}/hazards/notifications/${notif.id}/read`, { method: 'PATCH' });
        }
      }
    } catch (_) { }
  },

  // ── Wire banner button events --
  _wireBannerButtons() {
    document.getElementById('proximity-alert-close')?.addEventListener('click', () => this._dismissBanner());
    document.getElementById('proximity-confirm-btn')?.addEventListener('click', () => this._submitBannerVote('confirm'));
    document.getElementById('proximity-dispute-btn')?.addEventListener('click', () => this._submitBannerVote('reject'));
    document.getElementById('proximity-view-btn')?.addEventListener('click', () => {
      const h = this._currentAlertHazard;
      this._dismissBanner();
      if (h) {
        const found = AppData.hazards.find(hz => hz.id === h.id) || AppState.filteredHazards.find(hz => hz.id === h.id);
        if (found) { UI.showHazardDetails(found); }
      }
    });
  },

  // ── Stop engine (on logout) ────────────────────────────────
  stop() {
    if (this._socket) {
      this._socket.disconnect();
      this._socket = null;
    }
    clearInterval(this._locationInterval);
    clearTimeout(this._dismissTimeout);
    this._locationInterval = null;
    this._seenHazardIds.clear();
    this._alertQueue = [];
    const banner = document.getElementById('proximity-alert-banner');
    if (banner) banner.classList.add('hidden');
    this._alertActive = false;
    console.log('ProximityAlertEngine stopped.');
  }
};


// ══════════════════════════════════════════════════════════════
//  INTELLIGENCE ENGINE — All 7 Unique Features
// ══════════════════════════════════════════════════════════════

const IntelligenceEngine = {

  // ── Feature 1: Gemini Vision Photo Analysis ────────────────────
  async analyzePhoto(imageBase64) {
    try {
      const res = await fetch(`${API_BASE_URL}/intelligence/analyze-photo`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageBase64 })
      });
      const data = await res.json();
      return data.success ? data.analysis : null;
    } catch (err) {
      console.warn('Gemini analysis failed:', err.message);
      return null;
    }
  },

  injectGeminiButton() {
    const observer = new MutationObserver(() => {
      const imgInput = document.querySelector('input[type="file"][accept*="image"]') ||
                       document.getElementById('hazard-image');
      if (imgInput && !document.getElementById('gemini-analyze-btn')) {
        const btn = document.createElement('button');
        btn.id = 'gemini-analyze-btn';
        btn.type = 'button';
        btn.className = 'gemini-btn';
        btn.innerHTML = '🤖 AI Auto-Analyze Photo';
        btn.title = 'Gemini Vision will auto-detect hazard type, severity & description';
        btn.onclick = () => this._runGeminiAnalysis(imgInput);
        imgInput.parentNode.insertBefore(btn, imgInput.nextSibling);
        imgInput.addEventListener('change', (e) => {
          if (e.target.files[0]) this._runGeminiAnalysis(imgInput);
        });
      }
    });
    observer.observe(document.body, { childList: true, subtree: true });
  },

  async _runGeminiAnalysis(imgInput) {
    if (!imgInput || !imgInput.files || !imgInput.files[0]) {
      UI.showToast('Please select a photo first', 'warning'); return;
    }
    const btn = document.getElementById('gemini-analyze-btn');
    if (btn) { btn.disabled = true; btn.innerHTML = '🤖 Analyzing...'; }
    const reader = new FileReader();
    reader.onload = async (e) => {
      const base64 = e.target.result;
      const analysis = await this.analyzePhoto(base64);
      if (btn) { btn.disabled = false; btn.innerHTML = '🤖 AI Auto-Analyze Photo'; }
      if (!analysis || !analysis.isHazard) {
        UI.showToast('AI could not detect a hazard in this image. Try a clearer photo.', 'warning'); return;
      }
      const typeSelect = document.getElementById('hazard-type') || document.querySelector('[name="hazardType"]');
      const sevSelect = document.getElementById('hazard-severity') || document.querySelector('[name="severity"]');
      const descArea = document.getElementById('hazard-description') || document.querySelector('[name="description"]');
      if (typeSelect) typeSelect.value = analysis.hazardType || '';
      if (sevSelect) sevSelect.value = analysis.severity || 'medium';
      if (descArea && !descArea.value) descArea.value = analysis.description || '';
      let resultEl = document.getElementById('gemini-result');
      if (!resultEl) {
        resultEl = document.createElement('div');
        resultEl.id = 'gemini-result';
        btn?.parentNode?.appendChild(resultEl);
      }
      const sevColor = { critical:'#ef4444',high:'#f97316',medium:'#f59e0b',low:'#10b981' };
      resultEl.innerHTML = `<div class="gemini-result-card"><div class="gemini-result-header">🤖 Gemini AI <span class="gemini-confidence">${analysis.confidence}% confident</span></div><div><b>Type:</b> ${analysis.hazardType} | <b>Severity:</b> <span style="color:${sevColor[analysis.severity]||'#888'}">${(analysis.severity||'').toUpperCase()}</span></div><div style="margin-top:6px">${analysis.description}</div><div style="margin-top:4px;color:#6b7280;font-size:.85em">💡 ${analysis.suggestedAction}</div></div>`;
      UI.showToast(`✅ AI detected: ${analysis.hazardType} (${analysis.confidence}% confidence)`, 'success', '🤖 Gemini Vision');
    };
    reader.readAsDataURL(imgInput.files[0]);
  },

  // ── Feature 2: Voice Reporting ─────────────────────────────────
  _recognition: null, _isListening: false,

  injectVoiceButton() {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) return;
    const observer = new MutationObserver(() => {
      const descArea = document.getElementById('hazard-description') || document.querySelector('[name="description"]');
      if (descArea && !document.getElementById('voice-report-btn')) {
        const btn = document.createElement('button');
        btn.id = 'voice-report-btn'; btn.type = 'button'; btn.className = 'voice-btn';
        btn.innerHTML = '🎙️ Voice'; btn.title = 'Hands-free voice reporting for drivers';
        btn.onclick = () => this._toggleVoice(descArea, btn);
        descArea.parentNode.insertBefore(btn, descArea);
      }
    });
    observer.observe(document.body, { childList: true, subtree: true });
  },

  _toggleVoice(descArea, btn) {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!this._recognition) {
      this._recognition = new SR();
      this._recognition.continuous = false; this._recognition.lang = 'en-IN'; this._recognition.interimResults = false;
      this._recognition.onresult = (e) => {
        const t = e.results[0][0].transcript;
        descArea.value = (descArea.value ? descArea.value + ' ' : '') + t;
        UI.showToast(`🎙️ Heard: "${t}"`, 'success');
      };
      this._recognition.onerror = () => { btn.innerHTML = '🎙️ Voice'; this._isListening = false; };
      this._recognition.onend = () => { btn.innerHTML = '🎙️ Voice'; btn.classList.remove('voice-active'); this._isListening = false; };
    }
    if (this._isListening) { this._recognition.stop(); this._isListening = false; }
    else {
      this._recognition.start(); this._isListening = true;
      btn.innerHTML = '🔴 Listening...'; btn.classList.add('voice-active');
      UI.showToast('🎙️ Speak your hazard description!', 'info');
    }
  },

  // ── Feature 3: Weather Risk ─────────────────────────────────────
  async loadWeatherRisk(lat, lng) {
    try {
      const res = await fetch(`${API_BASE_URL}/intelligence/weather-risk?lat=${lat}&lng=${lng}`);
      const data = await res.json();
      if (!data.success) return;
      const riskColors = { critical:'#ef4444',high:'#f97316',medium:'#f59e0b',low:'#84cc16' };
      const rc = riskColors[data.riskLevel] || '#6b7280';
      let w = document.getElementById('weather-risk-widget');
      if (!w) {
        w = document.createElement('div'); w.id = 'weather-risk-widget';
        const mapEl = document.getElementById('map');
        if (mapEl) mapEl.parentNode.insertBefore(w, mapEl);
      }
      w.innerHTML = `<div class="weather-widget" style="border-left:4px solid ${rc}"><div class="weather-header">🌤️ <b>${data.city}</b> — ${data.current.temperature}°C, ${data.current.weather} <span class="weather-risk-badge" style="background:${rc}">${data.riskLevel.toUpperCase()}</span></div>${data.riskAlerts.map(a=>`<div class="weather-alert-row">${a}</div>`).join('')}${data.affectedHazardTypes.length?`<div style="margin-top:6px">${data.affectedHazardTypes.map(t=>`<span class="weather-tag">${t}</span>`).join('')}</div>`:''}</div>`;
      if (data.riskLevel==='critical'||data.riskLevel==='high') UI.showToast(data.riskAlerts[0], 'warning', '🌧️ Weather Alert');
    } catch(e) { console.warn('Weather load failed:', e.message); }
  },

  // ── Feature 4: Authority Leaderboard ───────────────────────────
  async showLeaderboard() {
    try {
      const res = await fetch(`${API_BASE_URL}/intelligence/leaderboard`);
      const data = await res.json();
      if (!data.success) { UI.showToast('Could not load leaderboard', 'error'); return; }
      const gc = {'A+':'#10b981',A:'#84cc16',B:'#f59e0b',C:'#f97316',D:'#ef4444',F:'#7f1d1d'};
      const m = document.createElement('div');
      m.className = 'intel-modal-overlay'; m.id = 'leaderboard-modal';
      m.innerHTML = `<div class="intel-modal"><div class="intel-modal-header">🏅 Authority Accountability Leaderboard <button onclick="document.getElementById('leaderboard-modal').remove()" class="intel-modal-close">✕</button></div><div class="leaderboard-city-stats"><div class="lb-stat"><div class="lb-stat-val">${data.cityStats?.total||0}</div><div class="lb-stat-lbl">Total</div></div><div class="lb-stat"><div class="lb-stat-val" style="color:#10b981">${data.cityStats?.resolved||0}</div><div class="lb-stat-lbl">Resolved</div></div><div class="lb-stat"><div class="lb-stat-val" style="color:#f59e0b">${data.cityStats?.pending||0}</div><div class="lb-stat-lbl">Pending</div></div><div class="lb-stat"><div class="lb-stat-val" style="color:#ef4444">${data.cityStats?.critical_pending||0}</div><div class="lb-stat-lbl">Critical</div></div></div><div class="leaderboard-table-wrap"><table class="leaderboard-table"><thead><tr><th>Rank</th><th>Officer</th><th>Resolved</th><th>Pending</th><th>Avg Hours</th><th>Rate</th><th>Grade</th></tr></thead><tbody>${data.leaderboard.length===0?'<tr><td colspan="7" style="text-align:center;padding:2rem;color:#888">No officers ranked yet. Assign admin roles to see rankings.</td></tr>':data.leaderboard.map(o=>`<tr><td><b>#${o.rank}</b></td><td>${o.name}</td><td style="color:#10b981"><b>${o.resolvedCount}</b></td><td style="color:${o.pendingCount>5?'#ef4444':'#f59e0b'}">${o.pendingCount}</td><td>${o.avgResolutionHours?o.avgResolutionHours+'h':'—'}</td><td>${o.resolutionRate}%</td><td><span class="lb-grade" style="background:${gc[o.grade]||'#888'}">${o.grade}</span></td></tr>`).join('')}</tbody></table></div><p class="lb-note">🔄 Live data · Graded by resolution rate & speed</p></div>`;
      document.body.appendChild(m);
      m.addEventListener('click', e => { if(e.target===m) m.remove(); });
    } catch(_) { UI.showToast('Failed to load leaderboard','error'); }
  },

  // ── Feature 5: Post-Repair Verification ────────────────────────
  async promptRepairVerification(hazardId, hazardType) {
    if (!AppData.isAuthenticated) return;
    const m = document.createElement('div');
    m.className = 'intel-modal-overlay'; m.id = 'repair-verify-modal';
    m.innerHTML = `<div class="intel-modal repair-modal"><div style="font-size:3rem;text-align:center">🏗️</div><h3 style="text-align:center;margin:8px 0">Is the repair done?</h3><p style="text-align:center;color:#6b7280">Authorities marked <b>${hazardType}</b> as resolved.<br>Has it actually been fixed?</p><div class="repair-modal-btns"><button class="repair-yes-btn" onclick="IntelligenceEngine._submitRepairVote(${hazardId},true,this)">👍 Yes, fixed!</button><button class="repair-no-btn" onclick="IntelligenceEngine._submitRepairVote(${hazardId},false,this)">👎 No, still broken</button></div><button onclick="document.getElementById('repair-verify-modal').remove()" class="repair-skip-btn">Skip</button></div>`;
    document.body.appendChild(m);
  },

  async _submitRepairVote(hazardId, isFixed, btn) {
    if (!AppData.isAuthenticated) { UI.showAuthModal(); return; }
    btn.disabled = true;
    try {
      const res = await fetch(`${API_BASE_URL}/intelligence/repair-verify`, {
        method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ hazardId, userId: AppData.currentUser.id, isFixed })
      });
      const data = await res.json();
      document.getElementById('repair-verify-modal')?.remove();
      UI.showToast(data.message||(isFixed?'✅ Thanks for confirming!':'⚠️ Noted — hazard will be re-checked'),'success');
      if (data.newStatus==='pending') { await API.fetchHazards(); UI.renderHazardList(); }
    } catch(_) { UI.showToast('Vote recorded offline','info'); }
  },

  // ── Feature 6: Route Safety Score ──────────────────────────────
  _routePoints:[], _routeLayer:null, _routeToolActive:false, _mapClickHandler:null,

  initRouteSafetyTool() {
    const mapEl = document.getElementById('map');
    if (!mapEl || document.getElementById('route-safety-btn')) return;
    const btn = document.createElement('button');
    btn.id='route-safety-btn'; btn.className='route-safety-map-btn';
    btn.innerHTML='🛣️ Route Safety'; btn.title='Click the map to check your route safety score';
    btn.onclick=()=>this._toggleRouteTool();
    mapEl.parentNode.insertBefore(btn, mapEl);
  },

  _toggleRouteTool() {
    const btn = document.getElementById('route-safety-btn');
    if (this._routeToolActive) { this._stopRouteTool(); return; }
    this._routeToolActive=true; this._routePoints=[];
    if(btn){btn.innerHTML='🛑 Stop Route Tool';btn.classList.add('active');}
    UI.showToast('🛣️ Click on the map to add waypoints, then hit Calculate.','info');
    if (window.map) {
      this._mapClickHandler = (e) => {
        const {lat,lng} = e.latlng;
        this._routePoints.push({lat,lng});
        L.circleMarker([lat,lng],{radius:6,color:'#6366f1',fillColor:'#6366f1',fillOpacity:1}).addTo(window.map);
        if (this._routePoints.length>=2) {
          if(this._routeLayer) window.map.removeLayer(this._routeLayer);
          this._routeLayer = L.polyline(this._routePoints.map(p=>[p.lat,p.lng]),{color:'#6366f1',weight:4,opacity:.8,dashArray:'8 4'}).addTo(window.map);
        }
        if (this._routePoints.length>=2 && !document.getElementById('route-calc-btn')) {
          const c=L.control({position:'bottomleft'});
          c.onAdd=()=>{const d=L.DomUtil.create('div');d.innerHTML=`<button id="route-calc-btn" class="route-calc-btn" onclick="IntelligenceEngine._calculateRouteSafety()">📊 Calculate Safety Score</button>`;return d;};
          c.addTo(window.map);
        }
      };
      window.map.on('click',this._mapClickHandler);
    }
  },

  async _calculateRouteSafety() {
    if (this._routePoints.length<2){UI.showToast('Add at least 2 points','warning');return;}
    try {
      const res = await fetch(`${API_BASE_URL}/intelligence/route-safety`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({waypoints:this._routePoints})});
      const data = await res.json();
      if (!data.success){UI.showToast('Route calculation failed','error');return;}
      const m=document.createElement('div');m.className='intel-modal-overlay';m.id='route-safety-modal';
      m.innerHTML=`<div class="intel-modal route-modal"><div class="intel-modal-header">🛣️ Route Safety Report <button onclick="document.getElementById('route-safety-modal').remove()" class="intel-modal-close">✕</button></div><div class="route-score-display" style="border-color:${data.safetyColor}"><div class="route-score-num" style="color:${data.safetyColor}">${data.safetyScore}</div><div class="route-score-grade" style="color:${data.safetyColor}">${data.safetyGrade}</div><div class="route-score-label">/ 100 Safety Score</div></div><div class="route-advice" style="border-left:4px solid ${data.safetyColor};padding:10px 14px;margin:12px 0;background:rgba(0,0,0,.03);border-radius:6px">${data.advice}</div><div style="margin:8px 0">📏 Route: <b>${data.routeLength}km</b> · ⚠️ Hazards on route: <b>${data.totalHazardsOnRoute}</b></div>${data.hazardsOnRoute.length?`<div class="route-hazard-list">${data.hazardsOnRoute.map(h=>`<div class="route-hazard-item"><span class="sev-badge sev-${h.severity}">${h.severity}</span> ${h.hazard_type} — ${h.distanceFromRoute}m from route</div>`).join('')}</div>`:'<p style="color:#10b981;text-align:center">✅ No active hazards on this route!</p>'}</div>`;
      document.body.appendChild(m);
      m.addEventListener('click',e=>{if(e.target===m)m.remove();});
    } catch(_){UI.showToast('Route safety failed','error');}
    this._stopRouteTool();
  },

  _stopRouteTool(){
    this._routeToolActive=false;
    const btn=document.getElementById('route-safety-btn');
    if(btn){btn.innerHTML='🛣️ Route Safety';btn.classList.remove('active');}
    if(window.map&&this._mapClickHandler) window.map.off('click',this._mapClickHandler);
    document.getElementById('route-calc-btn')?.closest('.leaflet-control')?.remove();
  },

  // ── Init ────────────────────────────────────────────────────────
  init() {
    console.log('🤖 IntelligenceEngine initializing...');
    this.injectGeminiButton();
    this.injectVoiceButton();
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        pos => this.loadWeatherRisk(pos.coords.latitude, pos.coords.longitude),
        () => this.loadWeatherRisk(17.38, 78.48)
      );
    } else { this.loadWeatherRisk(17.38, 78.48); }
    setTimeout(() => {
      // Leaderboard nav button
      const nav = document.querySelector('.nav-links') || document.querySelector('nav ul');
      if (nav && !document.getElementById('leaderboard-nav-btn')) {
        const li=document.createElement('li');
        li.innerHTML=`<button id="leaderboard-nav-btn" class="nav-intel-btn" onclick="IntelligenceEngine.showLeaderboard()">🏅 Leaderboard</button>`;
        nav.appendChild(li);
      }
      this.initRouteSafetyTool();
    }, 2000);
    // Post-repair hook
    if (!window._intelligenceHookInstalled) {
      window._intelligenceHookInstalled = true;
      const orig = HazardAPI.updateHazardStatus?.bind(HazardAPI);
      if (orig) {
        HazardAPI.updateHazardStatus = async (id, status) => {
          const r = await orig(id, status);
          if (r.success && (status==='verified'||status==='resolved')) {
            const h = AppData.hazards.find(x=>x.id===id);
            setTimeout(()=>this.promptRepairVerification(id, h?.hazard_type||h?.hazardType||'Hazard'), 2000);
          }
          return r;
        };
      }
    }
    // Escalation socket listener
    if (ProximityAlertEngine._socket) {
      ProximityAlertEngine._socket.on('hazard_escalated', d => {
        UI.showToast(`📢 Hazard #${d.hazardId} escalated to ${d.levelName} (${d.daysPending} days pending)`, 'warning', '⏫ Auto-Escalation');
      });
    }
    console.log('✅ IntelligenceEngine ready — all 7 features active');
  }
};

// Auto-start after page load
document.addEventListener('DOMContentLoaded', () => {
  setTimeout(() => { if (AppData.isAuthenticated) IntelligenceEngine.init(); }, 2500);
});

// ══════════════════════════════════════════════════════════════════════════
//  IMPROVEMENT ENGINE — 8 High-Impact Features
//  1. 🌙 Dark Mode
//  2. 🆘 Emergency SOS Button
//  3. 🌐 Multi-Language Support (English / Telugu / Hindi)
//  4. 🔍 Duplicate Hazard Detection
//  5. ⏱️ SLA Badge on Hazard Cards
//  6. 🛣️ Road Quality Index Widget
//  7. 📴 Offline Report Queue
//  8. 🔔 Citizen Fix Notifications
// ══════════════════════════════════════════════════════════════════════════
const ImprovementEngine = {

  // ── LANGUAGE STRINGS ──────────────────────────────────────────────────
  lang: localStorage.getItem('hz_lang') || 'en',
  translations: {
    en: { report: '+ Report Hazard', search: 'Search hazards...', map: '🗺️ Map', list: '📋 List', dashboard: '📊 Dashboard', leaderboard: '🏅 Leaderboard', sos: '🆘 SOS', darkMode: '🌙', lightMode: '☀️', routeSafety: '🛣️ Route Safety', submit: '📤 Submit Report', cancel: 'Cancel', next: 'Next →', prev: '← Previous', voiceReport: '🎙️ Voice Report', aiAnalyze: '🤖 AI Auto-Analyze Photo' },
    te: { report: '+ ప్రమాదం నివేదించు', search: 'ప్రమాదాలు వెతకండి...', map: '🗺️ మ్యాప్', list: '📋 జాబితా', dashboard: '📊 డాష్‌బోర్డ్', leaderboard: '🏅 లీడర్‌బోర్డ్', sos: '🆘 అత్యవసర సహాయం', darkMode: '🌙', lightMode: '☀️', routeSafety: '🛣️ మార్గ సురక్షత', submit: '📤 నివేదిక సమర్పించు', cancel: 'రద్దు చేయి', next: 'తదుపరి →', prev: '← వెనుకకు', voiceReport: '🎙️ వాయిస్ నివేదిక', aiAnalyze: '🤖 AI ఫోటో విశ్లేషణ' },
    hi: { report: '+ खतरा रिपोर्ट करें', search: 'खतरे खोजें...', map: '🗺️ नक्शा', list: '📋 सूची', dashboard: '📊 डैशबोर्ड', leaderboard: '🏅 लीडरबोर्ड', sos: '🆘 आपातकालीन', darkMode: '🌙', lightMode: '☀️', routeSafety: '🛣️ मार्ग सुरक्षा', submit: '📤 रिपोर्ट जमा करें', cancel: 'रद्द करें', next: 'अगला →', prev: '← पिछला', voiceReport: '🎙️ आवाज़ रिपोर्ट', aiAnalyze: '🤖 AI फ़ोटो विश्लेषण' }
  },

  t(key) { return this.translations[this.lang]?.[key] || this.translations.en[key] || key; },

  // ── INIT ──────────────────────────────────────────────────────────────
  init() {
    this.initDarkMode();
    this.initSOSButton();
    this.initLanguageSwitcher();
    this.initOfflineQueue();
    this.initNotifications();
    this.observeHazardCards();
    console.log('✅ ImprovementEngine ready');
  },

  // ══════════════════════════════════════════════════════════════════════
  //  1. 🌙 DARK MODE
  // ══════════════════════════════════════════════════════════════════════
  initDarkMode() {
    const saved = localStorage.getItem('hz_darkmode');
    if (saved === 'true') document.documentElement.setAttribute('data-theme', 'dark');

    const btn = document.createElement('button');
    btn.id = 'dark-mode-toggle';
    btn.title = 'Toggle dark mode';
    btn.textContent = document.documentElement.getAttribute('data-theme') === 'dark' ? '☀️' : '🌙';
    btn.style.cssText = 'position:fixed;bottom:160px;right:18px;z-index:9999;width:44px;height:44px;border-radius:50%;border:none;background:#1e293b;color:#fff;font-size:18px;cursor:pointer;box-shadow:0 2px 12px rgba(0,0,0,0.3);transition:all 0.2s;';
    btn.onclick = () => {
      const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
      document.documentElement.setAttribute('data-theme', isDark ? 'light' : 'dark');
      localStorage.setItem('hz_darkmode', !isDark);
      btn.textContent = isDark ? '🌙' : '☀️';
    };
    document.body.appendChild(btn);
  },

  // ══════════════════════════════════════════════════════════════════════
  //  2. 🆘 EMERGENCY SOS BUTTON
  // ══════════════════════════════════════════════════════════════════════
  initSOSButton() {
    const btn = document.createElement('button');
    btn.id = 'sos-btn';
    btn.innerHTML = '🆘 SOS';
    btn.title = 'Emergency contacts';
    btn.style.cssText = 'position:fixed;bottom:210px;right:12px;z-index:9999;background:linear-gradient(135deg,#ef4444,#b91c1c);color:#fff;border:none;border-radius:12px;padding:10px 16px;font-weight:700;font-size:14px;cursor:pointer;box-shadow:0 4px 15px rgba(239,68,68,0.5);animation:sos-pulse 2s infinite;';
    btn.onclick = () => this.showSOSModal();
    document.body.appendChild(btn);

    // Pulse animation
    if (!document.getElementById('sos-style')) {
      const style = document.createElement('style');
      style.id = 'sos-style';
      style.textContent = `
        @keyframes sos-pulse { 0%,100%{box-shadow:0 4px 15px rgba(239,68,68,0.5)} 50%{box-shadow:0 4px 25px rgba(239,68,68,0.9)} }
        [data-theme="dark"] { --bg:#0f172a;--card-bg:#1e293b;--text:#e2e8f0;--border:#334155;--input-bg:#1e293b;--nav-bg:#0f172a; }
        [data-theme="dark"] body { background:var(--bg)!important; color:var(--text)!important; }
        [data-theme="dark"] .card, [data-theme="dark"] .modal-content, [data-theme="dark"] .admin-panel, [data-theme="dark"] header { background:var(--card-bg)!important; color:var(--text)!important; border-color:var(--border)!important; }
        [data-theme="dark"] input, [data-theme="dark"] select, [data-theme="dark"] textarea { background:var(--input-bg)!important; color:var(--text)!important; border-color:var(--border)!important; }
        [data-theme="dark"] .nav-btn { color:var(--text)!important; }
        [data-theme="dark"] .stat-card { background:var(--card-bg)!important; }
        [data-theme="dark"] .hazard-list-item { background:var(--card-bg)!important; border-color:var(--border)!important; }
        [data-theme="dark"] table { background:var(--card-bg)!important; color:var(--text)!important; }
        .lang-switcher { display:flex;gap:4px;align-items:center; }
        .lang-btn { padding:4px 10px;border-radius:8px;border:1px solid #cbd5e1;background:transparent;cursor:pointer;font-size:12px;font-weight:600; }
        .lang-btn.active { background:#21808d;color:#fff;border-color:#21808d; }
        .sla-badge { display:inline-block;padding:2px 8px;border-radius:20px;font-size:11px;font-weight:700;margin-left:6px; }
        .sla-overdue { background:#fee2e2;color:#dc2626; }
        .sla-due-soon { background:#fff7ed;color:#ea580c; }
        .sla-on-track { background:#dcfce7;color:#16a34a; }
        .duplicate-warning { background:#fef3c7;border:1px solid #f59e0b;border-radius:10px;padding:12px 16px;margin:10px 0;font-size:13px; }
        .road-quality-widget { background:linear-gradient(135deg,#1e293b,#0f172a);color:#fff;border-radius:14px;padding:14px 18px;margin:8px 0;display:flex;align-items:center;gap:12px; }
        .rq-grade { font-size:36px;font-weight:900;line-height:1; }
        .notification-item { padding:10px 14px;border-bottom:1px solid #e2e8f0;font-size:13px; }
        .notification-item.unread { background:#eff6ff; }
        .offline-badge { background:#64748b;color:#fff;padding:3px 10px;border-radius:20px;font-size:11px;font-weight:700; }
      `;
      document.head.appendChild(style);
    }
  },

  showSOSModal() {
    const existing = document.getElementById('sos-modal');
    if (existing) existing.remove();

    const modal = document.createElement('div');
    modal.id = 'sos-modal';
    modal.style.cssText = 'position:fixed;inset:0;z-index:99999;background:rgba(0,0,0,0.7);display:flex;align-items:center;justify-content:center;';
    modal.innerHTML = `
      <div style="background:#fff;border-radius:20px;padding:28px;max-width:340px;width:90%;box-shadow:0 20px 60px rgba(0,0,0,0.4);">
        <div style="text-align:center;margin-bottom:20px;">
          <div style="font-size:48px;">🆘</div>
          <h2 style="font-size:20px;font-weight:800;color:#dc2626;margin:8px 0 4px;">Emergency Contacts</h2>
          <p style="font-size:13px;color:#64748b;">Tap to call instantly</p>
        </div>
        <div style="display:flex;flex-direction:column;gap:10px;">
          <a href="tel:112" style="display:flex;align-items:center;gap:12px;background:#fee2e2;padding:14px;border-radius:12px;text-decoration:none;color:#dc2626;font-weight:700;font-size:15px;">
            🚨 <span>112 — National Emergency</span>
          </a>
          <a href="tel:100" style="display:flex;align-items:center;gap:12px;background:#dbeafe;padding:14px;border-radius:12px;text-decoration:none;color:#1d4ed8;font-weight:700;font-size:15px;">
            👮 <span>100 — Police</span>
          </a>
          <a href="tel:108" style="display:flex;align-items:center;gap:12px;background:#dcfce7;padding:14px;border-radius:12px;text-decoration:none;color:#15803d;font-weight:700;font-size:15px;">
            🚑 <span>108 — Ambulance</span>
          </a>
          <a href="tel:101" style="display:flex;align-items:center;gap:12px;background:#fff7ed;padding:14px;border-radius:12px;text-decoration:none;color:#c2410c;font-weight:700;font-size:15px;">
            🚒 <span>101 — Fire Department</span>
          </a>
          <a href="tel:04021111111" style="display:flex;align-items:center;gap:12px;background:#f3e8ff;padding:14px;border-radius:12px;text-decoration:none;color:#7c3aed;font-weight:700;font-size:15px;">
            🏛️ <span>GHMC — 040-2111-1111</span>
          </a>
        </div>
        <button onclick="document.getElementById('sos-modal').remove()" style="width:100%;margin-top:16px;padding:12px;background:#f1f5f9;border:none;border-radius:12px;cursor:pointer;font-weight:600;font-size:14px;">✕ Close</button>
      </div>
    `;
    document.body.appendChild(modal);
    modal.addEventListener('click', e => { if (e.target === modal) modal.remove(); });
  },

  // ══════════════════════════════════════════════════════════════════════
  //  3. 🌐 MULTI-LANGUAGE SWITCHER
  // ══════════════════════════════════════════════════════════════════════
  initLanguageSwitcher() {
    const nav = document.querySelector('.desktop-nav');
    if (!nav) return;

    const switcher = document.createElement('div');
    switcher.className = 'lang-switcher';
    switcher.id = 'lang-switcher';
    ['en', 'te', 'hi'].forEach(code => {
      const btn = document.createElement('button');
      btn.className = `lang-btn ${this.lang === code ? 'active' : ''}`;
      btn.dataset.lang = code;
      btn.textContent = code === 'en' ? 'EN' : code === 'te' ? 'తె' : 'हि';
      btn.title = code === 'en' ? 'English' : code === 'te' ? 'Telugu' : 'Hindi';
      btn.onclick = () => this.setLanguage(code);
      switcher.appendChild(btn);
    });

    // Insert before user menu
    const userMenu = nav.querySelector('#user-menu');
    if (userMenu) nav.insertBefore(switcher, userMenu);
    else nav.appendChild(switcher);
  },

  setLanguage(code) {
    this.lang = code;
    localStorage.setItem('hz_lang', code);
    document.querySelectorAll('.lang-btn').forEach(b => b.classList.toggle('active', b.dataset.lang === code));
    this.applyLanguage();
    // Delegate to comprehensive I18N module
    if (window.I18N) {
      window.I18N.setLanguage(code);
    }
  },

  applyLanguage() {
    const t = this.t.bind(this);
    // These specific report-modal elements aren't covered by I18N because they're deeply dynamic
    const map = {
      '#report-hazard-btn': t('report'),
      '#global-search': null, // placeholder only
      '#voice-report-btn': t('voiceReport'),
      '#gemini-analyze-btn': t('aiAnalyze'),
      '#sos-btn': t('sos'),
      '#route-safety-btn': t('routeSafety'),
      '#submit-report': t('submit'),
      '#cancel-report': t('cancel'),
      '#next-step': t('next'),
      '#prev-step': t('prev'),
    };

    Object.entries(map).forEach(([sel, val]) => {
      if (!val) return;
      const el = document.querySelector(sel);
      if (el) el.textContent = val;
    });
    const search = document.querySelector('#global-search');
    if (search) search.placeholder = t('search');
  },

  // ══════════════════════════════════════════════════════════════════════
  //  4. 🔍 DUPLICATE DETECTION (called from report form)
  // ══════════════════════════════════════════════════════════════════════
  async checkDuplicate(lat, lng, type) {
    try {
      const res = await fetch(
        `${window.API_BASE || 'http://localhost:5000'}/api/intelligence/check-duplicate?lat=${lat}&lng=${lng}&type=${encodeURIComponent(type)}&radius=150`
      );
      const data = await res.json();
      if (data.isDuplicate) {
        return data;
      }
      return null;
    } catch {
      return null;
    }
  },

  showDuplicateWarning(container, dupData) {
    const existing = container.querySelector('.duplicate-warning');
    if (existing) existing.remove();
    if (!dupData) return;

    const div = document.createElement('div');
    div.className = 'duplicate-warning';
    div.innerHTML = `
      <strong>⚠️ ${dupData.count} similar hazard(s) already reported ${dupData.existing[0]?.distanceM}m away!</strong><br>
      <small>Type: ${dupData.existing[0]?.type} | Severity: ${dupData.existing[0]?.severity} | ${dupData.existing[0]?.daysOld} day(s) ago | 👍 ${dupData.existing[0]?.upvotes || 0} upvotes</small><br>
      <span style="color:#92400e;font-size:12px;">Consider upvoting the existing report instead of creating a duplicate.</span>
    `;
    container.insertBefore(div, container.firstChild);
  },

  // ══════════════════════════════════════════════════════════════════════
  //  5. ⏱️ SLA BADGE on hazard cards
  // ══════════════════════════════════════════════════════════════════════
  observeHazardCards() {
    const observer = new MutationObserver(mutations => {
      mutations.forEach(m => {
        m.addedNodes.forEach(node => {
          if (node.nodeType === 1) {
            const cards = node.querySelectorAll ? node.querySelectorAll('[data-hazard-id]') : [];
            cards.forEach(card => this.addSLAbadge(card));
            if (node.dataset?.hazardId) this.addSLAbadge(node);
          }
        });
      });
    });
    observer.observe(document.body, { childList: true, subtree: true });
  },

  async addSLAbadge(card) {
    const hazardId = card.dataset.hazardId;
    if (!hazardId || card.dataset.slaLoaded) return;
    card.dataset.slaLoaded = '1';
    try {
      const res = await fetch(`${window.API_BASE || 'http://localhost:5000'}/api/intelligence/sla/${hazardId}`);
      const data = await res.json();
      if (!data.success || data.isResolved) return;
      const badge = document.createElement('span');
      badge.className = `sla-badge ${data.isBreached ? 'sla-overdue' : data.percentUsed > 75 ? 'sla-due-soon' : 'sla-on-track'}`;
      badge.textContent = data.badge;
      badge.title = `SLA: ${data.hoursRemaining}h ${data.isBreached ? 'overdue' : 'remaining'}`;
      const statusEl = card.querySelector('.hazard-status') || card.querySelector('.badge') || card;
      statusEl.appendChild(badge);
    } catch {}
  },

  // ══════════════════════════════════════════════════════════════════════
  //  6. 🛣️ ROAD QUALITY INDEX WIDGET
  // ══════════════════════════════════════════════════════════════════════
  async initRoadQualityWidget() {
    // Wait for map and user location
    await new Promise(r => setTimeout(r, 3000));
    const lat = AppState?.userLocation?.lat || 17.38;
    const lng = AppState?.userLocation?.lng || 78.48;
    this.updateRoadQualityWidget(lat, lng);
  },

  async updateRoadQualityWidget(lat, lng) {
    try {
      const res = await fetch(
        `${window.API_BASE || 'http://localhost:5000'}/api/intelligence/road-quality?lat=${lat}&lng=${lng}&radius=1000`
      );
      const data = await res.json();
      if (!data.success) return;

      let widget = document.getElementById('road-quality-widget');
      if (!widget) {
        widget = document.createElement('div');
        widget.id = 'road-quality-widget';
        widget.className = 'road-quality-widget';
        const mapControls = document.querySelector('.map-controls, .layers-control, #map');
        if (mapControls) mapControls.parentNode.insertBefore(widget, mapControls);
      }

      widget.innerHTML = `
        <div class="rq-grade" style="color:${data.color};">${data.grade}</div>
        <div>
          <div style="font-weight:700;font-size:14px;">Road Quality: ${data.label}</div>
          <div style="font-size:12px;opacity:0.85;">${data.advice}</div>
          <div style="font-size:11px;margin-top:3px;opacity:0.7;">${data.totalHazards} active hazards within 1km radius</div>
        </div>
      `;
    } catch {}
  },

  // ══════════════════════════════════════════════════════════════════════
  //  7. 📴 OFFLINE REPORT QUEUE
  // ══════════════════════════════════════════════════════════════════════
  initOfflineQueue() {
    window.addEventListener('online', () => this.flushOfflineQueue());
    window.addEventListener('offline', () => {
      UI.showToast('📴 You are offline. Reports will be saved and submitted automatically when you reconnect.', 'warning', 'Offline Mode');
    });
  },

  async saveOfflineReport(reportData) {
    const queue = JSON.parse(localStorage.getItem('hz_offline_queue') || '[]');
    queue.push({ ...reportData, savedAt: new Date().toISOString() });
    localStorage.setItem('hz_offline_queue', JSON.stringify(queue));
    UI.showToast(`📴 Saved offline — will submit when connected (${queue.length} queued)`, 'warning', 'Offline Queue');
  },

  async flushOfflineQueue() {
    const queue = JSON.parse(localStorage.getItem('hz_offline_queue') || '[]');
    if (!queue.length) return;

    UI.showToast(`📶 Back online! Submitting ${queue.length} queued report(s)...`, 'info', 'Offline Queue');

    let submitted = 0;
    for (const report of queue) {
      try {
        const res = await fetch(`${window.API_BASE || 'http://localhost:5000'}/api/hazards`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(report)
        });
        if (res.ok) submitted++;
      } catch {}
    }

    localStorage.setItem('hz_offline_queue', JSON.stringify(
      queue.slice(submitted) // Remove successfully submitted ones
    ));

    if (submitted > 0) {
      UI.showToast(`✅ ${submitted} offline report(s) submitted successfully!`, 'success', 'Offline Queue');
    }
  },

  // ══════════════════════════════════════════════════════════════════════
  //  8. 🔔 CITIZEN FIX NOTIFICATIONS
  // ══════════════════════════════════════════════════════════════════════
  initNotifications() {
    if (!AppData.currentUser?.id) return;
    this.fetchNotifications();
    setInterval(() => this.fetchNotifications(), 30000); // check every 30s
  },

  async fetchNotifications() {
    if (!AppData.currentUser?.id) return;
    try {
      const res = await fetch(
        `${window.API_BASE || 'http://localhost:5000'}/api/intelligence/notifications/${AppData.currentUser.id}`
      );
      const data = await res.json();
      if (!data.success) return;

      // Update notification bell count
      const bell = document.getElementById('notification-count');
      if (bell && data.unreadCount > 0) {
        bell.textContent = data.unreadCount;
        bell.style.background = '#ef4444';

        // Show toast for new notifications
        const latest = data.notifications.find(n => !n.is_read);
        if (latest && !this._lastNotifId) {
          UI.showToast(latest.message, 'success', '🔔 Hazard Update');
        }
        this._lastNotifId = data.notifications[0]?.id;
      }

      // Add click handler to show notification panel
      const bellEl = document.getElementById('notification-bell');
    } catch {}
  }
};

// ── Wire duplicate check into report form ────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  // Always available features (no login required)
  ImprovementEngine.initDarkMode();
  ImprovementEngine.initSOSButton();
  ImprovementEngine.initLanguageSwitcher();
  ImprovementEngine.initOfflineQueue();

  // Intercept Next button on step 1 to check duplicates
  setTimeout(() => {
    const nextBtn = document.getElementById('next-step');
    if (nextBtn && !nextBtn.dataset.dupBound) {
      nextBtn.dataset.dupBound = '1';
      nextBtn.addEventListener('click', async () => {
        const step = AppState?.reportForm?.step || 1;
        if (step !== 1) return;
        const loc = AppState?.reportForm?.data?.location;
        const type = AppState?.reportForm?.data?.type;
        if (!loc?.lat || !type) return;

        const dup = await ImprovementEngine.checkDuplicate(loc.lat, loc.lng, type);
        if (dup) {
          const formBody = document.querySelector('.modal-body .form-step:not([style*="none"])');
          if (formBody) ImprovementEngine.showDuplicateWarning(formBody, dup);
        }
      });
    }
  }, 3000);

  // Auth-gated features: Notifications
  const checkAuth = setInterval(() => {
    if (AppData.isAuthenticated && AppData.currentUser) {
      clearInterval(checkAuth);
      setTimeout(() => {
        ImprovementEngine.initNotifications();
        ImprovementEngine.observeHazardCards();
        console.log('✅ ImprovementEngine auth features activated');
      }, 1000);
    }
  }, 2000);
});


