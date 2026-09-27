import { StrictMode } from 'react'
import { prerenderToNodeStream } from 'react-dom/static'
import App from './App.jsx'

// Prerenders the whole tree to a string for scripts/prerender.mjs.
// prerenderToNodeStream (not renderToString) resolves the lazy() sections
// before the stream ends, so the static HTML carries every section.
export async function render() {
  const { prelude } = await prerenderToNodeStream(
    <StrictMode>
      <App />
    </StrictMode>,
  )

  let html = ''
  await new Promise((resolve, reject) => {
    prelude.on('data', (chunk) => {
      html += chunk.toString()
    })
    prelude.on('end', resolve)
    prelude.on('error', reject)
  })

  return html
}
