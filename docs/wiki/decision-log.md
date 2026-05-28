# Decision Log - The Secret Bookish Society

Questo file registra le decisioni importanti del progetto.

Formato consigliato:

```md
## YYYY-MM-DD - Titolo decisione

Decisione:
- cosa e stato deciso

Motivo:
- perche e stato deciso

Impatto:
- quali file, flussi o aree sono coinvolti

Stato:
- proposta / approvata / superata
```

## 2026-05-28 - Missione 01 Per Inserimento Tessera Biblioteca

Decisione:
- usare la prova della `Missione 01: Il Varco` come inserimento del numero tessera Biblioteca
- quando la domanda libera ha una risposta Strapi vuota ma marcata `corretta`, validare solo formalmente il codice tessera come 14 cifre numeriche e considerare superata la prova
- salvare il codice normalizzato nel campo `Membro.tessera`
- mostrare `Membro.tessera` nella hero della Scrivania, accanto all'icona tessera

Motivo:
- la verifica reale della tessera Biblioteca resta manuale, come gia previsto dai guardrail backend
- il quiz deve poter funzionare anche senza una risposta testuale attesa in Strapi
- la Scrivania deve riflettere il codice inserito dall'utente

Impatto:
- `src/pages/api/missioni/[slugMis]/prova.ts`
- `src/pages/api/user/profilo.ts`
- `src/pages/scrivania/index.astro`

Stato:
- approvata

## 2026-05-28 - Slug Missione Disponibile Per Binding

Decisione:
- recepire nello schema operativo Astro che la collection Strapi `Missione` espone il campo `slug`
- usare `slug` come identificativo editoriale per la route `missioni/[slugMis]/`
- mantenere ancora da confermare i campi o valori che guideranno layout dettaglio, tipo prova e tipo esito

Motivo:
- lo schema aggiornato fornito in `/Users/viola/Downloads/strapi-tsbs-main` aggiunge `slug` a `Missione` come UID localizzato con `targetField: titolo`
- rimuovere il blocco documentale che impediva il binding della route dinamica missione

Impatto:
- `docs/wiki/schema-strapi.md`
- `docs/wiki/alberatura.md`
- `docs/wiki/backend-strapi.md`
- futuro binding di `src/pages/missioni/[slugMis]/`

Stato:
- approvata

## 2026-05-28 - Convenzione Domande Aperte Nei Quiz Missione

Decisione:
- gestire le prove a domanda aperta dentro la stessa struttura Strapi dei quiz a risposta multipla
- usare `Quiz.domande.domanda` per il testo della domanda
- usare una sola voce in `domande.risposte` come risposta attesa/corretta per le domande aperte
- usare piu voci in `domande.risposte` per le domande a scelta multipla

Motivo:
- conferma ricevuta dal backend: i quiz a domanda aperta sono gestiti come quelli a risposta multipla, ma con una sola risposta
- evitare di introdurre campi o componenti Strapi non previsti
- mantenere due componenti frontend principali: scelta guidata e risposta libera

Impatto:
- futuro binding di `src/pages/missioni/[slugMis]/prova/index.astro`
- `src/components/MissioniComponents/SceltaDomanda.astro`
- `src/components/MissioniComponents/RispostaLibera.astro`
- `docs/wiki/schema-strapi.md`

Stato:
- approvata

## 2026-05-28 - Validazione Server-Side Prova Missione

Decisione:
- introdurre una route Astro server-side `POST /api/missioni/:slug/prova` per validare le risposte delle prove missione
- continuare a passare al client solo il testo delle risposte, senza esporre il campo Strapi `corretta`
- rimandare a una fase successiva il salvataggio dello stato personale in `partecipazioni_missione`

Motivo:
- separare il catalogo missioni pubblico/readonly dalla validazione della prova dell'utente loggato
- mantenere la risposta corretta solo sul server
- evitare di introdurre ora la logica membro/progresso prima del binding completo delle partecipazioni

Impatto:
- `src/pages/api/missioni/[slugMis]/prova.ts`
- `src/pages/missioni/[slugMis]/prova/index.astro`
- `src/components/MissioniComponents/SceltaDomanda.astro`
- `src/components/MissioniComponents/RispostaLibera.astro`

Stato:
- approvata

## 2026-05-28 - Progresso Missioni In Percentuale

Decisione:
- nella lista Missioni usare `partecipazioni_missione.progresso` come percentuale `0-100`
- usare `partecipazioni_missione.stato` per separare le missioni tra `In corso`, `Completate` e `Disponibili`
- mostrare le missioni senza partecipazione personale in `Disponibili` con progresso `0%`

Motivo:
- il frontend deve mostrare una barra progresso coerente senza usare step testuali statici
- `progresso` e gia previsto nello schema Strapi della partecipazione missione

Impatto:
- `src/pages/missioni/index.astro`
- `src/lib/strapi/missioni.ts`

Stato:
- approvata

## 2026-05-28 - Fallback Editoriale Prova Missione

Decisione:
- la pagina prova missione non deve andare in 404 quando domanda o risposta esistono in Strapi ma hanno testo vuoto
- il 404 resta solo quando manca la struttura della prova: quiz collegato, domande o elementi risposta
- per testi editoriali prova vuoti usare un fallback neutro `Lorem ipsum`

Motivo:
- evitare che contenuti editoriali incompleti in Strapi blocchino la navigazione alla prova
- distinguere dato strutturale mancante da testo ancora non compilato

Impatto:
- `src/pages/missioni/[slugMis]/prova/index.astro`

Stato:
- approvata

## 2026-05-27 - Struttura Client Strapi Astro Per Binding Progressivo

Decisione:
- organizzare il binding Strapi lato Astro in `src/lib/strapi/`
- usare `client.ts` per la logica generica: base URL, token readonly, `fetchStrapi`, gestione errori e tipi di risposta comuni
- usare file per area dinamica, a partire da `epistole.ts`, per tipi e query specifiche della collection
- predisporre nel binding Astro i campi e le relazioni rilevanti gia presenti nello schema Strapi, anche quando in Strapi sono ancora vuoti o non ancora mostrati nella UI

Motivo:
- evitare un unico file `strapi.ts` troppo grande
- mantenere semplice il binding iniziale e scalabile l'aggiunta di Missioni, Grimorio, Quiz e altre aree
- ridurre refactor futuri quando i dati relazionali saranno valorizzati e usati nel frontend

Impatto:
- `src/lib/strapi/client.ts`
- `src/lib/strapi/epistole.ts`
- `src/pages/epistole/[slugEpis].astro`
- `docs/wiki/schema-strapi.md`

Stato:
- approvata

## 2026-05-27 - Regole Data E Carica Altro Per Binding Editoriali

Decisione:
- nelle liste collegate a Strapi che mostrano contenuti pubblicati ordinare i record per `publishedAt:desc`
- visualizzare la data nel formato italiano esteso gia usato per Epistole: giorno numerico, mese lungo, anno numerico, per esempio `27 maggio 2026`
- usare la stessa logica progressiva di `Carica altro` delle Epistole: batch iniziale/responsive 3 card mobile, 4 tablet, 5 desktop
- nascondere il bottone `Carica altro` quando tutte le card previste sono gia visibili o quando il numero di card e inferiore/uguale al batch corrente

Motivo:
- mantenere coerenza tra Epistole, Grimorio e futuri binding editoriali
- evitare etichette temporali diverse come `OGGI`/`IERI` quando il formato data approvato e quello esteso
- non mostrare comandi inutili quando non ci sono altri contenuti da caricare

Impatto:
- `src/pages/epistole/index.astro`
- `src/pages/scrivania/grimorio/index.astro`
- `src/pages/scrivania/index.astro`
- `src/lib/strapi/grimorio.ts`
- `docs/wiki/schema-strapi.md`

Stato:
- approvata

## 2026-05-27 - Label Visibilita Nelle Card Grimorio

Decisione:
- nelle card lista del Grimorio non mostrare il nome della `Categoria Grimorio` come meta visibile
- usare il campo booleano `visibilePubblico` per mostrare la label `Pubblica` quando `true` e `Privata` quando `false`
- mantenere le categorie Grimorio disponibili nel binding per filtri, raggruppamenti o usi futuri

Motivo:
- rendere immediatamente leggibile all'utente lo stato di visibilita della nota
- evitare di confondere la tassonomia editoriale con la visibilita del contenuto

Impatto:
- `src/lib/strapi/grimorio.ts`
- `src/pages/scrivania/grimorio/index.astro`
- `src/pages/scrivania/index.astro`
- `docs/wiki/schema-strapi.md`

Stato:
- approvata

## 2026-05-27 - Cancellazione Note Grimorio Da Definire

Decisione:
- la cancellazione delle note Grimorio non viene ancora implementata
- il bidoncino nel dettaglio di una nota pubblicata resta non distruttivo finche la funzione non sara definita
- non creare route API o chiamate Strapi di delete per le note Grimorio in questa fase

Motivo:
- la logica funzionale e di permessi per eliminare una nota e ancora da definire
- evitare cancellazioni accidentali o flussi incompleti prima della decisione definitiva

Impatto:
- `src/lib/strapi/grimorio.ts`
- `src/pages/scrivania/grimorio/pubblicate/[slugNotaPub].astro`

Stato:
- approvata

## 2026-05-27 - Campo datiAggiuntivi Membro Per Avatar E Ultimo Login

Decisione:
- usare il campo JSON `datiAggiuntivi` del Membro come contenitore per dati utente non strutturati
- salvare `ultimoLogin` (ISO 8601) al momento del login, in background dopo `setAuthCookie`
- salvare `avatar` (es. `avatar-1` … `avatar-12`) al completamento della scelta in `SceltaAvatar.astro`
- creare la route `PUT /api/user/dati-aggiuntivi` come endpoint unico per aggiornare il campo tramite merge shallow
- usare il token admin `AUTH_READONLY` per la scrittura su Strapi (il JWT utente serve solo per identificare il Membro)
- la scelta avatar nella pagina impostazioni profilo userà la stessa route

Motivo:
- `datiAggiuntivi` è già previsto nel modello Membro come JSON libero
- evitare nuovi campi su Strapi per dati di contorno non strutturati
- merge shallow garantisce che aggiornamenti parziali (es. solo avatar) non cancellino altri campi già presenti

Impatto:
- `src/pages/api/user/dati-aggiuntivi.ts` (nuovo)
- `src/pages/api/auth/login.ts`
- `src/components/TestSmistamentoComponents/SceltaAvatar.astro`

Stato:
- approvata

## 2026-05-25 - Route Eventi Biblioteca Classense In Root Pages

Decisione:
- spostare la sezione Eventi Biblioteca Classense da `/atrio/eventi-biblioteca-classense/` a `/eventi-biblioteca-classense/`
- usare `src/pages/eventi-biblioteca-classense/` come route attiva
- mantenere i vecchi file sotto `src/pages/atrio/_eventi-biblioteca-classense/` come riferimento non routato

Motivo:
- allineare Eventi Biblioteca Classense all'alberatura pubblica corrente
- evitare link attivi verso il vecchio percorso sotto Atrio

Impatto:
- `src/pages/eventi-biblioteca-classense/`
- navigazione principale
- link eventi dall'Atrio
- `docs/wiki/alberatura.md`

Stato:
- approvata

## 2026-05-25 - Route Biblioteca In Root Pages

Decisione:
- spostare la sezione Biblioteca da `/atrio/biblioteca/` a `/biblioteca/`
- usare `src/pages/biblioteca/` come route attiva
- mantenere i vecchi file sotto `src/pages/atrio/_biblioteca/` come riferimento non routato

Motivo:
- allineare Biblioteca all'alberatura pubblica corrente
- evitare link attivi verso il vecchio percorso sotto Atrio

Impatto:
- `src/pages/biblioteca/`
- navigazione principale
- link interni della Biblioteca
- `docs/wiki/alberatura.md`

Stato:
- approvata

## 2026-05-25 - Route Classifica Generale Sala Accademia

Decisione:
- rinominare la pagina `/sala-accademia/classifica/` in `/sala-accademia/classifica-generale/`
- usare `src/pages/sala-accademia/classifica-generale.astro` come route attiva

Motivo:
- rendere piu esplicita la differenza tra classifica generale e classifiche delle singole accademie

Impatto:
- link interni dalla Sala Accademia
- link dalla Scrivania
- `docs/wiki/alberatura.md`

Stato:
- approvata

## 2026-05-25 - Route Sala Accademia In Root Pages

Decisione:
- spostare la sezione Sala Accademia da `/atrio/sala-accademia/` a `/sala-accademia/`
- usare `src/pages/sala-accademia/` come route attiva
- mantenere i vecchi file sotto `src/pages/atrio/_sala-accademia/` come riferimento non routato

Motivo:
- allineare Sala Accademia all'alberatura pubblica corrente
- evitare link attivi verso il vecchio percorso sotto Atrio

Impatto:
- `src/pages/sala-accademia/`
- navigazione principale
- link da Scrivania e Biblioteca/Accademie
- `docs/wiki/alberatura.md`

Stato:
- approvata

## 2026-05-25 - Route Missioni In Root Pages

Decisione:
- spostare la sezione Missioni da `/atrio/missioni/` a `/missioni/`
- usare `src/pages/missioni/` come route attiva
- mantenere i vecchi file sotto `src/pages/atrio/_missioni/` come riferimento non routato

Motivo:
- allineare Missioni all'alberatura pubblica corrente
- evitare link attivi verso il vecchio percorso sotto Atrio

Impatto:
- `src/pages/missioni/`
- navigazione principale
- link da Atrio e pagine missione
- `docs/wiki/alberatura.md`

Stato:
- approvata

## 2026-05-25 - Route Scrivania In Root Pages

Decisione:
- spostare la sezione Scrivania da `/atrio/scrivania/` a `/scrivania/`
- usare `src/pages/scrivania/` come route attiva
- mantenere i vecchi file sotto `src/pages/atrio/_scrivania/` come riferimento non routato

Motivo:
- allineare Scrivania all'alberatura pubblica corrente
- evitare link attivi verso il vecchio percorso sotto Atrio

Impatto:
- `src/pages/scrivania/`
- navigazione principale
- link da Atrio, Sala Accademia, Classifica, toast e profili mock
- `docs/wiki/alberatura.md`

Stato:
- approvata

## 2026-05-25 - Route Test Smistamento In Root Pages

Decisione:
- spostare il test smistamento pubblico da `/landing/test-smistamento/` a `/test-smistamento/`
- usare `src/pages/test-smistamento/index.astro` come route attiva per l'ingresso del flusso
- usare `src/pages/test-smistamento/benvenuto-accademia-[accademia].astro` come route risultato per accademia
- usare `src/pages/test-smistamento/scegli-avatar/index.astro` come sottoroute attiva
- mantenere i vecchi file sotto `landing/_test-smistamento/` come riferimento non routato

Motivo:
- allineare il test smistamento all'alberatura pubblica corrente
- rendere esplicita nell'URL l'accademia risultante dal test
- evitare link generati dai componenti verso il vecchio percorso `landing/test-smistamento`

Impatto:
- `src/pages/test-smistamento/`
- componenti del flusso test smistamento
- link dalla conferma registrazione

Stato:
- approvata

## 2026-05-25 - Route Registrazione In Root Pages

Decisione:
- spostare la pagina registrazione pubblica da `/landing/registrazione/` a `/registrazione/`
- spostare la pagina conferma registrazione da `/landing/registrazione/registrazione-completata/` a `/registrazione-completata/`
- usare `src/pages/registrazione.astro` come file route attivo
- usare `src/pages/registrazione-completata.astro` come file route attivo per la conferma
- mantenere il vecchio file registrazione sotto `landing/registrazione/_index.astro` come riferimento non routato
- mantenere il vecchio file conferma sotto `landing/registrazione/_registrazione-completata.astro` come riferimento non routato
- far proseguire il form verso `/registrazione-completata/`

Motivo:
- allineare la registrazione all'alberatura pubblica corrente
- evitare link e form action verso il vecchio percorso `landing/registrazione`

Impatto:
- `src/pages/registrazione.astro`
- `src/pages/registrazione-completata.astro`
- link interni da landing, login e onboarding
- form di registrazione
- `docs/wiki/alberatura.md`

Stato:
- approvata

## 2026-05-25 - Route Login In Root Pages

Decisione:
- spostare la pagina login pubblica da `/landing/login/` a `/login/`
- usare `src/pages/login.astro` come file route attivo
- mantenere il vecchio file login sotto `landing/login/_index.astro` come riferimento non routato

Motivo:
- allineare il login all'alberatura pubblica corrente
- evitare link e redirect verso il vecchio percorso `landing/login`

Impatto:
- `src/pages/login.astro`
- link interni da landing e registrazione
- redirect di errore login
- `docs/wiki/alberatura.md`

Stato:
- approvata

## 2026-05-20 - Maintenance Mode Hardcoded Con Futuro Switch Vercel

Decisione:
- introdurre una maintenance mode gestita da `src/middleware.ts`
- usare inizialmente una costante hardcoded `MAINTENANCE_MODE_ENABLED`
- documentare la futura evoluzione tramite variabile ambiente `MAINTENANCE_MODE`
- mantenere `/api` e `/api/*` escluse dalla maintenance mode
- usare `/maintenance` come pagina pubblica di web app in costruzione

Motivo:
- permettere di mostrare una pagina di attesa senza modificare la home o stravolgere il routing
- preparare un interruttore gestibile da Vercel senza cambiare codice a ogni attivazione
- mantenere accessibili API e bypass team durante la maintenance

Impatto:
- `src/middleware.ts`
- `src/pages/maintenance.astro`
- `docs/wiki/maintenance.md`
- deploy Vercel e gestione environment variable

Stato:
- approvata

## 2026-05-20 - Rinomina URL Registrazione

Decisione:
- rinominare il percorso di iscrizione da `sign-in` a `registrazione`
- rinominare il percorso di conferma registrazione da `conferma-registrazione` a `registrazione-completata`

Motivo:
- usare slug italiani coerenti con lo scope attuale della web app
- mantenere chiaro il flusso di registrazione lato utente

Impatto:
- link interni landing e onboarding
- form di registrazione
- alberatura delle pagine Astro

Stato:
- approvata

## 2026-05-20 - Route Dedicata Scelta Avatar

Decisione:
- rendere lo step di scelta avatar una route dedicata con slug pubblico `scegli-avatar`
- mantenere `academy` come parametro di stato della route
- lasciare temporaneamente compatibile lo step tecnico `scelta-avatar` su query param

Motivo:
- usare URL leggibili per gli step principali del flusso di test smistamento
- separare lo slug pubblico dal nome tecnico del componente `SceltaAvatar`

Impatto:
- `src/pages/landing/test-smistamento/scegli-avatar/index.astro`
- `src/components/TestSmistamentoComponents/RisultatoSmistamento.astro`
- `docs/wiki/alberatura.md`

Stato:
- approvata

## 2026-05-20 - Rinomina Route Accademia In Sala Accademia

Decisione:
- rinominare la sezione pubblica da `/atrio/accademia/` a `/atrio/sala-accademia/`
- mantenere per ora le sottopagine statiche esistenti, come `classifica` e le classifiche per accademia
- rimandare la forma `/atrio/sala-accademia-[slugAccademia]/` al binding Strapi

Motivo:
- allineare lo slug alla nomenclatura narrativa della web app
- separare la rinomina della sezione base dalla futura gestione dinamica per accademia

Impatto:
- `src/pages/atrio/sala-accademia/`
- `src/components/Nav.astro`
- link interni verso la classifica Accademia
- `docs/wiki/alberatura.md`

Stato:
- approvata

## 2026-05-20 - Rinomina Route Eventi Biblioteca Classense

Decisione:
- rinominare la sezione eventi da `/atrio/eventi/` a `/atrio/eventi-biblioteca-classense/`
- mantenere le pagine dettaglio evento sotto la nuova sezione

Motivo:
- rendere esplicito che gli eventi provengono dalla Biblioteca Classense
- allineare URL e contenuto istituzionale della sezione Biblioteca

Impatto:
- `src/pages/atrio/eventi-biblioteca-classense/`
- `src/components/Nav.astro`
- link interni dall'Atrio e dalla lista eventi
- `docs/wiki/alberatura.md`

Stato:
- approvata

## 2026-05-20 - Rinomina Route Accademie Biblioteca

Decisione:
- rinominare la pagina Biblioteca da `/atrio/biblioteca/le-accademie/` a `/atrio/biblioteca/accademie/`

Motivo:
- rendere lo slug piu semplice e coerente con la voce di contenuto `Accademie`

Impatto:
- `src/pages/atrio/biblioteca/accademie.astro`
- link interno dalla pagina Biblioteca

Stato:
- approvata

## 2026-05-18 - Accento Neutro Per Box Test Smistamento

Decisione:
- aggiungere il token globale `--tsbs-color-neutral-accent` con valore `#B89A7E`
- aggiungere la variante `--tsbs-color-neutral-accent-soft`
- usare l'accento neutro per i box di risposta default del test smistamento

Motivo:
- evitare hardcode locali su una cromia neutra ricorrente
- rendere i box default del test smistamento coerenti con gli accenti globali neutri

Impatto:
- `src/styles/globals.scss`
- `src/components/TestSmistamentoComponents/TestSmistamento.astro`
- `docs/wiki/frontend-design.md`

Stato:
- approvata

## 2026-05-19 - Contesto Navigazione Persistente Menu Atrio

Decisione:
- la sidebar e la mobile nav non rappresentano sempre la sezione tecnica dell'URL
- il menu principale rappresenta il contesto principale di navigazione dell'utente
- il contesto viene impostato dai click sulle voci del menu principale e resta attivo durante la navigazione interna
- in assenza di un contesto salvato, il contesto viene dedotto dalla URL corrente
- con Astro ClientRouter, la logica del menu deve rieseguirsi dopo ogni navigazione client-side
- il contesto puo essere resettato in futuro su logout o cambio sessione

Motivo:
- mantenere coerente l'orientamento visivo quando l'utente parte da una sezione, per esempio Scrivania, e apre una pagina tecnicamente collocata in un'altra area, per esempio Classifica Accademia
- evitare query param o configurazioni manuali sui singoli link interni
- preservare una logica semplice e centralizzata nel componente di navigazione

Impatto:
- `src/components/Nav.astro`
- navigazione principale Atrio, Scrivania, Missioni, Accademia, Biblioteca

Stato:
- approvata

## 2026-05-14 - Token Neutro Soft Globale

Decisione:
- aggiungere il token globale `--tsbs-color-neutral-soft` con valore `#EFE9E3`
- usare il token per superfici neutre molto leggere, come pannelli e card non legati alle Accademie

Motivo:
- evitare hardcode locali per sfondi neutri soft richiesti dal design
- mantenere riutilizzabile la cromia neutra su future schermate condivise

Impatto:
- `src/styles/globals.scss`
- `src/pages/landing/login/index.astro`
- `docs/wiki/frontend-design.md`

Stato:
- approvata

## 2026-05-13 - Preferiti Profili Base Con Storage Locale

Decisione:
- creare una versione base del like profilo con `localStorage`
- salvare nei preferiti solo identificativi stabili dei profili, non copie complete dei dati profilo
- centralizzare la logica in `src/lib/profileFavorites.js`
- usare `src/data/mockProfiles.js` come dataset provvisorio finche non arriva il binding Strapi
- strutturare la sezione come `src/pages/atrio/scrivania/utenti-preferiti/`

Motivo:
- permettere subito il toggle like e la lista utenti preferiti senza introdurre backend provvisorio
- mantenere la UI indipendente dal meccanismo di persistenza
- rendere piu semplice sostituire `localStorage` con Strapi in seguito

Impatto:
- `src/lib/profileFavorites.js`
- `src/data/mockProfiles.js`
- `src/pages/atrio/scrivania/utenti-preferiti/index.astro`
- `src/pages/atrio/scrivania/utenti-preferiti/esploso-profilo-utente.astro`
- `docs/wiki/alberatura.md`

Stato:
- approvata

## 2026-05-13 - Note Dentro Grimorio Con Route Dinamica

Decisione:
- spostare l'esploso/editor della nota sotto `src/pages/atrio/scrivania/grimorio/[slugNota].astro`
- usare `src/pages/atrio/scrivania/grimorio/index.astro` come elenco/archivio note
- far puntare i blocchi di anteprima nota di Atrio, Scrivania e Grimorio alla route della nota specifica
- non introdurre componenti dedicati per la preview o per l'editor in questa fase

Motivo:
- trattare la nota come contenuto interno al Grimorio, non come sezione parallela alla Scrivania
- preparare il binding Strapi con slug stabile per ogni nota
- mantenere l'alberatura semplice e coerente con l'esperienza utente

Impatto:
- `docs/wiki/alberatura.md`
- `src/pages/atrio/index.astro`
- `src/pages/atrio/scrivania/index.astro`
- `src/pages/atrio/scrivania/grimorio/index.astro`
- `src/pages/atrio/scrivania/grimorio/[slugNota].astro`

Stato:
- approvata

## 2026-04-27 - Creazione Wiki Progetto E Guardrail AI

Decisione:
- creare una wiki leggera in `docs/wiki/`
- usare `docs/wiki/ai-context.md` come file principale di guardrail
- usare file dedicati per architettura informativa, design front-end, backend Strapi e decisioni
- aggiornare `AGENTS.md` per obbligare la lettura di `ai-context.md` prima dei lavori

Motivo:
- evitare un unico file troppo lungo
- mantenere il contesto AI leggero e operativo
- rendere aggiornabili le informazioni di progetto senza rallentare il lavoro

Impatto:
- `docs/wiki/ai-context.md`
- `docs/wiki/architettura-informativa.md`
- `docs/wiki/frontend-design.md`
- `docs/wiki/backend-strapi.md`
- `docs/wiki/decision-log.md`
- `AGENTS.md`

Stato:
- approvata

## 2026-04-27 - Guardrail Visuali Accademie

Decisione:
- usare uno stile globale per le 4 accademie
- differenziare le accademie tramite cromie dedicate
- usare `#FFFBF2` come background per pagine accademia
- usare `#3D2116` come colore globale per pagine neutre

Motivo:
- mantenere coerenza visiva
- evitare duplicazioni di layout e componenti
- rendere il sistema scalabile

Impatto:
- `docs/wiki/frontend-design.md`
- futuri file SCSS/CSS
- componenti e pagine accademia

Stato:
- approvata

## 2026-04-29 - Struttura Operativa Wiki Ridotta

Decisione:
- aggiungere `docs/wiki/index.md` come indice operativo della wiki
- mantenere `docs/wiki/ai-context.md` come file leggero di guardrail, non come contenitore di dettagli
- usare `docs/wiki/decision-log.md` come passaggio per modifiche strutturali prima di aggiornare i file tematici
- aggiungere backlink minimi tra i file wiki

Motivo:
- ottimizzare il flusso di lavoro dell'agenzia
- evitare che l'AI legga tutta la wiki a ogni richiesta
- rendere piu chiaro quando consultare e aggiornare ogni file
- mantenere tracciabili le decisioni che cambiano alberatura, Strapi, navigazione o flussi principali

Impatto:
- `docs/wiki/index.md`
- `docs/wiki/ai-context.md`
- `docs/wiki/decision-log.md`
- `docs/wiki/alberatura.md`
- `docs/wiki/architettura-informativa.md`
- `docs/wiki/backend-strapi.md`
- `docs/wiki/frontend-design.md`

Stato:
- approvata

## 2026-04-30 - Workflow Figma Mobile First E Pagine Astro Leggere

Decisione:
- quando vengono forniti screenshot Figma mobile e desktop, analizzare entrambe le versioni prima di implementare
- segnalare in chat eventuali incongruenze tra mobile e desktop
- proporre come riferimento prioritario la soluzione mobile, coerente con l'approccio mobile first
- nelle pagine Astro evitare troppe `const` statiche quando i contenuti saranno poi collegati ai dati Strapi

Motivo:
- ridurre incoerenze responsive tra Figma e implementazione
- mantenere il codice pagina leggero, leggibile e facile da collegare al backend
- evitare dati fittizi difficili da rimuovere nella fase di binding

Impatto:
- `docs/wiki/frontend-design.md`
- `docs/wiki/ai-context.md`
- workflow di implementazione pagine da Figma

Stato:
- approvata

## 2026-04-30 - Aggiornamento Token Globali Colore E CTA

Decisione:
- aggiornare il bianco globale a `#F5F5F5`
- impostare il default globale degli heading a `#1D1715`
- impostare il font heading default a Inter
- limitare Cinzel agli heading delle pagine/temi Accademia
- aggiungere la classe globale `tsbs-toast` per heading toast in Inter `1.25rem` semibold
- impostare il default globale dei link testuali a `#1D1715`
- aggiungere token dedicati per testi delle pagine neutre: titoli `#F5F5F5`, paragrafi `#666666`
- rinominare la CTA primaria globale in `global-cta-var1`, mantenendo compatibilita con `.btn-primary`
- aggiungere `global-cta-var2`, compatibile con `.btn-secondary`
- definire stati default, hover, active e focus per CTA neutrali e accademie

Motivo:
- allineare il sistema globale ai nuovi colori UI
- evitare hardcode e mantenere CTA scalabili per pagine neutre e accademie
- preservare compatibilita con Bootstrap e con le classi legacy gia presenti

Impatto:
- `src/styles/globals.scss`
- `src/pages/index.astro`
- `src/components/Nav.astro`
- `src/components/toastComponents/`
- `docs/wiki/frontend-design.md`

Stato:
- approvata

## 2026-04-30 - Componenti Toast Separati

Decisione:
- inserire le notifiche toast dedicate in `src/components/toastComponents/`
- creare toast come componenti dedicati, importati solo nelle pagine che li usano
- usare prop Astro come `isOpen={true}` per controllare la visibilita iniziale

Motivo:
- mantenere le pagine Astro leggere
- separare overlay, stile e logica di chiusura dal contenuto pagina
- preparare i toast al futuro collegamento con stato utente, onboarding e Strapi

Impatto:
- `docs/wiki/frontend-design.md`
- `src/components/toastComponents/`
- pagine che mostrano notifiche toast

Stato:
- approvata

## 2026-04-30 - Rework Temi Accademia E CTA Tematizzabili

Decisione:
- separare le CTA neutre (`global-cta-var1`, `global-cta-var2`) dalla CTA primaria tematizzabile (`tsbs-cta-primary`)
- mantenere i titoli principali pagina in Inter semibold `#1D1715`
- usare il colore dell'Accademia per elementi di accento, card title, link, progress e CTA
- definire i temi `theme-neutral`, `theme-astraria`, `theme-arcadia`, `theme-armonia`, `theme-arborea`
- non applicare Cinzel automaticamente ai temi Accademia; usare Cinzel solo con classe dedicata per smistamento/contesti rituali approvati
- rendere i toast compatibili con i temi Accademia tramite classe tema e `tsbs-cta-primary`

Motivo:
- evitare ambiguita tra CTA neutre e CTA cromatiche delle Accademie
- mantenere un unico sistema globale scalabile senza duplicare layout o componenti
- preparare il futuro binding Strapi, dove la classe tema arrivera dall'Accademia dell'utente

Impatto:
- `src/styles/globals.scss`
- `src/pages/index.astro`
- `src/components/toastComponents/WelcomeToast.astro`
- `docs/wiki/frontend-design.md`

Stato:
- approvata

## 2026-04-30 - Pulizia Figma E Background Default Pagine App

Decisione:
- quando si implementa da screenshot Figma, fare pulizia dei dettagli provvisori prima di scrivere codice
- non copiare background, texture o pattern presenti nei Figma se non sono stati confermati come asset definitivo
- usare il background globale delle pagine app `--tsbs-color-surface` (`#FFFBF2`) finche non viene fornito il pattern definitivo
- integrare il futuro pattern tramite token/stile riutilizzabile, non con override isolati pagina per pagina

Motivo:
- evitare che elementi provvisori dello screenshot diventino debito tecnico
- mantenere coerenza tra pagine app mentre il pattern definitivo non e disponibile
- rendere piu semplice sostituire il background quando arrivera l'asset ufficiale

Impatto:
- `docs/wiki/frontend-design.md`
- pagine app implementate da Figma
- futuri token/stili background

Stato:
- approvata

## 2026-04-30 - Dimensione Condivisa Banda Titolo Pagine App

Decisione:
- le pagine interne dell'app che usano una banda titolo superiore devono condividere la stessa dimensione
- la banda titolo non deve comportarsi come una hero
- su desktop deve allinearsi all'altezza dell'header app usato in Atrio/index
- su mobile deve restare compatta e proporzionata
- il testo della banda puo cambiare in base alla sezione, ma la struttura dimensionale resta coerente

Motivo:
- mantenere continuita tra sezioni diverse dell'app
- evitare che singole pagine introducano header sproporzionati o non responsive
- rendere il componente riutilizzabile per titoli diversi da `Missioni`

Impatto:
- `docs/wiki/frontend-design.md`
- futuri header/bande titolo delle pagine app
- `src/pages/missioni/index.astro`

Stato:
- approvata

## 2026-05-04 - Route Missioni Stabili E Componenti Variabili

Decisione:
- mantenere stabile l'alberatura Astro delle missioni su `missioni/[slugMis]/`
- non creare route diverse per categoria o tipologia missione
- gestire i diversi layout missione tramite componenti interni scelti in base ai dati Strapi
- usare `missioni/[slugMis]/prova/index.astro` come ingresso/regia della prova
- usare `missioni/[slugMis]/sfida-lettura.astro` per il layout della sfida lettura legata alla singola missione
- usare `missioni/[slugMis]/prova/sfida-lettura.astro` per lo step prova dedicato alla sfida lettura
- usare `Categoria Missione` soprattutto per classificazione e filtri, salvo conferma che coincida davvero con la tipologia visiva

Motivo:
- evitare URL fragili se una missione cambia categoria
- mantenere l'alberatura Astro semplice e scalabile
- preparare il binding Strapi senza moltiplicare pagine e micro-logiche
- separare classificazione editoriale, layout dettaglio, tipo prova e tipo esito
- riusare il componente prova a scelta multipla anche nella scelta citazionale, evitando una route `domanda.astro` separata

Impatto:
- `docs/wiki/alberatura.md`
- `docs/wiki/backend-strapi.md`
- componenti prova in `src/components/MissioniComponents/`
- pagine in `src/pages/missioni/[slugMis]/`

Stato:
- approvata

## 2026-05-05 - Priorita A Classi Globali E Pattern Esistenti

Decisione:
- prima di aggiungere CSS o wrapper locali, verificare se una classe globale, un token o un pattern esistente risolve gia il problema
- usare direttamente `container-xl tsbs-app-container`, token tema e componenti esistenti quando coprono larghezza, gutter, shell, cromie e spaziature comuni
- limitare il CSS specifico alle sole differenze reali del componente
- se un fix richiede margini negativi, max-width locali o padding duplicati rispetto al sistema globale, rivalutare il markup e spostare la classe globale nel punto corretto

Motivo:
- mantenere il codice pulito, semplice e scalabile
- evitare micro-fix fragili e duplicazioni di logiche gia globali
- garantire coerenza tra pagine app, dettaglio missione e pagine figlie delle missioni

Impatto:
- `docs/wiki/frontend-design.md`
- future implementazioni UI e componenti missione
- review dei fix CSS su pagine app

Stato:
- approvata

## 2026-05-05 - Risposta Libera Sostituisce Parola Dordine

Decisione:
- il componente `ParolaDordine.astro` non e piu parte dei componenti prova missione
- `RispostaLibera.astro` gestisce il flusso testuale libero
- eventuali valori legacy `parola-dordine` o `parolaDordine` provenienti da Strapi vengono ancora instradati verso `RispostaLibera.astro`

Motivo:
- evitare duplicazione tra due componenti con lo stesso comportamento
- mantenere compatibilita temporanea con dati Strapi eventualmente non ancora riallineati
- semplificare la regia di `missioni/[slugMis]/prova/index.astro`

Impatto:
- `docs/wiki/alberatura.md`
- `src/components/MissioniComponents/RispostaLibera.astro`
- `src/pages/missioni/[slugMis]/prova/index.astro`

Stato:
- approvata

## 2026-05-06 - Icone Esito Prova E Componenti Prova

Decisione:
- le icone definitive degli esiti prova non sono ancora state fornite
- l'icona della prova non superata sara unica per tutte le tipologie di prova
- l'icona della prova superata potra variare in base alla tipologia di prova
- anche se le prove avranno piu tipologie editoriali o funzionali, devono restare gestibili con due componenti principali: `RispostaLibera.astro` e `SceltaDomanda.astro`

Motivo:
- mantenere il frontend semplice e scalabile in attesa degli asset definitivi
- evitare di creare un componente Astro diverso per ogni tipologia di prova
- preparare il binding Strapi a guidare icone e comportamento tramite dati controllati

Impatto:
- `docs/wiki/alberatura.md`
- `docs/wiki/backend-strapi.md`
- `src/components/MissioniComponents/RispostaLibera.astro`
- `src/components/MissioniComponents/SceltaDomanda.astro`
- `src/components/toastComponents/TestPassed.astro`
- `src/components/toastComponents/TestNotPassed.astro`

Stato:
- approvata

## 2026-05-06 - Missioni Dentro Atrio

Decisione:
- le pagine missioni vengono collocate sotto `src/pages/atrio/missioni/`
- gli URL missioni diventano `/atrio/missioni/` e `/atrio/missioni/[slugMis]/`
- la struttura interna della singola missione resta stabile: dettaglio, `sfida-lettura`, `prova/index` ed eventuale `prova/sfida-lettura`

Motivo:
- allineare l'alberatura Astro alla nuova organizzazione dell'area Atrio
- mantenere le missioni come sotto-area dell'hub applicativo senza moltiplicare route per categoria o tipologia

Impatto:
- `docs/wiki/alberatura.md`
- `src/pages/atrio/missioni/`
- `src/components/Nav.astro`

Stato:
- approvata

## 2026-05-06 - Popup Dedicati E DomandaModal Per Sfida Lettura

Decisione:
- usare `src/components/PopupComponents/` per popup e modali interattivi
- mantenere separati popup/modali dai toast: i toast sono feedback brevi, i popup gestiscono scelte utente
- il popup della sfida lettura si chiama `DomandaModal.astro`
- `DomandaModal.astro` deve riusare il linguaggio visivo di `SceltaDomanda.astro`, adattato a popup/modale
- nella sfida lettura, quando l'utente seleziona un libro letto, il popup deve permettere di scegliere la risposta corretta
- il popup deve includere una `X` in alto a destra per chiudere e annullare una selezione fatta per errore

Motivo:
- mantenere `sfida-lettura.astro` come pagina di regia leggera
- evitare di trasformare i toast in componenti interattivi complessi
- rendere il flusso riusabile e scalabile per altre sfide o missioni simili

Impatto:
- `docs/wiki/frontend-design.md`
- `docs/wiki/alberatura.md`
- `src/components/PopupComponents/DomandaModal.astro`
- `src/pages/atrio/missioni/[slugMis]/sfida-lettura.astro`

Stato:
- approvata

## 2026-05-11 - Logica Trofei A Matrice Tetris

Decisione:
- implementare la griglia Trofei come griglia 5 colonne x 8 righe
- rappresentare ogni trofeo con una matrice 2D in cui `1` indica una cella occupata e `0` una cella libera
- validare collisioni e fuori griglia solo sulle celle occupate dalla matrice, non sul rettangolo completo dell'immagine
- mantenere le celle `0` attraversabili e riempibili da altri trofei
- posizionare la X di rimozione nella prima cella occupata del trofeo, in alto a sinistra

Motivo:
- ottenere un comportamento piu vicino a Tetris
- permettere incastri naturali tra trofei con sagome non rettangolari
- evitare sovrapposizioni logiche mantenendo una soluzione semplice, senza canvas o librerie aggiuntive

Impatto:
- `src/pages/atrio/scrivania/trofei.astro`
- `docs/wiki/frontend-design.md`

Stato:
- approvata

## 2026-05-15 - Trofei Posizionabili Una Sola Volta

Decisione:
- ogni trofeo disponibile puo essere selezionato e posizionato una sola volta nella griglia personale
- dopo il posizionamento, il trofeo corrispondente nella lista `Trofei disponibili` deve apparire oscurato e non deve essere cliccabile o trascinabile
- se il trofeo viene rimosso dalla griglia o viene usato `Reset`, torna disponibile nella lista

Motivo:
- rendere chiaro all'utente quali trofei sono gia stati caricati nella stanza personale
- evitare duplicazioni dello stesso trofeo nella griglia
- mantenere una logica semplice e coerente con il catalogo trofei

Impatto:
- `src/pages/atrio/scrivania/trofei.astro`
- `docs/wiki/frontend-design.md`

Stato:
- approvata

## 2026-05-21 - Ambiente Di Produzione Vercel E Guardrail HTTP

Decisione:
- l'ambiente di produzione del frontend e Vercel
- tutte le modifiche al middleware, routing, redirect, cookie e header HTTP devono tenere conto del comportamento di Vercel
- usare sempre `x-forwarded-host` e `x-forwarded-proto` per ricavare l'host e il protocollo reali nelle request server-side
- non usare `context.url.host` o `context.url.protocol` come unica fonte per costruire URL assoluti di redirect

Motivo:
- Vercel inserisce un proxy davanti all'app; `context.url` puo restituire `localhost` come host anche in produzione
- bug riscontrato: maintenance mode reindirizzava a `localhost/maintenance` invece del dominio Vercel corretto

Impatto:
- `src/middleware.ts`
- qualsiasi logica di redirect, cookie `secure`, o costruzione URL assoluti lato server

Stato:
- approvata

## Vedi Anche

- [Index Wiki](./index.md)
- [AI Context](./ai-context.md)
- [Alberatura](./alberatura.md)
