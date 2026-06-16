// ─────────────────────────────────────────────
// SAMPLE DATA
// This is used when config.js has use_sample_data: true
// In production, data loads from your Google Sheet instead.
//
// GOOGLE SHEET COLUMN ORDER (must match exactly):
// id | name | role | year | department | poster_number |
// title | summary | disease_area | research_program |
// clinical_input | linkedin_url | photo_url
// ─────────────────────────────────────────────

const SAMPLE_DATA = [
  {
    id: "cbg-001",
    name: "Sarah Chen",
    role: "CBG Student",
    year: "Year 2",
    department: "Cancer Biology & Genomics",
    poster_number: "A-04",
    title: "Tumor microenvironment remodeling in triple-negative breast cancer",
    summary: "Investigating how immune cell composition in the tumor microenvironment shifts during neoadjuvant chemotherapy in TNBC, with the goal of identifying predictors of pathologic complete response.",
    disease_area: "Breast",
    research_program: "Tumor Microenvironment & Immunology",
    clinical_input: true,
    linkedin_url: "https://linkedin.com/in/sarahchen",
    photo_url: ""
  },
  {
    id: "cbg-002",
    name: "Marcus Webb",
    role: "CBG Student",
    year: "Year 3",
    department: "Cancer Biology & Genomics",
    poster_number: "B-11",
    title: "Mechanisms of acquired resistance to KRAS G12C inhibitors in colorectal cancer",
    summary: "Using patient-derived organoids and proteomic profiling to map resistance mechanisms to sotorasib and adagrasib in KRAS G12C-mutant CRC, with a focus on bypass signaling through EGFR.",
    disease_area: "GI / Colorectal",
    research_program: "Cancer Biology & Genomics",
    clinical_input: true,
    linkedin_url: "",
    photo_url: ""
  },
  {
    id: "cbg-003",
    name: "Priya Nair",
    role: "CBG Student",
    year: "Year 2",
    department: "Cancer Biology & Genomics",
    poster_number: "C-07",
    title: "PD-L1 regulation and immune evasion in castration-resistant prostate cancer",
    summary: "Characterizing transcriptional mechanisms that upregulate PD-L1 expression in CRPC following androgen deprivation therapy, and evaluating combination IO strategies in preclinical models.",
    disease_area: "GU / Prostate",
    research_program: "Tumor Microenvironment & Immunology",
    clinical_input: true,
    linkedin_url: "https://linkedin.com/in/priyanair",
    photo_url: ""
  },
  {
    id: "cbg-004",
    name: "James Okonkwo",
    role: "CBG Student",
    year: "Year 4",
    department: "Cancer Biology & Genomics",
    poster_number: "A-12",
    title: "Epigenetic reprogramming drives AML relapse after venetoclax-based therapy",
    summary: "Single-cell ATAC-seq and RNA-seq of paired diagnosis/relapse AML samples to identify chromatin accessibility changes that enable leukemic stem cell survival under venetoclax + azacitidine.",
    disease_area: "Hematologic",
    research_program: "Cancer Biology & Genomics",
    clinical_input: true,
    linkedin_url: "",
    photo_url: ""
  },
  {
    id: "cbg-005",
    name: "Yuki Tanaka",
    role: "CBG Student",
    year: "Year 2",
    department: "Cancer Biology & Genomics",
    poster_number: "D-03",
    title: "HER2 intratumoral heterogeneity and response to T-DM1 in gastric adenocarcinoma",
    summary: "Spatial transcriptomics of HER2-positive gastric tumors to map heterogeneity patterns and correlate with clinical response to trastuzumab emtansine in a retrospective cohort.",
    disease_area: "GI / Colorectal",
    research_program: "Cancer Biology & Genomics",
    clinical_input: false,
    linkedin_url: "",
    photo_url: ""
  },
  {
    id: "fellow-001",
    name: "Dr. Alicia Reyes",
    role: "Fellow",
    year: "Year 2",
    department: "Medical Oncology Fellowship",
    poster_number: "E-01",
    title: "IO toxicity patterns in metastatic RCC: a retrospective single-center analysis",
    summary: "Chart review of 84 patients with mRCC treated with first-line nivolumab + ipilimumab at USC Norris, characterizing immune-related adverse event frequency, grade, and management outcomes.",
    disease_area: "GU / Prostate",
    research_program: "Translational & Clinical Research",
    clinical_input: false,
    linkedin_url: "https://linkedin.com/in/aliciareyes",
    photo_url: ""
  },
  {
    id: "fellow-002",
    name: "Dr. Daniel Kim",
    role: "Fellow",
    year: "Year 1",
    department: "Medical Oncology Fellowship",
    poster_number: "E-02",
    title: "Treatment sequencing after progression on FOLFOX in metastatic CRC: practice patterns at LAC+USC",
    summary: "Retrospective cohort study examining second-line treatment selection and outcomes for mCRC patients treated at LAC+USC between 2019 and 2024, with attention to RAS/BRAF mutational status.",
    disease_area: "GI / Colorectal",
    research_program: "Translational & Clinical Research",
    clinical_input: false,
    linkedin_url: "",
    photo_url: ""
  },
  {
    id: "fac-001",
    name: "Dr. Evanthia Roussos Torres",
    role: "Faculty",
    year: "",
    department: "Division of Medical Oncology",
    poster_number: "",
    title: "CRTEC: building the physician-scientist pipeline at USC Norris",
    summary: "Overview of CRTEC's training infrastructure, current programs, and the Translating Together pilot — connecting oncology fellows and CBG doctoral students through structured research consultation.",
    disease_area: "Multiple / Other",
    research_program: "Translational & Clinical Research",
    clinical_input: false,
    linkedin_url: "",
    photo_url: ""
  },
  {
    id: "cbg-006",
    name: "Aisha Osei",
    role: "CBG Student",
    year: "Year 3",
    department: "Cancer Biology & Genomics",
    poster_number: "B-08",
    title: "Mismatch repair deficiency as a predictive biomarker in endometrial cancer",
    summary: "Functional characterization of MMR-deficient endometrial tumors and correlation with pembrolizumab response, using TCGA data and a prospective USC Norris patient cohort.",
    disease_area: "Multiple / Other",
    research_program: "Cancer Biology & Genomics",
    clinical_input: true,
    linkedin_url: "",
    photo_url: ""
  },
  {
    id: "cbg-007",
    name: "Luis Morales",
    role: "CBG Student",
    year: "Year 3",
    department: "Cancer Biology & Genomics",
    poster_number: "C-14",
    title: "CAR-T cell persistence and exhaustion in B-cell lymphoma",
    summary: "Interrogating T cell exhaustion trajectories in axicabtagene ciloleucel-treated DLBCL patients using single-cell sequencing of pre- and post-infusion products collected at USC Norris.",
    disease_area: "Hematologic",
    research_program: "Tumor Microenvironment & Immunology",
    clinical_input: true,
    linkedin_url: "https://linkedin.com/in/luismorales",
    photo_url: ""
  }
];
