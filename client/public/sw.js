// Minimalny service worker BookSero — wymagany do instalacji PWA.
// Przepuszcza ruch do sieci (bez cache) — offline dodamy w kolejnym etapie.
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (e) => e.waitUntil(self.clients.claim()));
self.addEventListener("fetch", (e) => {
  e.respondWith(fetch(e.request));
});
