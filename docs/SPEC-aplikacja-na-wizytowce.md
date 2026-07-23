# SPEC — promocja aplikacji BookSero na wizytówce i widgecie

Cel: klient, który trafił na wizytówkę salonu lub widget rezerwacji (w domu,
nie w salonie), ma jednym ruchem trafić do aplikacji klienckiej — od razu do
WŁAŚCIWEGO salonu. Tam loguje się SMS-em i może zainstalować ikonę.

## 1. Link docelowy (jeden, inteligentny — NIE dwa kody)

- Salon ma ustawiony krótki adres (slug): `https://app.booksero.com/<slug>`
  (aplikacja od 1.0.8 resolvuje slug i przenosi wprost do salonu).
- Salon bez sluga: `https://app.booksero.com/salon/<salonId>` (UUID).
- NIE linkować do `/t/<tenantId>` (wybór kraj→miasto→salon) — klient
  wizytówki ma trafić bezpośrednio do tego salonu.

Uzasadnienie „jeden kod": w PWA link robi wszystko naraz (otwiera aplikację
w salonie; logowanie i instalacja są w środku). Dwa kody = zgadywanie,
który zeskanować.

## 2. Wizytówka lokalizacji (publiczna strona salonu)

Nowa sekcja „Aplikacja BookSero" (pod danymi salonu / nad stopką):

- Nagłówek + 1 zdanie korzyści: „Rezerwuj szybciej — Twoje wizyty, punkty
  i promocje w telefonie."
- **Telefon (ekran < 768 px):** przycisk „Otwórz aplikację" → link z §1.
  QR NIE pokazujemy (nie da się zeskanować kodu telefonem, który go
  wyświetla).
- **Komputer (≥ 768 px):** kod QR z linkiem z §1 (generowanie jak przy
  istniejącym QR wizytówki w panelu) + pod spodem wypisany krótki adres
  (np. `app.booksero.com/svp`).
- Teksty przetłumaczone we wszystkich 16 językach wizytówki (pl, en, de,
  nl, cs, sv, es, fr, it, hr, el, tr, bg, fi, no, uk).

## 3. Widget rezerwacji

Dyskretnie — widget służy rezerwacji, nie wolno odciągać od niej:

- Stopka/pasek pod widgetem: „Wygodniej w aplikacji →" jako link z §1
  (otwiera w nowej karcie). Bez QR w widgecie na telefonie; na komputerze
  dopuszczalny mały QR w dymku po najechaniu/kliknięciu (opcjonalnie).
- Tłumaczenia ×16 jak wyżej.

## 4. Poza zakresem

- Aplikacja kliencka — obsługa `app.booksero.com/<slug>` już wdrożona
  (wersja 1.0.8, commit 642224e w booksero-clientApp).
- Materiały drukowane (QR do druku już jest w panelu — bez zmian).
- Żadnych zmian w rezerwacji/danych; to wyłącznie warstwa prezentacji.

## 5. Testy odbiorcze (DoD)

1. Wizytówka salonu ze slugiem `svp` na telefonie → przycisk „Otwórz
   aplikację" → ląduję w aplikacji na stronie TEGO salonu.
2. Ta sama wizytówka na komputerze → QR; skan APARATEM telefonu → jak wyżej.
3. Ten sam QR zeskanowany SKANEREM W APLIKACJI (klient, który już ma
   aplikację, ale nie zna salonu) → ląduję na stronie tego salonu
   (aplikacja od 1.0.9 rozumie linki ze slugiem — commit w booksero-clientApp).
4. Salon BEZ sluga → link/QR z `/salon/<salonId>` działa tak samo
   (obie drogi skanowania).
5. Widget: stopka widoczna, klik → aplikacja we właściwym salonie,
   rezerwacja w widgecie działa bez zmian.
6. Wizytówka po niemiecku → teksty sekcji po niemiecku (i analogicznie
   pozostałe języki).
