// ════════════════════════════════════════════════════════════════════════
//  📋 RTI ENGINE — Right to Information Application Generator
//  Generates legally valid RTI applications under RTI Act 2005
//  Pre-filled with hazard data, GHMC PIO address, and legal citations
//  NO LOGIN REQUIRED — purely public-facing
// ════════════════════════════════════════════════════════════════════════
const RTIEngine = {

  API: window.API_BASE || 'http://localhost:5000',

  // Real Hyderabad RTI Public Information Officers
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

  // ── Bootstrap ──────────────────────────────────────────────────────
  init() {
    this.injectStyles();
    this.injectNavBtn();
    console.log('📋 RTI Engine ready — RTI applications can now be generated');
  },

  // ── CSS ────────────────────────────────────────────────────────────
  injectStyles() {
    if (document.getElementById('rti-styles')) return;
    const s = document.createElement('style');
    s.id = 'rti-styles';
    s.textContent = `
      /* Nav button */
      #rti-nav-btn {
        background: linear-gradient(135deg, #0f766e, #065f46);
        color: #fff !important; border: none; border-radius: 8px;
        padding: 7px 14px; font-weight: 700; cursor: pointer;
        box-shadow: 0 0 10px rgba(15,118,110,0.4);
      }

      /* Panel */
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
        font-weight: 700; font-size: 14px; cursor: pointer;
      }
      .rti-wa-btn {
        padding: 12px 16px; background: #25d366; color: #fff; border: none;
        border-radius: 12px; font-weight: 700; font-size: 13px; cursor: pointer;
      }

      /* Document preview */
      #rti-document {
        margin: 0 24px 24px;
        border: 1px solid #e2e8f0; border-radius: 12px;
        background: #f8fafc; padding: 24px;
        font-size: 13px; line-height: 1.7; display: none;
        white-space: pre-wrap; font-family: 'Courier New', monospace;
      }
      [data-theme="dark"] #rti-document { background: #0f172a; border-color: #334155; color: #e2e8f0; }

      .rti-info-box {
        margin: 12px 24px; padding: 12px 16px; background: #ecfdf5;
        border: 1px solid #6ee7b7; border-radius: 10px; font-size: 12px; color: #065f46;
      }
      [data-theme="dark"] .rti-info-box { background: #022c22; border-color: #065f46; color: #6ee7b7; }

      /* Shame board RTI mini-btn */
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

  // ── Nav Button ────────────────────────────────────────────────────
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

  // ── Open Panel ────────────────────────────────────────────────────
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
          <!-- Applicant info -->
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

          <!-- Hazard info -->
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

          <!-- Department -->
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

        <!-- Document will appear here -->
        <div id="rti-document"></div>

        <div id="rti-action-row" style="display:none;padding:0 24px 24px;display:none;">
          <div class="rti-btn-row" id="rti-share-btns" style="margin-top:12px;display:none;"></div>
        </div>
      </div>
    `;

    if (prefill.type) document.getElementById('rti-hazard-type').value = prefill.type;

    panel.addEventListener('click', e => { if (e.target === panel) panel.remove(); });
    document.body.appendChild(panel);
  },

  // ── Generate RTI Document ─────────────────────────────────────────
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

    // Show action buttons
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

  // ── Print ─────────────────────────────────────────────────────────
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

  // ── Quick RTI from Shame Board ────────────────────────────────────
  openFromHazard(hazardType, location, days) {
    this.openPanel({ type: hazardType, location, days });
  }
};

// ── Auto-init + inject RTI button into Shame Board cards ──────────
document.addEventListener('DOMContentLoaded', () => {
  setTimeout(() => {
    RTIEngine.init();

    // Watch for shame board / priority queue panels opening
    // and inject RTI button into each hazard card
    const obs = new MutationObserver(() => {
      // Shame board cards
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

      // Priority queue rows
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
