// The favicon, apple-touch icon, and first-byte social image live in the root
// index.html <head> as static tags (not React, not a JS data literal), so the
// block editor in serialize.mjs can't reach them. This module edits those
// specific tags by targeted, verified string replacement instead.
//
// Each slot is an href/content attribute on one known tag. We read the current
// value, and on write swap just that attribute — leaving the %BASE_URL% prefix
// and everything else untouched. The og:image and twitter:image share one
// value (the same picture), so setting "ogImage" updates both.

import fs from 'node:fs'
import path from 'node:path'

const INDEX = 'index.html'

// slot → the tags whose URL attribute it controls. Each matcher captures the
// attribute value so we can read it and splice a new one in. The `prefix`
// group preserves %BASE_URL% / origin so we only replace the /assets/… tail.
const SLOTS = {
  favicon: [
    { re: /(<link\s+rel="shortcut icon"[^>]*\shref=")([^"]*)(")/, label: 'favicon' },
  ],
  appleTouchIcon: [
    { re: /(<link\s+rel="apple-touch-icon"[^>]*\shref=")([^"]*)(")/, label: 'apple-touch-icon' },
  ],
  ogImage: [
    { re: /(<meta\s+data-prerender\s+property="og:image"\s+content=")([^"]*)(")/, label: 'og:image' },
    { re: /(<meta\s+data-prerender\s+name="twitter:image"\s+content=")([^"]*)(")/, label: 'twitter:image' },
  ],
}

// The tag URLs carry different prefixes before the asset path: favicon and
// apple-touch use `%BASE_URL%assets/…` (BASE_URL ends in a slash, so no slash
// precedes `assets`), while og:image uses an absolute `https://…/assets/…`.
// Both are handled by anchoring on `assets/`: the prefix is everything before
// it (kept verbatim on write), and the picker always sees a normalized
// `/assets/…` path.
function assetTail(url) {
  const i = url.indexOf('assets/')
  return i === -1 ? '' : '/' + url.slice(i)
}
function recompose(oldUrl, assetPath) {
  const i = oldUrl.indexOf('assets/')
  const prefix = i === -1 ? '' : oldUrl.slice(0, i)
  return prefix + assetPath.replace(/^\//, '')
}

export function readHeadImages(root) {
  const src = fs.readFileSync(path.join(root, INDEX), 'utf8')
  const out = {}
  for (const [slot, tags] of Object.entries(SLOTS)) {
    const m = src.match(tags[0].re)
    out[slot] = m ? assetTail(m[2]) : ''
  }
  return out
}

// Set one slot to an /assets/… path, rewriting every tag it controls. Verifies
// each tag was found and re-reads to confirm the new value round-trips.
export function writeHeadImage(root, slot, assetPath) {
  const tags = SLOTS[slot]
  if (!tags) throw new Error(`unknown head-image slot "${slot}"`)
  if (!/^\/assets\/[\w./-]+$/.test(assetPath)) throw new Error('value must be an /assets/… path')
  const abs = path.join(root, INDEX)
  let src = fs.readFileSync(abs, 'utf8')
  for (const { re, label } of tags) {
    if (!re.test(src)) throw new Error(`could not find the ${label} tag in index.html`)
    src = src.replace(re, (_all, pre, oldVal, post) => `${pre}${recompose(oldVal, assetPath)}${post}`)
  }
  fs.writeFileSync(abs, src)
  if (readHeadImages(root)[slot] !== assetPath) {
    throw new Error(`round-trip check failed writing ${slot}`)
  }
  return { ok: true }
}
