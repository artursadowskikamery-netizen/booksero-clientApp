# SPEC — Etap D: Rabaty czasowe (happy hours w kalendarzu rezerwacji)

Salon zapełnia „martwe godziny": wybrane terminy (dni tygodnia + okno
godzinowe) mają obniżoną cenę usług przy rezerwacji ONLINE. Klient widzi
w kalendarzu aplikacji promowane godziny z ceną po rabacie; rabat nalicza
się automatycznie i jest widoczny w rozliczeniu.

Gałąź robocza: odgałęzić od `claude/hej-5yvvly`, nazwa
`claude/time-discounts`. Nie mergować do main. Zmiany schematu dozwolone
(ADD-only; `db:push` będzie potrzebny — nowa tabela).

## 0. Zasady nadrzędne (ustalenia właściciela)

1. **Happy hours dla każdego** — rabat przysługuje KAŻDEMU, kto
   zarezerwuje online termin objęty regułą. Bez grup klientów, bez
   weryfikacji.
2. **Konfiguracja per SALON** (każdy salon ma własne martwe godziny);
   suwak funkcji `timeDiscounts` — per tenant (jak pozostałe).
3. **Forma rabatu do wyboru per reguła**: procent (np. -20%) ALBO kwota
   (np. -30, w walucie salonu).
4. **Rabat czasowy NIE ŁĄCZY SIĘ z kodem rabatowym** (imiennym) na tej
   samej wizycie — jedna wizyta = jedna promocja. UWAGA: **voucher
   kwotowy na okaziciela to środek płatniczy (ktoś za niego zapłacił)
   — działa NORMALNIE także na wizycie z rabatem czasowym.** Blokada
   dotyczy wyłącznie kodów promocyjnych (`personalOnly`).
5. Rabat dotyczy **rezerwacji ONLINE** (publiczne API — aplikacja
   i wizytówka). Wizyty zakładane ręcznie w panelu — bez automatu
   (recepcja może dać rabat ręcznie jak dotąd).
6. Cena PO rabacie jest **liczona przez SERWER w chwili rezerwacji**
   (klient niczego nie może wymusić); przedpłaty liczone od ceny po
   rabacie.

## 1. Model danych

Nowa tabela `time_discounts`:
`id, tenantId, salonId, name (etykieta dla klienta, np. "Happy hours"),
daysOfWeek (jsonb, np. [1,2,3,4,5] — 1=pon..7=nd), timeFrom, timeTo
("HH:MM"; reguła obejmuje sloty ZACZYNAJĄCE SIĘ w oknie [from, to)),
discountType ('percent'|'amount'), discountValue (decimal),
serviceIds (jsonb | null — null = wszystkie usługi, inaczej lista),
isActive, createdAt` + indeks (tenantId, salonId).

- Wiele reguł per salon dozwolone. Gdy slot łapie się na kilka reguł —
  obowiązuje JEDNA, najkorzystniejsza dla klienta (największy rabat).
  Rabaty się NIE sumują.
- Dni/godziny liczone w STREFIE CZASOWEJ salonu (jak reszta kalendarza).
- Walidacja reguły: procent 1–90; kwota > 0; kwota nie może obniżyć ceny
  poniżej 0 (przycinamy do 0 przy naliczeniu).

## 2. Publiczne API (rezerwacja online)

1. `GET /api/public/book/:salonId/availability` — każdy slot objęty
   aktywną regułą (dla wybranej usługi) dostaje dodatkowe pola:
   `discount: { name, type, value, priceAfter }`
   (`priceAfter` = cena usługi po rabacie, string jak ceny).
   Sloty bez rabatu — bez zmian (kompatybilność wstecz).
2. `POST /api/public/book/:salonId/appointments` — serwer SAM wylicza
   rabat wg reguł w chwili rezerwacji (dzień+godzina+usługa) i zapisuje
   go na pozycji wizyty ISTNIEJĄCYM polem rabatu
   (`appointment_services.discount`) + etykieta reguły w opisie/notatce
   wg istniejącej konwencji. Dotyczy też rezerwacji dla pary (rabat
   liczony osobno dla każdej usługi, jeśli obie łapią się na regułę).
   Odpowiedź zwraca cenę po rabacie (kształt jak dotychczas + ewentualne
   pole `discountApplied`).
3. Przedpłata: liczona od ceny PO rabacie (użyć istniejącej ścieżki —
   rabat wchodzi przed wyliczeniem przedpłaty).
4. `appFeatures.timeDiscounts` dodać do `GET /api/public/book/:salonId`.
   Suwak wyłączony → reguły nie działają (availability bez rabatów,
   appointments bez naliczeń).

## 3. Kasa / rozliczenie

1. Rabat siedzi w istniejącym polu `discount` pozycji — rozliczenie
   pokazuje go jak każdy rabat (bez nowych mechanizmów).
2. **Blokada łączenia**: przy realizacji KODU IMIENNEGO (`personalOnly`)
   na wizycie, której pozycje mają rabat czasowy (rozpoznawalny po
   znaczniku reguły z §2.2) → odmowa z komunikatem i18n („Na tej wizycie
   naliczono już promocję czasową — kod rabatowy nie łączy się
   z promocjami"). Vouchery na okaziciela — bez blokady.
3. Suma usług do walidacji kodów (Etap B2) już liczy `price - discount`
   — zachowanie spójne automatycznie.

## 4. Panel

Ustawienia → Aplikacja dla klientów:
- suwak **„Rabaty czasowe"** (`timeDiscounts`) — zdjąć z listy „wkrótce",
- sekcja **„Rabaty czasowe"**: wybór salonu → lista reguł (CRUD):
  nazwa, dni tygodnia (przyciski pon–nd), okno godzinowe od–do,
  typ (procent/kwota — kwota w WALUCIE salonu, bez sztywnego „zł"),
  wartość, zakres usług (wszystkie / wybrane), aktywna (suwak).
  Prosty opis sekcji: „Obniż ceny w godzinach, które zwykle świecą
  pustkami — klienci zobaczą promowane terminy w aplikacji."
- Uprawnienia jak reszta strony (Admin/Menedżer).

## 5. i18n

- Teksty panelu (§4): PEŁNE tłumaczenia ×16 języków w plikach locale
  (audyt jak w SPEC-tryb-premiowania §4).
- Serwer: nowy kod komunikatu blokady łączenia (§3.2) ×16 w
  `server/i18n/messages.ts`; nazwy reguł wpisuje manager (nie tłumaczymy).

## 6. Bezpieczeństwo / spójność

- Wszystkie odczyty/zapisy reguł tenant- i salon-scoped.
- Cena po rabacie zawsze z serwera (availability to podgląd; przy POST
  serwer liczy od zera — rozjazd podglądu z naliczeniem niemożliwy).
- Reguły nieaktywne/suwak off → zero wpływu na ceny.
- Mechanika kodów, voucherów, punktów, poleceń — nietknięta poza
  blokadą łączenia (§3.2).

## 7. Testy / Definition of Done

1. Reguła pon–pt 11:00–14:00, -20%: availability pokazuje rabat tylko
   na slotach startujących w oknie; rezerwacja zapisuje rabat na pozycji;
   rozliczenie pokazuje cenę po rabacie.
2. Reguła kwotowa (-30) nie schodzi poniżej 0; procent poza 1–90
   odrzucany przy zapisie reguły.
3. Dwie nakładające się reguły → naliczona najkorzystniejsza, bez
   sumowania.
4. Rezerwacja dla pary: rabat na obu usługach, gdy obie w oknie.
5. Przedpłata liczona od ceny po rabacie.
6. Kod imienny na wizycie z rabatem czasowym → odmowa z komunikatem;
   voucher na okaziciela → działa.
7. Suwak `timeDiscounts` off → availability i appointments bez rabatów;
   `appFeatures.timeDiscounts` w /book odzwierciedla stan.
8. Wizyta zakładana ręcznie w panelu → bez automatycznego rabatu.
9. Audyt i18n ×16 dla panelu; komunikat blokady ×16 na serwerze.
10. TypeScript kompiluje; `npm run db:push` wykonalny (ADD-only).
11. Push na gałąź `claude/time-discounts`; w raporcie hash commita,
    lista plików, potwierdzenie db:push.
