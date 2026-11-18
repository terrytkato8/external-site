/**
 * Where the investor / publisher form (`InvestorRequestForm`) sends
 * submissions, and the Cloudflare Turnstile site key for its bot check.
 *
 * Both are public by design (the browser uses them directly), so they're
 * hardcoded like the Formspree endpoints in `playtestEndpoints.js`.
 *
 *   - endpoint: the investor-contact Cloudflare Worker (source in
 *     aeiti/kato8-sandbox, `workers/investor-contact/`). It verifies the
 *     Turnstile token, forwards the submission to Formspree (see
 *     FORMSPREE.md), and emails the visitor a confirmation. It only
 *     accepts requests from the origins in its ALLOWED_ORIGINS setting.
 *   - turnstileSiteKey: the widget's site key (it starts with a zero,
 *     `0x4…`). The widget only works on the hostnames configured for it
 *     in Cloudflare.
 */
export const investorContact = {
  endpoint: 'https://kato8-investor-contact.kato8-investor-contact.workers.dev',
  turnstileSiteKey: '0x4AAAAAAFp3mx3rHUpF7VkA',
}
