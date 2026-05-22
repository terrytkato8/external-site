/**
 * Per-route SEO meta tags. Wraps `react-helmet-async` and injects:
 * `<title>`, description, canonical URL, OpenGraph tags, Twitter card.
 *
 * Rendered by each page (HomePage, AboutPage, GamePage, NotFoundPage)
 * with values from `src/data/seo-config.js`. Crawlers without JS see the
 * prerendered HTML written by `scripts/prerender.mjs`; this component
 * keeps the tags accurate during client-side navigation after hydration.
 *
 * Props:
 *   path           — pathname (e.g. '/about-us'). Used to build the
 *                    canonical URL and OG URL.
 *   title          — `<title>` and default OG/Twitter title.
 *   description    — `<meta name="description">` and default OG/Twitter
 *                    description.
 *   ogTitle        — override OG/Twitter title (optional).
 *   ogDescription  — override OG/Twitter description (optional).
 *   ogImage        — absolute or `/assets/...` path. Falls back to
 *                    `SITE.defaultImage` from seo-config.
 *   noindex        — when true, emits `<meta name="robots" content="noindex">`.
 *                    Used by NotFoundPage.
 */
import { Helmet } from 'react-helmet-async'
import { SITE } from '../data/seo-config'

function absoluteUrl(path) {
  if (!path) return null
  if (/^https?:\/\//.test(path)) return path
  return `${SITE.url}${path.startsWith('/') ? path : `/${path}`}`
}

export default function Seo({ path, title, description, ogTitle, ogDescription, ogImage, noindex }) {
  const url = `${SITE.url}${path}`
  const image = absoluteUrl(ogImage || SITE.defaultImage)
  const finalOgTitle = ogTitle || title
  const finalOgDescription = ogDescription || description

  return (
    <Helmet>
      <title>{title}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={url} />
      {noindex && <meta name="robots" content="noindex" />}

      <meta property="og:site_name" content={SITE.name} />
      <meta property="og:type" content="website" />
      <meta property="og:url" content={url} />
      <meta property="og:title" content={finalOgTitle} />
      <meta property="og:description" content={finalOgDescription} />
      {image && <meta property="og:image" content={image} />}

      <meta name="twitter:card" content={SITE.twitterCard} />
      <meta name="twitter:title" content={finalOgTitle} />
      <meta name="twitter:description" content={finalOgDescription} />
      {image && <meta name="twitter:image" content={image} />}
    </Helmet>
  )
}
