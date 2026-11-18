import { useRef, useState } from 'react'
import RadioGroup from './RadioGroup'
import Turnstile from './Turnstile'
import { investorContact } from '../data/investorContact'

const TYPE_OPTIONS = [
  { value: 'investor', label: 'Investor' },
  { value: 'publisher', label: 'Publisher' },
]

/**
 * Investor / publisher contact form, used on the `/investors` page.
 *
 * Self-contained: validation, submission, idle / submitting / success /
 * error states, honeypot for basic bot filtering. Modeled on
 * `PlaytestSignupForm` (same `.signup-form` markup and CSS, imported
 * globally in `main.jsx`), plus a `RadioGroup` for investor vs publisher
 * and a Cloudflare `Turnstile` bot check above the submit button.
 *
 * Posts `{ name, email, phone, type, company, details, source,
 * turnstileToken }` to the investor-contact Worker (see
 * `src/data/investorContact.js`), which verifies the token, forwards to
 * Formspree, and emails the visitor a confirmation. When the Worker
 * rejects a submission it returns a readable `error`, which is shown;
 * anything else shows a generic retry message. `phone` is the only
 * optional field and is sent as an empty string when left blank.
 *
 * Props:
 *   - source?: string — identifier for where the form lives, sent with
 *     the payload for attribution (defaults to `'investors-page'`).
 *   - heading?: string — section heading. Pass `null` to omit.
 *   - description?: string — copy under the heading. Pass `null` to omit.
 */
export default function InvestorRequestForm({
  source = 'investors-page',
  heading = 'Get in touch',
  description = 'Investors and publishers — tell us a little about yourself and we’ll follow up.',
}) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [type, setType] = useState('') // investor | publisher
  const [company, setCompany] = useState('')
  const [details, setDetails] = useState('')
  const [website, setWebsite] = useState('') // honeypot
  const [status, setStatus] = useState('idle') // idle | submitting | success | error
  const [errorMessage, setErrorMessage] = useState('')
  const [turnstileToken, setTurnstileToken] = useState('')
  const turnstileRef = useRef(null)
  const { endpoint, turnstileSiteKey } = investorContact

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
    if (type !== 'investor' && type !== 'publisher') {
      setStatus('error')
      setErrorMessage('Please choose investor or publisher.')
      return
    }
    if (!company.trim()) {
      setStatus('error')
      setErrorMessage('Please enter your company or firm.')
      return
    }
    if (!details.trim()) {
      setStatus('error')
      setErrorMessage('Please add some details.')
      return
    }
    if (turnstileSiteKey && !turnstileToken) {
      setStatus('error')
      setErrorMessage('Please complete the bot check.')
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
            phone: phone.trim(),
            type,
            company: company.trim(),
            details: details.trim(),
            source,
            ...(turnstileSiteKey ? { turnstileToken } : {}),
          }),
        })
        if (!response.ok) {
          // The Worker returns a human-readable `error`; show it when present.
          const data = await response.json().catch(() => null)
          throw new Error(data?.error || `Request failed (${response.status})`, { cause: 'server' })
        }
      } else {
        console.warn(`InvestorRequestForm: VITE_INVESTOR_ENDPOINT not set (source=${source}); skipping network call.`)
      }
      setStatus('success')
      setName('')
      setEmail('')
      setPhone('')
      setType('')
      setCompany('')
      setDetails('')
    } catch (error) {
      setStatus('error')
      setErrorMessage(
        error.cause === 'server' && !/^Request failed/.test(error.message)
          ? error.message
          : 'Something went wrong. Please try again.',
      )
      // Turnstile tokens are single-use; get a fresh one for the retry.
      turnstileRef.current?.reset()
    }
  }

  if (status === 'success') {
    return (
      <section className="signup-form signup-form--success investor-request-form" aria-live="polite">
        <p className="signup-form__success">
          Thanks for reaching out — we’ll be in touch soon.
        </p>
      </section>
    )
  }

  return (
    <section className="signup-form investor-request-form">
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
          <span className="signup-form__label">Phone (optional)</span>
          <input
            type="tel"
            name="phone"
            autoComplete="tel"
            value={phone}
            onChange={(event) => setPhone(event.target.value)}
            disabled={status === 'submitting'}
          />
        </label>

        <RadioGroup
          name="type"
          legend="I’m reaching out as"
          options={TYPE_OPTIONS}
          value={type}
          onChange={setType}
          required
          disabled={status === 'submitting'}
        />

        <label className="signup-form__field">
          <span className="signup-form__label">
            Company / firm<span className="signup-form__required" aria-hidden="true">*</span>
          </span>
          <input
            type="text"
            name="company"
            required
            autoComplete="organization"
            value={company}
            onChange={(event) => setCompany(event.target.value)}
            disabled={status === 'submitting'}
          />
        </label>

        <label className="signup-form__field">
          <span className="signup-form__label">
            Details / comments<span className="signup-form__required" aria-hidden="true">*</span>
          </span>
          <textarea
            name="details"
            required
            placeholder="Tell us what you’d like to discuss."
            value={details}
            onChange={(event) => setDetails(event.target.value)}
            disabled={status === 'submitting'}
          />
        </label>

        {turnstileSiteKey && (
          <Turnstile ref={turnstileRef} siteKey={turnstileSiteKey} onToken={setTurnstileToken} />
        )}

        <button type="submit" className="button" disabled={status === 'submitting'}>
          {status === 'submitting' ? 'Sending…' : 'Send message'}
        </button>

        <p className="signup-form__status" role="status" aria-live="polite">
          {status === 'error' ? errorMessage : ''}
        </p>
      </form>
    </section>
  )
}
