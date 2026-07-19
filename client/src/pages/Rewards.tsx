import { useEffect, useMemo, useState } from "react";
import { useRoute, useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ChevronLeft, Gift, Star, Send } from "lucide-react";
import { useTranslation } from "react-i18next";
import { api, ApiError } from "../lib/api";
import { isLoggedIn, clearToken } from "../lib/auth";
import BottomNav from "../components/BottomNav";
import type { LoyaltyState, ReferralStatus } from "@shared/types";

type Tab = "points" | "rewards" | "referrals";

// Bonusy: kontener na moduły bonusowe. Pasek pod-zakładek na dole (jak kategorie
// w Rezerwuj) zależy od suwaków tenanta (appFeatures): loyalty → Punkty/Nagrody,
// referrals → Polecaj. Każdy moduł ma własny endpoint i własną obsługę 404.
export default function Rewards() {
  const [, params] = useRoute("/salon/:salonId/rewards");
  const salonId = params?.salonId ?? "";
  const [, navigate] = useLocation();
  const { t } = useTranslation();
  const qc = useQueryClient();
  const [tab, setTab] = useState<Tab>("points");

  const logged = isLoggedIn();
  useEffect(() => {
    if (!logged) navigate(`/salon/${salonId}/login`);
  }, [logged, salonId, navigate]);

  const salonQ = useQuery({ queryKey: ["salon", salonId], queryFn: () => api.salon(salonId), enabled: !!salonId });
  const feat = salonQ.data?.appFeatures ?? {};

  const loyaltyQ = useQuery({
    queryKey: ["loyalty"], queryFn: () => api.loyalty(),
    enabled: logged && !!feat.loyalty, retry: false,
  });

  useEffect(() => {
    if (loyaltyQ.error instanceof ApiError && loyaltyQ.error.status === 401) {
      clearToken();
      navigate(`/salon/${salonId}/login`);
    }
  }, [loyaltyQ.error, salonId, navigate]);

  const invalidate = () => qc.invalidateQueries({ queryKey: ["loyalty"] });
  const joinM = useMutation({ mutationFn: () => api.loyaltyJoin(), onSuccess: invalidate });
  const claimM = useMutation({ mutationFn: (rewardId: string) => api.loyaltyClaim(rewardId), onSuccess: invalidate });
  const cancelM = useMutation({ mutationFn: (claimId: string) => api.loyaltyCancelClaim(claimId), onSuccess: invalidate });

  const d = loyaltyQ.data;
  const joined = !!d?.joined;

  const tabs = useMemo(() => {
    const list: { key: Tab; label: string }[] = [];
    if (feat.loyalty) {
      list.push({ key: "points", label: t("loyalty.tabPoints") });
      if (joined) list.push({ key: "rewards", label: t("loyalty.rewards") });
    }
    if (feat.referrals) list.push({ key: "referrals", label: t("referral.tab") });
    return list;
  }, [feat.loyalty, feat.referrals, joined, t]);

  // Aktywna zakładka zawsze wśród dostępnych.
  useEffect(() => {
    if (tabs.length && !tabs.some((x) => x.key === tab)) setTab(tabs[0].key);
  }, [tabs, tab]);

  const unavailable = !!salonQ.data && !feat.loyalty && !feat.referrals;

  return (
    <div className={`max-w-md mx-auto min-h-screen p-4 ${tabs.length > 1 ? "pb-40" : "pb-24"}`}>
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

      {(salonQ.isLoading || loyaltyQ.isLoading) && (
        <div className="p-4 text-muted">{t("common.loading")}</div>
      )}

      {unavailable && (
        <div className="flex flex-col items-center text-center gap-3 py-16">
          <div className="w-14 h-14 rounded-full bg-surface-2 text-muted grid place-items-center">
            <Gift size={26} />
          </div>
          <div className="text-sm text-muted">{t("loyalty.unavailable")}</div>
        </div>
      )}

      {/* ── PUNKTY ── */}
      {tab === "points" && feat.loyalty && d && (
        !joined ? (
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
        ) : (
          <PointsCard d={d} />
        )
      )}

      {/* ── NAGRODY ── */}
      {tab === "rewards" && feat.loyalty && joined && d && (
        <RewardsList
          d={d}
          onClaim={(id) => claimM.mutate(id)}
          onCancel={(id) => cancelM.mutate(id)}
          claimPending={claimM.isPending}
          cancelPending={cancelM.isPending}
        />
      )}

      {/* ── POLECAJ ── */}
      {tab === "referrals" && feat.referrals && <Referrals />}

      {/* Pasek pod-zakładek — przyklejony na dole, nad menu dolnym */}
      {tabs.length > 1 && (
        <div className="fixed bottom-16 inset-x-0 z-10 bg-bg border-t border-line">
          <div className="max-w-md mx-auto px-4 py-2.5 flex gap-2 overflow-x-auto scrollbar-none">
            {tabs.map((m) => (
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

// Karta punktów + poziom + pasek postępu (członek programu).
function PointsCard({ d }: { d: LoyaltyState }) {
  const { t } = useTranslation();
  const lifetime = d.lifetime ?? 0;
  const tiers = d.tiers ?? [];
  const curTier = [...tiers].filter((x) => x.minPoints <= lifetime).sort((a, b) => b.minPoints - a.minPoints)[0] ?? null;
  const next = d.nextTier ?? null;
  const base = curTier?.minPoints ?? 0;
  const pct = next ? Math.min(100, Math.round(((lifetime - base) / Math.max(next.minPoints - base, 1)) * 100)) : null;

  return (
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
  );
}

// Katalog nagród z odbiorem w salonie.
function RewardsList({
  d, onClaim, onCancel, claimPending, cancelPending,
}: {
  d: LoyaltyState;
  onClaim: (rewardId: string) => void;
  onCancel: (claimId: string) => void;
  claimPending: boolean;
  cancelPending: boolean;
}) {
  const { t } = useTranslation();
  const claimIdFor = (rewardName: string) =>
    d.pendingClaims?.find((c) => c.rewardName === rewardName)?.id ?? null;

  if ((d.rewards?.length ?? 0) === 0) {
    return <div className="text-sm text-muted py-6 text-center mt-2">{t("loyalty.rewards")}</div>;
  }
  return (
    <div className="divide-y divide-line mt-2">
      {d.rewards!.map((r) => {
        const pending = r.claimStatus === "pending";
        const claimId = pending ? claimIdFor(r.name) : null;
        return (
          <div key={r.id} className="py-3">
            <div className="flex items-start gap-3">
              <span className="w-10 h-10 rounded-xl bg-surface-2 text-brand grid place-items-center shrink-0">
                <Gift size={17} />
              </span>
              <span className="flex-1 min-w-0">
                <span className="block font-medium text-sm">{r.name}</span>
                <span className="block text-xs text-muted mt-0.5">{r.pointsCost} {t("loyalty.pointsShort")}</span>
              </span>
            </div>
            {!pending && (
              <button
                onClick={() => onClaim(r.id)}
                disabled={!r.canAfford || claimPending}
                className="mt-2 ml-[52px] rounded-lg bg-brand text-brand-contrast text-xs font-bold px-3 py-1.5 disabled:opacity-40"
              >
                {t("loyalty.claim")}
              </button>
            )}
            {pending && (
              <div className="flex items-center gap-3 mt-2 ml-[52px]">
                <span className="text-xs text-brand font-semibold">{t("loyalty.claimPending")}</span>
                {claimId && (
                  <button onClick={() => onCancel(claimId)} disabled={cancelPending} className="text-xs text-muted underline">
                    {t("loyalty.cancelClaim")}
                  </button>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// Pod-zakładka „Polecaj": formularz + statusy poleceń.
function Referrals() {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const [phone, setPhone] = useState("");
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");

  const q = useQuery({ queryKey: ["referrals"], queryFn: () => api.referrals(), retry: false });

  const sendM = useMutation({
    mutationFn: () => api.sendReferral(phone.trim()),
    onSuccess: () => {
      setMsg(t("referral.ok"));
      setErr("");
      setPhone("");
      qc.invalidateQueries({ queryKey: ["referrals"] });
    },
    onError: (e) => { setErr((e as Error).message); setMsg(""); },
  });

  const statusLabel = (s: ReferralStatus) =>
    s === "rewarded" ? t("referral.rewarded")
      : s === "joined" ? t("referral.joined")
      : s === "expired" ? t("referral.expired")
      : t("referral.sent");

  const d = q.data;

  return (
    <div className="mt-2">
      <div className="rounded-2xl border border-brand bg-surface p-5">
        <div className="font-bold text-lg">{t("referral.title")}</div>
        <p className="text-sm text-muted mt-1 mb-3">{t("referral.desc")}</p>
        <label className="text-[11px] font-bold text-ink-2">{t("referral.phone")}</label>
        <input
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="+48 601 234 567"
          className="w-full mt-1.5 mb-3 rounded-xl border border-line bg-surface-2 px-4 py-3 text-sm font-mono outline-none focus:ring-2 focus:ring-brand"
        />
        <button
          className="btn-primary flex items-center justify-center gap-2"
          disabled={!phone.trim() || sendM.isPending}
          onClick={() => sendM.mutate()}
        >
          <Send size={16} /> {sendM.isPending ? t("common.loading") : t("referral.send")}
        </button>
        {msg && <p className="text-xs text-brand font-semibold mt-3">{msg}</p>}
        {err && <p className="text-xs text-red-400 mt-3">{err}</p>}
        {d && (
          <p className="text-xs text-muted mt-3">
            {t("referral.counter", { sent: d.sentThisMonth, limit: d.monthlyLimit })}
          </p>
        )}
      </div>

      {d && d.items.length === 0 && (
        <div className="text-sm text-muted text-center py-6">{t("referral.none")}</div>
      )}
      {d && d.items.length > 0 && (
        <div className="divide-y divide-line mt-4">
          {d.items.map((it) => (
            <div key={it.id} className="flex items-center gap-3 py-3">
              <span className="flex-1 min-w-0">
                <span className="block text-sm font-mono">{it.phoneMasked}</span>
              </span>
              <span
                className={`text-xs font-semibold ${it.status === "rewarded" ? "text-brand" : it.status === "expired" ? "text-muted" : "text-ink-2"}`}
              >
                {statusLabel(it.status)}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
