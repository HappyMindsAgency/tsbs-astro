// Logica server-side della caccia al tesoro (quiz con `cacciaAlTesoro: true`,
// es. Missione 11). Gli indizi vivono in `quiz.step.domanda[]`: ogni step si
// valida singolarmente (step-by-step) confrontando la risposta inserita con la
// `risposta` flaggata `corretta`. Gli step privi di risposta corretta sono
// puramente narrativi: l'avanzamento è libero. Al superamento dell'ultimo step
// la missione viene completata tramite il motore di progressione condiviso
// (trofeo/punti/level-up idempotenti). Da usare SOLO da route API / pagine server.

import {
	getPartecipazione,
	registraEsitoProva,
	type MembroProgressione,
	type MissioneProgressione,
	type TrofeoSbloccato,
} from './progressione';
import type { Missione, MissioneQuizDomanda } from './missioni';

// Chiave in datiRuntime che tiene lo step più avanzato già sbloccato (0-based:
// è l'indice del prossimo step da risolvere).
const RUNTIME_STEP_KEY = 'cacciaStepCorrente';

// Vista di un singolo indizio per il frontend (mai la risposta corretta).
export type StepCacciaTesoro = {
	indice: number;
	domanda: string;
	lore: string;
	// true se lo step ha una soluzione da inserire; false = puramente narrativo.
	richiedeRisposta: boolean;
};

export type StatoCacciaTesoro = {
	introduzione: string;
	conclusione: string;
	steps: StepCacciaTesoro[];
	// indice del primo step non ancora superato (== steps.length se completata).
	stepCorrente: number;
	completata: boolean;
};

export type EsitoStepCacciaTesoro = {
	corretta: boolean;
	stepCorrente: number;
	completata: boolean;
	conclusione: string;
	trofeiSbloccati: TrofeoSbloccato[];
	puntiAssegnati: number;
	livelloAggiornato: string | null;
};

function normalizeAnswer(value: string) {
	return value
		.trim()
		.toLocaleLowerCase('it-IT')
		.normalize('NFD')
		.replace(/\p{Diacritic}/gu, '');
}

// Risposta accettata per uno step: la `risposta` flaggata `corretta`. Se non ce
// n'è alcuna, lo step è narrativo (nessuna risposta richiesta).
function getRispostaCorretta(domanda: MissioneQuizDomanda): string | null {
	const corretta = (domanda.risposte ?? []).find((r) => r.corretta === true);
	return corretta?.risposta?.trim() || null;
}

function getStepDomande(missione: Missione): MissioneQuizDomanda[] {
	const step = missione.quiz?.step;
	if (!step || !Array.isArray(step.domanda)) return [];
	return step.domanda;
}

function leggiStepCorrente(datiRuntime: unknown, totale: number): number {
	if (typeof datiRuntime === 'object' && datiRuntime !== null && !Array.isArray(datiRuntime)) {
		const raw = (datiRuntime as Record<string, unknown>)[RUNTIME_STEP_KEY];
		const parsed = typeof raw === 'number' ? raw : Number.parseInt(String(raw ?? ''), 10);
		if (Number.isFinite(parsed)) return Math.min(Math.max(parsed, 0), totale);
	}
	return 0;
}

function toStepView(domanda: MissioneQuizDomanda, indice: number): StepCacciaTesoro {
	return {
		indice,
		domanda: domanda.domanda?.trim() || '',
		lore: domanda.lore?.trim() || '',
		richiedeRisposta: getRispostaCorretta(domanda) !== null,
	};
}

// Stato corrente della caccia per il Membro: indizi (senza soluzioni) e step
// raggiunto. La partecipazione "completata" forza stepCorrente a fine elenco.
export async function getStatoCacciaTesoro(
	membro: MembroProgressione,
	missione: Missione,
): Promise<StatoCacciaTesoro> {
	const domande = getStepDomande(missione);
	const step = missione.quiz?.step ?? null;
	const partecipazione = await getPartecipazione(membro.documentId, missione.documentId);
	const completataDb = partecipazione?.stato === 'completata';

	const stepCorrente = completataDb
		? domande.length
		: leggiStepCorrente(partecipazione?.datiRuntime, domande.length);

	return {
		introduzione: step?.introduzione?.trim() || '',
		conclusione: step?.conclusione?.trim() || '',
		steps: domande.map(toStepView),
		stepCorrente,
		completata: completataDb || stepCorrente >= domande.length,
	};
}

// Valida un singolo step. `risposta` è ignorata per gli step narrativi (che
// avanzano sempre). Restituisce l'esito e lo step aggiornato; al superamento
// dell'ultimo step completa la missione (trofeo/punti/level-up via motore).
export async function validaStepCacciaTesoro(args: {
	membro: MembroProgressione;
	missione: Missione;
	stepIndex: number;
	risposta: string;
}): Promise<{ esito?: EsitoStepCacciaTesoro; errore?: string }> {
	const { membro, missione, stepIndex, risposta } = args;
	const domande = getStepDomande(missione);
	const step = missione.quiz?.step ?? null;

	if (domande.length === 0) return { errore: 'caccia_non_configurata' };
	if (!Number.isInteger(stepIndex) || stepIndex < 0 || stepIndex >= domande.length) {
		return { errore: 'step_non_valido' };
	}

	const partecipazione = await getPartecipazione(membro.documentId, missione.documentId);
	const completataDb = partecipazione?.stato === 'completata';
	const stepCorrente = completataDb
		? domande.length
		: leggiStepCorrente(partecipazione?.datiRuntime, domande.length);

	// Si può rispondere solo allo step corrente: niente salti in avanti.
	if (stepIndex !== stepCorrente) {
		return { errore: 'step_fuori_sequenza' };
	}

	const rispostaCorretta = getRispostaCorretta(domande[stepIndex]);
	const corretta = rispostaCorretta === null
		? true // step narrativo: avanzamento libero
		: normalizeAnswer(risposta) === normalizeAnswer(rispostaCorretta);

	const conclusione = step?.conclusione?.trim() || '';

	if (!corretta) {
		return {
			esito: {
				corretta: false,
				stepCorrente,
				completata: false,
				conclusione,
				trofeiSbloccati: [],
				puntiAssegnati: 0,
				livelloAggiornato: null,
			},
		};
	}

	const nuovoStep = stepCorrente + 1;
	const completata = nuovoStep >= domande.length;
	const progresso = Math.round((nuovoStep / domande.length) * 100);

	// `registraEsitoProva` con esito=true al completamento eroga trofeo/punti e
	// applica il level-up (idempotente). Durante la caccia (esito=false) salva
	// solo l'avanzamento, persistendo lo step nel datiRuntime.
	const progressione = await registraEsitoProva({
		membro,
		missione: missione as unknown as MissioneProgressione,
		esito: completata,
		progresso,
		extraRuntime: { [RUNTIME_STEP_KEY]: nuovoStep },
	});

	return {
		esito: {
			corretta: true,
			stepCorrente: nuovoStep,
			completata,
			conclusione,
			trofeiSbloccati: progressione?.trofeiSbloccati ?? [],
			puntiAssegnati: progressione?.puntiAssegnati ?? 0,
			livelloAggiornato: progressione?.livelloAggiornato ?? null,
		},
	};
}
