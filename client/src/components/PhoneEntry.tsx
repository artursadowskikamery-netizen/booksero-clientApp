import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { ClipboardPaste } from "lucide-react";
import { useTranslation } from "react-i18next";
import { parsePhoneNumberFromString } from "libphonenumber-js";
import { api, ApiError } from "../lib/api";
import { setToken, rememberSession } from "../lib/auth";
import { saveRecentSalon } from "../lib/recentSalons";
import { autoRejoinPush } from "../lib/push";
import type { FindResult } from "@shared/types";

// WEJŚCIE NUMEREM TELEFONU — krok „kod z SMS" i wybór salonu.
//
// Numer wpisuje się w TO SAMO pole, co hasło salonu (ekran startowy sam
// poznaje, że to numer) — tu przychodzi już gotowy, w formacie
// międzynarodowym. Komponent od razu wysyła kod i pokazuje pole na kod;
// klientka nie ma drugiego formularza do wypełniania.
//
// Odpowiedź na wpisany numer jest ZAWSZE taka sama (nawet gdy numeru nie ma),
// więc ekran po wysłaniu od razu przewiduje „kod nie przyszedł" — inaczej
// ścieżka wyglądałaby na zepsutą dokładnie dla tych, dla których nie jest
// przeznaczona.
export default function PhoneEntry({ phone, onBack }: { phone: string; onBack: () => void }) {
  const [, navigate] = useLocation();
  const { t } = useTranslation();

  const [code, setCode] = useState("");
  const [stage, setStage] = useState<"code" | "pick">("code");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [otpRound, setOtpRound] = useState(0);
  const [cooldown, setCooldown] = useState(0);
  const [found, setFound] = useState<FindResult | null>(null);

  const ladny = parsePhoneNumberFromString(phone)?.formatInternational() ?? phone;

  // Pierwszy SMS idzie od razu po wejściu w ten krok.
  useEffect(() => {
    void sendCode();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phone]);

  // Auto-uzupełnienie kodu z SMS-a (WebOTP).
  //
  // WYŚCIG, który tu kiedyś był: pole na kod jest widoczne od razu, więc
  // nasłuch uzbrajał się PRZED wysłaniem SMS-a, a po odpowiedzi serwera
  // przezbrajał się (stary był odwoływany). SMS z Booksero przychodzi
  // szybciej niż odpowiedź z serwera — okno „zezwolić?" pokazywało się dla
  // STAREGO nasłuchu, klientka tapała „zezwól", a ten nasłuch był już
  // odwołany: kod trafiał w próżnię. Dlatego nasłuch uzbraja się raz przy
  // wejściu w krok kodu, NIE reaguje na odpowiedź serwera ani na „wyślij
  // ponownie" (oczekujący nasłuch złapie każdy pasujący SMS), a przezbraja
  // się dopiero po ZUŻYCIU kodu — gdyby klientka poprosiła o kolejny.
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
          verify(clean);
        } else if (clean) {
          setCode(clean);
        }
        // Kod zużyty → nowy nasłuch (tylko po SUKCESIE; po odmowie
        // przezbrajanie zapętliłoby się).
        if (!ac.signal.aborted) setOtpRound((r) => r + 1);
      })
      .catch(() => {});
    return () => ac.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stage, otpRound]);

  useEffect(() => {
    if (cooldown <= 0) return;
    const id = setInterval(() => setCooldown((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cooldown > 0]);

  const mmss = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

  async function sendCode() {
    if (cooldown > 0) return;
    setErr("");
    setBusy(true);
    try {
      const r = await api.findRequest(phone);
      // Pola NIE czyścimy: gdy SMS wyprzedzi odpowiedź serwera, kod z WebOTP
      // już tu jest — wyczyszczenie skasowałoby go klientce sprzed nosa.
      setCooldown(typeof r?.retryAfter === "number" && r.retryAfter > 0 ? r.retryAfter : 60);
    } catch (e) {
      if (e instanceof ApiError && e.status === 429 && e.retryAfter) setCooldown(e.retryAfter);
      else setErr((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function verify(codeOverride?: string) {
    const theCode = (codeOverride ?? code).trim();
    if (theCode.length < 4) return;
    setErr("");
    setBusy(true);
    try {
      const r = await api.findVerify(phone, theCode);
      setFound(r);
      const all = r.tenants.flatMap((tn) => tn.salons.map((s) => ({ tenantId: tn.tenantId, salonId: s.salonId })));
      // Jedna firma, jedna lokalizacja → bez pytania, prosto do środka.
      if (all.length === 1) {
        await enter(r, all[0].tenantId, all[0].salonId);
        return;
      }
      setStage("pick");
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function enter(r: FindResult, tenantId: string, salonId: string) {
    setErr("");
    setBusy(true);
    try {
      const { token } = await api.findEnter(r.ticket, tenantId, salonId);
      const firma = r.tenants.find((tn) => tn.tenantId === tenantId);
      setToken(token, tenantId, firma?.tenantName ?? null);
      autoRejoinPush();
      void api.entryEvent("phone", { salonId, tenantId });
      // WIELE FIRM NARAZ: ten sam bilet otwiera każdą firmę z listy, więc
      // wchodzimy po cichu także do pozostałych — klientka nie będzie musiała
      // prosić o drugi SMS, żeby przejść do drugiej firmy. Wszystkie salony
      // z listy trafiają do „ostatnio odwiedzanych", żeby były na ekranie
      // startowym od razu. Błędy tu nic nie psują — główne wejście już jest.
      for (const tn of r.tenants) {
        for (const sal of tn.salons) {
          saveRecentSalon({ id: sal.salonId, name: sal.name, city: sal.city ?? null, logo: sal.logo ?? null });
        }
        if (tn.tenantId === tenantId || tn.salons.length === 0) continue;
        void api
          .findEnter(r.ticket, tn.tenantId, tn.salons[0].salonId)
          .then((x) => rememberSession(tn.tenantId, x.token, tn.tenantName))
          .catch(() => {});
      }
      navigate(`/salon/${salonId}`);
    } catch (e) {
      // 404 = lokalizacja wyłączyła aplikację między listą a wejściem.
      if (e instanceof ApiError && e.status === 404) setErr(t("auth.appDisabled"));
      else setErr((e as Error).message);
      setBusy(false);
    }
  }

  const inputCls =
    "w-full rounded-xl border border-line bg-surface-2 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-brand";

  return (
    <div>
      {stage === "code" && (
        <>
          <p className="text-sm text-ink-2 mb-3">{t("landing.codeSentTo", { phone: ladny })}</p>
          <label className="text-[11px] font-bold text-ink-2">{t("auth.code")}</label>
          <input
            type="text"
            name="one-time-code"
            inputMode="numeric"
            autoComplete="one-time-code"
            autoFocus
            maxLength={6}
            value={code}
            onChange={(e) => {
              const v = e.target.value.replace(/\D/g, "");
              setCode(v);
              if (v.length === 6 && !busy) verify(v);
            }}
            className={`${inputCls} mt-1.5 mb-3 text-xl font-mono tracking-[0.4em] text-center`}
          />
          <button
            className="w-full text-sm text-brand font-semibold py-2 mb-1 flex items-center justify-center gap-2"
            disabled={busy}
            onClick={async () => {
              try {
                const txt = await navigator.clipboard.readText();
                const f = (txt.match(/\d{6}/) || [])[0];
                if (f) {
                  setCode(f);
                  verify(f);
                }
              } catch {
                /* brak zgody na schowek */
              }
            }}
          >
            <ClipboardPaste size={15} /> {t("auth.paste")}
          </button>
          <button className="btn-primary" disabled={code.length < 4 || busy} onClick={() => verify()}>
            {busy ? t("common.loading") : t("auth.verify")}
          </button>
          <div className="flex items-center justify-between mt-1">
            <button className="text-sm text-brand font-semibold py-3 disabled:opacity-50" disabled={busy || cooldown > 0} onClick={sendCode}>
              {cooldown > 0 ? t("auth.retryIn", { time: mmss(cooldown) }) : t("auth.resend")}
            </button>
            <button className="text-sm text-muted font-semibold py-3" disabled={busy} onClick={onBack}>
              {t("landing.changeNumber")}
            </button>
          </div>
          {/* Zawsze widoczne — odpowiedź serwera nie mówi, czy numer istnieje. */}
          <p className="text-xs text-muted mt-1">{t("landing.codeNotArrived")}</p>
        </>
      )}

      {stage === "pick" && found && (
        <>
          {found.tenants.length === 0 ? (
            <>
              <p className="text-sm text-ink-2">{t("landing.noAccounts")}</p>
              <p className="text-xs text-muted mt-1">{t("landing.firstTime")}</p>
              <button className="text-sm text-brand font-semibold py-3" onClick={onBack}>
                {t("landing.changeNumber")}
              </button>
            </>
          ) : (
            <>
              <p className="text-[11px] font-bold uppercase tracking-widest text-muted mb-2">{t("landing.pickSalon")}</p>
              <div className="space-y-3">
                {found.tenants.map((tn) => (
                  <div key={tn.tenantId}>
                    <p className="text-sm font-bold mb-1">{tn.tenantName}</p>
                    <div className="rounded-2xl border border-line bg-surface divide-y divide-line overflow-hidden">
                      {tn.salons.map((s) => (
                        <button
                          key={s.salonId}
                          disabled={busy}
                          onClick={() => enter(found, tn.tenantId, s.salonId)}
                          className="w-full flex items-center gap-3 p-3 text-left disabled:opacity-60"
                        >
                          {s.logo ? (
                            <img src={s.logo} alt="" className="w-9 h-9 rounded-xl object-cover shrink-0" />
                          ) : (
                            <span className="w-9 h-9 rounded-xl bg-brand text-brand-contrast grid place-items-center font-extrabold shrink-0">
                              {Array.from(s.name.trim())[0]?.toUpperCase() || "S"}
                            </span>
                          )}
                          <span className="min-w-0">
                            <span className="block text-sm font-bold truncate">{s.name}</span>
                            {s.city && <span className="block text-xs text-muted truncate">{s.city}</span>}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </>
      )}

      {err && <p className="text-xs text-red-400 mt-3">{err}</p>}
    </div>
  );
}
