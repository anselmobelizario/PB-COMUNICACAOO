import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const publicDir = path.join(rootDir, 'public');
const logoPath = path.join(publicDir, 'assets', 'logo.png');

const trimmedLogo = await sharp(logoPath).trim().toBuffer();

async function writePng(size, fileName) {
  const outputPath = path.join(publicDir, fileName);
  await sharp(trimmedLogo)
    .resize(size, size, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toFile(outputPath);
  console.log(`generated ${path.relative(rootDir, outputPath)}`);
  return fs.readFile(outputPath);
}

function wrapPngAsIco(png) {
  const header = Buffer.alloc(22);
  header.writeUInt16LE(0, 0);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(1, 4);
  header.writeUInt8(32, 6);
  header.writeUInt8(32, 7);
  header.writeUInt8(0, 8);
  header.writeUInt8(0, 9);
  header.writeUInt16LE(1, 10);
  header.writeUInt16LE(32, 12);
  header.writeUInt32LE(png.length, 14);
  header.writeUInt32LE(22, 18);
  return Buffer.concat([header, png]);
}

await fs.mkdir(publicDir, { recursive: true });

const svgLogoPng = await sharp(trimmedLogo)
  .resize(128, 128, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
  .png()
  .toBuffer();
const svgPath = path.join(publicDir, 'favicon.svg');
await fs.writeFile(
  svgPath,
  `<svg width="128" height="128" viewBox="0 0 128 128" xmlns="http://www.w3.org/2000/svg"><image width="128" height="128" href="data:image/png;base64,${svgLogoPng.toString('base64')}"/></svg>`
);
console.log(`generated ${path.relative(rootDir, svgPath)}`);

const png32 = await writePng(32, 'favicon-32x32.png');
await writePng(16, 'favicon-16x16.png');
await writePng(180, 'apple-touch-icon.png');
await writePng(192, 'icon-192x192.png');
await writePng(512, 'icon-512x512.png');

// Maskable icons get cropped to a circle/squircle by Android, so the logo
// shrinks into the 80% safe zone on a solid white tile instead of filling
// the canvas edge to edge.
async function writeMaskablePng(size, fileName) {
  const inner = Math.round(size * 0.8);
  const pad = Math.round((size - inner) / 2);
  const outputPath = path.join(publicDir, fileName);
  await sharp(trimmedLogo)
    .resize(inner, inner, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .extend({
      top: pad,
      bottom: pad,
      left: pad,
      right: pad,
      background: { r: 255, g: 255, b: 255, alpha: 1 },
    })
    .png()
    .toFile(outputPath);
  console.log(`generated ${path.relative(rootDir, outputPath)}`);
}

await writeMaskablePng(512, 'icon-maskable-512x512.png');

const icoPath = path.join(publicDir, 'favicon.ico');
await fs.writeFile(icoPath, wrapPngAsIco(png32));
console.log(`generated ${path.relative(rootDir, icoPath)}`);
