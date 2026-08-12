# ZAMÓWIENIE dla sesji panelu — potwierdzenie rezerwacji także dla 2. osoby

**Decyzja właściciela z 2026-08-12 — ZMIANA wcześniejszej reguły.**

Dotychczas obowiązywało „jedna rezerwacja = jeden SMS": druga osoba pary
nie dostawała żadnego powiadomienia o rezerwacji (tylko prośbę o opinię po
wizycie). Właściciel testował ten scenariusz, uznał brak wiadomości za
mylący i **zdecydował to zmienić**.

## Nowa reguła

Druga osoba pary, która MA KARTOTEKĘ (podano jej numer, czyli tryb
„niespodzianka" był WYŁĄCZONY), dostaje **potwierdzenie rezerwacji**.

| zdarzenie | rezerwujący | druga osoba (z numerem) | druga osoba (niespodzianka) |
|---|---|---|---|
| potwierdzenie rezerwacji | tak | **TAK — to jest zmiana** | nie |
| przypomnienie przed wizytą | tak | **nie** (bez zmian) | nie |
| prośba o opinię po wizycie | tak | tak (bez zmian) | nie |
| odwołanie wizyty | tak | **nie** (decyzja właściciela) | nie |

## Szczegóły do uwzględnienia

1. **Kanał wg istniejącego ustawienia tenanta.** Jeśli tenant ma tryb
   „Push zamiast SMS", a druga osoba ma aplikację i zgodę — niech pójdzie
   darmowy push, a SMS tylko gdy push zawiedzie. To ta sama logika co przy
   rezerwującym; nie róbcie dla niej osobnej ścieżki.
2. **Treść dla drugiej osoby musi być inna niż dla rezerwującego.** Ona
   niczego nie rezerwowała — wiadomość powinna mówić, że ktoś umówił dla
   niej wizytę, i podawać JEJ zabieg i JEJ specjalistę (nie rezerwującego).
   Proponowany sens: „Umówiono dla Ciebie wizytę: <jej usługa>, <data>,
   <godzina>, <lokalizacja>." Godzina w strefie lokalizacji.
3. **Bez linku do odwołania.** Odwołuje wyłącznie rezerwujący (decyzja bez
   zmian) — wiadomość do drugiej osoby nie może zawierać tokenu anulowania.
4. **Koszt.** To +1 SMS z portfela tenanta na każdą rezerwację pary
   z podanym numerem. Warto, żeby Sero umiało to wytłumaczyć managerowi,
   gdy zapyta o zużycie SMS-ów.
5. **Rezerwacje z panelu.** Ta sama reguła powinna obowiązywać, gdy
   recepcja zakłada wizytę dla dwóch osób i wybierze kartę drugiej osoby —
   inaczej klient dostanie wiadomość tylko przy rezerwacji z aplikacji.

## Odwołanie wizyty — rozstrzygnięte, NIE zmieniać

Właściciel zdecydował (2026-08-12): przy odwołaniu wizyty pary
powiadomienie dostaje **wyłącznie osoba, która rezerwowała**. Druga osoba
nie dostaje nic — także wtedy, gdy ma kartotekę i numer.

Czyli zmiana w tym zamówieniu dotyczy **tylko potwierdzenia rezerwacji**.
Ścieżka odwołania zostaje dokładnie taka, jak jest dziś.

## UWAGA — dwa miejsca, które trzeba poprawić RAZEM ze zmianą

Inaczej zostanie sprzeczność w systemie:

1. **Wiedza Sero** (`server/services/assistant.ts`) — reguła jest opisana
   w DWÓCH miejscach: w sekcji „PO WIZYCIE — CO DOSTAJE KTO" oraz w gotowej
   odpowiedzi „Wizyta dla 2 osób — czy druga osoba też dostanie
   powiadomienie?". Obie mówią dziś, że potwierdzenia dostaje TYLKO
   rezerwujący. Bez poprawki Sero będzie wprowadzał managerów w błąd.
2. **Test** `server/para-dwie-kartoteki.test.ts` (ok. linii 118) zawiera
   `expect(wiedza).toContain("jedna rezerwacja = jeden SMS")` — po zmianie
   wiedzy ten test się wywali. Trzeba go zaktualizować razem ze zmianą,
   a nie „naprawiać" potem w oderwaniu od kontekstu.

## Strona aplikacji klienckiej

Nic do zrobienia — to wyłącznie warstwa powiadomień serwera. Aplikacja
już dziś wysyła `secondClientPhone` (wersja 1.0.21) i pomija je przy
niespodziance, więc rozróżnienie „z kartoteką / bez" macie gotowe.
