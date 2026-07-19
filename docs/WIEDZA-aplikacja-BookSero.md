# BookSero — aplikacja mobilna dla klientów salonów (baza wiedzy)

Stan na: 19.07.2026 (aktualizacja: Etap B — polecenia SMS).
Dokument opisuje DZIAŁAJĄCĄ produkcyjnie wersję aplikacji.

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

Zakładka Bonusy ma pasek pod-zakładek na dole (nad menu): Punkty ·
Nagrody · Polecaj · Moje kody — pokazują się tylko te moduły, które
tenant włączył. Gdy tenant wyłączy WSZYSTKIE funkcje bonusowe, ikona
Bonusy znika z dolnego menu całkowicie.

## 7a. Bonusy — Polecenia SMS (Etap B)

Suwak „Polecenia SMS" w panelu: Ustawienia → Aplikacja dla klientów →
sekcja „Akcje premiowane". Działa na całą sieć (per tenant).

Jak działa (pod-zakładka „Polecaj" w Bonusach):

1. Zalogowany klient wpisuje numer znajomego → system wysyła SMS
   (koszt z puli SMS tenanta, nazwa nadawcy tenanta) z imieniem
   polecającego i linkiem do aplikacji sieci z kodem polecającego.
2. Limity: maks. 5 poleceń miesięcznie, nie można polecić samego siebie,
   ten sam numer tylko raz w miesiącu. Numery poleconych są w aplikacji
   maskowane (••• •• XX).
3. Statusy polecenia w aplikacji: „Zaproszenie wysłane" → „Znajomy
   dołączył" → „Nagroda przyznana".
4. Nagrody (konfigurowane w panelu, osobno dla każdej strony; punkty
   ALBO kod rabatowy/voucher kwotowy):
   - **polecony** dostaje bonus powitalny od razu przy rejestracji
     z linku polecającego,
   - **polecający** dostaje nagrodę DOPIERO po pierwszej ZAKOŃCZONEJ
     wizycie poleconego (zabezpieczenie przed pustymi rezerwacjami).
5. Nagroda działa tylko dla NOWEGO klienta: jeśli numer poleconego już
   istnieje w bazie sieci, polecony loguje się do istniejącego konta,
   a przypisanie i nagrody celowo nie zachodzą (SMS i tak wychodzi —
   system nie ujawnia, kto jest w bazie).
6. Ważna zasada stawek: wartości z „Akcji premiowanych" są NADRZĘDNE
   nad domyślną stawką „Polecenie nowego klienta" w programie
   lojalnościowym (tamta działa tylko przy wartości 0).
7. Tryb testowy programu lojalnościowego: bonusy są rejestrowane, ale
   NIE zmieniają realnego salda — do testów wyłączyć tryb testowy.

## 7a-bis. Kody rabatowe (imienne) i „Moje kody" (Etap B2)

**Najważniejsza zasada: KODY RABATOWE ≠ PUNKTY i ≠ VOUCHERY prezentowe.**

1. **Kod rabatowy** to nagroda za AKCJE w aplikacji (np. polecenie),
   generowana automatycznie przez system: format `PREFIKS-XXXXXX`
   (prefiks, np. V25, i ważność w dniach ustawia Admin/Menedżer w
   „Akcjach premiowanych"). Kod NIE jest kupowany za punkty i NIE
   zmniejsza punktów — to całkowicie osobny świat.
2. **Kod jest IMIENNY**: przypisany do konkretnego klienta. Przy
   rozliczeniu wizyty system sprawdza, czy klient wizyty to właściciel
   kodu — kod na cudzej wizycie zostaje ODRZUCONY (recepcja widzi
   komunikat i etykietę „imienny" z nazwiskiem właściciela).
3. **Kod działa TYLKO NA USŁUGI**: obniża sumę usług na rozliczeniu;
   produkty zawsze pełnopłatne. Kod jest JEDNORAZOWY — przy realizacji
   schodzi całe saldo; jeśli kwota kodu przewyższa sumę usług,
   nadwyżka przepada (przykład: usługa 200 zł + produkt 100 zł,
   kod 25 zł → do zapłaty 175 + 100).
4. **Voucher kwotowy (prezentowy)** to INNY twór: na okaziciela, można
   go podarować, system nie kontroluje realizującego. Zasady bez zmian.
5. **Pod-zakładka „Moje kody"** (suwak „Notatnik kodów" per tenant):
   klient widzi wszystkie swoje kody/vouchery (kod — kliknięcie
   kopiuje, kwota, ważność, status: Aktywny/Wykorzystany/Wygasł) oraz
   ma notatnik własnych kodów (dodaj z notatką, oznacz wykorzystany,
   usuń; limit 100 wpisów).

FAQ:
- „Kod nie działa przy rozliczeniu" → najpewniej wizyta nie należy do
  właściciela kodu (kod imienny) albo kwota przekracza sumę usług
  (system podpowiada maksimum) albo kod wygasł.
- „Gdzie klient znajdzie swój kod?" → aplikacja → Bonusy → Moje kody.
- „Czy można oddać kod koledze?" → nie, kod jest imienny; do dawania
  prezentów służą vouchery kwotowe.

## 7a-ter. Tryb premiowania: PUNKTY albo KODY (per tenant)

W panelu (Ustawienia → Aplikacja dla klientów → Akcje premiowane)
Manager/Admin wybiera JEDEN sposób premiowania akcji w aplikacji:

1. **⭐ Punkty** — za akcje klienci dostają punkty programu
   lojalnościowego (buduje lojalność i powroty; można premiować
   „delikatnie", bez rozpieszczania).
2. **🎟 Kody rabatowe** — za akcje klienci dostają imienne kody
   z terminem ważności (namacalny rabat motywujący do SZYBKIEJ
   rezerwacji przed wygaśnięciem kodu).

Zasady mechanizmu:
- Nigdy miks — działa albo jedno, albo drugie; tryb można zmieniać
  w czasie (strategia marketingowa).
- Wartości pamiętane OSOBNO per tryb (500 pkt nigdy nie stanie się
  kwotą 500); jednostka widoczna w polach; kwoty w WALUCIE lokalizacji
  (PLN/EUR/CZK...), nie na sztywno „zł".
- Zmiana trybu wymaga potwierdzenia w oknie z podsumowaniem; przy
  nieustawionych kwotach (0) okno OSTRZEGA, że nagrody nie będą
  przyznawane. Kwota kodu > 100 wymaga dodatkowego potwierdzenia.
- Tryb obowiązuje W CHWILI przyznania nagrody — dotyczy też nagród
  za polecenia sprzed zmiany trybu.
- **Limity wydawania kodów** (ukryte przed klientem, per OSOBA w całej
  sieci): maks./tydzień, maks./miesiąc (domyślnie 2), maks./rok oraz
  minimalny odstęp dni (domyślnie 10). Zablokowane wydanie trafia do
  Rejestru zdarzeń (nagroda nie jest zamieniana na punkty).
- Program lojalnościowy (punkty za wizyty, poziomy) działa niezależnie,
  pod własnym suwakiem.

Plan kolejnych etapów (jeszcze NIE dostępne): akcje aktywnościowe
(kody za używanie aplikacji, powroty, kampanie), misje z voucherem,
rabaty czasowe. Każda funkcja będzie miała własny suwak per tenant.

## 7b. Punkty — skąd się biorą i co jest nadrzędne (WAŻNE dla wsparcia)

### Wszystkie źródła punktów klienta

Punkty na koncie klienta mogą pochodzić z KILKU źródeł naraz — dlatego
saldo bywa „zaskakująco" wysokie. Pełna lista:

1. **Wydatki na wizytach** — po ZAKOŃCZONEJ wizycie: cena × przelicznik
   pkt/zł z programu lojalnościowego (osobny przelicznik za usługi
   i za produkty). To zwykle największe kwoty.
2. **Przystąpienie do programu** — jednorazowo, po kliknięciu „Dołącz
   do programu" w aplikacji (stawka z programu lojalnościowego).
3. **Bonus powitalny z polecenia** — dla POLECONEGO, przy rejestracji
   z linku polecającego (kwota z „Akcji premiowanych").
4. **Nagroda za skuteczne polecenie** — dla POLECAJĄCEGO, po pierwszej
   zakończonej wizycie poleconego (kwota z „Akcji premiowanych").
5. **Bonusy okazjonalne** — urodziny, imieniny, opinia, opinia w social
   media (stawki z programu lojalnościowego).
6. **Odejmowanie**: tylko przy wydaniu nagrody z katalogu („Wydano"
   na karcie klienta w panelu) — saldo maleje o koszt nagrody.

### Dwa miejsca konfiguracji — które wygrywa (PRIORYTETY)

W panelu są DWA miejsca dotyczące punktów i to myli:

- **Moduł „Program lojalnościowy"** — przeliczniki pkt/zł, bonusy
  okazjonalne (urodziny, opinia…), bonus za dołączenie ORAZ domyślna
  stawka „Polecenie nowego klienta".
- **Ustawienia → Aplikacja dla klientów → „Akcje premiowane"** —
  nagrody za polecenia w APLIKACJI: osobno dla polecającego i poleconego
  (punkty albo kod rabatowy/voucher).

**Zasada priorytetu:** przy poleceniach z aplikacji **„Akcje premiowane"
są NADRZĘDNE**. Domyślna stawka „Polecenie nowego klienta" z programu
lojalnościowego jest używana TYLKO wtedy, gdy nagroda polecającego
w „Akcjach premiowanych" ma wartość **0**.
Przykład: program ma „Polecenie: 200", Akcje premiowane „500" →
polecający dostaje **500**, nie 200 (i nie 700 — kwoty się NIE sumują).

### Saldo vs dorobek (dlaczego poziom nie spada)

- **Saldo** — punkty do wydania na nagrody; maleje przy „Wydano".
- **Dorobek (lifetime)** — suma wszystkich DODATNICH naliczeń; nigdy
  nie maleje i to z niego liczony jest POZIOM (Start→VIP).
Efekt: po odebraniu nagrody saldo spada, ale poziom zostaje.

### Pułapka wyświetlania na karcie klienta

Lista bonusów z „ptaszkami" na karcie klienta (zakładka Lojalność)
pokazuje **skonfigurowane stawki programu**, a NIE faktycznie naliczone
kwoty. Faktyczne kwoty są w historii transakcji punktowych. Przykład:
ptaszek przy „Polecenie nowego klienta: 200 pkt", a klient dostał 300 —
bo naliczyła się nadrzędna kwota z „Akcji premiowanych".

### Przykład pełnego rozliczenia (autentyczny przypadek testowy)

Nowy klient zarejestrował się z linku polecającego i odbył wizytę
za 180 zł (przelicznik 5 pkt/zł):

| Zdarzenie | Punkty |
|---|---|
| Bonus powitalny z polecenia (Akcje premiowane) | +300 |
| Dołączenie do programu (klik w aplikacji) | +100 |
| Zakończona wizyta 180 zł × 5 pkt/zł | +900 |
| **Saldo klienta** | **1300** |

A polecający dostał osobno **+500** (Akcje premiowane, po zakończonej
wizycie poleconego).

### Gotowe odpowiedzi na pytania klientów

**„Skąd mam nagle tyle punktów?"**
Sprawdź historię transakcji na karcie klienta — saldo to suma kilku
źródeł (wizyta + bonusy). Najczęściej „niespodziewane" punkty to bonus
z polecenia + bonus za dołączenie + punkty za pierwszą wizytę.

**„Dostałem inną kwotę niż na liście bonusów."**
Lista pokazuje stawki domyślne programu; przy poleceniach z aplikacji
obowiązuje nadrzędna kwota z „Akcji premiowanych". Prawda jest zawsze
w historii transakcji.

**„Wydałem punkty na nagrodę i nie spadł mi poziom."**
To celowe: poziom liczy się z dorobku (lifetime), który nigdy nie
maleje. Spada tylko saldo do wydawania.

**„Poleciłem 3 osoby i nic nie dostałem."**
Nagroda przychodzi za każdego poleconego dopiero po JEGO pierwszej
ZAKOŃCZONEJ wizycie — i tylko jeśli był NOWYM klientem (rejestrował się
z pytaniem o imię). Statusy widać w aplikacji: Bonusy → Polecaj.

**„Klient twierdzi, że punkty się nie naliczają w ogóle."**
Kolejność sprawdzania: (1) czy program lojalnościowy jest AKTYWNY,
(2) czy TRYB TESTOWY jest wyłączony (w trybie testowym bonusy są
rejestrowane, ale nie zmieniają realnego salda), (3) czy wizyta ma
status ZAKOŃCZONA, (4) historia transakcji na karcie klienta.

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

**Poleciłem znajomego, ale nie dostałem nagrody.**
Sprawdź po kolei: (1) nagroda polecającego przychodzi dopiero po
pierwszej ZAKOŃCZONEJ wizycie poleconego, (2) polecony musiał być NOWYM
klientem (rejestracja z pytaniem o imię) — jeśli jego numer już był
w bazie, nagrody celowo nie ma, (3) tryb testowy programu
lojalnościowego musi być wyłączony.

**Polecony nie widzi bonusu powitalnego w aplikacji.**
Punkty są na jego karcie w panelu od razu, ale w aplikacji saldo widzi
dopiero po kliknięciu „Dołącz do programu" w zakładce Bonusy.
