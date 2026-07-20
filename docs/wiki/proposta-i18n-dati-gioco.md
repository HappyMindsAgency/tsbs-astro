# Proposta - Disattivare i18n sui dati di gioco/personali (Strapi)

Stato: **proposta** (da approvare prima di toccare Strapi). La cartella `strapi-tsbs` è read-only: questa è solo la specifica della modifica, non applicata.

## Problema

I content-type di dato personale/di gioco hanno `pluginOptions.i18n.localized: true`:
- `trofeo-membro`
- `partecipazione-missione`
- `tentativo-lettura`
- `membro`

Su un type localizzato Strapi v5:
- POST senza `locale` → record creato nella locale **default** dell'ambiente (dev `en`, prod `it`);
- GET senza `locale` → ritorna **solo** la locale default.

Il binding Astro `trofeo-membro` (e sorelle) non passa mai `locale`. Risultato: la Stanza Trofei (`src/pages/scrivania/trofei.astro` → `src/lib/strapi/trofei.ts`) legge un insieme vuoto quando la locale di creazione del record ≠ locale default di lettura, o quando il `Trofeo` collegato non esiste nella locale letta (`normalizeTrofeoConquistato` scarta il record, `trofei.ts:108-109`). Il modale di sblocco continua a funzionare perché i suoi dati arrivano in memoria dal fetch missione (`missioni.ts:206`, `locale=it-IT`), non da `trofeo-membro`.

Vizi latenti collegati:
- `partecipazione-missione.datiRuntime` e `tentativo-lettura.storicoTentativi` sono `localized: true` a livello di campo: dati di runtime personali, non traducibili.
- `membro.email` / `nickname` / `tessera` sono `unique` con i18n attivo → unicità applicata **per-locale** (stessa email possibile in `en` e `it`).

## Decisione proposta

Impostare `localized: false` a livello di content-type sui 4 type sopra. Sono dati utente/gioco, non contenuto editoriale: non hanno motivo di essere localizzati. Un solo record per entità, locale irrilevante, sempre restituito.

**Resta invariato** ciò che è editoriale e va tradotto: `trofeo` (catalogo: `nome`, `descrizione`), `missione`, `epistola`, `accademia`, `livello`, `grimorio`, ecc. — nessuna modifica.

## Modifiche schema (esatte)

Solo il blocco `pluginOptions.i18n.localized`. In ogni file, da `true` a `false`.

1. `strapi-tsbs/src/api/trofeo-membro/content-types/trofeo-membro/schema.json`
   - `pluginOptions.i18n.localized`: `true` → `false`

2. `strapi-tsbs/src/api/partecipazione-missione/content-types/partecipazione-missione/schema.json`
   - `pluginOptions.i18n.localized`: `true` → `false`
   - `attributes.datiRuntime.pluginOptions.i18n.localized`: `true` → `false`

3. `strapi-tsbs/src/api/tentativo-lettura/content-types/tentativo-lettura/schema.json`
   - `pluginOptions.i18n.localized`: `true` → `false`
   - `attributes.storicoTentativi.pluginOptions.i18n.localized`: `true` → `false`

4. `strapi-tsbs/src/api/membro/content-types/membro/schema.json`
   - `pluginOptions.i18n.localized`: `true` → `false`

Esempio (trofeo-membro):

```json
"pluginOptions": {
  "i18n": {
    "localized": false
  }
}
```

## RISCHIO principale — migrazione dati esistenti (leggere prima)

Disattivare i18n su un type che ha già dati è **potenzialmente distruttivo**: Strapi tiene le entry della locale **default** e scarta/rende inaccessibili quelle nelle altre locali.

Se in prod esistono record di gioco creati in `en` (esattamente lo scenario del bug) e il default è `it`, disattivando i18n si **perde il progresso** di quei membri (trofei, partecipazioni, tentativi).

### Procedura sicura (ordine obbligato)

1. **Backup/snapshot DB** (Strapi Cloud) prima di tutto.
2. **Censire le locali reali** per i 4 collection, in ogni ambiente: `GET /api/<coll>?locale=all&pagination[pageSize]=1&status=draft` e contare per locale (o dal pannello admin, selettore locale). Verificare anche qual è la locale **default** effettiva dell'ambiente (Settings → Internationalization).
3. **Riconciliare prima di disattivare:**
   - se i dati vivono in una locale ≠ default → o si sposta il dato nella locale default, o si allinea la default alla locale dei dati, PRIMA del passo 4;
   - obiettivo: tutti i record di gioco nella locale che resterà dopo la disattivazione.
4. **Applicare la modifica schema** (deploy codice Strapi).
5. **Verifica post-deploy:** conteggi record invariati; Stanza Trofei mostra i trofei; una prova missione completata assegna e mostra il trofeo in pagina.

### Rollback

Ripristinare `localized: true` nei 4 schema e ridistribuire. I record creati nel frattempo restano nella locale default. Se il passo 3 ha spostato dati, valutare lo snapshot del passo 1.

## Follow-up lato Astro (dopo la modifica Strapi, task separato)

Piccolo, solo Astro:
- `src/lib/strapi/trofei.ts` (`getTrofeiConquistatiByMembro`): popolare `trofeo` con `locale` esplicito (`it-IT` / lang), così il catalogo localizzato risolve `nome`/`descrizione`/`immagine` nella lingua giusta invece di affidarsi alla default. Rimuovere il commento fuorviante a `trofei.ts:125`.
- Verificare che `progressione.ts` e le altre scritture di gioco (ora su type non localizzato) restino corrette senza `locale`: sì, un solo record.

Nessun'altra modifica necessaria: letture/scritture senza `locale` colpiscono naturalmente l'unico record.

## Impatto

- Strapi: 4 `schema.json` (solo `pluginOptions.i18n`), + migrazione dati.
- Astro: follow-up minore in `src/lib/strapi/trofei.ts`.
- Wiki: aggiornare `docs/wiki/schema-strapi.md` (i 4 type non più localizzati) e registrare in `docs/wiki/decision-log.md` alla approvazione.

## Vedi Anche

- [Schema Strapi](./schema-strapi.md)
- [Decision Log](./decision-log.md)
