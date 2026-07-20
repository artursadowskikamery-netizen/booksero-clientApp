// Web Push + sygnał instalacji (PWA). Klucz publiczny VAPID pobieramy z API
// (zero sekretów w aplikacji); treść i język powiadomień ogarnia serwer.
import { api, ApiError } from "./api";

export type PushPlatform = "android" | "ios" | "web";
export type PushState = "unsupported" | "ios-install" | "denied" | "default" | "subscribed";

export function platform(): PushPlatform {
  const ua = navigator.userAgent || "";
  if (/iPhone|iPad|iPod/i.test(ua)) return "ios";
  if (/Android/i.test(ua)) return "android";
  return "web";
}

// PWA uruchomiona z ekranu głównego (standalone).
export function isStandalone(): boolean {
  try {
    return (
      window.matchMedia("(display-mode: standalone)").matches ||
      (navigator as unknown as { standalone?: boolean }).standalone === true
    );
  } catch {
    return false;
  }
}

export function pushSupported(): boolean {
  return "serviceWorker" in navigator && "PushManager" in window && "Notification" in window;
}

function urlBase64ToUint8Array(base64: string): Uint8Array {
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);
  const b64 = (base64 + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(b64);
  const out = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
  return out;
}

// Stan do UI (Profil / zachęta po rezerwacji).
// iOS bez instalacji na ekranie głównym nie wspiera Web Push (iOS >= 16.4
// tylko w trybie standalone) — wtedy pokazujemy podpowiedź, nie prośbę o zgodę.
export async function getPushState(): Promise<PushState> {
  if (!pushSupported()) return platform() === "ios" ? "ios-install" : "unsupported";
  if (Notification.permission === "denied") return "denied";
  if (Notification.permission === "granted") {
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (sub) return "subscribed";
    } catch {
      /* brak SW — potraktuj jak default */
    }
  }
  return "default";
}

// Subskrypcja + rejestracja urządzenia w Booksero. Wymaga zgody (granted).
// Idempotentne (upsert po endpoint) — bezpieczne przy każdym starcie aplikacji.
export async function ensurePushSubscribed(): Promise<"ok" | "disabled" | "unsupported"> {
  if (!pushSupported()) return "unsupported";
  let key: string;
  try {
    key = (await api.pushVapidKey()).key;
  } catch (e) {
    // 404 = push wyłączony na serwerze — nie pokazujemy niczego.
    if (e instanceof ApiError && e.status === 404) return "disabled";
    throw e;
  }
  const reg = await navigator.serviceWorker.ready;
  let sub = await reg.pushManager.getSubscription();
  if (!sub) {
    sub = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(key) as BufferSource,
    });
  }
  const j = sub.toJSON() as { keys?: { p256dh?: string; auth?: string } };
  await api.pushSubscribe({
    transport: "webpush",
    endpoint: sub.endpoint,
    keys: { p256dh: j.keys?.p256dh || "", auth: j.keys?.auth || "" },
    platform: platform(),
  });
  return "ok";
}

// Świadome włączenie przez klienta (klik w przycisk) — prośba o zgodę + subskrypcja.
export async function enablePush(): Promise<"ok" | "denied" | "disabled" | "unsupported"> {
  if (!pushSupported()) return "unsupported";
  const perm = await Notification.requestPermission();
  if (perm !== "granted") return "denied";
  return ensurePushSubscribed();
}

// Świadome WYŁĄCZENIE push przez klienta (suwak w Profilu) — bez wylogowania.
// Wyrejestrowuje urządzenie w Booksero i kasuje lokalną subskrypcję.
export async function disablePush(): Promise<void> {
  if (!pushSupported()) return;
  const reg = await navigator.serviceWorker.ready;
  const sub = await reg.pushManager.getSubscription();
  if (!sub) return;
  await api.pushUnsubscribe(sub.endpoint).catch(() => {});
  await sub.unsubscribe().catch(() => {});
}

// Przy wylogowaniu: wyrejestruj urządzenie na serwerze (jeszcze z tokenem!)
// i skasuj lokalną subskrypcję.
export async function disablePushOnLogout(): Promise<void> {
  try {
    if (!pushSupported()) return;
    const reg = await navigator.serviceWorker.ready;
    const sub = await reg.pushManager.getSubscription();
    if (!sub) return;
    await api.pushUnsubscribe(sub.endpoint).catch(() => {});
    await sub.unsubscribe().catch(() => {});
  } catch {
    /* wylogowanie ma się udać niezależnie od push */
  }
}

// Sygnał instalacji: raz, przy pierwszym uruchomieniu w trybie standalone
// (kafelek „Zainstalowało aplikację" w panelu). Endpoint idempotentny.
const INSTALL_KEY = "booksero_install_sent";
export async function sendInstallSignalOnce(): Promise<void> {
  try {
    if (!isStandalone()) return;
    if (localStorage.getItem(INSTALL_KEY)) return;
    await api.appEvent("install", platform());
    localStorage.setItem(INSTALL_KEY, "1");
  } catch {
    /* spróbujemy przy następnym starcie */
  }
}
