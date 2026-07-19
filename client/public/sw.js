// Service worker BookSero — wymagany do instalacji PWA + obsługa Web Push.
// Ruch sieciowy przepuszczamy bez cache (offline w kolejnym etapie).
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (e) => e.waitUntil(self.clients.claim()));
self.addEventListener("fetch", (e) => {
  e.respondWith(fetch(e.request));
});

// Push z serwera Booksero: payload JSON { title, body, url, kind }.
// Treść i język ogarnia serwer — my tylko wyświetlamy, co przyszło.
self.addEventListener("push", (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch {
    /* payload nie-JSON — pokażemy sam tytuł domyślny */
  }
  const title = data.title || "BookSero";
  event.waitUntil(
    self.registration.showNotification(title, {
      body: data.body || "",
      icon: "/icon.svg",
      badge: "/icon.svg",
      data: { url: data.url || "/" },
    }),
  );
});

// Klik w powiadomienie: sfokusuj otwartą aplikację (i przejdź pod url)
// albo otwórz nowe okno.
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = (event.notification.data && event.notification.data.url) || "/";
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((list) => {
      for (const c of list) {
        if ("focus" in c) {
          if ("navigate" in c) c.navigate(url);
          return c.focus();
        }
      }
      return self.clients.openWindow(url);
    }),
  );
});
