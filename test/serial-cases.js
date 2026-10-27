// Test cases for the serial decoder.
//
// `from` says where each case came from:
//   'manufacturer'  an example printed in the manufacturer's own document (see rules.js)
//   'plate'         a real data plate Chris photographed. The expected date is the one printed on
//                   the plate (or confirmed with the manufacturer). No photos, addresses or
//                   customer details go in this public repo, only brand, serial and date.
//   'guard'         a made-up serial that must come back "unknown"
//
// expect: { year, month, week, day } for decoded serials, or { unknown: '<reason>' }.

export const TODAY = new Date('2026-10-27T12:00:00Z');

export const CASES = [
  // Rheem / Ruud / Richmond, bulletin 1207
  { from: 'manufacturer', brand: 'Rheem', serial: '0912D01234', expect: { year: 2012, month: 9 } },
  { from: 'manufacturer', brand: 'Rheem', serial: '1209D01234', expect: { year: 2009, month: 12 } },
  { from: 'manufacturer', brand: 'Ruud', serial: 'M141209135', expect: { year: 2012, week: 14 } },
  { from: 'manufacturer', brand: 'Richmond', serial: 'Q231299996', expect: { year: 2012, week: 23 } },
  { from: 'manufacturer', brand: 'Rheem', serial: 'Q231299996A', expect: { year: 2012, week: 23 } },
  { from: 'guard', brand: 'Rheem', serial: '1309D01234', expect: { unknown: 'no-matching-format' } },
  { from: 'guard', brand: 'Rheem', serial: '0798D01234', expect: { unknown: 'future-date' } },
  { from: 'guard', brand: 'Rheem', serial: 'M140809135', expect: { unknown: 'outside-format-era' } },

  // A.O. Smith / State / American / Reliance, 2024 service guide
  { from: 'manufacturer', brand: 'A.O. Smith', serial: '1719106145074', expect: { year: 2017, week: 19 } },
  { from: 'manufacturer', brand: 'State', serial: '1142N012345', expect: { year: 2011, week: 42 } },
  { from: 'guard', brand: 'American', serial: '1760106145074', expect: { unknown: 'no-matching-format' } },
  { from: 'guard', brand: 'A. O. Smith', serial: '2952106145074', expect: { unknown: 'future-date' } },
  // American Standard heaters are made by Bradford White, not A.O. Smith's American brand.
  { from: 'guard', brand: 'American Standard', serial: '1719106145074', expect: { unknown: 'brand-not-supported' } },

  // Lochinvar, warranty sheet Rev 18
  { from: 'manufacturer', brand: 'Lochinvar', serial: '1142N012345', expect: { year: 2011, week: 42 } },
  { from: 'manufacturer', brand: 'Lochinvar', serial: 'KJ-1000130', expect: { year: 1993, month: 9 } },
  { from: 'manufacturer', brand: 'Lochinvar', serial: 'A07H00123456', expect: { year: 2007, month: 1 } },
  { from: 'manufacturer', brand: 'Lochinvar', serial: 'J930012', expect: { year: 1993, month: 10 } },
  // The sheet disagrees with itself on E and F, so only the year is given.
  { from: 'manufacturer', brand: 'Lochinvar', serial: 'E07H00123456', expect: { year: 2007 } },
  { from: 'manufacturer', brand: 'Lochinvar', serial: '1615001213456', equipment: 'boiler', expect: { year: 2015, week: 16 } },
  // A 13-digit Lochinvar serial reads differently for boilers, so without the equipment type
  // (or for a tank heater) the answer must be unknown.
  { from: 'guard', brand: 'Lochinvar', serial: '1615001213456', expect: { unknown: 'needs-equipment-type' } },
  { from: 'guard', brand: 'Lochinvar', serial: '1615001213456', equipment: 'tank_water_heater', expect: { unknown: 'no-matching-format' } },
  { from: 'guard', brand: 'Lochinvar', serial: 'A17H00123456', expect: { unknown: 'outside-format-era' } },

  // Rinnai, service manual page 111
  { from: 'manufacturer', brand: 'Rinnai', serial: 'BH.AB-000123', expect: { year: 2010, month: 8 } },
  { from: 'manufacturer', brand: 'Rinnai', serial: 'BHAB000123', expect: { year: 2010, month: 8 } },
  { from: 'manufacturer', brand: 'Rinnai', serial: '03.06-001000', expect: { year: 2003, month: 6 } },
  { from: 'guard', brand: 'Rinnai', serial: 'BI.AB-000123', expect: { unknown: 'no-matching-format' } },
  { from: 'guard', brand: 'Rinnai', serial: 'XA.AB-000123', expect: { unknown: 'future-date' } },
  { from: 'guard', brand: 'Rinnai', serial: '12.06-001000', expect: { unknown: 'outside-format-era' } },

  // Navien: no published rule yet
  { from: 'guard', brand: 'Navien', serial: '7414C14X1771143', expect: { unknown: 'rule-not-verified' } },

  // General guards
  { from: 'guard', brand: 'Bradford White', serial: 'XA1234567', expect: { unknown: 'brand-not-supported' } },
  { from: 'guard', brand: '', serial: '0912D01234', expect: { unknown: 'brand-not-supported' } },
  { from: 'guard', brand: 'Rheem', serial: '', expect: { unknown: 'no-serial' } },
  { from: 'guard', brand: 'Rheem', serial: 'unreadable', expect: { unknown: 'no-matching-format' } },
];
