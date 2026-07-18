// Sesja klienta (Bearer token z Booksero po weryfikacji kodu SMS).
const KEY = "booksero_client_token";

export function getToken(): string | null {
  try {
    return localStorage.getItem(KEY);
  } catch {
    return null;
  }
}

export function setToken(token: string) {
  try {
    localStorage.setItem(KEY, token);
  } catch { /* brak localStorage */ }
}

export function clearToken() {
  try {
    localStorage.removeItem(KEY);
  } catch { /* brak localStorage */ }
}

export function isLoggedIn(): boolean {
  return !!getToken();
}
