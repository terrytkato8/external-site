import { Link } from 'react-router-dom'
import { games } from '../data/games'
import { asset } from '../utils/asset.js'

const footerSocials = [
  {
    name: 'Instagram',
    href: 'https://www.instagram.com/kato.8_studios/',
    paths: [
      'M8,1.441c2.136,0,2.389.009,3.233.047a4.419,4.419,0,0,1,1.485.276,2.472,2.472,0,0,1,.92.6,2.472,2.472,0,0,1,.6.92,4.419,4.419,0,0,1,.276,1.485c.038.844.047,1.1.047,3.233s-.009,2.389-.047,3.233a4.419,4.419,0,0,1-.276,1.485,2.644,2.644,0,0,1-1.518,1.518,4.419,4.419,0,0,1-1.485.276c-.844.038-1.1.047-3.233.047s-2.389-.009-3.233-.047a4.419,4.419,0,0,1-1.485-.276,2.472,2.472,0,0,1-.92-.6,2.472,2.472,0,0,1-.6-.92,4.419,4.419,0,0,1-.276-1.485c-.038-.844-.047-1.1-.047-3.233s.009-2.389.047-3.233a4.419,4.419,0,0,1,.276-1.485,2.472,2.472,0,0,1,.6-.92,2.472,2.472,0,0,1,.92-.6,4.419,4.419,0,0,1,1.485-.276c.844-.038,1.1-.047,3.233-.047M8,0C5.827,0,5.555.009,4.7.048A5.868,5.868,0,0,0,2.76.42a3.908,3.908,0,0,0-1.417.923A3.908,3.908,0,0,0,.42,2.76,5.868,5.868,0,0,0,.048,4.7C.009,5.555,0,5.827,0,8s.009,2.445.048,3.3A5.868,5.868,0,0,0,.42,13.24a3.908,3.908,0,0,0,.923,1.417,3.908,3.908,0,0,0,1.417.923,5.868,5.868,0,0,0,1.942.372C5.555,15.991,5.827,16,8,16s2.445-.009,3.3-.048a5.868,5.868,0,0,0,1.942-.372,4.094,4.094,0,0,0,2.34-2.34,5.868,5.868,0,0,0,.372-1.942c.039-.853.048-1.125.048-3.3s-.009-2.445-.048-3.3A5.868,5.868,0,0,0,15.58,2.76a3.908,3.908,0,0,0-.923-1.417A3.908,3.908,0,0,0,13.24.42,5.868,5.868,0,0,0,11.3.048C10.445.009,10.173,0,8,0Z',
      'M8,3.892A4.108,4.108,0,1,0,12.108,8,4.108,4.108,0,0,0,8,3.892Zm0,6.775A2.667,2.667,0,1,1,10.667,8,2.667,2.667,0,0,1,8,10.667Z',
    ],
    circle: { cx: '12.27', cy: '3.73', r: '0.96' },
  },
  {
    name: 'TikTok',
    href: 'https://www.tiktok.com/@kato.8_studios',
    paths: [
      'M16.6 5.82s.51.5 0 0A4.28 4.28 0 0 1 15.54 3h-3.09v12.4a2.59 2.59 0 0 1-2.59 2.5c-1.42 0-2.6-1.16-2.6-2.6c0-1.72 1.66-3.01 3.37-2.48V9.66c-3.45-.46-6.47 2.22-6.47 5.64c0 3.33 2.76 5.7 5.69 5.7c3.14 0 5.69-2.55 5.69-5.7V9.01a7.35 7.35 0 0 0 4.3 1.38V7.3s-1.88.09-3.24-1.48',
    ],
  },
  {
    name: 'Twitter',
    href: 'https://x.com/Kato8_Studios',
    paths: [
      'M12.3723 1.16992H14.6895L9.6272 6.95576L15.5825 14.829H10.9196L7.26734 10.0539L3.08837 14.829H0.769833L6.18442 8.64037L0.471436 1.16992H5.2528L8.55409 5.53451L12.3723 1.16992ZM11.5591 13.4421H12.843L4.55514 2.48399H3.17733L11.5591 13.4421Z',
    ],
  },
  {
    name: 'Bluesky',
    href: 'https://bsky.app/profile/kato-8.bsky.social',
    paths: [
      'M9.2 6.9c2.7 2.1 5.7 6.3 6.8 8.5c1.1-2.2 4-6.4 6.8-8.5c2-1.5 5.2-2.6 5.2 1s-.4 6.2-.7 7c-.9 3.1-4 3.8-6.8 3.4c4.8.8 6.1 3.6 3.4 6.3c-5.1 5.2-7.3-1.3-7.8-3c0-.3-.1-.5-.1-.3c0-.1 0 0-.1.3c-.6 1.7-2.8 8.2-7.8 3c-2.7-2.7-1.4-5.5 3.4-6.3c-2.8.5-5.9-.3-6.8-3.4c-.2-.9-.7-6.3-.7-7c0-3.7 3.2-2.5 5.2-1',
    ],
  },
  {
    name: 'LinkedIn',
    href: 'https://www.linkedin.com/company/kato-8-studios/',
    paths: [
      'M15.3,0H0.7C0.3,0,0,0.3,0,0.7v14.7C0,15.7,0.3,16,0.7,16h14.7c0.4,0,0.7-0.3,0.7-0.7V0.7C16,0.3,15.7,0,15.3,0z M4.7,13.6H2.4V6h2.4V13.6z M3.6,5C2.8,5,2.2,4.3,2.2,3.6c0-0.8,0.6-1.4,1.4-1.4c0.8,0,1.4,0.6,1.4,1.4C4.9,4.3,4.3,5,3.6,5z M13.6,13.6h-2.4V9.9c0-0.9,0-2-1.2-2c-1.2,0-1.4,1-1.4,2v3.8H6.2V6h2.3v1h0c0.3-0.6,1.1-1.2,2.2-1.2c2.4,0,2.8,1.6,2.8,3.6V13.6z',
    ],
  },
]

export default function Footer() {
  return (
    <footer className="footer is-secondary section-2">
      <div className="container">
        <div className="w-layout-grid grid_6-col gap-small">
          <div className="footer-brand-block">
            <img
              src={asset('/assets/img/anime-type.png')}
              loading="lazy"
              sizes="(max-width: 624px) 100vw, 624px"
              srcSet={asset('/assets/img/anime-type-500.png 500w, /assets/img/anime-type.png 624w')}
              alt="Kato.8 Studios"
              className="footer-brand-logo"
            />
            <p className="text-color_secondary paragraph_small">
              Kato.8 Studios is an emerging indie game studio focused on creating modern games with retro-inspired aesthetics, mechanics, and emotional
              engagement.
            </p>
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
                    <svg width="100%" height="100%" viewBox="0 0 16 16" aria-hidden="true">
                      {social.paths.map((d, i) => (
                        <path key={i} d={d} fill="currentColor" />
                      ))}
                      {social.circle && <circle {...social.circle} fill="currentColor" />}
                    </svg>
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
            <li className="margin-bottom_none">
              <a href="#" className="footer_link w-inline-block">
                <div>Terms</div>
              </a>
            </li>
            <li className="margin-bottom_none">
              <a href="#" className="footer_link w-inline-block">
                <div>Cookies</div>
              </a>
            </li>
            <li className="margin-bottom_none">
              <a href="#" className="footer_link w-inline-block">
                <div>Legal</div>
              </a>
            </li>
          </ul>
          <div className="text-color_secondary">© 2026 Kato.8. All rights reserved.</div>
        </div>
      </div>
    </footer>
  )
}
