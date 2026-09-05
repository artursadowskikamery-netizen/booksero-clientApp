# Changelog — BookSero (aplikacja kliencka)

Wszystkie istotne zmiany w aplikacji zapisujemy tutaj.
Format: nowe wpisy na górze; wersje wg zasady MAJOR.MINOR.PATCH.
Data w formacie RRRR-MM-DD.

## [Niewydane]
- (tu trafiają zmiany przygotowane, przed nadaniem numeru wersji)

---

## [1.0.37] — 2026-09-05 — Tryb testowy właściciela: 5 tapnięć w numer wersji

- Ścieżka po numerze jest zaryglowana do decyzji po prawniku, a w zainstalowanej
  aplikacji nie ma paska adresu, więc `?phoneEntry=1` nie dało się wpisać.
  Teraz **5 tapnięć w „BookSero v…"** na ekranie startowym włącza (i kolejne
  5 wyłącza) ścieżkę po numerze na tym telefonie. Przy włączonym trybie obok
  wersji widać „· test".

---

## [1.0.36] — 2026-09-05 — Ekran startowy: jedno pole, żadnych wyborów

- Uwaga właściciela: dwa formularze naraz (nazwa z listą krajów + osobny
  formularz numeru) to za dużo, klientka jest zdezorientowana.
- **Jedno pole** i jeden przycisk. Etykieta: „Wpisz nazwę swojej ulubionej
  firmy" — dla klientki to nazwa jej salonu; słowo „hasło" zostaje tylko
  w panelu, dla właściciela. Gdy wejście po numerze będzie odblokowane:
  „Wpisz nazwę salonu albo swój numer telefonu" — aplikacja sama poznaje,
  co wpisano; klientka niczego nie wybiera.
- Duża lista krajów z flagą zniknęła. Kraj siedzi w jednej drobnej linijce
  „🇵🇱 PL · zmień" pod przyciskiem; lista rozwija się dopiero po tapnięciu.
- Po numerze pole zamienia się w krok „kod z SMS" z widocznym numerem
  i „Zmień numer"; po kodzie — lista salonów albo od razu wejście. Osobny
  formularz numeru przestał istnieć.
- Wszystkie napisy z „hasłem" przepisane na język klientki („zapytaj
  w salonie, co wpisać") w 16 językach.

---

## [1.0.35] — 2026-09-05 — Dopasowanie do wdrożonego panelu; ścieżka po numerze zaryglowana

- Panel wdrożył hasła salonu i wejście po numerze (SPEC panelu z audytem).
  Aplikacja włącza hasła sama — flaga kraju przy polu pojawia się od razu.
- **Ścieżka po numerze ZARYGLOWANA** do decyzji właściciela: zestawia
  klientce listę firm należących do niezależnych administratorów danych
  i czeka na potwierdzenie prawnika oraz wpis do polityki prywatności (SPEC
  panelu §8). Panel zgłasza gotowość, więc bez rygla klientki zobaczyłyby ją
  dziś. Odblokowanie = jedna stała + wersja. Do testów właściciela: ekran
  startowy z `?phoneEntry=1`.
- Licznik wejść przeniesiony na właściwy punkt panelu (`/api/public/app/entry`,
  tylko lokalizacja + metoda). Wejście na poziomie sieci zgłasza ekran wyboru
  salonu, gdy klientka tapnie lokalizację (`?via=` w adresie).
- **Wyłącznik aplikacji per lokalizacja** (nowość panelu): firma może
  wyłączyć aplikację, a wtedy także dotychczasowe drogi (QR, link, ostatnio
  odwiedzane) oddają 404 przy logowaniu. Zamiast ogólnego błędu: „Ta firma
  nie udostępnia aplikacji. Zarezerwuj przez wizytówkę lub zadzwoń do salonu."
  W 16 językach.
- Limit zapytań o hasło (429) pokazuje komunikat serwera zamiast „nie
  znaleziono".

---

## [1.0.34] — 2026-09-04 — Pole hasła bez podpowiedzi przeglądarki

- Chrome podstawiał do pola hasła salonu NAZWĘ FIRMY zapamiętaną z innych
  formularzy („VIVI ESTETIC Sp. z o.o."), a klientka brała to za podpowiedź
  aplikacji i dostawała „nie znaleziono". Pole ma teraz wyłączone
  autouzupełnianie i nazwę techniczną bez słowa „hasło", żeby nie obudzić
  menedżera haseł.

---

## [1.0.33] — 2026-09-04 — Ekran startowy w języku klientki: hasło salonu i wejście po numerze

- Pole „UUID salonu lub slug wizytówki" mówiło językiem programisty. Klientka
  salonu masażu nie wie, co to UUID ani slug — pole odstraszało, zamiast
  zapraszać. Teraz: **„Wpisz hasło swojej ulubionej firmy"** z podpowiedzią
  *„np. Vivi — zapytaj w salonie"*.
- **Hasło salonu**: słowo, które recepcja mówi klientce. Dopasowanie
  DOKŁADNE, w obrębie kraju (obok pola wybór kraju flagą, domyślnie
  z ustawień telefonu). Kilka lokalizacji z tym samym hasłem → wybór wewnątrz
  tej firmy. Dawne adresy wizytówki i kody działają dalej w tym samym polu,
  po cichu.
- **„Masz już u nas kartotekę? Wejdź numerem telefonu"**: jeden SMS = lista
  firm, w których klientka ma kartotekę, i wejście od razu zalogowane. Ta
  droga nie wycieka nic — żeby zobaczyć, że salon jest na Booksero, trzeba
  mieć w ręku telefon jego klientki. Ekran po wysłaniu od razu przewiduje
  „kod nie przyszedł? pierwszy raz? poproś salon o hasło lub kod QR".
- Świadomie BEZ wyszukiwarki i listy salonów: każde podpowiadanie po nazwie
  jest katalogiem, a katalog pozwala konkurencji wypisać klientów Booksero.
- Stopka: „Pierwszy raz? Poproś salon o hasło lub kod QR." Zdanie „Nie
  przeglądasz tu innych firm" zostaje — przy tych regułach jest prawdziwe.
- Licznik wejść dla właściciela: aplikacja zgłasza, którędy klientka weszła
  (QR / hasło / numer / ostatnio odwiedzane / link) — bez tokenu i danych
  osobowych.
- Obie nowe drogi włączają się SAME, gdy panel je wdroży (punkt
  `entry-capabilities`). Do tego czasu ekran działa jak dotychczas, z nowymi
  napisami. Nowe teksty w 16 językach.

---

## [1.0.32] — 2026-08-13 — Zgody odświeżają się przy rozwinięciu sekcji

- Stan zgód pobierał się przy wejściu na ekran Profilu. Klientka, która wraca
  od recepcji i od razu zagląda w telefon, widziała stan sprzed rozmowy do
  czasu, aż wyszła z Profilu i wróciła.
- Rozwinięcie sekcji ZGODY pobiera teraz świeży stan z serwera.

---

## [1.0.31] — 2026-08-13 — „Pokaż pozostałe zgody" — żadna nie jest już nieosiągalna

- Zapora z 1.0.30 pamiętała tylko przełączniki, które aplikacja JUŻ kiedyś
  pokazała. Na urządzeniu, gdzie zgoda zdążyła zniknąć wcześniej, pamięć
  startowała pusta i nie miała czego przywrócić — przełącznik nie wrócił.
- Pod listą zgód jest teraz „Pokaż pozostałe zgody". Odsłania każdy pozostały
  typ, niezależnie od tego, co zwrócił serwer. Zgoda przestaje zależeć od
  zakresu lokalizacji, stanu i historii — zawsze da się ją włączyć i wyłączyć
  z aplikacji. RODO wymaga, żeby wycofanie było równie łatwe jak udzielenie;
  przy zgodzie, której nie da się nawet wyświetlić, ten warunek jest pusty.
- Domyślny widok zostaje bez zmian: lokalizacja, która zdjęć nie robi, nie
  pokazuje klientce zgód fotograficznych, dopóki sama o nie nie poprosi.

---

## [1.0.30] — 2026-08-13 — Raz pokazana zgoda zostaje na zawsze

- Widoczność przełącznika zgody liczyła się WYŁĄCZNIE z odpowiedzi serwera
  (zakres lokalizacji + stan + historia). Gdy którykolwiek składnik zniknął
  z odpowiedzi, zgoda przestawała być osiągalna: nie było czego kliknąć, żeby
  ją przywrócić. Przy zgodzie na publikację zdjęć zdarzyło się to trzykrotnie.
- Aplikacja pamięta teraz na urządzeniu, które przełączniki już pokazała, i nie
  odbiera ich nigdy. To lista nazw samych typów zgód, bez danych osobowych,
  a jedyny jej skutek to przełącznik, który klientka może obsłużyć.
- Uwaga: to jest ZAPORA, nie wyjaśnienie. Jeżeli historia zgody znika
  z odpowiedzi serwera, to osobna sprawa do sprawdzenia po stronie panelu —
  historia jest dowodem RODO i nie ma prawa się gubić.

---

## [1.0.29] — 2026-08-13 — Kolor lokalizacji trzyma się całej aplikacji

- Barwy salonu ustawione w panelu widać było TYLKO na ekranie salonu. Wejście
  w Rezerwuj, Wizyty, Bonusy czy Profil zostawiało aplikację w domyślnym
  niebieskim BookSero — żaden z tych ekranów koloru nie nakładał, a zakładka
  „Salon" prowadzi na listę sieci, która akcent twardo zerowała. Jedno
  kliknięcie w dolne menu i marka lokalizacji znikała do końca sesji.
- Kolor ma teraz jednego właściciela: komponent nad routerem nakłada go na
  KAŻDY adres `/salon/…`, w tym na ekrany, które dopiero powstaną.
- Kolor jest pamiętany na urządzeniu osobno dla każdej lokalizacji i sieci,
  więc wchodzi natychmiast, bez mrugnięcia niebieskim w oczekiwaniu na sieć.
  Wartość z serwera zawsze wygrywa — zmiana koloru w panelu wchodzi od razu.
- Lista salonów sieci zachowuje barwy TEJ sieci, jeśli klientka już u niej
  była. Kolor obcej firmy się nie przenosi (pamięć jest kluczowana siecią),
  a ekran startowy BookSero zostaje neutralny.

---

## [1.0.28] — 2026-08-13 — Wycofana zgoda wraca; godziny bez dubli

- Poprawka z 1.0.27 działała tylko w obrębie JEDNEGO wejścia na ekran. Kto
  wyłączył zgodę wcześniej i wyszedł z Profilu, po powrocie już jej nie
  widział — przełącznik znikał na dobre i nie dało się zgody przywrócić
  z aplikacji. Dotyczyło zgody na publikację zdjęć.
- Od teraz pokazujemy każdą zgodę, której klientka KIEDYKOLWIEK dotknęła
  (jest w jej historii) — obok zgód z zakresu lokalizacji i tych aktualnie
  posiadanych. Raz wycofana zgoda zawsze da się włączyć z powrotem.
- Wolne godziny przy rezerwacji DLA PARY wyświetlały się podwójnie (serwer
  zwraca terminarz osobno dla każdej z dwóch usług), a drugi zestaw był
  nieposortowany. Godziny są scalane i ustawione rosnąco; przy scaleniu
  wygrywa termin dostępny, a przy remisie ten z rabatem happy hours.

---

## [1.0.27] — 2026-08-13 — Zgoda nie znika pod palcem po wyłączeniu

- Zgoda, której lokalizacja nie ma w swoim zakresie (a klientka ją miała),
  ZNIKAŁA z ekranu w chwili wyłączenia — przestawała spełniać warunek
  widoczności — i nie dało się jej włączyć z powrotem. Pułapka bez wyjścia
  przy zgodzie na publikację zdjęć.
- Przełączniki widoczne przy otwarciu ekranu zostają na nim do wyjścia,
  niezależnie od zmian stanu. Wycofanie zgody przez pomyłkę jest teraz
  odwracalne w tym samym miejscu i w tej samej chwili.

---

## [1.0.26] — 2026-08-13 — Języki: Norweg dostaje norweski, reszta angielski

- Telefony norweskie przedstawiają się jako `nb-NO` / `nn-NO`, a nie `no`,
  więc Norweg dostawał interfejs po ANGIELSKU mimo gotowego tłumaczenia.
  Dodane aliasy nb/nn → no.
- Do serwera szedł SUROWY kod języka z telefonu (np. `da`, `nb`), którego
  Booksero nie zna — odpowiadał więc własnym domyślnym. Efekt: interfejs
  po angielsku, a SMS-y i powiadomienia w innym języku. Teraz wysyłamy
  język, w którym aplikacja NAPRAWDĘ mówi (`resolvedLanguage`).
- Języki spoza listy 16 (np. duński) trafiają na angielski — nigdy na
  polski. Klient może ręcznie wybrać dowolny z 16 na ekranie startowym.

---

## [1.0.25] — 2026-08-13 — Zgody klientki w Profilu (RODO)

- Profil ma sekcję „Zgody" bezpośrednio na ekranie, pod danymi klientki
  i nad listą salonów — bez osobnego podekranu, żeby wycofanie zgody było
  równie łatwe jak jej udzielenie (RODO art. 7 ust. 3). Sekcja jest
  zwijana i domyślnie zwinięta.
- Cztery osobne przełączniki: informacje o promocjach, prośba o opinię,
  zdjęcia w kartotece BEZ publikacji oraz publikacja zdjęć w galerii
  i mediach społecznościowych. Przechowywanie i publikacja są celowo
  rozdzielone — klientka może zgodzić się na dokumentację „przed i po",
  odmawiając mediów społecznościowych.
- Pod każdym przełącznikiem data udzielenia albo wycofania (z wpisu
  otwartego w rejestrze, nie z ostatniego w kolejności); przy wpisach
  z importu pokazujemy adnotację zamiast zmyślonej daty.
- Przełączniki widoczne wg zakresu lokalizacji, ale zgoda POSIADANA spoza
  zakresu też się pokazuje — inaczej nie dałoby się jej wycofać.
- Wyłączenie działa jak włączenie: jedno dotknięcie, bez pytania „czy na
  pewno" i bez ostrzeżeń. Stan wyłącznie z serwera (nic nie jest zaznaczone
  domyślnie), pobierany przy każdym wejściu na ekran.
- Przy kartotekach w kilku lokalizacjach zdanie o zasięgu: ustawienia
  dotyczą wszystkich salonów sieci. Teksty ×16.

---

## [1.0.24] — 2026-08-13 — PILNE: odblokowana rezerwacja z aplikacji

- Przycisk „Potwierdź rezerwację" był zablokowany bez żadnego komunikatu.
  Pole telefonu dostawało numer z konta jako same cyfry („48530012345"),
  więc do prefiksu kraju doklejał się drugi prefiks (+48 48 530…) i numer
  nie przechodził walidacji.
- Numer wstawiamy teraz z pola `phoneE164` (postać kanoniczna „+48…"),
  a pole samo wyciąga z niej część krajową i kraj do flagi. Gdy serwer
  odda `phoneE164: null` (numeru nie da się zinterpretować), pole zostaje
  puste — klientka wpisuje numer sama.
- Pole telefonu przestawia teraz także FLAGĘ, gdy numer dociąga się
  z konta po otwarciu ekranu — numer zagraniczny pokazuje właściwy kraj,
  a ręczny wybór kraju przez klientkę nie jest nadpisywany.

---

## [1.0.23] — 2026-08-12 — Lista wizyt pokazuje, że rezerwacja jest dla dwojga

- Karta wizyty dla dwóch osób dostaje plakietkę „dla 2 osób" i drugą linię
  z osobą towarzyszącą: jej imię, jej zabieg i JEJ specjalista. Dotąd
  z listy w ogóle nie wynikało, że wizyta jest dla dwojga — widać było
  jedną osobę i jednego pracownika.
- Oznaczenie także w historii wizyt.
- Pola są opcjonalne: dopóki serwer ich nie wysyła, lista wygląda jak
  dotąd (zero regresji). Zamówienie na dane po stronie backendu:
  docs/ZAMOWIENIE-para-na-liscie-wizyt.md — po ich wdrożeniu funkcja
  zapali się sama, bez nowego wydania aplikacji. Teksty ×16.

---

## [1.0.22] — 2026-08-12 — Para: nie da się wybrać tego samego specjalisty

- Specjalista wybrany dla jednej osoby jest przy drugiej WYSZARZONY
  i nieklikalny (z przekreśleniem i wyjaśnieniem) — wizyta pary wymaga
  dwóch różnych osób, więc blokujemy wybór zamiast tłumaczyć błąd po
  potwierdzeniu rezerwacji.
- Blokada działa w obie strony; „Dowolny" nigdy nie jest blokowany
  (serwer sam dobierze wolną, inną osobę).
- Zmiana specjalisty pierwszej osoby na tego wybranego dla drugiej
  zwalnia tamten wybór (wraca na „Dowolny") zamiast blokować ekran.
- Komunikat o błędzie 409 zostaje jako druga linia obrony (np. gdy termin
  zajmie ktoś inny w tej samej chwili). Teksty ×16.

---

## [1.0.21] — 2026-08-12 — Rezerwacja dla 2 osób: telefon drugiej osoby

- Rezerwacja pary nie wysyłała numeru drugiej osoby, więc nie dostawała
  ona kartoteki: bez punktów, bez prośby o opinię, bez wizyty na swoim
  koncie, a jej kod imienny nie przechodził przy rozliczeniu. Doszło pole
  „Telefon drugiej osoby" (walidowane jak numer rezerwującego).
- Przełącznik „Rezerwuję jako niespodziankę" — pole znika, a numer jest
  POMINIĘTY w żądaniu (nie pusty tekst), więc do obdarowanego nie idzie
  żadna wiadomość i prezent się nie wydaje.
- Ostrzeżenie, gdy numer drugiej osoby jest taki sam jak rezerwującego
  (serwer nie założyłby wtedy drugiej kartoteki).
- Ekran potwierdzenia pokazuje obie osoby i obie usługi, a gdy numer nie
  doszedł — delikatną informację, że druga osoba nie zbierze punktów.
- Pusty terminarz przy rezerwacji pary ma własny komunikat (zwykle brak
  pokoju dla dwóch osób), a wybór tego samego specjalisty dwa razy —
  czytelną podpowiedź zamiast surowego „termin zajęty".

---

## [1.0.20] — 2026-07-28 — Godziny wizyt w strefie czasowej lokalizacji

- Lista „Moje wizyty" pokazywała godzinę wg zegara TELEFONU: wizyta o 11:00
  w Londynie oglądana z Polski wyświetlała się jako 12:00 (e-mail, SMS
  i skrzynka pokazywały poprawnie). Teraz godzina i data liczą się w strefie
  lokalizacji z nowego pola `salonTimezone` (per wizyta — klient może mieć
  wizyty w kilku krajach); brak wartości → Europe/Warsaw.
- Dotyczy też DATY: wizyta o 00:15 potrafiła trafić na zły dzień.
- Czas letni/zimowy obsługuje Intl — żadnych ręcznych przesunięć godzin.
- Nieznana nazwa strefy nie wywala ekranu wizyt (bezpieczny fallback).
- Ekran potwierdzenia rezerwacji pokazuje termin WYBRANY przez klienta
  (już w czasie lokalizacji) zamiast przeliczać go zegarem telefonu.
- Skrzynka powiadomień bez zmian — treść składa serwer z gotową godziną.

---

## [1.0.19] — 2026-07-28 — Poprawki z trzeciej rundy przeglądu

- Powiadomienia poprzedniego konta nie trafiają już na telefon następnej
  osoby: wygaśnięcie sesji (401) w Wizytach, Bonusach, Skrzynce i Profilu
  wyrejestrowuje urządzenie z powiadomień — dotąd robiło to wyłącznie
  świadome „Wyloguj".
- Chwilowa awaria sieci nie niszczy działającego ekranu salonu ani nie
  kasuje żywego salonu z „Ostatnio odwiedzanych": błąd i stan „salon
  niedostępny" liczą się TYLKO przy braku danych (react-query zostawia
  ostatnie dobre dane po nieudanym odświeżeniu).
- Salon usunięty pokazuje komunikat zamiast wpadać w ekran logowania
  nieistniejącego salonu.
- Plakietka na ikonie aplikacji gaśnie przy wylogowaniu (zostawał licznik
  poprzedniego konta).
- Odpowiedź serwera o niepoprawnym kształcie kończy się ekranem z drogą
  powrotu zamiast wyjątkiem (biały ekran).

---

## [1.0.18] — 2026-07-28 — Ostatnio odwiedzane salony na ekranie startowym

- Po pierwszym wejściu (QR lub kod) salon trafia do historii na ekranie
  startowym — powrót jednym dotknięciem, bez ponownego skanowania.
- Do 5 salonów, najnowszy na górze, z logo, nazwą i miastem; klient bywa
  w kilku sieciach naraz, więc lista obsługuje wiele firm.
- Przy każdej pozycji „X" do usunięcia z historii. Teksty ×16.
- Zapis lokalny na urządzeniu, bez danych osobowych; wejście do salonu
  nadal wymaga zalogowania kodem SMS.

---

## [1.0.17] — 2026-07-28 — Cel kliknięcia liczony w chwili kliknięcia

- Powiadomienia pokazane przez starszą wersję miały wdrukowany cel „/";
  teraz puste i „/" są przekierowywane na /push-open (skrzynka salonu).
- (Backend, osobno: wiadomość od salonu bez odnośnika celuje wprost
  w skrzynkę tego salonu — właściwa przyczyna błędnego przekierowania.)

---

## [1.0.16] — 2026-07-28 — Klik w powiadomienie trafia do skrzynki salonu

- Powiadomienie bez odnośnika po kliknięciu przenosi do SKRZYNKI ostatnio
  odwiedzanego salonu (trasa /push-open), a nie na ekran „znajdź salon".

---

## [1.0.15] — 2026-07-28 — Powiadomienia jak w VIVIMassage

- Powiadomienie wisi na ekranie do kliknięcia (requireInteraction),
  kolejne alarmuje na nowo (tag + renotify), przycisk „Otwórz BookSero".
  Wzorzec sprawdzony w aplikacji VIVIMassage na tym samym telefonie.
- (Backend, wdrażany osobno: pushe z priorytetem wysokim — budzą uśpiony
  telefon zamiast czekać na odblokowanie ekranu.)

---

## [1.0.14] — 2026-07-28 — Chmurka odświeża się sama

- Powrót do aplikacji (z tła/innej karty) natychmiast odświeża licznik
  nieprzeczytanych — koniec z ciągnięciem w dół.
- Push przy otwartej aplikacji: service worker daje znać aplikacji
  i chmurka na dzwonku aktualizuje się od razu.

---

## [1.0.13] — 2026-07-28 — Urządzenie zawsze odświeża rejestrację push

- Po starcie aplikacji (konto „włączone" + zgoda systemowa) urządzenie
  ZAWSZE ponawia rejestrację na serwerze — telefon potrafił trzymać żywą
  subskrypcję lokalnie, gdy serwer already skasował rejestracje
  (wyłączenie konta), i pushe cicho przepadały.
- Profil pokazuje liczbę urządzeń odbierających wg serwera —
  koniec zgadywania, co serwer widzi.

---

## [1.0.12] — 2026-07-28 — Pulsująca chmurka + plakietka na ikonie

- Chmurka z liczbą nieprzeczytanych na dzwonku pulsuje, dopóki wiadomości
  nie zostaną odczytane.
- Liczba nieprzeczytanych trafia też na IKONĘ aplikacji na telefonie
  (Badging API — iOS 16.4+ i pulpity; na Androidzie kropkę przy ikonie
  daje samo powiadomienie systemowe). Push przy zamkniętej aplikacji
  również zapala plakietkę.
- Powiadomienia push: wibracja, jawnie nie-ciche, ikona PNG.

---

## [1.0.11] — 2026-07-28 — Skrzynka powiadomień (dzwonek)

- Dzwonek na ekranie salonu to teraz skrzynka wiadomości klienta:
  chmurka z liczbą nieprzeczytanych, lista powiadomień (potwierdzenia,
  przypomnienia, nagrody, wiadomości od salonu), „Oznacz wszystkie",
  doładowywanie starszych, klik prowadzi do właściwego ekranu.
- Skrzynka działa niezależnie od push — klient z wyłączonymi
  powiadomieniami widzi wiadomości po wejściu do aplikacji.
- Teksty ×16; przy backendzie bez skrzynki (404) aplikacja pokazuje
  pustą listę bez błędu.

---

## [1.0.10] — 2026-07-23 — Powiadomienia per KONTO + baner instalacji

### Powiadomienia wspólne dla wszystkich urządzeń klienta
- Suwak w Profilu pokazuje stan KONTA z serwera (nie lokalny stan jednej
  przeglądarki): włącz na telefonie → Chrome pokaże „włączone" i odwrotnie.
- Wyłączenie gasi WSZYSTKIE urządzenia naraz (backend blokuje też wysyłkę).
- Po zalogowaniu/starcie: konto „włączone" + zgoda systemowa → urządzenie
  dorejestrowuje się samo; bez zgody → przycisk „Włącz powiadomienia na tym
  urządzeniu" w Profilu (16 języków).

### Instalacja aplikacji (PWA)
- W trybie przeglądarki po zalogowaniu pojawia się zamykalny baner
  „Zainstaluj aplikację BookSero": Android — systemowy prompt instalacji,
  iPhone — instrukcja Udostępnij → Do ekranu początkowego (16 języków).
- „X" chowa baner na 14 dni; po instalacji i w trybie standalone baner
  nie występuje; nie pokazuje się na ekranach logowania i rezerwacji.

---

## [1.0.9] — 2026-07-23 — Skaner rozumie linki ze slugiem

- Skaner QR w aplikacji odczytuje teraz także linki z krótkim adresem
  (app.booksero.com/<slug>, panel.booksero.com/<slug>) oraz linki poleceń
  /r/<kod>. Jeden QR na wizytówce działa więc i aparatem telefonu
  (klient bez aplikacji), i skanerem w aplikacji (klient z aplikacją).

---

## [1.0.8] — 2026-07-23 — Krótki adres salonu w aplikacji

- `app.booksero.com/<slug>` prowadzi wprost do salonu — ten sam krótki adres,
  który salon ma na wizytówce (np. /svp). Podstawa pod QR i przycisk
  „Otwórz aplikację" na wizytówce i widgecie.

---

## [1.0.7] — 2026-07-23 — Sprzątanie po diagnozie auto-kodu

- Usunięta tymczasowa linijka diagnostyczna z okna logowania.
- Rozwiązanie zagadki auto-kodu na Androidzie: instalacje ikony sprzed
  dodania ikon PNG (przed 1.0.0/Google Play) były skrótami bez dostępu
  do kodów SMS — wystarczy odinstalować i zainstalować ikonę ponownie
  z Chrome. Nowe instalacje działają od razu.

---

## [1.0.4] — 2026-07-23 — Przycisk „Wklej kod" przy logowaniu

- Część telefonów (m.in. Honor/Huawei) po zgodzie „użyj kodu z SMS" wkłada
  kod do schowka zamiast do pola. Nowy przycisk „Wklej kod" (16 języków)
  wyciąga 6 cyfr ze schowka, wstawia i loguje jednym dotknięciem.

---

## [1.0.3] — 2026-07-23 — Wersja widoczna bez logowania

- Numer wersji (BookSero vX.Y.Z) pokazany na ekranie startowym pod skanerem
  QR — sprawdzenie „czy mam świeżą aplikację" nie wymaga już zalogowania.

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
