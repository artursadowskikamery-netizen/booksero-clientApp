import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Check, ChevronRight, MapPin, Plus, X } from "lucide-react";
import { useTranslation } from "react-i18next";
import { api } from "../lib/api";
import { listSessions } from "../lib/auth";
import { loadRecentSalons } from "../lib/recentSalons";

// „Moje salony” — przełącznik pod nazwą salonu w nagłówku. Klientka z kilkoma
// salonami przechodzi między nimi jednym stuknięciem, BEZ wylogowania: sesja
// do każdej firmy, w której raz weszła, jest zapamiętana (lib/auth.ts), a
// isLoggedInFor przełącza ją przy wejściu w salon. Wcześniej jedyną drogą do
// ekranu startowego było „Wyloguj”, które kasuje sesje WSZYSTKICH firm — stąd
// ponowne SMS-y przy każdej zmianie salonu.
//
// Lista = ostatnio odwiedzane salony + firmy z zapamiętaną sesją, których
// żaden salon nie jest na tej liście (wejście przez /t/…). „Dodaj salon”
// prowadzi na ekran startowy (QR, nazwa, numer) — bez wylogowania. Firma
// z kilkoma lokalizacjami ma też wiersz „Wszystkie lokalizacje” (/t/…) —
// dotąd prowadziła tam zakładka „Salon”, którą teraz zajmuje to okno.
function mojeSalony() {
  const recent = loadRecentSalons();
  const firmyZSalonem = new Set(recent.map((r) => r.tenantId).filter(Boolean));
  const firmyBezSalonu = listSessions().filter((s) => !firmyZSalonem.has(s.tenantId));
  return { recent, firmyBezSalonu };
}

// Czy klientka ma więcej niż jeden salon — wtedy zakładka „Salon” otwiera
// to okno zamiast prowadzić prosto do salonu.
export function maWieleSalonow(): boolean {
  const { recent, firmyBezSalonu } = mojeSalony();
  return recent.length + firmyBezSalonu.length > 1;
}

export default function MySalons({
  currentSalonId,
  tenantId,
  onClose,
}: {
  currentSalonId: string;
  tenantId?: string | null;
  onClose: () => void;
}) {
  const [, navigate] = useLocation();
  const { t } = useTranslation();
  const { recent, firmyBezSalonu } = mojeSalony();
  const tenantQ = useQuery({ queryKey: ["tenant", tenantId], queryFn: () => api.tenant(tenantId!), enabled: !!tenantId });
  const lokalizacji = (tenantQ.data?.countries ?? []).reduce(
    (n, co) => n + co.cities.reduce((m, ci) => m + ci.salons.length, 0),
    0,
  );

  const go = (to: string) => {
    onClose();
    navigate(to);
  };

  return (
    <div
      className="fixed inset-0 z-30 bg-black/60 flex items-end sm:items-center justify-center p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="w-full max-w-sm rounded-2xl bg-surface border border-line p-4 max-h-[80vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center mb-3">
          <div className="font-bold text-lg">{t("common.mySalons")}</div>
          <button onClick={onClose} className="ml-auto p-1 text-muted" aria-label={t("common.back")}>
            <X size={18} />
          </button>
        </div>

        <div className="rounded-2xl border border-line divide-y divide-line overflow-hidden">
          {recent.map((s) => {
            const tu = s.id === currentSalonId;
            return (
              <button
                key={s.id}
                onClick={() => {
                  if (tu) return onClose();
                  void api.entryEvent("recent", { salonId: s.id });
                  go(`/salon/${s.id}`);
                }}
                className="w-full flex items-center gap-3 p-3 text-left"
              >
                {s.logo ? (
                  <img src={s.logo} alt="" className="w-9 h-9 rounded-xl object-cover shrink-0" />
                ) : (
                  <span className="w-9 h-9 rounded-xl bg-brand text-brand-contrast grid place-items-center font-extrabold shrink-0">
                    {Array.from(s.name.trim())[0]?.toUpperCase() || "S"}
                  </span>
                )}
                <span className="flex-1 min-w-0">
                  <span className="block text-sm font-bold truncate">{s.name}</span>
                  {s.city && <span className="block text-xs text-muted truncate">{s.city}</span>}
                </span>
                {tu ? <Check size={16} className="text-brand shrink-0" /> : <ChevronRight size={16} className="text-muted shrink-0" />}
              </button>
            );
          })}
          {firmyBezSalonu.map((f) => (
            <button
              key={f.tenantId}
              onClick={() => go(`/t/${f.tenantId}`)}
              className="w-full flex items-center gap-3 p-3 text-left"
            >
              <span className="w-9 h-9 rounded-xl bg-surface-2 border border-line grid place-items-center font-extrabold shrink-0">
                {Array.from((f.name || "?").trim())[0]?.toUpperCase() || "?"}
              </span>
              <span className="flex-1 min-w-0 text-sm font-bold truncate">{f.name || f.tenantId}</span>
              <ChevronRight size={16} className="text-muted shrink-0" />
            </button>
          ))}
        </div>

        {tenantId && lokalizacji > 1 && (
          <button
            onClick={() => go(`/t/${tenantId}`)}
            className="w-full mt-3 flex items-center gap-3 rounded-xl border border-line p-3 text-left"
          >
            <MapPin size={18} className="text-brand shrink-0" />
            <span className="flex-1 min-w-0 text-sm font-bold truncate">
              {t("common.allLocations")}{tenantQ.data?.name ? ` · ${tenantQ.data.name}` : ""}
            </span>
            <ChevronRight size={16} className="text-muted shrink-0" />
          </button>
        )}

        <button
          onClick={() => go("/")}
          className="w-full mt-3 flex items-center justify-center gap-2 rounded-xl bg-surface-2 text-ink font-semibold py-3"
        >
          <Plus size={16} /> {t("common.addSalon")}
        </button>
      </div>
    </div>
  );
}
