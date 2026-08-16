// Checks that every internal reference in the built site resolves to a file
// that actually shipped. Catches the class of bug where a path is renamed,
// an asset is dropped from the repo, or a hand-written /assets/... string
// goes stale — none of which fail the build, and all of which surface as a
// 404 on the live site.
//
// What it checks, all inside docs/:
//   - every href/src/srcset in every .html file
//   - every url(...) in every .css file
//   - every "/assets/<...>.<ext>" string literal in every .js bundle
//     (this is what the `asset()` helper emits, so a bad asset path in JSX
//      is caught here even though nothing imports the file)
//   - that every route in listPrerenderRoutes() actually emitted an HTML file
//
// Two things it deliberately does NOT check:
//
//   - External URLs. The site references a third-party CDN and social
//     profiles; HEAD-ing those in CI would fail the pipeline on someone
//     else's outage.
//   - Internal <Link to="..."> route targets. This is a SPA: nav links are
//     rendered by React Router at runtime and appear nowhere in the built
//     HTML, only as bare string literals in the minified bundle where they
//     can't be told apart from any other string. A link pointing at a
//     nonexistent route is therefore invisible here — catching that needs a
//     source-level scan of `to=` props, which is a different tool.
//
// Usage:
//   node scripts/check-built-site.mjs            # checks ./docs
//   node scripts/check-built-site.mjs --dir docs # explicit
//   node scripts/check-built-site.mjs --quiet    # only print on failure
//
// Exits 0 when every reference resolves, 1 otherwise (listing each miss with
// the file and reference that produced it).

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { listPrerenderRoutes } from '../src/data/seo-config.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '..')

// Prefer a repo-relative path in output, but fall back to absolute when the
// target sits outside the repo (e.g. --dir pointed at a scratch copy).
function display(p) {
  const rel = path.relative(ROOT, p)
  return rel && !rel.startsWith('..') ? rel : p
}

function usage(msg) {
  if (msg) console.error(`error: ${msg}\n`)
  console.error('usage: node scripts/check-built-site.mjs [--dir <built-dir>] [--quiet]')
  process.exit(msg ? 1 : 0)
}

const argv = process.argv.slice(2)
let dirArg = 'docs'
let quiet = false
for (let i = 0; i < argv.length; i++) {
  const a = argv[i]
  if (a === '--dir') dirArg = argv[++i] ?? usage('--dir needs a value')
  else if (a === '--quiet') quiet = true
  else if (a === '--help' || a === '-h') usage()
  else usage(`unknown argument: ${a}`)
}

const builtDir = path.resolve(ROOT, dirArg)

// Schemes and fragments that never point at a file we ship.
const SKIP_RE = /^(?:[a-z][a-z0-9+.-]*:|\/\/|#|$)/i

function walk(dir, out = []) {
  let entries
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true })
  } catch {
    return out
  }
  for (const e of entries) {
    const full = path.join(dir, e.name)
    if (e.isDirectory()) walk(full, out)
    else out.push(full)
  }
  return out
}

// The build's public base path ('/' on prod, '/kato8-staging/' on staging).
// Read it off the entry script rather than taking it as a flag, so the check
// is correct for whichever target produced this directory.
function detectBase(indexHtml) {
  const m = indexHtml.match(/<script[^>]+src="([^"]*\/assets\/index-[^"]+\.js)"/)
  if (!m) return '/'
  const idx = m[1].indexOf('/assets/')
  return idx <= 0 ? '/' : m[1].slice(0, idx + 1)
}

// Map a reference to the file on disk it should resolve to, or null to skip.
function resolveRef(ref, fromFile, base) {
  const trimmed = ref.trim()
  if (!trimmed || SKIP_RE.test(trimmed)) return null

  // Drop query and hash, then undo percent-encoding (%20 in filenames).
  let p = trimmed.split('#')[0].split('?')[0]
  if (!p) return null
  try {
    p = decodeURIComponent(p)
  } catch {
    /* malformed escape — check the raw form */
  }

  let abs
  if (p.startsWith('/')) {
    // Strip the public base before resolving into the built directory.
    const rel = base !== '/' && p.startsWith(base) ? p.slice(base.length) : p.replace(/^\//, '')
    abs = path.join(builtDir, rel)
  } else {
    abs = path.resolve(path.dirname(fromFile), p)
  }

  // Never let a reference escape the built directory.
  if (abs !== builtDir && !abs.startsWith(builtDir + path.sep)) return null
  return abs
}

// A reference resolves if the file exists, or if it's an extension-less route
// that prerender emitted as <route>/index.html.
function exists(abs) {
  if (fs.existsSync(abs) && fs.statSync(abs).isFile()) return true
  if (path.extname(abs)) return false
  return fs.existsSync(path.join(abs, 'index.html'))
}

function refsFromHtml(html) {
  const refs = []
  for (const m of html.matchAll(/\b(?:href|src)="([^"]*)"/g)) refs.push(m[1])
  // srcset: comma-separated "<url> <descriptor>" pairs.
  for (const m of html.matchAll(/\bsrcset="([^"]*)"/g)) {
    for (const part of m[1].split(',')) {
      const url = part.trim().split(/\s+/)[0]
      if (url) refs.push(url)
    }
  }
  return refs
}

function refsFromCss(css) {
  const refs = []
  for (const m of css.matchAll(/url\(\s*(?:"([^"]*)"|'([^']*)'|([^)'"]*))\s*\)/g)) {
    refs.push(m[1] ?? m[2] ?? m[3] ?? '')
  }
  return refs
}

// Only string literals that look like a real asset file. The `asset()` helper
// also emits the bare '/assets/' prefix, which is a building block, not a
// reference — requiring an extension filters those out.
//
// Two forms appear in the bundle and both must be matched:
//   - base-prefixed ('/kato8-staging/assets/x-hash.webp') — Vite resolved the
//     import at build time and baked the base in.
//   - bare ('/assets/img/x.png') — an `asset()` argument, which prepends
//     BASE_URL at runtime, so the literal in the bundle has no base.
// On prod (base '/') the two forms coincide; on staging, matching only the
// prefixed form silently skipped every `asset()` path.
function refsFromJs(js, base) {
  const refs = new Set()
  const prefixes = base === '/' ? ['/'] : [base, '/']
  for (const prefix of prefixes) {
    const escaped = prefix.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    const re = new RegExp(`["'\`](${escaped}assets/[^"'\`]*\\.[a-z0-9]{2,5})["'\`]`, 'gi')
    for (const m of js.matchAll(re)) refs.add(m[1])
  }
  return [...refs]
}

function main() {
  if (!fs.existsSync(builtDir)) {
    console.error(`error: no built directory at ${display(builtDir)}. Run \`npm run build\` first.`)
    process.exit(1)
  }
  const indexPath = path.join(builtDir, 'index.html')
  if (!fs.existsSync(indexPath)) {
    console.error(`error: no index.html in ${display(builtDir)}. Is that the built directory?`)
    process.exit(1)
  }

  const base = detectBase(fs.readFileSync(indexPath, 'utf8'))
  const files = walk(builtDir)
  const misses = []
  let checked = 0
  const counts = { html: 0, css: 0, js: 0 }

  for (const file of files) {
    const ext = path.extname(file).toLowerCase()
    let refs
    if (ext === '.html') {
      refs = refsFromHtml(fs.readFileSync(file, 'utf8'))
      counts.html++
    } else if (ext === '.css') {
      refs = refsFromCss(fs.readFileSync(file, 'utf8'))
      counts.css++
    } else if (ext === '.js') {
      refs = refsFromJs(fs.readFileSync(file, 'utf8'), base)
      counts.js++
    } else {
      continue
    }

    for (const ref of refs) {
      const abs = resolveRef(ref, file, base)
      if (abs === null) continue
      checked++
      if (!exists(abs)) {
        misses.push({ from: path.relative(builtDir, file), ref, want: path.relative(builtDir, abs) })
      }
    }
  }

  // Every route the prerender step promises should exist as a static file.
  // A missing one means crawlers get the SPA fallback with no route-specific
  // meta — the exact failure prerendering exists to prevent.
  const missingRoutes = listPrerenderRoutes().filter((route) => {
    const rel = route === '/' ? 'index.html' : path.join(route.replace(/^\//, ''), 'index.html')
    return !fs.existsSync(path.join(builtDir, rel))
  })

  if (misses.length || missingRoutes.length) {
    if (misses.length) {
      console.error(`check-built-site: ${misses.length} broken reference(s) in ${display(builtDir)}/\n`)
      for (const m of misses) {
        console.error(`  ${m.from}`)
        console.error(`    references : ${m.ref}`)
        console.error(`    expected   : ${m.want}\n`)
      }
      console.error('These would 404 on the live site. Fix the path, or restore the missing file.\n')
    }
    if (missingRoutes.length) {
      console.error(`check-built-site: ${missingRoutes.length} prerendered route(s) missing an HTML file:\n`)
      for (const r of missingRoutes) console.error(`  ${r}`)
      console.error('\nlistPrerenderRoutes() promises these but the build did not emit them. Did prerender.mjs run?')
    }
    process.exit(1)
  }

  if (!quiet) {
    console.log(
      `check-built-site: ${checked} internal references OK ` +
        `(${counts.html} html, ${counts.css} css, ${counts.js} js; base '${base}'), ` +
        `${listPrerenderRoutes().length} prerendered routes present`
    )
  }
}

main()
