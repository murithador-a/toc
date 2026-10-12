# QA report — TOC Luxury Constructions Ltd website & admin

Testing performed in two passes, both with headless Chromium:

1. **The public site** — against the production build (`npm run build`) served by the Node server.
2. **The site plus the admin backend** — against the full stack (`npm run dev`: Express API on 8787,
   Vite on 5173), driving the complete loop from first-run password to a published project and a
   stored enquiry.

Every figure below is measured, not estimated.

Sections 2–5 cover the public site. **Section 7 covers the backend and admin area**, including the
defects found and fixed during that pass.

---

## 1. Result summary

| Area | Result |
| --- | --- |
| Console errors / page errors | **0** across 9 routes × 3 viewports |
| Failed network requests | **0** |
| Horizontal overflow | **0** at 320, 360, 390, 834, 1440, 1920, 2560 px |
| Internal links tested | **24 unique destinations** — all resolve, all anchors present |
| Broken external links | **0** |
| Images missing `alt` | **0** (and every image has intrinsic `width`/`height`) |
| Interactive controls without an accessible name | **0** |
| Renders revealed on scroll | **100 %** of `.reveal` elements on every route tested |
| Third-party requests on first load | **0** |
| First Contentful Paint (local, cold) | desktop **48 ms**, mobile **45 ms** |
| Page weight (first load) | desktop **≈599 KB**, mobile **≈256 KB** (hero WEBP 41 KB at phone width) |

---

## 2. Defects found and fixed during testing

These were all real bugs caught by the test pass, not hypothetical:

1. **Hero scrim was invalid CSS.** `from-charcoal/92` uses a non-standard opacity step; Tailwind
   emitted no rule for it, and because an undefined gradient stop makes the whole
   `linear-gradient()` invalid, the hero had **no overlay at all** — ivory headline on a bright
   photograph. Fixed by replacing every off-scale opacity with a supported step *and* rebuilding the
   scrim as a flat charcoal wash plus a gradient, so contrast never depends on a single declaration.
   Measured contrast behind the headline after the fix: **≈9.4:1**.
2. **Sticky header was invisible.** Same root cause: `bg-ivory/92` was dropped, so the header became
   transparent over content while scrolling. Now `rgba(245,242,236,0.95)` with backdrop blur —
   verified by computed style at three scroll positions.
3. **Consent checkbox was not wired to state.** `CheckboxField` rendered an uncontrolled input, so a
   correctly ticked consent box still failed validation — the form could never be submitted. Caught
   by an end-to-end submit test; fixed with `checked` / `onChange` in the shared component.
4. **Duplicate canonical tags.** The static tag in `index.html` was being left in place by
   react-helmet-async, producing two `<link rel="canonical">` elements on every inner route. Fixed by
   marking the managed head tags with `data-rh="true"` so Helmet adopts and replaces them. The static
   tags remain, so non-JavaScript crawlers still see a complete, correct head.
5. **Capability strip showed truncated fragments** ("An informed…") because it sliced service
   summaries at punctuation. Replaced with purpose-written `tagline` fields per service.
6. **Reveal animations could hide content.** Content below the fold became visible only when an
   observer callback fired. Added an immediate reveal for anything near the viewport on mount, an 8 s
   safety timer, a print override, and verified that all content is visible with
   `prefers-reduced-motion` and without JavaScript.
7. **Hero preload mismatch** — a fixed-width preload plus `srcset` warned in the console and wasted a
   download. Replaced with an `imagesrcset` / `imagesizes` preload that matches the rendered image.
8. **CTA button labels wrapped to two lines** in narrow grid columns. Added `whitespace-nowrap` and
   `shrink-0` to the shared button component.

---

## 3. Functional tests

### Navigation and CTAs
- All header links, footer links, in-page anchors and portfolio links resolve (24 destinations).
- `Explore Our Projects` scrolls the home page to the portfolio with the heading clear of the sticky
  header (measured 80 px offset).
- Deep links work on first load: `/services#building-construction` and
  `/services#project-supervision-consultancy` both land on the correct section.
- Unknown routes render the 404 page (HTTP 200 with an SPA fallback, correct `noindex`).

### WhatsApp and click-to-call
- Every WhatsApp link matches `https://wa.me/2348057838376?text=…` (normalised from `0805 783 8376`).
- `wa.me` responds **302** with the intended destination and encoded text — the pre-filled message
  reaches WhatsApp correctly, including line breaks and the ₦ characters in budget bands.
- Every `tel:` link is `tel:+2348057838376`.
- A note stating that WhatsApp does not confirm a booking appears wherever WhatsApp is offered.

### Inquiry form (end-to-end)
- Empty submit: **6 invalid fields flagged**, `aria-invalid` set, an `aria-live` summary announced,
  focus moved to the first field, and no false success state.
- Malformed phone and email are rejected with specific, human messages.
- Past dates are rejected; today is accepted.
- Submitting valid data with no endpoint configured shows the honest fallback state: *"Nothing has
  been sent yet"*, a preview of the prepared message, a copy button, and a WhatsApp link carrying
  every entered detail.
- Duplicate submission inside 30 s is detected and explained rather than silently repeated.
- Service preselection from `?service=…` works (verified: `Building Construction` pre-selected from a
  service CTA).
- The attachment field is **disabled** with an on-screen explanation because no secure upload
  endpoint exists.

### Consultation form
- Full request flow verified: name, contact, service, preferred date, time band, location, notes.
- States clearly that it is a **request, not a booking** (in the sidebar note and again in the
  fallback panel); no invented availability is shown.

### Map and location
- No third-party request is made on page load (verified by request logging).
- Pressing **Load the map** loads the OpenStreetMap embed for the company's coordinates.
- The supplied Google Maps short link is used as a link only — never as an iframe source, because
  Google's keyless embed endpoint returns `X-Frame-Options: SAMEORIGIN`.
- Directions link resolves (**HTTP 200**) to the resolved coordinates.

### Mobile interface
- Menu opens as a full-screen panel with 10 focusable links, locks background scroll, focuses the
  first link, and closes on Escape (restoring scroll and focus).
- Floating WhatsApp button appears only after scrolling; measured **not** to intersect the form's
  submit button at 390 × 844.
- No horizontal overflow at 320 px (smallest tested width) or at 2560 px.

### Accessibility
- Skip-to-content link is the first tab stop; every one of the first 12 tab stops shows a visible
  focus ring (2 px bronze outline).
- Single `<h1>` per page; heading order is logical (`h1 → h2 → h3`).
- All `target="_blank"` links carry `rel="noopener noreferrer"`.
- Rating stars are decorative and paired with text equivalents, including a screen-reader summary.
- Reduced-motion mode: reveals, transitions and smooth scrolling are disabled and content is fully
  visible (verified by computed style).
- FAQ uses native `<details>` so answers work without JavaScript.

### SEO and metadata
- Exactly **one** `<title>`, `<link rel="canonical">` and `meta[name=description]` per route after the
  Helmet fix; `og:*` and `twitter:*` tags are per-route.
- Placeholder project pages are `noindex, follow`; the 404 page is `noindex`.
- Structured data: `GeneralContractor` with verified address, phone, coordinates and `hasMap`;
  `WebPage` / `AboutPage` / `CollectionPage` / `ContactPage` / `BreadcrumbList` / `Service` per route.
  No `aggregateRating` markup is published.
- `robots.txt` and `sitemap.xml` are present and consistent with the published routes.

### Print
- Reveal-hidden content is forced visible in print media.

---

## 4. Typography and network

- Fonts are self-hosted; home page fetches **3** WOFF2 files (≈72 KB total) from `/fonts`.
- `document.fonts.check` confirms both DM Serif Display and Manrope load; `<h1>` resolves to DM Serif
  Display and body text to Manrope.
- No request is made to Google Fonts, or any other third party, on any page tested.

---

## 5. Known gaps (by design, not defects)

These are documented rather than hidden — see `docs/CONTENT-TO-CONFIRM.md`.

1. **Nothing notifies anyone when an enquiry arrives.** Submissions are stored on the server and shown
   in Admin → Enquiries (with CSV export); no email or SMS is sent. If TOC expects to be told, a
   notification provider has to be added, and the wording on both forms and in the privacy policy
   updated to match.
2. **Attachments are disabled** until a secure upload endpoint with server-side validation exists.
3. **Portfolio entries are placeholders.** No project name, location, date, value or specification is
   published, and every image is captioned as reference imagery.
4. **No individual review excerpts are published**; only the sourced 4.7 / 58 Google rating, dated and
   attributed, with a note that it is a written record rather than a live feed.
5. **Opening hours show "To be confirmed by TOC"** on the contact page.
6. **The map provider is OpenStreetMap** by default; a Google Embed API key can be supplied instead.
7. **Production domain is a placeholder** (`www.tocluxuryconstructions.com`) in the canonical tag,
   sitemap and robots file.
8. **Link previews** depend on `og-toc.jpg`, which currently shows reference architecture imagery with
   no logo; it should be regenerated with approved brand assets.

---

## 6. Re-test checklist after content changes

1. `npm run build` (type-check + build) — must complete with no TypeScript errors.
2. `npm run content:validate` — the edited document must pass.
3. Load `/`, `/about`, `/services`, `/projects`, `/projects/<slug>`, `/contact`, `/consultation`,
   `/privacy`, `/admin` and a bad URL at 390 px and 1440 px.
4. Confirm the browser console is clean and there is no horizontal scrollbar at 320 px.
5. Submit both forms empty (validation) and complete (delivered to the API, or the WhatsApp fallback
   if the API is absent) and confirm the enquiry appears in Admin → Enquiries.
6. Click every WhatsApp link, `tel:` link and directions link.
7. Re-measure contrast wherever new photography sits under text or new buttons appear.

---

## 7. Backend and admin test pass

Run against `npm run dev` (API 8787 + Vite 5173) and against `NODE_ENV=production npm start` serving
the built site and API from one port. The full loop was automated in a browser: first-run password,
edit a section, add a project with an uploaded image, publish it, submit an enquiry from the public
form, read it in the inbox, export the CSV, then reopen the public site in a fresh browser context.

### 7.1 The end-to-end loop

| # | Step | Result |
| --- | --- | --- |
| 1 | Home page renders from `GET /api/content` (not just the bundled copy) | Pass |
| 2 | `/admin` shows the **first-run setup** screen when no password exists | Pass |
| 3 | Setting a password signs the operator straight in | Pass |
| 4 | Editing the hero headline autosaves after the debounce; header shows *Saved* | Pass |
| 5 | The new headline is present in `GET /api/content` and survives a fresh browser context | Pass |
| 6 | *Add a project* creates a draft and opens its editor | Pass |
| 7 | Cover image upload returns `/uploads/<name>.jpg`, and the image renders on the public site | Pass |
| 8 | Publishing the project lists it on `/projects` and gives it a detail page | Pass |
| 9 | A published, non-placeholder project is **not** `noindex` | Pass |
| 10 | Submitting the public inquiry form stores it and it appears in Admin → Enquiries | Pass |
| 11 | CSV export contains the submitted enquiry | Pass |
| 12 | The uploaded image is listed in the admin image library | Pass |
| 13 | Console and page errors across the whole run | **0** |

### 7.2 API surface, verified by direct request

| Check | Result |
| --- | --- |
| `GET /api/health` | Reports `adminConfigured` and the content file in use |
| `GET /api/content` | 17 sections, 4 services, 6 projects — **no draft entries present** |
| `GET /api/auth/session` | Unthrottled; does not consume the login budget |
| `POST /api/auth/login` wrong password | `401 BAD_CREDENTIALS` with attempts remaining |
| `POST /api/auth/login` correct password | `200`, sets httpOnly `toc_session` + readable `toc_csrf` |
| `PUT /api/admin/content/:section` without the CSRF header | `403 BAD_CSRF` |
| `PUT /api/admin/content/:section` with it | `200`; value written to `content/site.json` |
| `PUT` with a section name that does not exist | `404 UNKNOWN_SECTION` |
| `PUT` with an invalid section body | `422 INVALID_CONTENT` with per-field details |
| Cross-origin write (`Origin: https://evil.example`) | `403 BAD_ORIGIN` |
| `POST /api/admin/content/restore-backup` | Restores the previous version; the edit is undone |
| `POST /api/admin/uploads` with a real JPEG | `201`, dimensions read from the file header |
| `POST /api/admin/uploads` with a text file renamed `.jpg` | `400 BAD_FILE_TYPE` (magic-byte check) |
| `POST /api/submissions/inquiry` valid | `201` with an id; row appears in the inbox |
| `POST /api/submissions/inquiry` invalid | `422` listing every missing field |
| Honeypot field filled | `201` with `id: null` — accepted and discarded, no row stored |
| `GET /api/admin/submissions` unauthenticated | `401 UNAUTHENTICATED` |
| 13 rapid submissions | Six accepted, then `429` with `Retry-After` |
| `submissions.json` file mode | `0600` |
| Admin routes, wrong HTTP verb / unknown id | `404`, no stack trace leaked |

### 7.3 Production mode (one origin)

| Check | Result |
| --- | --- |
| Home page served from `dist/` | Pass |
| Deep link to an unknown path returns the 404 page (SPA fallback) | Pass |
| `/admin` loads the admin chunk and asks for the password | Pass |
| Sign-in works over the production server | Pass |
| Security headers on `/api/*`: `nosniff`, `X-Frame-Options: SAMEORIGIN`, `Referrer-Policy`, `Permissions-Policy`, `Content-Security-Policy: default-src 'none'` | Pass |
| Session cookie is httpOnly; the CSRF cookie is readable by design | Pass |
| Public content API contains no draft entries | Pass |
| Placeholder project page is `noindex, follow` | Pass |
| Horizontal overflow at 390 px across `/`, `/about`, `/services`, `/projects`, `/contact`, `/consultation`, `/admin` | **0 px on every page** |
| Console and page errors across the production pass | **0** |

### 7.4 Defects found and fixed in this pass

1. **The admin tree was rendered outside the content provider.** `main.tsx` mounted `<App />` without
   `<ContentProvider>`; every public page threw “useContentState must be used inside
   `<ContentProvider>`” and the site rendered nothing. Found immediately by the first browser test.
   Fixed by adding the provider, plus a `src/content/context.ts` split so React Fast Refresh can
   reload the hooks without creating a *second* context object mid-session (which produced the same
   symptom intermittently during development).
2. **`ADMIN_PASSWORD` could never be used to sign in.** `adminConfigured()` returned true for a
   plaintext environment password while `verifyAdminPassword()` only accepted a hash or
   `server/data/auth.json` — a first deployment with `ADMIN_PASSWORD` set would have refused the
   correct password and left `/api/auth/setup` unreachable. Fixed by hashing the environment value
   once at boot and verifying against that hash, so both credential sources cost the same to attack.
3. **Read-only session checks shared the login rate limit.** `GET /api/auth/session` was mounted behind
   the credential limiter, so a few admin page loads could lock the operator out of their own
   dashboard with a `429`. Fixed by attaching the limiter to the password-checking endpoints only.
4. **Renaming a project threw the editor back to the project list.** A rename commits the content
   first and the URL a moment later; in that instant the address matched no project and the “project
   not found” guard fired. Fixed with an in-flight rename guard (plus a 6-second release so a refused
   save cannot strand the screen).
5. **A new project was created with a category the server rejects.** `emptyProject()` hard-coded
   `residential`, which is not one of the site's categories, so every new project failed validation
   with `422 projects.items[n].category must match a defined category`. Fixed by taking the first
   defined category from the content document.
6. **The section endpoint ignored a commonly-guessed body shape.** `PUT /api/admin/content/:section`
   required `{ "value": … }`; sending `{ "<section>": … }` failed with a confusing “Missing section”
   message. Now both are accepted, and a genuinely missing body returns a clear `400 MISSING_VALUE`.
7. **A wrong file write during development replaced `server/routes/auth.js` with `server/index.js`.**
   Caught immediately by the API failing to boot with `ERR_MODULE_NOT_FOUND`; both files were
   rebuilt and the auth router re-mounted, then verified by direct request (table 7.2).

### 7.5 Admin interface checks

- Keyboard only: every field, toggle, list control and button is reachable, with visible focus rings.
- Toggles expose `role="switch"` with `aria-checked`; list controls carry `aria-label` (“Move up”,
  “Move down”); every input is linked to its label.
- Saving states are announced in an `aria-live` region (“Unsaved change…”, “Saving…”, “Saved just
  now”).
- A refused save shows a red bar naming the offending field (for example
  `projects.items[6].category must match a defined category`) instead of failing silently.
- The admin bundle is a separate lazy chunk (~81 KB raw / 22 KB gzip) and is not downloaded by
  visitors to the public site.

### 7.6 Embedded and sandboxed frames (browser inside a preview panel)

Reported symptom: signing in from the hosted preview answered *“The password was accepted, but this
browser did not keep the sign-in cookie…”*. The password *was* set correctly (`server/data/auth.json`,
`adminConfigured: true`); the frame simply discarded the cookie, so every later request looked signed
out.

What was changed, and how it was proved:

| # | Change | Evidence |
|---|--------|----------|
| 1 | Login and setup return the signed session in the response body; the client keeps it for the tab and sends `x-admin-token`. The server accepts the header **or** the cookie. | Cross-site frame in Playwright with third-party cookies blocked (0 `toc_` cookies kept): sign in → Dashboard, edit → `PUT /api/admin/content/home` **200**, value changed, revert clean. |
| 2 | Storage access is guarded (`sessionStorage`/`localStorage`/`document.cookie` all throw in an opaque origin) with an in-memory fallback. | Fully sandboxed frame (`sandbox="allow-scripts"`, `Origin: null`): sign in, edit, save and revert all pass; storage probes report `SecurityError` and are survived. |
| 3 | Forms no longer depend on native form submission — a sandboxed frame blocks it *before* the `submit` event fires, so Enter and the button did nothing. Buttons call the handler directly; Enter is handled explicitly. | In the same sandboxed frame: enquiry form filled and submitted, admin sign-in completed. Before the change the browser logged *“Blocked form submission…”* and no request was ever sent. |
| 4 | `/api/*` answers CORS preflights and marks responses readable without credentials; static assets carry `Access-Control-Allow-Origin: *`; Vite dev/preview servers allow CORS; the origin check tolerates `Origin: null` and a proxy that rewrites the host; framing is an explicit setting (`EMBEDDABLE`, default on). | Built site (`npm run build` + `node server/index.js`) inside `sandbox="allow-scripts"`: renders, self-hosted fonts load, client-side routing works, enquiry posts, admin signs in — 7/7 checks, zero console errors. Dev server equivalent: 6/6. Live dev preview: 4/4. |

Refusals re-verified after the change (by direct request): no credential → **401**; forged token →
**401**; cross-site `Origin: https://evil.example` → **403** for both login and a content write; cookie
session without the `x-csrf-token` header → **403**; wrong CSRF token → **403**.

Signing in this way keeps the token in the tab only — a reload in such a frame asks for the password
again (documented in the admin guide). Nothing about the cookie path changed: a normal browser tab
still gets the httpOnly `SameSite=Strict` cookie and the full double-submit check.

---

### 7.7 Editing-experience pass (visual editor, drag and drop, rollback)

Re-tested after the admin was rebuilt around a visual editor. Four harnesses, **59 checks, all
passing, zero console or page errors**:

| Harness | Target | Result |
| --- | --- | --- |
| `/tmp/e2e/v1.mjs` | visual editor: quick find → deep link, click-to-select, live typing, undo/redo, section tabs, duplicate, drag reorder, delete, device widths, project card → editor, “Edit visually” | **16/16** |
| `/tmp/e2e/v2.mjs` | image picker (four tabs), alt-text warning, project gallery add/duplicate/delete | **10/10** |
| `/tmp/e2e/v3.mjs` | projects search, publish/unpublish (and its effect on the public site), duplicate-as-draft, drag reorder, raw-JSON panel, image library upload, backups list, per-copy rollback | **16/16** |
| `/tmp/e2e/loop-scratch.mjs` | the full end-to-end loop, re-run against the same build | **17/17** |

Defects found by that sweep and fixed:

| Defect | Fix |
| --- | --- |
| The projects search box filtered nothing — the matcher was written but never applied to the list | Applied it to the rows |
| `/admin/settings` crashed with “Objects are not valid as a React child” — the server sends backup objects, the screen rendered them as strings | The list now shows name, date and size, with a **Restore this copy** button per copy |
| Only the newest backup could be restored | `POST /api/admin/content/restore-backup` accepts `{ name }`; the name is reduced to a bare filename and must exist in the backups directory (`UNKNOWN_BACKUP` 404 otherwise) |
| `ProjectEditor` called `useState`/`useRef` after early returns, so React aborted the page with “Rendered fewer hooks than expected” while a rename settled | Both hooks moved above the early returns |

Also verified in this pass: the editing layer is completely absent on a plain visit (no preview flag,
no `data-toc-editable` outlines), and `content/site.json` was untouched by every test run.

---

### 7.8 Accounts, in-place editing and the Add menu

Prompted by: *“ability to reset password and change email”* and *“easier to edit … like elementor”*.

Verified with two browser harnesses (**42 checks, all passing, zero console or page errors**) plus a
direct API exercise of every account endpoint:

| Harness | Covers | Result |
| --- | --- | --- |
| `/tmp/e2e/v4.mjs` | first-run setup → recovery address (saved, refused without the password, survives a reset) → forgotten-password flow (code file, wrong code refused, reset works, single-use, file cleaned up, new password signs in) → Add menu (8 kinds, creates and opens the entry) → typing in place on the page (contenteditable, saved, panel in step, no re-render under the caret, Esc reverts) → split-heading lines → click-to-open field | **26/26** |
| `/tmp/e2e/regress.mjs` | the public site, portfolio, project pages, enquiry → inbox, raw-JSON panel, list rows, project drag-reorder, project create/publish (and it appearing on the site), image upload, quick find, project card → editor, backups list | **16/16** |
| `api-account.sh` (curl) | `/api/auth/account`, `/account/email`, `/reset/request`, `/reset/confirm` — status codes, error codes, single-use, no leakage of the address to a signed-out caller | all as designed |

**What was built**

- **Account record** (`server/lib/auth.js`): the recovery address lives beside the password hash in
  `server/data/auth.json`; every write merges (`writeAccount`) and re-asserts mode 600, so setting a
  password cannot wipe the address and neither can leave the file readable.
- **Reset codes** (`server/lib/reset.js`): 10 characters from a 32-symbol alphabet with no look-alikes,
  stored only as a SHA-256 hash, 30-minute expiry, five attempts, single use, and both files deleted
  on consumption or expiry.
- **Delivery** (`server/lib/mail.js`): SMTP via nodemailer (imported dynamically — an install without
  mail never loads it) or a JSON POST to your own relay. With neither configured the plaintext goes to
  `server/data/reset-code.txt` and **the screen says exactly that** — no claim of an email that was
  never sent, which is the same honesty rule the rest of the site follows.
- **Endpoints**: `GET /api/auth/account`, `POST /api/auth/account/email` (password required),
  `POST /api/auth/reset/request`, `POST /api/auth/reset/confirm`. `/api/auth/session` reports only
  *whether* a recovery address exists and how a reset would be delivered — never the address.
- **In-place editing** (`src/content/previewBridge.ts`): clicking text makes it editable where it sits,
  written straight into the same draft as any other change. A precise text-node hit means each line of
  a two-line heading is its own field. Token-bearing text and mixed-content blocks open in the panel
  instead. Esc writes the original wording back — a real revert, not a cosmetic one.
- **Add menu** (`src/admin/AddMenu.tsx`): one list of everything repeatable, built by walking the same
  schemas the forms use, inserting the schema's own blank template and deep-linking into the visual
  editor with the new row already open.

**Defects found and fixed in this pass**

| Defect | Fix |
| --- | --- |
| Clicking text matched by content posted `field:home.home.hero.headline` (section doubled), so the panel never scrolled to the field — the headline case is the one everybody tries first | `relativePath()` strips the section prefix before posting; the panel now opens and highlights the right field |
| Reset requests shared the login rate limiter, so a genuinely locked-out owner could be told “try again in a few minutes” with no number and no way forward | Reset traffic has its own budget, and every 429 now says how many minutes |
| “Esc cancels” only restored the page — every keystroke is saved, so the typed text came straight back and the site kept it | Esc now writes the original value back through the same channel (and stays undoable with Ctrl+Z) |
| A split heading could not be typed over at all — the element holds two fields | The exact text node under the pointer is resolved, so each line edits its own field; decorative `aria-hidden` children no longer block in-place editing |
| `field` rows opened collapsed, so “the new entry is ready to type” was a promise the screen did not keep | `?open=<list>&row=<n>` opens the new row on arrival |


---

## 7.9 Deployment hardening — “the admin is not working when I want to deploy”

The admin is not a static app: it keeps content, the administrator credential, uploads and enquiries as
files. Reproducing a real host reproduced two genuine defects, both fixed here.

**Reproduced before the fix.** Running the server with a non-writable data directory — what a container
image, a serverless platform or any host that mounts the project read-only would give it — crashed the
whole process at startup with an unhandled `EACCES: mkdir …/backups`. Nothing served at all: not the
public site, not the admin. With a writable data directory but a read-only *content* path, the server
started and then failed every write with a raw `EACCES`, which the admin could only render as a bare
filesystem error naming no remedy.

**Fixed**

| Change | Files |
| --- | --- |
| Directory preparation can no longer kill the process; a failed write now surfaces as `STORAGE_READONLY` (HTTP 503) with a message naming the directory and the `DATA_DIR`/`UPLOADS_DIR` fix | `server/index.js`, `server/lib/store.js` |
| The same explanation covers credential writes, image uploads and the missing-content-file case | `server/lib/auth.js`, `server/routes/uploads.js`, `server/routes/submissions.js` |
| `GET /api/health` reports `storage: "writable" \| "read-only"`, `site: "built" \| "missing"` and `dataDir`, so a deployment can be judged from outside | `server/index.js`, `src/lib/api.ts` |
| The startup log states plainly when storage is not writable or no built site is present, instead of leaving it to be discovered later | `server/index.js` |
| Settings → “This installation” shows **Saving changes** and **Site build**, with a red block that explains a read-only deployment in the operator's terms | `src/admin/pages/Settings.tsx` |
| `npm run doctor` — eight checks (Node, build, content file, writability, credential, `SESSION_SECRET`, `TRUST_PROXY`, port), blockers separated from recommendations, `--json` for a release gate, never prints a secret | `tools/doctor.mjs`, `package.json` |
| `Dockerfile` + `.dockerignore` for container hosts, with `/var/data` as a volume and a health check | `Dockerfile`, `.dockerignore` |
| README §9 rewritten: the four ways a deployment breaks the admin, the environment table, per-host notes, and an explicit statement that static hosting cannot run the admin | `README.md` |
| `engines: { "node": ">=20" }` so hosts pick a supported runtime | `package.json` |

**Verified**

- Read-only data directory: the server starts, the public site and `GET /api/content` both answer `200`,
  `/api/health` says `storage: "read-only"`, and setting the administrator password returns
  `503 STORAGE_READONLY` with the directory and the fix in the message. The admin screen shows that
  sentence in full (`docs/screenshots/admin-readonly-deployment.png`).
- Healthy deployment: `/api/health` reports `storage: "writable"`, `site: "built"`;
  `/`, `/projects`, `/admin`, `/contact` all `200` from the production build on one port.
- `npm run doctor` on a broken deployment exits `1` with six blockers; on the healthy project it exits
  `0` with only the two non-blocking recommendations (`SESSION_SECRET`, `TRUST_PROXY`).
- Settings shows “Saving changes — changes are written to disk on this server” and
  “Site build — Serving the built site from dist/”
  (`docs/screenshots/admin-deployment-status.png`).
- No regressions: `v4.mjs` 26/26, `regress.mjs` 16/16, `final.mjs` 7/7, zero console or page errors.

## 7.10 The admin on a static host — the `[object Object]` report

Reported as *“[object Object] when I try to sign in”* on a Vercel deployment. Reproduced by standing up
two stand-in static hosts over the built `dist/`: the common Vercel shape (a catch-all rewrite sending
every path, `/api/*` included, to `index.html`) and the stricter shape (a 404 HTML page for `/api/*`).

**What the site does there.** `/api/*` returns a web page, so no admin API exists. The *public* site is
unaffected — it keeps the content bundled at build time and falls back to the WhatsApp hand-off — which
is exactly why this looked like “only the admin is broken”.

**Two defects found**

1. **The admin lied.** `refreshSession()` caught *any* failure and substituted a fabricated session
   (`configured: true, signedIn: false`). With no API at all, the admin therefore offered the
   first-run/sign-in form as if everything were fine; submitting it produced either the misleading
   “Set up the admin password” screen again or the useless “Something went wrong. Please try again.”
2. **`[object Object]` was real and reachable.** `FieldRenderer` rendered a text field as
   `String(current)`. For a field holding a structure instead of a string — a hand-edited
   `content/site.json`, or the raw-JSON screen — an `<input>` displays the literal text
   `[object Object]`. Nothing else on that screen explained it.

**Fixed**

| Change | Files |
| --- | --- |
| A response body that is not JSON now raises `NO_API` naming the cause instead of falling through as `null` and producing nonsense several screens later | `src/lib/api.ts` |
| The provider no longer invents a session when the API was never reached; it records the reason. A refused request against a running API still shows the ordinary sign-in form | `src/admin/AdminProvider.tsx` |
| `/admin` on a host with no API now renders **“The admin is not available here”**: it names static hosting as the cause, says signing in is impossible until the site runs somewhere with Node, and points at `docs/DEPLOY.md`. No password field is offered | `src/admin/AdminApp.tsx` |
| A text field holding structured data shows an empty box plus an explanation, never `[object Object]` | `src/admin/FieldRenderer.tsx` |

**Verified**

- Both static-host shapes: the public home page and `/projects` render normally (10 images, correct
  headings); `/admin` shows “The admin is not available here”, says “static host”, offers no password
  field, and displays no `[object Object]`
  (`docs/screenshots/admin-static-host-explains-itself.png`).
- A content document with an object in a text field: the Home screen shows the explanation in the field
  instead of `[object Object]`
  (`docs/screenshots/admin-structured-field-warning.png`).
- No regressions: `v4.mjs` 26/26, `regress.mjs` 16/16, `final.mjs` 7/7, zero console or page errors;
  `tsc --noEmit`, `npm run build` and `content:validate` all clean.
