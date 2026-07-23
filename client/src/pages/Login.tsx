import { useEffect, useState } from "react";
import { useRoute, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { ChevronLeft, ClipboardPaste } from "lucide-react";
import { useTranslation } from "react-i18next";
import { api, ApiError } from "../lib/api";
import { setToken, isLoggedInFor } from "../lib/auth";
import { loadRef, clearRef } from "../lib/referral";
import { resubscribePushIfWanted } from "../lib/push";
import { PhoneInput } from "../components/PhoneInput";

// Logowanie klienta: telefon → kod SMS → sesja (SPEC-logowanie-klienta).
// Nowy numer: po poprawnym kodzie backend prosi o imię (422) i tworzy konto
// klienta w tym salonie (SPEC-auto-rejestracja).
export default function Login() {
  const [, params] = useRoute("/salon/:salonId/login");
  const salonId = params?.salonId ?? "";
  const [, navigate] = useLocation();
  const { t } = useTranslation();

  const [phone, setPhone] = useState("");
  const [phoneValid, setPhoneValid] = useState(false);
  const [code, setCode] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [stage, setStage] = useState<"phone" | "code" | "name">("phone");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  // Rośnie przy każdym wysłaniu kodu — uzbraja nasłuch WebOTP na NOWY SMS.
  const [codeNonce, setCodeNonce] = useState(0);
  // Sekundy do odblokowania po „Zbyt wiele prób" — żywy licznik MM:SS.
  const [cooldown, setCooldown] = useState(0);

  const salonQ = useQuery({ queryKey: ["salon", salonId], queryFn: () => api.salon(salonId), enabled: !!salonId });
  const tenantId = salonQ.data?.salon.tenantId ?? null;

  // Już zalogowany w tej sieci → od razu do salonu.
  useEffect(() => {
    if (salonQ.data && tenantId && isLoggedInFor(tenantId)) navigate(`/salon/${salonId}`);
  }, [salonQ.data, tenantId, salonId, navigate]);

  // Auto-uzupełnienie kodu z SMS-a. iOS uzupełnia natywnie przez pole
  // autocomplete="one-time-code" (podpowiedź nad klawiaturą). Android Chrome:
  // WebOTP odczytuje kod bez dotykania — działa, gdy SMS zawiera linię
  // "@app.booksero.com #<kod>" (dodane w treści SMS-a po stronie backendu).
  // Uzbrajamy się PRZY KAŻDYM wysłaniu kodu (codeNonce) — inaczej po ponownym
  // "Wyślij ponownie" nasłuch by się nie włączył i złapałby stary kod.
  useEffect(() => {
    if (stage !== "code") return;
    if (typeof window === "undefined" || !("OTPCredential" in window)) return;
    const ac = new AbortController();
    navigator.credentials
      .get({ otp: { transport: ["sms"] }, signal: ac.signal } as CredentialRequestOptions)
      .then((cred) => {
        const otp = (cred as unknown as { code?: string } | null)?.code;
        const clean = otp ? otp.replace(/\D/g, "").slice(0, 6) : "";
        if (clean.length === 6) {
          setCode(clean);
          // Kod z WebOTP jest pewny → zatwierdzamy od razu (bez ręcznego klikania).
          verify(false, clean);
        } else if (clean) {
          setCode(clean);
        }
      })
      .catch(() => {}); // przerwane/niewspierane — cicho, użytkownik wpisze ręcznie
    return () => ac.abort();
  }, [stage, codeNonce]);

  // Odliczanie czasu blokady co sekundę.
  useEffect(() => {
    if (cooldown <= 0) return;
    const id = setInterval(() => setCooldown((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(id);
  }, [cooldown > 0]);

  const mmss = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

  async function sendCode() {
    if (!tenantId || cooldown > 0) return;
    setErr(""); setBusy(true);
    try {
      await api.requestLoginCode(tenantId, phone.trim(), salonId);
      setStage("code");
      setCode("");
      setCodeNonce((n) => n + 1); // uzbrój nasłuch WebOTP na ten nowy SMS
    } catch (e) {
      // 429 z licznikiem → pokaż odliczanie zamiast surowego komunikatu.
      if (e instanceof ApiError && e.status === 429 && e.retryAfter) setCooldown(e.retryAfter);
      else setErr((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function verify(withName: boolean, codeOverride?: string) {
    if (!tenantId) return;
    const theCode = (codeOverride ?? code).trim();
    if (theCode.length < 4) return;
    setErr(""); setBusy(true);
    try {
      // Kod polecającego przekazujemy tylko przy rejestracji (withName) — backend
      // i tak uwzględnia go wyłącznie przy tworzeniu nowego klienta (§5).
      const { token } = await api.verifyLoginCode(
        tenantId,
        phone.trim(),
        theCode,
        salonId,
        withName ? { firstName: firstName.trim(), lastName: lastName.trim() || undefined } : undefined,
        withName ? loadRef() : undefined,
      );
      if (withName) clearRef();
      setToken(token, tenantId);
      // Klient chciał powiadomienia przed wylogowaniem → przywróć je po cichu.
      resubscribePushIfWanted();
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
        <div className="mt-1.5 mb-4">
          <PhoneInput
            value={phone}
            onChange={setPhone}
            onValidChange={setPhoneValid}
            defaultCountry={salonQ.data?.salon.country}
            disabled={stage !== "phone"}
          />
        </div>

        {stage === "phone" && (
          <button className="btn-primary" disabled={!phoneValid || !tenantId || busy || cooldown > 0} onClick={sendCode}>
            {cooldown > 0 ? t("auth.retryIn", { time: mmss(cooldown) }) : busy ? t("common.loading") : t("auth.sendCode")}
          </button>
        )}

        {stage === "code" && (
          <>
            <label className="text-[11px] font-bold text-ink-2">{t("auth.code")}</label>
            {/* autoFocus: systemowe autouzupełnianie SMS (Android/iOS) podstawia
                kod tylko do AKTYWNEGO pola — bez fokusu zgoda użytkownika
                „wypełnij kod" nie ma gdzie trafić. */}
            <input
              type="text"
              name="one-time-code"
              id="one-time-code"
              inputMode="numeric"
              autoComplete="one-time-code"
              autoFocus
              maxLength={6}
              value={code}
              onChange={(e) => {
                const v = e.target.value.replace(/\D/g, "");
                setCode(v);
                // Komplet 6 cyfr (wpisane ręcznie LUB podstawione przez system)
                // → zatwierdzamy od razu, bez klikania.
                if (v.length === 6 && !busy) verify(false, v);
              }}
              className="w-full mt-1.5 mb-4 rounded-xl border border-line bg-surface-2 px-4 py-3 text-xl font-mono tracking-[0.4em] text-center outline-none focus:ring-2 focus:ring-brand"
            />
            {/* Honor/Huawei i część nakładek po zgodzie „użyj kodu" wrzuca kod
                do SCHOWKA zamiast do pola — dajemy wklejenie jednym dotknięciem. */}
            <button
              className="w-full text-sm text-brand font-semibold py-2 mb-2 flex items-center justify-center gap-2"
              disabled={busy}
              onClick={async () => {
                try {
                  const txt = await navigator.clipboard.readText();
                  const found = (txt.match(/\d{6}/) || [])[0];
                  if (found) {
                    setCode(found);
                    verify(false, found);
                  }
                } catch {
                  /* brak zgody na schowek — pole i tak ma fokus, można wkleić ręcznie */
                }
              }}
            >
              <ClipboardPaste size={15} /> {t("auth.paste")}
            </button>
            <button className="btn-primary" disabled={code.length < 4 || busy} onClick={() => verify(false)}>
              {busy ? t("common.loading") : t("auth.verify")}
            </button>
            <button className="w-full text-sm text-brand font-semibold py-3 disabled:opacity-50" disabled={busy || cooldown > 0} onClick={sendCode}>
              {cooldown > 0 ? t("auth.retryIn", { time: mmss(cooldown) }) : t("auth.resend")}
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
