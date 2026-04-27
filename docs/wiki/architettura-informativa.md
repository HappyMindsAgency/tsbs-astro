# Architettura Informativa - The Secret Bookish Society

## Scopo

Questo file raccoglie architettura informativa, flussi principali, label e logica narrativa della web app. Serve come riferimento quando si progettano pagine, navigazione, componenti o contenuti.

## Concept

**The Secret Bookish Society** e una web app narrativa/gamificata per Biblioteca Classense di Ravenna.

Il concept introduce una societa segreta custode dei misteri, delle storie e del patrimonio della Biblioteca Classense. Gli utenti entrano progressivamente nella Societa attraverso onboarding, smistamento, appartenenza a un'Accademia, missioni, ricompense e comunicazioni narrative.

## Flusso Principale

Flusso pubblico e onboarding:
- Landing page
- Login oppure Chiamata
- Chiamata / signup narrativo
- Test smistamento
- Welcome Accademia
- Atrio

La landing page deve funzionare sia come ingresso evocativo sia come punto istituzionale chiaro.

## Sezioni Principali

### Landing Page

Funzione:
- presentare il progetto
- introdurre il tono narrativo
- portare a login o chiamata

Elementi previsti:
- video/claim o visual evocativo
- CTA `Rispondi alla chiamata`
- CTA `Login`
- teaser delle funzionalita
- footer/disclaimer narrativo o istituzionale

### Chiamata

Funzione:
- trasformare il signup in onboarding narrativo
- introdurre la Societa Segreta
- raccogliere dati base utente

Elementi previsti:
- testo o video introduttivo
- guida visuale/personaggio se previsto
- form email/password/nickname
- CTA di avanzamento

### Test Smistamento

Funzione:
- accompagnare l'utente nella scelta dell'Accademia
- creare appartenenza

Momenti previsti:
- introduzione
- domande guidate con progress bar
- risultato con affinita alle Accademie
- scelta finale dell'Accademia

Stato attuale:
- percorso in stand-by, seguito da Claus.

### Welcome Accademia

Funzione:
- confermare appartenenza
- presentare Accademia, simbolo e lore
- accompagnare verso l'Atrio

Elementi previsti:
- nome Accademia
- simbolo/stemma
- messaggio personalizzato
- anticipazione attivita
- CTA `Entra nell'Atrio`

### Atrio

Funzione:
- hub centrale post-login
- orientamento dell'utente
- sintesi di progressione, attivita e comunicazioni

Contenuti possibili:
- stato profilo
- livello
- punti
- Accademia
- classifica
- stagione/lore
- missioni attive
- epistole attive
- accessi rapidi

Guardrail:
- non trattarlo come dashboard neutra
- mantenere sempre funzione narrativa e direzionale

### Missioni

Funzione:
- sezione operativa del gioco
- avanzamento, sfide, tracking e ricompense

Contenuti possibili:
- missioni filtrabili per stato
- dettaglio missione
- descrizione
- ricompense
- punti
- tracking avanzamento

### Accademia

Funzione:
- appartenenza e competizione simbolica
- identita dell'utente dentro la Societa

Contenuti possibili:
- overview
- stemma
- lore
- valori
- traguardi collettivi
- classifica

Accademie:
- Astraria
- Arcadia
- Armonia
- Arborea

### Scrivania

Funzione:
- spazio personale dell'utente
- monitoraggio del percorso individuale

Contenuti possibili:
- profilo
- livello
- punti
- progress bar
- trofei
- Accademia
- accessi a Percorso di studi, Trofei, Grimorio

### Percorso Di Studi

Funzione:
- progressione personale
- tappe e livelli
- attivita completate e da completare

### Trofei

Funzione:
- ricompense digitali e simboliche
- motivazione e memoria dei risultati

Contenuti possibili:
- griglia trofei ottenuti
- trofei non ancora sbloccati se previsto
- stanza personale dei trofei

### Grimorio

Funzione:
- spazio intimo per appunti e contenuti personali
- memoria individuale del percorso

Contenuti possibili:
- note personali
- appunti
- contenuti in evidenza
- creazione/modifica appunti

### Eventi

Funzione:
- ponte digitale/fisico con Biblioteca Classense
- integrazione con eventi reali

Fonte prevista:
- sito WordPress Biblioteca Classense

### Archivio

Funzione:
- memoria collettiva e lore
- contenuti consultabili o sbloccabili in base alla progressione

Contenuti possibili:
- La Societa Segreta
- Le Accademie
- La Biblioteca Classense

### Epistole

Funzione:
- canale narrativo e informativo principale
- indizi, inviti, aggiornamenti, ricompense

Guardrail:
- non trattare le Epistole come semplici notifiche
- distinguere nuove e archiviate quando serve

### Profilo E Impostazioni

Funzione:
- dati account e preferenze
- stato utente

Contenuti possibili:
- dati personali
- nickname
- Accademia
- livello/progressione
- preferenze account

Guardrail:
- mantenere separata la dimensione narrativa dalla gestione account/funzionale

## Glossario Operativo

Adepto:
- utente base, livello 1
- ha percepito la Chiamata e sta esplorando il primo livello di interazione

Iniziato:
- utente registrato, livello 2
- ha completato onboarding e test di Smistamento scegliendo l'Accademia

Custode Novizio:
- utente attivo, livello 3
- ha completato prime quest, sbloccato sfida di lettura e usa le dinamiche della biblioteca

Custode:
- traguardo finale della Stagione 1, livello 4
- utente fidelizzato e attivo

Accademia:
- gruppo di appartenenza
- cluster narrativo e funzionale per personalizzare esperienza e attitudini

Guide dell'Accademia:
- figure storiche illustri della Classense
- mentori narrativi per gli Iniziati

Il Rector:
- autorita suprema della Societa Segreta
- scandisce ritmo narrativo, passaggi di livello e finale di stagione

Prefetti:
- staff reale Biblioteca o volontari
- moderano, validano quest fisiche, approvano contenuti e gestiscono attivita phygital

Atrio:
- dashboard narrativa e hub direzionale

Scrivania:
- area profilo personale

Trofei:
- ricompense digitali simboliche

## Label Da Preservare

- Atrio
- Missioni
- Accademia
- Scrivania
- Eventi
- Archivio
- Epistole
- Profilo e impostazioni
- Percorso di studi
- Trofei
- Grimorio

## Note Da Verificare

- Slide 26 del PowerPoint non risultava leggibile dal testo estratto.
- Alcune occorrenze tipo `E pistole` sono da interpretare come `Epistole`.
- URL, slug, naming tecnico e stati precisi non sono ancora definiti in questo documento.
