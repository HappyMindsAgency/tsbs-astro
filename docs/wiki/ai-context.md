# AI Context - The Secret Bookish Society

## Obiettivo

Questo file definisce i guardrail operativi stabili per lavorare sul progetto **The Secret Bookish Society**, web app narrativa/gamificata per Biblioteca Classense di Ravenna.

Prima di iniziare qualsiasi lavoro, l'AI deve leggere questo file, rispettare le scelte gia impostate e chiedere se ci sono cambiamenti rilevanti rispetto al contesto corrente.

Le soluzioni da scegliere devono essere sempre:
- semplici
- efficaci
- scalabili
- coerenti con l'architettura esistente

Non introdurre complessita non richiesta.

## Stack Tecnologici

Frontend:
- Astro
- TypeScript
- HTML
- SCSS/CSS
- Bootstrap, mobile first
- Bootstrap Icons
- Deploy su Vercel

Backend:
- Strapi / Strapi Cloud
- API Strapi consumate dal frontend
- SMTP fornito da Biblioteca Classense per email transazionali
- integrazione esterna prevista: sito WordPress Biblioteca Classense per recupero eventi

Librerie e pattern UI:
- toast/notifiche interne: SweetAlert2
- animazioni: Lottie
- hero visuali: immagine full

## Principi Architetturali

Il progetto e una web app narrativa, non una dashboard generica.

Ogni sezione deve mantenere una doppia funzione:
- funzionale
- narrativa

La struttura deve rispettare il concept della Societa Segreta:
- appartenenza
- iniziazione
- missioni
- accademie
- progressione
- epistole
- lore

Non inventare testi definitivi. Quando serve un placeholder, usare solo `Lorem Ipsum`.

Non inventare dati, label istituzionali, nomi di collection, flussi o contenuti narrativi non confermati.

## Scope Attuale

La web app e attualmente solo in italiano.

Il progetto deve restare solo predisposto per ospitare in futuro l'inglese. Non creare ora contenuti, pagine, alberature o traduzioni inglesi non richieste.

Quando si lavora su pagine, componenti o utility:
- usare sempre `lang` dove previsto
- usare valori lingua normalizzati, senza spazi o varianti casuali
- non hardcodare logiche che impediscono il multilingua
- mantenere fallback chiari verso italiano
- non duplicare testi in modo casuale dentro i componenti
- non avviare processi di duplicazione lingua senza richiesta esplicita

Le label principali da preservare sono:
- Atrio
- Missioni
- Accademia
- Scrivania
- Eventi
- Archivio
- Epistole
- Profilo e impostazioni
- Percorso di studi
- Trofei
- Grimorio

## Backend

Il backend e basato su Strapi.

Regole backend:
- non modificare modelli, collection o relazioni senza conferma
- mantenere separati dati funzionali e contenuti narrativi
- non introdurre automazioni su utenti inattivi
- rispettare GDPR e diritto alla cancellazione su richiesta
- validazione tessera Biblioteca: processo manuale
- nickname: blacklist statica nel frontend, non gestita da pannello admin

Per il dettaglio delle collection Strapi, consultare `docs/wiki/backend-strapi.md`.

## Frontend Specifiche

Approccio:
- mobile first
- rispettare l'alberatura gia predisposta
- usare componenti semplici e riutilizzabili
- mantenere Bootstrap come base
- usare SCSS globale con attenzione alla scalabilita

Accademie:
- le 4 accademie condividono uno stile globale comune
- le differenze devono essere gestite tramite cromie/variabili, non tramite 4 sistemi separati

Hero:
- usare immagine full
- evitare hero generiche, vuote o solo decorative

Toast:
- usare SweetAlert2 per notifiche/toast interne

Animazioni:
- usare Lottie quando richiesto o gia previsto dal design

Testi:
- non inventare copy finale
- se manca testo approvato, usare `Lorem Ipsum`
- mantenere tono coerente con Societa Segreta, Accademia, missione, epistola, lore

## Guardrail Narrativi

- `Epistole` non sono semplici notifiche: sono il canale narrativo principale.
- `Atrio` e l'hub centrale, non una dashboard neutra.
- `Scrivania` e lo spazio personale dell'utente.
- `Missioni`, `Percorso di studi`, `Trofei` e `Accademia` devono sostenere progressione, appartenenza e ricompensa.
- Biblioteca Classense deve restare il ponte istituzionale reale del progetto.

## Fonti Di Dettaglio

Consultare solo quando serve:
- `docs/wiki/architettura-informativa.md`
- `docs/wiki/frontend-design.md`
- `docs/wiki/backend-strapi.md`
- `docs/wiki/decision-log.md`

Se emergono decisioni nuove o modifiche strutturali, proporre l'aggiornamento di `docs/wiki/decision-log.md` prima di modificare i guardrail.
