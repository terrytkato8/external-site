// Writes docs/CNAME when building for production.
// Staging and other targets get no CNAME, so they can't accidentally claim
// kato8studios.com when served from a different host.
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

if (target !== 'prod' || process.env.VITE_WRITE_CNAME === '0') {
  if (fs.existsSync(cnamePath)) {
    fs.rmSync(cnamePath)
    console.log(`Removed docs/CNAME (target=${target})`)
  } else {
    console.log(`Skipped CNAME (target=${target})`)
  }
  process.exit(0)
}

if (!fs.existsSync(docsDir)) {
  console.error('docs/ does not exist; run vite build first')
  process.exit(1)
}

fs.writeFileSync(cnamePath, `${PROD_HOSTNAME}\n`)
console.log(`Wrote docs/CNAME -> ${PROD_HOSTNAME}`)
