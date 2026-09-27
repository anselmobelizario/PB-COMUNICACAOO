import { StrictMode } from 'react'
import { createRoot, hydrateRoot } from 'react-dom/client'
import './styles/index.css'
import App from './App.jsx'

// Production HTML is prerendered by scripts/prerender.mjs and hydrates. The
// dev server has no prerender step, so an empty #root falls back to a
// client-only render instead of mismatch-noising every session.
const rootElement = document.getElementById('root')
const app = (
  <StrictMode>
    <App />
  </StrictMode>
)

if (rootElement.hasChildNodes()) {
  hydrateRoot(rootElement, app)
} else {
  createRoot(rootElement).render(app)
}
