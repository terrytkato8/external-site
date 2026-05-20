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
