// Draws the app icons (the Sightglass logo: a bolted sight glass with a gas flame behind the
// glass, see public/icons/logo.svg) and writes them as PNGs.
// No image libraries: it computes each pixel and encodes the PNG with Node's zlib.
// Run: node scripts/make-icons.js

import { deflateSync } from 'node:zlib';
import { mkdirSync, writeFileSync } from 'node:fs';

const BG = [14, 23, 38];
const STEEL = [201, 212, 226];
const STEEL_LINE = [227, 233, 241];
const RIM = [232, 238, 246];
const FLAME = [124, 196, 250];
const FLAME_CORE = [232, 245, 255];
const WHITE = [255, 255, 255];

// The logo is drawn on a 40 x 40 grid, the same numbers as logo.svg.
const BOLTS = Array.from({ length: 8 }, (_, i) => [
  20 + 15.5 * Math.cos((i * Math.PI) / 4),
  20 + 15.5 * Math.sin((i * Math.PI) / 4),
]);

// The flame outlines from logo.svg, turned into lists of points.
const FLAME_OUTER = outline([20, 11.5], [
  ['C', [23, 15], [25.5, 17.2], [25.5, 21.6]],
  ['arc', [20, 21.6], 5.5],
  ['C', [14.5, 18.8], [16.2, 17.4], [17.2, 15.6]],
  ['C', [17.6, 17.3], [18.5, 18.2], [19.4, 18.6]],
  ['C', [19, 16.3], [19, 13.8], [20, 11.5]],
]);
const FLAME_INNER = outline([20, 18.5], [
  ['C', [21.5, 20.2], [22.6, 21.3], [22.6, 23]],
  ['arc', [20, 23], 2.6],
  ['C', [17.4, 21.5], [18.6, 20.3], [20, 18.5]],
]);

// Curves become 24 straight steps each. 'arc' is the round bottom of a flame: half a circle
// from its right side to its left side, under the center.
function outline(start, segments) {
  const points = [start];
  let [x0, y0] = start;
  for (const [kind, a, b, c] of segments) {
    for (let step = 1; step <= 24; step++) {
      const t = step / 24;
      if (kind === 'C') {
        const s = 1 - t;
        points.push([
          s * s * s * x0 + 3 * s * s * t * a[0] + 3 * s * t * t * b[0] + t * t * t * c[0],
          s * s * s * y0 + 3 * s * s * t * a[1] + 3 * s * t * t * b[1] + t * t * t * c[1],
        ]);
      } else {
        points.push([a[0] + b * Math.cos(Math.PI * t), a[1] + b * Math.sin(Math.PI * t)]);
      }
    }
    [x0, y0] = points.at(-1);
  }
  return points;
}

function inside(points, x, y) {
  let hit = false;
  for (let i = 0, j = points.length - 1; i < points.length; j = i++) {
    const [xi, yi] = points[i];
    const [xj, yj] = points[j];
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) hit = !hit;
  }
  return hit;
}

function colorAt(x, y) {
  const r = Math.hypot(x - 20, y - 20);
  if (r > 19) return BG;
  if (BOLTS.some(([bx, by]) => Math.hypot(x - bx, y - by) < 1.7)) return BG;
  if (Math.abs(r - 17.6) < 0.3) return STEEL_LINE;
  if (r > 12.25) return STEEL;
  if (r > 10.75) return RIM;
  if (inside(FLAME_INNER, x, y)) return FLAME_CORE;
  if (inside(FLAME_OUTER, x, y)) return FLAME;
  // A small shine on the glass, 70% white.
  if (Math.hypot(x - 14.6, y - 15) < 1.1) return BG.map((c, i) => c * 0.3 + WHITE[i] * 0.7);
  return BG;
}

// size: pixels. scale: how much of the icon the logo fills (smaller for maskable icons, which
// phones crop to a circle or rounded square).
function drawIcon(size, scale) {
  const samples = 4;
  const pixels = Buffer.alloc(size * size * 4);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const sum = [0, 0, 0];
      for (let sy = 0; sy < samples; sy++) {
        for (let sx = 0; sx < samples; sx++) {
          // Position from -1 to 1, centered, then onto the logo's 40 x 40 grid.
          const u = ((x + (sx + 0.5) / samples) / size) * 2 - 1;
          const v = ((y + (sy + 0.5) / samples) / size) * 2 - 1;
          const color = colorAt(20 + (u / scale) * 20, 20 + (v / scale) * 20);
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
  ['icon-192.png', 192, 0.88],
  ['icon-512.png', 512, 0.88],
  ['apple-touch-icon.png', 180, 0.84],
  ['icon-maskable-512.png', 512, 0.7],
];
for (const [name, size, scale] of icons) {
  writeFileSync(new URL(name, outDir), drawIcon(size, scale));
  console.log(`wrote public/icons/${name}`);
}
