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
  script_url: "PASTE_YOUR_APPS_SCRIPT_URL_HERE",

  // GOOGLE SHEETS (directory data)
  // File → Share → Publish to web → Sheet1 → CSV → Publish → copy URL
  sheet_url: "PASTE_YOUR_PUBLISHED_CSV_URL_HERE",

  // Set to false once your sheet URL is pasted above
  use_sample_data: true,

  // Max follow-up connection requests per person (across all tracks)
  max_selections: 2,

  // Where connection requests get sent (Google Form URL — see README)
  form_url: "PASTE_YOUR_GOOGLE_FORM_URL_HERE",

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
      sideB: { roles: ["Clinical Fellow / Resident"], programMatch: null }
    }
  ],

  // ───────────────────────────────────────────
  // AGENDA — the whole-day digital program
  // tag: optional pill. tbd: true dims the item and shows a "TBD" chip.
  // ───────────────────────────────────────────
  agenda: [
    { time: "9:00 AM",  loc: "Pappas Quad",      title: "Check-in & coffee", desc: "Registration desk opens. Poster setup begins." },
    { time: "9:30 AM",  loc: "Mayer Auditorium", title: "Welcome & scientific talks", desc: "Research from across the Cancer Center.", tag: "Speakers TBD", tbd: true },
    { time: "11:00 AM", loc: "Mayer Auditorium", title: "Featured session: AI in Cancer Research", desc: "Plenary and panel on artificial intelligence in cancer research and care.", tag: "Panel TBD", tbd: true },
    { time: "12:00 PM", loc: "Pappas Quad",      title: "Lunch & networking", desc: "Lunch is provided. Browse the directory and log conversations." },
    { time: "12:45–2:45 PM", loc: "Pappas Quad", title: "Poster session & judging", desc: "Open poster session, with judging for trainee entries and the Patient Advocate poster walk." },
    { time: "2:15 PM",  loc: "In the app",       title: "Log your conversations", desc: "Coffee Consult requests stay open until 5 PM the next day, Thursday, Oct 15." },
    { time: "2:45 PM",  loc: "Mayer Auditorium", title: "Awards & closing", desc: "Poster awards, Advocate's Choice, and closing remarks." }
  ],

  // Practical info shown at the bottom of the Agenda view
  info: {
    location: "Mayer Auditorium, Keith Administration Building (KAM), and Pappas Quad",
    address: "1975 Zonal Ave, Los Angeles, CA 90033",
    wifi: "USC Guest",
    contact_email: "crtec@usc.edu",
    parking: "Biggy Parking Structure, 1334 Biggy St. Flat rate of $10 for USC Norris patients, $20 for general visitors."
  },

  // External links used on the landing page
  links: {
    newsletter: "PASTE_YOUR_NEXT_IN_SCIENCE_SUBSCRIBE_URL_HERE",
    livestream: ""   // Livestream URL — powers the "Join the livestream" buttons (nav + Plan your visit).
                      // Leave blank until it's live; buttons show a graceful "check back" message until then.
  },

  // Continuing education status shown on the "Plan your visit" section.
  // Update once CME/CE is confirmed with the Keck CME office.
  ce_note: "We are pursuing continuing education / CME credit for the day through the Keck School of Medicine CME office. Details and how to claim credit will be posted here and shared with registrants once confirmed.",

  // DISEASE AREAS (filter options)
  disease_areas: [
    "Breast", "GI / Colorectal", "GU / Prostate", "Hematologic", "Lung",
    "Neuro-oncology", "Melanoma / Skin", "Pediatric", "Cancer Prevention", "Multiple / Other"
  ],

  // RESEARCH PROGRAMS (filter + profile cards) — CCSG programs + COE + CRTEC
  research_programs: [
    "Tumor Microenvironment (TIME)",
    "Genomic & Epigenomic Regulation (ERC)",
    "Translational & Clinical Sciences (TACS)",
    "Cancer Epidemiology (CE)",
    "Cancer Control Research (CCR)",
    "Community Outreach & Engagement (COE)",
    "Education & Training (CRTEC)"
  ]

};
