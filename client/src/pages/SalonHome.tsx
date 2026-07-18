import { useQuery } from "@tanstack/react-query";
import { useRoute } from "wouter";
import { Camera, Users } from "lucide-react";
import { useTranslation } from "react-i18next";
import { api } from "../lib/api";

// Ekran główny salonu: galeria zdjęć (ukryta gdy brak), CTA (pojedyncza + para),
// usługi. Marka tenanta = logo + nazwa; akcent zawsze #0071e3.
export default function SalonHome() {
  const [, params] = useRoute("/salon/:salonId");
  const salonId = params?.salonId ?? "";
  const { t } = useTranslation();

  const salonQ = useQuery({
    queryKey: ["salon", salonId],
    queryFn: () => api.salon(salonId),
    enabled: !!salonId,
  });
  const servicesQ = useQuery({
    queryKey: ["services", salonId],
    queryFn: () => api.services(salonId),
    enabled: !!salonId,
  });

  if (salonQ.isLoading) return <div className="p-6 text-muted">{t("common.loading")}</div>;
  if (salonQ.isError)
    return <div className="p-6 text-red-600 text-sm">{(salonQ.error as Error).message}</div>;

  const s = salonQ.data!;
  const gallery = [s.profile?.coverImage, ...(s.profile?.gallery ?? [])].filter(Boolean) as string[];

  return (
    <div className="max-w-md mx-auto p-4">
      <header className="flex items-center gap-3 py-2">
        {s.salon.logo && (
          <img src={s.salon.logo} alt="" className="w-9 h-9 rounded-xl object-cover" />
        )}
        <div>
          <div className="font-bold leading-tight">{s.salon.name}</div>
          <div className="text-xs text-muted">
            {[s.salon.city, s.salon.address].filter(Boolean).join(" · ")}
          </div>
        </div>
      </header>

      {/* Galeria — renderujemy tylko gdy jest co najmniej jedno zdjęcie */}
      {gallery.length > 0 && (
        <div className="relative">
          <div className="flex gap-2 overflow-x-auto -mx-4 px-4 my-3 snap-x snap-mandatory">
            {gallery.slice(0, 5).map((src, i) => (
              <img
                key={i}
                src={src}
                alt=""
                loading="lazy"
                className="h-40 rounded-xl object-cover snap-center shrink-0"
                style={{ minWidth: "calc(100% - 42px)" }}
              />
            ))}
          </div>
          <span className="absolute top-3 right-2 flex items-center gap-1 rounded-full bg-black/55 text-white text-[11px] font-bold px-2 py-1">
            <Camera size={12} /> {Math.min(gallery.length, 5)}
          </span>
        </div>
      )}

      <div className="mt-2">
        <div className="font-semibold">{t("welcome.title", { defaultValue: "Zadbaj o siebie" })}</div>
        <button className="w-full rounded-xl bg-brand text-brand-contrast font-bold py-3.5 mt-2">
          {t("common.book")}
        </button>
        <button className="w-full rounded-xl bg-surface-2 text-brand font-bold py-3 mt-2 ring-1 ring-inset ring-brand flex items-center justify-center gap-2">
          <Users size={16} /> {t("common.bookCouple")}
        </button>
      </div>

      <h2 className="text-[11px] font-bold uppercase tracking-wider text-muted mt-5 mb-1">
        {t("common.services")}
      </h2>
      <div className="divide-y divide-line">
        {(servicesQ.data ?? []).map((svc) => (
          <div key={svc.id} className="flex items-center py-3">
            <div className="flex-1">
              <div className="font-medium text-sm">{svc.name}</div>
              <div className="text-xs text-muted">{svc.durationMinutes} min</div>
            </div>
            <div className="font-bold text-sm text-brand whitespace-nowrap">
              {svc.price} {s.salon.currency}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
