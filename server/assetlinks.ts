// Digital Asset Links dla TWA (Google Play) — dowód, że domena app.booksero.com
// i aplikacja Androida to jedno. Bez poprawnego wpisu aplikacja ze sklepu
// pokazuje u góry pasek adresu, jak zwykła przeglądarka.
//
// IDENTYFIKATOR APLIKACJI: com.booksero.app — ustalony 2026-07-28, NIEODWRACALNY
// po pierwszej publikacji w Google Play. Poprzednia paczka testowa używała
// com.booksero.app.twa (człon „twa" to nazwa technologii, nie marki) — została
// porzucona PRZED publikacją, więc nic jej nie zależy.
//
// DWA ODCISKI (oba potrzebne, bo Google podpisuje aplikację
// własnym kluczem, a paczka jest podpisana kluczem z PWABuilder):
//   1. klucz z NOWEJ paczki PWABuilder (com.booksero.app) — plik
//      signing-key-info.txt w pobranym ZIP-ie albo zakładka „App signing"
//      w PWABuilder;
//   2. klucz Google Play App Signing — Play Console → Test i publikacja →
//      Integralność aplikacji → Podpisywanie aplikacji → SHA-256.
// Odcisk ze starej paczki (72:87:1B:…) NIE PASUJE do nowego identyfikatora
// i został usunięty — nowa paczka ma własny klucz.
export const ASSET_LINKS: unknown[] = [
  {
    relation: ["delegate_permission/common.handle_all_urls"],
    target: {
      namespace: "android_app",
      package_name: "com.booksero.app",
      sha256_cert_fingerprints: [
        // 1. klucz paczki PWABuilder (com.booksero.app, ZIP z 2026-09-05)
        "97:DD:B7:54:CA:B9:E4:23:94:48:51:75:62:2E:57:D3:8D:04:FA:39:18:3B:34:0E:F0:5C:FB:E1:AB:E8:8C:58",
        // 2. klucz Google Play App Signing (Play Console → Chronione przez
        //    Google Play → Zarządzaj podpisywaniem aplikacji, 2026-09-05)
        "A4:21:24:6B:CF:36:F4:F9:D3:90:B0:A5:05:43:55:BC:F0:BE:2F:24:67:D2:C7:AA:28:40:6B:2D:A9:B6:25:B1",
      ],
    },
  },
];
