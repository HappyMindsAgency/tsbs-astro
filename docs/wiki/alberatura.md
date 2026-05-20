# Alberatura - The Secret Bookish Society

## Scopo

Questo file raccoglie l'alberatura strategica prevista per le pagine Astro della web app.

La struttura nasce dal confronto tra:
- architettura informativa di progetto
- frame Figma
- single type e collection type Strapi

Gli URL definitivi non sono ancora confermati. Questa alberatura va quindi considerata come struttura logica e tecnica di riferimento, non come definizione finale degli slug pubblici.

## Alberatura Pagine Astro

```txt
src/pages/
├─ login/
│  └─ index.astro
│
├─ chiamata/
│  ├─ index.astro
│  ├─ registrazione/
│  │  └─ index.astro
│  └─ registrazione-completata/
│     └─ index.astro
│
├─ test-smistamento/
│  ├─ index.astro
│  ├─ risultato/
│  │  └─ index.astro
│  ├─ appartenenza/
│  │  └─ index.astro
│  └─ scelta-avatar/
│     └─ index.astro
│
├─ dashboard-welcome-accademia/
│  └─ index.astro
│
├─ atrio/
│  ├─ index.astro
│  └─ missioni/
│     ├─ index.astro
│     └─ [slugMis]/
│        ├─ index.astro
│        ├─ sfida-lettura.astro
│        ├─ prova/
│        │  ├─ index.astro
│        │  └─ sfida-lettura.astro
│        └─ esito.astro
│
├─ accademia/
│  ├─ index.astro
│  ├─ classifica.astro
│  └─ [slugAccademia].astro
│
├─ scrivania/
│  ├─ index.astro
│  ├─ percorso-di-studi.astro
│  ├─ trofei.astro
│  ├─ grimorio/
│  │  ├─ index.astro
│  │  └─ [slugNota].astro
│  ├─ utenti-preferiti/
│  │  ├─ index.astro
│  │  └─ esploso-profilo-utente.astro
│  └─ membri/
│     └─ [nickname].astro
│
├─ biblioteca/
│  ├─ index.astro
│  ├─ eventi/
│  │  ├─ index.astro
│  │  └─ [slugEvento].astro
│  ├─ archivio/
│  │  └─ index.astro
│  └─ accademie/
│     └─ index.astro
│
└─ epistole/
   ├─ index.astro
   └─ [slugEpistola].astro
```

## Note Strategiche

### Missioni

La sezione `atrio/missioni/` usa una struttura dinamica basata su singola missione:

```txt
atrio/missioni/[slugMis]/
├─ index.astro
├─ sfida-lettura.astro
├─ prova/
│  ├─ index.astro
│  └─ sfida-lettura.astro
└─ esito.astro
```

I diversi frame Figma delle missioni non corrispondono necessariamente a file Astro separati. Sono stati/interfacce della stessa area funzionale:
- missioni in corso
- missioni completate
- missioni disponibili
- dettaglio missione
- prova a scelta multipla
- prova con risposta libera
- scelta citazionale / sfida lettura
- esito con trofeo
- esito senza trofeo

La pagina `atrio/missioni/index.astro` gestisce elenco e filtri.

La pagina `atrio/missioni/[slugMis]/prova/index.astro` gestisce l'ingresso/regia della prova in base ai dati Strapi e allo stato della partecipazione.

La pagina `atrio/missioni/[slugMis]/sfida-lettura.astro` gestisce il layout della sfida lettura legata alla singola missione.

La pagina `atrio/missioni/[slugMis]/prova/sfida-lettura.astro` gestisce lo step extra della scelta citazionale / sfida lettura quando il flusso della prova lo richiede.

La pagina `atrio/missioni/[slugMis]/esito.astro` gestisce il risultato finale della missione.

La route della singola missione deve restare stabile e non moltiplicarsi in base a categoria o tipologia.

### Utenti Preferiti

La sezione `atrio/scrivania/utenti-preferiti/` contiene:

```txt
atrio/scrivania/utenti-preferiti/
├─ index.astro
└─ esploso-profilo-utente.astro
```

Nella versione base senza Strapi, il like dei profili usa `localStorage` tramite `src/lib/profileFavorites.js` e salva solo identificativi stabili dei profili.

I dati visuali dei profili arrivano temporaneamente da `src/data/mockProfiles.js`.

Quando arrivera il binding Strapi:
- sostituire il dataset mock con dati Strapi
- usare `documentId` o slug univoco come identificativo stabile
- sostituire l'implementazione interna di `profileFavorites.js` con chiamate API/relazione Strapi tra utente autenticato e profili preferiti
- non salvare copie complete dei profili nel client
La variazione di layout deve essere gestita tramite componenti interni scelti in base ai dati Strapi.

Struttura attuale dei componenti prova:

```txt
src/components/MissioniComponents/
├─ SceltaDomanda.astro
└─ RispostaLibera.astro
```

Anche se le prove avranno piu tipologie editoriali o funzionali, la UI deve restare gestita tramite questi due componenti principali:
- `SceltaDomanda.astro` per prove a scelta, quiz, scelta citazionale o varianti riconducibili a selezione guidata
- `RispostaLibera.astro` per prove testuali, parola d'ordine o varianti riconducibili a input libero

Struttura popup/modali:

```txt
src/components/PopupComponents/
└─ DomandaModal.astro
```

`DomandaModal.astro` gestisce il popup/modale di domanda usato nella sfida lettura quando l'utente seleziona un libro letto. Deve restare separato dalla pagina `sfida-lettura.astro` e dai toast di esito, per mantenere la pagina Astro leggera e distinguere le interazioni guidate dai feedback brevi.

Le pagine Astro restano pagine di regia:

```txt
atrio/missioni/[slugMis]/index.astro -> sceglie il componente dettaglio
atrio/missioni/[slugMis]/sfida-lettura.astro -> layout sfida lettura della singola missione
atrio/missioni/[slugMis]/prova/index.astro -> sceglie il componente prova o fa da regia dello step corrente
atrio/missioni/[slugMis]/prova/sfida-lettura.astro -> step prova dedicato alla sfida lettura
atrio/missioni/[slugMis]/esito.astro -> sceglie il componente esito
```

Per la scelta citazionale / sfida lettura, il flusso previsto e:

```txt
/atrio/missioni/[slugMis]/sfida-lettura       -> layout della sfida lettura
/atrio/missioni/[slugMis]/prova/sfida-lettura -> step prova dedicato alla sfida lettura
/atrio/missioni/[slugMis]/prova/              -> regia della prova basata sui dati Strapi
```

Lo step `sfida-lettura.astro` e specifico della scelta citazionale / sfida lettura. La domanda a scelta multipla non richiede una route `domanda.astro` separata se puo riusare il componente della prova a scelta multipla dentro `prova/index.astro`.

La scelta del componente puo basarsi su campi Strapi come:
- `layoutDettaglio`
- `tipoProva`
- `tipoEsito`
- `categoriaMissione.slug`, solo se categoria e tipologia visiva coincidono davvero

Gli esiti prova usano toast dedicati. Le icone definitive non sono ancora state fornite:
- prova non superata: una sola icona condivisa per tutte le tipologie di prova
- prova superata: icona variabile in base alla tipologia di prova

Quando arriveranno le icone definitive, il dato Strapi dovra guidare la scelta dell'icona di successo tramite `tipoProva` o tramite un campo controllato equivalente, evitando classi icona libere non validate.

Evitare route separate per categoria o tipologia, come:

```txt
missioni/esplorazione/[slugMis].astro
missioni/quiz/[slugMis].astro
missioni/lettura/[slugMis].astro
```

perche legherebbero URL e architettura Astro a una classificazione editoriale che potrebbe cambiare.

Da confermare lato Strapi:
- la collection `Missione` dovra avere un campo `slug` se si vuole usare `[slugMis]`
- in alternativa si dovra usare un identificativo tecnico Strapi, meno adatto a URL editoriali
- la collection `Missione` dovra esporre campi o relazioni sufficienti per scegliere layout dettaglio, tipo prova e tipo esito senza moltiplicare le route Astro

### Categorie Missione

La collection `Categoria Missione` puo servire per classificare e filtrare le missioni.

Al momento non viene prevista una route dedicata:

```txt
missioni/categoria/[slugCat].astro
```

Questa route potra essere aggiunta in futuro solo se servira una pagina categoria autonoma.

Da confermare lato Strapi:
- anche `Categoria Missione` dovra avere un campo `slug` se serviranno URL categoria.

### Scrivania E Membri

La pagina:

```txt
scrivania/membri/[nickname].astro
```

e da trattare con cautela.

Il campo `nickname` esiste in Strapi ed e unico, ma prima di implementare questa pagina vanno confermati:
- visibilita pubblica del profilo membro
- dati mostrabili ad altri utenti
- logiche privacy
- eventuale distinzione tra profilo personale e preview altri utenti

### Grimorio E Note

La sezione `atrio/scrivania/grimorio/` contiene l'elenco delle note personali e l'esploso della singola nota:

```txt
atrio/scrivania/grimorio/
├─ index.astro
└─ [slugNota].astro
```

La route dinamica `[slugNota].astro` ospita l'editor/esploso della nota. I blocchi di anteprima del Grimorio presenti in Atrio, Scrivania e Grimorio devono puntare alla nota specifica usando uno slug stabile.

In fase provvisoria, prima del binding Strapi, e accettabile usare uno slug statico come `titolo-della-nota`. Quando arrivera Strapi, lo slug dovra arrivare dal record della nota/grimorio e non da hardcode sparsi.

### Biblioteca

La sezione `biblioteca/` raccoglie contenuti istituzionali, archivio e ponte con Biblioteca Classense:

```txt
biblioteca/
├─ eventi/
├─ archivio/
└─ accademie/
```

Questa scelta permette di mantenere il menu principale coerente con Figma, dove compare la voce `Biblioteca`, senza perdere le sezioni previste dall'architettura informativa.

### Epistole

Le `Epistole` restano una sezione autonoma:

```txt
epistole/
├─ index.astro
└─ [slugEpistola].astro
```

Questa scelta rispetta il guardrail narrativo: le Epistole non sono semplici notifiche, ma un canale narrativo principale.

## Coerenza Con Strapi

Mappatura principale:

```txt
Landing pubblica       -> single type Landing
Chiamata / onboarding  -> single type Onboarding
Test smistamento       -> single type Smistamento
Accademia              -> collection Accademia
Biblioteca             -> single type Biblioteca
Eventi                 -> collection Evento
Epistole               -> collection Epistola
Grimorio               -> collection Grimorio
Trofei                 -> collection Trofeo + Trofeo Membro
Missioni               -> collection Missione + Partecipazione Missione
```

Route dinamiche gia coerenti con campi slug presenti in Strapi:

```txt
accademia/[slugAccademia].astro
biblioteca/eventi/[slugEvento].astro
epistole/[slugEpistola].astro
scrivania/grimorio/[slugNota].astro
```

Route dinamica da confermare:

```txt
atrio/missioni/[slugMis]/
```

perche la collection `Missione` non ha ancora un campo `slug`.

## Vedi Anche

- [Index Wiki](./index.md)
- [Architettura Informativa](./architettura-informativa.md)
- [Backend Strapi](./backend-strapi.md)
- [Decision Log](./decision-log.md)
