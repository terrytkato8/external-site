// Generates a static HTML file per route under docs/, with route-specific
// meta tags substituted into the <!-- seo:start --> / <!-- seo:end --> block.
// Runs after `vite build`. The SPA still hydrates normally on top.

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import {
  SITE,
  staticRoutes,
  gameRoutes,
  listPrerenderRoutes,
} from '../src/data/seo-config.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const docsDir = path.join(__dirname, '..', 'docs')
const indexPath = path.join(docsDir, 'index.html')

const MARKER_RE = /<!-- seo:start -->[\s\S]*?<!-- seo:end -->/

function escapeAttr(str = '') {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

function escapeText(str = '') {
  return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

function absoluteUrl(p) {
  if (!p) return null
  if (/^https?:\/\//.test(p)) return p
  return `${SITE.url}${p.startsWith('/') ? p : `/${p}`}`
}

function routeMetaFor(pathname) {
  if (staticRoutes[pathname]) return staticRoutes[pathname]
  const m = pathname.match(/^\/games\/([^/]+)\/?$/)
  if (m && gameRoutes[m[1]]) return gameRoutes[m[1]]
  throw new Error(`No SEO config for route ${pathname}`)
}

function buildSeoBlock(pathname, meta) {
  const url = `${SITE.url}${pathname}`
  const image = absoluteUrl(meta.ogImage || SITE.defaultImage)
  const ogTitle = meta.ogTitle || meta.title
  const ogDescription = meta.ogDescription || meta.description

  const lines = [
    '<!-- seo:start -->',
    `    <title data-prerender>${escapeText(meta.title)}</title>`,
    `    <meta data-prerender name="description" content="${escapeAttr(meta.description)}" />`,
    `    <link data-prerender rel="canonical" href="${escapeAttr(url)}" />`,
    `    <meta data-prerender property="og:site_name" content="${escapeAttr(SITE.name)}" />`,
    '    <meta data-prerender property="og:type" content="website" />',
    `    <meta data-prerender property="og:url" content="${escapeAttr(url)}" />`,
    `    <meta data-prerender property="og:title" content="${escapeAttr(ogTitle)}" />`,
    `    <meta data-prerender property="og:description" content="${escapeAttr(ogDescription)}" />`,
    image && `    <meta data-prerender property="og:image" content="${escapeAttr(image)}" />`,
    `    <meta data-prerender name="twitter:card" content="${escapeAttr(SITE.twitterCard)}" />`,
    `    <meta data-prerender name="twitter:title" content="${escapeAttr(ogTitle)}" />`,
    `    <meta data-prerender name="twitter:description" content="${escapeAttr(ogDescription)}" />`,
    image && `    <meta data-prerender name="twitter:image" content="${escapeAttr(image)}" />`,
    '    <!-- seo:end -->',
  ].filter(Boolean)

  return lines.join('\n')
}

function outPathFor(pathname) {
  if (pathname === '/') return indexPath
  const sub = pathname.replace(/^\//, '').replace(/\/$/, '')
  return path.join(docsDir, sub, 'index.html')
}

function main() {
  if (!fs.existsSync(indexPath)) {
    throw new Error(`Expected built index.html at ${indexPath}. Run \`vite build\` first.`)
  }

  const template = fs.readFileSync(indexPath, 'utf8')
  if (!MARKER_RE.test(template)) {
    throw new Error('SEO marker block not found in docs/index.html. Check index.html.')
  }

  const routes = listPrerenderRoutes()
  for (const pathname of routes) {
    const meta = routeMetaFor(pathname)
    const block = buildSeoBlock(pathname, meta)
    const html = template.replace(MARKER_RE, block)
    const out = outPathFor(pathname)
    fs.mkdirSync(path.dirname(out), { recursive: true })
    fs.writeFileSync(out, html)
    const rel = path.relative(path.join(__dirname, '..'), out)
    console.log(`prerendered ${pathname.padEnd(28)} → ${rel}`)
  }
}

main()
