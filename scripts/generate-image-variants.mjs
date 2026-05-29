// Generate responsive WebP variants for every source image under
// `src/assets/games/**/concept/**`. Outputs `<stem>-<width>w.webp` files
// alongside the source, at widths defined in VARIANT_WIDTHS.
//
// Run before `vite build` (wired into the `build` npm script). Variants
// are gitignored — they're produced fresh from source files on every
// deploy. Skips work if the variant exists and is newer than its source.
//
// Why: the ConceptArtGallery component wants srcSet for performance but
// the "hands-off" promise to designers is "drop the source file in, ship
// it." This script honors both.

import { promises as fs } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '..')
const CONCEPT_ROOT = path.join(ROOT, 'src/assets/games')

const VARIANT_WIDTHS = [500, 800, 1080, 1600]
const SOURCE_EXTS = new Set(['.jpg', '.jpeg', '.png'])
// Match output filenames so we don't re-process our own variants.
const VARIANT_PATTERN = /-\d+w\.webp$/i

async function walk(dir) {
  let entries
  try {
    entries = await fs.readdir(dir, { withFileTypes: true })
  } catch (err) {
    if (err.code === 'ENOENT') return []
    throw err
  }
  const files = []
  for (const entry of entries) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      files.push(...(await walk(full)))
    } else if (entry.isFile()) {
      files.push(full)
    }
  }
  return files
}

async function isUpToDate(sourcePath, variantPath) {
  try {
    const [src, variant] = await Promise.all([fs.stat(sourcePath), fs.stat(variantPath)])
    return variant.mtimeMs >= src.mtimeMs
  } catch {
    return false
  }
}

async function generateVariants(sourcePath) {
  const ext = path.extname(sourcePath).toLowerCase()
  if (!SOURCE_EXTS.has(ext)) return { skipped: true }
  if (VARIANT_PATTERN.test(sourcePath)) return { skipped: true }

  const dir = path.dirname(sourcePath)
  const stem = path.basename(sourcePath, ext)
  const image = sharp(sourcePath)
  const metadata = await image.metadata()
  const sourceWidth = metadata.width ?? Infinity

  let generated = 0
  let upToDate = 0
  for (const width of VARIANT_WIDTHS) {
    if (width >= sourceWidth) continue
    const outPath = path.join(dir, `${stem}-${width}w.webp`)
    if (await isUpToDate(sourcePath, outPath)) {
      upToDate++
      continue
    }
    await image.clone().resize({ width }).webp({ quality: 82 }).toFile(outPath)
    generated++
  }
  return { generated, upToDate }
}

async function main() {
  const files = await walk(CONCEPT_ROOT)
  const sources = files.filter((f) => SOURCE_EXTS.has(path.extname(f).toLowerCase()) && !VARIANT_PATTERN.test(f))

  if (sources.length === 0) {
    console.log(`[variants] no source images under ${path.relative(ROOT, CONCEPT_ROOT)} — nothing to do`)
    return
  }

  let totalGenerated = 0
  let totalUpToDate = 0
  for (const source of sources) {
    const result = await generateVariants(source)
    if (result.skipped) continue
    totalGenerated += result.generated
    totalUpToDate += result.upToDate
  }
  console.log(`[variants] processed ${sources.length} source(s); generated ${totalGenerated}, up-to-date ${totalUpToDate}`)
}

main().catch((err) => {
  console.error('[variants] failed:', err)
  process.exit(1)
})
