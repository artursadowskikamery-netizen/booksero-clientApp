# Aktualizacje aplikacji BookSero po publikacji w Google Play

Instrukcja dla właściciela. Stan na 2026-09-05. Paczka: PWABuilder (TWA),
identyfikator `com.booksero.app`, aplikacja pod `https://app.booksero.com`.

---

## 0. Najważniejsze zdanie

**Aplikacja ze sklepu to cienka skorupa, która otwiera app.booksero.com.**
Cały ekran, wszystkie funkcje, teksty, języki, logika — to strona, którą
wdrażasz Republishem w Replicie. **Zmiana funkcji aplikacji NIE wymaga
budowania nowej paczki ani przechodzenia przez Google Play.** Klientki
dostaną nową wersję przy następnym otwarciu aplikacji — tak samo, jak dziś,
przed publikacją w sklepie.

Nową paczkę (plik `.aab`) buduje się tylko wtedy, gdy zmienia się **sama
skorupa** (§3). To zdarza się rzadko: raz na kilka miesięcy albo raz w roku.

---

## 1. Zwykła aktualizacja funkcji — 99% przypadków

Dokładnie to, co robisz dziś:

1. Sesja aplikacji wypuszcza nową wersję (np. 1.0.43) — commit na `main`.
2. Shell w projekcie **Klient App**:
   ```
   git fetch origin main && git reset --hard origin/main && npm run build
   ```
3. **Republish**.
4. Gotowe. Google Play w to nie wchodzi.

**Jak klientka dostaje nową wersję:**
- przy następnym otwarciu aplikacji przeglądarka w skorupie pobiera nowe
  pliki (service worker jest ustawiony na natychmiastową podmianę);
- w Profilu jest „Sprawdź aktualizację" i przycisk aktualizacji — dla
  telefonów, które uparcie trzymają stary build w pamięci podręcznej;
- numer wersji widać na ekranie startowym bez logowania — jak ktoś zgłasza
  problem, pierwsze pytanie brzmi „jaką masz wersję?".

**Czas dotarcia:** sekundy po Republishu dla tych, którzy otworzą aplikację.
Nikt nie musi niczego pobierać ze sklepu.

---

## 2. Co się dzieje, gdy aktualizacja jest „duża"

Nie ma różnicy. Nowy ekran, nowa zakładka, nowy język, zmiana kolorów w
środku — wszystko to strona. Jedyne, co „duża" zmiana wymaga, to:

- **wpis w sklepie** (opis, zrzuty ekranu) warto odświeżyć, żeby nie
  obiecywał czegoś innego, niż aplikacja robi — to edycja w Play Console,
  bez nowej paczki, bez recenzji kodu (Google sprawdza tylko treści sklepu);
- jeśli aplikacja zaczyna zbierać nowy rodzaj danych (np. lokalizację) —
  **formularz „Bezpieczeństwo danych"** w Play Console trzeba uzupełnić,
  inaczej Google może zablokować wpis w sklepie.

---

## 3. Kiedy TRZEBA zbudować nową paczkę `.aab`

Tylko przy zmianie skorupy. Konkretna lista:

| zmiana | nowa paczka? |
|---|---|
| nowa funkcja, ekran, tekst, język, poprawka błędu | **nie** |
| kolory wewnątrz aplikacji (akcent salonu) | nie |
| **nazwa aplikacji na ikonie** („BookSero") | **tak** |
| **ikona aplikacji** lub ekran powitalny (splash) | **tak** |
| kolor paska stanu / tła ekranu powitalnego (`theme_color`, `background_color` w manifeście) | tak |
| **domena** (przeniesienie z app.booksero.com) | **tak** + nowe assetlinks |
| adres startowy / zakres (`start_url`, `scope`) | tak |
| nowe uprawnienie Androida (np. lokalizacja, kontakty) | tak |
| **coroczne wymaganie Google „target API level"** | **tak** — patrz §5 |
| identyfikator `com.booksero.app` | **NIGDY** — nieodwracalny po publikacji |

Zasada praktyczna: jeśli zmiana dotyczy pliku `manifest.webmanifest`
(nazwa, ikony, kolory, start_url) — nowa paczka. Wszystko inne — nie.

---

## 4. Jak zbudować i wgrać nową paczkę (gdy §3 tego wymaga)

**KROK 1 — Wdróż stronę.** Najpierw Republish z nowym manifestem — PWABuilder
czyta manifest z żywej strony.

**KROK 2 — PWABuilder.** Wejdź na pwabuilder.com → wpisz `https://app.booksero.com`
→ „Package for stores" → Android. W ustawieniach:
- Package ID: `com.booksero.app` (bez zmian, dokładnie tak);
- **Version**: podnieś numer wersji (np. `1.1.0`) i **Version code** (liczba
  całkowita, MUSI być większa niż w poprzedniej paczce — inaczej Play
  odrzuci plik);
- **Signing key: „Use mine"** — wgraj plik klucza z pierwszej paczki (§6).
  **Nie generuj nowego klucza.** Nowy klucz = Google nie przyjmie aktualizacji.
- Reszta bez zmian (Display: standalone, Notifications: włączone).

**KROK 3 — Pobierz ZIP** i wyciągnij z niego plik `.aab`.

**KROK 4 — Play Console** → BookSero → Test i publikacja → **Produkcja** →
„Utwórz nową wersję" → wgraj `.aab` → wpisz „Co nowego" (krótko, po polsku;
to widzą klientki w sklepie) → Sprawdź → Rozpocznij wdrażanie.

**KROK 5 — Recenzja Google.** Aktualizacja zwykle przechodzi w kilka godzin,
czasem do 2–3 dni. Przez ten czas stara paczka działa normalnie — a że
strona jest już wdrożona, klientki i tak mają nowe funkcje.

**KROK 6 — Sprawdź assetlinks.** Jeśli klucz się nie zmienił (a nie ma
prawa), plik `/.well-known/assetlinks.json` zostaje. Test: otwórz aplikację
ze sklepu — u góry **nie może** być paska adresu. Jeśli jest, odciski
w assetlinks nie pasują (§7).

---

## 5. Coroczna paczka „na żądanie Google"

Google co roku podnosi wymagany „target API level" (wersję Androida, pod którą
paczka jest zbudowana). Skutek: **raz w roku, zwykle latem, trzeba wgrać nową
paczkę, nawet jeśli nic się nie zmieniło** — inaczej po terminie Play
przestaje przyjmować aktualizacje, a nowi użytkownicy na najnowszym Androidzie
mogą nie widzieć aplikacji w sklepie. Play Console wysyła o tym e-mail
z wyprzedzeniem (ok. 3 miesięcy).

Procedura: dokładnie §4 — PWABuilder zbuduje paczkę pod aktualne wymagania.
Wystarczy podnieść Version code.

---

## 6. Klucz podpisywania — jedyna rzecz, której NIE WOLNO zgubić

W ZIP-ie z pierwszej paczki PWABuilder są pliki klucza (`signing.keystore`
lub podobny) i `signing-key-info.txt` z hasłami. **Bez tego klucza nie da się
wgrać żadnej aktualizacji paczki.** Trzymaj kopię w dwóch miejscach (np.
menedżer haseł + zaszyfrowany dysk). To ważniejsze niż kod aplikacji — kod
jest w GitHubie, klucz jest tylko u Ciebie.

Ratunek, gdyby jednak zginął: Google Play używa **App Signing** (Google trzyma
klucz właściwy, Ty masz klucz „upload"). Zgubiony klucz upload da się
zresetować przez formularz pomocy Play Console — trwa to kilka dni i wymaga
wygenerowania nowego klucza oraz **dopisania jego odcisku do assetlinks**.
Da się przeżyć, ale lepiej nie sprawdzać.

---

## 7. Problemy, na które możesz trafić

**Pasek adresu u góry aplikacji ze sklepu** — assetlinks nie pasują.
Przyczyny: brak jednego z dwóch odcisków SHA-256 (klucz paczki I klucz Google
App Signing — oba muszą być w `server/assetlinks.ts`), literówka w odcisku,
zmiana klucza. Sprawdzenie: otwórz
`https://app.booksero.com/.well-known/assetlinks.json` w przeglądarce —
mają być oba odciski, wielkimi literami, z dwukropkami.

**Klientka ma starą wersję** — pamięć podręczna telefonu. Profil → Sprawdź
aktualizację → Aktualizuj. Gdy to nie pomaga: wyczyścić dane aplikacji
w ustawieniach Androida (nie odinstalowywać).

**Kod SMS nie wpisuje się sam w aplikacji ze sklepu** — działa tak samo, jak
w PWA: wymaga linii `@app.booksero.com #kod` w SMS-ie (jest) i tej samej
domeny w skorupie (jest). Jeśli przestanie — to zmiana domeny albo assetlinks.

**Play odrzuca paczkę: „version code already used"** — nie podniesiono
Version code w PWABuilder. Zbuduj ponownie z większym numerem.

**Play odrzuca paczkę: „signed with a different key"** — użyto nowego klucza
zamiast tego z §6.

**Google prosi o politykę prywatności / bezpieczeństwo danych** — polityka
musi być pod publicznym adresem (plik `docs/store/POLITYKA-PRYWATNOSCI.md`
trzeba opublikować jako stronę, np. `app.booksero.com/polityka`), a formularz
„Bezpieczeństwo danych" wypełniony zgodnie z tym, co aplikacja zbiera: numer
telefonu, imię i nazwisko, historia wizyt, identyfikator urządzenia do
powiadomień. Bez tego wpis w sklepie może zostać zawieszony.

**Aplikacja ze sklepu a wejście po numerze** — rygiel prawny po stronie
aplikacji (strona) obowiązuje tak samo w wersji sklepowej; odblokowanie to
Republish strony, bez nowej paczki.

**iPhone** — Google Play go nie dotyczy. Klientki z iPhone'a instalują
aplikację z Safari („Dodaj do ekranu początkowego"); App Store wymagałby
osobnej paczki i osobnego procesu — poza zakresem na dziś.

---

## 8. Przed pierwszą publikacją — lista do odhaczenia

- [x] oba odciski SHA-256 w `server/assetlinks.ts` (1.0.45) — [ ] wdrożone, sprawdzone
      pod `/.well-known/assetlinks.json`
- [ ] klucz podpisywania z PWABuilder zapisany w dwóch miejscach
- [x] polityka prywatności pod publicznym adresem: `https://app.booksero.com/polityka-prywatnosci` (od 1.0.43) — [ ] adres wpisany w Play Console, [ ] treść potwierdzona przez prawnika
- [ ] formularz „Bezpieczeństwo danych" i ankieta „Ocena treści" wypełnione
- [ ] opis sklepu (`docs/store/OPIS-SKLEP.md`), grafika 1024×500 (jest),
      zrzuty ekranu telefonu (min. 2, najlepiej 4–6, z ekranów po zalogowaniu)
- [ ] test na ścieżce **Testy wewnętrzne** przed Produkcją: instalacja ze
      sklepu, brak paska adresu, logowanie z auto-kodem, powiadomienie push
- [ ] dopiero potem Produkcja

---

## 9. W jednym zdaniu dla recepcji

„Aplikacja aktualizuje się sama — jeśli klientka widzi starą wersję, niech
wejdzie w Profil i tapnie Aktualizuj; ze sklepu nie trzeba nic pobierać."
