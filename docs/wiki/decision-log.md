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

## Vedi Anche

- [Index Wiki](./index.md)
- [AI Context](./ai-context.md)
- [Alberatura](./alberatura.md)
