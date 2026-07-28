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
      icon: "/icon-192.png",
      badge: "/icon-192.png",
      data: { url: data.url || "/" },
      // Dźwiękiem rządzi SYSTEM (kanał powiadomień telefonu) — strony nie mogą
      // podkładać własnych dźwięków. My prosimy o wibrację i jawnie NIE-ciche.
      silent: false,
      vibrate: [200, 100, 200],
    }),
  );
  // Plakietka na ikonie aplikacji (gdzie system wspiera Badging API) — push
  // przy zamkniętej aplikacji też ją zapala; dokładną liczbę ustawi aplikacja
  // przy otwarciu (unread-count).
  if (self.navigator && "setAppBadge" in self.navigator) {
    event.waitUntil(self.navigator.setAppBadge().catch(() => {}));
  }
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
