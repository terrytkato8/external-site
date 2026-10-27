// Post-build step that writes the deploy-target-specific files into docs/:
//
//   - docs/CNAME, for production only. Staging and other targets get no
//     CNAME, so they can't accidentally claim kato8studios.com when served
//     from a different host.
//   - docs/404.html's pathSegmentsToKeep: the number of path segments in the
//     deploy base (0 on prod, 1 on staging under /kato8-staging/). The source
//     file in public/ carries prod's value, so it stays identical in both
//     repos and only the built copy differs.
//
// Configure the prod hostname here. To suppress CNAME for prod (e.g. local
// preview), set VITE_WRITE_CNAME=0.

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const docsDir = path.join(__dirname, '..', 'docs')

const PROD_HOSTNAME = 'kato8studios.com'

const target = process.env.VITE_DEPLOY_TARGET || 'prod'
const cnamePath = path.join(docsDir, 'CNAME')
const fallbackPath = path.join(docsDir, '404.html')

if (!fs.existsSync(docsDir)) {
  console.error('docs/ does not exist; run vite build first')
  process.exit(1)
}

const fallback = fs.readFileSync(fallbackPath, 'utf8')
const SEGMENTS_RE = /var pathSegmentsToKeep = \d+/g
const found = fallback.match(SEGMENTS_RE)?.length ?? 0
if (found !== 1) {
  console.error(`docs/404.html: expected one \`var pathSegmentsToKeep = <n>\` line, found ${found}`)
  process.exit(1)
}
// Same rule as `base` in vite.config.js: '/kato8-staging/' for staging, '/' otherwise.
const segments = target === 'staging' ? 1 : 0
fs.writeFileSync(fallbackPath, fallback.replace(SEGMENTS_RE, `var pathSegmentsToKeep = ${segments}`))
console.log(`Set docs/404.html pathSegmentsToKeep = ${segments} (target=${target})`)

if (target !== 'prod' || process.env.VITE_WRITE_CNAME === '0') {
  if (fs.existsSync(cnamePath)) {
    fs.rmSync(cnamePath)
    console.log(`Removed docs/CNAME (target=${target})`)
  } else {
    console.log(`Skipped CNAME (target=${target})`)
  }
  process.exit(0)
}

fs.writeFileSync(cnamePath, `${PROD_HOSTNAME}\n`)
console.log(`Wrote docs/CNAME -> ${PROD_HOSTNAME}`)
