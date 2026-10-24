/* Matura Quest service worker.
 * Precaches the built app shell so lessons, flashcards and practice work offline.
 * Fonts are cached on first use. Nothing private is cached: progress lives in localStorage.
 * The version string and the asset list below are injected by scripts/build.ts. */
const VERSION = '__VERSION__';
const CACHE = `mq-${VERSION}`;
const ASSETS = __ASSETS__;
// Recordings are cached on first play in their own cache that survives app updates
// (file names contain the script hash, so a changed script means a new file).
const AUDIO_CACHE = 'mq-audio-v1';

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE).then((c) => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k.startsWith('mq-') && k !== CACHE && k !== AUDIO_CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  // Navigation: network first, fall back to the cached shell (hash routing means one HTML file).
  if (req.mode === 'navigate') {
    event.respondWith(fetch(req).catch(() => caches.match('./index.html')));
    return;
  }
  if (url.origin === location.origin && url.pathname.includes('/audio/')) {
    event.respondWith(audioResponse(req));
    return;
  }
  const isFont = url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com';
  if (url.origin === location.origin || isFont) {
    event.respondWith(
      caches.match(req).then((hit) => hit || fetch(req).then((res) => {
        if (res.ok && (isFont || url.origin === location.origin)) {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(req, copy));
        }
        return res;
      })),
    );
  }
});

/** Serves recordings from the cache, answering Range requests with 206 (required by iOS Safari). */
async function audioResponse(req) {
  const cache = await caches.open(AUDIO_CACHE);
  const key = req.url.split('#')[0];
  let res = await cache.match(key);
  if (!res) {
    try {
      const net = await fetch(key);
      if (!net.ok) return net;
      await cache.put(key, net.clone());
      res = net;
    } catch {
      return fetch(req);
    }
  }
  const range = req.headers.get('range');
  if (!range) return res;
  const buf = await res.arrayBuffer();
  const size = buf.byteLength;
  const m = /bytes=(\d*)-(\d*)/.exec(range);
  let start = 0;
  let end = size - 1;
  if (m && m[1]) { start = Number(m[1]); if (m[2]) end = Number(m[2]); }
  else if (m && m[2]) start = Math.max(0, size - Number(m[2]));
  end = Math.min(end, size - 1);
  if (start > end) return new Response(null, { status: 416, headers: { 'Content-Range': `bytes */${size}` } });
  return new Response(buf.slice(start, end + 1), {
    status: 206,
    headers: {
      'Content-Type': res.headers.get('Content-Type') || 'audio/mpeg',
      'Content-Range': `bytes ${start}-${end}/${size}`,
      'Content-Length': String(end - start + 1),
      'Accept-Ranges': 'bytes',
    },
  });
}
