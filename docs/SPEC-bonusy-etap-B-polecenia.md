# SPEC — Bonusy Etap B: Polecenia SMS (pierwsza „akcja premiowana")

Aplikacja kliencka BookSero dostaje pod-zakładkę **Polecaj** w Bonusach.
Zalogowany klient poleca aplikację znajomemu SMS-em; gdy znajomy okaże się
NOWYM klientem i odbędzie pierwszą wizytę, polecający dostaje nagrodę.
To pierwsza z „akcji premiowanych" — konfigurowanych per tenant w panelu.

Gałąź robocza: odgałęzić od `claude/hej-5yvvly` (jedyne źródło prawdy o
produkcji), nazwa `claude/loyalty-referrals-b`. Nie mergować do main.
Wykorzystać istniejący silnik lojalnościowy (`awardLoyaltyBonus`,
`bonusReferral`, punkty klienta) oraz istniejącą wysyłkę SMS z puli tenanta
(`sendNotificationSms`, jak kody logowania). Zmiany schematu dozwolone
(będzie `db:push`).

## 0. Zasady nadrzędne (ustalenia właściciela)

1. **Wyzwalacz nagrody polecającego**: pierwsza **ZAKOŃCZONA** wizyta
   poleconego (status `completed`) — nie sama rezerwacja.
2. **Tylko nowy klient**: polecony liczy się, gdy przed poleceniem NIE
   istniał jako klient w tym tenancie (brak konta/wizyt). Istniejący numer
   → brak nagrody (ale bez ujawniania tego polecającemu).
3. **Obaj nagradzani**: polecający dostaje nagrodę za polecenie; polecony
   dostaje bonus powitalny za dołączenie przez link polecający.
4. **Forma nagrody per tenant**: punkty ALBO kod rabatowy (kwoty ustala
   marketing, np. 10/20/25/30/50 zł) — osobno dla polecającego i poleconego.
5. **Nagroda odroczona** → aplikacja pokazuje STATUSY poleceń.
6. **Suwak per tenant** (`appFeatures.referrals`) — wyłączony = brak funkcji
   w aplikacji i 404 na endpointach.
7. SMS z **puli tenanta**, **nazwą nadawcy tenanta**; link prowadzi do
   aplikacji tej sieci z kodem polecającego.

## 1. Suwak funkcji

Klucz `referrals` w `tenants.settings.appFeatures` (stub już istnieje
z SPEC-panel-zakladka-aplikacja). Włączenie w panelu: Ustawienia → Aplikacja
→ sekcja „Akcje premiowane" (patrz §9). `appFeatures.referrals` dodać do
odpowiedzi `GET /api/public/book/:salonId` (obok `loyalty`).

## 2. Konfiguracja nagród (per tenant)

Nowa konfiguracja (nowa tabela `referral_settings` albo w
`tenants.settings.referrals` — wybrać spójnie z kodem):

- `referrerRewardType`: `"points" | "code"`,
- `referrerRewardValue`: liczba (punkty) lub kwota rabatu,
- `referredRewardType`: `"points" | "code"`,
- `referredRewardValue`: liczba lub kwota,
- (limity stałe w kodzie — §7 — nie konfigurowalne w Etapie B).

Konfiguracja w panelu pod uprawnieniem ustawień (Admin/Menedżer).

## 3. Model danych — polecenia

Nowa tabela `referrals`:
`id, tenantId, referrerClientId, referredPhone (onlyDigits),
referredClientId (nullable), status ('sent'|'joined'|'rewarded'|'expired'),
sentAt, joinedAt, rewardedAt, createdAt`.

- `referrerClientId` = rekord główny polecającego (z deriveClientIds).
- Attribution nie może przekroczyć tenanta.

## 4. Wysłanie polecenia

`POST /api/public/client/referrals` (requireClientAuth), body `{ phone }`:

- suwak wyłączony → 404.
- Walidacja: `onlyDigits(phone)` długość >= 6, inaczej 400.
- **Nie do siebie**: numer == numer polecającego → 400
  (`referrals.selfNotAllowed`).
- **Limit 5/miesiąc** na polecającego (licząc `sent`+`joined`+`rewarded`
  z bieżącego miesiąca) → 429 (`referrals.monthlyLimit`).
- **Bez duplikatu w miesiącu**: ten sam polecający + ten sam numer w tym
  miesiącu → 409 (`referrals.alreadySent`).
- Utworzyć wiersz `referrals` (status `sent`).
- Wysłać SMS przez `sendNotificationSms` (koszt: pula tenanta, `bulk:true`,
  nazwa nadawcy tenanta). Treść z i18n (§8): imię polecającego + link
  `<APP_CLIENT_URL>/t/<tenantId>?ref=<referrerClientId>`
  (APP_CLIENT_URL — ta sama stała co w panelu, SPEC-panel §2).
- Odpowiedź: `{ ok:true, sent:<ile w tym mies.>, remaining:<do 5> }`.
- UWAGA: NIE sprawdzamy tu, czy numer to istniejący klient (żeby nie
  ujawniać bazy). „Tylko nowy klient" egzekwujemy przy attribution (§5).

## 5. Attribution (kto kogo polecił)

Kod polecającego wędruje w linku `?ref=<referrerClientId>`. Aplikacja
zapamiętuje `ref` i przekazuje go przy REJESTRACJI nowego klienta
(rozszerzyć istniejący `POST /api/public/client-auth/verify` o opcjonalne
pole `referralCode`).

Przy tworzeniu NOWEGO klienta (ścieżka auto-rejestracji, gdy `referralCode`
podany i wskazuje ważnego klienta tego tenanta):

- ustawić `clients.referredBy = referralCode` (pole już istnieje w schemacie),
- odszukać/utworzyć wiersz `referrals` dla (referrer, phone) i ustawić
  `status='joined'`, `referredClientId`, `joinedAt`,
- **bonus powitalny poleconego** przyznać TERAZ (§6a).

Zasada „tylko nowy klient": attribution zachodzi WYŁĄCZNIE gdy klient jest
świeżo tworzony przez auto-rejestrację. Jeśli numer logował się do
istniejącego konta (klient już był) — brak attribution i brak nagród.

Self-referral guard także tutaj: `referralCode` == tworzony klient → ignoruj.

## 6. Naliczanie nagród

### 6a. Polecony — bonus powitalny (przy dołączeniu, §5)

- `referredRewardType="points"` → naliczyć `referredRewardValue` punktów
  istniejącą ścieżką (np. `awardLoyaltyBonus`/dodanie punktów, z opisem
  „Bonus powitalny z polecenia").
- `referredRewardType="code"` → wygenerować kod rabatowy o wartości
  `referredRewardValue` istniejącym mechanizmem kodów/voucherów Booksero
  (reużyć, nie budować nowego; w raporcie podać, którego użyto).
- Idempotencja: jeden bonus powitalny na klienta.

### 6b. Polecający — nagroda za skuteczne polecenie

Wyzwalacz: gdy wizyta poleconego (referredClientId) osiąga status
`completed` i to JEGO pierwsza zakończona wizyta oraz powiązane
`referrals.status='joined'`:

- ustawić `referrals.status='rewarded'`, `rewardedAt`,
- `referrerRewardType="points"` → naliczyć `referrerRewardValue` punktów
  polecającemu (`bonusReferral` może być domyślną wartością, ale nadrzędna
  jest konfiguracja §2),
- `referrerRewardType="code"` → wygenerować kod rabatowy polecającemu.
- Idempotencja: jedna nagroda na wiersz `referrals`.

Wyzwalacz podpiąć w istniejące miejsce zmiany statusu wizyty na `completed`
(hook/serwis wizyt) — nie duplikować logiki statusów.

## 7. Limity (stałe w Etapie B)

- 5 poleceń / miesiąc / polecający,
- brak self-referral,
- brak duplikatu numeru w miesiącu (per polecający).

## 8. i18n

Nowe kody (16 języków w `server/i18n/messages.ts`):
- `referrals.smsText` — treść SMS: `„{{name}} poleca Ci aplikację —
  zainstaluj: {{link}}"` (wzorzec PL; sensowne tłumaczenia we wszystkich 16),
- `referrals.selfNotAllowed`, `referrals.monthlyLimit`,
  `referrals.alreadySent`, `referrals.programUnavailable`.
Teksty pod-zakładki „Polecaj" w aplikacji dostarczy repo klienta osobno.

## 9. Panel — konfiguracja i podgląd

- Ustawienia → Aplikacja → sekcja **„Akcje premiowane"**: pozycja
  **Polecenia** — suwak (`appFeatures.referrals`) + pola nagród (§2:
  typ+wartość dla polecającego i poleconego).
- Karta klienta: sekcja **„Polecenia"** (informacyjnie) — ile wysłał,
  ilu poleconych dołączyło/zrealizowało wizytę. Tylko odczyt.

## 10. Endpoint listy dla aplikacji

`GET /api/public/client/referrals` (requireClientAuth; suwak off → 404):
```json
{
  "sentThisMonth": 2, "monthlyLimit": 5,
  "items": [
    { "id":"...", "phoneMasked":"+48 •••  •• 67", "status":"joined",
      "sentAt":"...", "rewardGranted": false }
  ]
}
```
- Numery MASKOWANE (nie zwracać pełnego numeru poleconego).
- `status`: `sent|joined|rewarded|expired` → aplikacja mapuje na etykiety
  „Zaproszenie wysłane / Znajomy dołączył / Nagroda przyznana".

## 11. Bezpieczeństwo

- Wszystkie publiczne endpointy za `requireClientAuth`; każde zapytanie
  związane tenantem z tokenu.
- Brak ujawniania, czy numer jest już klientem (§4).
- Numery poleconych maskowane w odpowiedziach (§10).
- Kody rabatowe/punkty naliczane WYŁĄCZNIE przez istniejące, zaudytowane
  ścieżki; nagrody idempotentne.
- `requireAuth` (staff), client-auth, booking, loyalty (Etap A) —
  nietknięte poza rozszerzeniem verify o `referralCode` (§5) i hookiem
  `completed` (§6b).

## 12. Testy / Definition of Done

1. Suwak off → `appFeatures.referrals:false`, endpointy referrals 404.
2. Wyślij polecenie → wiersz `sent`, SMS z puli tenanta z nazwą nadawcy
   tenanta i linkiem z `ref`; licznik miesięczny rośnie.
3. Self-referral → 400; 6. próba w miesiącu → 429; duplikat numeru → 409.
4. Nowy klient wchodzi z linku `?ref=` i rejestruje się → `referredBy`
   ustawione, `referrals`→`joined`, bonus powitalny poleconego naliczony
   (punkty lub kod wg konfiguracji).
5. Numer, który JUŻ był klientem, loguje się z linku → brak attribution,
   brak nagród.
6. Pierwsza wizyta poleconego → `completed` → nagroda polecającego
   naliczona raz, `referrals`→`rewarded`; kolejne wizyty nie dublują.
7. `GET /client/referrals` zwraca statusy i maskowane numery.
8. Panel: konfiguracja nagród zapisuje się; karta klienta pokazuje polecenia.
9. TypeScript kompiluje; `npm run db:push` wykonalny (ADD-only).
10. Push na gałąź `claude/loyalty-referrals-b`; w raporcie hash commita,
    lista plików, informacja o `db:push` (tak) i którego mechanizmu kodów
    rabatowych użyto.
