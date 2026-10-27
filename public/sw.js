// Service worker: keeps the app shell on the phone so it opens with no signal.
// Bump CACHE on every change that should reach the phone (see CLAUDE.md).

const CACHE = 'sightglass-v1';

const SHELL = [
  './',
  'index.html',
  'manifest.webmanifest',
  'css/app.css',
  'js/app.js',
  'js/equipment.js',
  'js/photo.js',
  'js/plate-fields.js',
  'js/results.js',
  'js/sample-scan.js',
  'js/trust.js',
  'js/serial/age.js',
  'js/serial/decode.js',
  'js/serial/rules.js',
  'icons/apple-touch-icon.png',
  'icons/icon-192.png',
  'icons/icon-512.png',
  'icons/icon-maskable-512.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key))))
      .then(() => self.clients.claim()),
  );
});

// Cache first for the app's own files. Anything else (the API, later) goes to the network.
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  if (event.request.method !== 'GET' || url.origin !== self.location.origin) return;
  event.respondWith(
    caches.match(event.request, { ignoreSearch: true }).then((cached) => cached ?? fetch(event.request)),
  );
});
