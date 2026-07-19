import i18n from "./i18n";
import { getToken } from "./auth";
import type {
  Tenant, SalonPublic, Category, Service, StaffMember, TeamMember, Review, Slot,
  BookingRequest, BookingResult, ClientMe, ClientAppointment, LoyaltyState, ReferralsState,
  ClientCodesState,
} from "@shared/types";

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = "ApiError";
  }
}

async function req<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, {
    ...init,
    headers: {
      Accept: "application/json",
      "X-Locale": (i18n.language || "pl").slice(0, 2),
      ...(getToken() ? { Authorization: `Bearer ${getToken()}` } : {}),
      ...(init?.body ? { "Content-Type": "application/json" } : {}),
      ...(init?.headers || {}),
    },
    credentials: "include",
  });
  if (!res.ok) {
    let message = `HTTP ${res.status}`;
    try {
      const j = await res.json();
      message = (j && (j.message as string)) || message;
    } catch {
      /* body nie-JSON */
    }
    throw new ApiError(res.status, message);
  }
  return (await res.json()) as T;
}

// Klient BFF: wołamy nasz serwer (/api/*), on proxuje do publicznego API Booksero.
export const api = {
  resolveSlug: (slug: string) =>
    req<{ salonId: string }>(`/api/resolve/${encodeURIComponent(slug)}`),
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
