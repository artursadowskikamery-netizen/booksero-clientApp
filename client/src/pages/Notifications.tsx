import { useEffect, useState } from "react";
import { useRoute, useLocation } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import { ChevronLeft, CheckCheck, BellOff } from "lucide-react";
import { useTranslation } from "react-i18next";
import { api, ApiError } from "../lib/api";
import { setAppBadgeCount } from "../lib/push";
import { isLoggedIn, clearToken } from "../lib/auth";
import BottomNav from "../components/BottomNav";
import type { ClientNotification } from "@shared/types";

const PAGE = 30;

// Skrzynka powiadomień (SPEC-skrzynka-powiadomien): lista od najnowszych,
// stronicowanie kursorem before (createdAt ostatniej pozycji), nieprzeczytane
// wyróżnione. Klik = oznacz przeczytane + nawigacja wg url. Push jest tylko
// kanałem dostawy — tu leży treść, także dla klientów z wyłączonym push.
export default function Notifications() {
  const [, params] = useRoute("/salon/:salonId/notifications");
  const salonId = params?.salonId ?? "";
  const [, navigate] = useLocation();
  const { t, i18n } = useTranslation();
  const qc = useQueryClient();

  const logged = isLoggedIn();
  useEffect(() => {
    if (!logged) navigate(`/salon/${salonId}/login`);
  }, [logged, salonId, navigate]);

  const [items, setItems] = useState<ClientNotification[] | null>(null);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  const load = async (before?: string) => {
    setBusy(true);
    try {
      const r = await api.notifications(PAGE, before);
      setItems((prev) => [...(prev ?? []), ...r.items]);
      if (r.items.length < PAGE) setDone(true);
    } catch (e) {
      if (e instanceof ApiError && e.status === 401) {
        clearToken();
        navigate(`/salon/${salonId}/login`);
        return;
      }
      // 404 = backend bez skrzynki (jeszcze niewdrożony) — pusta lista, bez błędu.
      setItems((prev) => prev ?? []);
      setDone(true);
    } finally {
      setBusy(false);
    }
  };

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Po operacji read backend oddaje licznik PO zmianie — plakietka (w aplikacji
  // i na ikonie) bez dodatkowego zapytania.
  const setUnread = (count: number) => {
    qc.setQueryData(["notifUnread"], { count });
    void setAppBadgeCount(count);
  };

  const markRead = async (ids: string[]) => {
    try {
      const r = await api.notificationsRead({ ids });
      setUnread(r.count);
      const now = new Date().toISOString();
      setItems((prev) => prev?.map((n) => (ids.includes(n.id) ? { ...n, readAt: n.readAt ?? now } : n)) ?? null);
    } catch {
      /* offline — stan dociągnie się przy następnym wejściu */
    }
  };

  const markAll = async () => {
    try {
      const r = await api.notificationsRead({ all: true });
      setUnread(r.count);
      const now = new Date().toISOString();
      setItems((prev) => prev?.map((n) => ({ ...n, readAt: n.readAt ?? now })) ?? null);
    } catch {
      /* jw. */
    }
  };

  // Mapowanie url → ekran aplikacji (kontrakt skrzynki). Bonusy nazywają się
  // u nas "rewards"; /codes żyje w Bonusach. https → nowa karta przeglądarki.
  const open = (n: ClientNotification) => {
    if (!n.readAt) void markRead([n.id]);
    const url = n.url;
    if (!url) return;
    if (/^https?:\/\//i.test(url)) {
      window.open(url, "_blank", "noopener");
      return;
    }
    let path = url.replace("/bonuses", "/rewards");
    if (path === "/codes" || path === "/rewards") path = `/salon/${n.salonId || salonId}/rewards`;
    navigate(path);
  };

  const when = (iso: string) =>
    new Date(iso).toLocaleString(i18n.language, {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

  const hasUnread = !!items?.some((n) => !n.readAt);

  return (
    <div className="max-w-md mx-auto min-h-screen p-4 pb-24">
      <header className="flex items-center gap-2 py-2">
        <button
          onClick={() => navigate(`/salon/${salonId}`)}
          className="w-9 h-9 rounded-xl border border-line grid place-items-center text-ink-2"
          aria-label={t("common.back")}
        >
          <ChevronLeft size={18} />
        </button>
        <div className="font-bold flex-1">{t("notif.title")}</div>
        {hasUnread && (
          <button
            onClick={markAll}
            className="flex items-center gap-1.5 text-xs font-bold text-brand py-2 px-2"
          >
            <CheckCheck size={15} /> {t("notif.markAll")}
          </button>
        )}
      </header>

      {items === null && <p className="text-sm text-muted text-center py-10">{t("common.loading")}</p>}

      {items !== null && items.length === 0 && (
        <div className="text-center py-14 text-muted">
          <BellOff size={28} className="mx-auto mb-3 opacity-60" />
          <p className="text-sm">{t("notif.empty")}</p>
        </div>
      )}

      {items !== null && items.length > 0 && (
        <div className="divide-y divide-line">
          {items.map((n) => (
            <button
              key={n.id}
              onClick={() => open(n)}
              className="w-full text-left py-3 flex gap-3 items-start"
            >
              {/* Kropka nieprzeczytanego */}
              <span
                className={`mt-1.5 w-2 h-2 rounded-full shrink-0 ${n.readAt ? "bg-transparent" : "bg-brand"}`}
              />
              <span className="flex-1 min-w-0">
                <span className={`block text-sm ${n.readAt ? "font-semibold text-ink-2" : "font-bold"}`}>
                  {n.title}
                </span>
                {n.body && <span className="block text-sm text-muted mt-0.5">{n.body}</span>}
                <span className="block text-[11px] text-muted mt-1">{when(n.createdAt)}</span>
              </span>
            </button>
          ))}
        </div>
      )}

      {items !== null && items.length > 0 && !done && (
        <button
          onClick={() => void load(items[items.length - 1]?.createdAt)}
          disabled={busy}
          className="w-full text-sm text-brand font-semibold py-3 disabled:opacity-50"
        >
          {busy ? t("common.loading") : t("notif.older")}
        </button>
      )}

      <BottomNav salonId={salonId} />
    </div>
  );
}
