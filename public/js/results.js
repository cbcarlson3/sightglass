// Builds the results screen from a scan. Every value gets a trust label. Text from the scan is
// always set with textContent, never as HTML, because it will come from the AI.

import { EQUIPMENT_TYPES } from './equipment.js';
import { fieldsFor } from './plate-fields.js';
import { decodeSerial } from './serial/decode.js';
import { ageLabel } from './serial/age.js';
import { TRUST } from './trust.js';

export function renderResults(container, scan, { today = new Date() } = {}) {
  const plate = scan.plate ?? {};
  const equipment = EQUIPMENT_TYPES.find((type) => type.id === scan.equipment);
  const title = [plate.brand, plate.model]
    .filter((field) => field?.status === 'read').map((field) => field.value).join(' ');

  container.replaceChildren(
    el('div', { class: 'result-head' }, [
      el('h2', {}, title || 'Unreadable plate'),
      el('p', { class: 'muted' }, equipment?.label ?? 'Equipment type unknown'),
    ]),
    ageCard(plate, scan.equipment, today),
    plateCard(plate, scan.equipment),
    suggestionCard('Error codes', scan.errorCodes ?? [], (item) => [
      el('p', { class: 'item-title' }, item.code),
      el('p', {}, item.meaning),
      el('p', { class: 'muted' }, `Fix: ${item.fix}`),
    ]),
    suggestionCard('Common parts', scan.parts ?? [], (item) => [
      el('p', { class: 'item-title' }, item.name),
      el('p', { class: 'muted' }, `Part # ${item.partNumber}`),
    ]),
  );
}

function ageCard(plate, equipment, today) {
  const serial = plate.serial?.status === 'read' ? plate.serial.value : '';
  const brand = plate.brand?.status === 'read' ? plate.brand.value : '';
  const result = decodeSerial({ brand, serial, equipment }, { today });

  if (result.status !== 'decoded') {
    return el('section', { class: 'card' }, [
      el('h3', {}, 'Age'),
      el('p', { class: 'big' }, 'Unknown'),
      trustChip('unknown'),
      el('p', { class: 'muted' }, result.message),
      ...result.notes.map((note) => el('p', { class: 'muted' }, note)),
    ]);
  }
  return el('section', { class: 'card' }, [
    el('h3', {}, 'Age'),
    el('p', { class: 'big' }, ageLabel(result.date, result.precision, today)),
    el('p', {}, `Made ${result.label}`),
    trustChip('decoded'),
    ...result.notes.map((note) => el('p', { class: 'muted' }, note)),
    el('p', { class: 'source' }, `Rule: ${result.source}`),
  ]);
}

function plateCard(plate, equipment) {
  const rows = fieldsFor(equipment).map((field) => {
    const reading = plate[field.id];
    const readable = reading?.status === 'read' && reading.value;
    return el('div', { class: 'row' }, [
      el('dt', {}, field.label),
      el('dd', {}, readable
        ? [el('span', { class: 'value' }, reading.value), trustChip('read')]
        : [trustChip('unreadable')]),
    ]);
  });
  return el('section', { class: 'card' }, [el('h3', {}, 'From the plate'), el('dl', {}, rows)]);
}

function suggestionCard(heading, items, renderItem) {
  return el('section', { class: 'card' }, [
    el('h3', {}, heading),
    trustChip('ai'),
    items.length
      ? el('ul', { class: 'items' }, items.map((item) => el('li', {}, renderItem(item))))
      : el('p', { class: 'muted' }, 'None found.'),
  ]);
}

function trustChip(kind) {
  const trust = TRUST[kind];
  return el('span', { class: `chip chip-${trust.tone}` }, `${trust.icon} ${trust.text}`);
}

function el(tag, attrs = {}, children = []) {
  const node = document.createElement(tag);
  for (const [name, value] of Object.entries(attrs)) node.setAttribute(name, value);
  node.append(...[].concat(children));
  return node;
}
