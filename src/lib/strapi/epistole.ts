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

export type Epistola = {
	id: number;
	documentId: string;
	titolo: string;
	slug: string;
	contenuto: string | null;
	accademia: EpistolaAccademia | null;
	categorie_epistola: EpistolaCategoria[];
	stagioni: EpistolaStagione[];
};

// Binding del dettaglio epistola /epistole/:slug.
export async function getEpistolaBySlug(slug: string) {
	const searchParams = new URLSearchParams();
	searchParams.set('filters[slug][$eq]', slug);
	searchParams.set('fields[0]', 'titolo');
	searchParams.set('fields[1]', 'slug');
	searchParams.set('fields[2]', 'contenuto');

	// Relazioni predisposte anche se vuote: servono a filtri, badge o logiche narrative future.
	searchParams.set('populate[accademia][fields][0]', 'nome');
	searchParams.set('populate[accademia][fields][1]', 'slug');
	searchParams.set('populate[categorie_epistola][fields][0]', 'nome');
	searchParams.set('populate[categorie_epistola][fields][1]', 'slug');
	searchParams.set('populate[stagioni][fields][0]', 'titolo');
	searchParams.set('populate[stagioni][fields][1]', 'slug');
	searchParams.set('pagination[pageSize]', '1');

	const response = await fetchStrapi<StrapiCollectionResponse<Epistola>>('/epistole', searchParams);

	return response.data?.[0] || null;
}
