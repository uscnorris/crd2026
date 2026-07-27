# Cancer Research Day 2026 — Event App (v2)

A single static app that serves as the **whole-day digital program** for CRD 2026:
agenda, poster/people directory, conversation logging, and follow-up **connection
requests** across four tracks that each map to a CRTEC aim and a training outcome.

Hosted on GitHub Pages: `https://uscnorris.github.io/crd2026`
Admin dashboard: `https://uscnorris.github.io/crd2026/admin.html`

---

## Files

| File | What it is | Do you edit it? |
|---|---|---|
| `index.html` | App shell (agenda, directory, profile, my list) | Rarely |
| `style.css` | All styling (cardinal/gold, mobile-first) | Rarely |
| `config.js` | **Event details, connection tracks, agenda, backend URLs** | **Yes — this is your control panel** |
| `data.js` | Sample directory data (used until the live Sheet is wired) | Only to change the sample |
| `app.js` | App logic + the tracks engine | No |
| `admin.html` | Metrics dashboard (self-contained) | No |
| `Code.gs` | Apps Script backend (registration, tracking, Qualtrics sync) | Only the constants at the top |
| `assets/photos/photo-1.jpg` | Homepage feature photo | **Yes — add a real event photo** |

The header carries no logo of its own — the site is designed to sit inside the
USC Norris WordPress page (see "Integrating the CRD site" below), which already
supplies the Norris branding around it.

---

## Photo

The band right under the hero (`#gallery` in `index.html`) looks for one file,
`assets/photos/photo-1.jpg`. If it's missing, it shows a clean "add a photo"
placeholder instead of a broken image — drop a real photo from a past Cancer
Research Day there (a wide shot works best; it's cropped to a ~320px-tall banner)
and it replaces the placeholder automatically.

---

## What changed from v1 (your original)

1. **Connection tracks replace the single Coffee Consult rule.** The old
   `isCoffeeEligiblePair()` (CBG PhD ↔ Fellow only) is now a config-driven engine.
   Tracks live in `config.js → connection_tracks`. Shipped with four:
   - **Coffee Consult** — CBG PhD ↔ Clinical Fellow (Clinical & Translational, feeds R38)
   - **Mentor Match** — trainee ↔ Faculty (Team Science & Mentorship)
   - **Patient Perspective** — trainee ↔ survivor-advocate (Community Education)
   - **Near-Peer** — undergrad/master's ↔ PhD/postdoc (Inclusive Pipeline)

   Add, remove, or edit a track by editing that array — no code changes.

2. **Agenda view** makes the app the whole-day program (schedule + AI featured
   session + tracks legend + practical info). Edit `config.js → agenda` and `info`.

3. **Admin dashboard** now breaks requests down **by track** and **by CRTEC aim**,
   so outcomes map straight to your aims and CCSG. Coffee Consult still reports its
   own R38-relevant numbers.

4. New role added: **Undergraduate Student**. Three sample records added
   (undergrad, CSAC survivor-advocate, faculty mentor) so every track is visible.

---

## Going live (three settings in config.js)

The app runs on sample data out of the box. To go live for the real event:

1. **Directory data** — a ready-to-use template, `CRD2026_Poster_Directory_Template.csv`,
   is included and pre-loaded with the 23 sample posters (spanning all five research
   programs plus COE and CRTEC). Import it into Google Sheets (`File → Import → Upload`),
   replace the samples with your real registrations, then publish to the web as CSV
   (`File → Share → Publish to web → CSV`), paste the URL into `sheet_url`, and set
   `use_sample_data: false`. Column order must match the template header. This is the
   same publish-a-Sheet workflow as the events calendar — whoever maintains the roster
   only ever edits the Sheet, never the code.
2. **Event tracking** — deploy the Apps Script web app (logs conversations/requests to
   a Sheet) and paste its URL into `script_url`. Without this the app still works;
   it just won't record analytics for the dashboard.
3. **Connection requests** — paste your Google Form URL into `form_url` so the
   "Submit connection requests" button routes there. If left blank, it falls back to
   a pre-filled email to `info.contact_email`.

After editing, bump the `?v=` number in `index.html` (currently `v=26`) so
returning phones don't serve a cached copy.

---

## Connecting the registration form (full automation)

`Code.gs` is the Apps Script backend. It does three jobs against ONE spreadsheet:
registrations flow into a **Directory** tab (which the app reads), the app POSTs
usage events into tracking tabs, and the dashboard reads those back out. Once set up,
the whole event runs itself.

**A. Build the Google Form.** Make the questions match `FORM_MAP` at the top of
`Code.gs`. Make **Role**, **Research program**, and **Disease / focus area** dropdowns
whose options exactly match the app (the 8 roles and your 7 programs) so filters and
connection-track matching stay clean. Recommended questions: Name, Email, Role,
Research program, Department / lab, Year, "Are you presenting a poster?", Poster title,
Poster summary, Disease / focus area, PI name, "Open to clinical input?", LinkedIn URL,
and "May we list you in the directory?" (Yes/No consent). Also add, so the site's newer
features work: "Will you attend in person or virtually?", "Short bio (for connection
matching)" (used to match virtual attendees who aren't presenting a poster), "Faculty:
are you open to Mentor Match consults?" (Yes/No — only opted-in faculty appear as Mentor
Match targets), "Do you need any accessibility accommodations?", and "Any dietary
restrictions?". Keep **PI name** on the form — it lands in the raw responses and is what
turns the event into CCSG numbers. (Accessibility, dietary, PI, and attendance mode stay
in the raw Responses tab for planning; only the directory-relevant fields are copied to
the Directory tab.)

**B. Link the form to a spreadsheet.** In the Form: Responses → Link to Sheets → create
a new spreadsheet. This is the one spreadsheet everything uses.

**C. Add the script.** In that spreadsheet: Extensions → Apps Script. Delete the empty
`Code.gs`, paste in the contents of this `Code.gs`, and edit the `FORM_MAP` strings on
the right to match your exact question titles. Save.

**D. Create the tabs.** In the Apps Script editor, select the function `setup` from the
dropdown and click Run (authorize when prompted). This creates the Directory, Users,
Convos, Coffee, Views, and Survey tabs with the right headers.

**E. Add the form trigger.** Apps Script → Triggers (clock icon) → Add trigger →
function `onFormSubmit`, event source "From spreadsheet," event type "On form submit" →
Save. Now every registration writes a clean row to Directory automatically.

**F. Deploy the web app.** Apps Script → Deploy → New deployment → type "Web app" →
Execute as **Me**, Who has access **Anyone** → Deploy. Copy the `/exec` URL.

**G. Publish the Directory tab as CSV.** In the spreadsheet: File → Share → Publish to
web → choose the **Directory** tab → Comma-separated values (.csv) → Publish. Copy that
URL (it contains `gid=` and `output=csv`).

**H. Point the app at both.** In `config.js`:
- `sheet_url`  = the published Directory CSV URL (step G)
- `script_url` = the web-app `/exec` URL (step F)
- `form_url`   = your Google Form's public link
- set `use_sample_data: false`

Commit the change and the app is live end to end: someone registers → they appear in
the directory within ~5 minutes → the day-of usage flows to the dashboard.

**Notes.** The published CSV refreshes about every 5 minutes (fine for pre-registration
and walk-ins). The app's usage POSTs are fire-and-forget, so they never block the UI and
never hit CORS. The dashboard reads the export over a normal GET; if a browser ever
blocks it, `doGet` also supports a JSONP fallback (`?action=export&callback=fn`). The
**Survey** tab is filled automatically from Qualtrics — see the next section.

---

## Post-event survey — Qualtrics → dashboard (automatic)

The post-event survey lives in **Qualtrics**, not a Google Form — but responses still
flow into the same spreadsheet and the same dashboard, automatically, via
`syncQualtrics()` in `Code.gs`. No manual export/import.

**A. Build the survey in Qualtrics.** Create questions matching the Survey tab's
columns: Name, Role, "Did the meeting happen?" (Yes/No), "How useful was it?" (1–5),
"Would you continue this collaboration?" (Yes/No), and "What was most useful?" (open
text).

**B. Turn on Question IDs.** In the Qualtrics survey editor: **Tools** (gear icon) →
**Import/Export** → **Show Question IDs**. Each question now shows its ID (`QID1`,
`QID2`, …) next to its text — note which QID is which question.

**C. Get your API credentials.** Click your account avatar (top right) → **Account
Settings** → **Qualtrics IDs**. This page has three things you need: your **API
Token** (generate one if you don't have one), your **Datacenter ID** (e.g. `usc1a`),
and the **Survey ID** (starts with `SV_`) for the survey you just built.

**D. Configure `Code.gs`.** In the same Apps Script project used for the registration
form (Extensions → Apps Script, from the registration spreadsheet):
1. Paste the API token, datacenter ID, and survey ID into the `QUALTRICS` constant
   near the top of the file.
2. Edit `QUALTRICS_MAP` so each Survey-tab column points at the right `QID` from
   step B.
3. Save.

**E. Turn on the sync.** In the Apps Script editor, select `createQualtricsTrigger`
from the function dropdown and click **Run** (authorize when prompted). This sets up
an hourly trigger that pulls new Qualtrics responses into the **Survey** tab —
duplicates are skipped automatically, so it's safe to re-run any time. To pull
immediately instead of waiting for the next hour, run `syncQualtrics` the same way.

Once this is set up, the dashboard's Survey tab (and its "% want to continue" /
"avg usefulness" stats) fills itself as responses come in — refresh `admin.html` and
they're there.

---

## Integrating the CRD site into the USC Norris WordPress (WP Engine) site

**Recommendation:** keep the interactive app on GitHub Pages (it's a JS app with a
Google backend — that's its right home and it's already reliable), and give it a
presence *on* the Norris site so people can find it. Three ways, simplest first.

### Option A — Native Elementor page that links to the app (recommended)
Best for SEO, on-domain URL, and editing without touching code.

1. In WP admin: **Pages → Add New**, title it "Cancer Research Day 2026."
2. Set the permalink/slug to `cancer-research-day-2026` (or `crd-2026`). Follow your
   usual staging pattern: build at `…-2/`, then slug-swap to the clean URL at launch.
3. **Edit with Elementor.** Rebuild the landing content (from `CRD2026_event_site.html`)
   using your existing design kit: cardinal `#990000`, gold `#FFCC00`, Georgia
   headings, Arial body, 960px max width. Sections: hero (date/time/location + two
   buttons), about, schedule, poster info, FAQ.
4. Point the **primary button** at the app: `https://uscnorris.github.io/crd2026`,
   and add the **QR code** (same link) as an image for print/room signage.
5. **Appearance → Menus:** add the page to the main or Education & Training menu.
6. Publish, then **purge the WP Engine cache** (WP Engine caches hard — use the
   "Purge All Caches" button in the WP Engine plugin or the User Portal) so the new
   page and menu item appear immediately.

### Option B — Embed the app inside a Norris page (iframe)
Keeps the Norris header/footer around the app. Good if you want it to feel "inside" the site.

1. Create the page as in A (steps 1–2).
2. Add an Elementor **HTML widget** and paste:
   ```html
   <iframe src="https://uscnorris.github.io/crd2026"
           title="Cancer Research Day 2026 app"
           style="width:100%;height:85vh;border:0;border-radius:10px;"
           loading="lazy"></iframe>
   ```
3. Test on a phone. The app is a full-screen mobile app, so an iframe can feel
   cramped; if scrolling is awkward, prefer Option A with a button instead.
   (GitHub Pages allows framing, so the embed will load — but always test.)
4. Publish and purge the cache.

### Option C — Host the static files directly on WP Engine
Puts the app on the real domain (e.g. `norris.usc.edu/crd2026/`) with no GitHub Pages.
More setup; only worth it if you specifically want it on the Norris domain.

1. In the **WP Engine User Portal**, open your environment → **SFTP users**, create
   credentials.
2. Connect over SFTP (FileZilla/Cyberduck). In the site root, create a folder
   `crd2026/` **outside** the WordPress files, and upload all six files into it.
3. Visit `yourdomain/crd2026/`. If WordPress intercepts the URL, add a rewrite
   exclusion (WP Engine support can add a rule so `/crd2026/` is served statically).
4. Update `config.js → base_url` to the new URL so QR codes point to the right place,
   and purge the cache.
   *Note: your Apps Script/Sheet are cross-origin either way; that keeps working.*

### Whichever you choose
- **Link, don't duplicate.** The QR code, registration button, and any email all point
  to one URL so you only maintain one place.
- **Staging → production:** build on staging, then use WP Engine's "Copy environment"
  to push to production; re-check the slug and purge caches after the copy.
- If the WP Engine staging site is being flaky (as before), Option A on production plus
  the app on Pages is the most reliable combination.
