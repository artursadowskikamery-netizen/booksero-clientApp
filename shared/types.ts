// Kontrakt danych z publicznego API Booksero — zweryfikowany na
// booksero @ claude/hej-5yvvly. Szczegóły: docs/API-KONTRAKT.md.

// ── Tenant (hierarchia kraj → miasto → salon) ─────────────────────────────
// ZALEŻNOŚĆ: endpoint /api/public/tenant/:tenantId trzeba dodać w Booksero
// (ARCHITEKTURA §8.1). Kształt poniżej to nasz docelowy kontrakt.
export interface Tenant {
  id: string;
  name: string;
  logo?: string | null;
  countries: TenantCountry[];
}
export interface TenantCountry {
  country: string; // ISO 3166-1 alpha-2
  cities: TenantCity[];
}
export interface TenantCity {
  city: string;
  salons: TenantSalonRef[];
}
export interface TenantSalonRef {
  id: string; // salons.id (UUID) — przyjmuje je API rezerwacji
  name: string;
  address?: string | null;
}

// ── Publiczne dane salonu (GET /api/public/book/:salonId) ─────────────────
export interface SalonPublic {
  salon: {
    id: string;
    name: string;
    address?: string | null;
    city?: string | null;
    postalCode?: string | null;
    phone?: string | null;
    email?: string | null;
    openingHours?: unknown;
    logo?: string | null;
    currency: string; // waluta salonu (ceny usług ją dziedziczą)
    // Tenant salonu — potrzebny do logowania klienta w kontekście sieci
    // (SPEC-logowanie-klienta; pojawi się po wdrożeniu w Booksero).
    tenantId?: string | null;
  };
  profile: {
    description?: string | null;
    gallery?: string[] | null;
    coverImage?: string | null;
    mapUrl?: string | null;
    socialLinks?: unknown;
    theme?: string | null;
    // Kolor akcentu aplikacji BookSero (SPEC-akcent-aplikacji) — nazwa z palety
    // lub #RRGGBB. Brak = domyślny niebieski.
    appAccent?: string | null;
  } | null;
  settings: BookingSettings;
}

export interface BookingSettings {
  minAdvanceMinutes: number;
  maxAdvanceDays: number;
  slotIntervalMinutes: number;
  allowCancellation: boolean;
  cancellationDeadlineMinutes: number;
  requirePhone: boolean;
  requireEmail: boolean;
  welcomeMessage?: string | null;
  prepaymentEnabled: boolean;
  [k: string]: unknown; // pozostałe pola prepayment*
}

export interface Category {
  id: string;
  name: string;
  sortOrder: number;
}

export interface Service {
  id: string;
  name: string;
  description?: string | null;
  durationMinutes: number;
  price: string;
  categoryId?: string | null;
  prepaymentEnabled: boolean;
  prepaymentAmount: string;
}

export interface StaffMember {
  id: string;
  firstName: string;
  lastName?: string | null;
  displayName?: string | null;
  avatar?: string | null;
  bio?: string | null;
}
export type TeamMember = StaffMember;

// Booksero zwraca opinie zanonimizowane (imię + inicjał); kształt luźny.
export type Review = Record<string, unknown>;

// GET availability → tablica wolnych slotów (available zawsze true).
export interface Slot {
  time: string; // "HH:MM"
  available: boolean;
}

// POST appointments — body (zod onlineBookingSchema po stronie Booksero).
export interface BookingRequest {
  serviceId: string;
  staffId: string; // konkretne id albo "any" (tylko w trybie pary)
  date: string; // YYYY-MM-DD
  time: string; // HH:MM
  clientName: string;
  clientPhone?: string;
  clientEmail?: string;
  notes?: string;
  // Tryb pary (2 osoby jednocześnie):
  partySize?: number; // 1–2
  serviceId2?: string;
  staffId2?: string;
  secondClientName?: string;
}

// ── Logowanie klienta + self-service (SPEC-logowanie-klienta) ──
export interface ClientMe {
  name: string;
  phone: string;
  tenantId: string;
  salons: { id: string; name: string }[];
}

export interface ClientAppointment {
  id: string;
  bookingCode: string;
  startAt: string; // ISO
  endAt: string; // ISO
  status: string;
  serviceName: string;
  staffName: string;
  salonId: string;
  salonName: string;
  cancellationToken?: string | null; // tylko przyszłe booked/confirmed
}

// POST appointments → 201
export interface BookingResult {
  id: string;
  bookingCode: string;
  startAt: string; // ISO
  endAt: string; // ISO
  service: string;
  staffName: string; // faktycznie przydzielony pracownik (istotne przy "any")
  message: string;
  prepaymentRequired: boolean;
  prepaymentAmount?: string;
}
