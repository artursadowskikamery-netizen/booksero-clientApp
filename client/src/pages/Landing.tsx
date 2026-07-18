import { useState } from "react";
import { useLocation } from "wouter";
import { useTranslation } from "react-i18next";

// Faza 1 · szkielet — deweloperskie wejście po salonId.
// Docelowo: zimny start (link/QR/kod/nazwa tenanta) → kraj → miasto → salon.
export default function Landing() {
  const [, navigate] = useLocation();
  const [salonId, setSalonId] = useState("");
  const { t } = useTranslation();

  return (
    <div className="min-h-full flex flex-col items-center justify-center gap-4 p-6 text-center">
      <div className="text-3xl font-extrabold tracking-tight">
        Book<span className="text-brand">Sero</span>
      </div>
      <p className="text-muted text-sm max-w-xs">{t("welcome.subtitle")}</p>

      <input
        value={salonId}
        onChange={(e) => setSalonId(e.target.value.trim())}
        placeholder="salonId (UUID)"
        className="w-full max-w-xs rounded-xl border border-line bg-surface-2 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-brand"
        aria-label="salonId"
      />
      <button
        onClick={() => salonId && navigate(`/salon/${salonId}`)}
        disabled={!salonId}
        className="w-full max-w-xs rounded-xl bg-brand text-brand-contrast font-bold py-3 disabled:opacity-40"
      >
        {t("welcome.start")}
      </button>

      <p className="text-[11px] text-muted max-w-xs">
        Faza 1 · szkielet — wejście deweloperskie. Docelowo link/QR/kod lub wyszukiwarka nazwy tenanta.
      </p>
    </div>
  );
}
