// Enumerates the site's static images so the admin's image fields (card
// background, story/cover image, OG image) can offer an autocomplete of real
// paths and flag a value that points at a file that doesn't exist. This is the
// class of typo the site has been bitten by before — a promoted path that
// 404s only on the deployed page.
//
// Paths are returned in the same `/assets/…` form the data files and the
// asset() helper use (i.e. with the leading `public/` stripped), sorted.

import fs from 'node:fs'
import path from 'node:path'

const IMAGE_EXTS = new Set(['.png', '.jpg', '.jpeg', '.webp', '.svg', '.gif', '.avif', '.ico'])

function walk(dir, acc) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) walk(full, acc)
    else if (IMAGE_EXTS.has(path.extname(entry.name).toLowerCase())) acc.push(full)
  }
}

export function listAssets(root) {
  const base = path.join(root, 'public')
  const assetsDir = path.join(base, 'assets')
  if (!fs.existsSync(assetsDir)) return []
  const files = []
  walk(assetsDir, files)
  return files
    .map((f) => '/' + path.relative(base, f).split(path.sep).join('/'))
    .sort()
}

// Write an uploaded image into public/assets/img so it's part of the build
// (Vite copies public/ verbatim). The name is slugified and auto-numbered on
// collision — same convention as the concept-art uploader — and the returned
// value is the /assets/… path the data files reference. Site images here need
// no responsive variants (unlike concept art): every editable field renders a
// single src, so a plain copy into place is all the build needs.
export function saveAsset(root, filename, buffer) {
  if (!filename || !buffer?.length) throw new Error('missing upload parameters')
  const ext = path.extname(filename).toLowerCase()
  if (!IMAGE_EXTS.has(ext)) {
    throw new Error(`unsupported type ${ext} — use png, jpg, webp, svg, gif, avif, or ico`)
  }
  const stem = path.basename(filename, path.extname(filename))
    .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'image'
  const dir = path.join(root, 'public/assets/img')
  fs.mkdirSync(dir, { recursive: true })
  let name = `${stem}${ext}`
  for (let n = 2; fs.existsSync(path.join(dir, name)); n++) name = `${stem}-${n}${ext}`
  fs.writeFileSync(path.join(dir, name), buffer)
  return { path: `/assets/img/${name}` }
}
