// Verifies that a merge to main actually made it to the live site, catching
// the two known deploy failure modes:
//
//   1. The push event occasionally never fires the deploy workflow — no run
//      exists for the merge SHA. (Detected; re-triggered via workflow_dispatch
//      when the SHA is the current main tip.)
//   2. Right after a deploy the Pages CDN can briefly keep serving the OLD
//      hashed bundle. (Detected by comparing the site's Last-Modified header
//      against the workflow run's timestamps, polling with a cache-buster.)
//
// Usage, from the prod repo (a worktree is fine):
//   node scripts/verify-deploy.mjs                  # verify prod's main
//   node scripts/verify-deploy.mjs --staging        # verify kato8-staging
//   node scripts/verify-deploy.mjs --sha <sha>      # expect a specific commit
//   node scripts/verify-deploy.mjs --expect <str>   # also grep the served JS
//                                                   # bundle for a string
//   node scripts/verify-deploy.mjs --timeout <sec>  # run-completion wait (420)
//
// Needs `gh` authenticated for the target repo. Exits 0 only when a run for
// the target SHA succeeded AND the CDN is serving that deploy.

import fs from 'node:fs'
import path from 'node:path'
import { execFileSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const PROD_ROOT = path.resolve(__dirname, '..')

function usage(msg) {
  if (msg) console.error(`error: ${msg}\n`)
  console.error('usage: node scripts/verify-deploy.mjs [--staging] [--sha <sha>] [--expect <string>] [--timeout <seconds>]')
  process.exit(msg ? 1 : 0)
}

const argv = process.argv.slice(2)
let staging = false
let wantSha = null
let expect = null
let timeoutSec = 420
for (let i = 0; i < argv.length; i++) {
  const a = argv[i]
  if (a === '--staging') staging = true
  else if (a === '--sha') wantSha = argv[++i] ?? usage('--sha needs a value')
  else if (a === '--expect') expect = argv[++i] ?? usage('--expect needs a string')
  else if (a === '--timeout') timeoutSec = Number(argv[++i]) || usage('--timeout needs seconds')
  else if (a === '--help' || a === '-h') usage()
  else usage(`unknown argument ${a}`)
}

function run(cmd, args, opts = {}) {
  return execFileSync(cmd, args, { encoding: 'utf8', maxBuffer: 16 * 1024 * 1024, ...opts })
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

// The target repo root: this repo for prod, or the kato8-staging sibling of
// the *main* checkout (so the script works from a worktree too).
let repoRoot = PROD_ROOT
if (staging) {
  const commonDir = run('git', ['-C', PROD_ROOT, 'rev-parse', '--path-format=absolute', '--git-common-dir']).trim()
  repoRoot = path.join(path.dirname(path.dirname(commonDir)), 'kato8-staging')
}

// Repo slug from the origin URL; site URL from CNAME when present (prod),
// otherwise the <owner>.github.io/<repo>/ project-page form (staging).
const originUrl = run('git', ['-C', repoRoot, 'remote', 'get-url', 'origin']).trim()
const slugMatch = originUrl.match(/github\.com[:/]([^/]+\/[^/.]+)/)
if (!slugMatch) usage(`cannot parse a GitHub slug out of origin URL "${originUrl}"`)
const slug = slugMatch[1]

let siteUrl
const cnamePath = path.join(repoRoot, 'CNAME')
if (fs.existsSync(cnamePath)) {
  siteUrl = `https://${fs.readFileSync(cnamePath, 'utf8').trim()}/`
} else {
  const [owner, name] = slug.split('/')
  siteUrl = `https://${owner}.github.io/${name}/`
}

const workflowFile = fs.readdirSync(path.join(repoRoot, '.github', 'workflows'))
  .find((f) => f.startsWith('deploy'))
if (!workflowFile) usage(`no deploy* workflow found in ${repoRoot}/.github/workflows`)

const remoteMain = run('git', ['-C', repoRoot, 'ls-remote', 'origin', 'refs/heads/main']).split('\t')[0]
const sha = wantSha
  ? run('git', ['-C', repoRoot, 'rev-parse', '--verify', `${wantSha}^{commit}`]).trim()
  : remoteMain
const short = sha.slice(0, 7)

console.log(`Verifying deploy of ${slug} @ ${short}`)
console.log(`  workflow ${workflowFile}`)
console.log(`  site     ${siteUrl}\n`)

function listRuns() {
  const json = run('gh', ['run', 'list', '--repo', slug, '--workflow', workflowFile,
    '--limit', '20', '--json', 'headSha,status,conclusion,databaseId,createdAt,updatedAt,url'])
  return JSON.parse(json)
}

// ---- 1. a workflow run must exist for the SHA ------------------------------

let runInfo = listRuns().find((r) => r.headSha === sha)

if (!runInfo) {
  if (sha !== remoteMain) {
    console.error(`no ${workflowFile} run found for ${short}, and it isn't the remote main tip`)
    console.error('(a manual dispatch would build the tip, not this SHA — nothing safe to trigger)')
    process.exit(1)
  }
  console.log(`no run found for ${short} — the push event was likely dropped; dispatching ${workflowFile}`)
  run('gh', ['workflow', 'run', workflowFile, '--repo', slug, '--ref', 'main'])
  for (let waited = 0; !runInfo && waited < 90; waited += 10) {
    await sleep(10_000)
    runInfo = listRuns().find((r) => r.headSha === sha)
  }
  if (!runInfo) {
    console.error('dispatched, but no run appeared within 90s — check Actions on GitHub')
    process.exit(1)
  }
  console.log(`run appeared: ${runInfo.url}`)
}

// ---- 2. the run must finish successfully -----------------------------------

const deadline = Date.now() + timeoutSec * 1000
while (runInfo.status !== 'completed') {
  if (Date.now() > deadline) {
    console.error(`run still ${runInfo.status} after ${timeoutSec}s: ${runInfo.url}`)
    process.exit(1)
  }
  console.log(`  run ${runInfo.status}…`)
  await sleep(10_000)
  runInfo = listRuns().find((r) => r.databaseId === runInfo.databaseId) ?? runInfo
}
if (runInfo.conclusion !== 'success') {
  console.error(`run concluded ${runInfo.conclusion}: ${runInfo.url}`)
  process.exit(1)
}
console.log(`run succeeded (${runInfo.updatedAt}): ${runInfo.url}\n`)

// ---- 3. the CDN must be serving that deploy --------------------------------

// Pages sets Last-Modified to publish time, which lands between the run's
// start and completion. Anything older than the run's start is the stale
// pre-deploy copy — keep cache-busting until it flips (max-age is 600s, so
// give it up to 5 minutes).
const runStarted = new Date(runInfo.createdAt).getTime()
const cdnDeadline = Date.now() + 300 * 1000
let html = null
let lastMod = null
for (;;) {
  const res = await fetch(`${siteUrl}?cb=${Date.now()}`, { headers: { 'cache-control': 'no-cache' } })
  if (res.ok) {
    lastMod = new Date(res.headers.get('last-modified') ?? 0).getTime()
    if (lastMod >= runStarted) {
      html = await res.text()
      break
    }
  }
  if (Date.now() > cdnDeadline) {
    console.error(`CDN still serving a pre-run deploy (last-modified ${new Date(lastMod).toISOString()},`)
    console.error(`run started ${runInfo.createdAt}) after 5 minutes of cache-busting`)
    process.exit(1)
  }
  console.log('  CDN still serving the previous deploy — retrying with cache-buster…')
  await sleep(15_000)
}

const bundle = html.match(/\/assets\/index-[^"']+\.js/)?.[0]
console.log(`site is fresh (last-modified ${new Date(lastMod).toUTCString()})`)
console.log(`serving bundle ${bundle ?? '(no hashed bundle reference found in HTML!)'}`)

// ---- 4. optional: the served bundle must contain an expected string --------

if (expect) {
  if (!bundle) {
    console.error('cannot grep the bundle — no /assets/index-*.js reference in the served HTML')
    process.exit(1)
  }
  const bundleUrl = new URL(bundle.replace(/^\//, ''), siteUrl).href
  const js = await (await fetch(`${bundleUrl}?cb=${Date.now()}`)).text()
  if (!js.includes(expect)) {
    console.error(`bundle does NOT contain ${JSON.stringify(expect)} — the change didn't ship (or the string differs post-minification)`)
    process.exit(1)
  }
  console.log(`bundle contains ${JSON.stringify(expect)}`)
}

console.log('\ndeploy verified ✓')
