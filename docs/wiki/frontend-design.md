# Frontend Design - The Secret Bookish Society

## Scopo

Questo file raccoglie regole visuali, UI e front-end. Va consultato quando si lavora su layout, componenti, pagine, stili, tipografia, cromie, animazioni o stati interattivi.

## Principi UI

- Mobile first.
- Bootstrap come base.
- HTML, TypeScript, CSS e SCSS.
- Componenti semplici, riutilizzabili e coerenti con l'alberatura gia impostata.
- Non creare sistemi paralleli se una soluzione globale puo essere declinata.
- Non inventare testi definitivi, microcopy, claim, titoli, descrizioni o CTA: usare solo `Lorem Ipsum` quando il testo non e fornito dall'utente o gia approvato nei file di progetto.
- Mantenere tono coerente con Societa Segreta, Accademie, missioni, epistole e lore.
- Restare più fedele possibile al figma senza però creare troppi fix.
- Il design dev'essere responsive addativo 

## Workflow Figma

Quando vengono forniti screenshot Figma mobile e desktop:
- analizzare entrambe le versioni prima di implementare
- segnalare in chat eventuali incongruenze di design o responsive
- proporre come riferimento prioritario la soluzione mobile, per coerenza con il mobile first
- se mobile e desktop non sono allineati sui colori Accademia, usare il mobile come fonte attendibile: il desktop puo guidare layout, spaziature e responsive, ma non deve sovrascrivere cromie tematiche gia presenti nel mobile
- se Figma contraddice una regola globale gia definita nel progetto, vince la regola globale del progetto: container, spaziature, shell, token, temi e componenti condivisi devono restare coerenti e scalabili
- quando possibile, adottare o estendere una regola globale gia esistente invece di introdurre micro-fix pagina per pagina
- implementare solo dopo aver chiarito eventuali differenze rilevanti

Se viene fornita una sola versione, ricavare l'altra in modo semplice e coerente con il sistema globale, segnalando le assunzioni principali.

## Pulizia Figma E Background

Quando si implementa una pagina partendo da screenshot Figma, non copiare automaticamente tutti gli elementi visuali presenti nello screenshot.

Regole:
- fare pulizia dei dettagli provvisori o non confermati prima di scrivere codice
- non trasformare in codice background, texture o pattern presenti nel Figma se non sono stati confermati come asset definitivo
- usare il background default delle pagine app `--tsbs-color-surface` (`#FFFBF2`) finche non viene fornito il pattern ufficiale
- nel dettaglio missione mantenere lo stesso background globale `--tsbs-color-surface` su mobile e desktop; il pattern visto nei layout e da considerare placeholder finche non arriva l'asset definitivo
- quando arrivera il pattern definitivo, integrarlo tramite token/stile riutilizzabile e non come override isolato pagina per pagina
- mantenere eventuali cromie di sezione tramite tema/token, evitando background custom temporanei derivati dagli screenshot

## Header Pagine App

Le pagine interne dell'app che usano una banda titolo superiore devono condividere la stessa dimensione, indipendentemente dal nome della sezione mostrata.

Regole:
- la banda titolo non deve comportarsi come una hero
- su desktop deve allinearsi all'altezza dell'header app usato in Atrio/index
- su mobile deve restare compatta e proporzionata al viewport
- il testo della banda cambia in base alla sezione, ma la struttura dimensionale deve restare coerente
- eventuali differenze cromatiche devono passare da tema/token, non da altezze diverse pagina per pagina

## Spaziatura Pagine App

Le pagine interne dell'app devono usare una struttura Bootstrap-first:
- `tsbs-app-shell` gestisce lo spazio del menu app mobile e della sidebar desktop
- `container-xl tsbs-app-container` gestisce larghezza, gutter e padding verticale del contenuto
- su mobile `tsbs-app-container` usa `--bs-gutter-x: 1.875rem`, pari a circa `0.9375rem` per lato
- le classi specifiche di pagina devono gestire solo layout interno e componenti, non la spaziatura generale della pagina

Se una pagina richiede gli stessi spazi laterali o verticali di altre pagine app, usare o estendere `tsbs-app-container` invece di duplicare padding e max-width locali.

Regola di priorita implementativa:
- prima di scrivere nuovo CSS o markup wrapper, verificare se esiste gia una classe globale o un pattern locale che risolve il problema
- usare direttamente classi globali come `container-xl tsbs-app-container`, token tema e componenti esistenti quando coprono il caso
- scrivere CSS specifico solo per differenze reali del componente, non per replicare spaziature, larghezze, gutter, shell, colori tema o logiche gia globali
- se un fix richiede margini negativi, max-width locali o padding duplicati rispetto al container globale, rivalutare la struttura: spesso la soluzione corretta e spostare la classe globale nel punto giusto del markup
- preferire sempre la strada piu semplice, efficace, scalabile e coerente con l'architettura esistente

Regola specifica missioni:
- le pagine figlie di una singola missione, inclusa `sfida-lettura`, devono riusare lo stesso contenitore dell'esploso missione: `container-xl tsbs-app-container`
- non aggiungere `max-width`, gutter, padding laterali o override mobile locali sul wrapper contenuto se cambiano lo spazio a destra e sinistra rispetto all'esploso missione
- eventuali differenze devono stare dentro i componenti interni della pagina, non nel contenitore principale

## Pulizia Codice Pagine

Nelle singole pagine Astro mantenere il codice leggero.

Regole:
- evitare troppe `const` statiche per contenuti provvisori
- usare dati minimi solo quando aiutano davvero a non duplicare markup
- ricordare che testi e dati placeholder saranno rimossi o collegati a Strapi nella fase di binding
- preferire markup chiaro e classi globali riutilizzabili a strutture temporanee troppo articolate

## Tipografia

Body:
- font: Inter
- size: `1rem`
- color: `#666666`

Titoli:
- font default: Inter
- weight: semibold / `600`
- h1 size tema: `3rem`
- color: `#1D1715`

Titoli rituali / smistamento:
- font: Cinzel
- uso: solo dove richiesto dal design, al momento pagina smistamento
- non applicare Cinzel automaticamente ai temi Accademia

Sottotitoli:
- font: Inter
- weight: Extra Light
- size: `1.5rem`

CTA:
- font: Playfair Display
- weight: `400`

Nota:
- verificare sempre che i font siano caricati o dichiarati correttamente nel progetto prima di usarli in produzione.

## Cromie

Colore globale body:
- hex: `#666666`
- uso: testo body e contenuti testuali principali

Colore neutro soft globale:
- hex: `#EFE9E3`
- token: `--tsbs-color-neutral-soft`
- uso: superfici neutre molto leggere, come pannelli o card riutilizzabili in contesti non legati alle Accademie

Accento neutro globale:
- hex: `#B89A7E`
- token: `--tsbs-color-neutral-accent`
- variante soft: `--tsbs-color-neutral-accent-soft`
- uso: superfici e stati neutri di maggiore presenza visiva, come box di risposta default del test smistamento

Colore globale heading:
- hex: `#1D1715`
- uso: titoli principali pagina e titoli di sezione

Colore globale link:
- hex: `#1D1715`
- uso: default per link testuali `a`, salvo override specifici di componente

Bianco globale:
- hex: `#F5F5F5`
- uso: superfici e testi chiari tramite token `--tsbs-color-white`

Testi pagine neutre:
- titoli: `#F5F5F5`
- paragrafi: `#666666`
- uso: applicare tramite classi dedicate di pagina neutra, senza forzare questi colori su tutte le pagine

Colore globale pagine neutre:
- CTA var1 default: `#3E2016`
- CTA var1 hover: `#2A1509`
- CTA var1 active: `#6B3A28`
- CTA var1 focus: background `#6B3A28`, border `1px solid #3E2016`
- CTA var2 default: background `#B89B7F`, testo `#F5F5F5`
- CTA var2 hover: background `#9A7D63`, testo `#F5F5F5`
- CTA var2 active: `#D4BCA4`
- CTA var2 focus: background `#D4BCA4`, border `1px solid #B89B7F`

Classi CTA globali:
- `global-cta-var1`: CTA primaria neutra, da usare solo in contesti/pagine neutre
- `global-cta-var2`: CTA secondaria globale, compatibile con alias Bootstrap `.btn-secondary`
- `tsbs-cta-primary`: CTA primaria tematizzabile, da usare dentro `theme-neutral` o temi Accademia
- mantenere gli alias legacy solo per compatibilita tecnica quando gia presenti

Sistema tema:
- `theme-neutral`: tema neutro
- `theme-astraria`: tema Accademia Astraria
- `theme-arcadia`: tema Accademia Arcadia
- `theme-armonia`: tema Accademia Armonia
- `theme-arborea`: tema Accademia Arborea
- i titoli principali restano `#1D1715`
- elementi di accento, card title, link, progress e CTA usano il colore del tema
- usare `tsbs-accent-title`, `tsbs-accent-link` e `tsbs-progress-accent` quando un elemento deve prendere il colore tema

Heading toast:
- classe contenitore: `tsbs-toast`
- font: Inter
- size: `1.25rem`
- weight: semibold / `600`
- uso: heading `h1`-`h6` dentro notifiche toast
- i toast che dipendono dall'accademia devono ricevere la stessa classe tema della pagina e usare `tsbs-cta-primary`

Background pagine Accademia:
- hex: `#FFFBF2`

Accademia Arborea:
- default CTA: `#7B872E`
- hover CTA: `#252F06`
- active CTA: `#E2EAAA`
- focus CTA: background `#E2EAAA`, border `1px solid #7B872E`

Accademia Armonia:
- default CTA: `#D7A839`
- hover CTA: `#502E0E`
- active CTA: `#F5E5B7`
- focus CTA: background `#F5E5B7`, border `1px solid #D7A839`

Accademia Arcadia:
- default CTA: `#72191C`
- hover CTA: `#2E0405`
- active CTA: `#E2B8BA`
- focus CTA: background `#E2B8BA`, border `1px solid #72191C`

Accademia Astraria:
- default CTA: `#2A3369`
- hover CTA: `#161A38`
- active CTA: `#BDCDE8`
- focus CTA: background `#BDCDE8`, border `1px solid #2A3369`

## Accademie

Le 4 accademie devono condividere uno stile globale.

La differenziazione deve avvenire tramite:
- variabili colore
- classi tematiche
- token SCSS/CSS

Evitare:
- 4 layout separati
- 4 componenti duplicati
- regole CSS ripetute e non scalabili

Le classi tema Accademia, come `theme-astraria`, `theme-arcadia`, `theme-armonia` e `theme-arborea`, devono essere applicate a un padre comune tramite `Layout.astro`, non ripetute nei singoli `main` pagina per pagina.

Regole:
- `Layout.astro` gestisce la classe tema globale con fallback temporaneo
- le pagine Astro non devono dichiarare `const academyTheme = 'theme-...'` se non serve un override esplicito
- `main`, sezioni, componenti, toast, CTA e progress devono ereditare i token tema dal padre
- quando il tema arrivera da Strapi o dallo stato utente, il binding dovra aggiornare il valore passato al layout, non ogni singola pagina

## Hero

Regole:
- usare immagine full
- la hero deve essere visualmente forte e coerente con il contenuto
- evitare hero vuote, solo decorative o generiche
- non sostituire immagini necessarie con blocchi astratti se serve un riferimento reale o narrativo

## Toast E Notifiche

Libreria prevista:
- SweetAlert2

Regole:
- usare toast/notifiche interne per feedback brevi
- non creare sistemi di notifica paralleli senza motivo
- mantenere i messaggi brevi e chiari
- applicare la classe globale `tsbs-toast` ai contenitori toast
- inserire i componenti toast dedicati in `src/components/toastComponents/`
- importare i toast solo nelle pagine che li usano
- usare prop Astro come `isOpen={true}` per controllare la visibilita iniziale
- mantenere SCSS leggero e JS minimo per chiusura o interazioni essenziali

## Popup E Modali

Regole:
- usare `src/components/PopupComponents/` per popup e modali interattivi che richiedono una scelta utente
- tenere separati popup/modali dai toast: i toast restano feedback brevi, i popup gestiscono interazioni guidate
- importare i popup solo nelle pagine che li usano
- mantenere layout, stile e logica di chiusura dentro componenti dedicati, evitando di appesantire le pagine Astro
- i popup che dipendono dall'accademia devono ereditare il tema dal padre e usare `tsbs-cta-primary`
- prevedere una `X` di chiusura quando l'utente deve poter annullare una selezione fatta per errore

Sfida lettura:
- il popup per la domanda aperta dopo la selezione di un libro letto si chiama `DomandaModal.astro`
- `DomandaModal.astro` vive in `src/components/PopupComponents/`
- il design puo riusare il linguaggio visivo di `SceltaDomanda.astro`, adattandolo a un popup/modale compatto

## Griglia Trofei

La pagina Trofei usa una logica di posizionamento stile Tetris.

Regole:
- la griglia resta 5 colonne x 8 righe
- ogni trofeo e descritto da una matrice 2D
- `1` indica una cella occupata dal trofeo
- `0` indica una cella libera, attraversabile e riempibile da altri trofei
- collisioni e fuori griglia devono essere calcolati solo sulle celle `1`
- l'immagine del trofeo resta una rappresentazione visiva, non la fonte della collisione
- drag e drop devono fare snap alla griglia mantenendo il top-left reale del pezzo
- la X di rimozione va nella prima cella occupata del trofeo, in alto a sinistra
- ogni trofeo puo essere selezionato e posizionato una sola volta nella griglia
- dopo il posizionamento, il relativo elemento in `Trofei disponibili` deve risultare oscurato e non riselezionabile
- su mobile la palette dei trofei disponibili deve restare sopra al menu di navigazione

Note implementative:
- evitare canvas, Konva o librerie nuove finche la matrice 2D copre il bisogno
- mantenere la pagina Astro semplice, con logica locale e pronta a ricevere in futuro i trofei preferiti da Strapi

## Animazioni

Libreria prevista:
- Lottie

Regole:
- usare animazioni solo quando aggiungono orientamento, feedback o valore narrativo
- evitare animazioni decorative che rallentano l'esperienza

## Multilingua

La web app e attualmente solo in italiano.

Il frontend deve restare predisposto per ospitare in futuro l'inglese, senza creare ora contenuti, pagine, alberature o traduzioni inglesi non richieste.

Regole:
- usare `lang` dove previsto
- non hardcodare testi o URL in modo che blocchino il multilingua
- mantenere fallback verso italiano
- verificare coerenza con `src/i18n/config.ts`
- non avviare processi di duplicazione lingua senza richiesta esplicita

## Accessibilita E Qualita

- CTA leggibili con contrasto adeguato.
- Testi non sovrapposti su mobile.
- Stati hover/focus coerenti.
- Layout verificati prima su mobile.
- Non usare placeholder narrativi inventati: se manca testo approvato, usare solo `Lorem Ipsum`.
- Non creare componenti visivamente scollegati dal sistema globale.

## Mood Visuale

La ricerca visuale supera il fantasy tradizionale.

Direzione:
- forme nette
- geometrie espressive
- riferimenti a videogiochi indie
- tono misterioso ma non generico

Evitare:
- estetica fantasy stereotipata
- dashboard SaaS neutra
- decorazioni non funzionali

## Vedi Anche

- [Index Wiki](./index.md)
- [Alberatura](./alberatura.md)
- [Architettura Informativa](./architettura-informativa.md)
- [Decision Log](./decision-log.md)
