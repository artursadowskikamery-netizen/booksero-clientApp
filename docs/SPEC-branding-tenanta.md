# SPEC — Branding aplikacji per tenant (repo `booksero`)

> Zadanie dla agenta w osobnej sesji. Pracuj w repo **`booksero`**, na **nowej gałęzi**
> (np. `claude/tenant-app-branding`). NIE merguj do produkcji — zostaw do rewizji.
> Kontekst: aplikacja konsumencka BookSero pozwala tenantowi ustawić własną szatę
> (motyw jasny/ciemny + kolor akcentu, np. złoty zamiast niebieskiego).

## 1. Schemat (shared/schema.ts, tabela `tenants`)

Dodaj dwie kolumny (migracja `npm run db:push`, ADD COLUMN, zero DROP):

- `app_theme` — `text`, nullable. Dozwolone wartości: `'light'` | `'dark'`.
  NULL = domyślny motyw aplikacji (ciemny).
- `app_accent_color` — `text`, nullable. Format `#RRGGBB` (walidacja `/^#[0-9a-f]{6}$/i`).
  NULL = domyślny akcent aplikacji (`#0071e3`).

## 2. Publiczny endpoint tenanta (server/routes.ts)

W istniejącym **`GET /api/public/tenant/:tenantId`** dodaj do odpowiedzi pole:

```json
"branding": { "theme": "dark", "accentColor": "#D4AF37" }
```

- `theme` = `tenants.app_theme` (albo null), `accentColor` = `tenants.app_accent_color` (albo null).
- Gdy oba puste → `"branding": null`.
- Aplikacja BookSero już to konsumuje (pole opcjonalne — zgodne wstecz).

## 3. Panel tenanta — ustawienia (minimalny UI)

W panelu salonu (Ustawienia — poziom **tenanta**, nie salonu) dodaj sekcję
**„Aplikacja BookSero"**:

- Przełącznik motywu: **Ciemny / Jasny** (zapis do `app_theme`).
- Pole koloru akcentu: color-picker lub pole tekstowe `#RRGGBB`
  (walidacja formatu; przycisk „Przywróć domyślny" = NULL).
- Zapis przez istniejący wzorzec ustawień tenanta (auth: admin tenanta).
- i18n etykiet zgodnie z konwencją repo (15 języków, jak inne nowe klucze).

## 4. Zasady

- Kolumny są **na tenancie** (cała sieć = jedna szata), nie na salonie.
- Walidacja serwerowa koloru (`#RRGGBB`) i motywu (`light|dark`) — odrzucaj inne wartości.
- Bez zmian w innych endpointach; bez danych wrażliwych.
- `npm run check` + bramki repo (`check:tenant` itd.) muszą przechodzić.

## 5. Definition of Done

- `GET /api/public/tenant/<id>` zwraca `branding` z ustawionymi wartościami.
- Panel: admin tenanta ustawia motyw i kolor; walidacja działa; „Przywróć domyślny" czyści.
- Tenant bez konfiguracji → `branding: null` (apka używa domyślnej szaty).
- Migracja bez DROP; bramki przechodzą.
