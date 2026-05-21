import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Deploy target controls the public base path.
//   prod    -> served at https://kato8studios.com/        (base '/')
//   staging -> served at https://aeiti.github.io/kato8-staging/
//
// Default is 'prod' so plain `npm run build` always produces a production-safe
// artifact. Override with `VITE_DEPLOY_TARGET=staging npm run build`.
const target = process.env.VITE_DEPLOY_TARGET || 'prod'
const base = target === 'staging' ? '/kato8-staging/' : '/'

export default defineConfig({
  plugins: [react()],
  base,
  build: {
    outDir: 'docs',
  },
})
