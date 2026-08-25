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
  // NOTE: this question governs CONTACT DISPLAY only — being listed in the
  // directory is earned by presenting a poster or joining Coffee Consult.
  // It must live in Section 3, the one section every path reaches, so that
  // faculty and staff presenters (who skip Section 2) can answer it too.
  consent:           'May we show your contact information on your directory profile?'
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
  Directory: ['id','name','role','year','department','poster_number','title','summary','bio','disease_area','research_program','clinical_input','mentoring','linkedin_url','photo_url','email','share_contact'],
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
  // Log instead of showing a dialog. A UI alert opens in the SPREADSHEET tab,
  // so running setup() from the Apps Script editor would appear to hang while
  // it waited for a click on a popup you cannot see.
  Logger.log('Setup complete. Tabs ready: ' + Object.keys(TABS).join(', '));
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

  // The consent question is a choice, not a yes/no box: "No, thank you." /
  // "Email only" / "Email and LinkedIn profile". A bare truthiness check
  // would treat "No, thank you." as consent, so parse the actual value.
  const consentAnswer = get('consent');
  const declined = /^\s*no\b/i.test(consentAnswer);
  const consented = !!consentAnswer && !declined;
  const shareLinkedIn = consented && /linkedin/i.test(consentAnswer);
  const presenting = /^y/i.test(get('presenting'));
  const role = get('role');
  const isCoffeeConsultRole = COFFEE_CONSULT_ROLES.includes(role);
  const coffeeOptIn = isCoffeeConsultRole && /^y/i.test(get('coffee_optin'));
  const hasBio = !!get('bio');

  // Two ways into the directory:
  //   1. You're presenting a poster. Submitting a poster IS the consent to
  //      appear in the poster directory — the same name and title are on a
  //      board in a public quad all afternoon, so no separate checkbox is
  //      required. This matters because staff and senior faculty skip the
  //      trainee section of the form and would otherwise never be asked.
  //   2. You're a Coffee Consult trainee WITHOUT a poster — allowed in so you
  //      can be matched, but only if you gave a bio / research interests,
  //      since that's all anyone would have to go on when matching you.
  const coffeeOnlyListing = coffeeOptIn && hasBio;
  const shouldBeListed = presenting || coffeeOnlyListing;

  // Contact details are a separate, higher bar. Name / poster / title are
  // public by nature; an email address is not.
  // NOTE: the email is ALWAYS stored — Coffee Consult identity verification
  // looks people up by their registered email, and CRTEC needs it to arrange
  // matches. The `share_contact` flag controls only whether the APP DISPLAYS
  // it publicly on a profile.
  const shareContact = consented;

  if (!shouldBeListed) {
    if (existingRow) dir.deleteRow(existingRow);   // opted out, no poster and no bio → remove stale entry
    return;
  }

  const isNoProgramRole = NO_PROGRAM_ROLES.includes(role);
  // Coffee Consult flag: only PhD/postdoctoral research trainees and clinical
  // trainees (Clinical Fellow/Resident) can ever be matched — mirrors
  // config.js connection_tracks[0]. Faculty (ESI), Master's, and Undergrad
  // students may see the opt-in question on the form but it never sets this.
  const mentoringFlag = isCoffeeConsultRole ? (/^y/i.test(get('coffee_optin')) ? 'TRUE' : 'FALSE') : '';
  const researchProgram = isNoProgramRole ? '' : get('research_program');

  // Poster numbers go ONLY to actual presenters. Coffee-Consult-only people
  // are in the directory to be matched, not to be found at a board, so they
  // stay blank and never take a slot in a section's numbering.
  let posterNo = '';
  // Guard: a presenter with no Research Program answer has no section, and
  // must NOT be given a malformed number like "-01". They're still listed;
  // the poster number is filled in by CRTEC once their program is known.
  const sectionLetter = rowLetterFor_(role, researchProgram, get('disease_area'));
  if (presenting && sectionLetter) {
    if (existingRow) {
      posterNo = dir.getRange(existingRow, headers.indexOf('poster_number') + 1, 1, 1).getValue() || '';
    }
    if (!posterNo) posterNo = nextPosterNumber_(dir, headers, sectionLetter);
  } else if (presenting && existingRow) {
    posterNo = dir.getRange(existingRow, headers.indexOf('poster_number') + 1, 1, 1).getValue() || '';
  }

  const id = existingRow
    ? dir.getRange(existingRow, headers.indexOf('id') + 1, 1, 1).getValue()
    : 'p-' + ('000' + (dir.getLastRow())).slice(-3);

  const row = [
    id, get('name'), role, get('year'), get('department'),
    posterNo, get('title'), get('summary'), get('bio'), get('disease_area'), researchProgram,
    '', mentoringFlag, (shareContact && shareLinkedIn) ? get('linkedin_url') : '', '', get('email'),
    shareContact ? 'TRUE' : 'FALSE'
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
// Next sequential number WITHIN a given section letter, e.g. the 3rd poster
// assigned to Section A becomes "A-03". This is what makes thematic clustering
// possible live, at registration time, rather than only after the fact:
// the row is decided by a fixed policy (PROGRAM_TO_ROW below), so each new
// registrant can be slotted into the right physical location immediately.
function nextPosterNumber_(dir, headers, rowLetter) {
  const col = headers.indexOf('poster_number') + 1;
  const existing = dir.getLastRow() > 1
    ? dir.getRange(2, col, dir.getLastRow() - 1, 1).getValues().flat().filter(String)
    : [];
  const inThisRow = existing.filter(p => p.split('-')[0] === rowLetter);
  return rowLetter + '-' + ('000' + (inThisRow.length + 1)).slice(-2);
}

// ── POSTER SECTION ASSIGNMENT (thematic clustering policy) ──
// "Section" = one side of the quad, not a literal physical row. Each side
// holds several large boards (perpendicular to the quad, posters on both
// faces); board count/depth is decided on-site once final per-section
// headcount is known (doubled up if a section fills up). This assignment
// only needs to get someone to the right SIDE — exact board is a day-of,
// capacity-driven call for staff, not something to pre-compute here.
// Confirmed layout: Shared Resources on the KAM side (downhill, top of the
// stairs); everything else clustered thematically by Research Program.
// MUST stay in sync with config.js → poster_rows / poster_sides.
//
//   Section S — Shared Resources                    — KAM side (downhill, top of stairs)
//   Section A — Tumor Immunology & Microenvironment — Library side (north)
//   Section B — Epigenetic Regulation in Cancer     — Library side (north)
//   Section C — Translational and Clinical Sciences — HMR side
//   Section D — Cancer Epidemiology                 — MCH side (uphill)
//   Section E — Cancer Control Research              — MCH side (uphill)
//
// Shared Resources / Core is NOT a research program — every faculty member,
// including Core/Shared Resource directors, has a genuine Research Program
// answer (their scientific home). Instead, "Shared Resource/Core" is an
// option on Disease / focus area (a checkbox field), checked FIRST — if
// present, it wins and sends the poster to Section S regardless of program.
//
// ACTION NEEDED: the live Google Form's "Disease / focus area" checkbox list
// doesn't have a "Shared Resource/Core" option yet. Add one with EXACTLY
// that text so SHARED_RESOURCE_MARKER below matches it, or Shared Resource
// presenters will fall through to their program's regular section instead.
//
// NOT YET DECIDED — left unmapped on purpose, not guessed:
//   Community Advisory Board / survivor-advocate posters, and CRTEC /
//   education-and-training posters. They currently get no section letter
//   (posterNo will be blank) until a side is chosen for them.
const SHARED_RESOURCE_MARKER = 'Shared Resource/Core';
const PROGRAM_TO_ROW = {
  'Tumor Microenvironment & Immunology (TIME)': 'A',
  'Tumor Immunology & Microenvironment (TIME)': 'A',
  'Epigenetic Regulation in Cancer (ERC)': 'B',
  'Translational and Clinical Sciences (TACS)': 'C',
  'Cancer Epidemiology (CE)': 'D',
  'Cancer Control Research (CCR)': 'E'
};

// diseaseArea comes through as a comma-joined string when it's a checkbox
// question (e.g. "Breast, Shared Resource/Core") — split and check for an
// exact match on any one selection, not a substring match on the whole
// string, so "Shared Resource/Core" doesn't accidentally match something
// else that happens to contain similar words.
function rowLetterFor_(role, researchProgram, diseaseArea) {
  const picks = (diseaseArea || '').split(',').map(s => s.trim());
  if (picks.includes(SHARED_RESOURCE_MARKER)) return 'S';
  return PROGRAM_TO_ROW[researchProgram] || ''; // '' = not yet assigned a side (see note above)
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
