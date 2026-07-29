// Godziny wizyt ZAWSZE w strefie czasowej LOKALIZACJI, nigdy wg zegara telefonu.
// Powód: klient z Polski oglądający wizytę w Londynie widział 12:00 zamiast 11:00,
// bo aplikacja formatowała surowy moment lokalnym zegarem. Serwer podaje strefę
// przy każdej wizycie (salonTimezone, IANA) — Intl sam ogarnia czas letni/zimowy,
// więc NIGDY nie dodajemy godzin ręcznie.
//
// Uwaga na DATĘ, nie tylko godzinę: wizyta o 00:15 leży w bazie jako moment,
// który w innej strefie wypada dnia poprzedniego — zły zegar przenosi ją na zły
// dzień. Dlatego dzień/miesiąc też formatujemy ze strefą.
const FALLBACK_TZ = "Europe/Warsaw";

// Nieznana/uszkodzona nazwa strefy nie może wywalić ekranu wizyt — Intl rzuca
// RangeError na nieprawidłowym timeZone, więc sprawdzamy raz i zapamiętujemy.
const okTz = new Map<string, boolean>();
function safeTz(tz?: string | null): string {
  const name = (tz || "").trim();
  if (!name) return FALLBACK_TZ;
  const cached = okTz.get(name);
  if (cached !== undefined) return cached ? name : FALLBACK_TZ;
  try {
    new Intl.DateTimeFormat("pl", { timeZone: name }).format(new Date());
    okTz.set(name, true);
    return name;
  } catch {
    okTz.set(name, false);
    return FALLBACK_TZ;
  }
}

/** Data + godzina wizyty w strefie lokalizacji (np. „pt, 8 sie, 11:00"). */
export function formatVisitDateTime(iso: string, tz: string | null | undefined, lang: string): string {
  return new Intl.DateTimeFormat(lang, {
    timeZone: safeTz(tz),
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).format(new Date(iso));
}

/**
 * Termin WYBRANY przez klienta w kreatorze rezerwacji: data "RRRR-MM-DD" i
 * godzina "HH:MM" są już w czasie lokalizacji (serwer tak podaje wolne terminy),
 * więc nie ma czego przeliczać — i nie potrzeba strefy. Datę formatujemy
 * w UTC, bo "2026-08-08" to północ UTC i zegar telefonu na zachód od Greenwich
 * cofnąłby ją o dzień.
 */
export function formatPickedSlot(date: string, time: string, lang: string): string {
  const day = new Intl.DateTimeFormat(lang, {
    timeZone: "UTC",
    day: "numeric",
    month: "short",
  }).format(new Date(`${date}T00:00:00Z`));
  return `${day}, ${time}`;
}

/** Krótszy wariant bez dnia tygodnia — na ekran potwierdzenia rezerwacji. */
export function formatVisitShort(iso: string, tz: string | null | undefined, lang: string): string {
  return new Intl.DateTimeFormat(lang, {
    timeZone: safeTz(tz),
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).format(new Date(iso));
}
