// Age of a unit from its decoded manufacture date (see decode.js).

const YEAR_MS = 365.2425 * 24 * 60 * 60 * 1000;

// Whole years from the start of the decoded period to today.
export function ageInYears({ year, month, week, day }, today = new Date()) {
  const start = week
    ? Date.UTC(year, 0, 1 + (week - 1) * 7)
    : Date.UTC(year, (month ?? 1) - 1, day ?? 1);
  return Math.max(0, Math.floor((today.getTime() - start) / YEAR_MS));
}

// "14 years old". Year-only dates could be a year off, so they say "About".
export function ageLabel(date, precision, today = new Date()) {
  const years = ageInYears(date, today);
  if (years < 1) return 'Less than a year old';
  const text = `${years} ${years === 1 ? 'year' : 'years'} old`;
  return precision === 'year' ? `About ${text}` : text;
}
