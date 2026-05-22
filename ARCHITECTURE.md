# Architecture

Background on the non-obvious decisions in this codebase. Read [README.md](./README.md) first if you haven't.

## Two repos, one site

The Kato.8 marketing site lives in two GitHub repos:

| Repo | Owner | Serves | Pages mode |
|---|---|---|---|
| `terrytkato8/external-site` (this one) | terrytkato8 | <https://kato8studios.com/> | GitHub Actions |
| `aeiti/kato8-staging` | aeiti | <https://aeiti.github.io/kato8-staging/> | GitHub Actions |

Each repo runs its own deploy pipeline. The codebases are intentionally near-identical: only repo-specific CI files differ. The user-visible config differences (base URL, CNAME) are produced from a single env var at build time, not from divergent source.

**Why two repos:** historical — staging was set up as an independent GitHub Pages project under a different account so its custom domain wouldn't compete with `kato8studios.com`. The arrangement is intentional and we lean into it via the env-aware build below.

## Env-aware build

A single env var (`VITE_DEPLOY_TARGET`) controls everything that should differ between targets:

| `VITE_DEPLOY_TARGET` | Base URL | `docs/CNAME` written? |
|---|---|---|
| unset / `prod` (default) | `/` | yes, `kato8studios.com` |
| `staging` | `/kato8-staging/` | no |

Default-is-prod is deliberate: a `npm run build` with no env set always produces a production-safe artifact. Staging builds opt in.

Implementation:

- **[`vite.config.js`](./vite.config.js)** reads `process.env.VITE_DEPLOY_TARGET` and sets `base` accordingly.
- **[`scripts/write-cname.mjs`](./scripts/write-cname.mjs)** runs after `vite build` and either writes `docs/CNAME` (prod) or removes it (anything else). Replaces the older `public/CNAME` pattern, which got copied verbatim by Vite into every build — so a staging build used to be able to (and did) claim `kato8studios.com`.
- **[`src/utils/asset.js`](./src/utils/asset.js)** wraps any `/assets/...` URL in `import.meta.env.BASE_URL` so references resolve correctly under whatever subpath the site is served from.

Always go through `asset()` when referencing static assets. If you embed a bare `/assets/foo.png` in JSX, it'll 404 on staging.

## Routing & subpaths

`BrowserRouter` in [`src/main.jsx`](./src/main.jsx) is configured with:

```jsx
<BrowserRouter basename={import.meta.env.BASE_URL}>
```

Without this, React Router on staging would see paths like `/kato8-staging/games/corebound`, fail to match any route, and render `NotFoundPage`. With it, the prefix is stripped before route matching, so `<Route path="/" />` matches the staging root.

On prod, `BASE_URL` is `/` and the `basename` prop is a no-op.

## Prerender + SPA hybrid

The site is a single-page React app, but each route also has a prerendered HTML file with the right SEO meta tags baked in. That gives crawlers what they need without giving up the SPA UX.

**How it works:**

1. `vite build` produces `docs/index.html` with the JS bundle reference and a placeholder SEO block.
2. `scripts/prerender.mjs` then iterates over routes in `src/data/seo-config.js` and writes `docs/<route>/index.html` files — copies of `index.html` with the placeholder block replaced by route-specific `<title>`, `<meta name="description">`, OpenGraph, Twitter card, etc.
3. GitHub Pages serves the right `<route>/index.html` for direct visits.
4. After hydration, [`src/components/Seo.jsx`](./src/components/Seo.jsx) (which uses `react-helmet-async`) takes over to keep meta tags accurate during client-side navigation.

**SPA fallback for deep-link refreshes:**

- A user lands on `/games/corebound` and refreshes → GitHub Pages serves `docs/games/corebound/index.html` directly (because we prerendered it). Works.
- A user lands on a route we *didn't* prerender → GitHub Pages serves `public/404.html`, which redirects to `index.html?/games/corebound`. The inline script in `index.html` (the "SPA fallback decoder") converts that back into a real `/games/corebound` path before React Router reads `window.location`. Works.

If you add a new top-level route, **also add it to `src/data/seo-config.js`** so the prerender step generates a static HTML file for it. Otherwise crawlers fall into the 404-redirect fallback and won't get the right meta tags on first byte.

## Deployment

Both repos use the "GitHub Actions" Pages source.

- **`terrytkato8/external-site`** → [`.github/workflows/deploy.yml`](./.github/workflows/deploy.yml). On push to `main`: build (default = prod) → `actions/upload-pages-artifact` → `actions/deploy-pages` → live at `kato8studios.com`.
- **`aeiti/kato8-staging`** → [`.github/workflows/deploy-staging.yml`](https://github.com/aeiti/kato8-staging/blob/main/.github/workflows/deploy-staging.yml). Same shape, but sets `VITE_DEPLOY_TARGET=staging`.

Pages reads the custom domain (`kato8studios.com`) from the prod repo's Settings → Pages → Custom domain field, not from any `CNAME` file in the artifact. The `CNAME` file the build writes is now mostly belt-and-suspenders.

The committed `docs/` folder in this repo is legacy. Before we moved to Actions-based Pages, `docs/` was the deployment artifact. It's still there for now; it could be deleted in a follow-up cleanup.

## Versioning

Each repo runs its own `release.yml` and tags independently. There is no cross-repo coordination — version numbers between prod and staging are unrelated.

[`prod release.yml`](./.github/workflows/release.yml) runs on every push to prod `main`:

1. Compute next CalVer:
   - `DATE = today (UTC)`
   - `LAST_PATCH = max patch number of any vDATE.* tag on this repo`
   - `NEXT_PATCH = LAST_PATCH + 1` (or `0` if no tag exists for today)
2. Build, tag, push tag to this repo's `origin`.
3. Create a GitHub Release with build tarball.

Staging has the same workflow shape but builds with `VITE_DEPLOY_TARGET=staging` and runs on its own `main`. Its tags share the same `vYYYY.MM.DD.N` format but are computed independently from staging's own tag history.

### How tag scenarios resolve

For today (`2026-05-22`) on the prod repo, looking only at prod's tags:

| Prod's highest today | Next prod release |
|---|---|
| (none) | `v2026.05.22.0` |
| `v2026.05.22.0` | `v2026.05.22.1` |
| `v2026.05.21.5` (yesterday only) | `v2026.05.22.0` (yesterday ignored) |

UTC dates. Patch numbers reset to `0` each day. Staging's tag history is irrelevant to prod's computation, and vice versa.

## SEO data

[`src/data/seo-config.js`](./src/data/seo-config.js) is the single source of truth for per-route SEO metadata:

- `SITE` — site-level constants (canonical URL, default OG image).
- `staticRoutes` — entries for `/`, `/about-us`, the 404 page.
- `gameRoutes` — keyed by slug; consumed by `GamePage`.
- `listPrerenderRoutes()` — returns the route list `scripts/prerender.mjs` iterates over.

When you add a game, add an entry here AND in `src/data/games.js`. The two files are deliberately separate: `games.js` holds the rendered content; `seo-config.js` holds the SEO surface.

## Known gotchas

- **macOS case-collision**: the filesystem is case-insensitive but git is not. The staging repo at one point tracked files under both `Assets/` (capital) and `assets/` (lowercase). Always reference lowercase `/assets/...` in code. If you `git add` a new asset and it lands under capital-A on a Mac, use the explicit lowercase path: `git add public/assets/img/foo.svg`.
- **Multiple clones**: keep a single canonical clone per repo. `~/GitHub/external-site` is the canonical prod clone on the author's machine. Running `npm run dev` from `~/Desktop/external-site` after editing in `~/GitHub/external-site` is a classic "why aren't my changes showing up" trap.
- **Stale Vite HMR**: if HMR stops picking up CSS or JSX changes, kill `npm run dev` and restart. Usually triggered by branch switches or dependency changes mid-session.
- **First request after a long quiet period**: GitHub Pages might be cold and take a few seconds to respond. Not a bug.
- **Pages "Custom domain" field**: don't leave it blank in prod's Settings → Pages, or `kato8studios.com` stops resolving even though the build writes a `CNAME` file. The Settings field is authoritative when using Actions deployment.
