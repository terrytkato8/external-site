import { asset } from '../utils/asset.js'

export const socialLinks = [
  {
    name: 'Instagram',
    href: 'https://www.instagram.com/kato.8_studios/',
    src: '/assets/img/social/instagram.svg',
  },
  {
    name: 'TikTok',
    href: 'https://www.tiktok.com/@kato.8_studios',
    src: '/assets/img/social/tiktok.svg',
  },
  {
    name: 'X',
    href: 'https://x.com/Kato8_Studios',
    src: '/assets/img/social/x.svg',
  },
  {
    name: 'BlueSky',
    href: 'https://bsky.app/profile/kato-8.bsky.social',
    src: '/assets/img/social/bluesky.svg',
  },
  {
    name: 'YouTube',
    href: 'https://www.youtube.com/@Kato.8Studios',
    src: '/assets/img/social/youtube.svg',
  },
  {
    name: 'LinkedIn',
    href: 'https://www.linkedin.com/company/kato-8-studios/',
    src: '/assets/img/social/linkedin.svg',
  },
]

export function SocialIcon({ name, href, src }) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className="w-inline-block">
      <div className="w-embed">
        <img src={asset(src)} alt={name} width="20" height="20" />
      </div>
    </a>
  )
}
