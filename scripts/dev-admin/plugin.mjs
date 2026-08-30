// Dev-only content admin, mounted at /__admin on the Vite dev server.
//
//   GET /__admin                → the admin UI (scripts/dev-admin/index.html)
//   GET /__admin/api/data       → every editable block as JSON
//   PUT /__admin/api/block/<name> → rewrite that block in its source file
//
// Saves go through serialize.mjs, which regenerates only the data literal
// (verified round-trip) — the dev server's watcher then hot-reloads the
// running site like any hand edit.
//
// `apply: 'serve'` plus the fact that nothing here lives under src/ means
// none of this exists in `vite build` output. The /__admin/api namespace is
// shared with the concept-art manager tab.

import fs from 'node:fs'
import path from 'node:path'
import { execFile } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { BLOCKS, blockAvailable, readBlock, writeBlock } from './serialize.mjs'
import { listArt, reorderArt, uploadArt, deleteArt, renameArt, generateAllVariants } from './art.mjs'
import { listAssets, saveAsset } from './assets.mjs'
import { readHeadImages, writeHeadImage } from './head-images.mjs'
import { writeFormspreeDoc } from './formspree-doc.mjs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// The admin can rewrite source files and upload assets, so — even though the
// dev server runs with `--host` for LAN demos of the *site* — the /__admin
// surface is restricted to the local machine. Anything not on the loopback
// interface gets a 403 before any handler runs.
function isLoopback(req) {
  const addr = req.socket.remoteAddress ?? ''
  return addr === '127.0.0.1' || addr === '::1' || addr === '::ffff:127.0.0.1'
}

// Run a read-only git command in the repo and resolve its stdout. Rejects on
// non-zero exit so callers can surface "not a git repo" etc. as a 400.
function git(root, args) {
  return new Promise((resolve, reject) => {
    execFile('git', args, { cwd: root, maxBuffer: 8 * 1024 * 1024 }, (err, stdout, stderr) => {
      // `git diff` exits 1 when there ARE differences — not an error. Trust
      // stdout whenever git produced any; only reject when it gave us nothing.
      if (stdout) resolve(stdout)
      else if (err) reject(new Error((stderr || err.message).split('\n')[0]))
      else resolve('')
    })
  })
}

// Strict variant for write commands (checkout, commit, branch): unlike the
// read helper above, any non-zero exit rejects — we never want to treat a
// failed mutation as success just because it printed something to stdout.
function gitStrict(root, args) {
  return new Promise((resolve, reject) => {
    execFile('git', args, { cwd: root, maxBuffer: 8 * 1024 * 1024 }, (err, stdout, stderr) => {
      if (err) reject(new Error((stderr || err.message).split('\n')[0]))
      else resolve((stdout || stderr || '').trim())
    })
  })
}

// Resolve a client-supplied repo-relative path and refuse anything that would
// escape the repo root (absolute paths, `..`). Paths always come from our own
// git-status list, but the endpoint is reachable by any loopback caller.
function safeRepoPath(root, file) {
  if (typeof file !== 'string' || !file) throw new Error('missing file')
  const abs = path.resolve(root, file)
  if (abs !== root && !abs.startsWith(root + path.sep)) throw new Error('path escapes the repository')
  return abs
}

// Guard the destructive-history operations: never let the admin commit on the
// shared integration branches — the repo's rule is PR-only onto main.
function assertNotMainBranch(branch) {
  if (branch === 'main' || branch === 'master') {
    throw new Error(`refusing to commit directly on ${branch} — create a branch first (repo is PR-only)`)
  }
}

function sendJson(res, status, body) {
  res.statusCode = status
  res.setHeader('content-type', 'application/json')
  res.end(JSON.stringify(body))
}

function readRawBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = []
    req.on('data', (c) => chunks.push(c))
    req.on('end', () => resolve(Buffer.concat(chunks)))
    req.on('error', reject)
  })
}

async function readBody(req) {
  try {
    return JSON.parse((await readRawBody(req)).toString('utf8'))
  } catch {
    throw new Error('invalid JSON body')
  }
}

export function devAdmin() {
  return {
    name: 'dev-admin',
    apply: 'serve',
    configureServer(server) {
      const root = server.config.root
      server.middlewares.use('/__admin', async (req, res, next) => {
        if (!isLoopback(req)) {
          res.statusCode = 403
          res.setHeader('content-type', 'text/plain')
          res.end('dev admin is restricted to the local machine')
          return
        }

        const url = req.url.split('?')[0]

        if (url === '/' || url === '') {
          res.setHeader('content-type', 'text/html')
          res.end(fs.readFileSync(path.join(__dirname, 'index.html')))
          return
        }

        if (url === '/api/data' && req.method === 'GET') {
          const data = {}
          for (const name of Object.keys(BLOCKS)) {
            if (blockAvailable(root, name)) data[name] = readBlock(root, name).value
          }
          sendJson(res, 200, data)
          return
        }

        try {
          if (url === '/api/social-icons' && req.method === 'GET') {
            const dir = path.join(root, 'public/assets/img/social')
            const icons = fs.existsSync(dir)
              ? fs.readdirSync(dir).filter((f) => f.endsWith('.svg')).sort()
              : []
            return sendJson(res, 200, { icons })
          }
          if (url === '/api/assets' && req.method === 'GET') {
            return sendJson(res, 200, { assets: listAssets(root) })
          }
          if (url === '/api/assets/upload' && req.method === 'POST') {
            const filename = new URLSearchParams(req.url.split('?')[1] ?? '').get('filename')
            const body = await readRawBody(req)
            return sendJson(res, 200, saveAsset(root, filename, body))
          }
          if (url === '/api/head-images' && req.method === 'GET') {
            return sendJson(res, 200, readHeadImages(root))
          }
          if (url === '/api/git' && req.method === 'GET') {
            const [branch, porcelain] = await Promise.all([
              git(root, ['rev-parse', '--abbrev-ref', 'HEAD']),
              git(root, ['status', '--porcelain']),
            ])
            // Porcelain lines are "XY <path>"; the two-char status maps to a
            // short label the UI colours. Renames ("R  old -> new") keep the
            // arrow form so both paths stay visible.
            const files = porcelain.split('\n').filter(Boolean).map((line) => ({
              status: line.slice(0, 2).trim(),
              path: line.slice(3),
            }))
            // Upstream tracking + ahead/behind, when the branch has one. No
            // upstream (a fresh local branch) is normal, not an error.
            let upstream = null, ahead = null, behind = null
            try {
              upstream = (await gitStrict(root, ['rev-parse', '--abbrev-ref', '--symbolic-full-name', '@{u}'])).trim()
              const counts = await gitStrict(root, ['rev-list', '--left-right', '--count', '@{u}...HEAD'])
              const [b, a] = counts.split(/\s+/).map(Number)
              behind = b; ahead = a
            } catch { /* no upstream configured */ }
            return sendJson(res, 200, { branch: branch.trim(), files, upstream, ahead, behind })
          }
          if (url === '/api/git/revert' && req.method === 'POST') {
            const { file } = await readBody(req)
            const abs = safeRepoPath(root, file)
            // In HEAD → restore the committed version (index + worktree).
            // Not in HEAD → a new file: drop it from the index if staged and
            // delete it from disk.
            let inHead = true
            try { await gitStrict(root, ['cat-file', '-e', `HEAD:${file}`]) } catch { inHead = false }
            if (inHead) {
              await gitStrict(root, ['checkout', 'HEAD', '--', file])
              return sendJson(res, 200, { ok: true, action: 'reverted' })
            }
            try { await gitStrict(root, ['rm', '-f', '--cached', '--', file]) } catch { /* not staged */ }
            if (fs.existsSync(abs)) fs.rmSync(abs)
            return sendJson(res, 200, { ok: true, action: 'removed' })
          }
          if (url === '/api/git/commit' && req.method === 'POST') {
            const { message, files } = await readBody(req)
            if (!message || !message.trim()) throw new Error('commit message is required')
            const branch = (await git(root, ['rev-parse', '--abbrev-ref', 'HEAD'])).trim()
            assertNotMainBranch(branch)
            if (Array.isArray(files) && files.length) {
              for (const f of files) safeRepoPath(root, f)
              await gitStrict(root, ['add', '--', ...files])
            } else {
              await gitStrict(root, ['add', '-A'])
            }
            const staged = (await git(root, ['diff', '--cached', '--name-only'])).trim()
            if (!staged) throw new Error('nothing staged to commit')
            const out = await gitStrict(root, ['commit', '-m', message])
            return sendJson(res, 200, { ok: true, output: out.split('\n')[0] })
          }
          if (url === '/api/git/branch' && req.method === 'POST') {
            const { name } = await readBody(req)
            if (!/^[A-Za-z0-9][A-Za-z0-9._/-]*$/.test(name || '')) {
              throw new Error('branch name: letters, digits, dot, dash, slash, underscore; no leading dash')
            }
            await gitStrict(root, ['checkout', '-b', name])
            return sendJson(res, 200, { ok: true, branch: name })
          }
          if (url === '/api/formspree-doc' && req.method === 'POST') {
            return sendJson(res, 200, writeFormspreeDoc(root))
          }
          if (url === '/api/git/diff' && req.method === 'GET') {
            const file = new URLSearchParams(req.url.split('?')[1] ?? '').get('file')
            if (!file) throw new Error('missing file parameter')
            // `--` guards against a path that looks like a flag; untracked
            // files have no diff, so fall back to /dev/null for those.
            const tracked = (await git(root, ['ls-files', '--', file])).trim()
            const diff = tracked
              ? await git(root, ['diff', 'HEAD', '--', file])
              : await git(root, ['diff', '--no-index', '--', '/dev/null', file])
            return sendJson(res, 200, { diff })
          }
          if (url === '/api/art' && req.method === 'GET') {
            return sendJson(res, 200, listArt(root))
          }
          if (url === '/api/art/reorder' && req.method === 'POST') {
            const { game, category, order } = await readBody(req)
            return sendJson(res, 200, reorderArt(root, game, category, order))
          }
          if (url === '/api/art/rename' && req.method === 'POST') {
            const { game, category, file, name } = await readBody(req)
            return sendJson(res, 200, renameArt(root, game, category, file, name))
          }
          if (url === '/api/art/delete' && req.method === 'POST') {
            const { game, category, file } = await readBody(req)
            return sendJson(res, 200, await deleteArt(root, game, category, file))
          }
          if (url === '/api/art/upload' && req.method === 'POST') {
            const q = new URLSearchParams(req.url.split('?')[1] ?? '')
            const body = await readRawBody(req)
            return sendJson(res, 200,
              await uploadArt(root, q.get('game'), q.get('category'), q.get('filename'), body))
          }
          if (url === '/api/art/regen' && req.method === 'POST') {
            await generateAllVariants()
            return sendJson(res, 200, { ok: true })
          }
        } catch (err) {
          return sendJson(res, 400, { error: err.message })
        }

        const headMatch = url.match(/^\/api\/head-images\/([a-zA-Z]+)$/)
        if (headMatch && req.method === 'PUT') {
          try {
            const { path: assetPath } = await readBody(req)
            writeHeadImage(root, headMatch[1], assetPath)
            sendJson(res, 200, { ok: true })
          } catch (err) {
            sendJson(res, 400, { error: err.message })
          }
          return
        }

        const blockMatch = url.match(/^\/api\/block\/([a-zA-Z]+)$/)
        if (blockMatch && req.method === 'PUT') {
          const name = blockMatch[1]
          if (!BLOCKS[name] || !blockAvailable(root, name)) {
            sendJson(res, 404, { error: `unknown block "${name}"` })
            return
          }
          try {
            writeBlock(root, name, await readBody(req))
            sendJson(res, 200, { ok: true })
          } catch (err) {
            sendJson(res, 400, { error: err.message })
          }
          return
        }

        next()
      })
    },
  }
}
