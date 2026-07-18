# SPEC — Auto-rejestracja klienta przy logowaniu SMS

Rozszerzenie istniejącego logowania klienta kodem SMS (client-auth). Obecnie
zalogować się może wyłącznie klient, który już istnieje w bazie tenanta.
Po tej zmianie: numer nieznany w tenancie także dostaje kod SMS, a po jego
poprawnym wpisaniu system **tworzy nowego klienta** w wybranym salonie.

Gałąź robocza: `claude/client-auth-autoreg`. Nie mergować do main.
Nie zmieniać niczego poza zakresem opisanym niżej.

## 1. Cel

Aplikacja kliencka BookSero będzie wymagać logowania SMS **przed** rezerwacją.
Żeby nie blokować nowych klientów, backend musi umieć założyć konto klienta
automatycznie — ale dopiero PO poprawnej weryfikacji kodu SMS.

## 2. Zmiany w endpointach

### 2.1 `POST /api/public/client-auth/request-code`

Body: `{ tenantId, phone, salonId }` — pole `salonId` jest NOWE i wymagane.

- Walidacja: salon o `salonId` istnieje i należy do `tenantId` — w przeciwnym
  razie błąd 404 (użyć istniejącego kodu błędu dla nieznanego salonu).
- Jeśli w tenancie NIE ma klienta z tym numerem: **nie zwracać błędu**.
  Wygenerować i wysłać kod dokładnie tak samo jak dla istniejącego klienta
  (SMS z puli tenanta, ten sam szablon wiadomości).
- Odpowiedź HTTP identyczna dla numeru istniejącego i nieznanego
  (brak możliwości enumeracji numerów klientów).
- Rate limity bez zmian (3 kody / 10 min na numer + istniejące limity IP).

### 2.2 `POST /api/public/client-auth/verify`

Body: `{ tenantId, phone, code, salonId, firstName?, lastName? }`
— pola `salonId` (wymagane), `firstName`, `lastName` (opcjonalne) są NOWE.

- Weryfikacja kodu bez zmian (HMAC-SHA256, max 5 prób, ważność 10 min).
- Kod poprawny + istnieją klienci z tym numerem w tenancie → zachowanie
  dotychczasowe (token JWT z `clientIds` wszystkich dopasowanych klientów).
  Pola `firstName`/`lastName` w tym przypadku IGNOROWAĆ.
- Kod poprawny + BRAK klienta z tym numerem:
  - gdy `firstName` brak lub puste → HTTP 422 z nowym kodem komunikatu
    `clientAuth.nameRequired`. Kod SMS pozostaje ważny, a ta próba NIE
    zwiększa licznika błędnych prób (kod był przecież poprawny) i NIE
    oznacza kodu jako zużytego.
  - gdy `firstName` podane → utworzyć klienta:
    - `tenantId` z body, `salonId` z body, `phone` znormalizowany tą samą
      funkcją, której używa matching numerów w request-code/verify,
    - `firstName`, `lastName` (jeśli podane) — przycięte (trim),
      limit długości jak przy tworzeniu klienta w panelu,
    - pozostałe pola wg istniejącej logiki tworzenia klienta w kodzie
      (m.in. `globalClientId` — nowy, bo nie ma dopasowania w tenancie),
    - jeśli tabela klientów ma pole źródła/notatki pochodzenia — ustawić
      wartość wskazującą na aplikację kliencką (np. "app"); jeśli nie ma,
      niczego nie dodawać do schematu.
  - po utworzeniu: oznaczyć kod jako zużyty i zwrócić token JWT
    (`aud: "client"`) z `clientIds = [id nowego klienta]` — odpowiedź o tym
    samym kształcie co dla istniejącego klienta.

### 2.3 Bez zmian

`GET /api/public/client/me`, `GET /api/public/client/appointments`,
`requireClientAuth`, izolacja tokenów klient/staff — nie dotykać.

## 3. i18n

Nowy kod komunikatu `clientAuth.nameRequired` we WSZYSTKICH 16 językach
w `server/i18n/messages.ts` (pl, en, de, nl, cs, sv, es, fr, it, hr, el,
tr, bg, fi, no, uk). Polski wzorzec: „Podaj imię, aby dokończyć rejestrację."

## 4. Bezpieczeństwo

- Klient może zostać utworzony WYŁĄCZNIE po poprawnej weryfikacji kodu SMS.
- Żadnych zmian w limitach i hashowaniu kodów.
- Identyczne odpowiedzi request-code dla numeru znanego i nieznanego.
- `salonId` musi należeć do `tenantId` — sprawdzić PRZED wysyłką SMS.
- Bez zmian schematu bazy (tabele `clients` i `client_auth_codes` wystarczą).

## 5. Testy / Definition of Done

1. request-code dla numeru nieznanego w tenancie → 200, kod zapisany, SMS wysłany.
2. request-code z `salonId` z innego tenanta → 404, SMS NIE wysłany.
3. verify (nowy numer) bez `firstName` → 422 `clientAuth.nameRequired`,
   kod nadal ważny, licznik prób bez zmian.
4. verify (nowy numer) z `firstName` → klient utworzony w dobrym salonie
   i tenancie, token działa na `/api/public/client/me`.
5. verify (istniejący klient) → zachowanie identyczne jak przed zmianą.
6. Kompilacja TypeScript przechodzi.
7. Praca wypchnięta na gałąź `claude/client-auth-autoreg`; w raporcie podać
   hash commita i listę zmienionych plików.
