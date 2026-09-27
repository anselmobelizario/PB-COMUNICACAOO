import { StrictMode } from 'react'
import { hydrateRoot } from 'react-dom/client'
import './styles/index.css'
import App from './App.jsx'

// The markup in dist/index.html was prerendered by scripts/prerender.mjs, so
// the client hydrates it instead of rendering into an empty root.
hydrateRoot(
  document.getElementById('root'),
  <StrictMode>
    <App />
  </StrictMode>,
)
