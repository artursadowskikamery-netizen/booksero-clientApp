# Kontrakt API Booksero — dla aplikacji BookSero

> Zweryfikowane na kodzie `booksero @ claude/hej-5yvvly` (analiza read-only, 8 wątków).
> Odniesienia `file:line` dotyczą repo `booksero`. Pewność: wysoka.

Aplikacja BookSero konsumuje **publiczne (bez logowania) API** platformy Booksero.
Publiczna powierzchnia to **23 trasy `/api/public/*`** — poniżej podzbiór istotny dla apki.

## 1. Powierzchnia publiczna (konsumencka)

| Metoda | Endpoint | Zwraca / robi | Dowód |
|---|---|---|---|
| GET | `/api/public/book/:salonId` | Dane wizytówki salonu + ustawienia rezerwacji | routes.ts:4801 |
| GET | `/api/public/book/:salonId/categories` | Kategorie usług `{id,name,sortOrder}` | routes.ts:4864 |
| GET | `/api/public/book/:salonId/services` | Usługi `{id,name,description,durationMinutes,price,categoryId,prepaymentEnabled,prepaymentAmount}` | routes.ts:4847 |
| GET | `/api/public/book/:salonId/staff?serviceId=` | Pracownicy dla usługi (wymaga `serviceId`) | routes.ts:4880 |
| GET | `/api/public/book/:salonId/team` | Cały zespół (prezentacja) | routes.ts:4897 |
| GET | `/api/public/book/:salonId/reviews` | Opublikowane opinie (autor zanonimizowany) | routes.ts:4912 |
| GET | `/api/public/book/:salonId/availability` | **Wolne sloty** (patrz §2) | routes.ts:4924 |
| POST | `/api/public/book/:salonId/appointments` | **Utworzenie rezerwacji** (patrz §3) | routes.ts:5100 |
| GET/POST | `/api/public/cancel/:token` | Podgląd / anulowanie wizyty po tokenie | routes.ts:5480,5605 |
| GET | `/api/public/visit/:token` | Dane „Potwierdź wizytę" | routes.ts:5533 |
| POST | `/api/public/visit/:token/confirm` | Potwierdzenie wizyty (booked→confirmed) | routes.ts:5577 |
| GET | `/api/public/s/:slug` | Slug wizytówki → `salonId` | routes.ts:5853 |
| POST | `/api/public/create-checkout-session` | Sesja Stripe Checkout dla przedpłaty | routes.ts:12975 |
| GET | `/api/public/payment-status/:appointmentId` | Status płatności/przedpłaty | routes.ts:13222 |
| GET/POST | `/api/public/review/:token` | Formularz / wystawienie opinii (rate-limit po IP) | routes.ts:16650,16676 |

`:salonId` = wewnętrzny **UUID** (`salons.id`). Alternatywnie `GET /api/public/s/:slug` rozwiązuje slug → salonId.
Wszystkie te trasy są celowo publiczne (brak `requireAuth`); operacje na wizycie chronione **nieodgadywalnym tokenem** w linku (`cancellation_token`, crypto UUID).

## 2. GET availability — kontrakt

**Query (wymagane):** `staffId`, `serviceId`, `date` (format `YYYY-MM-DD`).
Brak któregokolwiek → `400 {message}`. (routes.ts:4926)
**Query (tryb pary, opcjonalne):** `serviceId2` (uruchamia parę), `staffId2` (dom. `"any"`). `staffId="any"` dozwolone tylko w trybie pary.

**Odpowiedź `200`:** **tablica** `{ time: "HH:MM", available: true }` — zawiera **wyłącznie wolne** sloty (pusta `[]`, gdy brak). (routes.ts:5061-5076)
Sloty liczone w **strefie czasowej salonu**; ustawienia: `minAdvanceMinutes` (60), `maxAdvanceDays` (30), `slotIntervalMinutes` (15).

## 3. POST appointments — kontrakt

**Body** (zod `onlineBookingSchema`, routes.ts:5083-5098):

| Pole | Typ | Wymagane |
|---|---|---|
| `serviceId` | string (min 1) | ✅ |
| `staffId` | string (min 1) | ✅ (`"any"` tylko dla pary) |
| `date` | `YYYY-MM-DD` | ✅ |
| `time` | `HH:MM` | ✅ |
| `clientName` | string (1–100) | ✅ |
| `clientPhone` | string | zależnie od ustawień salonu (`requirePhone`) |
| `clientEmail` | email | zależnie od ustawień (`requireEmail`) |
| `notes` | string (≤500) | — |
| `partySize` | int 1–2 | — |
| `serviceId2`, `staffId2`, `secondClientName` | — | tryb pary |

**Odpowiedź `201`:**
`{ id, bookingCode, startAt, endAt, service, staffName, message, prepaymentRequired, prepaymentAmount? }`
(`staffName` = faktycznie przydzielony pracownik — istotne, gdy wybrano „dowolny". `prepaymentAmount` obecne tylko gdy `prepaymentRequired=true`.) (routes.ts:5463-5473)

**Błędy:** `404 {message,code}` brak salonu · `400 {message,errors}` walidacja zod (`errors`=Zod flatten) · `400 {message}` reguły (za wcześnie/za późno/poza godzinami/pracownik nie robi usługi) · `409 {message}` slot zajęty · `409 {code:"RESOURCE_BUSY",message}` brak wolnego zasobu · `500 {message}`.

Przedpłata: po `201` z `prepaymentRequired=true` → `POST /api/public/create-checkout-session` (body `appointmentId`) → Stripe Checkout.

## 4. Dane salonu (`GET /api/public/book/:salonId`)

`salon`: `{ id, name, address, city, postalCode, phone, email, openingHours, logo, currency }`
`profile`: `{ description, gallery, coverImage, mapUrl, socialLinks, theme }`
`settings`: `{ minAdvanceMinutes, maxAdvanceDays, slotIntervalMinutes, allowCancellation, cancellationDeadlineMinutes, requirePhone, requireEmail, welcomeMessage, prepayment* }`
**Waluta jest tu, raz** (`salon.currency`) — usługi zwracają cenę **bez** waluty, więc apka łączy cenę z walutą salonu. (routes.ts:4807, 4850)

## 5. i18n / wielokrajowość

- **15 języków** serwera: `pl,en,de,cs,sv,es,fr,it,hr,el,tr,bg,fi,no,uk`. **Czeski (`cs`) — pełne wsparcie.** **Niderlandzki (`nl`) NIE istnieje** → tenant flamandzki (Belgia) spada na `fr/de/en`. (i18n/messages.ts:10-13)
- Język żądania: nagłówek **`X-Locale`** → `Accept-Language` → `pl`. Publiczne API **jest** zlokalizowane. (routes.ts:695; messages.ts:426-432)
- Apka powinna wysyłać `X-Locale`.

## 6. ⚠️ Luki do domknięcia po stronie Booksero

Trzy rzeczy, których **dziś nie ma**, a apka ich wymaga:

1. **`GET /api/public/tenant/:tenantId`** — marka tenanta + lista jego (aktywnych, nieusuniętych) salonów. **Nie istnieje.** Uwaga wdrożeniowa: nie używać `storage.getSalonsByTenant` wprost (zwraca wszystkie kolumny i usunięte salony) — filtrować `isNull(deletedAt)+isActive` i rzutować na pola publiczne. (routes.ts: brak; storage.ts:1268 ostrzeżenie)

2. **Logowanie konsumenta + endpointy self-service (odczyt)** — **NIE ISTNIEJE**, ale model potwierdzony. Booksero nie ma logowania klienta; SMS-2FA i Google to logowanie **personelu**. Klient widzi dziś tylko **pojedynczą wizytę po tokenie** z linku; „moje wizyty"/„lojalność" są tylko pod `/api/salon/*` (JWT pracownika). **Model docelowy:** klient musi istnieć w Booksero (bez samorejestracji) → **logowanie telefonem (obowiązkowy) + kod SMS** → dopięcie do klienta tenanta (dedup po `globalClientId`). Do zbudowania: (a) logowanie klienta (telefon→SMS), (b) endpointy odczytu (moje wizyty — agregat po tenancie; moje saldo/punkty). **Silnik lojalności już istnieje i jest tenantowy:** `loyalty_programs.crossSalonPoints` domyślnie `true` (wspólne saldo we wszystkich salonach tenanta, po globalnym kliencie); programy/nagrody/transakcje kluczowane po `tenantId`. (auth.ts:45-61; schema.ts:2011-2036,2063-2077)

   **Rezerwacja dla PARY — natywnie w API** (nie jest luką): `availability` przyjmuje `serviceId2`/`staffId2` (blokada wspólnego pokoju); `POST appointments` przyjmuje `partySize=2`, `serviceId2`, `staffId2`, `secondClientName` — serwer dobiera dwóch różnych wolnych pracowników i wspólny pokój. Kreator w apce **musi udostępnić opcję „Zarezerwuj dla pary"**. (routes.ts:4950-5014, 5100-5197)

3. **Taksonomia typu biznesu + geo** (dla przyszłego marketplace) — **brak.** Nie ma pola branży (barber/fryzjer) na tenancie ani salonie; `service_categories` to wolny tekst per salon. Brak współrzędnych geo. Grupowanie możliwe tylko po `country` (ISO2) i `city` (wolny tekst, nullable). → Marketplace-by-type wymaga migracji schematu. (schema.ts:217-283,648-696,1028-1041)
