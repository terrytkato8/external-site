import { Link } from 'react-router-dom'

export default function NotFoundPage() {
  return (
    <section style={{ padding: '6rem 2rem', textAlign: 'center', minHeight: '60vh' }}>
      <h1 style={{ fontSize: '4rem', marginBottom: '1rem' }}>404</h1>
      <p style={{ fontSize: '1.25rem', marginBottom: '2rem' }}>This page doesn't exist.</p>
      <Link to="/" className="nav-about-link">
        Back to home
      </Link>
    </section>
  )
}
