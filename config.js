// ─────────────────────────────────────────────
// CRTEC Cancer Research Day App — Config
// This is the only file you need to edit.
// ─────────────────────────────────────────────

const CONFIG = {

  // EVENT DETAILS
  event_name: "Cancer Research Day 2026",
  event_date: "October 14, 2026",
  event_location: "USC Norris Comprehensive Cancer Center",

  // GOOGLE SHEETS
  // Step 1: Publish your Google Sheet (File → Share → Publish to web → CSV)
  // Step 2: Paste the published CSV URL below
  // Format: https://docs.google.com/spreadsheets/d/YOUR_SHEET_ID/export?format=csv&gid=0
  sheet_url: "PASTE_YOUR_GOOGLE_SHEET_CSV_URL_HERE",

  // If sheet_url is not set, the app uses the sample data in data.js
  use_sample_data: true,

  // COFFEE CONSULT SETTINGS
  // Only these roles see the Coffee Consult option
  coffee_consult_roles: ["PhD Student", "Clinical Fellow / Resident"],

  // Max Coffee Consult selections per person
  max_selections: 2,

  // Where Coffee Consult selections get emailed
  // Use a Google Form URL to collect submissions (see README for setup)
  form_url: "PASTE_YOUR_GOOGLE_FORM_URL_HERE",

  // BASE URL for QR codes
  // After deploying to GitHub Pages, paste your URL here
  // e.g. "https://crtec.github.io/crd2026"
  base_url: "https://crtec.github.io/crd2026",

  // DISEASE AREAS (shown as filter chips — edit to match your data)
  disease_areas: [
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
  ],

  // RESEARCH PROGRAMS (shown in profile cards)
  research_programs: [
    "Cancer Biology & Genomics",
    "Tumor Microenvironment & Immunology",
    "Cancer Prevention & Control",
    "Translational & Clinical Research",
    "Computational & Data Sciences"
  ]

};
