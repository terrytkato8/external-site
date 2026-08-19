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
