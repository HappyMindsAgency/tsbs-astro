# Index Wiki - The Secret Bookish Society

## Scopo

Questo file e l'indice operativo della wiki di progetto.

Serve a capire quali file leggere, in quale ordine e quando aggiornare la documentazione. La wiki deve restare leggera: non va letta tutta a ogni richiesta, ma solo nelle parti utili al lavoro in corso.

## Ordine Di Lettura

Prima di ogni lavoro:

1. leggere [AI Context](./ai-context.md)
2. verificare se ci sono cambiamenti rilevanti rispetto al contesto corrente
3. usare questo indice per scegliere i file specifici da consultare
4. consultare [Decision Log](./decision-log.md) quando il lavoro tocca decisioni strutturali

## File Disponibili

### [AI Context](./ai-context.md)

Guardrail stabili del progetto.

Da leggere sempre. Deve restare sintetico e non deve contenere dettagli operativi lunghi, alberature complete o decisioni storiche.

### [Decision Log](./decision-log.md)

Registro delle decisioni importanti.

Da consultare e aggiornare quando cambiano:
- alberatura
- naming tecnico
- struttura Strapi
- navigazione
- flussi principali
- regole multilingua
- guardrail stabili

### [Alberatura](./alberatura.md)

Struttura strategica delle pagine Astro.

Da consultare quando si lavora su route, pagine, slug, sezioni, menu, Figma o mapping con Strapi.

### [Architettura Informativa](./architettura-informativa.md)

Sezioni, flussi, label e logica narrativa della web app.

Da consultare quando si progettano pagine, navigazione, gerarchie contenutistiche o naming utente.

### [Backend Strapi](./backend-strapi.md)

Regole e mappa backend.

Da consultare quando si lavora su API, collection, single type, relazioni, dati, ruoli, validazioni o integrazioni, utile soprattuto nella fase di buinding.

### [Frontend Design](./frontend-design.md)

Regole UI e front-end.

Da consultare quando si lavora su layout, componenti, pagine, SCSS/CSS, responsive, cromie, Figma o stati interattivi.

### [Maintenance Mode](./maintenance.md)

Logica operativa della maintenance mode, bypass e futura gestione tramite variabile ambiente Vercel.

Da consultare quando si lavora su `src/middleware.ts`, pagina `/maintenance`, deploy Vercel o variabili ambiente legate alla visibilita pubblica della web app.

## Workflow Aggiornamento Wiki

### Cambiamenti Strutturali

Per modifiche strutturali non aggiornare direttamente il file tematico come se fosse una nota isolata.

Usare questo flusso:

1. registrare la decisione in [Decision Log](./decision-log.md)
2. chiarire se lo stato e `proposta` o `approvata`
3. aggiornare il file tematico coinvolto
4. aggiornare questo indice se nasce un nuovo file o cambia il ruolo di un file
5. aggiornare i backlink minimi nei file coinvolti

Esempi di modifiche strutturali:
- nuova pagina in [Alberatura](./alberatura.md)
- nuovo slug o route dinamica
- nuova collection o relazione Strapi
- cambio di voce menu
- cambio di flusso onboarding
- cambio di strategia multilingua

### Cambiamenti Operativi Minori

Per correzioni o chiarimenti piccoli si puo aggiornare direttamente il file interessato, se non cambia una decisione di progetto.

Esempi:
- refuso
- link mancante
- nota esplicativa
- chiarimento che non cambia la struttura

## Regola Backlink

Ogni file wiki deve avere una sezione finale `Vedi Anche` con link minimi ai file collegati.

Non serve collegare tutto con tutto. I backlink devono aiutare il flusso di lavoro, non appesantire la lettura.

## Vedi Anche

- [AI Context](./ai-context.md)
- [Decision Log](./decision-log.md)
- [Alberatura](./alberatura.md)
- [Maintenance Mode](./maintenance.md)
