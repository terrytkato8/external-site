import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { generateAllVariants } from './scripts/generate-image-variants.mjs'

// ConceptArtGallery globs only the generated WebP variants, and those are
// gitignored — so on a fresh clone the gallery is empty until the generator
// has run. `npm run dev` / `npm run build` run it first (the documented,
// order-dependent build chain), but a bare `vite` or `vite build` would not.
// This plugin closes that gap. The generator is incremental — it stats each
// variant against its source and skips up-to-date ones — so running it on
// both paths costs nothing measurable.
const generateImageVariants = {
  name: 'generate-image-variants',
  async buildStart() {
    await generateAllVariants()
  },
}

// Deploy target controls the public base path.
//   prod    -> served at https://kato8studios.com/        (base '/')
//   staging -> served at https://aeiti.github.io/kato8-staging/
//
// Default is 'prod' so plain `npm run build` always produces a production-safe
// artifact. Override with `VITE_DEPLOY_TARGET=staging npm run build`.
const target = process.env.VITE_DEPLOY_TARGET || 'prod'
const base = target === 'staging' ? '/kato8-staging/' : '/'

export default defineConfig({
  plugins: [generateImageVariants, react()],
  base,
  build: {
    outDir: 'docs',
  },
})
