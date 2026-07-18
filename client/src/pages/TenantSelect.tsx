import { useEffect, useState } from "react";
import { useRoute, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { MapPin, ChevronLeft, ChevronRight } from "lucide-react";
import { useTranslation } from "react-i18next";
import { api } from "../lib/api";
import { applyAccent } from "../lib/themes";

// Wejście tenanta: kraj → miasto → salon → (kalendarz). Poziomy z jedną opcją
// są zwijane automatycznie. Wymaga endpointu /api/public/tenant/:tenantId (§8.1).
export default function TenantSelect() {
  const [, params] = useRoute("/t/:tenantId");
  const tenantId = params?.tenantId ?? "";
  const [, navigate] = useLocation();
  const { t, i18n } = useTranslation();

  const [country, setCountry] = useState<string | null>(null);
  const [city, setCity] = useState<string | null>(null);

  const tQ = useQuery({
    queryKey: ["tenant", tenantId],
    queryFn: () => api.tenant(tenantId),
    enabled: !!tenantId,
  });

  // Ekran wyboru sieci/miasta — neutralny akcent (kolor salonu dopiero po wyborze).
  useEffect(() => {
    applyAccent(null);
  }, []);

  const tenant = tQ.data;
  const countries = tenant?.countries ?? [];
  const activeCountry = country ?? (countries.length === 1 ? countries[0].country : null);
  const countryObj = countries.find((c) => c.country === activeCountry) ?? null;
  const cities = countryObj?.cities ?? [];
  const activeCity = city ?? (cities.length === 1 ? cities[0].city : null);
  const cityObj = cities.find((c) => c.city === activeCity) ?? null;
  const salons = cityObj?.salons ?? [];

  // Jeśli w wybranym mieście jest jeden salon — od razu do kalendarza.
  useEffect(() => {
    if (cityObj && salons.length === 1) navigate(`/salon/${salons[0].id}`);
  }, [cityObj, salons, navigate]);

  if (tQ.isLoading) return <div className="p-6 text-muted">{t("common.loading")}</div>;
  if (tQ.isError) return <div className="p-6 text-red-600 text-sm">{(tQ.error as Error).message}</div>;
  if (!tenant) return null;

  const countryName = (code: string) => {
    try {
      return new Intl.DisplayNames([i18n.language], { type: "region" }).of(code) || code;
    } catch {
      return code;
    }
  };
  const countInCountry = (co: (typeof countries)[number]) =>
    co.cities.reduce((n, ci) => n + ci.salons.length, 0);

  const showBack = (activeCity && cities.length > 1) || (activeCountry && countries.length > 1);
  const goBack = () => {
    if (city || (activeCity && cities.length > 1)) setCity(null);
    else setCountry(null);
  };

  return (
    <div className="max-w-md mx-auto p-4">
      <header className="flex items-center gap-3 py-2">
        {showBack && (
          <button onClick={goBack} className="w-9 h-9 rounded-xl border border-line grid place-items-center text-ink-2" aria-label={t("common.back")}>
            <ChevronLeft size={18} />
          </button>
        )}
        {tenant.logo && <img src={tenant.logo} alt="" className="w-9 h-9 rounded-xl object-cover" />}
        <div className="font-bold">{tenant.name}</div>
      </header>

      {/* Krok: kraj */}
      {!activeCountry && (
        <>
          <h2 className="text-[11px] font-bold uppercase tracking-wider text-muted mt-2 mb-2">{t("common.chooseCountry")}</h2>
          <div className="grid grid-cols-2 gap-2">
            {countries.map((c) => (
              <button key={c.country} onClick={() => setCountry(c.country)} className="text-left rounded-xl border border-line bg-surface p-3">
                <MapPin size={18} className="text-brand mb-2" />
                <div className="font-bold">{countryName(c.country)}</div>
                <div className="text-xs text-muted">{countInCountry(c)}</div>
              </button>
            ))}
          </div>
        </>
      )}

      {/* Krok: miasto */}
      {activeCountry && !activeCity && (
        <>
          <h2 className="text-[11px] font-bold uppercase tracking-wider text-muted mt-2 mb-2">{t("common.chooseCity")}</h2>
          <div className="grid grid-cols-2 gap-2">
            {cities.map((ci) => (
              <button key={ci.city} onClick={() => setCity(ci.city)} className="text-left rounded-xl border border-line bg-surface p-3">
                <MapPin size={18} className="text-brand mb-2" />
                <div className="font-bold">{ci.city}</div>
                <div className="text-xs text-muted">{ci.salons.length}</div>
              </button>
            ))}
          </div>
        </>
      )}

      {/* Krok: salon (gdy w mieście jest kilka) */}
      {activeCity && salons.length > 1 && (
        <>
          <h2 className="text-[11px] font-bold uppercase tracking-wider text-muted mt-2 mb-2">{t("common.chooseSalon")}</h2>
          <div className="divide-y divide-line">
            {salons.map((s) => (
              <button key={s.id} onClick={() => navigate(`/salon/${s.id}`)} className="w-full flex items-center gap-3 text-left py-3">
                <MapPin size={18} className="text-brand shrink-0" />
                <div className="flex-1">
                  <div className="font-medium text-sm">{s.name}</div>
                  {s.address && <div className="text-xs text-muted">{s.address}</div>}
                </div>
                <ChevronRight size={16} className="text-muted" />
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
