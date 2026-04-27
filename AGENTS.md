# Istruzioni Per AI - The Secret Bookish Society

## Ordine Operativo

Prima di iniziare qualsiasi lavoro:

1. leggere `docs/wiki/ai-context.md`  
2. chiedere se ci sono cambiamenti rilevanti rispetto al contesto corrente
3. consultare i file wiki specifici solo quando servono
4. procedere rispettando i guardrail

File wiki disponibili e da consultare all'occorezza:
- se leggi un file docs da consultare all'occorezza leggi sempre`docs/wiki/decision-log.md`
- `docs/wiki/architettura-informativa.md`
- `docs/wiki/frontend-design.md`
- `docs/wiki/backend-strapi.md`



Se emergono decisioni nuove o cambiamenti strutturali, proporre l'aggiornamento di `docs/wiki/decision-log.md`.

## Principio Di Lavoro

Le soluzioni devono essere:
- semplici
- efficaci
- scalabili
- coerenti con l'architettura esistente

Non introdurre complessita non richiesta.

## Lingue

La web app e attualmente solo in italiano.

Il progetto deve essere solo predisposto per ospitare in futuro l'inglese, senza creare ora contenuti, pagine, alberature o traduzioni inglesi non richieste.

Regole:
- mantenere `lang` dove gia previsto
- evitare hardcode che impediscano il futuro multilingua
- usare fallback verso italiano
- non avviare processi di duplicazione lingua senza richiesta esplicita
- prima di qualsiasi lavoro sulle lingue, chiedere sempre se ci sono cambiamenti
