import { useState } from "react";
import { useLocation } from "wouter";
import { useTranslation } from "react-i18next";
import { api } from "../lib/api";
import { SUPPORTED_LANGS, LANG_LABELS } from "../lib/i18n";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Faza 1 · szkielet — deweloperskie wejście po UUID salonu lub slugu wizytówki.
// Docelowo: zimny start (link/QR/kod/nazwa tenanta) → kraj → miasto → salon.
export default function Landing() {
  const [, navigate] = useLocation();
  const [value, setValue] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const { t, i18n } = useTranslation();

  async function go() {
    const v = value.trim();
    if (!v) return;
    setErr("");
    if (/^ML\d+$/i.test(v)) {
      setErr(t("landing.mlNotSupported"));
      return;
    }
    if (UUID_RE.test(v)) {
      navigate(`/salon/${v}`);
      return;
    }
    // Traktuj jako slug wizytówki → rozwiąż na UUID.
    setBusy(true);
    try {
      const { salonId } = await api.resolveSlug(v.toLowerCase());
      navigate(`/salon/${salonId}`);
    } catch (e) {
      setErr((e as Error).message || t("landing.notFound"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-full flex flex-col items-center justify-center gap-4 p-6 text-center">
      <div className="text-3xl font-extrabold tracking-tight">
        Book<span className="text-brand">Sero</span>
      </div>
      <p className="text-muted text-sm max-w-xs">{t("welcome.subtitle")}</p>

      <select
        value={(i18n.language || "pl").slice(0, 2)}
        onChange={(e) => i18n.changeLanguage(e.target.value)}
        className="rounded-lg border border-line bg-surface-2 px-3 py-2 text-sm"
        aria-label="Język"
      >
        {SUPPORTED_LANGS.map((l) => (
          <option key={l} value={l}>{LANG_LABELS[l]}</option>
        ))}
      </select>

      <input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && go()}
        placeholder={t("landing.placeholder")}
        className="w-full max-w-xs rounded-xl border border-line bg-surface-2 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-brand"
        aria-label="UUID lub slug"
      />
      <button
        onClick={go}
        disabled={!value.trim() || busy}
        className="w-full max-w-xs rounded-xl bg-brand text-brand-contrast font-bold py-3 disabled:opacity-40"
      >
        {busy ? t("common.loading") : t("welcome.start")}
      </button>

      {err && <p className="text-xs text-red-600 max-w-xs">{err}</p>}

      <p className="text-[11px] text-muted max-w-xs">
        Faza 1 · wejście deweloperskie. Slug znajdziesz w adresie wizytówki salonu
        (…/s/<b>slug</b>). Docelowo: link/QR/kod lub wyszukiwarka tenanta.
      </p>
    </div>
  );
}
