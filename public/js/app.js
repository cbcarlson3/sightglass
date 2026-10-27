// App start-up: wires the buttons, switches between the home and results screens.

import { EQUIPMENT_TYPES } from './equipment.js';
import { brandChoices, manualScan, OTHER_BRAND } from './manual.js';
import { formatBytes, preparePhoto } from './photo.js';
import { renderResults } from './results.js';
import { SAMPLE_SCAN } from './sample-scan.js';

const $ = (id) => document.getElementById(id);
let photoUrl = null;

function show(viewId) {
  for (const view of document.querySelectorAll('.view')) view.hidden = view.id !== viewId;
  window.scrollTo(0, 0);
}

function setStatus(text, isError = false) {
  const status = $('photo-status');
  status.textContent = text;
  status.classList.toggle('error', isError);
  status.hidden = !text;
}

async function onPhotoChosen(event) {
  const file = event.target.files?.[0];
  event.target.value = '';
  if (!file) return;

  setStatus('Getting photo ready…');
  try {
    const photo = await preparePhoto(file);
    if (photoUrl) URL.revokeObjectURL(photoUrl);
    photoUrl = URL.createObjectURL(photo.blob);
    $('result-photo').src = photoUrl;
    $('result-photo').hidden = false;
    $('photo-info').textContent =
      `Photo shrunk from ${formatBytes(photo.originalBytes)} to ${formatBytes(photo.bytes)} ` +
      `(${photo.width} × ${photo.height}). Location and camera data removed.`;
    $('photo-info').hidden = false;
    setStatus('');
    showSample();
  } catch (error) {
    console.error(error);
    setStatus('Could not open that photo. Try another one.', true);
  }
}

function showSample() {
  renderResults($('result-body'), SAMPLE_SCAN);
  $('sample-pill').hidden = false;
  show('results');
}

function newScan() {
  $('result-photo').hidden = true;
  $('photo-info').hidden = true;
  show('home');
}

// The brand and equipment lists come from the decoder's data, so a new brand shows up here too.
function fillManualForm() {
  const options = (select, items) => select.append(...items.map(([value, text]) => {
    const option = document.createElement('option');
    option.value = value;
    option.textContent = text;
    return option;
  }));
  options($('manual-brand'), [...brandChoices().map((name) => [name, name]), [OTHER_BRAND, 'Other (not listed)']]);
  options($('manual-equipment'), EQUIPMENT_TYPES.map((type) => [type.id, type.label]));
}

function onManualSubmit(event) {
  event.preventDefault();
  const brand = $('manual-brand').value;
  const serial = $('manual-serial').value.trim();
  const problem = !brand ? 'Choose a brand.' : !serial ? 'Type in the serial number.' : '';
  $('manual-error').textContent = problem;
  $('manual-error').hidden = !problem;
  if (problem) return;

  renderResults($('result-body'), manualScan({ brand, serial, equipment: $('manual-equipment').value }));
  $('sample-pill').hidden = true;
  $('result-photo').hidden = true;
  $('photo-info').hidden = true;
  show('results');
}

fillManualForm();
$('take-photo').addEventListener('click', () => $('camera-input').click());
$('pick-photo').addEventListener('click', () => $('gallery-input').click());
$('type-serial').addEventListener('click', () => show('manual'));
$('camera-input').addEventListener('change', onPhotoChosen);
$('gallery-input').addEventListener('change', onPhotoChosen);
$('show-sample').addEventListener('click', showSample);
$('new-scan').addEventListener('click', newScan);
$('back').addEventListener('click', newScan);
$('manual-back').addEventListener('click', () => show('home'));
$('manual-form').addEventListener('submit', onManualSubmit);

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('sw.js').catch((error) => console.warn('Offline mode off:', error));
}
