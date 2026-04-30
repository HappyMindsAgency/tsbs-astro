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
- implementare solo dopo aver chiarito eventuali differenze rilevanti

Se viene fornita una sola versione, ricavare l'altra in modo semplice e coerente con il sistema globale, segnalando le assunzioni principali.

## Pulizia Figma E Background

Quando si implementa una pagina partendo da screenshot Figma, non copiare automaticamente tutti gli elementi visuali presenti nello screenshot.

Regole:
- fare pulizia dei dettagli provvisori o non confermati prima di scrivere codice
- non trasformare in codice background, texture o pattern presenti nel Figma se non sono stati confermati come asset definitivo
- usare il background default delle pagine app `--tsbs-color-surface` (`#FFFBF2`) finche non viene fornito il pattern ufficiale
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
- CTA var2 default: `#B89B7F`
- CTA var2 hover: `#9A7D63`
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
