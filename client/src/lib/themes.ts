// Szata aplikacji: ZAWSZE ciemna BookSero + kolor AKCENTU per salon
// (decyzja właściciela). Akcent pochodzi z pola profilu salonu w Booksero
// (SPEC-akcent-aplikacji: profile.appAccent, wybór z gotowej palety w panelu).
// Brak pola = domyślny niebieski #0A84FF (wariant dark #0071e3).

const KEY = "booksero_accent";
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

// Czarny lub biały tekst guzika — zależnie od jasności akcentu
// (złoty/srebrny → ciemny tekst; niebieski/zielony → biały).
function bestContrast(hex: string): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const luminance = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  return luminance > 160 ? "#111111" : "#FFFFFF";
}
