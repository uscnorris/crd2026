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
| `assets/logo/usc-norris-logo.jpg` | Header logo | **Yes — replace whenever a new official file is issued** |
| `assets/photos/photo-1.jpg` | Wide banner image under the hero | **Yes — swap in a real event photo** |
| `assets/photos/coffee-consult.jpg` | Photo in the "For trainees" section | Optional — replace with a real event photo |

---

## Branding & photos

- **Logo.** `assets/logo/usc-norris-logo.jpg` is the official USC Norris Comprehensive Cancer Center / Keck Medicine of USC lockup. To replace it with an updated file, save the new image over that same path (any common image format works — if the extension changes, e.g. to `.png`, update the `src` on `index.html`'s `<img class="brand-logo">` accordingly). If the file is ever missing, the header falls back to a plain text lockup instead of a broken image.
- **Photos.** Two images, both of which simply disappear (rather than showing a broken image) if the file is missing:
  - `assets/photos/photo-1.jpg` — the wide banner strip under the hero. A landscape/panoramic crop works best; it's displayed at up to 300px tall, cropped to fill. Currently an AI-generated composite — swap in a real photo from a past Cancer Research Day when one's available.
  - `assets/photos/coffee-consult.jpg` — the photo in the "For trainees" section. Currently a stock photo of two people talking over coffee.

---

## What changed from v1 (your original)

1. **Connection tracks replace the single Coffee Consult rule.** The old
   `isCoffeeEligiblePair()` (CBG PhD ↔ Fellow only) is now a config-driven engine.
   Tracks live in `config.js → connection_tracks`. Matching is Coffee Consult only,
   reserved for clinical trainees on one side and research trainees on the other:
   - **Coffee Consult** — PhD/postdoctoral research trainee ↔ clinical fellow, resident,
     or clinical doctoral student (Clinical & Translational, feeds R38)

   Add another track, or edit this one, by editing that array — no code changes.
   (Earlier drafts also included Mentor Match, Patient Perspective, and Near-Peer
   tracks; they were removed so matching stays scoped to Coffee Consult participants.
   Re-add them the same way if the program expands later.)

2. **Agenda view** makes the app the whole-day program (schedule + AI featured
   session + tracks legend + practical info). Edit `config.js → agenda` and `info`.

3. **Admin dashboard** breaks requests down **by track** and **by CRTEC aim**,
   so outcomes map straight to your aims and CCSG. Coffee Consult reports its
   own R38-relevant numbers.

4. New role added: **Undergraduate Student**. The directory still shows all roles —
   only the Coffee Consult match itself is restricted to clinical and research trainees.

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
matching)" (used to match virtual attendees who aren't presenting a poster), "Do you
need any accessibility accommodations?", and "Any dietary restrictions?". Note that
poster submission is restricted to trainees (students, postdoctoral fellows, and
clinical fellows) and Coffee Consult matching is restricted to clinical trainees and
PhD/postdoctoral research trainees — word the Role question so this stays enforceable.
Keep **PI name** on the form — it lands in the raw responses and is what
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
"Would you continue this collaboration?" (Yes/No), "What was most useful?" (open
text), "Did you learn about a Shared Resource (Biostatistics Core, Genomics Core,
etc.) you now plan to use?" (Yes/No), and "Which one?" (open text). The last two are
worth keeping even though they feel tangential to the meeting itself — CCSG renewal
review specifically asks how you disseminate awareness of Shared Resources, and this
is the cheapest way to get that number.

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
hourly triggers that pull new Qualtrics responses into the **Survey** tab (and the
**Outcomes** tab below, once that's configured) — duplicates are skipped
automatically, so it's safe to re-run any time. To pull immediately instead of
waiting for the next hour, run `syncQualtrics` the same way.

Once this is set up, the dashboard's Survey tab (and its "% want to continue" /
"avg usefulness" / "learned about a Shared Resource" stats) fills itself as
responses come in — refresh `admin.html` and they're there.

### The 6–12 month follow-up survey (downstream impact)

The single most convincing number for a CCSG renewal isn't attendance — it's proof
that the connections made at the event actually turned into something: a grant, a
publication, a shared resource used, an ongoing collaboration. That requires asking
again, months later, which is why it's a **separate** survey from the post-event one
above.

**A. Build a second Qualtrics survey**, something like "Cancer Research Day —
6-Month Follow-up," with: Name, Role, "Who did you connect with at CRD?" (open text),
"Did this lead to a joint grant submission?" (Yes/No), "A co-authored publication?"
(Yes/No), "Shared use of a Core / Shared Resource?" (Yes/No), "Is the collaboration
ongoing?" (Yes/No), and "Anything you'd like to tell us about it?" (open text). Turn
on Question IDs (step B above) the same way.

**B. Configure it in `Code.gs`.** Paste the new survey's ID into `QUALTRICS_FOLLOWUP`
(it reuses the same API token and datacenter from `QUALTRICS`), and edit
`QUALTRICS_FOLLOWUP_MAP` to match its QIDs.

**C. Send it 6–12 months after the event** — to everyone who logged a conversation
or connection request in the app (export the **Convos**/**Coffee** tabs for the
email list) — then run `createQualtricsTrigger` again (or just wait for the hourly
trigger already running) to pull responses into the **Outcomes** tab. The dashboard's
Survey tab shows a "Downstream impact" section with grant/publication/collaboration
counts once responses start coming in.

Leaving `QUALTRICS_FOLLOWUP.survey_id` unconfigured is fine — everything else keeps
working, that section just stays empty until you're ready to send this follow-up.

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
