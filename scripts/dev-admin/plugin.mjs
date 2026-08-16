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
import { fileURLToPath } from 'node:url'
import { BLOCKS, blockAvailable, readBlock, writeBlock } from './serialize.mjs'
import { listArt, reorderArt, uploadArt, deleteArt, generateAllVariants } from './art.mjs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

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
          if (url === '/api/art' && req.method === 'GET') {
            return sendJson(res, 200, listArt(root))
          }
          if (url === '/api/art/reorder' && req.method === 'POST') {
            const { game, category, order } = await readBody(req)
            return sendJson(res, 200, reorderArt(root, game, category, order))
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
