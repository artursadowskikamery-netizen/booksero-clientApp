import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useTranslation } from "react-i18next";
import { QrCode, KeyRound, X, Smartphone } from "lucide-react";
import { api, ApiError } from "../lib/api";
import { applyAccent } from "../lib/themes";
import { saveRef } from "../lib/referral";
import { SUPPORTED_LANGS, LANG_LABELS } from "../lib/i18n";
import { APP_VERSION } from "../lib/version";
import { loadRecentSalons, removeRecentSalon, type RecentSalon } from "../lib/recentSalons";
import { loadEntryCountry, saveEntryCountry, ENTRY_COUNTRIES } from "../lib/entryCountry";
import { countryFlagEmoji } from "@shared/phone";
import QrScanner from "../components/QrScanner";
import PhoneEntry from "../components/PhoneEntry";
import type { EntryCapabilities, EntryMethod } from "@shared/types";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// EKRAN STARTOWY — próg aplikacji. BookSero jest jedną aplikacją dla wszystkich
// firm, więc zanim cokolwiek pokaże, musi wiedzieć, DO KTÓREGO salonu wchodzi
// ta osoba. Trzy drogi, każda w języku klientki (decyzja właściciela 2026-09-04):
//   1. kod QR z wizytówki;
//   2. HASŁO SALONU — słowo, które recepcja mówi klientce („wpisz Vivi");
//      to samo pole rozumie też dawne adresy wizytówki i kody, klientka nie
//      musi o tym wiedzieć;
//   3. NUMER TELEFONU — dla tej, która ma już kartotekę, a straciła kod.
// Celowo NIE MA tu wyszukiwarki ani listy salonów: każde podpowiadanie po
// nazwie jest katalogiem, a katalog pozwala konkurencji wypisać klientów
// Booksero. Z tego ekranu nie da się niczego wypisać ani policzyć.
export default function Landing() {
  const [, navigate] = useLocation();
  const [value, setValue] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const [scanning, setScanning] = useState(false);
  const [phoneOpen, setPhoneOpen] = useState(false);
  const [recent, setRecent] = useState<RecentSalon[]>(() => loadRecentSalons());
  const [country, setCountry] = useState<string>(() => loadEntryCountry());
  // Co panel już umie. Domyślnie nic — wtedy ekran działa jak dotychczas
  // (pole = adres wizytówki, ścieżka po numerze ukryta). Po wdrożeniu panelu
  // obie rzeczy włączają się same, bez nowej wersji aplikacji.
  const [caps, setCaps] = useState<EntryCapabilities>({ password: false, phoneFind: false });
  const { t, i18n } = useTranslation();

  // Ekran startowy = neutralna powłoka BookSero — zawsze domyślny niebieski
  // (kolor salonu wraca dopiero na ekranach salonu).
  useEffect(() => {
    applyAccent(null);
  }, []);

  useEffect(() => {
    let alive = true;
    api
      .entryCapabilities()
      .then((c) => alive && setCaps({ password: c?.password === true, phoneFind: c?.phoneFind === true }))
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, []);

  const pickCountry = (c: string) => {
    setCountry(c);
    saveEntryCountry(c);
  };

  // Wspólna logika wejścia (pole tekstowe i skaner QR). `method` = którędy
  // klientka weszła — licznik dla właściciela w panelu.
  async function openInput(raw: string, method: EntryMethod) {
    const v = raw.trim();
    if (!v) return;
    setMsg("");
    if (v.toLowerCase().startsWith("t:")) {
      void api.entryEvent(method, { tenantId: v.slice(2) });
      navigate(`/t/${v.slice(2)}`);
      return;
    }
    if (/^ML\d+$/i.test(v)) {
      setMsg(t("landing.mlNotSupported"));
      return;
    }
    if (UUID_RE.test(v)) {
      // Auto-rozpoznanie: najpierw salon, a gdy nie istnieje — tenant.
      setBusy(true);
      try {
        await api.salon(v);
        void api.entryEvent(method, { salonId: v });
        navigate(`/salon/${v}`);
      } catch {
        void api.entryEvent(method, { tenantId: v });
        navigate(`/t/${v}`);
      } finally {
        setBusy(false);
      }
      return;
    }
    setBusy(true);
    try {
      // 1. HASŁO SALONU (dopasowanie dokładne, w obrębie kraju). Brak
      //    trafienia to zwykły 404 — wtedy próbujemy dawnego adresu wizytówki.
      if (caps.password) {
        try {
          const hit = await api.passwordLookup(v, country);
          if (hit?.salons?.length === 1) {
            void api.entryEvent(method, { salonId: hit.salons[0].salonId, tenantId: hit.tenantId });
            navigate(`/salon/${hit.salons[0].salonId}`);
            return;
          }
          if (hit?.salons?.length > 1) {
            // Kilka lokalizacji z tym hasłem → wybór wewnątrz TEJ firmy
            // (ekran kraj → miasto → salon, który już mamy).
            void api.entryEvent(method, { tenantId: hit.tenantId });
            navigate(`/t/${hit.tenantId}`);
            return;
          }
        } catch (e) {
          // 404 = nie ma takiego hasła; inne błędy też nie przerywają —
          // adres wizytówki wciąż może zadziałać.
          if (!(e instanceof ApiError)) throw e;
        }
      }
      // 2. Dawny adres wizytówki (slug) — działa dalej, po cichu.
      const { salonId } = await api.resolveSlug(v.toLowerCase());
      void api.entryEvent(method, { salonId });
      navigate(`/salon/${salonId}`);
    } catch (e) {
      // Awaria połączenia (5xx) to NIE „nie znaleziono" — mówimy prawdę,
      // żeby klientka nie sprawdzała hasła w salonie, gdy padła sieć.
      const server = e instanceof ApiError && e.status >= 500;
      setMsg(server ? (e as Error).message : t("landing.notFound"));
    } finally {
      setBusy(false);
    }
  }

  const go = () => openInput(value, "password");

  // Wynik skanu QR: linki z panelu (sieć /t/<id>, salon /salon/<id>, ?ref=);
  // surowy UUID/slug wpada do tej samej logiki co pole tekstowe.
  function handleQr(text: string) {
    setScanning(false);
    const v = text.trim();
    try {
      const u = new URL(v);
      const ref = u.searchParams.get("ref");
      if (ref) saveRef(ref.trim());
      const mT = u.pathname.match(/\/t\/([0-9a-f-]{36})/i);
      if (mT) {
        void api.entryEvent("qr", { tenantId: mT[1] });
        navigate(`/t/${mT[1]}`);
        return;
      }
      const mS = u.pathname.match(/\/salon\/([0-9a-f-]{36})/i);
      if (mS) {
        void api.entryEvent("qr", { salonId: mS[1] });
        navigate(`/salon/${mS[1]}`);
        return;
      }
      const mR = u.pathname.match(/^\/r\/([A-Za-z0-9]+)$/);
      if (mR) {
        navigate(`/r/${mR[1]}`);
        return;
      }
      // Link ze slugiem (app.booksero.com/<slug> lub panel.booksero.com/<slug>)
      // — ten sam QR z wizytówki działa w aparacie telefonu I w tym skanerze.
      const seg = u.pathname.split("/").filter(Boolean);
      if (seg.length === 1 && /^[a-z0-9-]{3,60}$/i.test(seg[0])) {
        void openInput(seg[0], "qr");
        return;
      }
      setMsg(t("qr.invalid"));
      return;
    } catch {
      /* nie URL — może UUID albo slug */
    }
    if (UUID_RE.test(v) || /^[a-z0-9-]{2,32}$/i.test(v)) {
      setValue(v);
      void openInput(v, "qr");
      return;
    }
    setMsg(t("qr.invalid"));
  }

  const inputCls =
    "w-full rounded-xl border border-line bg-surface-2 py-3 text-sm text-ink outline-none focus:ring-2 focus:ring-brand";

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
          aria-label={t("common.language")}
        >
          {SUPPORTED_LANGS.map((l) => (
            <option key={l} value={l}>{LANG_LABELS[l]}</option>
          ))}
        </select>
      </div>

      <h1 className="text-2xl font-extrabold tracking-tight mt-8">{t("landing.title")}</h1>
      <p className="text-sm text-muted mt-1 mb-5">{t("landing.scanHint")}</p>

      <button className="btn-primary flex items-center justify-center gap-2" onClick={() => { setMsg(""); setScanning(true); }}>
        <QrCode size={17} /> {t("landing.qr")}
      </button>

      {/* Ostatnio odwiedzane salony — powrót jednym dotknięciem. Pojawia się
          dopiero po pierwszym wejściu, bo dopiero wtedy aplikacja wie, o który
          salon chodzi. Klient bywa w kilku sieciach — stąd lista. */}
      {recent.length > 0 && (
        <div className="mt-5">
          <h2 className="text-[11px] font-bold uppercase tracking-widest text-muted mb-2">
            {t("landing.recent")}
          </h2>
          <div className="rounded-2xl border border-line bg-surface divide-y divide-line overflow-hidden">
            {recent.map((s) => (
              <div key={s.id} className="flex items-center">
                <button
                  onClick={() => {
                    void api.entryEvent("recent", { salonId: s.id });
                    navigate(`/salon/${s.id}`);
                  }}
                  className="flex-1 min-w-0 flex items-center gap-3 p-3 text-left"
                >
                  {s.logo ? (
                    <img src={s.logo} alt="" className="w-9 h-9 rounded-xl object-cover shrink-0" />
                  ) : (
                    <span className="w-9 h-9 rounded-xl bg-brand text-brand-contrast grid place-items-center font-extrabold shrink-0">
                      {/* Array.from, nie charAt — nazwa może zaczynać się od
                          znaku spoza podstawowego zakresu (emoji), którego
                          charAt rozcina na pół. */}
                      {Array.from(s.name.trim())[0]?.toUpperCase() || "S"}
                    </span>
                  )}
                  <span className="min-w-0">
                    <span className="block text-sm font-bold truncate">{s.name}</span>
                    {s.city && <span className="block text-xs text-muted truncate">{s.city}</span>}
                  </span>
                </button>
                <button
                  onClick={() => { removeRecentSalon(s.id); setRecent(loadRecentSalons()); }}
                  className="p-3 text-muted shrink-0"
                  aria-label={t("landing.recentRemove", { name: s.name })}
                >
                  <X size={15} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex items-center gap-3 my-5">
        <span className="flex-1 h-px bg-line" />
        <span className="text-[11px] text-muted">{t("landing.or")}</span>
        <span className="flex-1 h-px bg-line" />
      </div>

      {/* HASŁO SALONU. Hasło jest unikalne w obrębie KRAJU (dwie obce firmy
          „BBeauty" — Koszalin i Rzym — nie kolidują), więc obok pola jest
          kraj: domyślnie z ustawień telefonu, zapamiętany po zmianie. Wybór
          kraju pokazujemy tylko, gdy panel już rozumie hasła — bez tego byłby
          pytaniem bez sensu. */}
      <label className="text-[11px] font-bold text-ink-2">{t("landing.codeLabel")}</label>
      <div className="flex gap-2 mt-1.5">
        {caps.password && (
          <select
            value={country}
            onChange={(e) => pickCountry(e.target.value)}
            aria-label={t("landing.country")}
            className="shrink-0 max-w-[96px] rounded-xl border border-line bg-surface-2 px-2 py-3 text-sm outline-none focus:ring-2 focus:ring-brand"
          >
            {ENTRY_COUNTRIES.map((c) => (
              <option key={c} value={c}>
                {countryFlagEmoji(c)} {c}
              </option>
            ))}
          </select>
        )}
        <div className="relative flex-1 min-w-0">
          <KeyRound size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
          <input
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && go()}
            placeholder={t("landing.placeholder")}
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            enterKeyHint="go"
            className={`${inputCls} pl-9 pr-4`}
            aria-label={t("landing.codeLabel")}
          />
        </div>
      </div>
      <button onClick={go} disabled={!value.trim() || busy} className="btn-primary mt-3">
        {busy ? t("common.loading") : t("welcome.start")}
      </button>

      {msg && <p className="text-xs text-red-400 mt-3">{msg}</p>}

      {/* WEJŚCIE PO NUMERZE — tylko gdy panel to umie. Zwinięte do jednej
          linijki, żeby ekran nie straszył dwoma formularzami naraz. */}
      {caps.phoneFind && !phoneOpen && (
        <button
          onClick={() => { setMsg(""); setPhoneOpen(true); }}
          className="mt-4 w-full text-sm text-brand font-semibold py-2 flex items-center justify-center gap-2"
        >
          <Smartphone size={15} /> {t("landing.phoneEntry")}
        </button>
      )}
      {caps.phoneFind && phoneOpen && <PhoneEntry />}

      {/* Nowa klientka bez kodu, hasła ani kartoteki: aplikacja jest wejściem
          dla klientek salonu, nie miejscem szukania salonów — mówimy to wprost.
          Wersja widoczna BEZ logowania — diagnostyka „czy telefon ma świeżą
          aplikację" nie może wymagać zalogowania. */}
      <p className="mt-auto pt-6 text-[11px] text-muted text-center">
        <span className="block">{t("landing.firstTime")}</span>
        <span className="block mt-1">{t("landing.privacyNote")}</span>
        <span className="block mt-1 opacity-70">BookSero v{APP_VERSION}</span>
      </p>

      {scanning && <QrScanner onResult={handleQr} onClose={() => setScanning(false)} />}
    </div>
  );
}
