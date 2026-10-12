import { useState } from 'react'
import {
  ApiError,
  confirmPasswordReset,
  getSession,
  login,
  requestPasswordReset,
  setupAdmin,
  type ResetInfo,
  type ResetRequestResult,
} from '../lib/api'
import { submitOnEnter } from '../lib/formSubmit'
import { Button, InlineNotice, TextInput } from './ui'

/**
 * Sign-in screen, the first-run screen, and the forgotten-password flow.
 *
 * The first-run screen only appears while no credential exists anywhere
 * (no ADMIN_PASSWORD / ADMIN_PASSWORD_HASH in the environment and no
 * server/data/auth.json). Once a password is set, the server refuses /setup
 * outright, so the form below can never be used to take over an installation.
 *
 * The reset flow tells the truth about delivery: if the server cannot send mail,
 * it says so and names the file the code was written to, rather than implying an
 * email that never went anywhere.
 */
export function AdminLogin({
  configured,
  reset,
  onSignedIn,
}: {
  configured: boolean
  reset?: ResetInfo
  onSignedIn: () => void
}) {
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // forgotten-password flow
  const [resetting, setResetting] = useState(false)
  const [code, setCode] = useState('')
  const [next, setNext] = useState('')
  const [repeat, setRepeat] = useState('')
  const [requested, setRequested] = useState<ResetRequestResult | null>(null)
  const [notice, setNotice] = useState<string | null>(null)

  const firstRun = !configured
  const resetInfo: ResetInfo = reset ?? { available: true, hasEmail: false, transport: 'none', minutes: 30 }

  const submit = async () => {
    setError(null)
    if (firstRun && password !== confirm) {
      setError('The two passwords do not match.')
      return
    }
    if (firstRun && password.length < 10) {
      setError('Choose a password of at least 10 characters.')
      return
    }
    setBusy(true)
    try {
      if (firstRun) await setupAdmin(password)
      else await login(password)

      // The password was accepted. Confirm the session actually took — if this
      // browser keeps neither the cookie nor the fallback token (a very locked
      // down frame), saying so now is far clearer than a dashboard that fails on
      // every request.
      const check = await getSession()
      if (!check.signedIn) {
        setError(
          'The password was accepted, but this browser is not storing the session at all. Try opening the site in a normal browser tab — or in a tab of its own rather than an embedded frame — and sign in again.',
        )
        return
      }

      setPassword('')
      setConfirm('')
      onSignedIn()
    } catch (cause) {
      if (cause instanceof ApiError) {
        setError(
          cause.code === 'BAD_CREDENTIALS'
            ? 'That password is not correct.'
            : cause.details.length > 0
              ? `${cause.message} ${cause.details.join(' ')}`
              : cause.message,
        )
      } else {
        setError('Something went wrong. Please try again.')
      }
    } finally {
      setBusy(false)
    }
  }

  const askForCode = async () => {
    setError(null)
    setNotice(null)
    setBusy(true)
    try {
      const result = await requestPasswordReset()
      setRequested(result)
      setNotice(result.note || 'A reset code has been created.')
    } catch (cause) {
      setError(cause instanceof ApiError ? cause.message : 'The reset could not be started.')
    } finally {
      setBusy(false)
    }
  }

  const finishReset = async () => {
    setError(null)
    if (next !== repeat) {
      setError('The two new passwords do not match.')
      return
    }
    if (next.length < 10) {
      setError('Choose a password of at least 10 characters.')
      return
    }
    setBusy(true)
    try {
      await confirmPasswordReset(code, next)
      setResetting(false)
      setCode('')
      setNext('')
      setRepeat('')
      setRequested(null)
      setNotice('Password changed. All devices were signed out — sign in with the new password.')
    } catch (cause) {
      setError(cause instanceof ApiError ? cause.message : 'That did not work. Please try again.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-ivory px-5 py-16">
      <div className="w-full max-w-md">
        <div className="border border-charcoal/12 bg-white p-8 sm:p-10">
          <p className="flex items-center gap-3 font-sans text-[0.625rem] font-semibold uppercase tracking-eyebrow text-bronze">
            <span aria-hidden="true" className="h-px w-6 bg-bronze" />
            TOC Luxury Constructions
          </p>

          {resetting && !firstRun ? (
            <>
              <h1 className="mt-5 font-display text-[2rem] leading-tight text-charcoal">Reset the password</h1>
              <p className="mt-3 font-sans text-[0.875rem] leading-relaxed text-stone-600">
                A reset code proves the request came from you.{' '}
                {resetInfo.transport === 'none'
                  ? 'This server has no mail configured, so the code is written to a file on the server — see the note after you ask for one.'
                  : 'It is emailed to the recovery address on the account.'}
              </p>

              <div className="mt-7 space-y-5">
                <div className="border border-charcoal/12 bg-ivory p-4">
                  <p className="font-sans text-[0.8125rem] font-semibold text-charcoal">Step one — get a code</p>
                  <p className="mt-1.5 font-sans text-[0.75rem] leading-relaxed text-stone-600">
                    Codes last {resetInfo.minutes} minutes, work once, and stop working after five wrong tries.
                    {resetInfo.hasEmail ? '' : ' No recovery address is set on this account yet.'}
                  </p>
                  <div className="mt-3">
                    <Button type="button" onClick={() => void askForCode()} disabled={busy || !resetInfo.available}>
                      {busy ? 'Please wait…' : requested ? 'Send a new code' : 'Send the reset code'}
                    </Button>
                  </div>
                  {requested?.delivery === 'file' ? (
                    <p className="mt-3 font-sans text-[0.75rem] leading-relaxed text-stone-700">
                      The code was written to{' '}
                      <code className="bg-white px-1.5 py-0.5 font-mono text-[0.75rem]">{requested.fileHint}</code> on the
                      server — open that file (or ask whoever runs the server to read it out) and type the code below.
                      Configuring <code className="font-mono text-[0.75rem]">SMTP_URL</code> would send it by email
                      instead.
                    </p>
                  ) : null}
                </div>

                <div>
                  <label
                    htmlFor="admin-reset-code"
                    className="block font-sans text-[0.6875rem] font-semibold uppercase tracking-eyebrow text-stone-500"
                  >
                    Step two — the code
                  </label>
                  <div className="mt-2">
                    <TextInput
                      id="admin-reset-code"
                      value={code}
                      onChange={(value) => setCode(value.toUpperCase())}
                      placeholder="XXXXXXXXXX"
                    />
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="admin-reset-password"
                    className="block font-sans text-[0.6875rem] font-semibold uppercase tracking-eyebrow text-stone-500"
                  >
                    New password
                  </label>
                  <div className="mt-2">
                    <TextInput
                      id="admin-reset-password"
                      type="password"
                      value={next}
                      onChange={setNext}
                      placeholder="At least 10 characters"
                    />
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="admin-reset-confirm"
                    className="block font-sans text-[0.6875rem] font-semibold uppercase tracking-eyebrow text-stone-500"
                  >
                    Repeat new password
                  </label>
                  <div className="mt-2">
                    <TextInput id="admin-reset-confirm" type="password" value={repeat} onChange={setRepeat} />
                  </div>
                </div>

                {notice ? <InlineNotice>{notice}</InlineNotice> : null}
                {error ? <InlineNotice tone="error">{error}</InlineNotice> : null}

                <div className="flex flex-wrap items-center gap-3">
                  <Button type="button" tone="primary" onClick={() => void finishReset()} disabled={busy || !code}>
                    {busy ? 'Please wait…' : 'Set the new password'}
                  </Button>
                  <button
                    type="button"
                    onClick={() => {
                      setResetting(false)
                      setError(null)
                    }}
                    className="font-sans text-[0.75rem] uppercase tracking-eyebrow text-stone-500 underline-offset-4 hover:text-charcoal hover:underline"
                  >
                    Back to sign in
                  </button>
                </div>
              </div>
            </>
          ) : (
            <>
              <h1 className="mt-5 font-display text-[2rem] leading-tight text-charcoal">
                {firstRun ? 'Set up the admin password' : 'Sign in'}
              </h1>
              <p className="mt-3 font-sans text-[0.875rem] leading-relaxed text-stone-600">
                {firstRun
                  ? 'No password has been set for this deployment yet. Choose one now — you will need it to edit the site from now on. Use at least 10 characters.'
                  : 'Enter the administrator password to edit the website.'}
              </p>

              <form
                className="mt-7 space-y-5"
                onSubmit={(event) => {
                  event.preventDefault()
                  void submit()
                }}
                onKeyDown={submitOnEnter(() => void submit())}
              >
                <div>
                  <label
                    htmlFor="admin-password"
                    className="block font-sans text-[0.6875rem] font-semibold uppercase tracking-eyebrow text-stone-500"
                  >
                    Password
                  </label>
                  <div className="mt-2">
                    <TextInput
                      id="admin-password"
                      type="password"
                      value={password}
                      onChange={setPassword}
                      placeholder="••••••••••"
                    />
                  </div>
                </div>

                {firstRun ? (
                  <div>
                    <label
                      htmlFor="admin-password-confirm"
                      className="block font-sans text-[0.6875rem] font-semibold uppercase tracking-eyebrow text-stone-500"
                    >
                      Repeat password
                    </label>
                    <div className="mt-2">
                      <TextInput id="admin-password-confirm" type="password" value={confirm} onChange={setConfirm} />
                    </div>
                  </div>
                ) : null}

                {notice ? <InlineNotice>{notice}</InlineNotice> : null}
                {error ? <InlineNotice tone="error">{error}</InlineNotice> : null}

                <Button type="button" onClick={() => void submit()} tone="primary" disabled={busy} className="w-full">
                  {busy ? 'Please wait…' : firstRun ? 'Set password and continue' : 'Sign in'}
                </Button>
              </form>

              {!firstRun ? (
                <p className="mt-5 text-center">
                  <button
                    type="button"
                    id="admin-forgot"
                    onClick={() => {
                      setResetting(true)
                      setNotice(null)
                      setError(null)
                    }}
                    disabled={!resetInfo.available}
                    className="font-sans text-[0.75rem] uppercase tracking-eyebrow text-stone-500 underline-offset-4 hover:text-charcoal hover:underline disabled:opacity-50"
                  >
                    Forgotten your password?
                  </button>
                </p>
              ) : null}
            </>
          )}
        </div>

        <p className="mt-6 text-center font-sans text-[0.75rem] leading-relaxed text-stone-500">
          {firstRun
            ? 'Prefer to keep the credential in the environment? Set ADMIN_PASSWORD (or ADMIN_PASSWORD_HASH) in .env and restart the server — this screen then becomes a normal sign-in.'
            : resetInfo.available
              ? 'The recovery address and password are managed on the Settings screen once you are signed in.'
              : 'The password on this deployment is set in the server environment (ADMIN_PASSWORD or ADMIN_PASSWORD_HASH). Change it there and restart the server.'}
        </p>
        <p className="mt-4 text-center">
          <a
            href="/"
            className="font-sans text-[0.75rem] uppercase tracking-eyebrow text-stone-500 underline-offset-4 hover:text-charcoal hover:underline"
          >
            Back to the website
          </a>
        </p>
      </div>
    </div>
  )
}
