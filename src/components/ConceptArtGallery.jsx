/**
 * `<ConceptArtGallery gameSlug="..." />` — categorized, horizontally
 * scrollable concept-art rows for a game.
 *
 * Hands-off authoring model: a designer drops a source image into
 * `src/assets/games/<slug>/concept/<category>/<filename>.<jpg|png>` and
 * commits. The build pipeline (`scripts/generate-image-variants.mjs`)
 * produces WebP variants at 500/800/1080/1600w alongside the source.
 *
 * How it works:
 *   - `import.meta.glob` (eager, URL mode) enumerates every source image
 *     and every variant under `src/assets/games/*\/concept\/*\/`.
 *   - Sources are grouped by gameSlug → category → filename; each row
 *     renders one `<img>` per source, with a srcSet built from the
 *     variants whose stem matches the source.
 *   - Files within a category are sorted alphabetically by filename.
 *     Use `01-`, `02-`, ... prefixes if you want manual ordering.
 *   - Category subfolder names become row labels (uppercase). Rows are
 *     ordered alphabetically by folder name.
 *   - Alt text is derived from the filename (dashes → spaces, sentence
 *     case). Override by renaming the file.
 *
 * Renders nothing if no source images exist for the slug.
 */

const WIDTHS = [500, 800, 1080, 1600]

// Eagerly enumerate everything up front. Vite resolves these to hashed
// URLs at build time and tree-shakes nothing — the gallery's "drop a
// file in" promise needs *all* files known statically.
const sourceModules = import.meta.glob('/src/assets/games/*/concept/*/*.{jpg,jpeg,png}', { eager: true, query: '?url', import: 'default' })
const variantModules = import.meta.glob('/src/assets/games/*/concept/*/*-[0-9]*w.webp', { eager: true, query: '?url', import: 'default' })

// Build an index keyed by `<slug>/<category>/<stem>` → { src, variants }
const galleryIndex = buildGalleryIndex(sourceModules, variantModules)

function buildGalleryIndex(sources, variants) {
  // Index variants first so we can attach them as we iterate sources.
  // Key shape: `<slug>/<category>/<stem>` → [{ width, url }, ...]
  const variantsByStem = new Map()
  for (const [path, url] of Object.entries(variants)) {
    const match = path.match(/\/src\/assets\/games\/([^/]+)\/concept\/([^/]+)\/(.+)-(\d+)w\.webp$/)
    if (!match) continue
    const [, slug, category, stem, width] = match
    const key = `${slug}/${category}/${stem}`
    if (!variantsByStem.has(key)) variantsByStem.set(key, [])
    variantsByStem.get(key).push({ width: Number(width), url })
  }
  for (const list of variantsByStem.values()) {
    list.sort((a, b) => a.width - b.width)
  }

  // Now group sources: slug → category → [{ filename, src, srcSet, alt }, ...]
  const bySlug = new Map()
  for (const [path, url] of Object.entries(sources)) {
    const match = path.match(/\/src\/assets\/games\/([^/]+)\/concept\/([^/]+)\/(.+)\.(jpg|jpeg|png)$/i)
    if (!match) continue
    const [, slug, category, stem, ext] = match
    const filename = `${stem}.${ext}`
    const variants = variantsByStem.get(`${slug}/${category}/${stem}`) ?? []
    const srcSet = variants.map((v) => `${v.url} ${v.width}w`).join(', ') || undefined
    const alt = filenameToAlt(stem)

    if (!bySlug.has(slug)) bySlug.set(slug, new Map())
    const categories = bySlug.get(slug)
    if (!categories.has(category)) categories.set(category, [])
    categories.get(category).push({ filename, src: url, srcSet, alt })
  }

  // Sort each category's files alphabetically.
  for (const categories of bySlug.values()) {
    for (const items of categories.values()) {
      items.sort((a, b) => a.filename.localeCompare(b.filename, undefined, { numeric: true }))
    }
  }
  return bySlug
}

function filenameToAlt(stem) {
  const cleaned = stem.replace(/[-_]+/g, ' ').trim()
  if (!cleaned) return ''
  return cleaned.charAt(0).toUpperCase() + cleaned.slice(1)
}

function categoryLabel(category) {
  return category.replace(/[-_]+/g, ' ').toUpperCase()
}

export default function ConceptArtGallery({ gameSlug }) {
  const categories = galleryIndex.get(gameSlug)
  if (!categories || categories.size === 0) return null

  const orderedCategories = [...categories.keys()].sort()

  return (
    <section className="concept-art-section">
      <h3 className="concept-art-heading">Concept Art</h3>
      {orderedCategories.map((category) => {
        const items = categories.get(category)
        if (!items || items.length === 0) return null
        return (
          <div key={category} className="concept-art-row">
            <div className="concept-art-row-label-wrapper">
              <span className="concept-art-row-label">{categoryLabel(category)}</span>
              <span className="concept-art-row-divider" aria-hidden="true" />
            </div>
            <div className="concept-art-strip">
              {items.map((item) => (
                <figure key={item.filename} className="concept-art-tile">
                  <img
                    src={item.src}
                    srcSet={item.srcSet}
                    sizes="(max-width: 767px) 70vw, (max-width: 1199px) 40vw, 28vw"
                    loading="lazy"
                    alt={item.alt}
                    className="concept-art-image"
                  />
                </figure>
              ))}
            </div>
          </div>
        )
      })}
    </section>
  )
}
