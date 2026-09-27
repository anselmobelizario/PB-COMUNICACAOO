import { StrictMode, startTransition } from 'react'
import { createRoot } from 'react-dom/client'
import './styles/index.css'
import App from './App.jsx'

const root = createRoot(document.getElementById('root'))

// The first paint is a tree of lazy sections with nothing interactive above
// the fold yet — rendering it non-urgently lets React slice the work and
// keeps the main thread responsive while the chunks stream in.
startTransition(() => {
  root.render(
    <StrictMode>
      <App />
    </StrictMode>,
  )
})
