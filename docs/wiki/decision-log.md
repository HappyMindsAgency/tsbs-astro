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

## Vedi Anche

- [Index Wiki](./index.md)
- [AI Context](./ai-context.md)
- [Alberatura](./alberatura.md)
