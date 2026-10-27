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

export function renderResults(container, scan, { today = new Date() } = {}) {
  const plate = scan.plate ?? {};
  const equipment = EQUIPMENT_TYPES.find((type) => type.id === scan.equipment);

  container.replaceChildren(
    heading(plate, equipment),
    ageCard(plate, scan.equipment, today),
    tagSection(plate, scan.equipment),
    suggestionCard(scan.errorCodes ?? [], scan.parts ?? []),
  );
}

function heading(plate, equipment) {
  const read = (field) => (field?.status === 'read' && field.value ? field.value : '');
  const brand = read(plate.brand);
  const model = read(plate.model);
  return el('div', { class: 'result-head' }, [
    el('p', { class: 'unit-type' }, equipment?.label ?? 'Equipment type unknown'),
    el('h2', { class: 'unit-brand' }, brand || 'Brand unreadable'),
    el('p', { class: 'unit-model' }, model
      ? [model, trustIcon('read')]
      : [el('span', { class: 'muted' }, 'Model unreadable')]),
  ]);
}

function ageCard(plate, equipment, today) {
  const serial = plate.serial?.status === 'read' ? plate.serial.value : '';
  const brand = plate.brand?.status === 'read' ? plate.brand.value : '';
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

function tagSection(plate, equipment) {
  const tiles = fieldsFor(equipment).filter((field) => !HEADING_FIELDS.has(field.id)).map((field) => {
    const reading = plate[field.id];
    const readable = reading?.status === 'read' && reading.value;
    const wide = field.id === 'serial' || !readable || String(reading.value).length > 14;
    const classes = ['tile', wide && 'tile-wide', !readable && 'tile-unreadable', `tile-${field.id}`];
    return el('div', { class: classes.filter(Boolean).join(' ') }, [
      el('div', {}, [el('dt', {}, field.label), el('dd', {}, readable ? reading.value : TRUST.unreadable.text)]),
      ...(readable ? [trustIcon('read')] : []),
    ]);
  });
  return el('section', {}, [
    el('div', { class: 'section-head' }, [
      el('h2', {}, 'From the tag'),
      el('span', { class: 'legend' }, [icon('check', 13), `= ${TRUST.read.text.toLowerCase()}`]),
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
  node.setAttribute('role', 'img');
  node.setAttribute('aria-label', TRUST[kind].text);
  node.removeAttribute('aria-hidden');
  return node;
}

const ICONS = {
  check: ['M5 12l4 4 10-10'],
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
