# Changelog — BookSero (aplikacja kliencka)

Wszystkie istotne zmiany w aplikacji zapisujemy tutaj.
Format: nowe wpisy na górze; wersje wg zasady MAJOR.MINOR.PATCH.
Data w formacie RRRR-MM-DD.

## [Niewydane]
- (tu trafiają zmiany przygotowane, przed nadaniem numeru wersji)

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
