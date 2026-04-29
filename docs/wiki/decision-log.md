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

## Vedi Anche

- [Index Wiki](./index.md)
- [AI Context](./ai-context.md)
- [Alberatura](./alberatura.md)
