import { fetchStrapi, type StrapiCollectionResponse } from './client';
import { getStrapiApiUrl } from './api-url';

type StrapiRelationBase = {
	id: number;
	documentId: string;
};

export type MissioneCategoria = StrapiRelationBase & {
	nome: string;
};

export type MissioneTrofeo = StrapiRelationBase & {
	nome: string;
	descrizione: string | null;
	punti: number | null;
};

export type MissioneLivello = StrapiRelationBase & {
	nome: string;
	slug: string | null;
};

export type MissioneStagione = StrapiRelationBase & {
	titolo: string;
	slug: string | null;
};

export type MissioneLibro = StrapiRelationBase & {
	titolo: string;
	autore: string | null;
};

export type MissionePrecedente = StrapiRelationBase & {
	titolo: string;
	slug: string | null;
};

export type MissioneQuizRisposta = {
	id: number;
	risposta: string | null;
	corretta: boolean | null;
};

export type MissioneQuizDomanda = {
	id: number;
	domanda: string | null;
	risposte: MissioneQuizRisposta[];
};

export type MissioneQuiz = StrapiRelationBase & {
	titolo: string;
	descrizione: string | null;
	sogliaSuperamento: number | null;
	cacciaAlTesoro: boolean;
	domande: MissioneQuizDomanda[];
	step: unknown;
};

export type Missione = StrapiRelationBase & {
	titolo: string;
	slug: string;
	descrizione: string | null;
	tipoFruizione: string | null;
	opzionale: boolean;
	ordine: number | null;
	punteggio: number | null;
	attiva: boolean;
	publishedAt?: string | null;
	locale?: string | null;
	categorie_missione: MissioneCategoria[];
	libro: MissioneLibro | null;
	livello: MissioneLivello | null;
	missione_precedente: MissionePrecedente | null;
	quiz: MissioneQuiz | null;
	trofeo: MissioneTrofeo | null;
	stagione: MissioneStagione | null;
};

export type PartecipazioneMissioneStato = 'daFare' | 'inCorso' | 'completata';

export type PartecipazioneMissione = StrapiRelationBase & {
	stato: PartecipazioneMissioneStato | null;
	progresso: string | null;
	dataInizio: string | null;
	dataCompletamento: string | null;
	datiRuntime: unknown;
	missione: Pick<Missione, 'id' | 'documentId' | 'titolo' | 'slug'> | null;
};

type StrapiUser = {
	id: number;
	email?: string;
};

type MembroMissioni = StrapiRelationBase & {
	email: string | null;
};

const STRAPI_LOCALE_BY_LANG: Record<string, string> = {
	it: 'it-IT',
};

function getItalianStrapiLocale(lang = 'it') {
	return STRAPI_LOCALE_BY_LANG[lang] || STRAPI_LOCALE_BY_LANG.it;
}

function setMissioneFields(searchParams: URLSearchParams) {
	searchParams.set('fields[0]', 'titolo');
	searchParams.set('fields[1]', 'slug');
	searchParams.set('fields[2]', 'descrizione');
	searchParams.set('fields[3]', 'tipoFruizione');
	searchParams.set('fields[4]', 'opzionale');
	searchParams.set('fields[5]', 'ordine');
	searchParams.set('fields[6]', 'punteggio');
	searchParams.set('fields[7]', 'attiva');
	searchParams.set('fields[8]', 'publishedAt');
	searchParams.set('fields[9]', 'locale');
}

function setMissioneRelations(searchParams: URLSearchParams) {
	searchParams.set('populate[categorie_missione][fields][0]', 'nome');
	searchParams.set('populate[libro][fields][0]', 'titolo');
	searchParams.set('populate[libro][fields][1]', 'autore');
	searchParams.set('populate[livello][fields][0]', 'nome');
	searchParams.set('populate[livello][fields][1]', 'slug');
	searchParams.set('populate[missione_precedente][fields][0]', 'titolo');
	searchParams.set('populate[missione_precedente][fields][1]', 'slug');
	searchParams.set('populate[quiz][fields][0]', 'titolo');
	searchParams.set('populate[quiz][fields][1]', 'descrizione');
	searchParams.set('populate[quiz][fields][2]', 'sogliaSuperamento');
	searchParams.set('populate[quiz][fields][3]', 'cacciaAlTesoro');
	searchParams.set('populate[quiz][populate][domande][populate][risposte]', 'true');
	searchParams.set('populate[quiz][populate][step][populate]', '*');
	searchParams.set('populate[trofeo][fields][0]', 'nome');
	searchParams.set('populate[trofeo][fields][1]', 'descrizione');
	searchParams.set('populate[trofeo][fields][2]', 'punti');
	searchParams.set('populate[stagione][fields][0]', 'titolo');
	searchParams.set('populate[stagione][fields][1]', 'slug');
}

function setMissioneListRelations(searchParams: URLSearchParams) {
	searchParams.set('populate[categorie_missione][fields][0]', 'nome');
	searchParams.set('populate[livello][fields][0]', 'nome');
	searchParams.set('populate[livello][fields][1]', 'slug');
	searchParams.set('populate[missione_precedente][fields][0]', 'titolo');
	searchParams.set('populate[missione_precedente][fields][1]', 'slug');
}

function normalizeMissione(missione: Missione): Missione {
	return {
		...missione,
		titolo: missione.titolo.trim(),
		slug: missione.slug.trim(),
	};
}

export async function getMissioneBySlug(slug: string, lang = 'it') {
	const searchParams = new URLSearchParams();
	searchParams.set('locale', getItalianStrapiLocale(lang));
	searchParams.set('status', 'published');
	searchParams.set('filters[slug][$eq]', slug);
	searchParams.set('filters[attiva][$eq]', 'true');
	searchParams.set('pagination[pageSize]', '1');
	setMissioneFields(searchParams);
	setMissioneRelations(searchParams);

	const response = await fetchStrapi<StrapiCollectionResponse<Missione>>('/missioni', searchParams);
	const missione = response.data?.[0];

	return missione ? normalizeMissione(missione) : null;
}

export async function getMissioniAttive(lang = 'it') {
	const searchParams = new URLSearchParams();
	searchParams.set('locale', getItalianStrapiLocale(lang));
	searchParams.set('status', 'published');
	searchParams.set('filters[attiva][$eq]', 'true');
	searchParams.set('pagination[pageSize]', '100');
	searchParams.set('sort[0]', 'ordine:asc');
	searchParams.set('sort[1]', 'publishedAt:asc');
	setMissioneFields(searchParams);
	setMissioneListRelations(searchParams);

	const response = await fetchStrapi<StrapiCollectionResponse<Missione>>('/missioni', searchParams);
	return (response.data ?? []).map(normalizeMissione);
}

export async function getPartecipazioniMissioneByJwt(jwt: string, lang = 'it') {
	const membro = await getCurrentMembroMissioniFromJwt(jwt);
	if (!membro) return [];

	return getPartecipazioniMissioneByMembro(membro.documentId, lang);
}

async function getCurrentMembroMissioniFromJwt(jwt: string) {
	const apiBaseUrl = getStrapiApiUrl();
	const userResponse = await fetch(`${apiBaseUrl}/users/me`, {
		headers: { Authorization: `Bearer ${jwt}`, 'Content-Type': 'application/json' },
	});

	if (!userResponse.ok) return null;

	const user = (await userResponse.json()) as StrapiUser;
	if (!user.email) return null;

	const searchParams = new URLSearchParams();
	searchParams.set('status', 'draft');
	searchParams.set('filters[email][$eq]', user.email);
	searchParams.set('fields[0]', 'email');
	searchParams.set('pagination[pageSize]', '1');

	const membroResponse = await fetch(`${apiBaseUrl}/membri?${searchParams}`, {
		headers: { Authorization: `Bearer ${import.meta.env.AUTH_READONLY}`, 'Content-Type': 'application/json' },
	});

	if (!membroResponse.ok) return null;

	const membroPayload = (await membroResponse.json()) as StrapiCollectionResponse<MembroMissioni>;
	return membroPayload.data?.[0] ?? null;
}

async function getPartecipazioniMissioneByMembro(membroDocumentId: string, lang = 'it') {
	const searchParams = new URLSearchParams();
	searchParams.set('locale', getItalianStrapiLocale(lang));
	searchParams.set('status', 'draft');
	searchParams.set('filters[membro][documentId][$eq]', membroDocumentId);
	searchParams.set('pagination[pageSize]', '100');
	searchParams.set('fields[0]', 'stato');
	searchParams.set('fields[1]', 'progresso');
	searchParams.set('fields[2]', 'dataInizio');
	searchParams.set('fields[3]', 'dataCompletamento');
	searchParams.set('fields[4]', 'datiRuntime');
	searchParams.set('populate[missione][fields][0]', 'titolo');
	searchParams.set('populate[missione][fields][1]', 'slug');

	const response = await fetchStrapi<StrapiCollectionResponse<PartecipazioneMissione>>('/partecipazioni-missione', searchParams);
	return response.data ?? [];
}
