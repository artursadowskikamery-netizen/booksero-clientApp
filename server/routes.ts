import type { Express, Request, Response } from "express";
import { bookseroGet, bookseroPost, bookseroPatch, bookseroDelete } from "./booksero";

const enc = encodeURIComponent;
const loc = (req: Request) => String(req.headers["x-locale"] || "pl").slice(0, 2);
const relay = (res: Response, r: { status: number; data: unknown }) => res.status(r.status).json(r.data);

// BFF: mapuje /api/* aplikacji na publiczne /api/public/* Booksero.
export function registerRoutes(app: Express) {
  app.get("/api/health", (_req, res) => res.json({ ok: true, service: "booksero-clientapp" }));

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

  app.post("/api/client/push/subscribe", async (req, res) =>
    relay(res, await bookseroPost(`/api/public/client/push/subscribe`, req.body ?? {}, loc(req), auth(req))));

  app.post("/api/client/push/unsubscribe", async (req, res) =>
    relay(res, await bookseroPost(`/api/public/client/push/unsubscribe`, req.body ?? {}, loc(req), auth(req))));

  app.post("/api/client/app-event", async (req, res) =>
    relay(res, await bookseroPost(`/api/public/client/app-event`, req.body ?? {}, loc(req), auth(req))));

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
