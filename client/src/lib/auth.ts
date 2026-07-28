// Sesja klienta (Bearer token z Booksero po weryfikacji kodu SMS).
// Token jest per-tenant — zapamiętujemy też tenantId, żeby wiedzieć,
// czy sesja pasuje do aktualnie oglądanego salonu.
import { queryClient } from "./queryClient";

const KEY = "booksero_client_token";
const TENANT_KEY = "booksero_client_tenant";

// Dane należące do KONTA — te muszą zniknąć przy zmianie tożsamości. Publiczne
// dane salonu (salon/services/team/categories/staff/avail/tenant) zostają:
// są niezależne od tego, kto patrzy, a ich skasowanie zmuszałoby aplikację do
// pobrania wszystkiego od nowa (migotanie po zalogowaniu, ślepy zaułek offline).
const ACCOUNT_KEYS = ["clientMe", "me", "clientAppointments", "loyalty", "referrals", "clientCodes", "notifUnread"];

function forgetAccountData() {
  for (const k of ACCOUNT_KEYS) queryClient.removeQueries({ queryKey: [k] });
  // Plakietka na IKONIE aplikacji to też dana konta — musi zgasnąć razem
  // z resztą, inaczej po wylogowaniu na ikonie zostaje licznik poprzedniej
  // osoby. Wywołanie wprost (bez importu z ./push), żeby nie domykać cyklu
  // auth → push → api → auth.
  try {
    void (navigator as Navigator & { clearAppBadge?: () => Promise<void> }).clearAppBadge?.();
  } catch {
    /* brak wsparcia — trudno */
  }
}

export function getToken(): string | null {
  try {
    return localStorage.getItem(KEY);
  } catch {
    return null;
  }
}

export function setToken(token: string, tenantId?: string | null) {
  const prev = getToken();
  try {
    localStorage.setItem(KEY, token);
    if (tenantId) localStorage.setItem(TENANT_KEY, tenantId);
    else localStorage.removeItem(TENANT_KEY);
  } catch { /* brak localStorage */ }
  // Zmiana tożsamości (inny klient LUB przeskok do innej sieci) — pamięć
  // podręczna trzyma dane POPRZEDNIEGO konta (wizyty, punkty, powiadomienia).
  // Warunek prev && …: pierwsze logowanie nie ma czego czyścić, a zapytania
  // konta i tak nie mogły się wykonać bez tokenu.
  if (prev && prev !== token) forgetAccountData();
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
  // Wylogowanie musi zabrać ze sobą dane konta z pamięci podręcznej.
  forgetAccountData();
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
