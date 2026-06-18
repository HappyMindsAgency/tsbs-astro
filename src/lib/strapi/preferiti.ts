import { getStrapiApiUrl } from './api-url';
import { resolveAvatarSrc } from '../avatar';

type StrapiRecord = {
	id: number;
	documentId: string;
};

type StrapiUser = {
	id: number;
};

type MembroPreferitoRaw = StrapiRecord & {
	nickname?: string | null;
	punti?: number | null;
	accademia?: {
		nome?: string | null;
		slug?: string | null;
	} | null;
	livello?: {
		nome?: string | null;
	} | null;
	datiAggiuntivi?: Record<string, unknown> | null;
};

type MembroWithFavorites = MembroPreferitoRaw & {
	membri_preferiti?: MembroPreferitoRaw[] | null;
};

export type ProfiloPreferito = {
	id: string;
	name: string;
	initials: string;
	avatarSrc: string | null;
	points: number;
	academy: string;
	academyLabel: string;
	rankLabel: string;
	href: string;
};

const STRAPI_API_BASE_URL = getStrapiApiUrl();
const STRAPI_API = import.meta.env.AUTH_READONLY;

function adminHeaders() {
	return { Authorization: `Bearer ${STRAPI_API}`, 'Content-Type': 'application/json' };
}

async function getCurrentUser(jwt: string) {
	const response = await fetch(`${STRAPI_API_BASE_URL}/users/me`, {
		headers: { Authorization: `Bearer ${jwt}`, 'Content-Type': 'application/json' },
	});

	if (!response.ok) return null;
	return (await response.json()) as StrapiUser;
}

function setMembroFields(searchParams: URLSearchParams) {
	searchParams.set('fields[0]', 'nickname');
	searchParams.set('fields[1]', 'punti');
	searchParams.set('fields[2]', 'datiAggiuntivi');
	searchParams.set('populate[accademia][fields][0]', 'nome');
	searchParams.set('populate[accademia][fields][1]', 'slug');
	searchParams.set('populate[livello][fields][0]', 'nome');
}

function setFavoritePopulate(searchParams: URLSearchParams) {
	searchParams.set('fields[0]', 'nickname');
	searchParams.set('fields[1]', 'punti');
	searchParams.set('populate[membri_preferiti][fields][0]', 'nickname');
	searchParams.set('populate[membri_preferiti][fields][1]', 'punti');
	searchParams.set('populate[membri_preferiti][populate][accademia][fields][0]', 'nome');
	searchParams.set('populate[membri_preferiti][populate][accademia][fields][1]', 'slug');
	searchParams.set('populate[membri_preferiti][populate][livello][fields][0]', 'nome');
}

export function mapMembroToProfiloPreferito(membro: MembroPreferitoRaw): ProfiloPreferito {
	const name = membro.nickname?.trim() || 'Membro';
	const academy = membro.accademia?.slug?.trim() || 'arborea';
	const academyLabel = membro.accademia?.nome?.trim() || 'Accademia';
	const levelLabel = membro.livello?.nome?.trim() || 'Membro';
	const points = membro.punti ?? 0;

	return {
		id: membro.documentId,
		name,
		initials: name.slice(0, 1).toLocaleUpperCase('it-IT'),
		avatarSrc: resolveAvatarSrc(membro.datiAggiuntivi?.avatar),
		points,
		academy,
		academyLabel,
		rankLabel: `${levelLabel} - ${points} punti`,
		href: `/scrivania/utenti-preferiti/esploso-profilo-utente/?membro=${encodeURIComponent(membro.documentId)}`,
	};
}

export async function getCurrentMembroWithFavorites(jwt: string) {
	const user = await getCurrentUser(jwt);
	if (!user) return null;

	const searchParams = new URLSearchParams();
	searchParams.set('filters[user][id][$eq]', String(user.id));
	searchParams.set('pagination[pageSize]', '1');
	setFavoritePopulate(searchParams);

	const response = await fetch(`${STRAPI_API_BASE_URL}/membri?${searchParams}`, { headers: adminHeaders() });
	if (!response.ok) return null;

	const payload = await response.json();
	return (payload?.data?.[0] ?? null) as MembroWithFavorites | null;
}

export async function getFavoriteProfilesByJwt(jwt: string) {
	const membro = await getCurrentMembroWithFavorites(jwt);
	if (!membro) return [];

	return (membro.membri_preferiti ?? []).map(mapMembroToProfiloPreferito);
}

export async function getFavoriteIdsByJwt(jwt: string) {
	const favorites = await getFavoriteProfilesByJwt(jwt);
	return favorites.map((profile) => profile.id);
}

async function getMembroByDocumentId(documentId: string) {
	const searchParams = new URLSearchParams();
	searchParams.set('filters[documentId][$eq]', documentId);
	searchParams.set('pagination[pageSize]', '1');
	setMembroFields(searchParams);

	const response = await fetch(`${STRAPI_API_BASE_URL}/membri?${searchParams}`, { headers: adminHeaders() });
	if (!response.ok) return null;

	const payload = await response.json();
	return (payload?.data?.[0] ?? null) as MembroPreferitoRaw | null;
}

async function getFirstPublicProfileExcept(currentMembroDocumentId: string) {
	const searchParams = new URLSearchParams();
	searchParams.set('filters[documentId][$ne]', currentMembroDocumentId);
	searchParams.set('sort[0]', 'punti:desc');
	searchParams.set('pagination[pageSize]', '1');
	setMembroFields(searchParams);

	const response = await fetch(`${STRAPI_API_BASE_URL}/membri?${searchParams}`, { headers: adminHeaders() });
	if (!response.ok) return null;

	const payload = await response.json();
	return (payload?.data?.[0] ?? null) as MembroPreferitoRaw | null;
}

export async function getProfileDetailByJwt(jwt: string, profileDocumentId?: string | null) {
	const currentMembro = await getCurrentMembroWithFavorites(jwt);
	if (!currentMembro) return null;

	const requestedProfileId = profileDocumentId?.trim();
	const target = requestedProfileId
		? await getMembroByDocumentId(requestedProfileId)
		: await getFirstPublicProfileExcept(currentMembro.documentId);

	if (!target || target.documentId === currentMembro.documentId) return null;

	const favoriteIds = new Set((currentMembro.membri_preferiti ?? []).map((favorite) => favorite.documentId));

	return {
		...mapMembroToProfiloPreferito(target),
		isFavorite: favoriteIds.has(target.documentId),
	};
}

export async function updateFavoriteByJwt(jwt: string, profileDocumentId: string, action: 'add' | 'remove') {
	const currentMembro = await getCurrentMembroWithFavorites(jwt);
	if (!currentMembro) return { ok: false as const, status: 404, error: 'membro_not_found' };

	const target = await getMembroByDocumentId(profileDocumentId);
	if (!target) return { ok: false as const, status: 404, error: 'profile_not_found' };
	if (target.documentId === currentMembro.documentId) return { ok: false as const, status: 400, error: 'self_favorite_not_allowed' };

	const relationAction = action === 'add' ? 'connect' : 'disconnect';
	const response = await fetch(`${STRAPI_API_BASE_URL}/membri/${currentMembro.documentId}`, {
		method: 'PUT',
		headers: adminHeaders(),
		body: JSON.stringify({
			data: {
				membri_preferiti: {
					[relationAction]: [target.documentId],
				},
			},
		}),
	});

	if (!response.ok) {
		return { ok: false as const, status: response.status, error: 'update_failed' };
	}

	const favoriteIds = await getFavoriteIdsByJwt(jwt);
	return { ok: true as const, favoriteIds };
}
