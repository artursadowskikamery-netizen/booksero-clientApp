# Booktago — teksty kart w Google Play i App Store (16 języków)

**Status:** SZKIC DO AKCEPTACJI WŁAŚCICIELA — gałąź `claude/booktago-krok2`, krok 2
rebrandingu. NIE wklejać do konsol przed dniem S0 (plan, sekcja 5.3).

**Źródło:** żywa karta w `OPIS-SKLEP-TLUMACZENIA.md` (tego pliku NIE edytujemy do
dnia wydania — opisuje kartę, która jest dziś w sklepach). Krótkie i pełne opisy
różnią się od żywej karty WYŁĄCZNIE nazwą. Nowe są: podtytuł App Store, słowa
kluczowe App Store i „Co nowego”.

**Zasady tekstów (decyzje właściciela 2026-10-13):**
- nazwa zawsze „Booktago” (wielkie tylko B), także pod ikoną i w nazwie wpisu;
- bez wzmianek o poprzedniej nazwie — system od zawsze był Booktago;
- identyfikator pakietu Android i bundle ID iOS bez zmian (patrz
  `AKTUALIZACJE-GOOGLE-PLAY.md`, `APP-STORE.md`) — karta zmienia tylko teksty;
- kontakt w sklepach: developer@viviestetic.eu (decyzja P8).

**Limity:** Google Play — nazwa 30, krótki opis 80, pełny opis 4000, „Co nowego” 500
znaków. App Store — nazwa 30, podtytuł 30, słowa kluczowe 100, opis 4000. Słowa
kluczowe trzymamy w 100 znakach ORAZ w 100 bajtach UTF-8 (litery greckie i cyrylica
zajmują 2 bajty; nie wiadomo na pewno, którą miarę stosuje App Store Connect, więc
spełniamy obie). Słowa kluczowe bez spacji po przecinkach i bez słów z nazwy
i podtytułu (App Store indeksuje je osobno). Tabela zgodności na końcu pliku;
po każdej zmianie tekstu: `node script/limity-wpisow.mjs` (kod wyjścia 1 = przekroczony
limit).

## Pola wspólne (wszystkie języki)

| Pole | Wartość |
|---|---|
| Polityka prywatności — Google Play | https://booktago.app/polityka-prywatnosci |
| Privacy Policy URL — App Store | https://booktago.app/privacy |
| Support URL — App Store | https://booktago.com (do potwierdzenia: strona z kontaktem musi działać w dniu S0) |
| E-mail kontaktowy (oba sklepy) | developer@viviestetic.eu |
| Nazwa dewelopera (Play) | Booktago |
| Kategoria | Play: Uroda; App Store: Lifestyle (bez zmian) |
| Grafika Play 1024×500 | `feature-graphic-booktago-1024x500.png` — DO ZROBIENIA w S-7 (plan 5.3) |
| Zrzuty ekranu | DO ZROBIENIA w S-7, z konta testowego, bez danych klientek |

**Notatka dla recenzenta App Store (EN) — dopisać na początku pola Notes wersji 1.1:**

```
Version 1.1 changes the app name and home-screen name to Booktago and the web
address loaded by the app to https://booktago.app. Features, publisher
(VIVI ESTETIC SP. Z O.O.) and the test account are unchanged.
```

**App Store — język bułgarski:** jeśli App Store Connect nie oferuje bułgarskiego
(lista języków ASC), pomiń tę lokalizację — karta pokaże wersję angielską.
Google Play obsługuje bułgarski.

**„Co nowego”:** propozycja z planu (S0). Jeśli wolisz bez zdania o nazwie — zostaw
samo zdanie o poprawkach.

---

## Polski [pl] — Play: pl-PL · App Store: Polish

### Play — nazwa aplikacji
Booktago

### Play — krótki opis
Rezerwuj wizyty w salonie, zbieraj punkty, odbieraj nagrody.

### Play — pełny opis (= App Store — opis)
Booktago to aplikacja do rezerwacji wizyt w Twoim ulubionym salonie — szybko, wygodnie i bez dzwonienia.

Jak zacząć: zeskanuj kod QR z salonu, wpisz nazwę, którą podał Ci salon, albo wejdź swoim numerem telefonu — aplikacja pokaże salony, w których masz już kartotekę. Booktago nie jest katalogiem salonów: trafiasz prosto do swojego.

Co możesz zrobić w aplikacji:
• Zarezerwować wizytę w kilku krokach — wybierz usługę, specjalistę i termin.
• Rezerwować także dla dwóch osób naraz (tryb dla pary).
• Zobaczyć swoje nadchodzące wizyty i historię, a wizytę łatwo odwołać.
• Logować się wygodnie kodem SMS — bez haseł.
• Dostawać przypomnienia o wizytach jako powiadomienia.

Program bonusowy (jeśli salon go prowadzi):
• Zbieraj punkty za wizyty i awansuj na kolejne poziomy.
• Odbieraj nagrody i kody rabatowe.
• Polecaj salon znajomym i zyskujcie oboje.
• Korzystaj z promocyjnych godzin i rezerwuj taniej.

Booktago działa w 16 językach. Aplikacja jest bezpłatna dla klientów salonu.

### App Store — nazwa
Booktago

### App Store — podtytuł
Wizyty w salonie i nagrody

### App Store — słowa kluczowe
fryzjer,uroda,paznokcie,kosmetyczka,spa,masaż,barber,rezerwacja,manicure,punkty,przypomnienie

### Co nowego (Play i App Store)
Nowa nazwa: Booktago. Drobne poprawki i usprawnienia.

---

## English [en] — Play: en-US (domyślny wpisu) · App Store: English (U.S.) — domyślny

### Play — nazwa aplikacji
Booktago

### Play — krótki opis
Book salon visits, collect points, claim rewards — on your phone.

### Play — pełny opis (= App Store — opis)
Booktago is the app for booking appointments at your favourite salon — fast, easy and without phone calls.

How to start: scan the QR code from your salon, enter the name your salon gave you, or enter with your phone number — the app shows the salons where you already have a client record. Booktago is not a salon directory: you go straight to your own salon.

What you can do in the app:
• Book an appointment in a few steps — pick a service, a specialist and a time.
• Book for two people at once (couple mode).
• See your upcoming appointments and history, and cancel easily.
• Sign in with an SMS code — no passwords.
• Get appointment reminders as notifications.

Loyalty programme (if your salon runs one):
• Collect points for visits and move up through levels.
• Claim rewards and discount codes.
• Refer friends to the salon and you both benefit.
• Use happy-hour slots and book at a lower price.

Booktago works in 16 languages. The app is free for salon clients.

### App Store — nazwa
Booktago

### App Store — podtytuł
Salon bookings & rewards

### App Store — słowa kluczowe
beauty,hair,nails,spa,massage,barber,appointment,manicure,loyalty,points,reminder,cosmetics

### Co nowego (Play i App Store)
New name: Booktago. Minor fixes and improvements.

---

## Deutsch [de] — Play: de-DE · App Store: German

### Play — nazwa aplikacji
Booktago

### Play — krótki opis
Salontermine buchen, Punkte sammeln, Prämien einlösen.

### Play — pełny opis (= App Store — opis)
Booktago ist die App zum Buchen von Terminen in deinem Lieblingssalon — schnell, bequem und ohne Anruf.

So geht's los: Scanne den QR-Code aus deinem Salon, gib den Namen ein, den dir der Salon genannt hat, oder tritt mit deiner Telefonnummer ein — die App zeigt die Salons, in denen du bereits eine Kundenakte hast. Booktago ist kein Salonverzeichnis: Du landest direkt in deinem eigenen Salon.

Das kannst du in der App:
• Termin in wenigen Schritten buchen — Leistung, Fachkraft und Uhrzeit wählen.
• Für zwei Personen gleichzeitig buchen (Paar-Modus).
• Kommende Termine und Verlauf sehen, Termine einfach absagen.
• Anmeldung per SMS-Code — ohne Passwort.
• Terminerinnerungen als Benachrichtigungen erhalten.

Bonusprogramm (falls dein Salon eines anbietet):
• Punkte für Besuche sammeln und Stufen aufsteigen.
• Prämien und Rabattcodes einlösen.
• Freunde empfehlen — beide profitieren.
• Happy-Hour-Termine günstiger buchen.

Booktago gibt es in 16 Sprachen. Die App ist für Salonkunden kostenlos.

### App Store — nazwa
Booktago

### App Store — podtytuł
Salontermine und Prämien

### App Store — słowa kluczowe
Friseur,Kosmetik,Nagelstudio,Beauty,Spa,Massage,Barber,Buchung,Bonus,Punkte,Erinnerung

### Co nowego (Play i App Store)
Neuer Name: Booktago. Kleinere Korrekturen und Verbesserungen.

---

## Nederlands [nl] — Play: nl-NL · App Store: Dutch

### Play — nazwa aplikacji
Booktago

### Play — krótki opis
Boek salonafspraken, spaar punten, verzilver beloningen.

### Play — pełny opis (= App Store — opis)
Booktago is de app om afspraken te maken bij je favoriete salon — snel, makkelijk en zonder te bellen.

Zo begin je: scan de QR-code van je salon, voer de naam in die je salon je gaf, of ga verder met je telefoonnummer — de app toont de salons waar je al een klantdossier hebt. Booktago is geen salongids: je gaat rechtstreeks naar je eigen salon.

Wat je in de app kunt doen:
• Een afspraak maken in een paar stappen — kies een behandeling, een specialist en een tijd.
• Voor twee personen tegelijk boeken (koppelmodus).
• Je komende afspraken en geschiedenis bekijken en makkelijk annuleren.
• Inloggen met een sms-code — zonder wachtwoord.
• Herinneringen aan afspraken als meldingen ontvangen.

Spaarprogramma (als je salon dat heeft):
• Spaar punten voor bezoeken en stijg in niveau.
• Verzilver beloningen en kortingscodes.
• Beveel vrienden aan en profiteer allebei.
• Boek goedkoper in happy-hour-tijden.

Booktago werkt in 16 talen. De app is gratis voor salonklanten.

### App Store — nazwa
Booktago

### App Store — podtytuł
Salonafspraken en beloningen

### App Store — słowa kluczowe
kapper,schoonheid,nagels,spa,massage,barbier,manicure,boeken,klantenkaart,punten,herinnering

### Co nowego (Play i App Store)
Nieuwe naam: Booktago. Kleine verbeteringen en oplossingen.

---

## Čeština [cs] — Play: cs-CZ · App Store: Czech

### Play — nazwa aplikacji
Booktago

### Play — krótki opis
Rezervuj návštěvy v salonu, sbírej body, získávej odměny.

### Play — pełny opis (= App Store — opis)
Booktago je aplikace pro rezervaci návštěv ve tvém oblíbeném salonu — rychle, pohodlně a bez telefonování.

Jak začít: naskenuj QR kód ze salonu, zadej název, který ti salon dal, nebo vstup svým telefonním číslem — aplikace ukáže salony, kde už máš kartu klienta. Booktago není katalog salonů: jdeš rovnou do svého.

Co v aplikaci zvládneš:
• Zarezervovat návštěvu v pár krocích — vyber službu, specialistu a termín.
• Rezervovat i pro dva najednou (režim pro pár).
• Vidět nadcházející návštěvy a historii, snadno zrušit.
• Přihlásit se SMS kódem — bez hesel.
• Dostávat připomínky návštěv jako oznámení.

Bonusový program (pokud ho salon má):
• Sbírej body za návštěvy a postupuj do vyšších úrovní.
• Získávej odměny a slevové kódy.
• Doporuč salon přátelům — získáte oba.
• Využívej happy hours a rezervuj levněji.

Booktago funguje v 16 jazycích. Aplikace je pro klienty salonu zdarma.

### App Store — nazwa
Booktago

### App Store — podtytuł
Rezervace v salonu a odměny

### App Store — słowa kluczowe
kadeřnictví,kosmetika,nehty,spa,masáž,barber,termín,věrnost,body,připomínka

### Co nowego (Play i App Store)
Nový název: Booktago. Drobné opravy a vylepšení.

---

## Svenska [sv] — Play: sv-SE · App Store: Swedish

### Play — nazwa aplikacji
Booktago

### Play — krótki opis
Boka salongstider, samla poäng, hämta belöningar.

### Play — pełny opis (= App Store — opis)
Booktago är appen för att boka tider hos din favoritsalong — snabbt, enkelt och utan att ringa.

Så kommer du igång: skanna QR-koden från din salong, ange namnet du fått av salongen eller gå in med ditt telefonnummer — appen visar salongerna där du redan har en kundjournal. Booktago är ingen salongskatalog: du kommer direkt till din egen salong.

Det här kan du göra i appen:
• Boka en tid i några få steg — välj behandling, specialist och tid.
• Boka för två personer samtidigt (parläge).
• Se dina kommande tider och historik, och avboka enkelt.
• Logga in med sms-kod — inga lösenord.
• Få påminnelser om tider som notiser.

Bonusprogram (om din salong har ett):
• Samla poäng för besök och klättra i nivåer.
• Hämta belöningar och rabattkoder.
• Rekommendera salongen till vänner — ni vinner båda.
• Boka billigare under happy hour.

Booktago finns på 16 språk. Appen är gratis för salongens kunder.

### App Store — nazwa
Booktago

### App Store — podtytuł
Salongsbokning och belöningar

### App Store — słowa kluczowe
frisör,skönhet,naglar,spa,massage,barberare,manikyr,tid,lojalitet,poäng,påminnelse

### Co nowego (Play i App Store)
Nytt namn: Booktago. Mindre rättningar och förbättringar.

---

## Español [es] — Play: es-ES · App Store: Spanish (Spain)

### Play — nazwa aplikacji
Booktago

### Play — krótki opis
Reserva citas en tu salón, acumula puntos, canjea premios.

### Play — pełny opis (= App Store — opis)
Booktago es la app para reservar citas en tu salón favorito — rápido, cómodo y sin llamar.

Cómo empezar: escanea el código QR de tu salón, escribe el nombre que te dio el salón o entra con tu número de teléfono — la app te muestra los salones donde ya tienes ficha. Booktago no es un directorio de salones: vas directo al tuyo.

Qué puedes hacer en la app:
• Reservar una cita en pocos pasos — elige servicio, especialista y hora.
• Reservar para dos personas a la vez (modo pareja).
• Ver tus próximas citas y el historial, y cancelar fácilmente.
• Iniciar sesión con un código SMS — sin contraseñas.
• Recibir recordatorios de citas como notificaciones.

Programa de fidelidad (si tu salón lo tiene):
• Acumula puntos por visita y sube de nivel.
• Canjea premios y códigos de descuento.
• Recomienda el salón a tus amigos y ganáis los dos.
• Aprovecha las horas felices y reserva más barato.

Booktago funciona en 16 idiomas. La app es gratuita para los clientes del salón.

### App Store — nazwa
Booktago

### App Store — podtytuł
Citas en tu salón y premios

### App Store — słowa kluczowe
peluquería,belleza,uñas,spa,masaje,barbería,reserva,fidelidad,puntos,recordatorio

### Co nowego (Play i App Store)
Nuevo nombre: Booktago. Pequeñas correcciones y mejoras.

---

## Français [fr] — Play: fr-FR · App Store: French

### Play — nazwa aplikacji
Booktago

### Play — krótki opis
Réservez en salon, cumulez des points, gagnez des récompenses.

### Play — pełny opis (= App Store — opis)
Booktago est l'application pour réserver dans votre salon préféré — vite, simplement et sans appeler.

Pour commencer : scannez le QR code de votre salon, saisissez le nom que le salon vous a donné, ou entrez avec votre numéro de téléphone — l'application affiche les salons où vous avez déjà un dossier client. Booktago n'est pas un annuaire de salons : vous arrivez directement dans le vôtre.

Dans l'application, vous pouvez :
• Réserver un rendez-vous en quelques étapes — service, praticien et horaire.
• Réserver pour deux personnes à la fois (mode duo).
• Voir vos rendez-vous à venir et votre historique, et annuler facilement.
• Vous connecter par code SMS — sans mot de passe.
• Recevoir des rappels de rendez-vous par notification.

Programme de fidélité (si votre salon en propose un) :
• Cumulez des points à chaque visite et montez de niveau.
• Récupérez des récompenses et des codes de réduction.
• Parrainez vos amis — vous y gagnez tous les deux.
• Profitez des happy hours et réservez moins cher.

Booktago est disponible en 16 langues. L'application est gratuite pour les clients du salon.

### App Store — nazwa
Booktago

### App Store — podtytuł
Réservations et récompenses

### App Store — słowa kluczowe
coiffeur,beauté,ongles,spa,massage,barbier,rendez-vous,fidélité,points,rappel

### Co nowego (Play i App Store)
Nouveau nom : Booktago. Corrections et améliorations mineures.

---

## Italiano [it] — Play: it-IT · App Store: Italian

### Play — nazwa aplikacji
Booktago

### Play — krótki opis
Prenota nel tuo salone, accumula punti, ottieni premi.

### Play — pełny opis (= App Store — opis)
Booktago è l'app per prenotare nel tuo salone preferito — veloce, comoda e senza telefonate.

Come iniziare: scansiona il codice QR del salone, inserisci il nome che ti ha dato il salone oppure entra con il tuo numero di telefono — l'app mostra i saloni in cui hai già una scheda cliente. Booktago non è un elenco di saloni: vai dritto al tuo.

Cosa puoi fare nell'app:
• Prenotare in pochi passaggi — scegli servizio, specialista e orario.
• Prenotare per due persone insieme (modalità coppia).
• Vedere i prossimi appuntamenti e lo storico, e disdire facilmente.
• Accedere con un codice SMS — senza password.
• Ricevere promemoria degli appuntamenti come notifiche.

Programma fedeltà (se il salone lo offre):
• Accumula punti per ogni visita e sali di livello.
• Ottieni premi e codici sconto.
• Consiglia il salone agli amici: ci guadagnate entrambi.
• Sfrutta gli orari happy hour e prenota a meno.

Booktago è disponibile in 16 lingue. L'app è gratuita per i clienti del salone.

### App Store — nazwa
Booktago

### App Store — podtytuł
Appuntamenti e premi fedeltà

### App Store — słowa kluczowe
parrucchiere,bellezza,unghie,spa,massaggio,barbiere,prenotazione,punti,promemoria

### Co nowego (Play i App Store)
Nuovo nome: Booktago. Piccole correzioni e miglioramenti.

---

## Hrvatski [hr] — Play: hr · App Store: Croatian

### Play — nazwa aplikacji
Booktago

### Play — krótki opis
Rezerviraj termine u salonu, skupljaj bodove, osvajaj nagrade.

### Play — pełny opis (= App Store — opis)
Booktago je aplikacija za rezervaciju termina u tvom omiljenom salonu — brzo, jednostavno i bez zvanja.

Kako početi: skeniraj QR kod iz salona, upiši naziv koji ti je salon dao ili uđi svojim brojem telefona — aplikacija prikazuje salone u kojima već imaš karton. Booktago nije imenik salona: ideš izravno u svoj.

Što možeš u aplikaciji:
• Rezervirati termin u nekoliko koraka — odaberi uslugu, stručnjaka i vrijeme.
• Rezervirati za dvije osobe odjednom (način za par).
• Vidjeti nadolazeće termine i povijest te jednostavno otkazati.
• Prijaviti se SMS kodom — bez lozinki.
• Primati podsjetnike na termine kao obavijesti.

Program vjernosti (ako ga salon ima):
• Skupljaj bodove za posjete i napreduj kroz razine.
• Osvajaj nagrade i kodove za popust.
• Preporuči salon prijateljima — oboje dobivate.
• Iskoristi happy hour termine i rezerviraj jeftinije.

Booktago radi na 16 jezika. Aplikacija je besplatna za klijente salona.

### App Store — nazwa
Booktago

### App Store — podtytuł
Termini u salonu i nagrade

### App Store — słowa kluczowe
frizer,ljepota,nokti,spa,masaža,barber,rezervacija,vjernost,bodovi,podsjetnik

### Co nowego (Play i App Store)
Novi naziv: Booktago. Manji ispravci i poboljšanja.

---

## Ελληνικά [el] — Play: el-GR · App Store: Greek

### Play — nazwa aplikacji
Booktago

### Play — krótki opis
Ραντεβού στο σαλόνι, πόντοι και δώρα — από το κινητό.

### Play — pełny opis (= App Store — opis)
Το Booktago είναι η εφαρμογή για ραντεβού στο αγαπημένο σου σαλόνι — γρήγορα, εύκολα και χωρίς τηλεφωνήματα.

Πώς ξεκινάς: σκάναρε τον κωδικό QR από το σαλόνι, γράψε το όνομα που σου έδωσε το σαλόνι ή μπες με τον αριθμό τηλεφώνου σου — η εφαρμογή δείχνει τα σαλόνια όπου έχεις ήδη καρτέλα. Το Booktago δεν είναι κατάλογος σαλονιών: πας κατευθείαν στο δικό σου.

Τι μπορείς να κάνεις:
• Να κλείσεις ραντεβού σε λίγα βήματα — υπηρεσία, ειδικός και ώρα.
• Να κλείσεις για δύο άτομα μαζί (λειτουργία ζευγαριού).
• Να δεις τα επόμενα ραντεβού και το ιστορικό, και να ακυρώσεις εύκολα.
• Να συνδεθείς με κωδικό SMS — χωρίς κωδικούς πρόσβασης.
• Να λαμβάνεις υπενθυμίσεις ραντεβού ως ειδοποιήσεις.

Πρόγραμμα επιβράβευσης (αν το προσφέρει το σαλόνι):
• Μάζεψε πόντους για κάθε επίσκεψη και ανέβα επίπεδα.
• Κέρδισε δώρα και εκπτωτικούς κωδικούς.
• Σύστησε το σαλόνι σε φίλους — κερδίζετε και οι δύο.
• Αξιοποίησε τις happy hours και κλείσε φθηνότερα.

Το Booktago λειτουργεί σε 16 γλώσσες. Η εφαρμογή είναι δωρεάν για τους πελάτες του σαλονιού.

### App Store — nazwa
Booktago

### App Store — podtytuł
Ραντεβού σε σαλόνι και δώρα

### App Store — słowa kluczowe
κομμωτήριο,ομορφιά,νύχια,spa,μασάζ,κράτηση,πόντοι

### Co nowego (Play i App Store)
Νέο όνομα: Booktago. Μικρές διορθώσεις και βελτιώσεις.

---

## Türkçe [tr] — Play: tr-TR · App Store: Turkish

### Play — nazwa aplikacji
Booktago

### Play — krótki opis
Salon randevusu al, puan biriktir, ödül kazan.

### Play — pełny opis (= App Store — opis)
Booktago, favori salonunda randevu almak için uygulamadır — hızlı, kolay ve telefon etmeden.

Nasıl başlanır: salonundaki QR kodu tarat, salonun sana verdiği adı yaz ya da telefon numaranla gir — uygulama, zaten müşteri kaydının olduğu salonları gösterir. Booktago bir salon rehberi değildir: doğrudan kendi salonuna gidersin.

Uygulamada neler yapabilirsin:
• Birkaç adımda randevu al — hizmet, uzman ve saat seç.
• İki kişi için aynı anda randevu al (çift modu).
• Yaklaşan randevularını ve geçmişini gör, kolayca iptal et.
• SMS koduyla giriş yap — şifre yok.
• Randevu hatırlatmalarını bildirim olarak al.

Sadakat programı (salonun sunuyorsa):
• Ziyaretlerden puan biriktir ve seviye atla.
• Ödülleri ve indirim kodlarını kullan.
• Salonu arkadaşlarına öner — ikiniz de kazanın.
• Happy hour saatlerinde daha ucuza randevu al.

Booktago 16 dilde çalışır. Uygulama salon müşterileri için ücretsizdir.

### App Store — nazwa
Booktago

### App Store — podtytuł
Salon randevusu ve ödüller

### App Store — słowa kluczowe
kuaför,güzellik,tırnak,spa,masaj,berber,rezervasyon,sadakat,puan,hatırlatma

### Co nowego (Play i App Store)
Yeni ad: Booktago. Küçük düzeltmeler ve iyileştirmeler.

---

## Български [bg] — Play: bg · App Store: brak w App Store Connect? — patrz uwagi

### Play — nazwa aplikacji
Booktago

### Play — krótki opis
Запазвай часове в салона, събирай точки, получавай награди.

### Play — pełny opis (= App Store — opis)
Booktago е приложението за запазване на часове в любимия ти салон — бързо, удобно и без обаждания.

Как да започнеш: сканирай QR кода от салона, въведи името, което салонът ти е дал, или влез с телефонния си номер — приложението показва салоните, в които вече имаш досие. Booktago не е каталог на салони: отиваш направо в своя.

Какво можеш в приложението:
• Да запазиш час в няколко стъпки — услуга, специалист и време.
• Да запазиш за двама наведнъж (режим за двойка).
• Да видиш предстоящите си часове и историята и лесно да отмениш.
• Да влезеш с SMS код — без пароли.
• Да получаваш напомняния за часове като известия.

Бонус програма (ако салонът я предлага):
• Събирай точки за посещения и се изкачвай по нива.
• Получавай награди и кодове за отстъпка.
• Препоръчай салона на приятели — печелите и двамата.
• Използвай happy hour часовете и запазвай по-евтино.

Booktago работи на 16 езика. Приложението е безплатно за клиентите на салона.

### App Store — nazwa
Booktago

### App Store — podtytuł
Часове в салона и награди

### App Store — słowa kluczowe
фризьор,красота,маникюр,спа,масаж,точки

### Co nowego (Play i App Store)
Ново име: Booktago. Дребни поправки и подобрения.

---

## Suomi [fi] — Play: fi-FI · App Store: Finnish

### Play — nazwa aplikacji
Booktago

### Play — krótki opis
Varaa salonkiaikoja, kerää pisteitä, lunasta palkintoja.

### Play — pełny opis (= App Store — opis)
Booktago on sovellus ajanvaraukseen suosikkisalonkiisi — nopeasti, helposti ja ilman soittamista.

Näin aloitat: skannaa salongin QR-koodi, syötä salongin antama nimi tai kirjaudu puhelinnumerollasi — sovellus näyttää salongit, joissa sinulla on jo asiakastiedot. Booktago ei ole salonkihakemisto: pääset suoraan omaan salonkiisi.

Mitä voit tehdä sovelluksessa:
• Varata ajan muutamalla askeleella — valitse palvelu, ammattilainen ja aika.
• Varata kahdelle kerralla (paritila).
• Nähdä tulevat ajat ja historian sekä perua helposti.
• Kirjautua tekstiviestikoodilla — ilman salasanoja.
• Saada muistutuksia ajoista ilmoituksina.

Bonusohjelma (jos salongilla on sellainen):
• Kerää pisteitä käynneistä ja nouse tasoilla.
• Lunasta palkintoja ja alennuskoodeja.
• Suosittele salonkia ystävillesi — molemmat hyötyvät.
• Hyödynnä happy hour -ajat ja varaa edullisemmin.

Booktago toimii 16 kielellä. Sovellus on salongin asiakkaille ilmainen.

### App Store — nazwa
Booktago

### App Store — podtytuł
Salonkiajat ja palkinnot

### App Store — słowa kluczowe
kampaamo,kauneus,kynnet,spa,hieronta,parturi,ajanvaraus,kanta-asiakas,pisteet,muistutus

### Co nowego (Play i App Store)
Uusi nimi: Booktago. Pieniä korjauksia ja parannuksia.

---

## Norsk [no] — Play: no-NO · App Store: Norwegian

### Play — nazwa aplikacji
Booktago

### Play — krótki opis
Bestill salongtimer, samle poeng, hent belønninger.

### Play — pełny opis (= App Store — opis)
Booktago er appen for å bestille time hos favorittsalongen din — raskt, enkelt og uten å ringe.

Slik starter du: skann QR-koden fra salongen, skriv inn navnet salongen ga deg, eller gå inn med telefonnummeret ditt — appen viser salongene der du allerede har kundekort. Booktago er ingen salongkatalog: du går rett til din egen salong.

Dette kan du gjøre i appen:
• Bestille time på noen få steg — velg tjeneste, spesialist og tidspunkt.
• Bestille for to personer samtidig (parmodus).
• Se kommende timer og historikk, og avbestille enkelt.
• Logge inn med SMS-kode — ingen passord.
• Få påminnelser om timer som varsler.

Bonusprogram (hvis salongen har det):
• Samle poeng for besøk og rykk opp i nivåer.
• Hent belønninger og rabattkoder.
• Anbefal salongen til venner — begge tjener på det.
• Bruk happy hour-tider og bestill billigere.

Booktago finnes på 16 språk. Appen er gratis for salongens kunder.

### App Store — nazwa
Booktago

### App Store — podtytuł
Salongtimer og belønninger

### App Store — słowa kluczowe
frisør,skjønnhet,negler,spa,massasje,barberer,bestilling,time,lojalitet,poeng,påminnelse

### Co nowego (Play i App Store)
Nytt navn: Booktago. Mindre rettelser og forbedringer.

---

## Українська [uk] — Play: uk · App Store: Ukrainian

### Play — nazwa aplikacji
Booktago

### Play — krótki opis
Записуйся до салону, збирай бали, отримуй винагороди.

### Play — pełny opis (= App Store — opis)
Booktago — це застосунок для запису до твого улюбленого салону — швидко, зручно й без дзвінків.

Як почати: відскануй QR-код із салону, введи назву, яку дав тобі салон, або увійди за номером телефону — застосунок покаже салони, де в тебе вже є картка. Booktago — не каталог салонів: ти потрапляєш одразу до свого.

Що можна зробити в застосунку:
• Записатися за кілька кроків — обери послугу, спеціаліста й час.
• Записати двох людей одразу (режим для пари).
• Бачити майбутні візити й історію, легко скасовувати.
• Входити за SMS-кодом — без паролів.
• Отримувати нагадування про візити як сповіщення.

Бонусна програма (якщо салон її має):
• Збирай бали за візити й підвищуй рівень.
• Отримуй винагороди та промокоди.
• Рекомендуй салон друзям — виграєте обоє.
• Користуйся happy hours і записуйся дешевше.

Booktago працює 16 мовами. Застосунок безкоштовний для клієнтів салону.

### App Store — nazwa
Booktago

### App Store — podtytuł
Запис до салону й винагороди

### App Store — słowa kluczowe
перукарня,краса,манікюр,спа,масаж,бали

### Co nowego (Play i App Store)
Нова назва: Booktago. Дрібні виправлення та покращення.

---

## Tabela zgodności z limitami

Wygenerowana: `node script/limity-wpisow.mjs --zapisz`. Liczba znaków = punkty kodowe Unicode (łamanie wiersza w pełnym opisie liczy się jako znak).

<!-- TABELA-ZGODNOSCI:START -->
| Język | Play nazwa (≤ 30) | Play krótki (≤ 80) | Opis (Play/ASC) (≤ 4000) | ASC nazwa (≤ 30) | ASC podtytuł (≤ 30) | ASC słowa kl. (≤ 100 zn. i 100 B) | Co nowego (≤ 500) | Zgodne |
|---|---|---|---|---|---|---|---|---|
| pl | 8 | 60 | 988 | 8 | 26 | 93 zn. / 94 B | 53 | TAK |
| en | 8 | 65 | 974 | 8 | 24 | 91 zn. / 91 B | 49 | TAK |
| de | 8 | 54 | 1005 | 8 | 24 | 86 zn. / 86 B | 62 | TAK |
| nl | 8 | 56 | 977 | 8 | 28 | 92 zn. / 92 B | 59 | TAK |
| cs | 8 | 57 | 889 | 8 | 27 | 75 zn. / 83 B | 48 | TAK |
| sv | 8 | 49 | 905 | 8 | 29 | 82 zn. / 86 B | 57 | TAK |
| es | 8 | 58 | 976 | 8 | 27 | 81 zn. / 84 B | 56 | TAK |
| fr | 8 | 62 | 1108 | 8 | 27 | 77 zn. / 80 B | 62 | TAK |
| it | 8 | 54 | 985 | 8 | 28 | 81 zn. / 81 B | 57 | TAK |
| hr | 8 | 62 | 933 | 8 | 26 | 77 zn. / 78 B | 51 | TAK |
| el | 8 | 53 | 1037 | 8 | 27 | 49 zn. / 89 B | 54 | TAK |
| tr | 8 | 46 | 904 | 8 | 26 | 75 zn. / 79 B | 55 | TAK |
| bg | 8 | 59 | 946 | 8 | 25 | 39 zn. / 73 B | 49 | TAK |
| fi | 8 | 56 | 941 | 8 | 24 | 87 zn. / 87 B | 54 | TAK |
| no | 8 | 51 | 910 | 8 | 26 | 88 zn. / 91 B | 54 | TAK |
| uk | 8 | 53 | 881 | 8 | 28 | 38 zn. / 71 B | 55 | TAK |
<!-- TABELA-ZGODNOSCI:END -->
