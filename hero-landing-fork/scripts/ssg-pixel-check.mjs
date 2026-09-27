// Pixel gate for the SSG work: captures full-page screenshots of the built
// site so the prerendered output can be diffed against the client-only build.
//   node scripts/ssg-pixel-check.mjs benchmark/2026-09-27/ssg-baseline
// Serve dist/ first (npx vite preview --port 4174) and pass its URL via
// BASE_URL when it is not the default below.

import fs from 'node:fs/promises'
import path from 'node:path'
import { chromium } from 'playwright'

const outDir = path.resolve(process.argv[2] ?? 'scratch-ssg-shots')
const baseUrl = process.env.BASE_URL ?? 'http://localhost:4174/'
const viewports = [
  { name: 'mobile-320', width: 320, height: 720 },
  { name: 'mobile-375', width: 375, height: 812 },
  { name: 'desktop-1440', width: 1440, height: 900 },
]

await fs.mkdir(outDir, { recursive: true })

const browser = await chromium.launch()
for (const viewport of viewports) {
  const page = await browser.newPage({ viewport: { width: viewport.width, height: viewport.height } })
  await page.goto(baseUrl, { waitUntil: 'networkidle' })
  await page.evaluate(() => {
    document.documentElement.style.scrollBehavior = 'auto'
  })
  await page.waitForTimeout(800)
  await page.screenshot({ path: path.join(outDir, `${viewport.name}.png`), fullPage: true })
  await page.close()
  console.log(`captured ${viewport.name}`)
}
await browser.close()
