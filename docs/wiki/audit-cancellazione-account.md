# Audit - Cancellazione Account (Astro vs Strapi)

## Scopo

Registro dell'analisi (sola lettura, nessuna modifica al codice) su cosa avviene quando un account utente viene eliminato dai due percorsi possibili:
- lato **Astro** (web app), endpoint `src/pages/api/user/delete-account.ts`
- lato **Strapi** (pannello admin Redazione o DELETE via API)

Data analisi: 2026-07-20. Da rivedere insieme prima di applicare fix.

## Fatti Verificati

- Il cleanup a cascata dei figli del Membro vive **solo** nel lifecycle del `Membro` (`strapi-tsbs/src/api/membro/content-types/membro/lifecycles.ts:245-308`, hook `beforeDelete`/`beforeDeleteMany`).
- Nessun lifecycle su `User` (users-permissions): `strapi-tsbs/src/index.ts` vuoto, nessun `strapi-server.*` nelle extensions.
- Nessun `onDelete`/cascade configurato negli `schema.json`. L'unica cascata reale è quella scritta a mano nel lifecycle del Membro.
- Il flusso Astro cancella **prima il Membro** (`delete-account.ts:46`), quindi il lifecycle pulisce i figli; poi cancella lo `User` (`delete-account.ts:61`); infine pulisce il cookie `jwt` (`delete-account.ts:75`).
- Lifecycle Membro `cleanupFigliMembro` (`lifecycles.ts:245-279`): `deleteMany` su `grimorio`, `tentativo-lettura`, `partecipazione-missione`; prune dei `trofeo-membro` che resterebbero orfani (manyToMany). NON tocca `user`, `eventi`, `membri_preferiti`.

## Confronto Processi

| Entità | Astro (`delete-account`) | Strapi admin: delete Membro | Strapi admin: delete User |
| --- | --- | --- | --- |
| grimori / tentativi / partecipazioni | cancellati (lifecycle) | cancellati (lifecycle) | restano orfani |
| trofei-membro orfani | prune (lifecycle) | prune (lifecycle) | restano |
| Membro | cancellato | cancellato | resta orfano |
| User (auth) | cancellato | resta orfano | cancellato |
| cookie / sessione | pulito (solo su successo pieno) | — | — |

Radice: il processo di cancellazione completo e coerente esiste solo nel flusso Astro (membro → user, che sfrutta il lifecycle). Il pannello admin Strapi non lo replica: chi elimina solo un lato lascia orfani.

## Bug Identificati (ranked)

1. **[ALTO - GDPR] Delete User da Strapi → Membro + tutti i figli orfani.**
   Nessun hook su User. Sopravvivono Membro (nome, cognome, email — `membro/schema.json:18-42`), grimori, tentativi, partecipazioni, trofei. Dati personali non cancellati. Caso peggiore.

2. **[MEDIO] Delete Membro da Strapi → User orfano.**
   Scelta esplicita (`lifecycles.ts:242`). L'account resta: può loggarsi, JWT valido, ma senza Membro → frontend rotto. Email/username sopravvivono.

3. **[MEDIO] Astro non atomico → user orfano + sessione viva.**
   `delete-account.ts`: Membro cancellato (`:46`); se `DELETE user` fallisce (`:66-70`) esce 500 prima di pulire il cookie (`:75`). User senza membro + cookie `jwt` ancora attivo. Nessun rollback.

4. **[MEDIO] Astro cerca Membro per email + `status=draft`.**
   `delete-account.ts:30-33` filtra `filters[email][$eq]` e `status=draft`, non la relazione `user`. Se `membro.email` diverge da `user.email` (o membro solo published) → membro non trovato, salta la delete membro (`:45`) ma cancella comunque lo user (`:61`) → Membro + figli orfani. Meglio via relazione `user`.

5. **[BASSO] Token `AUTH_READONLY` usato per DELETE.**
   `delete-account.ts:9,20` — const `STRAPI_API = AUTH_READONLY` usata come Bearer per DELETE membri/utenti. Nome fuorviante o privilegi oltre "readonly". Verificare i permessi reali.

6. **[BASSO] Cookie `tsbs_welcome_pending` mai eliminato al delete** (`register.ts:137` lo setta, `delete-account.ts:75` pulisce solo `jwt`).

Nota minore: `membri_preferiti` (self-relation) non pulita esplicitamente in nessun percorso — si affida al disconnect di default di Strapi.

## Direzione Fix (da concordare)

- Bug 3, 4, 5, 6: risolvibili lato Astro.
- Bug 1, 2: richiedono un lifecycle su `User` lato **Strapi** → da concordare prima (cartella Strapi read-only).

## Vedi Anche

- [Backend Strapi](./backend-strapi.md)
- [Schema Strapi](./schema-strapi.md)
- [Decision Log](./decision-log.md)
