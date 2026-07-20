# Proposta - Disabilitare draftAndPublish + i18n sui dati di gioco/personali (Strapi)

Stato: **proposta** (da approvare prima di toccare Strapi). La cartella `strapi-tsbs` è read-only: questa è la specifica, non applicata.

## Problema (verificato a runtime su prod, luglio 2026)

Le collection di dato personale/di gioco hanno **sia `draftAndPublish: true` sia `pluginOptions.i18n.localized: true`**:
- `trofeo-membro`
- `partecipazione-missione`
- `tentativo-lettura`
- `membro`

Sono **stato utente, non contenuto editoriale**: non hanno motivo né di essere localizzate né di avere un ciclo bozza/pubblicato. Questa doppia configurazione causa il bug per cui, al completamento di una missione, **il trofeo non compare nella Stanza Trofei** (e le partecipazioni non si aggiornano in modo affidabile).

### Prove raccolte su prod (account di test `cecio.bat`, istanza Vercel + Strapi onrender)
- Le scritture **raggiungono Strapi** (es. `Membro.punti` cambia): NON è un problema di token, permessi, env var o cold-start.
- Completando una prova, l'API risponde `success` con `trofeiSbloccati` e punti, **ma non viene creato alcun `trofeo-membro`** (0 record, né draft né published) e la **partecipazione sparisce** dalle letture (sia `status=draft` sia published).
- Il `Membro` esiste come **più versioni** (stesso `documentId`, `id` numerico diverso: 1712 → 1715 → 1608 a ogni scrittura): è il churn draft/published di Strapi v5.
- Diagnosi: gli **scalari** (es. `punti`) atterrano e si leggono; le **relazioni** (`partecipazione↔membro`, `trofeo-membro↔membri`) finiscono su una versione/stato che le read filtrate dell'app (`status=draft`, filtro per `documentId`) non trovano → spariscono. Il modale trofeo appare perché i suoi dati sono in-memory dal fetch missione, non da `trofeo-membro`.

### Perché non era locale né permessi (piste già escluse)
- Token `AUTH_READONLY` ha CRUD su tutte e tre le collection (probe: payload invalido → 400, non 403).
- I record nascono `it-IT` (default prod) e la locale in lettura combacia; `locale=all` combinato coi filtri torna vuoto (quirk di query, fuorviante).
- Il fix retry+timeout tentato lato Astro NON risolve e va rimosso: su scritture non idempotenti (punti = read-modify-write) un retry su risposta lenta rischia di **contare più volte**.

## Decisione proposta

Su `trofeo-membro`, `partecipazione-missione`, `tentativo-lettura`, `membro` impostare:
- `options.draftAndPublish: false`
- `pluginOptions.i18n.localized: false`

Un solo record per entità, senza versione bozza/pubblicato né locale da sbagliare: le relazioni e le read tornano coerenti.

**Resta invariato** ciò che è editoriale (va tradotto e ha ciclo redazionale): `trofeo` (catalogo), `missione`, `epistola`, `accademia`, `livello`, `grimorio`, ecc. — nessuna modifica.

## Modifiche schema (esatte)

Per ciascuno dei 4 `schema.json`:

1. `strapi-tsbs/src/api/trofeo-membro/content-types/trofeo-membro/schema.json`
   - `options.draftAndPublish`: `true` → `false`
   - `pluginOptions.i18n.localized`: `true` → `false`

2. `strapi-tsbs/src/api/partecipazione-missione/content-types/partecipazione-missione/schema.json`
   - `options.draftAndPublish`: `true` → `false`
   - `pluginOptions.i18n.localized`: `true` → `false`
   - `attributes.datiRuntime.pluginOptions.i18n.localized`: `true` → `false`

3. `strapi-tsbs/src/api/tentativo-lettura/content-types/tentativo-lettura/schema.json`
   - `options.draftAndPublish`: `true` → `false`
   - `pluginOptions.i18n.localized`: `true` → `false`
   - `attributes.storicoTentativi.pluginOptions.i18n.localized`: `true` → `false`

4. `strapi-tsbs/src/api/membro/content-types/membro/schema.json`
   - `options.draftAndPublish`: `true` → `false`
   - `pluginOptions.i18n.localized`: `true` → `false`

## Impatto lato Astro (dopo la modifica Strapi)

- **Rimuovere `status=draft`** da tutte le query su queste collection (`progressione.ts`, `trofei.ts`, `sfida-lettura.ts`, `dati-aggiuntivi.ts`, ecc.): senza d&p non esiste più lo stato bozza, i record sono unici.
- Le scritture (POST/PUT) restano uguali ma non serve più gestire pubblicazione/versioni.
- Nessun `locale` da passare (collection non più localizzate).

## RISCHIO principale — migrazione dati esistenti (leggere prima)

Disattivare `draftAndPublish` e `i18n` su collection con dati esistenti è **potenzialmente distruttivo**:
- disattivando i18n Strapi tiene la locale **default** (it-IT su prod) e scarta le altre;
- disattivando draftAndPublish Strapi collassa draft/published in un unico record: va deciso quale versione sopravvive (tipicamente la published, ma i dati di gioco dell'app vivono in `draft`).

I dati "buoni" potrebbero essere nella versione draft: se la migrazione tiene la published, si **perdono trofei/partecipazioni/punti**.

### Procedura sicura (ordine obbligato)
1. **Backup/snapshot DB** (Strapi Cloud/Render) prima di tutto.
2. **Censire** per ogni collection quante entry ci sono per stato (draft/published) e locale, e quale versione contiene i dati reali usati dall'app (l'app legge `status=draft`).
3. **Riconciliare** prima di disattivare: assicurarsi che la versione che sopravvive (dopo il collasso d&p e la scelta della default locale) sia quella con i dati corretti; migrare se necessario.
4. **Applicare la modifica schema** (deploy Strapi) + rimuovere `status=draft` lato Astro nello stesso rilascio coordinato.
5. **Verifica end-to-end**: completare una missione → trofeo-membro creato e visibile in Stanza Trofei; partecipazione aggiornata; punti coerenti (una volta sola).

### Rollback
Ripristinare i 4 schema e il codice Astro (rimettere `status=draft`), ridistribuire. Valutare lo snapshot del passo 1 se il passo 3 ha migrato dati.

## Impatto riepilogo
- Strapi: 4 `schema.json` (`options.draftAndPublish` + `pluginOptions.i18n`), + migrazione dati.
- Astro: rimozione `status=draft` dalle query sulle 4 collection; revert del wrapper retry (fatto).
- Wiki: aggiornare `docs/wiki/schema-strapi.md` e registrare in `docs/wiki/decision-log.md` all'approvazione.

## Vedi Anche

- [Schema Strapi](./schema-strapi.md)
- [Decision Log](./decision-log.md)
