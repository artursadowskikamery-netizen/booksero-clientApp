import { useState } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Store, CalendarPlus, Clock, Star, User } from "lucide-react";
import { useTranslation } from "react-i18next";
import { api } from "../lib/api";
import MySalons, { maWieleSalonow } from "./MySalons";

type Tab = "salon" | "book" | "visits" | "rewards" | "profile";

// Dolne menu. "Salon": klientka z kilkoma salonami dostaje okno „Moje salony”
// (przejście do innego salonu bez wylogowania, decyzja właściciela
// 2026-11-20); z jednym salonem — jak dotąd lista salonów sieci (wybór salonu
// tenanta), a przy jednej lokalizacji prosto do salonu.
export default function BottomNav({ salonId, active }: { salonId: string; active?: Tab }) {
  const [, navigate] = useLocation();
  const { t } = useTranslation();
  const [salonsOpen, setSalonsOpen] = useState(false);

  // Tenant bieżącego salonu — zapytanie jest współdzielone (cache react-query)
  // ze stronami, które i tak pobierają dane salonu.
  const salonQ = useQuery({ queryKey: ["salon", salonId], queryFn: () => api.salon(salonId), enabled: !!salonId });
  const tenantId = salonQ.data?.salon.tenantId ?? null;

  // Ikona Bonusy tylko, gdy tenant włączył choć jedną funkcję bonusową.
  // Wszystko wyłączone = funkcja "ginie" z aplikacji (decyzja właściciela).
  // Dopóki dane salonu się nie wczytały, pokazujemy ikonę (bez migotania).
  const feat = salonQ.data?.appFeatures;
  const hasPromos = (salonQ.data?.promotions?.length ?? 0) > 0;
  const showRewards =
    !salonQ.data || !feat || !!(feat.loyalty || feat.referrals || feat.codesNotebook) || hasPromos;

  const items: { key: Tab; icon: typeof Store; label: string; to: string }[] = [
    { key: "salon", icon: Store, label: t("tabs.salon"), to: tenantId ? `/t/${tenantId}` : `/salon/${salonId}` },
    { key: "book", icon: CalendarPlus, label: t("tabs.book"), to: `/salon/${salonId}/book` },
    { key: "visits", icon: Clock, label: t("tabs.visits"), to: `/salon/${salonId}/visits` },
    ...(showRewards
      ? [{ key: "rewards" as Tab, icon: Star, label: t("tabs.rewards"), to: `/salon/${salonId}/rewards` }]
      : []),
    { key: "profile", icon: User, label: t("tabs.profile"), to: `/salon/${salonId}/profile` },
  ];
  return (
    <nav className="fixed bottom-0 inset-x-0 z-20">
      <div className="max-w-md mx-auto flex items-stretch h-16 bg-surface border-t border-line px-1">
        {items.map((it) => (
          <button
            key={it.key}
            onClick={() => (it.key === "salon" && maWieleSalonow() ? setSalonsOpen(true) : navigate(it.to))}
            className={`flex-1 flex flex-col items-center justify-center gap-0.5 text-[10px] font-semibold ${
              active === it.key ? "text-brand" : "text-muted"
            }`}
          >
            <it.icon size={20} strokeWidth={1.8} />
            {it.label}
          </button>
        ))}
      </div>
      {salonsOpen && <MySalons currentSalonId={salonId} tenantId={tenantId} onClose={() => setSalonsOpen(false)} />}
    </nav>
  );
}
