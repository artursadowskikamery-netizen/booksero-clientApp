// Szata aplikacji: ZAWSZE ciemna BookSero + kolor AKCENTU per salon
// (decyzja właściciela). Akcent pochodzi z pola profilu salonu w Booksero
// (SPEC-akcent-aplikacji: profile.appAccent, wybór z gotowej palety w panelu).
// Brak pola = domyślny niebieski #0A84FF (wariant dark #0071e3).

const KEY = "booksero_accent";
// Pamięć koloru PER LOKALIZACJA i PER SIEĆ. Bez niej kolor znał wyłącznie ekran
// salonu — wejście w Rezerwuj / Wizyty / Bonusy / Profil świeciło domyślnym
// niebieskim BookSero, czyli aplikacja gubiła barwy lokalizacji zaraz po
// pierwszym kliknięciu w dolne menu.
const MAP = "booksero_accent_map";
const MAP_MAX = 40; // klientka odwiedza kilka lokalizacji; to jest zapora, nie limit
const HEX_RE = /^#[0-9a-f]{6}$/i;

// Gotowa paleta akcentów (te same wartości waliduje panel Booksero).
export const ACCENT_PALETTE: Record<string, string> = {
  blue: "#0A84FF", gold: "#C9A24B", rose: "#E0518D", violet: "#8B5CF6",
  green: "#4C9A66", teal: "#2AA6A0", orange: "#E8853D", red: "#E05252",
  sky: "#38A3DD", lime: "#9BBF3B", copper: "#C98A5B", silver: "#C7CCD1",
};

export function applyAccent(accent?: string | null) {
  const root = document.documentElement;
  root.classList.add("dark"); // apka jest zawsze ciemna

  const hex = normalizeAccent(accent);
  if (hex) {
    root.style.setProperty("--brand", hex);
    root.style.setProperty("--brand-contrast", bestContrast(hex));
  } else {
    root.style.removeProperty("--brand");
    root.style.removeProperty("--brand-contrast");
  }
}

// Przyjmuje nazwę z palety ("gold") albo hex "#RRGGBB".
function normalizeAccent(a?: string | null): string | null {
  if (!a) return null;
  if (ACCENT_PALETTE[a]) return ACCENT_PALETTE[a];
  return HEX_RE.test(a) ? a : null;
}

export function saveAccent(a?: string | null) {
  try {
    if (a) localStorage.setItem(KEY, a);
    else localStorage.removeItem(KEY);
  } catch { /* brak localStorage */ }
}

export function loadAccent(): string | null {
  try {
    return localStorage.getItem(KEY);
  } catch {
    return null;
  }
}

function czytajMape(): Record<string, string> {
  try {
    const o = JSON.parse(localStorage.getItem(MAP) || "{}");
    return o && typeof o === "object" && !Array.isArray(o) ? (o as Record<string, string>) : {};
  } catch {
    return {};
  }
}

// Zapamiętanie koloru pod kluczem lokalizacji ORAZ sieci. Dzięki wpisowi sieci
// lista salonów zachowuje barwy tej sieci, zamiast mrugać niebieskim w środku
// złotej ścieżki — i nie zapożycza koloru od innej firmy.
export function rememberAccent(
  gdzie: { salonId?: string | null; tenantId?: string | null },
  accent?: string | null,
) {
  const m = czytajMape();
  // Zapora rozrostu: przy przepełnieniu zaczynamy od czystej mapy, bo wpisy
  // nie mają znaczników czasu, a kolor i tak wraca przy najbliższym wejściu.
  const baza = Object.keys(m).length > MAP_MAX ? {} : m;
  const wpisz = (k: string) => {
    if (accent) baza[k] = accent;
    else delete baza[k];
  };
  if (gdzie.salonId) wpisz(`s:${gdzie.salonId}`);
  if (gdzie.tenantId) wpisz(`t:${gdzie.tenantId}`);
  try {
    localStorage.setItem(MAP, JSON.stringify(baza));
  } catch { /* brak localStorage */ }
}

export function accentForSalon(salonId?: string | null): string | null {
  return (salonId && czytajMape()[`s:${salonId}`]) || null;
}

export function accentForTenant(tenantId?: string | null): string | null {
  return (tenantId && czytajMape()[`t:${tenantId}`]) || null;
}

// Czarny lub biały tekst guzika — zależnie od jasności akcentu
// (złoty/srebrny → ciemny tekst; niebieski/zielony → biały).
function bestContrast(hex: string): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const luminance = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  return luminance > 160 ? "#111111" : "#FFFFFF";
}
