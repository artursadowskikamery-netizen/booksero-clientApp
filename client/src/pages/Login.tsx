import { useEffect, useState } from "react";
import { useRoute, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { ChevronLeft } from "lucide-react";
import { useTranslation } from "react-i18next";
import { api, ApiError } from "../lib/api";
import { setToken, isLoggedInFor } from "../lib/auth";

// Logowanie klienta: telefon → kod SMS → sesja (SPEC-logowanie-klienta).
// Nowy numer: po poprawnym kodzie backend prosi o imię (422) i tworzy konto
// klienta w tym salonie (SPEC-auto-rejestracja).
export default function Login() {
  const [, params] = useRoute("/salon/:salonId/login");
  const salonId = params?.salonId ?? "";
  const [, navigate] = useLocation();
  const { t } = useTranslation();

  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [stage, setStage] = useState<"phone" | "code" | "name">("phone");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  const salonQ = useQuery({ queryKey: ["salon", salonId], queryFn: () => api.salon(salonId), enabled: !!salonId });
  const tenantId = salonQ.data?.salon.tenantId ?? null;

  // Już zalogowany w tej sieci → od razu do salonu.
  useEffect(() => {
    if (salonQ.data && tenantId && isLoggedInFor(tenantId)) navigate(`/salon/${salonId}`);
  }, [salonQ.data, tenantId, salonId, navigate]);

  async function sendCode() {
    if (!tenantId) return;
    setErr(""); setBusy(true);
    try {
      await api.requestLoginCode(tenantId, phone.trim(), salonId);
      setStage("code");
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function verify(withName: boolean) {
    if (!tenantId) return;
    setErr(""); setBusy(true);
    try {
      const { token } = await api.verifyLoginCode(
        tenantId,
        phone.trim(),
        code.trim(),
        salonId,
        withName ? { firstName: firstName.trim(), lastName: lastName.trim() || undefined } : undefined,
      );
      setToken(token, tenantId);
      navigate(`/salon/${salonId}`);
    } catch (e) {
      // 422 = kod poprawny, ale numer jest nowy — potrzebne imię (auto-rejestracja).
      if (e instanceof ApiError && e.status === 422) setStage("name");
      else setErr((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="max-w-md mx-auto min-h-screen p-4 flex flex-col">
      <header className="flex items-center gap-2 py-2">
        <button
          onClick={() => navigate("/")}
          className="w-9 h-9 rounded-xl border border-line grid place-items-center text-ink-2"
          aria-label={t("common.back")}
        >
          <ChevronLeft size={18} />
        </button>
        <div className="font-bold">{salonQ.data?.salon.name ?? t("auth.title")}</div>
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
          disabled={stage !== "phone"}
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
            <button className="btn-primary" disabled={code.length < 4 || busy} onClick={() => verify(false)}>
              {busy ? t("common.loading") : t("auth.verify")}
            </button>
            <button className="w-full text-sm text-brand font-semibold py-3" disabled={busy} onClick={sendCode}>
              {t("auth.resend")}
            </button>
          </>
        )}

        {stage === "name" && (
          <>
            <div className="rounded-xl bg-surface-2 p-3 text-sm text-ink-2 mb-4">{t("auth.newHere")}</div>
            <label className="text-[11px] font-bold text-ink-2">{t("auth.firstName")}</label>
            <input
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              autoComplete="given-name"
              className="w-full mt-1.5 mb-3 rounded-xl border border-line bg-surface-2 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-brand"
            />
            <label className="text-[11px] font-bold text-ink-2">{t("auth.lastName")}</label>
            <input
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              autoComplete="family-name"
              className="w-full mt-1.5 mb-4 rounded-xl border border-line bg-surface-2 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-brand"
            />
            <button className="btn-primary" disabled={!firstName.trim() || busy} onClick={() => verify(true)}>
              {busy ? t("common.loading") : t("auth.register")}
            </button>
          </>
        )}

        {err && <p className="text-xs text-red-400 mt-3">{err}</p>}

        <p className="text-[11px] text-muted text-center mt-6">{t("auth.legal")}</p>
      </div>
    </div>
  );
}
