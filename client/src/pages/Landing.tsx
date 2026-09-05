import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useTranslation } from "react-i18next";
import { QrCode, X } from "lucide-react";
import { parsePhoneNumberFromString } from "libphonenumber-js";
import type { CountryCode } from "libphonenumber-js";
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

// BLOKADA PRAWNA (panel, SPEC §8, 2026-09-05): ścieżka po numerze zestawia
// klientce listę firm należących do NIEZALEŻNYCH administratorów danych.
// Czeka na potwierdzenie prawnika i wpis do polityki prywatności. Panel już
// ją obsługuje i zgłasza `phoneFind: true`, więc bez tego rygla klientki
// zobaczyłyby ją od razu. Odblokowanie = zmiana tej stałej na true + wersja.
// Do testów właściciela: adres ekranu startowego z `?phoneEntry=1`.
const PHONE_ENTRY_RELEASED = false;
const TEST_KEY = "booksero_test_phone_entry";

// Czy wpis wygląda na numer telefonu (a nie na nazwę salonu): same cyfry,
// spacje, myślniki, nawiasy, ewentualny plus — i co najmniej 7 cyfr.
function wyglądaJakNumer(v: string): boolean {
  return /^\+?[\d\s\-().]+$/.test(v) && v.replace(/\D/g, "").length >= 7;
}

// EKRAN STARTOWY — próg aplikacji. BookSero jest jedną aplikacją dla wszystkich
// firm, więc zanim cokolwiek pokaże, musi wiedzieć, DO KTÓREGO salonu wchodzi
// ta osoba. Decyzja właściciela 2026-09-05: JEDNO POLE, ŻADNYCH WYBORÓW.
//   1. kod QR z wizytówki;
//   2. jedno pole: nazwa salonu (słowo, które recepcja mówi klientce —
//      w panelu nazywane „hasłem salonu") ALBO numer telefonu; aplikacja sama
//      poznaje, co wpisano. To samo pole rozumie po cichu dawne adresy
//      wizytówki i kody sieci.
// Kraj (hasła są unikalne w obrębie kraju, numer trzeba umieć odczytać)
// bierze się z telefonu i siedzi w jednej drobnej linijce „🇵🇱 PL · zmień".
// Celowo NIE MA tu wyszukiwarki ani listy salonów: każde podpowiadanie po
// nazwie jest katalogiem, a katalog pozwala konkurencji wypisać klientów
// Booksero. Z tego ekranu nie da się niczego wypisać ani policzyć.
export default function Landing() {
  const [, navigate] = useLocation();
  const [value, setValue] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const [scanning, setScanning] = useState(false);
  const [recent, setRecent] = useState<RecentSalon[]>(() => loadRecentSalons());
  const [country, setCountry] = useState<string>(() => loadEntryCountry());
  const [countryOpen, setCountryOpen] = useState(false);
  // Numer w formacie międzynarodowym, gdy klientka weszła numerem — pole
  // zamienia się wtedy w krok „kod z SMS".
  const [phoneFlow, setPhoneFlow] = useState<string | null>(null);
  // Co panel już umie. Domyślnie nic — wtedy ekran działa jak dotychczas
  // (pole = adres wizytówki). Po wdrożeniu panelu włącza się samo.
  const [caps, setCaps] = useState<EntryCapabilities>({ password: false, phoneFind: false });
  const { t, i18n } = useTranslation();
  const phoneTest = typeof window !== "undefined" && new URLSearchParams(window.location.search).get("phoneEntry") === "1";
  // TRYB TESTOWY WŁAŚCICIELA: 5 tapnięć w numer wersji włącza (i wyłącza)
  // ścieżkę po numerze na TYM telefonie. W zainstalowanej aplikacji nie ma
  // paska adresu, więc `?phoneEntry=1` nie da się wpisać — stąd gest.
  const [testMode, setTestMode] = useState<boolean>(() => {
    try { return localStorage.getItem(TEST_KEY) === "1"; } catch { return false; }
  });
  const [taps, setTaps] = useState(0);
  const [testInfo, setTestInfo] = useState("");
  const tapVersion = () => {
    const n = taps + 1;
    if (n < 5) { setTaps(n); return; }
    setTaps(0);
    const next = !testMode;
    setTestMode(next);
    try { if (next) localStorage.setItem(TEST_KEY, "1"); else localStorage.removeItem(TEST_KEY); } catch { /* brak localStorage */ }
    setTestInfo(next ? "Tryb testowy: wejście numerem WŁĄCZONE" : "Tryb testowy: wejście numerem wyłączone");
    setTimeout(() => setTestInfo(""), 3000);
  };
  const phoneFind = caps.phoneFind && (PHONE_ENTRY_RELEASED || phoneTest || testMode);

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
    setCountryOpen(false);
  };

  // Wspólna logika wejścia (pole tekstowe i skaner QR). `method` = którędy
  // klientka weszła — licznik dla właściciela w panelu.
  async function openInput(raw: string, method: EntryMethod) {
    const v = raw.trim();
    if (!v) return;
    setMsg("");
    if (v.toLowerCase().startsWith("t:")) {
      navigate(`/t/${v.slice(2)}?via=${method}`);
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
        navigate(`/t/${v}?via=${method}`);
      } finally {
        setBusy(false);
      }
      return;
    }
    setBusy(true);
    try {
      // 1. NAZWA SALONU (w panelu: hasło; dopasowanie dokładne, w obrębie
      //    kraju). Brak trafienia to zwykły 404 — wtedy próbujemy dawnego
      //    adresu wizytówki.
      if (caps.password) {
        try {
          const hit = await api.passwordLookup(v, country);
          if (hit?.salons?.length === 1) {
            void api.entryEvent(method, { salonId: hit.salons[0].salonId, tenantId: hit.tenantId });
            navigate(`/salon/${hit.salons[0].salonId}`);
            return;
          }
          if (hit?.salons?.length > 1) {
            // Kilka lokalizacji z tą nazwą → wybór wewnątrz TEJ firmy
            // (ekran kraj → miasto → salon, który już mamy). `via` niesie
            // metodę wejścia — licznik zgłosi ją, gdy klientka tapnie salon.
            navigate(`/t/${hit.tenantId}?via=${method}`);
            return;
          }
        } catch (e) {
          // 404 = nie ma takiej nazwy; adres wizytówki wciąż może zadziałać.
          // 429 = limit zapytań — to trzeba pokazać, próba adresu nic nie da.
          if (!(e instanceof ApiError)) throw e;
          if (e.status === 429) {
            setMsg(e.message);
            return;
          }
        }
      }
      // 2. Dawny adres wizytówki (slug) — działa dalej, po cichu.
      const { salonId } = await api.resolveSlug(v.toLowerCase());
      void api.entryEvent(method, { salonId });
      navigate(`/salon/${salonId}`);
    } catch (e) {
      // Awaria połączenia (5xx) to NIE „nie znaleziono" — mówimy prawdę,
      // żeby klientka nie sprawdzała nazwy w salonie, gdy padła sieć.
      const server = e instanceof ApiError && e.status >= 500;
      setMsg(server ? (e as Error).message : t("landing.notFound"));
    } finally {
      setBusy(false);
    }
  }

  // Jedno pole, dwie drogi: numer telefonu → krok „kod z SMS"; wszystko inne
  // → nazwa salonu. Klientka niczego nie wybiera.
  function go() {
    const v = value.trim();
    if (!v) return;
    setMsg("");
    if (phoneFind && wyglądaJakNumer(v)) {
      const parsed = parsePhoneNumberFromString(v, country as CountryCode);
      if (!parsed?.isValid()) {
        setMsg(t("common.invalidPhone"));
        return;
      }
      setPhoneFlow(parsed.number);
      return;
    }
    void openInput(v, "password");
  }

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
        navigate(`/t/${mT[1]}?via=qr`);
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

  // Kraj ma znaczenie tylko, gdy panel rozumie nazwy albo numer — inaczej
  // byłby pytaniem bez sensu.
  const showCountry = caps.password || phoneFind;

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

      {phoneFlow ? (
        <PhoneEntry phone={phoneFlow} onBack={() => setPhoneFlow(null)} />
      ) : (
        <>
          <label htmlFor="booksero-entry" className="text-[11px] font-bold text-ink-2">
            {phoneFind ? t("landing.codeLabelBoth") : t("landing.codeLabel")}
          </label>
          {/* autoComplete="off" + nazwa pola bez słowa „password"/„hasło":
              Chrome podstawiał tu z autouzupełniania NAZWĘ FIRMY albo numer
              telefonu zapamiętane z innych formularzy, a klientka brała to za
              podpowiedź aplikacji. Nazwa z „password" włączyłaby z kolei
              menedżer haseł. */}
          <input
            name="booksero-entry"
            id="booksero-entry"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && go()}
            placeholder={phoneFind ? t("landing.placeholderBoth") : t("landing.placeholder")}
            autoComplete="off"
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            enterKeyHint="go"
            data-lpignore="true"
            data-1p-ignore="true"
            className="w-full mt-1.5 rounded-xl border border-line bg-surface-2 px-4 py-3 text-sm text-ink outline-none focus:ring-2 focus:ring-brand"
          />
          <button onClick={go} disabled={!value.trim() || busy} className="btn-primary mt-3">
            {busy ? t("common.loading") : t("welcome.start")}
          </button>

          {/* Kraj: jedna drobna linijka. Nazwy salonów są unikalne w obrębie
              kraju (dwie obce firmy „BBeauty" — Koszalin i Rzym — nie
              kolidują), a numer trzeba umieć odczytać. Domyślnie z telefonu;
              lista rozwija się dopiero po tapnięciu „zmień". */}
          {showCountry && (
            <div className="mt-2 text-xs text-muted">
              {countryOpen ? (
                <select
                  autoFocus
                  value={country}
                  onChange={(e) => pickCountry(e.target.value)}
                  onBlur={() => setCountryOpen(false)}
                  aria-label={t("landing.country")}
                  className="rounded-lg border border-line bg-surface-2 px-2 py-1.5 text-xs text-ink"
                >
                  {ENTRY_COUNTRIES.map((c) => (
                    <option key={c} value={c}>
                      {countryFlagEmoji(c)} {c}
                    </option>
                  ))}
                </select>
              ) : (
                <span>
                  {countryFlagEmoji(country)} {country} ·{" "}
                  <button onClick={() => setCountryOpen(true)} className="text-brand font-semibold">
                    {t("landing.countryChange")}
                  </button>
                </span>
              )}
            </div>
          )}

          {msg && <p className="text-xs text-red-400 mt-3">{msg}</p>}
        </>
      )}

      {/* Nowa klientka bez kodu, nazwy ani kartoteki: aplikacja jest wejściem
          dla klientek salonu, nie miejscem szukania salonów — mówimy to wprost.
          Wersja widoczna BEZ logowania — diagnostyka „czy telefon ma świeżą
          aplikację" nie może wymagać zalogowania. */}
      <p className="mt-auto pt-6 text-[11px] text-muted text-center">
        <span className="block">{t("landing.firstTime")}</span>
        <span className="block mt-1">{t("landing.privacyNote")}</span>
        <span className="block mt-1 opacity-70 select-none" onClick={tapVersion}>
          BookSero v{APP_VERSION}{testMode ? " · test" : ""}
        </span>
        {testInfo && <span className="block mt-1 text-brand font-semibold">{testInfo}</span>}
      </p>

      {scanning && <QrScanner onResult={handleQr} onClose={() => setScanning(false)} />}
    </div>
  );
}
