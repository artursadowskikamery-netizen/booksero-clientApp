import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";

// 15 języków obsługiwanych dziś przez Booksero (BEZ 'nl' — patrz ARCHITEKTURA §7,
// docs/TLUMACZENIA-BRIEF.md). Kolejność = priorytet wyświetlania w przełączniku.
export const SUPPORTED_LANGS = [
  "pl", "en", "de", "cs", "sv", "es", "fr", "it", "hr", "el", "tr", "bg", "fi", "no", "uk",
] as const;
export type Lang = (typeof SUPPORTED_LANGS)[number];

export const LANG_LABELS: Record<Lang, string> = {
  pl: "Polski", en: "English", de: "Deutsch", cs: "Čeština", sv: "Svenska",
  es: "Español", fr: "Français", it: "Italiano", hr: "Hrvatski", el: "Ελληνικά",
  tr: "Türkçe", bg: "Български", fi: "Suomi", no: "Norsk", uk: "Українська",
};

// Etykiety UI aplikacji. Na start pl + en; pozostałe języki dokłada osobna sesja
// tłumaczeniowa (fallback: en). Struktura kluczy jest źródłem prawdy dla tłumaczy.
const resources = {
  pl: {
    translation: {
      common: {
        book: "Rezerwuj wizytę",
        bookCouple: "Rezerwuj dla pary — 2 osoby",
        next: "Dalej",
        back: "Wstecz",
        chooseCountry: "Wybierz kraj",
        chooseCity: "Wybierz miasto",
        chooseSalon: "Wybierz salon",
        login: "Zaloguj",
        loading: "Ładowanie…",
        services: "Usługi",
        team: "Zespół",
        reviews: "Opinie",
      },
      welcome: {
        title: "Witamy Cię w BookSero",
        subtitle: "Rezerwuj wizyty w swoim ulubionym miejscu — szybko i bez dzwonienia.",
        start: "Zaczynajmy",
      },
    },
  },
  en: {
    translation: {
      common: {
        book: "Book an appointment",
        bookCouple: "Book for two",
        next: "Next",
        back: "Back",
        chooseCountry: "Choose a country",
        chooseCity: "Choose a city",
        chooseSalon: "Choose a salon",
        login: "Log in",
        loading: "Loading…",
        services: "Services",
        team: "Team",
        reviews: "Reviews",
      },
      welcome: {
        title: "Welcome to BookSero",
        subtitle: "Book appointments at your favourite place — fast, no phone calls.",
        start: "Get started",
      },
    },
  },
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: "en",
    supportedLngs: SUPPORTED_LANGS as unknown as string[],
    nonExplicitSupportedLngs: true, // fr-BE -> fr, cs-CZ -> cs
    load: "languageOnly",
    interpolation: { escapeValue: false },
    detection: {
      // Język URZĄDZENIA (nie lokalizacja GPS) + zapamiętanie wyboru.
      order: ["localStorage", "navigator"],
      lookupLocalStorage: "i18nextLng", // spójne z Booksero (X-Locale)
      caches: ["localStorage"],
    },
  });

export default i18n;
