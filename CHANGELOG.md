# Changelog — BookSero (aplikacja kliencka)

Wszystkie istotne zmiany w aplikacji zapisujemy tutaj.
Format: nowe wpisy na górze; wersje wg zasady MAJOR.MINOR.PATCH.
Data w formacie RRRR-MM-DD.

## [Niewydane]
- (tu trafiają zmiany przygotowane, przed nadaniem numeru wersji)

---

## [1.0.2] — 2026-07-23 — Auto-aktualizacja przy starcie

- Aplikacja sama sprawdza nową wersję przy każdym uruchomieniu i w tle
  czyści cache + przeładowuje (bez logowania i bez klikania w Profilu).
  Bezpiecznik: jedna próba na wersję — brak pętli przeładowań.
- Pole kodu SMS dostaje fokus automatycznie (systemowe autouzupełnianie
  podstawia kod tylko do aktywnego pola), a komplet 6 cyfr — wpisany lub
  podstawiony — loguje od razu, bez klikania „Zaloguj".
- Powiadomienia pamiętają wolę klienta: po wylogowaniu i ponownym
  zalogowaniu suwak wraca na „włączone" bez ponownych pytań (wylogowanie
  nadal wyrejestrowuje urządzenie — prywatność bez zmian).

---

## [1.0.1] — 2026-07-23 — Telefony E.164 i wygodniejsze logowanie

### Formularze telefonu (SPEC-telefony-e164)
- Wszystkie pola numeru (logowanie, rezerwacja, polecenia) mają wybór kraju
  (flaga + prefiks) i wysyłają zawsze pełny numer międzynarodowy E.164 —
  silnik libphonenumber-js, wspólny moduł `shared/phone.ts` z Booksero.
- Domyślny kraj z lokalizacji salonu (`salon.country`), fallback PL.
- Przycisk zablokowany do czasu poprawnego numeru + komunikat walidacji
  we wszystkich 16 językach; obsłużony błąd `invalid_phone` z rezerwacji.

### Logowanie
- Auto-uzupełnianie kodu z SMS: WebOTP na Androidzie (kod wskakuje sam
  i od razu loguje), natywna podpowiedź one-time-code na iOS; nasłuch
  uzbraja się przy każdym wysłaniu kodu („Wyślij ponownie" też działa).
- Blokada „zbyt wiele prób" pokazuje żywy licznik MM:SS do odblokowania
  (backend zwraca retryAfter w odpowiedzi 429).

---

## [1.0.0] — 2026-07-20 — Pierwsza wersja produkcyjna

Pierwsze pełne, produkcyjne wydanie aplikacji klienckiej BookSero
(PWA, multi-tenant, 16 języków, ciemna szata z kolorem akcentu salonu),
dostępnej pod własną domeną **app.booksero.com**.

### Dostęp i logowanie
- Wejście do salonu: skaner QR, link/kod sieci, slug lub UUID salonu.
- Wybór hierarchiczny kraj → miasto → salon (auto-pomijanie jednoznacznych).
- Logowanie kodem SMS z auto-rejestracją nowego numeru; blokada klienta
  przez dezaktywację w panelu.

### Rezerwacje
- Rezerwacja: usługa → specjalista → termin → dane; tryb dla pary.
- Wyszukiwarka usług + kategorie; dane logują się same z konta.
- Rezerwacja tylko dla zalogowanych, podpięta pod konto (bez duplikatów).

### Wizyty
- Nadchodzące i historia; odwoływanie własnych wizyt (także panelowych)
  z potwierdzeniem w stylu aplikacji.

### Bonusy
- Program lojalnościowy: punkty, poziomy (dorobek — poziom nie spada),
  katalog nagród z odbiorem w salonie.
- Polecenia SMS: nagroda polecającego po odbytej wizycie poleconego,
  bonus powitalny poleconego; tylko nowy klient; krótki, bezterminowy
  link `app.booksero.com/r/<kod>`.
- Kody rabatowe imienne (tylko usługi, jednorazowe) + „Moje kody”
  (vouchery klienta + notatnik własnych kodów).
- Tryb premiowania per tenant: punkty ALBO kody, z limitami wydawania.
- Promocje czasowe (happy hours): baner na wizytówce + sekcja „Promocje”,
  cena po rabacie w kalendarzu.
- Wszystkie funkcje bonusowe pod suwakami per tenant.

### Powiadomienia
- Web Push (przypomnienia o wizytach itd.) z sygnałem instalacji PWA;
  suwak włącz/wyłącz w Profilu; podpowiedź instalacji na iOS.

### Podstawy
- 16 języków interfejsu (auto-wykrywanie + ręczny wybór).
- PWA (instalacja na ekranie głównym, service worker).
- Własna domena app.booksero.com (HTTPS).
