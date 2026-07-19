# SPEC — Bonusy Etap B2: Kody rabatowe samoobsługowe + „Moje kody"

Dokończenie Etapu B. Dwie powiązane funkcje aplikacji klienckiej BookSero:

- (a) **Nagrody typu KOD RABATOWY w katalogu nagród** — klient wymienia
  punkty na voucher kwotowy SAMOOBSŁUGOWO w aplikacji (wzorzec „V25"
  ze starej aplikacji VIVI), z UKRYTYMI limitami ustawianymi w panelu
  przez Administratora/Menedżera.
- (b) **Pod-zakładka „Moje kody"** (notatnik kodów) — klient widzi swoje
  vouchery (z nagród, z poleceń) oraz może przechowywać własne kody.

Gałąź robocza: odgałęzić od `claude/hej-5yvvly`, nazwa
`claude/loyalty-codes-b2`. Nie mergować do main.
Reużyć istniejące mechanizmy: moduł voucherów (MPV kwotowy — ta sama
ścieżka co nagrody poleceń, `createVoucher` + generator kodu),
`redeemLoyaltyPointsAtomic` + oba ledgery punktów, `deriveClientIds`,
suwaki `tenants.settings.appFeatures`. Zmiany schematu dozwolone
(będzie `db:push`, ADD-only).

## 0. Zasady nadrzędne (ustalenia właściciela)

1. Nagrody typu **kod rabatowy** odbiera się **samoobsługowo** w aplikacji
   (bez zgłoszenia do recepcji) — bo kod i tak realizuje recepcja przy
   rozliczeniu wizyty w panelu. Nagrody pozostałych typów: bez zmian
   (zgłoszenie → „Wydano" w salonie, Etap A).
2. **Limity odbioru kodów są UKRYTE przed klientem** i **konfigurowalne
   w panelu** (Administrator/Menedżer): maks. kodów miesięcznie,
   minimalny odstęp dni między kodami, ważność kodu w dniach.
   Przy odmowie klient dostaje ogólny komunikat z datą, kiedy będzie
   mógł odebrać następny kod — NIGDY liczb limitów.
3. Kody są **imienne** (voucher przypięty do karty klienta) i **aktywne
   od razu** — zero ręcznej aktywacji.
4. Punkty za kod schodzą z salda **w momencie odbioru** (atomowo z
   utworzeniem vouchera). Poziom (lifetime) bez zmian — nie maleje.
5. Suwak `codesNotebook` per tenant włącza pod-zakładkę „Moje kody".
   Nagrody-kody w katalogu działają pod istniejącym suwakiem `loyalty`.

## 1. Katalog nagród — typ „Kod rabatowy (voucher)"

Panel, moduł Program lojalnościowy → Nagrody:

- Umożliwić dodanie nagrody z typem **voucher kwotowy** (jeśli
  `loyalty_rewards.rewardType` ma już pasujący typ — użyć go; jeśli nie —
  dodać wartość typu, np. `"voucher"`; bez zmian istniejących typów).
- Pola: nazwa, koszt punktowy (`pointsCost`), kwota vouchera
  (`rewardValue`, w walucie salonu).

## 2. Konfiguracja limitów (per tenant, ukryta przed klientem)

W `tenants.settings` (np. klucz `rewardCodes`), edycja w panelu:
Ustawienia → Aplikacja dla klientów → nowa sekcja **„Kody rabatowe"**
(uprawnienie jak reszta strony — Administrator/Menedżer):

- `maxPerMonth` (int, domyślnie 2) — maks. kodów na klienta na miesiąc
  kalendarzowy,
- `minDaysBetween` (int, domyślnie 10) — minimalny odstęp od OSTATNIEGO
  odebranego kodu (liczony także ponad granicą miesiąca),
- `validityDays` (int, domyślnie 30) — ważność vouchera od wygenerowania.

Sanityzacja przy zapisie (wartości >= 0; 0 = brak danego limitu).

## 3. Odbiór nagrody-kodu (samoobsługa)

Rozszerzyć `POST /api/public/client/loyalty/rewards/:rewardId/claim`
(requireClientAuth; suwak `loyalty` off → 404):

- Nagroda typu INNEGO niż voucher → dotychczasowa ścieżka (pending claim,
  odbiór w salonie) — BEZ ZMIAN.
- Nagroda typu **voucher**:
  1. saldo < pointsCost → 400 (istniejący `loyalty.notEnoughPoints`),
  2. sprawdzenie limitów z §2 po HISTORII odebranych kodów klienta
     (zbiór rekordów z `deriveClientIds`):
     - przekroczony `maxPerMonth` albo nie minął `minDaysBetween` →
       429 z komunikatem zawierającym NAJBLIŻSZĄ możliwą datę odbioru
       (bez ujawniania liczb limitów),
  3. ATOMOWO: odjęcie `pointsCost` (`redeemLoyaltyPointsAtomic` + wpisy
     w obu ledgerach, jak przy „Wydano") + utworzenie vouchera MPV:
     kwota = `rewardValue`, waluta salonu, `clientId` = rekord główny,
     `origin: "loyalty_reward"`, ważność = `validityDays`,
     notatka z nazwą nagrody. Wyścig dwóch kliknięć nie może dać dwóch
     voucherów za jedne punkty.
  4. Odpowiedź: `{ code, amount, currency, expiresAt }`.
- Zapis odbioru: wiersz w `loyalty_reward_claims` ze statusem
  `fulfilled` (resolvedAt = teraz, resolvedBy = null → samoobsługa)
  — dzięki temu limity §2 liczą się z jednej tabeli i historia jest
  widoczna na karcie klienta. Jeśli potrzebne — dodać kolumnę
  `voucherId` (ADD-only) wiążącą odbiór z voucherem.

## 4. „Moje kody" — endpointy klienta

Suwak `codesNotebook` off → 404 na wszystkich poniższych.

- `GET /api/public/client/codes` → dwie listy:
  - `vouchers`: vouchery klienta (wszystkie rekordy z `deriveClientIds`)
    — kod, kwota pozostała/oryginalna, waluta, status
    (aktywny/wykorzystany/wygasły), `expiresAt`, pochodzenie
    (`origin`: nagroda/polecenie/inne),
  - `notes`: własne wpisy klienta z notatnika (§5).
- Notatnik własnych kodów (nowa tabela, np. `client_saved_codes`:
  `id, tenantId, clientId, code (tekst), note (<=100 znaków),
  isUsed, createdAt`):
  - `POST /api/public/client/codes` `{ code, note? }` — dodanie,
  - `PATCH /api/public/client/codes/:id/use` — przełączenie „wykorzystany",
  - `DELETE /api/public/client/codes/:id` — usunięcie.
  Wszystko tenant-scoped, wyłącznie własne wpisy (cudze → 404).

## 5. Panel

- Ustawienia → Aplikacja dla klientów:
  - sekcja **„Kody rabatowe"** (limity z §2),
  - suwak **„Notatnik kodów"** (`codesNotebook`) — zdjąć z listy
    „wkrótce", podpiąć zapis.
- Moduł Program lojalnościowy → Nagrody: typ voucher (§1).
- Karta klienta: odbiory samoobsługowe widoczne w istniejącej sekcji
  zgłoszeń nagród (status `fulfilled`, oznaczenie „samoobsługa/aplikacja").

## 6. Ekspozycja dla aplikacji

`appFeatures.codesNotebook` dodać do `GET /api/public/book/:salonId`
(obok `loyalty` i `referrals`). W odpowiedzi GET loyalty (§ Etap A)
nagrody typu voucher oznaczyć polem `selfService: true`, żeby aplikacja
wiedziała, że po kliknięciu dostanie kod (a nie zgłoszenie do salonu).

## 7. i18n

Nowe kody komunikatów we WSZYSTKICH 16 językach
(`server/i18n/messages.ts`), m.in.:
- odbiór OK (kod przyznany),
- odmowa limitowa Z DATĄ: wzorzec PL „Następny kod będziesz mógł
  odebrać {{date}}." (bez liczb limitów),
- kod niedostępny/program niedostępny (reużyć istniejące gdzie pasują).

## 8. Bezpieczeństwo

- Wszystkie endpointy klienta za `requireClientAuth`; każde zapytanie
  związane tenantem z tokenu; cudze zasoby → 404.
- Odbiór kodu atomowy (punkty + voucher w jednej transakcji; podwójny
  klik/wyścig nie zdubluje).
- Limity liczone po WSZYSTKICH rekordach klienta (deriveClientIds) —
  nie da się ich obejść logując się w innym salonie sieci.
- Klient nie widzi wartości limitów (tylko datę następnej możliwości).
- Ścieżki Etapu A (nagrody nie-voucherowe) i poleceń — nietknięte.

## 9. Testy / Definition of Done

1. Nagroda voucherowa w katalogu: klient z wystarczającym saldem klika
   odbiór → punkty zdjęte, voucher aktywny przypięty do klienta,
   odpowiedź z kodem, kwotą i ważnością; wpis `fulfilled` na karcie.
2. Drugi odbiór przed upływem `minDaysBetween` → 429 z datą; po zmianie
   limitów w panelu zachowanie się zmienia.
3. `maxPerMonth` wyczerpany → 429 z datą pierwszego dnia następnego
   miesiąca (albo datą wynikającą z odstępu — późniejszą z dwóch).
4. Wyścig dwóch równoczesnych odbiorów → jeden voucher, jedno odjęcie.
5. Nagrody nie-voucherowe → zachowanie Etapu A bez zmian.
6. `GET /client/codes` zwraca vouchery z nagród ORAZ z poleceń; notatnik:
   dodanie/oznaczenie/usunięcie działa, cudzy wpis → 404.
7. Suwak `codesNotebook` off → 404 na §4; `appFeatures.codesNotebook`
   w /book odzwierciedla stan.
8. Realizacja vouchera przy rozliczeniu wizyty w panelu działa jak dla
   każdego innego vouchera (bez zmian w kasie).
9. TypeScript kompiluje; `npm run db:push` wykonalny (ADD-only).
10. Push na gałąź `claude/loyalty-codes-b2`; w raporcie hash commita,
    lista plików, informacja o db:push i o tym, jakiego typu nagrody
    użyto w `loyalty_rewards.rewardType`.
