import { useState } from "react";
import { useLocation } from "wouter";
import { useTranslation } from "react-i18next";
import { QrCode, Search } from "lucide-react";
import { api } from "../lib/api";
import { SUPPORTED_LANGS, LANG_LABELS } from "../lib/i18n";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Zimny start jak w prototypie: QR (wkrótce) + wpisanie slug/UUID/t:<tenantId>.
export default function Landing() {
  const [, navigate] = useLocation();
  const [value, setValue] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const { t, i18n } = useTranslation();

  async function go() {
    const v = value.trim();
    if (!v) return;
    setMsg("");
    if (v.toLowerCase().startsWith("t:")) {
      navigate(`/t/${v.slice(2)}`);
      return;
    }
    if (/^ML\d+$/i.test(v)) {
      setMsg(t("landing.mlNotSupported"));
      return;
    }
    if (UUID_RE.test(v)) {
      navigate(`/salon/${v}`);
      return;
    }
    setBusy(true);
    try {
      const { salonId } = await api.resolveSlug(v.toLowerCase());
      navigate(`/salon/${salonId}`);
    } catch (e) {
      setMsg((e as Error).message || t("landing.notFound"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="max-w-md mx-auto min-h-screen p-6 flex flex-col">
      {/* Nagłówek BookSero + język */}
      <div className="flex items-center gap-2 pt-1">
        <div className="w-9 h-9 rounded-xl bg-brand text-brand-contrast grid place-items-center font-extrabold text-lg">b</div>
        <div className="text-lg font-extrabold tracking-tight">
          Book<span className="text-brand">Sero</span>
        </div>
        <select
          value={(i18n.language || "pl").slice(0, 2)}
          onChange={(e) => i18n.changeLanguage(e.target.value)}
          className="ml-auto rounded-lg border border-line bg-surface-2 px-2.5 py-1.5 text-xs text-ink"
          aria-label="Język"
        >
          {SUPPORTED_LANGS.map((l) => (
            <option key={l} value={l}>{LANG_LABELS[l]}</option>
          ))}
        </select>
      </div>

      <h1 className="text-2xl font-extrabold tracking-tight mt-8">{t("landing.title")}</h1>
      <p className="text-sm text-muted mt-1 mb-5">{t("landing.scanHint")}</p>

      <button className="btn-primary flex items-center justify-center gap-2" onClick={() => setMsg(t("landing.qrSoon"))}>
        <QrCode size={17} /> {t("landing.qr")}
      </button>

      <div className="flex items-center gap-3 my-5">
        <span className="flex-1 h-px bg-line" />
        <span className="text-[11px] text-muted">{t("landing.or")}</span>
        <span className="flex-1 h-px bg-line" />
      </div>

      <label className="text-[11px] font-bold text-ink-2">{t("landing.codeLabel")}</label>
      <div className="relative mt-1.5">
        <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
        <input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && go()}
          placeholder={t("landing.placeholder")}
          className="w-full rounded-xl border border-line bg-surface-2 pl-9 pr-4 py-3 text-sm text-ink outline-none focus:ring-2 focus:ring-brand"
          aria-label={t("landing.codeLabel")}
        />
      </div>
      <button onClick={go} disabled={!value.trim() || busy} className="btn-primary mt-3">
        {busy ? t("common.loading") : t("welcome.start")}
      </button>

      {msg && <p className="text-xs text-red-400 mt-3">{msg}</p>}

      <p className="mt-auto pt-6 text-[11px] text-muted text-center">{t("landing.privacyNote")}</p>
    </div>
  );
}
