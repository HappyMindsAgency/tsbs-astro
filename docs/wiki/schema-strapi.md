# Schema Strapi - The Secret Bookish Society

## Scopo

Questo file e una mappa operativa degli schema Strapi reali da usare nella fase di binding Astro-Strapi.

Fonte aggiornata:
- `/Users/viola/Documents/GitHub/strapi-tsbs/src/api/**/schema.json`
- ultimo confronto Missione: `/Users/viola/Downloads/strapi-tsbs-main/src/api/missione/content-types/missione/schema.json`

Regole di lettura:
- non sostituisce gli schema Strapi, li riassume
- non autorizza modifiche a modelli, collection o relazioni
- i campi localizzati vanno richiesti con locale italiano e fallback verso italiano
- `draftAndPublish: true` implica che il frontend deve considerare solo contenuti pubblicati, salvo flussi editoriali esplicitamente diversi
- per dati legati all'utente loggato servono guardie auth e query server-side protette

## Sintesi Binding

| Area | Collection principali | Nota |
| --- | --- | --- |
| Pagine pubbliche editoriali | `landing`, `biblioteca`, `privacy-policy`, `pagina-cookie-policy`, `termini-e-condizioni`, `assistenza`, `faq`, `rendicontazione` | Principalmente single type con contenuto richtext, componenti e SEO. |
| Epistole | `epistola`, `categoria-epistola`, `accademia`, `stagione` | Canale narrativo pubblico con possibili parti riservate lato Astro. |
| Grimorio | `grimorio`, `categoria-grimorio`, `membro`, `accademia` | Area prevalentemente privata; chiarire uso di `visibilePubblico`. |
| Missioni e quiz | `missione`, `quiz`, `categoria-missione`, `partecipazione-missione`, `tentativo-lettura` | Area protetta e progressiva; separare contenuto editoriale da stato utente. |
| Progressione | `membro`, `livello`, `trofeo`, `trofeo-membro`, `stagione` | Dati personali e di gioco; binding da gestire con auth. |
| Eventi | `evento` + integrazione WordPress Classense | Distinguere eventi interni TSBS da eventi recuperati da WordPress. |

Nota richtext:
- usare `src/components/RitchText.astro` in fase di binding quando un campo Strapi contiene Markdown/richtext da renderizzare come HTML
- il contenuto passato a `set:html` deve provenire da una fonte controllata o sanificata
- il nome del file contiene il refuso `RitchText`; se si rinomina in `RichText`, aggiornare anche gli import

## Struttura Client Strapi In Astro

Il binding Strapi in Astro e organizzato in `src/lib/strapi/`.

Struttura attuale:

```txt
src/lib/strapi/
  client.ts
  epistole.ts
  grimorio.ts
  missioni.ts
  trofei.ts
```

`trofei.ts` contiene solo logica del dominio Trofei:
- tipo `TrofeoConquistato` (`nome`, `descrizione`, `punti`, `forma`, `immagineUrl`, `dataOttenimento`)
- risoluzione del Membro loggato via JWT (email + token readonly), come in `missioni.ts`
- query `getTrofeiConquistatiByJwt` sui soli trofei ottenuti dal membro, da `trofei-membro` filtrando su `filters[membri][documentId]`, con `populate` di `trofeo` (`nome`, `descrizione`, `punti`, `forma`, `immagine`)
- utility `resolveStrapiMediaUrl` per URL media assoluti (Strapi Cloud puo restituire URL gia assoluti o relativi)

`client.ts` contiene solo logica generica e riusabile:
- costruzione della base URL Strapi da `STRAPI_API_URL` o `STRAPI_URL`
- normalizzazione del path `/api`
- gestione del token readonly `AUTH_READONLY`
- funzione comune `fetchStrapi`
- gestione errori delle risposte Strapi
- tipo generico `StrapiCollectionResponse<T>`

`epistole.ts` contiene solo logica del dominio Epistole:
- tipi `Epistola`, `EpistolaAccademia`, `EpistolaCategoria`, `EpistolaStagione`
- query `getEpistolaBySlug`
- campi principali del dettaglio: `titolo`, `slug`, `contenuto`
- relazioni predisposte: `accademia`, `categorie_epistola`, `stagioni`

`grimorio.ts` contiene solo logica del dominio Grimorio:
- tipi `GrimorioNota`, `GrimorioCategoria`, `GrimorioAccademia`, `GrimorioMembro`
- query delle note Grimorio filtrate sul `Membro` autenticato
- query del dettaglio nota per `slug`
- campi principali: `titolo`, `slug`, `contenuto`, `visibilePubblico`, `publishedAt`, `locale`
- relazioni predisposte: `categorie_grimorio`, `accademia`, `membro`
- utility di presentazione coerenti con Epistole: estratto testuale e data italiana estesa

`missioni.ts` contiene solo logica del dominio Missioni:
- tipi `Missione`, `MissioneCategoria`, `MissioneQuiz`, `MissioneTrofeo`
- query del dettaglio missione per `slug`
- campi principali: `titolo`, `slug`, `descrizione`, `tipoFruizione`, `opzionale`, `ordine`, `punteggio`, `attiva`
- relazioni predisposte: `categorie_missione`, `libro`, `livello`, `missione_precedente`, `quiz`, `trofeo`, `stagione`

Regola per i prossimi binding:
- ogni area dinamica puo avere un file dedicato quando serve, per esempio `missioni.ts`, `grimorio.ts`, `quiz.ts`
- `client.ts` deve restare generico e non contenere tipi o query di una singola collection
- i file specifici devono contenere tipi, query e mapper della propria area
- in fase di binding Astro vanno predisposti e mappati almeno tutti i campi e le relazioni rilevanti gia presenti nello schema Strapi, anche se in Strapi sono ancora vuoti
- se un campo o una relazione non viene ancora mostrato nella UI, va comunque tipizzato e popolato quando e gia previsto dallo schema e utile alla pagina
- le liste editoriali Strapi devono ordinare i record pubblicati per `publishedAt:desc`, salvo diversa decisione esplicita
- il formato data nelle card lista deve restare quello delle Epistole: giorno numerico, mese lungo, anno numerico in italiano, per esempio `27 maggio 2026`
- la logica `Carica altro` va mantenuta coerente con Epistole: batch responsive 3 mobile, 4 tablet, 5 desktop; il bottone va nascosto quando il numero di card e inferiore/uguale al batch visibile o quando tutte le card sono gia mostrate

Esempio Epistole:
- anche se `accademia`, `categorie_epistola` e `stagioni` sono vuoti in alcune epistole, Astro li richiede gia con `populate` e li espone nel tipo `Epistola`
- la UI del dettaglio al momento usa solo `titolo` e `contenuto`, ma il dato relazionale e gia disponibile per filtri, badge, varianti narrative o logiche future

## Collection E Single Type

### Accademia

- Nome Strapi tecnico: `api::accademia.accademia`
- Tipo: collection type
- Endpoint/collection: `accademie`
- Campi principali: `nome`, `slug`, `descrizione`, `simbolo`
- Campi required: `nome`
- Campi localizzati: `nome`, `slug`, `descrizione`
- Relazioni: `membri`, `grimori`, `epistole`, `libros`
- Media/componenti: `simbolo`
- draftAndPublish: `true`
- Note binding Astro: usare come entita trasversale per pagine accademia, filtri narrativi, epistole, grimori e libri.
- Dubbi aperti: confermare slug pubblici definitivi e relazione visiva con le 4 accademie.

### Assistenza

- Nome Strapi tecnico: `api::assistenza.assistenza`
- Tipo: single type
- Endpoint/collection: `assistenze`
- Campi principali: `contenuto`, `seo`
- Campi required: nessuno
- Campi localizzati: `contenuto`, `seo`
- Relazioni: nessuna
- Media/componenti: `seo-component.seo`
- draftAndPublish: `true`
- Note binding Astro: pagina editoriale pubblica, adatta a fetch statico/server-side.
- Dubbi aperti: confermare route Astro collegata.

### Biblioteca

- Nome Strapi tecnico: `api::biblioteca.biblioteca`
- Tipo: single type
- Endpoint/collection: `biblioteche`
- Campi principali: `intro`, `archivio`, `accademie`
- Campi required: nessuno
- Campi localizzati: `intro`, `archivio`, `accademie`
- Relazioni: nessuna
- Media/componenti: `custom.card`, `custom.card-accademia`
- draftAndPublish: `true`
- Note binding Astro: fonte per contenuti editoriali della sezione Biblioteca e card correlate.
- Dubbi aperti: chiarire se tutte le sottopagine Biblioteca vengono da questo single type o da single type dedicati futuri.

### Categoria Epistola

- Nome Strapi tecnico: `api::categoria-epistola.categoria-epistola`
- Tipo: collection type
- Endpoint/collection: `categorie_epistola`
- Campi principali: `nome`, `slug`
- Campi required: `nome`
- Campi localizzati: `nome`, `slug`
- Relazioni: `epistole`
- draftAndPublish: `true`
- Note binding Astro: usare per filtri, badge o raggruppamenti delle epistole.
- Dubbi aperti: confermare se la categoria impatta solo tassonomia o anche layout/tono.

### Categoria Grimorio

- Nome Strapi tecnico: `api::categoria-grimorio.categoria-grimorio`
- Tipo: collection type
- Endpoint/collection: `categorie_grimorio`
- Campi principali: `nome`, `slug`
- Campi required: `nome`
- Campi localizzati: `nome`, `slug`
- Relazioni: `grimori`
- draftAndPublish: `true`
- Note binding Astro: usare per filtrare o raggruppare voci del grimorio.
- Dubbi aperti: confermare se le categorie sono globali o personalizzate per utente/accademia.

### Categoria Missione

- Nome Strapi tecnico: `api::categoria-missione.categoria-missione`
- Tipo: collection type
- Endpoint/collection: `categorie_missione`
- Campi principali: `nome`
- Campi required: `nome`
- Campi localizzati: `nome`
- Relazioni: `missioni`
- draftAndPublish: `true`
- Note binding Astro: usare per classificare e filtrare missioni.
- Dubbi aperti: gia presente in `backend-strapi.md`: chiarire se determina solo filtro o anche tipologia visiva della missione.

### Epistola

- Nome Strapi tecnico: `api::epistola.epistola`
- Tipo: collection type
- Endpoint/collection: `epistole`
- Campi principali: `titolo`, `slug`, `contenuto`
- Campi required: `titolo`
- Campi localizzati: `titolo`, `slug`, `contenuto`
- Relazioni: `accademia`, `categorie_epistola`, `stagioni`, `livellos`
- draftAndPublish: `true`
- Note binding Astro: prima area consigliata per binding lista/dettaglio; fetch pubblico su contenuti pubblicati. La lista `/epistole/` filtra per Accademia e per livelli sbloccati tramite `livellos`: epistole senza `livellos` sono globali per livello, epistole con `livellos` sono visibili quando almeno un livello collegato e sbloccato dal Membro.
- Dubbi aperti: il dettaglio pagina prevede parti visibili solo a utenti loggati; separare contenuto pubblico da blocchi privati.

### Evento

- Nome Strapi tecnico: `api::evento.evento`
- Tipo: collection type
- Endpoint/collection: `eventi`
- Campi principali: `titolo`, `slug`, `descrizione`, `tipoEvento`, `dataEvento`, `luogo`, `codiceValidazione`
- Campi required: `titolo`
- Campi localizzati: `titolo`, `slug`, `descrizione`, `tipoEvento`, `luogo`, `codiceValidazione`
- Relazioni: `trofeo`, `membri`, `missione`
- draftAndPublish: `true`
- Note binding Astro: distinguere eventi interni TSBS da eventi Biblioteca Classense recuperati via WordPress.
- Dubbi aperti: confermare policy tra eventi Strapi e integrazione WordPress.

### FAQ

- Nome Strapi tecnico: `api::faq.faq`
- Tipo: single type
- Endpoint/collection: `faqs`
- Campi principali: `contenuto`, `faq`
- Campi required: nessuno
- Campi localizzati: `contenuto`, `faq`
- Relazioni: nessuna
- Media/componenti: `custom.faq`
- draftAndPublish: `true`
- Note binding Astro: pagina editoriale pubblica con lista FAQ.
- Dubbi aperti: confermare route Astro collegata.

### Grimorio

- Nome Strapi tecnico: `api::grimorio.grimorio`
- Tipo: collection type
- Endpoint/collection: `grimori`
- Campi principali: `titolo`, `slug`, `contenuto`, `visibilePubblico`
- Campi required: `titolo`, `visibilePubblico`
- Campi localizzati: `titolo`, `slug`, `contenuto`
- Relazioni: `accademia`, `categorie_grimorio`, `membro`
- draftAndPublish: `true`
- Note binding Astro: area privata sotto Scrivania; usare auth per contenuti legati a `membro`. Le liste Grimorio devono usare `status=published`, `sort[0]=publishedAt:desc`, locale italiano Strapi `it-IT`, data in formato esteso come Epistole e logica `Carica altro` con batch 3/4/5. Nelle card lista la meta visibile deve mostrare `Pubblica` se `visibilePubblico` e `true`, `Privata` se `false`; `Categoria Grimorio` resta disponibile per filtri/raggruppamenti ma non sostituisce la label di visibilita. La cancellazione dal dettaglio e ancora da definire: non creare route API o chiamate Strapi di delete finche il flusso non viene approvato.
- Dubbi aperti: chiarire come usare `visibilePubblico`, dato che le route Grimorio risultano private nell'elenco pagine.

### Landing

- Nome Strapi tecnico: `api::landing.landing`
- Tipo: single type
- Endpoint/collection: `landings`
- Campi principali: `header`, `intro`, `cards`, `seo`
- Campi required: nessuno
- Campi localizzati: `header`, `intro`, `cards`, `seo`
- Relazioni: nessuna
- Media/componenti: `custom.header-cta`, `custom.card`, `seo-component.seo`
- draftAndPublish: `true`
- Note binding Astro: fonte naturale per la home pubblica.
- Dubbi aperti: confermare quali blocchi della landing restano statici e quali diventano editoriali.

### Libro

- Nome Strapi tecnico: `api::libro.libro`
- Tipo: collection type
- Endpoint/collection: `libri`
- Campi principali: `titolo`, `autore`, `descrizione`, `annoPubblicazione`, `genere`, `estratto`
- Campi required: `titolo`
- Campi localizzati: `titolo`, `descrizione`, `genere`, `estratto`
- Relazioni: `accademias`, `missioni`, `stagione`, `tentativi_lettura`
- draftAndPublish: `true`
- Note binding Astro: entita di supporto per missioni, stagioni e tentativi lettura.
- Dubbi aperti: confermare se avra pagine pubbliche proprie o solo uso relazionale.

### Livello

- Nome Strapi tecnico: `api::livello.livello`
- Tipo: collection type
- Endpoint/collection: `livelli`
- Campi principali: `nome`, `slug`, `descrizione`, `ordine`, `minMissioniComplete`
- Campi required: `nome`
- Campi localizzati: `nome`, `slug`, `descrizione`
- Relazioni: `stagione`, `membri`, `missioni`
- draftAndPublish: `true`
- Note binding Astro: fonte per progressione, percorso di studi e vincoli missioni. Per la lista `/missioni/`, `ordine` deve essere compilato per ordinare le missioni visibili dal numero piu piccolo al piu grande dentro ogni livello; finche manca l'ordine del livello, il frontend usa un fallback dagli slug noti dei livelli per il filtro e l'ordinamento.
- Dubbi aperti: confermare se il livello utente si calcola o viene assegnato da backend.

### Membro

- Nome Strapi tecnico: `api::membro.membro`
- Tipo: collection type
- Endpoint/collection: `membri`
- Campi principali: `nome`, `cognome`, `email`, `nickname`, `externalAuthId`, `punti`, `tessera`, `attivo`, `datiAggiuntivi`, `password`
- Campi required: nessuno
- Campi localizzati: nessuno
- Relazioni: `accademia`, `eventi`, `grimori`, `livello`, `tentativi_lettura`, `partecipazioni_missione`, `trofei_membro`, `membri_preferiti`, `user`
- draftAndPublish: `true`
- Note binding Astro: dati personali e profilo; usare solo in contesti autenticati o profili pubblici esplicitamente consentiti.
- Dubbi aperti: confermare campo pubblico del profilo, privacy nickname e mapping con `plugin::users-permissions.user`.

### Missione

- Nome Strapi tecnico: `api::missione.missione`
- Tipo: collection type
- Endpoint/collection: `missioni`
- Campi principali: `titolo`, `slug`, `descrizione`, `tipoFruizione`, `opzionale`, `ordine`, `punteggio`, `attiva`
- Campi required: `titolo`
- Campi localizzati: `titolo`, `slug`, `descrizione`
- Relazioni: `categorie_missione`, `eventi`, `libro`, `livello`, `missione_precedente`, `quiz`, `trofeo`, `stagione`, `partecipazioni_missione`
- draftAndPublish: `true`
- Note binding Astro: per lista/dettaglio usare contenuti pubblicati e probabilmente `attiva: true`; la route Astro `missioni/[slugMis]/` puo filtrare su `slug`; stato personale da `partecipazioni_missione`. La lista `/missioni/` mostra missioni dei livelli sbloccati, escludendo il `Test di Smistamento`: per un Membro Livello 1 mostra gia le missioni di Livello 2, dal Livello 2 in poi usa `livello.ordine <= Membro.livello.ordine`.
- Note schema: `slug` e un campo UID localizzato con `targetField: titolo`.
- Dubbi aperti: confermare valori reali di `tipoFruizione`, tipo prova, tipo esito e regole di sblocco.

### Onboarding

- Nome Strapi tecnico: `api::onboarding.onboarding`
- Tipo: single type
- Endpoint/collection: `onboardings`
- Campi principali: `cover`, `disclaimer`, `accademie`, `cta`
- Campi required: nessuno
- Campi localizzati: `cover`, `disclaimer`, `accademie`, `cta`
- Relazioni: nessuna
- Media/componenti: `cover`, `custom.card`, `custom.card-accademia`, `custom.cta`
- draftAndPublish: `true`
- Note binding Astro: fonte per test smistamento/onboarding editoriale.
- Dubbi aperti: confermare confine tra onboarding pubblico e flusso utente privato.

### Cookie Policy

- Nome Strapi tecnico: `api::pagina-cookie-policy.pagina-cookie-policy`
- Tipo: single type
- Endpoint/collection: `pagina_cookie_policies`
- Campi principali: `contenuto`, `seo`
- Campi required: nessuno
- Campi localizzati: `contenuto`, `seo`
- Relazioni: nessuna
- Media/componenti: `seo-component.seo`
- draftAndPublish: `true`
- Note binding Astro: pagina policy pubblica, no auth.
- Dubbi aperti: confermare gestione SEO e aggiornamenti legali.

### Partecipazione Missione

- Nome Strapi tecnico: `api::partecipazione-missione.partecipazione-missione`
- Tipo: collection type
- Endpoint/collection: `partecipazioni_missione`
- Campi principali: `stato`, `progresso`, `dataInizio`, `dataCompletamento`, `datiRuntime`
- Campi required: nessuno
- Campi localizzati: `datiRuntime`
- Relazioni: `membro`, `missione`
- draftAndPublish: `true`
- Note binding Astro: fonte dello stato personale delle missioni; usare solo con auth.
- Dubbi aperti: confermare stati ufficiali, progressi e permessi API.

### Privacy Policy

- Nome Strapi tecnico: `api::privacy-policy.privacy-policy`
- Tipo: single type
- Endpoint/collection: `privacy_policies`
- Campi principali: `contenuto`, `seo`
- Campi required: nessuno
- Campi localizzati: `contenuto`, `seo`
- Relazioni: nessuna
- Media/componenti: `seo-component.seo`
- draftAndPublish: `true`
- Note binding Astro: pagina policy pubblica, no auth.
- Dubbi aperti: confermare gestione SEO e aggiornamenti legali.

### Quiz

- Nome Strapi tecnico: `api::quiz.quiz`
- Tipo: collection type
- Endpoint/collection: `quizzes`
- Campi principali: `titolo`, `descrizione`, `sogliaSuperamento`, `cacciaAlTesoro`, `domande`, `step`
- Campi required: `titolo`
- Campi localizzati: `titolo`, `descrizione`, `domande`, `step`
- Relazioni: `missione`
- Media/componenti: `custom.domanda`, `custom.step`
- draftAndPublish: `true`
- Note binding Astro: va collegato dopo `Missione`; distinguere quiz standard da caccia al tesoro. Per convenzione backend, le domande aperte usano lo stesso componente delle domande a risposta multipla: una sola voce in `domande.risposte` indica risposta libera/attesa, piu voci indicano scelta multipla.
- Dubbi aperti: confermare gestione tentativi, salvataggio risposte, soglia e feedback esito.

### Rendicontazione

- Nome Strapi tecnico: `api::rendicontazione.rendicontazione`
- Tipo: single type
- Endpoint/collection: `rendicontazioni`
- Campi principali: `contenuto`, `seo`
- Campi required: nessuno
- Campi localizzati: `contenuto`, `seo`
- Relazioni: nessuna
- Media/componenti: `seo-component.seo`
- draftAndPublish: `true`
- Note binding Astro: pagina editoriale/istituzionale.
- Dubbi aperti: confermare route Astro collegata.

### Smistamento

- Nome Strapi tecnico: `api::smistamento.smistamento`
- Tipo: single type
- Endpoint/collection: `smistamenti`
- Campi principali: `accademie`
- Campi required: nessuno
- Campi localizzati: `accademie`
- Relazioni: nessuna
- Media/componenti: `custom.card-accademia`
- draftAndPublish: `true`
- Note binding Astro: fonte editoriale per presentazione accademie nel test smistamento.
- Dubbi aperti: confermare se le logiche di calcolo smistamento restano frontend/backend separato.

### Stagione

- Nome Strapi tecnico: `api::stagione.stagione`
- Tipo: collection type
- Endpoint/collection: `stagioni`
- Campi principali: `titolo`, `slug`, `descrizione`, `lore`, `attiva`
- Campi required: `titolo`
- Campi localizzati: `titolo`, `slug`, `descrizione`, `lore`
- Relazioni: `epistola`, `libri`, `livelli`, `missioni`
- draftAndPublish: `true`
- Note binding Astro: puo guidare contenuti attivi, missioni, livelli e lore stagionale.
- Dubbi aperti: confermare regola per una sola stagione attiva.

### Tentativo Lettura

- Nome Strapi tecnico: `api::tentativo-lettura.tentativo-lettura`
- Tipo: collection type
- Endpoint/collection: `tentativi_lettura`
- Campi principali: `dataUltimoTentativo`, `rispostaDomanda`, `storicoTentativi`
- Campi required: nessuno
- Campi localizzati: `storicoTentativi`
- Relazioni: `libro`, `membro`
- draftAndPublish: `true`
- Note binding Astro: dato personale per esperienze di lettura/missione; usare con auth.
- Dubbi aperti: confermare quando viene creato e aggiornato.

### Termini e Condizioni

- Nome Strapi tecnico: `api::termini-e-condizioni.termini-e-condizioni`
- Tipo: single type
- Endpoint/collection: `termini_e_condizionis`
- Campi principali: `contenuto`, `seo`
- Campi required: nessuno
- Campi localizzati: `contenuto`
- Relazioni: nessuna
- Media/componenti: `seo-component.seo`
- draftAndPublish: `true`
- Note binding Astro: pagina policy pubblica, no auth.
- Dubbi aperti: endpoint plurale generato da Strapi da verificare in API prima del binding.

### Trofeo

- Nome Strapi tecnico: `api::trofeo.trofeo`
- Tipo: collection type
- Endpoint/collection: `trofei`
- Campi principali: `nome`, `descrizione`, `punti`, `forma`, `immagine`
- Campi required: `nome`
- Campi localizzati: `nome`, `descrizione`
- Relazioni: `eventi`, `missioni`, `trofei_membro`
- Media/componenti: `immagine`
- draftAndPublish: `true`
- Note schema: `forma` e una enumeration non localizzata (`default: "punto"`) con valori `punto`, `barraOrizzontale`, `barraVerticale`, `quadrato`, `elle`, `coppa`; guida la silhouette "Tetris" del trofeo nella Stanza Trofei. Le matrici 2D corrispondenti restano nel frontend (`SHAPES` in `scrivania/trofei.astro`); l'admin sceglie solo la forma dal menu.
- Note binding Astro: fonte per catalogo trofei e premi di missioni/eventi. La Stanza Trofei usa `immagine` come visual e `forma` per la geometria.
- Dubbi aperti: confermare differenza tra trofeo disponibile e trofeo ottenuto.

### Trofeo Membro

- Nome Strapi tecnico: `api::trofeo-membro.trofeo-membro`
- Tipo: collection type
- Endpoint/collection: `trofei_membro`
- Campi principali: `dataOttenimento`
- Campi required: nessuno
- Campi localizzati: nessuno
- Relazioni: `membri`, `trofeo`
- draftAndPublish: `true`
- Note binding Astro: raccordo tra membro e trofei ottenuti; usare con auth per Scrivania/Stanza Trofei.
- Dubbi aperti: confermare relazione many-to-many con membri e permessi di lettura.

## Componenti Richiamati

Componenti rilevanti emersi dagli schema:
- `custom.card`
- `custom.card-accademia`
- `custom.cta`
- `custom.domanda`
- `custom.faq`
- `custom.header-cta`
- `custom.risposta`
- `custom.step`
- `seo-component.seo`

Nota:
- prima del binding di pagine ricche o quiz, consultare anche gli schema componenti in `/Users/viola/Documents/GitHub/strapi-tsbs/src/components/**`.

## Dubbi Trasversali

- Confermare URL API effettivi e permessi public/authenticated in Strapi.
- Confermare policy di autenticazione tra Astro e Strapi.
- Confermare naming tecnico definitivo degli endpoint, soprattutto single type con plurali generati.
- Confermare regole per contenuti pubblici/privati: pagina pubblica non significa necessariamente dato non personalizzato.
- Confermare uso di `locale` e fallback italiano per tutte le query.
- Confermare se `draftAndPublish` e campi boolean come `attiva`/`visibilePubblico` devono essere combinati nelle query.

## Vedi Anche

- [Backend Strapi](./backend-strapi.md)
- [Visualizzazione Pagine](./visualizzazione-pagine.md)
- [Alberatura](./alberatura.md)
- [Decision Log](./decision-log.md)
- [Gestione logiche Astro e Strapi](./esempio-gestione-logiche-astro-strapi.md)
