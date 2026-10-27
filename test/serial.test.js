import { test } from 'node:test';
import assert from 'node:assert/strict';
import { decodeSerial } from '../public/js/serial/decode.js';
import { BRAND_FAMILIES } from '../public/js/serial/rules.js';
import { CASES, TODAY } from './serial-cases.js';

for (const c of CASES) {
  const name = `${c.from}: ${c.brand || '(no brand)'} ${c.serial || '(no serial)'}` +
    (c.equipment ? ` [${c.equipment}]` : '');

  test(name, () => {
    const result = decodeSerial(c, { today: TODAY });
    if (c.expect.unknown) {
      assert.equal(result.status, 'unknown');
      assert.equal(result.reason, c.expect.unknown);
      assert.equal(result.date, null);
      return;
    }
    assert.equal(result.status, 'decoded', `expected a date, got: ${result.reason}`);
    assert.deepEqual(result.date, {
      year: c.expect.year,
      month: c.expect.month ?? null,
      week: c.expect.week ?? null,
      day: c.expect.day ?? null,
    });
    assert.ok(result.source, 'every decoded date names its source');
  });
}

test('labels read plainly', () => {
  const label = (serial, brand, equipment) =>
    decodeSerial({ brand, serial, equipment }, { today: TODAY }).label;
  assert.equal(label('0912D01234', 'Rheem'), 'September 2012');
  assert.equal(label('1719106145074', 'A.O. Smith'), 'Week 19 of 2017 (about May)');
  assert.equal(label('E07H00123456', 'Lochinvar'), '2007');
});

test('spaces and lower case are cleaned up', () => {
  const result = decodeSerial({ brand: 'rheem', serial: ' 09 12 d 01234 ' }, { today: TODAY });
  assert.equal(result.status, 'decoded');
  assert.equal(result.serial, '0912D01234');
});

test('every verified family has formats, and every format cites a source', () => {
  for (const family of BRAND_FAMILIES) {
    if (family.verified) assert.ok(family.formats.length > 0, family.id);
    for (const format of family.formats) {
      assert.ok(format.source, `${format.id} needs a source`);
      assert.doesNotThrow(() => new RegExp(format.pattern), format.id);
    }
  }
});

test('no brand alias is claimed by two families', () => {
  const seen = new Map();
  for (const family of BRAND_FAMILIES) {
    for (const alias of family.aliases) {
      assert.ok(!seen.has(alias), `${alias} is in both ${seen.get(alias)} and ${family.id}`);
      seen.set(alias, family.id);
    }
  }
});

test('every format is proven by at least one non-guard test case', () => {
  const proven = new Set(CASES.filter((c) => c.from !== 'guard')
    .map((c) => decodeSerial(c, { today: TODAY }).formatId));
  for (const family of BRAND_FAMILIES) {
    for (const format of family.formats) assert.ok(proven.has(format.id), `${format.id} has no test`);
  }
});
