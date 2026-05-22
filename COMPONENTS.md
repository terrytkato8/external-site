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
    │   │                   └── (hand-authored layout consuming game data)
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
| `/games/:slug` | [`src/pages/GamePage.jsx`](./src/pages/GamePage.jsx) | Per-game detail page. Reads slug from URL, looks up the game in `src/data/games.js`, renders hero + story + concept art. Unknown slug falls back to `NotFoundPage`. |
| `/about-us` | [`src/pages/AboutPage.jsx`](./src/pages/AboutPage.jsx) | Studio mission, story behind the name, GoFundMe pitch. Copy is hand-authored in the file. |
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

## Page sections

Composed into pages.

| Component | File | Rendered by | Purpose |
|---|---|---|---|
| `<Hero>` | [`src/components/Hero.jsx`](./src/components/Hero.jsx) | HomePage | Logo + studio tagline at the top of the home page. |
| `<GameGrid>` | [`src/components/GameGrid.jsx`](./src/components/GameGrid.jsx) | HomePage | "Games" tile grid. Iterates `src/data/games.js`. |
| `<GameCard>` | [`src/components/GameCard.jsx`](./src/components/GameCard.jsx) | GameGrid | One tile. Background image, title, tagline, "Learn More" link. |
| `<SupportSection>` | [`src/components/SupportSection.jsx`](./src/components/SupportSection.jsx) | HomePage | "Help Us Build Something Special" block + GoFundMe widget. |
| `<GoFundMeWidget>` | [`src/components/GoFundMeWidget.jsx`](./src/components/GoFundMeWidget.jsx) | SupportSection, AboutPage | Embeds the GoFundMe campaign iframe. |

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
| Games | [`src/data/games.js`](./src/data/games.js) | One entry per game: slug, title, tagline, categories, story/gameplay paragraphs, asset paths. Consumed by Nav, MobileMenu, Footer, GameGrid, GamePage. |
| SEO config | [`src/data/seo-config.js`](./src/data/seo-config.js) | Per-route SEO metadata. Used by `<Seo>` at runtime and by `scripts/prerender.mjs` at build time. |

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
| Add a new route | New `<Route>` in `App.jsx`, new file in `src/pages/`, new entry in `src/data/seo-config.js` |

## File-level docs

Each component / page / data file carries a JSDoc-style header comment explaining purpose, props, and where it's used. Open the file — the comment is at the top.
