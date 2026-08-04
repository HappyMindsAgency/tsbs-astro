import { fetchStrapi } from './client';
import { resolveStrapiMediaUrl } from './trofei';

type StrapiSingleResponse<T> = {
	data?: T | T[] | null;
};

type StrapiMedia = {
	url?: string | null;
	alternativeText?: string | null;
};

type StrapiMappaModale = {
	id?: number;
	titolo?: unknown;
	contenuto?: unknown;
	piano?: unknown;
	posizione?: unknown;
	immagine?: StrapiMedia | null;
};

type StrapiMappa = {
	titolo?: unknown;
	modali?: StrapiMappaModale[] | null;
};

export type MappaPiano = 'piano-terra' | 'piano-primo' | 'piano-secondo';

export type MappaHotspot = {
	id: string;
	piano: MappaPiano;
	x: number;
	y: number;
	titolo: string;
	contenuto: string;
	immagineUrl: string | null;
	immagineAlt: string;
};

export type MappaContent = {
	titolo: string;
	hotspots: MappaHotspot[];
};

const STRAPI_LOCALE_BY_LANG: Record<string, string> = {
	it: 'it-IT',
};

const PIANO_BY_STRAPI_VALUE: Record<string, MappaPiano> = {
	zero: 'piano-terra',
	uno: 'piano-primo',
	due: 'piano-secondo',
};

function getItalianStrapiLocale(lang = 'it') {
	return STRAPI_LOCALE_BY_LANG[lang] || STRAPI_LOCALE_BY_LANG.it;
}

function getSingleData<T>(data?: T | T[] | null) {
	return Array.isArray(data) ? data[0] || null : data || null;
}

function toPlainText(value: unknown): string {
	if (typeof value === 'string') return value.trim();
	if (typeof value === 'number') return String(value);
	if (Array.isArray(value)) return value.map(toPlainText).filter(Boolean).join('\n').trim();

	if (value && typeof value === 'object') {
		const record = value as Record<string, unknown>;
		if (typeof record.text === 'string') return record.text.trim();
		if (Array.isArray(record.children)) return toPlainText(record.children);
	}

	return '';
}

function parseCoordinatePair(value: unknown) {
	if (typeof value !== 'string') return null;

	const values = value.split(',').map((item) => Number(item.trim()));
	if (values.length !== 2 || values.some((item) => !Number.isFinite(item))) return null;

	const [x, y] = values;
	if (x < 0 || x > 100 || y < 0 || y > 100) return null;

	return { x, y };
}

function normalizeHotspot(modale: StrapiMappaModale, index: number): MappaHotspot | null {
	const piano = PIANO_BY_STRAPI_VALUE[toPlainText(modale.piano).toLowerCase()];
	const coordinate = parseCoordinatePair(modale.posizione);
	const titolo = toPlainText(modale.titolo);

	if (!piano || !coordinate || !titolo) return null;

	return {
		id: `mappa-hotspot-${modale.id ?? index}`,
		piano,
		...coordinate,
		titolo,
		contenuto: toPlainText(modale.contenuto),
		immagineUrl: resolveStrapiMediaUrl(modale.immagine?.url),
		immagineAlt: modale.immagine?.alternativeText?.trim() || titolo,
	};
}

export async function getMappaContent(lang = 'it'): Promise<MappaContent> {
	const searchParams = new URLSearchParams();
	searchParams.set('locale', getItalianStrapiLocale(lang));
	searchParams.set('status', 'published');
	searchParams.set('fields[0]', 'titolo');
	searchParams.set('populate[modali][fields][0]', 'titolo');
	searchParams.set('populate[modali][fields][1]', 'contenuto');
	searchParams.set('populate[modali][fields][2]', 'piano');
	searchParams.set('populate[modali][fields][3]', 'posizione');
	searchParams.set('populate[modali][populate][immagine][fields][0]', 'url');
	searchParams.set('populate[modali][populate][immagine][fields][1]', 'alternativeText');

	try {
		const response = await fetchStrapi<StrapiSingleResponse<StrapiMappa>>('/mappa', searchParams);
		const mappa = getSingleData(response.data);

		return {
			titolo: toPlainText(mappa?.titolo),
			hotspots: (mappa?.modali ?? [])
				.map(normalizeHotspot)
				.filter((hotspot): hotspot is MappaHotspot => Boolean(hotspot)),
		};
	} catch {
		return { titolo: '', hotspots: [] };
	}
}
