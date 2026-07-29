// Digital Asset Links dla TWA (Google Play) — dowód, że domena app.booksero.com
// i aplikacja Androida to jedno. Bez poprawnego wpisu aplikacja ze sklepu
// pokazuje u góry pasek adresu, jak zwykła przeglądarka.
//
// IDENTYFIKATOR APLIKACJI: com.booksero.app — ustalony 2026-07-28, NIEODWRACALNY
// po pierwszej publikacji w Google Play. Poprzednia paczka testowa używała
// com.booksero.app.twa (człon „twa" to nazwa technologii, nie marki) — została
// porzucona PRZED publikacją, więc nic jej nie zależy.
//
// DWA ODCISKI DO UZUPEŁNIENIA (oba potrzebne, bo Google podpisuje aplikację
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
        // TODO: wkleić oba odciski (format AA:BB:CC:… wielkimi literami)
      ],
    },
  },
];
