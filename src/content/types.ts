/**
 * Content model — the single source of truth for everything editable on the site.
 *
 * The canonical document lives in `content/site.json` and is:
 *   • read by the public site at runtime  (GET /api/content)
 *   • edited by the admin UI              (PUT /api/content/*)
 *   • used as the bundled fallback        (src/content/defaults.ts)
 *
 * Adding a field: add it here, give it a value in content/site.json, and read it
 * through `useContent()` in the component that displays it.
 */

/** A photograph. `src` is either a built-in asset (/images/…) or an upload (/uploads/…). */
export type ContentImage = {
  src: string
  /** Optional responsive candidate list, e.g. "/a-1400.webp 1400w, /a-900.webp 900w" */
  srcset?: string
  width?: number
  height?: number
  /** Always required in practice — describe the photograph, never the file */
  alt: string
  /** CSS object-position for controlled cropping, e.g. "50% 45%" */
  focal?: string
  /** Shown under the image, e.g. "Reference imagery — not a TOC project" */
  caption?: string
}

export type ServiceItem = {
  slug: string
  index: string
  title: string
  tagline: string
  summary: string
  body: string[]
  scopeLabel: string
  scope: string[]
  image: ContentImage
  published: boolean
}

export type CategoryDef = {
  key: string
  label: string
}

export type ProjectItem = {
  slug: string
  title: string
  category: string
  projectType: string
  /** 'draft' is visible in the admin only; 'published' appears on the site */
  status: 'draft' | 'published'
  /**
   * Marks an entry that holds a layout position but contains no verified
   * company project record. Kept visible so the placeholder disclosure shows.
   */
  isPlaceholder: boolean
  location: string
  yearCompleted: string
  client: string
  summary: string
  description: string[]
  scope: string[]
  cover: ContentImage
  gallery: ContentImage[]
  order: number
  createdAt?: string
  updatedAt?: string
}

export type ProcessStage = {
  index: string
  title: string
  description: string
  outcome: string
}

export type FaqItem = {
  question: string
  answer: string
}

export type ReviewExcerpt = {
  author: string
  quote: string
  sourceUrl: string
  verifiedBy: string
  verifiedOn: string
}

export type CtaBandContent = {
  eyebrow: string
  title: string
  body: string
  primaryLabel: string
  secondaryLabel: string
}

export type NavItem = {
  label: string
  to: string
}

export type SiteContent = {
  meta: {
    version: number
    updatedAt: string
  }

  seo: {
    siteUrl: string
    defaultTitle: string
    defaultDescription: string
    ogImage: string
  }

  company: {
    legalName: string
    shortName: string
    monogram: string
    strapline: string
    address: {
      street: string
      locality: string
      postalCode: string
      region: string
      country: string
      countryCode: string
    }
    /** Shown wherever the full postal address is listed */
    addressFull: string
    /** Compact label for the hero / tight UI */
    addressShort: string
    phone: {
      display: string
      /** E.164 for tel: links */
      tel: string
    }
    whatsapp: {
      /** Digits only, international format — used to build wa.me links */
      number: string
      display: string
      /** Default conversation opener */
      opener: string
      note: string
    }
    maps: {
      listingUrl: string
      directionsUrl: string
      lat: number
      lng: number
      osmEmbedUrl: string
      osmLink: string
    }
    /** Set false to hide the "Opening hours" row entirely */
    hasOpeningHours: boolean
    openingHours: string
    email: string
    hasEmail: boolean
  }

  menu: NavItem[]

  home: {
    hero: {
      eyebrow: string
      headline: string
      /** Second line, rendered in italic bronze */
      headlineAccent: string
      subhead: string
      image: ContentImage
      /** Small badge over the image, e.g. "Reference imagery" */
      imageNote: string
      primaryCtaLabel: string
      secondaryCtaLabel: string
    }
    capability: {
      enabled: boolean
    }
  }

  about: {
    hero: {
      eyebrow: string
      breadcrumb: string
      heading: string
      headingAccent: string
      intro: string
    }
    /** Compact About block on the home page */
    preview: {
      eyebrow: string
      heading: string
      headingAccent: string
      paragraphs: string[]
      pillars: { title: string; body: string }[]
      linkLabel: string
      note: string
    }
    sectionHeading: string
    sectionHeadingAccent: string
    paragraphs: string[]
    imageSmall: ContentImage
    imageLarge: ContentImage
    imageNote: string
    principlesHeading: string
    principles: { title: string; body: string }[]
    missionLabel: string
    mission: string
    visionLabel: string
    vision: string
    photographyLabel: string
    photographyCaption: string
    note: string
  }

  services: {
    eyebrow: string
    heading: string
    headingAccent: string
    intro: string
    notice: string
    items: ServiceItem[]
  }

  projects: {
    eyebrow: string
    heading: string
    headingAccent: string
    intro: string
    homeHeading: string
    homeHeadingAccent: string
    homeIntro: string
    notice: string
    categories: CategoryDef[]
    items: ProjectItem[]
  }

  process: {
    eyebrow: string
    heading: string
    headingAccent: string
    intro: string
    notice: string
    stages: ProcessStage[]
  }

  reviews: {
    eyebrow: string
    heading: string
    headingAccent: string
    intro: string
    rating: {
      value: number
      count: number
      max: number
      source: string
      sourceUrl: string
      note: string
    }
    excerpts: ReviewExcerpt[]
  }

  faqs: {
    eyebrow: string
    heading: string
    headingAccent: string
    items: FaqItem[]
  }

  contact: {
    hero: {
      eyebrow: string
      breadcrumb: string
      heading: string
      headingAccent: string
      intro: string
    }
    inquiry: {
      eyebrow: string
      heading: string
      headingAccent: string
      intro: string
      submitLabel: string
    }
  }

  consultation: {
    hero: {
      eyebrow: string
      breadcrumb: string
      heading: string
      headingAccent: string
      intro: string
    }
    eyebrow: string
    heading: string
    headingAccent: string
    intro: string
    notice: string
    submitLabel: string
  }

  /** Editable CTA bands, one per place they appear */
  cta: {
    contactBand: CtaBandContent
    about: CtaBandContent
    services: CtaBandContent
    projects: CtaBandContent
    consultation: CtaBandContent
    projectDetail: { heading: string; body: string }
  }

  privacy: {
    eyebrow: string
    breadcrumb: string
    heading: string
    headingAccent: string
    intro: string
    sections: { heading: string; paragraphs: string[] }[]
    note: string
  }

  footer: {
    intro: string
    tagline: string
  }

  forms: {
    serviceOptions: string[]
    projectTypeOptions: string[]
    budgetOptions: string[]
    timeOptions: string[]
  }
}

/** Shape returned by GET /api/content */
export type ContentResponse = {
  content: SiteContent
  /** ISO timestamp of the last successful save */
  updatedAt: string
}

export type SubmissionKind = 'inquiry' | 'consultation'

export type Submission = {
  id: string
  kind: SubmissionKind
  createdAt: string
  read: boolean
  archived: boolean
  /** Normalised payload — free-text fields are plain strings */
  data: Record<string, string | boolean>
  meta: { ip?: string; userAgent?: string }
}

export type MediaFile = {
  name: string
  url: string
  bytes: number
  uploadedAt: string
  width?: number
  height?: number
}
