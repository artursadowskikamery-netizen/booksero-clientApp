// Kod polecającego (?ref=<clientId>) z linku sieci. Zapamiętujemy go do
// momentu rejestracji nowego klienta i wtedy przekazujemy do backendu
// (SPEC-bonusy-etap-B §5 — attribution tylko przy świeżo tworzonym koncie).
const KEY = "booksero_ref";

export function saveRef(ref: string) {
  try {
    if (ref) localStorage.setItem(KEY, ref);
  } catch { /* brak localStorage */ }
}

export function loadRef(): string | null {
  try {
    return localStorage.getItem(KEY);
  } catch {
    return null;
  }
}

export function clearRef() {
  try {
    localStorage.removeItem(KEY);
  } catch { /* brak localStorage */ }
}

// Wyławia ?ref=... z bieżącego URL (query stringu) i zapisuje.
export function captureRefFromUrl() {
  try {
    const ref = new URLSearchParams(window.location.search).get("ref");
    if (ref) saveRef(ref.trim());
  } catch { /* brak window/URL */ }
}
