// Regenerates the endpoint table in FORMSPREE.md from the two live endpoint
// maps (discordEndpoints.js / playtestEndpoints.js), so the Endpoints tab no
// longer just *reminds* you to update the doc — saving does it.
//
// Only the markdown table is rewritten; the surrounding prose (intro + the
// "when adding a new form" note) is preserved verbatim. Row labels are built
// from each game's title in games.js (falling back to the slug), so the table
// reads "Universal Serial Blade Discord" rather than a bare slug. The file is
// only touched when the regenerated table actually differs.

import fs from 'node:fs'
import path from 'node:path'
import { readBlock } from './serialize.mjs'

const DOC = 'FORMSPREE.md'

function titleFor(games, slug) {
  return games.find((g) => g.slug === slug)?.title || slug
}

// Build the "| Form | Endpoint |" table body from both maps. Discord rows
// first, then playtest, each in games.js order followed by any extra slugs
// that only exist in the endpoint map.
function buildTable(discord, playtest, games) {
  const order = [
    ...games.map((g) => g.slug),
    ...Object.keys(discord).filter((s) => !games.some((g) => g.slug === s)),
    ...Object.keys(playtest).filter((s) => !games.some((g) => g.slug === s)),
  ].filter((s, i, a) => a.indexOf(s) === i)

  const rows = ['| Form | Endpoint |', '|---|---|']
  for (const [map, kind] of [[discord, 'Discord'], [playtest, 'Playtest']]) {
    for (const slug of order) {
      if (!map[slug]) continue
      rows.push(`| ${titleFor(games, slug)} ${kind} | <${map[slug]}> |`)
    }
  }
  return rows.join('\n')
}

export function writeFormspreeDoc(root) {
  const abs = path.join(root, DOC)
  if (!fs.existsSync(abs)) throw new Error(`${DOC} not found`)
  const discord = readBlock(root, 'discordEndpoints').value
  const playtest = readBlock(root, 'playtestEndpoints').value
  const games = readBlock(root, 'games').value

  const src = fs.readFileSync(abs, 'utf8')
  const table = buildTable(discord, playtest, games)

  // Replace the existing table: from the header row through the last
  // consecutive table line. Anchored on the "| Form |" header the doc uses.
  const lines = src.split('\n')
  const start = lines.findIndex((l) => /^\|\s*Form\s*\|/.test(l))
  if (start === -1) throw new Error(`no "| Form |" table header in ${DOC}`)
  let end = start
  while (end < lines.length && lines[end].trim().startsWith('|')) end++
  const next = [...lines.slice(0, start), ...table.split('\n'), ...lines.slice(end)].join('\n')

  if (next === src) return { changed: false }
  fs.writeFileSync(abs, next)
  return { changed: true }
}
