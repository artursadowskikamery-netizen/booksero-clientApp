# ZLECENIE dla agenta panelu — zgody na karcie klientki (dwie usterki)

Zgłoszenie właściciela z 2026-08-13, po testach aplikacji klienckiej 1.0.28.
Aplikacja kliencka jest już poprawiona; obie usterki poniżej są PO STRONIE PANELU
(repo `booksero`, gałąź `claude/hej-5yvvly`).

---

## Usterka 1 — z recepcji nie da się WŁĄCZYĆ zgody, którą się przed chwilą wyłączyło

**Objaw (słowa właściciela):** „w panelu klienta BookSero.com nie można ponownie
włączyć tej zgody, którą się przed chwilą wyłączyło".

**Miejsce:** `client/src/components/client-consents-section.tsx`, funkcja
`widoczneTypy()` (ok. linii 46–49):

```ts
function widoczneTypy(data: Odpowiedz): TypZgody[] {
  const zakres = data.zakres ?? [...TYPY_ZGOD];
  return TYPY_ZGOD.filter((t) => zakres.includes(t) || data.stan?.[t]);
}
```

**Przyczyna:** zgoda spoza `zakres` lokalizacji (u właściciela: `image_publish`,
publikacja zdjęć) spełnia warunek widoczności TYLKO dopóki `stan[t] === true`.
W chwili wyłączenia wiersz znika z karty razem z przełącznikiem — i nie ma już
czego kliknąć, żeby zgodę przywrócić. Pułapka jednokierunkowa. Backend jest
sprawny: `storage.ustawZgode` przy `udzielona: true` wstawia nowy wiersz, więc
ponowne udzielenie działa — brakuje wyłącznie kontrolki w UI.

**Poprawka:** dołożyć trzeci warunek — HISTORIĘ. Zgoda, której klientka
kiedykolwiek dotknęła, zostaje na karcie na zawsze:

```ts
function widoczneTypy(data: Odpowiedz): TypZgody[] {
  const zakres = data.zakres ?? [...TYPY_ZGOD];
  // Trzeci warunek to HISTORIA. Bez niego zgoda spoza zakresu znikała z karty
  // w chwili wycofania i nie dawało się jej już przywrócić z panelu — a backend
  // przyjmuje ponowne udzielenie bez zastrzeżeń. Dokładnie ta sama poprawka
  // poszła w aplikacji klienckiej (BookSero 1.0.28, Consents.tsx).
  const wHistorii = (t: TypZgody) =>
    (data.historia ?? []).some(
      (h) => h.consentType === t || (t === "image_publish" && h.consentType === "image"),
    );
  return TYPY_ZGOD.filter((t) => zakres.includes(t) || data.stan?.[t] || wHistorii(t));
}
```

(Alias `image` → `image_publish` na wszelki wypadek: `normalizujWpisy` w storage
już go mapuje, ale kopia bazy sprzed rozbicia wizerunku przyniesie stare wiersze.)

---

## Usterka 2 — wycofanie z recepcji NIE dociera do aplikacji klientki

**Objaw (słowa właściciela):** „w sytuacji, gdy wyłączę zgodę na używanie
publikacji zdjęć w galerii w panelu BookSero.com, to w aplikacji nadal ten
checkbox jest załączony". I decyzja właściciela: **„Skoro klientka była na
recepcji i kazała wyłączyć zgodę, to w jej aplikacji również powinna ta zgoda
przełączyć się na OFF".**

**To NIE jest usterka wyświetlania.** To wycofanie POŁOWICZNE — zgoda dalej
obowiązuje w drugiej lokalizacji, więc SMS-y/publikacja są nadal „dozwolone".
Przy kontroli to jest wycofanie pozorne.

**Przyczyna — asymetria zapisu.** Aplikacja i panel działają na innym zasięgu:

| | zapis | odczyt |
|---|---|---|
| aplikacja klientki (`/api/public/client/zgody`, routes.ts ~8251–8257) | pętla po **WSZYSTKICH kartotekach osoby w tenancie** (`deriveClientIds`) | suma logiczna z historii wszystkich kartotek |
| panel (`PATCH /api/salon/clients/:id/zgody`, routes.ts ~13653) | **jedna kartoteka** (`klient.id`) | jedna kartoteka |

Właściciel ma jedną osobę z kartoteką w Żorach i w Pniówku. Recepcja wycofuje
w Żorach → wiersz w Pniówku zostaje otwarty → aplikacja (suma logiczna) dalej
pokazuje ON. Zachowanie aplikacji jest tu zgodne z decyzją zapisaną w kodzie
(routes.ts 8217–8222: klientka nie wie i nie ma powodu wiedzieć, że ma osobną
kartotekę w każdej lokalizacji — zgody obowiązują w całej firmie). Panel ma się
do tej samej zasady dostosować.

**Poprawka:**

1. `PATCH /api/salon/clients/:id/zgody` — zamiast `storage.ustawZgode(tenantId,
   klient.id, …)` ustawić zgodę na **wszystkich kartotekach tej samej osoby
   w tym tenancie**. Regułę „ta sama osoba" wziąć DOKŁADNIE tę, której używa
   `deriveClientIds` (routes.ts ~7856), żeby oba światy liczyły tak samo:
   telefon przez `storage.getActiveClientsByPhone` + `globalClientId` przez
   `storage.getActiveClientsByGlobalIds`. Warto wyciągnąć to do jednej funkcji
   pomocniczej i wołać z obu miejsc — dwie kopie tej reguły rozjadą się przy
   pierwszej zmianie.
2. `zrodlo` zostaje `"reception"`, wpis do `logZdarzenie` **jeden** (nie po
   jednym na kartotekę), z `details.kartotek = n` — tak jak robi to endpoint
   aplikacji.
3. `GET /api/salon/clients/:id/zgody` — `stan`, `historia`, `zakres`
   i `brakujace` liczyć z tego samego zbioru kartotek. Inaczej karta i aplikacja
   dalej będą mogły pokazywać co innego (dane sprzed tej poprawki są już
   rozjechane i sam zapis ich nie naprawi, dopóki ktoś nie kliknie).
   `zakres` = suma lokalizacji, w których osoba ma kartotekę — tak liczy
   aplikacja (routes.ts 8235–8236).

**Uwaga na testy — do zmiany W TYM SAMYM commicie:**
`server/zgody-karta-klienta.test.ts` asercjuje literalnie
`storage.ustawZgode(tenantId, klient.id, typ, udzielona, "reception")`.
Po poprawce ta asercja przestanie mieć sens — zastąpić ją asercją na pętlę po
kartotekach i na to, że źródło dalej brzmi `"reception"`. Zostawienie starego
testu zielonego byłoby dowodem, że poprawki nie ma.

---

## Definicja ukończenia (do odklikania)

1. Karta klientki → wyłącz zgodę na publikację zdjęć (poza zakresem
   lokalizacji) → **przełącznik zostaje na karcie** z podpisem „wycofana
   {data}" → włącz z powrotem → zapisuje się, podpis wraca na „udzielona".
2. Osoba z kartoteką w dwóch lokalizacjach: wycofaj zgodę na karcie w Żorach →
   otwórz kartę tej samej osoby w Pniówku → też OFF.
3. Ta sama osoba, aplikacja BookSero (Profil → ZGODY, wejść na ekran od nowa —
   stan nie jest cache'owany) → OFF.
4. Odwrotny kierunek nadal działa: wyłączenie w aplikacji → OFF na obu kartach
   (to działa dziś i ma nie zostać zepsute).
5. Rejestr zdarzeń: jeden wpis `rodo.zgoda_wycofana`, `zrodlo: "reception"`,
   `kartotek: 2`.
