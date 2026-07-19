# SPEC — Tryb premiowania akcji w aplikacji: PUNKTY / KODY RABATOWE

Panel Booksero, sekcja „Akcje premiowane" (Ustawienia → Aplikacja dla
klientów). Manager/Admin wybiera JEDEN sposób premiowania klientów za
akcje w aplikacji: **punkty ALBO kody rabatowe** — nigdy miks. Mechanizm
ma być MAKSYMALNIE INTUICYJNY: manager nieznający systemu ma zrozumieć,
co zmienia i co klient dostanie w aplikacji.

Gałąź robocza: odgałęzić od `claude/hej-5yvvly`, nazwa
`claude/reward-mode`. Nie mergować do main. Prawdopodobnie bez zmian
schematu (konfiguracja w `tenants.settings` jsonb) — potwierdzić w
raporcie.

## 0. Zasady nadrzędne (ustalenia właściciela)

1. **Jeden globalny tryb per tenant** (`points` | `codes`) — obowiązuje
   WSZYSTKIE akcje premiowane (dziś: polecenie — nagroda polecającego
   i bonus powitalny poleconego; przyszłe akcje dziedziczą tryb).
2. **Wartości pamiętane OSOBNO dla każdego trybu.** Przełączenie trybu
   NIGDY nie przenosi liczb między walutami (500 pkt nie może stać się
   500 zł). Po przełączeniu pola pokazują wartości zapamiętane dla
   nowego trybu; przy pierwszym użyciu trybu — puste pola do świadomego
   wypełnienia.
3. **Intuicyjny opis** przy każdym elemencie, PEŁNE tłumaczenia
   ×16 języków (§4) — bez polskich fallbacków.
4. Program lojalnościowy (punkty za wizyty, poziomy, nagrody) —
   NIETKNIĘTY, dalej pod własnym suwakiem.
5. Całkowite wyłączenie danej funkcji = istniejące suwaki funkcji
   (bez zmian).

## 1. Model konfiguracji

`tenants.settings.appRewards` (nowy klucz):

```json
{
  "mode": "points",
  "points": { "referrer": 500, "referred": 300 },
  "codes":  { "referrer": 25,  "referred": 10 }
}
```

- Zgodność wstecz: dotychczasowa struktura `settings.referrals`
  (referrerRewardType/Value…) służy jako fallback odczytu przy braku
  `appRewards` (migracja w locie przy pierwszym zapisie). Ścieżki
  naliczania przechodzą na nową strukturę.
- Sanityzacja przy zapisie: mode ∈ {points, codes}; wartości int >= 0.

## 2. Panel — przebudowa sekcji „Akcje premiowane" (UX)

1. **Przełącznik segmentowy** na górze sekcji, duży i oczywisty:
   `[ ⭐ Punkty ] [ 🎟 Kody rabatowe ]` + plakietka aktywnego trybu
   w nagłówku sekcji (np. „Premiowanie: PUNKTY").
2. **Opis aktywnego trybu** (1–2 zdania językiem korzyści klienta):
   - Punkty: „Za akcje w aplikacji klienci otrzymują punkty programu
     lojalnościowego."
   - Kody: „Za akcje w aplikacji klienci otrzymują imienne kody rabatowe
     (obniżają cenę usług; tylko właściciel może je wykorzystać)."
3. **Pola kwot z jednostką NA STAŁE w polu** (sufiks „pkt" albo „zł") —
   osobne wartości per tryb (§0.2). Przy każdej akcji krótki opis, co
   dostaje klient i kiedy, np.:
   - polecający: „Nagroda po pierwszej zakończonej wizycie poleconego",
   - polecony: „Bonus powitalny od razu po rejestracji z polecenia".
4. **Pola „Prefiks kodu" i „Ważność (dni)"** widoczne TYLKO w trybie
   Kody.
5. **Okno potwierdzenia przy zmianie trybu** — po ludzku, z pełnym
   podsumowaniem, np.:
   „Przełączasz premiowanie na KODY RABATOWE. Od teraz: polecający
   otrzyma kod 25 zł, nowy klient z polecenia kod 10 zł (prefiks V25,
   ważność 30 dni). Punkty za akcje nie będą przyznawane. Dotyczy też
   nagród przyznawanych od teraz za wcześniejsze polecenia."
   Zapis dopiero po „Potwierdzam"; „Anuluj" nie zmienia niczego.
6. **Bezpiecznik kwotowy**: kwota kodu > 100 zł → dodatkowe, osobne
   potwierdzenie („Czy na pewno kod o wartości 500 zł?").
7. **Pomoc kontekstowa**: ikona (?) przy nagłówku z pełnym, prostym
   opisem działania obu trybów.
8. **„Po co premiować klientów?" — sekcja korzyści dla managera.**
   Rozwijany panel (albo stały box) na górze sekcji, językiem biznesowym
   (nie technicznym), tłumaczący CEL rozwiązania:
   - **Punkty** budują lojalność i powroty: klient zbiera, awansuje na
     poziomy i wraca, żeby nie „zmarnować" dorobku.
   - **Kody rabatowe** napędzają SZYBKIE rezerwacje: kod ma termin
     ważności (np. 21 dni), więc klient rezerwuje wizytę PRZED jego
     wygaśnięciem — kalendarz zapełnia się teraz, nie „kiedyś".
   - **Polecenia** to najtańszy kanał pozyskania: nowy klient przychodzi
     z rekomendacji, a nagroda należy się dopiero po jego ODBYTEJ
     wizycie — płacisz wyłącznie za realny efekt.
   - **Strategia**: tryb można zmieniać w czasie — np. na co dzień
     delikatne premiowanie punktami (bez „rozpieszczania" klientów),
     a gdy kalendarz wymaga zapełnienia — przełączenie na kody rabatowe:
     klient dostaje namacalny rabat z terminem, który motywuje do
     szybkiej rezerwacji.
   Tekst ma odpowiadać na pytanie „dlaczego warto to włączyć?" — pełne
   tłumaczenia ×16 (§4).

### 2b. Wiedza Sero

Zaktualizować wiedzę asystenta (server/services/assistant.ts — sekcja
o aplikacji klienckiej) tak, aby Sero potrafił:
- wyjaśnić managerowi CEL premiowania w aplikacji (korzyści z §2.8),
- doradzić wybór trybu (punkty = lojalność i powroty; kody = szybkie
  rezerwacje przez termin ważności),
- wytłumaczyć zasady: jeden tryb na raz, wartości osobno per tryb,
  limity wydawania kodów jako zabezpieczenie kosztów.

## 2a. Limity wydawania kodów (per tenant, ukryte przed klientem)

W trybie Kody manager ustala, ile kodów system może wydać JEDNEMU
klientowi (wszystkie akcje łącznie, po zbiorze rekordów osoby —
`deriveClientIds`):

- `maxPerWeek` (int, 0 = bez limitu),
- `maxPerMonth` (int, domyślnie 2; 0 = bez limitu),
- `maxPerYear` (int, 0 = bez limitu),
- `minDaysBetween` (int, domyślnie 10; 0 = bez odstępu) — minimalny
  odstęp od OSTATNIO wydanego kodu (liczony także ponad granicami
  tygodnia/miesiąca).

UI: pola w sekcji „Akcje premiowane" (widoczne tylko w trybie Kody),
z prostym opisem: „Zabezpieczenie kosztów — ile kodów maksymalnie może
otrzymać jeden klient". Sanityzacja przy zapisie (int >= 0).

**Egzekwowanie w `issueRewardCode`** (jedno miejsce dla wszystkich
akcji): przed wydaniem kodu policz kody już wydane tej osobie
(vouchery `personalOnly` z akcji, po `origin`); jeśli limit lub odstęp
blokuje — kod NIE jest wydawany, zdarzenie logowane (konsola +
widoczne w raporcie karty klienta jako pominięte), nagroda NIE jest
zamieniana na punkty (zero miksu trybów). Klient nie widzi żadnych
liczb limitów.

## 3. Naliczanie nagród

- Ścieżki nagród poleceń (§6a/§6b Etapu B) czytają `appRewards`
  W CHWILI PRZYZNANIA nagrody:
  - `mode=points` → `awardLoyaltyBonus` z wartością `points.*`
    (0 = dotychczasowa domyślna stawka programu `bonusReferral` —
    zachować),
  - `mode=codes` → `issueRewardCode` z kwotą `codes.*`
    (0 = brak nagrody; ŻADNEGO fallbacku do punktów).
- `GET/PUT /api/tenant/app-features` rozszerzyć o `appRewards`
  (sanityzacja wspólna z odczytem naliczania).

## 4. i18n — WYMÓG KRYTYCZNY (16 języków, bez fallbacków)

Wszystkie nowe teksty panelu z §2 (przełącznik, opisy trybów, opisy
akcji, sufiksy, okno potwierdzenia, ostrzeżenie kwotowe, pomoc) mają
mieć PEŁNE tłumaczenia w plikach `client/src/i18n/locales/*.json`
dla wszystkich 16 języków: pl, en, de, nl, cs, sv, es, fr, it, hr,
el, tr, bg, fi, no, uk. Zakaz zostawiania kluczy działających tylko
polskim defaultem. Teksty pisać prosto — dla managera nietechnicznego.

## 5. Bez zmian

Mechanika poleceń (poza odczytem konfiguracji), kasa i imienność kodów,
program lojalnościowy, suwaki funkcji, aplikacja kliencka (żadnych
nowych endpointów dla appki).

## 6. Testy / Definition of Done

1. Tryb Punkty: skuteczne polecenie → punkty wg wartości trybu
   punktowego; polecony → bonus punktowy.
2. Tryb Kody: → kod imienny wg wartości trybu kodowego (prefiks,
   ważność); polecony → kod powitalny.
3. Przełączanie trybów tam i z powrotem: wartości każdego trybu
   zapamiętane, liczby NIGDY nie przechodzą między walutami.
4. Okno potwierdzenia pokazuje realne kwoty i tryb; „Anuluj" nie
   zapisuje.
5. Kod > 100 zł wymaga drugiego potwierdzenia.
6. Zmiana trybu działa na nagrody przyznawane PO zmianie (także za
   polecenia sprzed zmiany) — zgodnie z treścią okna.
6a. Limity kodów: przekroczony `maxPerMonth`/`minDaysBetween` itd. →
   kod NIE wydany (bez zamiany na punkty), wpis w logu; po upływie
   ograniczenia kolejna akcja wydaje kod normalnie. Limity liczone po
   wszystkich rekordach osoby (nie do obejścia innym salonem sieci).
7. Stary zapis `settings.referrals` czytany poprawnie jako fallback
   (istniejący tenant nie traci konfiguracji po wdrożeniu).
7a. Sekcja „Po co premiować klientów?" widoczna w panelu z treścią
   korzyści (§2.8); Sero odpowiada sensownie na pytania „po co mi tryb
   premiowania?" i „punkty czy kody?" (§2b).
8. Audyt i18n: nowe klucze przetłumaczone we WSZYSTKICH 16 plikach
   locale (zero pustych/kopii polskiego w innych językach).
9. TypeScript kompiluje; informacja czy db:push potrzebny (raczej nie).
10. Push na gałąź `claude/reward-mode`; w raporcie hash commita i lista
    zmienionych plików.
