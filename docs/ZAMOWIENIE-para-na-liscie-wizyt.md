# ZAMÓWIENIE dla sesji panelu — para widoczna na liście „Moje wizyty"

**Zgłoszenie właściciela (2026-08-12):** klient rezerwuje wizytę dla dwóch
osób, przypisuje obu usługi i po jednej masażystce, potwierdza. Na liście
wizyt w aplikacji widzi **jedną osobę i jedną masażystkę** — z listy w ogóle
nie wynika, że to rezerwacja dla dwojga.

**Diagnoza (sprawdzona w kodzie serwera, `routes.ts`, endpoint
`GET /api/public/client/appointments`):** to nie jest błąd aplikacji.
Endpoint celowo zwraca dane WŁAŚCIWEJ osoby (`personIndex`, poprawka
z 2026-08-12) i to działa dobrze — ale **nie ujawnia w ogóle, że wizyta
jest dla dwóch osób**. `a.partySize` jest używane w środku do wyboru
pozycji, natomiast do odpowiedzi nie trafia. Aplikacja nie ma z czego tego
pokazać.

---

## Proszę dodać do każdej pozycji odpowiedzi

| pole | typ | wartość |
|---|---|---|
| `partySize` | number | `1` albo `2` (to, co w bazie) |
| `companionName` | string \| null | imię TEJ DRUGIEJ osoby — z punktu widzenia oglądającego |
| `companionServiceName` | string \| null | usługa drugiej osoby |
| `companionStaffName` | string \| null | specjalista drugiej osoby |

**Kluczowe: `companion*` jest względne wobec oglądającego.**
- rezerwujący widzi w `companion*` osobę towarzyszącą,
- osoba towarzysząca widzi w `companion*` rezerwującego.

Dzięki temu aplikacja nie musi wiedzieć, kto jest kim — po prostu pokazuje
„druga osoba". Cała potrzebna wiedza jest już w tym handlerze: `rolaOsoby`,
`apptServices` z `personIndex` i `staffId` per pozycja.

**Przy niespodziance** (`secondClientPhone` nie podany) `companionName` może
być samym imieniem wpisanym przy rezerwacji — to wystarczy. Jeśli imienia
nie ma, zwróćcie `null`; aplikacja pokaże wtedy samą usługę i specjalistę.

**Przy `partySize: 1`** wszystkie trzy pola `companion*` = `null`.

---

## Strona aplikacji — JUŻ GOTOWA (nic nie blokuje)

Wersja **1.0.23** (`booksero-clientApp`, gałąź `main`) czyta te pola już
teraz, jako opcjonalne:

- przy `partySize >= 2` karta wizyty dostaje plakietkę **„dla 2 osób"**
  (16 języków) — także w historii wizyt,
- druga linia pokazuje `companionName · companionServiceName ·
  companionStaffName` (pomijane są pola puste),
- dopóki backend nie wysyła tych pól, lista wygląda dokładnie jak dotąd —
  **żadnej regresji, żadnego pustego miejsca**.

Czyli: po Waszym wdrożeniu funkcja zapali się sama, bez kolejnego wydania
aplikacji.

---

## Test odbiorczy

1. Rezerwacja pary: Anna (masaż balijski, Tera) + Jan (masaż sportowy, Kasia).
2. Anna w „Moich wizytach" widzi: plakietkę „dla 2 osób", swój masaż
   balijski z Terą i drugą linię „Jan · masaż sportowy · Kasia".
3. Jan po zalogowaniu widzi tę samą wizytę odwrotnie: swój masaż sportowy
   z Kasią i drugą linię „Anna · masaż balijski · Tera"; nadal bez przycisku
   odwołania (`canCancel: false` — bez zmian).
4. Zwykła wizyta jednoosobowa wygląda jak dotąd (`partySize: 1`, brak
   plakietki i drugiej linii).
