import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { Download, X } from "lucide-react";
import { useTranslation } from "react-i18next";
import { isLoggedIn } from "../lib/auth";
import {
  APP_STORE_URL,
  GOOGLE_PLAY_URL,
  isAppleMobile,
  isStandalone,
  isStoreApp,
  platform,
} from "../lib/push";

// Zachęta do instalacji (SPEC powiadomienia+instalacja §4). Pokazywana TYLKO:
// po zalogowaniu, w przeglądarce (nie standalone, nie powłoka ze sklepu), gdy
// nie zainstalowano i nie zamknięto "X" w ostatnich 14 dniach.
// Od publikacji w sklepach (2026-09) baner prowadzi do sklepu urządzenia:
// iOS/iPadOS → App Store (zamiast instrukcji "Udostępnij → Do ekranu
// początkowego"), Android → Google Play obok systemowej instalacji PWA.
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

  if (hidden || isStandalone() || isStoreApp()) return null;
  if (!isLoggedIn()) return null;
  if (localStorage.getItem(INSTALLED_KEY)) return null;
  if (dismissed()) return null;
  // Baner nie może zasłaniać logowania/rezerwacji — nie pokazujemy go tam.
  if (loc === "/" || loc.endsWith("/login") || loc.endsWith("/book")) return null;

  const ios = isAppleMobile();
  const android = platform() === "android";
  const canPrompt = !!bip();
  // Desktop bez wsparcia instalacji i bez sklepu na tym urządzeniu — cicho.
  if (!ios && !android && !canPrompt) return null;

  const close = () => {
    localStorage.setItem(DISMISS_KEY, String(Date.now()));
    setHidden(true);
  };

  const storeBtn = "rounded-xl bg-brand text-white text-sm font-bold px-4 py-2 inline-block";

  return (
    <div className="fixed left-3 right-3 bottom-20 z-40 max-w-md mx-auto rounded-2xl border border-line bg-surface shadow-lg p-3">
      <div className="flex items-start gap-3">
        <div className="w-9 h-9 rounded-xl bg-surface-2 grid place-items-center shrink-0">
          <Download size={17} className="text-brand" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-bold">{t("install.banner")}</div>
          <div className="mt-2 flex flex-wrap gap-2">
            {ios && (
              <a className={storeBtn} href={APP_STORE_URL} target="_blank" rel="noopener noreferrer">
                {t("install.appStore")}
              </a>
            )}
            {android && (
              <a className={storeBtn} href={GOOGLE_PLAY_URL} target="_blank" rel="noopener noreferrer">
                {t("install.googlePlay")}
              </a>
            )}
            {!ios && canPrompt && (
              <button
                className="rounded-xl border border-line text-sm font-bold px-4 py-2"
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
        </div>
        <button onClick={close} aria-label="X" className="text-muted p-1 shrink-0">
          <X size={16} />
        </button>
      </div>
    </div>
  );
}
