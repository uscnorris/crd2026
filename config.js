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
  sheet_url: "https://docs.google.com/spreadsheets/d/e/2PACX-1vTj6gbHwLk4_RffTa8lTHvjk-RkTAE1fQoIYmpIIleV-qAnmPN3P6xeXggoQk8JGPbqyejNqnSW28fQ/pub?gid=786211893&single=true&output=csv",
  // If sheet_url is not set, the app uses the sample data in data.js
  use_sample_data: false,

  // COFFEE CONSULT SETTINGS
  // Only these roles see the Coffee Consult option
  // Coffee Consult is restricted to CBG PhD Students <-> Clinical Fellows/Residents
  // Program matching is enforced in app.js isCoffeeEligiblePair() — edit there, not here
  coffee_consult_roles: ["PhD Student", "Clinical Fellow / Resident"],

  // Max Coffee Consult selections per person
  max_selections: 2,

  // Where Coffee Consult selections get emailed
  // Use a Google Form URL to collect submissions (see README for setup)
  form_url: "PASTE_YOUR_GOOGLE_FORM_URL_HERE",

  // BASE URL for QR codes
  // After deploying to GitHub Pages, paste your URL here
  // e.g. "https://crtec.github.io/crd2026"
  base_url: "https://uscnorris.github.io/crd2026",

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
