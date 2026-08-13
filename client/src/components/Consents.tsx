import { useEffect, useState } from "react";
import { ShieldCheck, ChevronDown } from "lucide-react";
import { useTranslation } from "react-i18next";
import { api, ApiError } from "../lib/api";
import type { ConsentsState, ConsentType, ConsentHistoryItem } from "@shared/types";

// Zgody klientki w Profilu (SPEC-zgody-klientek, RODO art. 7 ust. 3).
// Wycofanie musi być RÓWNIE ŁATWE jak udzielenie: jeden przełącznik, bez
// pytania „czy na pewno", bez ostrzeżeń, bez kontaktu z salonem.
// Sekcja jest ZWIJANA i domyślnie zwinięta (decyzja właściciela) — sam nagłówek
// jest widoczny od razu na ekranie Profilu, bez wchodzenia w podekran.
const ALL: ConsentType[] = ["marketing", "reviews", "image_store", "image_publish"];

export default function Consents({
  networkName,
  multiSalon,
  onUnauthorized,
}: {
  networkName?: string | null;
  multiSalon: boolean;
  onUnauthorized: () => void;
}) {
  const { t, i18n } = useTranslation();
  const [open, setOpen] = useState(false); // domyślnie ZWINIĘTE
  const [data, setData] = useState<ConsentsState | null>(null);
  const [hidden, setHidden] = useState(false); // 404 / błąd odczytu → chowamy sekcję
  const [busy, setBusy] = useState<ConsentType | null>(null);
  const [err, setErr] = useState("");

  // Stanu NIE cache'ujemy: zgodę może zmienić recepcja albo sama klientka na
  // innym urządzeniu, więc pobieramy przy każdym wejściu na ekran.
  useEffect(() => {
    let alive = true;
    api
      .zgody()
      .then((d) => alive && setData(d))
      .catch((e) => {
        if (!alive) return;
        if (e instanceof ApiError && e.status === 401) return onUnauthorized();
        setHidden(true); // 404 (brak kartoteki) i awarie: nie pokazujemy pustej ramki
      });
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (hidden) return null;

  // Które przełączniki pokazać: te używane przez lokalizację ORAZ te, które
  // klientka MA — inaczej nie dałoby się wycofać zgody spoza zakresu, czyli
  // dokładnie tego, po co ten ekran powstał.
  const visible = data
    ? ALL.filter((typ) => data.zakres?.includes(typ) || data.stan?.[typ] === true)
    : [];

  // Nie pokazujemy pustej sekcji.
  if (data && visible.length === 0) return null;

  const dt = (iso: string) =>
    new Intl.DateTimeFormat(i18n.language, { day: "2-digit", month: "2-digit", year: "numeric" })
      .format(new Date(iso));

  // Stare wpisy bywają zapisane jako "image" (bez podkreślnika) — traktujemy je
  // jak image_publish. W `stan`/`zakres` ta wartość nie występuje.
  const wpisyTypu = (typ: ConsentType): ConsentHistoryItem[] =>
    (data?.historia ?? []).filter(
      (h) => h.consentType === typ || (typ === "image_publish" && h.consentType === "image"),
    );

  // Data pod przełącznikiem. Dowodem zgody JEST wpis otwarty (revokedAt === null),
  // a nie ostatni element tablicy — kolejność z serwera nie jest gwarantowana.
  const podpis = (typ: ConsentType): string | null => {
    const wpisy = wpisyTypu(typ);
    if (data?.stan?.[typ]) {
      const otwarty = wpisy.find((h) => !h.revokedAt);
      if (!otwarty) return null;
      // `note` to zwykle „stan z importu, data nieznana" — pokazujemy ją zamiast
      // udawać, że znamy dokładną datę.
      if (otwarty.note) return otwarty.note;
      return t("consents.granted", { date: dt(otwarty.grantedAt) });
    }
    const wycofane = wpisy.filter((h) => h.revokedAt);
    if (wycofane.length === 0) return null;
    const ostatnie = wycofane.reduce((a, b) =>
      new Date(b.revokedAt!).getTime() > new Date(a.revokedAt!).getTime() ? b : a,
    );
    return t("consents.revoked", { date: dt(ostatnie.revokedAt!) });
  };

  // Przełącznik nie rusza się do odpowiedzi serwera — dzięki temu przy błędzie
  // nie trzeba go „cofać": nigdy nie pokazał stanu, którego serwer nie potwierdził.
  const toggle = async (typ: ConsentType) => {
    if (!data || busy) return;
    setBusy(typ);
    setErr("");
    try {
      const swiezy = await api.zgodaSet(typ, !data.stan?.[typ]);
      setData(swiezy); // PATCH oddaje pełny stan — bez drugiego GET
    } catch (e) {
      if (e instanceof ApiError && e.status === 401) return onUnauthorized();
      setErr(t("consents.saveError"));
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="rounded-2xl bg-surface border border-line mt-5 overflow-hidden">
      <button
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="w-full flex items-center gap-2 p-4 text-left"
      >
        <ShieldCheck size={13} className="text-muted shrink-0" />
        <span className="flex-1 text-[11px] font-bold uppercase tracking-widest text-muted">
          {t("consents.title")}
        </span>
        <ChevronDown
          size={16}
          className={`text-muted shrink-0 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <div className="px-4 pb-4">
          {!data && <p className="text-sm text-muted py-2">{t("common.loading")}</p>}

          {data &&
            visible.map((typ) => {
              const on = data.stan?.[typ] === true;
              const sub = podpis(typ);
              return (
                <div key={typ} className="py-2.5 border-t border-line first:border-t-0">
                  <button
                    onClick={() => toggle(typ)}
                    disabled={busy === typ}
                    className="w-full flex items-start justify-between gap-3 text-left disabled:opacity-60"
                  >
                    <span className="min-w-0">
                      <span className="block text-sm">{t(`consents.type.${typ}`)}</span>
                      {sub && <span className="block text-xs text-muted mt-0.5">{sub}</span>}
                    </span>
                    <span
                      className={`w-11 h-6 rounded-full p-0.5 shrink-0 transition-colors ${on ? "bg-brand" : "bg-surface-2 border border-line"}`}
                    >
                      <span
                        className={`block w-5 h-5 rounded-full bg-white transition-transform ${on ? "translate-x-5" : ""}`}
                      />
                    </span>
                  </button>
                </div>
              );
            })}

          {err && <p className="text-xs text-red-400 mt-2">{err}</p>}

          {data && (
            <p className="text-xs text-muted mt-3">{t("consents.voluntary")}</p>
          )}
          {/* Klientka ma osobną kartę w każdej lokalizacji i o tym nie wie —
              bez tego zdania mogłaby sądzić, że wyłączyła SMS-y tylko w jednej. */}
          {data && multiSalon && (
            <p className="text-xs text-muted mt-1.5">
              {networkName
                ? t("consents.scopeNamed", { name: networkName })
                : t("consents.scope")}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
