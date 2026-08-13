# BRIEF dla agenta panelu — czego Sero ma się douczyć o ZGODACH

Sero ma już sekcję o zgodach w `server/services/assistant.ts` (ok. linii 165,
commit `7aa1a172` z 2026-08-13 19:58): cztery typy, rozbicie wizerunku, „Zgody
zbierane przy rezerwacji", plakietka braków, wycofanie działa na przyszłość.
**Tego nie duplikuj.** Brakuje mu całej strony KLIENCKIEJ — poniżej jest to,
czego nie wie, a o co recepcja pyta najczęściej.

Stan aplikacji, do którego się to odnosi: **BookSero 1.0.32**.

---

## 1. Gdzie klientka ma zgody u siebie w telefonie

Aplikacja BookSero → zakładka **Profil** → sekcja **ZGODY** (ikona tarczy,
tuż pod danymi klientki, nad listą salonów). Sekcja jest **zwijana i domyślnie
zwinięta** — trzeba w nią tapnąć. Każde rozwinięcie pobiera świeży stan
z serwera, więc klientka wychodząca od recepcji widzi zmianę od razu; nie ma
tu powiadomienia ani odświeżania w tle.

Każda zgoda to jeden **przełącznik** plus podpis: „udzielona {data}" albo
„wycofana {data}". Przełącznik nie rusza się, dopóki serwer nie potwierdzi
zapisu, więc to, co klientka widzi, jest zawsze stanem zapisanym.

Pod listą jest **„Pokaż pozostałe zgody"**. Odsłania typy, których dana
lokalizacja nie zbiera. To jest wyjście awaryjne wymagane przez art. 7 ust. 3
RODO: wycofanie ma być równie łatwe jak udzielenie, a zgoda, której nie da się
nawet wyświetlić, jest nieosiągalna. Praktycznie: **klientka zawsze może
włączyć i wyłączyć każdą z czterech zgód sama, z telefonu, bez kontaktu
z salonem.**

## 2. Zasięg zmiany zrobionej z aplikacji

Zmiana z aplikacji obejmuje **wszystkie kartoteki tej osoby w całej sieci**
(w Żorach i w Pniówku naraz), a nie tylko lokalizację, w której akurat jest.
Klientka nie wie i nie ma powodu wiedzieć, że ma osobną kartotekę w każdym
salonie — zostawienie zgody w jednej z nich po wycofaniu w drugiej byłoby
wycofaniem pozornym. Poza sieć to nie wychodzi: inna firma to inny administrator.

Na karcie klientki taki wpis ma źródło **„aplikacja klientki"** (`client_app`),
a w rejestrze zdarzeń widnieje bez `userId` — bo zmienił go człowiek, którego
zgoda dotyczy. Przy kontroli to jest MOCNIEJSZY dowód niż zmiana z recepcji.

## 3. Języki

Aplikacja mówi w 16 językach i etykiety zgód są przetłumaczone w każdym.
Klientka z kraju spoza tej listy (np. Dania) dostaje wersję **angielską** —
nie polską. Treści wpisane przez salon (nazwy usług, opisy) zostają w języku,
w którym salon je wpisał; tego aplikacja nie tłumaczy.

## 4. Czego Sero mówić NIE WOLNO

- „Żeby włączyć zgodę z powrotem, proszę zadzwonić do salonu" — nieprawda,
  klientka robi to sama w Profilu, ewentualnie po tapnięciu „Pokaż pozostałe
  zgody".
- „W aplikacji widać tylko zgody, które zbiera dana lokalizacja" — nieprawda
  od 1.0.31; przycisk odsłania pozostałe.
- „Zmiana z aplikacji dotyczy tylko tego salonu" — nieprawda, dotyczy całej sieci.

## 5. Gotowe odpowiedzi (recepcja pyta dokładnie tak)

- **„Klientka mówi, że nie widzi w aplikacji zgody na zdjęcia."** → To znaczy,
  że ta lokalizacja jej nie zbiera. Klientka: Profil → ZGODY → „Pokaż pozostałe
  zgody" → zgoda jest tam i da się ją włączyć. Żeby była widoczna od razu dla
  wszystkich: Ustawienia → Rezerwacja online → „Zgody zbierane przy rezerwacji"
  → włączyć „Publikacja zdjęć". To ustawienie jest **per lokalizacja** — trzeba
  je zapisać osobno w każdej.
- **„Klientka wycofała zgodę u siebie w telefonie — czy my to widzimy?"** →
  Tak, natychmiast, na karcie klientki w zakładce Informacje, ze źródłem
  „aplikacja klientki" i datą. Wpis trafia do historii, nic się nie nadpisuje.
- **„Wyłączyliśmy zgodę na karcie, a klientka nadal widzi ją włączoną."** →
  [patrz §7 — odpowiedź zależy od tego, czy poprawka jest już wdrożona]
- **„Czy klientka dostanie powiadomienie, że zgoda się zmieniła?"** → Nie.
  Aplikacja czyta stan przy wejściu na Profil i przy rozwinięciu sekcji ZGODY.
  Jeśli klientka patrzy w telefon w trakcie rozmowy — niech zwinie i rozwinie
  ZGODY jeszcze raz.
- **„Klientka wyłączyła marketing. Czy to znaczy, że nie dostanie potwierdzenia
  wizyty?"** → Nie. Zgoda marketingowa dotyczy promocji i nowości.
  Potwierdzenia, przypomnienia i informacje o odwołaniu to obsługa rezerwacji,
  nie marketing — idą dalej.

## 6. Gdzie to wpisać

`server/services/assistant.ts`, do istniejącej sekcji o zgodach (nie zakładaj
nowej — Sero ma mieć jedno miejsce na ten temat).

Dołóż **strażnik w teście**, wzorem `server/para-dwie-kartoteki.test.ts` (test
czyta `assistant.ts` i sprawdza obecność kluczowych fraz) — inaczej ta wiedza
wyparuje przy pierwszym większym przepisaniu promptu. Zaproponowane asercje:
`"Pokaż pozostałe zgody"`, `"wszystkie kartoteki tej osoby"`, `"aplikacja klientki"`.

## 7. WARUNEK — czego NIE dopisywać przedwcześnie

Do czasu wdrożenia poprawki ze zlecenia „zgody z recepcji" (usterka 2:
`PATCH /api/salon/clients/:id/zgody` zapisuje na JEDNEJ kartotece, a aplikacja
czyta sumę ze wszystkich) **wycofanie z recepcji NIE gasi zgody w aplikacji**,
jeżeli klientka ma kartotekę w więcej niż jednej lokalizacji.

Dopóki tak jest, Sero ma mówić PRAWDĘ: „wycofanie na karcie działa na tę
kartotekę; jeśli klientka bywa w kilku lokalizacjach tej firmy, wycofaj też
tam albo poproś ją, żeby przestawiła to w aplikacji — zmiana z aplikacji
obejmuje wszystkie lokalizacje naraz".

Po wdrożeniu poprawki **zmień to zdanie w tym samym commicie** na: „wycofanie
z recepcji obejmuje wszystkie kartoteki tej osoby w sieci — tak samo jak
zmiana z aplikacji". Wiedza Sera i zachowanie systemu nie mogą się rozjechać
ani na jeden deploy: asystent, który mówi co innego, niż robi system, jest
gorszy niż brak asystenta.
