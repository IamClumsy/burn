// Makes the game work offline once it has been opened. Pages are fetched fresh when you're online, so a new
// version shows up on the next launch; the built files (which have a version in their name) are kept for good.
const CACHE = "burned-v1";
const SHELL = ["/", "/favicon.svg", "/manifest.webmanifest", "/icon-192.png", "/icon-512.png", "/apple-touch-icon.png"];

self.addEventListener("install", event => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE);
    await cache.addAll(SHELL);
    // also keep the scripts, styles and pictures the page uses, so the very first offline launch works
    try {
      const html = await (await fetch("/", { cache: "no-store" })).text();
      const files = [...new Set([...html.matchAll(/(?:src|href)="(\/assets\/[^"]+)"/g)].map(m => m[1]))];
      await Promise.all(files.map(f => cache.add(f).catch(() => undefined)));
    } catch { /* offline during install: the cache fills as you play */ }
    self.skipWaiting();
  })());
});

self.addEventListener("activate", event => {
  event.waitUntil((async () => {
    for (const k of await caches.keys()) if (k !== CACHE) await caches.delete(k);
    await self.clients.claim();
  })());
});

self.addEventListener("fetch", event => {
  const req = event.request;
  if (req.method !== "GET" || new URL(req.url).origin !== location.origin) return;
  if (req.mode === "navigate") { // the page itself: newest if you're online, the saved copy if not
    event.respondWith((async () => {
      try {
        const res = await fetch(req);
        const cache = await caches.open(CACHE);
        cache.put("/", res.clone());
        return res;
      } catch {
        return (await caches.match("/")) || Response.error();
      }
    })());
    return;
  }
  event.respondWith((async () => { // everything else: the saved copy first, and keep anything new
    const hit = await caches.match(req);
    if (hit) return hit;
    try {
      const res = await fetch(req);
      if (res.ok) (await caches.open(CACHE)).put(req, res.clone());
      return res;
    } catch {
      return Response.error();
    }
  })());
});
