# Claude Code context

This file is auto-loaded by Claude Code (and read by other AI assistants) when working in this repo. For full context, read [README.md](./README.md) and [ARCHITECTURE.md](./ARCHITECTURE.md).

## What this is

The marketing site for Kato.8 Studios. React + Vite SPA, prerendered HTML for SEO, deployed to GitHub Pages at <https://kato8studios.com/>.

A staging mirror lives at `aeiti/kato8-staging` and serves <https://aeiti.github.io/kato8-staging/>. Source is intentionally near-identical between the two repos; differences are produced from a single env var (`VITE_DEPLOY_TARGET`) at build time.

## Conventions

- **Commits are authored solely by the user.** Do NOT add `Co-Authored-By: Claude <…>` trailers. The user is `Adam Manning <manning.adam@icloud.com>`.
- **One logical change per PR.** Branch off `main`. Use `gh pr create` to open PRs and `gh pr merge --squash --delete-branch` to merge.
- **Asset URLs go through `asset()`** from `src/utils/asset.js`. Never embed bare `/assets/...` paths in JSX — they'll 404 on staging where the base URL is `/kato8-staging/`.
- **New routes need an SEO entry** in `src/data/seo-config.js` so `scripts/prerender.mjs` produces a static HTML file with the right meta tags.
- **Don't commit `node_modules`, secrets, or `.env` files.** `public/CNAME` is intentionally absent — the build script writes `docs/CNAME` based on `VITE_DEPLOY_TARGET`.
- **Lowercase `/assets/` paths.** macOS treats `Assets/` and `assets/` as the same directory; git does not. Stage new asset files with explicit lowercase paths to avoid double-tracking.

## Common requests

| User asks for… | Touch |
|---|---|
| Add a new game | `src/data/games.js` + `src/data/seo-config.js`. Verify assets exist in `public/assets/img/`. |
| Update SEO | `src/data/seo-config.js`. Rebuild to refresh prerendered HTML. |
| Add a social icon | Drop SVG into `public/assets/img/social/`, add an entry to `src/components/SocialIcons.jsx`. |
| Update nav or footer | `src/components/Nav.jsx`, `src/components/MobileMenu.jsx`, `src/components/Footer.jsx`. |
| Style change | `src/styles/main/` (per-feature) or `src/styles/main/pages/<page>.css`. |
| Deployment / version question | See [ARCHITECTURE.md](./ARCHITECTURE.md) sections "Deployment" and "Version sync". |

## Deployment summary

Pushes to `main` trigger:

- `.github/workflows/deploy.yml` — builds and publishes to Pages (Actions source, not "Deploy from a branch").
- `.github/workflows/release.yml` — cuts a CalVer tag and mirrors it to `aeiti/kato8-staging`. Staging never auto-tags.

If a change is visually meaningful, port to the staging repo first, merge there, verify on the staging URL, then merge here.

## Don't break these

- `BrowserRouter` must have `basename={import.meta.env.BASE_URL}` — required for staging routing.
- `vite.config.js` `base` must remain env-aware; never hard-code `/kato8-staging/`.
- `release.yml` must keep the "Fetch staging tags" step before computing CalVer; otherwise version numbers collide.
- `scripts/write-cname.mjs` runs after `vite build` and before `scripts/prerender.mjs` in `package.json`. Order matters — write-cname depends on `docs/` existing.
