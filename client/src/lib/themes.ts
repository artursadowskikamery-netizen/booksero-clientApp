// Motywy aplikacji = SZABLONY WIZYTÓWKI Booksero (identyczne palety,
// źródło: booksero client/src/lib/wizytowka-templates.ts). Salon wybiera
// szablon w panelu (Profil → „Szablon wizytówki"), publiczne API zwraca go
// w profile.theme — apka maluje się tak samo jak wizytówka. Zero backendu.

export interface AppTheme {
  dark: boolean;
  vars: Record<string, string>;
}

const t = (dark: boolean, vars: Record<string, string>): AppTheme => ({ dark, vars });

export const APP_THEMES: Record<string, AppTheme> = {
  classic: t(false, {
    "--bg": "#ffffff", "--surface": "#ffffff", "--surface-2": "#f1f5f9",
    "--ink": "#0f172a", "--ink-2": "#475569", "--muted": "#64748b", "--line": "#e2e8f0",
    "--brand": "#2563eb", "--brand-contrast": "#ffffff",
  }),
  minimal: t(false, {
    "--bg": "#ffffff", "--surface": "#ffffff", "--surface-2": "#f7f7f7",
    "--ink": "#171717", "--ink-2": "#4a4a4a", "--muted": "#737373", "--line": "#e5e5e5",
    "--brand": "#171717", "--brand-contrast": "#ffffff",
  }),
  vivid: t(false, {
    "--bg": "#ffffff", "--surface": "#ffffff", "--surface-2": "#f5f0ff",
    "--ink": "#1e1b2e", "--ink-2": "#4c4570", "--muted": "#7a7397", "--line": "#e6e0f5",
    "--brand": "#7c3aed", "--brand-contrast": "#ffffff",
  }),
  botanic: t(false, {
    "--bg": "#f4f8f3", "--surface": "#ffffff", "--surface-2": "#e8f0e6",
    "--ink": "#19301f", "--ink-2": "#3e5747", "--muted": "#6b7f70", "--line": "#d9e2d6",
    "--brand": "#2f5d3a", "--brand-contrast": "#ffffff",
  }),
  blush: t(false, {
    "--bg": "#fdf7f9", "--surface": "#ffffff", "--surface-2": "#f6e6eb",
    "--ink": "#33141f", "--ink-2": "#6b3c4e", "--muted": "#97687a", "--line": "#ebd3da",
    "--brand": "#c2306b", "--brand-contrast": "#ffffff",
  }),
  warm: t(false, {
    "--bg": "#f9f3ea", "--surface": "#ffffff", "--surface-2": "#efe6d8",
    "--ink": "#322218", "--ink-2": "#64503f", "--muted": "#8c7862", "--line": "#e0d4bf",
    "--brand": "#8a5a33", "--brand-contrast": "#ffffff",
  }),
  ocean: t(false, {
    "--bg": "#f3f8fb", "--surface": "#ffffff", "--surface-2": "#e3eef5",
    "--ink": "#0f2a3a", "--ink-2": "#3c5a6e", "--muted": "#6d8494", "--line": "#cfe0eb",
    "--brand": "#075985", "--brand-contrast": "#ffffff",
  }),
  noir: t(true, {
    "--bg": "#121212", "--surface": "#1a1a1a", "--surface-2": "#212121",
    "--ink": "#f2f2f2", "--ink-2": "#bdbdbd", "--muted": "#8c8c8c", "--line": "#2b2b2b",
    "--brand": "#f5f5f5", "--brand-contrast": "#141414",
  }),
  gold: t(true, {
    "--bg": "#0f0f0f", "--surface": "#191614", "--surface-2": "#242019",
    "--ink": "#f1ede4", "--ink-2": "#c4bba9", "--muted": "#948d80", "--line": "#2e2921",
    "--brand": "#c9a24b", "--brand-contrast": "#141414",
  }),
  editorial: t(false, {
    "--bg": "#faf7f1", "--surface": "#faf7f1", "--surface-2": "#f0ebe0",
    "--ink": "#232019", "--ink-2": "#57524a", "--muted": "#7e786c", "--line": "#d9d2c2",
    "--brand": "#232019", "--brand-contrast": "#faf7f2",
  }),
};

const KEY = "booksero_theme";
const TOKEN_VARS = ["--bg", "--surface", "--surface-2", "--ink", "--ink-2", "--muted", "--line", "--brand", "--brand-contrast"];

// Nakłada motyw salonu; brak/nieznany = domyślna szata BookSero (ciemna, #0071e3).
export function applySalonTheme(id?: string | null) {
  const root = document.documentElement;
  TOKEN_VARS.forEach((v) => root.style.removeProperty(v));
  const theme = id ? APP_THEMES[id] : undefined;
  if (!theme) {
    root.classList.add("dark");
    return;
  }
  root.classList.toggle("dark", theme.dark);
  Object.entries(theme.vars).forEach(([k, v]) => root.style.setProperty(k, v));
}

export function saveTheme(id?: string | null) {
  try {
    if (id && APP_THEMES[id]) localStorage.setItem(KEY, id);
    else localStorage.removeItem(KEY);
  } catch { /* brak localStorage */ }
}

export function loadTheme(): string | null {
  try {
    return localStorage.getItem(KEY);
  } catch {
    return null;
  }
}
