/**
 * Small strip at the top of every page on the staging site
 * (aeiti.github.io/kato8-staging), so a staging tab is never mistaken for
 * kato8studios.com. Mounted in App.jsx.
 *
 * Inert on prod: Vite replaces `import.meta.env.BASE_URL` with a literal at
 * build time, so on prod (base '/') the check is constant-false, the
 * component renders nothing, and the strip's markup never ships. Styles are
 * inline so the component is self-contained and needs no CSS import.
 */
const IS_STAGING = import.meta.env.BASE_URL === '/kato8-staging/'

const style = {
  background: '#ffd60a',
  color: '#111',
  font: '600 12px/1.2 system-ui, sans-serif',
  letterSpacing: '0.04em',
  padding: '4px 12px',
  textAlign: 'center',
}

export default function StagingBanner() {
  if (!IS_STAGING) return null
  return (
    <div role="note" aria-label="Staging site" style={style}>
      STAGING — preview build, not the live site (kato8studios.com)
    </div>
  )
}
