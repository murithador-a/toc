import { getContent } from '../content/store'
import { digitsOnly, normaliseMultiline, normaliseText, todayIso } from './format'

/* ------------------------------------------------------------------ options */
/* All option lists come from content/site.json so the company can edit them. */

export const serviceOptions = (): string[] => getContent().forms.serviceOptions
export const projectTypeOptions = (): string[] => getContent().forms.projectTypeOptions
export const budgetOptions = (): string[] => getContent().forms.budgetOptions
export const timePreferenceOptions = (): string[] => getContent().forms.timeOptions

/* -------------------------------------------------------------------- types */

export type InquiryValues = {
  fullName: string
  phone: string
  email: string
  service: string
  location: string
  projectType: string
  budget: string
  preferredDate: string
  description: string
  attachmentName: string
  consent: boolean
  /** Bot trap — must stay empty */
  companyWebsite: string
}

export type ConsultationValues = {
  fullName: string
  phone: string
  email: string
  service: string
  preferredDate: string
  preferredTime: string
  location: string
  notes: string
  consent: boolean
  companyWebsite: string
}

export type Errors<T> = Partial<Record<keyof T, string>>

export const emptyInquiry: InquiryValues = {
  fullName: '',
  phone: '',
  email: '',
  service: '',
  location: '',
  projectType: '',
  budget: '',
  preferredDate: '',
  description: '',
  attachmentName: '',
  consent: false,
  companyWebsite: '',
}

export const emptyConsultation: ConsultationValues = {
  fullName: '',
  phone: '',
  email: '',
  service: '',
  preferredDate: '',
  preferredTime: '',
  location: '',
  notes: '',
  consent: false,
  companyWebsite: '',
}

/* --------------------------------------------------------------- validators */

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i

export const validatePhone = (value: string): string | null => {
  const cleaned = digitsOnly(value)
  if (!cleaned) return 'Enter a phone number so we can reach you.'
  if (cleaned.startsWith('+')) {
    const digits = cleaned.slice(1)
    if (/^234[789]\d{9}$/.test(digits)) return null
    if (/^\d{10,15}$/.test(digits)) return null
  } else {
    if (/^0[789]\d{9}$/.test(cleaned)) return null
    if (/^234[789]\d{9}$/.test(cleaned)) return null
    if (/^\d{10,15}$/.test(cleaned)) return null
  }
  return 'Enter a valid phone number, for example 0805 783 8376 or +234 805 783 8376.'
}

export const validateEmail = (value: string): string | null => {
  if (!value.trim()) return null // optional
  if (value.trim().length > 254) return 'That email address is too long.'
  if (!EMAIL_RE.test(value.trim())) return 'Enter a valid email address, for example name@example.com.'
  return null
}

const validateDate = (value: string): string | null => {
  if (!value) return null
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return 'Choose a valid date.'
  if (value < todayIso()) return 'Choose today or a later date.'
  return null
}

const requireText = (value: string, label: string, min = 2): string | null => {
  if (!value.trim()) return `Enter your ${label}.`
  if (value.trim().length < min) return `That ${label} looks too short.`
  return null
}

export const validateInquiry = (values: InquiryValues): Errors<InquiryValues> => {
  const errors: Errors<InquiryValues> = {}
  const nameError = requireText(values.fullName, 'full name')
  if (nameError) errors.fullName = nameError
  const phoneError = validatePhone(values.phone)
  if (phoneError) errors.phone = phoneError
  const emailError = validateEmail(values.email)
  if (emailError) errors.email = emailError
  if (!values.service) errors.service = 'Select the service you need.'
  const locationError = requireText(values.location, 'project location')
  if (locationError) errors.location = locationError
  if (!values.projectType) errors.projectType = 'Select the type of project.'
  const dateError = validateDate(values.preferredDate)
  if (dateError) errors.preferredDate = dateError
  if (!values.description.trim()) errors.description = 'Tell us briefly what you would like to build.'
  else if (values.description.trim().length < 20)
    errors.description = 'Add a little more detail — at least 20 characters.'
  if (!values.consent) errors.consent = 'Please confirm how your details will be used.'
  return errors
}

export const validateConsultation = (values: ConsultationValues): Errors<ConsultationValues> => {
  const errors: Errors<ConsultationValues> = {}
  const nameError = requireText(values.fullName, 'full name')
  if (nameError) errors.fullName = nameError
  const phoneError = validatePhone(values.phone)
  if (phoneError) errors.phone = phoneError
  const emailError = validateEmail(values.email)
  if (emailError) errors.email = emailError
  if (!values.service) errors.service = 'Select the service you are interested in.'
  const dateError = validateDate(values.preferredDate)
  if (dateError) errors.preferredDate = dateError
  else if (!values.preferredDate) errors.preferredDate = 'Choose a date you would prefer.'
  if (!values.preferredTime) errors.preferredTime = 'Choose a time preference.'
  const locationError = requireText(values.location, 'project location')
  if (locationError) errors.location = locationError
  if (!values.consent) errors.consent = 'Please confirm how your details will be used.'
  return errors
}

export const hasErrors = (errors: Record<string, string | undefined>): boolean =>
  Object.values(errors).some(Boolean)

/** Attachment rules applied in the browser; the server must re-validate. */
export const ATTACHMENT_RULES = {
  maxBytes: 10 * 1024 * 1024,
  accept: '.pdf,.jpg,.jpeg,.png,.webp,.heic',
  mimeTypes: ['application/pdf', 'image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif'],
}

export const validateAttachment = (file: File): string | null => {
  if (file.size > ATTACHMENT_RULES.maxBytes) return 'That file is larger than 10 MB. Please send a smaller file.'
  const extensionOk = ATTACHMENT_RULES.accept.split(',').some((ext) => file.name.toLowerCase().endsWith(ext))
  if (!extensionOk && !ATTACHMENT_RULES.mimeTypes.includes(file.type))
    return 'Attach a PDF or an image (JPG, PNG, WEBP or HEIC).'
  return null
}

/** Payload actually transmitted — normalised, free of the bot-trap field. */
export const toInquiryPayload = (values: InquiryValues) => ({
  fullName: normaliseText(values.fullName, 120),
  phone: normaliseText(values.phone, 32),
  email: normaliseText(values.email, 254),
  service: normaliseText(values.service, 120),
  location: normaliseText(values.location, 160),
  projectType: normaliseText(values.projectType, 120),
  budget: normaliseText(values.budget, 80),
  preferredDate: values.preferredDate,
  description: normaliseMultiline(values.description, 2000),
  attachmentName: normaliseText(values.attachmentName, 200),
  consent: values.consent,
  submittedAt: new Date().toISOString(),
})

export const toConsultationPayload = (values: ConsultationValues) => ({
  fullName: normaliseText(values.fullName, 120),
  phone: normaliseText(values.phone, 32),
  email: normaliseText(values.email, 254),
  service: normaliseText(values.service, 120),
  preferredDate: values.preferredDate,
  preferredTime: normaliseText(values.preferredTime, 40),
  location: normaliseText(values.location, 160),
  notes: normaliseMultiline(values.notes, 2000),
  consent: values.consent,
  submittedAt: new Date().toISOString(),
})
