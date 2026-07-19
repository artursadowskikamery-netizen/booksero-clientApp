// Serwerowy klient publicznego API Booksero. Bazowy URL z env (Replit) — sekret
// BOOKSERO_API_BASE nadpisuje domyślny. Domyślny wskazuje panel (ten sam serwer
// obsługuje /api/public/*). Potwierdzenie: <base>/api/public/plans zwraca JSON.
const BASE = process.env.BOOKSERO_API_BASE || "https://panel.booksero.com";

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
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    headers: {
      Accept: "application/json",
      ...(locale ? { "X-Locale": locale } : {}),
      ...(extraHeaders || {}),
      ...(init.headers || {}),
    },
  });
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
