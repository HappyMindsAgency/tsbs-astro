# Esempio Gestione Logiche Astro Strapi

## Scopo

Questo file spiega, con esempi pratici, come dividere le responsabilita tra Astro e Strapi quando una pagina contiene sia contenuti pubblici sia blocchi o azioni private.

Caso guida:
- pagina pubblica: dettaglio epistola
- route: `/epistole/:slug`
- contenuto principale pubblico
- blocchi aggiuntivi visibili solo a utenti loggati

## Principio Base

Strapi è il cancello dei dati:
- quali dati esistono
- quali collection sono pubbliche o protette
- quali campi/relazioni può leggere un utente anonimo
- quali dati richiedono autenticazione
- eventuali permessi per ruolo: public, authenticated, admin

Astro è la pagina che decide:
- quali dati esistono
- quali collection sono pubbliche o protette
- quali campi/relazioni può leggere un utente anonimo
- quali dati richiedono autenticazione
- eventuali permessi per ruolo: public, authenticated, admin


La protezione dei dati personali non deve dipendere solo da Astro. Se un dato e privato, anche Strapi deve impedirne la lettura a utenti non autorizzati.

## Esempio Epistola Pubblica Con Blocchi Privati

Pagina:
- `/epistole/la-chiamata-del-corvo`

Contenuto pubblico:
- titolo epistola
- slug
- contenuto principale
- categoria
- accademia collegata

Contenuto o azioni private:
- stato personale, per esempio letta/non letta
- azione "segna come letta"
- nota riservata all'utente o alla sua accademia
- missione collegata sbloccata per quell'utente
- ricompensa o avanzamento personale

## Flusso Consigliato

1. Astro riceve lo `slug` dalla route.
2. Astro chiede a Strapi il contenuto pubblico dell'epistola.
3. Strapi restituisce solo epistole pubblicate e leggibili pubblicamente.
4. Astro controlla se esiste una sessione utente.
5. Se non c'e sessione, Astro renderizza solo la pagina pubblica.
6. Se c'e sessione, Astro fa una seconda richiesta protetta per dati personali o blocchi riservati.
7. Strapi verifica token, ruolo e permessi.
8. Astro renderizza anche i blocchi privati ricevuti.

## Divisione Responsabilita

| Cosa | Strapi | Astro |
| --- | --- | --- |
| Epistola pubblicata | Espone il contenuto pubblico | Lo richiede e lo mostra a tutti |
| Dati personali utente | Li protegge tramite auth e permessi | Li richiede solo se l'utente e loggato |
| Stato lettura epistola | Verifica che appartenga al membro corretto | Mostra "letta/non letta" |
| Azione segna come letta | Accetta solo richieste autorizzate | Mostra il pulsante e invia l'azione |
| Utente non loggato | Non espone dati privati | Mostra variante pubblica o CTA login |
| Pagina inesistente/non pubblicata | Non restituisce contenuto | Mostra 404 o fallback previsto |

## Pseudocodice Astro

Questo non e codice definitivo, ma una traccia logica.

```ts
const epistola = await getEpistolaPubblicaBySlug(slug, {
  locale: "it",
});

if (!epistola) {
  return Astro.redirect("/404");
}

const sessione = await getSessioneUtente(Astro);

let datiPrivati = null;

if (sessione) {
  datiPrivati = await getDatiEpistolaPerMembro({
    slug,
    token: sessione.token,
  });
}
```

Nel template:

```astro
<EpistolaLayout epistola={epistola}>
  {datiPrivati ? (
    <BloccoEpistolaPrivato dati={datiPrivati} />
  ) : (
    <BloccoLoginEpistola />
  )}
</EpistolaLayout>
```

## Cosa Non Fare

- Non leggere dati personali prima di controllare la sessione.
- Non mostrare o nascondere dati privati solo via CSS.
- Non mettere nel payload pubblico informazioni che poi vengono nascoste in pagina.
- Non fidarsi solo del frontend per impedire accessi non autorizzati.
- Non mischiare nello stesso oggetto dati pubblici editoriali e dati personali dell'utente senza una ragione chiara.

## Applicazione Alle Pagine Private

Per una pagina totalmente privata, per esempio `/scrivania/grimorio`, il flusso cambia:

1. Astro controlla subito la sessione.
2. Se non c'e sessione, redirect a `/login`.
3. Solo dopo il controllo Astro chiede a Strapi i dati personali.
4. Strapi verifica che il token possa leggere quei dati.
5. Astro renderizza la pagina privata.

Quindi:
- pagina pubblica con blocchi privati: prima contenuto pubblico, poi eventuale contenuto privato
- pagina privata: prima auth, poi qualsiasi dato

## Note Per Il Binding

- Le query pubbliche e private dovrebbero essere funzioni separate.
- I mapper Astro dovrebbero distinguere dati editoriali e dati utente.
- I componenti dovrebbero ricevere gia dati filtrati, senza dover conoscere permessi Strapi.
- Le pagine pubbliche possono essere renderizzate anche senza sessione.
- Le pagine private devono avere una guardia auth a monte.

## Vedi Anche

- [Schema Strapi](./schema-strapi.md)
- [Visualizzazione Pagine](./visualizzazione-pagine.md)
- [Backend Strapi](./backend-strapi.md)
- [Decision Log](./decision-log.md)
