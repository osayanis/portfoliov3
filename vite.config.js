import { defineConfig } from 'vite'
import { readdirSync, existsSync } from 'node:fs'
import { resolve } from 'node:path'

// Une entrée par page : l'accueil + chaque étude de cas générée dans projets/<slug>/
const pages = { main: resolve(import.meta.dirname, 'index.html') }
if (existsSync('projets')) {
  for (const slug of readdirSync('projets')) {
    const file = resolve(import.meta.dirname, 'projets', slug, 'index.html')
    if (existsSync(file)) pages[slug] = file
  }
}

export default defineConfig({
  build: { rollupOptions: { input: pages } },
})
