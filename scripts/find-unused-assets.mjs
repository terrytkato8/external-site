#!/usr/bin/env node
/**
 * Find committed static assets under `public/assets/` that nothing in the
 * source references — so orphaned art (e.g. a logo left behind by a swap) is
 * easy to spot and remove.
 *
 * How it decides "referenced": it greps the source tree (src/, scripts/, the
 * root index.html, and any public/*.html) for each asset's filename as a plain
 * substring. Paths in the app are written as `/assets/img/foo.png` and piped
 * through `asset()`, so matching the basename (`foo.png`) catches every form.
 *
 * Scope is deliberately `public/assets/` only. The concept-art images under
 * `src/assets/games/<slug>/concept/` are discovered by `import.meta.glob` at
 * build time (see ConceptArtGallery), never by a literal path — a filename grep
 * there would be all false positives, so this tool leaves them alone.
 *
 * Responsive variants (`<stem>-<width>.<ext>`, e.g. `kato-dog-800.jpg`) are
 * handled as a family: an unreferenced variant whose base (`kato-dog.jpg`) or a
 * sibling variant IS referenced is reported separately as "review" rather than
 * a confident orphan, because those are often built into a srcset by hand or
 * emitted by the variant generator. A file with no referenced relative at all
 * is a confident orphan.
 *
 * Usage:
 *   node scripts/find-unused-assets.mjs                 # report (dry run)
 *   node scripts/find-unused-assets.mjs --json          # machine-readable
 *   node scripts/find-unused-assets.mjs --delete        # remove confident orphans
 *   node scripts/find-unused-assets.mjs --delete --include-variants
 *                                                       # also remove unreferenced variants
 *
 * Exit code: 0 always on a successful scan (it's a report, not a gate). Pair it
 * with `git status` after `--delete` to review what went.
 */

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')

const args = new Set(process.argv.slice(2))
const asJson = args.has('--json')
const doDelete = args.has('--delete')
const includeVariants = args.has('--include-variants')

// Where assets to audit live.
const ASSET_DIR = path.join(root, 'public', 'assets')
// Text trees + files to grep for references.
const SOURCE_DIRS = [path.join(root, 'src'), path.join(root, 'scripts')]
const SOURCE_FILES = [path.join(root, 'index.html')]
// Text file types worth reading into the reference haystack.
const TEXT_EXT = new Set(['.js', '.mjs', '.cjs', '.jsx', '.ts', '.tsx', '.css', '.html', '.json', '.md', '.svg'])
const VARIANT_RE = /^(.*)-(\d+)\.([^.]+)$/ // stem-<width>.ext

function walk(dir, out = []) {
  if (!fs.existsSync(dir)) return out
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) walk(full, out)
    else out.push(full)
  }
  return out
}

// --- Build the reference haystack (all source text concatenated) -------------
let haystack = ''
for (const dir of SOURCE_DIRS) {
  for (const file of walk(dir)) {
    // Don't let this script's own doc-comment examples count as references.
    if (path.resolve(file) === path.resolve(fileURLToPath(import.meta.url))) continue
    if (TEXT_EXT.has(path.extname(file))) haystack += fs.readFileSync(file, 'utf8') + '\n'
  }
}
for (const file of SOURCE_FILES) {
  if (fs.existsSync(file)) haystack += fs.readFileSync(file, 'utf8') + '\n'
}
// public/*.html (e.g. 404.html) — reference assets, but skip anything under assets/.
for (const file of walk(path.join(root, 'public'))) {
  if (file.startsWith(ASSET_DIR)) continue
  if (path.extname(file) === '.html') haystack += fs.readFileSync(file, 'utf8') + '\n'
}

const isReferenced = (basename) => haystack.includes(basename)

// --- Audit the assets --------------------------------------------------------
const assets = walk(ASSET_DIR).map((full) => {
  const rel = path.relative(root, full)
  const base = path.basename(full)
  const m = base.match(VARIANT_RE)
  return {
    full,
    rel,
    base,
    size: fs.statSync(full).size,
    variantBase: m ? `${m[1]}.${m[3]}` : null, // e.g. kato-dog.jpg
    variantStem: m ? m[1] : null, // e.g. kato-dog
    referenced: isReferenced(base),
  }
})

// A variant counts as "family-referenced" if its base or any sibling is used.
const referencedBasenames = new Set(assets.filter((a) => a.referenced).map((a) => a.base))
function familyReferenced(a) {
  if (!a.variantStem) return false
  if (referencedBasenames.has(a.variantBase)) return true
  return assets.some(
    (b) => b.referenced && b.variantStem === a.variantStem && b !== a
  )
}

const orphans = [] // no reference to it or any relative → confident
const staleVariants = [] // unreferenced, but the family is used → review
for (const a of assets) {
  if (a.referenced) continue
  if (familyReferenced(a)) staleVariants.push(a)
  else orphans.push(a)
}

const kb = (n) => `${(n / 1024).toFixed(1)} KB`
const totalSize = (list) => list.reduce((n, a) => n + a.size, 0)

if (asJson) {
  console.log(
    JSON.stringify(
      {
        scanned: assets.length,
        orphans: orphans.map(({ rel, size }) => ({ rel, size })),
        staleVariants: staleVariants.map(({ rel, size }) => ({ rel, size })),
      },
      null,
      2
    )
  )
} else {
  console.log(`Scanned ${assets.length} asset(s) under public/assets/\n`)
  if (orphans.length) {
    console.log(`ORPHANS (${orphans.length}) — nothing references these or any relative:`)
    for (const a of orphans.sort((x, y) => y.size - x.size)) console.log(`  ${a.rel}  (${kb(a.size)})`)
    console.log(`  → ${kb(totalSize(orphans))} reclaimable\n`)
  } else {
    console.log('ORPHANS: none 🎉\n')
  }
  if (staleVariants.length) {
    console.log(`UNREFERENCED VARIANTS (${staleVariants.length}) — base/sibling is used, these`)
    console.log('are not directly referenced (generated set or hand-built srcset — review):')
    for (const a of staleVariants.sort((x, y) => y.size - x.size)) console.log(`  ${a.rel}  (${kb(a.size)})`)
    console.log(`  → ${kb(totalSize(staleVariants))} if removed\n`)
  }
}

// --- Optional deletion -------------------------------------------------------
if (doDelete) {
  const toDelete = includeVariants ? [...orphans, ...staleVariants] : orphans
  if (!toDelete.length) {
    if (!asJson) console.log('Nothing to delete.')
  } else {
    for (const a of toDelete) fs.rmSync(a.full)
    if (!asJson) {
      console.log(
        `Deleted ${toDelete.length} file(s) (${kb(totalSize(toDelete))}). ` +
          'Review with `git status` and commit.'
      )
    }
  }
}
