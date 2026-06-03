import { useState } from 'react'

/**
 * Newsletter email signup form. Self-contained: validation, submission,
 * loading / success / error states, honeypot for basic bot filtering.
 *
 * Posts `{ email, source }` to `VITE_NEWSLETTER_ENDPOINT`. If that env
 * var is unset, the submit resolves successfully without a network call
 * so the form is usable in dev before the backend exists.
 *
 * Props:
 *   - source?: string — identifier for where the form lives (e.g.
 *     `'about'`, `'home-footer'`). Sent with the payload so the backend
 *     can attribute signups.
 *   - heading?: string — section heading. Pass `null` to omit.
 *   - description?: string — copy under the heading. Pass `null` to omit.
 */
export default function NewsletterSignup({
  source = 'unknown',
  heading = 'Join the Newsletter',
  description = 'Occasional updates on what we’re building. No spam.',
}) {
  const [email, setEmail] = useState('')
  const [website, setWebsite] = useState('') // honeypot
  const [status, setStatus] = useState('idle') // idle | submitting | success | error
  const [errorMessage, setErrorMessage] = useState('')

  async function handleSubmit(event) {
    event.preventDefault()

    if (website) {
      setStatus('success')
      return
    }

    const trimmed = email.trim()
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      setStatus('error')
      setErrorMessage('Please enter a valid email address.')
      return
    }

    setStatus('submitting')
    setErrorMessage('')

    const endpoint = import.meta.env.VITE_NEWSLETTER_ENDPOINT
    try {
      if (endpoint) {
        const response = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: trimmed, source }),
        })
        if (!response.ok) throw new Error(`Signup failed (${response.status})`)
      } else {
        console.warn('NewsletterSignup: VITE_NEWSLETTER_ENDPOINT not set; skipping network call.')
      }
      setStatus('success')
      setEmail('')
    } catch (error) {
      setStatus('error')
      setErrorMessage('Something went wrong. Please try again.')
    }
  }

  if (status === 'success') {
    return (
      <section className="newsletter-signup newsletter-signup--success" aria-live="polite">
        <p className="newsletter-signup__success">Thanks for signing up — we’ll be in touch.</p>
      </section>
    )
  }

  return (
    <section className="newsletter-signup">
      {heading && <h2 className="newsletter-signup__heading">{heading}</h2>}
      {description && <p className="newsletter-signup__description">{description}</p>}
      <form className="newsletter-signup__form" onSubmit={handleSubmit} noValidate>
        <label className="newsletter-signup__honeypot" aria-hidden="true">
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
        <label className="newsletter-signup__field">
          <span className="newsletter-signup__label">Email address</span>
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
        <button
          type="submit"
          className="button"
          disabled={status === 'submitting'}
        >
          {status === 'submitting' ? 'Signing up…' : 'Sign up'}
        </button>
        <p
          className="newsletter-signup__status"
          role="status"
          aria-live="polite"
        >
          {status === 'error' ? errorMessage : ''}
        </p>
      </form>
    </section>
  )
}
