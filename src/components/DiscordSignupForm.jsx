import { useState } from 'react'

/**
 * Reusable per-game Discord community sign-up form. Self-contained:
 * validation, submission, idle / submitting / success / error states,
 * honeypot for basic bot filtering.
 *
 * Posts `{ name, email, discordHandle, ageConfirmed, motivation, source }`
 * to the `endpoint` URL (typically a Formspree form; the caller resolves
 * a per-game endpoint and passes the value in — see
 * `src/data/discordEndpoints.js`). If `endpoint` is unset, submit
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
 *     `Join the ${gameTitle} Discord community` when `gameTitle` is
 *     provided. Pass `null` to omit.
 *   - description?: string — copy under the heading. Pass `null` to omit.
 *   - legalConsent?: ReactNode — if provided, renders a required
 *     checkbox with this content as the label at the bottom of the form.
 *     Use for community rules / terms-of-service acknowledgment. Omit to
 *     hide the checkbox until legal text is finalized.
 */
export default function DiscordSignupForm({
  source = 'unknown',
  gameTitle = null,
  endpoint,
  heading,
  description = 'Tell us a little about yourself and we’ll send an invite.',
  legalConsent = null,
}) {
  const resolvedHeading =
    heading === undefined
      ? gameTitle
        ? `Join the ${gameTitle} Discord community`
        : 'Join the Discord community'
      : heading
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [discordHandle, setDiscordHandle] = useState('')
  const [ageConfirmed, setAgeConfirmed] = useState(false)
  const [motivation, setMotivation] = useState('')
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
    if (!discordHandle.trim()) {
      setStatus('error')
      setErrorMessage('Please enter your Discord handle.')
      return
    }
    if (!ageConfirmed) {
      setStatus('error')
      setErrorMessage('You must be 13 or older to join the Discord community.')
      return
    }
    if (!motivation.trim()) {
      setStatus('error')
      setErrorMessage('Please tell us a bit about why you want to join.')
      return
    }
    if (legalConsent && !consented) {
      setStatus('error')
      setErrorMessage('Please agree to the community rules to continue.')
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
            ageConfirmed,
            motivation: motivation.trim(),
            source,
          }),
        })
        if (!response.ok) throw new Error(`Application failed (${response.status})`)
      } else {
        console.warn(`DiscordSignupForm: no endpoint provided (source=${source}); skipping network call.`)
      }
      setStatus('success')
      setName('')
      setEmail('')
      setDiscordHandle('')
      setAgeConfirmed(false)
      setMotivation('')
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
          Thanks — your application is in. We’ll be in touch with an invite.
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
          <span className="signup-form__label">
            Discord handle<span className="signup-form__required" aria-hidden="true">*</span>
          </span>
          <input
            type="text"
            name="discordHandle"
            required
            autoComplete="off"
            placeholder="yourname"
            value={discordHandle}
            onChange={(event) => setDiscordHandle(event.target.value)}
            disabled={status === 'submitting'}
          />
        </label>

        <label className="signup-form__field">
          <span className="signup-form__label">
            Why do you want to join?
            <span className="signup-form__required" aria-hidden="true">*</span>
          </span>
          <textarea
            name="motivation"
            rows={4}
            required
            placeholder="A sentence or two is fine."
            value={motivation}
            onChange={(event) => setMotivation(event.target.value)}
            disabled={status === 'submitting'}
          />
        </label>

        <label className="signup-form__checkbox">
          <input
            type="checkbox"
            name="ageConfirmed"
            checked={ageConfirmed}
            onChange={(event) => setAgeConfirmed(event.target.checked)}
            disabled={status === 'submitting'}
          />
          <span>
            I confirm I am 13 years of age or older.
            <span className="signup-form__required" aria-hidden="true">*</span>
          </span>
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
          {status === 'submitting' ? 'Submitting…' : 'Submit application'}
        </button>

        <p className="signup-form__status" role="status" aria-live="polite">
          {status === 'error' ? errorMessage : ''}
        </p>
      </form>
    </section>
  )
}
