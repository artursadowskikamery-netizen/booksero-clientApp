# SPEC — Bonusy Etap A: program lojalnościowy w aplikacji klienckiej

Aplikacja kliencka BookSero (osobne repo) dostaje zakładkę **Bonusy**.
Backend Booksero musi dostarczyć: suwaki funkcji aplikacji per tenant,
poziomy lojalnościowe per tenant, publiczne endpointy lojalnościowe dla
zalogowanego klienta oraz zgłoszenia odbioru nagród widoczne na karcie
klienta w panelu.

Gałąź robocza: `claude/loyalty-app-a`. Nie mergować do main.
Wykorzystać ISTNIEJĄCY silnik lojalnościowy (`loyalty_programs`,
`loyalty_rewards`, punkty klientów, `bonusJoinProgram`) — nie budować
drugiego. Zmiany schematu dozwolone (będzie `db:push`).

## 0. Zasady nadrzędne (ustalenia właściciela)

1. Suwaki funkcji aplikacji działają **per tenant** (cała sieć salonów).
2. Punkty i poziom widzi TYLKO klient, który **dołączył** do programu
   (świadoma akcja w aplikacji). Pozostali dostają dane do zaproszenia.
3. Poziomy liczone od punktów **zdobytych łącznie** (lifetime) — poziom
   nigdy nie spada. Saldo bieżące służy do nagród.
4. Nagrody odbiera się **wyłącznie w salonie**: klient zgłasza chęć odbioru
   w aplikacji → zgłoszenie widnieje na **karcie klienta w panelu** →
   recepcja wydaje nagrodę i potwierdza → DOPIERO WTEDY punkty schodzą
   z salda. Żadnych kodów samoobsługowych w aplikacji.

## 1. Suwaki funkcji aplikacji (per tenant)

Nowa konfiguracja per tenant (nowa tabela, np. `tenant_app_features`,
albo rozszerzenie istniejącej konfiguracji tenanta — wybrać spójnie
z kodem):

- klucz `loyalty` (boolean, default **false**) — program punktowy
  + poziomy + nagrody w aplikacji.
- Struktura MUSI być łatwo rozszerzalna o kolejne klucze w następnych
  etapach: `referrals`, `codesNotebook`, `missions`, `timeDiscounts`
  (NIE implementować ich teraz — tylko nie zabetonować struktury).

Panel: sekcja ustawień tenanta (tam gdzie ustawienia sieci) z suwakiem
„Program lojalnościowy w aplikacji klienckiej". Uprawnienia jak inne
ustawienia tenanta.

Ekspozycja dla aplikacji: `GET /api/public/tenant/:tenantId` ORAZ
`GET /api/public/book/:salonId` zwracają dodatkowo
`appFeatures: { loyalty: boolean }`.

## 2. Poziomy lojalnościowe (per tenant)

Nowa tabela, np. `loyalty_tiers`:
`id, tenantId, name, minPoints (int, >=0), sortOrder, color (text, opcjonalnie), isActive`.

- Konfigurowane w panelu przy ustawieniach programu lojalnościowego
  (prosta lista: nazwa + próg punktowy + kolor; dodawanie/edycja/
  usuwanie). Per TENANT, nie per salon.
- Poziom klienta = najwyższy tier, którego `minPoints <= lifetimePoints`.
- Brak skonfigurowanych tierów = program działa bez poziomów
  (aplikacja po prostu ich nie pokaże).

## 3. Punkty: saldo i lifetime (tenant-wide)

- Saldo bieżące: suma punktów wszystkich rekordów klienta w tenancie
  (zbiór rekordów jak w `deriveClientIds` z client-auth — telefon +
  globalClientId). Zgodnie z `crossSalonPoints`.
- Lifetime (dorobek): suma WSZYSTKICH dodatnich naliczeń punktów w
  tenancie. Jeśli istnieje historia transakcji punktowych — liczyć z niej;
  jeśli nie ma — dodać licznik `lifetimePoints` przy klientach naliczany
  równolegle z każdym dodaniem punktów (odbiory nagród go NIE zmniejszają).

## 4. Członkostwo w programie

- Nowy zapis członkostwa per tenant (np. tabela
  `loyalty_memberships`: `id, tenantId, globalClientId/clientId,
  joinedAt`) — wybrać klucz spójny z modelem cross-salon.
- `POST /api/public/client/loyalty/join` (requireClientAuth):
  - suwak `loyalty` wyłączony → 404,
  - już członek → idempotentnie zwrócić stan (bez podwójnego bonusu),
  - zapis członkostwa + JEDNORAZOWY bonus powitalny wg `bonusJoinProgram`
    aktywnego programu lojalnościowego (przez istniejącą ścieżkę
    naliczania punktów).

## 5. Endpoint stanu lojalności

`GET /api/public/client/loyalty` (requireClientAuth; suwak wyłączony → 404):

```json
{
  "joined": true,
  "balance": 12500,
  "lifetime": 18200,
  "tier": { "name": "Srebrny", "color": "#C0C0C0" },
  "nextTier": { "name": "Złoty", "minPoints": 25000, "missing": 6800 },
  "tiers": [ { "name": "Start", "minPoints": 0, "color": null }, ... ],
  "joinBonus": 500,
  "rewards": [
    { "id": "...", "name": "Rabat 25 zł", "pointsCost": 5000,
      "rewardType": "discount", "rewardValue": "25.00",
      "canAfford": true, "claimStatus": null }
  ],
  "pendingClaims": [ { "id": "...", "rewardName": "...", "requestedAt": "..." } ]
}
```

- Dla NIE-członka: `joined: false` + `joinBonus` (do zaproszenia)
  — bez salda, bez lifetime, bez tierów, bez nagród.
- `rewards`: aktywne nagrody aktywnego programu tenanta;
  `claimStatus`: `"pending"` jeśli klient ma niepotwierdzone zgłoszenie
  na tę nagrodę.

## 6. Zgłoszenie odbioru nagrody

Nowa tabela, np. `loyalty_reward_claims`:
`id, tenantId, clientId (rekord główny klienta), rewardId, status
('pending'|'fulfilled'|'cancelled'), requestedAt, resolvedAt,
resolvedBy (userId)`.

- `POST /api/public/client/loyalty/rewards/:rewardId/claim`
  (requireClientAuth):
  - suwak wyłączony / nie-członek / nagroda nieaktywna → 404,
  - saldo < pointsCost → 400 (nowy kod komunikatu),
  - istnieje już `pending` na tę nagrodę → idempotentnie zwrócić je,
  - tworzy zgłoszenie `pending`. **Punktów NIE odejmuje.**
- `POST /api/public/client/loyalty/claims/:id/cancel` — klient może
  wycofać własne `pending` (cudze/rozstrzygnięte → 404).

Panel — **karta klienta**: sekcja „Zgłoszone nagrody" z listą `pending`
(nazwa nagrody, koszt punktowy, data zgłoszenia) i akcjami:
- **„Wydano"** → status `fulfilled` + odjęcie `pointsCost` z salda przez
  istniejącą ścieżkę odejmowania punktów (walidacja salda w momencie
  potwierdzenia — za mało punktów → błąd, zgłoszenie zostaje `pending`),
- **„Odrzuć"** → status `cancelled`, bez zmian punktów.
Wystarczy karta klienta — bez dodatkowych alertów/dzwoneczków.

## 7. i18n

Nowe kody komunikatów (WSZYSTKIE 16 języków w `server/i18n/messages.ts`),
m.in.: brak punktów na nagrodę, zgłoszenie przyjęte, zgłoszenie wycofane,
program niedostępny. Nazwy wg konwencji `loyalty.*`.

## 8. Bezpieczeństwo

- Wszystkie publiczne endpointy za `requireClientAuth`, każde zapytanie
  związane tenantem z tokenu; cudze zgłoszenia → 404.
- Suwak `loyalty` wyłączony → wszystkie endpointy z §4–6 zwracają 404,
  a `appFeatures.loyalty: false` w §1.
- Panelowe akcje „Wydano"/„Odrzuć" pod istniejącymi uprawnieniami
  do edycji klientów.
- `requireAuth` (staff), client-auth, booking — nietknięte poza zakresem.

## 9. Testy / Definition of Done

1. Suwak wyłączony → `appFeatures.loyalty:false`, endpointy loyalty 404.
2. Join: pierwszy raz → członkostwo + bonus powitalny raz; drugi raz →
   idempotentnie, bez drugiego bonusu.
3. GET loyalty: członek widzi saldo/lifetime/tier/nagrody; nie-członek
   tylko `joined:false` + `joinBonus`.
4. Poziom liczony z lifetime (po odjęciu punktów za nagrodę poziom
   BEZ zmian, saldo mniejsze).
5. Claim: bez wystarczającego salda → 400; z saldem → `pending`;
   duplikat → to samo zgłoszenie; cancel działa tylko dla własnych.
6. Panel: „Wydano" odejmuje punkty i zamyka zgłoszenie; „Odrzuć" zamyka
   bez zmian punktów; zgłoszenia widoczne na karcie klienta.
7. Kompilacja TypeScript przechodzi; `npm run db:push` wykonalny
   (nowe tabele bez destrukcji istniejących).
8. Push na gałąź `claude/loyalty-app-a`; w raporcie hash commita, lista
   zmienionych plików i informacja, czy potrzebny `db:push` (tak).
