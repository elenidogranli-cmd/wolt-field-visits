const CACHE_NAME = 'wfv-cache-v5';
const ASSETS = [
  './','./index.html','./app.js','./manifest.json',
  './icons/icon-192.png','./icons/icon-512.png',
  'https://cdn.tailwindcss.com',
  'https://unpkg.com/react@18/umd/react.development.js',
  'https://unpkg.com/react-dom@18/umd/react-dom.development.js',
  'https://unpkg.com/@babel/standalone/babel.min.js',
];
self.addEventListener('install', e=>{e.waitUntil(caches.open(CACHE_NAME).then(c=>c.addAll(ASSETS))); self.skipWaiting();});
self.addEventListener('activate', e=>{e.waitUntil(caches.keys().then(keys=>Promise.all(keys.map(k=>k!==CACHE_NAME&&caches.delete(k))))); self.clients.claim();});
self.addEventListener('fetch', e=>{e.respondWith(caches.match(e.request).then(c=>c||fetch(e.request).then(r=>{const copy=r.clone(); caches.open(CACHE_NAME).then(cache=>cache.put(e.request, copy)); return r;}).catch(()=>c)));});
