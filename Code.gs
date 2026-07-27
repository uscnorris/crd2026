/*───────────────────────────────────────────────────────────────
  Cancer Research Day 2026 — Apps Script backend (Code.gs)

  One script does five jobs, all against ONE spreadsheet:
    1. onFormSubmit          — registration form → "Directory" tab (feeds the app)
    2. syncQualtrics         — pulls the post-event survey from Qualtrics → "Survey" tab
    3. syncQualtricsFollowup — pulls the 6-12mo follow-up survey → "Outcomes" tab
    4. doPost                — the app posts events → tracking tabs (feeds the dashboard)
    5. doGet ?action=export  — dashboard reads tracking data back out

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

// ── QUALTRICS (post-event survey) ──
// The post-event survey lives in Qualtrics. syncQualtrics() pulls responses
// from Qualtrics into the Survey tab below via the Qualtrics REST API, so the
// dashboard's Survey tab fills itself — no manual export/import. Setup steps
// are in the README ("Post-event survey — Qualtrics"). Leave api_token blank
// (or "PASTE...") to disable — nothing breaks, the sync just no-ops.
const QUALTRICS = {
  api_token:  'PASTE_YOUR_QUALTRICS_API_TOKEN_HERE',   // Account Settings (top-right avatar) → Qualtrics IDs → API
  datacenter: 'PASTE_YOUR_QUALTRICS_DATACENTER_ID_HERE', // same page, e.g. "usc1a"
  survey_id:  'PASTE_YOUR_QUALTRICS_SURVEY_ID_HERE'      // starts with "SV_" — same page, or the survey's URL
};

// Map YOUR Qualtrics question IDs → Survey tab columns. In the Qualtrics
// survey editor: Tools (gear icon) → Import/Export → Show Question IDs — each
// question then displays its QID (e.g. QID1) next to its text. Edit the
// right-hand strings below to match.
const QUALTRICS_MAP = {
  name:                    'QID1',
  role:                    'QID2',
  meeting_happened:        'QID3',
  meeting_useful:          'QID4',
  continue_collaboration:  'QID5',
  most_useful:             'QID6',
  shared_resource_learned: 'QID7',  // "Did you learn about a Shared Resource you now plan to use?" (Yes/No)
  shared_resource_which:   'QID8'   // "Which one?" (open text)
};

// ── QUALTRICS FOLLOW-UP (6-12 month downstream-impact survey) ──
// A second, separate Qualtrics survey sent 6-12 months after the event, asking
// whether a CRD connection led to a grant, publication, shared resource use, or
// ongoing collaboration. Same API token/datacenter as QUALTRICS above — just a
// different survey. This is the metric CCSG renewal reviewers weigh most: proof
// that networking converts into research output, not just attendance.
const QUALTRICS_FOLLOWUP = {
  survey_id: 'PASTE_YOUR_FOLLOWUP_SURVEY_ID_HERE'  // starts with "SV_" — from the same Qualtrics IDs page
};
const QUALTRICS_FOLLOWUP_MAP = {
  name:                   'QID1',
  role:                   'QID2',
  connection_partner:     'QID3',  // "Who did you connect with at CRD?" (open text)
  grant_submitted:        'QID4',  // "Did this connection lead to a joint grant submission?" (Yes/No)
  publication_coauthored: 'QID5',  // "A co-authored publication?" (Yes/No)
  shared_resource_used:   'QID6',  // "Shared use of a Core / Shared Resource?" (Yes/No)
  ongoing_collaboration:  'QID7',  // "Is the collaboration ongoing?" (Yes/No)
  details:                'QID8'   // "Anything you'd like to tell us about it?" (open text)
};

// ── Tab names + headers (setup() creates these) ──
const TABS = {
  Directory: ['id','name','role','year','department','poster_number','title','summary','disease_area','research_program','clinical_input','mentoring','linkedin_url','photo_url','email'],
  Users:     ['session_id','name','role','program','timestamp'],
  Convos:    ['session_id','viewer_name','viewer_role','viewer_program','participant_id','participant_name','participant_role','participant_program','timestamp'],
  Coffee:    ['session_id','requester_name','requester_role','requester_program','participant_id','participant_name','participant_role','participant_program','track_id','track_name','track_aim','action','timestamp'],
  Views:     ['session_id','viewer_role','viewer_program','participant_id','participant_name','participant_role','participant_program','timestamp'],
  Survey:    ['response_id','name','role','meeting_happened','meeting_useful','continue_collaboration','most_useful','shared_resource_learned','shared_resource_which','timestamp'],
  Outcomes:  ['response_id','name','role','connection_partner','grant_submitted','publication_coauthored','shared_resource_used','ongoing_collaboration','details','timestamp']
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

// ── 2. Qualtrics surveys → Survey / Outcomes tabs (feeds the dashboard) ──
// Run once from the editor (function dropdown → createQualtricsTrigger → Run)
// to sync both surveys every hour. Or run either sync function directly for
// an on-demand pull.

// Shared helper: runs a Qualtrics export for one survey and returns its
// parsed responses. Used by both syncQualtrics() and syncQualtricsFollowup().
function qualtricsExport_(surveyId) {
  const base = 'https://' + QUALTRICS.datacenter + '.qualtrics.com/API/v3/surveys/' + surveyId + '/export-responses';
  const headers = { 'X-API-TOKEN': QUALTRICS.api_token };

  // Start the export
  const startResp = UrlFetchApp.fetch(base, {
    method: 'post',
    headers: headers,
    contentType: 'application/json',
    payload: JSON.stringify({ format: 'json' })
  });
  const progressId = JSON.parse(startResp.getContentText()).result.progressId;

  // Poll until Qualtrics finishes building the export
  let fileId = null;
  for (let i = 0; i < 20; i++) {
    Utilities.sleep(1500);
    const prog = JSON.parse(UrlFetchApp.fetch(base + '/' + progressId, { headers: headers }).getContentText()).result;
    if (prog.status === 'complete') { fileId = prog.fileId; break; }
    if (prog.status === 'failed') throw new Error('Qualtrics export failed for survey ' + surveyId);
  }
  if (!fileId) throw new Error('Qualtrics export timed out for survey ' + surveyId);

  // Download the finished export (a zip containing one JSON file) and unzip it
  const zipBlob = UrlFetchApp.fetch(base + '/' + fileId + '/file', { headers: headers }).getBlob();
  const files = Utilities.unzip(zipBlob);
  return JSON.parse(files[0].getDataAsString()).responses || [];
}

// Appends any not-yet-synced responses into a tab, using QID → column map.
function qualtricsSyncInto_(surveyId, tabName, colMap, rowBuilder) {
  if (!surveyId || surveyId.indexOf('PASTE') === 0) return; // not configured yet
  const responses = qualtricsExport_(surveyId);
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sh = tab(ss, tabName);
  const alreadySynced = sh.getLastRow() > 1
    ? sh.getRange(2, 1, sh.getLastRow() - 1, 1).getValues().flat().map(String)
    : [];
  responses.forEach(r => {
    const rid = r.responseId;
    if (!rid || alreadySynced.includes(rid)) return; // skip ones already synced
    const v = r.values || {};
    const get = key => { const qid = colMap[key]; return (qid && v[qid] !== undefined) ? String(v[qid]) : ''; };
    sh.appendRow(rowBuilder(rid, get, v));
  });
}

function syncQualtrics() {
  if (!QUALTRICS.api_token || QUALTRICS.api_token.indexOf('PASTE') === 0) return; // not configured yet
  qualtricsSyncInto_(QUALTRICS.survey_id, 'Survey', QUALTRICS_MAP, (rid, get, v) => [
    rid, get('name'), get('role'), get('meeting_happened'), get('meeting_useful'),
    get('continue_collaboration'), get('most_useful'),
    get('shared_resource_learned'), get('shared_resource_which'),
    v.recordedDate || new Date()
  ]);
}

function syncQualtricsFollowup() {
  if (!QUALTRICS.api_token || QUALTRICS.api_token.indexOf('PASTE') === 0) return; // not configured yet
  qualtricsSyncInto_(QUALTRICS_FOLLOWUP.survey_id, 'Outcomes', QUALTRICS_FOLLOWUP_MAP, (rid, get, v) => [
    rid, get('name'), get('role'), get('connection_partner'),
    get('grant_submitted'), get('publication_coauthored'), get('shared_resource_used'),
    get('ongoing_collaboration'), get('details'), v.recordedDate || new Date()
  ]);
}

// Creates (or resets) hourly triggers that keep the Survey and Outcomes tabs
// in sync with Qualtrics automatically. Run this ONCE from the editor after
// filling in the QUALTRICS / QUALTRICS_FOLLOWUP constants above. Either sync
// function silently no-ops if its own survey_id isn't configured yet, so it's
// safe to run this before the follow-up survey exists.
function createQualtricsTrigger() {
  ['syncQualtrics', 'syncQualtricsFollowup'].forEach(fn => {
    ScriptApp.getProjectTriggers().forEach(t => {
      if (t.getHandlerFunction() === fn) ScriptApp.deleteTrigger(t);
    });
    ScriptApp.newTrigger(fn).timeBased().everyHours(1).create();
  });
  SpreadsheetApp.getUi && SpreadsheetApp.getUi().alert('Qualtrics sync scheduled — Survey and Outcomes tabs will update every hour.');
}

// ── 4. App posts events → tracking tabs ──
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

// ── 5. Dashboard reads tracking data ──
function doGet(e) {
  if (e && e.parameter && e.parameter.action === 'export') {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const out = {
      users:    read(ss, 'Users'),
      convos:   read(ss, 'Convos'),
      coffee:   read(ss, 'Coffee'),
      views:    read(ss, 'Views'),
      survey:   read(ss, 'Survey'),
      outcomes: read(ss, 'Outcomes')
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
