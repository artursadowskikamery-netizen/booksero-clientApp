import { useEffect, useState } from "react";
import { useRoute, useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ChevronLeft, Clock, MapPin, Users } from "lucide-react";
import { useTranslation } from "react-i18next";
import { api, ApiError } from "../lib/api";
import { isLoggedIn, clearToken } from "../lib/auth";
import type { ClientAppointment } from "@shared/types";
import { disablePushOnLogout } from "../lib/push";
import { formatVisitDateTime } from "../lib/datetime";
import BottomNav from "../components/BottomNav";

// Moje wizyty (Faza 2): nadchodzące + historia, odwołanie istniejącym
// tokenem anulowania. Wymaga zalogowanego klienta.
export default function Visits() {
  const [, params] = useRoute("/salon/:salonId/visits");
  const salonId = params?.salonId ?? "";
  const [, navigate] = useLocation();
  const { t, i18n } = useTranslation();
  const qc = useQueryClient();
  const [info, setInfo] = useState("");
  // Wizyta czekająca na potwierdzenie odwołania — własne okienko w stylu
  // aplikacji zamiast systemowego window.confirm (pokazywało adres serwera).
  const [confirmFor, setConfirmFor] = useState<ClientAppointment | null>(null);

  const logged = isLoggedIn();
  useEffect(() => {
    if (!logged) navigate(`/salon/${salonId}/login`);
  }, [logged, salonId, navigate]);

  const q = useQuery({
    queryKey: ["clientAppointments"],
    queryFn: () => api.clientAppointments("all"),
    enabled: logged,
  });

  useEffect(() => {
    if (q.error instanceof ApiError && q.error.status === 401) {
      clearToken();
      void disablePushOnLogout(); // urządzenie nie może dostawać pushy poprzedniego konta
      navigate(`/salon/${salonId}/login`);
    }
  }, [q.error, salonId, navigate]);

  // Preferujemy odwołanie po id (działa też dla wizyt z panelu); token
  // anulowania zostaje jako ścieżka zapasowa dla starszego backendu.
  const cancelM = useMutation({
    mutationFn: (a: ClientAppointment) =>
      a.canCancel ? api.cancelMyVisit(a.id) : api.cancelVisit(a.cancellationToken!),
    onSuccess: () => {
      setInfo(t("visits.cancelled"));
      qc.invalidateQueries({ queryKey: ["clientAppointments"] });
    },
    onError: (e) => setInfo((e as Error).message),
  });

  // Godzina W STREFIE LOKALIZACJI — nie wg zegara telefonu. Strefę niesie każda
  // wizyta osobno (klient może mieć wizyty w kilku krajach).
  const fmt = (a: ClientAppointment) =>
    formatVisitDateTime(a.startAt, a.salonTimezone, i18n.language);

  const now = Date.now();
  const all = q.data ?? [];
  // Nadchodzące: najbliższa wizyta na górze. Historia: najnowsza na górze.
  const upcoming = all
    .filter((a) => new Date(a.startAt).getTime() >= now && a.status !== "cancelled")
    .sort((a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime());
  const past = all
    .filter((a) => new Date(a.startAt).getTime() < now)
    .sort((a, b) => new Date(b.startAt).getTime() - new Date(a.startAt).getTime());

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
        <div className="font-bold">{t("tabs.visits")}</div>
      </header>

      {q.isLoading && <div className="p-4 text-muted">{t("common.loading")}</div>}
      {q.isError && !(q.error instanceof ApiError && q.error.status === 401) && (
        <div className="p-4 text-sm text-red-400">{(q.error as Error).message}</div>
      )}
      {info && <div className="rounded-xl bg-surface-2 p-3 text-sm mb-2">{info}</div>}

      {q.data && (
        <>
          <h2 className="text-[11px] font-bold uppercase tracking-widest text-muted mt-2 mb-2">
            {t("visits.upcoming")}
          </h2>
          {upcoming.length === 0 && <div className="text-sm text-muted mb-2">{t("visits.none")}</div>}
          {upcoming.map((a) => (
            <div key={a.id} className="rounded-2xl border border-brand bg-surface p-4 mb-3">
              <div className="text-xs text-muted mb-1 flex items-center gap-2">
                {fmt(a)}
                {/* Wizyta dla dwóch osób — bez tej plakietki z listy nie wynika,
                    że to rezerwacja pary (obie osoby mają własny zabieg). */}
                {(a.partySize ?? 1) >= 2 && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-surface-2 border border-line px-2 py-0.5 text-[10px] font-bold text-ink-2">
                    <Users size={10} /> {t("visits.couple")}
                  </span>
                )}
              </div>
              <div className="font-bold">{a.serviceName}</div>
              <div className="text-sm text-muted flex items-center gap-1.5 mt-0.5">
                <MapPin size={13} /> {a.salonName} · {a.staffName}
              </div>
              {/* Druga osoba: jej zabieg i JEJ specjalista — inaczej klient widzi
                  jednego pracownika i nie wie, kto obsłuży towarzysza. */}
              {(a.partySize ?? 1) >= 2 && (a.companionName || a.companionStaffName) && (
                <div className="text-sm text-muted flex items-center gap-1.5 mt-0.5">
                  <Users size={13} />
                  {[a.companionName, a.companionServiceName, a.companionStaffName].filter(Boolean).join(" · ")}
                </div>
              )}
              {(a.canCancel || a.cancellationToken) && (
                <button
                  onClick={() => setConfirmFor(a)}
                  disabled={cancelM.isPending}
                  className="mt-3 rounded-lg bg-surface-2 text-ink-2 text-sm font-semibold px-4 py-2 disabled:opacity-50"
                >
                  {cancelM.isPending ? t("common.loading") : t("visits.cancel")}
                </button>
              )}
            </div>
          ))}

          <h2 className="text-[11px] font-bold uppercase tracking-widest text-muted mt-5 mb-1">
            {t("visits.history")}
          </h2>
          {past.length === 0 && <div className="text-sm text-muted">{t("visits.none")}</div>}
          <div className="divide-y divide-line">
            {past.map((a) => (
              <div key={a.id} className="flex items-center gap-3 py-3">
                <span className="w-9 h-9 rounded-xl bg-surface-2 text-muted grid place-items-center shrink-0">
                  <Clock size={16} />
                </span>
                <span className="flex-1 min-w-0">
                  <span className="block text-sm font-medium truncate">
                    {a.serviceName}
                    {(a.partySize ?? 1) >= 2 && <span className="text-muted font-normal"> · {t("visits.couple")}</span>}
                  </span>
                  <span className="block text-xs text-muted">{fmt(a)} · {a.staffName}</span>
                </span>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Potwierdzenie odwołania — okienko w stylu aplikacji */}
      {confirmFor && (
        <div
          className="fixed inset-0 z-30 bg-black/60 flex items-end sm:items-center justify-center p-4"
          onClick={() => setConfirmFor(null)}
        >
          <div
            className="w-full max-w-sm rounded-2xl bg-surface border border-line p-5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="font-bold text-lg">{t("visits.cancelConfirm")}</div>
            <div className="text-sm text-muted mt-2">
              {fmt(confirmFor)} · {confirmFor.serviceName}
            </div>
            <div className="flex gap-2 mt-5">
              <button
                onClick={() => setConfirmFor(null)}
                className="flex-1 rounded-xl bg-surface-2 text-ink font-semibold py-3"
              >
                {t("common.back")}
              </button>
              <button
                onClick={() => {
                  cancelM.mutate(confirmFor);
                  setConfirmFor(null);
                }}
                className="flex-1 rounded-xl bg-brand text-brand-contrast font-bold py-3"
              >
                {t("visits.cancel")}
              </button>
            </div>
          </div>
        </div>
      )}

      <BottomNav salonId={salonId} active="visits" />
    </div>
  );
}
