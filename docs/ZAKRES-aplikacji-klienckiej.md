# ZAKRES APLIKACJI KLIENCKIEJ BookSero — dokument referencyjny dla weryfikacji wiedzy Sero

Stan na **BookSero 1.0.32**, 2026-08-13. Dokument opisuje, co aplikacja
klientki NAPRAWDĘ robi, gdzie klientka to znajduje i gdzie leżą granice.
Powstał z kodu, nie z pamięci.

Przeznaczenie: agent panelu ma tym **zweryfikować i uzupełnić wiedzę Sera**.
Reguła nadrzędna: jeżeli Sero mówi coś, czego nie ma poniżej — to jest do
sprawdzenia, a nie do powtarzania. Asystent, który mówi co innego, niż robi
system, jest gorszy niż brak asystenta.

---

## 0. Czym ta aplikacja jest, a czym nie

- **PWA** (strona instalowana jak aplikacja), a nie osobny program z Google
  Play — instalacja odbywa się z przeglądarki. Publikacja w sklepie jest
  przygotowana, ale **wstrzymana decyzją właściciela**.
- **Jedna aplikacja dla wszystkich firm** korzystających z Booksero. Klientka
  wchodzi do konkretnego salonu; sesja logowania jest ważna **w obrębie jednej
  sieci (tenanta)**. Wejście do salonu innej firmy wymaga osobnego logowania.
- Aplikacja **nie ma własnej bazy klientów**. Wszystko czyta i zapisuje przez
  publiczne API Booksero — kartoteka, wizyty, punkty i zgody to te same dane,
  które widzi recepcja w panelu. Nie ma tu drugiego źródła prawdy.
- Nie ma dostępu do danych innych firm ani innych klientek. Token logowania
  niesie sieć i numer telefonu; wszystko poza tym jest niewidoczne.

## 1. Jak klientka wchodzi do salonu

Drogi z ekranu startowego („Znajdź swój salon"), stan od 1.0.33:

1. **Kod QR** — skaner w aplikacji. Kod z wizytówki prowadzi wprost do salonu.
2. **Hasło salonu** — pole „Wpisz hasło swojej ulubionej firmy". Słowo, które
   recepcja mówi klientce („wpisz Vivi"); ustawia je lokalizacja w panelu.
   Dopasowanie DOKŁADNE, w obrębie kraju (obok pola wybór kraju flagą).
   Kilka lokalizacji z tym samym hasłem → wybór wewnątrz tej firmy. To samo
   pole rozumie po cichu dawne adresy wizytówki i kody sieci
   (`t:<identyfikator>`).
3. **Numer telefonu** — „Masz już u nas kartotekę? Wejdź numerem telefonu":
   jeden SMS, lista firm z kartoteką, wejście od razu zalogowane. Nie wycieka
   nic: trzeba mieć telefon klientki w ręku.
4. **Ostatnio odwiedzane salony** — do **pięciu** kafelków z nazwą, miastem
   i logo, zapisanych na urządzeniu. Salon usunięty z systemu znika z listy.

Osobno działa **link polecenia** (`/r/<kod>`) — otwiera sieć polecającego
i zapamiętuje kod aż do rejestracji.

**Czego celowo NIE MA: wyszukiwarki ani listy salonów.** Każde podpowiadanie
po nazwie jest katalogiem, a katalog pozwala konkurencji wypisać klientów
Booksero. Nowa klientka bez kodu, hasła i kartoteki dostaje link, hasło lub
QR od salonu — aplikacja jest wejściem dla klientek salonu, nie miejscem
szukania salonów. Stopka: „Pierwszy raz? Poproś salon o hasło lub kod QR."

Panel wdrożył obie drogi 2026-09-05. Droga 2 (hasło) jest włączona.
**Droga 3 (numer) jest ZARYGLOWANA w aplikacji** do decyzji właściciela:
zestawia klientce listę firm należących do niezależnych administratorów
danych i czeka na potwierdzenie prawnika oraz wpis do polityki prywatności.
Sero nie ma prawa jej klientkom obiecywać, dopóki rygiel nie zejdzie.

**Wyłącznik aplikacji per lokalizacja** (panel): firma może wyłączyć
aplikację; wtedy każda droga wejścia, także QR i link, kończy się komunikatem
„Ta firma nie udostępnia aplikacji". Wizytówka i rezerwacja online działają
dalej.

**Numer wersji aplikacji jest widoczny na ekranie startowym, pod polem kodu —
bez logowania.** To celowe: gdyby wersja była tylko w Profilu, klientka
z zepsutym logowaniem nie mogłaby jej odczytać ani zaktualizować aplikacji.

## 2. Logowanie (SMS)

- Klientka podaje numer telefonu i dostaje **kod SMS**. Numer wpisuje się
  w standardzie międzynarodowym: osobne pole kraju (flaga + prefiks) i osobne
  pole numeru krajowego. Kraj podpowiada się z lokalizacji salonu. Guzik jest
  zablokowany, dopóki numer nie jest poprawny dla wybranego kraju — dzięki temu
  nie da się wysłać kodu na numer, który i tak nie zadziała.
- **Kod wpisuje się sam** (WebOTP): telefon podpowiada go nad klawiaturą albo
  wypełnia pole automatycznie. **Warunek: aplikacja musi być zainstalowana
  z przeglądarki jako aplikacja (WebAPK), a nie dodana jako skrót do strony.**
  Ikona utworzona bardzo dawno bywa zwykłym skrótem i wtedy autouzupełnianie
  nie zadziała — pomaga odinstalowanie i ponowna instalacja. To jest ograniczenie
  Androida, nie usterka Booksero.
- **Limit prób**: po przekroczeniu aplikacja pokazuje **odliczanie MM:SS** do
  odblokowania, a nie ogólnikowe „spróbuj później". Czas podaje serwer.
- **Nowy numer** (brak kartoteki): aplikacja prosi o imię i nazwisko i zakłada
  kartotekę w salonie, z którego klientka weszła.
- **Sesja** trzyma się urządzenia i sieci. Wylogowanie czyści dane konta
  z pamięci aplikacji, kasuje plakietkę z ikony i **odpina to urządzenie od
  powiadomień** — po wylogowaniu na ten telefon nie przyjdzie push poprzedniej
  osoby. Dane publiczne salonu (usługi, zespół) zostają, więc aplikacja działa
  dalej także bez sieci.

## 3. Ekran salonu

Galeria zdjęć z licznikiem (ukryta, gdy salon nie ma zdjęć), nazwa i logo,
dzwonek powiadomień z plakietką, przycisk rezerwacji, lista usług z cenami
i czasem trwania, zespół, opinie, promocje. Kolory (akcent) pochodzą
z ustawień lokalizacji w panelu i od wersji 1.0.29 **obowiązują na wszystkich
ekranach aplikacji**, nie tylko na ekranie salonu.

Salon może wymagać logowania — wtedy zamiast prezentacji pojawia się ekran
logowania w barwach tego salonu.

## 4. Rezerwacja

Kolejność: **usługa → specjalista → dzień i godzina → dane → potwierdzenie**.

- **Specjalista**: konkretna osoba albo „dowolny".
- **Wolne godziny**: 14 dni do przodu, godziny liczone w **strefie czasowej
  lokalizacji** — klientka z innego kraju widzi godzinę salonu, nie swoją.
  Zmiana czasu letniego/zimowego obsługuje się sama.
- **Happy hours (rabaty czasowe)**: kafelek godziny pokazuje cenę po rabacie.
  To podgląd — wiążąco nalicza serwer przy rezerwacji.
- **Rezerwacja dla dwóch osób** (jeśli lokalizacja ma to włączone):
  - druga osoba ma **imię** i (opcjonalnie) **numer telefonu**;
  - **tryb „niespodzianka"** = numeru nie podajemy, druga osoba nie dostaje
    żadnej wiadomości;
  - jeśli numer podano, druga osoba dostaje **SMS z potwierdzeniem** o innej
    treści („Umówiono dla Ciebie wizytę…", jej usługa i jej specjalista, bez
    linku odwołania);
  - **przypomnienia przed wizytą i informacja o odwołaniu idą wyłącznie do
    osoby rezerwującej** — to jest decyzja właściciela, nie przeoczenie;
  - nie da się wybrać **tego samego specjalisty dla obu osób** — przy drugiej
    osobie jest wyszarzony;
  - pusty terminarz przy parze zwykle znaczy brak **pokoju dla dwóch osób**
    przypisanego do obu usług — to konfiguracja lokalizacji, nie awaria.
    Aplikacja mówi to osobnym komunikatem, żeby klientka nie klikała kolejnych
    dni na próżno.
- **Telefon** w formularzu jest w tym samym standardzie, co przy logowaniu.

## 5. Wizyty

Dwie listy: **Nadchodzące** i **Historia**. Każda pozycja: usługa, data
i godzina w strefie salonu, specjalista, status. Wizyta dla dwóch osób jest
oznaczona **„dla 2 osób"** wraz z imieniem, usługą i specjalistą drugiej osoby.

**Odwołanie**: przycisk pojawia się tylko wtedy, gdy wizytę wolno jeszcze
odwołać. Regułę ustala salon (czy odwoływanie jest w ogóle dozwolone i ile
godzin przed terminem) — domyślnie **2 godziny przed**. Wizyta z przeszłości,
odwołana lub w trakcie nie ma tego przycisku. Aplikacja pyta o potwierdzenie
i pokazuje wynik. Odwołać może **tylko osoba rezerwująca**.

Na liście są także wizyty założone przez recepcję w panelu — to ta sama baza.

## 6. Bonusy

Zakładka jest widoczna **tylko wtedy, gdy firma włączyła choć jedną funkcję
bonusową**. Firma, która nie prowadzi żadnej, nie ma tej ikony w ogóle.

- **Program lojalnościowy**: przystąpienie, saldo punktów, progi, lista nagród,
  odbiór nagrody i wycofanie odbioru.
- **Polecenia SMS**: klientka wysyła zaproszenie na numer znajomej, widzi
  licznik wysłanych i pozostałych oraz status („dołączyła", „nagrodzona").
- **Moje kody**: notes na kody rabatowe — dopisanie kodu z notatką, oznaczenie
  jako wykorzystany, usunięcie, kopiowanie, data ważności.
- **Promocje**: aktualne promocje lokalizacji z opisem i wskazaniem usług.

## 7. Profil

- Imię, nazwisko, numer telefonu.
- **ZGODY** — sekcja zwijana, domyślnie zwinięta (szczegóły w §9).
- **Powiadomienia** — przełącznik dla KONTA plus liczba urządzeń odbierających.
- **Wersja i aktualizacja** — bieżąca wersja, sprawdzenie nowej, przycisk
  aktualizacji.
- **Język** — 16 języków do wyboru ręcznego.
- **Wybór salonu** w obrębie sieci.
- **Wyloguj**.

## 8. Powiadomienia

Trzy niezależne rzeczy, których nie wolno mylić:

1. **Push** (powiadomienie na telefon). Włącznik działa na **KONTO**, a nie na
   urządzenie: włączenie w Profilu zapisuje zgodę konta, a każde urządzenie
   z zalogowaną aplikacją dopina się samo. Licznik „urządzenia odbierające"
   pokazuje, ile telefonów faktycznie jest podpiętych. Po wylogowaniu urządzenie
   jest odpinane.
2. **Skrzynka (dzwonek)** na ekranie salonu — lista wiadomości z panelu i
   z systemu, plakietka z liczbą nieprzeczytanych (miga, dopóki są), oznaczanie
   pojedynczo i „oznacz wszystkie". Wpis w skrzynce powstaje **zawsze**, nawet
   jeśli push nie doszedł.
3. **Plakietka na ikonie aplikacji** — liczba nieprzeczytanych na ikonie
   na pulpicie telefonu.

**Granice, o których Sero musi mówić uczciwie:**
- Dźwięk i wibracja należą do systemu telefonu i jego ustawień kanału
  powiadomień. Aplikacja nie ma nad tym pełnej władzy.
- Telefon z agresywną oszczędzaniem baterii (Honor, Xiaomi, Samsung) potrafi
  wstrzymać push do momentu odblokowania ekranu. To ustawienie telefonu, nie
  usterka Booksero — trzeba wyłączyć optymalizację baterii dla aplikacji.
- Na iPhonie push działa **wyłącznie po zainstalowaniu aplikacji na ekranie
  głównym**; w Safari nie zadziała.

## 9. Zgody (skrót — szczegóły w BRIEF-Sero-zgody-w-aplikacji.md)

Profil → **ZGODY** (zwijane, domyślnie zwinięte). Przełącznik plus data.
Rozwinięcie sekcji pobiera świeży stan z serwera. Pod listą jest **„Pokaż
pozostałe zgody"** — odsłania typy, których lokalizacja nie zbiera, więc
**każda z czterech zgód jest zawsze osiągalna z telefonu**. Zmiana z aplikacji
obejmuje **wszystkie kartoteki tej osoby w sieci**, ze źródłem „aplikacja
klientki".

## 10. Instalacja i aktualizacje

- Aplikacja proponuje instalację (baner). Instalacja z przeglądarki daje
  **prawdziwą aplikację**; „dodaj skrót do ekranu" to co innego i psuje
  autouzupełnianie kodu SMS.
- **Aktualizacja**: aplikacja porównuje swoją wersję z wersją serwera
  i pozwala się zaktualizować jednym przyciskiem. Numer wersji jest dostępny
  także bez logowania (ekran startowy).

## 11. Języki, waluty, strefy czasowe

- **16 języków**: polski, angielski, niemiecki, niderlandzki, czeski, szwedzki,
  hiszpański, francuski, włoski, chorwacki, grecki, turecki, bułgarski, fiński,
  norweski, ukraiński.
- Język bierze się z telefonu; **kraj spoza listy dostaje angielski** (np.
  Duńczyk — duńskiego nie ma). Klientka może wybrać język ręcznie w Profilu.
- Treści wpisane przez salon (nazwy usług, opisy, biogramy) **nie są
  tłumaczone** — zostają w języku, w którym salon je wpisał.
- Waluta i format cen — z ustawień lokalizacji. Godziny — w strefie lokalizacji.
- Język aplikacji idzie do serwera przy każdym zapytaniu, więc SMS-y i treści
  systemowe przychodzą w tym samym języku, co interfejs.

## 12. Czego aplikacja NIE robi (Sero nie ma prawa tego obiecywać)

- Nie przyjmuje płatności ani przedpłat.
- Nie pozwala **przełożyć** wizyty — tylko odwołać i zarezerwować nową.
- Nie pozwala edytować danych osobowych (imienia, numeru) — to robi recepcja.
- Nie pokazuje kalendarza pracowników ani danych innych klientek.
- Nie wysyła powiadomień o zmianie zgody i nie odświeża stanu w tle.
- Nie tłumaczy treści wpisanych przez salon.
- Nie działa jako aplikacja ze sklepu Google Play (publikacja wstrzymana).

---

## 13. PYTANIA KONTROLNE DO SERA

Zadaj Serowi każde z poniższych. Odpowiedź ma być **zgodna co do treści**
z nawiasem — nie co do słowa. Rozbieżność = wiedza do poprawienia.

1. Gdzie klientka włącza i wyłącza zgody w aplikacji? *(Profil → sekcja ZGODY,
   zwijana; pozostałe typy pod „Pokaż pozostałe zgody")*
2. Czy zmiana zgody z aplikacji dotyczy jednego salonu, czy całej firmy?
   *(całej sieci — wszystkie kartoteki tej osoby)*
3. Klientka mówi, że nie może odwołać wizyty — czemu? *(za późno wobec limitu
   salonu, domyślnie 2 h; albo salon wyłączył odwoływanie; albo wizyta minęła)*
4. Kto może odwołać wizytę dla dwóch osób? *(tylko osoba rezerwująca)*
5. Czy druga osoba z pary dostaje przypomnienie przed wizytą? *(nie — tylko
   potwierdzenie, i to gdy podano jej numer)*
6. Klientka nie dostaje powiadomień na telefon mimo włączenia. Co sprawdzić?
   *(czy aplikacja jest zainstalowana; iPhone tylko po instalacji; optymalizacja
   baterii; liczba urządzeń odbierających w Profilu; skrzynka i tak ma wpis)*
7. Kod SMS nie wpisuje się sam. Dlaczego? *(ikona jest skrótem, nie aplikacją —
   odinstalować i zainstalować z przeglądarki)*
8. Klientka z Danii — w jakim języku zobaczy aplikację? *(po angielsku; duńskiego
   nie ma wśród 16 języków; treści salonu zostają po polsku)*
9. Klientka w Anglii patrzy na godzinę wizyty w polskim salonie — czyją godzinę
   widzi? *(salonu)*
10. Czy klientka może zapłacić w aplikacji? *(nie)*
11. Czy klientka może przełożyć wizytę? *(nie — odwołać i zarezerwować nową)*
12. Czy klientka może zmienić swoje imię lub numer w aplikacji? *(nie — recepcja)*
13. Klientka nie pamięta adresu salonu i nie ma kodu QR pod ręką. *(ekran
   startowy → „Ostatnio odwiedzane salony", do pięciu; albo kod sieci)*
14. Gdzie sprawdzić wersję aplikacji, gdy nie da się zalogować? *(ekran startowy,
   pod polem kodu — celowo poza logowaniem)*
15. Rezerwacja dla pary nie pokazuje żadnej wolnej godziny. *(zwykle brak pokoju
   dla dwóch osób przypisanego do obu usług — ustawienie lokalizacji)*
16. Klientka wyłączyła zgodę marketingową — czy dostanie potwierdzenie wizyty?
   *(tak; marketing to promocje i nowości, obsługa rezerwacji idzie dalej)*
17. Dlaczego zakładka Bonusy jest u jednej firmy, a u drugiej nie? *(pokazuje
   się tylko, gdy firma włączyła choć jedną funkcję bonusową)*
18. Czy aplikacja pokazuje wizyty założone przez recepcję? *(tak, to ta sama baza)*
19. Co widzi klientka po wylogowaniu na cudzym telefonie? *(dane konta znikają,
   plakietka gaśnie, urządzenie zostaje odpięte od powiadomień)*
20. Czy aplikacja jest w Google Play? *(nie — publikacja przygotowana, ale
   wstrzymana; instalacja z przeglądarki)*
