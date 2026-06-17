import { getStrapiApiUrl } from './api-url';

const STRAPI_API_BASE_URL = getStrapiApiUrl();
const STRAPI_API = import.meta.env.AUTH_READONLY;

export const VALID_ACADEMY_SLUGS = ['arborea', 'arcadia', 'armonia', 'astraria'] as const;

export type AcademySlug = (typeof VALID_ACADEMY_SLUGS)[number];

export function isAcademySlug(value: unknown): value is AcademySlug {
	return typeof value === 'string' && VALID_ACADEMY_SLUGS.includes(value as AcademySlug);
}

export async function getAuthenticatedUserAcademy(jwt: string | undefined): Promise<AcademySlug | null> {
	if (!jwt) return null;

	try {
		const userRes = await fetch(`${STRAPI_API_BASE_URL}/users/me`, {
			headers: { Authorization: `Bearer ${jwt}`, 'Content-Type': 'application/json' },
		});
		if (!userRes.ok) return null;

		const user = await userRes.json();
		const qs = new URLSearchParams({
			'filters[user][id][$eq]': String(user.id),
			'populate[accademia][fields][0]': 'slug',
			'fields[0]': 'id',
		});

		const membroRes = await fetch(`${STRAPI_API_BASE_URL}/membri?${qs}`, {
			headers: { Authorization: `Bearer ${STRAPI_API}`, 'Content-Type': 'application/json' },
		});
		if (!membroRes.ok) return null;

		const membroData = await membroRes.json();
		const slug = membroData?.data?.[0]?.accademia?.slug;

		return isAcademySlug(slug) ? slug : null;
	} catch {
		return null;
	}
}
