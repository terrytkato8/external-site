/**
 * Thin announcement strip rendered above the nav on every page (mounted in
 * App.jsx). Announces where Kato.8 will be appearing in person.
 *
 * `conventionBanner.lead` is the sentence before the list; each convention has
 * an optional `href` (name renders as a new-tab link when set, plain text when
 * null). Both are editable from the dev admin's Banner tab.
 *
 * The banner renders nothing when `conventions` is empty, so once the events
 * have passed you can clear the list from the admin instead of unmounting the
 * component in App.jsx.
 */
const conventionBanner = {
  lead: 'Catch Kato.8 in Seattle this September —',
  conventions: [
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
  ],
}

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
  const { lead, conventions } = conventionBanner
  if (!conventions.length) return null

  return (
    <aside className="convention-banner" role="note" aria-label="Convention appearances">
      <p className="convention-banner_text">
        {lead}{' '}
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
