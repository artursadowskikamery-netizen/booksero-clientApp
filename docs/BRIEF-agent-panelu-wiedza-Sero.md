# BRIEF dla agenta sesji PANELU (KNOWLEDGE BOOKSERO)

Trzy sprawy: (1) PILNE — cicha utrata danych, (2) moje commity na Twojej
gałęzi, (3) czego Sero ma się jeszcze nauczyć.

---

## 1. PILNE — zapis koloru aplikacji KASOWAŁ zdjęcie okładkowe wizytówki

**Przyczyna (naprawiona u źródła, commit d91840b8 na claude/hej-5yvvly):**
`PUT /api/salon/app-accent` (routes.ts ~11456) woła `upsertSalonProfile`
z samym `appAccent`. Gałąź UPDATE w `storage.upsertSalonProfile` miała
`coverImage: data.coverImage ?? null` — czyli przy KAŻDYM zapisie koloru
zamieniała brak wartości na `null` i **kasowała okładkę**. Pozostałe pola
(`description`, `gallery`, `mapUrl`, `socialLinks`) były bezpieczne, bo
Drizzle pomija `undefined` — problem dotyczył WYŁĄCZNIE `coverImage`,
który był jawnie konwertowany na `null`.

**Dowód z produkcji:** salon VIVIMassage Żory
(`2c4a824a-3c65-436d-b6ed-1fd13c0d1379`) ma dziś `profile.coverImage: null`
przy 9 zdjęciach w galerii — okładka zniknęła w trakcie testów kolorów.

**Do zrobienia po Twojej stronie:**
1. Ustalić SKALĘ: ilu tenantów/lokalizacji ma `coverImage IS NULL` przy
   niepustej `gallery` — to kandydaci na ofiary tego błędu.
2. Zdecydować i wykonać odtworzenie danych, jeśli jest z czego (kopia
   zapasowa bazy / historia). Jeśli nie ma — poinformować właściciela,
   że okładki trzeba wgrać ponownie w edytorze wizytówki.
3. Bezpiecznik na przyszłość: rozważyć, czy `upsertSalonProfile` nie
   powinna przyjmować wyłącznie pól jawnie przekazanych (wzorzec
   „patch", nie „replace") — dziś każdy nowy wywołujący z częściowymi
   danymi ryzykuje to samo.

---

## 2. Moje commity na gałęzi claude/hej-5yvvly — NIE nadpisz

Pracowałem na Twojej gałęzi (sesja aplikacji klienckiej). Zrób `git fetch`
i rebase na aktualny stan, zanim wypchniesz swoje zmiany:

- `d91840b8` — naprawa kasowania okładki (opis wyżej),
- `55304b47` — push wysyłany z `urgency: "high"` (budzi uśpiony telefon;
  domyślny priorytet bywał odkładany do odblokowania ekranu),
- `f20c4d94` — wiadomość od salonu BEZ odnośnika celuje teraz w skrzynkę
  tego salonu (`/salon/<id>/notifications`) zamiast w `/`; wcześniej klik
  w powiadomienie wyrzucał klienta na ekran startowy „znajdź salon",
- `1aca6f0d` — aktualizacja wiedzy Sero o zmiany w aplikacji klienckiej
  (szczegóły w punkcie 3).

---

## 3. Czego Sero ma się jeszcze nauczyć

Wiedzę o aplikacji klienckiej już uzupełniłem (commit `1aca6f0d`) —
dopisane: cztery drogi wejścia do salonu (QR aparatem i skanerem w apce,
slug, `app.booksero.com/<slug>`, link sieci), lista „Ostatnio odwiedzane
salony", automatyczne wpisywanie kodu SMS + przycisk „Wklej kod" +
konieczność jednorazowej reinstalacji ikony dla instalacji sprzed lipca
2026, odliczanie MM:SS przy limicie kodów, baner instalacji PWA,
samoczynne aktualizacje i numer wersji na ekranie startowym. Poprawiłem
też sprzeczność: Sero twierdził, że rabaty czasowe „nie są jeszcze
dostępne", opisując je dwa akapity niżej.

**Zostaje do dopisania po Twojej stronie (fakty panelowe, których nie
weryfikowałem):**

a) **Gdzie ląduje klient po kliknięciu w powiadomienie** — wiadomość
   z odnośnikiem prowadzi tam, gdzie wskazuje; BEZ odnośnika prowadzi do
   skrzynki powiadomień tego salonu. Gotowa odpowiedź na „klient klika
   powiadomienie i trafia na ekran startowy": to były wiadomości wysłane
   przed poprawką `f20c4d94` — stare powiadomienia mają cel zapisany
   w chwili wysyłki i tego się już nie zmieni; liczy się każda nowa.

b) **Dlaczego push bywa cichy / przychodzi dopiero po odblokowaniu
   telefonu** — booksero wysyła z najwyższym priorytetem, więc to nie
   ustawienie platformy. Przyczyny po stronie telefonu: wyciszenie,
   „Nie przeszkadzać", niska ważność kanału powiadomień dla aplikacji,
   agresywne oszczędzanie baterii (Honor/Huawei/Xiaomi — trzeba wyłączyć
   „Zarządzaj automatycznie" i pozwolić na działanie w tle). Dźwięku
   powiadomienia nie da się ustawić z aplikacji internetowej — decyduje
   kanał powiadomień systemu.

c) **Chmurka nieprzeczytanych PULSUJE** przy dzwonku aż do odczytania,
   a liczba pojawia się też **na ikonie aplikacji** na ekranie telefonu
   (na iPhonie liczba, na Androidzie zwykle kropka — zależy od nakładki).

d) **Diagnoza „wysłałem wiadomość, a klient nic nie dostał"** — w oknie
   po wysyłce panel podaje „Trafiła do skrzynki N klientów; sygnał na
   telefon dostanie M osób". Gdy M = 0, to NIE awaria: nikt z adresatów
   nie ma zarejestrowanego urządzenia (brak zgody na powiadomienia albo
   wylogowanie, które wyrejestrowuje urządzenie). Wiadomość i tak czeka
   w skrzynce. Klient sprawdzi to w aplikacji: Profil → Powiadomienia →
   „Urządzenia odbierające: X" (to liczba wg serwera, nie wg telefonu).

e) **Wylogowanie w aplikacji wyrejestrowuje urządzenie z powiadomień**
   (prywatność — wylogowany telefon nie dostaje cudzych wiadomości).
   Po ponownym zalogowaniu urządzenie dorejestrowuje się samo, o ile
   zgoda systemowa nadal jest; jeśli klient jej kiedyś odmówił, musi ją
   wydać ponownie (Profil → „Włącz powiadomienia na tym urządzeniu").
