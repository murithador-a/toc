import type { Field, SectionSchema } from './fields'

/**
 * What is editable, and how it is presented.
 * ---------------------------------------------------------------------------
 * One entry per top-level key in content/site.json. Projects get their own
 * screen because they are a collection with media, ordering and publish state;
 * everything else is rendered from the descriptors below.
 *
 * Anything without a descriptor is still reachable through the raw JSON editor
 * on each screen, so nothing on the site is beyond editing.
 */

const image = (path: string, label: string, help?: string): Field => ({ kind: 'image', path, label, help })

const eyebrow: Field = { kind: 'text', path: 'eyebrow', label: 'Eyebrow', help: 'The small bronze label above the heading.' }

/* ------------------------------------------------------------------- company */

const companySchema: SectionSchema = {
  key: 'company',
  title: 'Company details',
  description: 'Legal name, address, phone, WhatsApp and map links. These feed the header, footer, contact page and every tel:/wa.me link on the site.',
  hint: 'Changing the phone number or WhatsApp number here updates every link automatically. The WhatsApp number must be international format with no + or spaces, e.g. 2348057838376.',
  fields: [
    { kind: 'text', path: 'legalName', label: 'Legal name', help: 'Used in the footer, page titles and the structured data search engines read.' },
    { kind: 'text', path: 'shortName', label: 'Short name' },
    { kind: 'text', path: 'monogram', label: 'Monogram', help: 'One or two letters shown in the logo mark.' },
    { kind: 'text', path: 'strapline', label: 'Strapline' },
    { kind: 'text', path: 'address.street', label: 'Street' },
    { kind: 'text', path: 'address.locality', label: 'Town / city' },
    { kind: 'text', path: 'address.postalCode', label: 'Postal code' },
    { kind: 'text', path: 'address.region', label: 'State / region' },
    { kind: 'text', path: 'address.country', label: 'Country' },
    { kind: 'text', path: 'address.countryCode', label: 'Country code', help: 'Two letters, e.g. NG. Used in structured data.' },
    { kind: 'text', path: 'addressFull', label: 'Full address (single line)', wide: true },
    { kind: 'text', path: 'addressShort', label: 'Short address', help: 'Shown in the hero strip, e.g. Osogbo, Osun State.' },
    { kind: 'text', path: 'phone.display', label: 'Phone (as displayed)' },
    { kind: 'text', path: 'phone.tel', label: 'Phone for dialling', help: 'International format, e.g. +2348057838376.' },
    { kind: 'text', path: 'whatsapp.number', label: 'WhatsApp number', help: 'Digits only, international format: 2348057838376.' },
    { kind: 'text', path: 'whatsapp.display', label: 'WhatsApp (as displayed)' },
    { kind: 'textarea', path: 'whatsapp.opener', label: 'Default WhatsApp message', rows: 3, help: 'Pre-fills the message when a visitor taps a WhatsApp link.' },
    { kind: 'textarea', path: 'whatsapp.note', label: 'WhatsApp disclaimer', rows: 3, help: 'Shown next to WhatsApp links. Keep the point that WhatsApp does not confirm a booking.' },
    { kind: 'text', path: 'maps.listingUrl', label: 'Google Maps listing URL', wide: true },
    { kind: 'text', path: 'maps.directionsUrl', label: 'Google Maps directions URL', wide: true },
    { kind: 'number', path: 'maps.lat', label: 'Latitude', step: 0.0000001 },
    { kind: 'number', path: 'maps.lng', label: 'Longitude', step: 0.0000001 },
    { kind: 'text', path: 'maps.osmEmbedUrl', label: 'Map embed URL', wide: true, help: 'The map that loads on the contact page when a visitor clicks “Load the map”.' },
    { kind: 'text', path: 'maps.osmLink', label: 'Map link', wide: true },
    { kind: 'boolean', path: 'hasOpeningHours', label: 'Opening hours are confirmed', help: 'Leave off until TOC confirms real opening hours — the site then says “To be confirmed by TOC” instead of showing invented times.' },
    { kind: 'text', path: 'openingHours', label: 'Opening hours' },
    { kind: 'boolean', path: 'hasEmail', label: 'Publish an email address', help: 'Leave off until TOC provides one — the site then hides the email row entirely.' },
    { kind: 'text', path: 'email', label: 'Email address' },
  ],
}

/* ----------------------------------------------------------------------- seo */

const seoSchema: SectionSchema = {
  key: 'seo',
  title: 'Search & sharing',
  description: 'Default title, description, canonical domain and the social sharing image.',
  fields: [
    { kind: 'text', path: 'siteUrl', label: 'Canonical site URL', wide: true, help: 'Used for canonical tags, the sitemap and structured data. Change this when the final domain is approved.' },
    { kind: 'text', path: 'defaultTitle', label: 'Home page title', wide: true, maxLength: 70, help: 'Aim for under about 60 characters so Google does not truncate it.' },
    { kind: 'textarea', path: 'defaultDescription', label: 'Home page description', rows: 3, maxLength: 200, help: 'Aim for 150–160 characters.' },
    { kind: 'text', path: 'ogImage', label: 'Social sharing image path', wide: true },
  ],
}

/* ---------------------------------------------------------------------- menu */

const menuSchema: SectionSchema = {
  key: 'menu',
  title: 'Navigation',
  description: 'The links in the header and footer, in order. Contact and Privacy are added automatically.',
  fields: [
    {
      kind: 'list',
      path: '',
      label: 'Menu items',
      itemTitle: 'label',
      addLabel: 'Add menu item',
      blank: () => ({ label: 'New page', to: '/' }),
      fields: [
        { kind: 'text', path: 'label', label: 'Label' },
        { kind: 'text', path: 'to', label: 'Link', help: 'Must match a page that exists, e.g. /projects' },
      ],
    },
  ],
}

/* ---------------------------------------------------------------------- home */

const homeSchema: SectionSchema = {
  key: 'home',
  title: 'Home page',
  description: 'The opening statement visitors see first.',
  hint: '{{company}} and {{phone}} tokens: type them anywhere in the text and the site replaces them with the company details automatically.',
  fields: [
    { ...eyebrow, path: 'hero.eyebrow' },
    { kind: 'text', path: 'hero.headline', label: 'Headline', wide: true, maxLength: 90 },
    { kind: 'text', path: 'hero.headlineAccent', label: 'Headline second line', wide: true, help: 'Rendered in italic bronze under the headline. Leave empty for a single-line headline.' },
    { kind: 'textarea', path: 'hero.subhead', label: 'Sub-heading', rows: 3, maxLength: 300 },
    image('hero.image', 'Background photograph', 'Wide landscape works best. Uploading replaces the current image.'),
    { kind: 'text', path: 'hero.imageNote', label: 'Photograph caption', help: 'Keep the note that this is reference imagery until real project photography exists.' },
    { kind: 'text', path: 'hero.primaryCtaLabel', label: 'Primary button label' },
    { kind: 'text', path: 'hero.secondaryCtaLabel', label: 'Secondary button label' },
    { kind: 'boolean', path: 'capability.enabled', label: 'Show the four-service strip under the hero' },
  ],
}

/* --------------------------------------------------------------------- about */

const aboutSchema: SectionSchema = {
  key: 'about',
  title: 'About page',
  description: 'Mission, vision, principles and the About block on the home page.',
  hint: 'The mission and vision are drafts. Re-word them in TOC’s own voice, then delete the note at the bottom of the section to remove the “awaiting confirmation” label.',
  fields: [
    { kind: 'text', path: 'hero.eyebrow', label: 'Breadcrumb eyebrow' },
    { kind: 'text', path: 'hero.heading', label: 'Heading' },
    { kind: 'text', path: 'hero.headingAccent', label: 'Heading accent' },
    { kind: 'textarea', path: 'hero.intro', label: 'Intro', rows: 3 },
    { kind: 'text', path: 'sectionHeading', label: 'First section heading' },
    { kind: 'text', path: 'sectionHeadingAccent', label: 'First section heading accent' },
    { kind: 'paragraphs', path: 'paragraphs', label: 'Opening paragraphs', rows: 8 },
    image('imageSmall', 'Image — smaller'),
    image('imageLarge', 'Image — larger'),
    { kind: 'text', path: 'imageNote', label: 'Image caption' },
    { kind: 'text', path: 'principlesHeading', label: 'Principles heading' },
    {
      kind: 'list',
      path: 'principles',
      label: 'Principles',
      itemTitle: 'title',
      addLabel: 'Add principle',
      blank: () => ({ title: 'New principle', body: '' }),
      fields: [
        { kind: 'text', path: 'title', label: 'Title' },
        { kind: 'textarea', path: 'body', label: 'Description', rows: 3 },
      ],
    },
    { kind: 'text', path: 'missionLabel', label: 'Mission label' },
    { kind: 'textarea', path: 'mission', label: 'Mission', rows: 4 },
    { kind: 'text', path: 'visionLabel', label: 'Vision label' },
    { kind: 'textarea', path: 'vision', label: 'Vision', rows: 4 },
    { kind: 'text', path: 'photographyLabel', label: 'Photography placeholder label' },
    { kind: 'text', path: 'photographyCaption', label: 'Photography placeholder caption' },
    { kind: 'textarea', path: 'note', label: 'Note shown to visitors', rows: 3, help: 'Clear this once the company has reviewed the wording.' },
    { kind: 'text', path: 'preview.eyebrow', label: 'Home page block — eyebrow' },
    { kind: 'text', path: 'preview.heading', label: 'Home page block — heading' },
    { kind: 'text', path: 'preview.headingAccent', label: 'Home page block — heading accent' },
    { kind: 'paragraphs', path: 'preview.paragraphs', label: 'Home page block — paragraphs', rows: 6 },
    {
      kind: 'list',
      path: 'preview.pillars',
      label: 'Home page block — pillars',
      itemTitle: 'title',
      addLabel: 'Add pillar',
      blank: () => ({ title: 'New pillar', body: '' }),
      fields: [
        { kind: 'text', path: 'title', label: 'Title' },
        { kind: 'textarea', path: 'body', label: 'Text', rows: 2 },
      ],
    },
    { kind: 'text', path: 'preview.linkLabel', label: 'Home page block — button label' },
    { kind: 'textarea', path: 'preview.note', label: 'Home page block — note', rows: 2 },
  ],
}

/* ------------------------------------------------------------------ services */

const servicesSchema: SectionSchema = {
  key: 'services',
  title: 'Services',
  description: 'The four services, their descriptions and the scope lists.',
  hint: 'The slug is the anchor used by links across the site (e.g. /services#building-construction). If you change a slug, the old link stops working.',
  fields: [
    eyebrow,
    { kind: 'text', path: 'heading', label: 'Heading' },
    { kind: 'text', path: 'headingAccent', label: 'Heading accent' },
    { kind: 'textarea', path: 'intro', label: 'Intro', rows: 3 },
    { kind: 'textarea', path: 'notice', label: 'Draft notice shown on the services page', rows: 3 },
    {
      kind: 'list',
      path: 'items',
      label: 'Service pages',
      itemTitle: 'title',
      addLabel: 'Add service',
      blank: () => ({
        slug: 'new-service',
        index: '05',
        title: 'New service',
        tagline: '',
        summary: '',
        body: [],
        scopeLabel: 'Typical scope',
        scope: [],
        image: { src: '', alt: '', caption: '' },
        published: false,
      }),
      fields: [
        { kind: 'text', path: 'title', label: 'Title' },
        { kind: 'text', path: 'slug', label: 'Anchor / slug', help: 'Lowercase, hyphens only.' },
        { kind: 'text', path: 'index', label: 'Number', help: 'Shown as “Service 01”.' },
        { kind: 'text', path: 'tagline', label: 'Short tagline', wide: true },
        { kind: 'textarea', path: 'summary', label: 'Summary', rows: 3 },
        { kind: 'paragraphs', path: 'body', label: 'Full description', rows: 6 },
        { kind: 'text', path: 'scopeLabel', label: 'Scope list heading' },
        { kind: 'lines', path: 'scope', label: 'Scope items', rows: 8, help: 'One item per line.' },
        image('image', 'Photograph'),
        { kind: 'boolean', path: 'published', label: 'Published' },
      ],
    },
  ],
}

/* -------------------------------------------------------------------- process */

const processSchema: SectionSchema = {
  key: 'process',
  title: 'Process',
  description: 'The four stages shown horizontally on desktop and as a sequence on mobile.',
  fields: [
    eyebrow,
    { kind: 'text', path: 'heading', label: 'Heading' },
    { kind: 'text', path: 'headingAccent', label: 'Heading accent' },
    { kind: 'textarea', path: 'intro', label: 'Intro', rows: 3 },
    { kind: 'textarea', path: 'notice', label: 'Draft notice', rows: 3 },
    {
      kind: 'list',
      path: 'stages',
      label: 'Stages',
      itemTitle: 'title',
      addLabel: 'Add stage',
      blank: () => ({ index: '05', title: 'New stage', description: '', outcome: '' }),
      fields: [
        { kind: 'text', path: 'index', label: 'Number' },
        { kind: 'text', path: 'title', label: 'Title' },
        { kind: 'textarea', path: 'description', label: 'Description', rows: 3 },
        { kind: 'text', path: 'outcome', label: 'Result', help: 'What the client receives at the end of the stage.', wide: true },
      ],
    },
  ],
}

/* -------------------------------------------------------------------- reviews */

const reviewsSchema: SectionSchema = {
  key: 'reviews',
  title: 'Rating & reviews',
  description: 'The Google rating shown on the home page.',
  hint: 'The rating is a third-party figure. Quote it exactly as Google shows it, keep the link to the listing, and do not add reviews TOC cannot point to.',
  fields: [
    eyebrow,
    { kind: 'text', path: 'heading', label: 'Heading' },
    { kind: 'text', path: 'headingAccent', label: 'Heading accent' },
    { kind: 'textarea', path: 'intro', label: 'Intro', rows: 3 },
    { kind: 'number', path: 'rating.value', label: 'Rating', step: 0.1, min: 0, max: 5 },
    { kind: 'number', path: 'rating.count', label: 'Number of reviews' },
    { kind: 'number', path: 'rating.max', label: 'Scale maximum', min: 5, max: 5 },
    { kind: 'text', path: 'rating.source', label: 'Source', help: 'e.g. Google' },
    { kind: 'text', path: 'rating.sourceUrl', label: 'Link to the listing', wide: true },
    { kind: 'textarea', path: 'rating.note', label: 'Note', rows: 3 },
    {
      kind: 'list',
      path: 'excerpts',
      label: 'Quoted reviews',
      itemTitle: 'author',
      addLabel: 'Add quoted review',
      blank: () => ({ author: '', quote: '', sourceUrl: '', verifiedBy: '', verifiedOn: '' }),
      fields: [
        { kind: 'text', path: 'author', label: 'Reviewer name' },
        { kind: 'textarea', path: 'quote', label: 'Quote', rows: 3 },
        { kind: 'text', path: 'sourceUrl', label: 'Link to the review', wide: true },
        { kind: 'text', path: 'verifiedBy', label: 'Confirmed by', help: 'Who at TOC confirmed the quote is accurate.' },
        { kind: 'text', path: 'verifiedOn', label: 'Confirmed on', help: 'Date, e.g. 2026-10-01.' },
      ],
    },
  ],
}

/* ----------------------------------------------------------------------- faqs */

const faqsSchema: SectionSchema = {
  key: 'faqs',
  title: 'Questions & answers',
  description: 'Shown on the contact and consultation pages.',
  fields: [
    eyebrow,
    { kind: 'text', path: 'heading', label: 'Heading' },
    { kind: 'text', path: 'headingAccent', label: 'Heading accent' },
    {
      kind: 'list',
      path: 'items',
      label: 'Questions',
      itemTitle: 'question',
      addLabel: 'Add question',
      blank: () => ({ question: 'New question?', answer: '' }),
      fields: [
        { kind: 'text', path: 'question', label: 'Question', wide: true },
        { kind: 'textarea', path: 'answer', label: 'Answer', rows: 4, wide: true },
      ],
    },
  ],
}

/* -------------------------------------------------------------------- contact */

const contactSchema: SectionSchema = {
  key: 'contact',
  title: 'Contact page copy',
  description: 'Headings and form labels on the contact page.',
  fields: [
    { kind: 'text', path: 'hero.eyebrow', label: 'Page eyebrow' },
    { kind: 'text', path: 'hero.heading', label: 'Page heading' },
    { kind: 'text', path: 'hero.headingAccent', label: 'Page heading accent' },
    { kind: 'textarea', path: 'hero.intro', label: 'Page intro', rows: 3 },
    { kind: 'text', path: 'inquiry.eyebrow', label: 'Form eyebrow' },
    { kind: 'text', path: 'inquiry.heading', label: 'Form heading' },
    { kind: 'text', path: 'inquiry.headingAccent', label: 'Form heading accent' },
    { kind: 'textarea', path: 'inquiry.intro', label: 'Form intro', rows: 3 },
    { kind: 'text', path: 'inquiry.submitLabel', label: 'Submit button label' },
  ],
}

/* --------------------------------------------------------------- consultation */

const consultationSchema: SectionSchema = {
  key: 'consultation',
  title: 'Consultation page',
  description: 'Copy for the request-a-consultation page.',
  hint: 'Keep the wording clear that a consultation is a request: nothing is booked until TOC confirms a time.',
  fields: [
    { kind: 'text', path: 'hero.eyebrow', label: 'Page eyebrow' },
    { kind: 'text', path: 'hero.heading', label: 'Page heading' },
    { kind: 'text', path: 'hero.headingAccent', label: 'Page heading accent' },
    { kind: 'textarea', path: 'hero.intro', label: 'Page intro', rows: 3 },
    { kind: 'text', path: 'eyebrow', label: 'Form eyebrow' },
    { kind: 'text', path: 'heading', label: 'Form heading' },
    { kind: 'text', path: 'headingAccent', label: 'Form heading accent' },
    { kind: 'textarea', path: 'intro', label: 'Form intro', rows: 3 },
    { kind: 'textarea', path: 'notice', label: '“This is a request, not a booking” notice', rows: 4 },
    { kind: 'text', path: 'submitLabel', label: 'Submit button label' },
  ],
}

/* ------------------------------------------------------------------------ cta */

/** A CTA band is a single object, so it is described field by field. */
const bandFields = (base: string, heading: string): Field[] => [
  { kind: 'text', path: `${base}.eyebrow`, label: `${heading} — eyebrow` },
  { kind: 'text', path: `${base}.title`, label: `${heading} — heading`, wide: true },
  { kind: 'textarea', path: `${base}.body`, label: `${heading} — body`, rows: 3, wide: true },
  { kind: 'text', path: `${base}.primaryLabel`, label: `${heading} — primary button` },
  { kind: 'text', path: `${base}.secondaryLabel`, label: `${heading} — secondary button` },
]

const ctaSchema: SectionSchema = {
  key: 'cta',
  title: 'Call-to-action bands',
  description: 'The conversion blocks at the bottom of the About, Services, Projects and Consultation pages, plus the “discuss a similar project” band on project pages.',
  hint: 'The buttons always point at the quote form and the consultation page, so only the wording is editable here.',
  fields: [
    ...bandFields('contactBand', 'Home / contact'),
    ...bandFields('about', 'About'),
    ...bandFields('services', 'Services'),
    ...bandFields('projects', 'Projects'),
    ...bandFields('consultation', 'Consultation'),
    { kind: 'text', path: 'projectDetail.heading', label: 'Project page — heading', wide: true },
    { kind: 'textarea', path: 'projectDetail.body', label: 'Project page — body', rows: 3, wide: true },
  ],
}

/* -------------------------------------------------------------------- privacy */

const privacySchema: SectionSchema = {
  key: 'privacy',
  title: 'Privacy policy',
  description: 'The privacy page. The section describing how forms are handled is generated from the live configuration, so it always matches what the site actually does.',
  fields: [
    { kind: 'text', path: 'eyebrow', label: 'Eyebrow' },
    { kind: 'text', path: 'breadcrumb', label: 'Breadcrumb label' },
    { kind: 'text', path: 'heading', label: 'Heading' },
    { kind: 'text', path: 'headingAccent', label: 'Heading accent' },
    { kind: 'textarea', path: 'intro', label: 'Intro', rows: 3 },
    {
      kind: 'list',
      path: 'sections',
      label: 'Sections',
      itemTitle: 'heading',
      addLabel: 'Add section',
      blank: () => ({ heading: 'New section', paragraphs: [] }),
      fields: [
        { kind: 'text', path: 'heading', label: 'Heading', wide: true },
        { kind: 'paragraphs', path: 'paragraphs', label: 'Paragraphs', rows: 6 },
      ],
    },
    { kind: 'textarea', path: 'note', label: 'Client note', rows: 3 },
  ],
}

/* --------------------------------------------------------------------- footer */

const footerSchema: SectionSchema = {
  key: 'footer',
  title: 'Footer',
  description: 'The short paragraph and tagline at the bottom of every page.',
  fields: [
    { kind: 'textarea', path: 'intro', label: 'Footer paragraph', rows: 4 },
    { kind: 'text', path: 'tagline', label: 'Tagline' },
  ],
}

/* ---------------------------------------------------------------------- forms */

const formsSchema: SectionSchema = {
  key: 'forms',
  title: 'Form options',
  description: 'The choices offered by the quote and consultation forms. These also drive the services dropdown.',
  hint: 'One option per line. Keep the service list in step with the services above so the preselected “Enquire about this service” link always finds a match.',
  fields: [
    { kind: 'lines', path: 'serviceOptions', label: 'Services', rows: 6 },
    { kind: 'lines', path: 'projectTypeOptions', label: 'Project types', rows: 6 },
    { kind: 'lines', path: 'budgetOptions', label: 'Budget bands', rows: 6 },
    { kind: 'lines', path: 'timeOptions', label: 'Time preferences', rows: 5 },
  ],
}

/* ----------------------------------------------------------------------- meta */

const metaSchema: SectionSchema = {
  key: 'meta',
  title: 'Document information',
  description: 'Bookkeeping written by the server on every save.',
  fields: [
    { kind: 'number', path: 'version', label: 'Version' },
    { kind: 'text', path: 'updatedAt', label: 'Last saved', help: 'Set automatically — no need to edit.' },
  ],
}

export const sectionSchemas: SectionSchema[] = [
  companySchema,
  homeSchema,
  aboutSchema,
  servicesSchema,
  processSchema,
  reviewsSchema,
  faqsSchema,
  contactSchema,
  consultationSchema,
  ctaSchema,
  privacySchema,
  footerSchema,
  formsSchema,
  menuSchema,
  seoSchema,
  metaSchema,
]

export const schemaFor = (key: string): SectionSchema | undefined => sectionSchemas.find((schema) => schema.key === key)

/** Grouping for the sidebar and the dashboard. */
export const sectionGroups: { title: string; keys: string[] }[] = [
  { title: 'The site', keys: ['company', 'menu', 'home', 'about', 'services', 'process', 'reviews', 'faqs', 'contact', 'consultation', 'cta', 'privacy', 'footer', 'forms'] },
  { title: 'Search & sharing', keys: ['seo'] },
  { title: 'Advanced', keys: ['meta'] },
]
