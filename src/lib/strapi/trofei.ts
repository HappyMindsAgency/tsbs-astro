import { fetchStrapi, type StrapiCollectionResponse } from './client';
import { getStrapiApiUrl } from './api-url';

type StrapiRelationBase = {
	id: number;
	documentId: string;
};

type StrapiUser = {
	id: number;
	email?: string;
};

type MembroTrofei = StrapiRelationBase & {
	email: string | null;
	datiAggiuntivi: Record<string, unknown> | null;
};

// Media singolo Strapi v5: oggetto appiattito, non { data: { attributes } }.
type StrapiMedia = {
	url: string | null;
	alternativeText?: string | null;
};

type TrofeoRelazione = StrapiRelationBase & {
	nome: string;
	descrizione: string | null;
	punti: number | null;
	// Enumeration Strapi con la forma "Tetris" del trofeo (es. punto, quadrato, elle).
	forma: string | null;
	immagine: StrapiMedia | null;
};

// Record di raccordo membro <-> trofeo ottenuto.
type TrofeoMembroRaw = StrapiRelationBase & {
	dataOttenimento: string | null;
	trofeo: TrofeoRelazione | null;
};

// Forma del trofeo conquistato esposta alla pagina Stanza Trofei.
export type TrofeoConquistato = {
	documentId: string;
	trofeoDocumentId: string;
	nome: string;
	descrizione: string | null;
	punti: number | null;
	forma: string | null;
	immagineUrl: string | null;
	dataOttenimento: string | null;
};

// Singolo trofeo posizionato dall'utente sulla griglia: id del Trofeo + cella (riga/colonna).
// Forma e immagine non si salvano: si ricavano dal catalogo tramite l'id.
export type TrofeoLayoutItem = {
	id: string;
	row: number;
	col: number;
};

// Dati della Stanza Trofei: trofei conquistati + disposizione salvata dall'utente.
export type TrofeiStanza = {
	trofei: TrofeoConquistato[];
	layout: TrofeoLayoutItem[];
};

// Chiave usata dentro `Membro.datiAggiuntivi` per la disposizione della griglia trofei.
export const TROFEI_LAYOUT_KEY = 'trofeiLayout';

// Costruisce un URL media assoluto: Strapi Cloud puo restituire URL gia assoluti o path relativi.
export function resolveStrapiMediaUrl(url: string | null | undefined): string | null {
	if (!url) return null;
	if (/^https?:\/\//i.test(url)) return url;

	const origin = getStrapiApiUrl().replace(/\/api$/, '');
	return `${origin}${url.startsWith('/') ? '' : '/'}${url}`;
}

// Risolve il Membro loggato a partire dal JWT, come in missioni.ts (email + token readonly).
async function getCurrentMembroFromJwt(jwt: string) {
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
	searchParams.set('fields[1]', 'datiAggiuntivi');
	searchParams.set('pagination[pageSize]', '1');

	const membroResponse = await fetch(`${apiBaseUrl}/membri?${searchParams}`, {
		headers: { Authorization: `Bearer ${import.meta.env.AUTH_READONLY}`, 'Content-Type': 'application/json' },
	});

	if (!membroResponse.ok) return null;

	const membroPayload = (await membroResponse.json()) as StrapiCollectionResponse<MembroTrofei>;
	return membroPayload.data?.[0] ?? null;
}

function normalizeTrofeoConquistato(record: TrofeoMembroRaw): TrofeoConquistato | null {
	const trofeo = record.trofeo;
	if (!trofeo) return null;

	return {
		documentId: record.documentId,
		trofeoDocumentId: trofeo.documentId,
		nome: trofeo.nome.trim(),
		descrizione: trofeo.descrizione,
		punti: trofeo.punti,
		forma: trofeo.forma ?? null,
		immagineUrl: resolveStrapiMediaUrl(trofeo.immagine?.url),
		dataOttenimento: record.dataOttenimento,
	};
}

async function getTrofeiConquistatiByMembro(membroDocumentId: string) {
	const searchParams = new URLSearchParams();
	// Nessun filtro `locale`: il raccordo trofeo-membro non ha campi localizzati, e vincolarlo
	// a it-IT escluderebbe i record creati in altri locale. La localizzazione dei dati mostrati
	// (nome/descrizione) resta sul Trofeo collegato.
	// Coerente con le partecipazioni missione: i record personali di gioco sono in draft.
	searchParams.set('status', 'draft');
	searchParams.set('filters[membri][documentId][$eq]', membroDocumentId);
	searchParams.set('sort[0]', 'dataOttenimento:asc');
	searchParams.set('pagination[pageSize]', '100');
	searchParams.set('fields[0]', 'dataOttenimento');
	searchParams.set('populate[trofeo][fields][0]', 'nome');
	searchParams.set('populate[trofeo][fields][1]', 'descrizione');
	searchParams.set('populate[trofeo][fields][2]', 'punti');
	searchParams.set('populate[trofeo][fields][3]', 'forma');
	searchParams.set('populate[trofeo][populate][immagine][fields][0]', 'url');
	searchParams.set('populate[trofeo][populate][immagine][fields][1]', 'alternativeText');

	const response = await fetchStrapi<StrapiCollectionResponse<TrofeoMembroRaw>>('/trofei-membro', searchParams);

	return (response.data ?? [])
		.map(normalizeTrofeoConquistato)
		.filter((trofeo): trofeo is TrofeoConquistato => trofeo !== null);
}

// Valida la disposizione salvata: scarta voci malformate, mantiene solo id/row/col coerenti.
function sanitizeLayout(value: unknown): TrofeoLayoutItem[] {
	if (!Array.isArray(value)) return [];

	return value.flatMap((item) => {
		if (!item || typeof item !== 'object') return [];
		const { id, row, col } = item as Record<string, unknown>;
		if (typeof id !== 'string' || typeof row !== 'number' || typeof col !== 'number') return [];
		return [{ id, row, col }];
	});
}

// Punto d'ingresso della pagina: trofei conquistati dal membro loggato + layout salvato.
export async function getTrofeiStanzaByJwt(jwt: string | undefined): Promise<TrofeiStanza> {
	if (!jwt) return { trofei: [], layout: [] };

	const membro = await getCurrentMembroFromJwt(jwt);
	if (!membro) return { trofei: [], layout: [] };

	const trofei = await getTrofeiConquistatiByMembro(membro.documentId);
	const layout = sanitizeLayout(membro.datiAggiuntivi?.[TROFEI_LAYOUT_KEY]);

	return { trofei, layout };
}
