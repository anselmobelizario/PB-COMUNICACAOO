// Post-build step: swaps the empty <div id="root"></div> in dist/index.html
// for the fully prerendered tree (npm run build chains it after `vite build
// --ssr`). The client bundle then hydrates that markup instead of rendering
// into an empty root, so first paint carries every section and the crawlable
// text no longer depends on JavaScript.
//
// The __SITE_URL__/__JSON_LD__ placeholders were already replaced during the
// client build; only the root div is touched here.

import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const indexPath = path.join(rootDir, 'dist', 'index.html')
const serverEntry = path.join(rootDir, 'dist', 'ssr', 'entry-server.js')

const [indexHtml, { render }] = await Promise.all([
  fs.readFile(indexPath, 'utf8'),
  import(pathToFileURL(serverEntry).href),
])

const EMPTY_ROOT = '<div id="root"></div>'
if (!indexHtml.includes(EMPTY_ROOT)) {
  throw new Error(`dist/index.html has no empty #root div — was it already prerendered?`)
}

const appHtml = await render()
await fs.writeFile(indexPath, indexHtml.replace(EMPTY_ROOT, `<div id="root">${appHtml}</div>`))

const textLength = appHtml.replace(/<[^>]+>/g, ' ').length
console.log(`Prerendered ${appHtml.length} chars of markup (~${textLength} chars of text) into dist/index.html`)
