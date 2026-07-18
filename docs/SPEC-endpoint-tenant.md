# SPEC — endpoint `GET /api/public/tenant/:tenantId` (repo `booksero`)

> Zadanie dla agenta w osobnej sesji. Pracuj w repo **`booksero`**, na **nowej gałęzi**
> (np. `claude/public-tenant-endpoint`). NIE merguj do produkcji — zostaw do rewizji.

## Cel

Publiczny (bez logowania) endpoint zwracający **markę tenanta + listę jego aktywnych
salonów**, pogrupowaną **kraj → miasto → salon**. Konsumuje go aplikacja BookSero
(wybór salonu: kraj → miasto → salon → kalendarz).

## Trasa

- Metoda/ścieżka: **`GET /api/public/tenant/:tenantId`**
- Umieść przy innych `/api/public/*` w `server/routes.ts`.
- **Bez auth** (jak pozostałe `/api/public/*`).

## Logika

1. `storage.getTenant(tenantId)` → marka (name, logo). Brak → **404** `{ message }`.
2. Pobierz salony tego tenanta **tylko aktywne i nieusunięte**
   (`isActive = true` ORAZ `deletedAt IS NULL`).
   ⚠️ **Nie używaj `getSalonsByTenant` wprost** — zwraca wszystkie kolumny i usunięte
   salony. Dodaj metodę filtrującą albo filtruj inline (wzorzec: `getActiveSalonCount`).
3. Rzutuj każdy salon na **wyłącznie pola publiczne** (patrz niżej).
4. Pogrupuj: `country` (ISO2) → `city` → salony. Salony bez `city` wrzuć do jednego
   kubełka (np. `city: ""` lub „Inne").

## Odpowiedź `200` (dokładnie ten kształt — apka go oczekuje)

```json
{
  "id": "tenant-uuid",
  "name": "Aurora Day Spa",
  "logo": "https://…/logo.png",
  "countries": [
    {
      "country": "PL",
      "cities": [
        {
          "city": "Kraków",
          "salons": [
            { "id": "salon-uuid", "name": "Kazimierz", "address": "ul. Józefa 12" }
          ]
        }
      ]
    }
  ]
}
```

- `salons[].id` = `salons.id` (UUID) — to jego przyjmuje reszta API rezerwacji.
- `salons[].address` opcjonalne.

## Zasady bezpieczeństwa (bez wyjątków)

- Endpoint publiczny → zwracaj **tylko** to, co wyżej. Żadnych pól wewnętrznych/finansowych.
- Marka tenanta: **tylko `name` + `logo`**. NIE zwracaj NIP, REGON, danych rozliczeniowych,
  e-maili firmowych itp.
- Żadnych danych pracowników, ustawień, statystyk.
- Tylko salony **aktywne + nieusunięte**.

## Otwarty punkt: logo tenanta

Sprawdź, czy tabela `tenants` ma pole na logo/branding.
- Jeśli **tak** → użyj go.
- Jeśli **nie** → zwróć `logo: null` (albo, jako fallback, logo pierwszego salonu).
  Zaznacz w PR, że tenant-level logo może wymagać osobnego pola (to decyzja właściciela).

## Test (Definition of Done)

- `GET /api/public/tenant/<realny-tenantId>` zwraca JSON w powyższym kształcie.
- W odpowiedzi są **tylko** salony aktywne/nieusunięte danego tenanta.
- Brak pól wewnętrznych/finansowych.
- 404 dla nieistniejącego tenanta.
- `npm run check` przechodzi.
