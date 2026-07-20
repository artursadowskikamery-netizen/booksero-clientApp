# SPEC — Publiczna lista promocji (rabaty czasowe) dla aplikacji

Aplikacja kliencka ma pokazywać klientowi, że salon prowadzi rabaty czasowe
(happy hours) — baner na wizytówce salonu + sekcja „Promocje" w Bonusach.
Dziś reguły rabatów czasowych są dostępne tylko w panelu (staff-auth), a
aplikacja dostaje rabat wyłącznie slot-po-slocie z availability. Trzeba
udostępnić AKTYWNE reguły publicznie, do WYŚWIETLENIA.

Gałąź robocza: odgałęzić od `claude/hej-5yvvly`, nazwa
`claude/public-promotions`. Nie mergować do main. **Bez zmian schematu**
(tabela `time_discounts` już istnieje) — `db:push` niepotrzebny; potwierdzić
w raporcie.

## 0. Zasady

1. Tylko ODCZYT do wyświetlenia; żadnych nowych danych wrażliwych.
2. Widoczne tylko gdy `appFeatures.timeDiscounts` włączone dla tenanta;
   wyłączone → pusta lista (albo brak pola).
3. Tylko reguły `isActive = true` danego salonu.
4. Bez cen konkretnych usług (cena po rabacie liczy availability) — baner
   opisuje REGUŁĘ (dni, godziny, wielkość rabatu, zakres usług).

## 1. Zmiana

Rozszerzyć odpowiedź `GET /api/public/book/:salonId` o pole `promotions`
(obok istniejącego `appFeatures`):

```json
"promotions": [
  {
    "id": "…",
    "name": "Happy hours",
    "daysOfWeek": [3, 5],
    "timeFrom": "11:00",
    "timeTo": "14:00",
    "discountType": "percent",
    "discountValue": 20,
    "allServices": true,
    "serviceIds": null
  }
]
```

- `promotions` obecne tylko gdy `appFeatures.timeDiscounts === true`;
  w przeciwnym razie `[]` (lub pominięte — aplikacja traktuje brak jak puste).
- Zwracać wyłącznie reguły `isActive` tego salonu, posortowane np. po
  `createdAt` rosnąco.
- `allServices` = `serviceIds` jest null/pusty (rabat na wszystkie usługi);
  gdy lista niepusta — `allServices:false` i `serviceIds` z listą
  (aplikacja może pokazać „wybrane usługi").
- `daysOfWeek`: 1=pon..7=nd (konwencja reguł).
- `discountValue`: liczba (procent albo kwota w walucie salonu — walutę
  aplikacja bierze z `salon.currency`).

## 2. Bezpieczeństwo / spójność

- Endpoint publiczny (jak reszta `/book/:salonId`) — bez tokenu.
- Zwracamy tylko pola potrzebne do wyświetlenia (bez pól wewnętrznych
  poza wymienionymi).
- Reguły nieaktywne/suwak off → nie wyciekają.
- Reszta odpowiedzi `/book/:salonId` bez zmian (kompatybilność wstecz —
  dodajemy tylko nowe pole).

## 3. Testy / DoD

1. Suwak `timeDiscounts` on + 1 aktywna reguła → `/book/:salonId` zwraca
   ją w `promotions` z poprawnymi polami.
2. Reguła nieaktywna → nie pojawia się.
3. Suwak off → `promotions: []`.
4. Reguła z wybranymi usługami → `allServices:false` + `serviceIds`.
5. Istniejące pola odpowiedzi `/book/:salonId` niezmienione.
6. TypeScript kompiluje; bez `db:push`.
7. Push na gałąź `claude/public-promotions`; w raporcie hash commita
   i lista zmienionych plików.
