// Motore server-side della progressione di gioco: tentativi missione,
// completamento, assegnazione idempotente di trofei e punti, level-up.
// Va usato SOLO dalle route API Astro (scrive su Strapi con il token admin):
// il frontend richiede l'azione e renderizza l'esito (es. modale trofeo).

import { getStrapiApiUrl } from './api-url';
import { getLevelOrder } from '../filtri/missioni';
import { resolveStrapiMediaUrl } from './trofei';
import type { MissioneLivello } from './missioni';
import { logger } from '../../services/logger';

const STRAPI_API_BASE_URL = getStrapiApiUrl();
const STRAPI_API = import.meta.env.AUTH_READONLY;

// Trigger di level-up: il completamento della missione chiave aggiorna il
// livello del Membro (mai degradante, vedi applicaLevelUp).
const LEVEL_UP_BY_MISSION_SLUG: Record<string, string> = {
	'missione-05-le-radici': 'livello-3-custode-novizio',
	'missione-11-il-rituale-del-custode': 'livello-4-custode',
};

export type MembroProgressione = {
	id: number;
	documentId: string;
	email: string | null;
	punti: number | null;
	livello: MissioneLivello | null;
	accademia: { documentId: string; slug: string | null; nome: string | null } | null;
};

export type MissioneProgressione = {
	documentId: string;
	slug: string;
	punteggio: number | null;
	trofeo: {
		documentId: string;
		nome: string;
		descrizione: string | null;
		punti: number | null;
		immagine?: { url: string | null } | null;
	} | null;
};

// Vista del trofeo appena sbloccato, pronta per la modale frontend.
export type TrofeoSbloccato = {
	documentId: string;
	nome: string;
	descrizione: string | null;
	immagineUrl: string | null;
};

export type TentativoMissione = {
	dataTentativo: string;
	esito: boolean;
	risposte?: Record<string, boolean>;
};

export type EsitoProgressione = {
	esito: boolean;
	missioneCompletata: boolean;
	// true solo al primo completamento: e il momento in cui vengono erogati premi.
	primaVolta: boolean;
	puntiAssegnati: number;
	trofeiSbloccati: TrofeoSbloccato[];
	// slug del livello raggiunto se il completamento ha attivato un level-up.
	livelloAggiornato: string | null;
};

function adminHeaders() {
	return { Authorization: `Bearer ${STRAPI_API}`, 'Content-Type': 'application/json' };
}

// "Giorno" coerente di progetto: fuso Europe/Rome, formato ISO YYYY-MM-DD.
export function getTodayRome(): string {
	return new Intl.DateTimeFormat('en-CA', {
		timeZone: 'Europe/Rome',
		year: 'numeric',
		month: '2-digit',
		day: '2-digit',
	}).format(new Date());
}

// Risolve il Membro del JWT con i dati necessari alla progressione.
export async function getMembroProgressioneByJwt(jwt: string): Promise<MembroProgressione | null> {
	const userRes = await fetch(`${STRAPI_API_BASE_URL}/users/me`, {
		headers: { Authorization: `Bearer ${jwt}`, 'Content-Type': 'application/json' },
	});
	if (!userRes.ok) return null;

	const user = (await userRes.json()) as { id: number };
	if (!user?.id) return null;

	const searchParams = new URLSearchParams();
	searchParams.set('status', 'draft');
	searchParams.set('filters[user][id][$eq]', String(user.id));
	searchParams.set('fields[0]', 'email');
	searchParams.set('fields[1]', 'punti');
	searchParams.set('populate[livello][fields][0]', 'nome');
	searchParams.set('populate[livello][fields][1]', 'slug');
	searchParams.set('populate[livello][fields][2]', 'ordine');
	searchParams.set('populate[accademia][fields][0]', 'slug');
	searchParams.set('populate[accademia][fields][1]', 'nome');
	searchParams.set('pagination[pageSize]', '1');

	const membroRes = await fetch(`${STRAPI_API_BASE_URL}/membri?${searchParams}`, { headers: adminHeaders() });
	if (!membroRes.ok) return null;

	const payload = await membroRes.json();
	return (payload?.data?.[0] ?? null) as MembroProgressione | null;
}

type PartecipazioneRaw = {
	id: number;
	documentId: string;
	stato: string | null;
	progresso: string | number | null;
	dataInizio: string | null;
	dataCompletamento: string | null;
	datiRuntime: unknown;
};

export async function getPartecipazione(membroDocumentId: string, missioneDocumentId: string) {
	const searchParams = new URLSearchParams();
	searchParams.set('status', 'draft');
	searchParams.set('filters[membro][documentId][$eq]', membroDocumentId);
	searchParams.set('filters[missione][documentId][$eq]', missioneDocumentId);
	searchParams.set('fields[0]', 'stato');
	searchParams.set('fields[1]', 'progresso');
	searchParams.set('fields[2]', 'dataInizio');
	searchParams.set('fields[3]', 'dataCompletamento');
	searchParams.set('fields[4]', 'datiRuntime');
	searchParams.set('pagination[pageSize]', '1');

	const response = await fetch(`${STRAPI_API_BASE_URL}/partecipazioni-missione?${searchParams}`, {
		headers: adminHeaders(),
	});
	if (!response.ok) return null;

	const payload = await response.json();
	return (payload?.data?.[0] ?? null) as PartecipazioneRaw | null;
}

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === 'object' && value !== null && !Array.isArray(value);
}

// Estrae lo storico tentativi dal datiRuntime esistente, preservando le altre
// chiavi. Supporta anche il formato legacy a chiavi numeriche ("0", "1", ...).
export function leggiTentativi(datiRuntime: unknown): TentativoMissione[] {
	if (!isRecord(datiRuntime)) return [];

	if (Array.isArray(datiRuntime.tentativi)) {
		return datiRuntime.tentativi.filter(isRecord) as TentativoMissione[];
	}

	const legacy: TentativoMissione[] = [];
	for (const key of Object.keys(datiRuntime).sort()) {
		if (!/^\d+$/.test(key)) continue;
		const entry = datiRuntime[key];
		if (!isRecord(entry)) continue;

		const completamento = Array.isArray(entry.completamento) && isRecord(entry.completamento[0])
			? (entry.completamento[0] as Record<string, boolean>)
			: undefined;

		legacy.push({
			dataTentativo: normalizzaDataIso(String(entry.dataTentativo ?? '')),
			esito: completamento ? Object.values(completamento).every(Boolean) : false,
			risposte: completamento,
		});
	}

	return legacy;
}

// Converte eventuali date legacy DD-MM-YYYY in ISO YYYY-MM-DD.
function normalizzaDataIso(value: string) {
	const legacyMatch = value.match(/^(\d{2})-(\d{2})-(\d{4})$/);
	if (legacyMatch) return `${legacyMatch[3]}-${legacyMatch[2]}-${legacyMatch[1]}`;
	return value;
}

// Registra un tentativo (positivo o negativo) sulla partecipazione missione e,
// al primo esito positivo, eroga premi e verifica il level-up.
export async function registraEsitoProva(args: {
	membro: MembroProgressione;
	missione: MissioneProgressione;
	esito: boolean;
	risposte?: Record<string, boolean>;
	// Chiavi extra da fondere in datiRuntime (es. riferimenti alla nota Grimorio).
	extraRuntime?: Record<string, unknown>;
	// Percentuale di avanzamento per missioni a progressione parziale (es. sfida lettura).
	progresso?: number;
}): Promise<EsitoProgressione | null> {
	const { membro, missione, esito, risposte, extraRuntime, progresso } = args;
	const existing = await getPartecipazione(membro.documentId, missione.documentId);
	const giaCompletata = existing?.stato === 'completata';
	const now = new Date().toISOString();

	const datiRuntimeBase = isRecord(existing?.datiRuntime) ? existing.datiRuntime : {};
	const tentativi = [...leggiTentativi(existing?.datiRuntime), {
		dataTentativo: getTodayRome(),
		esito,
		...(risposte ? { risposte } : {}),
	}];

	// Rimuove le eventuali chiavi numeriche legacy gia migrate nell'array.
	const altreChiavi = Object.fromEntries(
		Object.entries(datiRuntimeBase).filter(([key]) => !/^\d+$/.test(key)),
	);

	const completata = esito || giaCompletata;
	// `progresso` e un campo string su Strapi (percentuale 0-100).
	const payload = {
		stato: completata ? 'completata' : 'inCorso',
		progresso: String(completata ? 100 : (progresso ?? (Number.parseInt(String(existing?.progresso ?? '0'), 10) || 0))),
		dataInizio: existing?.dataInizio || now,
		dataCompletamento: existing?.dataCompletamento || (esito ? now : null),
		datiRuntime: { ...altreChiavi, ...(extraRuntime ?? {}), tentativi },
	};

	const saved = existing
		? await fetch(`${STRAPI_API_BASE_URL}/partecipazioni-missione/${existing.documentId}`, {
			method: 'PUT',
			headers: adminHeaders(),
			body: JSON.stringify({ data: payload }),
		})
		: await fetch(`${STRAPI_API_BASE_URL}/partecipazioni-missione`, {
			method: 'POST',
			headers: adminHeaders(),
			body: JSON.stringify({
				data: {
					...payload,
					membro: { connect: [membro.documentId] },
					missione: { connect: [missione.documentId] },
				},
			}),
		});

	if (!saved.ok) {
		logger.error(`[Progressione] Salvataggio partecipazione fallito (${missione.slug}): ${await saved.text()}`);
		return null;
	}

	const result: EsitoProgressione = {
		esito,
		missioneCompletata: completata,
		primaVolta: esito && !giaCompletata,
		puntiAssegnati: 0,
		trofeiSbloccati: [],
		livelloAggiornato: null,
	};

	if (!result.primaVolta) return result;

	return premiaCompletamento(membro, missione, result);
}

// Eroga trofeo e punti al primo completamento. L'idempotenza e garantita due
// volte: dallo stato della partecipazione e dal controllo membro+trofeo.
async function premiaCompletamento(
	membro: MembroProgressione,
	missione: MissioneProgressione,
	result: EsitoProgressione,
): Promise<EsitoProgressione> {
	let punti = missione.punteggio ?? 0;

	if (missione.trofeo) {
		const nuovo = await assegnaTrofeoSeNuovo(membro.documentId, missione.trofeo.documentId);
		if (nuovo) {
			punti += missione.trofeo.punti ?? 0;
			result.trofeiSbloccati.push({
				documentId: missione.trofeo.documentId,
				nome: missione.trofeo.nome,
				descrizione: missione.trofeo.descrizione,
				immagineUrl: resolveStrapiMediaUrl(missione.trofeo.immagine?.url),
			});
		}
	}

	if (punti > 0) {
		const sommati = await aggiungiPuntiMembro(membro.documentId, punti);
		result.puntiAssegnati = sommati ? punti : 0;
	}

	result.livelloAggiornato = await applicaLevelUp(membro, missione.slug);
	return result;
}

// Crea il Trofeo-membro solo se non esiste gia (membro+trofeo): "solo la prima volta".
export async function assegnaTrofeoSeNuovo(membroDocumentId: string, trofeoDocumentId: string): Promise<boolean> {
	const searchParams = new URLSearchParams();
	searchParams.set('status', 'draft');
	searchParams.set('filters[membri][documentId][$eq]', membroDocumentId);
	searchParams.set('filters[trofeo][documentId][$eq]', trofeoDocumentId);
	searchParams.set('fields[0]', 'dataOttenimento');
	searchParams.set('pagination[pageSize]', '1');

	const existingRes = await fetch(`${STRAPI_API_BASE_URL}/trofei-membro?${searchParams}`, {
		headers: adminHeaders(),
	});
	if (!existingRes.ok) {
		logger.error(`[Progressione] Verifica trofeo-membro fallita: ${await existingRes.text()}`);
		return false;
	}

	const existingPayload = await existingRes.json();
	if (existingPayload?.data?.[0]) return false;

	const createRes = await fetch(`${STRAPI_API_BASE_URL}/trofei-membro`, {
		method: 'POST',
		headers: adminHeaders(),
		body: JSON.stringify({
			data: {
				dataOttenimento: getTodayRome(),
				membri: { connect: [membroDocumentId] },
				trofeo: { connect: [trofeoDocumentId] },
			},
		}),
	});

	if (!createRes.ok) {
		logger.error(`[Progressione] Creazione trofeo-membro fallita: ${await createRes.text()}`);
		return false;
	}

	return true;
}

// Somma punti sul cumulativo Membro.punti rileggendo il valore corrente.
export async function aggiungiPuntiMembro(membroDocumentId: string, punti: number): Promise<boolean> {
	if (punti <= 0) return true;

	const currentRes = await fetch(
		`${STRAPI_API_BASE_URL}/membri/${membroDocumentId}?status=draft&fields[0]=punti`,
		{ headers: adminHeaders() },
	);
	if (!currentRes.ok) return false;

	const currentPayload = await currentRes.json();
	const correnti = Number.parseInt(String(currentPayload?.data?.punti ?? '0'), 10) || 0;

	const updateRes = await fetch(`${STRAPI_API_BASE_URL}/membri/${membroDocumentId}`, {
		method: 'PUT',
		headers: adminHeaders(),
		body: JSON.stringify({ data: { punti: correnti + punti } }),
	});

	if (!updateRes.ok) {
		logger.error(`[Progressione] Aggiornamento punti membro fallito: ${await updateRes.text()}`);
	}

	return updateRes.ok;
}

// Applica il level-up collegato alla missione completata. Idempotente e mai
// degradante: se il Membro e gia al livello target o oltre, non fa nulla.
export async function applicaLevelUp(membro: MembroProgressione, missioneSlug: string): Promise<string | null> {
	const targetSlug = LEVEL_UP_BY_MISSION_SLUG[missioneSlug];
	if (!targetSlug) return null;

	const targetOrder = getLevelOrder({ id: 0, documentId: '', nome: '', slug: targetSlug, ordine: null });
	const currentOrder = getLevelOrder(membro.livello);

	if (targetOrder === null) return null;
	if (currentOrder !== null && currentOrder >= targetOrder) return null;

	const searchParams = new URLSearchParams();
	searchParams.set('status', 'published');
	searchParams.set('filters[slug][$eq]', targetSlug);
	searchParams.set('fields[0]', 'documentId');
	searchParams.set('pagination[pageSize]', '1');

	const levelRes = await fetch(`${STRAPI_API_BASE_URL}/livelli?${searchParams}`, { headers: adminHeaders() });
	if (!levelRes.ok) return null;

	const levelPayload = await levelRes.json();
	const levelDocumentId: string | undefined = levelPayload?.data?.[0]?.documentId;
	if (!levelDocumentId) {
		logger.error(`[Progressione] Livello target ${targetSlug} non trovato su Strapi`);
		return null;
	}

	const updateRes = await fetch(`${STRAPI_API_BASE_URL}/membri/${membro.documentId}`, {
		method: 'PUT',
		headers: adminHeaders(),
		body: JSON.stringify({ data: { livello: { connect: [levelDocumentId] } } }),
	});

	if (!updateRes.ok) {
		logger.error(`[Progressione] Level-up a ${targetSlug} fallito: ${await updateRes.text()}`);
		return null;
	}

	logger.info(`[Progressione] Membro ${membro.documentId} avanzato a ${targetSlug}`);
	return targetSlug;
}
