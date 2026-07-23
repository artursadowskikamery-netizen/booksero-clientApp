import { useEffect, useState } from "react";
import { useRoute, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { ChevronLeft, User, LogOut, MapPin, Bell, Check } from "lucide-react";
import { useTranslation } from "react-i18next";
import { api, ApiError } from "../lib/api";
import { isLoggedIn, clearToken } from "../lib/auth";
import { getPushState, enablePush, disablePush, disablePushOnLogout, deviceSubscribed, type PushState } from "../lib/push";
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

  // Powiadomienia: ŹRÓDŁEM PRAWDY jest stan KONTA z serwera (R1) — wspólny
  // dla wszystkich urządzeń klienta. Stan lokalny (zgoda/subskrypcja tego
  // urządzenia) służy tylko podpowiedziom „włącz na tym urządzeniu".
  const [acct, setAcct] = useState<{ enabled: boolean; devices: number } | null>(null);
  const [env, setEnv] = useState<PushState | null>(null);
  const [thisDev, setThisDev] = useState(false);
  const [pushBusy, setPushBusy] = useState(false);
  const [pushHidden, setPushHidden] = useState(false);
  const refreshPush = async () => {
    try {
      const [st, e, d] = await Promise.all([api.pushStatus(), getPushState(), deviceSubscribed()]);
      setAcct(st);
      setEnv(e);
      setThisDev(d);
    } catch {
      setPushHidden(true); // brak endpointu/sesji — sekcję chowamy
    }
  };
  useEffect(() => {
    if (logged) refreshPush();
  }, [logged]);
  // Suwak konta: wyłączenie gasi WSZYSTKIE urządzenia (R3); włączenie prosi
  // o zgodę i rejestruje to urządzenie (R2). Po wszystkim stan z serwera.
  const onTogglePush = async () => {
    if (!acct) return;
    setPushBusy(true);
    try {
      if (acct.enabled) await disablePush();
      else await enablePush();
    } finally {
      await refreshPush();
      setPushBusy(false);
    }
  };
  // Konto „włączone", ale TO urządzenie jeszcze nie odbiera (R4-baner).
  const onEnableThisDevice = async () => {
    setPushBusy(true);
    try {
      await enablePush();
    } finally {
      await refreshPush();
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

          {/* Powiadomienia — suwak pokazuje stan KONTA (wspólny dla urządzeń). */}
          {acct && !pushHidden && (
            <div className="rounded-2xl bg-surface border border-line p-4 mt-5">
              <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest text-muted mb-3">
                <Bell size={13} /> {t("push.title")}
              </div>
              <button
                onClick={onTogglePush}
                disabled={pushBusy}
                className="w-full flex items-center justify-between disabled:opacity-60"
              >
                <span className="text-sm font-semibold">
                  {acct.enabled ? t("push.enabled") : t("push.enable")}
                </span>
                {/* Suwak on/off — stan konta */}
                <span className={`w-11 h-6 rounded-full p-0.5 transition-colors ${acct.enabled ? "bg-brand" : "bg-surface-2 border border-line"}`}>
                  <span className={`block w-5 h-5 rounded-full bg-white transition-transform ${acct.enabled ? "translate-x-5" : ""}`} />
                </span>
              </button>
              {/* Konto włączone, ale to urządzenie jeszcze nie odbiera (R4) */}
              {acct.enabled && !thisDev && env === "default" && (
                <button
                  onClick={onEnableThisDevice}
                  disabled={pushBusy}
                  className="w-full mt-3 rounded-xl bg-surface-2 text-brand text-sm font-bold py-2.5 disabled:opacity-60"
                >
                  {t("push.thisDevice")}
                </button>
              )}
              {acct.enabled && !thisDev && env === "denied" && (
                <p className="text-sm text-muted mt-3">{t("push.denied")}</p>
              )}
              {acct.enabled && !thisDev && env === "ios-install" && (
                <p className="text-sm text-muted mt-3">{t("push.iosHint")}</p>
              )}
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
