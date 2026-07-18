import { useRoute, useLocation } from "wouter";
import { ChevronLeft, Hourglass } from "lucide-react";
import { useTranslation } from "react-i18next";
import BottomNav from "../components/BottomNav";

// Zaślepka funkcji Fazy 2 (Wizyty / Bonusy / Profil).
export default function Soon() {
  const [, params] = useRoute("/salon/:salonId/soon");
  const salonId = params?.salonId ?? "";
  const [, navigate] = useLocation();
  const { t } = useTranslation();
  return (
    <div className="max-w-md mx-auto min-h-screen p-4 pb-24 flex flex-col">
      <header className="flex items-center gap-2 py-2">
        <button
          onClick={() => navigate(`/salon/${salonId}`)}
          className="w-9 h-9 rounded-xl border border-line grid place-items-center text-ink-2"
          aria-label={t("common.back")}
        >
          <ChevronLeft size={18} />
        </button>
      </header>
      <div className="flex-1 grid place-items-center text-center">
        <div>
          <Hourglass size={30} className="mx-auto text-brand mb-3" />
          <div className="font-bold">{t("common.soon")}</div>
        </div>
      </div>
      <BottomNav salonId={salonId} />
    </div>
  );
}
