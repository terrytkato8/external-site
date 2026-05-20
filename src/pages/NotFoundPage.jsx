import { Link, useLocation } from 'react-router-dom'
import Seo from '../components/Seo'
import { NOT_FOUND_META } from '../data/seo-config'

export default function NotFoundPage() {
  const location = useLocation()
  return (
    <section style={{ padding: '6rem 2rem', textAlign: 'center', minHeight: '60vh' }}>
      <Seo path={location.pathname} {...NOT_FOUND_META} />
      <h1 style={{ fontSize: '4rem', marginBottom: '1rem' }}>404</h1>
      <p style={{ fontSize: '1.25rem', marginBottom: '2rem' }}>This page doesn't exist.</p>
      <Link to="/" className="nav-about-link">
        Back to home
      </Link>
    </section>
  )
}
