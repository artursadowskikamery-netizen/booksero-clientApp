import i18n from "./i18n";
import { getToken } from "./auth";
import type {
  Tenant, SalonPublic, Category, Service, StaffMember, TeamMember, Review, Slot,
  BookingRequest, BookingResult, ClientMe, ClientAppointment, LoyaltyState, ReferralsState,
  ClientCodesState, ClientNotification, ConsentsState, ConsentType,
  EntryCapabilities, PasswordHit, FindResult, EntryMethod,
} from "@shared/types";

export class ApiError extends Error {
  // retryAfter: sekundy do odblokowania (limit prób) — do licznika w logowaniu.
  constructor(public status: number, message: string, public retryAfter?: number) {
    super(message);
    this.name = "ApiError";
  }
}

async function req<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, {
    ...init,
    headers: {
      Accept: "application/json",
      // resolvedLanguage, nie language: `language` niesie SUROWY kod z telefonu
      // (np. "da", "nb-NO"), więc serwer dostawał język, którego nie zna,
      // i odpowiadał własnym domyślnym — interfejs po angielsku, a SMS po
      // polsku. `resolvedLanguage` to język, w którym aplikacja NAPRAWDĘ mówi.
      "X-Locale": (i18n.resolvedLanguage || i18n.language || "pl").slice(0, 2),
      ...(getToken() ? { Authorization: `Bearer ${getToken()}` } : {}),
      ...(init?.body ? { "Content-Type": "application/json" } : {}),
      ...(init?.headers || {}),
    },
    credentials: "include",
  });
  if (!res.ok) {
    let message = `HTTP ${res.status}`;
    let retryAfter: number | undefined;
    try {
      const j = await res.json();
      message = (j && (j.message as string)) || message;
      if (j && typeof j.retryAfter === "number") retryAfter = j.retryAfter;
    } catch {
      /* body nie-JSON */
    }
    throw new ApiError(res.status, message, retryAfter);
  }
  return (await res.json()) as T;
}

// Klient BFF: wołamy nasz serwer (/api/*), on proxuje do publicznego API Booksero.
export const api = {
  resolveSlug: (slug: string) =>
    req<{ salonId: string }>(`/api/resolve/${encodeURIComponent(slug)}`),
  // Krótki kod polecenia → sieć + kod polecającego (SPEC-krotki-link-polecenia).
  resolveReferral: (code: string) =>
    req<{ tenantId: string; ref: string }>(`/api/r/${encodeURIComponent(code)}`),
  tenant: (tenantId: string) =>
    req<Tenant>(`/api/tenant/${encodeURIComponent(tenantId)}`),
  salon: (salonId: string) =>
    req<SalonPublic>(`/api/salon/${encodeURIComponent(salonId)}`),
  categories: (salonId: string) =>
    req<Category[]>(`/api/salon/${encodeURIComponent(salonId)}/categories`),
  services: (salonId: string) =>
    req<Service[]>(`/api/salon/${encodeURIComponent(salonId)}/services`),
  staff: (salonId: string, serviceId: string) =>
    req<StaffMember[]>(
      `/api/salon/${encodeURIComponent(salonId)}/staff?serviceId=${encodeURIComponent(serviceId)}`,
    ),
  team: (salonId: string) =>
    req<TeamMember[]>(`/api/salon/${encodeURIComponent(salonId)}/team`),
  reviews: (salonId: string) =>
    req<Review[]>(`/api/salon/${encodeURIComponent(salonId)}/reviews`),
  availability: (
    salonId: string,
    q: { staffId: string; serviceId: string; date: string; serviceId2?: string; staffId2?: string },
  ) => {
    const s = new URLSearchParams(
      Object.fromEntries(Object.entries(q).filter(([, v]) => v != null)) as Record<string, string>,
    );
    return req<Slot[]>(`/api/salon/${encodeURIComponent(salonId)}/availability?${s.toString()}`);
  },
  book: (salonId: string, body: BookingRequest) =>
    req<BookingResult>(`/api/salon/${encodeURIComponent(salonId)}/appointments`, {
      method: "POST",
      body: JSON.stringify(body),
    }),

  // ── Logowanie klienta (SMS) + self-service — SPEC-logowanie-klienta ──
  // salonId: kontekst dla auto-rejestracji nowego numeru (SPEC-auto-rejestracja).
  requestLoginCode: (tenantId: string, phone: string, salonId: string) =>
    req<{ ok: boolean }>(`/api/client-auth/request-code`, {
      method: "POST",
      body: JSON.stringify({ tenantId, phone, salonId }),
    }),
  verifyLoginCode: (
    tenantId: string,
    phone: string,
    code: string,
    salonId: string,
    name?: { firstName: string; lastName?: string },
    referralCode?: string | null,
  ) =>
    req<{ token: string; client: { name: string; phone: string } }>(`/api/client-auth/verify`, {
      method: "POST",
      body: JSON.stringify({
        tenantId, phone, code, salonId,
        ...(name ?? {}),
        ...(referralCode ? { referralCode } : {}),
      }),
    }),
  clientMe: () => req<ClientMe>(`/api/client/me`),
  clientAppointments: (scope: "upcoming" | "past" | "all" = "all") =>
    req<ClientAppointment[]>(`/api/client/appointments?scope=${scope}`),
  cancelVisit: (token: string) =>
    req<{ success?: boolean; message?: string }>(`/api/visit/${encodeURIComponent(token)}/cancel`, {
      method: "POST",
      body: JSON.stringify({}),
    }),
  // ── Powiadomienia push (Web Push) + sygnał instalacji ──
  pushVapidKey: () => req<{ key: string }>(`/api/client/push/vapid-key`),
  // ── Skrzynka powiadomień (SPEC-skrzynka-powiadomien) ──
  notifications: (limit = 30, before?: string) =>
    req<{ items: ClientNotification[] }>(
      `/api/client/notifications?limit=${limit}${before ? `&before=${encodeURIComponent(before)}` : ""}`,
    ),
  notificationsUnreadCount: () => req<{ count: number }>(`/api/client/notifications/unread-count`),
  notificationsRead: (body: { ids?: string[]; all?: boolean }) =>
    req<{ ok: boolean; updated: number; count: number }>(`/api/client/notifications/read`, {
      method: "POST",
      body: JSON.stringify(body),
    }),

  // ── Zgody klientki (SPEC-zgody-klientek) ──
  // PATCH zwraca PEŁNY, świeży stan — podmieniamy dane w miejscu, bez drugiego GET.
  zgody: () => req<ConsentsState>(`/api/client/zgody`),
  zgodaSet: (typ: ConsentType, udzielona: boolean) =>
    req<ConsentsState>(`/api/client/zgody`, {
      method: "PATCH",
      body: JSON.stringify({ typ, udzielona }),
    }),

  // Stan KONTA (nie urządzenia!) — źródło prawdy dla przełącznika w Profilu.
  pushStatus: () => req<{ enabled: boolean; devices: number }>(`/api/client/push/status`),
  pushEnable: () => req<{ ok?: boolean; enabled: boolean }>(`/api/client/push/enable`, { method: "POST" }),
  pushDisable: () =>
    req<{ ok?: boolean; enabled: boolean; invalidated?: number }>(`/api/client/push/disable`, { method: "POST" }),
  pushSubscribe: (body: {
    transport: "webpush";
    endpoint: string;
    keys: { p256dh: string; auth: string };
    platform: "android" | "ios" | "web";
  }) => req<{ ok?: boolean }>(`/api/client/push/subscribe`, { method: "POST", body: JSON.stringify(body) }),
  pushUnsubscribe: (endpoint: string) =>
    req<{ ok?: boolean }>(`/api/client/push/unsubscribe`, { method: "POST", body: JSON.stringify({ endpoint }) }),
  // `token`: sesja INNEJ firmy niż aktywna — zdarzenie instalacji stempluje
  // kartotekę w tej firmie, której token niesie; klientka z kartotekami
  // w kilku firmach ma dostać stempel w każdej.
  appEvent: (type: "install", platform: "android" | "ios" | "web", token?: string | null) =>
    req<{ ok?: boolean }>(`/api/client/app-event`, {
      method: "POST",
      body: JSON.stringify({ type, platform }),
      ...(token ? { headers: { Authorization: `Bearer ${token}` } } : {}),
    }),
  // Którędy klientka weszła do salonu — licznik dla właściciela w panelu
  // (zakładka aplikacji). Osobny punkt panelu, bez tokenu, bez danych
  // osobowych: tylko lokalizacja i metoda. Panel przyjmuje WYŁĄCZNIE salonId —
  // wejście na poziomie sieci (wybór lokalizacji dopiero za chwilę) zgłasza
  // ekran wyboru, gdy klientka tapnie salon. Ogień i zapomnij — błąd nic nie
  // psuje i nie ponawiamy (panel i tak odpowiada 200 przy limicie).
  entryEvent: (method: EntryMethod, ids: { salonId?: string; tenantId?: string }) =>
    ids.salonId
      ? req<{ ok?: boolean }>(`/api/app/entry`, {
          method: "POST",
          body: JSON.stringify({ salonId: ids.salonId, method }),
        }).catch(() => ({ ok: false }))
      : Promise.resolve({ ok: false }),

  // ── Wejście do salonu bez kodu QR ──
  entryCapabilities: () => req<EntryCapabilities>(`/api/app/entry-capabilities`),
  // Hasło salonu: dopasowanie DOKŁADNE po stronie panelu, w obrębie kraju.
  passwordLookup: (q: string, country: string) =>
    req<PasswordHit>(`/api/app/password?q=${encodeURIComponent(q)}&country=${encodeURIComponent(country)}`),
  // „Masz już u nas kartotekę?" — jeden SMS: lista firm z kartoteką + wejście.
  findRequest: (phone: string) =>
    req<{ ok: boolean; retryAfter?: number }>(`/api/client-auth/find/request`, {
      method: "POST",
      body: JSON.stringify({ phone }),
    }),
  findVerify: (phone: string, code: string) =>
    req<FindResult>(`/api/client-auth/find/verify`, { method: "POST", body: JSON.stringify({ phone, code }) }),
  findEnter: (ticket: string, tenantId: string, salonId: string) =>
    req<{ token: string; client?: { name: string; phone: string } }>(`/api/client-auth/find/enter`, {
      method: "POST",
      body: JSON.stringify({ ticket, tenantId, salonId }),
    }),

  // ── Moje kody (SPEC-bonusy-etap-B2) ──
  clientCodes: () => req<ClientCodesState>(`/api/client/codes`),
  addSavedCode: (code: string, note?: string) =>
    req<{ id: string }>(`/api/client/codes`, {
      method: "POST",
      body: JSON.stringify({ code, ...(note ? { note } : {}) }),
    }),
  toggleSavedCode: (id: string) =>
    req<{ success?: boolean }>(`/api/client/codes/${encodeURIComponent(id)}/use`, {
      method: "PATCH",
      body: JSON.stringify({}),
    }),
  deleteSavedCode: (id: string) =>
    req<{ success?: boolean }>(`/api/client/codes/${encodeURIComponent(id)}`, { method: "DELETE" }),

  // ── Polecenia SMS (SPEC-bonusy-etap-B) ──
  referrals: () => req<ReferralsState>(`/api/client/referrals`),
  sendReferral: (phone: string) =>
    req<{ ok: boolean; sent: number; remaining: number }>(`/api/client/referrals`, {
      method: "POST",
      body: JSON.stringify({ phone }),
    }),

  // ── Bonusy Etap A: program lojalnościowy (SPEC-bonusy-etap-A) ──
  loyalty: () => req<LoyaltyState>(`/api/client/loyalty`),
  loyaltyJoin: () =>
    req<LoyaltyState | { ok: boolean }>(`/api/client/loyalty/join`, { method: "POST", body: JSON.stringify({}) }),
  loyaltyClaim: (rewardId: string) =>
    req<{ id: string; status: string }>(`/api/client/loyalty/rewards/${encodeURIComponent(rewardId)}/claim`, {
      method: "POST",
      body: JSON.stringify({}),
    }),
  loyaltyCancelClaim: (claimId: string) =>
    req<{ success?: boolean }>(`/api/client/loyalty/claims/${encodeURIComponent(claimId)}/cancel`, {
      method: "POST",
      body: JSON.stringify({}),
    }),

  // Odwołanie własnej wizyty po id (zalogowany klient) — także wizyt z panelu.
  cancelMyVisit: (appointmentId: string) =>
    req<{ success?: boolean; message?: string }>(
      `/api/client/appointments/${encodeURIComponent(appointmentId)}/cancel`,
      { method: "POST", body: JSON.stringify({}) },
    ),
};
