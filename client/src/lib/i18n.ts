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
  pl: { translation: {
    common: { book: "Rezerwuj wizytę", bookCouple: "Rezerwuj dla pary — 2 osoby", next: "Dalej", back: "Wstecz", chooseCountry: "Wybierz kraj", chooseCity: "Wybierz miasto", chooseSalon: "Wybierz salon", login: "Zaloguj", loading: "Ładowanie…", services: "Usługi", team: "Zespół", reviews: "Opinie" },
    welcome: { title: "Witamy Cię w BookSero", subtitle: "Rezerwuj wizyty w swoim ulubionym miejscu — szybko i bez dzwonienia.", start: "Zaczynajmy" },
  }},
  en: { translation: {
    common: { book: "Book an appointment", bookCouple: "Book for two", next: "Next", back: "Back", chooseCountry: "Choose a country", chooseCity: "Choose a city", chooseSalon: "Choose a salon", login: "Log in", loading: "Loading…", services: "Services", team: "Team", reviews: "Reviews" },
    welcome: { title: "Welcome to BookSero", subtitle: "Book appointments at your favourite place — fast, no phone calls.", start: "Get started" },
  }},
  de: { translation: {
    common: { book: "Termin buchen", bookCouple: "Für zwei buchen", next: "Weiter", back: "Zurück", chooseCountry: "Land wählen", chooseCity: "Stadt wählen", chooseSalon: "Salon wählen", login: "Anmelden", loading: "Wird geladen…", services: "Leistungen", team: "Team", reviews: "Bewertungen" },
    welcome: { title: "Willkommen bei BookSero", subtitle: "Buche Termine bei deinem Lieblingsort — schnell und ohne Anruf.", start: "Los geht's" },
  }},
  cs: { translation: {
    common: { book: "Rezervovat termín", bookCouple: "Rezervovat pro dva", next: "Dále", back: "Zpět", chooseCountry: "Vyberte zemi", chooseCity: "Vyberte město", chooseSalon: "Vyberte salon", login: "Přihlásit se", loading: "Načítání…", services: "Služby", team: "Tým", reviews: "Recenze" },
    welcome: { title: "Vítejte v BookSero", subtitle: "Rezervujte si termíny ve svém oblíbeném místě — rychle a bez telefonování.", start: "Začít" },
  }},
  sv: { translation: {
    common: { book: "Boka tid", bookCouple: "Boka för två", next: "Nästa", back: "Tillbaka", chooseCountry: "Välj land", chooseCity: "Välj stad", chooseSalon: "Välj salong", login: "Logga in", loading: "Laddar…", services: "Tjänster", team: "Team", reviews: "Recensioner" },
    welcome: { title: "Välkommen till BookSero", subtitle: "Boka tider på ditt favoritställe — snabbt och utan att ringa.", start: "Kom igång" },
  }},
  es: { translation: {
    common: { book: "Reservar cita", bookCouple: "Reservar para dos", next: "Siguiente", back: "Atrás", chooseCountry: "Elige un país", chooseCity: "Elige una ciudad", chooseSalon: "Elige un salón", login: "Iniciar sesión", loading: "Cargando…", services: "Servicios", team: "Equipo", reviews: "Opiniones" },
    welcome: { title: "Bienvenido a BookSero", subtitle: "Reserva citas en tu lugar favorito — rápido y sin llamadas.", start: "Empezar" },
  }},
  fr: { translation: {
    common: { book: "Prendre rendez-vous", bookCouple: "Réserver pour deux", next: "Suivant", back: "Retour", chooseCountry: "Choisissez un pays", chooseCity: "Choisissez une ville", chooseSalon: "Choisissez un salon", login: "Se connecter", loading: "Chargement…", services: "Prestations", team: "Équipe", reviews: "Avis" },
    welcome: { title: "Bienvenue sur BookSero", subtitle: "Réservez dans votre lieu préféré — rapidement et sans appeler.", start: "Commencer" },
  }},
  it: { translation: {
    common: { book: "Prenota un appuntamento", bookCouple: "Prenota per due", next: "Avanti", back: "Indietro", chooseCountry: "Scegli un paese", chooseCity: "Scegli una città", chooseSalon: "Scegli un salone", login: "Accedi", loading: "Caricamento…", services: "Servizi", team: "Team", reviews: "Recensioni" },
    welcome: { title: "Benvenuto su BookSero", subtitle: "Prenota nel tuo posto preferito — veloce e senza chiamate.", start: "Inizia" },
  }},
  hr: { translation: {
    common: { book: "Rezerviraj termin", bookCouple: "Rezerviraj za dvoje", next: "Dalje", back: "Natrag", chooseCountry: "Odaberi državu", chooseCity: "Odaberi grad", chooseSalon: "Odaberi salon", login: "Prijava", loading: "Učitavanje…", services: "Usluge", team: "Tim", reviews: "Recenzije" },
    welcome: { title: "Dobrodošli u BookSero", subtitle: "Rezervirajte termine na omiljenom mjestu — brzo i bez poziva.", start: "Započni" },
  }},
  el: { translation: {
    common: { book: "Κλείσε ραντεβού", bookCouple: "Κράτηση για δύο", next: "Επόμενο", back: "Πίσω", chooseCountry: "Επίλεξε χώρα", chooseCity: "Επίλεξε πόλη", chooseSalon: "Επίλεξε σαλόνι", login: "Σύνδεση", loading: "Φόρτωση…", services: "Υπηρεσίες", team: "Ομάδα", reviews: "Κριτικές" },
    welcome: { title: "Καλώς ήρθες στο BookSero", subtitle: "Κλείσε ραντεβού στο αγαπημένο σου μέρος — γρήγορα και χωρίς τηλέφωνο.", start: "Ξεκίνα" },
  }},
  tr: { translation: {
    common: { book: "Randevu al", bookCouple: "İki kişilik randevu", next: "İleri", back: "Geri", chooseCountry: "Ülke seç", chooseCity: "Şehir seç", chooseSalon: "Salon seç", login: "Giriş yap", loading: "Yükleniyor…", services: "Hizmetler", team: "Ekip", reviews: "Yorumlar" },
    welcome: { title: "BookSero'ya hoş geldin", subtitle: "Favori mekanında randevu al — hızlı ve telefonsuz.", start: "Başla" },
  }},
  bg: { translation: {
    common: { book: "Запази час", bookCouple: "Резервация за двама", next: "Напред", back: "Назад", chooseCountry: "Избери държава", chooseCity: "Избери град", chooseSalon: "Избери салон", login: "Вход", loading: "Зареждане…", services: "Услуги", team: "Екип", reviews: "Отзиви" },
    welcome: { title: "Добре дошли в BookSero", subtitle: "Запазвай часове в любимото си място — бързо и без обаждания.", start: "Започни" },
  }},
  fi: { translation: {
    common: { book: "Varaa aika", bookCouple: "Varaa kahdelle", next: "Seuraava", back: "Takaisin", chooseCountry: "Valitse maa", chooseCity: "Valitse kaupunki", chooseSalon: "Valitse salonki", login: "Kirjaudu", loading: "Ladataan…", services: "Palvelut", team: "Tiimi", reviews: "Arvostelut" },
    welcome: { title: "Tervetuloa BookSeroon", subtitle: "Varaa aikoja suosikkipaikassasi — nopeasti ja ilman puheluita.", start: "Aloita" },
  }},
  no: { translation: {
    common: { book: "Bestill time", bookCouple: "Bestill for to", next: "Neste", back: "Tilbake", chooseCountry: "Velg land", chooseCity: "Velg by", chooseSalon: "Velg salong", login: "Logg inn", loading: "Laster…", services: "Tjenester", team: "Team", reviews: "Anmeldelser" },
    welcome: { title: "Velkommen til BookSero", subtitle: "Bestill timer på ditt favorittsted — raskt og uten å ringe.", start: "Kom i gang" },
  }},
  uk: { translation: {
    common: { book: "Записатися", bookCouple: "Бронювання для двох", next: "Далі", back: "Назад", chooseCountry: "Виберіть країну", chooseCity: "Виберіть місто", chooseSalon: "Виберіть салон", login: "Увійти", loading: "Завантаження…", services: "Послуги", team: "Команда", reviews: "Відгуки" },
    welcome: { title: "Ласкаво просимо до BookSero", subtitle: "Бронюйте візити в улюбленому місці — швидко та без дзвінків.", start: "Почати" },
  }},
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
