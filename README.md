# Kato.8 Studios — External Site

Marketing site for [Kato.8 Studios](https://kato8studios.com/). React + Vite SPA with prerendered route HTML for SEO, deployed to GitHub Pages.

- **Production**: <https://kato8studios.com/> — this repo (`terrytkato8/external-site`).
- **Staging**: <https://aeiti.github.io/kato8-staging/> — [aeiti/kato8-staging](https://github.com/aeiti/kato8-staging).

For the *why* behind the structural decisions (two repos, env-aware build, prerender, version sync), see [ARCHITECTURE.md](./ARCHITECTURE.md). This README focuses on day-to-day work.

## Tech stack

- **React 18** with **React Router 6** (client-side routing under `BrowserRouter`).
- **Vite 5** (dev server + production build).
- **react-helmet-async** for runtime SEO meta tags.
- Plain CSS (no preprocessor); styles live in `src/styles/`.
- **GitHub Pages** for hosting, via GitHub Actions deploy workflows.

## Quick start

```bash
git clone git@github.com:terrytkato8/external-site.git
cd external-site
npm install
npm run dev      # http://localhost:5173
```

The dev server hot-reloads on save. If HMR stops picking up changes (rare but happens), kill the process and run `npm run dev` again.

## Common tasks

| I want to… | Edit |
|---|---|
| Add or update a game | `src/data/games.js` (and `src/data/seo-config.js` for the SEO entry) |
| Update SEO for a route | `src/data/seo-config.js` |
| Add a social icon | Drop an SVG into `public/assets/img/social/` and register it in `src/components/SocialIcons.jsx` |
| Change nav links | `src/components/Nav.jsx` (desktop) and `src/components/MobileMenu.jsx` (hamburger) |
| Change footer | `src/components/Footer.jsx` |
| Add a static asset | Drop into `public/assets/`, reference via `asset('/assets/...')` from `src/utils/asset.js` |
| Wire a game to Formspree | Add per-game endpoints to `src/data/playtestEndpoints.js` and/or `src/data/discordEndpoints.js`, mirror in `FORMSPREE.md` |
| Add a Kickstarter CTA to a game | Set `kickstarterUrl` on the game's entry in `src/data/games.js` |
| Update styles | `src/styles/main/` (per-feature CSS) |

**Important:** always reference asset URLs through the `asset()` helper. It prefixes `/assets/` with the Vite `BASE_URL`, which differs between prod (`/`) and staging (`/kato8-staging/`).

```jsx
import { asset } from '../utils/asset.js'
<img src={asset('/assets/img/foo.png')} />
```

## Repository layout

```
.
├── .github/workflows/    # CI: release + deploy
├── docs/                 # Build output (kept committed for legacy; Pages now uses Actions)
├── public/               # Static assets copied verbatim into the build
│   └── assets/
│       └── img/
│           └── social/   # Social media icons (SVG)
├── scripts/
│   ├── prerender.mjs     # Writes route-specific HTML with SEO meta tags
│   └── write-cname.mjs   # Writes docs/CNAME only for prod builds
├── src/
│   ├── components/       # Nav, Footer, Hero, SocialIcons, etc.
│   ├── data/             # games.js, seo-config.js (single source of truth)
│   ├── pages/            # HomePage, GamePage, AboutPage, NotFoundPage
│   ├── styles/           # CSS, organized by feature
│   ├── utils/asset.js    # BASE_URL-aware /assets/ prefixer
│   ├── App.jsx           # Routes + body class switching
│   └── main.jsx          # ReactDOM root + Router setup
├── index.html            # Vite entry; SPA fallback decoder for GitHub Pages
├── vite.config.js        # Env-aware base path
└── package.json
```

## Build & deploy

| Command | What it does |
|---|---|
| `npm run dev` | Vite dev server on :5173. No prerender. Default env = prod. |
| `npm run build` | Production build into `docs/`. Writes `docs/CNAME`. Runs prerender. |
| `VITE_DEPLOY_TARGET=staging npm run build` | Staging-flavored build (`/kato8-staging/` base, no CNAME). |
| `npm run preview` | Serve the built `docs/` locally to spot-check. |

Pushes to `main` on either repo trigger that repo's deploy workflow. You don't have to (and shouldn't need to) commit the `docs/` folder anymore — it's still there for now but Pages reads from the workflow artifact.

## Versioning

Every push to `main` on this repo triggers `.github/workflows/release.yml`, which:

1. Computes the next CalVer tag (`vYYYY.MM.DD.N`) from this repo's own tag history.
2. Tags this repo and creates a GitHub Release with a build tarball.

Staging has its own copy of the workflow and tags independently — the two repos' version numbers are unrelated. See [ARCHITECTURE.md → Versioning](./ARCHITECTURE.md#versioning) for details.

## Typical workflow

1. Make a change on a feature branch off `main`.
2. Run `npm run dev` and verify locally.
3. If the change is visually meaningful, port to staging first: open and merge a PR on `aeiti/kato8-staging`, then check <https://aeiti.github.io/kato8-staging/>.
4. Open a PR on this repo, get it reviewed, merge.
5. Merge triggers `Deploy` (publishes to `kato8studios.com`) and `Release` (cuts and mirrors a CalVer tag).

Cherry-picks or hand-applied diffs between repos work cleanly because the source is intentionally identical — config differences are isolated to one env var.

## Troubleshooting

- **`EPERM: process.cwd failed`**: your shell's working directory was deleted/renamed. `cd` to a real path and retry.
- **Dev server shows stale CSS**: kill `npm run dev` and restart it. Vite HMR sometimes gets stuck after dependency installs or branch switches.
- **`vite: command not found` from `npm run build`**: `node_modules` isn't installed. Run `npm install` first.
- **macOS case-collision**: this filesystem treats `Assets/` and `assets/` as the same dir, but git tracks them separately. Always reference lowercase `/assets/` in code; if you're staging a new asset and git lists it under capital-A, explicitly `git add public/assets/...` (lowercase path).
- **404 from a deep link in production**: check `public/404.html` exists in the build output. It's the SPA fallback that converts `/?/foo` back into `/foo`.

## Further reading

- [COMPONENTS.md](./COMPONENTS.md) — render-tree map and per-file pointers for the website code.
- [ARCHITECTURE.md](./ARCHITECTURE.md) — env-aware build, prerender + SPA hybrid, deployment topology, versioning.
