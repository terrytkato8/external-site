// Concept-art management for the dev admin's Concept art tab. Works on the
// same tree the gallery reads: src/assets/games/<slug>/concept/<category>/,
// where jpg/png sources get generated -NNNw.webp variants (gitignored) and
// svg/gif are passthrough. See scripts/generate-image-variants.mjs and
// ConceptArtGallery.jsx for the conventions this mirrors.
//
// Reordering renumbers the NN- filename prefixes the gallery sorts by, using
// the two-pass tmp-prefix dance (everything renamed to tmp-<final> first,
// then to <final>) so a reorder never collides with a name it's about to
// vacate. Variants are renamed alongside their source — same content, same
// mtimes — so no re-encode is triggered.

import fs from 'node:fs'
import path from 'node:path'
import { generateAllVariants } from '../generate-image-variants.mjs'

const RASTER_EXTS = new Set(['.jpg', '.jpeg', '.png'])
const PASSTHROUGH_EXTS = new Set(['.svg', '.gif'])
const VARIANT_PATTERN = /-(\d+)w\.webp$/i
const NAME_RE = /^[a-zA-Z0-9][a-zA-Z0-9._-]*$/

function conceptRoot(root) {
  return path.join(root, 'src/assets/games')
}

// game/category/file all come from the client — allow only plain path
// segments and keep every resolved path inside src/assets/games.
function safeDir(root, game, category) {
  if (!NAME_RE.test(game) || !NAME_RE.test(category)) throw new Error('bad path segment')
  return path.join(conceptRoot(root), game, 'concept', category)
}

function safeFile(root, game, category, file) {
  if (!NAME_RE.test(file)) throw new Error('bad filename')
  return path.join(safeDir(root, game, category), file)
}

export function listArt(root) {
  const games = []
  const base = conceptRoot(root)
  for (const slug of fs.existsSync(base) ? fs.readdirSync(base).sort() : []) {
    const conceptDir = path.join(base, slug, 'concept')
    if (!fs.statSync(path.join(base, slug)).isDirectory() || !fs.existsSync(conceptDir)) continue
    const categories = []
    for (const category of fs.readdirSync(conceptDir).sort()) {
      const dir = path.join(conceptDir, category)
      if (!fs.statSync(dir).isDirectory()) continue
      const files = fs.readdirSync(dir).sort()
      const sources = []
      for (const file of files) {
        const ext = path.extname(file).toLowerCase()
        const isVariant = VARIANT_PATTERN.test(file)
        if (isVariant || (!RASTER_EXTS.has(ext) && !PASSTHROUGH_EXTS.has(ext))) continue
        const stem = path.basename(file, ext)
        const stat = fs.statSync(path.join(dir, file))
        const variants = files
          .filter((f) => VARIANT_PATTERN.test(f) && f.replace(VARIANT_PATTERN, '') === stem)
          .sort((a, b) => Number(a.match(VARIANT_PATTERN)[1]) - Number(b.match(VARIANT_PATTERN)[1]))
          .map((f) => ({
            file: f,
            width: Number(f.match(VARIANT_PATTERN)[1]),
            bytes: fs.statSync(path.join(dir, f)).size,
            stale: fs.statSync(path.join(dir, f)).mtimeMs < stat.mtimeMs,
          }))
        sources.push({
          file,
          bytes: stat.size,
          kind: PASSTHROUGH_EXTS.has(ext) ? 'passthrough' : 'raster',
          variants,
          // A raster source with no variants is invisible to the gallery
          // until the generator runs.
          missingVariants: RASTER_EXTS.has(ext) && !variants.length,
        })
      }
      categories.push({ name: category, sources })
    }
    games.push({ slug, categories })
  }
  return { games }
}

// Strip any existing NN- ordering prefix; what remains is the stable
// descriptive part of the name.
const stripOrder = (file) => file.replace(/^\d+-/, '')

export function reorderArt(root, game, category, order) {
  const dir = safeDir(root, game, category)
  const current = listArt(root).games
    .find((g) => g.slug === game)?.categories.find((c) => c.name === category)
  if (!current) throw new Error(`no such category ${game}/${category}`)
  const have = current.sources.map((s) => s.file).sort()
  if (JSON.stringify([...order].sort()) !== JSON.stringify(have)) {
    throw new Error('order list does not match the files on disk — reload and retry')
  }

  // file → final name, with NN- prefixes reflecting the new order.
  const width = Math.max(2, String(order.length).length)
  const renames = []
  order.forEach((file, i) => {
    const finalName = `${String(i + 1).padStart(width, '0')}-${stripOrder(file)}`
    if (finalName === file) return
    renames.push([file, finalName])
    // Variants ride along under the renamed stem.
    const stem = path.basename(file, path.extname(file))
    const finalStem = path.basename(finalName, path.extname(finalName))
    for (const f of fs.readdirSync(dir)) {
      if (VARIANT_PATTERN.test(f) && f.replace(VARIANT_PATTERN, '') === stem) {
        renames.push([f, finalStem + f.slice(stem.length)])
      }
    }
  })

  // Two passes: everything out of the way first, then into place.
  for (const [from, final] of renames) {
    fs.renameSync(path.join(dir, from), path.join(dir, `tmp-${final}`))
  }
  for (const [, final] of renames) {
    fs.renameSync(path.join(dir, `tmp-${final}`), path.join(dir, final))
  }
  return { renamed: renames.length }
}

export async function uploadArt(root, game, category, filename, buffer) {
  if (!game || !category || !filename || !buffer?.length) throw new Error('missing upload parameters')
  const ext = path.extname(filename).toLowerCase()
  if (!RASTER_EXTS.has(ext) && !PASSTHROUGH_EXTS.has(ext)) {
    throw new Error(`unsupported type ${ext} — use jpg, png, svg, or gif`)
  }
  // Slugify the descriptive part; ordering prefix = next number in the dir.
  const stem = stripOrder(path.basename(filename, path.extname(filename)))
    .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'untitled'
  const dir = safeDir(root, game, category)
  fs.mkdirSync(dir, { recursive: true })
  const existing = fs.readdirSync(dir).filter((f) => !VARIANT_PATTERN.test(f))
  const next = existing.reduce((n, f) => Math.max(n, Number(f.match(/^(\d+)-/)?.[1] ?? 0)), 0) + 1
  const file = `${String(next).padStart(2, '0')}-${stem}${ext}`
  const dest = safeFile(root, game, category, file)
  if (fs.existsSync(dest)) throw new Error(`${file} already exists`)
  fs.writeFileSync(dest, buffer)
  await generateAllVariants() // incremental: only the new file gets encoded
  return { file }
}

export async function deleteArt(root, game, category, file) {
  const dir = safeDir(root, game, category)
  const target = safeFile(root, game, category, file)
  if (!fs.existsSync(target)) throw new Error(`${file} not found`)
  const stem = path.basename(file, path.extname(file))
  fs.rmSync(target)
  for (const f of fs.readdirSync(dir)) {
    if (VARIANT_PATTERN.test(f) && f.replace(VARIANT_PATTERN, '') === stem) {
      fs.rmSync(path.join(dir, f))
    }
  }
  return { ok: true }
}

export { generateAllVariants }
