import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { Bell, X } from "lucide-react";
import { useTranslation } from "react-i18next";
import { isLoggedIn } from "../lib/auth";
import {
  PUSH_REPROMPT_EVENT,
  enablePush,
  hostPonownejZgody,
  pushSupported,
  repromptRequested,
} from "../lib/push";

// Baner „Włącz powiadomienia ponownie” — krok 2 Booktago (nowy adres
// app.booktago.com). Pokazywany TYLKO, gdy jednocześnie:
//  - aplikacja działa pod hostem z listy w lib/push.ts (app.booktago.com),
//  - klientka jest zalogowana, a jej KONTO ma powiadomienia włączone
//    (autoRejoinPush dostał od serwera enabled=true i zgłosił potrzebę zgody),
//  - zgoda przeglądarki w tym originie jest „default” (nie „denied”),
//  - nie zamknięto banera „X” w ostatnich 7 dniach.
// Klik w przycisk = ta sama ścieżka co w Profilu (enablePush): prośba
// o zgodę + subskrypcja, bez zmian w API panelu.
const DISMISS_KEY = "bs_push_reprompt_dismiss";
const DISMISS_DAYS = 7;

function dismissed(): boolean {
  try {
    const ts = Number(localStorage.getItem(DISMISS_KEY) || 0);
    return ts > 0 && Date.now() - ts < DISMISS_DAYS * 24 * 60 * 60 * 1000;
  } catch {
    return false;
  }
}

export default function PushReprompt() {
  const { t } = useTranslation();
  const [loc] = useLocation(); // re-render przy nawigacji (np. po zalogowaniu)
  const [requested, setRequested] = useState(repromptRequested);
  const [hidden, setHidden] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const onReq = () => setRequested(true);
    window.addEventListener(PUSH_REPROMPT_EVENT, onReq);
    return () => window.removeEventListener(PUSH_REPROMPT_EVENT, onReq);
  }, []);

  if (!requested || hidden) return null;
  if (!hostPonownejZgody() || !pushSupported()) return null;
  if (!isLoggedIn()) return null;
  if (Notification.permission !== "default") return null;
  if (dismissed()) return null;
  // Nie zasłaniamy startu, logowania ani rezerwacji.
  if (loc === "/" || loc.endsWith("/login") || loc.endsWith("/book")) return null;

  const close = () => {
    try {
      localStorage.setItem(DISMISS_KEY, String(Date.now()));
    } catch {
      /* brak localStorage — baner zniknie do następnego uruchomienia */
    }
    setHidden(true);
  };

  const onEnable = async () => {
    setBusy(true);
    try {
      await enablePush();
    } catch {
      /* odmowa albo brak sieci — stan pokaże Profil */
    } finally {
      setBusy(false);
      setHidden(true);
    }
  };

  return (
    <div
      className="fixed left-3 right-3 z-40 max-w-md mx-auto rounded-2xl border border-line bg-surface shadow-lg p-3"
      style={{ top: "calc(env(safe-area-inset-top, 0px) + 12px)" }}
    >
      <div className="flex items-start gap-3">
        <div className="w-9 h-9 rounded-xl bg-surface-2 grid place-items-center shrink-0">
          <Bell size={17} className="text-brand" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-bold">{t("push.reprompt")}</div>
          <p className="text-xs text-muted mt-1">{t("push.repromptHint")}</p>
          <button
            onClick={onEnable}
            disabled={busy}
            className="mt-2 rounded-xl bg-brand text-brand-contrast text-sm font-bold px-4 py-2 disabled:opacity-60"
          >
            {t("push.repromptButton")}
          </button>
        </div>
        <button onClick={close} aria-label="X" className="text-muted p-1 shrink-0">
          <X size={16} />
        </button>
      </div>
    </div>
  );
}
