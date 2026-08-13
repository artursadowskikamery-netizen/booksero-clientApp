import { useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { api } from "../lib/api";
import { applyAccent, accentForSalon, rememberAccent } from "../lib/themes";

// KOLOR LOKALIZACJI DLA CAŁEJ APLIKACJI, W JEDNYM MIEJSCU.
//
// Wcześniej akcent nakładał wyłącznie ekran salonu. Wystarczyło kliknąć w dolne
// menu (Rezerwuj, Wizyty, Bonusy, Profil) i aplikacja zostawała w domyślnym
// niebieskim BookSero, bo żaden z tych ekranów koloru nie ustawiał, a zakładka
// „Salon" prowadzi na listę sieci, która akcent zeruje. Barwa salonu ginęła po
// pierwszym kliknięciu i wracała dopiero po powrocie na ekran salonu.
//
// Ten komponent siedzi nad routerem i pilnuje koloru dla KAŻDEGO adresu
// /salon/:salonId/… — także tych, które dopiero powstaną.
const TRASA = /^\/salon\/([^/?#]+)/;

export default function SalonAccent() {
  const [loc] = useLocation();
  const salonId = decodeURIComponent(TRASA.exec(loc)?.[1] ?? "");

  // Zapytanie współdzielone (ten sam klucz co ekrany salonu i dolne menu) —
  // to nie jest dodatkowe pobranie, tylko podpięcie się pod cache.
  const salonQ = useQuery({
    queryKey: ["salon", salonId],
    queryFn: () => api.salon(salonId),
    enabled: !!salonId,
  });

  // Krok 1: kolor zapamiętany na urządzeniu — natychmiast, bez czekania na sieć.
  // Bez tego przy każdym przejściu między zakładkami mrugałby niebieski.
  useEffect(() => {
    if (!salonId) return; // ekrany spoza salonu (start, lista sieci) rządzą się same
    const znany = accentForSalon(salonId);
    if (znany) applyAccent(znany);
  }, [salonId]);

  // Krok 2: wartość z serwera jest rozstrzygająca — salon mógł zmienić kolor
  // w panelu. `null` też jest odpowiedzią: znaczy „wróć do niebieskiego".
  const data = salonQ.data;
  useEffect(() => {
    if (!salonId || !data) return;
    const accent = data.profile?.appAccent ?? null;
    applyAccent(accent);
    rememberAccent({ salonId, tenantId: data.salon?.tenantId ?? null }, accent);
  }, [salonId, data]);

  return null;
}
