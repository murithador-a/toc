/**
 * Content validation.
 * ---------------------------------------------------------------------------
 * A deliberately readable guard rather than a full schema library: it enforces
 * the document's shape, types, length caps and enumerations so a malformed or
 * hostile save cannot corrupt the content file or blow it up in size.
 */

const MAX_TEXT = 8000
const MAX_ARRAY = 60

const isPlainObject = (value) => Boolean(value) && typeof value === 'object' && !Array.isArray(value)

const checkString = (value, label, errors, { max = MAX_TEXT, required = true } = {}) => {
  if (value === undefined || value === null) {
    if (required) errors.push(`${label} is required`)
    return
  }
  if (typeof value !== 'string') errors.push(`${label} must be text`)
  else if (value.length > max) errors.push(`${label} is longer than ${max} characters`)
}

const checkStringArray = (value, label, errors, { max = MAX_ARRAY } = {}) => {
  if (!Array.isArray(value)) {
    errors.push(`${label} must be a list`)
    return
  }
  if (value.length > max) errors.push(`${label} has more than ${max} entries`)
  value.forEach((entry, index) => checkString(entry, `${label}[${index}]`, errors, { max: 4000 }))
}

const checkImage = (value, label, errors) => {
  if (!isPlainObject(value)) {
    errors.push(`${label} must be an image object`)
    return
  }
  checkString(value.src, `${label}.src`, errors, { max: 500 })
  checkString(value.alt, `${label}.alt`, errors, { max: 400 })
  if (value.src && !/^(https?:\/\/|\/)/.test(value.src)) errors.push(`${label}.src must be a path or absolute URL`)
}

const checkObjectArray = (value, label, errors, validateEntry) => {
  if (!Array.isArray(value)) {
    errors.push(`${label} must be a list`)
    return
  }
  if (value.length > MAX_ARRAY) errors.push(`${label} has more than ${MAX_ARRAY} entries`)
  value.forEach((entry, index) => {
    if (!isPlainObject(entry)) {
      errors.push(`${label}[${index}] must be an object`)
      return
    }
    validateEntry(entry, `${label}[${index}]`, errors)
  })
}

const SECTIONS = [
  'meta', 'seo', 'company', 'menu', 'home', 'about', 'services', 'projects',
  'process', 'reviews', 'faqs', 'contact', 'consultation', 'cta', 'footer', 'forms', 'privacy',
]

export const validateSectionName = (name) => SECTIONS.includes(name)

export const validateContent = (content) => {
  const errors = []
  if (!isPlainObject(content)) return { ok: false, errors: ['Content must be an object'] }

  for (const section of SECTIONS) {
    if (content[section] === undefined) errors.push(`Missing section: ${section}`)
  }

  if (isPlainObject(content.seo)) {
    checkString(content.seo.siteUrl, 'seo.siteUrl', errors, { max: 300 })
    checkString(content.seo.defaultTitle, 'seo.defaultTitle', errors, { max: 200 })
    checkString(content.seo.defaultDescription, 'seo.defaultDescription', errors, { max: 400 })
  } else errors.push('seo must be an object')

  if (isPlainObject(content.company)) {
    const c = content.company
    checkString(c.legalName, 'company.legalName', errors, { max: 160 })
    checkString(c.phone?.display, 'company.phone.display', errors, { max: 40 })
    checkString(c.phone?.tel, 'company.phone.tel', errors, { max: 40 })
    checkString(c.whatsapp?.number, 'company.whatsapp.number', errors, { max: 20 })
    if (c.whatsapp?.number && !/^\d{8,15}$/.test(c.whatsapp.number))
      errors.push('company.whatsapp.number must be digits only, in international format')
    checkString(c.addressFull, 'company.addressFull', errors, { max: 300 })
    checkString(c.email, 'company.email', errors, { max: 200, required: false })
    if (c.maps) {
      checkString(c.maps.listingUrl, 'company.maps.listingUrl', errors, { max: 400 })
      checkString(c.maps.directionsUrl, 'company.maps.directionsUrl', errors, { max: 500 })
      for (const key of ['lat', 'lng']) {
        if (typeof c.maps[key] !== 'number' || Number.isNaN(c.maps[key])) errors.push(`company.maps.${key} must be a number`)
      }
    } else errors.push('company.maps must be an object')
  } else errors.push('company must be an object')

  checkObjectArray(content.menu, 'menu', errors, (entry, label, list) => {
    checkString(entry.label, `${label}.label`, list, { max: 40 })
    checkString(entry.to, `${label}.to`, list, { max: 120 })
  })

  if (isPlainObject(content.home?.hero)) checkImage(content.home.hero.image, 'home.hero.image', errors)
  else errors.push('home.hero must be an object')

  if (isPlainObject(content.about)) {
    checkImage(content.about.imageSmall, 'about.imageSmall', errors)
    checkImage(content.about.imageLarge, 'about.imageLarge', errors)
    checkStringArray(content.about.paragraphs, 'about.paragraphs', errors)
  } else errors.push('about must be an object')

  if (isPlainObject(content.services)) {
    checkObjectArray(content.services.items, 'services.items', errors, (entry, label, list) => {
      checkString(entry.slug, `${label}.slug`, list, { max: 80 })
      checkString(entry.title, `${label}.title`, list, { max: 160 })
      checkString(entry.summary, `${label}.summary`, list, { max: 600 })
      checkStringArray(entry.body, `${label}.body`, list)
      checkStringArray(entry.scope, `${label}.scope`, list)
      checkImage(entry.image, `${label}.image`, list)
    })
  } else errors.push('services must be an object')

  if (isPlainObject(content.projects)) {
    const categories = Array.isArray(content.projects.categories) ? content.projects.categories.map((c) => c.key) : []
    checkObjectArray(content.projects.categories, 'projects.categories', errors, (entry, label, list) => {
      checkString(entry.key, `${label}.key`, list, { max: 60 })
      checkString(entry.label, `${label}.label`, list, { max: 80 })
    })
    checkObjectArray(content.projects.items, 'projects.items', errors, (entry, label, list) => {
      checkString(entry.slug, `${label}.slug`, list, { max: 80 })
      if (entry.slug && !/^[a-z0-9-]+$/.test(entry.slug)) list.push(`${label}.slug may only contain lowercase letters, numbers and hyphens`)
      checkString(entry.title, `${label}.title`, list, { max: 160 })
      checkString(entry.summary, `${label}.summary`, list, { max: 600 })
      if (!['draft', 'published'].includes(entry.status)) list.push(`${label}.status must be "draft" or "published"`)
      if (categories.length && !categories.includes(entry.category)) list.push(`${label}.category must match a defined category`)
      if (typeof entry.order !== 'number') list.push(`${label}.order must be a number`)
      checkStringArray(entry.description, `${label}.description`, list)
      checkStringArray(entry.scope, `${label}.scope`, list)
      checkImage(entry.cover, `${label}.cover`, list)
      if (!Array.isArray(entry.gallery)) list.push(`${label}.gallery must be a list`)
      else entry.gallery.forEach((img, index) => checkImage(img, `${label}.gallery[${index}]`, list))
    })
  } else errors.push('projects must be an object')

  if (isPlainObject(content.process)) {
    checkObjectArray(content.process.stages, 'process.stages', errors, (entry, label, list) => {
      checkString(entry.title, `${label}.title`, list, { max: 120 })
      checkString(entry.description, `${label}.description`, list, { max: 1200 })
      checkString(entry.outcome, `${label}.outcome`, list, { max: 400 })
    })
  } else errors.push('process must be an object')

  if (isPlainObject(content.reviews)) {
    const rating = content.reviews.rating
    if (!isPlainObject(rating)) errors.push('reviews.rating must be an object')
    else {
      if (typeof rating.value !== 'number' || rating.value < 0 || rating.value > 5) errors.push('reviews.rating.value must be between 0 and 5')
      if (typeof rating.count !== 'number' || rating.count < 0) errors.push('reviews.rating.count must be a positive number')
      checkString(rating.source, 'reviews.rating.source', errors, { max: 80 })
    }
    checkObjectArray(content.reviews.excerpts, 'reviews.excerpts', errors, (entry, label, list) => {
      checkString(entry.author, `${label}.author`, list, { max: 120 })
      checkString(entry.quote, `${label}.quote`, list, { max: 1200 })
      checkString(entry.verifiedBy, `${label}.verifiedBy`, list, { max: 120 })
      checkString(entry.verifiedOn, `${label}.verifiedOn`, list, { max: 40 })
    })
  } else errors.push('reviews must be an object')

  if (isPlainObject(content.faqs)) {
    checkObjectArray(content.faqs.items, 'faqs.items', errors, (entry, label, list) => {
      checkString(entry.question, `${label}.question`, list, { max: 300 })
      checkString(entry.answer, `${label}.answer`, list, { max: 3000 })
    })
  } else errors.push('faqs must be an object')

  if (isPlainObject(content.forms)) {
    checkStringArray(content.forms.serviceOptions, 'forms.serviceOptions', errors)
    checkStringArray(content.forms.projectTypeOptions, 'forms.projectTypeOptions', errors)
    checkStringArray(content.forms.budgetOptions, 'forms.budgetOptions', errors)
    checkStringArray(content.forms.timeOptions, 'forms.timeOptions', errors)
  } else errors.push('forms must be an object')

  if (isPlainObject(content.privacy)) {
    checkObjectArray(content.privacy.sections, 'privacy.sections', errors, (entry, label, list) => {
      checkString(entry.heading, `${label}.heading`, list, { max: 200 })
      checkStringArray(entry.paragraphs, `${label}.paragraphs`, list)
    })
  } else errors.push('privacy must be an object')

  return { ok: errors.length === 0, errors }
}

/* ------------------------------------------------------------- submissions */

const trim = (value, max) => (typeof value === 'string' ? value.replace(/\s+/g, ' ').trim().slice(0, max) : '')
const trimMultiline = (value, max) =>
  typeof value === 'string' ? value.replace(/[ \t]+/g, ' ').replace(/\n{3,}/g, '\n\n').trim().slice(0, max) : ''

export const sanitiseInquiry = (body = {}) => ({
  fullName: trim(body.fullName, 120),
  phone: trim(body.phone, 32),
  email: trim(body.email, 254),
  service: trim(body.service, 120),
  location: trim(body.location, 160),
  projectType: trim(body.projectType, 120),
  budget: trim(body.budget, 80),
  preferredDate: trim(body.preferredDate, 20),
  description: trimMultiline(body.description, 2000),
  attachmentName: trim(body.attachmentName, 200),
  consent: body.consent === true || body.consent === 'true',
  submittedAt: trim(body.submittedAt, 40),
  source: 'website-inquiry-form',
})

export const validateInquiry = (data) => {
  const errors = []
  if (!data.fullName) errors.push('Full name is required')
  if (!data.phone) errors.push('Phone number is required')
  else if (!/^[+\d][\d\s()-]{6,24}$/.test(data.phone)) errors.push('Phone number is not valid')
  if (data.email && !/^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i.test(data.email)) errors.push('Email address is not valid')
  if (!data.service) errors.push('Service is required')
  if (!data.location) errors.push('Project location is required')
  if (!data.projectType) errors.push('Project type is required')
  if (!data.description || data.description.length < 20) errors.push('Project description is too short')
  if (!data.consent) errors.push('Consent is required')
  return errors
}

export const sanitiseConsultation = (body = {}) => ({
  fullName: trim(body.fullName, 120),
  phone: trim(body.phone, 32),
  email: trim(body.email, 254),
  service: trim(body.service, 120),
  preferredDate: trim(body.preferredDate, 20),
  preferredTime: trim(body.preferredTime, 40),
  location: trim(body.location, 160),
  notes: trimMultiline(body.notes, 2000),
  consent: body.consent === true || body.consent === 'true',
  submittedAt: trim(body.submittedAt, 40),
  source: 'website-consultation-request',
})

export const validateConsultation = (data) => {
  const errors = []
  if (!data.fullName) errors.push('Full name is required')
  if (!data.phone) errors.push('Phone number is required')
  else if (!/^[+\d][\d\s()-]{6,24}$/.test(data.phone)) errors.push('Phone number is not valid')
  if (data.email && !/^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i.test(data.email)) errors.push('Email address is not valid')
  if (!data.service) errors.push('Service is required')
  if (!data.preferredDate) errors.push('Preferred date is required')
  if (!data.preferredTime) errors.push('Preferred time is required')
  if (!data.location) errors.push('Project location is required')
  if (!data.consent) errors.push('Consent is required')
  return errors
}
