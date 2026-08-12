# PRZEBIEG rezerwacji dla 2 osób — krok po kroku

Spisane z FAKTYCZNEGO kodu aplikacji klienckiej BookSero
(`client/src/pages/Booking.tsx`, wersja 1.0.23) i z zachowania serwera
Booksero. Dokument ma wystarczyć innemu agentowi do odtworzenia tej samej
mechaniki we własnej aplikacji.

**Adresy:** aplikacja woła własny serwer pośredniczący (`/api/...`), a ten
przekazuje żądania do publicznego API Booksero (`/api/public/book/...`).
Kolumna „Booksero" pokazuje docelowy adres — jeśli budujesz bez własnego
pośrednika, wołaj wprost tę drugą kolumnę.

| aplikacja woła | trafia do Booksero |
|---|---|
| `GET /api/salon/:salonId` | `GET /api/public/book/:salonId` |
| `GET /api/salon/:salonId/services` | `GET /api/public/book/:salonId/services` |
| `GET /api/salon/:salonId/staff?serviceId=` | `.../staff?serviceId=` |
| `GET /api/salon/:salonId/availability?…` | `.../availability?…` |
| `POST /api/salon/:salonId/appointments` | `.../appointments` |

Wszystkie żądania niosą nagłówek `X-Locale` (język klienta). Rezerwacja
dodatkowo `Authorization: Bearer <token klienta>` — dzięki niemu wizyta ma
źródło `app` i podpina się pod konto zalogowanego, bez tworzenia duplikatu.

---

## KROK 0 — warunek wstępny: zalogowany klient

Rezerwacja jest dostępna wyłącznie dla zalogowanego (logowanie kodem SMS).
Ekran rezerwacji sprawdza sesję dla sieci danej lokalizacji i bez niej
przekierowuje na logowanie. Bez tego kroku wizyta nie podepnie się pod
konto i klient nie zobaczy jej w „Moich wizytach".

## KROK 1 — wybór trybu: 1 osoba czy para

Przełącznik u góry ekranu ustawia flagę `couple`. Może też przyjść
z adresu (`?couple=1`) — wtedy ekran otwiera się od razu w trybie pary.

Cała reszta przebiegu jest wspólna; para dokłada tylko drugiego
specjalistę i dane drugiej osoby.

## KROK 2 — wybór usługi

`GET /api/salon/:salonId/services` (+ `…/categories` dla filtra kategorii).
Klient wybiera usługę → zapamiętane jako `serviceId`.

> **OGRANICZENIE OBECNEJ IMPLEMENTACJI:** aplikacja wysyła dla drugiej
> osoby TĘ SAMĄ usługę (`serviceId2 = serviceId`). API Booksero dopuszcza
> RÓŻNE usługi dla obu osób (i o różnym czasie trwania) — jeśli budujesz od
> zera, dodaj drugi wybór usługi i wysyłaj faktyczne `serviceId2`.

## KROK 3 — wybór specjalistów (tu jest cała logika pary)

`GET /api/salon/:salonId/staff?serviceId=<serviceId>` — lista pracowników
wykonujących wybraną usługę.

- tryb 1 osoby: jeden wybór → `staffId`;
- tryb pary: DWA wybory → `staffId` i `staffId2`.

Obie listy mają dodatkową pozycję **„Dowolny"** (wartość `"any"`) —
oznacza „przydzielcie kogokolwiek wolnego".

**Zasada dwóch różnych osób — egzekwowana W INTERFEJSIE:**
- specjalista wybrany dla osoby 1 jest na liście osoby 2 **wyszarzony,
  przekreślony i nieklikalny** (i odwrotnie);
- pozycja **„Dowolny" nigdy nie jest blokowana** — serwer sam dobierze
  wolną, INNĄ osobę;
- gdy klient zmieni wybór osoby 1 na tego samego specjalistę, którego miała
  osoba 2, wybór osoby 2 wraca na „Dowolny" (inaczej ekran dałoby się
  zablokować w stanie nie do naprawienia).

Serwer i tak pilnuje tej reguły (odpowiedź `409`) — blokada w interfejsie
jest po to, żeby klient nie dowiadywał się o błędzie dopiero po
potwierdzeniu rezerwacji.

## KROK 4 — wybór dnia i godziny

Lista 14 dni w przód. Po wybraniu dnia:

```
GET /api/salon/:salonId/availability
    ?serviceId=<u1>&staffId=<p1|any>&date=<RRRR-MM-DD>
    &serviceId2=<u2>&staffId2=<p2|any>          ← tylko przy parze
```

Odpowiedź: lista `{ time, available, discount? }`.

**Przy parze serwer zwraca WYŁĄCZNIE godziny wolne jednocześnie dla:**
obu specjalistów **oraz** wspólnego pokoju o pojemności ≥ 2 przypisanego do
obu usług.

**Pusta lista przy parze to zwykle NIE brak wolnych terminów, tylko brak
takiego pokoju w konfiguracji lokalizacji.** Trzeba pokazać osobny
komunikat („brak wolnych terminów dla dwóch osób"), bo klient inaczej
klika kolejne dni w nieskończoność. Bez `serviceId2` endpoint działa jak
dla jednej osoby.

Pole `discount` niesie rabat czasowy (happy hours) — cenę po rabacie liczy
serwer, aplikacja tylko wyświetla.

## KROK 5 — dane osób

Dane rezerwującego (imię, telefon, e-mail) wypełniają się same z jego konta.

Przy parze dochodzi blok drugiej osoby:

1. **Imię drugiej osoby** — wymagane (`secondClientName`, max 100 znaków).
2. **Przełącznik „Rezerwuję jako niespodziankę"** — domyślnie WYŁĄCZONY.
3. **Telefon drugiej osoby** (`secondClientPhone`) — widoczny tylko przy
   wyłączonej niespodziance; wymagany do potwierdzenia rezerwacji.

**Numer telefonu decyduje o wszystkim, co druga osoba dostanie:**
z numerem serwer zakłada jej kartotekę (punkty, wizyta w jej aplikacji,
prośba o opinię po wizycie, działający kod imienny przy rozliczeniu);
bez numeru zostaje samym imieniem przy wizycie.

**Walidacje w interfejsie:**
- numer w formacie międzynarodowym (E.164, `+48…`) — wybór kraju z flagą,
  domyślnie kraj lokalizacji; przycisk potwierdzenia zablokowany, dopóki
  numer nie jest poprawny;
- ostrzeżenie, gdy numer drugiej osoby = numer rezerwującego (serwer
  potraktowałby to jako tę samą osobę i nie założył drugiej kartoteki).

## KROK 6 — wysłanie rezerwacji

```
POST /api/salon/:salonId/appointments
Authorization: Bearer <token klienta>
```

Treść przy parze:

```json
{
  "serviceId": "…", "staffId": "…|any",
  "date": "2026-08-20", "time": "14:00",
  "clientName": "…", "clientPhone": "+48…", "clientEmail": "",
  "partySize": 2,
  "serviceId2": "…", "staffId2": "…|any",
  "secondClientName": "Jan Kowalski",
  "secondClientPhone": "+48501234567"
}
```

**NAJWAŻNIEJSZA ZASADA CAŁEGO PRZEBIEGU:** przy włączonej niespodziance
klucz `secondClientPhone` **musi zostać POMINIĘTY** — nie wolno wysłać
pustego tekstu. Serwer rozróżnia „brak numeru" (prezent) od „numer pusty"
(śmieć w bazie). W praktyce:

```js
...(surprise || !secondClientPhone ? {} : { secondClientPhone })
```

Bez `partySize: 2` **wszystkie pozostałe pola pary są ignorowane**.

## KROK 7 — co robi serwer (nie dubluj tego u siebie)

- dobiera dwóch RÓŻNYCH pracowników (przy `"any"` sam wybiera); jeśli się
  nie da → `409`;
- sprawdza, czy pracownik wykonuje wybraną usługę → inaczej `400`;
- rezerwuje wspólny pokój dla dwóch osób;
- czas wizyty = **dłuższa** z dwóch usług (nie suma);
- przedpłata = suma przedpłat obu usług, jedna płatność; reguły
  („wymagaj od nowego klienta") liczone są DLA KAŻDEJ OSOBY OSOBNO —
  przy niespodziance druga osoba liczy się jak nowa;
- zakłada/dopina kartotekę drugiej osoby, jeśli podano jej numer;
- **nieprawidłowy numer drugiej osoby NIE blokuje rezerwacji** — wizyta
  powstaje, a para spada do trybu „niespodzianka".

## KROK 8 — odpowiedź 201 i ekran potwierdzenia

```json
{
  "id": "…", "bookingCode": "5YHR76RQ",
  "startAt": "…", "endAt": "…",
  "service": "Koloryzacja", "staffName": "Marta",
  "partySize": 2,
  "secondClientName": "Jan Kowalski",
  "serviceName2": "Manicure hybrydowy",
  "secondClientHasCard": true,
  "prepaymentRequired": true, "prepaymentAmount": "50.00"
}
```

Na ekranie potwierdzenia pokaż **obie osoby i obie usługi**.

**`secondClientHasCard: false` przy WYŁĄCZONEJ niespodziance** = numer nie
doszedł albo był nieprawidłowy → uprzedź, że druga osoba nie zbierze
punktów. Przy WŁĄCZONEJ niespodziance ta sama wartość jest stanem
oczekiwanym — nie pokazuj wtedy ostrzeżenia.

**Godzinę na tym ekranie bierz z terminu WYBRANEGO przez klienta**
(data + godzina z kroku 4), a nie z formatowania `startAt` zegarem
urządzenia — dla lokalizacji w innej strefie czasowej zegar telefonu
pokazałby przesuniętą godzinę.

## KROK 9 — obsługa błędów, których nie da się przewidzieć wcześniej

- **`409`** — nie udało się złożyć dwóch różnych wolnych osób (np. ktoś
  zajął termin w tej samej sekundzie). Komunikat serwera brzmi „termin
  zajęty"; lepiej pokazać „wybierz dwóch różnych specjalistów albo inny
  termin".
- **`400`** — pracownik nie wykonuje tej usługi albo numer nie do
  zinterpretowania (`code: "invalid_phone"`).

## KROK 10 — stan po rezerwacji

`GET /api/public/client/appointments` — obie osoby widzą tę wizytę, ale
**każda ze swojej perspektywy**: własny zabieg i własnego specjalistę
(serwer rozdziela to po `personIndex`).

- **odwołać może wyłącznie rezerwujący**: druga osoba dostaje
  `canCancel: false` i `cancellationToken: null` → ukryj u niej przycisk
  odwołania;
- daty i godziny formatuj wg `salonTimezone` z odpowiedzi (nazwa strefy
  IANA), nie wg zegara telefonu — inaczej klient w innym kraju niż
  lokalizacja zobaczy inną godzinę niż w SMS-ie;
- punkty lojalnościowe nalicza się KAŻDEJ osobie za jej własną usługę,
  ale przychód lokalizacji nie jest podwajany.

**Powiadomienia (stan na 2026-08-12, po decyzji właściciela):**

| zdarzenie | rezerwujący | druga osoba z numerem | niespodzianka |
|---|---|---|---|
| potwierdzenie rezerwacji | tak | tak | nie |
| przypomnienie przed wizytą | tak | nie | nie |
| odwołanie wizyty | tak | nie | nie |
| prośba o opinię po wizycie | tak | tak (własny link) | nie |

---

## Czego brakuje na liście wizyt (znane, zamówione)

Endpoint listy wizyt nie ujawnia dziś, że wizyta jest dla dwóch osób —
nie zwraca `partySize` ani danych osoby towarzyszącej. Z listy nie wynika
więc, że to rezerwacja pary. Zamówione pola: `partySize`,
`companionName`, `companionServiceName`, `companionStaffName` (względne
wobec oglądającego). Szczegóły: `docs/ZAMOWIENIE-para-na-liscie-wizyt.md`.
