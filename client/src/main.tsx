import { createRoot } from "react-dom/client";
import App from "./App";
import "./lib/i18n";
import "./index.css";
import { applyAccent, loadAccent } from "./lib/themes";
import { checkForUpdate, applyUpdate } from "./lib/version";

// Zawsze ciemna szata + przywrócenie akcentu salonu z poprzedniej wizyty.
applyAccent(loadAccent());

createRoot(document.getElementById("root")!).render(<App />);

// AUTO-AKTUALIZACJA przy starcie: PWA potrafi trzymać stary build w cache,
// a ręczny przycisk w Profilu wymaga zalogowania (pułapka, gdy szwankuje samo
// logowanie). Dlatego przy każdym uruchomieniu porównujemy wersję z serwerem
// i w tle sami czyścimy cache + przeładowujemy. Bezpiecznik w sessionStorage:
// jedna próba na wersję serwera — brak pętli, gdyby serwer podawał inną wersję.
(async () => {
  try {
    const { latest, hasUpdate } = await checkForUpdate();
    const KEY = "bs_autoupdate_tried";
    if (hasUpdate && sessionStorage.getItem(KEY) !== latest) {
      sessionStorage.setItem(KEY, latest);
      await applyUpdate();
    }
  } catch {
    /* offline/serwer niedostępny — działamy na tym, co mamy */
  }
})();

// PWA: rejestracja service workera (wymagana do instalacji na telefonie).
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js").catch(() => {});
  });
}

// Instalacja PWA: beforeinstallprompt strzela raz, często ZANIM React
// wystartuje — łapiemy tu i odkładamy dla banera (InstallBanner).
window.addEventListener("beforeinstallprompt", (e) => {
  e.preventDefault();
  (window as unknown as { __bipEvent?: Event | null }).__bipEvent = e;
  window.dispatchEvent(new Event("bip-ready"));
});
window.addEventListener("appinstalled", () => {
  localStorage.setItem("booksero_installed", "1");
  (window as unknown as { __bipEvent?: Event | null }).__bipEvent = null;
  window.dispatchEvent(new Event("bip-ready"));
});
