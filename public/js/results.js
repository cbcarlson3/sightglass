// Builds the results screen from a scan. Every value gets a trust label. Text from the scan is
// always set with textContent, never as HTML, because it will come from the AI.

import { EQUIPMENT_TYPES } from './equipment.js';
import { fieldsFor } from './plate-fields.js';
import { decodeSerial } from './serial/decode.js';
import { ageInYears } from './serial/age.js';
import { TRUST } from './trust.js';

// The age gauge runs 0 to GAUGE_MAX years; older units pin at the end.
export const GAUGE_MAX = 20;
const GAUGE = { cx: 150, cy: 150, r: 120 };

// Where a value sits on the half-circle gauge, `radius` from the center.
export function gaugePoint(value, radius) {
  const angle = Math.PI * (1 - Math.min(Math.max(value, 0), GAUGE_MAX) / GAUGE_MAX);
  return { x: round(GAUGE.cx + radius * Math.cos(angle)), y: round(GAUGE.cy - radius * Math.sin(angle)) };
}

const round = (n) => Math.round(n * 10) / 10;

// Fields shown in the heading instead of as tiles.
const HEADING_FIELDS = new Set(['brand', 'model']);

// A field's value if it was read off the tag or typed in by hand, otherwise ''.
const known = (field) => ((field?.status === 'read' || field?.status === 'typed') && field.value ? field.value : '');

// scan.source is 'manual' when the user typed the serial in. Then only the typed fields are
// shown, and there is no AI card, because no photo was read.
export function renderResults(container, scan, { today = new Date() } = {}) {
  const plate = scan.plate ?? {};
  const manual = scan.source === 'manual';
  const equipment = EQUIPMENT_TYPES.find((type) => type.id === scan.equipment);

  container.replaceChildren(
    heading(plate, equipment, manual),
    ageCard(plate, scan.equipment, today),
    tagSection(plate, scan.equipment, manual),
    manual
      ? el('p', { class: 'muted small center' }, 'Take a photo of the tag to also get specs, error codes and parts.')
      : suggestionCard(scan.errorCodes ?? [], scan.parts ?? []),
  );
}

function heading(plate, equipment, manual) {
  const brand = known(plate.brand);
  const model = known(plate.model);
  return el('div', { class: 'result-head' }, [
    el('p', { class: 'unit-type' }, equipment?.label ?? 'Equipment type unknown'),
    el('h2', { class: 'unit-brand' }, brand ? [brand, ' ', trustIcon(plate.brand.status)] : (manual ? 'Other brand' : 'Brand unreadable')),
    ...(manual && !plate.model ? [] : [el('p', { class: 'unit-model' }, model
      ? [model, trustIcon(plate.model.status)]
      : [el('span', { class: 'muted' }, 'Model unreadable')])]),
  ]);
}

function ageCard(plate, equipment, today) {
  const serial = known(plate.serial);
  const brand = known(plate.brand);
  const result = decodeSerial({ brand, serial, equipment }, { today });

  if (result.status !== 'decoded') {
    return el('section', { class: 'card age-card' }, [
      el('div', { class: 'card-head' }, [el('h2', {}, 'Age'), trustPill('unknown')]),
      el('p', { class: 'age-big' }, 'Unknown'),
      el('p', { class: 'age-note' }, result.message),
      ...result.notes.map((note) => el('p', { class: 'age-note' }, note)),
    ]);
  }

  const years = ageInYears(result.date, today);
  const about = result.precision === 'year';
  const big = years < 1
    ? [el('span', { class: 'age-unit' }, 'Less than a year old')]
    : [
      ...(about ? [el('span', { class: 'age-unit' }, 'About ')] : []),
      String(years),
      el('span', { class: 'age-unit' }, years === 1 ? ' year old' : ' years old'),
    ];
  return el('section', { class: 'card age-card' }, [
    el('div', { class: 'card-head' }, [el('h2', {}, 'Age'), trustPill('decoded')]),
    gauge(years),
    el('p', { class: 'age-big' }, big),
    el('p', { class: 'age-made' }, `Made ${result.label}`),
    ...result.notes.map((note) => el('p', { class: 'age-note' }, note)),
    el('p', { class: 'source' }, `Rule: ${result.source}`),
  ]);
}

function gauge(years) {
  const { cx, cy, r } = GAUGE;
  const end = gaugePoint(years, r);
  const needle = gaugePoint(years, r - 20);
  const parts = [svg('path', { class: 'gauge-track', d: `M${cx - r} ${cy} A${r} ${r} 0 0 1 ${cx + r} ${cy}` })];
  if (years > 0) {
    parts.push(svg('path', { class: 'gauge-fill', d: `M${cx - r} ${cy} A${r} ${r} 0 0 1 ${end.x} ${end.y}` }));
  }
  for (let mark = 0; mark <= GAUGE_MAX; mark += 5) {
    const outer = gaugePoint(mark, r);
    const inner = gaugePoint(mark, r - 16);
    const label = gaugePoint(mark, r - 34);
    parts.push(
      svg('line', { class: 'gauge-tick', x1: outer.x, y1: outer.y, x2: inner.x, y2: inner.y }),
      svg('text', { class: 'gauge-num', x: label.x, y: label.y }, mark === GAUGE_MAX ? `${mark}+` : String(mark)),
    );
  }
  parts.push(
    svg('line', { class: 'gauge-needle', x1: cx, y1: cy, x2: needle.x, y2: needle.y }),
    svg('circle', { class: 'gauge-hub', cx, cy, r: 11 }),
    svg('circle', { class: 'gauge-hub-dot', cx, cy, r: 4 }),
  );
  return svg('svg', {
    class: 'gauge', viewBox: '0 0 300 172', role: 'img',
    'aria-label': `Gauge showing ${years} years on a 0 to ${GAUGE_MAX} year scale`,
  }, parts);
}

function tagSection(plate, equipment, manual) {
  const fields = fieldsFor(equipment)
    .filter((field) => !HEADING_FIELDS.has(field.id))
    .filter((field) => !manual || plate[field.id]);
  const kinds = new Set();
  const tiles = fields.map((field) => {
    const reading = plate[field.id];
    const value = known(reading);
    if (value) kinds.add(reading.status);
    const wide = field.id === 'serial' || !value || String(value).length > 14;
    const classes = ['tile', wide && 'tile-wide', !value && 'tile-unreadable', `tile-${field.id}`];
    return el('div', { class: classes.filter(Boolean).join(' ') }, [
      el('div', {}, [el('dt', {}, field.label), el('dd', {}, value || TRUST.unreadable.text)]),
      ...(value ? [trustIcon(reading.status)] : []),
    ]);
  });
  return el('section', {}, [
    el('div', { class: 'section-head' }, [
      el('h2', {}, manual ? 'What you typed' : 'From the tag'),
      el('span', { class: 'legend' }, [...kinds].map((kind) => el('span', { class: `legend-item tone-${TRUST[kind].tone}` }, [
        icon(TRUST[kind].icon, 13), `= ${TRUST[kind].text.toLowerCase()}`,
      ]))),
    ]),
    el('dl', { class: 'tiles' }, tiles),
  ]);
}

function suggestionCard(errorCodes, parts) {
  return el('section', { class: 'card ai-card' }, [
    trustPill('ai'),
    el('h3', {}, 'Error codes'),
    errorCodes.length
      ? el('ul', { class: 'items' }, errorCodes.map((item) => el('li', {}, [
        el('p', { class: 'item-title' }, item.code),
        el('p', { class: 'item-text' }, item.meaning),
        el('p', { class: 'item-text' }, `Fix: ${item.fix}`),
      ])))
      : el('p', { class: 'muted' }, 'None found.'),
    el('div', { class: 'divider' }),
    el('h3', {}, 'Common parts'),
    parts.length
      ? el('ul', { class: 'items' }, parts.map((item) => el('li', { class: 'part' }, [
        el('span', {}, item.name),
        el('span', { class: 'part-number' }, item.partNumber),
      ])))
      : el('p', { class: 'muted' }, 'None found.'),
  ]);
}

function trustPill(kind) {
  const trust = TRUST[kind];
  return el('span', { class: `pill pill-${trust.tone}` }, [icon(trust.icon, 13), trust.text]);
}

// A small icon that stands for a trust label; screen readers hear the label.
function trustIcon(kind) {
  const node = icon(TRUST[kind].icon, 16);
  node.classList.add(`tone-${TRUST[kind].tone}`);
  node.setAttribute('role', 'img');
  node.setAttribute('aria-label', TRUST[kind].text);
  node.removeAttribute('aria-hidden');
  return node;
}

const ICONS = {
  check: ['M5 12l4 4 10-10'],
  pencil: ['M4 20h4L19 9l-4-4L4 16z', 'M13.5 6.5l4 4'],
  alert: ['M12 3l10 18H2z', 'M12 10v5', 'M12 18v.01'],
  question: ['M9.5 9a2.5 2.5 0 1 1 3.5 2.3c-.7.3-1 .9-1 1.7v.5', 'M12 17.5v.01'],
};

function icon(name, size) {
  return svg('svg', { class: 'ico', width: size, height: size, viewBox: '0 0 24 24', 'aria-hidden': 'true' },
    ICONS[name].map((d) => svg('path', { d })));
}

function el(tag, attrs = {}, children = []) {
  const node = document.createElement(tag);
  for (const [name, value] of Object.entries(attrs)) node.setAttribute(name, value);
  node.append(...[].concat(children));
  return node;
}

function svg(tag, attrs = {}, children = []) {
  const node = document.createElementNS('http://www.w3.org/2000/svg', tag);
  for (const [name, value] of Object.entries(attrs)) node.setAttribute(name, value);
  node.append(...[].concat(children));
  return node;
}
