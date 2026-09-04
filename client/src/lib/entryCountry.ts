// Kraj dla HASŁA SALONU. Hasło jest unikalne w obrębie kraju (dwie obce firmy
// „BBeauty" — Koszalin i Rzym — nie kolidują), więc aplikacja musi powiedzieć
// panelowi, o który kraj pyta. Domyślnie z ustawień telefonu; wybór klientki
// zapamiętujemy, żeby nie pytać drugi raz.
import { asCountryCode, phoneCountries } from "@shared/phone";

const KEY = "booksero_entry_country";

// Język → najbardziej prawdopodobny kraj, gdy telefon nie podaje regionu
// (np. „pl" zamiast „pl-PL"). Tylko dla 16 języków aplikacji.
const LANG_TO_COUNTRY: Record<string, string> = {
  pl: "PL", en: "GB", de: "DE", nl: "NL", cs: "CZ", sv: "SE", es: "ES", fr: "FR",
  it: "IT", hr: "HR", el: "GR", tr: "TR", bg: "BG", fi: "FI", no: "NO", nb: "NO", nn: "NO", uk: "UA",
};

function fromDevice(): string {
  const langs = typeof navigator !== "undefined" ? [navigator.language, ...(navigator.languages || [])] : [];
  for (const l of langs) {
    const region = (l || "").split(/[-_]/)[1];
    if (region && region.length === 2) return region.toUpperCase();
  }
  const base = (langs[0] || "pl").slice(0, 2).toLowerCase();
  return LANG_TO_COUNTRY[base] || "PL";
}

export function loadEntryCountry(): string {
  try {
    const saved = localStorage.getItem(KEY);
    if (saved) return asCountryCode(saved);
  } catch { /* brak localStorage */ }
  return asCountryCode(fromDevice());
}

export function saveEntryCountry(c: string) {
  try {
    localStorage.setItem(KEY, asCountryCode(c));
  } catch { /* brak localStorage */ }
}

export const ENTRY_COUNTRIES: string[] = phoneCountries();
