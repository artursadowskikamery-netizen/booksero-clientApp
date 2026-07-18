import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";

// 16 języków obsługiwanych przez Booksero (nl dodany dla Belgii/Flandrii —
// Zakres A). Kolejność = priorytet wyświetlania w przełączniku.
export const SUPPORTED_LANGS = [
  "pl", "en", "de", "nl", "cs", "sv", "es", "fr", "it", "hr", "el", "tr", "bg", "fi", "no", "uk",
] as const;
export type Lang = (typeof SUPPORTED_LANGS)[number];

export const LANG_LABELS: Record<Lang, string> = {
  pl: "Polski", en: "English", de: "Deutsch", nl: "Nederlands", cs: "Čeština",
  sv: "Svenska", es: "Español", fr: "Français", it: "Italiano", hr: "Hrvatski",
  el: "Ελληνικά", tr: "Türkçe", bg: "Български", fi: "Suomi", no: "Norsk",
  uk: "Українська",
};

// Etykiety UI aplikacji (Zakres B). Struktura kluczy = źródło prawdy dla tłumaczy.
// Komunikaty serwera Booksero (Zakres A) tłumaczone osobno (TLUMACZENIA-BRIEF).
const resources = {
  pl: { translation: {
    common: { book: "Rezerwuj wizytę", bookCouple: "Rezerwuj dla pary — 2 osoby", next: "Dalej", back: "Wstecz", chooseCountry: "Wybierz kraj", chooseCity: "Wybierz miasto", chooseSalon: "Wybierz salon", login: "Zaloguj", loading: "Ładowanie…", services: "Usługi", team: "Zespół", reviews: "Opinie", soon: "Dostępne wkrótce" },
    tabs: { salon: "Salon", book: "Rezerwuj", visits: "Wizyty", rewards: "Bonusy", profile: "Profil" },
    welcome: { title: "Witamy Cię w BookSero", subtitle: "Rezerwuj wizyty w swoim ulubionym miejscu — szybko i bez dzwonienia.", start: "Zaczynajmy" },
    salon: { selfcare: "Zadbaj o siebie", subtitle: "Wolne terminy już w tym tygodniu" },
    booking: { done: "Gotowe!", backToSalon: "Wróć do salonu", prepaymentNote: "Wymagana przedpłata {{amount}} {{currency}} — link do płatności przyjdzie osobno.", stepService: "Usługa", stepStaff: "Specjalista", stepTime: "Termin", stepDetails: "Dane", specialist1: "Specjalista — osoba 1", specialist2: "Specjalista — osoba 2", anyStaff: "Dowolny wolny", chooseDay: "Wybierz dzień", freeHours: "Wolne godziny", chooseDayFirst: "Wybierz dzień powyżej.", noSlots: "Brak wolnych terminów tego dnia.", name: "Imię i nazwisko", name2: "Imię i nazwisko — osoba 2", phone: "Telefon", email: "E-mail", price: "Cena", perPerson: "/ os.", confirm: "Potwierdź rezerwację", code: "kod", forHowMany: "Dla ilu osób", onePerson: "1 osoba", coupleShort: "Para · 2 osoby" },
    landing: { placeholder: "UUID salonu lub slug wizytówki", mlNotSupported: "Numer ML nie jest jeszcze obsługiwany — użyj adresu wizytówki (slug) lub UUID salonu.", notFound: "Nie znaleziono salonu.", title: "Znajdź swój salon", scanHint: "Najprościej — zeskanuj kod QR, który dostałeś w swoim salonie.", qr: "Zeskanuj kod QR", qrSoon: "Skaner QR — dostępny wkrótce.", or: "albo", codeLabel: "Wpisz adres wizytówki (slug) lub kod", privacyNote: "Nie przeglądasz tu innych firm — trafiasz tylko do swojego salonu." },
  }},
  en: { translation: {
    common: { book: "Book an appointment", bookCouple: "Book for two", next: "Next", back: "Back", chooseCountry: "Choose a country", chooseCity: "Choose a city", chooseSalon: "Choose a salon", login: "Log in", loading: "Loading…", services: "Services", team: "Team", reviews: "Reviews", soon: "Coming soon" },
    tabs: { salon: "Salon", book: "Book", visits: "Visits", rewards: "Rewards", profile: "Profile" },
    welcome: { title: "Welcome to BookSero", subtitle: "Book appointments at your favourite place — fast, no phone calls.", start: "Get started" },
    salon: { selfcare: "Take care of yourself", subtitle: "Free slots this week" },
    booking: { done: "Done!", backToSalon: "Back to salon", prepaymentNote: "Prepayment of {{amount}} {{currency}} required — a payment link will arrive separately.", stepService: "Service", stepStaff: "Specialist", stepTime: "Date", stepDetails: "Details", specialist1: "Specialist — person 1", specialist2: "Specialist — person 2", anyStaff: "Any available", chooseDay: "Choose a day", freeHours: "Available times", chooseDayFirst: "Choose a day above.", noSlots: "No free slots that day.", name: "Full name", name2: "Full name — person 2", phone: "Phone", email: "E-mail", price: "Price", perPerson: "/ pers.", confirm: "Confirm booking", code: "code", forHowMany: "For how many people", onePerson: "1 person", coupleShort: "Couple · 2 people" },
    landing: { placeholder: "Salon UUID or profile slug", mlNotSupported: "The ML number isn't supported yet — use the profile address (slug) or the salon UUID.", notFound: "Salon not found.", title: "Find your salon", scanHint: "Easiest way — scan the QR code you got at your salon.", qr: "Scan QR code", qrSoon: "QR scanner — coming soon.", or: "or", codeLabel: "Enter the profile address (slug) or code", privacyNote: "You're not browsing other businesses — you go straight to your salon." },
  }},
  de: { translation: {
    common: { book: "Termin buchen", bookCouple: "Für zwei buchen", next: "Weiter", back: "Zurück", chooseCountry: "Land wählen", chooseCity: "Stadt wählen", chooseSalon: "Salon wählen", login: "Anmelden", loading: "Wird geladen…", services: "Leistungen", team: "Team", reviews: "Bewertungen", soon: "Bald verfügbar" },
    tabs: { salon: "Salon", book: "Buchen", visits: "Termine", rewards: "Boni", profile: "Profil" },
    welcome: { title: "Willkommen bei BookSero", subtitle: "Buche Termine bei deinem Lieblingsort — schnell und ohne Anruf.", start: "Los geht's" },
    salon: { selfcare: "Tu dir etwas Gutes", subtitle: "Freie Termine diese Woche" },
    booking: { done: "Fertig!", backToSalon: "Zurück zum Salon", prepaymentNote: "Anzahlung von {{amount}} {{currency}} erforderlich — der Zahlungslink kommt separat.", stepService: "Leistung", stepStaff: "Fachkraft", stepTime: "Termin", stepDetails: "Daten", specialist1: "Fachkraft — Person 1", specialist2: "Fachkraft — Person 2", anyStaff: "Beliebig verfügbar", chooseDay: "Tag wählen", freeHours: "Freie Zeiten", chooseDayFirst: "Wähle oben einen Tag.", noSlots: "Keine freien Termine an diesem Tag.", name: "Vor- und Nachname", name2: "Vor- und Nachname — Person 2", phone: "Telefon", email: "E-Mail", price: "Preis", perPerson: "/ Pers.", confirm: "Buchung bestätigen", code: "Code", forHowMany: "Für wie viele Personen", onePerson: "1 Person", coupleShort: "Paar · 2 Personen" },
    landing: { placeholder: "Salon-UUID oder Profil-Slug", mlNotSupported: "Die ML-Nummer wird noch nicht unterstützt — nutze die Profiladresse (Slug) oder die Salon-UUID.", notFound: "Salon nicht gefunden.", title: "Finde deinen Salon", scanHint: "Am einfachsten: Scanne den QR-Code aus deinem Salon.", qr: "QR-Code scannen", qrSoon: "QR-Scanner — bald verfügbar.", or: "oder", codeLabel: "Profiladresse (Slug) oder Code eingeben", privacyNote: "Du stöberst hier nicht in anderen Firmen — du landest direkt in deinem Salon." },
  }},
  nl: { translation: {
    common: { book: "Afspraak boeken", bookCouple: "Boek voor twee", next: "Volgende", back: "Terug", chooseCountry: "Kies een land", chooseCity: "Kies een stad", chooseSalon: "Kies een salon", login: "Inloggen", loading: "Laden…", services: "Diensten", team: "Team", reviews: "Beoordelingen", soon: "Binnenkort beschikbaar" },
    tabs: { salon: "Salon", book: "Boeken", visits: "Afspraken", rewards: "Bonussen", profile: "Profiel" },
    welcome: { title: "Welkom bij BookSero", subtitle: "Boek afspraken op je favoriete plek — snel en zonder te bellen.", start: "Aan de slag" },
    salon: { selfcare: "Zorg goed voor jezelf", subtitle: "Vrije plekken deze week" },
    booking: { done: "Klaar!", backToSalon: "Terug naar de salon", prepaymentNote: "Aanbetaling van {{amount}} {{currency}} vereist — de betaallink volgt apart.", stepService: "Dienst", stepStaff: "Specialist", stepTime: "Datum", stepDetails: "Gegevens", specialist1: "Specialist — persoon 1", specialist2: "Specialist — persoon 2", anyStaff: "Wie er beschikbaar is", chooseDay: "Kies een dag", freeHours: "Beschikbare tijden", chooseDayFirst: "Kies hierboven een dag.", noSlots: "Geen vrije tijden op die dag.", name: "Voor- en achternaam", name2: "Voor- en achternaam — persoon 2", phone: "Telefoon", email: "E-mail", price: "Prijs", perPerson: "/ pers.", confirm: "Boeking bevestigen", code: "code", forHowMany: "Voor hoeveel personen", onePerson: "1 persoon", coupleShort: "Duo · 2 personen" },
    landing: { placeholder: "Salon-UUID of profiel-slug", mlNotSupported: "Het ML-nummer wordt nog niet ondersteund — gebruik het profieladres (slug) of de salon-UUID.", notFound: "Salon niet gevonden.", title: "Vind je salon", scanHint: "Het makkelijkst — scan de QR-code die je in je salon hebt gekregen.", qr: "QR-code scannen", qrSoon: "QR-scanner — binnenkort beschikbaar.", or: "of", codeLabel: "Voer het profieladres (slug) of de code in", privacyNote: "Je bladert hier niet door andere bedrijven — je gaat rechtstreeks naar je eigen salon." },
  }},
  cs: { translation: {
    common: { book: "Rezervovat termín", bookCouple: "Rezervovat pro dva", next: "Dále", back: "Zpět", chooseCountry: "Vyberte zemi", chooseCity: "Vyberte město", chooseSalon: "Vyberte salon", login: "Přihlásit se", loading: "Načítání…", services: "Služby", team: "Tým", reviews: "Recenze", soon: "Již brzy" },
    tabs: { salon: "Salon", book: "Rezervovat", visits: "Návštěvy", rewards: "Bonusy", profile: "Profil" },
    welcome: { title: "Vítejte v BookSero", subtitle: "Rezervujte si termíny ve svém oblíbeném místě — rychle a bez telefonování.", start: "Začít" },
    salon: { selfcare: "Dopřejte si péči", subtitle: "Volné termíny už tento týden" },
    booking: { done: "Hotovo!", backToSalon: "Zpět do salonu", prepaymentNote: "Vyžadována záloha {{amount}} {{currency}} — odkaz k platbě přijde zvlášť.", stepService: "Služba", stepStaff: "Specialista", stepTime: "Termín", stepDetails: "Údaje", specialist1: "Specialista — osoba 1", specialist2: "Specialista — osoba 2", anyStaff: "Kdokoli volný", chooseDay: "Vyberte den", freeHours: "Volné časy", chooseDayFirst: "Vyberte den výše.", noSlots: "Žádné volné termíny tento den.", name: "Jméno a příjmení", name2: "Jméno a příjmení — osoba 2", phone: "Telefon", email: "E-mail", price: "Cena", perPerson: "/ os.", confirm: "Potvrdit rezervaci", code: "kód", forHowMany: "Pro kolik osob", onePerson: "1 osoba", coupleShort: "Pár · 2 osoby" },
    landing: { placeholder: "UUID salonu nebo slug vizitky", mlNotSupported: "Číslo ML zatím není podporováno — použijte adresu vizitky (slug) nebo UUID salonu.", notFound: "Salon nenalezen.", title: "Najdi svůj salon", scanHint: "Nejjednodušší je naskenovat QR kód ze svého salonu.", qr: "Naskenovat QR kód", qrSoon: "QR skener — již brzy.", or: "nebo", codeLabel: "Zadej adresu vizitky (slug) nebo kód", privacyNote: "Neprocházíš tu jiné podniky — jdeš rovnou do svého salonu." },
  }},
  sv: { translation: {
    common: { book: "Boka tid", bookCouple: "Boka för två", next: "Nästa", back: "Tillbaka", chooseCountry: "Välj land", chooseCity: "Välj stad", chooseSalon: "Välj salong", login: "Logga in", loading: "Laddar…", services: "Tjänster", team: "Team", reviews: "Recensioner", soon: "Kommer snart" },
    tabs: { salon: "Salong", book: "Boka", visits: "Besök", rewards: "Bonusar", profile: "Profil" },
    welcome: { title: "Välkommen till BookSero", subtitle: "Boka tider på ditt favoritställe — snabbt och utan att ringa.", start: "Kom igång" },
    salon: { selfcare: "Unna dig lite omtanke", subtitle: "Lediga tider redan denna vecka" },
    booking: { done: "Klart!", backToSalon: "Tillbaka till salongen", prepaymentNote: "Förskottsbetalning på {{amount}} {{currency}} krävs — betallänk kommer separat.", stepService: "Tjänst", stepStaff: "Specialist", stepTime: "Tid", stepDetails: "Uppgifter", specialist1: "Specialist — person 1", specialist2: "Specialist — person 2", anyStaff: "Vem som helst", chooseDay: "Välj dag", freeHours: "Lediga tider", chooseDayFirst: "Välj en dag ovan.", noSlots: "Inga lediga tider den dagen.", name: "För- och efternamn", name2: "För- och efternamn — person 2", phone: "Telefon", email: "E-post", price: "Pris", perPerson: "/ pers.", confirm: "Bekräfta bokning", code: "kod", forHowMany: "För hur många", onePerson: "1 person", coupleShort: "Par · 2 personer" },
    landing: { placeholder: "Salong-UUID eller profil-slug", mlNotSupported: "ML-numret stöds inte än — använd profiladressen (slug) eller salongens UUID.", notFound: "Salongen hittades inte.", title: "Hitta din salong", scanHint: "Enklast — skanna QR-koden du fick i din salong.", qr: "Skanna QR-kod", qrSoon: "QR-skanner — kommer snart.", or: "eller", codeLabel: "Ange profiladress (slug) eller kod", privacyNote: "Du bläddrar inte bland andra företag — du kommer direkt till din salong." },
  }},
  es: { translation: {
    common: { book: "Reservar cita", bookCouple: "Reservar para dos", next: "Siguiente", back: "Atrás", chooseCountry: "Elige un país", chooseCity: "Elige una ciudad", chooseSalon: "Elige un salón", login: "Iniciar sesión", loading: "Cargando…", services: "Servicios", team: "Equipo", reviews: "Opiniones", soon: "Próximamente" },
    tabs: { salon: "Salón", book: "Reservar", visits: "Visitas", rewards: "Bonos", profile: "Perfil" },
    welcome: { title: "Bienvenido a BookSero", subtitle: "Reserva citas en tu lugar favorito — rápido y sin llamadas.", start: "Empezar" },
    salon: { selfcare: "Cuídate", subtitle: "Huecos libres esta semana" },
    booking: { done: "¡Listo!", backToSalon: "Volver al salón", prepaymentNote: "Se requiere un anticipo de {{amount}} {{currency}} — el enlace de pago llegará por separado.", stepService: "Servicio", stepStaff: "Especialista", stepTime: "Fecha", stepDetails: "Datos", specialist1: "Especialista — persona 1", specialist2: "Especialista — persona 2", anyStaff: "Cualquiera disponible", chooseDay: "Elige un día", freeHours: "Horas libres", chooseDayFirst: "Elige un día arriba.", noSlots: "No hay horas libres ese día.", name: "Nombre y apellidos", name2: "Nombre y apellidos — persona 2", phone: "Teléfono", email: "Correo", price: "Precio", perPerson: "/ pers.", confirm: "Confirmar reserva", code: "código", forHowMany: "¿Para cuántas personas?", onePerson: "1 persona", coupleShort: "Pareja · 2 personas" },
    landing: { placeholder: "UUID del salón o slug del perfil", mlNotSupported: "El número ML aún no es compatible — usa la dirección del perfil (slug) o el UUID del salón.", notFound: "Salón no encontrado.", title: "Encuentra tu salón", scanHint: "Lo más fácil: escanea el código QR de tu salón.", qr: "Escanear código QR", qrSoon: "Escáner QR — próximamente.", or: "o", codeLabel: "Escribe la dirección del perfil (slug) o el código", privacyNote: "No navegas entre otros negocios — vas directo a tu salón." },
  }},
  fr: { translation: {
    common: { book: "Prendre rendez-vous", bookCouple: "Réserver pour deux", next: "Suivant", back: "Retour", chooseCountry: "Choisissez un pays", chooseCity: "Choisissez une ville", chooseSalon: "Choisissez un salon", login: "Se connecter", loading: "Chargement…", services: "Prestations", team: "Équipe", reviews: "Avis", soon: "Bientôt disponible" },
    tabs: { salon: "Salon", book: "Réserver", visits: "Visites", rewards: "Bonus", profile: "Profil" },
    welcome: { title: "Bienvenue sur BookSero", subtitle: "Réservez dans votre lieu préféré — rapidement et sans appeler.", start: "Commencer" },
    salon: { selfcare: "Prenez soin de vous", subtitle: "Des créneaux libres cette semaine" },
    booking: { done: "C'est fait !", backToSalon: "Retour au salon", prepaymentNote: "Un acompte de {{amount}} {{currency}} est requis — le lien de paiement arrivera séparément.", stepService: "Prestation", stepStaff: "Spécialiste", stepTime: "Date", stepDetails: "Coordonnées", specialist1: "Spécialiste — personne 1", specialist2: "Spécialiste — personne 2", anyStaff: "N'importe qui de disponible", chooseDay: "Choisissez un jour", freeHours: "Créneaux disponibles", chooseDayFirst: "Choisissez un jour ci-dessus.", noSlots: "Aucun créneau libre ce jour-là.", name: "Nom et prénom", name2: "Nom et prénom — personne 2", phone: "Téléphone", email: "E-mail", price: "Prix", perPerson: "/ pers.", confirm: "Confirmer la réservation", code: "code", forHowMany: "Pour combien de personnes", onePerson: "1 personne", coupleShort: "Duo · 2 personnes" },
    landing: { placeholder: "UUID du salon ou slug de la vitrine", mlNotSupported: "Le numéro ML n'est pas encore pris en charge — utilisez l'adresse de la vitrine (slug) ou l'UUID du salon.", notFound: "Salon introuvable.", title: "Trouvez votre salon", scanHint: "Le plus simple : scannez le QR code reçu dans votre salon.", qr: "Scanner le QR code", qrSoon: "Scanner QR — bientôt disponible.", or: "ou", codeLabel: "Saisissez l'adresse de la vitrine (slug) ou le code", privacyNote: "Vous ne parcourez pas d'autres établissements — vous arrivez directement dans votre salon." },
  }},
  it: { translation: {
    common: { book: "Prenota un appuntamento", bookCouple: "Prenota per due", next: "Avanti", back: "Indietro", chooseCountry: "Scegli un paese", chooseCity: "Scegli una città", chooseSalon: "Scegli un salone", login: "Accedi", loading: "Caricamento…", services: "Servizi", team: "Team", reviews: "Recensioni", soon: "In arrivo" },
    tabs: { salon: "Salone", book: "Prenota", visits: "Visite", rewards: "Bonus", profile: "Profilo" },
    welcome: { title: "Benvenuto su BookSero", subtitle: "Prenota nel tuo posto preferito — veloce e senza chiamate.", start: "Inizia" },
    salon: { selfcare: "Prenditi cura di te", subtitle: "Orari liberi questa settimana" },
    booking: { done: "Fatto!", backToSalon: "Torna al salone", prepaymentNote: "Richiesto un acconto di {{amount}} {{currency}} — il link di pagamento arriverà a parte.", stepService: "Servizio", stepStaff: "Specialista", stepTime: "Data", stepDetails: "Dati", specialist1: "Specialista — persona 1", specialist2: "Specialista — persona 2", anyStaff: "Chiunque disponibile", chooseDay: "Scegli un giorno", freeHours: "Orari liberi", chooseDayFirst: "Scegli un giorno qui sopra.", noSlots: "Nessun orario libero quel giorno.", name: "Nome e cognome", name2: "Nome e cognome — persona 2", phone: "Telefono", email: "E-mail", price: "Prezzo", perPerson: "/ pers.", confirm: "Conferma prenotazione", code: "codice", forHowMany: "Per quante persone", onePerson: "1 persona", coupleShort: "Coppia · 2 persone" },
    landing: { placeholder: "UUID del salone o slug della vetrina", mlNotSupported: "Il numero ML non è ancora supportato — usa l'indirizzo della vetrina (slug) o l'UUID del salone.", notFound: "Salone non trovato.", title: "Trova il tuo salone", scanHint: "Il modo più semplice: scansiona il codice QR del tuo salone.", qr: "Scansiona il codice QR", qrSoon: "Scanner QR — in arrivo.", or: "oppure", codeLabel: "Inserisci l'indirizzo della vetrina (slug) o il codice", privacyNote: "Non sfogli altre attività — vai dritto al tuo salone." },
  }},
  hr: { translation: {
    common: { book: "Rezerviraj termin", bookCouple: "Rezerviraj za dvoje", next: "Dalje", back: "Natrag", chooseCountry: "Odaberi državu", chooseCity: "Odaberi grad", chooseSalon: "Odaberi salon", login: "Prijava", loading: "Učitavanje…", services: "Usluge", team: "Tim", reviews: "Recenzije", soon: "Uskoro" },
    tabs: { salon: "Salon", book: "Rezerviraj", visits: "Posjete", rewards: "Bonusi", profile: "Profil" },
    welcome: { title: "Dobrodošli u BookSero", subtitle: "Rezervirajte termine na omiljenom mjestu — brzo i bez poziva.", start: "Započni" },
    salon: { selfcare: "Pobrini se za sebe", subtitle: "Slobodni termini već ovaj tjedan" },
    booking: { done: "Gotovo!", backToSalon: "Natrag na salon", prepaymentNote: "Potreban je predujam {{amount}} {{currency}} — poveznica za plaćanje stiže zasebno.", stepService: "Usluga", stepStaff: "Specijalist", stepTime: "Termin", stepDetails: "Podaci", specialist1: "Specijalist — osoba 1", specialist2: "Specijalist — osoba 2", anyStaff: "Bilo tko slobodan", chooseDay: "Odaberi dan", freeHours: "Slobodni termini", chooseDayFirst: "Odaberi dan iznad.", noSlots: "Nema slobodnih termina tog dana.", name: "Ime i prezime", name2: "Ime i prezime — osoba 2", phone: "Telefon", email: "E-mail", price: "Cijena", perPerson: "/ os.", confirm: "Potvrdi rezervaciju", code: "kod", forHowMany: "Za koliko osoba", onePerson: "1 osoba", coupleShort: "Par · 2 osobe" },
    landing: { placeholder: "UUID salona ili slug vizitke", mlNotSupported: "Broj ML još nije podržan — upotrijebi adresu vizitke (slug) ili UUID salona.", notFound: "Salon nije pronađen.", title: "Pronađi svoj salon", scanHint: "Najjednostavnije — skeniraj QR kod iz svog salona.", qr: "Skeniraj QR kod", qrSoon: "QR skener — uskoro.", or: "ili", codeLabel: "Upiši adresu vizitke (slug) ili kod", privacyNote: "Ne pregledavaš druge tvrtke — ideš izravno u svoj salon." },
  }},
  el: { translation: {
    common: { book: "Κλείσε ραντεβού", bookCouple: "Κράτηση για δύο", next: "Επόμενο", back: "Πίσω", chooseCountry: "Επίλεξε χώρα", chooseCity: "Επίλεξε πόλη", chooseSalon: "Επίλεξε σαλόνι", login: "Σύνδεση", loading: "Φόρτωση…", services: "Υπηρεσίες", team: "Ομάδα", reviews: "Κριτικές", soon: "Έρχεται σύντομα" },
    tabs: { salon: "Σαλόνι", book: "Κράτηση", visits: "Επισκέψεις", rewards: "Μπόνους", profile: "Προφίλ" },
    welcome: { title: "Καλώς ήρθες στο BookSero", subtitle: "Κλείσε ραντεβού στο αγαπημένο σου μέρος — γρήγορα και χωρίς τηλέφωνο.", start: "Ξεκίνα" },
    salon: { selfcare: "Φρόντισε τον εαυτό σου", subtitle: "Ελεύθερες ώρες αυτή την εβδομάδα" },
    booking: { done: "Έτοιμο!", backToSalon: "Πίσω στο σαλόνι", prepaymentNote: "Απαιτείται προκαταβολή {{amount}} {{currency}} — ο σύνδεσμος πληρωμής θα σταλεί ξεχωριστά.", stepService: "Υπηρεσία", stepStaff: "Ειδικός", stepTime: "Ημερομηνία", stepDetails: "Στοιχεία", specialist1: "Ειδικός — άτομο 1", specialist2: "Ειδικός — άτομο 2", anyStaff: "Οποιοσδήποτε διαθέσιμος", chooseDay: "Διάλεξε ημέρα", freeHours: "Διαθέσιμες ώρες", chooseDayFirst: "Διάλεξε ημέρα παραπάνω.", noSlots: "Δεν υπάρχουν ελεύθερες ώρες εκείνη την ημέρα.", name: "Ονοματεπώνυμο", name2: "Ονοματεπώνυμο — άτομο 2", phone: "Τηλέφωνο", email: "E-mail", price: "Τιμή", perPerson: "/ άτ.", confirm: "Επιβεβαίωση κράτησης", code: "κωδικός", forHowMany: "Για πόσα άτομα", onePerson: "1 άτομο", coupleShort: "Ζευγάρι · 2 άτομα" },
    landing: { placeholder: "UUID σαλονιού ή slug προφίλ", mlNotSupported: "Ο αριθμός ML δεν υποστηρίζεται ακόμη — χρησιμοποίησε τη διεύθυνση προφίλ (slug) ή το UUID του σαλονιού.", notFound: "Το σαλόνι δεν βρέθηκε.", title: "Βρες το σαλόνι σου", scanHint: "Το πιο απλό — σκάναρε τον κωδικό QR από το σαλόνι σου.", qr: "Σάρωση κωδικού QR", qrSoon: "Σαρωτής QR — έρχεται σύντομα.", or: "ή", codeLabel: "Γράψε τη διεύθυνση προφίλ (slug) ή τον κωδικό", privacyNote: "Δεν βλέπεις άλλες επιχειρήσεις — πας κατευθείαν στο σαλόνι σου." },
  }},
  tr: { translation: {
    common: { book: "Randevu al", bookCouple: "İki kişilik randevu", next: "İleri", back: "Geri", chooseCountry: "Ülke seç", chooseCity: "Şehir seç", chooseSalon: "Salon seç", login: "Giriş yap", loading: "Yükleniyor…", services: "Hizmetler", team: "Ekip", reviews: "Yorumlar", soon: "Çok yakında" },
    tabs: { salon: "Salon", book: "Randevu", visits: "Ziyaretler", rewards: "Bonuslar", profile: "Profil" },
    welcome: { title: "BookSero'ya hoş geldin", subtitle: "Favori mekanında randevu al — hızlı ve telefonsuz.", start: "Başla" },
    salon: { selfcare: "Kendine iyi bak", subtitle: "Bu hafta boş saatler var" },
    booking: { done: "Tamam!", backToSalon: "Salona dön", prepaymentNote: "{{amount}} {{currency}} ön ödeme gerekli — ödeme bağlantısı ayrıca gelecek.", stepService: "Hizmet", stepStaff: "Uzman", stepTime: "Tarih", stepDetails: "Bilgiler", specialist1: "Uzman — 1. kişi", specialist2: "Uzman — 2. kişi", anyStaff: "Müsait olan herkes", chooseDay: "Gün seç", freeHours: "Müsait saatler", chooseDayFirst: "Yukarıdan bir gün seç.", noSlots: "O gün müsait saat yok.", name: "Ad soyad", name2: "Ad soyad — 2. kişi", phone: "Telefon", email: "E-posta", price: "Fiyat", perPerson: "/ kişi", confirm: "Randevuyu onayla", code: "kod", forHowMany: "Kaç kişi için", onePerson: "1 kişi", coupleShort: "Çift · 2 kişi" },
    landing: { placeholder: "Salon UUID veya profil slug", mlNotSupported: "ML numarası henüz desteklenmiyor — profil adresini (slug) veya salon UUID'sini kullan.", notFound: "Salon bulunamadı.", title: "Salonunu bul", scanHint: "En kolayı — salonundan aldığın QR kodu tarat.", qr: "QR kodu tarat", qrSoon: "QR tarayıcı — çok yakında.", or: "veya", codeLabel: "Profil adresini (slug) veya kodu gir", privacyNote: "Burada başka işletmelere bakmazsın — doğrudan kendi salonuna gidersin." },
  }},
  bg: { translation: {
    common: { book: "Запази час", bookCouple: "Резервация за двама", next: "Напред", back: "Назад", chooseCountry: "Избери държава", chooseCity: "Избери град", chooseSalon: "Избери салон", login: "Вход", loading: "Зареждане…", services: "Услуги", team: "Екип", reviews: "Отзиви", soon: "Очаквайте скоро" },
    tabs: { salon: "Салон", book: "Резервирай", visits: "Посещения", rewards: "Бонуси", profile: "Профил" },
    welcome: { title: "Добре дошли в BookSero", subtitle: "Запазвай часове в любимото си място — бързо и без обаждания.", start: "Започни" },
    salon: { selfcare: "Погрижи се за себе си", subtitle: "Свободни часове още тази седмица" },
    booking: { done: "Готово!", backToSalon: "Обратно към салона", prepaymentNote: "Изисква се предплащане {{amount}} {{currency}} — линкът за плащане ще дойде отделно.", stepService: "Услуга", stepStaff: "Специалист", stepTime: "Дата", stepDetails: "Данни", specialist1: "Специалист — човек 1", specialist2: "Специалист — човек 2", anyStaff: "Който и да е свободен", chooseDay: "Избери ден", freeHours: "Свободни часове", chooseDayFirst: "Избери ден горе.", noSlots: "Няма свободни часове този ден.", name: "Име и фамилия", name2: "Име и фамилия — човек 2", phone: "Телефон", email: "Имейл", price: "Цена", perPerson: "/ чов.", confirm: "Потвърди резервацията", code: "код", forHowMany: "За колко души", onePerson: "1 човек", coupleShort: "Двойка · 2 души" },
    landing: { placeholder: "UUID на салона или slug на визитката", mlNotSupported: "Номерът ML още не се поддържа — използвай адреса на визитката (slug) или UUID на салона.", notFound: "Салонът не е намерен.", title: "Намери своя салон", scanHint: "Най-лесно — сканирай QR кода от твоя салон.", qr: "Сканирай QR код", qrSoon: "QR скенер — очаквайте скоро.", or: "или", codeLabel: "Въведи адреса на визитката (slug) или код", privacyNote: "Не разглеждаш други фирми — отиваш направо в своя салон." },
  }},
  fi: { translation: {
    common: { book: "Varaa aika", bookCouple: "Varaa kahdelle", next: "Seuraava", back: "Takaisin", chooseCountry: "Valitse maa", chooseCity: "Valitse kaupunki", chooseSalon: "Valitse salonki", login: "Kirjaudu", loading: "Ladataan…", services: "Palvelut", team: "Tiimi", reviews: "Arvostelut", soon: "Tulossa pian" },
    tabs: { salon: "Salonki", book: "Varaa", visits: "Käynnit", rewards: "Bonukset", profile: "Profiili" },
    welcome: { title: "Tervetuloa BookSeroon", subtitle: "Varaa aikoja suosikkipaikassasi — nopeasti ja ilman puheluita.", start: "Aloita" },
    salon: { selfcare: "Pidä huolta itsestäsi", subtitle: "Vapaita aikoja jo tällä viikolla" },
    booking: { done: "Valmis!", backToSalon: "Takaisin salonkiin", prepaymentNote: "Vaaditaan {{amount}} {{currency}} ennakkomaksu — maksulinkki tulee erikseen.", stepService: "Palvelu", stepStaff: "Asiantuntija", stepTime: "Aika", stepDetails: "Tiedot", specialist1: "Asiantuntija — henkilö 1", specialist2: "Asiantuntija — henkilö 2", anyStaff: "Kuka tahansa vapaa", chooseDay: "Valitse päivä", freeHours: "Vapaat ajat", chooseDayFirst: "Valitse päivä yltä.", noSlots: "Ei vapaita aikoja sinä päivänä.", name: "Etu- ja sukunimi", name2: "Etu- ja sukunimi — henkilö 2", phone: "Puhelin", email: "Sähköposti", price: "Hinta", perPerson: "/ hlö", confirm: "Vahvista varaus", code: "koodi", forHowMany: "Kuinka monelle", onePerson: "1 henkilö", coupleShort: "Pari · 2 henkilöä" },
    landing: { placeholder: "Salongin UUID tai profiilin slug", mlNotSupported: "ML-numeroa ei vielä tueta — käytä profiilin osoitetta (slug) tai salongin UUID:tä.", notFound: "Salonkia ei löytynyt.", title: "Löydä salonkisi", scanHint: "Helpointa — skannaa salongistasi saamasi QR-koodi.", qr: "Skannaa QR-koodi", qrSoon: "QR-skanneri — tulossa pian.", or: "tai", codeLabel: "Syötä profiilin osoite (slug) tai koodi", privacyNote: "Et selaa muita yrityksiä — pääset suoraan omaan salonkiisi." },
  }},
  no: { translation: {
    common: { book: "Bestill time", bookCouple: "Bestill for to", next: "Neste", back: "Tilbake", chooseCountry: "Velg land", chooseCity: "Velg by", chooseSalon: "Velg salong", login: "Logg inn", loading: "Laster…", services: "Tjenester", team: "Team", reviews: "Anmeldelser", soon: "Kommer snart" },
    tabs: { salon: "Salong", book: "Bestill", visits: "Besøk", rewards: "Bonuser", profile: "Profil" },
    welcome: { title: "Velkommen til BookSero", subtitle: "Bestill timer på ditt favorittsted — raskt og uten å ringe.", start: "Kom i gang" },
    salon: { selfcare: "Ta vare på deg selv", subtitle: "Ledige timer denne uken" },
    booking: { done: "Ferdig!", backToSalon: "Tilbake til salongen", prepaymentNote: "Forskuddsbetaling på {{amount}} {{currency}} kreves — betalingslenke kommer separat.", stepService: "Tjeneste", stepStaff: "Spesialist", stepTime: "Tid", stepDetails: "Opplysninger", specialist1: "Spesialist — person 1", specialist2: "Spesialist — person 2", anyStaff: "Hvem som helst ledig", chooseDay: "Velg dag", freeHours: "Ledige tider", chooseDayFirst: "Velg en dag over.", noSlots: "Ingen ledige tider den dagen.", name: "Fornavn og etternavn", name2: "Fornavn og etternavn — person 2", phone: "Telefon", email: "E-post", price: "Pris", perPerson: "/ pers.", confirm: "Bekreft bestilling", code: "kode", forHowMany: "For hvor mange", onePerson: "1 person", coupleShort: "Par · 2 personer" },
    landing: { placeholder: "Salong-UUID eller profil-slug", mlNotSupported: "ML-nummeret støttes ikke ennå — bruk profiladressen (slug) eller salongens UUID.", notFound: "Fant ikke salongen.", title: "Finn salongen din", scanHint: "Enklest — skann QR-koden du fikk i salongen din.", qr: "Skann QR-kode", qrSoon: "QR-skanner — kommer snart.", or: "eller", codeLabel: "Skriv inn profiladressen (slug) eller koden", privacyNote: "Du blar ikke i andre bedrifter — du går rett til din egen salong." },
  }},
  uk: { translation: {
    common: { book: "Записатися", bookCouple: "Бронювання для двох", next: "Далі", back: "Назад", chooseCountry: "Виберіть країну", chooseCity: "Виберіть місто", chooseSalon: "Виберіть салон", login: "Увійти", loading: "Завантаження…", services: "Послуги", team: "Команда", reviews: "Відгуки", soon: "Скоро" },
    tabs: { salon: "Салон", book: "Бронювати", visits: "Візити", rewards: "Бонуси", profile: "Профіль" },
    welcome: { title: "Ласкаво просимо до BookSero", subtitle: "Бронюйте візити в улюбленому місці — швидко та без дзвінків.", start: "Почати" },
    salon: { selfcare: "Подбай про себе", subtitle: "Вільні години вже цього тижня" },
    booking: { done: "Готово!", backToSalon: "Назад до салону", prepaymentNote: "Потрібна передоплата {{amount}} {{currency}} — посилання на оплату надійде окремо.", stepService: "Послуга", stepStaff: "Спеціаліст", stepTime: "Дата", stepDetails: "Дані", specialist1: "Спеціаліст — особа 1", specialist2: "Спеціаліст — особа 2", anyStaff: "Будь-хто вільний", chooseDay: "Виберіть день", freeHours: "Вільні години", chooseDayFirst: "Виберіть день вище.", noSlots: "Немає вільних годин того дня.", name: "Ім'я та прізвище", name2: "Ім'я та прізвище — особа 2", phone: "Телефон", email: "Ел. пошта", price: "Ціна", perPerson: "/ ос.", confirm: "Підтвердити бронювання", code: "код", forHowMany: "На скільки осіб", onePerson: "1 особа", coupleShort: "Пара · 2 особи" },
    landing: { placeholder: "UUID салону або slug візитки", mlNotSupported: "Номер ML поки не підтримується — використайте адресу візитки (slug) або UUID салону.", notFound: "Салон не знайдено.", title: "Знайди свій салон", scanHint: "Найпростіше — відскануй QR-код зі свого салону.", qr: "Сканувати QR-код", qrSoon: "QR-сканер — скоро.", or: "або", codeLabel: "Введи адресу візитки (slug) або код", privacyNote: "Ти не переглядаєш інші компанії — потрапляєш одразу до свого салону." },
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
