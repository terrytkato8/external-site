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
//   node scripts/mirror-to-staging.mjs --commit        # replay commits (below)
//   node scripts/mirror-to-staging.mjs --staging <path>
//
// --apply writes the range's net result into staging's working tree and
// leaves git to you. --commit instead replays the range commit by commit:
//
//   - creates a staging worktree on a new branch from staging's origin/main
//     (--onto <ref> to start elsewhere), at
//     <staging>/.claude/worktrees/<branch>;
//   - plans against that ref, not staging's working tree;
//   - for each prod commit, writes its SAFE COPY / SAFE DELETE files at that
//     commit's content and mode (100755 stays executable) and commits them
//     with the prod commit's message, author and author date;
//   - finally checks every touched file is byte-identical (same blob, same
//     mode) to prod's head, and that the worktree is clean.
//
//   --branch <name>    staging branch name (default: prod's current branch)
//   --onto <ref>       staging ref to branch from (default: origin/main)
//   --allow-diverged   don't refuse when the range touches DIVERGED files;
//                      leave them out of the replay and list them, to apply
//                      by hand on the new branch
//
// Files modified in prod but absent from staging are never replayed; they
// are listed. Merge commits in the range are refused (replay a linear range).
//
// Never writes to diverged files. Never pushes or opens PRs — that stays
// manual on purpose.

import fs from 'node:fs'
import path from 'node:path'
import { execFileSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const PROD_ROOT = path.resolve(__dirname, '..')

// Paths that must never be mirrored, per CLAUDE.md "Standard change flow":
// docs are canonical in prod (staging README is a pointer, no ARCHITECTURE.md
// there), workflows/CNAME are deploy-target-specific, docs/ is a build
// artifact CI regenerates. (public/404.html mirrors: its per-target value is
// set at build time by write-cname.mjs.)
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
]

function usage(msg) {
  if (msg) console.error(`error: ${msg}\n`)
  console.error(
    'usage: node scripts/mirror-to-staging.mjs [range|commit] [--apply | --commit [--branch <name>] ' +
      '[--onto <ref>] [--allow-diverged]] [--staging <path>]',
  )
  process.exit(msg ? 1 : 0)
}

const argv = process.argv.slice(2)
let apply = false
let commit = false
let allowDiverged = false
let branchArg = null
let ontoArg = 'origin/main'
let stagingRoot = null
let rangeArg = null
for (let i = 0; i < argv.length; i++) {
  const a = argv[i]
  if (a === '--apply') apply = true
  else if (a === '--commit') commit = true
  else if (a === '--allow-diverged') allowDiverged = true
  else if (a === '--branch') branchArg = argv[++i] ?? usage('--branch needs a name')
  else if (a === '--onto') ontoArg = argv[++i] ?? usage('--onto needs a ref')
  else if (a === '--staging') stagingRoot = argv[++i] ?? usage('--staging needs a path')
  else if (a === '--help' || a === '-h') usage()
  else if (a.startsWith('-')) usage(`unknown flag ${a}`)
  else if (rangeArg) usage('only one range argument allowed')
  else rangeArg = a
}
if (apply && commit) usage('--apply and --commit are exclusive')
if (!commit && (allowDiverged || branchArg)) usage('--allow-diverged and --branch need --commit')

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

function sgit(args, opts = {}) {
  return execFileSync('git', ['-C', opts.cwd ?? stagingRoot, ...args], {
    encoding: opts.buffer ? 'buffer' : 'utf8',
    maxBuffer: 64 * 1024 * 1024,
    stdio: ['pipe', 'pipe', opts.allowFail ? 'ignore' : 'inherit'],
    env: { ...process.env, GIT_LITERAL_PATHSPECS: '1', ...opts.env },
    ...(opts.input !== undefined ? { input: opts.input } : {}),
  })
}

// In --commit mode the plan is made against a staging *ref* (fetched fresh),
// since that is what the new branch starts from — not whatever the staging
// checkout happens to have on disk.
let onto = null
if (commit) {
  sgit(['fetch', '-q', 'origin'])
  try {
    onto = sgit(['rev-parse', '--verify', `${ontoArg}^{commit}`], { allowFail: true }).trim()
  } catch {
    usage(`cannot resolve staging ref "${ontoArg}"`)
  }
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
  if (onto) {
    try {
      return sgit(['cat-file', 'blob', `${onto}:${file}`], { buffer: true, allowFail: true })
    } catch {
      return null
    }
  }
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
console.log(`  staging ${stagingRoot}${onto ? ` @ ${ontoArg} (${onto.slice(0, 7)})` : ''}\n`)

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
      names = onto
        ? sgit(['ls-tree', '--name-only', `${onto}:${dir}`], { allowFail: true }).split('\n').filter(Boolean)
        : fs.readdirSync(path.join(stagingRoot, dir))
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

if (commit) {
  replayCommits()
  process.exit(0)
}

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

// ---- commit (replay) -------------------------------------------------------

function fail(msg) {
  console.error(`\nerror: ${msg}`)
  process.exit(1)
}

// "<mode> <type> <oid>\t<path>" for one path at a tree-ish, or null if absent.
function treeEntry(gitFn, rev, file) {
  const out = gitFn(['ls-tree', '-z', rev, '--', file]).replace(/\0$/, '')
  if (!out) return null
  const [meta] = out.split('\t')
  const [mode, , oid] = meta.split(' ')
  return { mode, oid }
}

function replayCommits() {
  if (plan.diverged.length && !allowDiverged) {
    fail(
      `${plan.diverged.length} DIVERGED file(s) in this range (listed above). Re-run with --allow-diverged ` +
        'to replay everything else and apply those by hand on the new branch.',
    )
  }

  const commits = git(['rev-list', '--reverse', '--topo-order', '--parents', `${base}..${head}`])
    .trim()
    .split('\n')
    .filter(Boolean)
    .map((line) => line.split(' '))
  if (!commits.length) fail('no commits in range')
  const merges = commits.filter((c) => c.length > 2)
  if (merges.length) {
    fail(`range contains merge commit(s) ${merges.map((c) => c[0].slice(0, 7)).join(', ')}; replay a linear range`)
  }

  const branch = branchArg ?? git(['branch', '--show-current']).trim()
  if (!branch) fail('prod is on a detached HEAD; pass --branch <name>')
  if (branch === 'main') fail('refusing to replay onto a branch named main; pass --branch <name>')
  if (branch.startsWith('claude/')) fail(`plain branch names only; pass --branch instead of "${branch}"`)
  for (const ref of [`refs/heads/${branch}`, `refs/remotes/origin/${branch}`]) {
    try {
      sgit(['rev-parse', '--verify', '-q', ref], { allowFail: true })
      fail(`staging already has ${ref}; pick another --branch or delete it first`)
    } catch (e) {
      if (e.status === undefined) throw e
    }
  }

  // Worktrees live beside the staging *main* checkout, even when --staging
  // pointed at another worktree.
  const commonDir = sgit(['rev-parse', '--path-format=absolute', '--git-common-dir']).trim()
  const worktree = path.join(path.dirname(commonDir), '.claude', 'worktrees', branch.replace(/\//g, '-'))
  if (fs.existsSync(worktree)) fail(`${worktree} already exists`)

  sgit(['worktree', 'add', '-q', '-b', branch, worktree, onto])
  const wgit = (args, opts = {}) => sgit(args, { ...opts, cwd: worktree })
  console.log(`Created staging worktree ${worktree}`)
  console.log(`  branch ${branch} from ${ontoArg} (${onto.slice(0, 7)})\n`)

  const replayable = new Set([...plan.copy, ...plan.del].map((r) => r.file))
  let made = 0
  for (const [sha] of commits) {
    // :oldmode newmode oldoid newoid status NUL path NUL, renames split into D + A.
    const parts = git(['diff-tree', '-r', '-z', '--no-renames', '--no-commit-id', `${sha}^`, sha])
      .split('\0')
      .filter(Boolean)
    const written = []
    for (let i = 0; i < parts.length; i += 2) {
      const [, newMode, , newOid, status] = parts[i].slice(1).split(' ')
      const file = parts[i + 1]
      if (!replayable.has(file)) continue
      const dest = path.join(worktree, file)
      if (status === 'D') {
        fs.rmSync(dest, { force: true })
      } else {
        fs.mkdirSync(path.dirname(dest), { recursive: true })
        fs.rmSync(dest, { force: true })
        if (newMode === '120000') {
          fs.symlinkSync(git(['cat-file', 'blob', newOid]), dest)
        } else if (newMode === '100644' || newMode === '100755') {
          fs.writeFileSync(dest, git(['cat-file', 'blob', newOid], { buffer: true }))
          fs.chmodSync(dest, newMode === '100755' ? 0o755 : 0o644)
        } else {
          fail(`${file} has mode ${newMode} in ${sha.slice(0, 7)}; not replayable`)
        }
      }
      written.push(file)
    }

    const subject = git(['log', '-1', '--format=%s', sha]).trim()
    const label = `${sha.slice(0, 7)} ${subject}`
    if (!written.length) {
      console.log(`skip     ${label}  (no mirrorable files)`)
      continue
    }
    wgit(['add', '-A', '--', ...written])
    try {
      wgit(['diff', '--cached', '--quiet'], { allowFail: true })
      console.log(`skip     ${label}  (staging already had this content)`)
      continue
    } catch {}
    const [name, email, date] = git(['log', '-1', '--format=%an%x00%ae%x00%aI', sha]).trim().split('\0')
    wgit(['commit', '-q', '-F', '-'], {
      input: git(['log', '-1', '--format=%B', sha]),
      env: { GIT_AUTHOR_NAME: name, GIT_AUTHOR_EMAIL: email, GIT_AUTHOR_DATE: date },
    })
    made++
    console.log(`commit   ${label}  (${written.length} file${written.length === 1 ? '' : 's'})`)
  }

  // Byte-identity: equal blob ids mean identical bytes; mode is compared
  // separately because a lost +x bit leaves the content (and diff) unchanged.
  const problems = []
  for (const file of [...replayable].sort()) {
    const want = treeEntry(git, head, file)
    const got = treeEntry(wgit, 'HEAD', file)
    if (!want && !got) continue
    if (!want) problems.push(`${file}: deleted in prod, still on the staging branch`)
    else if (!got) problems.push(`${file}: missing on the staging branch`)
    else if (want.oid !== got.oid) problems.push(`${file}: content differs from prod ${shortHead}`)
    else if (want.mode !== got.mode) problems.push(`${file}: mode ${got.mode}, prod has ${want.mode}`)
  }
  const dirty = wgit(['status', '--porcelain']).trim()
  if (dirty) problems.push(`worktree not clean after replay:\n${dirty}`)

  console.log(`\nReplayed ${made} of ${commits.length} commit(s) onto ${branch}.`)
  if (problems.length) {
    console.error(`\nBYTE-IDENTITY CHECK FAILED (${problems.length}):`)
    for (const p of problems) console.error(`  ${p}`)
    fail(`the replay is incomplete; remove the worktree and branch, then redo it:\n` +
      `  git -C ${stagingRoot} worktree remove --force ${worktree}\n` +
      `  git -C ${stagingRoot} branch -D ${branch}`)
  }
  console.log(`Byte-identity check: ${replayable.size} file(s) match prod ${shortHead} (content and mode).`)

  const manual = [...plan.diverged, ...plan.missing]
  if (manual.length) {
    console.log('\nNot replayed — apply by hand on the branch if they should mirror:')
    for (const r of plan.diverged) console.log(`  DIVERGED  ${r.file}`)
    for (const r of plan.missing) console.log(`  ABSENT    ${r.file}`)
  }
  console.log(`\nNext: review in ${worktree}, then push ${branch} and open the staging PR.`)
}
