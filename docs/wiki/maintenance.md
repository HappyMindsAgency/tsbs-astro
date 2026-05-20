# Maintenance Mode - The Secret Bookish Society

## Scopo

Questo file descrive la logica della maintenance mode della web app.

La maintenance mode serve a mostrare una pagina pubblica di attesa mentre la web app e in costruzione o temporaneamente non accessibile.

## Implementazione Attuale

File coinvolti:
- `src/middleware.ts`
- `src/pages/maintenance.astro`

Il progetto usa Astro con `output: 'server'` e adapter Vercel, quindi il middleware Astro puo intercettare le richieste prima che vengano renderizzate le pagine.

La prima versione usa un interruttore hardcoded nel codice:

```ts
const MAINTENANCE_MODE_ENABLED = true;
```

Quando `MAINTENANCE_MODE_ENABLED` e `true`:
- le pagine pubbliche vengono reindirizzate a `/maintenance`
- `/maintenance` resta accessibile
- `/api` e `/api/*` restano escluse e continuano a funzionare
- il redirect e temporaneo, quindi `302`

Quando `MAINTENANCE_MODE_ENABLED` e `false`:
- il sito torna navigabile normalmente
- `/maintenance` resta comunque raggiungibile direttamente

## Bypass

Il bypass serve a permettere al team di navigare il sito anche quando la maintenance mode e attiva.

Parametro previsto:

```txt
?bypass=tsbs
```

Esempio:

```txt
/maintenance/?bypass=tsbs
```

Quando il bypass e corretto:
- viene impostato un cookie `httpOnly` chiamato `maintenance_bypass`
- il cookie dura 12 ore
- il parametro `bypass` viene rimosso dall'URL
- se il bypass parte da `/maintenance`, l'utente viene mandato alla landing `/landing/`
- finche il cookie e presente, l'utente puo navigare il sito anche con maintenance attiva

Nota:
- essendo `httpOnly`, il cookie non e leggibile da JavaScript tramite `document.cookie`
- il cookie vale per lo stesso host: `127.0.0.1` e `localhost` sono considerati host diversi dal browser

## Evoluzione Con Variabile Ambiente

In futuro l'interruttore puo essere spostato fuori dal codice usando una variabile ambiente Vercel.

Variabile consigliata:

```txt
MAINTENANCE_MODE
```

Flusso desiderato:

```txt
MAINTENANCE_MODE=false
```

Sito normale.

```txt
MAINTENANCE_MODE=true
```

Web app in costruzione / maintenance mode attiva.

In questo modo non sara piu necessario modificare ogni volta questa riga:

```ts
const MAINTENANCE_MODE_ENABLED = false;
```

La modifica iniziale potrebbe diventare:

```ts
const MAINTENANCE_MODE_ENABLED = import.meta.env.MAINTENANCE_MODE === 'true';
```

Da quel momento l'interruttore resta nella dashboard Vercel.

## Nota Su Vercel

Vercel permette di configurare le environment variable dalla dashboard per ambiente:
- Production
- Preview
- Development

Le modifiche alle environment variable non si applicano retroattivamente ai deployment gia esistenti. Valgono solo per i deployment successivi.

Quindi, dopo aver cambiato `MAINTENANCE_MODE` in Vercel, bisogna fare una delle due cose:
- redeploy dalla dashboard Vercel
- pushare un nuovo commit

Flusso operativo:

1. Impostare `MAINTENANCE_MODE=true`
2. Fare redeploy
3. La web app mostra `/maintenance`
4. Impostare `MAINTENANCE_MODE=false`
5. Fare redeploy
6. La web app torna normale

Fonte:
- [Vercel Environment Variables](https://vercel.com/docs/environment-variables)

## Guardrail

- Non usare questa logica per bloccare `/api` o `/api/*`
- Non collegare il bypass a UI pubbliche
- Non salvare segreti reali nel codice
- Non duplicare pagine o contenuti multilingua senza richiesta esplicita
- Mantenere la pagina `/maintenance` semplice, chiara e coerente con il design globale

## Vedi Anche

- [AI Context](./ai-context.md)
- [Decision Log](./decision-log.md)
- [Frontend Design](./frontend-design.md)
