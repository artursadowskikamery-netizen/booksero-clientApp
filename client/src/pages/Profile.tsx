import { useEffect, useState } from "react";
import { useRoute, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { ChevronLeft, User, LogOut, MapPin, Bell, Check, Trash2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { api, ApiError } from "../lib/api";
import { isLoggedIn, clearToken, listSessions, sessionToken } from "../lib/auth";
import { getPushState, enablePush, disablePush, disablePushOnLogout, deviceSubscribed, type PushState } from "../lib/push";
import { APP_VERSION, checkForUpdate, applyUpdate } from "../lib/version";
import Consents from "../components/Consents";
import BottomNav from "../components/BottomNav";

// Profil zalogowanego klienta (Faza 2). Bez sesji → przekierowanie na logowanie.
export default function Profile() {
  const [, params] = useRoute("/salon/:salonId/profile");
  const salonId = params?.salonId ?? "";
  const [, navigate] = useLocation();
  const { t } = useTranslation();

  // USUNIĘCIE KONTA W APLIKACJI (App Store 5.1.1(v), decyzja właściciela
  // 2026-09-13: „wersja szczupła"). Panel kasuje sesje, urządzenia push
  // i znaczniki aplikacji — kartoteka, wizyty i punkty zostają u salonu jako
  // administratora danych. Jedno wywołanie NA FIRMĘ (token tej firmy), jak
  // w wejściu numerem; po wszystkim czyścimy stan lokalny i pokazujemy
  // ekran końcowy z komunikatem panelu (język z X-Locale).
  const [delOpen, setDelOpen] = useState(false);
  const [delBusy, setDelBusy] = useState(false);
  const [delDone, setDelDone] = useState<string | null>(null);
  const deleteAccount = async () => {
    setDelBusy(true);
    let message = "";
    try {
      // Najpierw wyrejestruj to urządzenie z push (jeszcze z tokenem).
      await disablePushOnLogout().catch(() => {});
      const sessions = listSessions();
      const tokens = sessions.map((s) => sessionToken(s.tenantId)).filter((x): x is string => !!x);
      if (tokens.length === 0) {
        const r = await api.deleteAccount();
        message = r?.message || "";
      }
      for (const tok of tokens) {
        try {
          const r = await api.deleteAccount(tok);
          if (r?.message && !message) message = r.message;
        } catch (e) {
          // 401 = ta sesja już nieważna — nie ma czego usuwać; reszta idzie dalej.
          if (!(e instanceof ApiError && (e.status === 401 || e.status === 404))) throw e;
        }
      }
      clearToken();
      setDelDone(message || t("auth.deleteDone"));
    } catch (e) {
      alert((e as Error).message);
    } finally {
      setDelBusy(false);
      setDelOpen(false);
    }
  };

  const logged = isLoggedIn();
  useEffect(() => {
    // Po usunięciu konta sesji już nie ma — ale pokazujemy ekran końcowy,
    // a nie logowanie.
    if (!logged && !delDone) navigate(`/salon/${salonId}/login`);
  }, [logged, delDone, salonId, navigate]);

  const meQ = useQuery({ queryKey: ["clientMe"], queryFn: () => api.clientMe(), enabled: logged });

  // Nazwa sieci — potrzebna WYŁĄCZNIE do zdania o zasięgu zgód, gdy klientka ma
  // kartoteki w kilku lokalizacjach. Przy jednej lokalizacji nie pobieramy.
  const tenantQ = useQuery({
    queryKey: ["tenant", meQ.data?.tenantId],
    queryFn: () => api.tenant(meQ.data!.tenantId),
    enabled: !!meQ.data?.tenantId && (meQ.data?.salons.length ?? 0) > 1,
    retry: false,
  });

  // Token wygasł/nieważny (401) LUB klient skasowany z bazy (404) →
  // wyczyść sesję i na logowanie (bez martwej sesji z czerwonym błędem).
  useEffect(() => {
    if (meQ.error instanceof ApiError && (meQ.error.status === 401 || meQ.error.status === 404)) {
      clearToken();
      void disablePushOnLogout(); // urządzenie nie może dostawać pushy poprzedniego konta
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

  if (delDone) {
    return (
      <div className="max-w-md mx-auto min-h-screen p-6 grid place-items-center text-center">
        <div>
          <div className="w-12 h-12 rounded-full bg-surface-2 text-ink-2 grid place-items-center mx-auto">
            <Check size={22} />
          </div>
          <p className="text-sm text-ink mt-4">{delDone}</p>
          <button className="btn-primary mt-6" onClick={() => navigate("/", { replace: true })}>
            {t("auth.deleteBack")}
          </button>
        </div>
      </div>
    );
  }

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

          {/* Zgody (RODO art. 7 ust. 3) — pod danymi klientki, NAD listą salonów,
              bezpośrednio na ekranie Profilu (bez osobnego podekranu, żeby
              wycofanie było równie łatwe jak udzielenie). Sekcja zwijana,
              domyślnie zwinięta — decyzja właściciela. */}
          <Consents
            multiSalon={meQ.data.salons.length > 1}
            networkName={tenantQ.data?.name}
            onUnauthorized={() => {
              clearToken();
              void disablePushOnLogout();
              navigate(`/salon/${salonId}/login`);
            }}
          />

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
              {/* Liczba urządzeń wg SERWERA — rozstrzyga spory „a u mnie włączone" */}
              {acct.enabled && (
                <p className="text-[11px] text-muted mt-2">{t("push.devicesCount", { count: acct.devices })}</p>
              )}
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

          {/* Usuń konto — widoczne bez szukania (wymóg App Store), ale
              wizualnie ciszej niż wylogowanie. */}
          <button
            onClick={() => setDelOpen(true)}
            className="w-full text-red-400 text-sm font-semibold py-3 mt-2 flex items-center justify-center gap-2"
          >
            <Trash2 size={15} /> {t("auth.deleteAccount")}
          </button>

          {delOpen && (
            <div className="fixed inset-0 z-50 bg-black/60 grid place-items-center p-6" role="dialog" aria-modal="true">
              <div className="w-full max-w-sm rounded-2xl bg-surface border border-line p-5">
                <div className="font-bold">{t("auth.deleteTitle")}</div>
                <p className="text-sm text-muted mt-2">{t("auth.deleteBody")}</p>
                <div className="flex gap-2 mt-5">
                  <button
                    onClick={() => setDelOpen(false)}
                    disabled={delBusy}
                    className="flex-1 rounded-xl bg-surface-2 text-ink-2 font-bold py-3 disabled:opacity-60"
                  >
                    {t("auth.deleteCancel")}
                  </button>
                  <button
                    onClick={deleteAccount}
                    disabled={delBusy}
                    className="flex-1 rounded-xl bg-red-500 text-white font-bold py-3 disabled:opacity-60"
                  >
                    {delBusy ? t("common.loading") : t("auth.deleteConfirm")}
                  </button>
                </div>
              </div>
            </div>
          )}
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
