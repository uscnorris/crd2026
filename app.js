// ─────────────────────────────────────────────- 
// Cancer Research Day 2026 — App Logic
// ─────────────────────────────────────────────

const ROLES = [
  "Undergraduate Student",
  "PhD Student",
  "Master's Student",
  "Postdoctoral Fellow",
  "Clinical Fellow/Resident",
  "Faculty",
  "Community Member",
  "Staff / Other"
];

const PROGRAMS = [
  "Tumor Immunology & Microenvironment",
  "Epigenetic Regulation in Cancer",
  "Cancer Health Disparities",
  "Community Outreach & Engagement",
  "Translational and Clinical Sciences",
  "Cancer Biology & Genomics",
  "Cancer Prevention & Control",
  "Computational & Data Sciences",
  "Other"
];

const DISEASES = [
  "Breast",
  "GI / Colorectal",
  "GU / Prostate",
  "Hematologic",
  "Lung",
  "Neuro-oncology",
  "Melanoma / Skin",
  "Pediatric",
  "Cancer Prevention",
  "Multiple / Other"
];

// STATE
let allParticipants = [];
let currentSearch = '';
let user = null;
let conversations = {};   // id -> ISO timestamp
let coffeeSelections = new Set();

// Session ID — unique per browser, persists across the day
function getSessionId() {
  let sid = localStorage.getItem('crd2026_session');
  if (!sid) {
    sid = 'sess_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8);
    localStorage.setItem('crd2026_session', sid);
  }
  return sid;
}

// Silent POST to Apps Script backend — fire and forget
function track(payload) {
  if (!CONFIG.script_url || CONFIG.script_url === 'PASTE_YOUR_APPS_SCRIPT_URL_HERE') return;
  payload.session_id = getSessionId();
  payload.viewer_name  = user ? user.name    : '';
  payload.viewer_role  = user ? user.role    : '';
  payload.viewer_program = user ? user.program : '';
  fetch(CONFIG.script_url, {
    method: 'POST',
    mode: 'no-cors',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  }).catch(() => {}); // silent — never block the UI
}

let activeFilters = { role: new Set(), program: new Set(), disease: new Set(), clinical: new Set() };
let coffeeQuickFilterOn = false;
let currentSegment = 'posters';   // 'posters' | 'coffee'
let pendingFilters = { role: new Set(), program: new Set(), disease: new Set(), clinical: new Set() };

// ── INIT ──────────────────────────────────────

window.addEventListener('DOMContentLoaded', () => {
  // Clear stale localStorage from previous app versions
  const savedVersion = localStorage.getItem('crd2026_app_version');
  if (savedVersion !== '20') {
    localStorage.removeItem('crd2026_user');
    localStorage.removeItem('crd2026_conversations');
    localStorage.removeItem('crd2026_selections');
    localStorage.setItem('crd2026_app_version', '20');
  }
  loadState();
  buildFilterPanel();
  loadData();
  checkForProfileDeepLink();
  // Expand FAQ answers for print, restore afterward
  window.addEventListener('beforeprint', () => {
    document.querySelectorAll('.faq details').forEach(d => { d.dataset.wasOpen = d.open ? '1' : '0'; d.open = true; });
  });
  window.addEventListener('afterprint', () => {
    document.querySelectorAll('.faq details').forEach(d => { d.open = d.dataset.wasOpen === '1'; });
  });
});

function loadState() {
  try {
    const saved = localStorage.getItem('crd2026_user');
    if (saved) user = JSON.parse(saved);
    const convSaved = localStorage.getItem('crd2026_conversations');
    if (convSaved) conversations = JSON.parse(convSaved);
    const selSaved = localStorage.getItem('crd2026_selections');
    if (selSaved) coffeeSelections = new Set(JSON.parse(selSaved));
  } catch(e) {}
}

function saveState() {
  try {
    if (user) localStorage.setItem('crd2026_user', JSON.stringify(user));
    localStorage.setItem('crd2026_conversations', JSON.stringify(conversations));
    localStorage.setItem('crd2026_selections', JSON.stringify([...coffeeSelections]));
  } catch(e) {}
}

function checkForProfileDeepLink() {
  const params = new URLSearchParams(window.location.search);
  const profileId = params.get('p');
  if (profileId) window._pendingProfile = profileId;
}

// ── DATA LOADING ──────────────────────────────

let usingSampleData = false;

async function loadData() {
  if (!CONFIG.use_sample_data && CONFIG.sheet_url && CONFIG.sheet_url !== 'PASTE_YOUR_GOOGLE_SHEET_CSV_URL_HERE') {
    try {
      const resp = await fetch(CONFIG.sheet_url);
      if (!resp.ok) throw new Error('HTTP ' + resp.status);
      const csv = await resp.text();
      const parsed = parseCSV(csv);
      if (parsed.length === 0) throw new Error('CSV parsed 0 rows — check column headers match exactly');
      allParticipants = parsed;
      usingSampleData = false;
      console.log('Sheet loaded:', allParticipants.length, 'participants');
    } catch(e) {
      console.error('Sheet load failed:', e.message);
      console.warn('Falling back to sample data. Common causes:\n' +
        '1. URL is /export?format=csv — use /pub?gid=...&single=true&output=csv instead\n' +
        '2. Sheet is not published (File → Share → Publish to web)\n' +
        '3. Column headers in row 1 do not match expected names\n' +
        '4. No real rows yet — the Directory tab only lists poster presenters, so it can be genuinely empty this early');
      allParticipants = SAMPLE_DATA;
      usingSampleData = true;
    }
  } else {
    allParticipants = SAMPLE_DATA;
    usingSampleData = true;
  }
  decideStartView();
}

function parseCSV(csv) {
  const lines = csv.trim().split('\n');
  const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g,'').toLowerCase().replace(/ /g,'_'));
  return lines.slice(1).map(line => {
    const vals = parseCSVLine(line);
    const obj = {};
    headers.forEach((h, i) => {
      let v = (vals[i] || '').trim().replace(/^"|"$/g,'');
      if (h === 'clinical_input') v = v.toLowerCase() === 'true' || v === '1' || v.toLowerCase() === 'yes';
      obj[h] = v;
    });
    return obj;
  }).filter(r => r.name);
}

function parseCSVLine(line) {
  const result = []; let cur = '', inQuote = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (c === '"') { inQuote = !inQuote; continue; }
    if (c === ',' && !inQuote) { result.push(cur); cur = ''; continue; }
    cur += c;
  }
  result.push(cur);
  return result;
}

// ── IDENTITY ──────────────────────────────────

// Program options by role — sourced from keck.usc.edu/education/phd-programs,
// keck.usc.edu/pphs/education/doctoral-programs, keck.usc.edu/education/masters-programs,
// keck.usc.edu/pphs/education/masters-programs, keck.usc.edu/residencies-and-fellowships
const PROGRAMS_BY_ROLE = {
  "PhD Student": [
    // PIBBS programs (keck.usc.edu/pibbs/phd-programs)
    "Cancer Biology & Genomics (CBG) — PIBBS",
    "Development, Stem Cells & Regenerative Medicine — PIBBS",
    "Infectious Diseases, Immunology & Pathogenesis — PIBBS",
    "Medical Biophysics — PIBBS",
    // Population & Public Health Sciences (keck.usc.edu/pphs/education/doctoral-programs)
    "Biostatistics — PPHS",
    "Epidemiology — PPHS",
    "Health Behavior Research — PPHS",
    // Other Keck PhD programs
    "Integrative Anatomical Sciences",
    "MD-PhD (USC-Caltech)",
    "Other"
  ],
  "Master's Student": [
    // Keck master's programs (keck.usc.edu/education/masters-programs)
    "Cancer Biology & Molecular Medicine (MS)",
    "Clinical, Biomedical & Translational Investigations (MS)",
    "Global Medicine (MS)",
    "Integrative Anatomical Sciences (MS)",
    "Molecular Microbiology & Immunology (MS)",
    "Molecular Pathology & Experimental Medicine (MS)",
    "Narrative Medicine (MS)",
    "Neuroimaging & Informatics (MS)",
    "Stem Cell Biology & Regenerative Medicine (MS)",
    "Translational Biomedical Informatics (MS)",
    "Translational Biotechnology (MS)",
    // PPHS master's programs (keck.usc.edu/pphs/education/masters-programs)
    "Applied Biostatistics & Epidemiology (MS)",
    "Biostatistics (MS)",
    "Clinical Translational Research (MS)",
    "Master of Public Health (MPH)",
    "Public Health Data Science (MS)",
    "Addiction Science (MAS)",
    // Dornsife / other USC programs relevant to CRD
    "Biomedical Engineering (MS)",
    "Computational Molecular Biology (MS)",
    "Molecular Genetics & Biochemistry (MS)",
    "Molecular Pharmacology & Toxicology (MS)",
    "Neuroscience (MS)",
    "Other"
  ],
  "Postdoctoral Fellow": [
    "Cancer Biology & Genomics",
    "Tumor Immunology & Microenvironment",
    "Epigenetic Regulation in Cancer",
    "Translational and Clinical Sciences",
    "Cancer Prevention & Control",
    "Cancer Epidemiology",
    "Cancer Health Disparities",
    "Computational & Data Sciences",
    "Other"
  ],
  "Clinical Fellow/Resident": [
    // Oncology-adjacent fellowships most likely at Cancer Research Day
    // sourced from keck.usc.edu/residencies-and-fellowships
    "Medical Oncology Fellowship",
    "Hematology Fellowship",
    "Hematology/Oncology Fellowship",
    "Gynecologic Oncology Fellowship",
    "Radiation Oncology Residency",
    "Breast Surgical Oncology Fellowship",
    "Breast Imaging Fellowship",
    "Surgical Oncology Fellowship",
    "Pediatric Hematology/Oncology Fellowship",
    "Palliative Medicine Fellowship",
    "Pathology Residency",
    "Internal Medicine Residency",
    "General Surgery Residency",
    "Dermatology Residency",
    "Other"
  ],
  "Faculty": [
    // NCCC research programs (from image 3 in prior conversation)
    "Tumor Immunology & Microenvironment Program",
    "Epigenetic Regulation in Cancer Program",
    "Translational and Clinical Sciences Program",
    "Cancer Epidemiology Program",
    "Cancer Control Research Program",
    // Keck departments most likely at CRD
    "Division of Medical Oncology",
    "Division of Hematology",
    "Department of Medicine",
    "Department of Pathology",
    "Department of Radiation Oncology",
    "Department of Surgery",
    "Department of Pediatrics",
    "Biochemistry & Molecular Medicine",
    "Molecular Microbiology & Immunology",
    "Population & Public Health Sciences",
    "Cancer Biology & Genomics (CBG)",
    "Other"
  ]
};

// Header identity chip. No login exists any more — this only reflects who
// you picked when requesting a Coffee Consult, and lets you change it.
function showRoleInHeader() {
  const chip = document.getElementById('header-role-chip');
  const btn = document.getElementById('header-role-switch-btn');
  if (!chip || !btn) return;
  if (user && user.name) {
    chip.textContent = user.name;
    chip.style.display = 'inline';
    btn.textContent = 'Change';
    btn.style.display = 'inline';
  } else {
    chip.style.display = 'none';
    btn.style.display = 'none';   // nothing to change until you've requested
  }
}

// "Change" — clear the remembered selection and re-open the picker.
function switchRole() {
  localStorage.removeItem('crd2026_user');
  user = null;
  coffeeSelections.clear();
  saveState();
  updateBadgeCounts();
  showRoleInHeader();
  showSelfPicker();
}

function decideStartView() {
  refreshDataDrivenFilters();
  renderProgram();
  wireRegistrationLinks();
  // Deep link to a profile → jump straight into the directory
  if (window._pendingProfile) { openDirectory(); return; }
  showProgramMode();
}

// ── PROGRAM / DIRECTORY MODE TOGGLE ───────────

function showProgramMode() {
  document.getElementById('program-mode').style.display = '';
  document.getElementById('app-mode').classList.add('app-hidden');
  document.body.classList.remove('in-app');
  window.scrollTo(0, 0);
}

function openDirectory() {
  document.getElementById('program-mode').style.display = 'none';
  document.getElementById('app-mode').classList.remove('app-hidden');
  document.body.classList.add('in-app');
  window.scrollTo(0, 0);
  // No login, ever. The directory is open to everyone immediately — browsing
  // posters is the main job, and identity is only asked (as a pick, not a
  // form) at the moment someone requests a Coffee Consult.
  document.getElementById('bottom-nav').style.display = 'flex';
  const mlNav = document.getElementById('nav-mylist');
  if (mlNav) mlNav.style.display = 'flex';
  showRoleInHeader();
  updateBadgeCounts();
  if (window._pendingProfile) {
    const id = window._pendingProfile;
    window._pendingProfile = null;
    const p = allParticipants.find(x => x.id === id);
    if (p) { showProfile(p); return; }
  }
  showView('directory');
}

function backToProgram() {
  showProgramMode();
  return false;
}

// Open registration directly (no intermediate scroll). Falls back gracefully
// when the form URL isn't configured yet, so buttons never 404.
function registerNow() {
  const url = CONFIG.form_url;
  if (url && url.indexOf('PASTE') !== 0 && /^https?:/i.test(url)) {
    window.open(url, '_blank');
  } else {
    alert("Registration opens soon. Subscribe to Next in Science to be notified — or check back here.");
    goToSection('newsletter');
  }
}

// Opens the livestream if configured; otherwise a graceful "not live yet"
// message. The link goes live the morning of the event (CONFIG.links.livestream).
function joinLivestream() {
  const url = CONFIG.links && CONFIG.links.livestream;
  if (url && url.indexOf('PASTE') !== 0 && /^https?:/i.test(url)) {
    window.open(url, '_blank');
  } else {
    alert("The livestream link goes live the morning of the event — check back here on Oct 14, or watch for an email with the link.");
  }
}

// Nav that works from BOTH modes: leave the directory first, then scroll.
function goToSection(id) {
  if (document.body.classList.contains('in-app')) {
    backToProgram();
    setTimeout(() => scrollToId(id), 60);
  } else {
    scrollToId(id);
  }
  return false;
}
function scrollToId(id) {
  const el = document.getElementById(id);
  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  else window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Wire configured links (newsletter) and register fallback text.
function wireRegistrationLinks() {
  const contact = (CONFIG.info && CONFIG.info.contact_email);
  if (contact) {
    const fc = document.getElementById('footer-contact');
    if (fc) { fc.textContent = contact; fc.setAttribute('href', 'mailto:' + contact); }
  }
  const news = (CONFIG.links && CONFIG.links.newsletter) || '';
  const newsOk = news && news.indexOf('PASTE') !== 0 && /^https?:/i.test(news);
  document.querySelectorAll('a[href="[[NEWSLETTER_LINK]]"]').forEach(a => {
    if (newsOk) { a.setAttribute('href', news); }
    else { a.setAttribute('href', 'mailto:' + (contact || 'crtec@usc.edu') + '?subject=Subscribe%20to%20Next%20in%20Science'); }
  });
  const url = CONFIG.form_url;
  const fb = document.getElementById('reg-fallback');
  if (fb && (!url || url.indexOf('PASTE') === 0)) {
    fb.textContent = 'Registration form opening soon.';
  }
  // Optional overrides for CE and virtual copy from config
  if (CONFIG.ce_note) { const c = document.getElementById('ce-note'); if (c) c.textContent = CONFIG.ce_note; }
}

// ── IN-APP AGENDA ──────────────────────────────
// Same data as the landing page's agenda, but rendered inside app-mode so
// "what's happening / where do I go" is always one tap away, never a trip
// back out to the full marketing site.

function renderAppAgenda() {
  const wrap = document.getElementById('app-agenda-content');
  if (!wrap) return;
  const ag = CONFIG.agenda || [];
  const info = CONFIG.info || {};

  wrap.innerHTML = `
    <div class="app-agenda-header">
      <h2>${CONFIG.event_name || 'Agenda'}</h2>
      <div class="app-agenda-when">${CONFIG.event_date || ''} · ${CONFIG.event_time || ''}</div>
    </div>
    <div class="agenda-print-list">
      ${ag.map(s => `
        <div class="agenda-item ${s.tbd ? 'is-tbd' : ''}">
          <div class="agenda-time">${s.time}${s.loc ? `<div class="agenda-loc">${s.loc}</div>` : ''}</div>
          <div class="agenda-body">
            <div class="agenda-title">${s.title}${s.tag ? `<span class="agenda-tag">${s.tag}</span>` : ''}</div>
            <div class="agenda-desc">${s.desc || ''}</div>
          </div>
        </div>`).join('')}
    </div>
    <div class="app-agenda-info">
      ${info.wifi ? `<div class="info-row"><span class="info-k">Wi-Fi</span><span class="info-v">${info.wifi}</span></div>` : ''}
      ${info.parking ? `<div class="info-row"><span class="info-k">Parking</span><span class="info-v">${info.parking}</span></div>` : ''}
      ${info.contact_email ? `<div class="info-row"><span class="info-k">Questions</span><span class="info-v"><a href="mailto:${info.contact_email}">${info.contact_email}</a></span></div>` : ''}
    </div>
    <button class="btn-primary app-agenda-cta" onclick="showView('directory')">Open the directory →</button>`;
}

function showView(view) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
  document.getElementById(view + '-screen').classList.add('active');
  const navBtn = document.getElementById('nav-' + view);
  if (navBtn) navBtn.classList.add('active');
  if (view === 'directory') { renderCoffeeQuickFilter(); renderDirectory(); }
  if (view === 'mylist') renderMyList();
  if (view === 'agenda') renderAppAgenda();
  window.scrollTo(0, 0);
  if (view === 'directory') history.replaceState(null, '', window.location.pathname);
}

// ── FILTER PANEL ──────────────────────────────

function buildFilterPanel() {
  buildOptionGroup('role-options', 'role', ROLES);
  buildOptionGroup('program-options', 'program', (CONFIG.research_programs && CONFIG.research_programs.length) ? CONFIG.research_programs : PROGRAMS);
  buildOptionGroup('disease-options', 'disease', (CONFIG.disease_areas && CONFIG.disease_areas.length) ? CONFIG.disease_areas : DISEASES);
}

// Rebuild program/disease filters from the values actually present in the data,
// so the filter always matches the directory (runs after data loads).
function refreshDataDrivenFilters() {
  if (!allParticipants || !allParticipants.length) return;
  const uniq = key => [...new Set(allParticipants.map(p => (p[key] || '').trim()).filter(Boolean))].sort();
  const progs = uniq('research_program');
  const dis = uniq('disease_area');
  if (progs.length) buildOptionGroup('program-options', 'program', progs);
  if (dis.length) buildOptionGroup('disease-options', 'disease', dis);
}

function buildOptionGroup(containerId, group, options) {
  const el = document.getElementById(containerId);
  if (!el) return;
  el.innerHTML = options.map(opt =>
    `<button class="foption" data-group="${group}" data-val="${opt}" onclick="toggleFilter(this)">${opt}</button>`
  ).join('');
}

function openFilterPanel() {
  pendingFilters = {
    role: new Set(activeFilters.role),
    program: new Set(activeFilters.program),
    disease: new Set(activeFilters.disease),
    clinical: new Set(activeFilters.clinical)
  };
  document.querySelectorAll('.foption').forEach(btn => {
    const group = btn.dataset.group;
    const val = btn.dataset.val;
    btn.classList.toggle('selected', !!(pendingFilters[group] && pendingFilters[group].has(val)));
  });
  document.getElementById('filter-panel').style.display = 'flex';
  document.getElementById('filter-panel').style.flexDirection = 'column';
}

function closeFilterPanel() {
  document.getElementById('filter-panel').style.display = 'none';
}

function toggleFilter(btn) {
  const group = btn.dataset.group;
  const val = btn.dataset.val;
  if (!pendingFilters[group]) pendingFilters[group] = new Set();
  if (pendingFilters[group].has(val)) {
    pendingFilters[group].delete(val);
    btn.classList.remove('selected');
  } else {
    pendingFilters[group].add(val);
    btn.classList.add('selected');
  }
}

function clearAllFilters() {
  Object.keys(pendingFilters).forEach(g => pendingFilters[g].clear());
  document.querySelectorAll('.foption').forEach(btn => btn.classList.remove('selected'));
}

function applyFilters() {
  activeFilters = {
    role: new Set(pendingFilters.role),
    program: new Set(pendingFilters.program),
    disease: new Set(pendingFilters.disease),
    clinical: new Set(pendingFilters.clinical)
  };
  closeFilterPanel();
  updateFilterToggleBtn();
  renderDirectory();
}

function updateFilterToggleBtn() {
  const total = Object.values(activeFilters).reduce((n, s) => n + s.size, 0);
  const btn = document.getElementById('filter-toggle');
  const label = document.getElementById('filter-toggle-label');
  if (total > 0) {
    btn.classList.add('has-filters');
    label.textContent = `Filter (${total})`;
  } else {
    btn.classList.remove('has-filters');
    label.textContent = 'Filter';
  }
}

// ── DIRECTORY ─────────────────────────────────

function filterDirectory() {
  currentSearch = document.getElementById('search-input').value.toLowerCase();
  renderDirectory();
}

function getFilteredParticipants() {
  return allParticipants.filter(p => {
    if (currentSearch) {
      const haystack = [p.name, p.title, p.disease_area, p.research_program, p.department, p.summary, p.role]
        .join(' ').toLowerCase();
      if (!haystack.includes(currentSearch)) return false;
    }
    if (activeFilters.role.size > 0 && !activeFilters.role.has(p.role)) return false;
    if (activeFilters.program.size > 0 && !activeFilters.program.has(p.research_program)) return false;
    if (activeFilters.disease.size > 0 && !activeFilters.disease.has(p.disease_area)) return false;
    if (activeFilters.clinical.size > 0 && activeFilters.clinical.has('true') && !isCoffeeEligible(p)) return false;
    if (coffeeQuickFilterOn && !isCoffeeEligible(p)) return false;
    if (currentSegment === 'posters' && !p.poster_number) return false;
    if (currentSegment === 'coffee' && !isCoffeeEligible(p)) return false;
    return true;
  });
}

// Renders the "Show my Coffee Consult matches" chip above the search bar.
// Label and eligibility are computed from the CURRENT viewer's role against
// the live connection_tracks config, so it stays correct even if the track
// definition changes — no hardcoded role names here.
function renderCoffeeQuickFilter() {
  const wrap = document.getElementById('coffee-quickfilter-wrap');
  if (!wrap) return;

  const banner = usingSampleData
    ? `<div class="sample-data-banner">\u26a0\ufe0f Showing sample/preview data, not real registrations \u2014 see console for why, or check config.js.</div>`
    : '';

  if (currentSegment !== 'coffee') { wrap.innerHTML = banner; return; }

  const url = CONFIG.form_url;
  const canRegister = url && url.indexOf('PASTE') !== 0;

  // Instructions as numbered commands, not description. Side legend uses the
  // same cardinal/gold tint as the cards themselves, so the colour is the key.
  wrap.innerHTML = banner + `
    <div class="coffee-explainer">
      <ol class="cc-steps">
        <li>Find your side below \u2014 <span class="cc-key cc-key-research">research trainee</span> or <span class="cc-key cc-key-clinical">clinical trainee</span>.</li>
        <li>Browse the <strong>other</strong> side. You can only be matched across sides.</li>
        <li>Open a profile and tap <strong>Request Coffee Consult</strong>.</li>
        <li>Confirm your registered email. CRTEC arranges the match and emails you both.</li>
      </ol>
      <p class="coffee-explainer-foot">Not listed? Only trainees who opted in at registration appear here.
      ${canRegister ? `<a href="${url}" target="_blank" rel="noopener">Opt in on the registration form</a> \u2014 resubmit with the same email and you'll appear within a few minutes.` : 'Contact CRTEC to opt in.'}</p>
    </div>`;
}

function setSegment(seg) {
  currentSegment = seg;
  document.querySelectorAll('#dir-segments .seg-btn').forEach(b => {
    b.classList.toggle('active', b.dataset.seg === seg);
  });
  coffeeQuickFilterOn = false;
  renderCoffeeQuickFilter();
  renderDirectory();
}

function toggleCoffeeQuickFilter() {
  coffeeQuickFilterOn = !coffeeQuickFilterOn;
  renderCoffeeQuickFilter();
  renderDirectory();
}

function renderDirectory() {
  const results = getFilteredParticipants();
  const totalFilters = Object.values(activeFilters).reduce((n, s) => n + s.size, 0);
  document.getElementById('results-count').textContent =
    `${results.length} participant${results.length !== 1 ? 's' : ''}${totalFilters > 0 ? ' — filters active' : ''}`;

  if (results.length === 0) {
    document.getElementById('directory-list').innerHTML =
      '<div class="empty-state"><div class="empty-icon">🔍</div><p>No results. Try adjusting your search or filters.</p></div>';
    return;
  }

  document.getElementById('directory-list').innerHTML = results.map(p => {
    const requested = coffeeSelections.has(p.id);
    return `
      <div class="participant-card ${requested ? 'talked' : ''} ${isCoffeeEligible(p) ? (coffeeSideOf(p) === 'B' ? 'card-clinical' : 'card-research') : ''}" onclick="showProfile(getParticipant('${p.id}'))">
        <div class="card-avatar ${avatarClass(p.role)}">${initials(p.name)}</div>
        <div class="card-body">
          <div class="card-name-row">
            <span class="card-name">${p.name}</span>
            ${requested ? '<span class="talked-badge">☕ Requested</span>' : ''}
          </div>
          <div class="card-meta">${p.role}${p.year ? ' · ' + p.year : ''}${p.department ? ' · ' + p.department : ''}</div>
          <div class="card-title">${p.title || ''}</div>
          <div class="card-tags">
            ${p.poster_number
              ? `<span class="chip">Poster ${p.poster_number}</span>`
              : '<span class="chip chip-quiet">No poster \u00b7 here to connect</span>'}
            ${p.disease_area ? `<span class="chip">${p.disease_area}</span>` : ''}
            ${isCoffeeEligible(p) ? `<span class="chip chip-side">☕ ${sideLabel(coffeeSideOf(p))} trainee</span>` : ''}
          </div>
        </div>
      </div>`;
  }).join('');
}

function getParticipant(id) {
  return allParticipants.find(p => p.id === id);
}

// ── PROFILE ───────────────────────────────────

// ── CONNECTION TRACKS ENGINE ──────────────────
// Config-driven. A "person" is {role, program} where program is any string
// (viewer.program, or participant.research_program + department).

function personProgramStr(person) {
  return ((person.program || '') + ' ' + (person.research_program || '') + ' ' + (person.department || '')).toLowerCase();
}

function personMatchesSide(person, side) {
  if (!side || !side.roles) return false;
  if (!side.roles.includes(person.role)) return false;
  // Optional opt-in flag: person must have a truthy flag (e.g. faculty opting into mentoring)
  if (side.requiresFlag) {
    const f = String(person[side.requiresFlag] || '').toLowerCase();
    if (!(f === 'true' || f === 'yes' || f === '1')) return false;
  }
  if (!side.programMatch) return true;
  const str = personProgramStr(person);
  if (!str.trim()) return true; // trust role when no program data at all
  return side.programMatch.some(sub => str.includes(sub));
}

// Returns the first applicable track object for a viewer<->participant pair, or null.
function matchTrack(viewer, participant) {
  if (!viewer || !participant) return null;
  const tracks = (CONFIG.connection_tracks || []);
  for (const t of tracks) {
    const fwd = personMatchesSide(viewer, t.sideA) && personMatchesSide(participant, t.sideB);
    const rev = personMatchesSide(viewer, t.sideB) && personMatchesSide(participant, t.sideA);
    if (fwd || rev) return t;
  }
  return null;
}

// Track object for a viewer + a participant record (used in profile / mylist)
function trackForPair(viewerRole, viewerProgram, p) {
  const viewer = { role: viewerRole, program: viewerProgram };
  const participant = Object.assign({}, p, { role: p.role });
  return matchTrack(viewer, participant);
}

// Does this viewer have ANY track available across the directory? (subtitle logic)
function viewerHasAnyTrack(viewerRole, viewerProgram) {
  const viewer = { role: viewerRole, program: viewerProgram };
  return (CONFIG.connection_tracks || []).some(t =>
    personMatchesSide(viewer, t.sideA) || personMatchesSide(viewer, t.sideB));
}

// Back-compat boolean wrapper (kept so any other call sites still work)
function isCoffeeEligiblePair(viewerRole, participantRole, viewerProgram, participantProgram, participantDept) {
  return !!matchTrack(
    { role: viewerRole, program: viewerProgram },
    { role: participantRole, research_program: participantProgram, department: participantDept }
  );
}

function showProfile(participant) {
  if (!participant) return;
  const selected = coffeeSelections.has(participant.id);
  const eligible = isCoffeeEligible(participant);

  // ── Coffee Consult: one button, no conversation logging, no login gate.
  // Identity is only needed at the moment of requesting, and even then it's
  // a pick-yourself-from-the-list step — everyone here already registered,
  // so we never re-collect a name or email.
  let connectCard = '';
  if (eligible) {
    const t = (CONFIG.connection_tracks || [])[0];
    const me = user && user.id ? allParticipants.find(x => x.id === user.id) : null;
    const sameSide = me && coffeeSideOf(me) && coffeeSideOf(me) === coffeeSideOf(participant);
    const isMe = me && me.id === participant.id;

    if (isMe) {
      connectCard = `<p class="step-hint">This is your own entry.</p>`;
    } else if (sameSide) {
      // Explain instead of offering a button that would just fail.
      connectCard = `<div class="request-blocked">
          ${t.icon} Coffee Consult pairs a <strong>research trainee</strong> with a <strong>clinical trainee</strong>.
          You are both on the ${sideLabel(coffeeSideOf(participant)).toLowerCase()} side, so this pairing isn't available.
        </div>`;
    } else if (selected) {
      connectCard = `<div class="request-sent">
           <span>${t.icon} Request sent — CRTEC will confirm your match</span>
           <button class="btn-undo-text" onclick="toggleCoffee('${participant.id}')">Undo</button>
         </div>`;
    } else {
      connectCard = `<button class="btn-coffee" onclick="toggleCoffee('${participant.id}')">${t.icon} Request Coffee Consult</button>
         <p class="step-hint">This sends a request — you won't be automatically paired. CRTEC confirms every match and emails you both.</p>`;
    }
  }

  // ── Compact contact row: icon-only LinkedIn, plain email text. Replaces
  // the old full-width blue LinkedIn bar and boxed email field.
  const contactRow = (participant.linkedin_url || participant.email)
    ? `<div class="profile-contact">
        ${participant.email ? `<a class="contact-email" href="mailto:${participant.email}">${participant.email}</a>` : ''}
        ${participant.linkedin_url ? `<a class="contact-linkedin" href="${participant.linkedin_url}" target="_blank" title="Connect on LinkedIn" aria-label="Connect on LinkedIn">in</a>` : ''}
       </div>`
    : '';

  // ── Poster location: one line, one badge — not two competing colors.
  let posterLine = '';
  if (participant.poster_number) {
    const sectionLetter = participant.poster_number.split('-')[0];
    const sectionInfo = (CONFIG.poster_rows && CONFIG.poster_rows[sectionLetter]) || '';
    posterLine = `<div class="profile-location">
        <span class="location-badge">Poster ${participant.poster_number}</span>
        <span class="location-text">${sectionInfo || 'Ask at check-in for help finding this poster.'}${sectionInfo ? ' · board # posted on-site' : ''}</span>
      </div>`;
  }

  // ── Bio: what THEY submitted about themselves — separate from the
  // research summary, shown only when present.
  const bioBlock = participant.bio
    ? `<div class="profile-block">
        <div class="block-label">About</div>
        <p class="profile-bio">${participant.bio}</p>
       </div>`
    : '';

  document.getElementById('profile-content').innerHTML = `
    <div class="profile-wrap">
      <div class="profile-hero">
        <div class="profile-avatar ${avatarClass(participant.role)}">${initials(participant.name)}</div>
        <div class="profile-hero-info">
          <div class="profile-name">${participant.name}</div>
          <div class="profile-meta">${participant.role}${participant.year ? ' · ' + participant.year : ''}</div>
          <div class="profile-dept">${participant.department || ''}</div>
        </div>
      </div>
      ${contactRow}
      ${posterLine}
      ${bioBlock}
      <div class="profile-block">
        ${participant.title
          ? `<div class="block-label">Poster</div>
             <div class="profile-title">${participant.title}</div>
             <div class="profile-summary">${participant.summary || ''}</div>`
          : `<div class="block-label">Research interests</div>
             <p class="profile-summary no-poster-note">Not presenting a poster this year \u2014 here to connect through Coffee Consult.</p>`}
        <div class="profile-tags">
          ${participant.disease_area ? `<span class="chip">${participant.disease_area}</span>` : ''}
          ${participant.research_program ? `<span class="chip">${participant.research_program}</span>` : ''}
          ${isCoffeeEligible(participant) ? `<span class="chip chip-side">☕ ${sideLabel(coffeeSideOf(participant))} trainee · open to Coffee Consult</span>` : ''}
        </div>
      </div>
      <div class="profile-connect">${connectCard}</div>
    </div>`;

  showView('profile');
  history.replaceState(null, '', `?p=${participant.id}`);
  // Track profile view silently
  track({
    action: 'view_profile',
    participant_id: participant.id,
    participant_name: participant.name,
    participant_role: participant.role,
    participant_program: participant.research_program || participant.department || ''
  });
}

// ── COFFEE CONSULT ────────────────────────────
// Everyone in the directory registered through the form, so we already have
// their name and email. Identity is therefore never typed — when someone
// requests a match, they pick themselves from the registered list, once.

// Is this person part of Coffee Consult at all? Requires BOTH that their
// role is on one side of the track AND that they opted in on the form
// (the `mentoring` column, written by Code.gs from the opt-in question).
function isCoffeeEligible(p) {
  if (!p) return false;
  const optedIn = String(p.mentoring || '').toLowerCase() === 'true';
  if (!optedIn) return false;
  const t = (CONFIG.connection_tracks || [])[0];
  if (!t) return false;
  return personMatchesSide(p, t.sideA) || personMatchesSide(p, t.sideB);
}

// Which side is this person on? Used to show them the OTHER side.
// Human-readable label for a Coffee Consult side.
function sideLabel(side) {
  if (side === 'A') return 'Research';
  if (side === 'B') return 'Clinical';
  return '';
}

function coffeeSideOf(p) {
  const t = (CONFIG.connection_tracks || [])[0];
  if (!t) return null;
  if (personMatchesSide(p, t.sideA)) return 'A';
  if (personMatchesSide(p, t.sideB)) return 'B';
  return null;
}

// Everyone opted in to Coffee Consult, optionally limited to the side
// opposite `me` (so people only ever see valid matches).
function coffeeEligiblePeople(oppositeOf) {
  const list = allParticipants.filter(isCoffeeEligible);
  if (!oppositeOf) return list;
  const mySide = coffeeSideOf(oppositeOf);
  if (!mySide) return list;
  return list.filter(p => p.id !== oppositeOf.id && coffeeSideOf(p) !== mySide);
}

function toggleCoffee(id) {
  // Undo is always allowed without identity.
  if (coffeeSelections.has(id)) {
    coffeeSelections.delete(id);
    saveState();
    updateBadgeCounts();
    const p = allParticipants.find(x => x.id === id);
    if (p) showProfile(p);
    return;
  }
  // Need to know who is requesting — verified by their registered email.
  if (!user || !user.id) {
    window._pendingRequest = id;
    showSelfPicker();
    return;
  }
  // Coffee Consult pairs bench with clinic. Enforce that here as well as in
  // the UI, so a stale page or a direct call can't create an invalid pair.
  const target = allParticipants.find(x => x.id === id);
  const me = allParticipants.find(x => x.id === user.id);
  if (target && me && coffeeSideOf(me) && coffeeSideOf(target) === coffeeSideOf(me)) {
    alert('Coffee Consult pairs a research trainee with a clinical trainee. You can only request someone from the other side.');
    return;
  }
  if (coffeeSelections.size >= CONFIG.max_selections) {
    alert(`You can request up to ${CONFIG.max_selections} Coffee Consults. Undo one first.`);
    return;
  }
  coffeeSelections.add(id);
  saveState();
  updateBadgeCounts();
  const p = allParticipants.find(x => x.id === id);
  if (p) {
    const t = (CONFIG.connection_tracks || [])[0] || {};
    track({
      action: 'coffee',
      action_type: 'selected',
      track_id: t.id || 'coffee',
      track_name: t.name || 'Coffee Consult',
      track_aim: t.aim || '',
      requester_name: user.name,
      requester_role: user.role,
      requester_program: user.research_program || user.department || '',
      participant_id: p.id,
      participant_name: p.name,
      participant_role: p.role,
      participant_program: p.research_program || p.department || ''
    });
    showProfile(p);
  }
}

// "Which one are you?" — a searchable list of registered Coffee Consult
// participants. No typing a name, no email re-entry, no account.
// ── Identify yourself by EMAIL, not by picking from a list ──
// A browsable list of names would let anyone claim to be someone else and
// send requests in their name. Requiring the email you registered with means
// you can only act as yourself.
function showSelfPicker() {
  const modal = document.getElementById('selfpicker-modal');
  document.getElementById('selfpicker-error').textContent = '';
  document.getElementById('selfpicker-email').value = '';
  const link = document.getElementById('selfpicker-register-link');
  if (link) {
    const url = CONFIG.form_url;
    if (url && url.indexOf('PASTE') !== 0) { link.href = url; link.style.display = 'inline'; }
    else { link.style.display = 'none'; }
  }
  modal.style.display = 'flex';
  setTimeout(() => document.getElementById('selfpicker-email').focus(), 50);
}

function closeSelfPicker() {
  document.getElementById('selfpicker-modal').style.display = 'none';
  window._pendingRequest = null;
}

// Look the email up against the registered directory.
function confirmSelfByEmail() {
  const input = (document.getElementById('selfpicker-email').value || '').trim().toLowerCase();
  const errEl = document.getElementById('selfpicker-error');
  if (!input) { errEl.textContent = 'Please enter your email address.'; return; }

  const me = allParticipants.find(p => (p.email || '').trim().toLowerCase() === input);
  if (!me) {
    errEl.innerHTML = 'We could not find that email in the directory. Coffee Consult is open to trainees who opted in when they registered \u2014 you can opt in or update your details using the registration form below, then try again in a few minutes.';
    return;
  }
  if (!isCoffeeEligible(me)) {
    errEl.innerHTML = 'That email is registered, but is not currently opted in to Coffee Consult. You can opt in using the registration form below \u2014 resubmitting updates your existing entry.';
    return;
  }
  user = { id: me.id, name: me.name, role: me.role, program: me.research_program || me.department || '' };
  saveState();
  track({ action: 'identify', name: me.name, role: me.role, program: user.program });
  showRoleInHeader();
  document.getElementById('selfpicker-modal').style.display = 'none';
  const pending = window._pendingRequest;
  window._pendingRequest = null;
  if (pending) toggleCoffee(pending);
}

function updateBadgeCounts() {
  const count = coffeeSelections.size;
  document.getElementById('list-count-badge').textContent = count;
  const navCount = document.getElementById('nav-count');
  navCount.textContent = count;
  navCount.style.display = count > 0 ? 'inline' : 'none';
}

// ── MY LIST ───────────────────────────────────

function renderMyList() {
  updateBadgeCounts();
  const ids = [...coffeeSelections];
  const wrap = document.getElementById('mylist-content');
  const empty = document.getElementById('mylist-empty');
  const submitWrap = document.getElementById('submit-wrap');

  document.getElementById('mylist-sub').textContent = user && user.name
    ? `Requesting as ${user.name}. CRTEC confirms every match and emails you both.`
    : 'Coffee Consult requests you\'ve made. CRTEC confirms every match.';

  if (ids.length === 0) {
    wrap.innerHTML = '';
    empty.style.display = 'block';
    submitWrap.style.display = 'none';
    return;
  }
  empty.style.display = 'none';

  wrap.innerHTML = ids.map(id => {
    const p = allParticipants.find(x => x.id === id);
    if (!p) return '';
    return `
      <div class="mylist-card selected">
        <div class="mylist-avatar ${avatarClass(p.role)}" onclick="showProfile(getParticipant('${id}'))">${initials(p.name)}</div>
        <div class="mylist-info" onclick="showProfile(getParticipant('${id}'))">
          <div class="mylist-name">${p.name}</div>
          <div class="mylist-meta">${p.role}${p.department ? ' · ' + p.department : ''}</div>
          <div class="mylist-title">${(p.title || '').substring(0, 65)}${(p.title || '').length > 65 ? '\u2026' : ''}</div>
        </div>
        <div class="mylist-actions">
          <button class="btn-undo-text" onclick="event.stopPropagation(); toggleCoffee('${id}')">Undo</button>
        </div>
      </div>`;
  }).join('');

  submitWrap.style.display = 'block';
  document.getElementById('submit-btn').textContent =
    `Send ${ids.length} request${ids.length > 1 ? 's' : ''} to CRTEC`;
}

function submitCoffeeConsult() {
  if (coffeeSelections.size === 0) return;
  const lines = [...coffeeSelections].map(id => {
    const p = allParticipants.find(x => x.id === id);
    const t = p ? trackForPair(user ? user.role : '', user ? user.program : '', p) : null;
    return p ? `${p.name} (${t ? t.name : 'connection'})` : id;
  });
  if (CONFIG.form_url && CONFIG.form_url !== 'PASTE_YOUR_GOOGLE_FORM_URL_HERE') {
    window.open(CONFIG.form_url, '_blank');
  } else {
    const email = (CONFIG.info && CONFIG.info.contact_email) || 'crtec@usc.edu';
    const body = `Connection Requests\n\nSubmitted by: ${user.name} (${user.role})\nRequests: ${lines.join('; ')}\nTime: ${new Date().toLocaleString()}`;
    const a = document.createElement('a');
    a.href = `mailto:${email}?subject=${encodeURIComponent('CRD connection requests — ' + user.name)}&body=${encodeURIComponent(body)}`;
    a.target = '_blank';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }
  alert(`Submitted! CRTEC will confirm your connection${coffeeSelections.size > 1 ? 's' : ''} within 48 hours.`);
}

// ── PROGRAM CONTENT (landing / print) ─────────

function renderProgram() {
  const ag = CONFIG.agenda || [];
  const agEl = document.getElementById('program-agenda');
  if (agEl) {
    agEl.innerHTML = ag.map(s => `
      <div class="agenda-item ${s.tbd ? 'is-tbd' : ''}">
        <div class="agenda-time">${s.time}${s.loc ? `<div class="agenda-loc">${s.loc}</div>` : ''}</div>
        <div class="agenda-body">
          <div class="agenda-title">${s.title}${s.tag ? `<span class="agenda-tag">${s.tag}</span>` : ''}</div>
          <div class="agenda-desc">${s.desc || ''}</div>
        </div>
      </div>`).join('');
  }

  const facts = document.getElementById('program-posters');
  if (facts) {
    facts.innerHTML = `
      <div class="fact"><div class="fact-big">4 × 4 ft</div><div class="fact-lbl">Maximum poster size</div></div>
      <div class="fact"><div class="fact-big">3 × $100</div><div class="fact-lbl">Scientific award prizes<br><span class="fact-note">Trainees only</span></div></div>
      <div class="fact"><div class="fact-big">Oct 2</div><div class="fact-lbl">Submission deadline</div></div>`;
  }

  const tracksEl = document.getElementById('program-tracks');
  if (tracksEl) {
    tracksEl.innerHTML = (CONFIG.connection_tracks || []).map(t => `
      <div class="track-card">
        <span class="track-card-icon">${t.icon}</span>
        <div class="track-card-name">${t.name}</div>
        <div class="track-card-aim">${t.aim}</div>
        <div class="track-card-purpose">${t.purpose}</div>
      </div>`).join('');
  }

  const infoEl = document.getElementById('program-info');
  const info = CONFIG.info || {};
  if (infoEl) {
    const rows = [
      ['Date & time', `${CONFIG.event_date} · ${CONFIG.event_time}`],
      ['Location', info.location || CONFIG.event_location || ''],
      ['Wi-Fi', info.wifi || ''],
      ['Parking', info.parking || ''],
      ['Questions', `<a href="mailto:${info.contact_email || ''}">${info.contact_email || ''}</a>`]
    ].filter(r => r[1]);
    infoEl.innerHTML = rows.map(r => `<div class="info-row"><span class="info-k">${r[0]}</span><span class="info-v">${r[1]}</span></div>`).join('');
  }
}

// ── HELPERS ───────────────────────────────────

function initials(name) {
  if (!name) return '?';
  return name.replace('Dr. ', '').split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();
}

function avatarClass(role) {
  if (!role) return 'avatar-other';
  const r = role.toLowerCase();
  if (r.includes('phd') || r.includes('doctoral')) return 'avatar-phd';
  if (r.includes("master")) return 'avatar-masters';
  if (r.includes('postdoc')) return 'avatar-postdoc';
  if (r.includes('clinical fellow') || r.includes('resident')) return 'avatar-fellow';
  if (r.includes('faculty')) return 'avatar-faculty';
  if (r.includes('community')) return 'avatar-community';
  return 'avatar-other';
}
