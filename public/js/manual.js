// The "Type in serial" form: its brand choices, and turning the answers into a scan that the
// results screen can show. Typed values get the "typed" trust label, never "read".

import { BRAND_FAMILIES } from './serial/rules.js';

export const OTHER_BRAND = 'other';

// Every brand name the decoder has a rule for, A to Z ("Rheem / Ruud / Richmond" gives three).
export function brandChoices(families = BRAND_FAMILIES) {
  return families
    .filter((family) => family.verified)
    .flatMap((family) => family.name.split(' / '))
    .sort((a, b) => a.localeCompare(b));
}

export function manualScan({ brand, equipment, serial }) {
  const plate = { serial: { value: String(serial).trim().toUpperCase(), status: 'typed' } };
  if (brand && brand !== OTHER_BRAND) plate.brand = { value: brand, status: 'typed' };
  return { source: 'manual', equipment: equipment || null, plate };
}
