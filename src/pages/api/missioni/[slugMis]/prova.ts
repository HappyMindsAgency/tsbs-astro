import type { APIRoute } from 'astro';
import { getMissioneBySlug } from '../../../../lib/strapi/missioni';
import { getMembroProgressioneByJwt, registraEsitoProva, avviaPartecipazione } from '../../../../lib/strapi/progressione';
import { inviaTesseraInVerifica } from '../../../../lib/strapi/tessera';
import { logger } from '../../../../services/logger';

type SubmittedAnswer = {
	questionIndex?: number;
	answer?: string;
};

// Missioni che raccolgono il numero tessera invece di seguire il flusso quiz→trofeo.
const LIBRARY_CARD_MISSION_SLUGS = new Set(['missione-01-il-varco']);

export const POST: APIRoute = async ({ params, request, cookies }) => {
	const jwt = cookies.get('jwt')?.value;
	const slugMis = params.slugMis;

	if (!jwt) {
		return json({ error: 'unauthorized' }, 401);
	}

	if (!slugMis) {
		return json({ error: 'missing_mission_slug' }, 400);
	}

	let body: { answers?: SubmittedAnswer[] };
	try {
		body = await request.json();
	} catch {
		return json({ error: 'invalid_body' }, 400);
	}

	if (!Array.isArray(body.answers)) {
		return json({ error: 'invalid_answers' }, 400);
	}

	const membro = await getMembroProgressioneByJwt(jwt);
	if (!membro) {
		return json({ error: 'unauthorized' }, 401);
	}

	const missione = await getMissioneBySlug(slugMis);
	const domande = missione?.quiz?.domande ?? [];

	if (!missione || domande.length === 0) {
		return json({ error: 'mission_quiz_not_found' }, 404);
	}

	if (body.answers.length !== domande.length) {
		return json({ error: 'answers_count_mismatch' }, 400);
	}

	// --- Missione 1 (tessera): caso speciale, NON segue il flusso quiz→trofeo. ---
	// Il numero inserito viene salvato con lo stesso meccanismo della pagina
	// Impostazioni (statoTessera: in_verifica + email Redazione). La missione
	// resta "in corso": il trofeo è assegnato manualmente dalla Redazione.
	if (LIBRARY_CARD_MISSION_SLUGS.has(missione.slug)) {
		// Garantisce la partecipazione inCorso/50 anche per accesso diretto alla prova.
		await avviaPartecipazione(membro.documentId, missione.documentId);

		const libraryCardCode = body.answers[0]?.answer ?? '';
		const result = await inviaTesseraInVerifica(jwt, libraryCardCode);

		if (!result.ok) {
			return json(
				{ success: false, mission: 'library-card', error: result.code, message: result.message },
				result.status,
			);
		}

		return json({ success: true, mission: 'library-card', tesseraStato: result.statoTessera });
	}

	const results = domande.map((domanda, index) => {
		const submittedAnswer = body.answers?.find((item) => item.questionIndex === index);
		const value = submittedAnswer?.answer ?? '';
		const availableAnswers = domanda.risposte ?? [];
		const correctAnswers = availableAnswers.filter((risposta) => risposta.corretta === true);
		const acceptedAnswers = correctAnswers.length > 0 ? correctAnswers : availableAnswers.length === 1 ? availableAnswers : [];
		const normalizedValue = normalizeAnswer(value);
		const correct = acceptedAnswers.some((risposta) => normalizeAnswer(risposta.risposta ?? '') === normalizedValue);

		return { questionIndex: index, correct };
	});

	const correctCount = results.filter((result) => result.correct).length;
	const passed = correctCount === domande.length;

	// Registra il tentativo nello storico e, al primo superamento, eroga
	// trofeo/punti e verifica il level-up (tutto idempotente, lato server).
	const risposte = Object.fromEntries(results.map((result) => [`domanda${result.questionIndex + 1}`, result.correct]));
	const progressione = await registraEsitoProva({ membro, missione, esito: passed, risposte });

	if (!progressione) {
		logger.error(`[Prova] Registrazione esito fallita per ${missione.slug}`);
	}

	return json({
		success: true,
		passed,
		correctCount,
		total: domande.length,
		trofeiSbloccati: progressione?.trofeiSbloccati ?? [],
		puntiAssegnati: progressione?.puntiAssegnati ?? 0,
		livelloAggiornato: progressione?.livelloAggiornato ?? null,
	});
};

function normalizeAnswer(value: string) {
	return value
		.trim()
		.toLocaleLowerCase('it-IT')
		.normalize('NFD')
		.replace(/\p{Diacritic}/gu, '');
}

function json(data: unknown, status = 200): Response {
	return new Response(JSON.stringify(data), {
		status,
		headers: { 'Content-Type': 'application/json' },
	});
}
