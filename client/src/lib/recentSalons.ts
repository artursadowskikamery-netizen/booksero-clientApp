// Ostatnio odwiedzane salony — skrót na ekranie startowym, żeby powracający
// klient nie musiał ponownie skanować QR ani wpisywać kodu. Zapis lokalny na
// urządzeniu (bez danych osobowych): id, nazwa, miasto, logo, czas wizyty.
// Klient bywa w kilku sieciach naraz — stąd LISTA, nie jeden salon.
export interface RecentSalon {
  id: string;
  name: string;
  city?: string | null;
  logo?: string | null;
  at: number; // ostatnia wizyta (ms) — sortowanie i porządek listy
}

const KEY = "booksero_recent_salons";
const MAX = 5;
// Logo bywa osadzone jako data: URI (dziesiątki kB) — nie zapychamy nim
// pamięci przeglądarki; większe pomijamy i pokazujemy inicjały.
const LOGO_MAX = 60_000;

export function loadRecentSalons(): RecentSalon[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw);
    if (!Array.isArray(arr)) return [];
    return arr
      .filter((x): x is RecentSalon => !!x && typeof x.id === "string" && typeof x.name === "string")
      .sort((a, b) => (b.at || 0) - (a.at || 0))
      .slice(0, MAX);
  } catch {
    return []; // uszkodzony wpis / brak localStorage — po prostu brak historii
  }
}

export function saveRecentSalon(s: Omit<RecentSalon, "at">): void {
  if (!s.id || !s.name) return;
  try {
    const logo = s.logo && s.logo.length <= LOGO_MAX ? s.logo : null;
    const entry: RecentSalon = { id: s.id, name: s.name, city: s.city ?? null, logo, at: Date.now() };
    const rest = loadRecentSalons().filter((x) => x.id !== s.id);
    localStorage.setItem(KEY, JSON.stringify([entry, ...rest].slice(0, MAX)));
  } catch {
    /* pełna pamięć / tryb prywatny — historia to wygoda, nie wymóg */
  }
}

export function removeRecentSalon(id: string): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(loadRecentSalons().filter((x) => x.id !== id)));
  } catch {
    /* jw. */
  }
}
