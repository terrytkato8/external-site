// Plans (and optionally applies) the prod → staging mirror for a range of
// commits. For every file changed in the range it decides whether copying
// prod's version into kato8-staging is provably safe, by comparing staging's
// current copy against the file's *pre-change* content in prod:
//
//   staging == prod-before  → SAFE COPY   (staging hasn't diverged here)
//   staging == prod-after   → ALREADY MIRRORED
//   anything else           → DIVERGED    (re-apply the edit by hand)
//
// This replaces guessing from a hardcoded divergence list — staging's
// drift (SimpleGamePage, crowdfunding feature, nav/footer edits) is
// detected per file, per run. Docs and repo-plumbing paths that never
// mirror (README, workflows, CNAME, docs/…) are skipped outright.
//
// Usage, from the prod repo (a worktree is fine):
//   node scripts/mirror-to-staging.mjs                 # plan main..HEAD
//   node scripts/mirror-to-staging.mjs main..my-branch # plan a range
//   node scripts/mirror-to-staging.mjs <sha>           # plan one commit
//   node scripts/mirror-to-staging.mjs --apply         # perform safe copies
//   node scripts/mirror-to-staging.mjs --staging <path>
//
// Never writes to diverged files, never touches git in the staging repo —
// committing, branching, and PRs there stay manual on purpose.

import fs from 'node:fs'
import path from 'node:path'
import { execFileSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const PROD_ROOT = path.resolve(__dirname, '..')

// Paths that must never be mirrored, per CLAUDE.md "Standard change flow":
// docs are canonical in prod (staging README is a pointer, no ARCHITECTURE.md
// there), workflows/CNAME/404 are deploy-target-specific, docs/ is a build
// artifact CI regenerates.
const NEVER_MIRROR = [
  /^README\.md$/,
  /^ARCHITECTURE\.md$/,
  /^CLAUDE\.md$/,
  /^TASKS\.md$/,
  /^CNAME$/,
  /^docs\//,
  /^\.github\//,
  /^\.gitignore$/,
  /^\.claude\//,
  /^\.env/,
  /^public\/404\.html$/,
]

function usage(msg) {
  if (msg) console.error(`error: ${msg}\n`)
  console.error('usage: node scripts/mirror-to-staging.mjs [range|commit] [--apply] [--staging <path>]')
  process.exit(msg ? 1 : 0)
}

const argv = process.argv.slice(2)
let apply = false
let stagingRoot = null
let rangeArg = null
for (let i = 0; i < argv.length; i++) {
  const a = argv[i]
  if (a === '--apply') apply = true
  else if (a === '--staging') stagingRoot = argv[++i] ?? usage('--staging needs a path')
  else if (a === '--help' || a === '-h') usage()
  else if (a.startsWith('-')) usage(`unknown flag ${a}`)
  else if (rangeArg) usage('only one range argument allowed')
  else rangeArg = a
}

function git(args, opts = {}) {
  return execFileSync('git', ['-C', PROD_ROOT, ...args], {
    encoding: opts.buffer ? 'buffer' : 'utf8',
    maxBuffer: 64 * 1024 * 1024,
    ...opts.allowFail ? { stdio: ['ignore', 'pipe', 'ignore'] } : {},
  })
}

// Locate staging as a sibling of the *main* prod checkout, so the script
// also works when run from a worktree under .claude/worktrees/.
if (!stagingRoot) {
  const commonDir = git(['rev-parse', '--path-format=absolute', '--git-common-dir']).trim()
  stagingRoot = path.join(path.dirname(path.dirname(commonDir)), 'kato8-staging')
}
if (!fs.existsSync(path.join(stagingRoot, 'package.json'))) {
  usage(`staging repo not found at ${stagingRoot} (pass --staging <path>)`)
}

// Resolve the commit range. `A..B`/`A...B` both mean merge-base(A,B) → B
// here (mirroring wants "what this branch adds", not main's own drift);
// a single commit means just that commit; default is main..HEAD.
let base
let head
{
  const spec = rangeArg ?? 'main..HEAD'
  const m = spec.match(/^(.+?)\.{2,3}(.+)$/)
  const [left, right] = m ? [m[1], m[2]] : [null, spec]
  try {
    head = git(['rev-parse', '--verify', `${right}^{commit}`]).trim()
    base = m
      ? git(['merge-base', left, head]).trim()
      : rangeArg
        ? git(['rev-parse', '--verify', `${right}~1^{commit}`]).trim()
        : git(['merge-base', 'main', head]).trim()
  } catch {
    usage(`cannot resolve range "${spec}"`)
  }
}

function blobAt(commit, file) {
  try {
    return git(['show', `${commit}:${file}`], { buffer: true, allowFail: true })
  } catch {
    return null // file doesn't exist at that commit
  }
}

// For a DIVERGED text file, check whether every line this range *adds* is
// already present in staging's copy — the common "mirrored earlier, folded
// into a staging-specific commit" case (COMPONENTS.md does this a lot).
// Whole-file comparison can't see that; this keeps it from crying wolf.
function addedLinesAlreadyPresent(file, current) {
  let patch
  try {
    patch = git(['diff', base, head, '--', file])
  } catch {
    return false
  }
  const added = patch
    .split('\n')
    .filter((l) => l.startsWith('+') && !l.startsWith('+++'))
    .map((l) => l.slice(1))
    .filter((l) => l.trim() !== '')
  if (!added.length) return false
  const stagingLines = new Set(current.toString('utf8').split('\n'))
  return added.every((l) => stagingLines.has(l))
}

function stagingBytes(file) {
  const p = path.join(stagingRoot, file)
  try {
    return fs.readFileSync(p)
  } catch {
    return null
  }
}

// name-status with rename detection; renames become delete+add.
const entries = []
{
  const raw = git(['diff', '--name-status', '-M', '-z', base, head])
  const parts = raw.split('\0').filter(Boolean)
  for (let i = 0; i < parts.length; ) {
    const status = parts[i][0]
    if (status === 'R' || status === 'C') {
      const [, from, to] = [parts[i], parts[i + 1], parts[i + 2]]
      if (status === 'R') entries.push({ status: 'D', file: from })
      entries.push({ status: 'A', file: to })
      i += 3
    } else {
      entries.push({ status, file: parts[i + 1] })
      i += 2
    }
  }
}

const plan = {
  skip: [], // never-mirror paths
  already: [], // staging already matches prod's new state
  copy: [], // provably safe: staging matches prod's pre-change state
  del: [], // provably safe deletion
  diverged: [], // staging differs from both before and after → hand-apply
  missing: [], // modified in prod but absent in staging → decide manually
}

for (const { status, file } of entries) {
  if (NEVER_MIRROR.some((re) => re.test(file))) {
    plan.skip.push({ file, status })
    continue
  }
  const after = status === 'D' ? null : blobAt(head, file)
  const before = status === 'A' ? null : blobAt(base, file)
  const current = stagingBytes(file)

  if (status === 'D') {
    if (current === null) plan.already.push({ file, note: 'already absent' })
    else if (before && current.equals(before)) plan.del.push({ file })
    else plan.diverged.push({ file, note: 'prod deleted it, but staging\'s copy has its own edits' })
  } else if (current === null) {
    if (status === 'M') plan.missing.push({ file })
    else plan.copy.push({ file, note: 'new file' })
  } else if (current.equals(after)) {
    plan.already.push({ file })
  } else if (before && current.equals(before)) {
    plan.copy.push({ file })
  } else if (addedLinesAlreadyPresent(file, current)) {
    plan.diverged.push({ file, note: 'every added line already present — likely mirrored earlier; verify, then skip' })
  } else {
    plan.diverged.push({ file })
  }
}

// ---- report ----------------------------------------------------------------

const shortBase = base.slice(0, 7)
const shortHead = head.slice(0, 7)
console.log(`Mirror plan: ${PROD_ROOT}`)
console.log(`  range   ${shortBase}..${shortHead}`)
console.log(`  staging ${stagingRoot}\n`)

function section(title, rows, fmt) {
  if (!rows.length) return
  console.log(title)
  for (const r of rows) console.log(`  ${fmt(r)}`)
  console.log('')
}

section(`SAFE TO COPY (${plan.copy.length}) — staging matches prod's pre-change version:`, plan.copy,
  (r) => `${r.file}${r.note ? `  [${r.note}]` : ''}`)
section(`SAFE TO DELETE (${plan.del.length}):`, plan.del, (r) => r.file)
section(`DIVERGED (${plan.diverged.length}) — re-apply by hand with Edit against staging's version:`, plan.diverged,
  (r) => `${r.file}${r.note ? `  [${r.note}]` : ''}\n      view the change:  git diff ${shortBase} ${shortHead} -- ${r.file}`)
section(`MODIFIED IN PROD BUT ABSENT IN STAGING (${plan.missing.length}) — copy or skip deliberately:`, plan.missing,
  (r) => r.file)
section(`ALREADY MIRRORED (${plan.already.length}):`, plan.already,
  (r) => `${r.file}${r.note ? `  [${r.note}]` : ''}`)
section(`SKIPPED (${plan.skip.length}) — never mirrors (docs/workflows/deploy-target files):`, plan.skip,
  (r) => r.file)

// Staging-only page/component variants: a change to prod page components can
// silently under-cover staging routes (the SimpleGamePage lesson). List them
// whenever the range touches pages or components.
if (entries.some(({ file }) => /^src\/(pages|components)\//.test(file))) {
  const stagingOnly = []
  for (const dir of ['src/pages', 'src/components']) {
    let names = []
    try {
      names = fs.readdirSync(path.join(stagingRoot, dir))
    } catch {}
    for (const name of names) {
      if (!fs.existsSync(path.join(PROD_ROOT, dir, name))) stagingOnly.push(`${dir}/${name}`)
    }
  }
  if (stagingOnly.length) {
    console.log('CHECK DIVERGENT ROUTE TARGETS — staging-only components prod patches will miss:')
    for (const f of stagingOnly) console.log(`  ${f}`)
    console.log("  If this change touches game-page behavior, grep staging's src/App.jsx for")
    console.log('  routes rendering these and apply the same edit there.\n')
  }
}

const subjects = git(['log', '--reverse', '--format=%s', `${base}..${head}`]).trim()
if (subjects) {
  console.log('Commit subjects in range (reuse verbatim on staging so the mirror is legible):')
  for (const s of subjects.split('\n')) console.log(`  ${s}`)
  console.log('')
}

// ---- apply -----------------------------------------------------------------

if (!apply) {
  if (plan.copy.length || plan.del.length) {
    console.log('Dry run — re-run with --apply to perform the safe copies/deletions.')
  } else {
    console.log('Dry run — nothing is auto-applicable; all remaining work is manual.')
  }
  process.exit(0)
}

let stagingBranch = '(unknown)'
try {
  stagingBranch = execFileSync('git', ['-C', stagingRoot, 'branch', '--show-current'], {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'ignore'],
  }).trim()
} catch {}
if (stagingBranch === 'main') {
  console.log('note: staging is on main — branch there before committing (never commit to main directly).\n')
}

for (const { file } of plan.copy) {
  const dest = path.join(stagingRoot, file)
  fs.mkdirSync(path.dirname(dest), { recursive: true })
  fs.writeFileSync(dest, blobAt(head, file))
  console.log(`copied   ${file}`)
}
for (const { file } of plan.del) {
  fs.rmSync(path.join(stagingRoot, file))
  console.log(`deleted  ${file}`)
}

const manual = plan.diverged.length + plan.missing.length
console.log(`\nApplied ${plan.copy.length} copies, ${plan.del.length} deletions.`)
console.log(manual
  ? `${manual} file(s) still need manual attention (see DIVERGED / ABSENT sections above).`
  : 'No manual follow-up needed — review, commit on a staging branch, and open the PR.')
