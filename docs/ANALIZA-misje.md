# ANALIZA — funkcja „Misje" (grywalizacja): decyzja ODŁOŻONE

Data decyzji: 20.07.2026. Status: **NIE WDRAŻAMY teraz.**
Notatka na przyszłość — gdy temat wróci, zacząć od tego dokumentu.

## 1. Czym były Misje w starej aplikacji (APPvivimassage)

Klient wykonuje 4 zadania → nagroda: voucher kwotowy wysyłany W PREZENCIE
bliskiej osobie (akwizycja nowego klienta). Limity ukryte: 3 vouchery/rok,
min. 3 miesiące odstępu. Realizacja: n8n + pula kodów w Google Sheets +
ręczna aktywacja przez recepcję + SMS przez SerwerSMS.

Misje: (1) opinia Google — zaliczana za KLIKNIĘCIE linku, (2) wizyta
w salonie — skan statycznego QR w recepcji, (3) wysłanie 3 poleceń SMS —
zaliczane za samo WYSŁANIE, (4) rezerwacja — zaliczana za DOKONANIE
rezerwacji (nie za odbytą wizytę).

## 2. Dlaczego NIE wdrażamy (werdykt z analizy)

1. **Większość wartości biznesowej już pokrywają istniejące funkcje**
   BookSero: polecenia (z lepszą ekonomią — nagroda po ODBYTEJ wizycie),
   punkty/poziomy za wizyty, rezerwacje w aplikacji. Unikalna wartość
   misji = tylko voucher-prezent (akwizycja) + efekt grywalizacji.
2. **Wbudowane furtki do nadużyć** — dokładnie te, które w BookSero
   świadomie pozamykaliśmy:
   - rezerwacja zalicza misję → rezerwuj i odwołaj,
   - wysłanie poleceń zalicza misję → 3 SMS-y z puli tenanta na
     przypadkowe numery,
   - opinia „za kliknięcie" → fikcja zaliczenia.
3. **Ryzyko regulaminowe Google**: nagradzanie za opinie łamie zasady
   Google (incentivized reviews) — ryzyko filtrowania opinii/kar dla
   wizytówki salonu.
4. **QR**: statyczny kod krąży jako zdjęcie; aplikacja nie ma jeszcze
   skanera QR (osobna praca).
5. **Stabilność/reklamacje**: najbardziej stanowa funkcja z całego
   backlogu (4 misje × postęp × cykle × reset × ukryte limity × przepływ
   prezentu do osoby trzeciej). Klasyczny generator zgłoszeń „misja mi
   się nie zaliczyła". Najwyższy stosunek złożoności do wartości.
6. **Zły moment**: grywalizacja ma sens przy istniejącej bazie aktywnych
   użytkowników — nie na rozruchu aplikacji.

## 3. Co zamiast tego (tańszy zamiennik o większości efektu)

**Akcje aktywnościowe** na istniejącym silniku Akcji premiowanych
(tryb premiowania punkty/kody + limity już działają):
- kod/punkty za pierwszą rezerwację przez aplikację,
- kod „wróć do nas" (brak wizyty od X dni),
- w przyszłości: kampania „podaruj znajomemu kod" (wartość akwizycyjna
  vouchera-prezentu bez maszyny stanów misji).
~20% złożoności misji, większość ich efektu, zero nowej maszyny stanów.

## 4. Jeśli KIEDYŚ misje — warunki brzegowe przeprojektowania

1. Zaliczenia odporne na nadużycia: polecenie = znajomy DOŁĄCZYŁ
   (nie „wysłano SMS"), wizyta/rezerwacja = wizyta ODBYTA (completed).
2. Opinii Google NIE nagradzać wprost (neutralne „oceń nas" bez nagrody
   albo nagroda za inną aktywność) — zgodność z zasadami Google.
3. QR jednorazowe/rotacyjne + najpierw zbudować skaner QR w aplikacji.
4. Nagroda przez natywne vouchery Booksero (na okaziciela — to prezent),
   automatycznie, bez pul w arkuszach i ręcznej aktywacji.
5. Limity per OSOBA w sieci (wzorzec z kodów: okna kroczące,
   deriveClientIds/personRecordIds).
6. Start dopiero przy realnej bazie aktywnych użytkowników aplikacji
   i po zmierzeniu wyników poleceń/kodów (liczby: ile poleceń, ile
   dołączeń, ile odbytych wizyt z poleceń).

## 5. Stare endpointy (tylko informacyjnie, NIE przenosić 1:1)

`GET /api/missions/status` · `POST /api/missions/submit-voucher` ·
`POST /api/vouchers/send-v100` — oparte o n8n + Google Sheets + ręczną
aktywację; w Booksero nagroda byłaby natywnym voucherem, ale to upraszcza
tylko nagrodę, nie grywalizację (główne źródło złożoności).
