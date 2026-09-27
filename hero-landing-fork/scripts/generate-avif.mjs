import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

// Run after adding or replacing images (and after generate-gallery-ratios):
//   npm run generate-avif
//
// Writes an .avif twin beside every image the site actually renders: the
// gallery photos tracked in galleryImageRatios.json (including their -480/-800
// variants), the client logos and the materials posters. Components serve the
// twins through <picture>; the WebP/JPG original stays as the fallback. The
// ?v= version is shared with the source file, so replacing an image only
// requires re-running the manifest scripts.

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const assetsDir = path.join(rootDir, 'public', 'assets');
const galleryManifest = JSON.parse(
  await fs.readFile(path.join(rootDir, 'src', 'data', 'galleryImageRatios.json'), 'utf8'),
);

// libavif gets slower as quality rises; 62 is where photos stay visually
// indistinguishable from the WebP originals (checked via PSNR below).
const AVIF_OPTIONS = { quality: 62, effort: 6 };

function variantPaths(publicSrc) {
  const paths = [publicSrc];
  if (publicSrc.endsWith('.webp')) {
    for (const size of [480, 800]) {
      paths.push(publicSrc.replace(/\.webp$/, `-${size}.webp`));
    }
  }
  return paths;
}

const requested = new Set();

for (const publicSrc of Object.keys(galleryManifest)) {
  for (const candidate of variantPaths(publicSrc)) requested.add(candidate);
}
const ENCODOABLE = /\.(webp|jpe?g|png)$/i;
for (const name of await fs.readdir(path.join(assetsDir, 'clients'))) {
  if (ENCODOABLE.test(name)) requested.add(`/assets/clients/${name}`);
}
for (const poster of await fs.readdir(path.join(assetsDir, 'materials'))) {
  if (/-poster\.(jpg|jpeg|webp)$/i.test(poster)) {
    requested.add(`/assets/materials/${poster}`);
  }
}

let encoded = 0;
let savedBytes = 0;
const psnrSamples = [];

for (const publicSrc of [...requested].sort()) {
  if (!ENCODOABLE.test(publicSrc)) continue;

  const sourcePath = path.join(assetsDir, publicSrc.replace('/assets/', ''));
  let sourceStat;
  try {
    sourceStat = await fs.stat(sourcePath);
  } catch {
    continue;
  }

  const avifPath = sourcePath.replace(/\.(webp|jpe?g|png)$/i, '.avif');
  // No temp+rename dance: Windows routinely denies the rename right after a
  // write (EPERM), and a half-written twin only matters mid-script run.
  await sharp(sourcePath).avif(AVIF_OPTIONS).toFile(avifPath);

  encoded += 1;
  const avifSize = (await fs.stat(avifPath)).size;
  savedBytes += sourceStat.size - avifSize;

  if (psnrSamples.length < 8 && sourceStat.size > 30_000) {
    // Mean squared error between the AVIF and its source decoded to raw
    // pixels — the dB number approximates how visible the re-encode is.
    const a = await sharp(sourcePath).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
    const b = await sharp(avifPath).ensureAlpha().resize(a.info.width, a.info.height).raw().toBuffer();
    let mse = 0;
    for (let i = 0; i < a.data.length; i += 1) {
      const delta = a.data[i] - b[i];
      mse += delta * delta;
    }
    mse /= a.data.length;
    psnrSamples.push(`${path.basename(avifPath)}: ${10 * Math.log10(255 * 255 / mse)} dB`);
  }
}

console.log(`Encoded ${encoded} AVIF twins, saved ${(savedBytes / 1024).toFixed(0)} KiB on disk`);
if (psnrSamples.length) {
  console.log(`Quality sample (PSNR, > 40 dB is visually lossless):\n  ${psnrSamples.join('\n  ')}`);
}
