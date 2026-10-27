// Draws the app icons (a round sight glass, half full of water) and writes them as PNGs.
// No image libraries: it computes each pixel and encodes the PNG with Node's zlib.
// Run: node scripts/make-icons.js

import { deflateSync } from 'node:zlib';
import { mkdirSync, writeFileSync } from 'node:fs';

const BG = [11, 18, 32];
const RING = [226, 232, 240];
const WATER = [56, 189, 248];
const AIR = [24, 34, 56];
const SHINE = [255, 255, 255];

// size: pixels. scale: how much of the icon the glass fills (smaller for maskable icons, which
// phones crop to a circle or rounded square).
function drawIcon(size, scale) {
  const samples = 4;
  const pixels = Buffer.alloc(size * size * 4);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const sum = [0, 0, 0];
      for (let sy = 0; sy < samples; sy++) {
        for (let sx = 0; sx < samples; sx++) {
          // Position from -1 to 1, centered.
          const u = ((x + (sx + 0.5) / samples) / size) * 2 - 1;
          const v = ((y + (sy + 0.5) / samples) / size) * 2 - 1;
          const color = colorAt(u / scale, v / scale);
          for (let c = 0; c < 3; c++) sum[c] += color[c];
        }
      }
      const i = (y * size + x) * 4;
      for (let c = 0; c < 3; c++) pixels[i + c] = Math.round(sum[c] / (samples * samples));
      pixels[i + 3] = 255;
    }
  }
  return encodePng(size, pixels);
}

function colorAt(u, v) {
  const r = Math.hypot(u, v);
  if (r > 0.8) return BG;
  if (r > 0.66) return RING;
  // A gentle wave across the middle is the water line.
  const waterLine = 0.08 + 0.05 * Math.sin(u * 5);
  if (v > waterLine) return WATER;
  // A small highlight on the glass.
  if (Math.hypot(u + 0.28, v + 0.3) < 0.1) return SHINE;
  return AIR;
}

function encodePng(size, rgba) {
  const raw = Buffer.alloc((size * 4 + 1) * size);
  for (let y = 0; y < size; y++) {
    raw[y * (size * 4 + 1)] = 0; // filter: none
    rgba.copy(raw, y * (size * 4 + 1) + 1, y * size * 4, (y + 1) * size * 4);
  }
  const header = Buffer.alloc(13);
  header.writeUInt32BE(size, 0);
  header.writeUInt32BE(size, 4);
  header[8] = 8; // bit depth
  header[9] = 6; // RGBA
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', header),
    chunk('IDAT', deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

const CRC_TABLE = Array.from({ length: 256 }, (_, n) => {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});

function crc32(buffer) {
  let c = 0xffffffff;
  for (const byte of buffer) c = CRC_TABLE[(c ^ byte) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body));
  return Buffer.concat([length, body, crc]);
}

const outDir = new URL('../public/icons/', import.meta.url);
mkdirSync(outDir, { recursive: true });
const icons = [
  ['icon-192.png', 192, 1],
  ['icon-512.png', 512, 1],
  ['apple-touch-icon.png', 180, 1],
  ['icon-maskable-512.png', 512, 0.75],
];
for (const [name, size, scale] of icons) {
  writeFileSync(new URL(name, outDir), drawIcon(size, scale));
  console.log(`wrote public/icons/${name}`);
}
