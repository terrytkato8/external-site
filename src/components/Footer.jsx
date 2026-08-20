/**
 * Site-wide footer.
 *
 * Rendered once at the app root in App.jsx (appears on every page).
 *
 * Sections:
 *   - Brand: studio logo + tagline blurb.
 *   - Games: links to each game page, sourced from `src/data/games.js`.
 *   - Studio: link to About.
 *   - Community: social media links. Uses its own `footerSocials` array
 *     (separate from nav's `socialLinks`) because the footer renders each
 *     link as icon + name text, while the nav is icon-only. `.footer_icon`
 *     is currently hidden via CSS (`display: none`) — only the labels show.
 *
 * Bottom bar: the `footerLegal` block (Terms/Cookies/Legal links + copyright),
 * editable from the dev admin's Pages → Footer tab.
 */
import { Link } from 'react-router-dom'
import { games } from '../data/games'
import { asset } from '../utils/asset.js'

const footerSocials = [
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

const footerBrand = {
  logo: {
    src: '/assets/img/anime-type.png',
    alt: 'Kato.8 Studios',
  },
  blurb:
    'Kato.8 Studios is an emerging indie game studio focused on creating modern games with retro-inspired aesthetics, mechanics, and emotional engagement.',
}

const footerLegal = {
  links: [
    {
      label: 'Terms',
      href: '#',
    },
    {
      label: 'Cookies',
      href: '#',
    },
    {
      label: 'Legal',
      href: '#',
    },
  ],
  copyright: '© 2026 Kato.8. All rights reserved.',
}

export default function Footer() {
  return (
    <footer className="footer is-secondary section-2">
      <div className="container">
        <div className="w-layout-grid grid_6-col gap-small">
          <div className="footer-brand-block">
            <img
              src={asset(footerBrand.logo.src)}
              loading="lazy"
              alt={footerBrand.logo.alt}
              className="footer-brand-logo"
            />
            <p className="text-color_secondary paragraph_small">{footerBrand.blurb}</p>
          </div>

          <div>
            <ul role="list" className="w-list-unstyled">
              <li>
                <h2 className="heading_xxsmall">GAMES</h2>
              </li>
            </ul>
            <div className="nav-games-list-wrapper w-dyn-list">
              <div role="list" className="nav-games-list w-dyn-items">
                {games.map((game) => (
                  <div key={game.slug} role="listitem" className="nav-games-item w-dyn-item">
                    <Link to={`/games/${game.slug}`} className="link footer-link">
                      {game.title}
                    </Link>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <ul role="list" className="w-list-unstyled">
            <li>
              <h2 className="heading_xxsmall">STUDIO</h2>
            </li>
            <li>
              <Link to="/about-us" className="footer_link w-inline-block">
                <div>About Us</div>
              </Link>
            </li>
          </ul>

          <ul role="list" aria-label="Social media links" className="w-list-unstyled">
            <li>
              <h2 className="heading_xxsmall">COMMUNITY</h2>
            </li>
            {footerSocials.map((social) => (
              <li key={social.name}>
                <a href={social.href} target="_blank" rel="noopener noreferrer" className="footer_link w-inline-block">
                  <div className="footer_icon">
                    <img src={asset(social.src)} alt="" width="20" height="20" />
                  </div>
                  <div>{social.name}</div>
                </a>
              </li>
            ))}
          </ul>
        </div>

        <div className="divider margin-top_xsmall margin-bottom_xsmall" />

        <div className="footer_bottom">
          <ul role="list" className="button-group gap-xsmall margin-top_none w-list-unstyled">
            {footerLegal.links.map((link) => (
              <li key={link.label} className="margin-bottom_none">
                <a href={link.href} className="footer_link w-inline-block">
                  <div>{link.label}</div>
                </a>
              </li>
            ))}
          </ul>
          <div className="text-color_secondary">{footerLegal.copyright}</div>
        </div>
      </div>
    </footer>
  )
}
