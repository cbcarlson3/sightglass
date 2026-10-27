import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, existsSync, statSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { fitWithin, formatBytes, stripJpegMetadata, MAX_EDGE } from '../public/js/photo.js';
import { ageInYears, ageLabel } from '../public/js/serial/age.js';
import { fieldsFor, PLATE_FIELDS } from '../public/js/plate-fields.js';
import { EQUIPMENT_TYPES } from '../public/js/equipment.js';
import { SAMPLE_SCAN } from '../public/js/sample-scan.js';
import { decodeSerial } from '../public/js/serial/decode.js';
import { gaugePoint, GAUGE_MAX } from '../public/js/results.js';
import { TRUST } from '../public/js/trust.js';

const PUBLIC = fileURLToPath(new URL('../public/', import.meta.url));
const TODAY = new Date('2026-10-27T12:00:00Z');

test('photos shrink to fit, keep their shape, and never grow', () => {
  assert.deepEqual(fitWithin(4032, 3024), { width: MAX_EDGE, height: 1176 });
  assert.deepEqual(fitWithin(3024, 4032), { width: 1176, height: MAX_EDGE });
  assert.deepEqual(fitWithin(800, 600), { width: 800, height: 600 });
});

// A tiny JPEG-shaped byte string: SOI, APP0 (JFIF), APP1 (EXIF with GPS), COM, DQT, SOS + data.
function segment(marker, text) {
  const body = [...Buffer.from(text)];
  const length = body.length + 2;
  return [0xff, marker, length >> 8, length & 0xff, ...body];
}
const SOS_AND_DATA = [0xff, 0xda, 0x00, 0x02, 1, 2, 3, 0xff, 0xd9];
const fakeJpeg = new Uint8Array([
  0xff, 0xd8,
  ...segment(0xe0, 'JFIF'),
  ...segment(0xe1, 'Exif GPS 41.88N 87.63W'),
  ...segment(0xfe, 'a comment'),
  ...segment(0xdb, 'quant'),
  ...SOS_AND_DATA,
]);

test('EXIF, GPS and comments are stripped; the image data is kept', () => {
  const clean = stripJpegMetadata(fakeJpeg);
  const text = Buffer.from(clean).toString('latin1');
  assert.ok(!text.includes('GPS'));
  assert.ok(!text.includes('Exif'));
  assert.ok(!text.includes('comment'));
  assert.ok(text.includes('JFIF'));
  assert.ok(text.includes('quant'));
  assert.deepEqual([...clean.subarray(0, 2)], [0xff, 0xd8]);
  assert.deepEqual([...clean.subarray(-SOS_AND_DATA.length)], SOS_AND_DATA);
});

test('stripping refuses files that are not JPEGs', () => {
  assert.throws(() => stripJpegMetadata(new Uint8Array([0x89, 0x50, 0x4e, 0x47])));
});

test('file sizes read plainly', () => {
  assert.equal(formatBytes(3.4 * 1024 * 1024), '3.4 MB');
  assert.equal(formatBytes(250 * 1024), '250 KB');
});

test('age in whole years', () => {
  assert.equal(ageInYears({ year: 2012, month: 9 }, TODAY), 14);
  assert.equal(ageInYears({ year: 2012, month: 11 }, TODAY), 13);
  assert.equal(ageInYears({ year: 2017, week: 19 }, TODAY), 9);
  assert.equal(ageLabel({ year: 2012, month: 9 }, 'month', TODAY), '14 years old');
  assert.equal(ageLabel({ year: 2007 }, 'year', TODAY), 'About 19 years old');
  assert.equal(ageLabel({ year: 2025, month: 10 }, 'month', TODAY), '1 year old');
  assert.equal(ageLabel({ year: 2026, month: 6 }, 'month', TODAY), 'Less than a year old');
});

test('plate fields follow the equipment type', () => {
  const tank = fieldsFor('tank_water_heater').map((f) => f.id);
  const boiler = fieldsFor('boiler').map((f) => f.id);
  assert.ok(tank.includes('gallons'));
  assert.ok(!boiler.includes('gallons'));
  const ids = new Set(EQUIPMENT_TYPES.map((t) => t.id));
  for (const field of PLATE_FIELDS) {
    for (const type of field.equipment ?? []) assert.ok(ids.has(type), `${field.id}: ${type}`);
  }
});

test('the sample scan has every field and decodes to a date', () => {
  for (const field of fieldsFor(SAMPLE_SCAN.equipment)) {
    assert.ok(SAMPLE_SCAN.plate[field.id], `sample is missing ${field.id}`);
  }
  const { brand, serial } = SAMPLE_SCAN.plate;
  const result = decodeSerial({ brand: brand.value, serial: serial.value }, { today: TODAY });
  assert.equal(result.status, 'decoded');
});

test('the age gauge runs left to right and pins at the end', () => {
  assert.deepEqual(gaugePoint(0, 120), { x: 30, y: 150 });
  assert.deepEqual(gaugePoint(GAUGE_MAX / 2, 120), { x: 150, y: 30 });
  assert.deepEqual(gaugePoint(GAUGE_MAX, 120), { x: 270, y: 150 });
  assert.deepEqual(gaugePoint(35, 120), gaugePoint(GAUGE_MAX, 120));
});

test('every trust label has an icon the results screen can draw', () => {
  const results = readFileSync(join(PUBLIC, 'js/results.js'), 'utf8');
  for (const [kind, trust] of Object.entries(TRUST)) {
    assert.match(results, new RegExp(`\\b${trust.icon}: \\[`), `${kind} uses a missing icon`);
  }
});

function listFiles(dir) {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    return statSync(path).isDirectory() ? listFiles(path) : [relative(PUBLIC, path).split(sep).join('/')];
  });
}

test('the service worker caches every app file, and only files that exist', () => {
  const sw = readFileSync(join(PUBLIC, 'sw.js'), 'utf8');
  const shell = [...sw.match(/const SHELL = \[([\s\S]*?)\];/)[1].matchAll(/'([^']+)'/g)].map((m) => m[1]);
  for (const path of shell.filter((p) => p !== './')) {
    assert.ok(existsSync(join(PUBLIC, path)), `sw.js lists a missing file: ${path}`);
  }
  for (const file of listFiles(PUBLIC).filter((f) => f !== 'sw.js')) {
    assert.ok(shell.includes(file), `sw.js does not cache ${file}`);
  }
  assert.match(sw, /const CACHE = 'sightglass-v\d+';/);
});

test('no inline scripts or styles in the HTML', () => {
  const html = readFileSync(join(PUBLIC, 'index.html'), 'utf8');
  assert.ok(!/<script(?![^>]*\bsrc=)[^>]*>/.test(html), 'inline <script>');
  assert.ok(!/<style/.test(html), 'inline <style>');
  assert.ok(!/\son[a-z]+=/.test(html), 'inline event handler');
  assert.ok(!/\sstyle=/.test(html), 'inline style attribute');
});
