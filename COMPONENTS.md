# Components index

Map of the React code that generates the site. Pair this with each file's JSDoc header for full context — this file is the bird's-eye view, the headers are the details.

For build/deploy/version-system docs, see [ARCHITECTURE.md](./ARCHITECTURE.md).

## Render tree

What gets mounted where:

```
main.jsx
└── <App>                              src/App.jsx
    ├── <ScrollToTop>                  zero-render; scrolls to top on route change
    ├── <Analytics>                    zero-render; fires GA page_view on route change
    ├── <ConventionBanner>             announcement strip above the nav (temporary)
    ├── <Nav>                          persistent top bar
    │   └── <MobileMenu>               hamburger overlay (narrow viewports)
    │       └── <SocialIcon>
    └── <Routes>
    │   ├── /            → <HomePage>
    │   │                   ├── <Seo>
    │   │                   ├── <Hero>
    │   │                   ├── <GameGrid>
    │   │                   │   └── <GameCard>           (one per game)
    │   │                   └── <SupportSection>
    │   │                       └── <GoFundMeWidget>
    │   ├── /games/:slug → <GamePage>
    │   │                   ├── <Seo>
    │   │                   ├── <KickstarterButton>          (if game.kickstarterUrl)
    │   │                   ├── <ConceptArtGallery>
    │   │                   ├── <PlaytestSignupForm>
    │   │                   └── <DiscordSignupForm>
    │   ├── /about-us    → <AboutPage>
    │   │                   ├── <Seo>
    │   │                   └── <GoFundMeWidget>
    │   └── *            → <NotFoundPage>
    │                       └── <Seo noindex>
    └── <Footer>                       persistent bottom bar
```

## Pages

Routes are declared in [`src/App.jsx`](./src/App.jsx).

| Path | File | Purpose |
|---|---|---|
| `/` | [`src/pages/HomePage.jsx`](./src/pages/HomePage.jsx) | Landing page. Composes Hero + GameGrid + SupportSection. |
| `/games/:slug` | [`src/pages/GamePage.jsx`](./src/pages/GamePage.jsx) | Per-game detail page. Reads slug from URL, looks up the game in `src/data/games.js`, renders hero + optional Kickstarter CTA + story + concept-art gallery + per-game playtest and Discord sign-up forms. Unknown slug falls back to `NotFoundPage`. |
| `/about-us` | [`src/pages/AboutPage.jsx`](./src/pages/AboutPage.jsx) | Studio mission, story behind the name, embedded documentary episode, GoFundMe pitch. Copy is hand-authored in the file. |
| `*` | [`src/pages/NotFoundPage.jsx`](./src/pages/NotFoundPage.jsx) | Catch-all 404 page. Also rendered by `GamePage` for unknown slugs. |

To add a route: add a `<Route>` in `App.jsx`, a page component under `src/pages/`, and an entry in `src/data/seo-config.js` so the prerender step generates static HTML for it.

## Persistent chrome

These mount once at the app root (see `App.jsx`) and appear on every page.

| Component | File | Purpose |
|---|---|---|
| `<Nav>` | [`src/components/Nav.jsx`](./src/components/Nav.jsx) | Top bar. Logo, Games dropdown, About link, social icons. Owns the mobile menu open/close state. |
| `<Footer>` | [`src/components/Footer.jsx`](./src/components/Footer.jsx) | Bottom bar. Brand block, games list, studio links, social links, footer policies. |
| `<MobileMenu>` | [`src/components/MobileMenu.jsx`](./src/components/MobileMenu.jsx) | Slide-in panel for narrow viewports. Rendered by `Nav`. |
| `<Analytics>` | [`src/components/Analytics.jsx`](./src/components/Analytics.jsx) | Zero-render. Fires GA `page_view` on every route change. |
| `<ScrollToTop>` | [`src/components/ScrollToTop.jsx`](./src/components/ScrollToTop.jsx) | Zero-render. Scrolls window to top on every route change. |
| `<ConventionBanner>` | [`src/components/ConventionBanner.jsx`](./src/components/ConventionBanner.jsx) | Thin announcement strip above `Nav`. Lists upcoming in-person appearances from a `conventions` array at the top of the file; each entry's `href` is optional (null renders plain text). **Temporary** — unmount from `App.jsx` once the listed events have passed. |

## Page sections

Composed into pages.

| Component | File | Rendered by | Purpose |
|---|---|---|---|
| `<Hero>` | [`src/components/Hero.jsx`](./src/components/Hero.jsx) | HomePage | Logo + studio tagline at the top of the home page. |
| `<GameGrid>` | [`src/components/GameGrid.jsx`](./src/components/GameGrid.jsx) | HomePage | "Games" tile grid. Iterates `src/data/games.js`. |
| `<GameCard>` | [`src/components/GameCard.jsx`](./src/components/GameCard.jsx) | GameGrid | One tile. Background image, title, tagline, "Learn More" link. |
| `<SupportSection>` | [`src/components/SupportSection.jsx`](./src/components/SupportSection.jsx) | HomePage | "Help Us Build Something Special" block + GoFundMe widget. |
| `<GoFundMeWidget>` | [`src/components/GoFundMeWidget.jsx`](./src/components/GoFundMeWidget.jsx) | SupportSection, AboutPage | Embeds the GoFundMe campaign iframe. |
| `<ConceptArtGallery>` | [`src/components/ConceptArtGallery.jsx`](./src/components/ConceptArtGallery.jsx) | GamePage | Auto-discovers concept-art images from `src/assets/games/<slug>/concept/<category>/` and renders one horizontal-scroll row per category. See [Concept-art authoring](#concept-art-authoring) below. |
| `<KickstarterButton>` | [`src/components/KickstarterButton.jsx`](./src/components/KickstarterButton.jsx) | GamePage | "Back on Kickstarter" CTA. Rendered only when the game entry in `src/data/games.js` has a `kickstarterUrl`. Opens in a new tab. |
| `<PlaytestSignupForm>` | [`src/components/PlaytestSignupForm.jsx`](./src/components/PlaytestSignupForm.jsx) | GamePage | Per-game playtest sign-up. Posts to the game's Formspree endpoint from `src/data/playtestEndpoints.js`. Missing endpoint = form still works locally, no network call. |
| `<DiscordSignupForm>` | [`src/components/DiscordSignupForm.jsx`](./src/components/DiscordSignupForm.jsx) | GamePage | Per-game Discord community sign-up. Same shape as the playtest form; endpoints in `src/data/discordEndpoints.js`. |
| `<NewsletterSignup>` | [`src/components/NewsletterSignup.jsx`](./src/components/NewsletterSignup.jsx) | (not currently mounted) | General newsletter sign-up form. Posts to `VITE_NEWSLETTER_ENDPOINT`. Kept around for future placement — drop into any page as `<NewsletterSignup source="..." />`. |

## Shared utilities

| Module | File | Purpose |
|---|---|---|
| `<Seo>` | [`src/components/Seo.jsx`](./src/components/Seo.jsx) | Per-route `<title>`, description, canonical, OG, Twitter card. Wraps `react-helmet-async`. Used by every page. |
| `<SocialIcon>` + `socialLinks` | [`src/components/SocialIcons.jsx`](./src/components/SocialIcons.jsx) | Social-media link data and icon renderer. Used by Nav + MobileMenu. |
| `asset()` | [`src/utils/asset.js`](./src/utils/asset.js) | Prefixes `/assets/...` with `BASE_URL` so paths resolve under both prod (`/`) and staging (`/kato8-staging/`). Use this for every `/assets/...` reference. |

## Data files

These define the content the components render. Editing them is usually how you "add a game" or "change the SEO copy."

| Module | File | Purpose |
|---|---|---|
| Games | [`src/data/games.js`](./src/data/games.js) | One entry per game: slug, title, tagline, categories, story/gameplay paragraphs, asset paths, optional `kickstarterUrl`. Consumed by Nav, MobileMenu, Footer, GameGrid, GamePage. |
| SEO config | [`src/data/seo-config.js`](./src/data/seo-config.js) | Per-route SEO metadata. Used by `<Seo>` at runtime and by `scripts/prerender.mjs` at build time. |
| Playtest endpoints | [`src/data/playtestEndpoints.js`](./src/data/playtestEndpoints.js) | Per-game Formspree endpoint for `<PlaytestSignupForm>`, keyed by slug. Mirror any change in [FORMSPREE.md](./FORMSPREE.md). |
| Discord endpoints | [`src/data/discordEndpoints.js`](./src/data/discordEndpoints.js) | Per-game Formspree endpoint for `<DiscordSignupForm>`, keyed by slug. Mirror any change in [FORMSPREE.md](./FORMSPREE.md). |

## Common tasks

| Goal | What to edit |
|---|---|
| Add or update a game | `src/data/games.js` + `src/data/seo-config.js` (`gameRoutes`) |
| Change SEO copy | `src/data/seo-config.js` |
| Change nav links | `src/components/Nav.jsx` (desktop) + `src/components/MobileMenu.jsx` (mobile) |
| Change footer | `src/components/Footer.jsx` |
| Add/swap a social icon | Drop SVG into `public/assets/img/social/`, edit `src/components/SocialIcons.jsx` |
| Add a static asset | Drop into `public/assets/`, reference via `asset('/assets/...')` |
| Change home page hero text | `src/components/Hero.jsx` |
| Change About copy | `src/pages/AboutPage.jsx` (hand-authored, no data file) |
| Update or retire the convention banner | `src/components/ConventionBanner.jsx` (edit the `conventions` array); to retire it, remove the `<ConventionBanner />` mount in `App.jsx` |
| Add a new route | New `<Route>` in `App.jsx`, new file in `src/pages/`, new entry in `src/data/seo-config.js` |
| Update concept art for a game | Drop / rename / `git rm` files under `src/assets/games/<game-slug>/concept/<category>/`. No code change. See [Concept-art authoring](#concept-art-authoring). |
| Add a Kickstarter CTA to a game | Set `kickstarterUrl` on the game's entry in `src/data/games.js`. The button appears automatically. |
| Wire a game to Formspree | Add the endpoint URL(s) to `src/data/playtestEndpoints.js` and/or `src/data/discordEndpoints.js` (keyed by slug) and mirror the change in `FORMSPREE.md`. |

## Concept-art authoring

`<ConceptArtGallery>` reads images directly from the filesystem — no `src/data/games.js` edits, no manual srcSet.

**Folder schema** (must match exactly):

```
src/assets/games/<game-slug>/concept/<category>/<filename>.<ext>
```

| Segment | Rule | Effect on the page |
|---|---|---|
| `<game-slug>` | Matches the `slug` in `src/data/games.js` (e.g. `universal-serial-blade`). | Determines which game page the row appears on. |
| `<category>` | Lowercase folder name. Use dashes for spaces (e.g. `characters`, `enemies`, `key-art`). | Becomes the uppercased row label (`KEY ART`). |
| `<filename>` | Lowercase. Dashes for spaces. Make it descriptive — it becomes the alt text. | `boss-final-design.jpg` → alt `"Boss final design"`. |
| `<ext>` | Lowercase. Raster: `.jpg`, `.jpeg`, `.png` (**not** `.JPG`) — WebP variants are generated from these. Vector/animated: `.svg`, `.gif` — served as-is (no variants). | Determines how it's shipped (see Image-size guidance). |

**Ordering, additions, moves:**

- **Display order within a row** = alphabetical by filename. Prefix `01-`, `02-`, `03-` to force order.
- **Row order** = alphabetical by category folder name. Use the same prefix trick if you need a specific order.
- **Add a new row** = create a new `<category>/` subfolder and drop images in. The row appears automatically.
- **Move image between rows** = `git mv` between subfolders. No code change.

**Image-size guidance:**

For raster art, drop the **full-resolution original** (ideally ≥1600 px wide). At build time [`scripts/generate-image-variants.mjs`](./scripts/generate-image-variants.mjs) uses `sharp` to produce 500/800/1080/1600w WebP variants alongside the source (or a single native-width variant if the source is narrower than all of those), and the component builds an automatic `srcSet` from them. The variants are gitignored and regenerated every build; the repo carries only the originals, but the **deployed site ships only the variants** — the multi-megabyte originals are never emitted. So a source with no generated variant would not appear at all; the generator guarantees at least one.

`.svg` and `.gif` sources skip that pipeline and are served as-is with no `srcSet` — resampling vector art degrades it, and `sharp` would flatten an animated GIF to a still frame. If a raster source and a same-named `.svg`/`.gif` coexist, the raster's variants win. Stale variants whose source was renamed or removed are pruned automatically each build, so a rename doesn't leave a ghost tile.

**Workflow:**

```bash
# Drop / rename / git rm under src/assets/games/<slug>/concept/<category>/
git add src/assets/games/<slug>/concept/
git commit -m "Update <game> concept art"
git push
```

CI rebuilds (including variants) and redeploys on push to `main`.

## File-level docs

Each component / page / data file carries a JSDoc-style header comment explaining purpose, props, and where it's used. Open the file — the comment is at the top.
