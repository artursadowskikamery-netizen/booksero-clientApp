// Digital Asset Links dla TWA (Google Play) — dowód, że domena app.booksero.com
// i aplikacja Androida to jedno (usuwa pasek adresu w aplikacji).
//
// DO UZUPEŁNIENIA po wygenerowaniu paczki w PWABuilder:
//  - package_name: nazwa pakietu wybrana w PWABuilder (np. "com.booksero.app"),
//  - sha256_cert_fingerprints: odcisk klucza podpisującego. UWAGA — po włączeniu
//    "App Signing" w Google Play trzeba dodać DWA odciski: klucz z PWABuilder
//    ORAZ klucz Google Play App Signing (Play Console → Ustawienia → Integralność
//    aplikacji → App signing key certificate → SHA-256).
//
// Dopóki lista jest pusta, weryfikacja się nie powiedzie (aplikacja pokaże pasek
// adresu) — to normalne do momentu wklejenia prawdziwych odcisków.
export const ASSET_LINKS: unknown[] = [
  // {
  //   "relation": ["delegate_permission/common.handle_all_urls"],
  //   "target": {
  //     "namespace": "android_app",
  //     "package_name": "com.booksero.app",
  //     "sha256_cert_fingerprints": ["AA:BB:CC:..."]
  //   }
  // }
];
