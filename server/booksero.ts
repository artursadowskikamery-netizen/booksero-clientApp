// Serwerowy klient publicznego API Booksero. Bazowy URL z env (Replit) — sekret
// BOOKSERO_API_BASE nadpisuje domyślny. Domyślny wskazuje panel (ten sam serwer
// obsługuje /api/public/*). Potwierdzenie: <base>/api/public/plans zwraca JSON.
const BASE = process.env.BOOKSERO_API_BASE || "https://panel.booksero.com";
// Jedna linia przy starcie: jaki adres API obowiązuje i skąd pochodzi.
console.log(
  `[booksero] API base: ${BASE} ${process.env.BOOKSERO_API_BASE ? "(z sekretu BOOKSERO_API_BASE)" : "(domyślny)"}`,
);

export interface UpstreamResult {
  status: number;
  ok: boolean;
  data: unknown;
}

async function bookseroFetch(
  path: string,
  init: RequestInit,
  locale?: string,
  extraHeaders?: Record<string, string>,
): Promise<UpstreamResult> {
  let res: Response | null = null;
  // Czkawka DNS na Replicie (EAI_AGAIN) bywa chwilowa — 3 próby z odstępem
  // zanim oddamy błąd. Widziane na produkcji 2026-07-28 (logi getaddrinfo).
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      res = await fetch(`${BASE}${path}`, {
        ...init,
        headers: {
          Accept: "application/json",
          ...(locale ? { "X-Locale": locale } : {}),
          ...(extraHeaders || {}),
          ...(init.headers || {}),
        },
      });
      break;
    } catch (e) {
      // Diagnostyka "fetch failed": JEDNA czytelna linia w logach z pełnym
      // adresem celu (widać od razu zły BOOKSERO_API_BASE) + numer próby.
      const cause = (e as { cause?: { code?: string } }).cause?.code || (e as Error).message;
      console.error(`[booksero] fetch failed (próba ${attempt}/3) → ${BASE}${path}: ${cause}`);
      if (attempt === 3) {
        return { status: 502, ok: false, data: { message: "Brak połączenia z Booksero. Spróbuj za chwilę." } };
      }
      await new Promise((r) => setTimeout(r, attempt * 400));
    }
  }
  if (!res) {
    return { status: 502, ok: false, data: { message: "Brak połączenia z Booksero. Spróbuj za chwilę." } };
  }
  const text = await res.text();
  let data: unknown = null;
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = { message: "Nieprawidłowa odpowiedź z Booksero" };
    }
  }
  return { status: res.status, ok: res.ok, data };
}

export function bookseroGet(path: string, locale?: string, extraHeaders?: Record<string, string>) {
  return bookseroFetch(path, { method: "GET" }, locale, extraHeaders);
}

export function bookseroPost(
  path: string,
  body: unknown,
  locale?: string,
  extraHeaders?: Record<string, string>,
) {
  return bookseroFetch(
    path,
    { method: "POST", body: JSON.stringify(body), headers: { "Content-Type": "application/json" } },
    locale,
    extraHeaders,
  );
}

export function bookseroPatch(
  path: string,
  body: unknown,
  locale?: string,
  extraHeaders?: Record<string, string>,
) {
  return bookseroFetch(
    path,
    { method: "PATCH", body: JSON.stringify(body), headers: { "Content-Type": "application/json" } },
    locale,
    extraHeaders,
  );
}

export function bookseroDelete(path: string, locale?: string, extraHeaders?: Record<string, string>) {
  return bookseroFetch(path, { method: "DELETE" }, locale, extraHeaders);
}

export { BASE as BOOKSERO_BASE };
