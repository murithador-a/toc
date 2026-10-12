import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Container } from '../ui/Container'
import { Button, ButtonLink } from '../ui/Button'
import { submitOnEnter } from '../../lib/formSubmit'
import { Alert } from '../ui/Alert'
import { CheckboxField, Field, SelectInput, TextArea, TextInput } from '../ui/Field'
import { Notice } from '../ui/Notice'
import { ArrowRight, Check, Loader, Phone, WhatsApp } from '../ui/icons'
import { useContent } from '../../content/context'
import {
  ATTACHMENT_RULES,
  budgetOptions,
  emptyInquiry,
  hasErrors,
  projectTypeOptions,
  serviceOptions,
  toInquiryPayload,
  validateAttachment,
  validateInquiry,
  type Errors,
  type InquiryValues,
} from '../../lib/forms'
import { inquiryWhatsAppMessage, whatsappUrl } from '../../lib/whatsapp'
import { configured, integrationSummary } from '../../lib/integrations'
import { markSubmitted, recentlySubmitted, submitInquiry, uploadAttachments } from '../../lib/submit'

type Status = 'idle' | 'submitting' | 'sent' | 'fallback' | 'error' | 'duplicate'

const fieldOrder: (keyof InquiryValues)[] = [
  'fullName',
  'phone',
  'email',
  'service',
  'location',
  'projectType',
  'budget',
  'preferredDate',
  'description',
]

export function InquiryForm() {
  const content = useContent()
  const company = content.company
  const inquiryCopy = content.contact.inquiry
  const options = useMemo(
    () => ({
      services: serviceOptions(),
      projectTypes: projectTypeOptions(),
      budgets: budgetOptions(),
    }),
    [content],
  )
  const [searchParams] = useSearchParams()
  const [values, setValues] = useState<InquiryValues>(emptyInquiry)
  const [errors, setErrors] = useState<Errors<InquiryValues>>({})
  const [status, setStatus] = useState<Status>('idle')
  const [message, setMessage] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [fileError, setFileError] = useState('')
  const [copied, setCopied] = useState(false)
  const [reference, setReference] = useState<string | null>(null)
  const summaryRef = useRef<HTMLDivElement | null>(null)
  const liveRef = useRef<HTMLParagraphElement | null>(null)

  // Preselect the service when arriving from a service CTA (?service=…)
  useEffect(() => {
    const requested = searchParams.get('service')
    if (!requested) return
    const match = options.services.find((option) => option.toLowerCase() === requested.toLowerCase())
    if (match) setValues((current) => ({ ...current, service: match }))
  }, [searchParams, options.services])

  const requestMessage = useMemo(() => inquiryWhatsAppMessage(values), [values])

  const update = <K extends keyof InquiryValues>(key: K, value: InquiryValues[K]) => {
    setValues((current) => ({ ...current, [key]: value }))
    setErrors((current) => ({ ...current, [key]: undefined }))
  }

  const focusFirstError = (nextErrors: Errors<InquiryValues>) => {
    const firstKey = fieldOrder.find((key) => nextErrors[key]) ?? (nextErrors.consent ? 'consent' : undefined)
    if (!firstKey) return
    const element = document.getElementById(`inquiry-${firstKey === 'fullName' ? 'name' : firstKey}`)
    element?.focus()
    element?.scrollIntoView({ block: 'center', behavior: 'smooth' })
  }

  const handleFile = (nextFile: File | null) => {
    setFileError('')
    if (!nextFile) {
      setFile(null)
      update('attachmentName', '')
      return
    }
    const error = validateAttachment(nextFile)
    if (error) {
      setFileError(error)
      setFile(null)
      update('attachmentName', '')
      return
    }
    setFile(nextFile)
    update('attachmentName', nextFile.name)
  }

  const onSubmit = async (event?: React.FormEvent<HTMLFormElement>) => {
    event?.preventDefault()
    setMessage('')
    setCopied(false)

    if (values.companyWebsite.trim()) {
      // Bot trap: silently ignore, pretending success would be misleading but
      // this path is only reachable by automated submissions.
      return
    }

    const nextErrors = validateInquiry(values)
    if (hasErrors(nextErrors)) {
      setErrors(nextErrors)
      setStatus('idle')
      window.requestAnimationFrame(() => {
        summaryRef.current?.focus()
        focusFirstError(nextErrors)
      })
      return
    }

    if (recentlySubmitted('inquiry')) {
      setStatus('duplicate')
      return
    }

    setErrors({})
    setStatus('submitting')

    if (file && configured.uploads) {
      const upload = await uploadAttachments([file])
      if (!upload.ok) {
        setStatus('error')
        setMessage(upload.message ?? 'The attachment could not be uploaded.')
        return
      }
    }

    const outcome = await submitInquiry(toInquiryPayload(values))

    if (outcome.status === 'sent') {
      markSubmitted('inquiry')
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
    <section id="inquiry" className="scroll-mt-24 border-t border-charcoal/10 bg-white py-section lg:py-section-lg" aria-labelledby="inquiry-heading">
      <Container>
        <div className="grid gap-12 lg:grid-cols-12 lg:gap-16">
          <div className="lg:col-span-4">
            <p className="flex items-center gap-3 font-sans text-[0.625rem] font-semibold uppercase tracking-eyebrow text-bronze">
              <span aria-hidden="true" className="h-px w-8 bg-bronze" />
              {inquiryCopy.eyebrow}
            </p>
            <h2 id="inquiry-heading" className="mt-6 font-display text-display-sm text-charcoal sm:text-display">
              {inquiryCopy.heading}
              {inquiryCopy.headingAccent ? <span className="italic text-bronze">{inquiryCopy.headingAccent}</span> : null}
            </h2>
            {inquiryCopy.intro ? (
              <p className="mt-6 font-sans text-[1rem] leading-relaxed text-stone-600">
                {inquiryCopy.intro.replace(' * ', ' ')}{' '}
                <span className="text-bronze">*</span>
              </p>
            ) : null}

            <dl className="mt-8 space-y-5 border-t border-charcoal/10 pt-7 font-sans text-[0.875rem]">
              <div>
                <dt className="text-[0.625rem] uppercase tracking-eyebrow text-stone-500">Prefer to talk?</dt>
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
              <div>
                <dt className="text-[0.625rem] uppercase tracking-eyebrow text-stone-500">Prefer WhatsApp?</dt>
                <dd className="mt-2 font-sans text-[0.8125rem] leading-relaxed text-stone-600">
                  Complete the form and continue on WhatsApp — your details are pre-filled for you to review before
                  anything is sent.
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
                <h3 className="mt-6 font-display text-[2rem] text-charcoal">Your inquiry has been sent</h3>
                <p className="mt-4 max-w-prose font-sans text-[1rem] leading-relaxed text-stone-600">
                  Thank you, {values.fullName.trim().split(' ')[0] || 'there'}. Your request has reached{' '}
                  {company.legalName}. We will respond using the contact details you provided.
                </p>
                <p className="mt-4 max-w-prose font-sans text-[0.875rem] leading-relaxed text-stone-500">
                  Prefer to continue now? WhatsApp is the quickest way to send plans and photographs alongside this
                  request — the message is prepared for you but only sent when you send it in WhatsApp.
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
                    Continue on WhatsApp
                  </ButtonLink>
                  <ButtonLink to={`tel:${company.phone.tel}`} external variant="outline" icon={<Phone className="h-4 w-4" />}>
                    Call {company.phone.display}
                  </ButtonLink>
                </div>
              </div>
            ) : status === 'fallback' || status === 'error' || status === 'duplicate' ? (
              <div className="border border-charcoal/15 bg-ivory p-8 sm:p-10">
                {status === 'duplicate' ? (
                  <Alert variant="info" title="This inquiry was just submitted">
                    We received the same request a moment ago. If you need to add something, send it on WhatsApp
                    below and it will reach the same team.
                  </Alert>
                ) : status === 'error' ? (
                  <Alert variant="error" title="We could not send the form">
                    {message || 'Something went wrong when sending your request.'} You can continue on WhatsApp —
                    your details are ready to send.
                  </Alert>
                ) : (
                  <Alert variant="info" title="Nothing has been sent yet">
                    Online submission is not connected to a delivery service on this deployment, so this website does
                    not transmit or store what you typed. Continue on WhatsApp to send it directly to{' '}
                    {company.legalName}.
                  </Alert>
                )}

                <h3 className="mt-8 font-display text-[1.75rem] text-charcoal">Send these details on WhatsApp</h3>
                <p className="mt-3 max-w-prose font-sans text-[0.9375rem] leading-relaxed text-stone-600">
                  Review the prepared message below. Nothing is sent automatically — you stay in control of what is
                  shared, and the conversation moves to WhatsApp once you press send there.
                </p>

                <details className="mt-6 border border-charcoal/10 bg-white p-5">
                  <summary className="cursor-pointer font-sans text-[0.75rem] font-semibold uppercase tracking-eyebrow text-charcoal focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-bronze focus-visible:ring-offset-2">
                    Preview the message
                  </summary>
                  <pre className="mt-4 max-h-64 overflow-auto whitespace-pre-wrap break-words font-sans text-[0.8125rem] leading-relaxed text-stone-600">
                    {requestMessage}
                  </pre>
                  <Button variant="outline" className="mt-4" onClick={copyMessage} type="button">
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
                    Open WhatsApp with these details
                  </ButtonLink>
                  <ButtonLink to={`tel:${company.phone.tel}`} external variant="outline" icon={<Phone className="h-4 w-4" />}>
                    Call instead
                  </ButtonLink>
                  <Button variant="link" type="button" onClick={() => setStatus('idle')}>
                    Edit the form
                  </Button>
                </div>
                <p className="mt-5 font-sans text-[0.75rem] leading-relaxed text-stone-500">{company.whatsapp.note}</p>
              </div>
            ) : (
              <form
                onSubmit={onSubmit}
                onKeyDown={submitOnEnter(() => void onSubmit())}
                noValidate
                className="space-y-7"
              >
                {/* Error summary */}
                <div
                  ref={summaryRef}
                  tabIndex={-1}
                  aria-live="assertive"
                  className={errorCount > 0 ? '' : 'sr-only'}
                >
                  {errorCount > 0 ? (
                    <Alert variant="error" title={`Please correct ${errorCount} ${errorCount === 1 ? 'field' : 'fields'}`}>
                      The highlighted fields need attention before this can be sent.
                    </Alert>
                  ) : null}
                </div>

                <div className="grid gap-7 sm:grid-cols-2">
                  <Field id="inquiry-name" label="Full name" required error={errors.fullName}>
                    <TextInput
                      id="inquiry-name"
                      name="name"
                      autoComplete="name"
                      placeholder="e.g. Adebola Ogundipe"
                      value={values.fullName}
                      onChange={(event) => update('fullName', event.target.value)}
                      invalid={Boolean(errors.fullName)}
                      error={errors.fullName}
                      required
                    />
                  </Field>

                  <Field id="inquiry-phone" label="Phone number" required error={errors.phone}>
                    <TextInput
                      id="inquiry-phone"
                      name="phone"
                      type="tel"
                      inputMode="tel"
                      autoComplete="tel"
                      placeholder="0805 783 8376"
                      value={values.phone}
                      onChange={(event) => update('phone', event.target.value)}
                      invalid={Boolean(errors.phone)}
                      error={errors.phone}
                      required
                    />
                  </Field>
                </div>

                <Field
                  id="inquiry-email"
                  label="Email address"
                  hint="Optional — add it if you would like a written reply."
                  error={errors.email}
                >
                  <TextInput
                    id="inquiry-email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    placeholder="name@example.com"
                    value={values.email}
                    onChange={(event) => update('email', event.target.value)}
                    invalid={Boolean(errors.email)}
                    error={errors.email}
                  />
                </Field>

                <div className="grid gap-7 sm:grid-cols-2">
                  <Field id="inquiry-service" label="Service required" required error={errors.service}>
                    <SelectInput
                      id="inquiry-service"
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

                  <Field
                    id="inquiry-location"
                    label="Project location"
                    required
                    hint="Town, area or street — whichever you know."
                    error={errors.location}
                  >
                    <TextInput
                      id="inquiry-location"
                      name="location"
                      placeholder="e.g. Agunbelewo, Osogbo"
                      value={values.location}
                      onChange={(event) => update('location', event.target.value)}
                      invalid={Boolean(errors.location)}
                      error={errors.location}
                      required
                    />
                  </Field>
                </div>

                <div className="grid gap-7 sm:grid-cols-3">
                  <Field id="inquiry-projectType" label="Project type" required error={errors.projectType}>
                    <SelectInput
                      id="inquiry-projectType"
                      name="projectType"
                      value={values.projectType}
                      onChange={(event) => update('projectType', event.target.value)}
                      invalid={Boolean(errors.projectType)}
                      error={errors.projectType}
                      required
                    >
                      <option value="">Select a type</option>
                      {options.projectTypes.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </SelectInput>
                  </Field>

                  <Field id="inquiry-budget" label="Estimated budget" error={errors.budget}>
                    <SelectInput
                      id="inquiry-budget"
                      name="budget"
                      value={values.budget}
                      onChange={(event) => update('budget', event.target.value)}
                    >
                      <option value="">Select a range</option>
                      {options.budgets.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </SelectInput>
                  </Field>

                  <Field
                    id="inquiry-preferredDate"
                    label="Preferred consultation date"
                    hint="We will confirm an actual time with you."
                    error={errors.preferredDate}
                  >
                    <TextInput
                      id="inquiry-preferredDate"
                      name="preferredDate"
                      type="date"
                      min={new Date().toISOString().slice(0, 10)}
                      value={values.preferredDate}
                      onChange={(event) => update('preferredDate', event.target.value)}
                      invalid={Boolean(errors.preferredDate)}
                      error={errors.preferredDate}
                    />
                  </Field>
                </div>

                <Field
                  id="inquiry-description"
                  label="Project description"
                  required
                  hint="What would you like to build, and what stage are you at? Drawings, approvals and site access are all useful to mention."
                  error={errors.description}
                >
                  <TextArea
                    id="inquiry-description"
                    name="description"
                    rows={6}
                    maxLength={2000}
                    placeholder="Describe the project: the site, what you want built, and anything already in place."
                    value={values.description}
                    onChange={(event) => update('description', event.target.value)}
                    invalid={Boolean(errors.description)}
                    error={errors.description}
                    required
                  />
                </Field>

                <Field
                  id="inquiry-attachment"
                  label="Project document or image"
                  hint={
                    configured.uploads
                      ? `PDF or image, up to ${ATTACHMENT_RULES.maxBytes / (1024 * 1024)} MB. Files are uploaded to a secure endpoint and validated again on the server.`
                      : 'Secure upload is not enabled on this deployment. Submit the form and send drawings or photographs on WhatsApp instead.'
                  }
                  error={fileError}
                >
                  <input
                    id="inquiry-attachment"
                    name="attachment"
                    type="file"
                    accept={ATTACHMENT_RULES.accept}
                    disabled={!configured.uploads}
                    onChange={(event) => handleFile(event.target.files?.[0] ?? null)}
                    aria-invalid={fileError ? true : undefined}
                    aria-describedby={fileError ? 'inquiry-attachment-error' : undefined}
                    className="w-full border border-stone-300 bg-white px-4 py-3 font-sans text-[0.875rem] text-charcoal file:mr-4 file:border-0 file:bg-charcoal file:px-4 file:py-2 file:font-sans file:text-[0.6875rem] file:uppercase file:tracking-eyebrow file:text-ivory hover:border-stone-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-bronze focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:bg-stone-100 disabled:text-stone-500"
                  />
                </Field>

                {/* Bot trap — hidden from people, tempting to scripts */}
                <div aria-hidden="true" className="hidden">
                  <label htmlFor="inquiry-companyWebsite">Company website</label>
                  <input
                    id="inquiry-companyWebsite"
                    name="companyWebsite"
                    tabIndex={-1}
                    autoComplete="off"
                    value={values.companyWebsite}
                    onChange={(event) => update('companyWebsite', event.target.value)}
                  />
                </div>

                <CheckboxField
                  id="inquiry-consent"
                  checked={values.consent}
                  onChange={(checked) => update('consent', checked)}
                  invalid={Boolean(errors.consent)}
                  error={errors.consent}
                >
                  I understand that my details will be used to respond to this inquiry, that nothing is stored on
                  this website, and that continuing on WhatsApp moves the conversation to WhatsApp. See the{' '}
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
                        {configured.inquiry ? inquiryCopy.submitLabel : 'Continue'}
                        <ArrowRight className="h-4 w-4" />
                      </>
                    )}
                  </Button>
                  <p ref={liveRef} aria-live="polite" className="sr-only">
                    {status === 'submitting' ? 'Sending your inquiry' : ''}
                  </p>
                  <p className="font-sans text-[0.75rem] leading-relaxed text-stone-500">
                    {configured.inquiry
                      ? 'Your details are sent to TOC Luxury Constructions and appear in the company admin inbox.'
                      : 'This form is not connected to a delivery service — submitting it prepares a WhatsApp message you can review first.'}
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
