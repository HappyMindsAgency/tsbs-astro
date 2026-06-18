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
- In fase di binding, controllare anche i commenti presenti nei file Astro/componenti: possono indicare logiche provvisorie da collegare all'utente loggato o ai dati Strapi.

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

- Liste statiche salvate in file interni del frontend, non modificabili da pannello admin:
  - `src/data/nicknameBlacklist.ts` — nomi di sistema riservati (admin, bot, strapi, ecc.).
  - `src/data/badWords.ts` — parole offensive a due livelli.
- Filtro bad word a due livelli (`containsBadWord`):
  - italiano: molto stringente, match per sottostringa sulla forma compatta (minuscolo, senza accenti, leet-speak normalizzato, sole lettere); una radice copre le varianti flesse.
  - inglese: piu blando, match solo se il nickname o un suo token e esattamente una bad word (evita falsi positivi tipo Scunthorpe).
- In registrazione il nickname e verificato sul blur del campo (prima dell'invio) tramite `POST /api/auth/check-nickname`: formato valido → bad word/nome riservato → unicita su Strapi (`filters[username][$eqi]`, case-insensitive). Durante l'attesa di rete e mostrato un loader inline.
- Unicita: il nickname non puo essere uguale a quello di un altro utente gia iscritto; il controllo e case-insensitive.
- La validazione definitiva resta server-side in `POST /api/auth/register` (blacklist + bad word + unicita gestita da Strapi sullo `username`).
- Il sistema impedisce nickname non appropriati o gia in uso in fase di registrazione.

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

## Schema Operativo

Per la mappa sintetica degli schema Strapi reali consultare:
- [Schema Strapi](./schema-strapi.md)

Per la mappa pagine, pubblica/privata e sorgenti dati previste consultare:
- [Visualizzazione Pagine](./visualizzazione-pagine.md)

## Da Confermare

- slug tecnici delle collection non ancora riallineate; `Missione.slug` risulta presente nello schema aggiornato
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
- [Schema Strapi](./schema-strapi.md)
- [Visualizzazione Pagine](./visualizzazione-pagine.md)
- [Decision Log](./decision-log.md)
- [Gestione logiche Astro e Strapi](./esempio-gestione-logiche-astro-strapi.md)
