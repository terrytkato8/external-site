// Reports content drift between prod (terrytkato8/external-site) and staging
// (aeiti/kato8-staging), so a mirror that was never finished stops being
// invisible until the next person trips over it.
//
// The two repos are mirrored by file copy, not shared history — commits have
// different SHAs on each side — so drift is detected by comparing tracked
// blob hashes at each repo's main.
//
// The repos are *supposed* to differ in known places (staging carries the
// unmerged crowdfunding feature; prod-only tooling lives in scripts/; docs
// and deploy plumbing are per-repo). Flagging all of that every run would
// train everyone to ignore the report, so known divergences live in
// staging-drift-baseline.json and only *new* drift fails.
//
// Three things get reported:
//   NEW        — drifted, not in the baseline. Exits 1. Either finish the
//                mirror or, if intentional, record it with --update-baseline.
//   KNOWN      — drifted and expected. Listed with its recorded reason.
//   RESOLVED   — in the baseline but now identical, so the entry is stale
//                and can be dropped. Never fails; keeps the baseline honest.
//
// Usage:
//   node scripts/staging-drift.mjs                      # sibling checkout
//   node scripts/staging-drift.mjs --staging <path>     # explicit path
//   node scripts/staging-drift.mjs --update-baseline    # re-snapshot
//   node scripts/staging-drift.mjs --quiet              # only NEW drift
//
// Read-only: never writes to either repo (except the baseline file, and only
// with --update-baseline).

import fs from 'node:fs'
import path from 'node:path'
import { execFileSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const PROD_ROOT = path.resolve(__dirname, '..')
const BASELINE_PATH = path.join(__dirname, 'staging-drift-baseline.json')

// Paths that are per-repo by construction and carry no mirroring signal at
// all — build output CI regenerates, and local-only files. Everything else is
// compared; genuinely-divergent tracked files belong in the baseline, where
// they're visible, rather than hidden behind a pattern here.
const IGNORE = [/^docs\//, /^\.claude\//, /^\.DS_Store$/, /(^|\/)\.DS_Store$/]

function usage(msg) {
  if (msg) console.error(`error: ${msg}\n`)
  console.error('usage: node scripts/staging-drift.mjs [--staging <path>] [--update-baseline] [--quiet]')
  process.exit(msg ? 1 : 0)
}

const argv = process.argv.slice(2)
let stagingRoot = null
let updateBaseline = false
let quiet = false
for (let i = 0; i < argv.length; i++) {
  const a = argv[i]
  if (a === '--staging') stagingRoot = argv[++i] ?? usage('--staging needs a path')
  else if (a === '--update-baseline') updateBaseline = true
  else if (a === '--quiet') quiet = true
  else if (a === '--help' || a === '-h') usage()
  else usage(`unknown argument: ${a}`)
}

function git(root, args) {
  return execFileSync('git', ['-C', root, ...args], { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 })
}

// Locate staging as a sibling of the *main* prod checkout, so this works from
// a worktree under .claude/worktrees/ too.
if (!stagingRoot) {
  const commonDir = git(PROD_ROOT, ['rev-parse', '--path-format=absolute', '--git-common-dir']).trim()
  stagingRoot = path.join(path.dirname(path.dirname(commonDir)), 'kato8-staging')
}
if (!fs.existsSync(path.join(stagingRoot, '.git'))) {
  usage(`staging repo not found at ${stagingRoot} (pass --staging <path>)`)
}

const ignored = (p) => IGNORE.some((re) => re.test(p))

// path -> blob hash for every tracked file at a repo's main.
function treeAt(root) {
  const out = new Map()
  for (const line of git(root, ['ls-tree', '-r', 'main', '--format=%(objectname) %(path)']).split('\n')) {
    if (!line) continue
    const sp = line.indexOf(' ')
    const hash = line.slice(0, sp)
    const file = line.slice(sp + 1)
    if (!ignored(file)) out.set(file, hash)
  }
  return out
}

function loadBaseline() {
  if (!fs.existsSync(BASELINE_PATH)) return { entries: {} }
  try {
    return JSON.parse(fs.readFileSync(BASELINE_PATH, 'utf8'))
  } catch (err) {
    console.error(`error: cannot parse ${path.basename(BASELINE_PATH)}: ${err.message}`)
    process.exit(1)
  }
}

function main() {
  const prod = treeAt(PROD_ROOT)
  const staging = treeAt(stagingRoot)
  const baseline = loadBaseline()

  const paths = [...new Set([...prod.keys(), ...staging.keys()])].sort()
  const drifted = []
  for (const p of paths) {
    const a = prod.get(p)
    const b = staging.get(p)
    if (a === b) continue
    const kind = !b ? 'prod-only' : !a ? 'staging-only' : 'differs'
    drifted.push({ path: p, kind })
  }

  if (updateBaseline) {
    const entries = {}
    for (const d of drifted) {
      entries[d.path] = {
        kind: d.kind,
        reason: baseline.entries?.[d.path]?.reason ?? 'unreviewed — snapshotted when the baseline was updated',
      }
    }
    fs.writeFileSync(
      BASELINE_PATH,
      JSON.stringify(
        { note: 'Known prod/staging divergences. Regenerate with: node scripts/staging-drift.mjs --update-baseline', entries },
        null,
        2
      ) + '\n'
    )
    console.log(`staging-drift: baseline updated — ${drifted.length} known divergence(s) recorded`)
    return
  }

  const known = []
  const fresh = []
  for (const d of drifted) {
    const entry = baseline.entries?.[d.path]
    // A baseline entry covers a path only while it drifts the same way; a file
    // that flips from staging-only to differing is new information.
    if (entry && entry.kind === d.kind) known.push({ ...d, reason: entry.reason })
    else fresh.push(d)
  }
  const driftedPaths = new Set(drifted.map((d) => d.path))
  const resolved = Object.keys(baseline.entries ?? {}).filter((p) => !driftedPaths.has(p))

  const rel = path.relative(PROD_ROOT, stagingRoot) || stagingRoot
  if (!quiet) {
    console.log(`staging-drift: prod ${git(PROD_ROOT, ['rev-parse', '--short', 'main']).trim()} vs staging ${git(stagingRoot, ['rev-parse', '--short', 'main']).trim()} (${rel})`)
    console.log(`  ${prod.size} vs ${staging.size} tracked files compared, docs/ and local-only paths excluded\n`)
  }

  if (fresh.length) {
    console.error(`NEW DRIFT — ${fresh.length} path(s) not in the baseline:\n`)
    for (const d of fresh) console.error(`  [${d.kind.padEnd(12)}] ${d.path}`)
    console.error(
      '\nEither the mirror is unfinished — `node scripts/mirror-to-staging.mjs <range>` plans it —\n' +
        'or the divergence is intentional, in which case record it:\n' +
        '  node scripts/staging-drift.mjs --update-baseline\n'
    )
  }

  if (!quiet && resolved.length) {
    console.log(`RESOLVED — ${resolved.length} baseline entr(ies) no longer drift and can be dropped:\n`)
    for (const p of resolved) console.log(`  ${p}`)
    console.log('\n  node scripts/staging-drift.mjs --update-baseline\n')
  }

  if (!quiet && known.length) {
    console.log(`KNOWN — ${known.length} recorded divergence(s):\n`)
    for (const d of known) console.log(`  [${d.kind.padEnd(12)}] ${d.path}\n      ${d.reason}`)
    console.log('')
  }

  if (fresh.length) process.exit(1)
  if (!quiet) console.log('staging-drift: no new drift')
}

main()
