import { fetchStrapi, type StrapiCollectionResponse } from './client';

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
