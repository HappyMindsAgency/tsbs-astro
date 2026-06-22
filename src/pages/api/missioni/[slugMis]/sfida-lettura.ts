// Route server della Missione 6 - Sfida di lettura.
// azione "domanda": genera la rosa di 4 estratti per il libro scelto.
// azione "risposta": valida l'estratto scelto (1 inserimento al giorno),
// assegna +1 punto per libro riconosciuto e i trofei soglia idempotenti.

import type { APIRoute } from 'astro';
import { getMissioneBySlug } from '../../../../lib/strapi/missioni';
import { getMembroProgressioneByJwt, getPartecipazione } from '../../../../lib/strapi/progressione';
import { generaDomandaSfida, rispondiDomandaSfida } from '../../../../lib/strapi/sfida-lettura';

export const READING_CHALLENGE_MISSION_SLUGS = new Set(['missione-06-i-custodi-del-sapere']);

type SfidaPayload = {
	azione?: 'domanda' | 'risposta';
	libro?: string;
	indice?: number;
};

export const POST: APIRoute = async ({ params, request, cookies }) => {
	const jwt = cookies.get('jwt')?.value;
	const slugMis = params.slugMis;

	if (!jwt) {
		return json({ error: 'unauthorized' }, 401);
	}

	if (!slugMis || !READING_CHALLENGE_MISSION_SLUGS.has(slugMis)) {
		return json({ error: 'mission_not_found' }, 404);
	}

	let body: SfidaPayload;
	try {
		body = await request.json();
	} catch {
		return json({ error: 'invalid_body' }, 400);
	}

	const libroDocumentId = typeof body.libro === 'string' ? body.libro.trim() : '';
	if (!libroDocumentId) {
		return json({ error: 'invalid_book' }, 400);
	}

	const membro = await getMembroProgressioneByJwt(jwt);
	if (!membro) {
		return json({ error: 'unauthorized' }, 401);
	}

	const missione = await getMissioneBySlug(slugMis);
	if (!missione) {
		return json({ error: 'mission_not_found' }, 404);
	}

	const partecipazione = await getPartecipazione(membro.documentId, missione.documentId);
	const missioneGiaCompletata = partecipazione?.stato === 'completata';

	if (body.azione === 'domanda') {
		const { domanda, errore } = await generaDomandaSfida(membro, libroDocumentId);
		if (errore) {
			return json({ error: errore }, errore === 'salvataggio_fallito' ? 500 : 409);
		}

		return json({ success: true, estratti: domanda?.estratti ?? [] });
	}

	if (body.azione === 'risposta') {
		const indice = Number.isInteger(body.indice) ? Number(body.indice) : -1;
		if (indice < 0) {
			return json({ error: 'invalid_answer' }, 400);
		}

		const { esito, errore } = await rispondiDomandaSfida(membro, missione, libroDocumentId, indice, missioneGiaCompletata);
		if (errore || !esito) {
			return json({ error: errore ?? 'salvataggio_fallito' }, errore === 'salvataggio_fallito' || !errore ? 500 : 409);
		}

		return json({
			success: true,
			corretta: esito.corretta,
			libriRiconosciuti: esito.libriRiconosciuti,
			totaleLibri: esito.totaleLibri,
			puntiAssegnati: esito.puntiAssegnati,
			trofeiSbloccati: esito.trofeiSbloccati,
		});
	}

	return json({ error: 'invalid_action' }, 400);
};

function json(data: unknown, status = 200): Response {
	return new Response(JSON.stringify(data), {
		status,
		headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
	});
}
