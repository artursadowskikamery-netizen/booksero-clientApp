# Brief tłumaczeniowy — BookSero / Booksero

> Dokument do wręczenia osobnej sesji/agentowi tłumaczącemu. Zawiera **co**, **gdzie**,
> **na jakie języki** i **wg jakich zasad** tłumaczyć. Samowystarczalny.

## 1. Cel

Przetłumaczyć **wszystkie teksty widoczne dla klienta końcowego** na 15 języków
(opcjonalnie +`nl`, patrz §7). Źródłem prawdy jest **polski (`pl`)**; `en` jest już
uzupełniony i może służyć jako druga referencja.

## 2. Dwa zakresy (w DWÓCH repozytoriach)

**Zakres A — komunikaty serwera Booksero** (~387 kodów)
- Repo: **`artursadowskikamery-netizen/booksero`**
- Plik: **`server/i18n/messages.ts`**
- Struktura: każdy kod to obiekt `Record<ServerLocale, string>`, np.:
  ```ts
  "booking.confirmed": { pl: "Rezerwacja potwierdzona", en: "Booking confirmed", de: "…", cs: "…", /* … 15 języków */ },
  ```
- Zadanie: uzupełnić/poprawić brakujące lub słabe tłumaczenia we **wszystkich** kodach.
- Zakres kodów: komunikaty rezerwacji (`booking.*`), walidacji (`validation.*`),
  błędów (`error.*`), lojalności, voucherów, powiadomień. **NIE tłumaczyć** kodów
  wewnętrznych/maszynowych: panel KB CRM operatora, odpowiedzi webhooków Stripe,
  flagi typu `already_fiscalized` (zostają pl/en — patrz `docs/SPEC-i18n-serwer.md` §3).

**Zakres B — etykiety aplikacji BookSero** (UI)
- Repo: **`artursadowskikamery-netizen/booksero-clientApp`** (to repo)
- Plik: **`client/src/lib/i18n.ts`**, obiekt `resources`
- Struktura: i18next, klucze zagnieżdżone (`common.*`, `welcome.*`, …). Dziś wypełnione
  `pl` i `en`. Zadanie: dodać blok `resources.<lang>.translation = { … }` dla każdego
  z pozostałych języków, z **identyczną strukturą kluczy** jak `pl`.

## 3. Języki docelowe (15)

`pl` (źródło), `en`, `de`, `cs`, `sv`, `es`, `fr`, `it`, `hr`, `el`, `tr`, `bg`, `fi`, `no`, `uk`.

## 4. Zasady tłumaczenia (obowiązkowe)

1. **Placeholdery `{{zmienna}}` zostają nietknięte** — dokładnie jak w źródle
   (`{{name}}`, `{{date}}`, `{{count}}`). To interpolacja i18next — zmiana = błąd runtime.
2. **Nazw własnych NIE tłumaczyć:** BookSero, Booksero, Stripe, Google, nazwy salonów.
3. **Ton:** konsumencki, przyjazny, bezpośredni („per Ty"), zwięzły. Dobierz naturalną
   formę grzecznościową dla języka i **trzymaj się jej konsekwentnie** (np. de „du”,
   fr zdecyduj „tu”/„vous” i nie mieszaj).
4. **Długość:** etykiety przycisków muszą być krótkie (mieszczą się w UI). Preferuj
   idiomatyczne sformułowania, nie kalki z polskiego.
5. **Spójność terminologii:** jeden termin na pojęcie w całym języku. Zbuduj krótki
   **glosariusz** kluczowych terminów (rezerwacja, wizyta, salon, specjalista, przedpłata,
   para/2 osoby, punkty/lojalność) i stosuj go wszędzie.
6. **Daty/waluty/liczby:** nie wpisuj formatów na sztywno w tekst — formatuje je apka wg locale.
7. **Frazy prawne/RODO:** tłumacz zachowawczo i wiernie, nie „upiększaj”.
8. **Niepewność:** zamiast zgadywać, oznacz `// TODO review (<lang>)` i zostaw źródło.

## 5. Format wyjścia

- **Zakres A (`messages.ts`):** edytuj wpisy w miejscu — dołóż brakujące języki do każdego
  `Record<ServerLocale, string>`, zachowując klucze i wartości `pl`/`en`. Nie zmieniaj kluczy.
- **Zakres B (`i18n.ts`):** dodaj kompletne bloki `resources.<lang>.translation`
  odpowiadające 1:1 kluczom z `pl`.
- Dostarcz jako **PR do właściwego repo** (osobno A i B).

## 6. Walidacja przed oddaniem

- [ ] Każdy kod/klucz ma komplet **15** (lub 16 z `nl`) języków — brak pustych.
- [ ] Żaden placeholder `{{…}}` nie zgubiony ani nie zmieniony.
- [ ] Kod się kompiluje: `npm run check` (oba repo).
- [ ] Terminologia spójna wg glosariusza.
- [ ] Kody wewnętrzne/maszynowe pominięte (patrz §2, Zakres A).

## 7. Decyzja: dodać `nl` (niderlandzki) — dla Belgii/Flandrii?

Dziś Booksero ma 15 języków **bez `nl`**, więc klient flamandzki spada na fallback
`fr/de/en`. Jeśli Flandria to rynek docelowy → **dodać `nl` jako 16. język**:
1. Rozszerzyć typ `ServerLocale` i `SERVER_LOCALES` w `booksero/server/i18n/messages.ts` o `nl`.
2. Dodać `nl` do `SUPPORTED_LANGS` i `LANG_LABELS` w `booksero-clientApp/client/src/lib/i18n.ts`.
3. Uzupełnić `nl` we wszystkich wpisach obu zakresów.

Jeśli **nie** — zostaje 15, a fallback `fr/de/en` jest akceptowany świadomie.

## 8. Priorytet (gdyby robić etapami)

1. `common.*` i `welcome.*` (Zakres B) — najczęściej widoczne.
2. `booking.*`, `validation.*`, `error.*` (Zakres A) — przepływ rezerwacji.
3. Reszta kodów Zakresu A.
