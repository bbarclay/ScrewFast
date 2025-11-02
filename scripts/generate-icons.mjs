/*
  Generate site icons from the brand logo.
  - Reads:  src/images/garrett-integrations-logo.png
  - Writes: src/images/icon.png (square, transparent)
            src/images/icon-maskable.png (square, transparent, extra safe padding)

  Run from repo root of ScrewFast:  node scripts/generate-icons.mjs
*/

import sharp from 'sharp';
import path from 'node:path';
import fs from 'node:fs/promises';

const SIZE = 1024; // base size; manifest will downscale to 512/192, favicon to 16/32
const MASKABLE_SCALE = 0.72; // keep content within mask safe area (~72%)

const srcLogo = path.resolve('src/images/garrett-integrations-logo.png');
const outIcon = path.resolve('src/images/icon.png');
const outMaskable = path.resolve('src/images/icon-maskable.png');

async function ensureSourceExists(file) {
  try {
    await fs.access(file);
  } catch {
    throw new Error(`Source logo not found at: ${file}`);
  }
}

async function generateStandardIcon() {
  // Contain within a square canvas with transparent background
  await sharp(srcLogo)
    .resize({ width: SIZE, height: SIZE, fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png({ compressionLevel: 9, adaptiveFiltering: true })
    .toFile(outIcon);
}

async function generateMaskableIcon() {
  // Create a transparent square then composite a scaled logo in the center
  const logoBuf = await sharp(srcLogo)
    .resize({ width: Math.round(SIZE * MASKABLE_SCALE), height: Math.round(SIZE * MASKABLE_SCALE), fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png({ compressionLevel: 9, adaptiveFiltering: true })
    .toBuffer();

  await sharp({
    create: {
      width: SIZE,
      height: SIZE,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 }, // transparent
    },
  })
    .composite([{ input: logoBuf, gravity: 'center' }])
    .png({ compressionLevel: 9, adaptiveFiltering: true })
    .toFile(outMaskable);
}

async function main() {
  console.log('Generating site icons from brand logo...');
  await ensureSourceExists(srcLogo);
  await generateStandardIcon();
  await generateMaskableIcon();
  console.log('✓ Generated:', outIcon);
  console.log('✓ Generated:', outMaskable);
  console.log('Done.');
}

main().catch((err) => {
  console.error('Icon generation failed:', err);
  process.exit(1);
});

