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
