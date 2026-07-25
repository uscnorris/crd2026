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
  name:             'Name',
  email:            'Email',
  role:             'Role',
  research_program: 'Research program',
  department:       'Department / lab',
  year:             'Year (if applicable)',
  presenting:       'Are you presenting a poster?',
  title:            'Poster title',
  summary:          'Poster summary (1–2 sentences)',
  disease_area:     'Disease / focus area',
  clinical_input:   'Open to clinical input?',
  linkedin_url:     'LinkedIn URL',
  consent:          'May we list you in the directory?',
  // ── new this round ──
  mentoring:        'Faculty: are you open to Mentor Match consults?',
  bio:              'Short bio (for connection matching)',
  attend_mode:      'Will you attend in person or virtually?',
  accessibility:    'Do you need any accessibility accommodations?',
  dietary:          'Any dietary restrictions?'
};
// Send a confirmation email on registration? (uses the "Email" answer)
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

  if (FORM_MAP.consent && get('consent') && get('consent') !== 'Yes') return; // opt-in only
  if (!get('name')) return;

  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const dir = ss.getSheetByName('Directory') || ss.insertSheet('Directory');
  if (dir.getLastRow() === 0) dir.appendRow(TABS.Directory);

  const rowNum = dir.getLastRow();               // header is row 1
  const id = 'p-' + ('000' + rowNum).slice(-3);

  // Sequential poster number only for presenters
  const presenting = /^y/i.test(get('presenting'));
  let posterNo = '';
  if (presenting) {
    const col = dir.getRange(2, 6, Math.max(dir.getLastRow() - 1, 1), 1).getValues().flat().filter(String);
    posterNo = 'P-' + ('000' + (col.length + 1)).slice(-3);
  }

  dir.appendRow([
    id, get('name'), get('role'), get('year'), get('department'),
    posterNo, get('title'), get('summary') || get('bio'), get('disease_area'), get('research_program'),
    /^y/i.test(get('clinical_input')) ? 'TRUE' : 'FALSE',
    (get('role') === 'Faculty') ? (/^y/i.test(get('mentoring')) ? 'TRUE' : 'FALSE') : '',
    get('linkedin_url'), '', get('email')
  ]);

  if (SEND_CONFIRMATION && get('email')) {
    MailApp.sendEmail(get('email'), 'You\'re registered — Cancer Research Day 2026',
      'Thanks for registering for Cancer Research Day on Wednesday, October 14, 2026 (9 AM–3 PM, Mayer Auditorium & Pappas Quad). See you there!');
  }
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
