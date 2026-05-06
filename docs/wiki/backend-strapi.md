# Backend Strapi - The Secret Bookish Society

## Scopo

Questo file raccoglie le informazioni backend note e le regole operative per Strapi. Va consultato quando si lavora su API, collection, relazioni, dati, ruoli, validazioni o integrazioni, nella fase di binding.

## Stack

- Strapi / Strapi Cloud
- API consumate dal frontend Astro
- Deploy frontend su Vercel
- SMTP fornito da Biblioteca Classense per email transazionali
- Integrazione WordPress Biblioteca Classense per recupero eventi

## Principi Backend

- Non modificare modelli, collection o relazioni senza conferma.
- Mantenere separati dati funzionali e contenuti narrativi.
- Usare strutture semplici, efficaci e scalabili.
- Non introdurre automazioni non richieste.
- Non inventare campi, stati o flussi non confermati.
- Ogni modifica strutturale deve essere annotata in `docs/wiki/decision-log.md`.

## Collection Customizzate Previste

- Accademia
- Stagione
- Livello

## Collection Operative Previste

- Membro
- Missione
- Libro
- Quiz
- Evento
- Trofeo
- Epistola
- Grimorio

## Entita Di Raccordo Previste

- Categoria Missioni
- Partecipazione Missioni
- Tentativo Lettura
- Trofei Membri
- Categoria Epistole
- Categoria Grimorio

Queste entita servono a collegare le collection principali permettendo di aggiungere dati specifici alle singole relazioni.

## Integrazioni

WordPress Biblioteca Classense:
- unica integrazione esterna prevista
- limitata al recupero degli eventi

SMTP Biblioteca Classense:
- registrazione
- recupero password
- comunicazioni di gioco
- email transazionali

## Utenti E GDPR

- Non e prevista cancellazione automatica degli utenti per inattivita.
- La cancellazione avviene su richiesta, secondo principi GDPR.
- Non introdurre logiche automatiche di eliminazione senza conferma esplicita.

## Nickname

- Blacklist statica di parole offensive.
- Salvata in file interno del frontend.
- Il sistema impedisce nickname non appropriati in fase di registrazione.
- La lista non e modificabile da pannello admin.

## Tessera Biblioteca

La validazione della tessera Biblioteca e manuale.

Flusso previsto:
- l'utente inserisce il numero tessera nel profilo
- il sistema invia una notifica alla redazione
- lo stato utente passa a `In validazione`
- lo staff verifica manualmente
- lo staff assegna da backend il trofeo relativo all'attivazione tessera

## Diagramma Dati

Diagramma interattivo:
- https://dbdiagram.io/d/diagrammaTSBS-699c213cbd82f5fce2803cbd

Nota:
- verificare sempre che il diagramma sia aggiornato prima di usarlo come fonte decisionale.

## Da Confermare

- slug tecnici
- stati ufficiali delle collection
- ruoli e permessi Strapi
- campi obbligatori
- naming tecnico definitivo
- policy API e autenticazione
- per `Missione`, campi o relazioni per distinguere layout dettaglio, tipo prova e tipo esito
- per gli esiti prova, confermare il dato che guidera l'icona di successo variabile per tipologia di prova; l'icona di prova non superata resta unica
- per `Categoria Missioni`, chiarire se serve solo a classificare/filtrare oppure anche a determinare la tipologia visiva della missione

## Vedi Anche

- [Index Wiki](./index.md)
- [Alberatura](./alberatura.md)
- [Architettura Informativa](./architettura-informativa.md)
- [Decision Log](./decision-log.md)
