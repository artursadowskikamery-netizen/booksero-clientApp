# SPEC — Logowanie klienta kodem SMS + moje wizyty (repo `booksero`)

> Zadanie dla agenta w osobnej sesji. Pracuj w repo **`booksero`**, na **nowej gałęzi**
> `claude/client-auth-sms`. NIE merguj do main — wypchnij gałąź na GitHub do rewizji.
> Kontekst: aplikacja konsumencka BookSero (osobne repo) już konsumuje te endpointy
> przez swój BFF z nagłówkiem `Authorization: Bearer <token>`.

## 0. Model (decyzje właściciela — nie zmieniać)

- Klient **musi już istnieć** w Booksero (założony/zaimportowany przez salon). **Brak samorejestracji.**
- Logowanie: **numer telefonu → kod SMS → sesja**. Klient bez numeru nie zaloguje się.
- Dopasowanie w ramach **TENANTA** (po wszystkich jego salonach). Jeśli rekordy mają
  `globalClientId` — unifikuj (sesja obejmuje wszystkie rekordy tej osoby w tenancie).
- Rezerwacja pozostaje anonimowa — logowanie służy tylko self-service (wizyty, potem bonusy).

## 1. Schemat (shared/schema.ts) — migracja ADD-only, `db:push`

Tabela **`client_auth_codes`**:
`id` uuid PK · `tenant_id` varchar notNull · `phone` text notNull (tylko cyfry) ·
`code_hash` text notNull · `expires_at` timestamp notNull · `attempts` integer notNull default 0 ·
`created_at` timestamp default now. Index na (tenant_id, phone).

## 2. Endpointy publiczne

### POST `/api/public/client-auth/request-code`
Body: `{ tenantId, phone }`.
- Normalizacja telefonu: same cyfry. Dopasowanie klientów tenanta (`is_active=true`):
  cyfry równe LUB końcowe 9 cyfr równe.
- **Rate limit:** max 3 kody / 10 min na (tenant+telefon) + limit po IP (wzorzec `checkReviewRateLimit`).
- Brak klienta → **404** `{ message }` (i18n `clientAuth.notFound` — „Nie znaleziono klienta
  z tym numerem — skontaktuj się z salonem.").
- Jest → kod **6 cyfr** (crypto), zapis **hasha** z `expires_at = now()+10 min`,
  wysyłka SMS **istniejącym mechanizmem SMS Booksero**. Treść: i18n `clientAuth.smsText`
  („Twój kod logowania BookSero: {{code}}"), język wg locale salonu/tenanta.
  **Koszt: portfel SMS tenanta** (domyślna decyzja — zaznacz w PR, łatwo zmienić).
- 200 `{ ok: true }`.

### POST `/api/public/client-auth/verify`
Body: `{ tenantId, phone, code }`.
- Najnowszy niewygasły kod; zły kod → `attempts+1`, **max 5 prób** → kod unieważniony
  (i18n `clientAuth.invalidCode` / `clientAuth.codeExpired` / `clientAuth.tooMany`).
- Sukces → usuń kod, zbierz `clientIds` (dopasowani klienci tenanta + wszyscy z tym samym
  `globalClientId`), wystaw **JWT**: `{ aud: "client", tenantId, clientIds, phone }`, exp **90 dni**.
- **Izolacja tokenów (krytyczne):** osobny middleware `requireClientAuth` (wymaga `aud==="client"`).
  `requireAuth` personelu MUSI odrzucać tokeny klienta i odwrotnie — dodaj jawny test/sprawdzenie.
- 200 `{ token, client: { name, phone } }`.

### GET `/api/public/client/me` (Bearer klient)
→ `{ name, phone, tenantId, salons: [{ id, name }] }` (salony tenanta, w których klient ma rekord).

### GET `/api/public/client/appointments` (Bearer klient)
Query: `scope=upcoming|past|all` (domyślnie all), `limit` (domyślnie 50).
→ wizyty wszystkich `clientIds` we wszystkich salonach tenanta, sort `startAt` malejąco:
`[{ id, bookingCode, startAt, endAt, status, serviceName, staffName, salonId, salonName, cancellationToken }]`
- `cancellationToken` TYLKO dla wizyt przyszłych ze statusem booked/confirmed — apka użyje
  **istniejących** `/api/public/cancel/:token` i `/api/public/visit/:token/confirm`.

### Rozszerzenie: GET `/api/public/book/:salonId`
W obiekcie `salon` dodaj pole **`tenantId`** (apka potrzebuje go do logowania w kontekście
tenanta; to identyfikator, nie dana wrażliwa).

## 3. Bezpieczeństwo (bez wyjątków)

- Kody jednorazowe, hashowane, expiry 10 min, max 5 prób; rate limiting na oba endpointy.
- Odpowiedzi zawierają WYŁĄCZNIE pola wymienione wyżej — żadnych danych innych klientów,
  sald, notatek, PESEL itd.
- Token klienta nie działa na `/api/salon/*` i `/api/tenant/*` (test w DoD).

## 4. i18n — `server/i18n/messages.ts` (16 języków, z nl)

`clientAuth.notFound`, `clientAuth.invalidCode`, `clientAuth.codeExpired`,
`clientAuth.tooMany`, `clientAuth.smsText` (z `{{code}}` — placeholder nietykalny).

## 5. Definition of Done

- Happy path: request-code wysyła SMS realnym mechanizmem; verify zwraca token;
  me + appointments zwracają dane zalogowanego klienta.
- Złe kody/limity odrzucane; token klienta odrzucany na endpointach personelu (i odwrotnie).
- `GET /api/public/book/:salonId` zwraca `tenantId`.
- Migracja ADD-only; `npm run check` + bramki repo zielone.
- Gałąź `claude/client-auth-sms` wypchnięta na GitHub, bez merge.
