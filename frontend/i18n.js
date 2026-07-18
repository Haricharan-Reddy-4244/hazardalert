// ════════════════════════════════════════════════════════════════════════
//  i18n.js — Comprehensive Internationalization for HazardAlert
//  Supports: English (en), Telugu (te), Hindi (hi)
//  Usage: Add data-i18n="key" to any HTML element, or data-i18n-placeholder="key" for placeholders
// ════════════════════════════════════════════════════════════════════════

const I18N = {
  _currentLang: localStorage.getItem('hz_lang') || 'en',

  strings: {
    // ── Header & Navigation ─────────────────────────────────────────
    en: {
      // Nav
      map: 'Map',
      list: 'List',
      dashboard: 'Dashboard',
      profile: 'Profile',
      mapView: '📍 Map View',
      listView: '📋 List View',
      myProfile: '👤 My Profile',
      settings: '⚙️ Settings',
      signOut: '🚪 Sign Out',
      signIn: 'Sign In',
      signUp: 'Sign Up',
      headerSignIn: 'Sign In',

      // Search
      searchHazards: 'Search hazards...',
      searchByLocation: '🔍 Search by location...',
      searchUsers: '🔍 Search users...',

      // Auth Modal
      authSignIn: 'Sign In',
      authSignUp: 'Sign Up',
      email: 'Email',
      password: 'Password',
      username: 'Username',
      enterEmail: 'Enter your email',
      enterPassword: 'Enter your password',
      chooseUsername: 'Choose a username',
      createPassword: 'Create a password',
      dontHaveAccount: "Don't have an account?",
      alreadyHaveAccount: 'Already have an account?',

      // User Menu
      myAccount: 'MY ACCOUNT',
      viewProfile: 'View Profile',
      logout: 'Logout',

      // Map View
      liveHazardMap: '🌍 Live Hazard Map',
      liveUpdates: 'Live Updates',
      allTypes: 'All Types',
      pothole: '🕳️ Pothole',
      accident: '🚗 Accident',
      fallenTree: '🌳 Fallen Tree',
      waterlogging: '🌊 Waterlogging',
      roadClosure: '🚧 Road Closure',
      stalledVehicle: '🚙 Stalled Vehicle',
      brokenGuardrail: '🛡️ Broken Guardrail',
      other: '⚠️ Other',
      allSeverities: 'All Severities',
      low: '🟢 Low',
      medium: '🟡 Medium',
      high: '🟠 High',
      critical: '🔴 Critical',
      refresh: '🔄 Refresh',
      aiScan: '🤖 AI Scan',

      // Hero Stats
      totalHazards: 'Total Hazards',
      criticalLabel: 'Critical',
      highRiskZones: 'High Risk Zones',
      verified: 'Verified',

      // Map Controls
      layers: 'Layers:',
      markers: 'Markers',
      dangerZones: 'Danger Zones',
      riskHeatmap: 'Risk Heatmap',

      // Legend
      legend: '🗺️ Legend',
      severity: 'Severity',
      riskHeatmapLegend: 'Risk Heatmap',
      highRisk: 'High Risk',
      safe: 'Safe',
      dangerRadius: 'Danger Radius',

      // List View
      hazardReports: '📋 Hazard Reports',
      showingResults: 'Showing',
      results: 'results',
      grid: '⊞ Grid',
      listToggle: '☰ List',
      newestFirst: 'Newest First',
      oldestFirst: 'Oldest First',
      bySeverity: 'By Severity',
      mostUpvoted: 'Most Upvoted',
      allStatus: 'All Status',
      pending: '⏳ Pending',
      verifiedStatus: '✅ Verified',
      disputed: '❌ Disputed',
      resolved: '🏁 Resolved',
      clearAll: 'Clear All',
      previousPage: '← Previous',
      nextPage: 'Next →',

      // Admin Dashboard
      adminDashboard: 'Admin Dashboard',
      controlCenter: 'HazardAlert Control Center',
      exportCsv: 'Export CSV',
      totalReports: 'Total Reports',
      allTime: 'All time',
      verifiedLabel: 'Verified',
      communityConfirmed: 'Community confirmed',
      pendingReview: 'Pending Review',
      awaitingAction: 'Awaiting action',
      disputedLabel: 'Disputed',
      flaggedForReview: 'Flagged for review',
      totalUsers: 'Total Users',
      registeredAccounts: 'Registered accounts',
      activeReporters: 'Active Reporters',
      reportsByType: '📈 Reports by Type',
      weeklyActivity: '📅 Weekly Activity',
      recentHazardReports: '⚠️ Recent Hazard Reports',
      reports: 'reports',
      hazard: 'Hazard',
      location: 'Location',
      reporter: 'Reporter',
      status: 'Status',
      time: 'Time',
      votes: 'Votes',
      actions: 'Actions',
      loadingReports: 'Loading reports...',
      bulkVerify: '✅ Bulk Verify',
      autoVerify: '🤖 Auto-Verify',
      userManagement: '👥 User Management',
      loadingUsers: 'Loading users...',

      // Profile
      profileTitle: '👤 My Profile',
      editProfile: '✏️ Edit Profile',
      communityReporter: 'Community Reporter',
      trustScore: 'Trust Score',
      reportsSubmitted: 'Reports Submitted',
      upvotesReceived: 'Upvotes Received',
      accuracyRate: 'Accuracy Rate',
      responseTime: 'Response Time',
      achievements: '🏆 Achievements',
      activityTimeline: '📈 Activity Timeline',
      impactSummary: '📊 Impact Summary',
      hazardsResolved: 'Hazards Resolved',
      peopleHelped: 'People Helped',
      communityRating: 'Community Rating',

      // FABs
      aiScanFab: 'AI Scan',
      reportHazard: 'Report Hazard',

      // Proximity Alert
      nearbyHazard: 'New hazard reported nearby!',
      helpVerify: 'Help verify this hazard to keep your community safe.',
      confirm: '✅ Confirm',
      dispute: '❌ Dispute',
      view: 'View →',

      // PWA
      installApp: 'Install HazardAlert',
      installDesc: 'Get instant access to report hazards offline',
      install: 'Install',
      later: 'Later',

      // SOS
      sos: '🆘 SOS',

      // Report Modal
      reportTitle: 'Report a Hazard',
      submit: '📤 Submit Report',
      cancel: 'Cancel',
      next: 'Next →',
      prev: '← Previous',

      // Voice
      voiceReport: '🎙️ Voice Report',
      aiAnalyze: '🤖 AI Auto-Analyze Photo',

      // Misc
      guestUser: 'Guest User',
      connecting: 'Connecting...',
      accountSettings: 'Account Settings',
      systemPreferences: 'System Preferences',

      // Route Safety
      routeSafety: '🛣️ Route Safety',

      // Leaderboard
      leaderboard: '🏅 Leaderboard',

      // Dark Mode
      darkMode: '🌙',
      lightMode: '☀️',

      // Notification
      enableAlerts: '🔔 Enable Alerts',
      alertsActive: '🔔 Alerts Active',

      // Dynamic Nav Buttons (injected by JS engines)
      myScore: '🏆 My Score',
      shameBoard: '🔥 Shame Board',
      priorityQueue: '🚨 Priority Queue',
      fileRti: '📋 File RTI',
      qrSticker: '📱 QR Sticker',
      emailGhmc: '📧 Email GHMC',

      // Govt Accountability Card
      govtAccountability: '🏛️ Govt. Accountability Score',
      economicDamage: '🔥 Economic Damage Estimate',

      // Map Action Buttons
      tapToReport: '📍 Tap to Report',
      safeRoute: 'Safe Route',
      voiceAlerts: 'Voice Alerts',
      dark: 'Dark',
      street: 'Street',
      satellite: 'Satellite',
      heatmap: 'Heatmap',
      wards: 'Wards',
      replay: 'Replay',
      searchLocationHyd: 'Search location in Hyderabad...',

      // City Health Score
      cityHealthScore: 'City Health Score',
      cityHealthCritical: 'CRITICAL'
    },

    te: {
      // Nav
      map: 'మ్యాప్',
      list: 'జాబితా',
      dashboard: 'డాష్‌బోర్డ్',
      profile: 'ప్రొఫైల్',
      mapView: '📍 మ్యాప్ వీక్షణ',
      listView: '📋 జాబితా వీక్షణ',
      myProfile: '👤 నా ప్రొఫైల్',
      settings: '⚙️ సెట్టింగ్స్',
      signOut: '🚪 లాగ్ అవుట్',
      signIn: 'సైన్ ఇన్',
      signUp: 'సైన్ అప్',
      headerSignIn: 'సైన్ ఇన్',

      // Search
      searchHazards: 'ప్రమాదాలు వెతకండి...',
      searchByLocation: '🔍 ప్రదేశం ద్వారా వెతకండి...',
      searchUsers: '🔍 వినియోగదారులను వెతకండి...',

      // Auth Modal
      authSignIn: 'సైన్ ఇన్',
      authSignUp: 'సైన్ అప్',
      email: 'ఇమెయిల్',
      password: 'పాస్‌వర్డ్',
      username: 'వినియోగదారు పేరు',
      enterEmail: 'మీ ఇమెయిల్ నమోదు చేయండి',
      enterPassword: 'మీ పాస్‌వర్డ్ నమోదు చేయండి',
      chooseUsername: 'వినియోగదారు పేరు ఎంచుకోండి',
      createPassword: 'పాస్‌వర్డ్ సృష్టించండి',
      dontHaveAccount: 'ఖాతా లేదా?',
      alreadyHaveAccount: 'ఇప్పటికే ఖాతా ఉందా?',

      // User Menu
      myAccount: 'నా ఖాతా',
      viewProfile: 'ప్రొఫైల్ చూడండి',
      logout: 'లాగ్ అవుట్',
      settings: '⚙️ సెట్టింగ్స్',

      // Map View
      liveHazardMap: '🌍 ప్రత్యక్ష ప్రమాద మ్యాప్',
      liveUpdates: 'ప్రత్యక్ష నవీకరణలు',
      allTypes: 'అన్ని రకాలు',
      pothole: '🕳️ గుంత',
      accident: '🚗 ప్రమాదం',
      fallenTree: '🌳 పడిన చెట్టు',
      waterlogging: '🌊 నీటి నిల్వ',
      roadClosure: '🚧 రోడ్ మూసివేత',
      stalledVehicle: '🚙 ఆగిపోయిన వాహనం',
      brokenGuardrail: '🛡️ విరిగిన గార్డ్‌రైల్',
      other: '⚠️ ఇతరం',
      allSeverities: 'అన్ని తీవ్రతలు',
      low: '🟢 తక్కువ',
      medium: '🟡 మధ్యస్థం',
      high: '🟠 ఎక్కువ',
      critical: '🔴 క్రిటికల్',
      refresh: '🔄 రిఫ్రెష్',
      aiScan: '🤖 AI స్కాన్',

      // Hero Stats
      totalHazards: 'మొత్తం ప్రమాదాలు',
      criticalLabel: 'క్రిటికల్',
      highRiskZones: 'అధిక ప్రమాద జోన్లు',
      verified: 'ధృవీకరించబడినవి',

      // Map Controls
      layers: 'లేయర్లు:',
      markers: 'మార్కర్లు',
      dangerZones: 'ప్రమాద జోన్లు',
      riskHeatmap: 'రిస్క్ హీట్‌మ్యాప్',

      // Legend
      legend: '🗺️ లెజెండ్',
      severity: 'తీవ్రత',
      riskHeatmapLegend: 'రిస్క్ హీట్‌మ్యాప్',
      highRisk: 'అధిక ప్రమాదం',
      safe: 'సురక్షితం',
      dangerRadius: 'ప్రమాద వ్యాసార్ధం',

      // List View
      hazardReports: '📋 ప్రమాద నివేదికలు',
      showingResults: 'చూపుతోంది',
      results: 'ఫలితాలు',
      grid: '⊞ గ్రిడ్',
      listToggle: '☰ జాబితా',
      newestFirst: 'కొత్తవి ముందుగా',
      oldestFirst: 'పాతవి ముందుగా',
      bySeverity: 'తీవ్రత ప్రకారం',
      mostUpvoted: 'ఎక్కువ ఓట్లు',
      allStatus: 'అన్ని స్థితులు',
      pending: '⏳ పెండింగ్',
      verifiedStatus: '✅ ధృవీకరించబడింది',
      disputed: '❌ వివాదం',
      resolved: '🏁 పరిష్కరించబడింది',
      clearAll: 'అన్నీ క్లియర్ చేయి',
      previousPage: '← మునుపటి',
      nextPage: 'తదుపరి →',

      // Admin Dashboard
      adminDashboard: 'అడ్మిన్ డాష్‌బోర్డ్',
      controlCenter: 'హజార్డ్ అలర్ట్ నియంత్రణ కేంద్రం',
      exportCsv: 'CSV ఎగుమతి',
      totalReports: 'మొత్తం నివేదికలు',
      allTime: 'మొత్తం సమయం',
      verifiedLabel: 'ధృవీకరించబడినవి',
      communityConfirmed: 'సమాజం ధృవీకరించింది',
      pendingReview: 'సమీక్ష పెండింగ్',
      awaitingAction: 'చర్య కోసం వేచి ఉంది',
      disputedLabel: 'వివాదాలు',
      flaggedForReview: 'సమీక్ష కోసం ఫ్లాగ్ చేయబడింది',
      totalUsers: 'మొత్తం వినియోగదారులు',
      registeredAccounts: 'నమోదిత ఖాతాలు',
      activeReporters: 'క్రియాశీల రిపోర్టర్లు',
      reportsByType: '📈 రకం ప్రకారం నివేదికలు',
      weeklyActivity: '📅 వారపు కార్యకలాపం',
      recentHazardReports: '⚠️ ఇటీవలి ప్రమాద నివేదికలు',
      reports: 'నివేదికలు',
      hazard: 'ప్రమాదం',
      location: 'ప్రదేశం',
      reporter: 'రిపోర్టర్',
      status: 'స్థితి',
      time: 'సమయం',
      votes: 'ఓట్లు',
      actions: 'చర్యలు',
      loadingReports: 'నివేదికలు లోడ్ అవుతున్నాయి...',
      bulkVerify: '✅ బల్క్ ధృవీకరణ',
      autoVerify: '🤖 ఆటో-ధృవీకరణ',
      userManagement: '👥 వినియోగదారు నిర్వహణ',
      loadingUsers: 'వినియోగదారులు లోడ్ అవుతున్నారు...',

      // Profile
      profileTitle: '👤 నా ప్రొఫైల్',
      editProfile: '✏️ ప్రొఫైల్ మార్చు',
      communityReporter: 'సమాజ రిపోర్టర్',
      trustScore: 'నమ్మకం స్కోర్',
      reportsSubmitted: 'సమర్పించిన నివేదికలు',
      upvotesReceived: 'అందుకున్న అప్‌వోట్లు',
      accuracyRate: 'ఖచ్చితత్వ రేటు',
      responseTime: 'ప్రతిస్పందన సమయం',
      achievements: '🏆 సాధనలు',
      activityTimeline: '📈 కార్యకలాపాల టైమ్‌లైన్',
      impactSummary: '📊 ప్రభావ సారాంశం',
      hazardsResolved: 'పరిష్కరించిన ప్రమాదాలు',
      peopleHelped: 'సహాయం అందించిన వ్యక్తులు',
      communityRating: 'సమాజ రేటింగ్',

      // FABs
      aiScanFab: 'AI స్కాన్',
      reportHazard: 'ప్రమాదం నివేదించు',

      // Proximity Alert
      nearbyHazard: 'సమీపంలో కొత్త ప్రమాదం నివేదించబడింది!',
      helpVerify: 'మీ సమాజాన్ని సురక్షితంగా ఉంచడానికి ఈ ప్రమాదాన్ని ధృవీకరించండి.',
      confirm: '✅ ధృవీకరించు',
      dispute: '❌ వివాదించు',
      view: 'చూడండి →',

      // PWA
      installApp: 'హజార్డ్ అలర్ట్ ఇన్‌స్టాల్ చేయండి',
      installDesc: 'ఆఫ్‌లైన్‌లో ప్రమాదాలను నివేదించడానికి తక్షణ ప్రాప్యత పొందండి',
      install: 'ఇన్‌స్టాల్',
      later: 'తర్వాత',

      // SOS
      sos: '🆘 అత్యవసర సహాయం',

      // Report Modal
      reportTitle: 'ప్రమాదం నివేదించు',
      submit: '📤 నివేదిక సమర్పించు',
      cancel: 'రద్దు చేయి',
      next: 'తదుపరి →',
      prev: '← వెనుకకు',

      // Voice
      voiceReport: '🎙️ వాయిస్ నివేదిక',
      aiAnalyze: '🤖 AI ఫోటో విశ్లేషణ',

      // Misc
      guestUser: 'అతిథి వినియోగదారు',
      connecting: 'కనెక్ట్ అవుతోంది...',
      accountSettings: 'ఖాతా సెట్టింగ్స్',
      systemPreferences: 'సిస్టమ్ ప్రాధాన్యతలు',

      // Route Safety
      routeSafety: '🛣️ మార్గ సురక్షత',

      // Leaderboard
      leaderboard: '🏅 లీడర్‌బోర్డ్',

      // Dark Mode
      darkMode: '🌙',
      lightMode: '☀️',

      // Notification
      enableAlerts: '🔔 అలర్ట్‌లు ఆన్ చేయండి',
      alertsActive: '🔔 అలర్ట్‌లు యాక్టివ్',

      // Dynamic Nav Buttons
      myScore: '🏆 నా స్కోర్',
      shameBoard: '🔥 షేమ్ బోర్డ్',
      priorityQueue: '🚨 ప్రాధాన్యత క్యూ',
      fileRti: '📋 RTI దాఖలు',
      qrSticker: '📱 QR స్టిక్కర్',
      emailGhmc: '📧 GHMC ఇమెయిల్',

      // Govt Accountability Card
      govtAccountability: '🏛️ ప్రభుత్వ జవాబుదారీ స్కోర్',
      economicDamage: '🔥 ఆర్థిక నష్టం అంచనా',

      // Map Action Buttons
      tapToReport: '📍 నివేదించడానికి ట్యాప్ చేయండి',
      safeRoute: 'సురక్షిత మార్గం',
      voiceAlerts: 'వాయిస్ అలర్ట్‌లు',
      dark: 'డార్క్',
      street: 'స్ట్రీట్',
      satellite: 'శాటిలైట్',
      heatmap: 'హీట్‌మ్యాప్',
      wards: 'వార్డులు',
      replay: 'రీప్లే',
      searchLocationHyd: 'హైదరాబాద్‌లో ప్రదేశం వెతకండి...',

      // City Health Score
      cityHealthScore: 'నగర ఆరోగ్య స్కోర్',
      cityHealthCritical: 'క్రిటికల్'
    },

    hi: {
      // Nav
      map: 'नक्शा',
      list: 'सूची',
      dashboard: 'डैशबोर्ड',
      profile: 'प्रोफ़ाइल',
      mapView: '📍 नक्शा दृश्य',
      listView: '📋 सूची दृश्य',
      myProfile: '👤 मेरा प्रोफ़ाइल',
      settings: '⚙️ सेटिंग्स',
      signOut: '🚪 लॉग आउट',
      signIn: 'साइन इन',
      signUp: 'साइन अप',
      headerSignIn: 'साइन इन',

      // Search
      searchHazards: 'खतरे खोजें...',
      searchByLocation: '🔍 स्थान से खोजें...',
      searchUsers: '🔍 उपयोगकर्ता खोजें...',

      // Auth Modal
      authSignIn: 'साइन इन',
      authSignUp: 'साइन अप',
      email: 'ईमेल',
      password: 'पासवर्ड',
      username: 'उपयोगकर्ता नाम',
      enterEmail: 'अपना ईमेल दर्ज करें',
      enterPassword: 'अपना पासवर्ड दर्ज करें',
      chooseUsername: 'उपयोगकर्ता नाम चुनें',
      createPassword: 'पासवर्ड बनाएं',
      dontHaveAccount: 'खाता नहीं है?',
      alreadyHaveAccount: 'पहले से खाता है?',

      // User Menu
      myAccount: 'मेरा खाता',
      viewProfile: 'प्रोफ़ाइल देखें',
      logout: 'लॉग आउट',
      settings: '⚙️ सेटिंग्स',

      // Map View
      liveHazardMap: '🌍 लाइव खतरा नक्शा',
      liveUpdates: 'लाइव अपडेट',
      allTypes: 'सभी प्रकार',
      pothole: '🕳️ गड्ढा',
      accident: '🚗 दुर्घटना',
      fallenTree: '🌳 गिरा पेड़',
      waterlogging: '🌊 जलभराव',
      roadClosure: '🚧 सड़क बंद',
      stalledVehicle: '🚙 खड़ा वाहन',
      brokenGuardrail: '🛡️ टूटी रेलिंग',
      other: '⚠️ अन्य',
      allSeverities: 'सभी गंभीरताएं',
      low: '🟢 कम',
      medium: '🟡 मध्यम',
      high: '🟠 अधिक',
      critical: '🔴 गंभीर',
      refresh: '🔄 रिफ्रेश',
      aiScan: '🤖 AI स्कैन',

      // Hero Stats
      totalHazards: 'कुल खतरे',
      criticalLabel: 'गंभीर',
      highRiskZones: 'उच्च जोखिम क्षेत्र',
      verified: 'सत्यापित',

      // Map Controls
      layers: 'परतें:',
      markers: 'मार्कर',
      dangerZones: 'खतरे के क्षेत्र',
      riskHeatmap: 'जोखिम हीटमैप',

      // Legend
      legend: '🗺️ लेजेंड',
      severity: 'गंभीरता',
      riskHeatmapLegend: 'जोखिम हीटमैप',
      highRisk: 'उच्च जोखिम',
      safe: 'सुरक्षित',
      dangerRadius: 'खतरे का दायरा',

      // List View
      hazardReports: '📋 खतरा रिपोर्ट',
      showingResults: 'दिखा रहा है',
      results: 'परिणाम',
      grid: '⊞ ग्रिड',
      listToggle: '☰ सूची',
      newestFirst: 'नवीनतम पहले',
      oldestFirst: 'पुराने पहले',
      bySeverity: 'गंभीरता अनुसार',
      mostUpvoted: 'सबसे ज्यादा वोट',
      allStatus: 'सभी स्थिति',
      pending: '⏳ लंबित',
      verifiedStatus: '✅ सत्यापित',
      disputed: '❌ विवादित',
      resolved: '🏁 हल किया',
      clearAll: 'सब हटाएं',
      previousPage: '← पिछला',
      nextPage: 'अगला →',

      // Admin Dashboard
      adminDashboard: 'एडमिन डैशबोर्ड',
      controlCenter: 'हजार्ड अलर्ट नियंत्रण केंद्र',
      exportCsv: 'CSV निर्यात',
      totalReports: 'कुल रिपोर्ट',
      allTime: 'सभी समय',
      verifiedLabel: 'सत्यापित',
      communityConfirmed: 'समुदाय ने पुष्टि की',
      pendingReview: 'समीक्षा लंबित',
      awaitingAction: 'कार्रवाई प्रतीक्षित',
      disputedLabel: 'विवादित',
      flaggedForReview: 'समीक्षा के लिए चिह्नित',
      totalUsers: 'कुल उपयोगकर्ता',
      registeredAccounts: 'पंजीकृत खाते',
      activeReporters: 'सक्रिय रिपोर्टर',
      reportsByType: '📈 प्रकार अनुसार रिपोर्ट',
      weeklyActivity: '📅 साप्ताहिक गतिविधि',
      recentHazardReports: '⚠️ हाल की खतरा रिपोर्ट',
      reports: 'रिपोर्ट',
      hazard: 'खतरा',
      location: 'स्थान',
      reporter: 'रिपोर्टर',
      status: 'स्थिति',
      time: 'समय',
      votes: 'वोट',
      actions: 'कार्रवाई',
      loadingReports: 'रिपोर्ट लोड हो रही हैं...',
      bulkVerify: '✅ सामूहिक सत्यापन',
      autoVerify: '🤖 ऑटो-सत्यापन',
      userManagement: '👥 उपयोगकर्ता प्रबंधन',
      loadingUsers: 'उपयोगकर्ता लोड हो रहे हैं...',

      // Profile
      profileTitle: '👤 मेरा प्रोफ़ाइल',
      editProfile: '✏️ प्रोफ़ाइल संपादित करें',
      communityReporter: 'सामुदायिक रिपोर्टर',
      trustScore: 'विश्वास स्कोर',
      reportsSubmitted: 'सबमिट की गई रिपोर्ट',
      upvotesReceived: 'प्राप्त अपवोट',
      accuracyRate: 'सटीकता दर',
      responseTime: 'प्रतिक्रिया समय',
      achievements: '🏆 उपलब्धियां',
      activityTimeline: '📈 गतिविधि टाइमलाइन',
      impactSummary: '📊 प्रभाव सारांश',
      hazardsResolved: 'हल किए गए खतरे',
      peopleHelped: 'मदद किए गए लोग',
      communityRating: 'सामुदायिक रेटिंग',

      // FABs
      aiScanFab: 'AI स्कैन',
      reportHazard: 'खतरा रिपोर्ट करें',

      // Proximity Alert
      nearbyHazard: 'पास में नया खतरा रिपोर्ट किया गया!',
      helpVerify: 'अपने समुदाय को सुरक्षित रखने के लिए इस खतरे को सत्यापित करें।',
      confirm: '✅ पुष्टि करें',
      dispute: '❌ विवाद करें',
      view: 'देखें →',

      // PWA
      installApp: 'हजार्ड अलर्ट इंस्टॉल करें',
      installDesc: 'ऑफलाइन खतरों की रिपोर्ट करने के लिए तुरंत एक्सेस पाएं',
      install: 'इंस्टॉल',
      later: 'बाद में',

      // SOS
      sos: '🆘 आपातकालीन',

      // Report Modal
      reportTitle: 'खतरा रिपोर्ट करें',
      submit: '📤 रिपोर्ट जमा करें',
      cancel: 'रद्द करें',
      next: 'अगला →',
      prev: '← पिछला',

      // Voice
      voiceReport: '🎙️ आवाज़ रिपोर्ट',
      aiAnalyze: '🤖 AI फ़ोटो विश्लेषण',

      // Misc
      guestUser: 'अतिथि उपयोगकर्ता',
      connecting: 'कनेक्ट हो रहा है...',
      accountSettings: 'खाता सेटिंग्स',
      systemPreferences: 'सिस्टम प्राथमिकताएं',

      // Route Safety
      routeSafety: '🛣️ मार्ग सुरक्षा',

      // Leaderboard
      leaderboard: '🏅 लीडरबोर्ड',

      // Dark Mode
      darkMode: '🌙',
      lightMode: '☀️',

      // Notification
      enableAlerts: '🔔 अलर्ट सक्रिय करें',
      alertsActive: '🔔 अलर्ट सक्रिय',

      // Dynamic Nav Buttons
      myScore: '🏆 मेरा स्कोर',
      shameBoard: '🔥 शेम बोर्ड',
      priorityQueue: '🚨 प्राथमिकता कतार',
      fileRti: '📋 RTI दर्ज करें',
      qrSticker: '📱 QR स्टिकर',
      emailGhmc: '📧 GHMC ईमेल',

      // Govt Accountability Card
      govtAccountability: '🏛️ सरकारी जवाबदेही स्कोर',
      economicDamage: '🔥 आर्थिक नुकसान अनुमान',

      // Map Action Buttons
      tapToReport: '📍 रिपोर्ट करने के लिए टैप करें',
      safeRoute: 'सुरक्षित मार्ग',
      voiceAlerts: 'आवाज़ अलर्ट',
      dark: 'डार्क',
      street: 'स्ट्रीट',
      satellite: 'सैटेलाइट',
      heatmap: 'हीटमैप',
      wards: 'वार्ड',
      replay: 'रीप्ले',
      searchLocationHyd: 'हैदराबाद में स्थान खोजें...',

      // City Health Score
      cityHealthScore: 'शहर स्वास्थ्य स्कोर',
      cityHealthCritical: 'गंभीर'
    }
  },

  // Get translated string
  t(key) {
    return this.strings[this._currentLang]?.[key] || this.strings.en[key] || key;
  },

  // Set language and translate everything
  setLanguage(lang) {
    if (!this.strings[lang]) return;
    this._currentLang = lang;
    localStorage.setItem('hz_lang', lang);
    this.applyTranslations();
    // Dispatch event so other modules can react
    document.dispatchEvent(new CustomEvent('languageChanged', { detail: { lang } }));
    console.log(`🌐 Language set to: ${lang}`);
  },

  // Apply translations to ALL elements with data-i18n attributes
  applyTranslations() {
    const lang = this._currentLang;

    // 1. Translate all data-i18n elements (text content)
    document.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.getAttribute('data-i18n');
      const translated = this.t(key);
      if (translated && translated !== key) {
        // Preserve child elements (like icons)
        const children = Array.from(el.children);
        if (children.length > 0 && el.childNodes.length > 1) {
          // Has mixed content: find and replace just the text nodes
          for (const node of el.childNodes) {
            if (node.nodeType === Node.TEXT_NODE && node.textContent.trim()) {
              node.textContent = translated;
              break;
            }
          }
        } else if (children.length === 0) {
          // Pure text node
          el.textContent = translated;
        } else {
          el.textContent = translated;
        }
      }
    });

    // 2. Translate all data-i18n-placeholder elements
    document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
      const key = el.getAttribute('data-i18n-placeholder');
      const translated = this.t(key);
      if (translated && translated !== key) {
        el.placeholder = translated;
      }
    });

    // 3. Translate all data-i18n-title elements
    document.querySelectorAll('[data-i18n-title]').forEach(el => {
      const key = el.getAttribute('data-i18n-title');
      const translated = this.t(key);
      if (translated && translated !== key) {
        el.title = translated;
      }
    });

    // 4. Translate select option elements
    document.querySelectorAll('[data-i18n-option]').forEach(el => {
      const key = el.getAttribute('data-i18n-option');
      const translated = this.t(key);
      if (translated && translated !== key) {
        el.textContent = translated;
      }
    });

    // 5. Translate desktop nav buttons (dynamic)
    document.querySelectorAll('.nav-btn[data-view]').forEach(btn => {
      const view = btn.dataset.view;
      const emojiMap = { map: '🗺️', list: '📋', admin: '📊' };
      const keyMap = { map: 'map', list: 'list', admin: 'dashboard' };
      if (keyMap[view]) {
        btn.textContent = `${emojiMap[view] || ''} ${this.t(keyMap[view])}`;
      }
    });

    // 6. Translate bottom nav buttons
    document.querySelectorAll('.bottom-nav-btn[data-view]').forEach(btn => {
      const view = btn.dataset.view;
      const icon = btn.querySelector('.nav-icon');
      const label = btn.querySelector('span:not(.nav-icon)');
      const keyMap = { map: 'map', list: 'list', admin: 'dashboard' };
      if (label && keyMap[view]) {
        label.textContent = this.t(keyMap[view]);
      }
    });

    // 7. Bottom nav profile button
    const profileNavBtn = document.getElementById('profile-nav-btn');
    if (profileNavBtn) {
      const label = profileNavBtn.querySelector('span:not(.nav-icon)');
      if (label) label.textContent = this.t('profile');
    }

    // 8. Mobile nav buttons
    document.querySelectorAll('.mobile-nav-btn[data-view]').forEach(btn => {
      const view = btn.dataset.view;
      const keyMap = { map: 'mapView', list: 'listView', admin: 'dashboard' };
      if (keyMap[view]) btn.textContent = `${view === 'map' ? '📍' : view === 'list' ? '📋' : '📊'} ${this.t(keyMap[view])}`;
    });

    // 9. Translate specific elements by ID
    const idMap = {
      'auth-modal-title': 'authSignIn',
      'login-submit': 'signIn',
      'register-submit': 'signUp',
      'global-search': null, // handled by placeholder
      'header-login-btn': 'headerSignIn',
      'dropdown-username': 'myAccount',
      'proximity-alert-title': 'nearbyHazard',
      'proximity-alert-desc': 'helpVerify',
      'proximity-confirm-btn': 'confirm',
      'proximity-dispute-btn': 'dispute',
      'proximity-view-btn': 'view',
      'pwa-install-btn': 'install',
      'pwa-dismiss-btn': 'later',
      'connection-text': 'connecting',
      'mobile-profile-btn': 'myProfile',
      'mobile-settings-btn': 'settings',
      'mobile-logout-btn': 'signOut',
      'mobile-username': 'guestUser',
      'fab-report': null, // complex
      'sos-btn': 'sos',
      'edit-profile': 'editProfile',
      'profile-title': 'communityReporter',
      'clear-filters': 'clearAll',
      'prev-page': 'previousPage',
      'next-page': 'nextPage',
      'refresh-map': 'refresh',
      'refresh-stats': null, // has icon child
      'export-csv': null, // has icon child
      'bulk-approve': 'bulkVerify',
      'auto-verify': 'autoVerify',
      'notif-enable-btn': 'enableAlerts',
      'notif-active-badge': 'alertsActive'
    };

    Object.entries(idMap).forEach(([id, key]) => {
      if (!key) return;
      const el = document.getElementById(id);
      if (el) {
        // For buttons with emoji children, preserve the structure
        const textContent = this.t(key);
        if (el.childNodes.length === 1 && el.childNodes[0].nodeType === Node.TEXT_NODE) {
          el.textContent = textContent;
        } else {
          // Try to find the last text node
          let found = false;
          for (let i = el.childNodes.length - 1; i >= 0; i--) {
            if (el.childNodes[i].nodeType === Node.TEXT_NODE && el.childNodes[i].textContent.trim()) {
              el.childNodes[i].textContent = textContent;
              found = true;
              break;
            }
          }
          if (!found) el.textContent = textContent;
        }
      }
    });

    // 10. Placeholders
    const placeholderMap = {
      'global-search': 'searchHazards',
      'login-email': 'enterEmail',
      'login-password': 'enterPassword',
      'register-username': 'chooseUsername',
      'register-email': 'enterEmail',
      'register-password': 'createPassword',
      'location-search': 'searchByLocation',
      'user-search': 'searchUsers'
    };

    Object.entries(placeholderMap).forEach(([id, key]) => {
      const el = document.getElementById(id);
      if (el) el.placeholder = this.t(key);
    });

    // 11. Form labels near auth inputs
    this._translateFormLabels();

    // 12. Translate hero stat labels
    this._translateHeroStats();

    // 13. Translate admin stat cards
    this._translateAdminCards();

    // 14. Translate profile stats
    this._translateProfileStats();

    // 15. FAB buttons
    this._translateFABs();

    // 16. Legend
    this._translateLegend();

    // 17. Admin table headers
    this._translateTableHeaders();

    // 18. Translate section headers
    this._translateSectionHeaders();

    // 19. Lang switcher button active state
    document.querySelectorAll('.lang-btn').forEach(b => {
      b.classList.toggle('active', b.dataset.lang === lang);
    });

    // 20. Translate dynamically injected elements (from JS engines)
    this._translateDynamicElements();
  },

  _translateFormLabels() {
    // Auth form labels
    const labels = {
      'login-email': 'email',
      'login-password': 'password',
      'register-username': 'username',
      'register-email': 'email',
      'register-password': 'password'
    };
    Object.entries(labels).forEach(([inputId, key]) => {
      const input = document.getElementById(inputId);
      if (input) {
        const label = input.closest('.form-group')?.querySelector('.form-label');
        if (label) label.textContent = this.t(key);
      }
    });

    // Auth switch text
    const loginSwitch = document.querySelector('#login-form .auth-switch');
    if (loginSwitch) {
      const btn = loginSwitch.querySelector('.btn-link');
      if (btn) {
        loginSwitch.childNodes[0].textContent = this.t('dontHaveAccount') + ' ';
        btn.textContent = this.t('signUp');
      }
    }
    const regSwitch = document.querySelector('#register-form .auth-switch');
    if (regSwitch) {
      const btn = regSwitch.querySelector('.btn-link');
      if (btn) {
        regSwitch.childNodes[0].textContent = this.t('alreadyHaveAccount') + ' ';
        btn.textContent = this.t('signIn');
      }
    }
  },

  _translateHeroStats() {
    const statLabels = document.querySelectorAll('.hero-stat-label');
    const keys = ['totalHazards', 'criticalLabel', 'highRiskZones', 'verified'];
    statLabels.forEach((label, i) => {
      if (keys[i]) label.textContent = this.t(keys[i]);
    });
  },

  _translateAdminCards() {
    const cards = document.querySelectorAll('.admin-stat-card');
    const labelKeys = ['totalReports', 'verifiedLabel', 'pendingReview', 'disputedLabel', 'totalUsers', 'activeReporters'];
    const subKeys = ['allTime', 'communityConfirmed', 'awaitingAction', 'flaggedForReview', 'registeredAccounts', null];
    cards.forEach((card, i) => {
      const label = card.querySelector('.stat-card-label');
      const sub = card.querySelector('.stat-card-sub');
      if (label && labelKeys[i]) label.textContent = this.t(labelKeys[i]);
      if (sub && subKeys[i]) sub.textContent = this.t(subKeys[i]);
    });

    // Admin header
    const adminTitle = document.querySelector('.admin-title');
    const adminSub = document.querySelector('.admin-subtitle');
    if (adminTitle) adminTitle.textContent = this.t('adminDashboard');
    if (adminSub) adminSub.textContent = this.t('controlCenter');
  },

  _translateProfileStats() {
    const statLabels = document.querySelectorAll('.profile-stat-card .stat-label');
    const keys = ['reportsSubmitted', 'upvotesReceived', 'accuracyRate', 'responseTime'];
    statLabels.forEach((label, i) => {
      if (keys[i]) label.textContent = this.t(keys[i]);
    });

    const trustLabel = document.querySelector('.trust-label');
    if (trustLabel) trustLabel.textContent = this.t('trustScore');

    // Profile section headers
    const sectionHeaders = document.querySelectorAll('.profile-section h4');
    const sectionKeys = ['achievements', 'activityTimeline', 'impactSummary'];
    sectionHeaders.forEach((h, i) => {
      if (sectionKeys[i]) h.textContent = this.t(sectionKeys[i]);
    });

    // Impact labels
    const impactLabels = document.querySelectorAll('.impact-label');
    const impactKeys = ['hazardsResolved', 'peopleHelped', 'communityRating'];
    impactLabels.forEach((l, i) => {
      if (impactKeys[i]) l.textContent = this.t(impactKeys[i]);
    });
  },

  _translateFABs() {
    const fabAI = document.querySelector('#fab-ai-scan .fab-text');
    const fabReport = document.querySelector('#fab-report .fab-text');
    if (fabAI) fabAI.textContent = this.t('aiScanFab');
    if (fabReport) fabReport.textContent = this.t('reportHazard');
  },

  _translateLegend() {
    const legendTitle = document.querySelector('.legend-title');
    if (legendTitle) legendTitle.textContent = this.t('legend');

    const sectionTitles = document.querySelectorAll('.legend-section-title');
    const sectionKeys = ['severity', 'riskHeatmapLegend', 'dangerRadius'];
    sectionTitles.forEach((el, i) => {
      if (sectionKeys[i]) el.textContent = this.t(sectionKeys[i]);
    });

    // Legend severity items (text nodes after marker divs)
    const legendItems = document.querySelectorAll('.map-legend-float .legend-item');
    const legendLabels = {
      'Critical': 'criticalLabel', 'High': 'high', 'Medium': 'medium', 'Low': 'low',
      'High Risk': 'highRisk', 'Safe': 'safe',
      // Telugu
      'క్రిటికల్': 'criticalLabel', 'ఎక్కువ': 'high', 'మధ్యస్థం': 'medium', 'తక్కువ': 'low',
      'అధిక ప్రమాదం': 'highRisk', 'సురక్షితం': 'safe',
      // Hindi
      'गंभीर': 'criticalLabel', 'अधिक': 'high', 'मध्यम': 'medium', 'कम': 'low',
      'उच्च जोखिम': 'highRisk', 'सुरक्षित': 'safe'
    };
    legendItems.forEach(item => {
      if (item.classList.contains('legend-item--small')) return; // Skip the "Accident = 200m" item
      const textNodes = Array.from(item.childNodes).filter(n => n.nodeType === Node.TEXT_NODE);
      textNodes.forEach(n => {
        const trimmed = n.textContent.trim();
        if (legendLabels[trimmed]) {
          // Remove emoji prefixes from translation keys that have them
          let translated = this.t(legendLabels[trimmed]);
          translated = translated.replace(/^[🟢🟡🟠🔴]\s*/, ''); // Strip emoji prefix
          n.textContent = translated;
        }
      });
    });

    // Layer controls
    const layerLabel = document.querySelector('.layer-ctrl-label');
    if (layerLabel) layerLabel.textContent = this.t('layers');
  },

  _translateTableHeaders() {
    const headers = document.querySelectorAll('#admin-reports-table thead th');
    const keys = [null, 'hazard', 'location', 'reporter', 'status', 'time', 'votes', 'actions'];
    headers.forEach((th, i) => {
      if (keys[i]) th.textContent = this.t(keys[i]);
    });
  },

  _translateSectionHeaders() {
    // Map view header
    const mapHeader = document.querySelector('#map-view .view-title-section h2');
    if (mapHeader) mapHeader.textContent = this.t('liveHazardMap');

    // Live Updates text
    const liveText = document.querySelector('.real-time-indicator span:not(.pulse-dot)');
    if (liveText) liveText.textContent = this.t('liveUpdates');

    // List view header
    const listHeader = document.querySelector('#list-view .view-title-section h2');
    if (listHeader) listHeader.textContent = this.t('hazardReports');

    // Profile header
    const profileHeader = document.querySelector('#profile-view .view-header h2');
    if (profileHeader) profileHeader.textContent = this.t('profileTitle');

    // Chart card headers
    const chartHeaders = document.querySelectorAll('.chart-card-header h3');
    const chartKeys = ['reportsByType', 'weeklyActivity'];
    chartHeaders.forEach((h, i) => {
      if (chartKeys[i]) h.textContent = this.t(chartKeys[i]);
    });

    // Recent hazard reports panel
    const panelHeaders = document.querySelectorAll('.admin-panel .admin-panel-header .panel-title-group h3');
    const panelKeys = ['recentHazardReports', 'userManagement'];
    panelHeaders.forEach((h, i) => {
      if (panelKeys[i]) h.textContent = this.t(panelKeys[i]);
    });

    // Select dropdown options
    this._translateSelectOptions();
  },

  _translateSelectOptions() {
    // Type filter
    const typeFilter = document.getElementById('type-filter');
    if (typeFilter) {
      const optionKeys = ['allTypes', 'pothole', 'accident', 'fallenTree', 'waterlogging', 'roadClosure', 'stalledVehicle', 'brokenGuardrail', 'other'];
      typeFilter.querySelectorAll('option').forEach((opt, i) => {
        if (optionKeys[i]) opt.textContent = this.t(optionKeys[i]);
      });
    }

    // Severity filter
    const sevFilter = document.getElementById('severity-filter');
    if (sevFilter) {
      const optionKeys = ['allSeverities', 'low', 'medium', 'high', 'critical'];
      sevFilter.querySelectorAll('option').forEach((opt, i) => {
        if (optionKeys[i]) opt.textContent = this.t(optionKeys[i]);
      });
    }

    // Sort select
    const sortSelect = document.getElementById('sort-select');
    if (sortSelect) {
      const optionKeys = ['newestFirst', 'oldestFirst', 'bySeverity', 'mostUpvoted'];
      sortSelect.querySelectorAll('option').forEach((opt, i) => {
        if (optionKeys[i]) opt.textContent = this.t(optionKeys[i]);
      });
    }

    // Status filter
    const statusFilter = document.getElementById('status-filter');
    if (statusFilter) {
      const optionKeys = ['allStatus', 'pending', 'verifiedStatus', 'disputed', 'resolved'];
      statusFilter.querySelectorAll('option').forEach((opt, i) => {
        if (optionKeys[i]) opt.textContent = this.t(optionKeys[i]);
      });
    }

    // Grid/list toggles
    const gridBtn = document.getElementById('grid-toggle');
    const listBtn = document.getElementById('list-toggle');
    if (gridBtn) gridBtn.textContent = this.t('grid');
    if (listBtn) listBtn.textContent = this.t('listToggle');

    // AI scan button
    const aiScanBtn = document.getElementById('ai-scan-btn');
    if (aiScanBtn) aiScanBtn.textContent = this.t('aiScan');
  },

  // ── Translate dynamically injected elements from various JS engines ──
  _translateDynamicElements() {
    // Secondary nav buttons (injected by civic_trust.js, pressure_engine.js, etc.)
    const dynamicBtnMap = {
      'ct-nav-btn': 'myScore',
      'shame-nav-btn': 'shameBoard',
      'priority-nav-btn': 'priorityQueue',
      'rti-nav-btn': 'fileRti',
      'qr-nav-btn': 'qrSticker',
      'ghmc-email-btn': 'emailGhmc'
    };

    Object.entries(dynamicBtnMap).forEach(([id, key]) => {
      const btn = document.getElementById(id);
      if (btn) {
        // Preserve child elements like badge spans
        const badge = btn.querySelector('span');
        const translated = this.t(key);
        if (badge) {
          // Keep the badge, replace the text before it
          const textNode = Array.from(btn.childNodes).find(n => n.nodeType === Node.TEXT_NODE && n.textContent.trim());
          if (textNode) textNode.textContent = translated + ' ';
          else {
            btn.innerHTML = translated + ' ';
            btn.appendChild(badge);
          }
        } else {
          btn.innerHTML = translated;
        }
      }
    });

    // Also try class-based matching for dynamically named buttons
    document.querySelectorAll('.desktop-nav .nav-btn:not([data-view])').forEach(btn => {
      const text = btn.textContent.trim().toLowerCase();
      if (text.includes('score') || text.includes('స్కోర్') || text.includes('स्कोर')) {
        const badge = btn.querySelector('span');
        if (badge) { btn.childNodes[0].textContent = this.t('myScore') + ' '; }
        else btn.textContent = this.t('myScore');
      }
    });

    // Govt. Accountability Score card title
    document.querySelectorAll('.ue-card-title').forEach(el => {
      const text = el.textContent.trim();
      if (text.includes('Accountability') || text.includes('జవాబుదారీ') || text.includes('जवाबदेही')) {
        el.textContent = this.t('govtAccountability');
      }
      if (text.includes('Economic') || text.includes('ఆర్థిక') || text.includes('आर्थिक') || text.includes('Damage')) {
        el.textContent = this.t('economicDamage');
      }
    });

    // Map action buttons
    const mapBtnMap = {
      'hm-tap-btn': 'tapToReport',
      'hm-route-btn': 'safeRoute',
      'hm-voice-btn': 'voiceAlerts'
    };
    Object.entries(mapBtnMap).forEach(([id, key]) => {
      const btn = document.getElementById(id);
      if (btn) {
        // Only translate if not in active/cancel state
        if (btn.textContent.includes('Cancel')) return;
        btn.textContent = this.t(key);
      }
    });

    // Map style buttons (Dark, Street, Satellite) — inside #hm-tile-switcher
    const tileSwitcher = document.getElementById('hm-tile-switcher');
    if (tileSwitcher) {
      tileSwitcher.querySelectorAll('button').forEach(btn => {
        const style = btn.dataset.style;
        if (style === 'dark') btn.textContent = '🌙 ' + this.t('dark');
        if (style === 'street') btn.textContent = '🏙️ ' + this.t('street');
        if (style === 'satellite') btn.textContent = '🛰 ' + this.t('satellite');
      });
    }

    // Map overlay buttons (Heatmap, Wards, Replay) — by specific IDs
    const overlayMap = {
      'hm-heatmap-btn': ['🔴', 'heatmap'],
      'hm-ward-btn': ['🏙️', 'wards'],
      'hm-replay-btn': ['⏱️', 'replay']
    };
    Object.entries(overlayMap).forEach(([id, [emoji, key]]) => {
      const btn = document.getElementById(id);
      if (btn) btn.textContent = `${emoji} ${this.t(key)}`;
    });

    // City Health Score widget — uses .ch-label and .ch-status
    const chLabel = document.querySelector('.ch-label');
    if (chLabel) {
      const pulse = chLabel.querySelector('.ch-pulse');
      chLabel.textContent = '🏙️ ' + this.t('cityHealthScore') + ' ';
      if (pulse) chLabel.appendChild(pulse);
    }
    const chStatus = document.querySelector('.ch-status');
    if (chStatus) {
      const text = chStatus.textContent.trim();
      if (text === 'CRITICAL' || text === 'క్రిటికల్' || text === 'गंभीर') {
        chStatus.textContent = this.t('cityHealthCritical');
      }
    }

    // Map layer checkbox labels
    const layerLabels = document.querySelectorAll('.layer-toggle');
    const layerKeys = [
      { id: 'toggle-markers', emoji: '📍', key: 'markers' },
      { id: 'toggle-danger-zones', emoji: '🔴', key: 'dangerZones' },
      { id: 'toggle-heatmap', emoji: '🌡️', key: 'riskHeatmap' }
    ];
    layerLabels.forEach((label, i) => {
      if (!layerKeys[i]) return;
      const checkbox = label.querySelector('input[type="checkbox"]');
      if (checkbox) {
        // Replace the text node after the checkbox
        const textNodes = Array.from(label.childNodes).filter(n => n.nodeType === Node.TEXT_NODE);
        textNodes.forEach(n => {
          if (n.textContent.trim()) {
            n.textContent = ` ${layerKeys[i].emoji} ${this.t(layerKeys[i].key)}`;
          }
        });
      }
    });

    // Map search placeholder
    const mapSearch = document.getElementById('hm-search-input');
    if (mapSearch) mapSearch.placeholder = this.t('searchLocationHyd');

    // Settings modal title
    const settingsTitle = document.querySelector('#settings-modal .modal-header h3');
    if (settingsTitle) {
      const iconSpan = settingsTitle.querySelector('span');
      if (iconSpan) {
        const textNodes = Array.from(settingsTitle.childNodes).filter(n => n.nodeType === Node.TEXT_NODE);
        textNodes.forEach(n => { if (n.textContent.trim()) n.textContent = '\n                    ' + this.t('accountSettings') + '\n                '; });
      }
    }

    // System Preferences label in settings
    const sysPrefLabel = document.querySelector('#settings-modal label');
    if (sysPrefLabel && (sysPrefLabel.textContent.includes('System') || sysPrefLabel.textContent.includes('సిస్టమ్') || sysPrefLabel.textContent.includes('सिस्टम'))) {
      sysPrefLabel.textContent = this.t('systemPreferences');
    }
  },

  // Initialize — apply on DOM ready and hook into language switcher
  init() {
    // Apply saved language on load
    this.applyTranslations();

    // Watch for dynamically added language buttons
    const observer = new MutationObserver(() => {
      document.querySelectorAll('.lang-btn:not([data-i18n-hooked])').forEach(btn => {
        btn.dataset.i18nHooked = '1';
        btn.addEventListener('click', () => {
          const lang = btn.dataset.lang || 'en';
          this.setLanguage(lang);
        });
      });
    });
    observer.observe(document.body, { childList: true, subtree: true });

    // Also hook existing buttons immediately
    document.querySelectorAll('.lang-btn').forEach(btn => {
      btn.dataset.i18nHooked = '1';
      btn.addEventListener('click', () => {
        const lang = btn.dataset.lang || 'en';
        this.setLanguage(lang);
      });
    });

    console.log(`🌐 I18N initialized — language: ${this._currentLang}`);
  }
};

// ── Auto-init ─────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  // First pass: after most dynamic engines have injected
  setTimeout(() => I18N.init(), 3500);
  // Second pass: catch any late-loading dynamic elements
  setTimeout(() => {
    if (I18N._currentLang !== 'en') {
      I18N.applyTranslations();
    }
  }, 6000);
});

// ── Export ─────────────────────────────────────────────────────────
window.I18N = I18N;
