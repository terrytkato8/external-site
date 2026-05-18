const CAMPAIGN_URL = 'https://www.gofundme.com/f/help-launch-my-retro-game-studio'
const ATTRIBUTION_ID = 'sl:0d310464-c723-4851-a424-bfe2bc8ec0a1'

const SIZES = {
  large: { width: 298, height: 506 },
  medium: { width: 298, height: 395 },
  small: { width: 298, height: 125 },
}

export default function GoFundMeWidget({ size = 'large', className }) {
  const { width, height } = SIZES[size] ?? SIZES.large
  const src = `${CAMPAIGN_URL}/widget/${size}?sharesheet=undefined&attribution_id=${ATTRIBUTION_ID}`
  const classes = ['gofundme-widget', `gofundme-widget--${size}`, className].filter(Boolean).join(' ')

  return (
    <iframe
      src={src}
      title="Support Kato.8 Studios on GoFundMe"
      width={width}
      height={height}
      frameBorder="0"
      scrolling="no"
      loading="lazy"
      className={classes}
      style={{ border: 0, maxWidth: '100%' }}
    />
  )
}
