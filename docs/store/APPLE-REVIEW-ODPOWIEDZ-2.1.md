# Odpowiedź dla App Review — Guideline 2.1 „Information Needed" (2026-09-15)

Submission ID 71477060-0540-4f31-bb43-a04b8dd82be6, wersja 1.0 (1).
Apple prosi o: (1) nagranie ekranu z fizycznego iPhone'a, (2)–(6) odpowiedzi
tekstowe. Tekst poniżej wkleić **dwa razy**: jako odpowiedź w wątku na
stronie App Review ORAZ do pola **Notes** w App Review Information
(strona wersji 1.0 → App Review Information → Notes).

Miejsca w nawiasach kwadratowych uzupełnia właściciel (numer testowy, kod
— nie zapisujemy ich w repo).

## 1. Nagranie (screen recording)

Nagrane na iPhonie z TestFlight. Kolejność na nagraniu:
1. Uruchomienie aplikacji (ekran „Find your salon").
2. Wpisanie numeru testowego → Get started → kod SMS → lista salonów → wejście.
3. Ekran salonu: usługi, rezerwacja wizyty (do potwierdzenia), Moje wizyty.
4. Profil → **Delete account** → potwierdzenie → ekran końcowy.
5. Ponowne logowanie tym samym numerem (pokazuje, że konto można założyć od nowa).

Plik .mp4/.mov załączyć w odpowiedzi na stronie App Review (przycisk
załącznika w oknie wiadomości).

## 2–6. Tekst do wklejenia (EN)

```
1. Screen recording
Attached: a screen recording captured on a physical iPhone (latest iOS) via TestFlight. It shows app launch, sign-in with the test phone number and SMS code, browsing services and booking an appointment, the account deletion flow (Profile -> Delete account), and signing in again afterwards. The app has no user-generated public content, no paid content and no in-app purchases.

2. Purpose and target audience
Booksero is the client app of the Booksero appointment-booking platform used by beauty, massage and wellness salons. It is aimed at the salons' existing clients (adults, mainly in Europe). A client enters their salon by scanning the salon's QR code, typing the salon's name, or entering their phone number; signs in with a one-time SMS code (no passwords); and can then view the salon's services, book and manage appointments, see upcoming and past visits, collect loyalty points and receive appointment reminders. The problem it solves: clients can book and manage visits at any time without calling the salon, and salons reduce no-shows. The app is for consumers (salon clients), not for salon staff; salons manage their business in a separate web panel.

3. Setup and access instructions (test account)
- Launch the app and choose a language (top-right selector).
- In the field "Enter the salon's name or your phone number" type the test phone number: [NUMER TESTOWY]
- Tap "Get started". On the next screen enter the one-time code: [KOD] (this test number always receives this fixed code; no real SMS is sent).
- Choose the salon from the list (e.g. "VIVIMassage Zory") to enter it.
- Main features: "Services" -> pick a service -> choose a date and time -> confirm the booking; "My visits" shows upcoming and past appointments; "Profile" shows personal data, notification settings, "Log out" and "Delete account".
- Account deletion: Profile -> Delete account -> confirm. The app removes the client's app access (sessions on all devices, registered devices, notification settings). The client can sign in again with the same number at any time.
- Alternative entry: type the salon name "[NAZWA SALONU]" in the same field instead of the phone number, then sign in with the test number and code as above.

4. External services and tools
- Booksero backend (our own platform, operated by VIVI ESTETIC SP. Z O.O.) - salons, services, bookings, client records, sign-in codes. Hosted on Replit.
- SMS gateway provider - delivery of one-time sign-in codes and appointment reminders (not used for the test number, which has a fixed code).
- Apple WKWebView - the app loads our web application from https://app.booksero.com inside the native shell.
- The build includes the Firebase Messaging SDK from the app template, but push notifications are not enabled in this version; no Firebase project is active.
- No payment processors (bookings are paid at the salon), no advertising SDKs, no analytics SDKs, no AI services, no third-party authentication.

5. Regional differences
The app functions identically in all regions. The user can choose the interface language (16 European languages) and the salon's country; the country only sets the phone-number format for looking up the client's salons. All content (salon names, services, prices) is provided by the individual salons.

6. Regulated industry / protected material
Booksero does not operate in a regulated industry and does not include protected third-party material. It is not a medical device and offers no medical services; it only books appointments at beauty, massage and wellness salons. All salon content is provided by the salons themselves, which are business customers of VIVI ESTETIC SP. Z O.O. (the app publisher). No licences or credentials are required to provide this service.
```

## Po wysłaniu

Apple odpowiada zwykle w 1–2 dni. Jeśli poprosi o więcej — wkleić treść do
sesji aplikacji.
