// ─────────────────────────────────────────────
// Cancer Research Day 2026 — App Logic
// ─────────────────────────────────────────────

// FILTER DEFINITIONS
const ROLES = [
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
let conversations = {};
let coffeeSelections = new Set();

// Active filters — each is a Set of selected values; empty = no filter on that group
let activeFilters = {
  role: new Set(),
  program: new Set(),
  disease: new Set(),
  clinical: new Set()
};

// Pending filters (inside the panel before Apply is tapped)
let pendingFilters = {
  role: new Set(),
  program: new Set(),
  disease: new Set(),
  clinical: new Set()
};

// ── INIT ──────────────────────────────────────

window.addEventListener('DOMContentLoaded', () => {
  loadState();
  buildFilterPanel();
  loadData();
  checkForProfileDeepLink();
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
      const csv = await resp.text();
      allParticipants = parseCSV(csv);
    } catch(e) {
      console.warn('Sheet load failed, using sample data:', e);
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

function saveIdentity() {
  const name = document.getElementById('user-name').value.trim();
  const roleEl = document.getElementById('user-role');
  const role = roleEl.options[roleEl.selectedIndex] ? roleEl.options[roleEl.selectedIndex].value : roleEl.value;
  if (!name) { alert('Please enter your name.'); return; }
  user = { name, role: role || 'Attendee' };
  saveState();
  showPostIdentity();
}

function showPostIdentity() {
  document.getElementById('bottom-nav').style.display = 'flex';
  const isCoffeeEligible = CONFIG.coffee_consult_roles.includes(user.role);
  document.getElementById('mylist-header-btn').style.display = isCoffeeEligible ? 'flex' : 'none';
  document.getElementById('nav-mylist').style.display = isCoffeeEligible ? 'flex' : 'none';
  if (window._pendingProfile) {
    const id = window._pendingProfile;
    window._pendingProfile = null;
    const p = allParticipants.find(x => x.id === id);
    if (p) { showProfile(p); return; }
  }
  showView('directory');
}

function decideStartView() {
  if (user) showPostIdentity();
  else showView('identity');
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
  // Update URL — remove profile param when going back to directory
  if (view === 'directory') history.replaceState(null, '', window.location.pathname);
}

// ── FILTER PANEL ──────────────────────────────

function buildFilterPanel() {
  buildOptionGroup('role-options', 'role', ROLES);
  buildOptionGroup('program-options', 'program', PROGRAMS);
  buildOptionGroup('disease-options', 'disease', DISEASES);
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
    // Search
    if (currentSearch) {
      const haystack = [p.name, p.title, p.disease_area, p.research_program, p.department, p.summary, p.role]
        .join(' ').toLowerCase();
      if (!haystack.includes(currentSearch)) return false;
    }
    // Role filter
    if (activeFilters.role.size > 0 && !activeFilters.role.has(p.role)) return false;
    // Program filter
    if (activeFilters.program.size > 0 && !activeFilters.program.has(p.research_program)) return false;
    // Disease filter
    if (activeFilters.disease.size > 0 && !activeFilters.disease.has(p.disease_area)) return false;
    // Clinical input filter
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
            ${talked ? '<span class="talked-badge">✓ Talked</span>' : ''}
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

function showProfile(participant) {
  if (!participant) return;
  const talked = conversations[participant.id];
  const selected = coffeeSelections.has(participant.id);
  const eligible = user && CONFIG.coffee_consult_roles.includes(user.role) &&
                   CONFIG.coffee_consult_roles.includes(participant.role) &&
                   user.role !== participant.role;

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
        ${talked
          ? `<button class="btn-talked-done" disabled>✓ Conversation logged</button>`
          : `<button class="btn-log" onclick="logConversation('${participant.id}')">I talked to this person</button>`}
        ${eligible && talked
          ? selected
            ? `<button class="btn-coffee-selected" onclick="toggleCoffee('${participant.id}')">✓ Added to Coffee Consult list — tap to remove</button>`
            : `<button class="btn-coffee" onclick="toggleCoffee('${participant.id}')">Add to Coffee Consult list</button>`
          : eligible && !talked
          ? `<p class="coffee-hint">Log this conversation first to add to your Coffee Consult list.</p>`
          : ''}
        ${participant.linkedin_url
          ? `<a href="${participant.linkedin_url}" target="_blank" class="btn-linkedin">Connect on LinkedIn</a>`
          : ''}
      </div>
    </div>`;

  showView('profile');
  history.replaceState(null, '', `?p=${participant.id}`);
}

function logConversation(id) {
  conversations[id] = new Date().toISOString();
  saveState();
  updateBadgeCounts();
  const p = allParticipants.find(x => x.id === id);
  if (p) showProfile(p);
}

function toggleCoffee(id) {
  if (coffeeSelections.has(id)) {
    coffeeSelections.delete(id);
  } else {
    if (coffeeSelections.size >= CONFIG.max_selections) {
      alert(`You can select up to ${CONFIG.max_selections} Coffee Consults. Remove one first.`);
      return;
    }
    coffeeSelections.add(id);
  }
  saveState();
  updateBadgeCounts();
  const p = allParticipants.find(x => x.id === id);
  if (p) showProfile(p);
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

  const eligible = user && CONFIG.coffee_consult_roles.includes(user.role);
  document.getElementById('mylist-sub').textContent = eligible
    ? `Select up to ${CONFIG.max_selections} for a Coffee Consult — CRTEC will reach out within 48 hours.`
    : 'Your conversations today.';

  wrap.innerHTML = talkedIds.map(id => {
    const p = allParticipants.find(x => x.id === id);
    if (!p) return '';
    const canCoffee = eligible && CONFIG.coffee_consult_roles.includes(p.role) && user.role !== p.role;
    const selected = coffeeSelections.has(id);
    const time = conversations[id] ? new Date(conversations[id]).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'}) : '';
    return `
      <div class="mylist-card ${selected ? 'selected' : ''}" onclick="showProfile(getParticipant('${id}'))">
        <div class="mylist-avatar ${avatarClass(p.role)}">${initials(p.name)}</div>
        <div class="mylist-info">
          <div class="mylist-name">${p.name}</div>
          <div class="mylist-meta">${p.role}${p.year ? ' · ' + p.year : ''}</div>
          <div class="mylist-title">${(p.title || '').substring(0, 70)}${(p.title || '').length > 70 ? '…' : ''}</div>
          ${time ? `<div class="mylist-time">Logged at ${time}</div>` : ''}
        </div>
        ${canCoffee ? `
          <button class="coffee-toggle ${selected ? 'on' : ''}"
            onclick="event.stopPropagation(); toggleCoffee('${id}')" aria-label="Toggle Coffee Consult">
            ${selected ? '☕✓' : '☕'}
          </button>` : ''}
      </div>`;
  }).join('');

  if (eligible && coffeeSelections.size > 0) {
    submitWrap.style.display = 'block';
    document.getElementById('submit-btn').textContent =
      `Submit ${coffeeSelections.size} Coffee Consult selection${coffeeSelections.size > 1 ? 's' : ''}`;
  } else {
    submitWrap.style.display = 'none';
  }
}

function submitCoffeeConsult() {
  if (coffeeSelections.size === 0) return;
  const names = [...coffeeSelections].map(id => {
    const p = allParticipants.find(x => x.id === id);
    return p ? p.name : id;
  });
  if (CONFIG.form_url && CONFIG.form_url !== 'PASTE_YOUR_GOOGLE_FORM_URL_HERE') {
    window.open(CONFIG.form_url, '_blank');
  } else {
    const body = `Coffee Consult Selections\n\nSubmitted by: ${user.name} (${user.role})\nSelections: ${names.join(', ')}\nTime: ${new Date().toLocaleString()}`;
    window.location.href = `mailto:crtec@usc.edu?subject=Coffee Consult — ${user.name}&body=${encodeURIComponent(body)}`;
  }
  alert(`Submitted! CRTEC will confirm your match${coffeeSelections.size > 1 ? 'es' : ''} within 48 hours.`);
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
