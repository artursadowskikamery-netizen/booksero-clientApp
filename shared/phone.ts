// SPEC-telefony-e164: JEDYNE źródło prawdy dla formatu telefonu klienta.
// Każdy zapis numeru klienta przechodzi przez canonicalPhone, każde dopasowanie
// przez phoneDigits/phonesMatch — front i serwer używają TEGO SAMEGO modułu.
// Zakaz lokalnych normalizacji telefonu poza tym plikiem (jak matryca uprawnień).
import { parsePhoneNumberFromString, getCountries, getCountryCallingCode } from "libphonenumber-js";
import type { CountryCode } from "libphonenumber-js";

export type { CountryCode };

/** Kraje znane bibliotece — do selecta kraju przy polu telefonu. */
export function phoneCountries(): CountryCode[] {
  return getCountries();
}

/** Prefiks kierunkowy kraju, np. "48" dla PL. */
export function countryCallingCode(country: CountryCode): string {
  return getCountryCallingCode(country);
}

/** Flaga emoji z kodu ISO kraju (regional indicators) — bez żadnych assetów. */
export function countryFlagEmoji(country: string): string {
  const cc = country.toUpperCase();
  if (!/^[A-Z]{2}$/.test(cc)) return "🏳️";
  return String.fromCodePoint(...[...cc].map((c) => 0x1f1e6 + c.charCodeAt(0) - 65));
}

function isCountryCode(v: string | undefined | null): v is CountryCode {
  return !!v && (getCountries() as string[]).includes(v.toUpperCase());
}

/** Kraj lokalizacji (salons.country) → CountryCode; śmieć/legacy → PL. */
export function asCountryCode(v: string | undefined | null): CountryCode {
  return isCountryCode(v) ? (v!.toUpperCase() as CountryCode) : ("PL" as CountryCode);
}

/**
 * Kanonizacja do E.164 ("+48606123456") — zasada bezwzględna ze SPEC.
 * Drabinka (długość/format krajowy rozstrzyga PRZED interpretacją prefiksu,
 * żeby np. 9-cyfrowy stacjonarny z Radomia "48 612 34 56" nie stał się "+48…"
 * z odciętą końcówką):
 *   1. "+…"  → parsuj jak jest,
 *   2. "00…" → zamień 00 na "+", parsuj,
 *   3. gołe cyfry → NAJPIERW jako numer krajowy kraju domyślnego (lokalizacji),
 *   4. dopiero potem jako numer z wpisanym kierunkowym bez plusa ("48606…", "44…").
 * Nie da się jednoznacznie → null (odrzut/raport — NIGDY zapis śmiecia).
 */
export function canonicalPhone(raw: string | null | undefined, defaultCountry?: string | null): string | null {
  const input = String(raw ?? "").trim();
  if (!input) return null;
  const country = asCountryCode(defaultCountry);
  // Zostawiamy tylko cyfry i wiodący "+" (spacje, myślniki, nawiasy, kropki precz).
  const cleaned = (input.startsWith("+") ? "+" : "") + input.replace(/\D/g, "");
  if (cleaned === "+" || cleaned === "") return null;

  const tryParse = (v: string, c?: CountryCode): string | null => {
    const p = parsePhoneNumberFromString(v, c);
    return p && p.isValid() ? p.number : null;
  };

  if (cleaned.startsWith("+")) return tryParse(cleaned);
  if (cleaned.startsWith("00")) return tryParse("+" + cleaned.slice(2));
  // Gołe cyfry: format krajowy kraju lokalizacji ma pierwszeństwo…
  const asNational = tryParse(cleaned, country);
  if (asNational) return asNational;
  // …a dopiero potem próba "to już jest numer z kierunkowym, tylko bez plusa".
  return tryParse("+" + cleaned);
}

/** Same cyfry — wspólny mianownik do porównań (legacy w bazie bywa bez "+"). */
export function phoneDigits(phone: string | null | undefined): string {
  return String(phone ?? "").replace(/\D/g, "");
}

/**
 * Czy dwa zapisy telefonu to ten sam numer.
 * Równość pełnych cyfr LUB dopasowanie końcówkowe dla legacy bez kierunkowego:
 * krótszy jest końcówką dłuższego, krótszy ma ≥ 8 cyfr (bezpiecznik krajów
 * 8-cyfrowych — Norwegia/Dania), różnica długości ≤ 4 (sensowny kierunkowy).
 * Uwaga: dwa RÓŻNE numery tej samej długości nigdy nie są swoimi końcówkami,
 * więc reguła nie skleja np. 506123456 z 606123456.
 */
export function phonesMatch(a: string | null | undefined, b: string | null | undefined): boolean {
  const da = phoneDigits(a);
  const db = phoneDigits(b);
  if (!da || !db) return false;
  if (da === db) return true;
  const [shorter, longer] = da.length <= db.length ? [da, db] : [db, da];
  if (shorter.length < 8) return false;
  if (longer.length - shorter.length > 4) return false;
  return longer.endsWith(shorter);
}
