import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react'

const SCRIPT_URL = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit'
let scriptPromise

// Load Cloudflare's Turnstile script once per page, however many widgets mount.
function loadTurnstile() {
  if (window.turnstile) return Promise.resolve(window.turnstile)
  if (!scriptPromise) {
    scriptPromise = new Promise((resolve, reject) => {
      const script = document.createElement('script')
      script.src = SCRIPT_URL
      script.async = true
      script.onload = () => resolve(window.turnstile)
      script.onerror = () => {
        scriptPromise = undefined
        reject(new Error('Failed to load Turnstile'))
      }
      document.head.appendChild(script)
    })
  }
  return scriptPromise
}

/**
 * Cloudflare Turnstile bot check (https://developers.cloudflare.com/turnstile/).
 *
 * Renders the widget and reports its token through `onToken` ('' when the
 * token expires or the check errors). The token is single-use, so call
 * `ref.current.reset()` after a failed submit to get a fresh one.
 *
 * Props:
 *   - siteKey: string — Turnstile site key (public).
 *   - onToken: (token: string) => void
 */
const Turnstile = forwardRef(function Turnstile({ siteKey, onToken }, ref) {
  const containerRef = useRef(null)
  const widgetIdRef = useRef(null)
  const onTokenRef = useRef(onToken)
  onTokenRef.current = onToken

  useImperativeHandle(ref, () => ({
    reset() {
      if (window.turnstile && widgetIdRef.current != null) {
        window.turnstile.reset(widgetIdRef.current)
        onTokenRef.current('')
      }
    },
  }))

  useEffect(() => {
    let cancelled = false
    loadTurnstile()
      .then((turnstile) => {
        if (cancelled || !containerRef.current) return
        widgetIdRef.current = turnstile.render(containerRef.current, {
          sitekey: siteKey,
          callback: (token) => onTokenRef.current(token),
          'expired-callback': () => onTokenRef.current(''),
          'error-callback': () => onTokenRef.current(''),
        })
      })
      .catch((error) => console.error(error))
    return () => {
      cancelled = true
      if (window.turnstile && widgetIdRef.current != null) {
        window.turnstile.remove(widgetIdRef.current)
        widgetIdRef.current = null
      }
    }
  }, [siteKey])

  return <div ref={containerRef} className="turnstile" />
})

export default Turnstile
