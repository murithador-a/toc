# Content and decisions to confirm before launch

Everything below is either **unverified**, **drafted for approval**, or **not yet configured**.
Nothing in this list has been invented on the site; each item is either clearly marked as draft/
placeholder in the UI, or is simply absent until TOC supplies it.

---

## 1. Verified information currently published

Supplied for this project and safe to publish as-is:

- **Company name:** TOC Luxury Constructions Ltd
- **Address:** USTEEM Junction, Agunbelewo, Osogbo 230103, Osun State, Nigeria
- **Phone:** 0805 783 8376 (display) / `+2348057838376` (link) / `2348057838376` (WhatsApp)
- **Google Maps listing:** https://maps.app.goo.gl/p3aUfcG9oYq8D1zx8
- **Coordinates** used for the map and directions: 7.8084471, 4.5324538 — *resolved from the supplied
  listing URL, not supplied directly; please confirm these match the office entrance*
- **Rating:** 4.7 out of 5 from 58 reviews, attributed to Google Maps

---

## 2. Needed from TOC (blocking launch items)

| # | Item | Why it matters | Where it appears |
| --- | --- | --- | --- |
| 1 | **Production domain** | Canonical tags, sitemap and structured data currently use `www.tocluxuryconstructions.com` as a placeholder | `index.html`, `public/robots.txt`, `public/sitemap.xml`, `VITE_SITE_URL` |
| 2 | **Where enquiries should land** | They are stored on the server and appear in *Enquiries* in the admin — **nothing is emailed**. If TOC wants an email or WhatsApp notification as well, that needs a mail/SMS provider | Admin → Enquiries; `.env` → `VITE_INQUIRY_ENDPOINT` if an external service is preferred |
| 3 | **Company email address** | No email is published anywhere. If one exists, tick *Publish an email address* in Admin → Company details and enter it | Admin → Company details |
| 4 | **Opening hours** | The contact page currently reads "To be confirmed by TOC". Enter real hours in Admin → Company details and switch on *Opening hours are confirmed* | Admin → Company details |
| 5 | **Real project records** | Six placeholder entries occupy the portfolio. Replace them one at a time in the admin, then switch off *layout placeholder* on each finished entry | Admin → Projects |
| 6 | **Genuine project photography** | All imagery is licensed reference photography, labelled as such. Upload real photographs in the admin and point each image field at them; keep the caption on any image that is not TOC's own work | Admin → Images, and every image field |
| 7 | **Header phone number** | Confirm that 0805 783 8376 is the number to reach project enquiries, and whether a second line should be listed. Changing it in Admin → Company details updates every link on the site | Admin → Company details |
| 8 | **Privacy policy review** | Drafted to match how the site is actually built. Review, or supply your own | `/privacy` |
| 9 | **Consent wording** | The checkbox wording ("details used to respond; nothing stored on this site; WhatsApp moves the conversation") should be approved, and adjusted if an endpoint is configured | Both forms |
| 10 | **Budget bands** | Form options run from "Not yet determined" to "Above ₦150 million". TOC should confirm realistic bands | Admin → Form options |
| 11 | **Attachment handling on the public forms** | The public file input stays disabled until a secure endpoint exists. Admin image uploads are already authenticated, magic-byte checked and size-limited | `.env` → `VITE_INQUIRY_UPLOAD_ENDPOINT` |
| 12 | **Map embed preference** | Default is OpenStreetMap (Google's keyless embed refuses framing). A Google Embed API key can be supplied instead | `.env` → `VITE_GOOGLE_MAPS_EMBED_KEY` |
| 13 | **Who administers the site** | Decide who holds the admin password, and whether the deployment uses `ADMIN_PASSWORD` (server owner) or the first-run screen (the person who signs in first after deploy) | `/admin`, `server/.env` |
| 14 | **Where backups go** | Content backups live on the same server as the site. Confirm an off-server copy (weekly download of `content/site.json`, `server/data/`) in line with how TOC stores other records | Server operations |

---

## 3. Draft copy awaiting approval

Each of these is marked in the interface as draft, proposed or placeholder.

### Hero (draft messaging)
- Headline: *"Building with Purpose. Designed to Last."*
- Subhead: *"From residential construction to structural works and project consultancy, TOC Luxury
  Constructions delivers considered building solutions shaped around your vision."*

### About page
- Section heading: *"Built on Planning. Defined by Quality."*
- The three "How we work" principles, and the company introduction paragraphs
- **Mission** and **Vision** cards — currently labelled "Draft copy awaiting approval"
- A visible note states that founding year, years of experience, team size, registrations and
  certifications will not be published until confirmed

### Services
- All four service descriptions, summaries, taglines and "Typical scope" lists
- The structural works copy attributes design and engineering certification to *"the design
  professionals appointed to each project"* — deliberately **not** to TOC, so no unconfirmed
  engineering accreditation is implied. Confirm this wording, or confirm the credentials TOC holds
- Confirm which services TOC will accept work in, and whether any should be removed

### Process
- Four stages (Consultation → Planning → Execution → Review & Handover) are presented as a
  **proposed** process, with a visible note. Confirm or replace with the real workflow — especially
  what the client receives at each stage

### Portfolio placeholders
- Six "Portfolio Entry NN" placeholders with the note "Location to be confirmed" and per-image
  captions reading "Reference imagery — not a TOC project"

### FAQs
- Six questions drafted from the site's actual behaviour. Confirm the answers, especially:
  - whether TOC works outside Osogbo (currently: "considered case by case")
  - whether a first consultation is free (currently stated as no charge)

---

## 4. Reviews and testimonials

- The **4.7 / 58 reviews** figure is a written record of the Google listing, attributed to Google
  Maps and described as *"not a live feed"*. It is **not** wired into a live reviews API.
- **No individual review excerpts are published.** `reviews.excerpts` in `content/site.json` (Admin → Rating & reviews) exposes
  `approvedReviewExcerpts: []` with the fields required to add one safely: `author`, verbatim
  `quote`, `sourceUrl`, `verifiedBy`, `verifiedOn`. Add entries only when each quote has been checked
  against the live review and the attribution is appropriate to quote.
- No `aggregateRating` structured data is published, since the rating is third-party sourced rather
  than first-party review markup.

---

## 5. Things deliberately NOT published

Not supplied, and therefore absent rather than invented:

- Founding date, years of experience, employee or client counts
- Professional registrations, licences, memberships, certifications
- Awards, accreditations or guarantees
- Delivery timelines or completion guarantees
- Staff names, profiles or photographs
- Customer names, addresses, project values or completion dates
- Social media profiles (no links are shown anywhere)
- Additional phone numbers or email addresses

If any of these should be published, supply the verified detail and it will be added.

---

## 6. Integration checklist (developer)

- [ ] Set `VITE_SITE_URL` to the approved domain and update `index.html`, `robots.txt`, `sitemap.xml`
- [ ] Set `ADMIN_PASSWORD` (or run first-run setup) and `SESSION_SECRET` before the site is reachable
- [ ] Build and serve with `NODE_ENV=production npm start` behind TLS; set `TRUST_PROXY=true` if a
      proxy terminates TLS
- [ ] Submit a test inquiry end-to-end and confirm it appears in Admin → Enquiries, then export the CSV
- [ ] Add a new project in the admin, upload an image, publish it, confirm it appears on `/projects`
- [ ] If an external form service is preferred, set `VITE_INQUIRY_ENDPOINT` — the payload shape is
      documented in `src/lib/forms.ts`
- [ ] Add an email/SMS notification for new enquiries if the client expects to be told; the site
      deliberately does not send mail itself
- [ ] If uploads are enabled on the public forms: server-side type/size validation, malware scanning,
      private storage, signed URLs, and a documented retention period
- [ ] Update the privacy policy if the delivery route changes
- [ ] Add the SPA rewrite rule on the host (the Node server already does this)
- [ ] Confirm a backup routine for `content/site.json` and `server/data/`
- [ ] Re-run the checks in `docs/QA-REPORT.md` after any content change
