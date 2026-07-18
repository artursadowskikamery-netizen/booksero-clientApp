# SPEC — Rezerwacja zalogowanego klienta + odwołanie własnej wizyty

Aplikacja kliencka BookSero wymaga teraz logowania SMS przed rezerwacją.
Wyszły z tego dwie luki do naprawienia w backendzie:

- (a) Publiczny endpoint rezerwacji dopasowuje klienta po DOKŁADNYM zapisie
  telefonu (`findClientByPhone` → `eq(clients.phone, phone)`). Zalogowany
  klient z numerem zapisanym w bazie jako „+48 609…" wysyła „48609…" →
  brak dopasowania → powstaje DUPLIKAT klienta, a wizyta wisi na duplikacie
  i jest niewidoczna w aplikacji (token loginu jej „nie zna").
- (b) Wizyty założone w panelu przez pracownika nie mają `cancellation_token`,
  więc zalogowany klient nie może ich odwołać w aplikacji.

Gałąź robocza: `claude/client-booking`. Nie mergować do main.
Bez zmian schematu bazy. Nie zmieniać niczego poza zakresem poniżej.

## 1. Wspólny helper: aktualne clientIds zalogowanego klienta

Dodać funkcję (np. `deriveClientIds(auth)`), która na żądanie wyznacza
AKTUALNY zbiór rekordów klienta w tenancie:

1. start: `auth.clientIds` z tokenu (odfiltrować rekordy nieistniejące,
   usunięte lub `isActive = false`, oraz spoza `auth.tenantId`),
2. plus aktywni klienci tenanta dopasowani po `auth.phone` tą samą logiką
   co przy logowaniu (`getActiveClientsByPhone`),
3. plus domknięcie po `globalClientId` (`getActiveClientsByGlobalIds`).

Użyć jej w `/api/public/client/me`, `/api/public/client/appointments`
oraz w nowych ścieżkach poniżej. Efekt: rekord klienta utworzony PO
zalogowaniu (np. duplikat z rezerwacji) też jest widoczny bez ponownego
logowania, o ile pasuje numerem lub globalClientId.

## 2. Rezerwacja z tokenem klienta

`POST /api/public/book/:salonId/appointments` — jeśli żądanie ma nagłówek
`Authorization: Bearer` z WAŻNYM tokenem klienta (`aud: "client"`) i
`token.tenantId === salon.tenantId`:

- clientId wizyty = rekord z `deriveClientIds` należący do TEGO salonu;
  jeśli klient nie ma rekordu w tym salonie → utworzyć go na bazie rekordu
  głównego (firstName, lastName, phone, email; `source: "app"`) i przepiąć
  `globalClientId` przez istniejący `autoMatchGlobalClient`.
- POMINĄĆ dotychczasowe dopasowanie po telefonie/e-mailu z body (to ono
  tworzy duplikaty).
- Pola `clientName`/`clientPhone`/`clientEmail` z body NIE nadpisują danych
  istniejącego klienta.
- Token nieobecny, nieważny albo z innego tenanta → zachowanie dokładnie
  dotychczasowe (publiczne wizytówki działają bez zmian).
- Kształt odpowiedzi bez zmian.

## 3. Odwołanie własnej wizyty

Nowy endpoint: `POST /api/public/client/appointments/:id/cancel`
(za `requireClientAuth`):

- Wizyta musi istnieć, należeć do `auth.tenantId`, a jej `clientId` być w
  `deriveClientIds` — inaczej 404 (bez zdradzania, że wizyta istnieje).
- Odwołać można tylko wizytę PRZYSZŁĄ o statusie `booked`/`confirmed` → 400.
- Honorować te same zasady salonu co publiczne `/api/public/cancel/:token`
  (allowCancellation, ewentualny deadline godzinowy) — użyć wspólnej logiki,
  nie kopiować jej.
- Skutek identyczny jak przy publicznym anulowaniu (status, zwolnienie
  terminu, powiadomienia). Odpowiedź: istniejący komunikat sukcesu.

## 4. Listing wizyt

W `GET /api/public/client/appointments` dodać do każdej wizyty pole
`canCancel: boolean` — true dla przyszłych `booked`/`confirmed`, gdy salon
pozwala na anulowanie (te same zasady co §3, licząc deadline względem teraz).
`cancellationToken` zostaje jak jest (kompatybilność wstecz).

## 5. i18n

W miarę możliwości używać istniejących kodów komunikatów (anulowanie,
notFound). Nowe kody dodawać tylko jeśli naprawdę brak pasującego — wtedy
we wszystkich 16 językach.

## 6. Bezpieczeństwo

- Każde zapytanie związane tenantem z tokenu; klient nie może odwołać ani
  zobaczyć wizyty innego klienta (test na cudzym id → 404).
- `requireAuth` (staff) i izolacja tokenów — nietknięte.
- Ścieżka bez tokenu w §2 musi pozostać bajt-w-bajt zgodna z obecnym
  zachowaniem (regresja = błąd).

## 7. Testy / Definition of Done

1. Rezerwacja Z tokenem, klient ma rekord w salonie → wizyta na jego
   clientId, ZERO nowych rekordów klienta.
2. Rezerwacja Z tokenem, klient bez rekordu w tym salonie → nowy rekord
   w salonie z `source: "app"`, spięty globalClientId, wizyta widoczna
   w `/client/appointments` bez ponownego logowania.
3. Rezerwacja BEZ tokenu → zachowanie identyczne jak przed zmianą.
4. `/client/appointments`: wizyta panelowa przyszła (booked) ma
   `canCancel: true` (przy włączonym anulowaniu w salonie).
5. `POST /client/appointments/:id/cancel` własnej przyszłej wizyty →
   anulowana (jak publicznym tokenem); cudzej → 404; przeszłej → 400.
6. Kompilacja TypeScript przechodzi.
7. Push na gałąź `claude/client-booking`; w raporcie hash commita i lista
   zmienionych plików.
