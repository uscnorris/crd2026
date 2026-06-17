// ─────────────────────────────────────────────
// CRTEC Cancer Research Day App — Config
// This is the only file you need to edit.
// ─────────────────────────────────────────────

const CONFIG = {

  // EVENT DETAILS
  event_name: "Cancer Research Day 2026",
  event_date: "October 14, 2026",
  event_location: "USC Norris Comprehensive Cancer Center",

  // APPS SCRIPT BACKEND
  // Paste your deployed Apps Script web app URL here (see Code.gs setup instructions)
  script_url: "https://script.google.com/macros/s/AKfycbweU1LwtmJFcwvDfmWQ-XJNPu2KhGd5n8afKIIllrTK7LqwoZuk-JFXVkzlUIh1CU9heg/exec",

  // GOOGLE SHEETS
  // Paste the published CSV URL below.
  // Get it from: File → Share → Publish to web → Sheet1 → CSV → Publish → copy URL
  // The URL must start with https://docs.google.com/spreadsheets/d/e/... and contain /pub?
  sheet_url: "https://docs.google.com/spreadsheets/d/e/2PACX-1vTj6gbHwLk4_RffTa8lTHvjk-RkTAE1fQoIYmpIIleV-qAnmPN3P6xeXggoQk8JGPbqyejNqnSW28fQ/pub?gid=786211893&single=true&output=csv",

  // Set to false once your sheet URL is pasted above
  use_sample_data: true,

  // COFFEE CONSULT SETTINGS
  // Coffee Consult is restricted to CBG PhD Students <-> Clinical Fellows/Residents
  // Program matching is enforced in app.js isCoffeeEligiblePair() — edit there, not here
  coffee_consult_roles: ["PhD Student", "Clinical Fellow / Resident"],

  // Max Coffee Consult selections per person
  max_selections: 2,

  // Where Coffee Consult selections get emailed (Google Form URL — see README)
  form_url: "PASTE_YOUR_GOOGLE_FORM_URL_HERE",

  // BASE URL for QR codes — your GitHub Pages URL
  base_url: "https://uscnorris.github.io/crd2026",

  // DISEASE AREAS (filter options — edit to match your data)
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
    "Tumor Immunology & Microenvironment",
    "Epigenetic Regulation in Cancer",
    "Translational & Clinical Sciences",
    "Cancer Epidemiology",
    "Cancer Health Disparities",
    "Cancer Prevention & Control",
    "Community Outreach & Engagement",
    "Computational & Data Sciences"
  ]

};
