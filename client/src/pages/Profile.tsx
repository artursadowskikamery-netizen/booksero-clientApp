import { useEffect, useState } from "react";
import { useRoute, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { ChevronLeft, User, LogOut, MapPin, Bell, Check } from "lucide-react";
import { useTranslation } from "react-i18next";
import { api, ApiError } from "../lib/api";
import { isLoggedIn, clearToken } from "../lib/auth";
import { getPushState, enablePush, disablePush, disablePushOnLogout, type PushState } from "../lib/push";
import { APP_VERSION, checkForUpdate, applyUpdate } from "../lib/version";
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

  // Token wygasł/nieważny (401) LUB klient skasowany z bazy (404) →
  // wyczyść sesję i na logowanie (bez martwej sesji z czerwonym błędem).
  useEffect(() => {
    if (meQ.error instanceof ApiError && (meQ.error.status === 401 || meQ.error.status === 404)) {
      clearToken();
      navigate(`/salon/${salonId}/login`);
    }
  }, [meQ.error, salonId, navigate]);

  // Powiadomienia push: stan + świadome włączanie z Profilu.
  const [push, setPush] = useState<PushState | "disabled" | null>(null);
  const [pushBusy, setPushBusy] = useState(false);
  useEffect(() => {
    getPushState().then(setPush).catch(() => setPush(null));
  }, []);
  const onTogglePush = async () => {
    setPushBusy(true);
    try {
      if (push === "subscribed") {
        await disablePush();
        setPush("default");
      } else {
        const r = await enablePush();
        if (r === "ok") setPush("subscribed");
        else if (r === "denied") setPush("denied");
        else setPush("disabled"); // push wyłączony na serwerze — chowamy sekcję
      }
    } finally {
      setPushBusy(false);
    }
  };

  // Wersja aplikacji + sprawdzanie aktualizacji.
  const [verState, setVerState] = useState<"idle" | "checking" | "uptodate" | "available">("idle");
  const onCheckUpdate = async () => {
    setVerState("checking");
    try {
      const { hasUpdate } = await checkForUpdate();
      setVerState(hasUpdate ? "available" : "uptodate");
    } catch {
      setVerState("idle");
    }
  };

  const logout = async () => {
    // Najpierw wyrejestruj urządzenie z push (jeszcze z tokenem), potem sesja.
    await disablePushOnLogout();
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
      {meQ.isError &&
        !(meQ.error instanceof ApiError && (meQ.error.status === 401 || meQ.error.status === 404)) && (
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

          {/* Powiadomienia push — suwak on/off; sekcja znika, gdy nieobsługiwane */}
          {push && push !== "unsupported" && push !== "disabled" && (
            <div className="rounded-2xl bg-surface border border-line p-4 mt-5">
              <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest text-muted mb-3">
                <Bell size={13} /> {t("push.title")}
              </div>
              {(push === "subscribed" || push === "default") && (
                <button
                  onClick={onTogglePush}
                  disabled={pushBusy}
                  className="w-full flex items-center justify-between disabled:opacity-60"
                >
                  <span className="text-sm font-semibold">
                    {push === "subscribed" ? t("push.enabled") : t("push.enable")}
                  </span>
                  {/* Suwak on/off */}
                  <span className={`w-11 h-6 rounded-full p-0.5 transition-colors ${push === "subscribed" ? "bg-brand" : "bg-surface-2 border border-line"}`}>
                    <span className={`block w-5 h-5 rounded-full bg-white transition-transform ${push === "subscribed" ? "translate-x-5" : ""}`} />
                  </span>
                </button>
              )}
              {push === "denied" && <p className="text-sm text-muted">{t("push.denied")}</p>}
              {push === "ios-install" && <p className="text-sm text-muted">{t("push.iosHint")}</p>}
            </div>
          )}

          <button
            onClick={logout}
            className="w-full rounded-xl bg-surface-2 text-ink-2 font-bold py-3 mt-6 flex items-center justify-center gap-2"
          >
            <LogOut size={16} /> {t("auth.logout")}
          </button>
        </>
      )}

      {/* Wersja aplikacji + aktualizacja — dyskretnie na dole */}
      <div className="mt-8 text-center">
        {verState === "available" ? (
          <button onClick={applyUpdate} className="btn-primary">
            {t("version.update")}
          </button>
        ) : (
          <button
            onClick={onCheckUpdate}
            disabled={verState === "checking"}
            className="text-xs text-brand font-semibold disabled:opacity-60"
          >
            {verState === "checking" ? t("version.checking") : t("version.check")}
          </button>
        )}
        <div className="text-[11px] text-muted mt-2">
          {verState === "uptodate" ? `${t("version.upToDate")} · ` : verState === "available" ? `${t("version.available")} · ` : ""}
          BookSero v{APP_VERSION}
        </div>
      </div>

      <BottomNav salonId={salonId} active="profile" />
    </div>
  );
}
