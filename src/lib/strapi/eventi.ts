import { fetchStrapi, type StrapiCollectionResponse } from './client';
import { resolveStrapiMediaUrl } from './trofei';

type StrapiRelationBase = {
	id: number;
	documentId: string;
};

// Media singolo Strapi v5: oggetto appiattito, non { data: { attributes } }.
type StrapiMedia = {
	url: string | null;
	alternativeText?: string | null;
};

export type EventoSociety = StrapiRelationBase & {
	titolo: string;
	slug: string | null;
	descrizione: string | null;
	tipoEvento: string | null;
	dataEvento: string | null;
	luogo: string | null;
	codiceValidazione: string | null;
	publishedAt?: string | null;
	locale?: string | null;
	cover?: StrapiMedia | null;
	coverUrl: string | null;
	coverAlt: string | null;
	missione: (StrapiRelationBase & {
		titolo: string;
		slug: string | null;
		descrizione: string | null;
	}) | null;
};

const STRAPI_LOCALE_BY_LANG: Record<string, string> = {
	it: 'it-IT',
};

function getItalianStrapiLocale(lang = 'it') {
	return STRAPI_LOCALE_BY_LANG[lang] || STRAPI_LOCALE_BY_LANG.it;
}

function setEventoFields(searchParams: URLSearchParams) {
	searchParams.set('fields[0]', 'titolo');
	searchParams.set('fields[1]', 'slug');
	searchParams.set('fields[2]', 'descrizione');
	searchParams.set('fields[3]', 'tipoEvento');
	searchParams.set('fields[4]', 'dataEvento');
	searchParams.set('fields[5]', 'luogo');
	searchParams.set('fields[6]', 'codiceValidazione');
	searchParams.set('fields[7]', 'publishedAt');
	searchParams.set('fields[8]', 'locale');
}

function normalizeEvento(evento: EventoSociety): EventoSociety | null {
	const titolo = evento.titolo?.trim();
	if (!titolo) return null;

	return {
		...evento,
		titolo,
		slug: evento.slug?.trim() || evento.documentId,
		descrizione: evento.descrizione?.trim() || null,
		tipoEvento: evento.tipoEvento?.trim() || null,
		luogo: evento.luogo?.trim() || null,
		codiceValidazione: evento.codiceValidazione?.trim() || null,
		coverUrl: resolveStrapiMediaUrl(evento.cover?.url),
		coverAlt: evento.cover?.alternativeText?.trim() || titolo,
		missione: evento.missione
			? {
					...evento.missione,
					titolo: evento.missione.titolo?.trim() || '',
					slug: evento.missione.slug?.trim() || null,
					descrizione: evento.missione.descrizione?.trim() || null,
				}
			: null,
	};
}

function setEventoRelations(searchParams: URLSearchParams) {
	searchParams.set('populate[missione][fields][0]', 'titolo');
	searchParams.set('populate[missione][fields][1]', 'slug');
	searchParams.set('populate[missione][fields][2]', 'descrizione');
	searchParams.set('populate[cover][fields][0]', 'url');
	searchParams.set('populate[cover][fields][1]', 'alternativeText');
}

export function formatEventoDate(value?: string | null) {
	if (!value) return '';

	const date = new Date(value);
	if (Number.isNaN(date.getTime())) return '';

	const day = new Intl.DateTimeFormat('it-IT', {
		day: '2-digit',
		timeZone: 'Europe/Rome',
	}).format(date);
	const month = new Intl.DateTimeFormat('it-IT', {
		month: 'short',
		timeZone: 'Europe/Rome',
	}).format(date).replace('.', '');

	return `${day} ${month.charAt(0).toLocaleUpperCase('it-IT')}${month.slice(1)}`;
}

export function getEventoSocietyHref(evento: EventoSociety) {
	const slug = evento.slug?.trim() || evento.documentId;
	return `/eventi-biblioteca-classense/${encodeURIComponent(slug)}/`;
}

export async function getEventiSociety(lang = 'it'): Promise<EventoSociety[]> {
	const searchParams = new URLSearchParams();
	searchParams.set('locale', getItalianStrapiLocale(lang));
	searchParams.set('status', 'published');
	searchParams.set('sort[0]', 'dataEvento:asc');
	searchParams.set('sort[1]', 'titolo:asc');
	searchParams.set('pagination[pageSize]', '100');
	setEventoFields(searchParams);
	setEventoRelations(searchParams);

	try {
		const response = await fetchStrapi<StrapiCollectionResponse<EventoSociety>>('/eventi', searchParams);
		return (response.data ?? [])
			.map(normalizeEvento)
			.filter((evento): evento is EventoSociety => Boolean(evento));
	} catch {
		return [];
	}
}

export async function getEventoSocietyBySlug(slug: string, lang = 'it'): Promise<EventoSociety | null> {
	const normalizedSlug = slug.trim();
	if (!normalizedSlug) return null;

	try {
		const response = await fetchStrapi<StrapiCollectionResponse<EventoSociety>>(
			'/eventi',
			buildEventoDetailParams(normalizedSlug, 'slug', lang),
		);
		let rawEvento = response.data?.[0] ?? null;

		if (!rawEvento) {
			const fallbackResponse = await fetchStrapi<StrapiCollectionResponse<EventoSociety>>(
				'/eventi',
				buildEventoDetailParams(normalizedSlug, 'documentId', lang),
			);
			rawEvento = fallbackResponse.data?.[0] ?? null;
		}

		const evento = rawEvento ? normalizeEvento(rawEvento) : null;
		return evento;
	} catch {
		return null;
	}
}

function buildEventoDetailParams(value: string, field: 'slug' | 'documentId', lang = 'it') {
	const searchParams = new URLSearchParams();
	searchParams.set('locale', getItalianStrapiLocale(lang));
	searchParams.set('status', 'published');
	searchParams.set(`filters[${field}][$eq]`, value);
	searchParams.set('pagination[pageSize]', '1');
	setEventoFields(searchParams);
	setEventoRelations(searchParams);
	return searchParams;
}
