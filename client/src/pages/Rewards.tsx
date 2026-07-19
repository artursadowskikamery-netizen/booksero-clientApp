import { useEffect, useState } from "react";
import { useRoute, useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ChevronLeft, Gift, Star } from "lucide-react";
import { useTranslation } from "react-i18next";
import { api, ApiError } from "../lib/api";
import { isLoggedIn, clearToken } from "../lib/auth";
import BottomNav from "../components/BottomNav";

// Bonusy Etap A (SPEC-bonusy-etap-A): karta punktów i poziomu, zaproszenie
// "Dołącz do programu", katalog nagród ze zgłaszaniem odbioru W SALONIE.
// Gdy tenant nie włączył suwaka loyalty, backend zwraca 404 → ekran "wkrótce".
export default function Rewards() {
  const [, params] = useRoute("/salon/:salonId/rewards");
  const salonId = params?.salonId ?? "";
  const [, navigate] = useLocation();
  const { t } = useTranslation();
  const qc = useQueryClient();

  // Pod-zakładki Bonusów (jak kafelki kategorii w Rezerwuj). Kolejne moduły
  // (Polecenia SMS, Notatnik kodów, ...) dojdą tu wraz z suwakami następnych etapów.
  const [tab, setTab] = useState<"points" | "rewards">("points");

  const logged = isLoggedIn();
  useEffect(() => {
    if (!logged) navigate(`/salon/${salonId}/login`);
  }, [logged, salonId, navigate]);

  const q = useQuery({ queryKey: ["loyalty"], queryFn: () => api.loyalty(), enabled: logged, retry: false });

  useEffect(() => {
    if (q.error instanceof ApiError && q.error.status === 401) {
      clearToken();
      navigate(`/salon/${salonId}/login`);
    }
  }, [q.error, salonId, navigate]);

  const invalidate = () => qc.invalidateQueries({ queryKey: ["loyalty"] });
  const joinM = useMutation({ mutationFn: () => api.loyaltyJoin(), onSuccess: invalidate });
  const claimM = useMutation({ mutationFn: (rewardId: string) => api.loyaltyClaim(rewardId), onSuccess: invalidate });
  const cancelM = useMutation({ mutationFn: (claimId: string) => api.loyaltyCancelClaim(claimId), onSuccess: invalidate });

  const d = q.data;
  const unavailable = q.error instanceof ApiError && q.error.status === 404;

  // Postęp do następnego poziomu — liczony na "lifetime" (dorobek, nigdy nie spada).
  const lifetime = d?.lifetime ?? 0;
  const tiers = d?.tiers ?? [];
  const curTier = [...tiers].filter((x) => x.minPoints <= lifetime).sort((a, b) => b.minPoints - a.minPoints)[0] ?? null;
  // Postęp też przed pierwszym poziomem (baza = 0, gdy brak bieżącego tieru).
  const next = d?.nextTier ?? null;
  const base = curTier?.minPoints ?? 0;
  const pct = next
    ? Math.min(100, Math.round(((lifetime - base) / Math.max(next.minPoints - base, 1)) * 100))
    : null;

  const claimIdFor = (rewardName: string) =>
    d?.pendingClaims?.find((c) => c.rewardName === rewardName)?.id ?? null;

  return (
    <div className={`max-w-md mx-auto min-h-screen p-4 ${d?.joined ? "pb-40" : "pb-24"}`}>
      <header className="flex items-center gap-2 py-2">
        <button
          onClick={() => navigate(`/salon/${salonId}`)}
          className="w-9 h-9 rounded-xl border border-line grid place-items-center text-ink-2"
          aria-label={t("common.back")}
        >
          <ChevronLeft size={18} />
        </button>
        <div className="font-bold">{t("tabs.rewards")}</div>
      </header>

      {q.isLoading && <div className="p-4 text-muted">{t("common.loading")}</div>}

      {/* Suwak loyalty wyłączony u tenanta */}
      {unavailable && (
        <div className="flex flex-col items-center text-center gap-3 py-16">
          <div className="w-14 h-14 rounded-full bg-surface-2 text-muted grid place-items-center">
            <Gift size={26} />
          </div>
          <div className="text-sm text-muted">{t("loyalty.unavailable")}</div>
        </div>
      )}

      {q.isError && !unavailable && !(q.error instanceof ApiError && q.error.status === 401) && (
        <div className="p-4 text-sm text-red-400">{(q.error as Error).message}</div>
      )}

      {/* Zaproszenie — klient jeszcze nie dołączył do programu */}
      {d && !d.joined && (
        <div className="rounded-2xl border border-brand bg-surface p-5 mt-2 text-center">
          <div className="w-14 h-14 mx-auto rounded-full bg-brand text-brand-contrast grid place-items-center mb-3">
            <Gift size={26} />
          </div>
          <div className="font-bold text-lg">{t("loyalty.joinTitle")}</div>
          <p className="text-sm text-muted mt-1">{t("loyalty.joinDesc")}</p>
          {(d.joinBonus ?? 0) > 0 && (
            <p className="text-sm text-brand font-semibold mt-2">
              {t("loyalty.joinBonusInfo", { points: d.joinBonus })}
            </p>
          )}
          <button className="btn-primary mt-4" disabled={joinM.isPending} onClick={() => joinM.mutate()}>
            {joinM.isPending ? t("common.loading") : t("loyalty.join")}
          </button>
        </div>
      )}

      {/* Członek programu: treść modułu (pod-zakładki na dole, nad menu) */}
      {d?.joined && (
        <>
          {tab === "points" && (
          <div className="rounded-2xl border border-brand bg-surface p-5 mt-2">
            <div className="text-[11px] font-bold uppercase tracking-widest text-muted">{t("loyalty.balance")}</div>
            <div className="flex items-end gap-2 mt-1">
              <div className="text-4xl font-extrabold tracking-tight text-brand">{d.balance ?? 0}</div>
              <div className="text-sm text-muted mb-1.5">{t("loyalty.pointsShort")}</div>
              {d.tier && (
                <span
                  className="ml-auto rounded-full border border-line bg-surface-2 px-3 py-1 text-xs font-bold flex items-center gap-1.5"
                  style={d.tier.color ? { color: d.tier.color, borderColor: d.tier.color } : undefined}
                >
                  <Star size={12} /> {d.tier.name}
                </span>
              )}
            </div>
            {next && pct !== null && (
              <>
                <div className="h-1.5 rounded-full bg-surface-2 mt-4 overflow-hidden">
                  <div className="h-full bg-brand rounded-full" style={{ width: `${pct}%` }} />
                </div>
                <div className="text-xs text-muted mt-1.5">
                  {t("loyalty.nextTier", { name: next.name, points: next.missing })}
                </div>
              </>
            )}
          </div>
          )}

          {tab === "rewards" && (d.rewards?.length ?? 0) > 0 && (
            <>
              <div className="divide-y divide-line">
                {d.rewards!.map((r) => {
                  const pending = r.claimStatus === "pending";
                  const claimId = pending ? claimIdFor(r.name) : null;
                  return (
                    <div key={r.id} className="py-3">
                      {/* Nazwa w pełnej szerokości (zawija się) — przycisk pod spodem */}
                      <div className="flex items-start gap-3">
                        <span className="w-10 h-10 rounded-xl bg-surface-2 text-brand grid place-items-center shrink-0">
                          <Gift size={17} />
                        </span>
                        <span className="flex-1 min-w-0">
                          <span className="block font-medium text-sm">{r.name}</span>
                          <span className="block text-xs text-muted mt-0.5">
                            {r.pointsCost} {t("loyalty.pointsShort")}
                          </span>
                        </span>
                      </div>
                      {!pending && (
                        <button
                          onClick={() => claimM.mutate(r.id)}
                          disabled={!r.canAfford || claimM.isPending}
                          className="mt-2 ml-[52px] rounded-lg bg-brand text-brand-contrast text-xs font-bold px-3 py-1.5 disabled:opacity-40"
                        >
                          {t("loyalty.claim")}
                        </button>
                      )}
                      {pending && (
                        <div className="flex items-center gap-3 mt-2 ml-[52px]">
                          <span className="text-xs text-brand font-semibold">{t("loyalty.claimPending")}</span>
                          {claimId && (
                            <button
                              onClick={() => cancelM.mutate(claimId)}
                              disabled={cancelM.isPending}
                              className="text-xs text-muted underline"
                            >
                              {t("loyalty.cancelClaim")}
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </>
      )}

      {/* Pasek pod-zakładek — przyklejony na dole, nad menu dolnym (jak kategorie w Rezerwuj) */}
      {d?.joined && (
        <div className="fixed bottom-16 inset-x-0 z-10 bg-bg border-t border-line">
          <div className="max-w-md mx-auto px-4 py-2.5 flex gap-2 overflow-x-auto scrollbar-none">
            {([
              { key: "points", label: t("loyalty.tabPoints") },
              { key: "rewards", label: t("loyalty.rewards") },
            ] as const).map((m) => (
              <button
                key={m.key}
                onClick={() => setTab(m.key)}
                className={`shrink-0 rounded-lg border px-3 py-1.5 text-xs font-semibold ${tab === m.key ? "bg-brand text-brand-contrast border-brand" : "bg-surface border-line"}`}
              >
                {m.label}
              </button>
            ))}
          </div>
        </div>
      )}

      <BottomNav salonId={salonId} active="rewards" />
    </div>
  );
}
