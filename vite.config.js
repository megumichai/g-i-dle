import { defineConfig } from 'vite'

// GitHub Pages serves project sites from /<repo>/, so CI passes the base path
// (from actions/configure-pages) via BASE_PATH. Locally this falls back to the
// site root.
export default defineConfig({
  base: process.env.BASE_PATH || '/',
})
