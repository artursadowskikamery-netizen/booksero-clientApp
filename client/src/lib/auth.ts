// Sesja klienta (Bearer token z Booksero po weryfikacji kodu SMS).
// Token jest per-tenant — zapamiętujemy też tenantId, żeby wiedzieć,
// czy sesja pasuje do aktualnie oglądanego salonu.
//
// WIELE FIRM NARAZ (decyzja właściciela 2026-09-05): klientka bywa w dwóch
// niezależnych firmach. Wejście numerem telefonu daje bilet ważny dla każdej
// z nich, więc aplikacja trzyma sesję do KAŻDEJ firmy, w której weszła, a
// „aktywna" jest ta, której salon klientka właśnie ogląda. Przełączenie
// odbywa się samo przy wejściu w salon drugiej firmy — bez wylogowania, bez
// drugiego SMS-a. Wylogowanie kończy WSZYSTKIE sesje: na cudzym telefonie
// nie może zostać żadna.
import { queryClient } from "./queryClient";

const KEY = "booksero_client_token";
const TENANT_KEY = "booksero_client_tenant";
const SESSIONS_KEY = "booksero_client_sessions";

type Sesja = { token: string; name?: string | null };

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

function readSessions(): Record<string, Sesja> {
  try {
    const o = JSON.parse(localStorage.getItem(SESSIONS_KEY) || "{}");
    return o && typeof o === "object" && !Array.isArray(o) ? (o as Record<string, Sesja>) : {};
  } catch {
    return {};
  }
}

function writeSessions(m: Record<string, Sesja>) {
  try {
    localStorage.setItem(SESSIONS_KEY, JSON.stringify(m));
  } catch { /* brak localStorage */ }
}

export function getToken(): string | null {
  try {
    return localStorage.getItem(KEY);
  } catch {
    return null;
  }
}

// Ustawia sesję AKTYWNĄ (i dopisuje ją do sesji wszystkich firm).
export function setToken(token: string, tenantId?: string | null, tenantName?: string | null) {
  const prev = getToken();
  try {
    localStorage.setItem(KEY, token);
    if (tenantId) localStorage.setItem(TENANT_KEY, tenantId);
    else localStorage.removeItem(TENANT_KEY);
  } catch { /* brak localStorage */ }
  if (tenantId) rememberSession(tenantId, token, tenantName);
  // Zmiana tożsamości (inny klient LUB przeskok do innej sieci) — pamięć
  // podręczna trzyma dane POPRZEDNIEGO konta (wizyty, punkty, powiadomienia).
  // Warunek prev && …: pierwsze logowanie nie ma czego czyścić, a zapytania
  // konta i tak nie mogły się wykonać bez tokenu.
  if (prev && prev !== token) forgetAccountData();
}

// Dopisuje sesję do firmy BEZ przełączania aktywnej — dla firm, do których
// klientka weszła „przy okazji" (ten sam bilet z SMS-a).
export function rememberSession(tenantId: string, token: string, tenantName?: string | null) {
  const m = readSessions();
  m[tenantId] = { token, name: tenantName ?? m[tenantId]?.name ?? null };
  writeSessions(m);
}

export function hasSessionFor(tenantId: string | null | undefined): boolean {
  return !!tenantId && !!readSessions()[tenantId]?.token;
}

// Firmy, w których klientka ma sesję na tym telefonie — do przełącznika
// „Twoje pozostałe firmy".
export function listSessions(): { tenantId: string; name: string | null }[] {
  return Object.entries(readSessions()).map(([tenantId, s]) => ({ tenantId, name: s.name ?? null }));
}

export function getAuthTenant(): string | null {
  try {
    return localStorage.getItem(TENANT_KEY);
  } catch {
    return null;
  }
}

// Wylogowanie = koniec WSZYSTKICH sesji na tym urządzeniu.
export function clearToken() {
  try {
    localStorage.removeItem(KEY);
    localStorage.removeItem(TENANT_KEY);
    localStorage.removeItem(SESSIONS_KEY);
  } catch { /* brak localStorage */ }
  // Wylogowanie musi zabrać ze sobą dane konta z pamięci podręcznej.
  forgetAccountData();
}

export function isLoggedIn(): boolean {
  return !!getToken();
}

// Czy sesja pasuje do tenanta salonu. Starsze sesje bez zapisanego tenanta
// przepuszczamy — pierwszy 401 z /me i tak wyczyści token.
//
// Gdy aktywna sesja jest INNEJ firmy, a do tej mamy sesję zapamiętaną —
// przełączamy ją tu, w miejscu pytania. Dzięki temu wejście w salon drugiej
// firmy (z „ostatnio odwiedzanych", z listy „Twoje pozostałe firmy", z QR)
// po prostu działa, bez ekranu logowania. Czyszczenie pamięci podręcznej
// konta idzie asynchronicznie: to pytanie pada w trakcie renderowania,
// a usuwanie zapytań w tym momencie mogłoby zaburzyć rysowanie ekranu.
export function isLoggedInFor(tenantId: string | null | undefined): boolean {
  if (!tenantId) return !!getToken();
  const saved = getAuthTenant();
  const active = getToken();
  if (active && (!saved || saved === tenantId)) return true;
  const other = readSessions()[tenantId]?.token;
  if (!other) return false;
  try {
    localStorage.setItem(KEY, other);
    localStorage.setItem(TENANT_KEY, tenantId);
  } catch { /* brak localStorage */ }
  if (active && active !== other) setTimeout(forgetAccountData, 0);
  return true;
}
