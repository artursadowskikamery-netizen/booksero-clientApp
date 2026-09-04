# ZLECENIE dla agenta panelu — „Hasło salonu" + wejście po numerze telefonu

Decyzja właściciela 2026-09-04. **Zastępuje** zlecenie „wyszukiwarka salonów"
(`ZLECENIE-panel-wyszukiwarka-salonow.md`) — tamto jest WYCOFANE: każde
wyszukiwanie po nazwie z podpowiadaniem jest katalogiem, a katalog pozwala
konkurencji wypisać listę klientów Booksero. Tego właściciel nie chce.

Zasada nadrzędna: **aplikacja jest wejściem dla klientek salonu, nie miejscem
szukania salonów.** Z tego ekranu nie da się niczego wypisać ani policzyć.

Stronę aplikacji robi sesja aplikacji. **Tu jest strona panelu** — dwie
funkcje.

---

## A. „Hasło salonu" — moduł w ustawieniach aplikacji lokalizacji

Słowo, które recepcja MÓWI klientce: *„wpisz w aplikacji Vivi"*. Prostsze do
przekazania niż kod QR, łatwiejsze do zapamiętania niż link.

**Model:** tabela np. `app_passwords` — `id, tenantId, salonId, display`
(jak wpisał właściciel), `normalized` (klucz dopasowania), `createdAt`,
`createdBy`. Hasło należy do **lokalizacji**. Do **5 haseł** na lokalizację.

**Normalizacja** (ta sama przy zapisie i przy dopasowaniu): małe litery, bez
diakrytyków, bez spacji i interpunkcji. „Vivi Żory" → `vivizory`.

**Walidacja przy zapisie** — odrzucenie z komunikatem, gdy:
1. po normalizacji krócej niż **4** znaki albo dłużej niż 30;
2. słowo jest na **liście zakazanej**: nazwy miast (z bazy lokalizacji +
   słownik), nazwy branż i usług (masaż, spa, fryzjer, barber, paznokcie,
   kosmetyka, salon, studio, gabinet, klinika, beauty, estetyka…), słowa
   ogólne. Komunikat: *„To słowo jest zbyt ogólne — hasło ma wskazywać Twoją
   firmę, nie branżę."* Ta reguła jest JEDYNĄ zaporą przed odtworzeniem
   katalogu z haseł, więc lista ma być szeroka i utrzymywana;
3. **koliduje z hasłem INNEJ firmy** (innego `tenantId`): identyczne po
   normalizacji, jedno zawiera się w drugim, albo podobieństwo trigramowe
   ≥ 0,8. Komunikat WYŁĄCZNIE: *„Zajęte lub zbyt podobne do używanego —
   wybierz inne."* **Nigdy nie ujawniać, czyje.** Inaczej panel staje się
   wyrocznią „czy marka X jest na Booksero".

W obrębie tej samej firmy kolizje są dozwolone — dwie lokalizacje z tym
samym hasłem = wybór między nimi w aplikacji.

**Tylko lokalizacje z włączoną aplikacją kliencką.** Wpis w rejestrze zdarzeń
przy dodaniu/usunięciu.

**UI** (ustawienia lokalizacji, sekcja aplikacji): lista haseł, dodaj/usuń,
pod spodem gotowe zdanie do skopiowania na wizytówkę i dla recepcji:
*„Wpisz w aplikacji BookSero: Vivi"*.

**Punkt publiczny:** `GET /api/public/app/password?q=<tekst>`
- normalizacja `q` jak wyżej; dopasowanie **DOKŁADNE** — bez prefiksów, bez
  podobieństw, bez list. „viv" nie otwiera niczego;
- trafienie → `{ tenantId, tenantName, salons: [{ salonId, name, city, logo }] }`
  (wszystkie lokalizacje tej firmy niosące to hasło);
- brak → `404` o tym samym kształcie komunikatu, bez rozróżnienia „nie ma"
  od „za krótkie";
- limit: 20 zapytań/min i 200/dobę na IP.

## B. Wejście po numerze telefonu — „Byłaś już u nas?"

Dla klientki, która ma kartotekę, a straciła kod (nowy telefon, reinstalacja).
Jeden SMS = znalezienie salonu + logowanie. **Nie wycieka nic**: żeby
zobaczyć, że salon jest na Booksero, trzeba mieć w ręku telefon jego klientki.

1. `POST /api/public/client-auth/find/request` `{ phone }` (E.164)
   - odpowiedź **zawsze** `200 { ok: true }` — identyczna, czy numer istnieje,
     czy nie; SMS idzie tylko, gdy numer ma ≥1 aktywną kartotekę w firmie
     z włączoną aplikacją;
   - limity: 3/10 min na numer, 10/godz. na IP; kod, długość i ważność jak
     przy zwykłym logowaniu — reuse istniejącego mechanizmu kodów.
2. `POST /api/public/client-auth/find/verify` `{ phone, code }`
   → `{ ticket, tenants: [{ tenantId, tenantName, salons: [{ salonId, name,
   city, logo }] }] }` — tylko firmy z aplikacją, tylko aktywne kartoteki;
   `ticket` ważny 5 min.
3. `POST /api/public/client-auth/find/enter` `{ ticket, tenantId, salonId }`
   → **ten sam token i odpowiedź, co zwykłe `verify`** dla tej firmy — bez
   drugiego SMS-a. Ticket jednorazowy na firmę (klientka z dwiema firmami może
   wejść do obu bez nowego kodu w ciągu 5 min).

Błędy kodu liczą się do tych samych limitów prób, co przy logowaniu.

**Do potwierdzenia z prawnikiem właściciela** (zapisać w polityce
prywatności): operator systemu pokazuje klientce, po weryfikacji SMS, listę
firm, w których ma ona kartotekę — to jej własne dane, ale dopasowane między
niezależnymi administratorami.

## C. Sero — do wiedzy

„Klientka wchodzi do salonu w aplikacji BookSero na trzy sposoby: kodem QR,
**hasłem salonu** (ustawia się je w ustawieniach aplikacji lokalizacji —
recepcja mówi klientce: *wpisz Vivi*) albo **numerem telefonu**, jeśli ma już
kartotekę — jeden SMS i jest zalogowana. Aplikacja NIE ma wyszukiwarki ani
katalogu salonów: nowa klientka dostaje hasło, link lub kod QR od salonu.
Hasło nie może być nazwą branży ani miasta i musi być inne niż hasła innych
firm." Strażnik w teście wzorem `para-dwie-kartoteki.test.ts`.

## D. Testy, które MUSZĄ przejść

- `vivi` → firma VIVIEstetic z obiema lokalizacjami (obie mają to hasło);
  `vivipniowek` → tylko Pniówek; `viv` → 404; `Vivi Żory` = `vivizory`.
- Zapis „masaż", „Żory", „spa" → odrzucony jako ogólny.
- Zapis „Vivvi" przez inną firmę → odrzucony, komunikat bez nazwy firmy;
  ten sam zapis przez tę samą firmę → przyjęty.
- `find/request` dla numeru bez kartoteki → `200 { ok:true }`, zero SMS-ów.
- `find/verify` → tylko firmy z aplikacją; `find/enter` daje token
  równoważny zwykłemu logowaniu; ticket po użyciu na firmę A nadal działa
  na firmę B, po 5 min nie działa wcale.
- Lokalizacja bez aplikacji: hasła nie da się zapisać, numer jej nie zwraca.

## E. Czego NIE robić

- Żadnego podpowiadania, dopasowania po początku, podobieństw ani list po
  stronie publicznej. Dokładne trafienie albo nic.
- Żadnego licznika, „znaleziono N", stron wyników.
- Komunikat kolizji hasła nigdy nie nazywa drugiej firmy.

## F. Uzupełnienie 2026-09-04 — zasięg hasła to KRAJ

Pytanie właściciela: dwie obce firmy „BBeauty" — Koszalin i Rzym.

- Hasło zapisuje się z **krajem lokalizacji** (`country` z profilu salonu).
  Kolizje (identyczne / zawierające / trigramy ≥ 0,8) sprawdzane **tylko
  wśród haseł tego samego kraju**. „bbeauty" w PL i „bbeauty" w IT nie
  kolidują.
- Sieć z lokalizacjami w kilku krajach rejestruje to samo hasło w każdym —
  to ta sama firma, wolno.
- Dwie obce firmy w TYM SAMYM kraju: **kto pierwszy, ten ma** gołe słowo;
  druga musi się odróżnić („bbeauty koszalin"). Komunikat odmowy bez nazwy
  właściciela hasła. Spory o markę → pomoc techniczna, ręczne przepisanie;
  automat ich nie rozstrzyga.
- Punkt publiczny dostaje parametr **`country`** (ISO-2, wymagany):
  `GET /api/public/app/password?q=<tekst>&country=PL`. Dopasowanie =
  znormalizowane hasło + kraj. Aplikacja bierze kraj z tego samego wyboru
  flagi, co przy numerze telefonu (domyślnie z ustawień telefonu).
- Testy: „bbeauty" PL i „bbeauty" IT przez dwie obce firmy → oba przyjęte;
  „bbeauty" PL dwa razy przez obce firmy → drugi odrzucony; zapytanie
  `q=bbeauty&country=IT` → tylko Rzym.

## G. Uzupełnienie 2026-09-04 — rzeczy, których łatwo nie zauważyć

1. **SMS w ścieżce „po numerze" idzie jako BookSero**, nie jako salon.
   Klientka może mieć kartoteki w dwóch firmach — podpisanie SMS-a jedną
   z nich zdradzałoby ją przed wyborem. Osobny, neutralny szablon i nadawca.
2. **Odpowiedź `find/request` musi pozwolić aplikacji zbudować ekran
   „nie dostałaś kodu?"** — zwrócić `retryAfter` (sekundy do ponownej
   wysyłki), tak samo jak przy 429 w zwykłym logowaniu. Treść ekranu robi
   aplikacja: „Jeśli masz u nas kartotekę, wysłaliśmy kod. Nie przyszedł?
   Pierwszy raz? Poproś salon o hasło lub kod QR."
3. **Usunięcie / zmiana hasła:** ostrzeżenie w panelu („to hasło może być na
   Twoich wizytówkach") i **90 dni karencji** — usunięte hasło nadal
   działa, w panelu widać datę wygaśnięcia. Pole `expiresAt` w tabeli.
4. **Limity per IP:** operatorzy komórkowi i publiczne wi-fi wypuszczają
   tysiące osób spod jednego adresu. Skrobanie zatrzymuje limit MINUTOWY
   (zostaje 20/min); dobowy podnieść do **2000/IP** i liczyć dodatkowo per
   urządzenie (nagłówek z identyfikatorem instalacji, który aplikacja
   wyśle).
5. **Alfabety niełacińskie:** normalizacja `toLowerCase` + usunięcie
   diakrytyków łacińskich; cyrylica i greka zostają jak są. **Lista
   zakazanych słów per język** (el, bg, uk co najmniej): „μασάζ", „масаж",
   „масажі" odrzucane jak „masaż".
6. **Wizytówka:** `SPEC-aplikacja-na-wizytowce.md` (repo aplikacji) zyskuje
   trzeci element obok kodu QR i adresu: „Wpisz w aplikacji BookSero: Vivi"
   — treść generowana z pierwszego hasła lokalizacji.

Świadomie POZA zakresem: automatyczne tworzenie hasła ze sluga (slug bywa
ogólny — powstałyby hasła, których zakazujemy); rozstrzyganie sporów o markę
(pomoc techniczna); „zapomniałam hasła salonu" (od tego jest ścieżka po
numerze).

## H. Decyzje właściciela 2026-09-04 (zamykają zakres)

- **Hasło ze sluga automatycznie: NIE.** Zamiast tego podpowiedź w panelu
  przy pierwszym wejściu w ustawienia aplikacji lokalizacji:
  *„Ustaw hasło salonu — klientki wpiszą je zamiast skanować kod."*
- **Licznik wejść: TAK**, w zakładce aplikacji (tam, gdzie konfiguruje się
  aplikację), per lokalizacja: ile wejść kodem QR / hasłem / numerem
  telefonu / z listy ostatnio odwiedzanych / linkiem. Aplikacja wysyła
  zdarzenie istniejącym punktem `POST /api/public/client/app-event`
  z `type: "entry"` i `method: "qr" | "password" | "phone" | "recent" | "link"`
  oraz `salonId`. Panel: przyjąć nowy typ (dziś jest tylko `install`),
  zliczać, pokazać (ostatnie 30 dni + łącznie). Zdarzenie idzie BEZ tokenu
  (klientka może nie być jeszcze zalogowana) — więc bez danych osobowych,
  tylko `salonId` + `method`, z limitem na IP.
- **Test na jednej firmie**: VIVIEstetic (Żory lub Pniówek). Kolizje między
  obcymi firmami pokrywają testy jednostkowe — w bazie jest jedna firma.

**Potrzebne aplikacji, żeby mogła wyjść PRZED panelem:**
`GET /api/public/app/entry-capabilities` → `{ password: true, phoneFind: true }`.
Dopóki punktu nie ma (404), aplikacja zakłada `false/false`: pole hasła
zachowuje się jak dawne pole adresu wizytówki (z nowym, ludzkim napisem),
a ścieżka po numerze jest ukryta. Po wdrożeniu panelu aplikacja włącza obie
rzeczy sama, bez nowej wersji.
