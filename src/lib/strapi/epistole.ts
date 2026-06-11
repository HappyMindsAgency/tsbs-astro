import { fetchStrapi, type StrapiCollectionResponse } from './client';

type StrapiRelationBase = {
	id: number;
	documentId: string;
};

export type EpistolaAccademia = StrapiRelationBase & {
	nome: string;
	slug: string | null;
};

export type EpistolaCategoria = StrapiRelationBase & {
	nome: string;
	slug: string | null;
};

export type EpistolaStagione = StrapiRelationBase & {
	titolo: string;
	slug: string | null;
};

export type EpistolaLivello = StrapiRelationBase & {
	nome: string;
	slug: string | null;
	ordine: number | null;
};

export type Epistola = {
	id: number;
	documentId: string;
	titolo: string;
	slug: string;
	contenuto: string | null;
	publishedAt?: string | null;
	accademia: EpistolaAccademia | null;
	categorie_epistola: EpistolaCategoria[];
	stagioni: EpistolaStagione[];
	livellos: EpistolaLivello[];
};

function setEpistolaRelations(searchParams: URLSearchParams) {
	// Relazioni predisposte anche se vuote: servono a filtri, badge o logiche narrative future.
	searchParams.set('populate[accademia][fields][0]', 'nome');
	searchParams.set('populate[accademia][fields][1]', 'slug');
	searchParams.set('populate[categorie_epistola][fields][0]', 'nome');
	searchParams.set('populate[categorie_epistola][fields][1]', 'slug');
	searchParams.set('populate[stagioni][fields][0]', 'titolo');
	searchParams.set('populate[stagioni][fields][1]', 'slug');
	searchParams.set('populate[livellos][fields][0]', 'nome');
	searchParams.set('populate[livellos][fields][1]', 'slug');
	searchParams.set('populate[livellos][fields][2]', 'ordine');
}

// Binding della lista epistole /epistole.
export async function getEpistole() {
	const searchParams = new URLSearchParams();
	searchParams.set('status', 'published');
	searchParams.set('sort[0]', 'publishedAt:desc');
	searchParams.set('fields[0]', 'titolo');
	searchParams.set('fields[1]', 'slug');
	searchParams.set('fields[2]', 'contenuto');
	searchParams.set('fields[3]', 'publishedAt');
	searchParams.set('pagination[pageSize]', '100');
	setEpistolaRelations(searchParams);

	const response = await fetchStrapi<StrapiCollectionResponse<Epistola>>('/epistole', searchParams);

	return response.data || [];
}

// Ultima epistola pubblicata — usata nel widget dell'Atrio.
export async function getLastEpistola() {
	const searchParams = new URLSearchParams();
	searchParams.set('status', 'published');
	searchParams.set('sort[0]', 'publishedAt:desc');
	searchParams.set('fields[0]', 'titolo');
	searchParams.set('fields[1]', 'slug');
	searchParams.set('fields[2]', 'contenuto');
	searchParams.set('fields[3]', 'publishedAt');
	searchParams.set('pagination[pageSize]', '1');
	setEpistolaRelations(searchParams);

	const response = await fetchStrapi<StrapiCollectionResponse<Epistola>>('/epistole', searchParams);

	return response.data?.[0] || null;
}

// Binding del dettaglio epistola /epistole/:slug.
export async function getEpistolaBySlug(slug: string) {
	const searchParams = new URLSearchParams();
	searchParams.set('status', 'published');
	searchParams.set('filters[slug][$eq]', slug);
	searchParams.set('fields[0]', 'titolo');
	searchParams.set('fields[1]', 'slug');
	searchParams.set('fields[2]', 'contenuto');
	searchParams.set('fields[3]', 'publishedAt');
	searchParams.set('pagination[pageSize]', '1');
	setEpistolaRelations(searchParams);

	const response = await fetchStrapi<StrapiCollectionResponse<Epistola>>('/epistole', searchParams);

	return response.data?.[0] || null;
}
