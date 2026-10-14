// ─────────────────────────────────────────────
// CRTEC Cancer Research Day App — Config
// This is the main file you edit to run the day.
// ─────────────────────────────────────────────

const CONFIG = {

  // EVENT DETAILS
  event_name: "Cancer Research Day 2026",
  event_tagline: "4th Annual · USC Norris Comprehensive Cancer Center",
  event_date: "Wednesday, October 14, 2026",
  event_time: "8:30 AM – 3 PM",
  event_location: "Mayer Auditorium & Pappas Quad",

  // APPS SCRIPT BACKEND (event tracking)
  // Paste your deployed Apps Script web app URL here (see Code.gs setup instructions)
  script_url: "https://script.google.com/macros/s/AKfycbzm3v4EXQ2VwnmOEAUAyLteeAv4HGFfugMfDO22BbwWNBkT-w4rhgXg7x4rKURrpGo3jQ/exec",

  // GOOGLE SHEETS (directory data)
  // File → Share → Publish to web → Sheet1 → CSV → Publish → copy URL
  sheet_url: "https://docs.google.com/spreadsheets/d/e/2PACX-1vQksITlntkPc60L__OSZomcBTOpjGXHI5kEEErmZLjFl3qe1KOPN6E80yExao-4El3fgYJ79PjI2ZGS/pub?gid=541125230&single=true&output=csv",

  // Set to false once your sheet URL is pasted above
  use_sample_data: false,

  // ── POSTER NUMBER ASSIGNMENTS (counterclockwise, 1 = corner by the staff table) ──
  // Authoritative board numbers from the CRTEC poster setup list. app.js applies these
  // over the sheet by matching the poster title, then any presenter or co-presenter
  // name, so a stale number or missing co-presenter row in the sheet cannot misplace a poster.
  poster_assignments: [
    { n: 1, title: "Flow Cytometry and Immune Monitoring Core (FCIM)", names: [] },
    { n: 2, title: "Liquid Biopsy Core (LBC)", names: [] },
    { n: 3, title: "USC Norris Molecular Genomics Core", names: ["Stephanie Tring"] },
    { n: 4, title: "Translational Pathology Core (TPC)", names: [] },
    { n: 5, title: "Data Science Core (DSC)", names: [] },
    { n: 6, title: "Population Research Core (PRC)", names: [] },
    { n: 7, title: "Preclinical Models Shared Resource (PMSR)", names: [] },
    { n: 8, title: "SDOH and immune profiling identify subtype-specific immune remodeling underlying breast cancer disparities in Hispanic/Latinx patients", names: ["Nana Gyabaah-Kessie"] },
    { n: 9, title: "The USC Brain Tumor Center Precision Medicine Initiative: From Bedside to Bench and Back Again", names: ["Brooke Nakamura", "Maya Zarafshan"] },
    { n: 10, title: "A Microneurosurgical Survival Platform for Elucidating Mechanisms of Brain Tumor Recurrence and Metastasis", names: ["Diganta Das"] },
    { n: 11, title: "Radioligand therapy in combination with CAR T cells overcomes the heterogeneous immunosuppressive prostate tumor microenvironment", names: ["Jiangyue Liu"] },
    { n: 12, title: "Exploring anti-hCD1d antibodies for anti-melanoma immunotherapies with a humanized mouse model", names: ["Andrew Behne"] },
    { n: 13, title: "Low c-MET Identifies a CD8-Enriched, Favorable-Outcome Subset of HPV-Negative HNSCC", names: ["William Dennis"] },
    { n: 14, title: "Subpopulations of CAF contribute to chemotherapy resistance in tumors through different MYCN-dependent and independent mechanisms", names: ["Kevin Louault"] },
    { n: 15, title: "Endogenously released tumor-derived extracellular vesicles (TEVs) captured by endothelial cells and resident macrophages drive vascular leakiness and inflammation in the pre-metastatic niche (PMN)", names: ["Laurence Blavier Sarte"] },
    { n: 16, title: "Contribution of tumor-derived extracellular vesicles in the establishment of the pre-metastatic niche: lessons learned from past experimentations and future directions", names: ["Andjela Crnjac"] },
    { n: 17, title: "Chromosome 2q31.2 Deletion Impairs Neuronal Plasticity through Integrated Stress Response Activation", names: ["Radhika Joshi"] },
    { n: 18, title: "Tri-specific T Cell Engager Targeting Tumor-Initiating Cells in Hepatocellular Carcinoma: A Framework for Mechanistic Validation and Tumor Microenvironment Modeling", names: ["Yang Cui"] },
    { n: 19, title: "Tumor Mircroenvironment Modulation Using Four Drug Oral Combination Therapy in Murine Triple Negative Breast Cancer Model", names: ["Vyshnavi Pachipulusu"] },
    { n: 20, title: "Targeting MAO B: A novel gut-brain axis link in colorectal cancer progression", names: ["Unnati Shah"] },
    { n: 21, title: "A patient-derived colorectal cancer organ-on-chip model for functionally interrogating cancer-associated fibroblast heterogeneity in tumor invasion", names: ["Bethany Haliday"] },
    { n: 22, title: "Blood-based Circulatory Cancer Cell Biology in Metastatic Triple Negative Breast Cancer Patients from SWOG1416 Trial", names: ["Ian Ward", "Chloe Moshrefi"] },
    { n: 23, title: "HDAC1-specific inhibition upregulates Malat1 in myeloid-derived suppressor cells and breast cancer cells and induces cell cycle arrest", names: ["Lori Khatchaturian"] },
    { n: 24, title: "Comparative Effects of Entinostat and Canonical CDK4/6 Inhibition on Cell Cycle Regulation", names: ["Steven Fu"] },
    { n: 25, title: "Beyond RECIST: mathematical modeling and Bayesian inference reveal the importance of immune suppressive parameters in metastatic breast cancer", names: ["Jonathan Martinez"] },
    { n: 26, title: "Preclinical Testing of Chimeric Antigen Receptor (CAR) T-Cells in Zebrafish Ewing Sarcoma Models", names: ["Omoye Ehimare"] },
    { n: 27, title: "Characterizing Intratumoral Bacteria and Associated Tumor Phenotypes in Prostate Cancer", names: ["Lisa Swartz", "Madison Roth"] },
    { n: 28, title: "Spatial cell circuits reveal communication pattern in the breast cancer TME with single-cell and spatial transcriptomics", names: ["Yingtong Liu"] },
    { n: 29, title: "MCT4-Associated Lactate Export Defines Myeloid Metabolic Reprogramming during Head and Neck Cancer Progression", names: ["Thomas Tilton"] },
    { n: 30, title: "A nuclear morphology-defined state space captures cancer cell identity and state transitions", names: ["Vic Zamloot"] },
    { n: 31, title: "Targeting HLA-DR with a Lym-1 CAR T-Cell to Overcome Antigen Loss in B-Cell Malignancies", names: ["Ellen Edjhuryan"] },
    { n: 32, title: "The Enteric-SSRI Axis: Dysregulated Peripheral Serotonin as a Driver of Systemic Metastasis", names: ["Ulises Izquierdo"] },
    { n: 33, title: "CXCL5 Links Hepatic Steatosis to an Immunosuppressive Tumor Microenvironment in Liver Cancer", names: ["Diala Alhousari"] },
    { n: 34, title: "Learning Equations of Tumor Growth from Noisy, Agent-Based Snapshots", names: ["Sriram Seshadri"] },
    { n: 35, title: "Engineered bone-targeting immunotherapeutic exosomes enable T cell–mediated eradication of metastatic prostate cancer", names: ["Lei Zhang"] },
    { n: 36, title: "Extracellular Matrix Context Modulates Lipid Metabolism and Fatty Acid Sensitivity in Pancreatic Cancer", names: ["Jonathan Barajas"] },
    { n: 37, title: "Mitochondrial-Nuclear Metabolic Signaling Regulates NANOG-Associated Stemness in Hepatocellular Carcinoma Tumor-Initiating Cells", names: ["Muskan Gurbuxani"] },
    { n: 38, title: "AKT2 loss blocks liver tumor development in PTEN-deficient mice, while dual AKT1-AKT2 loss accelerates tumorigenesis", names: ["Ielyzaveta Slarve"] },
    { n: 41, title: "Beyond Pathways Boundaries: A Degree-Aware Network Clustering for Gene Set Analysis", names: ["Bryan Queme"] },
    { n: 42, title: "One sentence to the methylome: verified multi-agent AI for Nanopore and PacBio long-read sequencing", names: ["Yang Liu"] },
    { n: 43, title: "Efficacy of DNA methyltransferase inhibition in combination with immune-checkpoint/PARP-inhibitor in colorectal cancer preclinical model", names: ["Pooja Mittal"] },
    { n: 44, title: "ALKBH2/3-Driven Alkylation Repair in Glioblastoma ChemoRT Resistance", names: ["Maria Lerica Quiloan"] },
    { n: 45, title: "Identification of squalene biosynthesis as a novel SHH subgroup-specific vulnerability in atypical teratoid rhabdoid tumors", names: ["Payton Zarceno"] },
    { n: 46, title: "Investigating the Role of Microglia in the Response of H3K27M Glioma to Decitabine", names: ["Athena Juanxia Wu"] },
    { n: 47, title: "Methclone 2.0: A Computational Workflow for Quantifying Epiallele Heterogeneity in Hematopoietic Aging", names: ["Yikai Tu"] },
    { n: 48, title: "H3K27me3 mediates distinct chemoresistant states in glioma stem cells across oxygen conditions", names: ["Tammy Doan"] },
    { n: 49, title: "Integrated transcriptomic and epigenomic analysis to study the mechanism by which smoke-induced hypomethylation of cg05575921 increases lung cancer risk.", names: ["Matthew Gladstone"] },
    { n: 50, title: "Tet2 deficiency mitigates transcriptional and epigenetic aging in clonal hematopoiesis", names: ["Qiuyang Zhang"] },
    { n: 51, title: "TRACE: Accurate Tumor Subtype Classification with Interpretable Histological Phenotype Identification via Pathology Foundation Model", names: ["Yueshan Liang"] },
    { n: 52, title: "Cigarette smoke drives a stress response and alters AT2 identity in a human iPSC-derived alveolar type 2 cell model", names: ["Yvette Carbajal"] },
    { n: 53, title: "Hydroxyproline as a potential driver of aging", names: ["Xuanyi Shi"] },
    { n: 54, title: "Age of host impact on epigenetics in tumors derived from early or late onset Hispanic colorectal cancer patients", names: ["Lesly Torres-Gonzalez"] },
    { n: 56, title: "Exploring novel approaches for iNKT cell-targeting cancer immunotherapies with a humanized mouse model", names: ["Zhen Shen"] },
    { n: 57, title: "Age-associated myeloid inflammation and accelerated tumor progression are mitigated by non-bone marrow-derived youthful circulating factors", names: ["Hisashi Kanemaru"] },
    { n: 58, title: "Mapping Candidate ssDNA gaps in High-Grade Serous Ovarian Cancer Using Long-Read Sequencing", names: ["Petrina Kan", "Daphne Wong"] },
    { n: 59, title: "Differences in survival across distinct fibroblast growth factor receptor 2 and 3 gene expression levels across a metastatic colorectal cancer cohort", names: ["Steve Soto Trujillo"] },
    { n: 61, title: "Praxis-BGM: Bayesian Transfer Learning for Cancer Molecular Subtyping from High-Dimensional Omics Data", names: ["Qiran Jia"] },
    { n: 62, title: "The Association between Prostate Cancer and Geospatial Ambient Pesticide Exposures in the Multiethnic Cohort", names: ["Jazmine Chism"] },
    { n: 63, title: "Evaluation of the effectiveness of CoGENES educational screening interventions in increasing CRC screening knowledge, screening intent, and behavioral readiness in Latino Populations.", names: ["Neeki Ettefagh"] },
    { n: 64, title: "Mendelian Randomization Analysis of Blood Cell Traits in Acute Lymphoblastic Leukemia", names: ["Benjamin Alonzo"] },
    { n: 65, title: "Prostate cancer outcomes in Hispanic/Latino ethnic enclaves: results from the California Cancer Registry and American Community Survey", names: ["Diego Alvarez"] },
    { n: 66, title: "Multimorbidity and colorectal cancer–specific mortality in California, 2011–2021: A stratified analysis by race and ethnicity", names: ["William Hernandez"] },
    { n: 67, title: "Measuring All-Age and Early Onset Colorectal Cancer Incidence using Electronic Health Records (EHR) Data", names: ["Tomás Delgado Manea"] },
    { n: 68, title: "Biologically Informed Neural Networks to Model GxE Interactions for Colorectal Cancer", names: ["Yubo Fu"] },
    { n: 69, title: "Targeted Sequencing as a Means of Identifying Early Leukemic Clones: a Pilot Study", names: ["Kensie Soule"] },
    { n: 70, title: "Maternal Cytomegalovirus Serostatus and Risk of Pediatric ALL", names: ["Nina Nelson"] },
    { n: 72, title: "Reducing Delays in Cancer Care: A Mixed-Methods Evaluation of Navigation Services in a Los Angeles County Safety-Net Settings", names: ["Morgan Gill"] },
    { n: 73, title: "Implementation of a Regional SDOH Patient Navigation Program", names: ["Kelsie Campbell"] },
    { n: 74, title: "Neighborhood Factors, Early-Onset Diagnosis, and Timeliness of Care Among Asian American Breast Cancer Patients: Findings from the AMBER-LA study", names: ["Junrui Lyu"] },
    { n: 75, title: "Scaling Up the Implementation Studio for Evidence-Based Cancer Control in Real-World Settings", names: ["Yujun Zhu"] },
    { n: 76, title: "Real-World Outcomes in Lung Cancer Screening: Uncaptured Benefits of LungRADS \"S\"", names: ["Alexander Chiao"] },
    { n: 77, title: "Longitudinal Depressive Symptom Burden During Early Survivorship Among Survivors of Young Adult Cancer", names: ["Mariah Echeverria"] },
    { n: 78, title: "Developing an AI-Assisted Medical Record Abstraction Workflow to Characterize Cervical Cancer Care Patterns: A Preliminary Human–AI Comparison", names: ["Vibha Kodancha"] },
    { n: 79, title: "Small Molecule WNT Inhibitors as Emerging Therapies for Germ Cell Therapies", names: ["Anna Luzzi"] },
    { n: 80, title: "CaRE2 / BioRepository", names: ["Jose Aparicio"] },
    { n: 81, title: "Clinical Investigations Support Office (CISO)", names: [] },
    { n: 82, title: "SORF: The NIH-supported USC/CHLA Summer Oncology Research Fellowship Program", names: ["Daikota Barnett"] },
  ],

  // ── EXTRA DIRECTORY ENTRIES ─────────────────
  // Shared Resources, program tables and anyone whose poster reached us on the
  // paper list rather than through the registration form. These have no row in
  // the Google Sheet, so the app appends them to whatever the sheet returns.
  // Same field names as the sheet's column headers. Remove an entry here once
  // its real row exists in the sheet, or it will appear twice.
  extra_entries: [
    { id: "sr-fcim",  name: "Flow Cytometry and Immune Monitoring Core (FCIM)", role: "Shared Resource", poster_number: "1",  board_location: "Hoffman side", research_program: "Shared Resources & Programs", title: "Flow Cytometry and Immune Monitoring Core (FCIM)" },
    { id: "sr-lbc",   name: "Liquid Biopsy Core (LBC)",                          role: "Shared Resource", poster_number: "2",  board_location: "Hoffman side", research_program: "Shared Resources & Programs", title: "Liquid Biopsy Core (LBC)" },
    { id: "sr-tpc",   name: "Translational Pathology Core (TPC)",                role: "Shared Resource", poster_number: "4",  board_location: "Hoffman side", research_program: "Shared Resources & Programs", title: "Translational Pathology Core (TPC)" },
    { id: "sr-dsc",   name: "Data Science Core (DSC)",                           role: "Shared Resource", poster_number: "5",  board_location: "Hoffman side", research_program: "Shared Resources & Programs", title: "Data Science Core (DSC)" },
    { id: "sr-prc",   name: "Population Research Core (PRC)",                    role: "Shared Resource", poster_number: "6",  board_location: "Hoffman side", research_program: "Shared Resources & Programs", title: "Population Research Core (PRC)" },
    { id: "sr-pmsr",  name: "Preclinical Models Shared Resource (PMSR)",         role: "Shared Resource", poster_number: "7",  board_location: "Hoffman side", research_program: "Shared Resources & Programs", title: "Preclinical Models Shared Resource (PMSR)" },
    { id: "sr-genomics", name: "Stephanie Tring", role: "Shared Resource", poster_number: "3", board_location: "Hoffman side", research_program: "Shared Resources & Programs", title: "USC Norris Molecular Genomics Core", department: "USC Norris Molecular Genomics Core" },
    { id: "wi-queme", name: "Bryan Queme", role: "PhD Student", poster_number: "41", board_location: "McKibben side", research_program: "Epigenetic Regulation in Cancer (ERC)", title: "Beyond Pathways Boundaries: A Degree-Aware Network Clustering for Gene Set Analysis" },
    { id: "sr-care2", name: "CaRE2 / BioRepository",                             role: "Shared Resource", poster_number: "80", board_location: "KAM side", research_program: "Shared Resources & Programs", title: "CaRE2 / BioRepository", department: "Jose Aparicio" },
    { id: "sr-ciso",  name: "Clinical Investigations Support Office (CISO)",     role: "Shared Resource", poster_number: "81", board_location: "KAM side", research_program: "Shared Resources & Programs", title: "Clinical Investigations Support Office (CISO)" },
    { id: "sr-sorf",  name: "SORF — Summer Oncology Research Fellowship",        role: "Shared Resource", poster_number: "82", board_location: "KAM side", research_program: "Shared Resources & Programs", title: "SORF: The NIH-supported USC/CHLA Summer Oncology Research Fellowship Program", department: "Daikota Barnett" },
    // Coffee Consult opt-ins missing from the Directory sheet. They said Yes
    // on the form but left the bio blank, and Code.gs only lists a no-poster
    // opt-in who wrote a bio. Interests are the ones each clinician emailed to CRTEC.
    // Darin Poei is a late addition by email (not badged on the check-in list). Emails are their registered ones, so they can confirm
    // themselves in the app. Remove a line once its row is in the sheet.
    { id: "cc-chen",     name: "Junyi Chen",      role: "Postdoctoral Fellow",      mentoring: "TRUE", share_contact: "TRUE", email: "jchen018@usc.edu",           research_program: "Cancer Control Research (CCR)" },
    { id: "cc-moghadam", name: "Razieh Moghadam", role: "PhD Student",              mentoring: "TRUE", share_contact: "TRUE", email: "raziehmo@usc.edu",           department: "Population and Public Health Sciences" },
    { id: "cc-au",       name: "Cherry Au",       role: "Clinical Fellow/Resident", mentoring: "TRUE", share_contact: "TRUE", email: "cherry.au@med.usc.edu",      bio: "Interests: GU cancers, ctDNA, disparities." },
    { id: "cc-pierce",   name: "Andrew Pierce",   role: "Clinical Fellow/Resident", mentoring: "TRUE", share_contact: "TRUE", email: "andrew.pierce@med.usc.edu",  department: "Hematology/Oncology", bio: "Interests: DLBCL, SCNSL, CLL/MCL, cell death, ferroptosis, genomics." },
    { id: "cc-nicchi",   name: "Vincent Nicchi",  role: "Clinical Fellow/Resident", mentoring: "TRUE", share_contact: "TRUE", email: "vincent.nicchi@med.usc.edu", department: "Hematology/Oncology, PGY6", bio: "Interests: GU, GI, myeloma, lymphoma." },
    { id: "cc-poei",     name: "Darin Poei",      role: "Clinical Fellow/Resident", mentoring: "TRUE", share_contact: "FALSE", email: "darin.poei@med.usc.edu", bio: "Interests: GU cancers." }
  ],

  // ── COFFEE CONSULT OPT-OUTS ─────────────────
  // Anyone who withdrew after their sheet row was written. Match on email
  // (preferred) or exact name. They are removed from Coffee Consult; if they
  // have no poster they disappear from the directory entirely. A poster
  // presenter stays in the Poster Directory, because the poster is public.
  coffee_opt_outs: [],

  // ── DAY-OF CONTROLS ─────────────────────────
  // day_of: true hides everything that only makes sense before the event
  // (Register / Submit a Poster buttons, "Why come", the poster-submission
  // facts, volunteer sign-up) and shows the day-of versions instead (agenda
  // first, livestream button, Coffee Consult table times). Nothing is deleted:
  // set back to false next year and the pre-event page returns as it was.
  // Markup hooks: class="pre-event" (hidden when true) and class="day-of-only"
  // (shown only when true) in index.html.
  day_of: true,

  // directory_live: set false while you are still collecting posters. The
  // Directory tab then shows a friendly "posters are being added" message
  // instead of an empty list, so an early visitor doesn't think nobody is
  // coming. Flip to true once you have enough entries to look healthy.
  directory_live: true,
  directory_pending_message: "The directory will be updated with poster session submissions. Check back soon to browse who is presenting.",

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

  // Coffee Consult meet-up, shown in the directory's Coffee Consult view on the day
  coffee_table: { place: "the McKibben/Hoffman corner of Pappas Quad", times: "1:00–1:30 PM or 2:00–2:30 PM" },
  coffee_request_deadline: "Monday, Oct 19",

  // Max follow-up connection requests per person (across all tracks)
  max_selections: 2,

  // Where connection requests get sent (Google Form URL — see README)
  form_url: "https://docs.google.com/forms/d/e/1FAIpQLSejuB6fGgHYuU1IMp1Lk-_0tMmDbKGVRPNgjJP44fYYdcGnvg/viewform",

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
  // Public-facing agenda: a theme and the timed schedule (agenda_flow).
  theme: "AI across the cancer continuum",

  // Confirmed schedule. Speaker rows use `speaker` (name, degrees, position,
  // institution, topic, photo). Talk titles are shown as the speaker gave them,
  // without quotes. Omit `photo` to show initials until a headshot is added.
  agenda_flow: [
    { time: "8:30 AM",           loc: "KAM", title: "Check-in & continental breakfast", desc: "<strong>Poster presenters:</strong> check in outside, at the table by the KAM steps, then set up on Pappas Quad.<br><strong>Everyone else:</strong> check in inside KAM, in the Mayer Auditorium Lobby." },
    { time: "9:00–9:15 AM",      speaker: { name: "Josh Neman", degrees: "PhD", position: "Associate Director, Cancer Research Training and Education Coordination (CRTEC)", institution: "USC Norris Comprehensive Cancer Center", topic: "Welcome and Introduction", photo: "neman.jpg" } },
    { time: "9:15–9:40 AM",      speaker: { name: "Sheng Li", degrees: "PhD", position: "Associate Professor and Co-Leader, Epigenetic Regulation in Cancer Program", institution: "USC Norris Comprehensive Cancer Center", topic: "Verified AI Agents to Accelerate Cancer Research", photo: "li.jpg" } },
    { time: "9:40–10:05 AM",     speaker: { name: "Giovanni Cacciamani", degrees: "MD", position: "Director, USC Artificial Intelligence Center for Surgical and Clinical Applications in Urology", institution: "USC Norris Comprehensive Cancer Center", topic: "Artificial Intelligence Integration in Healthcare: Practical AI for Practicing Physicians", photo: "cacciamani.jpg" } },
    { time: "10:05–10:40 AM",    speaker: { name: "Jason H. Moore", degrees: "PhD", position: "Director, Center for AI Research and Education", institution: "Cedars-Sinai", topic: "Agentic AI for In Silico Cancer Research", photo: "moore.jpg", keynote: true } },
    { time: "10:40–11:00 AM",    title: "Discussion panel", desc: "Sheng Li, Giovanni Cacciamani, and Jason H. Moore. Moderated by Nana Gyabaah-Kessie, PhD candidate." },
    { time: "11:00–11:10 AM",    title: "Break", desc: "" },
    { time: "11:10–11:35 AM",    speaker: { name: "Charité N. Ricker", degrees: "MS, CGC", position: "Genetic Counselor and Assistant Professor of Clinical Medicine", institution: "USC Norris Comprehensive Cancer Center", topic: "Digital Interventions: Increasing Access to Genetic Testing in Underserved Patients?", photo: "ricker.jpg" } },
    { time: "11:35 AM–12:00 PM", speaker: { name: "Lourdes Baezconde-Garbanati", degrees: "PhD, MPH", position: "Associate Director, Community Outreach and Engagement", institution: "USC Norris Comprehensive Cancer Center", topic: "The Use of AI in Optimizing Community and Participant Engagement in Cancer Research and Education", photo: "baezconde.jpg" } },
    { time: "12:00–12:15 PM",    title: "Discussion panel", desc: "Charité N. Ricker and Lourdes Baezconde-Garbanati. Moderated by Amiya Tucker, PhD student, and Kelsie Campbell, PhD candidate." },
    { time: "12:15–1:00 PM",     loc: "Pappas Quad", title: "Lunch & networking", desc: "" },
    { time: "1:00–2:45 PM",      loc: "Pappas Quad", title: "Poster session", desc: "Poster competition, Shared Resources, survivor poster walk, and Coffee Consult." },
    { time: "2:45–3:00 PM",      title: "Poster awards & closing remarks", desc: "" }
  ],


  // Practical info shown at the bottom of the Agenda view
  info: {
    location: "Keith Administration Building (KAM) – Mayer Auditorium, and Pappas Quad",
    address: "1975 Zonal Ave, Los Angeles, CA 90033",
    wifi: "USC Guest",
    contact_email: "norriscrtec@usc.edu",
    parking: "Biggy Parking Structure, 1334 Biggy St. Flat rate of $10 for USC Norris patients, $20 for general visitors."
  },

  // External links used on the landing page
  links: {
    newsletter: "https://preview.mailerlite.io/forms/2285190/191197669717181651/share",
    // Zoom webinar REGISTRATION page. A registration-required webinar has no
    // shared join link: Zoom shows each person their own join link right after
    // they register, and emails it too. So this is the link to share publicly.
    // Leave blank to show a graceful "check back" message instead.
    livestream: "https://usc.zoom.us/webinar/register/WN_iEe_VwvDTxOOruJ2g2PVzw"
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
