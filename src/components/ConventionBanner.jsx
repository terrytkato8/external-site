/**
 * Thin announcement strip rendered above the nav on every page (mounted in
 * App.jsx). Announces where Kato.8 will be appearing in person.
 *
 * Each convention has an optional `href`; when set, the convention's name
 * renders as a new-tab link, otherwise as plain text. Set `href` to null to
 * drop a link without touching the JSX.
 *
 * Remove this component's mount in App.jsx once the events have passed
 * (PAX West ends Sept 7, 2026).
 */
const conventions = [
  {
    name: 'Seattle SLICE',
    dates: 'Sept 2',
    href: 'https://seattleslice.org/',
  },
  {
    name: 'PAX West',
    dates: 'Sept 4–7',
    href: 'https://west.paxsite.com/en-us.html',
  },
]

function ConventionName({ name, href }) {
  if (href) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className="convention-banner_link">
        {name}
      </a>
    )
  }
  return <span className="convention-banner_name">{name}</span>
}

export default function ConventionBanner() {
  return (
    <aside className="convention-banner" role="note" aria-label="Convention appearances">
      <p className="convention-banner_text">
        Catch Kato.8 in Seattle this September —{' '}
        {conventions.map((convention, index) => (
          <span key={convention.name}>
            {index > 0 && ' & '}
            <ConventionName name={convention.name} href={convention.href} />{' '}
            <span className="convention-banner_dates">({convention.dates})</span>
          </span>
        ))}
      </p>
    </aside>
  )
}
