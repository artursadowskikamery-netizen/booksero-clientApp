# SPEC — Krótki link polecenia + domena app.booksero.com w panelu

DWA ZADANIA w jednej gałęzi (oba dotyczą adresu aplikacji klienckiej):
A) skrócenie linku w SMS-ie z poleceniem (§1–§6),
B) podmiana starego adresu replit na app.booksero.com w PANELU (§7).

## Zadanie A — Krótki link polecenia (skrócenie SMS-a)

Dziś SMS z poleceniem zawiera długi link
`https://app.booksero.com/t/<tenantId-UUID>?ref=<clientId-UUID>` (~90 zn.).
Skracamy do `https://app.booksero.com/r/<kod>` (kilka znaków). Backend
generuje krótki kod przy tworzeniu polecenia i udostępnia endpoint
rozwiązujący kod → {tenantId, ref}.

Gałąź robocza: odgałęzić od `claude/hej-5yvvly`, nazwa
`claude/short-referral-link`. Nie mergować do main. Zmiana schematu
dozwolona (ADD-only; `db:push` — potwierdzić w raporcie).

## 0. Zasady

1. Krótki kod identyfikuje parę (tenant, polecający) danego polecenia —
   po rozwiązaniu aplikacja zapisuje `ref = referrerClientId` i wchodzi
   do `/t/<tenantId>`. Attribution i nagrody działają jak dziś (bez zmian).
2. Kod krótki, czytelny, bez znaków dwuznacznych (bez 0/O, 1/l/I) —
   np. base32-Crockford, długość 6–8, unikalny w skali globalnej
   (kolizje sprawdzane przy generowaniu).
3. Endpoint rozwiązujący jest publiczny (bez tokenu) — służy tylko do
   przekierowania; nie ujawnia danych wrażliwych (zwraca tylko tenantId
   i ref=clientId polecającego, tak jak dziś w jawnym linku).

## 1. Schemat

Dodać kolumnę `shortCode` (text, unikalny indeks) do tabeli `referrals`
(ADD-only). Stare wiersze mogą mieć null (nie były wysyłane nowym linkiem).

## 2. Generowanie kodu

W `POST /api/public/client/referrals` przy tworzeniu wiersza polecenia:
- wygeneruj `shortCode` (6–8 znaków, alfabet bez dwuznacznych),
  sprawdź unikalność (retry przy kolizji),
- zapisz na wierszu `referrals`.

## 3. Link w SMS

Zmienić budowanie linku SMS na:
`${APP_CLIENT_URL}/r/${shortCode}`
(zamiast `${APP_CLIENT_URL}/t/${tenantId}?ref=${referrerClientId}`).
Nazwa nadawcy, treść, pula SMS — bez zmian.

## 4. Endpoint rozwiązujący

`GET /api/public/r/:code` (publiczny, bez tokenu):
- znajdź `referrals` po `shortCode`,
- brak / nieznany kod → 404,
- zwróć `{ tenantId, ref }` gdzie `ref` = `referrerClientId` polecenia.
- (Opcjonalnie zamiast JSON można zwrócić HTTP 302 redirect do
  `${APP_CLIENT_URL}/t/<tenantId>?ref=<ref>` — ale preferowany JSON,
  aplikacja sama nawiguje i zapisuje ref w localStorage.)

## 5. Bezpieczeństwo / spójność

- Kod nie pozwala na nic poza tym, co dziś jawny link (tenant + ref).
- Rate limit odczytu wg istniejących ograniczeń publicznych (jeśli są).
- Mechanika poleceń, attribution, nagrody — bez zmian; zmienia się tylko
  FORMAT linku i dochodzi endpoint rozwiązujący.

## 6. Testy / DoD

1. Nowe polecenie → wiersz `referrals` ma `shortCode`; SMS zawiera
   `app.booksero.com/r/<kod>`.
2. `GET /api/public/r/<kod>` → `{ tenantId, ref }` zgodne z poleceniem;
   nieznany kod → 404.
3. Pełny obieg: wejście z krótkiego linku → rejestracja nowego klienta →
   attribution i bonus powitalny działają jak przy starym linku.
4. TypeScript kompiluje; `npm run db:push` wykonalny (ADD-only).
5. Push na gałąź `claude/short-referral-link`; w raporcie hash commita,
   lista plików i potwierdzenie db:push.

## Zadanie B — Domena app.booksero.com w panelu (§7)

Problem: w panelu (Ustawienia → Aplikacja dla klientów → „Dostęp do
aplikacji") linki i kody QR (link sieci `/t/…`, linki lokalizacji
`/salon/…`) wciąż pokazują `https://booksero-client-app.replit.app/…`.
SMS-y są już poprawne (serwer czyta `APP_CLIENT_URL`), ale panel to
front-end Reacta i buduje te linki ze STAŁEJ domyślnej w kodzie
(`DEFAULT_APP_CLIENT_URL` w `shared/app-client.ts`), która wciąż
wskazuje adres replit.

Do zrobienia:
1. Zmienić `DEFAULT_APP_CLIENT_URL` (`shared/app-client.ts`) na
   `https://app.booksero.com` (bez końcowego ukośnika).
2. Sprawdzić, że sekcja „Dostęp do aplikacji" (linki + wartości QR) oraz
   każde inne miejsce w panelu budujące linki aplikacji używa tej stałej
   (albo, jeśli to prostsze i spójne, wartości `APP_CLIENT_URL`
   udostępnionej z serwera do panelu) — efekt: WSZYSTKIE widoczne linki
   i QR to `app.booksero.com`, zero `replit.app`.
3. Nie zmieniać zachowania serwera (SMS już OK); to poprawka wartości
   domyślnej/wyświetlania.

DoD B: w panelu „Dostęp do aplikacji" linki i QR pokazują
`https://app.booksero.com/…`; brak `replit.app` w widoku; TypeScript
kompiluje.
