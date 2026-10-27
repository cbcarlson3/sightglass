// App start-up: wires the buttons, switches between the home and results screens.

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
  show('results');
}

function newScan() {
  $('result-photo').hidden = true;
  $('photo-info').hidden = true;
  show('home');
}

$('take-photo').addEventListener('click', () => $('camera-input').click());
$('pick-photo').addEventListener('click', () => $('gallery-input').click());
$('camera-input').addEventListener('change', onPhotoChosen);
$('gallery-input').addEventListener('change', onPhotoChosen);
$('show-sample').addEventListener('click', showSample);
$('new-scan').addEventListener('click', newScan);
$('back').addEventListener('click', newScan);

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('sw.js').catch((error) => console.warn('Offline mode off:', error));
}
