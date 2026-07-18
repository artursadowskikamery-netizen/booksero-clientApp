import { useLocation } from "wouter";
import { Home, CalendarPlus, Clock, Star, User } from "lucide-react";
import { useTranslation } from "react-i18next";

type Tab = "salon" | "book" | "visits" | "rewards" | "profile";

// Dolne menu jak w prototypie. Wizyty/Bonusy/Profil -> ekran "wkrótce" (Faza 2).
export default function BottomNav({ salonId, active }: { salonId: string; active?: Tab }) {
  const [, navigate] = useLocation();
  const { t } = useTranslation();
  const items: { key: Tab; icon: typeof Home; label: string; to: string }[] = [
    { key: "salon", icon: Home, label: t("tabs.salon"), to: `/salon/${salonId}` },
    { key: "book", icon: CalendarPlus, label: t("tabs.book"), to: `/salon/${salonId}/book` },
    { key: "visits", icon: Clock, label: t("tabs.visits"), to: `/salon/${salonId}/visits` },
    { key: "rewards", icon: Star, label: t("tabs.rewards"), to: `/salon/${salonId}/soon` },
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
