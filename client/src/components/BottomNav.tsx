import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Store, CalendarPlus, Clock, Star, User } from "lucide-react";
import { useTranslation } from "react-i18next";
import { api } from "../lib/api";

type Tab = "salon" | "book" | "visits" | "rewards" | "profile";

// Dolne menu. "Salon" prowadzi do listy salonów sieci (wybór salonu tenanta);
// prezentacja konkretnego salonu otwiera się po jego wybraniu.
export default function BottomNav({ salonId, active }: { salonId: string; active?: Tab }) {
  const [, navigate] = useLocation();
  const { t } = useTranslation();

  // Tenant bieżącego salonu — zapytanie jest współdzielone (cache react-query)
  // ze stronami, które i tak pobierają dane salonu.
  const salonQ = useQuery({ queryKey: ["salon", salonId], queryFn: () => api.salon(salonId), enabled: !!salonId });
  const tenantId = salonQ.data?.salon.tenantId ?? null;

  const items: { key: Tab; icon: typeof Store; label: string; to: string }[] = [
    { key: "salon", icon: Store, label: t("tabs.salon"), to: tenantId ? `/t/${tenantId}` : `/salon/${salonId}` },
    { key: "book", icon: CalendarPlus, label: t("tabs.book"), to: `/salon/${salonId}/book` },
    { key: "visits", icon: Clock, label: t("tabs.visits"), to: `/salon/${salonId}/visits` },
    { key: "rewards", icon: Star, label: t("tabs.rewards"), to: `/salon/${salonId}/rewards` },
    { key: "profile", icon: User, label: t("tabs.profile"), to: `/salon/${salonId}/profile` },
  ];
  return (
    <nav className="fixed bottom-0 inset-x-0 z-20">
      <div className="max-w-md mx-auto flex items-stretch h-16 bg-surface border-t border-line px-1">
        {items.map((it) => (
          <button
            key={it.key}
            onClick={() => navigate(it.to)}
            className={`flex-1 flex flex-col items-center justify-center gap-0.5 text-[10px] font-semibold ${
              active === it.key ? "text-brand" : "text-muted"
            }`}
          >
            <it.icon size={20} strokeWidth={1.8} />
            {it.label}
          </button>
        ))}
      </div>
    </nav>
  );
}
