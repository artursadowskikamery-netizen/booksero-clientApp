import { APP_VERSION } from "@shared/version";

export { APP_VERSION };

// Porównuje wersję, z którą aplikacja się załadowała (APP_VERSION wbudowany
// w build), z wersją WDROŻONĄ na serwerze. Różnica = mamy starą (zbuforowaną)
// wersję i można się zaktualizować.
export async function checkForUpdate(): Promise<{ current: string; latest: string; hasUpdate: boolean }> {
  const res = await fetch("/api/app-version", { cache: "no-store" });
  const data = (await res.json()) as { version: string };
  const latest = data.version || APP_VERSION;
  return { current: APP_VERSION, latest, hasUpdate: latest !== APP_VERSION };
}

// Wymusza pobranie najnowszej wersji: kasuje service workera i cache, po czym
// przeładowuje stronę (bez tego przeglądarka potrafi trzymać stary build).
export async function applyUpdate(): Promise<void> {
  try {
    if ("serviceWorker" in navigator) {
      const regs = await navigator.serviceWorker.getRegistrations();
      await Promise.all(regs.map((r) => r.unregister()));
    }
    if ("caches" in window) {
      const keys = await caches.keys();
      await Promise.all(keys.map((k) => caches.delete(k)));
    }
  } catch {
    /* i tak przeładujemy */
  }
  window.location.reload();
}
