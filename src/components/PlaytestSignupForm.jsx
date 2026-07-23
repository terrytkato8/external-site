import { useState } from 'react'

/**
 * Reusable per-game playtest sign-up form. Self-contained: validation,
 * submission, idle / submitting / success / error states, honeypot for
 * basic bot filtering.
 *
 * Posts `{ name, email, discordHandle, availability, source }`
 * to the `endpoint` URL (typically a Formspree form; the caller resolves
 * a per-game env var and passes the value in — see
 * `src/data/playtestEndpoints.js`). If `endpoint` is unset, submit
 * resolves successfully with no network call so the form is usable in
 * dev before the endpoint is provisioned.
 *
 * Props:
 *   - source?: string — identifier for where the form lives (e.g.
 *     `'universal-serial-blade-page'`, `'preview'`). Sent with the
 *     payload for attribution.
 *   - gameTitle?: string — game name interpolated into the default
 *     heading. Omit if you pass `heading` explicitly.
 *   - endpoint?: string — Formspree URL to POST to. Omit for previews /
 *     dev; the form still works, just skips the network call.
 *   - heading?: string — section heading. Defaults to
 *     `Sign up to playtest ${gameTitle}` when `gameTitle` is provided.
 *     Pass `null` to omit.
 *   - description?: string — copy under the heading. Pass `null` to omit.
 *   - legalConsent?: ReactNode — if provided, renders a required
 *     checkbox with this content as the label at the bottom of the form.
 *     Use for terms-of-service acknowledgment. Omit to hide the
 *     checkbox until legal text is finalized.
 */
export default function PlaytestSignupForm({
  source = 'unknown',
  gameTitle = null,
  endpoint,
  heading,
  description = 'Help us shape the game. We’ll email you when a build is ready.',
  legalConsent = null,
}) {
  const resolvedHeading =
    heading === undefined
      ? gameTitle
        ? `Sign up to playtest ${gameTitle}`
        : 'Sign up to playtest'
      : heading
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [discordHandle, setDiscordHandle] = useState('')
  const [availability, setAvailability] = useState('')
  const [consented, setConsented] = useState(false)
  const [website, setWebsite] = useState('') // honeypot
  const [status, setStatus] = useState('idle') // idle | submitting | success | error
  const [errorMessage, setErrorMessage] = useState('')

  async function handleSubmit(event) {
    event.preventDefault()

    if (website) {
      setStatus('success')
      return
    }

    if (!name.trim()) {
      setStatus('error')
      setErrorMessage('Please enter your name.')
      return
    }
    const trimmedEmail = email.trim()
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      setStatus('error')
      setErrorMessage('Please enter a valid email address.')
      return
    }
    if (legalConsent && !consented) {
      setStatus('error')
      setErrorMessage('Please agree to the terms to continue.')
      return
    }

    setStatus('submitting')
    setErrorMessage('')

    try {
      if (endpoint) {
        const response = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
          body: JSON.stringify({
            name: name.trim(),
            email: trimmedEmail,
            discordHandle: discordHandle.trim(),
            availability: availability.trim(),
            source,
          }),
        })
        if (!response.ok) throw new Error(`Signup failed (${response.status})`)
      } else {
        console.warn(`PlaytestSignupForm: no endpoint provided (source=${source}); skipping network call.`)
      }
      setStatus('success')
      setName('')
      setEmail('')
      setDiscordHandle('')
      setAvailability('')
      setConsented(false)
    } catch (error) {
      setStatus('error')
      setErrorMessage('Something went wrong. Please try again.')
    }
  }

  if (status === 'success') {
    return (
      <section className="signup-form signup-form--success" aria-live="polite">
        <p className="signup-form__success">
          Thanks for signing up — we’ll be in touch when a build is ready.
        </p>
      </section>
    )
  }

  return (
    <section className="signup-form">
      {resolvedHeading && <h2 className="signup-form__heading">{resolvedHeading}</h2>}
      {description && <p className="signup-form__description">{description}</p>}
      <form className="signup-form__form" onSubmit={handleSubmit} noValidate>
        <label className="signup-form__honeypot" aria-hidden="true">
          Website
          <input
            type="text"
            name="website"
            tabIndex={-1}
            autoComplete="off"
            value={website}
            onChange={(event) => setWebsite(event.target.value)}
          />
        </label>

        <label className="signup-form__field">
          <span className="signup-form__label">
            Name<span className="signup-form__required" aria-hidden="true">*</span>
          </span>
          <input
            type="text"
            name="name"
            required
            autoComplete="name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            disabled={status === 'submitting'}
          />
        </label>

        <label className="signup-form__field">
          <span className="signup-form__label">
            Email address<span className="signup-form__required" aria-hidden="true">*</span>
          </span>
          <input
            type="email"
            name="email"
            required
            autoComplete="email"
            placeholder="you@example.com"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            disabled={status === 'submitting'}
          />
        </label>

        <label className="signup-form__field">
          <span className="signup-form__label">Discord handle (optional)</span>
          <input
            type="text"
            name="discordHandle"
            autoComplete="off"
            placeholder="yourname"
            value={discordHandle}
            onChange={(event) => setDiscordHandle(event.target.value)}
            disabled={status === 'submitting'}
          />
        </label>

        <label className="signup-form__field">
          <span className="signup-form__label">
            When are you generally available to play?
          </span>
          <textarea
            name="availability"
            rows={3}
            placeholder="e.g. weekday evenings PT, weekends"
            value={availability}
            onChange={(event) => setAvailability(event.target.value)}
            disabled={status === 'submitting'}
          />
        </label>

        {legalConsent && (
          <label className="signup-form__checkbox signup-form__consent">
            <input
              type="checkbox"
              name="consent"
              checked={consented}
              onChange={(event) => setConsented(event.target.checked)}
              disabled={status === 'submitting'}
            />
            <span>{legalConsent}</span>
          </label>
        )}

        <button
          type="submit"
          className="button"
          disabled={status === 'submitting'}
        >
          {status === 'submitting' ? 'Signing up…' : 'Sign up'}
        </button>

        <p className="signup-form__status" role="status" aria-live="polite">
          {status === 'error' ? errorMessage : ''}
        </p>
      </form>
    </section>
  )
}
