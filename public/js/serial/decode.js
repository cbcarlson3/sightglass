// Serial-number decoder. Reads a manufacture date from a serial using the rules in rules.js.
// It never guesses: if no rule fits cleanly, the result is "unknown" with a reason.

import { BRAND_FAMILIES } from './rules.js';

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

// Plain-English reasons, for the results screen.
export const UNKNOWN_REASONS = {
  'brand-not-supported': 'We don\'t have a date rule for this brand yet.',
  'rule-not-verified': 'This brand\'s date code isn\'t confirmed yet.',
  'no-serial': 'No serial number to read.',
  'no-matching-format': 'This serial doesn\'t match any known format for the brand.',
  'needs-equipment-type': 'This brand dates serials differently by equipment type, and the type is unknown.',
  'future-date': 'The serial would decode to a future date, so it doesn\'t match the rule.',
  'outside-format-era': 'The serial decodes to a date outside the years this format was used.',
  'ambiguous': 'The serial fits more than one format with different dates.',
};

// Lower case, letters and digits only: "A. O. Smith" -> "aosmith".
export function normalizeBrand(brand) {
  return String(brand ?? '').toLowerCase().replace(/[^a-z0-9]/g, '');
}

// Upper case, no spaces. Dots and dashes stay, since some formats print them.
export function normalizeSerial(serial) {
  return String(serial ?? '').toUpperCase().replace(/\s+/g, '');
}

export function findFamily(brand, families = BRAND_FAMILIES) {
  const key = normalizeBrand(brand);
  if (!key) return null;
  return families.find((family) => family.aliases.includes(key)) ?? null;
}

export function decodeSerial({ brand, serial, equipment } = {}, options = {}) {
  const today = options.today ?? new Date();
  const families = options.families ?? BRAND_FAMILIES;
  const cleanSerial = normalizeSerial(serial);
  const family = findFamily(brand, families);

  if (!family) return unknown('brand-not-supported', { serial: cleanSerial });
  const base = { serial: cleanSerial, familyId: family.id, familyName: family.name };
  if (!family.verified) return unknown('rule-not-verified', { ...base, notes: [family.unverifiedNote] });
  if (!cleanSerial) return unknown('no-serial', base);

  const decoded = [];
  const problems = new Set();
  for (const format of family.formats) {
    const match = new RegExp(format.pattern).exec(cleanSerial);
    if (!match) continue;
    if (format.equipment && !format.equipment.includes(equipment)) {
      problems.add(equipment ? 'no-matching-format' : 'needs-equipment-type');
      continue;
    }
    const result = readFormat(format, match, today);
    if (result.problem) problems.add(result.problem);
    else decoded.push(result);
  }

  if (decoded.length === 0) return unknown(pickProblem(problems), base);

  const first = decoded[0];
  const sameDate = decoded.every((d) => JSON.stringify(d.date) === JSON.stringify(first.date));
  if (!sameDate) return unknown('ambiguous', base);

  return {
    status: 'decoded',
    reason: null,
    ...base,
    formatId: first.format.id,
    date: first.date,
    precision: first.precision,
    label: makeLabel(first.date),
    notes: first.notes,
    source: first.format.source,
  };
}

// The most useful reason wins when several formats matched but none worked.
function pickProblem(problems) {
  for (const reason of ['future-date', 'outside-format-era', 'needs-equipment-type']) {
    if (problems.has(reason)) return reason;
  }
  return 'no-matching-format';
}

function unknown(reason, extra = {}) {
  return {
    status: 'unknown',
    reason,
    message: UNKNOWN_REASONS[reason],
    serial: '',
    familyId: null,
    familyName: null,
    formatId: null,
    date: null,
    precision: null,
    label: 'Unknown',
    notes: [],
    source: null,
    ...extra,
  };
}

function readFormat(format, match, today) {
  const notes = format.note ? [format.note] : [];
  const year = readField(format.year, match);
  if (year === null) return { problem: 'no-matching-format' };

  let month = null;
  if (format.month) {
    month = readField(format.month, match);
    if (month === null && format.month.as === 'letter' && format.unmappedMonthNote) {
      notes.push(format.unmappedMonthNote);
    } else if (month === null || month < 1 || month > 12) {
      return { problem: 'no-matching-format' };
    }
  }

  let week = null;
  if (format.week) {
    week = readField(format.week, match);
    if (week === null || week < 1 || week > 53) return { problem: 'no-matching-format' };
  }

  // A day only means something with its month. If the month letter was left out on purpose
  // (see unmappedMonthNote), the date stays at the year.
  let day = null;
  if (format.day && !(month === null && format.month)) {
    day = readField(format.day, match);
    const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();
    if (day === null || month === null || day < 1 || day > daysInMonth) {
      return { problem: 'no-matching-format' };
    }
  }

  const date = { year, month, week, day };
  const start = startOf(date);
  if (start > today) return { problem: 'future-date' };
  if (format.validFrom && endOf(date) < parseYearMonth(format.validFrom)) {
    return { problem: 'outside-format-era' };
  }
  if (format.validTo && start >= monthAfter(parseYearMonth(format.validTo))) {
    return { problem: 'outside-format-era' };
  }

  const precision = day ? 'day' : week ? 'week' : month ? 'month' : 'year';
  return { format, date, precision, notes };
}

function readField(spec, match) {
  const raw = match[spec.group];
  if (raw === undefined) return null;
  if (spec.as === 'number') return Number(raw);
  if (spec.as === 'letter') return spec.table[raw] ?? null;
  if (spec.as === 'yy') {
    const yy = Number(raw);
    if (spec.century !== undefined) return spec.century + yy;
    return yy >= spec.pivot ? 1900 + yy : 2000 + yy;
  }
  throw new Error(`Unknown field type: ${spec.as}`);
}

// First and last moments the decoded date could mean, in UTC.
function startOf({ year, month, week, day }) {
  if (week) return new Date(Date.UTC(year, 0, 1 + (week - 1) * 7));
  return new Date(Date.UTC(year, (month ?? 1) - 1, day ?? 1));
}

function endOf({ year, month, week, day }) {
  if (week) return new Date(Date.UTC(year, 0, 1 + week * 7) - 1);
  if (day) return new Date(Date.UTC(year, month - 1, day + 1) - 1);
  if (month) return new Date(Date.UTC(year, month, 1) - 1);
  return new Date(Date.UTC(year + 1, 0, 1) - 1);
}

function parseYearMonth(text) {
  const [year, month] = text.split('-').map(Number);
  return new Date(Date.UTC(year, month - 1, 1));
}

function monthAfter(date) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 1));
}

function makeLabel({ year, month, week, day }) {
  if (day) return `${MONTH_NAMES[month - 1]} ${day}, ${year}`;
  if (week) {
    const aboutMonth = startOf({ year, week }).getUTCMonth();
    return `Week ${week} of ${year} (about ${MONTH_NAMES[aboutMonth]})`;
  }
  if (month) return `${MONTH_NAMES[month - 1]} ${year}`;
  return String(year);
}
