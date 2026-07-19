# SPEC — Bonusy Etap B2: Kody rabatowe za akcje + „Moje kody"

## 0. Model (ustalenia właściciela — NADRZĘDNE)

1. **Kody rabatowe są CAŁKOWICIE ROZDZIELONE od punktów lojalnościowych.**
   - NIE są spinane z progami/poziomami lojalności.
   - NIE ma przeliczania punktów na kody.
   - Odbiór/wydanie kodu NIE zmniejsza żadnych punktów.
   - Katalog nagród za punkty (Etap A, odbiór w salonie) zostaje BEZ ZMIAN
     i NIE dotyczy kodów.
2. **Kod rabatowy = produkt typu VOUCHER.** Generowany automatycznie przez
   system (moduł voucherów Booksero, MPV kwotowy — ta sama ścieżka co
   nagroda za polecenie), **imienny** (przypięty do karty klienta),
   aktywny od razu, realizowany przy rozliczeniu wizyty w panelu.
3. **Kody wydaje system za OKREŚLONE CZYNNOŚCI/AKTYWNOŚCI w aplikacji**,
   zgodnie z ustawieniami Managera/Admina („Akcje premiowane"):
   która czynność daje kod, jaka KWOTA (zł), jaki PREFIKS kodu.
   Klient za daną czynność dostaje **punkty ALBO kod** — nigdy oba,
   nigdy przeliczane jedno na drugie.
4. Pierwsza czynność premiowana kodem już działa (polecenia — Etap B).
   Kolejne czynności i kampanie wg harmonogramu — w następnych etapach;
   struktura konfiguracji ma być na to GOTOWA (rozszerzalna), ale ich
   samych NIE implementować teraz.
5. Suwak `codesNotebook` per tenant włącza pod-zakładkę „Moje kody"
   w aplikacji.

Gałąź robocza: odgałęzić od `claude/hej-5yvvly`, nazwa
`claude/loyalty-codes-b2`. Nie mergować do main. Zmiany schematu
dozwolone (ADD-only; `db:push`).

## 1. Prefiks i parametry kodów (per tenant)

Konfiguracja w panelu: Ustawienia → Aplikacja dla klientów, w sekcji
„Akcje premiowane" (uprawnienie jak reszta strony — Admin/Menedżer):

- **Prefiks kodu** (np. `V25`) — tekst 2–8 znaków [A-Z0-9]; kody
  generowane jako `<PREFIKS>-XXXXXX` (istniejący generator kodów
  voucherów, unikalność per tenant). Brak prefiksu = format dotychczasowy.
- **Ważność kodu w dniach** (domyślnie 30) — dotyczy kodów wydawanych
  za akcje w aplikacji (dotychczasowe 12 mies. przy poleceniach zastąpić
  tą wartością).
- Zapis w `tenants.settings` (np. klucz `rewardCodes`), sanityzowany.

Kwoty kodów ustala się PRZY KAŻDEJ AKCJI (jak dziś przy poleceniach:
typ „Kod rabatowy (voucher)" + kwota w zł). Żadnych kwot globalnych.

## 2. Ujednolicenie wydawania kodów za akcje

Wspólna funkcja „wydaj kod za akcję" (refaktor istniejącej
`createReferralRewardVoucher` do postaci ogólnej):

- parametry: tenantId, salonId, clientId, kwota, źródło/akcja
  (np. `referral`, `referral_welcome`; kolejne w przyszłości), notatka,
- używa prefiksu i ważności z §1, `origin` opisujący akcję,
- zwraca utworzony voucher (kod).

Polecenia (Etap B) przełączyć na tę funkcję — zachowanie identyczne
poza prefiksem/ważnością z konfiguracji. Nic innego nie zmieniać
w mechanice poleceń.

## 3. „Moje kody" — endpointy klienta

Suwak `codesNotebook` off → 404 na wszystkich poniższych.

- `GET /api/public/client/codes` → dwie listy:
  - `vouchers`: vouchery klienta (wszystkie rekordy z `deriveClientIds`,
    tenant-scoped) — kod, kwota pozostała/oryginalna, waluta, status
    (aktywny/wykorzystany/wygasły), `expiresAt`, `origin`
    (za co wydany — polecenie, bonus powitalny, zakup itd.),
  - `notes`: własne wpisy klienta z notatnika (§4).

## 4. Notatnik własnych kodów

Nowa tabela (np. `client_saved_codes`):
`id, tenantId, clientId, code (tekst), note (<=100 znaków), isUsed,
createdAt`.

- `POST /api/public/client/codes` `{ code, note? }` — dodanie wpisu,
- `PATCH /api/public/client/codes/:id/use` — przełączenie „wykorzystany",
- `DELETE /api/public/client/codes/:id` — usunięcie.

Wszystko za `requireClientAuth`, tenant-scoped, wyłącznie własne wpisy
(cudze → 404). `clientId` = rekord główny z `deriveClientIds`; odczyt
po wszystkich rekordach klienta.

## 5. Panel

- Ustawienia → Aplikacja dla klientów:
  - sekcja „Akcje premiowane": pola **prefiks kodu** i **ważność kodu
    (dni)** (§1),
  - suwak **„Notatnik kodów"** (`codesNotebook`) — zdjąć z listy
    „wkrótce", podpiąć zapis.
- Bez zmian w module Program lojalnościowy (katalog nagród NIE dostaje
  typu kodowego — pełne rozdzielenie światów).

## 6. Ekspozycja dla aplikacji

`appFeatures.codesNotebook` dodać do `GET /api/public/book/:salonId`
(obok `loyalty` i `referrals`).

## 7. i18n

Nowe kody komunikatów we WSZYSTKICH 16 językach
(`server/i18n/messages.ts`) — tylko jeśli potrzebne (błędy notatnika,
niedostępność funkcji); reużyć istniejące, gdzie pasują.

## 8. Bezpieczeństwo

- Wszystkie endpointy klienta za `requireClientAuth`; tenant z tokenu;
  cudze zasoby → 404.
- Notatnik: walidacja długości kodu (np. <=64) i notatki (<=100),
  limit wpisów na klienta (np. 100) — bez spamu.
- Vouchery w „Moich kodach" tylko do ODCZYTU (realizacja wyłącznie
  w panelu przy rozliczeniu — bez endpointów zużywających voucher).
- Mechanika poleceń, lojalności (Etap A), rezerwacji — nietknięta poza
  refaktorem §2 (zachowanie identyczne).

## 9. Testy / Definition of Done

1. Prefiks `V25` ustawiony → nagroda-kod za polecenie generuje
   `V25-XXXXXX`, ważny wg skonfigurowanej liczby dni, przypięty do
   właściwego klienta; bez prefiksu → format dotychczasowy.
2. Kwota kodu bierze się z konfiguracji akcji (Akcje premiowane),
   NIE z punktów; wydanie kodu nie zmienia salda punktów klienta.
3. `GET /client/codes` zwraca vouchery klienta (z poleceń i inne
   przypięte do niego) ze statusami i pochodzeniem; wpisy notatnika:
   dodanie/oznaczenie/usunięcie działa; cudzy wpis → 404.
4. Suwak `codesNotebook` off → 404 na §3–4; `appFeatures.codesNotebook`
   w /book odzwierciedla stan.
5. Realizacja wygenerowanego kodu przy rozliczeniu wizyty w panelu
   działa jak dla każdego vouchera (bez zmian w kasie).
6. Regresja poleceń: pełny obieg Etapu B (SMS → dołączenie → zakończona
   wizyta → nagrody) działa bez zmian.
7. TypeScript kompiluje; `npm run db:push` wykonalny (ADD-only).
8. Push na gałąź `claude/loyalty-codes-b2`; w raporcie hash commita,
   lista plików, informacja o db:push.
