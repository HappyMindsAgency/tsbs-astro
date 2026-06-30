// src/pages/api/missioni/[slugMis]/avvia.ts
// "Avvia la missione": crea (se assente) la Partecipazione del Membro alla
// missione con stato inCorso e progresso 50, poi reindirizza alla prova.
// Form POST con progressive enhancement: funziona anche senza JavaScript.

import type { APIRoute } from 'astro';
import { getMissioneBySlug, getMissionProofHref, MISSIONI_SPECIALI } from '../../../../lib/strapi/missioni';
import { getMembroProgressioneByJwt, avviaPartecipazione, getPartecipazione } from '../../../../lib/strapi/progressione';
import { ensureReferralCode } from '../../../../lib/strapi/referral';
import { logger } from '../../../../services/logger';

export const POST: APIRoute = async ({ params, cookies }) => {
	const jwt = cookies.get('jwt')?.value;
	const slugMis = params.slugMis;

	if (!jwt) {
		return redirect('/');
	}

	if (!slugMis) {
		return redirect('/missioni/');
	}

	const missione = await getMissioneBySlug(slugMis);
	if (!missione) {
		return redirect('/missioni/');
	}

	const membro = await getMembroProgressioneByJwt(jwt);
	if (!membro) {
		return redirect('/');
	}

	const partecipazione = await getPartecipazione(membro.documentId, missione.documentId);
	if (partecipazione?.stato === 'completata') {
		return redirect(`/missioni/${missione.slug}/`);
	}

	const avviata = await avviaPartecipazione(membro.documentId, missione.documentId);
	if (!avviata) {
		// Best-effort: la prova ricrea comunque la partecipazione al bisogno.
		logger.error(`[Avvia] Partecipazione non creata per ${missione.slug} (membro ${membro.documentId})`);
	}

	// Missione referral: genera (una volta) il codice in externalAuthId, poi
	// torna al dettaglio che mostra il link di condivisione.
	if (missione.documentId === MISSIONI_SPECIALI.referral) {
		await ensureReferralCode(membro.documentId, membro.externalAuthId);
	}

	return redirect(getMissionProofHref(missione));
};

function redirect(location: string): Response {
	return new Response(null, { status: 303, headers: { Location: location } });
}
