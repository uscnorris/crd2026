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

## Going live — status: ✅ done, fully automated

Earlier drafts of this README described a manual setup (import a CSV by hand,
publish it, paste the URL). **That's no longer how this works.** The three
settings below are already filled in with real values in `config.js`, and
they now update themselves — nobody needs to touch a CSV or `config.js` again
for day-to-day changes:

1. **Directory data** — `sheet_url` points at the "Directory" tab of your
   spreadsheet, published as CSV. That tab is written automatically by
   `onFormSubmit` in `Code.gs` every time someone submits the registration
   form (and updates in place if they resubmit — see the "Day-of sign-ups"
   section above). You never import a CSV by hand.
2. **Event tracking** — `script_url` is your deployed Apps Script web app. It
   logs conversations and connection requests to the spreadsheet, which feeds
   the admin dashboard.
3. **Connection requests** — `form_url` is your Google Form link, already set.

The `CRD2026_Poster_Directory_Template.csv` file is kept only as a reference
for the column order Directory rows must follow — you shouldn't need to
import it anywhere.

**The one manual step that still applies:** any time the app's own files
(`index.html`, `admin.html`, `app.js`, etc.) are re-uploaded to GitHub with
changes, bump the `?v=` number at the top of `index.html` and `admin.html`
so returning phones don't serve a cached copy.

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
matching)" (shown as its own "About" section on the profile — separate from the Poster
Summary, which stays about the research), "Faculty: are you open to Mentor Match
consults?" (Yes/No — only opted-in faculty appear as Mentor Match targets), "Do you need
any accessibility accommodations?", and "Any dietary restrictions?". Keep **PI name** on
the form — it lands in the raw responses and is what turns the event into CCSG numbers.
(Accessibility, dietary, PI, and attendance mode stay in the raw Responses tab for
planning; only the directory-relevant fields are copied to
the Directory tab.)

**B. Link the form to a spreadsheet.** In the Form: Responses → Link to Sheets → create
a new spreadsheet. This is the one spreadsheet everything uses.

**C. Add the script.** In that spreadsheet: Extensions → Apps Script. Delete the empty
`Code.gs`, paste in the contents of this `Code.gs`, and edit the `FORM_MAP` strings on
the right to match your exact question titles. Save.

**D. Create the tabs.** In the Apps Script editor, select the function `setup` from the
dropdown and click Run (authorize when prompted). This creates the Directory, Users,
Convos, Coffee, Views, and Survey tabs with the right headers.

**Directory scope, updated:** the Directory tab (and therefore the app) now
includes **only poster presenters**. General attendees who register just to
attend are still recorded (in the raw Form Responses tab, for headcount and
CCSG purposes) but never appear in the public directory. **Speakers are
invited/nominated separately, not through the registration form** — add them
to the Directory tab by hand once confirmed (same 15 columns; `poster_number`
can be left blank for a speaker-only row).

**E. Add the form trigger.** Apps Script → Triggers (clock icon) → Add trigger →
function `onFormSubmit`, event source "From spreadsheet," event type "On form submit" →
Save. Now every registration writes a clean row to Directory automatically.

**Day-of sign-ups and changed minds — no second form needed.** `onFormSubmit`
now upserts by email: resubmitting the *same* registration form updates that
person's existing row instead of creating a duplicate. That single mechanism
covers every day-of case:
- A walk-in who never pre-registered fills it out fresh → new row.
- Someone who registered last week now wants Coffee Consult (or wants out of
  it) → they resubmit with the new answer → their row updates in place, same
  poster number, no duplicate.
- Someone wants off the public directory entirely → they resubmit with the
  consent box unchecked → their row is deleted, not just marked hidden.

Put the **same registration QR code / link** at check-in and on a welcome
slide with wording like: *"New here? Scan to register. Already registered?
Scan again to update your info — it replaces your previous answers."* Nothing
else to build or print.

For a one-off change someone tells a staffer verbally (no phone, no time to
fill out a form), the Directory tab is a normal spreadsheet — you or your
coordinator can just edit that person's row directly. That's often faster
than any form for a single quick fix.

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
**Survey** tab is filled by a short post-event survey (a second Form pointed at the same
sheet, or filled by hand); until then the dashboard's Survey tab simply shows what's
there.

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
