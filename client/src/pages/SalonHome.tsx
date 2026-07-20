import { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRoute, useLocation } from "wouter";
import { Camera, Users, Bell, Sparkles, Clock } from "lucide-react";
import { useTranslation } from "react-i18next";
import { api } from "../lib/api";
import { applyAccent, saveAccent } from "../lib/themes";
import { isLoggedInFor } from "../lib/auth";
import { saveLastSalon } from "../lib/lastSalon";
import { promoLine } from "../lib/promo";
import BottomNav from "../components/BottomNav";

// Ekran główny salonu w stylu prototypu: appbar (logo+nazwa+dzwonek), galeria
// (ukryta gdy brak zdjęć) z licznikiem i kropkami, CTA, usługi, zespół.
export default function SalonHome() {
  const [, params] = useRoute("/salon/:salonId");
  const salonId = params?.salonId ?? "";
  const [, navigate] = useLocation();
  const { t, i18n } = useTranslation();
  const [dot, setDot] = useState(0);
  const stripRef = useRef<HTMLDivElement>(null);

  const salonQ = useQuery({ queryKey: ["salon", salonId], queryFn: () => api.salon(salonId), enabled: !!salonId });
  const servicesQ = useQuery({ queryKey: ["services", salonId], queryFn: () => api.services(salonId), enabled: !!salonId });
  const teamQ = useQuery({ queryKey: ["team", salonId], queryFn: () => api.team(salonId), enabled: !!salonId });

  // Szata: zawsze ciemna; kolor akcentu (guziki) per salon z profilu Booksero.
  const accent = salonQ.data?.profile?.appAccent ?? null;
  useEffect(() => {
    if (salonQ.data) {
      applyAccent(accent);
      saveAccent(accent);
      saveLastSalon(salonId);
    }
  }, [salonQ.data, accent, salonId]);

  // Salon tylko dla zalogowanych: bez sesji SMS w tej sieci → ekran logowania.
  const tenantId = salonQ.data?.salon.tenantId ?? null;
  const gated = !!salonQ.data && !!tenantId && !isLoggedInFor(tenantId);
  useEffect(() => {
    if (gated) navigate(`/salon/${salonId}/login`);
  }, [gated, salonId, navigate]);

  if (gated) return null;
  if (salonQ.isLoading) return <div className="p-6 text-muted">{t("common.loading")}</div>;
  if (salonQ.isError)
    return <div className="p-6 text-red-500 text-sm">{(salonQ.error as Error).message}</div>;

  const s = salonQ.data!;
  const gallery = [s.profile?.coverImage, ...(s.profile?.gallery ?? [])].filter(Boolean) as string[];
  const shown = gallery.slice(0, 5);

  const onStripScroll = () => {
    const el = stripRef.current;
    if (!el) return;
    const w = Math.max(el.clientWidth - 42, 1);
    setDot(Math.min(Math.round(el.scrollLeft / w), shown.length - 1));
  };

  const initials = (name: string) =>
    name.split(" ").filter(Boolean).slice(0, 2).map((p) => p[0]?.toUpperCase()).join("");

  return (
    <div className="max-w-md mx-auto min-h-screen p-4 pb-24">
      {/* Appbar */}
      <header className="flex items-center gap-3 py-2">
        {s.salon.logo ? (
          <img src={s.salon.logo} alt="" className="w-10 h-10 rounded-xl object-cover" />
        ) : (
          <div className="w-10 h-10 rounded-xl bg-brand text-brand-contrast grid place-items-center font-extrabold">
            {initials(s.salon.name) || "S"}
          </div>
        )}
        <div className="min-w-0">
          <div className="font-bold leading-tight truncate">{s.salon.name}</div>
          <div className="text-xs text-muted truncate">
            {[s.salon.city, s.salon.address].filter(Boolean).join(" · ")}
          </div>
        </div>
        <button
          onClick={() => navigate(`/salon/${salonId}/soon`)}
          className="ml-auto w-9 h-9 rounded-xl border border-line grid place-items-center text-ink-2"
          aria-label={t("tabs.profile")}
        >
          <Bell size={17} />
        </button>
      </header>

      {/* Galeria — tylko gdy są zdjęcia */}
      {shown.length > 0 && (
        <>
          <div className="relative">
            <div
              ref={stripRef}
              onScroll={onStripScroll}
              className="flex gap-2 overflow-x-auto -mx-4 px-4 mt-2 snap-x snap-mandatory scrollbar-none"
            >
              {shown.map((src, i) => (
                <img
                  key={i}
                  src={src}
                  alt=""
                  loading="lazy"
                  className="h-40 rounded-2xl object-cover snap-center shrink-0"
                  style={{ minWidth: "calc(100% - 42px)" }}
                />
              ))}
            </div>
            <span className="absolute top-2.5 right-1 flex items-center gap-1 rounded-full bg-black/55 text-white text-[11px] font-bold px-2 py-1">
              <Camera size={12} /> {shown.length}
            </span>
          </div>
          {shown.length > 1 && (
            <div className="flex justify-center gap-1.5 mt-2.5">
              {shown.map((_, i) => (
                <span
                  key={i}
                  className={`h-1.5 rounded-full transition-all ${i === dot ? "w-4 bg-brand" : "w-1.5 bg-line"}`}
                />
              ))}
            </div>
          )}
        </>
      )}

      {/* Baner promocji czasowych — zajawka happy hours z CTA do rezerwacji */}
      {(s.promotions?.length ?? 0) > 0 && (
        <button
          onClick={() => navigate(`/salon/${salonId}/book`)}
          className="w-full text-left rounded-2xl border border-brand bg-surface p-4 mt-4 flex items-center gap-3"
        >
          <span className="w-10 h-10 rounded-xl bg-brand text-brand-contrast grid place-items-center shrink-0">
            <Clock size={18} />
          </span>
          <span className="flex-1 min-w-0">
            <span className="block text-[11px] font-bold uppercase tracking-widest text-muted">{t("promo.bannerTitle")}</span>
            <span className="block text-sm font-semibold text-brand truncate">
              {promoLine(s.promotions![0], s.salon.currency, i18n.language)}
            </span>
          </span>
          <span className="text-xs font-bold text-brand shrink-0">{t("promo.cta")}</span>
        </button>
      )}

      {/* CTA */}
      <div className="mt-4">
        <div className="font-bold text-lg leading-tight">{t("salon.selfcare")}</div>
        <div className="text-sm text-muted mb-3">{t("salon.subtitle")}</div>
        <button onClick={() => navigate(`/salon/${salonId}/book`)} className="btn-primary">
          {t("common.book")}
        </button>
        <button
          onClick={() => navigate(`/salon/${salonId}/book?couple=1`)}
          className="w-full rounded-xl bg-surface text-brand font-bold py-3 mt-2 ring-1 ring-inset ring-brand flex items-center justify-center gap-2"
        >
          <Users size={16} /> {t("common.bookCouple")}
        </button>
      </div>

      {/* Usługi */}
      <h2 className="text-[11px] font-bold uppercase tracking-widest text-muted mt-6 mb-1">
        {t("common.services")}
      </h2>
      {/* Skrót cennika (5 pozycji) — pełna lista z wyszukiwarką w "Rezerwuj" */}
      <div className="divide-y divide-line">
        {(servicesQ.data ?? []).slice(0, 5).map((svc) => (
          <button
            key={svc.id}
            onClick={() => navigate(`/salon/${salonId}/book`)}
            className="w-full flex items-center gap-3 text-left py-3"
          >
            <span className="w-10 h-10 rounded-xl bg-surface-2 text-brand grid place-items-center shrink-0">
              <Sparkles size={17} />
            </span>
            <span className="flex-1 min-w-0">
              <span className="block font-medium text-sm truncate">{svc.name}</span>
              <span className="block text-xs text-muted">{svc.durationMinutes} min</span>
            </span>
            <span className="font-bold text-sm text-brand whitespace-nowrap">
              {svc.price} {s.salon.currency}
            </span>
          </button>
        ))}
      </div>
      {(servicesQ.data?.length ?? 0) > 5 && (
        <button
          onClick={() => navigate(`/salon/${salonId}/book`)}
          className="w-full rounded-xl bg-surface text-brand font-bold py-3 mt-2 ring-1 ring-inset ring-line"
        >
          {t("salon.allServices", { count: servicesQ.data!.length })}
        </button>
      )}

      {/* Zespół */}
      {(teamQ.data?.length ?? 0) > 0 && (
        <>
          <h2 className="text-[11px] font-bold uppercase tracking-widest text-muted mt-6 mb-2">
            {t("common.team")}
          </h2>
          <div className="flex gap-3 overflow-x-auto pb-1">
            {(teamQ.data ?? []).map((m) => {
              const name = m.displayName || `${m.firstName} ${m.lastName ?? ""}`.trim();
              return (
                <div key={m.id} className="w-14 text-center shrink-0">
                  {m.avatar ? (
                    <img src={m.avatar} alt="" className="w-14 h-14 rounded-full object-cover mb-1" />
                  ) : (
                    <div className="w-14 h-14 rounded-full bg-surface-2 border border-line grid place-items-center font-bold text-ink-2 mb-1">
                      {initials(name)}
                    </div>
                  )}
                  <div className="text-[11px] text-ink-2 truncate">{name.split(" ")[0]}</div>
                </div>
              );
            })}
          </div>
        </>
      )}

      <BottomNav salonId={salonId} active="salon" />
    </div>
  );
}
