import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { Download, X } from "lucide-react";
import { useTranslation } from "react-i18next";
import { isLoggedIn } from "../lib/auth";
import { isStandalone, platform } from "../lib/push";

// Zachęta do instalacji PWA (SPEC powiadomienia+instalacja §4). Pokazywana
// TYLKO: po zalogowaniu, w trybie przeglądarki (nie standalone), gdy nie
// zainstalowano i nie zamknięto "X" w ostatnich 14 dniach.
// Android/Chrome: przycisk → systemowy prompt (beforeinstallprompt z main.tsx).
// iOS Safari: brak promptu — krótka instrukcja Udostępnij → Do ekranu początkowego.
const DISMISS_KEY = "booksero_install_dismiss";
const INSTALLED_KEY = "booksero_installed";
const DISMISS_DAYS = 14;

type Bip = Event & { prompt: () => Promise<void> };

function bip(): Bip | null {
  return ((window as unknown as { __bipEvent?: Bip | null }).__bipEvent as Bip) || null;
}

function dismissed(): boolean {
  const ts = Number(localStorage.getItem(DISMISS_KEY) || 0);
  return ts > 0 && Date.now() - ts < DISMISS_DAYS * 24 * 60 * 60 * 1000;
}

export default function InstallBanner() {
  const { t } = useTranslation();
  const [loc] = useLocation(); // re-render przy nawigacji (np. po zalogowaniu)
  const [, force] = useState(0);
  const [hidden, setHidden] = useState(false);

  // beforeinstallprompt może dojść po starcie — odśwież, gdy się pojawi.
  useEffect(() => {
    const onReady = () => force((n) => n + 1);
    window.addEventListener("bip-ready", onReady);
    return () => window.removeEventListener("bip-ready", onReady);
  }, []);

  if (hidden || isStandalone()) return null;
  if (!isLoggedIn()) return null;
  if (localStorage.getItem(INSTALLED_KEY)) return null;
  if (dismissed()) return null;
  // Baner nie może zasłaniać logowania/rezerwacji — nie pokazujemy go tam.
  if (loc === "/" || loc.endsWith("/login") || loc.endsWith("/book")) return null;

  const ios = platform() === "ios";
  const canPrompt = !!bip();
  if (!ios && !canPrompt) return null; // np. desktop bez wsparcia — cicho

  const close = () => {
    localStorage.setItem(DISMISS_KEY, String(Date.now()));
    setHidden(true);
  };

  return (
    <div className="fixed left-3 right-3 bottom-20 z-40 max-w-md mx-auto rounded-2xl border border-line bg-surface shadow-lg p-3">
      <div className="flex items-start gap-3">
        <div className="w-9 h-9 rounded-xl bg-surface-2 grid place-items-center shrink-0">
          <Download size={17} className="text-brand" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-bold">{t("install.banner")}</div>
          {ios ? (
            <p className="text-xs text-muted mt-1">{t("install.ios")}</p>
          ) : (
            <button
              className="mt-2 rounded-xl bg-brand text-white text-sm font-bold px-4 py-2"
              onClick={async () => {
                try {
                  await bip()?.prompt();
                } catch {
                  /* odrzucony prompt — baner zostaje do "X" */
                }
              }}
            >
              {t("install.button")}
            </button>
          )}
        </div>
        <button onClick={close} aria-label="X" className="text-muted p-1 shrink-0">
          <X size={16} />
        </button>
      </div>
    </div>
  );
}
