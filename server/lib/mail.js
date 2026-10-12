import { config } from './config.js'

/**
 * Optional outbound mail — used only for password resets.
 * ---------------------------------------------------------------------------
 * Two independent ways to send, both configured by environment variable and both
 * off unless asked for:
 *
 *   SMTP_URL           smtp://user:pass@host:587 — sent with nodemailer when it
 *                      is installed (npm install nodemailer). The import is
 *                      dynamic, so a deployment that does not use mail never
 *                      pays for it, and a missing package is reported rather
 *                      than thrown.
 *   RESET_WEBHOOK_URL  POSTs {to, subject, text} as JSON to your own relay
 *                      (Zapier, Make, a Cloudflare Worker…). No dependency.
 *
 * Nothing here ever sends anything except a password-reset code. Enquiries are
 * not emailed — they go to the inbox.
 */

export const mailConfigured = () => Boolean(config.smtpUrl || config.resetWebhookUrl)

/** Which mechanism is configured, for honest reporting in the UI. */
export const mailTransport = () => (config.smtpUrl ? 'smtp' : config.resetWebhookUrl ? 'webhook' : 'none')

export const sendResetEmail = async ({ to, code, minutes, siteUrl }) => {
  if (!mailConfigured()) return { delivered: false, reason: 'not-configured' }
  if (!to) return { delivered: false, reason: 'no-address' }

  const subject = 'Your TOC Luxury Constructions admin reset code'
  const text = [
    `A password reset was requested for the ${siteUrl} admin area.`,
    '',
    `Reset code: ${code}`,
    `It expires in ${minutes} minutes and can be used once.`,
    '',
    'If you did not ask for this, ignore this message — the code expires on its own.',
  ].join('\n')

  if (config.resetWebhookUrl) {
    try {
      const response = await fetch(config.resetWebhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ to, subject, text, code }),
      })
      if (!response.ok) return { delivered: false, reason: `webhook-${response.status}` }
      return { delivered: true, via: 'webhook' }
    } catch (error) {
      return { delivered: false, reason: 'webhook-failed', message: String(error?.message ?? error) }
    }
  }

  try {
    const nodemailer = await import('nodemailer')
    const transport = nodemailer.default?.createTransport
      ? nodemailer.default.createTransport(config.smtpUrl)
      : nodemailer.createTransport(config.smtpUrl)
    await transport.sendMail({ from: config.mailFrom || `no-reply@${new URL(siteUrl).hostname}`, to, subject, text })
    return { delivered: true, via: 'smtp' }
  } catch (error) {
    const missing = String(error?.code ?? '') === 'ERR_MODULE_NOT_FOUND'
    return { delivered: false, reason: missing ? 'nodemailer-missing' : 'smtp-failed', message: String(error?.message ?? error) }
  }
}
