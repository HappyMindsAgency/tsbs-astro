# Frontend Design - The Secret Bookish Society

## Scopo

Questo file raccoglie regole visuali, UI e front-end. Va consultato quando si lavora su layout, componenti, pagine, stili, tipografia, cromie, animazioni o stati interattivi.

## Principi UI

- Mobile first.
- Bootstrap come base.
- HTML, TypeScript, CSS e SCSS.
- Componenti semplici, riutilizzabili e coerenti con l'alberatura gia impostata.
- Non creare sistemi paralleli se una soluzione globale puo essere declinata.
- Non inventare testi definitivi: usare `Lorem Ipsum` quando manca copy approvato.
- Mantenere tono coerente con Societa Segreta, Accademie, missioni, epistole e lore.
- Restare più fedele possibile al figma senza però creare troppi fix.
- Il design dev'essere responsive addativo 

## Tipografia

Body:
- font: Inter
- size: `1rem`

Titoli:
- font: Cinzel
- weight: bold
- size: `2.5rem`

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

Colore globale font:
- hex: `#1D1717`
- uso: testo body e contenuti testuali principali

Colore globale pagine neutre:
- hex: `#3D2116`
- uso: titoli, sottotitoli, CTA
- testo CTA: bianco

Background pagine Accademia:
- hex: `#FFFBF2`

Accademia Arborea:
- colore rappresentativo: `#626C25`
- uso: titoli, sottotitoli, CTA
- testo CTA: bianco

Accademia Armonia:
- colore rappresentativo: `#695424`
- uso: titoli, sottotitoli, CTA
- testo CTA: bianco

Accademia Arcadia:
- colore rappresentativo: `#5B1416`
- uso: titoli, sottotitoli, CTA
- testo CTA: bianco

Accademia Astraria:
- colore rappresentativo: `#222954`
- uso: titoli, sottotitoli, CTA
- testo CTA: bianco

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
- Non usare placeholder narrativi inventati.
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
