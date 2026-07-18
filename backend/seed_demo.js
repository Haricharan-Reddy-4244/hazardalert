// ═══════════════════════════════════════════════════════
//  HAZARDALERT — HACKATHON DEMO SEED SCRIPT
//  Seeds 55 realistic Hyderabad hazards:
//   - 40 UNRESOLVED (35-90 days old) → Grade D shock value
//   - 8 RESOLVED (recent) → keeps resolution rate ~15%
//   - 7 CRITICAL overdue → maximum shame board impact
//  Run: node seed_demo.js
// ═══════════════════════════════════════════════════════

const pool = require('./db-config');

// Real Hyderabad locations with lat/lng
const locations = [
  { name: 'Ameerpet Junction', lat: 17.4375, lng: 78.4483 },
  { name: 'Hitech City Main Road', lat: 17.4490, lng: 78.3802 },
  { name: 'Kukatpally Housing Board', lat: 17.4849, lng: 78.4089 },
  { name: 'Banjara Hills Road No.12', lat: 17.4126, lng: 78.4378 },
  { name: 'Secunderabad Clock Tower', lat: 17.4399, lng: 78.4983 },
  { name: 'LB Nagar Circle', lat: 17.3472, lng: 78.5478 },
  { name: 'Dilsukhnagar Bus Stop', lat: 17.3686, lng: 78.5264 },
  { name: 'Begumpet Airport Road', lat: 17.4442, lng: 78.4682 },
  { name: 'Gachibowli Flyover', lat: 17.4400, lng: 78.3489 },
  { name: 'Madhapur IT Hub Road', lat: 17.4480, lng: 78.3908 },
  { name: 'Mehdipatnam Bus Stop', lat: 17.3939, lng: 78.4373 },
  { name: 'Charminar Road', lat: 17.3616, lng: 78.4747 },
  { name: 'Uppal X Roads', lat: 17.4049, lng: 78.5594 },
  { name: 'Kondapur Main Road', lat: 17.4601, lng: 78.3578 },
  { name: 'Manikonda Village Road', lat: 17.4022, lng: 78.3838 },
  { name: 'ECIL X Roads', lat: 17.4677, lng: 78.5561 },
  { name: 'Kothapet Main Road', lat: 17.3614, lng: 78.5458 },
  { name: 'Attapur Circle', lat: 17.3716, lng: 78.4222 },
  { name: 'Miyapur Bus Terminus', lat: 17.4968, lng: 78.3542 },
  { name: 'Patancheru Industrial Area', lat: 17.5302, lng: 78.2603 },
  { name: 'Tolichowki Junction', lat: 17.4063, lng: 78.4239 },
  { name: 'Nagole Metro Station', lat: 17.3921, lng: 78.5698 },
  { name: 'Malkajgiri Municipality Road', lat: 17.4577, lng: 78.5242 },
  { name: 'SR Nagar Main Road', lat: 17.4510, lng: 78.4286 },
  { name: 'Vanasthalipuram Market', lat: 17.3363, lng: 78.5541 },
];

const hazardTypes = ['Pothole', 'Broken Road', 'Waterlogging', 'Open Drain', 'Fallen Tree', 'Street Light Out', 'Garbage Dump', 'Open Manhole', 'Road Cave-in', 'Damaged Footpath'];

const descriptions = {
  'Pothole': [
    'Large crater-sized pothole causing vehicles to swerve dangerously. Multiple vehicles damaged. Two-wheeler accidents reported.',
    'Deep pothole spanning half the road width. Heavy rains made it worse. Bikes falling regularly.',
    'Massive pothole near school zone. Children at risk while crossing. Road collapsed over 20 sq ft.',
  ],
  'Broken Road': [
    'Entire road surface broken, gravel exposed. Trucks and autos struggling. Raises dust causing health issues.',
    'Road completely dug up for pipeline work, never restored. Businesses affected for months.',
    'BT road crumbled after rains. Over 50m stretch unusable. Traffic redirected through colony roads.',
  ],
  'Waterlogging': [
    'Road floods knee-deep after every rain. Electricity boxes submerged — electrocution risk.',
    'Low-lying area with no drainage. Standing water for weeks. Dengue breeding ground confirmed.',
    'Underpass floods completely, blocking main arterial road for hours during every rain.',
  ],
  'Open Drain': [
    'Open sewage drain running alongside main road. No cover for 200m stretch. Children at risk of falling.',
    'Drain cover broken, sewage overflowing onto footpath. Residents unable to walk at night.',
    'Nullah overflowing into road due to blockage. Sewage smell affecting shops and residents.',
  ],
  'Fallen Tree': [
    'Large banyan tree fallen across road after storm. One lane completely blocked for weeks.',
    'Dead tree partially collapsed on power lines and footpath. Electrocution hazard. GHMC not responding.',
    'Tree fell on parked vehicles. Damage unaddressed. Risk to passing traffic continues.',
  ],
  'Open Manhole': [
    'Manhole cover missing since months. Covered only with bricks by residents. Serious accident hazard especially at night.',
    'Three open manholes in 100m stretch with no warning signs. Two accidents already reported.',
    'Open manhole on busy road. Child nearly fell in last week. GHMC complaint filed twice, no action.',
  ],
  'Road Cave-in': [
    'Road surface collapsed about 4 feet deep. Underground pipe burst suspected. Barricaded by locals with stones.',
    'Massive sinkhole opened in road. Getting bigger with every rain. Risk of collapse while driving.',
    'Entire lane caved in near apartment complex. Foundation of nearby buildings may be affected.',
  ],
  'Garbage Dump': [
    'Illegal garbage dump growing for 3 months. Stray dogs and disease. Neighbors complaints ignored.',
    'GHMC bin overflowing for weeks. Garbage spilling onto road. Terrible smell affecting residents.',
    'Construction debris dumped on roadside blocking emergency vehicle access to hospital.',
  ],
  'Street Light Out': [
    'Entire stretch of 500m has no street lights since 2 months. Three chain snatchings reported in darkness.',
    'Street light pole knocked down by truck. Live wires on ground. Risk of electrocution during rains.',
    'School zone completely dark at night. Parents scared to let children attend tuitions.',
  ],
  'Damaged Footpath': [
    'Footpath tiles completely broken. Elderly women fell and fractured hip last week. No action taken.',
    'Footpath encroached and damaged. Pedestrians forced to walk on road. Three accidents in a month.',
    'Footpath broken by tree roots. Open iron rods exposed. Child injured last week.',
  ],
};

function randomDesc(type) {
  const opts = descriptions[type] || ['Hazard reported by citizen. Awaiting government action.'];
  return opts[Math.floor(Math.random() * opts.length)];
}

function daysAgo(n) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 19).replace('T', ' ');
}

function randomBetween(a, b) {
  return a + Math.floor(Math.random() * (b - a + 1));
}

async function seed() {
  console.log('🌱 Starting HazardAlert Demo Seed...\n');

  // ── Unresolved critical/high hazards (35-90 days old) ─────────────
  const unresolvedHazards = [
    // CRITICAL — 60-90 days old = maximum shame score
    { type: 'Road Cave-in',    sev: 'critical', days: 87, loc: locations[0]  },
    { type: 'Open Manhole',    sev: 'critical', days: 82, loc: locations[1]  },
    { type: 'Waterlogging',    sev: 'critical', days: 76, loc: locations[2]  },
    { type: 'Pothole',         sev: 'critical', days: 71, loc: locations[3]  },
    { type: 'Road Cave-in',    sev: 'critical', days: 68, loc: locations[4]  },
    { type: 'Open Drain',      sev: 'critical', days: 65, loc: locations[5]  },
    { type: 'Waterlogging',    sev: 'critical', days: 60, loc: locations[6]  },
    // HIGH — 40-59 days old
    { type: 'Broken Road',     sev: 'high',     days: 58, loc: locations[7]  },
    { type: 'Pothole',         sev: 'high',     days: 55, loc: locations[8]  },
    { type: 'Street Light Out',sev: 'high',     days: 52, loc: locations[9]  },
    { type: 'Open Manhole',    sev: 'high',     days: 49, loc: locations[10] },
    { type: 'Garbage Dump',    sev: 'high',     days: 47, loc: locations[11] },
    { type: 'Broken Road',     sev: 'high',     days: 45, loc: locations[12] },
    { type: 'Fallen Tree',     sev: 'high',     days: 43, loc: locations[13] },
    { type: 'Pothole',         sev: 'high',     days: 41, loc: locations[14] },
    // MEDIUM/HIGH 35-40 days
    { type: 'Damaged Footpath',sev: 'medium',   days: 39, loc: locations[15] },
    { type: 'Waterlogging',    sev: 'high',     days: 38, loc: locations[16] },
    { type: 'Garbage Dump',    sev: 'medium',   days: 37, loc: locations[17] },
    { type: 'Street Light Out',sev: 'medium',   days: 36, loc: locations[18] },
    { type: 'Pothole',         sev: 'high',     days: 35, loc: locations[19] },
    // Fill to 40 total
    { type: 'Pothole',         sev: 'critical', days: 72, loc: locations[20] },
    { type: 'Open Drain',      sev: 'high',     days: 54, loc: locations[21] },
    { type: 'Road Cave-in',    sev: 'high',     days: 46, loc: locations[22] },
    { type: 'Broken Road',     sev: 'critical', days: 79, loc: locations[23] },
    { type: 'Open Manhole',    sev: 'high',     days: 44, loc: locations[24] },
    { type: 'Waterlogging',    sev: 'critical', days: 63, loc: locations[0]  },
    { type: 'Garbage Dump',    sev: 'medium',   days: 40, loc: locations[1]  },
    { type: 'Fallen Tree',     sev: 'high',     days: 50, loc: locations[2]  },
    { type: 'Damaged Footpath',sev: 'medium',   days: 38, loc: locations[3]  },
    { type: 'Pothole',         sev: 'critical', days: 84, loc: locations[4]  },
    { type: 'Street Light Out',sev: 'high',     days: 57, loc: locations[5]  },
    { type: 'Open Drain',      sev: 'critical', days: 69, loc: locations[6]  },
    { type: 'Broken Road',     sev: 'high',     days: 42, loc: locations[7]  },
    { type: 'Road Cave-in',    sev: 'critical', days: 73, loc: locations[8]  },
    { type: 'Waterlogging',    sev: 'high',     days: 48, loc: locations[9]  },
    { type: 'Open Manhole',    sev: 'critical', days: 66, loc: locations[10] },
    { type: 'Pothole',         sev: 'high',     days: 53, loc: locations[11] },
    { type: 'Garbage Dump',    sev: 'high',     days: 45, loc: locations[12] },
    { type: 'Broken Road',     sev: 'medium',   days: 36, loc: locations[13] },
    { type: 'Street Light Out',sev: 'high',     days: 59, loc: locations[14] },
  ];

  // ── Few resolved hazards (keeps resolution rate ~17%) ──────────────
  const resolvedHazards = [
    { type: 'Pothole',    sev: 'medium', daysCreated: 20, daysResolved: 3, loc: locations[15] },
    { type: 'Garbage Dump', sev: 'low',  daysCreated: 15, daysResolved: 5, loc: locations[16] },
    { type: 'Fallen Tree',sev: 'high',   daysCreated: 12, daysResolved: 2, loc: locations[17] },
    { type: 'Pothole',    sev: 'medium', daysCreated: 18, daysResolved: 7, loc: locations[18] },
    { type: 'Open Drain', sev: 'low',   daysCreated: 25, daysResolved: 10, loc: locations[19] },
    { type: 'Broken Road',sev: 'medium', daysCreated: 30, daysResolved: 12, loc: locations[20] },
    { type: 'Waterlogging',sev: 'medium',daysCreated: 22, daysResolved: 8, loc: locations[21] },
    { type: 'Pothole',    sev: 'low',   daysCreated: 10, daysResolved: 4, loc: locations[22] },
  ];

  let insertedUnresolved = 0;
  let insertedResolved = 0;

  // Check table structure
  let hasLocationName = true, hasUserId = false;
  try {
    const [cols] = await pool.query(`SHOW COLUMNS FROM hazards`);
    const colNames = cols.map(c => c.Field);
    hasLocationName = colNames.includes('location_name');
    hasUserId = colNames.includes('user_id');
    console.log('📋 Columns:', colNames.join(', '));
  } catch(e) {
    console.error('❌ Cannot read hazards table:', e.message);
    process.exit(1);
  }

  // Insert unresolved
  for (const h of unresolvedHazards) {
    try {
      const created = daysAgo(h.days);
      const lat = h.loc.lat + (Math.random() - 0.5) * 0.002;
      const lng = h.loc.lng + (Math.random() - 0.5) * 0.002;

      const fields = ['hazard_type', 'severity', 'description', 'latitude', 'longitude', 'status', 'created_at', 'updated_at'];
      const values = [h.type, h.sev, randomDesc(h.type), lat.toFixed(6), lng.toFixed(6), 'pending', created, created];

      if (hasLocationName) { fields.push('location_name'); values.push(h.loc.name); }
      if (hasUserId)        { fields.push('user_id'); values.push(1); }

      await pool.query(
        `INSERT INTO hazards (${fields.join(',')}) VALUES (${fields.map(()=>'?').join(',')})`,
        values
      );
      insertedUnresolved++;
    } catch(e) {
      console.warn(`⚠️  Skip unresolved (${h.type}):`, e.message.slice(0, 60));
    }
  }

  // Insert resolved
  for (const h of resolvedHazards) {
    try {
      const created = daysAgo(h.daysCreated);
      const resolved = daysAgo(h.daysResolved);
      const lat = h.loc.lat + (Math.random() - 0.5) * 0.002;
      const lng = h.loc.lng + (Math.random() - 0.5) * 0.002;

      const fields = ['hazard_type', 'severity', 'description', 'latitude', 'longitude', 'status', 'created_at', 'updated_at'];
      const values = [h.type, h.sev, randomDesc(h.type), lat.toFixed(6), lng.toFixed(6), 'resolved', created, resolved];

      if (hasLocationName) { fields.push('location_name'); values.push(h.loc.name); }
      if (hasUserId)        { fields.push('user_id'); values.push(1); }

      await pool.query(
        `INSERT INTO hazards (${fields.join(',')}) VALUES (${fields.map(()=>'?').join(',')})`,
        values
      );
      insertedResolved++;
    } catch(e) {
      console.warn(`⚠️  Skip resolved (${h.type}):`, e.message.slice(0, 60));
    }
  }

  // Verification
  const [[totals]] = await pool.query(`
    SELECT COUNT(*) as total,
           SUM(status='pending') as pending,
           SUM(status='resolved') as resolved,
           SUM(severity='critical' AND status='pending') as crit_pending,
           ROUND(SUM(status='resolved')/COUNT(*)*100) as resolution_pct,
           MAX(DATEDIFF(NOW(), created_at)) as oldest_days
    FROM hazards
  `);

  const grade = totals.resolution_pct >= 80 ? 'A' : totals.resolution_pct >= 65 ? 'B'
              : totals.resolution_pct >= 50 ? 'C' : totals.resolution_pct >= 35 ? 'D' : 'F';

  console.log('\n✅ Seed complete!\n');
  console.log('═══════════════════════════════════');
  console.log(`📊 Total hazards:    ${totals.total}`);
  console.log(`🔴 Pending:          ${totals.pending}`);
  console.log(`✅ Resolved:         ${totals.resolved}`);
  console.log(`🚨 Critical pending: ${totals.crit_pending}`);
  console.log(`📈 Resolution rate:  ${totals.resolution_pct}%`);
  console.log(`🏛️  Accountability:   Grade ${grade}`);
  console.log(`📅 Oldest hazard:    ${totals.oldest_days} days old`);
  console.log('═══════════════════════════════════');
  console.log(`\n💥 Inserted ${insertedUnresolved} unresolved + ${insertedResolved} resolved hazards`);
  console.log('🔥 Shame Board will show max shock value!');
  console.log('💰 Economic damage should show ₹10+ Lakhs');
  console.log(`🏛️  Accountability Score = Grade ${grade} — demo ready!\n`);

  process.exit(0);
}

seed().catch(e => { console.error('Fatal:', e); process.exit(1); });
