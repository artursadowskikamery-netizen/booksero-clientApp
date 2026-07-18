# BookSero — Architektura aplikacji konsumenckiej

> **Dokument architektury · v1** — wersja robocza do dyskusji, nie stanowi wdrożenia.
> Opracowano na podstawie analizy repozytoriów `app-vivimassage` oraz
> `booksero @ claude/hej-5yvvly` (odczyt, bez zmian).

Konsumencka aplikacja mobilna (B2C) platformy rezerwacyjnej **Booksero** —
jedna apka dla wielu salonów, każdy z własną marką, którą salon promuje
wśród własnych klientów.

| | |
|---|---|
| **Model** | multi-tenant · jeden backend |
| **Backend** | Booksero (Twoja platforma) |
| **Dostarczanie** | PWA (+ opcjonalnie TWA do Google Play) |
| **Prototyp** | APP Vivi Massage (jednotenantowy) |

---

## 1. Werdykt

**W pełni wykonalne — i prostsze, niż zakładaliśmy.**

Publiczne API konsumenckie Booksero **już istnieje i działa** — to samo, które
napędza wizytówki salonów i widget rezerwacji. Nowa aplikacja BookSero nie
buduje backendu; jest **nowym, brandowalnym klientem nad istniejącym API** pod
adresem `/api/public/book/:salonId`. Klient wskazuje salon (ID / QR), aplikacja
pobiera jego dane i markę, i wystawia kalendarze oraz rezerwację.

---

## 2. Model produktu — dwie twarze jednej platformy

Klasyczny układ „platforma B2B + apka konsumencka B2C" — jak Booksy Biz i
Booksy. Booksero zarządza rezerwacjami po stronie biznesów; BookSero to apka,
którą ich klienci trzymają w telefonie.

```
┌─────────────────────────────────────────────────────────┐
│  BOOKSERO  ·  Platforma · B2B · Twoja                    │
│  Wielotenantowy system rezerwacji. Salony zarządzają     │
│  kalendarzem, kadrą, usługami, klientami, płatnościami.  │
│  Źródło prawdy.                                           │
└─────────────────────────────────────────────────────────┘
                          │
             publiczne API · /api/public/book/:salonId
                          ▼
┌─────────────────────────────────────────────────────────┐
│  BOOKSERO (apka)  ·  B2C · brandowana per salon          │
│  Klient salonu: umawia wizytę, widzi wolne terminy,      │
│  program lojalnościowy, dostaje przypomnienia push.      │
│  Aplikacja przybiera markę salonu.                       │
└─────────────────────────────────────────────────────────┘
                          │
     → salon promuje apkę wśród WŁASNYCH klientów (retencja)
```

> **Ważne:** multi-tenant dotyczy **salonów** (jest ich wiele, każdy ze swoją
> marką) — nie backendów. Backend jest zawsze jeden: Booksero. Dlatego **nie
> budujemy „adaptera wielu systemów".**

---

## 3. Kluczowe odkrycie — publiczne API konsumenckie już istnieje

Analiza repozytorium `booksero @ claude/hej-5yvvly` pokazała komplet
publicznych, niewymagających logowania endpointów po `:salonId`. To dokładnie
model „wpisz ID salonu → aplikacja pobiera dane i wystawia kalendarze".
Aplikacja konsumuje to samo API, którego używają wizytówki i widget embed.

| Metoda | Endpoint | Do czego w apce |
|---|---|---|
| `GET`  | `/api/public/book/:salonId` | Dane salonu + branding (nazwa, logo, adres, motyw, waluta) i ustawienia rezerwacji |
| `GET`  | `/api/public/book/:salonId/categories` | Kategorie usług (krok „wybierz usługę") |
| `GET`  | `/api/public/book/:salonId/services` | Usługi: nazwa, czas, cena, przedpłata |
| `GET`  | `/api/public/book/:salonId/staff?serviceId=` | Pracownicy dostępni dla wybranej usługi |
| `GET`  | `/api/public/book/:salonId/team` | Zespół salonu (prezentacja: avatar, bio) |
| `GET`  | `/api/public/book/:salonId/reviews` | Opinie (opublikowane, zanonimizowane) |
| `GET`  | `/api/public/book/:salonId/availability?staffId&serviceId&date` | **Wolne terminy** — serce „wystawiania kalendarzy" |
| `POST` | `/api/public/book/:salonId/appointments` | **Utworzenie rezerwacji** (z przedpłatą Stripe, jeśli włączona) |
| `GET`  | `/api/public/s/:slug` | Salon po slugu (linki / subdomeny wizytówek) |
| `POST` | `/api/public/cancel/:token` | Anulowanie wizyty po tokenie |
| `POST` | `/api/public/visit/:token/confirm` | Potwierdzenie wizyty po tokenie |

**Konsekwencja:** nie projektujemy backendu ani integracji od zera. Faza
„adapter" redukuje się do **cienkiego klienta HTTP** nad tym API.

---

## 4. Model tenanta — jak apka rozpoznaje salon

Booksero rozróżnia salony na trzy sposoby — to przekłada się wprost na sposób
wejścia do apki:

| Identyfikator | Co to | Uwagi |
|---|---|---|
| `salons.id` (**UUID**) | Wewnętrzny, techniczny identyfikator | **To jego przyjmuje publiczne API** (`:salonId`). Idealny do QR / linku głębokiego. |
| `salons.display_id` (**`ML########`**) | Krótki, ludzki numer (np. `ML04352678`) | Do dyktowania. Ręczne wpisanie wymaga rozwiązania ML → UUID. |
| **slug** (`/api/public/s/:slug`) | Nazwa w adresie wizytówki | Gotowa trasa rozwiązująca slug → salon. Dobre dla ładnych linków per marka. |

**Rekomendacja wejścia:** główną drogą niech będzie **QR / link głęboki**
(zaszyty UUID lub slug) — salon wiesza QR na recepcji, klient skanuje i apka od
razu otwiera się jako jego salon. Ręczne wpisanie `ML` jako fallback (wymaga
drobnego endpointu ML → UUID). Wybór jest zapamiętywany — potem apka wygląda
jak apka jednego salonu.

---

## 5. Warstwy aplikacji

1. **Powłoka „BookSero"** — jedna apka w sklepie, jedno konto dewelopera.
   Ledwie widoczny nagłówek; twarzą jest marka salonu.
2. **Wybór salonu** — rozpoznanie tenanta po ID / QR / slugu. Zapamiętany
   wybór, przełączanie salonu, publiczny widok bez logowania.
3. **Branding runtime** — po wczytaniu salonu apka pobiera logo, motyw, kolory
   i teksty z API i dynamicznie zmienia wygląd.
4. **Warstwa zaangażowania** — lojalność, przypomnienia, push, polecenia. To,
   co czyni z apki narzędzie retencji, a nie tylko formularz rezerwacji.

---

## 6. Reużycie — co bierzemy z VIVI, co budujemy nowego

Obecna aplikacja **APP Vivi Massage** to działający, jednotenantowy prototyp
dokładnie tego produktu. Większość wartości przenosimy; nowy jest głównie
fundament.

### ♻︎ Reużycie
- Cały frontend i komponenty (React / shadcn)
- Design system i wygląd (przenośny 1:1)
- Program lojalnościowy: misje, polecenia, vouchery, VIVI Vote
- Przypomnienia o wizytach (push + SMS)
- Czat AI „Kasia"
- Logika kreatora rezerwacji

### ✎ Nowe
- Warstwa tenantów + rozpoznanie salonu (ID / QR)
- Klient HTTP nad publicznym API Booksero
- Branding sterowany konfiguracją (nie forkiem)
- Trwały magazyn sesji + auth per tenant
- Push oznaczony tenantem i klientem
- Powłoka + zapamiętywanie wyboru salonu

> „Nowa aplikacja" nie oznacza „pisać od zera" — to nowy szkielet plus
> odzyskane ekrany i logika.

---

## 7. Dostarczanie — jedna apka, wiele marek, bez sklepowej biurokracji

| Warstwa | Rozwiązanie | Uwagi |
|---|---|---|
| **Rdzeń** | **PWA** | Instalowalna z przeglądarki, push (Android; iOS od 16.4), offline. Nowy salon = nowa marka bez pracy w sklepie. Niezależna od Google/Apple. |
| **Opcja** | **TWA → Google Play** | Jedna apka „BookSero" opakowana (Bubblewrap), **jedno Twoje konto dewelopera**. Salon wybierany w apce po ID/QR — bez listingu per salon. |
| **Później** | **Capacitor → iOS** | Ta sama baza kodu na App Store, gdy zajdzie potrzeba. Osobne konto Apple + recenzja — druga faza. |

---

## 8. Roadmapa — kolejność wdrożenia

| Faza | Zakres | Nakład |
|---|---|---|
| **0 · Fundament** | Klient HTTP nad publicznym API Booksero; schemat konfiguracji tenanta; rozstrzygnięcie rozpoznania salonu (UUID / ML / slug). API jest gotowe — mapujemy je. | niski |
| **1 · Szkielet multi-tenant + pierwszy salon** | Powłoka BookSero, rozpoznanie salonu po QR/ID, branding runtime, kreator rezerwacji na żywym API (dostępność + utworzenie wizyty). | średni |
| **2 · Warstwa zaangażowania** | Lojalność, przypomnienia, push per tenant, czat AI — przeniesione z VIVI jako moduły włączane per salon. | średni |
| **3 · Samoobsługa i skala** | Panel: salon konfiguruje branding i promocje sam. Opcjonalne opakowanie TWA do Google Play. Domeny/subdomeny per marka. | średni–wysoki |

---

## 9. Decyzje otwarte — do rozstrzygnięcia przy Fazie 0

1. **Gdzie mieszka branding i reguły lojalności?**
   Usługi, kadra, dostępność — z Booksero (już tam są). Ale logo/kolory/teksty
   i reguły promocji: dodajemy do Booksero (wszystko w jednym miejscu), czy
   trzyma je osobna warstwa ustawień apki?

2. **Rozpoznanie salonu po „ML"?**
   Publiczne API przyjmuje UUID. Jeśli klient ma móc wpisać `ML########`
   ręcznie, potrzebny drobny endpoint ML → UUID. QR/slug omija problem.

3. **Logowanie klienta i dane osobowe.**
   Publiczny widok (usługi, terminy, rezerwacja) działa po ID. Dane osobowe
   (historia, lojalność) — dopiero po zalogowaniu klienta w kontekście salonu.
   Do domknięcia z mechanizmem auth Booksero (SMS / Google).

---

## Następny krok

Domknięcie **Fazy 0**: dokładny kontrakt `POST /api/public/book/:salonId/appointments`
(jakie pola przyjmuje) + rozstrzygnięcie rozpoznania salonu. To odblokowuje
budowę kreatora rezerwacji na żywym API.
