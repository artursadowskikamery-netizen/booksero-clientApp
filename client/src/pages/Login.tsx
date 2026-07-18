import { useState } from "react";
import { useRoute, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { ChevronLeft } from "lucide-react";
import { useTranslation } from "react-i18next";
import { api } from "../lib/api";
import { setToken } from "../lib/auth";

// Logowanie klienta: telefon → kod SMS → sesja (SPEC-logowanie-klienta).
// Wymaga tenantId z danych salonu (pojawi się po wdrożeniu backendu w Booksero).
export default function Login() {
  const [, params] = useRoute("/salon/:salonId/login");
  const salonId = params?.salonId ?? "";
  const [, navigate] = useLocation();
  const { t } = useTranslation();

  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [stage, setStage] = useState<"phone" | "code">("phone");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  const salonQ = useQuery({ queryKey: ["salon", salonId], queryFn: () => api.salon(salonId), enabled: !!salonId });
  const tenantId = salonQ.data?.salon.tenantId ?? null;

  async function sendCode() {
    if (!tenantId) return;
    setErr(""); setBusy(true);
    try {
      await api.requestLoginCode(tenantId, phone.trim());
      setStage("code");
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function verify() {
    if (!tenantId) return;
    setErr(""); setBusy(true);
    try {
      const { token } = await api.verifyLoginCode(tenantId, phone.trim(), code.trim());
      setToken(token);
      navigate(`/salon/${salonId}/profile`);
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="max-w-md mx-auto min-h-screen p-4 flex flex-col">
      <header className="flex items-center gap-2 py-2">
        <button
          onClick={() => navigate(`/salon/${salonId}`)}
          className="w-9 h-9 rounded-xl border border-line grid place-items-center text-ink-2"
          aria-label={t("common.back")}
        >
          <ChevronLeft size={18} />
        </button>
        <div className="font-bold">{t("auth.title")}</div>
      </header>

      <div className="flex-1 flex flex-col justify-center pb-16">
        <h1 className="text-2xl font-extrabold tracking-tight">{t("auth.title")}</h1>
        <p className="text-sm text-muted mt-1 mb-6">{t("auth.subtitle")}</p>

        {salonQ.data && !tenantId && (
          <div className="rounded-xl bg-surface-2 p-3 text-sm text-muted mb-4">{t("common.soon")}</div>
        )}

        <label className="text-[11px] font-bold text-ink-2">{t("auth.phone")}</label>
        <input
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="+48 601 234 567"
          disabled={stage === "code"}
          className="w-full mt-1.5 mb-4 rounded-xl border border-line bg-surface-2 px-4 py-3 text-sm font-mono outline-none focus:ring-2 focus:ring-brand disabled:opacity-60"
        />

        {stage === "phone" && (
          <button className="btn-primary" disabled={!phone.trim() || !tenantId || busy} onClick={sendCode}>
            {busy ? t("common.loading") : t("auth.sendCode")}
          </button>
        )}

        {stage === "code" && (
          <>
            <label className="text-[11px] font-bold text-ink-2">{t("auth.code")}</label>
            <input
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
              className="w-full mt-1.5 mb-4 rounded-xl border border-line bg-surface-2 px-4 py-3 text-xl font-mono tracking-[0.4em] text-center outline-none focus:ring-2 focus:ring-brand"
            />
            <button className="btn-primary" disabled={code.length < 4 || busy} onClick={verify}>
              {busy ? t("common.loading") : t("auth.verify")}
            </button>
            <button className="w-full text-sm text-brand font-semibold py-3" disabled={busy} onClick={sendCode}>
              {t("auth.resend")}
            </button>
          </>
        )}

        {err && <p className="text-xs text-red-400 mt-3">{err}</p>}

        <p className="text-[11px] text-muted text-center mt-6">{t("auth.legal")}</p>
      </div>
    </div>
  );
}
