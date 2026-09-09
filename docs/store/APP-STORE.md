# Booksero w App Store (iOS) — stan i plan

Stan na 2026-09-09.

## Zrobione
- Apple ID firmowe: `developer@viviestetic.eu` (2FA na telefon firmowy).
- Zgłoszenie do Apple Developer Program jako **Organization**
  (VIVI ESTETIC SP. Z O.O., D-U-N-S ten sam co dla Google).
  **Enrollment ID: 3F2QU4WGT3** (2026-09-09). Apple weryfikuje uprawnienie
  do podpisywania umów (1–3 dni robocze, możliwy telefon), potem mail
  z linkiem do opłaty 99 USD/rok.
- Xcode: pobieranie na Macu właściciela.

## Do zrobienia (po opłacie)
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
