import fs from 'node:fs/promises';
import path from 'node:path';
import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const publicDir = path.join(rootDir, 'public');
const fallbackSiteUrl = 'https://pbcomunicacao.com.br/';

function normalizeSiteUrl(value = fallbackSiteUrl) {
  const candidate = value.trim() || fallbackSiteUrl;
  const withProtocol = /^https?:\/\//i.test(candidate) ? candidate : `https://${candidate}`;
  const url = new URL(withProtocol);
  url.hash = '';
  url.search = '';
  url.pathname = '/';
  return url.href;
}

function resolveSiteUrl(env) {
  // same rule as vite.config.js: only VITE_SITE_URL decides, never a
  // Vercel-injected domain that could flip to the unpropagated custom domain
  return normalizeSiteUrl(env.VITE_SITE_URL || fallbackSiteUrl);
}

const siteUrl = resolveSiteUrl(process.env);

// O Google usa lastmod de verdade: data do último commit que mexeu no
// conteúdo, não a data do deploy.
function lastContentChangeDate() {
  try {
    const date = execSync(
      'git log -1 --format=%as -- src index.html public/assets scripts',
      { encoding: 'utf8', cwd: rootDir },
    ).trim();
    if (/^\d{4}-\d{2}-\d{2}$/.test(date)) return date;
  } catch {
    // fora de um repo git — cai no fallback
  }
  return new Date().toISOString().slice(0, 10);
}

const lastmod = lastContentChangeDate();

await fs.mkdir(publicDir, { recursive: true });

await fs.writeFile(
  path.join(publicDir, 'robots.txt'),
  `User-agent: *\nAllow: /\nSitemap: ${new URL('/sitemap.xml', siteUrl).href}\n`,
);

await fs.writeFile(
  path.join(publicDir, 'sitemap.xml'),
  `<?xml version="1.0" encoding="UTF-8"?>\n` +
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
    `  <url>\n` +
    `    <loc>${siteUrl}</loc>\n` +
    `    <lastmod>${lastmod}</lastmod>\n` +
    `  </url>\n` +
    `</urlset>\n`,
);

console.log(`generated robots.txt and sitemap.xml for ${siteUrl}`);
