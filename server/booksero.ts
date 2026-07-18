// Serwerowy klient publicznego API Booksero. Bazowy URL z env (Replit),
// żeby nie zaszywać domeny w kodzie. TODO: potwierdzić produkcyjny URL Booksero.
const BASE = process.env.BOOKSERO_API_BASE || "https://app.booksero.com";

export interface UpstreamResult {
  status: number;
  ok: boolean;
  data: unknown;
}

async function bookseroFetch(
  path: string,
  init: RequestInit,
  locale?: string,
): Promise<UpstreamResult> {
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    headers: {
      Accept: "application/json",
      ...(locale ? { "X-Locale": locale } : {}),
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

export function bookseroGet(path: string, locale?: string) {
  return bookseroFetch(path, { method: "GET" }, locale);
}

export function bookseroPost(path: string, body: unknown, locale?: string) {
  return bookseroFetch(
    path,
    { method: "POST", body: JSON.stringify(body), headers: { "Content-Type": "application/json" } },
    locale,
  );
}

export { BASE as BOOKSERO_BASE };
