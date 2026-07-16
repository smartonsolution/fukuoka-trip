/* 후쿠오카 여행 오프라인 서비스워커 */
const CACHE = 'fk-trip-v1';
const SHELL = ['./', './index.html', './manifest.json', './icon.svg'];

self.addEventListener('install', (e) => {
  self.skipWaiting();
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)).catch(() => {}));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((ks) => Promise.all(ks.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;

  // HTML(페이지): 네트워크 우선 → 실패 시 캐시(오프라인)
  if (req.mode === 'navigate') {
    e.respondWith(
      fetch(req)
        .then((res) => { const cp = res.clone(); caches.open(CACHE).then((c) => c.put('./index.html', cp)); return res; })
        .catch(() => caches.match('./index.html').then((r) => r || caches.match('./')))
    );
    return;
  }

  // 그 외(폰트·SDK 등): 캐시 우선 → 없으면 네트워크 후 캐시
  e.respondWith(
    caches.match(req).then((cached) => cached || fetch(req).then((res) => {
      try { const cp = res.clone(); caches.open(CACHE).then((c) => c.put(req, cp)); } catch (_) {}
      return res;
    }).catch(() => cached))
  );
});
