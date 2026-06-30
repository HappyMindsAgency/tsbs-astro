// Missione 12 "referral": diffusione tramite link con codice univoco per membro.
// Il codice vive in Membro.externalAuthId (campo finora inutilizzato, nessun
// conflitto con auth esterna). Visitare il link con un codice valido completa
// la missione e assegna il trofeo al referrer (membro che ha condiviso).
// Usato SOLO server-side (token admin), come il resto di progressione.ts.

import { getStrapiApiUrl } from './api-url';
import { MISSIONI_SPECIALI } from './missioni';
import {
	getMembroProgressioneByJwt,
	registraEsitoProva,
	type MembroProgressione,
	type MissioneProgressione,
} from './progressione';
import { logger } from '../../services/logger';

const STRAPI_API_BASE_URL = getStrapiApiUrl();
const STRAPI_API = import.meta.env.AUTH_READONLY;

function adminHeaders() {
	return { Authorization: `Bearer ${STRAPI_API}`, 'Content-Type': 'application/json' };
}

// externalAuthId su Strapi ha maxLength 6: il codice referral e di 6 caratteri.
const REFERRAL_CODE_LENGTH = 6;

function generaCodice(): string {
	// 6 char base36 (0-9a-z) da random crittografico; il modulo introduce un bias
	// trascurabile, irrilevante per un identificativo.
	return Array.from(crypto.getRandomValues(new Uint8Array(REFERRAL_CODE_LENGTH)), (b) => (b % 36).toString(36)).join('');
}

async function codiceEsiste(code: string): Promise<boolean> {
	const searchParams = new URLSearchParams();
	searchParams.set('status', 'draft');
	searchParams.set('filters[externalAuthId][$eq]', code);
	searchParams.set('fields[0]', 'id');
	searchParams.set('pagination[pageSize]', '1');
	const res = await fetch(`${STRAPI_API_BASE_URL}/membri?${searchParams}`, { headers: adminHeaders() });
	if (!res.ok) return false; // in dubbio non blocca la generazione
	const payload = await res.json();
	return Boolean(payload?.data?.[0]);
}

// Genera il codice referral del membro e lo salva in externalAuthId, una volta
// sola: se gia presente lo riusa (stabile). Univoco: ritenta se il codice e gia
// in uso da un altro membro (spazio 36^6 ≈ 2,2 mld, collisioni rarissime).
export async function ensureReferralCode(membroDocumentId: string, existingCode?: string | null): Promise<string | null> {
	const current = existingCode?.trim();
	if (current) return current;

	let code = '';
	for (let i = 0; i < 5; i++) {
		const candidato = generaCodice();
		if (!(await codiceEsiste(candidato))) { code = candidato; break; }
	}
	if (!code) {
		logger.error(`[Referral] Impossibile generare un codice univoco (${membroDocumentId})`);
		return null;
	}

	const res = await fetch(`${STRAPI_API_BASE_URL}/membri/${membroDocumentId}`, {
		method: 'PUT',
		headers: adminHeaders(),
		body: JSON.stringify({ data: { externalAuthId: code } }),
	});

	if (!res.ok) {
		logger.error(`[Referral] Salvataggio codice fallito (${membroDocumentId}): ${await res.text()}`);
		return null;
	}
	return code;
}

type ReferrerMembro = MembroProgressione & {
	externalAuthId: string | null;
	datiAggiuntivi: Record<string, unknown> | null;
};

// Risolve il referrer dal codice referral (externalAuthId).
async function getMembroByReferralCode(code: string): Promise<ReferrerMembro | null> {
	const searchParams = new URLSearchParams();
	searchParams.set('status', 'draft');
	searchParams.set('filters[externalAuthId][$eq]', code);
	searchParams.set('fields[0]', 'email');
	searchParams.set('fields[1]', 'punti');
	searchParams.set('fields[2]', 'externalAuthId');
	searchParams.set('fields[3]', 'datiAggiuntivi');
	searchParams.set('populate[livello][fields][0]', 'nome');
	searchParams.set('populate[livello][fields][1]', 'slug');
	searchParams.set('populate[livello][fields][2]', 'ordine');
	searchParams.set('populate[accademia][fields][0]', 'slug');
	searchParams.set('populate[accademia][fields][1]', 'nome');
	searchParams.set('pagination[pageSize]', '1');

	const res = await fetch(`${STRAPI_API_BASE_URL}/membri?${searchParams}`, { headers: adminHeaders() });
	if (!res.ok) return null;
	const payload = await res.json();
	return (payload?.data?.[0] ?? null) as ReferrerMembro | null;
}

// Carica la missione referral come MissioneProgressione (per registraEsitoProva).
async function getMissioneReferral(): Promise<MissioneProgressione | null> {
	const searchParams = new URLSearchParams();
	searchParams.set('status', 'published');
	searchParams.set('fields[0]', 'slug');
	searchParams.set('fields[1]', 'punteggio');
	searchParams.set('populate[trofeo][fields][0]', 'nome');
	searchParams.set('populate[trofeo][fields][1]', 'descrizione');
	searchParams.set('populate[trofeo][fields][2]', 'punti');
	searchParams.set('populate[trofeo][populate][immagine][fields][0]', 'url');
	searchParams.set('populate[trofeo][populate][imgModale][fields][0]', 'url');

	const res = await fetch(`${STRAPI_API_BASE_URL}/missioni/${MISSIONI_SPECIALI.referral}?${searchParams}`, {
		headers: adminHeaders(),
	});
	if (!res.ok) return null;
	const payload = await res.json();
	const m = payload?.data;
	if (!m?.documentId) return null;
	return {
		documentId: m.documentId,
		slug: m.slug,
		punteggio: m.punteggio ?? null,
		trofeo: m.trofeo
			? {
				documentId: m.trofeo.documentId,
				nome: m.trofeo.nome,
				descrizione: m.trofeo.descrizione ?? null,
				punti: m.trofeo.punti ?? null,
				immagine: m.trofeo.immagine ? { url: m.trofeo.immagine.url } : null,
				imgModale: m.trofeo.imgModale ? { url: m.trofeo.imgModale.url } : null,
			}
			: null,
	};
}

// Accoda i trofei in datiAggiuntivi.trofeiDaNotificare del referrer (stesso
// pattern della verifica tessera): NotificaTrofeiToast li mostra al primo login.
async function accodaTrofeiNotifica(
	referrer: ReferrerMembro,
	trofei: { documentId: string; nome: string; immagine: string | null }[],
): Promise<void> {
	if (trofei.length === 0) return;

	const dati = (referrer.datiAggiuntivi && typeof referrer.datiAggiuntivi === 'object') ? referrer.datiAggiuntivi : {};
	const coda = Array.isArray((dati as Record<string, unknown>).trofeiDaNotificare)
		? ((dati as Record<string, unknown>).trofeiDaNotificare as { documentId?: string }[])
		: [];

	const visti = new Set(coda.map((t) => t?.documentId).filter(Boolean));
	const merged = [...coda, ...trofei.filter((t) => !visti.has(t.documentId))];

	const res = await fetch(`${STRAPI_API_BASE_URL}/membri/${referrer.documentId}`, {
		method: 'PUT',
		headers: adminHeaders(),
		body: JSON.stringify({ data: { datiAggiuntivi: { ...dati, trofeiDaNotificare: merged } } }),
	});
	if (!res.ok) logger.error(`[Referral] Accodamento notifica trofeo fallito: ${await res.text()}`);
}

export type ReferralEsito = 'ok' | 'gia_completata' | 'codice_invalido' | 'auto_referral' | 'errore';

// Registra un accesso via referral: completa la missione 12 per il referrer e
// gli assegna il trofeo. Idempotente (completamento e trofeo gia idempotenti).
// visitorJwt serve solo per scartare l'auto-referral (utente che apre il proprio link).
export async function registraReferral(code: string, visitorJwt?: string): Promise<ReferralEsito> {
	const referrer = await getMembroByReferralCode(code);
	if (!referrer) return 'codice_invalido';

	if (visitorJwt) {
		const visitor = await getMembroProgressioneByJwt(visitorJwt);
		if (visitor?.documentId === referrer.documentId) return 'auto_referral';
	}

	const missione = await getMissioneReferral();
	if (!missione) {
		logger.error('[Referral] Missione referral non trovata su Strapi');
		return 'errore';
	}

	const result = await registraEsitoProva({ membro: referrer, missione, esito: true });
	if (!result) return 'errore';
	if (!result.primaVolta) return 'gia_completata';

	await accodaTrofeiNotifica(
		referrer,
		result.trofeiSbloccati.map((t) => ({ documentId: t.documentId, nome: t.nome, immagine: t.immagineUrl })),
	);
	return 'ok';
}
