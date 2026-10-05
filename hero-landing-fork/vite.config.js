import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import fs from 'node:fs/promises'
import path from 'node:path'
import { siteData } from './src/data/siteData.js'
import assetVersions from './src/data/assetVersions.json'

// Local builds have no VITE_SITE_URL; the custom domain is live, so falling
// back to the old *.vercel.app host would canonicalize to a 301.
const fallbackSiteUrl = 'https://pbcomunicacao.com.br/'

function normalizeSiteUrl(value = fallbackSiteUrl) {
  const candidate = value?.trim() || fallbackSiteUrl
  const withProtocol = /^https?:\/\//i.test(candidate) ? candidate : `https://${candidate}`
  const url = new URL(withProtocol)
  url.hash = ''
  url.search = ''
  url.pathname = '/'
  return url.href
}

function resolveSiteUrl(env) {
  // VITE_SITE_URL is pinned in the Vercel project for every environment and is
  // the only thing that can move canonical/og:url/sitemap.
  return normalizeSiteUrl(env.VITE_SITE_URL || fallbackSiteUrl)
}

function absoluteUrl(siteUrl, pathname) {
  return new URL(pathname, siteUrl).href
}

function buildJsonLd(siteUrl) {
  const { company, contact, social, faq } = siteData
  const logoUrl = absoluteUrl(siteUrl, company.logoSrc)
  const imageUrl = absoluteUrl(siteUrl, '/assets/og-image.jpg')

  return JSON.stringify(
    [
      {
        '@context': 'https://schema.org',
        '@type': 'LocalBusiness',
        '@id': `${siteUrl}#business`,
        name: company.name,
        description: company.description,
        url: siteUrl,
        logo: logoUrl,
        image: imageUrl,
        foundingDate: String(company.founded),
        email: contact.email,
        telephone: '+551138360196',
        contactPoint: [
          {
            '@type': 'ContactPoint',
            telephone: '+551138360196',
            contactType: 'sales',
            areaServed: 'BR',
            availableLanguage: 'Portuguese',
          },
          {
            '@type': 'ContactPoint',
            telephone: '+551136448907',
            contactType: 'customer service',
            areaServed: 'BR',
            availableLanguage: 'Portuguese',
          },
        ],
        priceRange: '$$',
        areaServed: { '@type': 'Country', name: 'Brasil' },
        hasMap: contact.location.googleMapsUrl,
        address: {
          '@type': 'PostalAddress',
          streetAddress: 'Rua Antonio Raposo, 149',
          addressLocality: 'São Paulo',
          addressRegion: 'SP',
          postalCode: '05074-020',
          addressCountry: 'BR',
        },
        geo: {
          '@type': 'GeoCoordinates',
          latitude: contact.location.lat,
          longitude: contact.location.lng,
        },
        sameAs: social.map((item) => item.href),
      },
      {
        '@context': 'https://schema.org',
        '@type': 'WebSite',
        name: company.name,
        url: siteUrl,
        description: company.description,
        inLanguage: 'pt-BR',
      },
      {
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: faq.items.map((item) => ({
          '@type': 'Question',
          name: item.q,
          acceptedAnswer: {
            '@type': 'Answer',
            text: item.a,
          },
        })),
      },
    ],
    null,
    0,
  )
}

// Stable-named assets that index.html or the generated CSS reference directly.
// They get ?v= from assetVersions.json so vercel.json can cache them as
// immutable. og-image and the JSON-LD logo stay unversioned on purpose —
// canonical meta URLs should not change when an image is re-encoded.
const versionedHtmlPaths = [
  '/assets/hero/hero-video-02-poster-portrait-480.webp',
  '/assets/hero/hero-video-02-poster-640.webp',
  '/assets/hero/hero-video-02-poster-960.webp',
  '/assets/hero/hero-video-02-poster-1280.webp',
  '/assets/logo-original-240.webp',
  '/assets/logo-original-360.webp',
  '/assets/logo-original.webp',
  '/assets/fonts/space-grotesk-var.woff2',
  '/assets/fonts/plus-jakarta-sans-var.woff2',
]

const versionPath = (path) => {
  const version = assetVersions[path]
  return version ? `${path}?v=${version}` : path
}

function staticAssetVersioningPlugin() {
  let htmlOutDir = 'dist'

  return {
    name: 'pb-static-asset-versioning',
    configResolved(config) {
      htmlOutDir = config.build.outDir
    },
    // index.html is versioned after the write, not via transformIndexHtml:
    // Vite rebuilds the imagesrcset attribute during the build and drops the
    // query string off each candidate. The SSR bundle has no index.html —
    // skip silently there.
    async closeBundle() {
      const file = path.resolve(process.cwd(), htmlOutDir, 'index.html')
      let html
      try {
        html = await fs.readFile(file, 'utf8')
      } catch {
        return
      }
      const versioned = versionedHtmlPaths.reduce(
        (acc, path) => acc.replaceAll(path, versionPath(path)),
        html,
      )
      if (versioned !== html) await fs.writeFile(file, versioned)
    },
    generateBundle(_, bundle) {
      for (const file of Object.values(bundle)) {
        if (file.type !== 'asset' || !file.fileName.endsWith('.css')) continue
        file.source = versionedHtmlPaths.reduce(
          (acc, path) => acc.replaceAll(path, versionPath(path)),
          String(file.source),
        )
      }
    },
  }
}

function htmlMetadataPlugin(siteUrl) {
  return {
    name: 'pb-html-metadata',
    transformIndexHtml(html) {
      const ogImageUrl = absoluteUrl(siteUrl, '/assets/og-image.jpg')

      return html
        .replaceAll('__SITE_URL__', siteUrl)
        .replaceAll('__OG_IMAGE_URL__', ogImageUrl)
        .replace('__JSON_LD__', buildJsonLd(siteUrl))
    },
  }
}

export default defineConfig(({ mode, isSsrBuild }) => {
  const env = { ...process.env, ...loadEnv(mode, process.cwd(), '') }
  const siteUrl = resolveSiteUrl(env)

  return {
    // The SSR bundle only needs the JS entry; without this it would copy the
    // whole public/ folder into dist/ssr a second time.
    publicDir: isSsrBuild ? false : 'public',
    plugins: [htmlMetadataPlugin(siteUrl), staticAssetVersioningPlugin(), react(), tailwindcss()],
    build: {
      target: 'es2020',
      cssCodeSplit: true,
      // Hashed bundles live under /_app/*, which is the only path (besides
      // gallery URLs carrying ?v=) that vercel.json lets be cached as
      // immutable — public/ keeps stable names and gets a 1-day cache.
      assetsDir: '_app',
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (!id.includes('node_modules')) return undefined
            if (/[\\/]node_modules[\\/](react|react-dom|scheduler)[\\/]/.test(id)) {
              return 'vendor-react'
            }
            if (/[\\/]node_modules[\\/]lucide-react[\\/]/.test(id)) {
              return 'vendor-icons'
            }
            return 'vendor'
          },
        },
      },
    },
  }
})
