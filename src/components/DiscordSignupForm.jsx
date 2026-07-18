import { useState } from 'react'

/**
 * Kato.8 Discord community sign-up form. Self-contained: validation,
 * submission, idle / submitting / success / error states, honeypot for
 * basic bot filtering.
 *
 * Posts `{ name, email, discordHandle, ageConfirmed, motivation, source }`
 * to the "Kato8 Discord Signup" Formspree endpoint. URL is hardcoded
 * below because Formspree endpoints are public by design (the browser
 * POSTs directly to them), so there's no benefit to a build-time env
 * var — the built JS would contain the same string anyway. Source of
 * truth for the URL lives in `FORMSPREE.md` in the prod repo.
 *
 * Props:
 *   - source?: string — identifier for where the form lives (e.g.
 *     `'about'`, `'preview'`). Sent with the payload for attribution.
 *   - heading?: string — section heading. Pass `null` to omit.
 *   - description?: string — copy under the heading. Pass `null` to omit.
 *   - legalConsent?: ReactNode — if provided, renders a required
 *     checkbox with this content as the label at the bottom of the form.
 *     Use for community rules / terms-of-service acknowledgment. Omit to
 *     hide the checkbox until legal text is finalized.
 */
const DISCORD_SIGNUP_ENDPOINT = 'https://formspree.io/f/xrenpjrq'

export default function DiscordSignupForm({
  source = 'unknown',
  heading = 'Join the Kato.8 Discord community',
  description = 'Tell us a little about yourself and we’ll send an invite.',
  legalConsent = null,
}) {
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
      const response = await fetch(DISCORD_SIGNUP_ENDPOINT, {
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
      {heading && <h2 className="signup-form__heading">{heading}</h2>}
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
