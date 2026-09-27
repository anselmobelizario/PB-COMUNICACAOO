import { createHash } from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

// Run after adding or replacing anything under public/assets:
//   npm run generate-asset-versions
//
// The gallery photos already carry their hash in galleryImageRatios.json (they
// also store dimensions there), so those paths are skipped here. Everything
// else — hero clips, posters, client logos, materials/production videos,
// fonts — lands in assetVersions.json and is served as ?v=hash, which
// vercel.json caches as immutable.

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const assetsDir = path.join(rootDir, 'public', 'assets');
const outFile = path.join(rootDir, 'src', 'data', 'assetVersions.json');
const galleryManifest = JSON.parse(
  await fs.readFile(path.join(rootDir, 'src', 'data', 'galleryImageRatios.json'), 'utf8'),
);

async function collectFiles(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await collectFiles(fullPath)));
    } else if (entry.isFile()) {
      files.push(fullPath);
    }
  }

  return files;
}

export async function buildAssetManifest() {
  const manifest = {};

  for (const file of await collectFiles(assetsDir)) {
    const publicSrc = `/assets/${path.relative(assetsDir, file).split(path.sep).join('/')}`;
    if (galleryManifest[publicSrc] || publicSrc.endsWith('.avif')) continue;

    const hash = createHash('sha1');
    hash.update(await fs.readFile(file));
    manifest[publicSrc] = hash.digest('hex').slice(0, 8);
  }

  return Object.fromEntries(
    Object.entries(manifest).sort(([a], [b]) => a.localeCompare(b)),
  );
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const manifest = await buildAssetManifest();
  await fs.writeFile(outFile, `${JSON.stringify(manifest, null, 2)}\n`);
  console.log(`Wrote ${Object.keys(manifest).length} entries to ${path.relative(rootDir, outFile)}`);
}
