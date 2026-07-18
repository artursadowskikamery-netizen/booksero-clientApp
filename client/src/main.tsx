import { createRoot } from "react-dom/client";
import App from "./App";
import "./lib/i18n";
import "./index.css";
import { applySalonTheme, loadTheme } from "./lib/themes";

// Przywróć motyw salonu (szablon wizytówki) zapisany z poprzedniej wizyty.
applySalonTheme(loadTheme());

createRoot(document.getElementById("root")!).render(<App />);

// PWA: rejestracja service workera (wymagana do instalacji na telefonie).
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js").catch(() => {});
  });
}
