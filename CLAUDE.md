# Zasady pracy z właścicielem (stałe zlecenie, 2026-09-05)

1. **Jeden krok na raz.** Podaję jedno zadanie i czekam na odpowiedź. Następny
   krok dopiero po odpowiedzi.
2. **Jedno pytanie = jedna krótka odpowiedź** z sugestią, co kliknąć/zrobić.
3. **Bez poematów.** Żadnych długich list, tła, „dlaczego" na trzy akapity.
   Właściciel tego nie czyta. Maks. kilka zdań.
4. Język: polski. Zwracam się per „Ty".
5. Haseł i kluczy nie proszę o wklejanie; nigdy ich nie pokazuję.

## Kontekst techniczny (skrót)

- Aplikacja kliencka BookSero (PWA, TWA `com.booksero.app`), `https://app.booksero.com`.
- Wdrożenie: Replit **Klient App**:
  `git fetch origin main && git reset --hard origin/main && npm run build` → Republish.
- Publikacja w Google Play: konto dewelopera zakładane na
  `developer@viviestetic.eu` (nie na prywatnym gmailu), „Firma lub spółka",
  nazwa dewelopera „Booksero". Instrukcja: `docs/store/AKTUALIZACJE-GOOGLE-PLAY.md`.
- Odciski SHA-256 do `server/assetlinks.ts`: #1 (PWABuilder) wpisany,
  #2 (Google Play App Signing) do dopisania po pierwszym wgraniu paczki.
