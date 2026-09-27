import { Component, lazy, Suspense, useEffect } from 'react'
import Navbar from './components/layout/Navbar'
import Hero from './components/sections/Hero'
import TrustLogos from './components/sections/TrustLogos'
import FloatingWhatsApp from './components/ui/FloatingWhatsApp'

const Benefits = lazy(() => import('./components/sections/Benefits'))
const Process = lazy(() => import('./components/sections/Process'))
const MaterialsVideo = lazy(() => import('./components/sections/MaterialsVideo'))
const Services = lazy(() => import('./components/sections/Services'))
const Portfolio = lazy(() => import('./components/sections/Portfolio'))
const FAQ = lazy(() => import('./components/sections/FAQ'))
const CTA = lazy(() => import('./components/sections/CTA'))
const ContactForm = lazy(() => import('./components/sections/ContactForm'))
const LocationMapSection = lazy(() => import('./components/sections/LocationMapSection'))
const Footer = lazy(() => import('./components/layout/Footer'))

const CHUNK_RELOAD_KEY = 'pb:chunk-reload-at'
const CHUNK_LOAD_ERROR =
  /failed to fetch dynamically imported module|error loading dynamically imported module|importing a module script failed/i

class SectionErrorBoundary extends Component {
  componentDidCatch(error) {
    // A promote swaps the hashed chunk names, so a tab opened against the
    // previous deployment 404s its lazy imports and would blank the section.
    // One clean reload picks up the new build; the timestamp guards against
    // reload loops if it keeps failing.
    if (!(error instanceof TypeError) || !CHUNK_LOAD_ERROR.test(error.message)) return
    const lastReload = Number(sessionStorage.getItem(CHUNK_RELOAD_KEY) || 0)
    if (Date.now() - lastReload < 10000) return
    sessionStorage.setItem(CHUNK_RELOAD_KEY, String(Date.now()))
    window.location.reload()
  }

  render() {
    return this.props.children
  }
}

function LazySection({ children }) {
  return (
    <Suspense fallback={null}>
      <SectionErrorBoundary>{children}</SectionErrorBoundary>
    </Suspense>
  )
}

function useDeepLinkScroll() {
  useEffect(() => {
    let cancelled = false
    let userMoved = false
    const markUserMoved = () => { userMoved = true }
    window.addEventListener('wheel', markUserMoved, { passive: true, once: true })
    window.addEventListener('touchmove', markUserMoved, { passive: true, once: true })
    window.addEventListener('keydown', markUserMoved, { once: true })

    const scrollToHash = () => {
      const id = window.location.hash.slice(1)
      if (!id) return
      let frames = 0
      // Lazy sections mount after the browser's own anchor attempt, so keep
      // looking for a few seconds before giving up.
      const look = () => {
        if (cancelled) return
        const target = document.getElementById(id)
        if (!target) {
          if (frames++ < 300) requestAnimationFrame(look)
          return
        }
        target.scrollIntoView({ behavior: 'instant', block: 'start' })
        // Lazy media keeps resizing the page after the first jump; nudge the
        // scroll back until the layout settles — unless the user scrolls.
        const start = Date.now()
        const settle = () => {
          if (cancelled || userMoved) return
          if (Math.abs(target.getBoundingClientRect().top) > 2) {
            target.scrollIntoView({ behavior: 'instant', block: 'start' })
          }
          if (Date.now() - start < 2500) requestAnimationFrame(settle)
        }
        requestAnimationFrame(settle)
      }
      look()
    }

    scrollToHash()
    window.addEventListener('hashchange', scrollToHash)
    return () => {
      cancelled = true
      window.removeEventListener('wheel', markUserMoved)
      window.removeEventListener('touchmove', markUserMoved)
      window.removeEventListener('keydown', markUserMoved)
      window.removeEventListener('hashchange', scrollToHash)
    }
  }, [])
}

function App() {
  useDeepLinkScroll()

  return (
    <>
      <a href="#content" className="skip-link">
        Pular para o conteúdo
      </a>
      <Navbar />
      <main id="content">
        <Hero />
        <TrustLogos />
        <LazySection><Benefits /></LazySection>
        <LazySection><Process /></LazySection>
        <LazySection><MaterialsVideo /></LazySection>
        <LazySection><Services /></LazySection>
        <LazySection><Portfolio /></LazySection>
        <LazySection><FAQ /></LazySection>
        <LazySection><CTA /></LazySection>
        <LazySection><ContactForm /></LazySection>
        <LazySection><LocationMapSection /></LazySection>
      </main>
      <LazySection><Footer /></LazySection>
      <FloatingWhatsApp />
    </>
  )
}

export default App
