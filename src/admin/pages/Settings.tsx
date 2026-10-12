import { useEffect, useState } from 'react'
import {
  ApiError,
  changePassword,
  getAccount,
  getHealth,
  restoreBackup,
  updateAccountEmail,
  type AccountState,
  type HealthResponse,
} from '../../lib/api'
import { useAdmin } from '../AdminProvider'
import { Button, Card, FieldRow, Grid, InlineNotice, TextInput } from '../ui'

/**
 * Account, backups and deployment facts.
 *
 * The deployment panel deliberately reports what is actually configured rather
 * than describing how to configure it, so nobody has to guess whether form
 * submissions are being stored.
 */
export function Settings() {
  const { savedAt, reloadContent, restoreLocal, backups } = useAdmin()
  const [health, setHealth] = useState<HealthResponse | null>(null)
  const [current, setCurrent] = useState('')
  const [next, setNext] = useState('')
  const [confirm, setConfirm] = useState('')
  const [message, setMessage] = useState<{ tone: 'info' | 'error'; text: string } | null>(null)
  const [busy, setBusy] = useState(false)
  const [restoring, setRestoring] = useState<string | null>(null)
  const [account, setAccount] = useState<AccountState | null>(null)
  const [email, setEmail] = useState('')
  const [emailPassword, setEmailPassword] = useState('')
  const [emailBusy, setEmailBusy] = useState(false)
  const [emailMessage, setEmailMessage] = useState<{ tone: 'info' | 'error'; text: string } | null>(null)

  /** Put a particular copy back, then pull the restored document into the editor. */
  const rollbackTo = async (name?: string) => {
    const label = name ?? 'the most recent copy'
    if (!window.confirm(`Replace everything on the site with ${label}? Anything typed since that copy was made is lost.`)) return
    setRestoring(name ?? 'latest')
    setMessage(null)
    try {
      await restoreBackup(name)
      await reloadContent()
      setMessage({ tone: 'info', text: 'That version has been put back. Reload the site to see it.' })
    } catch (cause) {
      setMessage({
        tone: 'error',
        text: cause instanceof ApiError ? cause.message : 'The rollback failed.',
      })
    } finally {
      setRestoring(null)
    }
  }

  const load = async () => {
    try {
      setHealth(await getHealth())
    } catch {
      setHealth(null)
    }
    try {
      const next = await getAccount()
      setAccount(next)
      setEmail(next.email)
    } catch {
      setAccount(null)
    }
  }

  /** Saving the recovery address needs the current password, like any credential change. */
  const saveEmail = async () => {
    setEmailMessage(null)
    setEmailBusy(true)
    try {
      const result = await updateAccountEmail(email.trim(), emailPassword)
      setAccount((current_) => (current_ ? { ...current_, email: result.email, maskedEmail: result.maskedEmail, emailUpdatedAt: result.emailUpdatedAt } : current_))
      setEmail(result.email)
      setEmailPassword('')
      setEmailMessage({
        tone: 'info',
        text: result.email
          ? 'Recovery address saved. Password-reset codes will be sent there once mail is configured.'
          : 'Recovery address cleared.',
      })
    } catch (cause) {
      setEmailMessage({
        tone: 'error',
        text: cause instanceof ApiError ? cause.message : 'The address could not be saved.',
      })
    } finally {
      setEmailBusy(false)
    }
  }

  useEffect(() => {
    void load()
  }, [])

  const change = async () => {
    setMessage(null)
    if (next !== confirm) {
      setMessage({ tone: 'error', text: 'The two new passwords do not match.' })
      return
    }
    if (next.length < 10) {
      setMessage({ tone: 'error', text: 'Choose a password of at least 10 characters.' })
      return
    }
    setBusy(true)
    try {
      await changePassword(current, next)
      setMessage({
        tone: 'info',
        text: 'Password changed. You have been signed out everywhere — sign in again with the new password.',
      })
      setCurrent('')
      setNext('')
      setConfirm('')
    } catch (cause) {
      setMessage({ tone: 'error', text: cause instanceof ApiError ? cause.message : 'The password could not be changed.' })
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-display text-[2.25rem] leading-tight text-charcoal">Settings</h1>
        <p className="mt-2 max-w-2xl font-sans text-[0.9375rem] leading-relaxed text-stone-600">
          Access, backups and the state of this installation.
        </p>
      </header>

      <Card
        title="Recovery email"
        description="Used only to send a password-reset code if you are ever locked out. It is never shown on the public website and never used for anything else."
      >
        <Grid>
          <FieldRow label="Email address" help="Leave empty to have no address on file.">
            <TextInput type="email" value={email} onChange={setEmail} placeholder="you@example.com" />
          </FieldRow>
          <FieldRow label="Your current password" help="Required — so nobody else at this computer can redirect a reset.">
            <TextInput type="password" value={emailPassword} onChange={setEmailPassword} />
          </FieldRow>
        </Grid>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <Button tone="primary" onClick={() => void saveEmail()} disabled={emailBusy}>
            {emailBusy ? 'Saving…' : 'Save the recovery address'}
          </Button>
          {account?.email && account.email !== email ? (
            <span className="font-sans text-[0.75rem] text-stone-500">Currently on file: {account.maskedEmail}</span>
          ) : null}
        </div>
        {emailMessage ? (
          <div className="mt-4">
            <InlineNotice tone={emailMessage.tone === 'error' ? 'error' : undefined}>{emailMessage.text}</InlineNotice>
          </div>
        ) : null}

        <div className="mt-6 border-t border-charcoal/10 pt-5">
          <p className="font-sans text-[0.625rem] font-semibold uppercase tracking-eyebrow text-stone-500">
            If you are locked out
          </p>
          <p className="mt-2 font-sans text-[0.8125rem] leading-relaxed text-stone-600">
            {account?.mailConfigured
              ? `Sign-in screen → Forgotten your password? sends a one-time code by ${account.mailTransport === 'smtp' ? 'email' : 'your mail webhook'}, valid for ${account.resetMinutes} minutes.`
              : `Sign-in screen → Forgotten your password? writes a one-time code to server/data/reset-code.txt, valid for ${account?.resetMinutes ?? 30} minutes. Set SMTP_URL (or RESET_WEBHOOK_URL) on the server to have it emailed instead.`}
          </p>
          {account?.reset.pending ? (
            <p className="mt-2 font-sans text-[0.8125rem] text-charcoal">
              A reset is open until {new Date(account.reset.expiresAt ?? '').toLocaleTimeString()} — {account.reset.attemptsLeft}{' '}
              attempt{account.reset.attemptsLeft === 1 ? '' : 's'} left before it is destroyed.
            </p>
          ) : null}
          {account?.passwordManagedByEnv ? (
            <p className="mt-2 font-sans text-[0.8125rem] leading-relaxed text-stone-600">
              This deployment takes its password from the environment (ADMIN_PASSWORD or ADMIN_PASSWORD_HASH), so neither
              the reset flow nor the form below can change it — edit the environment and restart.
            </p>
          ) : null}
        </div>
      </Card>

      <Card
        title="Administrator password"
        description="Changing the password signs out every session, including this one."
      >
        <Grid>
          <FieldRow label="Current password">
            <TextInput type="password" value={current} onChange={setCurrent} />
          </FieldRow>
          <div />
          <FieldRow label="New password" help="At least 10 characters.">
            <TextInput type="password" value={next} onChange={setNext} />
          </FieldRow>
          <FieldRow label="Repeat new password">
            <TextInput type="password" value={confirm} onChange={setConfirm} />
          </FieldRow>
        </Grid>
        {message ? (
          <div className="mt-5">
            <InlineNotice tone={message.tone}>{message.text}</InlineNotice>
          </div>
        ) : null}
        <div className="mt-5">
          <Button tone="primary" onClick={() => void change()} disabled={busy || !current || !next}>
            {busy ? 'Changing…' : 'Change password'}
          </Button>
        </div>
      </Card>

      <Card
        title="Backups and rollback"
        description="Every save first copies the previous version of the content file into server/data/backups. The last 30 are kept."
      >
        <dl className="grid gap-4 sm:grid-cols-2">
          <div>
            <dt className="font-sans text-[0.625rem] uppercase tracking-eyebrow text-stone-500">Last saved</dt>
            <dd className="mt-1 font-sans text-[0.9375rem] text-charcoal">
              {savedAt ? new Date(savedAt).toLocaleString() : '—'}
            </dd>
          </div>
          <div>
            <dt className="font-sans text-[0.625rem] uppercase tracking-eyebrow text-stone-500">Content file</dt>
            <dd className="mt-1 font-mono text-[0.8125rem] text-charcoal">{health?.contentFile ?? '—'}</dd>
          </div>
        </dl>
        {backups.length > 0 ? (
          <div className="mt-5">
            <p className="font-sans text-[0.625rem] uppercase tracking-eyebrow text-stone-500">
              Available copies — newest first
            </p>
            <ul className="mt-2 divide-y divide-charcoal/10 border border-charcoal/12">
              {backups.map((backup) => (
                <li key={backup.name} className="flex flex-wrap items-center justify-between gap-3 bg-white px-4 py-3">
                  <div className="min-w-0">
                    <p className="truncate font-mono text-[0.75rem] text-charcoal">{backup.name}</p>
                    <p className="mt-1 font-sans text-[0.6875rem] text-stone-500">
                      {backup.createdAt ? new Date(backup.createdAt).toLocaleString() : 'Date unavailable'}
                      {typeof backup.bytes === 'number' ? ` · ${Math.max(1, Math.round(backup.bytes / 1024))} KB` : ''}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => void rollbackTo(backup.name)}
                    disabled={restoring !== null}
                    className="shrink-0 border border-charcoal/20 px-3 py-1.5 font-sans text-[0.6875rem] font-semibold uppercase tracking-eyebrow text-charcoal transition-colors hover:border-bronze hover:text-bronze disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {restoring === backup.name ? 'Restoring…' : 'Restore this copy'}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <p className="mt-5 font-sans text-[0.8125rem] text-stone-600">
            No copies yet. One is made automatically the first time a change is saved.
          </p>
        )}
        <div className="mt-5 flex flex-wrap gap-3">
          <Button tone="danger" disabled={restoring !== null} onClick={() => void rollbackTo()}>
            {restoring === 'latest' ? 'Rolling back…' : 'Roll back to the newest copy'}
          </Button>
          <Button onClick={() => restoreLocal()}>Discard unsaved edits in this session</Button>
        </div>
      </Card>

      <Card title="This installation" description="What is running, and what it can do.">
        <dl className="grid gap-x-8 gap-y-4 sm:grid-cols-2">
          <div>
            <dt className="font-sans text-[0.625rem] uppercase tracking-eyebrow text-stone-500">API</dt>
            <dd className="mt-1 font-sans text-[0.9375rem] text-charcoal">
              {health ? `Running (${Math.round(health.uptimeSeconds / 60)} minutes up)` : 'Not reachable'}
            </dd>
          </div>
          <div>
            <dt className="font-sans text-[0.625rem] uppercase tracking-eyebrow text-stone-500">Admin credential</dt>
            <dd className="mt-1 font-sans text-[0.9375rem] text-charcoal">
              {health?.adminConfigured ? 'Configured' : 'Not configured'}
            </dd>
          </div>
          <div>
            <dt className="font-sans text-[0.625rem] uppercase tracking-eyebrow text-stone-500">
              Saving changes
            </dt>
            <dd
              className={`mt-1 font-sans text-[0.9375rem] ${
                health && health.storage === 'read-only' ? 'text-[#8d3b2f]' : 'text-charcoal'
              }`}
            >
              {!health
                ? '—'
                : health.storage === 'read-only'
                  ? 'Not possible — this server cannot write to disk'
                  : 'Possible — changes are written to disk on this server'}
            </dd>
          </div>
          <div>
            <dt className="font-sans text-[0.625rem] uppercase tracking-eyebrow text-stone-500">Site build</dt>
            <dd
              className={`mt-1 font-sans text-[0.9375rem] ${
                health && health.site === 'missing' ? 'text-[#8d3b2f]' : 'text-charcoal'
              }`}
            >
              {!health
                ? '—'
                : health.site === 'missing'
                  ? 'No built site found — run: npm run build'
                  : 'Serving the built site from dist/'}
            </dd>
          </div>
          <div>
            <dt className="font-sans text-[0.625rem] uppercase tracking-eyebrow text-stone-500">Form submissions</dt>
            <dd className="mt-1 font-sans text-[0.9375rem] text-charcoal">
              Stored on this server and shown in Enquiries
            </dd>
          </div>
          <div>
            <dt className="font-sans text-[0.625rem] uppercase tracking-eyebrow text-stone-500">Uploads</dt>
            <dd className="mt-1 font-sans text-[0.9375rem] text-charcoal">Up to 8 MB per image, JPEG/PNG/WebP/AVIF</dd>
          </div>
        </dl>
        {health?.storage === 'read-only' ? (
          <div className="mt-5 border border-[#c9a49c] bg-[#FBF3F1] px-4 py-3">
            <p className="font-sans text-[0.8125rem] font-semibold text-[#8d3b2f]">
              This deployment cannot save anything.
            </p>
            <p className="mt-1 font-sans text-[0.8125rem] text-[#8d3b2f]">
              The public site is being served, but changes, uploads and the administrator password all need a writable
              directory and this server does not have one. On the host, point{' '}
              <span className="font-mono text-[0.75rem]">DATA_DIR</span> and{' '}
              <span className="font-mono text-[0.75rem]">UPLOADS_DIR</span> at a persistent disk (a mounted volume),
              then restart. See “Deploying so the admin works” in README.md.
            </p>
            {health.storageError ? (
              <p className="mt-2 break-words font-mono text-[0.6875rem] text-[#8d3b2f]">
                Reported by the server: {health.storageError}
              </p>
            ) : null}
          </div>
        ) : null}
        <div className="mt-5 space-y-3">
          <InlineNotice>
            Submissions are stored in <span className="font-mono text-[0.75rem]">server/data/submissions.json</span> with
            file permissions restricted to the server user. They are not emailed anywhere — export the CSV regularly if
            you need them off the machine.
          </InlineNotice>
          <InlineNotice>
            This admin area, the API and the content file live on the same server. Keep the server itself private:
            sign in over HTTPS only, and take a copy of <span className="font-mono text-[0.75rem]">content/site.json</span>{' '}
            and <span className="font-mono text-[0.75rem]">server/data/uploads</span> with your other backups.
          </InlineNotice>
        </div>
      </Card>
    </div>
  )
}
