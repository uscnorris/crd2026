// ─────────────────────────────────────────────
// CRTEC Cancer Research Day App — Config
// This is the main file you edit to run the day.
// ─────────────────────────────────────────────

const CONFIG = {

  // EVENT DETAILS
  event_name: "Cancer Research Day 2026",
  event_tagline: "4th Annual · USC Norris Comprehensive Cancer Center",
  event_date: "Wednesday, October 14, 2026",
  event_time: "9 AM – 3 PM",
  event_location: "Mayer Auditorium & Pappas Quad",

  // APPS SCRIPT BACKEND (event tracking)
  // Paste your deployed Apps Script web app URL here (see Code.gs setup instructions)
  script_url: "https://script.google.com/macros/s/AKfycbzm3v4EXQ2VwnmOEAUAyLteeAv4HGFfugMfDO22BbwWNBkT-w4rhgXg7x4rKURrpGo3jQ/exec",

  // GOOGLE SHEETS (directory data)
  // File → Share → Publish to web → Sheet1 → CSV → Publish → copy URL
  sheet_url: "https://docs.google.com/spreadsheets/d/e/2PACX-1vQksITlntkPc60L__OSZomcBTOpjGXHI5kEEErmZLjFl3qe1KOPN6E80yExao-4El3fgYJ79PjI2ZGS/pub?gid=541125230&single=true&output=csv",

  // Set to false once your sheet URL is pasted above
  use_sample_data: false,

  // ── DAY-OF CONTROLS ─────────────────────────
  // directory_live: set false while you are still collecting posters. The
  // Directory tab then shows a friendly "posters are being added" message
  // instead of an empty list, so an early visitor doesn't think nobody is
  // coming. Flip to true once you have enough entries to look healthy.
  directory_live: false,
  directory_pending_message: "Posters are being added as registrations come in. Check back closer to the event to browse who is presenting.",

  // Minimum entries before the directory will show at all, even when live.
  // Belt-and-braces against a temporarily empty or failed data load.
  directory_min_entries: 5,

  // Cache the published sheet in the browser for this many minutes. Cuts
  // repeat requests to Google on the day and keeps the directory working if
  // a single fetch fails. Set 0 to disable.
  cache_minutes: 3,

  // Log every profile OPEN to the backend. This is by far the highest-volume
  // write (one per profile viewed, per person) and the least valuable. Turn
  // it off if the event is busy — conversation-free tracking of requests and
  // sign-ins continues either way.
  track_profile_views: false,

  // Max follow-up connection requests per person (across all tracks)
  max_selections: 2,

  // Where connection requests get sent (Google Form URL — see README)
  form_url: "https://forms.gle/NScGUCFhKD9d4qv19",

  // BASE URL for QR codes — your GitHub Pages URL
  base_url: "https://uscnorris.github.io/crd2026",

  // ───────────────────────────────────────────
  // CONNECTION TRACKS
  // Matching is Coffee Consult only — reserved for clinical trainees
  // (clinical fellows, residents, clinical doctoral students) on one side
  // and research trainees (PhD students, postdoctoral fellows) on the
  // other. Each track connects two groups, maps to a CRTEC aim, and
  // produces a training outcome. The app offers the applicable track when
  // a viewer opens someone's profile.
  //   sideA / sideB: { roles: [...], programMatch: [substrings] | null }
  //   programMatch null = any program; otherwise matches research_program+department (case-insensitive)
  // ───────────────────────────────────────────
  connection_tracks: [
    {
      id: "coffee",
      name: "Coffee Consult",
      icon: "☕",
      aim: "Clinical & Translational",
      outcome_tag: "R38 data",
      purpose: "Bench meets clinic. A PhD or postdoctoral research trainee and a clinical fellow, resident, or clinical doctoral student talk through the clinical rationale behind the science.",
      // Pilot program for 2026; see the "For trainees" section of the site.
      cta: "Add to Coffee Consult",
      sideA: { roles: ["PhD Student", "Postdoctoral Fellow"], programMatch: null },
      sideB: { roles: ["Clinical Fellow/Resident"], programMatch: null }
    }
  ],

  // ───────────────────────────────────────────
  // AGENDA — the whole-day digital program
  // tag: optional pill. tbd: true dims the item and shows a "TBD" chip.
  // ───────────────────────────────────────────
  agenda: [
    { time: "9:00 AM",  loc: "Mayer Auditorium Lobby", title: "Check-in & coffee", desc: "Registration desk opens. Poster setup begins on Pappas Quad." },
    { time: "9:30 AM",  loc: "Mayer Auditorium", title: "Welcome & scientific talks", desc: "Research from across the Cancer Center.", tag: "Speakers TBD", tbd: true },
    { time: "11:00 AM", loc: "Mayer Auditorium", title: "Featured session: AI in Cancer Research", desc: "Plenary and panel on artificial intelligence in cancer research and care.", tag: "Panel TBD", tbd: true },
    { time: "12:00 PM", loc: "Pappas Quad",      title: "Lunch & networking", desc: "Lunch is provided. Browse the directory and connect with trainees on the other side of Coffee Consult." },
    { time: "12:45–2:45 PM", loc: "Pappas Quad", title: "Poster session & judging", desc: "Open poster session, with judging for trainee entries and the Patient Advocate poster walk." },
    { time: "2:45 PM",  loc: "Mayer Auditorium", title: "Awards & closing", desc: "Poster awards, Advocate's Choice, and closing remarks." },
    { time: "All day",  loc: "In the app",       title: "Coffee Consult", desc: "A new trainee program pairing bench and clinic. Request a match any time during the day, or until 5 PM on Thursday, Oct 15.", tag: "New for 2026" }
  ],

  // Practical info shown at the bottom of the Agenda view
  info: {
    location: "Keith Administration Building (KAM) – Mayer Auditorium, and Pappas Quad",
    address: "1975 Zonal Ave, Los Angeles, CA 90033",
    wifi: "USC Guest",
    contact_email: "crtec@usc.edu",
    parking: "Biggy Parking Structure, 1334 Biggy St. Flat rate of $10 for USC Norris patients, $20 for general visitors."
  },

  // External links used on the landing page
  links: {
    newsletter: "https://preview.mailerlite.io/forms/2285190/191197669717181651/share",
    livestream: ""   // Livestream URL — powers the "Join the livestream" buttons (nav + Plan your visit).
                      // Leave blank until it's live; buttons show a graceful "check back" message until then.
  },

  // Continuing education status shown on the "Plan your visit" section.
  // Update once CME/CE is confirmed with the Keck CME office.
  ce_note: "We are pursuing continuing education / CME credit for the day through the Keck School of Medicine CME office. Details and how to claim credit will be posted here and shared with registrants once confirmed.",

  // POSTER LOCATIONS ON PAPPAS QUAD — confirmed policy
  // Shared Resources on the side closest to KAM (downhill, top of stairs).
  // Everything else is thematic clusters by research program.
  //
  // Terminology note: a "section" is one SIDE of the quad, not a literal
  // physical row of posters. Each side holds several large boards
  // (perpendicular to the quad, posters mounted on both faces) — exact board
  // count and whether boards are doubled up is a day-of, capacity-driven
  // call for staff once final per-section headcount is known. The app and
  // Code.gs only ever promise the correct SIDE, never a specific board.
  //
  // Section letter is assigned automatically at registration by Code.gs.
  // Everyone (including Core/Shared Resource directors, who are faculty with
  // a real research program) has a genuine Research Program answer — that's
  // their scientific home. Shared Resources is instead flagged via the
  // "Shared Resource/Core" option on Disease / focus area (a checkbox field),
  // which is checked FIRST and overrides the program-based section. See
  // rowLetterFor_ in Code.gs, which must stay in sync with this map.
  //
  // NOT YET PLACED — needs a decision, not guessed here:
  //   - Community Advisory Board / survivor-advocate posters (MCH is uphill;
  //     worth thinking about accessibility before assigning them there)
  //   - CRTEC / education-and-training posters
  // NOTE — the live Google Form's Disease / focus area checkbox list does
  // not yet have a "Shared Resource/Core" option; add one with EXACTLY that
  // text so Code.gs can detect it (see SHARED_RESOURCE_MARKER in Code.gs).
  poster_sides: [
    { id: "kam",     name: "KAM side",     desc: "Downhill, top of the stairs — Shared Resources" },
    { id: "library", name: "Library side", desc: "North side — Norris Medical Library" },
    { id: "hmr",     name: "HMR side",     desc: "Hoffman Medical Research Building" },
    { id: "mch",     name: "MCH side",     desc: "Uphill — McKibben Hall" }
  ],
  // poster_rows: keys are the section LETTER (the prefix before the dash in
  // a poster number, e.g. "A-01" → "A"). Internal property name stays
  // "poster_rows" for backward compatibility; user-facing copy says "Section".
  poster_rows: {
    "S": "KAM side — Shared Resources / Core Facilities",
    "A": "Library side — Tumor Immunology & Microenvironment (TIME)",
    "B": "Library side — Epigenetic Regulation in Cancer (ERC)",
    "C": "HMR side — Translational and Clinical Sciences (TACS)",
    "D": "MCH side, uphill — Cancer Epidemiology (CE)",
    "E": "MCH side, uphill — Cancer Control Research (CCR)"
  },

  // DISEASE AREAS (filter options)
  disease_areas: [
    "Breast", "GI/Colorectal", "Genitourinary", "Head & neck",
    "Hepatobiliary and pancreas", "Leukemia", "Melanoma/Skin", "Neuro-oncology",
    "Pediatric", "Thoracic/Lung", "Cancer care delivery/Implementation science",
    "Shared Resource/Core", "Other"
  ],

  // RESEARCH PROGRAMS (filter + profile cards) — CCSG research programs only.
  // COE (Community Outreach & Engagement) and CRTEC are units/departments, not
  // research programs — anyone affiliated with them (almost always Staff/Other)
  // goes under Department / Lab instead, and won't appear in this filter.
  research_programs: [
    "Tumor Immunology & Microenvironment (TIME)",
    "Epigenetic Regulation in Cancer (ERC)",
    "Translational and Clinical Sciences (TACS)",
    "Cancer Epidemiology (CE)",
    "Cancer Control Research (CCR)"
  ]

};
