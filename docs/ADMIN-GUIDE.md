# Admin guide — TOC Luxury Constructions website

This is the operator's manual. It assumes no programming knowledge: everything described here is
done by clicking, in a web browser.

If you only read one paragraph, read this one: **open `/admin`, sign in, change what you need, and
wait for the header to say “Saved”.** There is no publish button for text — the site updates as soon
as a change is saved. Projects are the exception: they stay drafts until you publish them yourself.

---

## 1. Getting in

### The first time

1. Visit `https://<your-domain>/admin`.
2. If no password has been set yet, the screen says **“Set up the admin password”**.
3. Choose a password of at least 10 characters, type it twice, and continue. You are signed straight in.

That password is stored on the server as a `scrypt` hash — never as readable text — in
`server/data/auth.json`. **Nobody can reset it for you from the website**, so keep it somewhere safe
(a password manager). If it is lost, the server operator can delete `server/data/auth.json` (which
brings the first-run screen back) or set `ADMIN_PASSWORD` in the server's `.env` file.

### Afterwards

Visit `/admin` and sign in. Sessions last 12 hours by default; after that you are asked again.

### Signing in from a preview panel or an embedded frame

You may be looking at the site inside a preview panel, a hosting sandbox, or a page of your own that
embeds it. That is fine — the admin is built to work there.

Sign-in normally uses a cookie. If the browser refuses to keep it (embedded panels and sandboxed
frames often do, and it is easy to confirm later by reloading), the admin falls back to a signed
session token kept for the life of that tab. Nothing extra to do: type the password as usual. The
practical differences in that fallback mode are:

- reloading the tab asks for the password again;
- each tab has its own session.

If the screen still says the password was accepted but the session could not be stored, that browser
is blocking both mechanisms — open the site in an ordinary browser tab and sign in there. The edit
screens are much more comfortable in a full tab anyway.

### Forgotten your password?

On the sign-in screen, **Forgotten your password?** creates a one-time reset code.

| | |
| --- | --- |
| **If mail is configured** | The code is emailed to the recovery address on the account. |
| **If mail is not configured** | The code is written to `server/data/reset-code.txt` on the server. The screen says so, and tells you that file — open it (or ask whoever runs the server to read the code out) and type it in. |

The code lasts 30 minutes, works once, and stops working after five wrong tries.

**Set a recovery address before you need one.** *Settings → Recovery email*. Changing it requires
your current password, so nobody sitting at an unlocked computer can quietly redirect your reset to
themselves. Until an address is on file, a reset can only be delivered through the server file.

To have codes emailed, whoever runs the server sets one of these and restarts:

- `SMTP_URL=smtp://user:password@smtp.example.com:587` — needs `npm install nodemailer` on the server.
- `RESET_WEBHOOK_URL=https://…` — the server POSTs `{to, subject, text, code}` to your own mail relay.

### If the password is already set by the server

Some deployments set the password in the server's environment instead. Then:

- the first-run screen never appears,
- the password cannot be changed from *Settings* — it says so plainly,
- it is changed by editing `ADMIN_PASSWORD` (or `ADMIN_PASSWORD_HASH`) in the server `.env` file and
  restarting the server.

---

## 2. How saving works

- Change a field and it is saved automatically about **one second** after you stop typing.
- The header shows the state at all times: *Unsaved change… → Saving… → Saved 12 seconds ago*.
- If a change is refused, a red bar appears at the top explaining why (usually a required value is
  missing, such as an image description). Nothing is half-saved: the server checks the whole document
  and either accepts or refuses it.
- Before every save, the previous version of the content is copied into `server/data/backups/`
  (the last 30 are kept). *Settings → Backups and rollback* puts the previous version back, and
  *Discard unsaved edits in this session* throws away anything typed but not yet saved.

**Leave the page whenever you like** — anything already marked *Saved* is safe. To be certain, wait
for “Saved” before closing the tab.

---

## 3. The screens

### Dashboard

A summary of the site: how many projects exist, how many are drafts, how many enquiries are unread,
and how many photographs are in use. The **+ Add** button in the header is available from every
screen and is covered under *Adding something new* below. It also links to every content screen, and has two buttons:
**Open the visual editor** and **View the live site**.

Above the numbers sit **content health** cards — the things worth fixing, each with a link straight to
the screen that fixes it:

| Card | Means |
| --- | --- |
| Needs attention | Something is wrong on the live site: an empty headline, a photograph with no description, or an unpublished project you probably meant to publish |
| Worth knowing | Not wrong, but deliberate: entries still flagged as placeholders, or company details (hours, email) that are hidden because TOC has not confirmed them |

When the cards disappear, there is nothing left to check.

### Visual editor

The quickest way to change anything, and the one to start with. It shows the **real page** beside the
fields, so you edit what you can see instead of guessing which field belongs to which paragraph.

1. **Pick the page** from the tabs along the top (Home, About, Services, Projects, Contact,
   Consultation, Privacy).
2. **Click text and type over it.** Headings, paragraphs, captions, list items and labels become
   editable where they sit: click, type, press Enter (or click away) to keep it, Esc to put the
   original wording back. *This is the same content as everywhere else — it is saved the same way,
   just without the field panel in the way.*
3. **Click anything else** — an image, a button, a logo, a whole block — and the matching field opens
   on the left, highlighted, with the panel scrolled to it. Edit it and the page updates as you type.
   No preview button, no refresh; *Saved …* appears in the header when the change has landed.

Details worth knowing:

- **Nothing changes for visitors.** The page you are editing is the same code a visitor gets; it only
  listens to the editor when it is opened with the preview flag, and it is told to ignore clicks and
  links that would take you somewhere else.
- **Two styled lines in one heading are two fields.** Where a heading is split — “Building with
  Purpose.” above an italic “Designed to Last.” — click the line you want and edit that line; the
  other stays as it is. Text containing a `{{token}}` opens in the panel instead, because typing over
  it would replace the token with a frozen copy of the details it stands for.
- **Project cards open their own editor.** Click a project on the Projects page inside the panel and
  you land in the full project editor for that entry.
- **Desktop / tablet / mobile** buttons change the width of the panel so you can check the narrow
  layout without a second device.
- **Hold Ctrl (or Command) and click** a link in the panel to open it normally in a new tab.
- **Open in a tab** is on the top right of the panel if you would rather see the page full-screen.
- **Undo / Redo** buttons sit above the panel; the keyboard shortcuts do the same thing from anywhere
  in the admin.
- On a narrow screen the field panel collapses — use **Hide fields / Show fields**.

If a field is not on the page you are looking at (a form option, a footer line, search settings), use
**Quick find** or the *Page content* list; every section is still editable as a form.

### Adding something new — the **+ Add** button

The **+ Add** button in the header is the quickest way to create the things the site is built from.
It lists everything that can be repeated — a service, a process stage, a question, a principle, a
navigation link, a footer section, a quoted review — with how many exist right now.

Pick one and it is created immediately (saved, not queued), the visual editor opens on that part of
the page, and the new entry is expanded and ready to type into. New entries arrive hidden or as a
draft wherever the site requires that: a new service is not shown on the public site until you switch
it on, and a new project stays a draft until you publish it.

You can still add entries from inside a screen — the *Add* button under a list does the same thing
and leaves you where you are.

### Quick find (Ctrl + K)

One search box over the whole document — every heading, paragraph, form option, caption and project
field. Open it with **Ctrl + K** (Command + K on a Mac) or the **Search everything** button in the
header, type a few words, and press Enter: it takes you to the visual editor with that exact field
open. It also offers jump-to commands — Dashboard, Visual editor, Add a project, Projects, Images,
Enquiries, Settings — so Ctrl + K followed by a couple of letters is the fastest way around the admin.

Use ↑ ↓ to move through the results, Esc to close.

### Keyboard shortcuts

| Shortcut | Action |
| --- | --- |
| **Ctrl / Command + K** | Quick find — search every word on the site |
| **Ctrl / Command + Z** | Undo the last change |
| **Ctrl / Command + Shift + Z** (or **Ctrl + Y**) | Redo |
| **Enter** | Enter the highlighted Quick find result |

Undo and redo work across sections and are ignored while you are typing inside a field, so the
browser's own text undo still behaves as you expect there.

### Projects

The portfolio. Each row is one project; the order of the rows is the order on the website.

| Button | What it does |
| --- | --- |
| **Add a project** | Creates an empty draft and opens its editor |
| **↑ / ↓** | Moves the project earlier or later on the site |
| **Publish / Unpublish** | Makes the project visible, or hides it again |
| **Edit** | Opens the full editor |
| **Duplicate** | Copies a project as a new draft — handy for similar jobs |
| **Delete** | Removes it from the website |

Filters at the top (*All / Published / Drafts / Placeholders*) make a long list manageable, and the
**Search projects** box narrows them by title, address, location, type, year or client.

**Reordering by dragging.** Grab the ⠿ handle on the left of a row and drop it where you want it; a
bronze outline shows where it will land. The ↑ ↓ buttons do the same thing one step at a time. The
order you set here is the order on the portfolio page.

**Duplicating.** *Duplicate* copies the whole entry — title, story, scope, photographs — as a **draft**
with “(copy)” appended, so an almost-identical project can be set up in a moment. Nothing is visible on
the site until you publish it.

#### Adding a project, step by step

1. **Projects → Add a project.**
2. **Title** — the name on the card. The web address is filled in from the title; you can change it,
   but once a page has been shared anywhere, changing the address breaks those links.
3. **Category** — which filter group it belongs to on the portfolio page.
4. **Project type**, **Location**, **Completed**, **Client** — the facts shown on the project page.
   Leave anything you are not sure of empty: the site then says “To be confirmed” rather than
   inventing a value.
5. **One-line summary** — the sentence under the title on the card.
6. **Cover photograph** — press *Upload image*, choose a file, then write the **description (alt
   text)**. That description is what a screen reader reads aloud, and what appears if the image fails
   to load. Keep it literal: “Front elevation with the completed boundary wall”.
7. **Additional photographs** (optional) — *Add a photograph* for each one, in the order you want
   them. Two to six works well.
8. **Description** — the story of the job. Leave a blank line between paragraphs.
9. **Scope of works** — one item per line, for example:
   ```
   Substructure and reinforced concrete frame
   Roofing, envelope and external render
   Finishes, joinery and external works
   ```
10. **Published** — switch it on when the entry is ready, or leave it as a draft and come back later.

#### The “layout placeholder” switch

The site ships with six demonstration entries so the portfolio page has a shape before real
photography arrives. Each one carries a visible notice, and its page is kept out of search results.

When you replace one with a real project, switch **“This is a layout placeholder”** off. The notice
disappears, the page joins the sitemap, and search engines may index it. If an entry genuinely is a
real TOC project, never switch it on.

### Images

Every photograph uploaded anywhere in the admin appears in *Images*, together with its size, its
dimensions and a **Copy address** button. Accepted files are JPEG, PNG, WebP and AVIF up to 8 MB.
Deleting an image here breaks any page still using it, so check first.

The photography that came with the site lives in `public/images` and is not listed here; simply
upload replacements and point each image field at them.

**Every image field has a “Choose a photo” button.** It opens one picker with four ways in:

| Tab | Use it for |
| --- | --- |
| Upload new | A file from your computer — click, or drag it onto the panel |
| Your uploads | Anything already uploaded, so a photograph can be reused instead of uploaded twice |
| Built-in photos | The photographs that shipped with the site |
| Web address | An image that already exists online, or a path such as `/images/hero-residence-1920.webp` |

Choosing an image fills the address and its dimensions. **The description (alt text) is not optional in
practice:** it is what a screen reader reads aloud and what search engines index, so the field shows a
warning while it is empty, and the dashboard counts the photographs that still need one.

### Enquiries

Every quote request and consultation request sent through the website lands here. Nothing is emailed
to you, so make a habit of checking this screen — or use **Download CSV** to open the whole list in a
spreadsheet.

- **Unread** enquiries are outlined in bronze; opening one marks it read.
- **Call** dials the number the visitor gave.
- **Archive** tidies an enquiry away without deleting it; **Restore** brings it back.
- **Delete** removes it permanently.

Each enquiry shows exactly what the visitor typed, plus when it arrived and a short reference you can
quote on the phone.

> WhatsApp remains the quickest way to talk to a client, but it does not record anything in this
> inbox. If a conversation happens on WhatsApp, expect to keep that record there.

### Page content screens

Each entry in the sidebar edits one part of the site:

| Screen | What it covers |
| --- | --- |
| Company details | Legal name, address, phone, WhatsApp, map links, opening hours |
| Navigation | The links in the header and footer |
| Home page | The opening headline, sub-heading, hero photograph and buttons |
| About page | Mission, vision, principles and the About block on the home page |
| Services | The four services: titles, descriptions, scope lists, photographs |
| Process | The four stages of the client journey |
| Rating & reviews | The Google rating figure, its source link, and any quoted reviews |
| Questions & answers | The FAQ list |
| Contact page copy, Consultation page, Call-to-action bands, Privacy policy, Footer, Form options | As named |
| Search & sharing | The default page title and description, and the social sharing image |
| Document information | Bookkeeping written automatically on every save |

Every screen also has a **Show the raw JSON** panel at the bottom where the section can be edited as
raw data. It exists so that nothing on the website is out of reach, but it is easy to break something
there — the server will refuse anything it considers invalid, and backups are one click away.

Two things are the same on every screen:

- **Edit visually** at the top of the screen opens the same section in the visual editor.
- **List rows can be dragged and copied.** Anything shown as a list — services, process stages,
  principles, FAQs, navigation links, form options — has a ⠿ handle to drag it into a new order, and a
  **Duplicate** button that copies the row (titles gain “(copy)”, and a new address is picked for you).
  **Delete** removes the row. Collapsed rows open with the + on the left.

### Settings

- **Recovery email** — the address a password-reset code is sent to. Set it before you need it.
  Changing it asks for your current password. This address is never shown on the site.
- **Administrator password** — change it here (current password required). Doing so signs out every
  session, including yours. If the deployment takes its password from the environment
  (`ADMIN_PASSWORD`), this screen says so and refuses — that credential changes on the server.
- **Backups and rollback** — every save first copies the previous version aside. The screen lists the
  copies with their date and size, and **Restore this copy** puts any one of them back; the newest is
  also available as *Roll back to the newest copy*. *Discard unsaved edits in this session* throws away
  only what has not been saved yet.
- **This installation** — what is running and what it can do, so nobody has to guess whether form
  submissions are being stored.

---

## 4. Working with text

- **Headings** appear on the page; **eyebrows** are the small bronze labels above them.
- Many headings have a second “accent” field. Text there is shown in italic bronze, so
  “Built to last” + “and made to be lived in” reads as one sentence with the second half emphasised.
- **Paragraphs** fields treat a blank line as a new paragraph.
- **Lists** fields take one item per line.
- **Tokens**: `{{company}}`, `{{phone}}`, `{{whatsapp}}`, `{{address}}`, `{{email}}` and `{{siteUrl}}`
  can be typed anywhere and are replaced with the current company details automatically. This is why
  the company's phone number only has to be corrected in one place.

### Writing rules the site relies on

The site is deliberately careful about claims. Please keep it that way:

1. **Only state what TOC can prove.** Real projects, real photographs, real dates. The portfolio
   entries that ship with the site are labelled as placeholders for exactly this reason.
2. **Never invent reviews.** The rating is quoted exactly as Google shows it, with a link to the
   listing. If you add a quoted review, fill in *Confirmed by* and *Confirmed on* — that record is
   why the quote is allowed on the site at all.
3. **Photographs of other people's work must say so.** Use the *Caption* field on an image, for
   example “Reference imagery — not a TOC project”.
4. **Opening hours and email** stay hidden until you tick *confirmed* in Company details. Until then
   the site says “To be confirmed by TOC”, which is honest and better than a wrong time.
5. **WhatsApp does not confirm anything.** Keep the wording that says so.

---

## 5. For whoever runs the server

- **Where the state lives:** `content/site.json` (all content), `server/data/uploads/` (images),
  `server/data/submissions.json` (enquiries), `server/data/backups/` (rollback copies). Back all four
  up; nothing else is stateful.
- **Password:** `ADMIN_PASSWORD` in `.env`, or `ADMIN_PASSWORD_HASH` produced by
  `npm run admin:hash -- "…"`, or the first-run screen. With none of those set, first-run setup is
  available — so do not expose a fresh deployment publicly before setting one.
- **Sessions:** set `SESSION_SECRET` in production (a long random string) so restarts do not invalidate
  sessions in a way that depends on the stored credential.
- **Behind a proxy:** set `TRUST_PROXY=true` so rate limits and the login lockout see real client IPs.
- **Serving:** `npm run build && NODE_ENV=production npm start` serves the site and the API from one
  port; put TLS in front of it. Never serve this over plain HTTP.
- **Health check:** `GET /api/health` reports whether an admin credential is configured, which content
  file is in use, whether a built site is present (`site: "built"`) and whether this deployment can
  store anything (`storage: "writable"` or `"read-only"`). `npm run doctor` prints the same picture as
  a checklist and names the fix for each failure.
- **Logs:** the server logs each content save, each received enquiry, first-run password creation and
  each password reset. It never logs passwords, reset codes or enquiry contents.
- **Password resets:** a code lives in `server/data/reset.json` as a SHA-256 hash with a 30-minute
  expiry and a five-attempt ceiling. When mail is not configured the plaintext is briefly written to
  `server/data/reset-code.txt` (mode 600); both files are deleted the moment the code is used, expires
  or is destroyed by wrong guesses. Encrypt or exclude those paths the same way you would
  `auth.json`. **Losing every credential is recoverable**: delete `server/data/auth.json` and the
  first-run screen returns — but so does anyone else who can reach the server, so do it with the site
  offline and set a new password immediately.
### If changes will not save on the live site

The admin is not a static page: it stores content, the credential, images and enquiries as **files on
the server**. A host with nowhere to write cannot run it, however well it serves the site.

1. Run `npm run doctor` **on the host**, in the project directory, with the environment the running
   process uses. It checks the build, the content file, writability, the credential, `SESSION_SECRET`,
   `TRUST_PROXY` and the port, and prints the fix for anything it marks **FAIL**.
2. If it reports that storage is not writable, the deployment is running from a read-only or
   disposable filesystem. Point `DATA_DIR` and `UPLOADS_DIR` at a persistent mounted volume and
   restart — `DATA_DIR=/var/data`, `UPLOADS_DIR=/var/data/uploads`.
3. If the sign-in screen instead shows **“Set up the admin password”**, nothing is broken:
   `server/data/` is deliberately not in the repository, so a fresh deployment always starts empty.
   Set the password there once, or set `ADMIN_PASSWORD` in the host's environment variables.
4. If `/admin` says the API cannot be reached, the admin was not deployed at all — a static host such
   as Vercel, Netlify or GitHub Pages has no Node process to answer `/api/*`. See README §9, or the
   shorter checklist in `docs/DEPLOY.md`.

In the admin itself, **Settings → This installation** shows “Saving changes” and “Site build”, so the
two questions that matter — *can this deployment store anything?* and *is a built site being served?*
— are answered on the screen rather than in a log. When a save fails because the disk is read-only,
the message names the directory to fix; it never shows a bare `EACCES`.

- **Embedding:** the site and the admin may be shown inside another page's frame by default
  (`EMBEDDABLE=true`), which is what makes preview panels work. Set `EMBEDDABLE=false` to send
  `X-Frame-Options: SAMEORIGIN` on `/admin` and refuse to be framed once the real domain is live.
