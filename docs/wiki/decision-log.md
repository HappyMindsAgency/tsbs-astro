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

## Vedi Anche

- [Index Wiki](./index.md)
- [AI Context](./ai-context.md)
- [Alberatura](./alberatura.md)
