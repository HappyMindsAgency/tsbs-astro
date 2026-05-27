# Visualizzazione Pagine - The Secret Bookish Society

## Scopo

Questo file trasforma l'elenco pagine in una mappa operativa per il binding Astro-Strapi.

Fonte:
- `/Users/viola/.Trash/TSBS - Elenco pagine .xlsx`

Nota:
- la colonna `Indicizzazione` e riportata solo come dato informativo, non come task attivo.
- la colonna `Pubblica/privata` serve gia ora per decidere fetch dati, guardie auth e rendering.

## Legenda

- Pubblica/privata: valore riportato dall'Excel.
- Area funzionale: classificazione operativa per organizzare il binding.
- Sorgente dati prevista: ipotesi coerente con schema Strapi e architettura corrente.
- Stato binding: etichetta di lavoro per decidere come procedere, non stato tecnico verificato riga per riga.

## Elenco Pagine

| Pagina / visualizzazione | Route | Pubblica/privata | Indicizzazione | Area funzionale | Sorgente dati prevista | Stato binding | Note |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Onboarding | `/` | Pubblica | Si | Landing / onboarding | Strapi `landing` + eventuale `onboarding` | Strapi | Landing page che rispondera al dominio principale. |
| Login | `/login` | Pubblica | No | Auth | Auth Strapi / users-permissions | Da confermare | Pagina pubblica, ma legata a flusso autenticazione. |
| Registrazione | `/registrazione` | Pubblica | No | Auth | Auth Strapi / `membro` | Da confermare | Creazione utente/membro da definire con flusso backend. |
| Thank you registrazione | `/registrazione-completata` | Privata | No | Auth / onboarding | Stato registrazione + link test smistamento | Da confermare | Pulsante verso test di smistamento. Chiarire se davvero privata o solo non indicizzata. |
| Test smistamento | `/test-smistamento` | Privata | No | Smistamento | Strapi `smistamento` + logica frontend/backend | Da confermare | Chiarire se accessibile solo dopo registrazione. |
| Test smistamento / Welcome accademia | `/test-smistamento/benvenuto-accademia-[nome-accademia]` | Privata | No | Smistamento | Strapi `accademia` / risultato smistamento | Da confermare | Route risultato per accademia. |
| Test smistamento / Scegli avatar | `/test-smistamento/scegli-avatar` | Privata | No | Smistamento / profilo | Stato utente + scelta avatar | Da confermare | Collegata a onboarding utente. |
| Atrio | `/atrio` | Privata | No | Hub privato | Strapi `membro`, `missione`, `epistola`, progressione | Mock | Dashboard narrativa personale. |
| Profilo | `/profilo` | Privata | No | Profilo | Strapi `membro` | Mock | Area personale. |
| Profilo / dettaglio profilo | `/profilo/[nickname]` | Pubblica | No | Profilo pubblico | Strapi `membro` | Da confermare | Da fare dinamicamente con Strapi; chiarire dati esposti pubblicamente. |
| Profilo / Modifica impostazioni | `/profilo/impostazioni` | Privata | No | Profilo / impostazioni | Strapi `membro` + auth | Da confermare | Pagina modifica impostazioni e info profilo. |
| Epistole | `/epistole` | Pubblica | No | Epistole | Strapi `epistola`, `categoria-epistola`, `accademia` | Strapi | Prima area consigliata per binding. |
| Epistole / Dettaglio epistola | `/epistole/:slug` | Pubblica | No | Epistole | Strapi `epistola` | Strapi | Alcune parti del layout saranno visibili solo agli utenti loggati. |
| Scrivania | `/scrivania` | Privata | No | Scrivania | Strapi `membro`, progressione, riepiloghi | Mock | Spazio personale utente. |
| Scrivania / Stanza Trofei | `/scrivania/trofei` | Privata | No | Trofei | Strapi `trofeo`, `trofeo-membro`, `membro` | Mock | Richiede auth e dati utente. |
| Scrivania / Grimorio | `/scrivania/grimorio` | Privata | No | Grimorio | Strapi `grimorio`, `categoria-grimorio`, `membro` | Strapi | Da chiarire uso di `visibilePubblico`. |
| Scrivania / Grimorio / Dettaglio grimorio | `/scrivania/grimorio/:slug` | Privata | No | Grimorio | Strapi `grimorio` + auth membro | Strapi | Dettaglio privato legato al membro o a regole di visibilita. |
| Missioni | `/missioni` | Privata | No | Missioni | Strapi `missione`, `categoria-missione`, `partecipazione-missione` | Strapi | Lista missioni con stato utente. |
| Missioni / Dettaglio missione | `/missioni/:slug` | Privata | No | Missioni | Strapi `missione` + relazioni | Strapi | Dettaglio missione, probabilmente con progressione utente. |
| Missioni / Quiz missione | `/missioni/:slug/prova` | Privata | No | Missioni / quiz | Strapi `quiz`, `missione`, `partecipazione-missione` | Strapi | Route prova distinta dal dettaglio missione. |
| Accademia | `/sala-accademia-[nome-accademia]` | Privata | No | Accademia privata | Strapi `accademia`, `membro`, classifiche | Mock | Route da confrontare con alberatura aggiornata. |
| Accademia / Classifica generale | `/classifica-generale` | Privata | No | Classifiche | Strapi `membro`, `accademia`, punteggi | Mock | Route da confrontare con decision log: esiste decisione su `/sala-accademia/classifica-generale/`. |
| Accademia / Dettaglio Accademia | `/accademia-[nome-accademia]` | Pubblica | Si | Accademia pubblica | Strapi `accademia`, `libro`, contenuti editoriali | Strapi | Pagina pubblica per singola accademia. |
| Eventi | `/eventi-biblioteca-classense/` | Pubblica | Si | Eventi Classense | WordPress Biblioteca Classense | Da confermare | Gli eventi presi dal sito Classense si apriranno nel sito Classense. |
| Eventi / Dettaglio evento | `/eventi/:slug` | Pubblica | Si | Eventi TSBS | Strapi `evento` | Strapi | Eventi caricati direttamente in piattaforma, es. reading party. |
| Biblioteca | `/biblioteca` | Pubblica | No | Biblioteca | Strapi `biblioteca` | Strapi | Pagina editoriale pubblica. |
| Biblioteca / La societa segreta | `/biblioteca/the-secret-bookish-society` | Pubblica | Si | Biblioteca | Strapi `biblioteca` o contenuto dedicato | Da confermare | Chiarire se deriva da single type `biblioteca` o contenuto statico. |
| Biblioteca / Le accademie | `/biblioteca/accademie` | Pubblica | Si | Biblioteca / accademie | Strapi `accademia`, `biblioteca` | Strapi | Possibile uso di card accademia. |
| Biblioteca / La Biblioteca Classense | `/biblioteca/classense` | Pubblica | Si | Biblioteca / istituzionale | Strapi `biblioteca` o contenuto statico | Da confermare | Chiarire sorgente editoriale. |
| Biblioteca / Pagine istituzionali | `/biblioteca/pagine-istituzionali` | Pubblica | Si | Biblioteca / istituzionale | Strapi policy/single type | Da confermare | Hub o pagina editoriale da confermare. |
| Policy / Privacy | `/privacy-policy` | Pubblica | No | Policy | Strapi `privacy-policy` | Strapi | Pagina legale pubblica. |
| Policy / Cookie | `/cookie-policy` | Pubblica | No | Policy | Strapi `pagina-cookie-policy` | Strapi | Pagina legale pubblica. |
| Policy / Termini e condizioni d'uso | `/termini-e-condizioni` | Pubblica | No | Policy | Strapi `termini-e-condizioni` | Strapi | Pagina legale pubblica. |
| Pagina 404 | `/404` | Pubblica | Non indicato | Sistema | Astro/statico | Statico | Pagina tecnica pubblica. |

## Note Per Binding

- Le pagine private devono passare da guardie auth prima di leggere dati personali.
- Le pagine pubbliche possono comunque avere blocchi privati opzionali, come il dettaglio epistola.
- Indicizzazione e visibilita pubblica non sono la stessa cosa: una pagina puo essere pubblica ma non indicizzata.
- Per le pagine Strapi pubbliche usare contenuti pubblicati e locale italiano.
- Per le pagine private separare sempre:
  - contenuto editoriale generale
  - stato dell'utente loggato
  - azioni che modificano dati

## Dubbi Aperti

- Confermare se le pagine di test smistamento sono realmente private o solo non indicizzate.
- Confermare quali dati del profilo pubblico `/profilo/[nickname]` possono essere esposti.
- Confermare coerenza route Accademia/Classifica con il decision log aggiornato.
- Confermare se le sottopagine Biblioteca hanno single type dedicati o derivano da `biblioteca`.
- Confermare uso di `visibilePubblico` per Grimorio.

## Vedi Anche

- [Schema Strapi](./schema-strapi.md)
- [Backend Strapi](./backend-strapi.md)
- [Alberatura](./alberatura.md)
- [Decision Log](./decision-log.md)
