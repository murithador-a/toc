import { useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { Container } from '../ui/Container'
import { Button, ButtonLink } from '../ui/Button'
import { submitOnEnter } from '../../lib/formSubmit'
import { Alert } from '../ui/Alert'
import { CheckboxField, Field, SelectInput, TextArea, TextInput } from '../ui/Field'
import { Notice } from '../ui/Notice'
import { ArrowRight, Check, Loader, Phone, WhatsApp } from '../ui/icons'
import { useContent } from '../../content/context'
import {
  emptyConsultation,
  hasErrors,
  serviceOptions,
  timePreferenceOptions,
  toConsultationPayload,
  validateConsultation,
  type ConsultationValues,
  type Errors,
} from '../../lib/forms'
import { consultationWhatsAppMessage, whatsappUrl } from '../../lib/whatsapp'
import { configured, integrationSummary } from '../../lib/integrations'
import { markSubmitted, recentlySubmitted, submitConsultation } from '../../lib/submit'

type Status = 'idle' | 'submitting' | 'sent' | 'fallback' | 'error' | 'duplicate'

const fieldOrder: (keyof ConsultationValues)[] = [
  'fullName',
  'phone',
  'email',
  'service',
  'preferredDate',
  'preferredTime',
  'location',
  'notes',
]

export function ConsultationForm() {
  const content = useContent()
  const company = content.company
  const copy = content.consultation
  const options = useMemo(
    () => ({ services: serviceOptions(), times: timePreferenceOptions() }),
    [content],
  )
  const [values, setValues] = useState<ConsultationValues>(emptyConsultation)
  const [errors, setErrors] = useState<Errors<ConsultationValues>>({})
  const [status, setStatus] = useState<Status>('idle')
  const [message, setMessage] = useState('')
  const [copied, setCopied] = useState(false)
  const [reference, setReference] = useState<string | null>(null)
  const summaryRef = useRef<HTMLDivElement | null>(null)

  const requestMessage = useMemo(() => consultationWhatsAppMessage(values), [values])

  const update = <K extends keyof ConsultationValues>(key: K, value: ConsultationValues[K]) => {
    setValues((current) => ({ ...current, [key]: value }))
    setErrors((current) => ({ ...current, [key]: undefined }))
  }

  const onSubmit = async (event?: React.FormEvent<HTMLFormElement>) => {
    event?.preventDefault()
    setMessage('')
    setCopied(false)

    if (values.companyWebsite.trim()) return

    const nextErrors = validateConsultation(values)
    if (hasErrors(nextErrors)) {
      setErrors(nextErrors)
      setStatus('idle')
      window.requestAnimationFrame(() => {
        summaryRef.current?.focus()
        const firstKey =
          fieldOrder.find((key) => nextErrors[key]) ?? (nextErrors.consent ? 'consent' : undefined)
        if (firstKey) {
          const id = `consultation-${firstKey === 'fullName' ? 'name' : firstKey}`
          document.getElementById(id)?.focus()
        }
      })
      return
    }

    if (recentlySubmitted('consultation')) {
      setStatus('duplicate')
      return
    }

    setErrors({})
    setStatus('submitting')
    const outcome = await submitConsultation(toConsultationPayload(values))

    if (outcome.status === 'sent') {
      markSubmitted('consultation')
      setReference(outcome.reference ?? null)
      setStatus('sent')
      return
    }
    if (outcome.status === 'fallback') {
      setStatus('fallback')
      return
    }
    setStatus('error')
    setMessage(outcome.message)
  }

  const copyMessage = async () => {
    try {
      await navigator.clipboard.writeText(requestMessage)
      setCopied(true)
    } catch {
      setCopied(false)
    }
  }

  const errorCount = Object.values(errors).filter(Boolean).length

  return (
    <section
      id="consultation"
      className="scroll-mt-24 border-t border-charcoal/10 bg-white py-section lg:py-section-lg"
      aria-labelledby="consultation-heading"
    >
      <Container>
        <div className="grid gap-12 lg:grid-cols-12 lg:gap-16">
          <div className="lg:col-span-4">
            <p className="flex items-center gap-3 font-sans text-[0.625rem] font-semibold uppercase tracking-eyebrow text-bronze">
              <span aria-hidden="true" className="h-px w-8 bg-bronze" />
              {copy.eyebrow}
            </p>
            <h2 id="consultation-heading" className="mt-6 font-display text-display-sm text-charcoal sm:text-display">
              {copy.heading}
              {copy.headingAccent ? <span className="italic text-bronze">{copy.headingAccent}</span> : null}
            </h2>
            {copy.intro ? (
              <p className="mt-6 font-sans text-[1rem] leading-relaxed text-stone-600">{copy.intro}</p>
            ) : null}

            {copy.notice ? (
              <Notice className="mt-8" label="This is a request, not a booking.">
                {copy.notice}
              </Notice>
            ) : null}

            <dl className="mt-8 space-y-5 border-t border-charcoal/10 pt-7 font-sans text-[0.875rem]">
              <div>
                <dt className="text-[0.625rem] uppercase tracking-eyebrow text-stone-500">Call the office</dt>
                <dd className="mt-2">
                  <a
                    href={`tel:${company.phone.tel}`}
                    className="inline-flex items-center gap-2 text-charcoal underline-offset-4 hover:text-bronze hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-bronze focus-visible:ring-offset-4"
                  >
                    <Phone className="h-4 w-4 text-bronze" />
                    {company.phone.display}
                  </a>
                </dd>
              </div>
            </dl>

            {import.meta.env.DEV ? (
              <Notice className="mt-8" label="Developer note —">
                {integrationSummary()}
              </Notice>
            ) : null}
          </div>

          <div className="lg:col-span-8 lg:pl-6">
            {status === 'sent' ? (
              <div className="border border-bronze/40 bg-ivory p-8 sm:p-10" role="status" aria-live="polite">
                <span className="inline-flex h-11 w-11 items-center justify-center border border-bronze/50 text-bronze">
                  <Check className="h-5 w-5" />
                </span>
                <h3 className="mt-6 font-display text-[2rem] text-charcoal">Consultation request received</h3>
                <p className="mt-4 max-w-prose font-sans text-[1rem] leading-relaxed text-stone-600">
                  Thank you, {values.fullName.trim().split(' ')[0] || 'there'}. We will review your preferred date and
                  contact you to confirm the actual time. Until then, nothing is booked.
                </p>
                {reference ? (
                  <p className="mt-2 font-sans text-[0.75rem] text-stone-500">Reference: {reference.slice(0, 8)}</p>
                ) : null}
                <div className="mt-8 flex flex-wrap gap-3">
                  <ButtonLink
                    to={whatsappUrl(requestMessage)}
                    external
                    variant="primary"
                    icon={<WhatsApp className="h-4 w-4" />}
                  >
                    Add details on WhatsApp
                  </ButtonLink>
                  <ButtonLink to="/projects" variant="outline" icon={<ArrowRight className="h-4 w-4" />}>
                    Browse the portfolio
                  </ButtonLink>
                </div>
              </div>
            ) : status === 'fallback' || status === 'error' || status === 'duplicate' ? (
              <div className="border border-charcoal/15 bg-ivory p-8 sm:p-10">
                {status === 'duplicate' ? (
                  <Alert variant="info" title="This request was just submitted">
                    We received the same request a moment ago. Send another on WhatsApp if you need to change
                    anything.
                  </Alert>
                ) : status === 'error' ? (
                  <Alert variant="error" title="We could not send the request">
                    {message || 'Something went wrong when sending your request.'} You can send it on WhatsApp
                    instead — your details are ready.
                  </Alert>
                ) : (
                  <Alert variant="info" title="Nothing has been sent yet">
                    Online submission is not connected to a delivery service on this deployment. Continue on WhatsApp
                    to send this request directly to {company.legalName}.
                  </Alert>
                )}

                <h3 className="mt-8 font-display text-[1.75rem] text-charcoal">Send this request on WhatsApp</h3>
                <p className="mt-3 max-w-prose font-sans text-[0.9375rem] leading-relaxed text-stone-600">
                  Review the prepared message, then open WhatsApp and send it yourself. Requests are not appointments
                  until a time is confirmed with you.
                </p>

                <details className="mt-6 border border-charcoal/10 bg-white p-5">
                  <summary className="cursor-pointer font-sans text-[0.75rem] font-semibold uppercase tracking-eyebrow text-charcoal focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-bronze focus-visible:ring-offset-2">
                    Preview the message
                  </summary>
                  <pre className="mt-4 max-h-64 overflow-auto whitespace-pre-wrap break-words font-sans text-[0.8125rem] leading-relaxed text-stone-600">
                    {requestMessage}
                  </pre>
                  <Button variant="outline" className="mt-4" type="button" onClick={copyMessage}>
                    {copied ? 'Copied' : 'Copy message'}
                  </Button>
                </details>

                <div className="mt-8 flex flex-wrap gap-3">
                  <ButtonLink
                    to={whatsappUrl(requestMessage)}
                    external
                    variant="primary"
                    icon={<WhatsApp className="h-4 w-4" />}
                  >
                    Open WhatsApp with this request
                  </ButtonLink>
                  <ButtonLink to={`tel:${company.phone.tel}`} external variant="outline" icon={<Phone className="h-4 w-4" />}>
                    Call instead
                  </ButtonLink>
                  <Button variant="link" type="button" onClick={() => setStatus('idle')}>
                    Edit the form
                  </Button>
                </div>
              </div>
            ) : (
              <form
                onSubmit={onSubmit}
                onKeyDown={submitOnEnter(() => void onSubmit())}
                noValidate
                className="space-y-7"
              >
                <div ref={summaryRef} tabIndex={-1} aria-live="assertive" className={errorCount > 0 ? '' : 'sr-only'}>
                  {errorCount > 0 ? (
                    <Alert variant="error" title={`Please correct ${errorCount} ${errorCount === 1 ? 'field' : 'fields'}`}>
                      The highlighted fields need attention before this can be sent.
                    </Alert>
                  ) : null}
                </div>

                <div className="grid gap-7 sm:grid-cols-2">
                  <Field id="consultation-name" label="Full name" required error={errors.fullName}>
                    <TextInput
                      id="consultation-name"
                      name="name"
                      autoComplete="name"
                      value={values.fullName}
                      onChange={(event) => update('fullName', event.target.value)}
                      invalid={Boolean(errors.fullName)}
                      error={errors.fullName}
                      required
                    />
                  </Field>
                  <Field id="consultation-phone" label="Phone number" required error={errors.phone}>
                    <TextInput
                      id="consultation-phone"
                      name="phone"
                      type="tel"
                      inputMode="tel"
                      autoComplete="tel"
                      value={values.phone}
                      onChange={(event) => update('phone', event.target.value)}
                      invalid={Boolean(errors.phone)}
                      error={errors.phone}
                      required
                    />
                  </Field>
                </div>

                <Field id="consultation-email" label="Email address" hint="Optional." error={errors.email}>
                  <TextInput
                    id="consultation-email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    value={values.email}
                    onChange={(event) => update('email', event.target.value)}
                    invalid={Boolean(errors.email)}
                    error={errors.email}
                  />
                </Field>

                <div className="grid gap-7 sm:grid-cols-3">
                  <Field id="consultation-service" label="Service of interest" required error={errors.service}>
                    <SelectInput
                      id="consultation-service"
                      name="service"
                      value={values.service}
                      onChange={(event) => update('service', event.target.value)}
                      invalid={Boolean(errors.service)}
                      error={errors.service}
                      required
                    >
                      <option value="">Select a service</option>
                      {options.services.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </SelectInput>
                  </Field>
                  <Field id="consultation-preferredDate" label="Preferred date" required error={errors.preferredDate}>
                    <TextInput
                      id="consultation-preferredDate"
                      name="preferredDate"
                      type="date"
                      min={new Date().toISOString().slice(0, 10)}
                      value={values.preferredDate}
                      onChange={(event) => update('preferredDate', event.target.value)}
                      invalid={Boolean(errors.preferredDate)}
                      error={errors.preferredDate}
                      required
                    />
                  </Field>
                  <Field
                    id="consultation-preferredTime"
                    label="Preferred time"
                    required
                    hint="A preference only."
                    error={errors.preferredTime}
                  >
                    <SelectInput
                      id="consultation-preferredTime"
                      name="preferredTime"
                      value={values.preferredTime}
                      onChange={(event) => update('preferredTime', event.target.value)}
                      invalid={Boolean(errors.preferredTime)}
                      error={errors.preferredTime}
                      required
                    >
                      <option value="">Select a band</option>
                      {options.times.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </SelectInput>
                  </Field>
                </div>

                <Field
                  id="consultation-location"
                  label="Project location"
                  required
                  hint="Where is the site or proposed site?"
                  error={errors.location}
                >
                  <TextInput
                    id="consultation-location"
                    name="location"
                    value={values.location}
                    onChange={(event) => update('location', event.target.value)}
                    invalid={Boolean(errors.location)}
                    error={errors.location}
                    required
                  />
                </Field>

                <Field
                  id="consultation-notes"
                  label="Additional notes"
                  hint="Anything you would like us to look at before the conversation — scope, drawings, budget direction."
                  error={errors.notes}
                >
                  <TextArea
                    id="consultation-notes"
                    name="notes"
                    rows={5}
                    maxLength={2000}
                    value={values.notes}
                    onChange={(event) => update('notes', event.target.value)}
                  />
                </Field>

                <div aria-hidden="true" className="hidden">
                  <label htmlFor="consultation-companyWebsite">Company website</label>
                  <input
                    id="consultation-companyWebsite"
                    name="companyWebsite"
                    tabIndex={-1}
                    autoComplete="off"
                    value={values.companyWebsite}
                    onChange={(event) => update('companyWebsite', event.target.value)}
                  />
                </div>

                <CheckboxField
                  id="consultation-consent"
                  checked={values.consent}
                  onChange={(checked) => update('consent', checked)}
                  invalid={Boolean(errors.consent)}
                  error={errors.consent}
                >
                  I understand this is a consultation request only, that my details are used to arrange it, and that
                  nothing is stored on this website. See the{' '}
                  <Link to="/privacy" className="underline underline-offset-4 hover:text-charcoal">
                    privacy policy
                  </Link>
                  .
                </CheckboxField>

                <div className="flex flex-wrap items-center gap-5 border-t border-charcoal/10 pt-7">
                  <Button
                    type="button"
                    onClick={() => void onSubmit()}
                    variant="primary"
                    size="lg"
                    disabled={status === 'submitting'}
                  >
                    {status === 'submitting' ? (
                      <>
                        Sending
                        <Loader className="h-4 w-4" />
                      </>
                    ) : (
                      <>
                        {configured.consultation ? copy.submitLabel : 'Continue'}
                        <ArrowRight className="h-4 w-4" />
                      </>
                    )}
                  </Button>
                  <p className="font-sans text-[0.75rem] leading-relaxed text-stone-500">
                    {configured.consultation
                      ? 'Your request goes to TOC Luxury Constructions and appears in the company admin inbox.'
                      : 'Submitting prepares a WhatsApp message you can review and send yourself.'}
                  </p>
                </div>
              </form>
            )}
          </div>
        </div>
      </Container>
    </section>
  )
}
