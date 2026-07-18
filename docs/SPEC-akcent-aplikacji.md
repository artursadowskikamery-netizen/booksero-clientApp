# SPEC — Kolor akcentu aplikacji BookSero per salon (repo `booksero`)

> Zadanie dla agenta w osobnej sesji. Pracuj w repo **`booksero`**, na **nowej gałęzi**
> (np. `claude/app-accent-color`). NIE merguj do produkcji — zostaw do rewizji.
> Kontekst: aplikacja konsumencka BookSero jest ZAWSZE ciemna; salon wybiera tylko
> **kolor akcentu** (guziki „Rezerwuj" itd.) z gotowej palety. Apka już to konsumuje.

## 1. Schemat (shared/schema.ts, tabela `salon_profiles`)

Dodaj kolumnę (migracja `npm run db:push`, ADD COLUMN, zero DROP):

- `app_accent` — `text`, nullable. Wartość: **nazwa z palety** (patrz §3).
  NULL = domyślny akcent aplikacji (niebieski).

## 2. Publiczny endpoint salonu (server/routes.ts)

W istniejącym **`GET /api/public/book/:salonId`**, w obiekcie `profile`, dodaj pole:

```json
"appAccent": "gold"
```

(= `salon_profiles.app_accent`, albo `null`). Pole opcjonalne — zgodne wstecz.

## 3. Paleta (jedyne dozwolone wartości — walidacja serwerowa)

| klucz | hex | | klucz | hex |
|---|---|---|---|---|
| `blue` | #0A84FF | | `red` | #E05252 |
| `gold` | #C9A24B | | `sky` | #38A3DD |
| `rose` | #E0518D | | `lime` | #9BBF3B |
| `violet` | #8B5CF6 | | `copper` | #C98A5B |
| `green` | #4C9A66 | | `silver` | #C7CCD1 |
| `teal` | #2AA6A0 | | `orange` | #E8853D |

Kolory są dobrane pod czytelność na ciemnym tle — **nie dodawaj color-pickera
dowolnego koloru**. Zapis wartości spoza listy → 400.

## 4. Panel salonu — UI

W panelu, w **Profilu wizytówki** (obok „Szablon wizytówki"), dodaj sekcję
**„Kolor aplikacji BookSero"**:

- Siatka 12 kółek w kolorach palety (klik = wybór, zaznaczenie aktywnego).
- Przycisk „Domyślny" = NULL (niebieski).
- Krótki opis: „Kolor przycisków w aplikacji mobilnej BookSero."
- Zapis istniejącym wzorcem zapisu profilu (auth jak reszta profilu).
- i18n etykiet zgodnie z konwencją repo (15 języków).

## 5. Definition of Done

- `GET /api/public/book/<salonId>` zwraca `profile.appAccent` po ustawieniu w panelu.
- Wartości spoza palety odrzucane (400); „Domyślny" zapisuje NULL.
- Migracja bez DROP; `npm run check` + bramki repo przechodzą.
