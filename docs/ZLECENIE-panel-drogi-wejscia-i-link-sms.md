# ZLECENIE dla agenta panelu — drogi wejścia do aplikacji per lokalizacja + link SMS-em

Decyzja właściciela 2026-09-05. Kontekst: ekran startowy aplikacji BookSero
(od 1.0.36) daje klientce trzy drogi do salonu: **kod QR**, **nazwa salonu**
(w panelu: „hasło salonu"), **link od salonu**. Właściciel chce, żeby to
LOKALIZACJA decydowała, które drogi są dla jej klientek dostępne — w tej samej
zakładce zarządzania aplikacją, w której wpisuje hasła.

Stronę aplikacji robi sesja aplikacji (zmiany minimalne, §E). **Tu jest
strona panelu.**

---

## A. Model — ustawienia wejścia lokalizacji

Na lokalizacji (obok `app_enabled` i haseł) cztery przełączniki:

| pole | domyślnie | znaczenie |
|---|---|---|
| `appEntry.qr` | **on** | panel pokazuje i generuje materiały z kodem QR / linkiem: sekcja „Aplikacja BookSero" na wizytówce, przycisk „Otwórz aplikację", QR do druku |
| `appEntry.name` | **on** | wejście nazwą salonu działa; wyłączone → `GET /api/public/app/password` dla haseł tej lokalizacji oddaje 404, moduł haseł w panelu wyszarzony z informacją |
| `appEntry.smsLink` | **off** | panel wysyła klientce link do aplikacji SMS-em (§C) — **kosztuje SMS z puli lokalizacji** |
| `appEntry.phoneFind` | **on** | lokalizacja jest na liście „masz kartotekę w…" przy wejściu numerem telefonu; wyłączona → nie wraca z `find/verify` |

Wszystkie cztery przełączniki są **zawsze widoczne** (decyzja właściciela),
każdy z jednym zdaniem opisu. Zmiany do rejestru zdarzeń.

`appEntry.phoneFind` nie było w prośbie właściciela — to propozycja sesji
aplikacji: **zgoda administratora danych na wylistowanie** jego firmy przy
wejściu numerem to mocny argument dla prawnika w sprawie z SPEC §8. Jeśli
właściciel odrzuci — pominąć.

## B. Uczciwie o przełączniku „Kod QR"

Kod QR to zwykły link wydrukowany jako obrazek. **Wydrukowanych kodów żaden
przełącznik nie unieważni** — telefon zeskanuje i otworzy. Dlatego
`appEntry.qr` steruje wyłącznie tym, co panel POKAZUJE i GENERUJE; aplikacja
niczego nie blokuje i nie ma tego robić. Opis pod przełącznikiem ma to mówić
wprost: *„Wyłączenie chowa kod QR i link na wizytówce oraz w materiałach do
druku. Kody już wydrukowane działają dalej."* Bez tego zdania właściciel
lokalizacji będzie sądził, że wyłączył wejście — a nie wyłączył.

## C. Link do aplikacji SMS-em (`appEntry.smsLink`)

**Kiedy idzie SMS — reguły, które chronią pulę:**
1. **Raz na klientkę na lokalizację.** Znacznik na kartotece
   (`appLinkSmsSentAt`); nigdy drugi raz automatycznie.
2. **Po pierwszej potwierdzonej rezerwacji** klientki w tej lokalizacji
   (online lub z recepcji) — nie przy każdej wizycie.
3. **Tylko gdy klientka nie ma jeszcze aplikacji.** Panel wie, kto ją
   zainstalował (zdarzenie `install` z aplikacji, per kartoteka) — takim
   nie wysyłamy.
4. Tylko gdy lokalizacja ma `app_enabled` i co najmniej jedno hasło
   (SMS bez „wpisz: Vivi" jest gorszy — klientka nie wie, co zrobić).
5. Osobno: przycisk **„Wyślij link do aplikacji"** na karcie klientki dla
   recepcji — ręczny, działa niezależnie od automatu, też liczony z puli,
   też stempluje znacznik (żeby automat nie dublował).

**Treść** (16 języków, przez tę samą funkcję, co inne SMS-y; docelowo 1
segment):
```
{salon}: Twoje wizyty, punkty i promocje w aplikacji booksero.
Pobierz: app.booksero.com/{slug}  Wpisz w aplikacji: {haslo}
```
`{haslo}` = pierwsze hasło lokalizacji. Bez linii WebOTP (to nie jest SMS
z kodem). Nadawca jak inne SMS-y lokalizacji.

**Zgody:** to wiadomość o obsłudze rezerwacji (jak potwierdzenie), nie
marketing — nie wymaga zgody marketingowej. Ale jeśli klientka ma STOP
(wycofała wszystkie SMS-y), nie wysyłać.

**Pula i koszt:**
- SMS pobierany z **puli SMS-ów tej lokalizacji**, jak każdy inny; wpis
  w dzienniku SMS-ów z typem `app_link`.
- Pusta pula → SMS nie idzie, wpis w dzienniku „pominięto: brak SMS-ów",
  znacznik NIE ustawiony (żeby poszedł, gdy pula wróci).
- **Komunikat przy włączaniu** (okno potwierdzenia, nie tylko opis):
  *„Ta opcja wysyła SMS z linkiem do aplikacji każdej nowej klientce po
  jej pierwszej rezerwacji. Każdy taki SMS jest pobierany z puli SMS-ów tej
  lokalizacji — tak samo jak przypomnienia. Szacunkowo: tyle SMS-ów, ile
  nowych klientek miesięcznie. Włączyć?"* [Włącz] [Anuluj].
- Pod przełącznikiem licznik: „wysłano w tym miesiącu: N".

## D. Punkty publiczne i aplikacja

- `GET /api/public/app/password` — respektuje `appEntry.name`
  (lokalizacja z `name=off` nie wraca; jeśli hasło dzieli kilka lokalizacji,
  wracają tylko te włączone).
- `find/verify` — respektuje `appEntry.phoneFind`.
- `GET /api/public/book/:salonId` — dokłada `appEntry` (cztery booleany),
  żeby wizytówka i aplikacja wiedziały, co pokazywać.
- Wizytówka / widget (`SPEC-aplikacja-na-wizytowce`) — sekcja aplikacji
  tylko przy `appEntry.qr`.

## E. Strona aplikacji (sesja aplikacji, do zrobienia po wdrożeniu panelu)

Aplikacja nie musi się zmieniać, żeby to działało — odmowy przychodzą
z panelu (404). Drobiazg po stronie aplikacji: przy `appEntry.name = off`
komunikat „Nie znaleziono" jest prawdziwy i wystarczający.

## F. Sero

„Lokalizacja decyduje, którędy klientki wchodzą do aplikacji: Ustawienia →
zakładka aplikacji → cztery przełączniki: kod QR (materiały na wizytówce
i do druku; wydrukowane kody działają dalej), nazwa salonu (hasła), link
SMS-em (płatne z puli SMS-ów lokalizacji, raz na klientkę po pierwszej
rezerwacji, tylko do tych bez aplikacji) oraz widoczność przy wejściu
numerem telefonu." Strażnik w teście.

## G. Testy, które MUSZĄ przejść

- `name=off` → `password?q=vivi` nie zwraca tej lokalizacji; druga lokalizacja
  tej samej firmy z `name=on` wraca.
- `phoneFind=off` → `find/verify` nie zwraca tej lokalizacji.
- `smsLink=on`: pierwsza potwierdzona rezerwacja nowej klientki → 1 SMS
  `app_link`, znacznik ustawiony; druga rezerwacja → 0 SMS; klientka
  z zarejestrowaną instalacją → 0 SMS; pusta pula → 0 SMS, znacznik pusty;
  klientka ze STOP → 0 SMS.
- Przycisk ręczny na karcie → SMS + znacznik; automat po nim → 0 SMS.
- `smsLink=off` (domyślnie) → nigdy żadnego SMS-a `app_link`.
- Włączenie `smsLink` w UI wymaga potwierdzenia w oknie z treścią o koszcie.
