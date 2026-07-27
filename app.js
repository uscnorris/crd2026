// ─────────────────────────────────────────────- 
// Cancer Research Day 2026 — App Logic
// ─────────────────────────────────────────────

const ROLES = [
  "Undergraduate Student",
  "PhD Student",
  "Master's Student",
  "Postdoctoral Fellow",
  "Clinical Fellow / Resident",
  "Faculty",
  "Community Member",
  "Staff / Other"
];

const PROGRAMS = [
  "Tumor Immunology & Microenvironment",
  "Epigenetic Regulation in Cancer",
  "Cancer Health Disparities",
  "Community Outreach & Engagement",
  "Translational & Clinical Sciences",
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

async function loadData() {
  if (!CONFIG.use_sample_data && CONFIG.sheet_url && CONFIG.sheet_url !== 'PASTE_YOUR_GOOGLE_SHEET_CSV_URL_HERE') {
    try {
      const resp = await fetch(CONFIG.sheet_url);
      if (!resp.ok) throw new Error('HTTP ' + resp.status);
      const csv = await resp.text();
      const parsed = parseCSV(csv);
      if (parsed.length === 0) throw new Error('CSV parsed 0 rows — check column headers match exactly');
      allParticipants = parsed;
      console.log('Sheet loaded:', allParticipants.length, 'participants');
    } catch(e) {
      console.error('Sheet load failed:', e.message);
      console.warn('Falling back to sample data. Common causes:\n' +
        '1. URL is /export?format=csv — use /pub?gid=...&single=true&output=csv instead\n' +
        '2. Sheet is not published (File → Share → Publish to web)\n' +
        '3. Column headers in row 1 do not match expected names');
      allParticipants = SAMPLE_DATA;
    }
  } else {
    allParticipants = SAMPLE_DATA;
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
    "Translational & Clinical Sciences",
    "Cancer Prevention & Control",
    "Cancer Epidemiology",
    "Cancer Health Disparities",
    "Computational & Data Sciences",
    "Other"
  ],
  "Clinical Fellow / Resident": [
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
    "Translational & Clinical Sciences Program",
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

function onRoleChange() {
  const role = document.getElementById('user-role').value;
  const programRow = document.getElementById('program-row');
  const programOtherRow = document.getElementById('program-other-row');
  const programSelect = document.getElementById('user-program');
  const programLabel = document.getElementById('program-label');
  const options = PROGRAMS_BY_ROLE[role];

  if (options) {
    // Populate the dropdown with role-specific options
    programSelect.innerHTML = '<option value="" selected disabled>Select your program</option>' +
      options.map(o => `<option value="${o}">${o}</option>`).join('');
    if (role === 'Faculty') programLabel.textContent = 'Research Program / Department';
    else if (role === 'Clinical Fellow / Resident') programLabel.textContent = 'Fellowship / Residency Program';
    else programLabel.textContent = 'Program';
    programRow.style.display = 'block';
    programOtherRow.style.display = 'none';
    // Show text field when Other is selected
    programSelect.onchange = function() {
      programOtherRow.style.display = this.value === 'Other' ? 'block' : 'none';
    };
  } else {
    // Roles without a curated dropdown: show open text field instead
    programRow.style.display = 'none';
    programOtherRow.style.display = 'block';
    const otherLabel = document.getElementById('program-other-label');
    if (otherLabel) otherLabel.textContent = 'Program / Department (optional)';
    const otherInput = document.getElementById('user-program-other');
    if (otherInput) { otherInput.value = ''; otherInput.placeholder = 'e.g. Norris Cancer Center, Community Advisory Board'; }
  }
}

function saveIdentity() {
  const name = document.getElementById('user-name').value.trim();
  const roleEl = document.getElementById('user-role');
  const role = roleEl.options[roleEl.selectedIndex] ? roleEl.options[roleEl.selectedIndex].value : roleEl.value;
  if (!name) { alert('Please enter your name.'); return; }
  if (!role) { alert('Please select your role.'); return; }
  const programEl = document.getElementById('user-program');
  const programRowVisible = document.getElementById('program-row') && document.getElementById('program-row').style.display !== 'none';
  let program = (programRowVisible && programEl) ? (programEl.options[programEl.selectedIndex] ? programEl.options[programEl.selectedIndex].value : '') : '';
  if (program === 'Other' || !program) {
    const otherEl = document.getElementById('user-program-other');
    const otherVisible = document.getElementById('program-other-row') && document.getElementById('program-other-row').style.display !== 'none';
    if (otherVisible && otherEl && otherEl.value.trim()) program = otherEl.value.trim();
  }
  user = { name, role, program };
  saveState();
  track({ action: 'identify', name, role, program });
  if (allParticipants.length === 0) {
    setTimeout(showPostIdentity, 300);
  } else {
    showPostIdentity();
  }
}

function showPostIdentity() {
  // Show bottom nav for everyone
  const nav = document.getElementById('bottom-nav');
  nav.removeAttribute('style');
  nav.style.display = 'flex';

  // My List is visible to EVERYONE — tracks conversations and connections
  const mlBtn = document.getElementById('mylist-header-btn');
  mlBtn.removeAttribute('style');
  mlBtn.style.display = 'flex';
  mlBtn.style.visibility = 'visible';

  const mlNav = document.getElementById('nav-mylist');
  if (mlNav) {
    mlNav.removeAttribute('style');
    mlNav.style.display = 'flex';
  }

  showRoleInHeader();

  if (window._pendingProfile) {
    const id = window._pendingProfile;
    window._pendingProfile = null;
    const p = allParticipants.find(x => x.id === id);
    if (p) { showProfile(p); return; }
  }
  if (window._pendingLog) {
    const id = window._pendingLog;
    window._pendingLog = null;
    logConversation(id);
    return;
  }
  showView('directory');
}

function showRoleInHeader() {
  const row = document.getElementById('header-role-row');
  const chip = document.getElementById('header-role-chip');
  if (!row || !chip || !user) return;
  chip.textContent = user.name + (user.role ? ' · ' + user.role : '');
  row.style.display = 'flex';
}

function switchRole() {
  // Clear user so identity screen shows again
  localStorage.removeItem('crd2026_user');
  user = null;
  document.getElementById('header-role-row').style.display = 'none';
  document.getElementById('bottom-nav').style.display = 'none';
  document.getElementById('mylist-header-btn').style.display = 'none';
  // Pre-fill name if we remember it
  showView('identity');
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
  if (user) {
    showPostIdentity();
  } else {
    // Browse first; identity is prompted only when someone logs a conversation
    showView('directory');
    document.getElementById('bottom-nav').style.display = 'flex';
    document.getElementById('nav-mylist').style.display = 'none';
    document.getElementById('mylist-header-btn').style.display = 'none';
  }
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

// Open the livestream directly. Falls back gracefully when the link isn't
// configured yet (e.g. before the morning of the event).
function joinLivestream() {
  const url = CONFIG.links && CONFIG.links.livestream;
  if (url && url.indexOf('PASTE') !== 0 && /^https?:/i.test(url)) {
    window.open(url, '_blank');
  } else {
    alert("The livestream link goes live the morning of the event and is emailed to registered attendees. Check back here on October 14.");
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

// ── NAVIGATION ────────────────────────────────

function showView(view) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
  document.getElementById(view + '-screen').classList.add('active');
  const navBtn = document.getElementById('nav-' + view);
  if (navBtn) navBtn.classList.add('active');
  if (view === 'directory') renderDirectory();
  if (view === 'mylist') renderMyList();
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
    if (activeFilters.clinical.size > 0 && activeFilters.clinical.has('true') && !p.clinical_input) return false;
    return true;
  });
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
    const talked = conversations[p.id];
    return `
      <div class="participant-card ${talked ? 'talked' : ''}" onclick="showProfile(getParticipant('${p.id}'))">
        <div class="card-avatar ${avatarClass(p.role)}">${initials(p.name)}</div>
        <div class="card-body">
          <div class="card-name-row">
            <span class="card-name">${p.name}</span>
            ${talked ? '<span class="talked-badge">✓ Logged</span>' : ''}
          </div>
          <div class="card-meta">${p.role}${p.year ? ' · ' + p.year : ''}${p.department ? ' · ' + p.department : ''}</div>
          <div class="card-title">${p.title || ''}</div>
          <div class="card-tags">
            ${p.poster_number ? `<span class="poster-badge">Poster ${p.poster_number}</span>` : ''}
            ${p.disease_area ? `<span class="disease-badge">${p.disease_area}</span>` : ''}
            ${p.clinical_input ? '<span class="clinical-badge">Open to clinical input</span>' : ''}
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
  const talked = conversations[participant.id];
  const selected = coffeeSelections.has(participant.id);
  const viewerRole = user ? user.role : '';
  const viewerProgram = user ? (user.program || '') : '';
  const track = trackForPair(viewerRole, viewerProgram, participant);

  // Log button — with undo option
  const logBtn = talked
    ? `<div class="log-done-row">
        <button class="btn-talked-done" disabled>✓ Conversation logged</button>
        <button class="btn-undo-log" onclick="undoConversation('${participant.id}')" title="Undo">✕ Undo</button>
       </div>`
    : `<button class="btn-log" onclick="logConversation('${participant.id}')">I talked to this person</button>`;

  // Connection track — only shown when a track applies to this pair
  let coffeeBtn = '';
  if (track) {
    const tag = `<div class="track-banner"><span class="track-icon">${track.icon}</span><div><span class="track-name">${track.name}</span><span class="track-aim">${track.aim}</span></div></div><p class="track-purpose">${track.purpose}</p>`;
    if (talked) {
      coffeeBtn = selected
        ? `<div class="log-done-row">
            <button class="btn-talked-done coffee-done" disabled>${track.icon} Requested · ${track.name}</button>
            <button class="btn-undo-log" onclick="toggleCoffee('${participant.id}')" title="Remove">✕ Undo</button>
           </div>`
        : `${tag}<button class="btn-coffee" onclick="toggleCoffee('${participant.id}')">${track.icon} ${track.cta}</button>`;
    } else {
      coffeeBtn = `${tag}<p class="coffee-hint">Log this conversation first to request the ${track.name}.</p>`;
    }
  }

  // LinkedIn — shown if URL exists
  const linkedinBtn = participant.linkedin_url
    ? `<a href="${participant.linkedin_url}" target="_blank" class="btn-linkedin">Connect on LinkedIn</a>`
    : '';

  // Email field — copyable, shown if email column populated in sheet
  const emailField = participant.email
    ? `<div class="email-field">
        <span class="email-label">Email</span>
        <a class="email-value" href="mailto:${participant.email}">${participant.email}</a>
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
      ${participant.poster_number ? `<div class="profile-section"><span class="poster-badge-lg">Poster ${participant.poster_number}</span></div>` : ''}
      <div class="profile-section">
        <div class="section-label">Research</div>
        <div class="profile-title">${participant.title || ''}</div>
        <div class="profile-summary">${participant.summary || ''}</div>
      </div>
      <div class="profile-tags-row">
        ${participant.disease_area ? `<span class="disease-badge">${participant.disease_area}</span>` : ''}
        ${participant.research_program ? `<span class="program-badge">${participant.research_program}</span>` : ''}
        ${participant.clinical_input ? '<span class="clinical-badge">Open to clinical input</span>' : ''}
      </div>
      <div class="profile-actions">
        ${logBtn}
        ${coffeeBtn}
        ${linkedinBtn}
        ${emailField}
      </div>
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

function logConversation(id) {
  if (!user) {
    window._pendingLog = id;
    showView('identity');
    return;
  }
  conversations[id] = new Date().toISOString();
  saveState();
  updateBadgeCounts();
  const p = allParticipants.find(x => x.id === id);
  if (p) {
    track({
      action: 'log_convo',
      participant_id: p.id,
      participant_name: p.name,
      participant_role: p.role,
      participant_program: p.research_program || p.department || ''
    });
    showProfile(p);
  }
}

function undoConversation(id) {
  delete conversations[id];
  coffeeSelections.delete(id);
  saveState();
  updateBadgeCounts();
  const p = allParticipants.find(x => x.id === id);
  if (p) {
    track({
      action: 'undo_convo',
      participant_id: p.id,
      participant_name: p.name,
      participant_role: p.role,
      participant_program: p.research_program || p.department || ''
    });
    showProfile(p);
  }
}

function toggleCoffee(id) {
  const wasSelected = coffeeSelections.has(id);
  if (wasSelected) {
    coffeeSelections.delete(id);
  } else {
    if (coffeeSelections.size >= CONFIG.max_selections) {
      alert(`You can request up to ${CONFIG.max_selections} follow-up connections. Remove one first.`);
      return;
    }
    coffeeSelections.add(id);
  }
  saveState();
  updateBadgeCounts();
  const p = allParticipants.find(x => x.id === id);
  if (p) {
    const t = trackForPair(user ? user.role : '', user ? user.program : '', p);
    track({
      action: 'coffee',
      action_type: wasSelected ? 'removed' : 'selected',
      track_id: t ? t.id : '',
      track_name: t ? t.name : '',
      track_aim: t ? t.aim : '',
      requester_name: user ? user.name : '',
      requester_role: user ? user.role : '',
      requester_program: user ? user.program : '',
      participant_id: p.id,
      participant_name: p.name,
      participant_role: p.role,
      participant_program: p.research_program || p.department || ''
    });
    showProfile(p);
  }
}

function updateBadgeCounts() {
  const count = Object.keys(conversations).length;
  document.getElementById('list-count-badge').textContent = count;
  const navCount = document.getElementById('nav-count');
  navCount.textContent = count;
  navCount.style.display = count > 0 ? 'inline' : 'none';
}

// ── MY LIST ───────────────────────────────────

function renderMyList() {
  updateBadgeCounts();
  const talkedIds = Object.keys(conversations);
  const wrap = document.getElementById('mylist-content');
  const empty = document.getElementById('mylist-empty');
  const submitWrap = document.getElementById('submit-wrap');

  if (talkedIds.length === 0) {
    wrap.innerHTML = '';
    empty.style.display = 'block';
    submitWrap.style.display = 'none';
    return;
  }
  empty.style.display = 'none';

  const viewerRole = user ? user.role : '';
  const viewerProg = user ? (user.program || '') : '';
  const hasTracks = viewerHasAnyTrack(viewerRole, viewerProg);

  // Subtitle: context-aware based on whether any connection track is open to this user
  const trackSubtitle = `People you talked to today. Tap a track badge to request a follow-up connection (up to ${CONFIG.max_selections}). CRTEC coordinates the match within 48 hours.`;
  const genericSubtitle = 'People you talked to today. Connect on LinkedIn or tap a name to view their research.';
  document.getElementById('mylist-sub').textContent = hasTracks ? trackSubtitle : genericSubtitle;

  wrap.innerHTML = talkedIds.map(id => {
    const p = allParticipants.find(x => x.id === id);
    if (!p) return '';
    const track = trackForPair(viewerRole, viewerProg, p);
    const selected = coffeeSelections.has(id);
    const time = conversations[id] ? new Date(conversations[id]).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'}) : '';

    return `
      <div class="mylist-card ${selected ? 'selected' : ''}">
        <div class="mylist-avatar ${avatarClass(p.role)}" onclick="showProfile(getParticipant('${id}'))">${initials(p.name)}</div>
        <div class="mylist-info" onclick="showProfile(getParticipant('${id}'))">
          <div class="mylist-name">${p.name}</div>
          <div class="mylist-meta">${p.role}${p.year ? ' · ' + p.year : ''}</div>
          <div class="mylist-title">${(p.title || '').substring(0, 65)}${(p.title || '').length > 65 ? '…' : ''}</div>
          ${track ? `<div class="mylist-track">${track.icon} ${track.name}</div>` : ''}
          ${time ? `<div class="mylist-time">Logged at ${time}</div>` : ''}
        </div>
        <div class="mylist-actions">
          ${p.linkedin_url ? `<a class="ml-action-btn ml-li" href="${p.linkedin_url}" target="_blank" title="Connect on LinkedIn">in</a>` : ''}
          ${track ? `<button class="ml-action-btn ml-coffee ${selected ? 'on' : ''}" onclick="event.stopPropagation(); toggleCoffee('${id}')" title="${selected ? 'Remove request' : 'Request ' + track.name}">${track.icon}${selected ? '✓' : ''}</button>` : ''}
        </div>
      </div>`;
  }).join('');

  if (coffeeSelections.size > 0) {
    submitWrap.style.display = 'block';
    document.getElementById('submit-btn').textContent =
      `Submit ${coffeeSelections.size} connection request${coffeeSelections.size > 1 ? 's' : ''}`;
  } else {
    submitWrap.style.display = 'none';
  }
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
        <div class="agenda-time">${s.time}</div>
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
      <div class="fact"><div class="fact-big">3 × $100</div><div class="fact-lbl">Scientific award prizes</div></div>
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
