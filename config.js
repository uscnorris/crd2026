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
  sheet_url: "https://docs.google.com/spreadsheets/d/e/2PACX-1vQksITlntkPc60L__OSZomcBTOpjGXHI5kEEErmZLjFl3qe1KOPN6E80yExao-4El3fgYJ79PjI2ZGS/pub?gid=1334489619&single=true&output=csv",

  // Set to false once your sheet URL is pasted above
  use_sample_data: false,

  // Max follow-up connection requests per person (across all tracks)
  max_selections: 2,

  // Where connection requests get sent (Google Form URL — see README)
  form_url: "https://forms.gle/NScGUCFhKD9d4qv19",

  // BASE URL for QR codes — your GitHub Pages URL
  base_url: "https://uscnorris.github.io/crd2026",

  // External links used on the landing page
  links: {
    newsletter: "PASTE_YOUR_NEXT_IN_SCIENCE_SUBSCRIBE_URL_HERE",
    livestream: ""   // virtual attendee livestream URL (shared with registrants)
  },

  // Continuing education status shown on the "Plan your visit" section.
  // Update once CME/CE is confirmed with the Keck CME office.
  ce_note: "We are pursuing continuing education / CME credit for the day through the Keck School of Medicine CME office. Details and how to claim credit will be posted here and shared with registrants once confirmed.",

  // ───────────────────────────────────────────
  // CONNECTION TRACKS
  // Each track connects two groups, maps to a CRTEC aim, and produces a
  // training outcome. The app offers the applicable track when a viewer
  // opens someone's profile. Order = priority (first match wins).
  //   sideA / sideB: { roles: [...], programMatch: [substrings] | null, requiresFlag: "field" }
  //   programMatch null = any program; otherwise matches research_program+department (case-insensitive)
  //   requiresFlag = the person must have that column set to TRUE (e.g. faculty opting into mentoring)
  // ───────────────────────────────────────────
  connection_tracks: [
    {
      id: "coffee",
      name: "Coffee Consult",
      icon: "☕",
      aim: "Clinical & Translational",
      outcome_tag: "R38 data",
      purpose: "Bench meets clinic. A Cancer Biology PhD student and an oncology fellow talk through the clinical rationale behind the science.",
      cta: "Add to Coffee Consult",
      sideA: { roles: ["PhD Student"], programMatch: ["cancer biology", "cbg", "genomics"] },
      sideB: { roles: ["Clinical Fellow / Resident"], programMatch: null }
    },
    {
      id: "mentor",
      name: "Mentor Match",
      icon: "🧭",
      aim: "Team Science & Mentorship",
      outcome_tag: "",
      purpose: "Career and research advice. A trainee sits down with a faculty mentor for a short, focused consult.",
      cta: "Request Mentor Match",
      sideA: { roles: ["PhD Student", "Master's Student", "Postdoctoral Fellow", "Clinical Fellow / Resident", "Undergraduate Student"], programMatch: null },
      sideB: { roles: ["Faculty"], programMatch: null, requiresFlag: "mentoring" }
    },
    {
      id: "advocate",
      name: "Patient Perspective",
      icon: "💬",
      aim: "Community Education",
      outcome_tag: "",
      purpose: "Practice explaining your work in plain language and hear the patient perspective from a survivor-advocate.",
      cta: "Request a Patient Perspective chat",
      sideA: { roles: ["PhD Student", "Master's Student", "Postdoctoral Fellow", "Clinical Fellow / Resident", "Undergraduate Student", "Faculty"], programMatch: null },
      sideB: { roles: ["Community Member"], programMatch: null }
    },
    {
      id: "peer",
      name: "Near-Peer",
      icon: "🌱",
      aim: "Inclusive Pipeline",
      outcome_tag: "",
      purpose: "See what graduate training is really like. An undergrad or master's student connects with a PhD student or postdoc.",
      cta: "Request Near-Peer connection",
      sideA: { roles: ["Undergraduate Student", "Master's Student", "Attendee"], programMatch: null },
      sideB: { roles: ["PhD Student", "Postdoctoral Fellow"], programMatch: null }
    }
  ],

  // ───────────────────────────────────────────
  // AGENDA — the whole-day digital program
  // tag: optional pill. tbd: true dims the item and shows a "TBD" chip.
  // ───────────────────────────────────────────
  agenda: [
    { time: "9:00 AM",  title: "Check-in & coffee", desc: "Registration desk opens on Pappas Quad. Poster setup begins." },
    { time: "9:30 AM",  title: "Welcome & scientific talks", desc: "Research from across the Cancer Center.", tag: "Speakers TBD", tbd: true },
    { time: "11:00 AM", title: "Featured session: AI in Cancer Research", desc: "Plenary and panel on artificial intelligence in cancer research and care.", tag: "Panel TBD", tbd: true },
    { time: "12:00 PM", title: "Lunch & networking", desc: "Lunch on Pappas Quad. Connection tracks are active — browse the directory and log conversations." },
    { time: "12:45 – 2:45 PM", title: "Poster session & judging", desc: "Interactive poster session with scientific award judging and the Patient Advocate poster walk." },
    { time: "2:15 PM",  title: "Connection requests close", desc: "Submit your follow-up connection requests in the app by 2:15." },
    { time: "2:45 PM",  title: "Awards & closing", desc: "Poster awards, Advocate's Choice, and closing remarks." }
  ],

  // Practical info shown at the bottom of the Agenda view
  info: {
    location: "Mayer Auditorium, Keith Administration Building & Pappas Quad",
    wifi: "USC Guest",
    contact_email: "crtec@usc.edu",
    parking: "[Add parking details]"
  },

  // DISEASE AREAS (filter options)
  // DISEASE AREAS — must exactly match the checkbox options on the
  // registration form's "Disease / focus area" question, so submitted values
  // match this filter one-to-one.
  disease_areas: [
    "Breast", "GI/Colorectal", "Genitourinary", "Head & neck",
    "Hepatobiliary and pancreas", "Leukemia", "Melanoma/Skin", "Neuro-oncology",
    "Pediatric", "Thoracic/Lung", "Cancer care delivery/Implementation science", "Other"
  ],

  // RESEARCH PROGRAMS (filter + profile cards) — CCSG research programs only.
  // COE (Community Outreach & Engagement) and CRTEC are units/departments, not
  // research programs — staff associated with them go under Department/Lab
  // instead, and won't appear in this filter.
  research_programs: [
    "Tumor Microenvironment (TIME)",
    "Genomic & Epigenomic Regulation (ERC)",
    "Translational & Clinical Sciences (TACS)",
    "Cancer Epidemiology (CE)",
    "Cancer Control Research (CCR)"
  ]

};
