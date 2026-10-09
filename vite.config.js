import { defineConfig } from 'vite'

// base matches the GitHub Pages repo path: https://lougastardi.github.io/portfolio/
export default defineConfig({
  base: '/portfolio/',
  test: { environment: 'jsdom' }
})
