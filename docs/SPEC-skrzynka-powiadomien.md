# SPEC — skrzynka powiadomień klienta (dzwonek w aplikacji)

ZADANIE DLA AGENTA BACKENDU/PANELU (KNOWLEDGE BOOKSERO).
Część aplikacyjną (ekran skrzynki, plakietka na dzwonku) wykona osobno
agent aplikacji klienckiej — NIE ruszać repo booksero-clientApp.

## 1. Cel i kontekst

Dzwonek w aplikacji klienckiej (nagłówek salonu) ma być skrzynką
wiadomości klienta z licznikiem nieprzeczytanych — dziś to atrapa.
Skrzynka działa NIEZALEŻNIE od Web Push (suwak push w Profilu bez zmian):
klient z wyłączonym push po wejściu do aplikacji też widzi, co go ominęło.

## 2. Model danych (nowa tabela `client_notifications`)

- `id` (uuid), `tenantId`, `clientId` (konkretna karta klienta),
  `salonId` (nullable — wiadomość sieciowa może nie mieć salonu),
- `kind` — typ: `visit_reminder`, `visit_confirmed`, `visit_cancelled`,
  `visit_rescheduled`, `loyalty_reward`, `referral_rewarded`,
  `code_issued`, `salon_message` (ręczna wiadomość z panelu),
  (typ rozszerzalny — string, nie enum DB),
- treść dwutorowo:
  - typy automatyczne: `i18nKey` + `params` (JSON) — tłumaczenie w momencie
    ODCZYTU wg nagłówka X-Locale (jak reszta komunikatów publicznych ×16),
  - `salon_message`: `title` + `body` zapisane dosłownie, jak napisał salon
    (bez tłumaczenia),
- `url` (nullable — dokąd prowadzi klik w aplikacji, ścieżka względna,
  np. `/salon/<id>/visits`),
- `createdAt`, `readAt` (nullable).
- Indeksy: (clientId, readAt), (tenantId, createdAt).
- Retencja: sprzątanie rekordów starszych niż 90 dni (job w schedulerze).

## 3. Zasilanie skrzynki (źródła)

1. **Wpięcie w istniejące wysyłki push**: wszędzie, gdzie backend wysyła
   Web Push do klienta, NAJPIERW tworzy rekord skrzynki, a push jest tylko
   kanałem dostawy (payload push może nieść `url` z rekordu). Push wyłączony
   → rekord i tak powstaje.
2. **Zdarzenia bez push** (jeśli jakieś ścieżki nie mają dziś push):
   potwierdzenie/odwołanie/przesunięcie wizyty, przyznanie nagrody/kodu,
   nagroda za polecenie — tworzą rekord.
3. **Ręczna wiadomość z panelu** (`salon_message`) — patrz §5.

## 4. Publiczne API klienta (Authorization jak /api/public/client/*)

Wszystkie odpowiedzi ograniczone do `clientIds` z tokenu (te same zasady
co wizyty klienta — unifikacja per osoba, izolacja tenantów).

- `GET /api/public/client/notifications?limit=30&before=<createdAt>` →
  `{ items: [{ id, kind, title, body, url, createdAt, readAt }] }` —
  posortowane od najnowszych; `title`/`body` już PRZETŁUMACZONE
  (dla typów automatycznych) wg X-Locale.
- `GET /api/public/client/notifications/unread-count` → `{ count }` —
  MUSI być tanie (jedno zapytanie po indeksie) — aplikacja odpytuje często.
- `POST /api/public/client/notifications/read` body `{ ids: [...] }`
  albo `{ all: true }` → oznacza przeczytane (readAt=now); cudze id
  ignorowane bez błędu.

## 5. Panel — wysyłanie wiadomości do klientów

Nowa pozycja (np. w sekcji marketing/komunikacja): „Wiadomość do klientów".

- Nadawanie: tytuł (max 80) + treść (max 500), opcjonalny odnośnik
  (wybór prosty: brak / rezerwacja / bonusy).
- Adresaci: (a) wszyscy klienci wybranego salonu, (b) wszyscy klienci
  sieci, (c) pojedynczy klient z karty klienta (przycisk „Wyślij wiadomość"
  na karcie).
- Wysyłka = utworzenie rekordów skrzynki + Web Push do urządzeń, które
  mają push włączony (istniejący mechanizm; uszanować wyłączony push konta).
- Antyspam: max 2 wysyłki masowe (a/b) na dobę na tenanta; komunikat
  o limicie. Wiadomości do pojedynczego klienta bez limitu dobowego.
- Przed wysyłką masową okno potwierdzenia z liczbą adresatów.
- Teksty UI panelu ×16 języków.

## 6. Bezpieczeństwo

- Klient widzi wyłącznie swoje rekordy (clientIds z tokenu, tenant tokenu).
- Panel: wysyłka tylko w obrębie własnego tenanta; rola z dostępem do
  klientów.
- Treść `salon_message` renderowana jako zwykły tekst (bez HTML).

## 7. Testy odbiorcze (DoD)

1. Rezerwacja wizyty przez klienta → rekord `visit_confirmed`;
   unread-count=1; po `read` → 0.
2. Panel: wiadomość do wszystkich klientów salonu → rekord u każdego
   klienta salonu; klient z push dostaje też push; klient bez push widzi
   wiadomość w skrzynce po wejściu.
3. Klient A nie widzi powiadomień klienta B (inne konto/tenant).
4. X-Locale=de → automatyczne tytuły po niemiecku; `salon_message`
   dosłownie jak napisano.
5. 3. wysyłka masowa tego samego dnia → odmowa z komunikatem o limicie.
6. unread-count wykonuje się szybko (pojedyncze zapytanie po indeksie).

## 8. Poza zakresem

- Aplikacja kliencka (ekran skrzynki, plakietka na dzwonku, odpytywanie
  licznika) — osobne zadanie w repo booksero-clientApp.
- Ustawienia push (suwak w Profilu) — bez zmian.
- SMS — skrzynka nie dotyczy kanału SMS.
