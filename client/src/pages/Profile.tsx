import { useEffect } from "react";
import { useRoute, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { ChevronLeft, User, LogOut, MapPin } from "lucide-react";
import { useTranslation } from "react-i18next";
import { api, ApiError } from "../lib/api";
import { isLoggedIn, clearToken } from "../lib/auth";
import BottomNav from "../components/BottomNav";

// Profil zalogowanego klienta (Faza 2). Bez sesji → przekierowanie na logowanie.
export default function Profile() {
  const [, params] = useRoute("/salon/:salonId/profile");
  const salonId = params?.salonId ?? "";
  const [, navigate] = useLocation();
  const { t } = useTranslation();

  const logged = isLoggedIn();
  useEffect(() => {
    if (!logged) navigate(`/salon/${salonId}/login`);
  }, [logged, salonId, navigate]);

  const meQ = useQuery({ queryKey: ["clientMe"], queryFn: () => api.clientMe(), enabled: logged });

  // Token wygasł/nieważny → wyczyść i na logowanie.
  useEffect(() => {
    if (meQ.error instanceof ApiError && meQ.error.status === 401) {
      clearToken();
      navigate(`/salon/${salonId}/login`);
    }
  }, [meQ.error, salonId, navigate]);

  const logout = () => {
    clearToken();
    navigate(`/salon/${salonId}`);
  };

  return (
    <div className="max-w-md mx-auto min-h-screen p-4 pb-24">
      <header className="flex items-center gap-2 py-2">
        <button
          onClick={() => navigate(`/salon/${salonId}`)}
          className="w-9 h-9 rounded-xl border border-line grid place-items-center text-ink-2"
          aria-label={t("common.back")}
        >
          <ChevronLeft size={18} />
        </button>
        <div className="font-bold">{t("tabs.profile")}</div>
      </header>

      {meQ.isLoading && <div className="p-4 text-muted">{t("common.loading")}</div>}
      {meQ.isError && !(meQ.error instanceof ApiError && meQ.error.status === 401) && (
        <div className="p-4 text-sm text-red-400">{(meQ.error as Error).message}</div>
      )}

      {meQ.data && (
        <>
          <div className="flex items-center gap-3 rounded-2xl bg-surface border border-line p-4 mt-2">
            <div className="w-12 h-12 rounded-full bg-brand text-brand-contrast grid place-items-center">
              <User size={22} />
            </div>
            <div className="min-w-0">
              <div className="font-bold truncate">{meQ.data.name}</div>
              <div className="text-sm text-muted font-mono">{meQ.data.phone}</div>
            </div>
          </div>

          {meQ.data.salons.length > 0 && (
            <>
              <h2 className="text-[11px] font-bold uppercase tracking-widest text-muted mt-5 mb-1">
                {t("common.chooseSalon")}
              </h2>
              <div className="divide-y divide-line">
                {meQ.data.salons.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => navigate(`/salon/${s.id}`)}
                    className="w-full flex items-center gap-3 text-left py-3"
                  >
                    <MapPin size={16} className="text-brand shrink-0" />
                    <span className="text-sm font-medium">{s.name}</span>
                  </button>
                ))}
              </div>
            </>
          )}

          <button
            onClick={logout}
            className="w-full rounded-xl bg-surface-2 text-ink-2 font-bold py-3 mt-6 flex items-center justify-center gap-2"
          >
            <LogOut size={16} /> {t("auth.logout")}
          </button>
        </>
      )}

      <BottomNav salonId={salonId} active="profile" />
    </div>
  );
}
