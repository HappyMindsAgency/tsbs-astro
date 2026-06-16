// Route server della caccia al tesoro (quiz con `cacciaAlTesoro: true`, es.
// Missione 11). azione "valida": verifica la risposta del singolo step corrente
// (step-by-step); al superamento dell'ultimo step completa la missione ed eroga
// trofeo/punti/level-up (idempotenti, lato motore di progressione).

import type { APIRoute } from 'astro';
import { getMissioneBySlug } from '../../../../lib/strapi/missioni';
import { getMembroProgressioneByJwt, avviaPartecipazione } from '../../../../lib/strapi/progressione';
import { validaStepCacciaTesoro } from '../../../../lib/strapi/caccia-tesoro';

type CacciaPayload = {
	azione?: 'valida';
	step?: number;
	risposta?: string;
};

export const POST: APIRoute = async ({ params, request, cookies }) => {
	const jwt = cookies.get('jwt')?.value;
	const slugMis = params.slugMis;

	if (!jwt) {
		return json({ error: 'unauthorized' }, 401);
	}

	if (!slugMis) {
		return json({ error: 'mission_not_found' }, 404);
	}

	let body: CacciaPayload;
	try {
		body = await request.json();
	} catch {
		return json({ error: 'invalid_body' }, 400);
	}

	if (body.azione !== 'valida') {
		return json({ error: 'invalid_action' }, 400);
	}

	const membro = await getMembroProgressioneByJwt(jwt);
	if (!membro) {
		return json({ error: 'unauthorized' }, 401);
	}

	const missione = await getMissioneBySlug(slugMis);
	if (!missione || !missione.quiz?.cacciaAlTesoro) {
		return json({ error: 'mission_not_found' }, 404);
	}

	// Garantisce la partecipazione (inCorso/50) anche per chi arriva diretto.
	await avviaPartecipazione(membro.documentId, missione.documentId);

	const step = Number.isInteger(body.step) ? Number(body.step) : -1;
	const risposta = typeof body.risposta === 'string' ? body.risposta : '';

	const { esito, errore } = await validaStepCacciaTesoro({ membro, missione, stepIndex: step, risposta });
	if (errore || !esito) {
		const status = errore === 'caccia_non_configurata' ? 404
			: errore === 'step_non_valido' || errore === 'step_fuori_sequenza' ? 409
			: 500;
		return json({ error: errore ?? 'salvataggio_fallito' }, status);
	}

	return json({
		success: true,
		corretta: esito.corretta,
		stepCorrente: esito.stepCorrente,
		completata: esito.completata,
		conclusione: esito.completata ? esito.conclusione : '',
		trofeiSbloccati: esito.trofeiSbloccati,
		puntiAssegnati: esito.puntiAssegnati,
		livelloAggiornato: esito.livelloAggiornato,
	});
};

function json(data: unknown, status = 200): Response {
	return new Response(JSON.stringify(data), {
		status,
		headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
	});
}
