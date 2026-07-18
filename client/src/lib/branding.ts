import type { TenantBranding } from "@shared/types";

// Szata per tenant: motyw (jasny/ciemny) + kolor akcentu. Brak konfiguracji =
// domyślna szata BookSero (ciemna, #0071e3). Zapamiętywana lokalnie, żeby
// przetrwała przejścia między ekranami i ponowne otwarcie apki.

const KEY = "booksero_branding";
const HEX_RE = /^#[0-9a-f]{6}$/i;

export function applyBranding(b?: TenantBranding | null) {
  const root = document.documentElement;

  // Motyw: dark = domyślny; light zdejmuje klasę .dark.
  const theme = b?.theme === "light" ? "light" : "dark";
  root.classList.toggle("dark", theme === "dark");

  // Akcent: inline style na :root wygrywa z tokenami z klasy.
  if (b?.accentColor && HEX_RE.test(b.accentColor)) {
    root.style.setProperty("--brand", b.accentColor);
    root.style.setProperty("--brand-contrast", bestContrast(b.accentColor));
  } else {
    root.style.removeProperty("--brand");
    root.style.removeProperty("--brand-contrast");
  }
}

export function saveBranding(b?: TenantBranding | null) {
  try {
    if (b && (b.theme || b.accentColor)) localStorage.setItem(KEY, JSON.stringify(b));
    else localStorage.removeItem(KEY);
  } catch { /* brak localStorage */ }
}

export function loadBranding(): TenantBranding | null {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as TenantBranding) : null;
  } catch {
    return null;
  }
}

// Biały lub czarny tekst na przycisku — zależnie od jasności akcentu
// (żeby np. złoty akcent nie miał nieczytelnego białego tekstu).
function bestContrast(hex: string): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const luminance = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  return luminance > 160 ? "#111111" : "#FFFFFF";
}
