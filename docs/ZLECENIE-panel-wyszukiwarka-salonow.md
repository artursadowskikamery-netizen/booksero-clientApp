# ZLECENIE dla agenta panelu — wyszukiwarka salonów dla aplikacji klienckiej

Decyzja właściciela 2026-09-04. Powód: ekran startowy aplikacji ma pole
„UUID salonu lub slug wizytówki" — język programisty, którego klientka nie zna.
Ma być jedno pole, w które klientka wpisuje cokolwiek wie o salonie (nazwę,
miasto, ulicę, nazwę sieci, skrót), a aplikacja pokazuje pasujące salony do
wyboru. Stronę aplikacji robi sesja aplikacji; **tu jest strona panelu**.

---

## 1. Punkt publiczny

`GET /api/public/salons/search?q=<tekst>&limit=<n>`

- Bez logowania (aplikacja woła go przez własny serwer, jak resztę `/api/public`).
- `q` krótsze niż **3 znaki** po normalizacji → `{ items: [] }`, bez błędu.
- `limit` domyślnie 20, maks. 50.
- Odpowiedź:

```json
{ "items": [ {
  "salonId": "…", "name": "VIVIMassage Żory", "city": "Żory",
  "street": "Promienna 12", "logo": "…|null", "slug": "vivimassage-zory",
  "tenantId": "…", "tenantName": "VIVIEstetic Sp. z o.o.",
  "score": 45
} ] }
```

Tylko dane publiczne — te same, które są na wizytówce. Żadnych telefonów,
e-maili, statystyk.

## 2. Kto jest w wynikach

Lokalizacja trafia do wyników, gdy WSZYSTKIE warunki są spełnione:
- aktywna, nieusunięta, sieć aktywna;
- ma **włączoną aplikację kliencką** (skoro chce klientów w aplikacji, chce
  być znaleziona);
- **`discoverableInApp === true`** — NOWE pole lokalizacji, domyślnie `true`.

Przełącznik w panelu: Ustawienia lokalizacji, obok ustawień aplikacji/wyglądu:
**„Widoczny w wyszukiwarce aplikacji BookSero"** z opisem: *„Wyłącz, jeśli
klienci mają trafiać do Ciebie wyłącznie przez kod QR lub link."*
Bez tego przełącznika wyszukiwarka byłaby publicznym katalogiem klientów
Booksero, którego nie każdy chce.

## 3. Dopasowanie — reguły, które załatwiają przykłady właściciela

**Normalizacja** (zapytania i danych): małe litery, bez diakrytyków
(ż→z, ó→o, ä→a…), bez interpunkcji, wielokrotne spacje → jedna.
Zapytanie dzielimy na słowa; **każde słowo punktowane osobno**, wynik
lokalizacji = suma. Lokalizacja bez żadnego trafienia odpada.

**Pola dopasowania** (znormalizowane): nazwa salonu, **nazwa sieci
(tenanta)**, miasto, ulica, adres wizytówki (slug), inicjały nazwy salonu
i sieci (pierwsze litery słów: „Beauty Aesthetic" → „ba").

**Punkty za jedno słowo zapytania:**

| trafienie | pkt |
|---|---|
| słowo == slug w całości | 100 |
| początek słowa w nazwie salonu | 30 |
| początek słowa w nazwie sieci | 25 |
| słowo == inicjały (lub ich początek, min. 2 litery) | 20 |
| początek słowa w mieście | 15 |
| początek słowa w ulicy | 15 |
| **podobieństwo trigramowe ≥ 0,4** do dowolnego słowa nazwy salonu/sieci | 10 |
| podobieństwo trigramowe ≥ 0,4 do miasta/ulicy | 5 |

Za jedno słowo liczymy tylko NAJWYŻSZE trafienie (nie sumujemy prefiksu
i trigramu dla tego samego słowa). Sortowanie: `score` malejąco, potem nazwa
rosnąco.

**Trigramy są obowiązkowe** — to one dają tolerancję pisowni. Bez nich
„esthetic" nie trafi w „VIVIEstetic", a „masaz" w „Massage". Implementacja
w JS jest prosta: zbiór trójek liter z dopełnieniem spacjami, podobieństwo
= |A∩B| / |A∪B|. Nie potrzeba rozszerzeń Postgresa.

**Wydajność:** lokalizacji są setki, nie miliony. Najprościej i najstabilniej:
trzymać w pamięci listę widocznych lokalizacji ze znormalizowanymi polami,
odświeżaną co 60 s (lub przy zmianie profilu/przełącznika), i punktować w JS.
Żadnych nowych indeksów ani migracji poza jednym polem `discoverableInApp`.

**Ochrona:** limit zapytań na IP (np. 60/min) — punkt jest publiczny.

## 4. Przykłady, które MUSZĄ przejść (to są testy)

| zapytanie | oczekiwany wynik |
|---|---|
| `vivi` | obie lokalizacje VIVIMassage (prefiks nazwy) |
| `zory` i `Żory` | wszystkie widoczne salony w Żorach |
| `promienna` | salony przy tej ulicy |
| `esthetic` | obie lokalizacje sieci VIVIEstetic (trigram do nazwy sieci) |
| `vivi masaz zory` | obie lokalizacje, **Żory pierwsze** (vivi→nazwa + zory→miasto > vivi→nazwa) |
| `ba` | „Beauty Aesthetic" (inicjały) |
| `vi` | `[]` (za krótkie) |
| lokalizacja z `discoverableInApp=false` | nigdy w wynikach, nawet przy dokładnej nazwie |
| lokalizacja bez włączonej aplikacji | nigdy w wynikach |

Plik testu np. `server/wyszukiwarka-salonow-aplikacja.test.ts` — z osobną
funkcją punktującą, testowaną bez bazy (czysta funkcja: dane + zapytanie →
lista z punktami).

## 5. Sero — jedno zdanie do wiedzy

„Klientka może znaleźć salon w aplikacji BookSero, wpisując nazwę, miasto,
ulicę lub nazwę sieci — bez kodu QR. Lokalizacja jest w wyszukiwarce domyślnie;
wyłącza się to w ustawieniach lokalizacji przełącznikiem „Widoczny
w wyszukiwarce aplikacji BookSero"." Dołożyć strażnik w teście, wzorem
`para-dwie-kartoteki.test.ts`.

## 6. Czego NIE robić

- Nie dodawać ocen, rankingów, promowanych pozycji. Kolejność wynika tylko
  z dopasowania. To ma być wejście do salonu, nie katalog.
- Nie zwracać lokalizacji spoza reguł z §2 „dla wygody".
- Nie wymagać logowania — klientka szuka, ZANIM ma konto w tej sieci.
