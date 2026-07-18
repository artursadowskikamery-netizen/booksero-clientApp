# booksero-clientApp

Konsumencka aplikacja mobilna (B2C) platformy rezerwacyjnej **Booksero**.

Jedna apka („BookSero") dla wielu salonów — każdy tenant z własnym logo i marką,
którą salon promuje wśród własnych klientów. Multi-tenant, jeden backend
(Booksero), dostarczanie jako PWA (opcjonalnie opakowana w TWA do Google Play).

## Status

🚧 **Faza 1 — szkielet.** Fundament aplikacji postawiony: React + TypeScript + Vite +
Tailwind na froncie, Express BFF proxujący **publiczne API Booksero**, i18n (15 języków,
wykrywanie języka urządzenia + `X-Locale`), tokeny designu (akcent `#0071e3`).
Działa: wejście po `salonId` → ekran salonu (galeria, usługi) z żywego API.

## Uruchomienie

```bash
npm install
# ustaw bazowy URL API Booksero (produkcja/dev):
export BOOKSERO_API_BASE="https://<domena-booksero>"
npm run dev      # dev (Vite + Express), port 5000 (lub $PORT)
npm run build    # produkcja → dist/
npm run start    # serwuje dist/
```

Na Replit: ustaw sekret `BOOKSERO_API_BASE`; `PORT` wstrzykuje Replit.

## Dokumenty

- **[ARCHITEKTURA.md](./ARCHITEKTURA.md)** — pełny blueprint (v2): model produktu,
  tenant + geografia (kraj→miasto→salon), discovery (link/QR/kod/nazwa), i18n,
  akcent `#0071e3`, white-label-teraz-marketplace-później, zweryfikowane luki
  po stronie Booksero, reużycie z VIVI, dostarczanie, roadmapa i decyzje otwarte.
- **[docs/API-KONTRAKT.md](./docs/API-KONTRAKT.md)** — zweryfikowany kontrakt
  publicznego API Booksero (rezerwacja, dostępność, dane salonu, i18n) + luki
  do domknięcia. Oparte na analizie kodu `booksero @ claude/hej-5yvvly`.
- **[docs/TLUMACZENIA-BRIEF.md](./docs/TLUMACZENIA-BRIEF.md)** — brief dla sesji
  tłumaczącej: co, gdzie i jak przetłumaczyć na 15 języków (komunikaty serwera
  Booksero + etykiety aplikacji).
- **Wersja wizualna (artefakt):**
  <https://claude.ai/code/artifact/4388b3d5-a2ba-4e29-b90a-56089551a69f>
  _(prywatny — wymaga zalogowania na konto właściciela)._

## Kluczowe fakty

- **Backend:** Booksero (platforma B2B właściciela). Publiczne API konsumenckie
  **już istnieje** pod `/api/public/book/:salonId`.
- **Prototyp:** `app-vivimassage` — działająca, jednotenantowa wersja tego
  produktu (do reużycia frontendu i funkcji zaangażowania).
- **Nowy jest głównie fundament:** warstwa tenantów, klient HTTP nad API
  Booksero, branding sterowany konfiguracją.

> Repo `app-vivimassage` (produkcja) pozostaje nietknięte — to osobny,
> niezależny projekt.
