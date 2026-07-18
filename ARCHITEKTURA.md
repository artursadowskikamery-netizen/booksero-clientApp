# BookSero — Architektura aplikacji konsumenckiej

> **Dokument architektury · v2** — wersja robocza do dyskusji, nie stanowi wdrożenia.
> Oparta na zweryfikowanej analizie repo `booksero @ claude/hej-5yvvly` (read-only).
> Szczegółowy kontrakt API: [`docs/API-KONTRAKT.md`](./docs/API-KONTRAKT.md).

Konsumencka aplikacja mobilna (B2C) platformy rezerwacyjnej **Booksero** —
jedna apka dla wielu tenantów (sieci salonów), każdy z własnym logo i nazwą,
którą tenant promuje wśród własnych klientów.

| | |
|---|---|
| **Model** | multi-tenant · jeden backend (Booksero) |
| **Tożsamość** | white-label per tenant TERAZ, architektura gotowa na marketplace |
| **Akcent (design)** | `#0071e3` — jeden, stały kolor w całej apce |
| **Dostarczanie** | PWA (+ opcjonalnie TWA do Google Play) |
| **Prototyp/źródło** | `app-vivimassage` (jednotenantowy) |

---

## 1. Werdykt

**Wykonalne.** Rdzeń rezerwacji (przeglądanie usług, dostępność, utworzenie
wizyty) działa **na istniejącym publicznym API Booksero** (`/api/public/book/:salonId`).
Aplikacja to **cienki, brandowalny klient** nad tym API — nie budujemy backendu
rezerwacji od zera. Dwie funkcje wymagają jednak **dodania backendu w Booksero**
(patrz §8): endpoint tenanta oraz logowanie i self-service konsumenta.

---

## 2. Model produktu — dwie twarze jednej platformy

Układ „platforma B2B + apka konsumencka B2C" (jak Booksy Biz + Booksy).

```
BOOKSERO (platforma B2B, Twoja, multi-tenant)
   │  publiczne API  /api/public/book/:salonId
   ▼
APLIKACJA BOOKSERO (B2C, brandowana per tenant)
   → tenant promuje apkę wśród WŁASNYCH klientów (retencja)
```

**Dwie różne osie:** wiele **tenantów/salonów** — TAK; wiele **backendów** — NIE
(zawsze Booksero). Aplikacja jest wielo-tenantowa, ale jedno-backendowa.

---

## 3. Tożsamość produktu — white-label teraz, marketplace-ready

- **Teraz:** apka per tenant. Klient wchodzi przez **link/QR/kod** swojego tenanta
  i widzi tylko jego. Brak przeglądania konkurencji.
- **NIE teraz:** wyszukiwarka po **typie** (barber/fryzjer) i katalog wszystkich
  firm — to funkcje marketplace'u, odłożone.
- **Zabezpieczenie przyszłości:** dane (miasto, kraj) trzymamy czyste. Marketplace
  będzie później „dołożeniem modułu", a nie rewolucją — **pod warunkiem** uzupełnienia
  luk z §8.3 (brak taksonomii typu biznesu i geo).

Zasada: **„zaprojektuj pod pivot, ale go nie buduj."**

---

## 4. Model wejścia i tenanta

**Znalezienie tenanta:** główną drogą **link/QR** (tenant rozdaje na paragonie,
w SMS, na stronie, recepcji). Fallback: **kod tenanta**. Przy zimnym starcie
(instalacja ze sklepu bez linku): **wyszukiwarka po NAZWIE** tenanta.
(Wyszukiwanie po typie/branży — funkcja marketplace'u — odłożone.)

**Hierarchia wyboru salonu (geograficzna):**
```
kraj  →  miasto  →  salon  →  kalendarz
```
Poziom zwijany, gdy jest jedna opcja (tenant jednokrajowy pomija kraj; miasto
z jednym salonem prowadzi wprost do kalendarza).

**Identyfikatory salonu (potwierdzone):** `salons.id` = **UUID** (przyjmuje je API);
`salons.display_id` = **`ML########`** (ludzki, do dyktowania); **slug** (`/api/public/s/:slug`).

---

## 5. Warstwy aplikacji

1. **Powłoka „BookSero"** — jedna apka, jedno konto dewelopera. Ledwie widoczna.
2. **Wybór tenanta** — link/QR/kod/nazwa; zapamiętany; ew. przełącznik tenantów
   (model „workspace" jak w Slacku).
3. **Wybór salonu** — kraj → miasto → salon.
4. **Branding runtime** — logo + nazwa tenanta z API. **Kolor stały: `#0071e3`.**
5. **Warstwa zaangażowania** — lojalność, przypomnienia, push (patrz zależność §8.2).

---

## 6. System projektowy

- **Akcent: `--blue #0071e3` (rgb 0,113,227)** — jedyny kolor akcentu w całej apce
  (CTA, aktywne stany, wybrane sloty, linki). Tryb ciemny: `#0A84FF` dla czytelności.
- **Marka tenanta = logo + nazwa (+ zdjęcia), NIE kolor.** Kolor pozostaje stały.
- Baza neutralna (off-white / near-black), typografia systemowa + mono do ID/godzin.
- Prototyp wizualny: patrz artefakt BookSero (link u właściciela).

---

## 7. Międzynarodowość (zweryfikowane)

- **15 języków** serwera. **Czeski `cs` — pełne wsparcie.** **Niderlandzki `nl` — brak**
  → tenant flamandzki (Belgia) na `fr/de/en`. Apka wysyła nagłówek `X-Locale`.
- **Waluta per salon** (`salons.currency`, dom. PLN); w publicznym API podawana raz
  na poziomie salonu — ceny usług dziedziczą walutę salonu.
- **Kraj** (`salons.country`, ISO2, notNull) i **miasto** (`salons.city`, wolny tekst,
  nullable) istnieją — wystarczą do grupowania geograficznego w apce.
- ⚠️ `stripePayments.currency` ma twardy default `pln` — do przeglądu przy płatnościach
  wielokrajowych online.

---

## 8. ⚠️ Luki po stronie Booksero (zweryfikowane) — do domknięcia

To jest najważniejszy wniosek weryfikacji. Trzy rzeczy trzeba **dodać w Booksero**:

### 8.1 Endpoint tenanta (mały, wymagany do wejścia)
`GET /api/public/tenant/:tenantId` → marka tenanta + lista jego **aktywnych,
nieusuniętych** salonów. Dziś **nie istnieje** (publiczny dostęp jest tylko per salon).
Uwaga: nie używać `getSalonsByTenant` wprost (zwraca usunięte/nieaktywne i pola
wewnętrzne) — filtrować i rzutować na pola publiczne.

### 8.2 Logowanie konsumenta + self-service (duży, krytyczny dla retencji)
**Booksero NIE ma logowania klienta.** SMS-2FA i Google to logowanie **personelu**.
Klient widzi dziś tylko **pojedynczą wizytę po tokenie** z linku. **„Moje wizyty"
(pełna historia) i „Lojalność" nie mają publicznego API** — dane są wyłącznie pod
`/api/salon/*` z JWT pracownika.
➡️ Warstwa zaangażowania (serce „promocji wśród klientów") wymaga zbudowania w Booksero:
**(a) logowania klienta (kod SMS)** i **(b) endpointów self-service** (moje wizyty,
moja lojalność, moje vouchery). To większa zależność, niż zakładaliśmy.

### 8.3 Taksonomia typu biznesu + geo (dla przyszłego marketplace)
Brak pola branży (barber/fryzjer) na tenancie i salonie; `service_categories` to
wolny tekst per salon; brak współrzędnych geo. Marketplace-by-type wymaga migracji
schematu. Do zrobienia dopiero przy pivocie.

---

## 9. Reużycie z VIVI

**APP Vivi Massage** to działający, jednotenantowy prototyp tego produktu.
Przenosimy: frontend/komponenty, design system, logikę kreatora rezerwacji,
oraz — po zbudowaniu backendu z §8.2 — moduły lojalności, przypomnień, push, czatu AI.
Nowe: warstwa tenantów, klient HTTP nad API Booksero, branding z konfiguracji,
trwałe sesje.

---

## 10. Dostarczanie

- **Rdzeń: PWA** — instalowalna, push (Android; iOS 16.4+). Nowy tenant = brak pracy w sklepie.
- **Opcja: TWA → Google Play** — jedna apka, jedno Twoje konto dewelopera.
- **Później: Capacitor → iOS App Store.**

---

## 11. Roadmapa (skorygowana o zależności)

| Faza | Zakres | Zależność | Nakład |
|---|---|---|---|
| **0. Fundament** | Klient HTTP nad API; konfiguracja tenanta; endpoint `/api/public/tenant/:tenantId` (§8.1) | mały dodatek w Booksero | niski |
| **1. Rezerwacja** | Powłoka, wybór tenanta/kraju/miasta/salonu, kreator (usługa→specjalista→termin→potwierdzenie→przedpłata) | **działa na istniejącym API** | średni |
| **2. Zaangażowanie** | Moje wizyty, lojalność, push per klient | **wymaga §8.2 (logowanie + self-service konsumenta) w Booksero** | wysoki (backend + apka) |
| **3. Skala** | Panel konfiguracji tenanta, TWA, domeny/subdomeny | — | średni–wysoki |

Kluczowa korekta względem v1: **Faza 2 (retencja) jest zablokowana przez brak
backendu konsumenta w Booksero** — to trzeba zbudować, zanim „lojalność/moje wizyty"
zadziałają w apce.

---

## 12. Decyzje otwarte

1. **Kolor akcentu w dark mode** — trzymamy `#0071e3` czy jaśniejszy `#0A84FF` dla kontrastu?
2. **Logowanie konsumenta** — SMS-kod (spójne z Booksero) jako metoda? Zakres self-service (tylko wizyty, czy też lojalność od razu?).
3. **Belgia/`nl`** — kierować flamandzkich tenantów na `fr/de/en`, czy dołożyć niderlandzki do Booksero?
4. **Kolejność** — czy budujemy Fazę 1 (rezerwacja, gotowe API) niezależnie, a §8.2 równolegle?
