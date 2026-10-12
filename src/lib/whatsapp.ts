import { getContent } from '../content/store'
import { truncate } from './format'
import type { ConsultationValues, InquiryValues } from './forms'

/**
 * WhatsApp hand-off.
 * Messages are assembled here and URL-encoded with encodeURIComponent.
 * Nothing is ever sent automatically — the visitor opens the link themselves.
 */

export const whatsappUrl = (message?: string): string => {
  const { whatsapp } = getContent().company
  const text = message && message.trim() ? message : whatsapp.opener
  return `https://wa.me/${whatsapp.number}?text=${encodeURIComponent(text)}`
}

export const defaultWhatsAppUrl = (): string => whatsappUrl()

const line = (label: string, value?: string | null): string | null =>
  value && value.trim().length > 0 ? `${label}: ${value.trim()}` : null

/** Builds the pre-filled inquiry message. Personal details stay in the URL the
 *  visitor opens — they are never logged or reused by this site. */
export const inquiryWhatsAppMessage = (values: InquiryValues): string => {
  const rows = [
    `Hello ${getContent().company.legalName}. I would like to discuss a construction project.`,
    '',
    line('Name', values.fullName),
    line('Phone', values.phone),
    line('Email', values.email),
    line('Service required', values.service),
    line('Project type', values.projectType),
    line('Project location', values.location),
    line('Estimated budget', values.budget),
    line('Preferred consultation date', values.preferredDate),
    values.description.trim() ? `Project description:\n${truncate(values.description.trim(), 900)}` : null,
    values.attachmentName ? `Attachment to follow on WhatsApp: ${values.attachmentName}` : null,
    '',
    'Sent from the TOC Luxury Constructions website.',
  ].filter((row): row is string => row !== null)

  return truncate(rows.join('\n'), 1800)
}

export const consultationWhatsAppMessage = (values: ConsultationValues): string => {
  const rows = [
    `Hello ${getContent().company.legalName}. I would like to request a consultation.`,
    '',
    line('Name', values.fullName),
    line('Phone', values.phone),
    line('Email', values.email),
    line('Service of interest', values.service),
    line('Preferred date', values.preferredDate),
    line('Preferred time', values.preferredTime),
    line('Project location', values.location),
    values.notes.trim() ? `Additional notes:\n${truncate(values.notes.trim(), 700)}` : null,
    '',
    'This is a request only — I understand the appointment is not confirmed until TOC confirms a time.',
    'Sent from the TOC Luxury Constructions website.',
  ].filter((row): row is string => row !== null)

  return truncate(rows.join('\n'), 1800)
}
