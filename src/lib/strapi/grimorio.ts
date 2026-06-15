import { marked } from 'marked';
import { fetchStrapi, type StrapiCollectionResponse } from './client';

type StrapiRelationBase = {
	id: number;
	documentId: string;
};

export type GrimorioCategoria = StrapiRelationBase & {
	nome: string;
	slug: string | null;
};

export type GrimorioAccademia = StrapiRelationBase & {
	nome: string;
	slug: string | null;
};

export type GrimorioMembro = StrapiRelationBase & {
	nickname: string | null;
};

export type GrimorioNota = StrapiRelationBase & {
	titolo: string;
	slug: string;
	contenuto: string | null;
	visibilePubblico: boolean;
	publishedAt?: string | null;
	locale?: string | null;
	categorie_grimorio: GrimorioCategoria[];
	accademia: GrimorioAccademia | null;
	membro: GrimorioMembro | null;
};

type StrapiUser = {
	id: number;
};

type StrapiMembro = StrapiRelationBase & {
	nickname?: string | null;
};

const STRAPI_LOCALE_BY_LANG: Record<string, string> = {
	it: 'it-IT',
};

function getStrapiApiBaseUrl() {
	const rawBaseUrl = import.meta.env.STRAPI_API_URL || import.meta.env.STRAPI_URL;

	if (!rawBaseUrl) {
		throw new Error('STRAPI_API_URL or STRAPI_URL is required.');
	}

	const baseUrl = String(rawBaseUrl).replace(/\/+$/, '');
	return baseUrl.endsWith('/api') ? baseUrl : `${baseUrl}/api`;
}

function getItalianStrapiLocale(lang = 'it') {
	return STRAPI_LOCALE_BY_LANG[lang] || STRAPI_LOCALE_BY_LANG.it;
}

function setGrimorioFields(searchParams: URLSearchParams) {
	searchParams.set('fields[0]', 'titolo');
	searchParams.set('fields[1]', 'slug');
	searchParams.set('fields[2]', 'contenuto');
	searchParams.set('fields[3]', 'visibilePubblico');
	searchParams.set('fields[4]', 'publishedAt');
	searchParams.set('fields[5]', 'locale');
}

function setGrimorioRelations(searchParams: URLSearchParams) {
	searchParams.set('populate[categorie_grimorio][fields][0]', 'nome');
	searchParams.set('populate[categorie_grimorio][fields][1]', 'slug');
	searchParams.set('populate[accademia][fields][0]', 'nome');
	searchParams.set('populate[accademia][fields][1]', 'slug');
	searchParams.set('populate[membro][fields][0]', 'nickname');
}

function normalizeNota(nota: GrimorioNota): GrimorioNota {
	return {
		...nota,
		titolo: nota.titolo.trim(),
		slug: nota.slug.trim(),
	};
}

export function getGrimorioExcerpt(contenuto: string | null, maxLength = 130) {
	if (!contenuto) return '';

	const html = marked.parse(contenuto, { async: false });
	const text = String(html)
		.replace(/<[^>]*>/g, ' ')
		.replace(/\s+/g, ' ')
		.trim();

	return text.length > maxLength ? `${text.slice(0, maxLength).trim()}...` : text;
}

export function formatGrimorioDate(value?: string | null) {
	if (!value) return '';

	const date = new Date(value);
	if (Number.isNaN(date.getTime())) return '';

	return new Intl.DateTimeFormat('it-IT', {
		day: 'numeric',
		month: 'long',
		year: 'numeric',
	}).format(date);
}

export function getGrimorioVisibilityLabel(visibilePubblico: boolean) {
	return visibilePubblico ? 'Pubblica' : 'Privata';
}

export function getGrimorioCategorySlug(nota: Pick<GrimorioNota, 'categorie_grimorio'>) {
	return nota.categorie_grimorio.find((categoria) => categoria.slug === 'salvata' || categoria.slug === 'inviata')?.slug ?? null;
}

export function getGrimorioStateLabel(nota: Pick<GrimorioNota, 'categorie_grimorio' | 'visibilePubblico'>) {
	if (nota.visibilePubblico) return 'Pubblica';

	const categorySlug = getGrimorioCategorySlug(nota);
	if (categorySlug === 'inviata') return 'In attesa di approvazione';
	if (categorySlug === 'salvata') return 'Salvata';

	return getGrimorioVisibilityLabel(nota.visibilePubblico);
}

export function getGrimorioAuthorLabel(nota: Pick<GrimorioNota, 'membro'>) {
	return nota.membro?.nickname?.trim() || 'Classense';
}

export function getGrimorioChronicleMeta(nota: Pick<GrimorioNota, 'publishedAt' | 'membro' | 'visibilePubblico'>) {
	const dateLabel = formatGrimorioDate(nota.publishedAt);
	const authorLabel = getGrimorioAuthorLabel(nota);
	const stateLabel = getGrimorioVisibilityLabel(nota.visibilePubblico);
	const labels = [dateLabel, authorLabel, stateLabel].filter(Boolean);

	return labels.join(' • ');
}

export function getGrimorioPublicNoteHref(nota: Pick<GrimorioNota, 'slug'>) {
	return `/scrivania/grimorio/pubblicate/${nota.slug}/`;
}

export async function getCurrentMembroFromJwt(jwt: string) {
	const apiBaseUrl = getStrapiApiBaseUrl();
	const userResponse = await fetch(`${apiBaseUrl}/users/me`, {
		headers: {
			Accept: 'application/json',
			Authorization: `Bearer ${jwt}`,
		},
	});

	if (!userResponse.ok) {
		return null;
	}

	const user = (await userResponse.json()) as StrapiUser;
	const searchParams = new URLSearchParams();
	searchParams.set('filters[user][id][$eq]', String(user.id));
	searchParams.set('fields[0]', 'nickname');
	searchParams.set('pagination[pageSize]', '1');

	const membriResponse = await fetchStrapi<StrapiCollectionResponse<StrapiMembro>>('/membri', searchParams);

	return membriResponse.data?.[0] || null;
}

export async function getGrimorioNotePubbliche(lang = 'it') {
	const searchParams = new URLSearchParams();
	searchParams.set('locale', getItalianStrapiLocale(lang));
	searchParams.set('status', 'published');
	searchParams.set('filters[visibilePubblico][$eq]', 'true');
	searchParams.set('sort[0]', 'publishedAt:desc');
	searchParams.set('pagination[pageSize]', '100');
	setGrimorioFields(searchParams);
	setGrimorioRelations(searchParams);

	const response = await fetchStrapi<StrapiCollectionResponse<GrimorioNota>>('/grimori', searchParams);

	return (response.data || []).map(normalizeNota);
}

export async function getGrimorioNoteByMembro(membroDocumentId: string, lang = 'it') {
	const searchParams = new URLSearchParams();
	searchParams.set('locale', getItalianStrapiLocale(lang));
	searchParams.set('status', 'published');
	searchParams.set('filters[membro][documentId][$eq]', membroDocumentId);
	searchParams.set('sort[0]', 'publishedAt:desc');
	searchParams.set('pagination[pageSize]', '100');
	setGrimorioFields(searchParams);
	setGrimorioRelations(searchParams);

	const response = await fetchStrapi<StrapiCollectionResponse<GrimorioNota>>('/grimori', searchParams);

	return (response.data || []).map(normalizeNota);
}

export async function getGrimorioNotaBySlugForMembro(slug: string, membroDocumentId: string, lang = 'it') {
	const searchParams = new URLSearchParams();
	searchParams.set('locale', getItalianStrapiLocale(lang));
	searchParams.set('status', 'published');
	searchParams.set('filters[slug][$eq]', slug);
	searchParams.set('filters[membro][documentId][$eq]', membroDocumentId);
	searchParams.set('pagination[pageSize]', '1');
	setGrimorioFields(searchParams);
	setGrimorioRelations(searchParams);

	const response = await fetchStrapi<StrapiCollectionResponse<GrimorioNota>>('/grimori', searchParams);
	const nota = response.data?.[0];

	return nota ? normalizeNota(nota) : null;
}

export async function getGrimorioNotaPubblicaBySlug(slug: string, lang = 'it') {
	const searchParams = new URLSearchParams();
	searchParams.set('locale', getItalianStrapiLocale(lang));
	searchParams.set('status', 'published');
	searchParams.set('filters[slug][$eq]', slug);
	searchParams.set('filters[visibilePubblico][$eq]', 'true');
	searchParams.set('pagination[pageSize]', '1');
	setGrimorioFields(searchParams);
	setGrimorioRelations(searchParams);

	const response = await fetchStrapi<StrapiCollectionResponse<GrimorioNota>>('/grimori', searchParams);
	const nota = response.data?.[0];

	return nota ? normalizeNota(nota) : null;
}
