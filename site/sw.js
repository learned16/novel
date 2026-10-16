
const CACHE = 'novel-2bb26402b0961e58';
const FILES = ["/","/style.css","/manifest.webmanifest","/icon-192.png","/icon-512.png","/fonts/NotoNaskhArabic-arabic.woff2","/fonts/NotoNaskhArabic-latin.woff2","/fonts/ReemKufi-arabic.woff2","/fonts/ReemKufi-latin.woff2","/c/001","/c/002","/c/003","/c/004","/c/005","/c/006","/c/007","/c/008","/c/009","/c/010","/c/011","/c/012","/c/013","/c/014","/c/015","/c/016","/c/017","/c/018","/c/019","/c/020","/c/021","/c/022","/c/023","/c/024","/c/025","/c/026","/c/027","/c/028","/c/029","/c/030","/c/031","/c/032","/c/033","/c/034","/c/035","/c/036","/c/037","/c/038","/c/039","/c/040","/c/041","/c/042","/c/043","/c/044","/c/045","/c/046","/c/047","/c/048","/c/049","/c/050"];
self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(FILES)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key => key.startsWith('novel-') && key !== CACHE).map(key => caches.delete(key)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  if (event.request.method !== 'GET' || url.origin !== self.location.origin) return;
  const key = url.pathname === '/index.html' ? '/' : url.pathname.replace(/\.html$/, '').replace(/\/$/, '') || '/';
  if (!FILES.includes(key)) return;
  event.respondWith((async () => {
    const cache = await caches.open(CACHE);
    try {
      const response = await fetch(event.request);
      if (response.ok && !response.redirected) {
        const copy = response.clone();
        event.waitUntil(cache.put(key, copy));
        return response;
      }
      return (await cache.match(key)) || response;
    } catch (error) {
      return (await cache.match(key)) || new Response('هذا الفصل غير محفوظ بعد. اتصل بالإنترنت ثم أعد فتحه.', {status: 503, headers: {'Content-Type':'text/plain; charset=utf-8'}});
    }
  })());
});
