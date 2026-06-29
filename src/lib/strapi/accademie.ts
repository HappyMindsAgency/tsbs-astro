import { getStrapiApiUrl } from './api-url';
import { resolveAvatarSrc } from '../avatar';
import { withReturnTo } from '../navigation';

type StrapiCountResponse = {
	data?: unknown[];
	meta?: {
		pagination?: {
			total?: number;
		};
	};
};

type StrapiUser = {
	id: number;
};

type MembroRankingRaw = {
	documentId: string;
	nickname?: string | null;
	punti?: number | string | null;
	datiAggiuntivi?: Record<string, unknown> | null;
};

type StrapiMembersResponse = {
	data?: MembroRankingRaw[];
};

export type AcademyRankingRow = {
	documentId: string;
	position: string;
	medal?: 'gold' | 'silver' | 'bronze';
	initials: string;
	avatarSrc: string | null;
	name: string;
	points: number;
	current: boolean;
	href: string;
};

const STRAPI_API_BASE_URL = getStrapiApiUrl();
const STRAPI_API = import.meta.env.AUTH_READONLY;

const headers = {
	Authorization: `Bearer ${STRAPI_API}`,
	'Content-Type': 'application/json',
};

export async function getAcademyMembersCount(accademiaSlug: string): Promise<number> {
	const slug = accademiaSlug.trim();
	if (!slug) return 0;

	const searchParams = new URLSearchParams();
	searchParams.set('filters[accademia][slug][$eq]', slug);
	searchParams.set('fields[0]', 'id');
	searchParams.set('pagination[pageSize]', '1');
	searchParams.set('status', 'draft');

	try {
		const response = await fetch(`${STRAPI_API_BASE_URL}/membri?${searchParams}`, { headers });
		if (!response.ok) return 0;

		const payload = (await response.json()) as StrapiCountResponse;
		return payload.meta?.pagination?.total ?? payload.data?.length ?? 0;
	} catch {
		return 0;
	}
}

async function getCurrentMembroDocumentId(jwt: string | undefined): Promise<string | null> {
	if (!jwt) return null;

	try {
		const userResponse = await fetch(`${STRAPI_API_BASE_URL}/users/me`, {
			headers: { Authorization: `Bearer ${jwt}`, 'Content-Type': 'application/json' },
		});
		if (!userResponse.ok) return null;

		const user = (await userResponse.json()) as StrapiUser;
		const searchParams = new URLSearchParams();
		searchParams.set('filters[user][id][$eq]', String(user.id));
		searchParams.set('fields[0]', 'documentId');
		searchParams.set('pagination[pageSize]', '1');
		searchParams.set('status', 'draft');

		const membroResponse = await fetch(`${STRAPI_API_BASE_URL}/membri?${searchParams}`, { headers });
		if (!membroResponse.ok) return null;

		const payload = (await membroResponse.json()) as StrapiMembersResponse;
		return payload.data?.[0]?.documentId ?? null;
	} catch {
		return null;
	}
}

function getMedalByIndex(index: number): AcademyRankingRow['medal'] {
	if (index === 0) return 'gold';
	if (index === 1) return 'silver';
	if (index === 2) return 'bronze';
	return undefined;
}

function getPositionLabel(index: number): string {
	if (index === 0) return 'I';
	if (index === 1) return 'II';
	if (index === 2) return 'III';
	return String(index + 1);
}

function mapMembroToRankingRow(
	membro: MembroRankingRaw,
	index: number,
	currentMembroDocumentId: string | null,
	accademiaSlug: string,
	returnToOverride?: string | null,
): AcademyRankingRow {
	const name = membro.nickname?.trim() || 'Membro';
	const points = Number.parseInt(String(membro.punti ?? '0'), 10) || 0;
	const current = membro.documentId === currentMembroDocumentId;
	const academyReturnTo = `/sala-accademia-${accademiaSlug}/`;
	const rowReturnTo = returnToOverride ?? academyReturnTo;
	const currentHref = withReturnTo('/scrivania/trofei/', rowReturnTo);
	const profileHref = withReturnTo(
		`/scrivania/utenti-preferiti/esploso-profilo-utente/?membro=${encodeURIComponent(membro.documentId)}`,
		rowReturnTo,
	);

	return {
		documentId: membro.documentId,
		position: getPositionLabel(index),
		medal: getMedalByIndex(index),
		initials: name.slice(0, 1).toLocaleUpperCase('it-IT'),
		avatarSrc: resolveAvatarSrc(membro.datiAggiuntivi?.avatar),
		name,
		points,
		current,
		href: current ? currentHref : profileHref,
	};
}

export async function getAcademyRanking(accademiaSlug: string, jwt?: string, limit = 5, returnToOverride?: string | null): Promise<AcademyRankingRow[]> {
	const slug = accademiaSlug.trim();
	if (!slug) return [];

	const searchParams = new URLSearchParams();
	searchParams.set('filters[accademia][slug][$eq]', slug);
	searchParams.set('fields[0]', 'documentId');
	searchParams.set('fields[1]', 'nickname');
	searchParams.set('fields[2]', 'punti');
	searchParams.set('fields[3]', 'datiAggiuntivi');
	searchParams.set('sort[0]', 'punti:desc');
	searchParams.set('sort[1]', 'nickname:asc');
	searchParams.set('pagination[pageSize]', String(Math.max(limit, 100)));
	searchParams.set('status', 'draft');

	try {
		const [currentMembroDocumentId, rankingResponse] = await Promise.all([
			getCurrentMembroDocumentId(jwt),
			fetch(`${STRAPI_API_BASE_URL}/membri?${searchParams}`, { headers }),
		]);

		if (!rankingResponse.ok) return [];

		const payload = (await rankingResponse.json()) as StrapiMembersResponse;
		return (payload.data ?? [])
			.toSorted((a, b) => {
				const pointsA = Number.parseInt(String(a.punti ?? '0'), 10) || 0;
				const pointsB = Number.parseInt(String(b.punti ?? '0'), 10) || 0;
				if (pointsA !== pointsB) return pointsB - pointsA;

				const nameA = a.nickname?.trim() || 'Membro';
				const nameB = b.nickname?.trim() || 'Membro';
				return nameA.localeCompare(nameB, 'it-IT');
			})
			.slice(0, limit)
			.map((membro, index) => mapMembroToRankingRow(membro, index, currentMembroDocumentId, slug, returnToOverride));
	} catch {
		return [];
	}
}
