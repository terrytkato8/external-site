import { Link, useLocation } from 'react-router-dom'
import Seo from '../components/Seo'
import { NOT_FOUND_META } from '../data/seo-config'

/**
 * Catch-all route (`<Route path="*" />` in App.jsx) and also rendered by
 * `GamePage` when a slug doesn't match any known game.
 *
 * Shows a "404 / This page doesn't exist." block with a link home.
 * Inline styles instead of CSS classes — small enough to keep self-contained.
 *
 * SEO meta comes from `NOT_FOUND_META` in `src/data/seo-config.js`, which
 * sets `noindex: true` so the page isn't surfaced in search results.
 */

// Editable copy for the 404 page. Kept as an anchored data literal so the dev
// admin (Pages tab) can rewrite the words without touching the JSX. No
// comments inside this block — the admin serializer drops them on save.
const notFoundContent = {
  heading: '404',
  body: "This page doesn't exist.",
  backLabel: 'Back to home',
}

export default function NotFoundPage() {
  const location = useLocation()
  return (
    <section style={{ padding: '6rem 2rem', textAlign: 'center', minHeight: '60vh' }}>
      <Seo path={location.pathname} {...NOT_FOUND_META} />
      <h1 style={{ fontSize: '4rem', marginBottom: '1rem' }}>{notFoundContent.heading}</h1>
      <p style={{ fontSize: '1.25rem', marginBottom: '2rem' }}>{notFoundContent.body}</p>
      <Link to="/" className="nav-about-link">
        {notFoundContent.backLabel}
      </Link>
    </section>
  )
}
