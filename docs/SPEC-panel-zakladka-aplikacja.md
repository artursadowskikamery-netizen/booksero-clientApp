# SPEC — Panel: zakładka „Ustawienia → Aplikacja"

Wszystkie ustawienia aplikacji klienckiej BookSero mają być zarządzane
z JEDNEGO miejsca w panelu Booksero. Dziś są rozrzucone: kolor akcentu
w profilu salonu, suwak programu lojalnościowego w module lojalnościowym.
Powstaje jedna strona: **Ustawienia → Aplikacja** — „centrum życia"
aplikacji. Stare miejsca przenosimy NA CZYSTO (jedno źródło prawdy)
i zostawiamy w nich odnośnik.

Zakres: WYŁĄCZNIE panel Booksero (frontend + ewentualne drobne endpointy).
Aplikacja kliencka i publiczne API — bez zmian funkcjonalnych.
Gałąź robocza: `claude/panel-app-settings`. Nie mergować do main.
Bez zmian schematu bazy (używamy istniejących: `salon_profiles.app_accent`,
`tenants.settings.appFeatures`).

## 1. Nawigacja

Nowa pozycja w ustawieniach panelu: **„Aplikacja"** (ikona telefonu),
dostępna dla ról z uprawnieniem do ustawień (jak `settings.manage`).
Strona działa w kontekście tenanta (funkcje) + wyboru salonu (wygląd/linki).

## 2. Sekcja „Dostęp do aplikacji"

Adres bazowy aplikacji klienckiej trzymać w JEDNEJ stałej/konfiguracji
(np. `APP_CLIENT_URL`, default `https://booksero-client-app.replit.app`)
— nie rozsiewać literału po komponentach.

- **Link sieci**: `<APP_CLIENT_URL>/t/<tenantId>` — z przyciskiem „Kopiuj"
  i kodem QR (reużyć istniejący komponent QR z panelu, jeśli jest; QR do
  pobrania/wydruku).
- **Linki salonów**: dla każdego salonu tenanta wiersz z:
  `<APP_CLIENT_URL>/salon/<salonId>` + przycisk „Kopiuj" + QR.
  Jeśli salon ma slug wizytówki — pokazać też krótki wpis „kod do wpisania
  w aplikacji: <slug>".

## 3. Sekcja „Wygląd"

- Wybór salonu (selektor) → **paleta akcentu aplikacji** (12 kolorów z
  `shared/app-accent.ts`) — PRZENIEŚĆ tu istniejący wybór `app_accent`
  z ustawień profilu salonu (ten sam zapis, ta sama walidacja).
- Prosty podgląd: kafelek/miniatura z ciemnym tłem, nazwą salonu, logo
  (jeśli jest) i przyciskiem w wybranym kolorze.
- Dopisek informacyjny: logo i nazwa pochodzą z danych salonu (odnośnik
  do właściwego miejsca edycji).
- W STARYM miejscu (profil salonu) usunąć kontrolkę i zostawić odnośnik:
  „Ustawienia aplikacji przeniesiono: Ustawienia → Aplikacja".

## 4. Sekcja „Funkcje aplikacji" (suwaki per tenant)

Jedna lista WSZYSTKICH funkcji aplikacji z suwakami (zapis do
`tenants.settings.appFeatures`, jak w SPEC-bonusy-etap-A §1):

- **Program lojalnościowy** (`loyalty`) — PRZENIEŚĆ tu suwak z modułu
  lojalnościowego; przy suwaku skróty-odnośniki: „Poziomy", „Nagrody",
  „Ustawienia punktów" (prowadzą do modułu lojalnościowego).
  W starym miejscu zostawić odnośnik jak w §3.
- **Polecenia SMS**, **Notatnik kodów**, **Misje**, **Rabaty czasowe** —
  pozycje WIDOCZNE, ale wyłączone (badge „wkrótce", suwak disabled).
  Struktura zapisu gotowa na te klucze (`referrals`, `codesNotebook`,
  `missions`, `timeDiscounts`) — bez implementowania samych funkcji.

## 5. Sekcja „Klienci aplikacji" (informacyjna)

Krótki opis (tekst statyczny, bez logiki):
- logowanie klientów kodem SMS — koszt SMS z puli tenanta,
- nowy numer rejestruje się sam po weryfikacji kodu,
- blokada klienta = dezaktywacja na karcie klienta (odnośnik do listy
  klientów).

## 6. i18n

Nowe teksty panelu wg istniejącej konwencji panelu (jak dotychczasowe
strony ustawień — t() z polskim domyślnym). Nie dotykać
`server/i18n/messages.ts` poza ewentualną koniecznością.

## 7. Bezpieczeństwo / zasady

- Zapisy pod istniejącymi uprawnieniami ustawień; brak nowych endpointów
  publicznych.
- Suwak `loyalty` musi zapisywać się DOKŁADNIE w to samo pole co dziś
  (żadnej migracji, publiczne API czyta bez zmian).
- Przeniesienia (akcent, suwak) nie mogą zmienić zachowania — tylko
  lokalizację w UI.

## 8. Testy / Definition of Done

1. Ustawienia → Aplikacja: widoczne 4 sekcje; linki i QR sieci + salonów
   działają i kopiują się.
2. Zmiana akcentu z nowej strony działa identycznie jak dotychczas
   (zapis `app_accent`, aplikacja kliencka widzi zmianę); stare miejsce
   pokazuje odnośnik zamiast kontrolki.
3. Suwak lojalności z nowej strony włącza/wyłącza `appFeatures.loyalty`
   (aplikacja: zakładka Bonusy reaguje); stare miejsce pokazuje odnośnik.
4. Przyszłe funkcje widoczne jako „wkrótce" (disabled, nic nie zapisują).
5. Kompilacja TypeScript przechodzi; bez zmian schematu (db:push zbędny).
6. Push na gałąź `claude/panel-app-settings`; w raporcie hash commita
   i lista zmienionych plików.
