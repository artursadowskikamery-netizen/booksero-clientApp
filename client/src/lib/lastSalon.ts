// Ostatnio otwarty salon — dzięki temu dolne menu działa też na ekranach
// bez salonu w adresie (np. wybór salonu sieci pod zakładką "Salon").
const KEY = "booksero_last_salon";

export function saveLastSalon(salonId: string) {
  try {
    localStorage.setItem(KEY, salonId);
  } catch { /* brak localStorage */ }
}

export function loadLastSalon(): string | null {
  try {
    return localStorage.getItem(KEY);
  } catch {
    return null;
  }
}
