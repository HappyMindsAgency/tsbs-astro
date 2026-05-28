// Risolve il tema CSS dell'accademia per l'utente autenticato.
// Da usare nel frontmatter delle pagine SSR che non hanno un tema fisso.

import { getStrapiApiUrl } from './strapi/api-url';

const STRAPI_API_BASE_URL = getStrapiApiUrl();
const STRAPI_API = import.meta.env.AUTH_READONLY;

const SLUG_TO_THEME: Record<string, string> = {
	arborea: 'theme-arborea',
	arcadia: 'theme-arcadia',
	armonia: 'theme-armonia',
	astraria: 'theme-astraria',
};

export type AcademySlug = 'arborea' | 'arcadia' | 'armonia' | 'astraria';

export async function resolveUserAcademy(jwt: string | undefined): Promise<AcademySlug> {
	if (!jwt) return 'arborea';

	try {
		const userRes = await fetch(`${STRAPI_API_BASE_URL}/users/me`, {
			headers: { Authorization: `Bearer ${jwt}`, 'Content-Type': 'application/json' },
		});
		if (!userRes.ok) return 'arborea';
		const user = await userRes.json();

		const qs = new URLSearchParams({
			'filters[email][$eq]': String(user.email),
			'populate[0]': 'accademia',
			'fields[0]': 'id',
			'status': 'draft',
		});
		const membroRes = await fetch(`${STRAPI_API_BASE_URL}/membri?${qs}`, {
			headers: { Authorization: `Bearer ${STRAPI_API}`, 'Content-Type': 'application/json' },
		});
		if (!membroRes.ok) return 'arborea';

		const membroData = await membroRes.json();
		const slug: string | undefined = membroData?.data?.[0]?.accademia?.slug;
		return (slug as AcademySlug) ?? 'arborea';
	} catch {
		return 'arborea';
	}
}

export async function resolveUserTheme(jwt: string | undefined): Promise<string> {
	const slug = await resolveUserAcademy(jwt);
	return SLUG_TO_THEME[slug] ?? 'theme-arborea';
}

export async function resolveUserContext(jwt: string | undefined): Promise<{ theme: string; accademia: AcademySlug }> {
	const accademia = await resolveUserAcademy(jwt);
	return { accademia, theme: SLUG_TO_THEME[accademia] ?? 'theme-arborea' };
}
