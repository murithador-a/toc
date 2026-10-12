# TOC Luxury Constructions Ltd — Website & Admin

A premium, responsive website **with its own content management backend** for
**TOC Luxury Constructions Ltd**, a construction company at USTEEM Junction, Agunbelewo,
Osogbo 230103, Osun State, Nigeria.

Built for `https://www.tocluxuryconstructions.com` (proposed production domain — see
[Deployment](#9-deployment)).

---

## 1. What this is

An architectural-minimalism business website with a private admin area behind it:

**The public site**

- A full-bleed hero and an editorial service presentation (four services, alternating layout)
- A filterable project portfolio with per-project detail pages
- A four-stage proposed client process (horizontal timeline on desktop, vertical on mobile)
- Sourced Google rating with attribution, no fabricated testimonials
- A validated construction quote inquiry form and a consultation request experience
  (a request, **not** a confirmed booking)
- Contact, location, map, directions, click-to-call and WhatsApp in header / contact / mobile / footer
- Privacy policy, 404 page, sitemap, robots.txt, structured data, Open Graph metadata

**The admin area** (`/admin`)

- Edit **every** piece of text and imagery on the site — headings, paragraphs, services, process
  stages, FAQs, form choices, footer, privacy policy, search/sharing defaults
- Add, edit, reorder, duplicate, unpublish and delete projects, with image upload
- An image library, an enquiries inbox with CSV export, and content rollback to the previous version

**Design language:** warm ivory (`#F5F2EC`), deep charcoal (`#242724`), muted bronze (`#A78B64`),
pure white, soft grey. Display type is DM Serif Display; body and interface type is Manrope. Both
are self-hosted — the site makes no third-party font requests.

---

## 2. Architecture in one picture

```
  browser ──▶  one origin (https://www.tocluxuryconstructions.com)
               │
               ├── /                 static build of the React site   (dist/)
               ├── /uploads/…        images uploaded in the admin     (server/data/uploads)
               └── /api/*            Express API
                                      ├── /api/content           public document (drafts removed)
                                      ├── /api/submissions/*     the two public forms
                                      └── /api/admin/*           everything else — session required

  content/site.json  ◀── the single editable document ──▶  admin UI at /admin
```

The site is content-driven: `content/site.json` holds every string and image reference. The public
pages read it at runtime through `useContent()` and fall back to the copy bundled at build time, so
a static deployment without the API still renders the full site — just without the admin.

---

## 3. Content integrity rules baked into the code

These are deliberate, and should not be "tidied away":

| Rule | Where it lives |
| --- | --- |
| No invented project names, locations, dates, costs or specifications | `content/site.json` — the six seeded portfolio entries carry `isPlaceholder: true` and empty metadata; the UI labels them and project pages are `noindex` while the flag is on |
| No stock photo is ever presented as TOC work | Every image carries a caption such as "Reference imagery — not a TOC project", editable per image in the admin |
| No invented testimonials | `reviews.excerpts` ships empty; the admin will only show excerpts that are filled in, and each asks who verified it and when |
| No invented rating claims | The 4.7 / 58 reviews figure is attributed to the Google Maps listing and described as a written record rather than a live feed |
| No invented company history, registrations, certifications or hours | Sections simply do not contain them; the About page carries a visible "awaiting confirmation" note and the contact panel says "To be confirmed by TOC" until someone ticks *opening hours are confirmed* |
| No false success state on forms | A success panel appears only after the server returns 2xx (`src/lib/submit.ts`); otherwise the visitor is offered WhatsApp instead |
| No unverified structured data | `GeneralContractor` details only; no `aggregateRating` markup anywhere |
| No secrets in client code | Only `VITE_`-prefixed, endpoint-style values are read in the browser (`src/lib/integrations.ts`); non-HTTPS values are ignored. The admin password never leaves the server |

---

## 4. Running it

Requires **Node 20+**.

```bash
npm install
cp .env.example .env      # then set ADMIN_PASSWORD (see §5)
npm run dev               # API on :8787 + site on http://localhost:5173
```

`npm run dev` starts both halves and proxies `/api` and `/uploads` from the dev server to the API,
so the browser only ever talks to one origin — exactly as in production.

| Script | What it does |
| --- | --- |
| `npm run dev` | API (port 8787) + Vite dev server (port 5173) together |
| `npm run dev:site` / `npm run dev:api` | Either half on its own |
| `npm run build` | `tsc --noEmit`, then a production build into `dist/` |
| `npm start` | Production server: serves `dist/` **and** the API from one port |
| `npm run preview` | Vite's static preview of `dist/` (no API, no admin) |
| `npm run typecheck` | Type-check only |
| `npm run content:validate` | Validate `content/site.json` (structure, counts, required fields) |
| `npm run doctor` | Check a deployment: build, content file, writable storage, credential, env, port. Run it on the host — see §9.1 |
| `npm run admin:hash -- "…"` | Print an `ADMIN_PASSWORD_HASH` for `.env` |

### Regenerating the shipped photography

Temporary photography is downloaded, converted to WEBP and stripped to exact dimensions by:

```bash
python3 tools/build-images.py     # requires Pillow
```

Output lands in `public/images/` with a `manifest.json` recording intrinsic sizes. Replace the
entries at the top of that script with production files when real photography arrives — or upload
the real photographs in the admin and point each image field at them.

---

## 5. The admin area

Full operator instructions are in **[`docs/ADMIN-GUIDE.md`](docs/ADMIN-GUIDE.md)**. The essentials:

1. **Set the password.** Either put `ADMIN_PASSWORD=…` in `.env` before starting, or start the
   server with no password configured and visit `/admin` — the first-run screen sets one and stores
   it hashed (`scrypt`) in `server/data/auth.json`. `npm run admin:hash` produces
   `ADMIN_PASSWORD_HASH` if you would rather the plaintext never sit on the server.
2. **Sign in** at `/admin`. Add a **recovery email** on *Settings* while you are there — it is the
   only way to reset the password yourself. **Forgotten your password?** on the sign-in screen
   creates a one-time code (30 minutes, five guesses, one use). Set `SMTP_URL` (needs `nodemailer`)
   or `RESET_WEBHOOK_URL` and the code is emailed; with neither set it is written to
   `server/data/reset-code.txt` and the screen says so plainly rather than pretending to send mail.
   A password under `ADMIN_PASSWORD`/`ADMIN_PASSWORD_HASH` is environment-managed: the reset flow is
   switched off and the credential changes there.
3. **Edit anything.** The **visual editor** (`/admin/visual`) shows the real page beside the fields:
   click a paragraph and type over it in place, or click anything else and edit it in the panel.
   **Ctrl + K** searches every word on the site and jumps to the field. **+ Add** in the header
   creates a service, question, process stage or navigation link and opens it ready to fill in.
   Every screen still saves automatically about a second after you stop typing (the header shows
   *Unsaved change / Saving… / Saved*), and each has a raw-JSON panel for values with no friendly
   control. **Ctrl + Z / Ctrl + Shift + Z** undo and redo.
4. **Add a project** from *Projects → Add a project*: upload a cover photograph, write the story and
   the scope of works, then publish. Drafts never appear on the public site.
5. **Read the enquiries** in *Enquiries* — quote and consultation requests are stored on the server
   and can be exported as CSV. Nothing is emailed; the inbox is the record.

**Safety nets.** Every save first copies the previous version of the content file into
`server/data/backups/` (last 30 kept), and *Settings → Backups and rollback* lists every copy with
its own **Restore this copy** button. Sessions are signed, httpOnly cookies; every write requires a matching CSRF
token and a same-origin request; login attempts are rate-limited and locked out after repeated
failures.

---

## 6. Project structure

```
src/
  components/
    brand/      Monogram, Wordmark            — proposed identity, drawn as paths (no font needed)
    layout/     Layout, Header, Footer, ScrollManager
    seo/        Seo (react-helmet-async wrapper)
    site/       Hero, AboutPreview, CapabilityStrip, ServicesSection, ProjectsPreview,
                ProjectCard, ProjectsGallery, ProcessSection, ReviewsSection, FaqSection,
                ContactBand, CtaBand, MapPanel, PageHero, InquiryForm, ConsultationForm,
                WhatsAppFloat
    ui/         Button, Field, Picture, Reveal, Alert, Notice, PlaceholderFrame, Rating,
                SectionHeading, Container, icons
  content/      types.ts (the content model), defaults.ts, store.ts, interpolate.ts,
                context.ts (hooks), ContentProvider.tsx
  admin/        AdminApp, AdminProvider (draft state + autosave), AdminLayout, AdminLogin,
                fields.ts + schema.ts (what is editable, described declaratively),
                FieldRenderer.tsx, ui.tsx, pages/ (Dashboard, ProjectsAdmin, ProjectEditor,
                MediaLibrary, Inbox, Settings, SectionEditor)
  lib/          api.ts (admin client), whatsapp.ts, forms.ts, submit.ts, integrations.ts, format.ts
  pages/        Home, About, Services, Projects, ProjectDetail, Contact, Consultation,
                Privacy, NotFound
  index.css     Tailwind layers, self-hosted @font-face, reveal + reduced-motion rules
server/         index.js (Express app, security headers, static + SPA fallback)
  lib/          config.js, auth.js, store.js, validate.js, rateLimit.js
  routes/       auth.js, content.js, uploads.js, submissions.js
  data/         auth.json, submissions.json, uploads/, backups/   (created at runtime, gitignored)
content/
  site.json     THE editable document — every string and image on the site
public/
  fonts/        DM Serif Display + Manrope (self-hosted WOFF2)
  images/       Optimised WEBP derivatives + manifest.json
  logo/         Monogram in light/dark/inverse treatments, PNG app icon
  robots.txt, sitemap.xml, site.webmanifest, favicon.svg
tools/          dev.mjs, start.mjs, validate-content.mjs, hash-password.mjs, build-images.py
docs/           ADMIN-GUIDE.md, CONTENT-TO-CONFIRM.md, BRAND-ASSETS.md, QA-REPORT.md
```

### Where content lives

| To change… | Use |
| --- | --- |
| Anything visible on the site | **The admin area** at `/admin` (writes `content/site.json`) |
| The same thing from a terminal | `content/site.json` directly — run `npm run content:validate` afterwards |
| Which fields the admin offers for a section | `src/admin/schema.ts` |

`content/site.json` supports `{{tokens}}` in free text: `{{company}}`, `{{phone}}`, `{{whatsapp}}`,
`{{address}}`, `{{email}}` and `{{siteUrl}}` are replaced with the current company details at render
time (`src/content/interpolate.ts`), so a phone number only has to be corrected in one place.

---

## 7. Forms, WhatsApp and integrations

### What happens by default

With the API running, both forms post to `/api/submissions/*`. The server validates and sanitises
the payload again, stores it in `server/data/submissions.json` (file mode `0600`), and it appears in
*Enquiries* in the admin. Submissions are never emailed — the inbox is the record.

Fast, silent success is impossible by design: a success panel appears only after a 2xx response, and
every failure state (network, timeout, validation, rate limit) shows a distinct message plus the
WhatsApp fallback.

### Static deployment (no API)

If `dist/` is served without the Node server, `GET /api/content` fails, the site falls back to the
bundled content, and `src/lib/integrations.ts` reports that nothing can be delivered. The forms then
validate in the browser, state plainly that **nothing has been transmitted or stored**, and offer a
pre-filled WhatsApp message for the visitor to send themselves.

### Optional external endpoints

| Variable | Purpose |
| --- | --- |
| `VITE_SITE_URL` | Canonical production URL (canonicals, structured data, sitemap) |
| `VITE_INQUIRY_ENDPOINT` | HTTPS endpoint accepting the inquiry payload as JSON `POST` |
| `VITE_CONSULTATION_ENDPOINT` | Endpoint for consultation requests (falls back to the inquiry endpoint) |
| `VITE_INQUIRY_UPLOAD_ENDPOINT` | Endpoint for secure attachment uploads (`multipart/form-data`) |
| `VITE_GOOGLE_MAPS_EMBED_KEY` | Google Maps Embed API key, if a Google map is preferred over OpenStreetMap |

**Anything `VITE_`-prefixed is compiled into the public bundle** — never put a secret there.

### Attachments on the public forms

The file input on the public forms stays disabled until `VITE_INQUIRY_UPLOAD_ENDPOINT` is set. Image
upload in the **admin** is separate, authenticated, and validated on the server (magic-byte check,
JPEG/PNG/WebP/AVIF only, 8 MB default).

### WhatsApp

Destination: `https://wa.me/2348057838376` (normalised from the supplied `0805 783 8376`). Messages
are built in `src/lib/whatsapp.ts` and encoded with `encodeURIComponent`. Nothing is sent
automatically, and wherever WhatsApp is offered the site states that opening it moves the
conversation to WhatsApp and does not confirm a booking, appointment or quotation.

---

## 8. Maps

- **Directions / listing:** the supplied Google Maps short link is used as a link (never as an embed
  source).
- **Embedded map:** keyless Google embedding is not possible — `maps.google.com/maps?…&output=embed`
  returns `X-Frame-Options: SAMEORIGIN`. The default embed is therefore **OpenStreetMap**, centred on
  the coordinates resolved from the company's own listing (**7.8084471, 4.5324538**), with a Google
  Maps Embed API option available via `VITE_GOOGLE_MAPS_EMBED_KEY`.
- The map is click-to-load: no third-party request is made while browsing.

---

## 9. Deployment

The public site is plain static files. **The admin is not** — it reads and writes
files on disk through the API, so it needs a long-lived Node process and one
writable directory. That single fact decides everything below.

A one-page version of this section, ordered as a checklist, is in
[docs/DEPLOY.md](docs/DEPLOY.md).

### 9.1 Before you blame the app: run the doctor

On the host, from the project directory, with the same environment the running
process uses:

```bash
npm run doctor
```

It checks the eight things that actually break a deployment — build present,
content file readable, storage writable, credential configured, `SESSION_SECRET`,
`TRUST_PROXY`, the port — marks each **PASS** or **FAIL**, and prints the fix.
`--json` gives machine-readable output for a release gate. It never prints a
secret, only whether one exists.

### 9.2 The four ways a deployment breaks the admin

| Symptom | Cause | Fix |
| --- | --- | --- |
| `/admin` loads, but nothing saves; errors mention `EACCES`, `EROFS` or `read-only` | The disk is not writable (container image, serverless platform, read-only mount) | Point `DATA_DIR` and `UPLOADS_DIR` at a mounted, persistent volume and restart |
| `/admin` shows **Create the administrator password** instead of the sign-in screen | Fresh data directory: `server/data/` is gitignored, so it never arrives with the code | Either run that one-time setup, or copy `server/data/auth.json` across (keep it `chmod 600`) |
| The site loads but `/admin` only says the API cannot be reached | Static-only host (Vercel, Netlify, GitHub Pages, S3): there is no Node process, so `/api/*` does not exist | Deploy on a Node host instead (§9.3), or keep the admin off and manage content by editing `content/site.json` |
| Every page is the site's own 404, or the server prints *"API is running"* | `dist/` was never built on the host — it is gitignored | Make `npm run build` part of the deploy (§9.3) |

Signs of a stopped process are different again: the whole site is unreachable,
not just the admin.

### 9.3 A Node host (site + admin + API) — recommended

This is the shape the project is built for: one process serves the built site,
the API and `/admin` on one port, so the admin shares the site's origin.

```bash
npm ci
cp .env.example .env          # then edit it — see below
npm run build                 # dist/ is not committed; it is built here
npm run doctor                # all blockers must pass
npm start                     # NODE_ENV=production, serves dist/ + /api on API_PORT
```

Set in the host's environment (or `.env`):

| Variable | Value | Why |
| --- | --- | --- |
| `API_PORT` | the port the host expects | `PORT` is honoured too, so a PaaS-assigned port works unchanged |
| `HOST` | `0.0.0.0` | Required in a container; a reverse-proxy-only setup can use `127.0.0.1` |
| `DATA_DIR` | a **mounted, persistent** path, e.g. `/var/data` | Content, credential, uploads and submissions live here |
| `UPLOADS_DIR` | `${DATA_DIR}/uploads` | Uploaded images |
| `SESSION_SECRET` | `openssl rand -hex 32` | Signs session cookies; without it sessions derive from the credential |
| `TRUST_PROXY` | `true` behind a proxy/LB | So the login lockout sees real client IPs |
| `ADMIN_PASSWORD` | *optional* | Set it to control the password from the environment; leave it empty to use the first-run screen at `/admin` instead |

**Host notes.**

- **Render / Railway / Fly.io / Heroku-style PaaS:** build command `npm ci && npm run build`, start command `npm start`. Allocate a disk/volume and set `DATA_DIR` to its mount path — without it, every deploy and every restart starts from an empty data directory.
- **A VPS (Ubuntu, etc.):** run it under `systemd` or `pm2` so it restarts, put Nginx or Caddy in front for TLS, set `TRUST_PROXY=true`. `DATA_DIR` can stay `server/data` as long as the service user owns it.
- **Docker or any container host:** `Dockerfile` is included and declares `/var/data` as a volume:
  ```bash
  docker build -t toc-site .
  docker run -p 8787:8787 -v toc-data:/var/data -e SESSION_SECRET=$(openssl rand -hex 32) toc-site
  ```
  `docker run --rm -v toc-data:/var/data toc-site npm run doctor` diagnoses a running volume.

**Behind a reverse proxy**, the server already sends `nosniff`, `X-Frame-Options`,
Referrer-Policy, Permissions-Policy and a `default-src 'none'` CSP on
`/api/*` and `/uploads/*`, serves unknown paths from `index.html` (SPA fallback)
except `/api/*` and `/uploads/*`, and caches `/uploads/*` for 30 days
(filenames are random, so they are immutable).

**Back up** `content/site.json`, `server/data/uploads/` and
`server/data/submissions.json` — nothing else is stateful. The admin keeps the
last 30 copies of the content file in `server/data/backups/` by itself.

### 9.4 Static hosting (no admin)

Build and upload `dist/` to any static host — Vercel, Netlify, Cloudflare Pages,
GitHub Pages, S3. Requirements:

1. **SPA fallback:** rewrite unknown paths to `/index.html` so client routes resolve.
2. Set `VITE_SITE_URL` to the approved domain and update the same URL in
   `index.html`, `public/robots.txt` and `public/sitemap.xml`.
3. Add a long cache header for `/images/*` and `/fonts/*`.

The public site is fully functional: it reads the content bundled at build time
and falls back to the WhatsApp hand-off for the forms. **`/admin` will not work
here** — there is no Node process to serve `/api/*` and no disk to write to.
Content changes are made by editing `content/site.json` and redeploying, or by
running the Node shape (§9.3) somewhere and pointing the domain at it.

### 9.5 Splitting the two (not supported yet)

Serving the public site statically while the admin runs on a separate Node host
would need a cross-origin API: a configurable API base URL in the client, CORS
for the site's origin, and a decision about where the admin lives. It is
deliberately not built — one origin is simpler and the admin is currently
same-origin only. If it is ever wanted, it is a real change, not a flag.

## 10. Accessibility, performance and security notes

- Skip link, visible `:focus-visible` rings, labelled icon buttons, `aria-expanded` /
  `aria-controls` on the mobile menu, Escape to close, scroll lock, focus returned on close. The admin
  area uses the same primitives and is fully keyboard-operable.
- Error summary with `aria-live`, per-field hints wired through `aria-describedby`.
- `prefers-reduced-motion` disables reveals, transitions and smooth scrolling; reveals also carry an
  8 s safety timer so content can never stay hidden.
- Type is self-hosted and preloaded; the hero image is preloaded with `imagesrcset`.
- Below-the-fold images are lazy-loaded; every image carries intrinsic `width`/`height` and alt text.
- The admin bundle is a separate lazy chunk — visitors to the public site never download it.
- No analytics, no cookies for visitors, no third-party requests on load.
- Admin credential: `scrypt` (N=16384) with a per-credential random salt. Sessions: HMAC-signed
  httpOnly cookie, `SameSite=Strict`, 12 h by default. Writes: same-origin check **and** a
  double-submit CSRF token. Rate limits: login lockout after 6 failures / 15 min, public form
  submissions 12 / 10 min, admin writes 120 / min.
- Browsers that will not keep cookies — an embedded preview panel, a sandboxed frame, cookies switched
  off — sign in with the same signed session presented in an `x-admin-token` header instead. It is
  held for the life of the tab (in memory if storage is unavailable) and never sent anywhere but back
  to this server. Token-authenticated writes skip the double-submit check, which is sound because a
  cross-site page cannot set a request header without a preflight this server never approves;
  cookie-authenticated writes still carry the full check.
- `GET` responses from `/api/*` are readable cross-origin (`Access-Control-Allow-Origin: *`) and no
  response ever sets `Access-Control-Allow-Credentials`, so a foreign page can read the public content
  but can never borrow the session. Static assets carry the same header so a sandboxed frame can load
  the site's own modules and fonts. `/uploads/*` stays same-origin.
- Framing: allowed by default (`EMBEDDABLE=true`) so the site and the admin can be shown inside a
  preview panel or a client's own page — a framed page cannot read the session cookie and cannot write
  anything without a credential it does not have. Set `EMBEDDABLE=false` to send
  `X-Frame-Options: SAMEORIGIN` on `/admin` once the site is on its real domain.

---

## 11. Outstanding items

See:

- [`docs/ADMIN-GUIDE.md`](docs/ADMIN-GUIDE.md) — how to run and operate the admin, in plain language.
- [`docs/CONTENT-TO-CONFIRM.md`](docs/CONTENT-TO-CONFIRM.md) — every fact, policy and piece of copy
  that needs company sign-off before launch.
- [`docs/BRAND-ASSETS.md`](docs/BRAND-ASSETS.md) — the proposed logo direction and how to swap in
  approved artwork in one file.
- [`docs/QA-REPORT.md`](docs/QA-REPORT.md) — what was tested, the defects found and fixed, and the
  known gaps.
