# BookSero — aplikacja mobilna dla klientów salonów (baza wiedzy)

Stan na: 19.07.2026. Dokument opisuje DZIAŁAJĄCĄ produkcyjnie wersję aplikacji.

## 1. Czym jest BookSero

BookSero to aplikacja mobilna (PWA — działa w przeglądarce i można ją
zainstalować na ekranie głównym telefonu) dla **klientów** salonów
korzystających z platformy Booksero. Jedna aplikacja obsługuje wielu
tenantów (sieci salonów) w modelu white-label: po wejściu w salon aplikacja
pokazuje logo, nazwę i kolor akcentu danej sieci/salonu.

- Publiczny adres: https://booksero-client-app.replit.app
- Aplikacja łączy się wyłącznie z platformą Booksero (panel.booksero.com).
- Zawsze ciemna szata graficzna; kolor przycisków (akcent) ustawia salon
  w panelu Booksero (paleta 12 kolorów, np. złoty, niebieski, róż).
- 16 języków interfejsu: polski, angielski, niemiecki, niderlandzki,
  czeski, szwedzki, hiszpański, francuski, włoski, chorwacki, grecki,
  turecki, bułgarski, fiński, norweski, ukraiński. Język wykrywany
  automatycznie z telefonu, można zmienić ręcznie na ekranie startowym.

## 2. Jak klient trafia do swojego salonu

Ekran startowy (neutralny, niebieski, marka BookSero) daje możliwości:

1. **Link/kod od salonu** — klient wpisuje slug wizytówki (np. `svp`)
   albo pełny identyfikator (UUID) salonu lub sieci.
2. **Link sieci** — adres w formie `/t/<id-sieci>` otwiera wybór:
   kraj → miasto → salon (poziomy z jedną opcją są pomijane automatycznie;
   miasto z jednym salonem prowadzi od razu do salonu).
3. Skaner QR — oznaczony jako „wkrótce".

Numery ML (np. ML38514887) nie działają w aplikacji — należy używać
sluga lub linku.

## 3. Logowanie klienta (SMS) — obowiązkowe

Aplikacja wymaga zalogowania **przed** oglądaniem salonu i rezerwacją:

1. Klient podaje numer telefonu → dostaje SMS z kodem (kod ważny 10 minut,
   maks. 5 prób, wysyłka z puli SMS tenanta).
2. Wpisuje kod:
   - numer znany w sieci → od razu zalogowany (konta ze wszystkich salonów
     sieci są połączone),
   - numer nowy → aplikacja prosi tylko o **imię** (nazwisko opcjonalne)
     i konto klienta tworzy się automatycznie w wybranym salonie.
3. Sesja ważna 90 dni. Nie ma haseł ani osobnej rejestracji.

Ważne zasady:
- Konto powstaje WYŁĄCZNIE po poprawnym kodzie SMS (weryfikacja numeru).
- Klient **dezaktywowany w panelu** (odznaczony „aktywny") nie dostaje
  SMS-ów i nie zaloguje się — to mechanizm blokady np. za nadużycia;
  zablokowany nie dostaje żadnego komunikatu o blokadzie.
- Logowanie dotyczy całej sieci (tenanta) — jeden login działa we
  wszystkich salonach sieci.

## 4. Dolne menu (5 zakładek)

Widoczne na każdym ekranie po zalogowaniu (poza ekranem logowania):

1. **Salon** — lista salonów sieci (kafelki miast/salonów). Po wybraniu
   salonu: strona salonu z galerią zdjęć, zespołem i skrótem cennika
   (5 pozycji + przycisk „Zobacz wszystkie usługi (N)").
2. **Rezerwuj** — rezerwacja wizyty (opis niżej).
3. **Wizyty** — nadchodzące wizyty i historia (opis niżej).
4. **Bonusy** — program lojalnościowy (opis niżej).
5. **Profil** — dane klienta, lista salonów z jego kontem, wylogowanie.

## 5. Rezerwacja wizyty

Kroki: **Usługa → Specjalista → Termin → Dane**.

- Wybór „Dla ilu osób": 1 osoba albo **Para (2 osoby)** — rezerwacja
  dla pary z wyborem dwóch specjalistów naraz.
- **Wyszukiwarka usług**: wpisanie kilku liter zawęża listę (ignoruje
  wielkość liter i polskie znaki — „masaz" znajdzie „Masaż").
- **Kategorie usług**: kafelki na dole ekranu (np. Masaże, Rytuały) —
  pokazują się, gdy salon ma min. 2 kategorie.
- Lista usług przewija się we własnym oknie (długi cennik nie rozciąga strony).
- Terminy: 14 dni do przodu, wolne godziny pobierane na żywo z Booksero.
- Dane klienta (imię, telefon) **wypełniają się same** z konta zalogowanego.
- Rezerwacja podpina się pod konto zalogowanego klienta (bez duplikatów
  klientów w bazie). Po potwierdzeniu: ekran sukcesu z kodem rezerwacji
  i ewentualną informacją o wymaganej przedpłacie.

## 6. Wizyty

- **Nadchodzące** — od najbliższej u góry; karty z datą, usługą, salonem
  i pracownikiem.
- **Historia** — od najnowszej.
- **Odwołanie wizyty**: przycisk „Odwołaj" przy każdej nadchodzącej
  wizycie (także tej założonej przez recepcję w panelu). Potwierdzenie
  w eleganckim okienku aplikacji. Obowiązują zasady salonu (włączone
  anulowanie + limit godzin przed wizytą). Po odwołaniu termin zwalnia
  się w kalendarzu salonu, a salon dostaje powiadomienie.

## 7. Bonusy — program lojalnościowy (Etap A)

Program pojawia się w aplikacji TYLKO, gdy tenant włączy suwak
„Program lojalnościowy w aplikacji klienckiej" w panelu Booksero
(moduł Program lojalnościowy). Suwak działa na całą sieć.

- Klient, który nie dołączył: widzi zaproszenie „Dołącz do programu"
  (+ informację o bonusie powitalnym, jeśli tenant go ustawił).
  Dołączenie to jedno kliknięcie; bonus powitalny nalicza się raz.
- Członek programu widzi:
  - **saldo punktów** (wspólne dla całej sieci),
  - **poziom** (np. Start → Brązowy → Srebrny → Złoty → VIP; progi i nazwy
    ustawia tenant w panelu, zakładka „Poziomy"). Poziom liczy się od
    punktów zdobytych łącznie — **nigdy nie spada**,
  - pasek postępu do następnego poziomu,
  - **katalog nagród** z ceną w punktach.
- **Odbiór nagrody wyłącznie w salonie**: klient klika „Odbieram
  w salonie" → zgłoszenie pojawia się w panelu na **karcie klienta**
  (sekcja „Zgłoszone nagrody") → recepcja przy wizycie klika „Wydano"
  → dopiero wtedy punkty schodzą z salda. Recepcja może też „Odrzucić".
  Klient może wycofać zgłoszenie w aplikacji. Brak kodów samoobsługowych.
- Punkty naliczają się wg konfiguracji programu w panelu (pkt za złotówkę
  za usługi/produkty, bonusy za urodziny, opinię itd.).

Plan kolejnych etapów (jeszcze NIE dostępne): polecenia SMS, notatnik
kodów rabatowych, misje z voucherem, rabaty czasowe. Każda funkcja
będzie miała własny suwak per tenant.

## 8. Panel Booksero — co ustawia salon/tenant

- **Kolor akcentu aplikacji**: profil salonu (paleta 12 kolorów).
- **Suwak programu lojalnościowego** + poziomy + nagrody + bonusy
  punktowe: moduł Program lojalnościowy.
- **Zgłoszone nagrody**: karta klienta → sekcja „Zgłoszone nagrody"
  (przyciski „Wydano" / „Odrzuć").
- **Blokada klienta w aplikacji**: karta klienta → odznaczenie „aktywny".
- **Zasady anulowania online**: ustawienia rezerwacji online salonu.
- Zdjęcia (galeria), zespół, usługi, kategorie, godziny — standardowe
  dane salonu w Booksero; aplikacja pokazuje je automatycznie.

## 9. Najczęstsze pytania (FAQ)

**Klient nie dostaje SMS z kodem.**
Sprawdź: (1) czy klient z tym numerem nie jest dezaktywowany w panelu,
(2) czy tenant ma saldo SMS, (3) limit: maks. 3 kody na 10 minut na numer.

**Klient nie widzi przycisku „Odwołaj" przy wizycie.**
Wizyta jest przeszła/rozpoczęta albo salon ma wyłączone anulowanie online,
albo minął limit godzin przed wizytą.

**Zakładka Bonusy pokazuje „Program bonusowy nie jest jeszcze dostępny".**
Tenant nie włączył suwaka programu lojalnościowego w panelu.

**Klient widzi złe kolory / stary wygląd.**
Odświeżyć stronę aplikacji (to PWA — czasem trzyma starszą wersję).

**Czy klient może się zarejestrować bez wizyty w salonie?**
Tak — podaje numer, dostaje kod SMS, po kodzie wpisuje imię i konto
tworzy się samo. Rejestracja bez potwierdzenia SMS nie istnieje.

**Czy punkty łączą się między salonami sieci?**
Tak — saldo punktów i konto klienta działają na całą sieć (tenant).

**Jak salon blokuje niechcianego użytkownika?**
Dezaktywacja klienta w panelu — aplikacja przestaje wysyłać mu kody SMS,
bez żadnego komunikatu dla blokowanego.
