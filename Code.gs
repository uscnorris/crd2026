/*───────────────────────────────────────────────────────────────
  Cancer Research Day 2026 — Apps Script backend (Code.gs)

  One script does three jobs, all against ONE spreadsheet:
    1. onFormSubmit  — registration form → "Directory" tab (feeds the app)
    2. doPost        — the app posts events → tracking tabs (feeds the dashboard)
    3. doGet ?action=export — dashboard reads tracking data back out

  SETUP (once): run setup() from the editor, then Deploy → Web app.
  Full step-by-step is in the README.
───────────────────────────────────────────────────────────────*/

// ── 1. Map YOUR Google Form question titles → directory fields ──
// Edit the RIGHT-hand strings to match your form's exact question text.
const FORM_MAP = {
  name:              'Name',
  email:             'Email',
  role:              'Role',
  research_program:  'Research Program',
  department:        'Department / Lab',
  presenting:        'Are you presenting a poster?',
  attend_mode:       'Will you attend in person or virtually?',
  accessibility:     'Do you need any accessibility accommodations?',
  dietary:           'If joining for lunch, do you have any dietary restrictions?',

  // Section 2 — Trainee / Early-Stage Investigator only (see TRAINEE_ESI_ROLES)
  year:              'Year (at career/academic stage as a trainee or early stage investigator)',
  pi_or_mentor:      'PI or Mentor name',
  other_mentor:      'Other mentor name (such as postdoc, PhD student, or other faculty)',
  coffee_optin:      'Would you like to participate in our Coffee Consult matching opportunity?',
  bio:               'Short bio (for connection matching)',

  // Section 3 — Poster submission
  title:             'Poster Title',
  summary:           'Poster Summary (1-2 sentences)',
  disease_area:      'Disease / focus area',      // checkbox (multi-select) — comes through comma-joined
  linkedin_url:      'LinkedIn URL',
  consent:           'May we list you in the CRTEC/Cancer Research Day directory?'
};

// The ONLY roles that see Section 2 and get asked the Coffee Consult
// opt-in question on the form.
const TRAINEE_ESI_ROLES = [
  'Faculty (Early Stage Investigator)', 'Postdoctoral Fellow', 'Clinical Fellow/Resident',
  'PhD Student', "Master's Student", 'Undergraduate Student'
];

// Coffee Consult (the single connection track as of the 2026 pilot) is
// narrower than TRAINEE_ESI_ROLES: it's specifically PhD/postdoctoral
// RESEARCH trainees matched with clinical trainees. Faculty (ESI), Master's,
// and Undergraduate Students still see the Section 2 questions (for Year /
// PI-mentor capture) but are never Coffee-Consult eligible, even if they
// answer "Yes" to the opt-in question — this must match config.js's
// connection_tracks[0].sideA / sideB exactly.
const COFFEE_CONSULT_ROLES = ['PhD Student', 'Postdoctoral Fellow', 'Clinical Fellow/Resident'];

// Roles that never have a Research Program (their affiliation, if any, goes
// in Department / Lab instead — e.g. "COE" or "CRTEC").
const NO_PROGRAM_ROLES = ['Staff / Other', 'Community Member'];
const SEND_CONFIRMATION = false;

// ── Tab names + headers (setup() creates these) ──
const TABS = {
  Directory: ['id','name','role','year','department','poster_number','title','summary','disease_area','research_program','clinical_input','mentoring','linkedin_url','photo_url','email'],
  Users:     ['session_id','name','role','program','timestamp'],
  Convos:    ['session_id','viewer_name','viewer_role','viewer_program','participant_id','participant_name','participant_role','participant_program','timestamp'],
  Coffee:    ['session_id','requester_name','requester_role','requester_program','participant_id','participant_name','participant_role','participant_program','track_id','track_name','track_aim','action','timestamp'],
  Views:     ['session_id','viewer_role','viewer_program','participant_id','participant_name','participant_role','participant_program','timestamp'],
  Survey:    ['name','role','meeting_happened','meeting_useful','continue_collaboration','most_useful','timestamp']
};

// ── Run this ONCE to create all tabs with headers ──
function setup() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  Object.keys(TABS).forEach(name => {
    let sh = ss.getSheetByName(name);
    if (!sh) sh = ss.insertSheet(name);
    if (sh.getLastRow() === 0) sh.appendRow(TABS[name]);
  });
  SpreadsheetApp.getUi && SpreadsheetApp.getUi().alert('Setup complete. Tabs created: ' + Object.keys(TABS).join(', '));
}

// ── 1. Registration form → Directory tab ──
function onFormSubmit(e) {
  const v = e.namedValues || {};
  const get = key => { const q = FORM_MAP[key]; return q && v[q] ? String(v[q][0]).trim() : ''; };

  const email = get('email').toLowerCase();
  if (!email || !get('name')) return;

  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const dir = ss.getSheetByName('Directory') || ss.insertSheet('Directory');
  if (dir.getLastRow() === 0) dir.appendRow(TABS.Directory);

  // Find an existing row for this email (case-insensitive), if any.
  const headers = TABS.Directory;
  const emailCol = headers.indexOf('email');
  const existingRow = findRowByEmail_(dir, emailCol, email);

  const consented = !!get('consent');
  const presenting = /^y/i.test(get('presenting'));
  const shouldBeListed = consented && presenting;   // directory = posters/speakers only, and opted in

  if (!shouldBeListed) {
    if (existingRow) dir.deleteRow(existingRow);   // opted out or no longer presenting → remove stale entry
    return;
  }

  const role = get('role');
  const isCoffeeConsultRole = COFFEE_CONSULT_ROLES.includes(role);
  const isNoProgramRole = NO_PROGRAM_ROLES.includes(role);
  // Coffee Consult flag: only PhD/postdoctoral research trainees and clinical
  // trainees (Clinical Fellow/Resident) can ever be matched — mirrors
  // config.js connection_tracks[0]. Faculty (ESI), Master's, and Undergrad
  // students may see the opt-in question on the form but it never sets this.
  const mentoringFlag = isCoffeeConsultRole ? (/^y/i.test(get('coffee_optin')) ? 'TRUE' : 'FALSE') : '';
  const researchProgram = isNoProgramRole ? '' : get('research_program');

  // Reuse the existing poster number on an update; assign a fresh one only
  // for a brand-new presenter, so re-submitting never renumbers posters.
  let posterNo;
  if (existingRow) {
    posterNo = dir.getRange(existingRow, headers.indexOf('poster_number') + 1, 1, 1).getValue() || '';
    if (!posterNo) posterNo = nextPosterNumber_(dir, headers);
  } else {
    posterNo = nextPosterNumber_(dir, headers);
  }

  const id = existingRow
    ? dir.getRange(existingRow, headers.indexOf('id') + 1, 1, 1).getValue()
    : 'p-' + ('000' + (dir.getLastRow())).slice(-3);

  const row = [
    id, get('name'), role, get('year'), get('department'),
    posterNo, get('title'), get('summary') || get('bio'), get('disease_area'), researchProgram,
    '', mentoringFlag, get('linkedin_url'), '', get('email')
  ];

  if (existingRow) {
    dir.getRange(existingRow, 1, 1, row.length).setValues([row]);   // update in place
  } else {
    dir.appendRow(row);                                             // brand-new presenter
  }

  if (SEND_CONFIRMATION && get('email')) {
    MailApp.sendEmail(get('email'), 'You\'re registered — Cancer Research Day 2026',
      'Thanks for registering for Cancer Research Day on Wednesday, October 14, 2026 (9 AM–3 PM, Mayer Auditorium & Pappas Quad). See you there!');
  }
}

// Returns the 1-indexed sheet row for a given email, or 0 if not found.
function findRowByEmail_(sh, emailCol, email) {
  if (sh.getLastRow() < 2) return 0;
  const vals = sh.getRange(2, emailCol + 1, sh.getLastRow() - 1, 1).getValues();
  for (let i = 0; i < vals.length; i++) {
    if (String(vals[i][0]).trim().toLowerCase() === email) return i + 2;
  }
  return 0;
}

// Next sequential poster number, based on how many are already assigned.
function nextPosterNumber_(dir, headers) {
  const col = headers.indexOf('poster_number') + 1;
  const used = dir.getLastRow() > 1
    ? dir.getRange(2, col, dir.getLastRow() - 1, 1).getValues().flat().filter(String)
    : [];
  return 'P-' + ('000' + (used.length + 1)).slice(-3);
}

// ── 2. App posts events → tracking tabs ──
function doPost(e) {
  try {
    const p = JSON.parse(e.postData.contents);   // no-cors POST arrives as text; parse it
    const now = new Date();
    const ss = SpreadsheetApp.getActiveSpreadsheet();

    switch (p.action) {
      case 'identify':
        appendObj(ss, 'Users', { session_id: p.session_id, name: p.name, role: p.role, program: p.program, timestamp: now });
        break;
      case 'view_profile':
        appendObj(ss, 'Views', { session_id: p.session_id, viewer_role: p.viewer_role, viewer_program: p.viewer_program,
          participant_id: p.participant_id, participant_name: p.participant_name, participant_role: p.participant_role,
          participant_program: p.participant_program, timestamp: now });
        break;
      case 'log_convo':
        appendObj(ss, 'Convos', { session_id: p.session_id, viewer_name: p.viewer_name, viewer_role: p.viewer_role,
          viewer_program: p.viewer_program, participant_id: p.participant_id, participant_name: p.participant_name,
          participant_role: p.participant_role, participant_program: p.participant_program, timestamp: now });
        break;
      case 'undo_convo':
        deleteConvo(ss, p.session_id, p.participant_id);
        break;
      case 'coffee':
        appendObj(ss, 'Coffee', { session_id: p.session_id, requester_name: p.requester_name, requester_role: p.requester_role,
          requester_program: p.requester_program, participant_id: p.participant_id, participant_name: p.participant_name,
          participant_role: p.participant_role, participant_program: p.participant_program, track_id: p.track_id,
          track_name: p.track_name, track_aim: p.track_aim, action: p.action_type || 'selected', timestamp: now });
        break;
    }
    return json({ ok: true });
  } catch (err) {
    return json({ ok: false, error: String(err) });
  }
}

// ── 3. Dashboard reads tracking data ──
function doGet(e) {
  if (e && e.parameter && e.parameter.action === 'export') {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const out = {
      users:  read(ss, 'Users'),
      convos: read(ss, 'Convos'),
      coffee: read(ss, 'Coffee'),
      views:  read(ss, 'Views'),
      survey: read(ss, 'Survey')
    };
    // Optional JSONP fallback: append &callback=fn if a browser blocks the JSON GET
    if (e.parameter.callback) {
      return ContentService.createTextOutput(e.parameter.callback + '(' + JSON.stringify(out) + ')')
        .setMimeType(ContentService.MimeType.JAVASCRIPT);
    }
    return json(out);
  }
  return json({ ok: true, note: 'CRD backend live. Use ?action=export for dashboard data.' });
}

// ── helpers ──
function json(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
function tab(ss, name) {
  let sh = ss.getSheetByName(name);
  if (!sh) { sh = ss.insertSheet(name); sh.appendRow(TABS[name]); }
  return sh;
}
function appendObj(ss, name, obj) {
  const sh = tab(ss, name);
  const headers = sh.getRange(1, 1, 1, sh.getLastColumn()).getValues()[0];
  sh.appendRow(headers.map(h => obj[h] !== undefined ? obj[h] : ''));
}
function read(ss, name) {
  const sh = ss.getSheetByName(name);
  if (!sh || sh.getLastRow() < 2) return [];
  const rows = sh.getRange(1, 1, sh.getLastRow(), sh.getLastColumn()).getValues();
  const headers = rows.shift();
  return rows.map(r => { const o = {}; headers.forEach((h, i) => o[h] = r[i]); return o; });
}
function deleteConvo(ss, sessionId, participantId) {
  const sh = ss.getSheetByName('Convos');
  if (!sh || sh.getLastRow() < 2) return;
  const data = sh.getRange(2, 1, sh.getLastRow() - 1, sh.getLastColumn()).getValues();
  const headers = sh.getRange(1, 1, 1, sh.getLastColumn()).getValues()[0];
  const si = headers.indexOf('session_id'), pi = headers.indexOf('participant_id');
  for (let i = data.length - 1; i >= 0; i--) {
    if (String(data[i][si]) === String(sessionId) && String(data[i][pi]) === String(participantId)) {
      sh.deleteRow(i + 2); break;
    }
  }
}
