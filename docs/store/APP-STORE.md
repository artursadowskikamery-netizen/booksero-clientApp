# Booksero w App Store (iOS) — stan i plan

Stan na 2026-09-15.

## ODRZUCONE 2026-09-15 — Guideline 2.1 „Information Needed" (nowe konto)
Apple prosi o nagranie ekranu z fizycznego iPhone'a + 6 odpowiedzi.
Tekst odpowiedzi i kolejność nagrania: `APPLE-REVIEW-ODPOWIEDZ-2.1.md`.
Aplikacja na iPhone'a przez TestFlight (Internal Testing, build 1.0 (1)).

## WYSŁANE DO RECENZJI — 2026-09-14 00:15, status „Waiting for Review"
- App Store Connect: Apple ID aplikacji 6811678561, SKU `booksero`, wersja
  1.0, build 1.0 (1). Submission ID 71477060-0540-4f31-bb43-a04b8dd82be6.
- Wynik przyjdzie mailem na developer@viviestetic.eu (zwykle 1–3 dni).
  Odrzucenie → treść w App Store Connect → App Review; poprawki, nowy
  Archive (podbić build number w Xcode: General → Build), Add for Review.
- Co jest w zgłoszeniu: opis EN, 8 zrzutów iPhone 6,9" (1284×2778 lub
  1320×2868), 1 zrzut iPad 13" (2064×2752), ikona RGB, ocena wieku 4+,
  polityka `https://app.booksero.com/privacy`, App Privacy (imię, e-mail,
  telefon, ID użytkownika, ID urządzenia, dane użycia — App Functionality,
  powiązane z użytkownikiem, bez śledzenia), cena Free, 175 krajów,
  „regulated medical device: No", dane do logowania dla recenzenta (numer
  testowy ze stałym kodem — te same co dla Google).
- Podpisywanie w Xcode: Team VIVI ESTETIC SP. Z O.O. (9WBP3PU6FA),
  automatyczne. Uwaga: Archive wymaga zarejestrowanego urządzenia w
  zespole — zarejestrowaliśmy Maca przez uruchomienie celu
  „My Mac (Designed for iPad)"; iPhone nie był potrzebny.
- Push na iOS NIE jest skonfigurowany (Firebase placeholder) — decyzja
  odłożona na po pierwszej publikacji.

## Zrobione
- Apple ID firmowe: `developer@viviestetic.eu` (2FA na telefon firmowy).
- Zgłoszenie do Apple Developer Program jako **Organization**
  (VIVI ESTETIC SP. Z O.O., D-U-N-S ten sam co dla Google).
  **Enrollment ID: 3F2QU4WGT3** (2026-09-09). Apple weryfikuje uprawnienie
  do podpisywania umów (1–3 dni robocze, możliwy telefon), potem mail
  z linkiem do opłaty 99 USD/rok.
- Xcode 26.6 zainstalowany (pobrany z developer.apple.com, App Store
  odmawiał). Homebrew + CocoaPods 1.17 na Macu. Projekt `ios/src` po
  `pod install` buduje się i działa w symulatorze iPhone 17 Pro Max
  (2026-09-09): bez paska adresu, salon, usługi, rezerwacja OK.

## Do zrobienia (po opłacie) — WYKONANE 2026-09-13/14, zostawione jako zapis
1. App Store Connect → nowa aplikacja: nazwa „Booksero", Bundle ID
   `com.booksero.app` (ten sam identyfikator co Android — osobna
   przestrzeń, nie koliduje), SKU `booksero`.
2. Paczka iOS: PWABuilder → iOS → Xcode project (bundle id jak wyżej,
   nazwa Booksero, `https://app.booksero.com`). Otworzyć w Xcode, podpisać
   kontem firmy, Archive → Distribute → App Store Connect.
3. Wpis w sklepie: teksty z `OPIS-SKLEP-TLUMACZENIA.md` (App Store ma
   osobne limity: podtytuł 30 zn., opis 4000, „słowa kluczowe" 100 zn.),
   ikona 1024×1024 (bez przezroczystości), zrzuty 6,7"/6,5" i 5,5".
4. Polityka prywatności: ten sam adres. „App Privacy" (odpowiednik
   Bezpieczeństwa danych): imię, e-mail, telefon, identyfikator użytkownika,
   historia rezerwacji; brak śledzenia.
5. Recenzja Apple: zasada 4.2 (minimum functionality) — opakowana strona
   bywa odrzucana. Argumenty: logowanie, rezerwacje, program bonusowy,
   powiadomienia. Konto testowe dla recenzenta (numer + stały kod — to samo
   zlecenie dla panelu co dla Google).

## Ograniczenia techniczne opakowania iOS (do rozstrzygnięcia)
- **Push**: w WKWebView nie działa Web Push. Opcje: (a) natywne APNs
  w opakowaniu + mostek do strony, (b) bez push w wersji sklepowej, push
  tylko w PWA z Safari. Decyzja właściciela przed wysłaniem do recenzji.
- **Kod SMS**: na iOS nie ma WebOTP; działa autouzupełnianie z klawiatury
  (pole `autocomplete="one-time-code"`) — sprawdzić w polu kodu.
- **Skaner QR**: kamera w WKWebView wymaga uprawnienia NSCameraUsageDescription
  w Info.plist (PWABuilder dodaje).

## Trzy punkty przed pierwszą wysyłką (ustalone 2026-09-13)

### 1. Usunięcie konta w aplikacji (Apple 5.1.1(v))
**Stan 2026-09-13: WDROŻONE w wersji szczupłej (1.0.50).** Właściciel
zawęził zakres do warstwy 1: usuwamy dostęp do aplikacji (sesje,
urządzenia push, znaczniki), kartoteka zostaje u salonu; aplikacja NIE
składa żądania usunięcia kartoteki. Panel: `POST
/api/public/client/account/delete-request` (poz. 490). Aplikacja: Profil →
Usuń konto → potwierdzenie → ekran końcowy. Polityka §7 zaktualizowana.
Pierwotna propozycja (dwie warstwy) poniżej — dla zapisu.

Decyzja pierwotna: dwie warstwy. Dane aplikacji (sesje, push) usuwamy natychmiast
jako operator; kartoteka należy do salonu, więc aplikacja SKŁADA żądanie
usunięcia (RODO art. 17) do każdego salonu z kartoteką pod tym numerem,
a salon realizuje je w panelu w 30 dni. Apple akceptuje inicjowanie
usunięcia w aplikacji z jasną informacją o czasie i administratorze.
- Panel: `docs/ZLECENIE-panel-usuniecie-konta-w-aplikacji.md` (repo panelu):
  punkt `POST /api/public/client/account/delete-request`, tabela żądań,
  ekran „Żądania usunięcia danych", anonimizacja, SMS/e-mail potwierdzenia.
- Aplikacja (do zrobienia po wdrożeniu panelu): Profil → „Usuń konto" →
  ekran z wyjaśnieniem dwóch warstw → potwierdzenie → wywołanie dla każdej
  zapamiętanej sesji → wyczyszczenie localStorage → ekran „Przyjęliśmy
  żądanie" z listą salonów i datą. Polityka §7 uzupełniona.

### 2. Sign in with Apple
NIE jest wymagane. Wymóg (4.8) dotyczy aplikacji z logowaniem przez
konto trzecie (Google, Facebook…). Booksero loguje wyłącznie numerem
telefonu i kodem SMS — Apple wprost wyłącza taki przypadek. Nic nie robimy.

### 3. Ankieta „App Privacy" w App Store Connect (musi zgadzać się z polityką)
Odpowiedzi do zaznaczenia:
- Do we collect data? **Yes**.
- **Contact Info**: Name, Email Address (optional), Phone Number —
  linked to user, NOT used for tracking; purpose: App Functionality.
- **Identifiers**: User ID (identyfikator kartoteki), Device ID (token
  push) — linked to user, not tracking; App Functionality.
- **User Content**: Other User Content (rezerwacje, historia wizyt,
  punkty) — linked to user, not tracking; App Functionality.
- **Usage Data**: NIE (brak analityki, brak SDK reklamowych).
- **Location**: NIE. **Purchases**: NIE. **Diagnostics**: NIE.
- Tracking (ATT): **No**, aplikacja nie śledzi użytkowników.
- Privacy Policy URL: `https://app.booksero.com/polityka-prywatnosci`
  (przed wysyłką: wersja EN tej strony — `/privacy` — musi mieć treść po
  angielsku, dziś oba adresy oddają polski tekst).
Uwaga: Firebase Messaging w opakowaniu iOS nie jest skonfigurowany (brak
własnego `GoogleService-Info.plist`), więc nie deklarujemy danych Firebase.
Jeśli włączymy push natywny — dopisać „Device ID" w Firebase i sprawdzić
politykę Firebase.
