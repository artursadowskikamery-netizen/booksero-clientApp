// Apple App Site Association (AASA) dla powłoki iOS z App Store — dowód dla
// iPhone'a, że domena i aplikacja to jedno. Dzięki niemu link do aplikacji
// (SMS, kod QR zeskanowany aparatem, wizytówka) otwiera od razu zainstalowaną
// aplikację na właściwym adresie, zamiast Safari. Odpowiednik assetlinks.json
// z Androida. Trasa nie patrzy na host, więc ten sam plik serwują booktago.app
// i app.booksero.com — oba są w Entitlements.plist (applinks/webcredentials).
//
// Identyfikator = Team ID konta Apple (VIVI ESTETIC SP. Z O.O.) + bundle id.
// Bundle id com.booksero.app zostaje mimo rebrandingu (decyzja 2026-10-19).
// Apple pobiera plik przez własny CDN (iOS 14+), więc zmiana dociera do
// telefonów z opóźnieniem do ok. doby; plik musi być JSON-em bez
// przekierowań, pod dokładnie tą ścieżką i bez rozszerzenia.
const APP_ID = "9WBP3PU6FA.com.booksero.app";

// Ścieżki, które NIE otwierają aplikacji: API, pliki techniczne i polityka
// prywatności (ta ma się otwierać w przeglądarce, np. z karty sklepu).
const WYKLUCZONE = ["/api/*", "/.well-known/*", "/privacy", "/polityka-prywatnosci"];

export const APPLE_APP_SITE_ASSOCIATION = {
  applinks: {
    // iOS < 13 czyta "apps" + "paths", nowsze "appIDs" + "components".
    apps: [],
    details: [
      {
        appIDs: [APP_ID],
        components: [
          ...WYKLUCZONE.map((p) => ({ "/": p, exclude: true })),
          { "/": "/*" },
        ],
        appID: APP_ID,
        paths: [...WYKLUCZONE.map((p) => `NOT ${p}`), "*"],
      },
    ],
  },
  webcredentials: {
    apps: [APP_ID],
  },
};
