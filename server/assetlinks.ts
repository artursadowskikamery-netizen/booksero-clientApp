// Digital Asset Links dla TWA (Google Play) — dowód, że domena app.booksero.com
// i aplikacja Androida to jedno (usuwa pasek adresu w aplikacji).
//
// Wypełnione odciskiem klucza z PWABuilder (paczka com.booksero.app.twa).
// UWAGA: po włączeniu "App Signing" w Google Play trzeba DODAĆ drugi wpis
// z odciskiem klucza Google Play App Signing (Play Console → Ustawienia →
// Integralność aplikacji → App signing key certificate → SHA-256) — inaczej
// po instalacji ze sklepu aplikacja może pokazać pasek adresu.
export const ASSET_LINKS: unknown[] = [
  {
    relation: ["delegate_permission/common.handle_all_urls"],
    target: {
      namespace: "android_app",
      package_name: "com.booksero.app.twa",
      sha256_cert_fingerprints: [
        "72:87:1B:68:77:79:28:A9:29:12:BC:A5:4A:F7:D1:E2:62:29:31:D0:78:CA:9F:BD:39:35:F2:07:3E:B9:9C:F4",
      ],
    },
  },
];
