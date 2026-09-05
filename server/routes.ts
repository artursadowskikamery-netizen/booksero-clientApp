import type { Express, Request, Response } from "express";
import { bookseroGet, bookseroPost, bookseroPatch, bookseroDelete } from "./booksero";
import { APP_VERSION } from "@shared/version";
import { ASSET_LINKS } from "./assetlinks";
import { privacyPage } from "./privacy";

const enc = encodeURIComponent;
const loc = (req: Request) => String(req.headers["x-locale"] || "pl").slice(0, 2);
const relay = (res: Response, r: { status: number; data: unknown }) => res.status(r.status).json(r.data);

// BFF: mapuje /api/* aplikacji na publiczne /api/public/* Booksero.
export function registerRoutes(app: Express) {
  app.get("/api/health", (_req, res) => res.json({ ok: true, service: "booksero-clientapp" }));

  // Wersja WDROŻONEJ aplikacji — aplikacja porównuje ją z wersją, z którą
  // się załadowała (sprawdzanie aktualizacji w Profilu).
  app.get("/api/app-version", (_req, res) => res.json({ version: APP_VERSION }));

  // Digital Asset Links dla TWA (Google Play). Trasa jawna, bo express.static
  // blokuje ścieżki z kropką (.well-known). Treść w server/assetlinks.ts.
  app.get("/.well-known/assetlinks.json", (_req, res) =>
    res.type("application/json").send(JSON.stringify(ASSET_LINKS)));

  // Polityka prywatności pod publicznym adresem — wymóg Google Play. Trasa
  // MUSI być zarejestrowana przed statyką, inaczej przechwyci ją aplikacja
  // (jej router potraktowałby „polityka-prywatnosci" jak adres salonu).
  const polityka = (_req: Request, res: Response) =>
    res.type("text/html; charset=utf-8").set("Cache-Control", "public, max-age=300").send(privacyPage());
  app.get("/polityka-prywatnosci", polityka);
  app.get("/privacy", polityka);

  // Slug wizytówki → { salonId }. (Numer ML nie ma dziś publicznego rozwiązania.)
  app.get("/api/resolve/:slug", async (req, res) =>
    relay(res, await bookseroGet(`/api/public/s/${enc(req.params.slug)}`, loc(req))));

  // Tenant: marka + hierarchia kraj→miasto→salon.
  // ZALEŻNOŚĆ: /api/public/tenant/:id trzeba dodać w Booksero (ARCHITEKTURA §8.1).
  app.get("/api/tenant/:tenantId", async (req, res) => {
    relay(res, await bookseroGet(`/api/public/tenant/${enc(req.params.tenantId)}`, loc(req)));
  });

  const s = (req: Request) => enc(String(req.params.salonId));

  app.get("/api/salon/:salonId", async (req, res) =>
    relay(res, await bookseroGet(`/api/public/book/${s(req)}`, loc(req))));

  app.get("/api/salon/:salonId/categories", async (req, res) =>
    relay(res, await bookseroGet(`/api/public/book/${s(req)}/categories`, loc(req))));

  app.get("/api/salon/:salonId/services", async (req, res) =>
    relay(res, await bookseroGet(`/api/public/book/${s(req)}/services`, loc(req))));

  app.get("/api/salon/:salonId/staff", async (req, res) =>
    relay(res, await bookseroGet(
      `/api/public/book/${s(req)}/staff?serviceId=${enc(String(req.query.serviceId || ""))}`,
      loc(req),
    )));

  app.get("/api/salon/:salonId/team", async (req, res) =>
    relay(res, await bookseroGet(`/api/public/book/${s(req)}/team`, loc(req))));

  app.get("/api/salon/:salonId/reviews", async (req, res) =>
    relay(res, await bookseroGet(`/api/public/book/${s(req)}/reviews`, loc(req))));

  app.get("/api/salon/:salonId/availability", async (req, res) => {
    const q = new URLSearchParams(req.query as Record<string, string>).toString();
    relay(res, await bookseroGet(`/api/public/book/${s(req)}/availability?${q}`, loc(req)));
  });

  // ── Logowanie klienta (SMS) + self-service — przekazujemy Authorization ──
  const auth = (req: Request) =>
    req.headers.authorization ? { Authorization: String(req.headers.authorization) } : undefined;

  // Rezerwacja: z tokenem klienta backend podpina wizytę pod jego konto
  // (SPEC-rezerwacja-zalogowanego §2); bez tokenu działa jak dotychczas.
  app.post("/api/salon/:salonId/appointments", async (req, res) =>
    relay(res, await bookseroPost(`/api/public/book/${s(req)}/appointments`, req.body, loc(req), auth(req))));

  // ── Wejście do salonu bez kodu QR (ZLECENIE-panel-haslo-salonu-i-wejscie-po-numerze) ──
  // Co panel już umie. Odpowiedź inna niż 200 (punktu jeszcze nie ma, awaria)
  // → false/false, ZAWSZE ze statusem 200: aplikacja ma wtedy działać jak
  // dotychczas, a nie pokazywać błąd. Wynik trzymamy 5 minut — ten punkt woła
  // każdy zimny start, a zmienia się raz na wdrożenie panelu.
  let capsCache: { at: number; data: { password: boolean; phoneFind: boolean } } | null = null;
  app.get("/api/app/entry-capabilities", async (req, res) => {
    if (capsCache && Date.now() - capsCache.at < 5 * 60_000) return res.json(capsCache.data);
    const r = await bookseroGet(`/api/public/app/entry-capabilities`, loc(req));
    const d = (r.ok && r.data && typeof r.data === "object" ? r.data : {}) as Record<string, unknown>;
    const data = { password: d.password === true, phoneFind: d.phoneFind === true };
    // Niepowodzenie też zapamiętujemy — krócej (1 min), żeby nie młócić panelu,
    // ale i nie czekać 5 minut po jego wdrożeniu.
    capsCache = { at: r.ok ? Date.now() : Date.now() - 4 * 60_000, data };
    return res.json(data);
  });

  // Hasło salonu → firma + lokalizacje. Dopasowanie dokładne robi panel.
  app.get("/api/app/password", async (req, res) => {
    const q = new URLSearchParams({
      q: String(req.query.q || ""),
      country: String(req.query.country || ""),
    }).toString();
    relay(res, await bookseroGet(`/api/public/app/password?${q}`, loc(req)));
  });

  // Licznik wejść (którędy klientka weszła) — osobny punkt panelu, bez tokenu.
  // `app-event` się nie nadaje: wymaga tokenu i stempluje kartotekę.
  app.post("/api/app/entry", async (req, res) =>
    relay(res, await bookseroPost(`/api/public/app/entry`, req.body ?? {}, loc(req))));

  // „Masz już u nas kartotekę?" — SMS → lista firm → wejście bez drugiego SMS-a.
  app.post("/api/client-auth/find/request", async (req, res) =>
    relay(res, await bookseroPost(`/api/public/client-auth/find/request`, req.body ?? {}, loc(req))));
  app.post("/api/client-auth/find/verify", async (req, res) =>
    relay(res, await bookseroPost(`/api/public/client-auth/find/verify`, req.body ?? {}, loc(req))));
  app.post("/api/client-auth/find/enter", async (req, res) =>
    relay(res, await bookseroPost(`/api/public/client-auth/find/enter`, req.body ?? {}, loc(req))));

  app.post("/api/client-auth/request-code", async (req, res) =>
    relay(res, await bookseroPost(`/api/public/client-auth/request-code`, req.body, loc(req))));

  app.post("/api/client-auth/verify", async (req, res) =>
    relay(res, await bookseroPost(`/api/public/client-auth/verify`, req.body, loc(req))));

  app.get("/api/client/me", async (req, res) =>
    relay(res, await bookseroGet(`/api/public/client/me`, loc(req), auth(req))));

  app.get("/api/client/appointments", async (req, res) => {
    const q = new URLSearchParams(req.query as Record<string, string>).toString();
    relay(res, await bookseroGet(`/api/public/client/appointments?${q}`, loc(req), auth(req)));
  });

  // Odwołanie wizyty istniejącym publicznym tokenem anulowania.
  app.post("/api/visit/:token/cancel", async (req, res) =>
    relay(res, await bookseroPost(`/api/public/cancel/${enc(req.params.token)}`, req.body ?? {}, loc(req))));

  // Krótki link polecenia: /r/:code → { tenantId, ref } (SPEC-krotki-link-polecenia).
  app.get("/api/r/:code", async (req, res) =>
    relay(res, await bookseroGet(`/api/public/r/${enc(String(req.params.code))}`, loc(req))));

  // ── Powiadomienia push (Web Push) + sygnał instalacji ──
  app.get("/api/client/push/vapid-key", async (req, res) =>
    relay(res, await bookseroGet(`/api/public/client/push/vapid-key`, loc(req), auth(req))));

  // Stan KONTA (wspólny dla wszystkich urządzeń) + intencja włącz/wyłącz
  // (powiadomienia per konto; /disable gasi wszystkie odbiorniki naraz).
  app.get("/api/client/push/status", async (req, res) =>
    relay(res, await bookseroGet(`/api/public/client/push/status`, loc(req), auth(req))));

  app.post("/api/client/push/enable", async (req, res) =>
    relay(res, await bookseroPost(`/api/public/client/push/enable`, req.body ?? {}, loc(req), auth(req))));

  app.post("/api/client/push/disable", async (req, res) =>
    relay(res, await bookseroPost(`/api/public/client/push/disable`, req.body ?? {}, loc(req), auth(req))));

  app.post("/api/client/push/subscribe", async (req, res) =>
    relay(res, await bookseroPost(`/api/public/client/push/subscribe`, req.body ?? {}, loc(req), auth(req))));

  app.post("/api/client/push/unsubscribe", async (req, res) =>
    relay(res, await bookseroPost(`/api/public/client/push/unsubscribe`, req.body ?? {}, loc(req), auth(req))));

  app.post("/api/client/app-event", async (req, res) =>
    relay(res, await bookseroPost(`/api/public/client/app-event`, req.body ?? {}, loc(req), auth(req))));

  // ── Zgody klientki (SPEC-zgody-klientek) — rejestr RODO ──
  app.get("/api/client/zgody", async (req, res) =>
    relay(res, await bookseroGet(`/api/public/client/zgody`, loc(req), auth(req))));

  app.patch("/api/client/zgody", async (req, res) =>
    relay(res, await bookseroPatch(`/api/public/client/zgody`, req.body ?? {}, loc(req), auth(req))));

  // ── Skrzynka powiadomień klienta (SPEC-skrzynka-powiadomien) ──
  app.get("/api/client/notifications", async (req, res) => {
    const q = new URLSearchParams(req.query as Record<string, string>).toString();
    relay(res, await bookseroGet(`/api/public/client/notifications${q ? `?${q}` : ""}`, loc(req), auth(req)));
  });

  app.get("/api/client/notifications/unread-count", async (req, res) =>
    relay(res, await bookseroGet(`/api/public/client/notifications/unread-count`, loc(req), auth(req))));

  app.post("/api/client/notifications/read", async (req, res) =>
    relay(res, await bookseroPost(`/api/public/client/notifications/read`, req.body ?? {}, loc(req), auth(req))));

  // ── Moje kody (SPEC-bonusy-etap-B2) ──
  app.get("/api/client/codes", async (req, res) =>
    relay(res, await bookseroGet(`/api/public/client/codes`, loc(req), auth(req))));

  app.post("/api/client/codes", async (req, res) =>
    relay(res, await bookseroPost(`/api/public/client/codes`, req.body ?? {}, loc(req), auth(req))));

  app.patch("/api/client/codes/:id/use", async (req, res) =>
    relay(res, await bookseroPatch(
      `/api/public/client/codes/${enc(String(req.params.id))}/use`,
      req.body ?? {},
      loc(req),
      auth(req),
    )));

  app.delete("/api/client/codes/:id", async (req, res) =>
    relay(res, await bookseroDelete(
      `/api/public/client/codes/${enc(String(req.params.id))}`,
      loc(req),
      auth(req),
    )));

  // ── Polecenia SMS (SPEC-bonusy-etap-B) ──
  app.get("/api/client/referrals", async (req, res) =>
    relay(res, await bookseroGet(`/api/public/client/referrals`, loc(req), auth(req))));

  app.post("/api/client/referrals", async (req, res) =>
    relay(res, await bookseroPost(`/api/public/client/referrals`, req.body ?? {}, loc(req), auth(req))));

  // ── Bonusy Etap A (SPEC-bonusy-etap-A) — program lojalnościowy klienta ──
  app.get("/api/client/loyalty", async (req, res) =>
    relay(res, await bookseroGet(`/api/public/client/loyalty`, loc(req), auth(req))));

  app.post("/api/client/loyalty/join", async (req, res) =>
    relay(res, await bookseroPost(`/api/public/client/loyalty/join`, req.body ?? {}, loc(req), auth(req))));

  app.post("/api/client/loyalty/rewards/:rewardId/claim", async (req, res) =>
    relay(res, await bookseroPost(
      `/api/public/client/loyalty/rewards/${enc(String(req.params.rewardId))}/claim`,
      req.body ?? {},
      loc(req),
      auth(req),
    )));

  app.post("/api/client/loyalty/claims/:id/cancel", async (req, res) =>
    relay(res, await bookseroPost(
      `/api/public/client/loyalty/claims/${enc(String(req.params.id))}/cancel`,
      req.body ?? {},
      loc(req),
      auth(req),
    )));

  // Odwołanie WŁASNEJ wizyty zalogowanego klienta (SPEC-rezerwacja-zalogowanego §3).
  app.post("/api/client/appointments/:id/cancel", async (req, res) =>
    relay(res, await bookseroPost(
      `/api/public/client/appointments/${enc(String(req.params.id))}/cancel`,
      req.body ?? {},
      loc(req),
      auth(req),
    )));
}
