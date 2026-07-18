// Sesja klienta (Bearer token z Booksero po weryfikacji kodu SMS).
// Token jest per-tenant — zapamiętujemy też tenantId, żeby wiedzieć,
// czy sesja pasuje do aktualnie oglądanego salonu.
const KEY = "booksero_client_token";
const TENANT_KEY = "booksero_client_tenant";

export function getToken(): string | null {
  try {
    return localStorage.getItem(KEY);
  } catch {
    return null;
  }
}

export function setToken(token: string, tenantId?: string | null) {
  try {
    localStorage.setItem(KEY, token);
    if (tenantId) localStorage.setItem(TENANT_KEY, tenantId);
    else localStorage.removeItem(TENANT_KEY);
  } catch { /* brak localStorage */ }
}

export function getAuthTenant(): string | null {
  try {
    return localStorage.getItem(TENANT_KEY);
  } catch {
    return null;
  }
}

export function clearToken() {
  try {
    localStorage.removeItem(KEY);
    localStorage.removeItem(TENANT_KEY);
  } catch { /* brak localStorage */ }
}

export function isLoggedIn(): boolean {
  return !!getToken();
}

// Czy sesja pasuje do tenanta salonu. Starsze sesje bez zapisanego tenanta
// przepuszczamy — pierwszy 401 z /me i tak wyczyści token.
export function isLoggedInFor(tenantId: string | null | undefined): boolean {
  if (!getToken()) return false;
  if (!tenantId) return true;
  const saved = getAuthTenant();
  return !saved || saved === tenantId;
}
